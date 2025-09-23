import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { LayoutShell } from './components/LayoutShell';
import { SettingsPanel } from './components/SettingsDrawer/SettingsPanel';
import { AiBox } from './components/AskAI/AiBox';
import { Stepper } from './components/AskAI/Stepper';
import { ContentCard } from './components/Cards/ContentCard';
import { PicturesCard } from './components/Cards/PicturesCard';
import { VideoCard } from './components/Cards/VideoCard';
import { SkeletonCard } from './components/AskAI/SkeletonCard';
import AppTopBar from './components/AppTopBar';
import { TopBarPanels, useTopBarPanels } from './components/TopBarPanels';
import { MenuContent, MenuPictures, MenuVideo } from './components/AppMenuBar';

import {
  loadSettings,
  validateSettings,
  saveSettings,
} from './store/settings';
import {
  defaultAiState,
  generateContent,
  generatePictures,
  generateVideo,
  simulateGeneration,
} from './store/ai';
import { useCardsStore } from './store/useCardsStore';
import type { SettingsState, AiUIState, CardKey, AiAttachment } from './types';
import type { GridStepState } from './state/ui';

const clampVersionIndex = (index: number, total: number) => {
  if (total <= 0) {
    return 0;
  }
  return Math.min(index, total - 1);
};

const setAiLiveState = (enabled: boolean) => {
  if (typeof document === 'undefined') return;
  const body = document.body;
  if (enabled) {
    if (!body.classList.contains('ai-live')) {
      body.classList.add('ai-live', 'ai-just-enabled');
      window.setTimeout(() => body.classList.remove('ai-just-enabled'), 950);
    }
  } else {
    body.classList.remove('ai-live', 'ai-just-enabled', 'ai-generating');
  }
};

const setAiGeneratingState = (generating: boolean) => {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('ai-generating', generating);
};

function App() {
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings());
  const [aiState, setAiState] = useState<AiUIState>(defaultAiState);
  const [currentVersions, setCurrentVersions] = useState({ content: 0, pictures: 0, video: 0 });
  const [aiReadyHint, setAiReadyHint] = useState(false);
  const wasValidRef = useRef(false);
  const hintTimeoutRef = useRef<number | null>(null);
  const generationAbortRef = useRef<AbortController | null>(null);
  const isValid = validateSettings(settings);

  const cardsEnabled = useCardsStore((state) => state.enabled);
  const cardsHidden = useCardsStore((state) => state.hidden);
  const cardsOrder = useCardsStore((state) => state.order);
  const selectedCard = useCardsStore((state) => state.selected);
  const setCardEnabled = useCardsStore((state) => state.setEnabled);
  const selectCard = useCardsStore((state) => state.select);
  const toggleHiddenCard = useCardsStore((state) => state.toggleHidden);
  const { open: panelOpen, toggle: togglePanel, close: closePanel } = useTopBarPanels();

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    (['content', 'pictures', 'video'] as CardKey[]).forEach((card) => {
      setCardEnabled(card, settings.cards[card]);
    });
  }, [settings.cards, setCardEnabled]);

  useEffect(() => {
    if (panelOpen && !cardsEnabled[panelOpen]) {
      closePanel();
    }
  }, [panelOpen, cardsEnabled, closePanel]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) {
        return;
      }

      const active = cardsOrder.filter((card) => cardsEnabled[card]);
      if (active.length === 0) {
        return;
      }

      if (event.key === '1' || event.key === '2' || event.key === '3') {
        const index = Number.parseInt(event.key, 10) - 1;
        const nextCard = active[index];
        if (nextCard) {
          event.preventDefault();
          selectCard(nextCard);
        }
      } else if (event.key.toLowerCase() === 'h' && selectedCard) {
        event.preventDefault();
        toggleHiddenCard(selectedCard);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cardsOrder, cardsEnabled, selectedCard, selectCard, toggleHiddenCard]);

  useEffect(() => {
    setAiState((prev) => ({ ...prev, locked: !isValid }));
  }, [isValid]);

  useEffect(() => {
    if (isValid && !wasValidRef.current) {
      wasValidRef.current = true;
      setAiReadyHint(true);
      const timeout = window.setTimeout(() => {
        setAiReadyHint(false);
        hintTimeoutRef.current = null;
      }, 3200);
      hintTimeoutRef.current = timeout;
      document.getElementById('ai-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (!isValid) {
      wasValidRef.current = false;
    }

    return () => {
      if (hintTimeoutRef.current !== null) {
        window.clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = null;
      }
    };
  }, [isValid]);

  useEffect(() => {
    setAiLiveState(isValid);
    return () => {
      setAiLiveState(false);
    };
  }, [isValid]);

  useEffect(() => {
    setAiGeneratingState(aiState.generating);
    return () => {
      if (aiState.generating) {
        setAiGeneratingState(false);
      }
    };
  }, [aiState.generating]);

  useEffect(() => {
    setCurrentVersions((prev) => ({
      content: clampVersionIndex(prev.content, aiState.outputs.content?.versions.length ?? 0),
      pictures: clampVersionIndex(prev.pictures, aiState.outputs.pictures?.versions.length ?? 0),
      video: clampVersionIndex(prev.video, aiState.outputs.video?.versions.length ?? 0),
    }));
  }, [
    aiState.outputs.content?.versions.length,
    aiState.outputs.pictures?.versions.length,
    aiState.outputs.video?.versions.length,
  ]);

  const handleGenerate = async (brief: string, attachments: AiAttachment[]) => {
    const steps = cardsOrder.filter((card) => cardsEnabled[card]);

    generationAbortRef.current?.abort();
    const controller = new AbortController();
    generationAbortRef.current = controller;

    const attachmentSnapshot = attachments.map((item) => ({ ...item }));
    const imageUploads = attachmentSnapshot
      .filter((item) => item.kind === 'image')
      .map((item) => item.url);

    setAiState((prev) => ({
      ...prev,
      brief,
      uploads: attachmentSnapshot,
      generating: true,
      steps,
      stepStatus: steps.reduce(
        (acc, step) => ({ ...acc, [step]: 'queued' as GridStepState }),
        {} as Partial<AiUIState['stepStatus']>
      ),
      outputs: {},
    }));

    try {
      await simulateGeneration(
        steps,
        (step, status) => {
          setAiState((prev) => ({
            ...prev,
            stepStatus: { ...prev.stepStatus, [step]: status },
          }));
        },
        controller.signal
      );
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setAiState((prev) => ({
          ...prev,
          generating: false,
          steps: [],
          stepStatus: {},
        }));
      } else {
        console.error(error);
        const errorStatuses = steps.reduce(
          (acc, step) => ({
            ...acc,
            [step]: 'error' as GridStepState,
          }),
          {} as Partial<AiUIState['stepStatus']>
        );

        setAiState((prev) => ({
          ...prev,
          generating: false,
          stepStatus: { ...prev.stepStatus, ...errorStatuses },
        }));
      }

      if (generationAbortRef.current === controller) {
        generationAbortRef.current = null;
      }
      return;
    }

    const outputs: AiUIState['outputs'] = {};

    if (settings.cards.content) {
      outputs.content = {
        versions: Array.from({ length: settings.versions }, () =>
          generateContent(settings.platforms, 1, settings.quickProps.content)[0]
        ),
      };
    }

    if (settings.cards.pictures) {
      outputs.pictures = {
        versions: generatePictures(
          settings.versions,
          imageUploads.length > 0,
          imageUploads,
          settings.quickProps.pictures
        ),
      };
    }

    if (settings.cards.video) {
      outputs.video = {
        versions: generateVideo(settings.versions, settings.quickProps.video),
      };
    }

    setAiState((prev) => ({
      ...prev,
      generating: false,
      outputs,
    }));

    setCurrentVersions({ content: 0, pictures: 0, video: 0 });

    if (generationAbortRef.current === controller) {
      generationAbortRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    if (!aiState.generating) return;
    generationAbortRef.current?.abort();
  };

  const handleClear = () => {
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    setAiState((prev) => ({
      ...prev,
      brief: '',
      uploads: [],
      outputs: {},
      steps: [],
      stepStatus: {},
    }));
  };

  const handleNewCampaign = () => {
    closePanel();
    handleClear();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveCampaign = () => {
    closePanel();
    saveSettings(settings);
    console.info('Campaign saved');
  };

  const handleOpenSettingsPanel = () => {
    closePanel();
    if (typeof document === 'undefined') return;
    document.getElementById('settings-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleHelp = () => {
    closePanel();
    console.info('Open help');
  };

  const handleSignOut = () => {
    closePanel();
    console.info('Sign out');
  };

  const handleCardSave = (type: string) => {
    console.log(`Saving ${type} card`);
  };

  const handleCardRegenerate = async (type: CardKey) => {
    setAiState((prev) => ({
      ...prev,
      stepStatus: { ...prev.stepStatus, [type]: 'rendering' },
    }));

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const newOutputs = { ...aiState.outputs };
    const currentVersion = currentVersions[type];

    if (type === 'content' && newOutputs.content) {
      newOutputs.content.versions[currentVersion] = generateContent(
        settings.platforms,
        1,
        settings.quickProps.content
      )[0];
    } else if (type === 'pictures' && newOutputs.pictures) {
      const imageUploads = aiState.uploads
        .filter((item) => item.kind === 'image')
        .map((item) => item.url);
      newOutputs.pictures.versions[currentVersion] = generatePictures(
        1,
        imageUploads.length > 0,
        imageUploads,
        settings.quickProps.pictures
      )[0];
    } else if (type === 'video' && newOutputs.video) {
      newOutputs.video.versions[currentVersion] = generateVideo(
        1,
        settings.quickProps.video
      )[0];
    }

    setAiState((prev) => ({
      ...prev,
      outputs: newOutputs,
      stepStatus: { ...prev.stepStatus, [type]: 'ready' },
    }));
  };

  const getCardStatus = (card: CardKey): GridStepState => {
    const status = aiState.stepStatus[card];
    if (status) {
      return status;
    }

    switch (card) {
      case 'content':
        return aiState.outputs.content ? 'ready' : 'queued';
      case 'pictures':
        return aiState.outputs.pictures ? 'ready' : 'queued';
      case 'video':
        return aiState.outputs.video ? 'ready' : 'queued';
      default:
        return 'queued';
    }
  };

  const contentVersions = aiState.outputs.content?.versions ?? [];
  const picturesVersions = aiState.outputs.pictures?.versions ?? [];
  const videoVersions = aiState.outputs.video?.versions ?? [];

  const contentIndex = clampVersionIndex(currentVersions.content, contentVersions.length);
  const picturesIndex = clampVersionIndex(currentVersions.pictures, picturesVersions.length);
  const videoIndex = clampVersionIndex(currentVersions.video, videoVersions.length);

  const cardItems: Array<{ id: string; element: ReactNode }> = [];
  const activeCards = cardsOrder.filter((card) => cardsEnabled[card]);
  const activeTab = (selectedCard ?? activeCards[0] ?? 'content') as CardKey;

  if (aiState.generating) {
    activeCards.forEach((card) => {
      const title = card === 'content' ? 'Content' : card === 'pictures' ? 'Pictures' : 'Video';
      cardItems.push({ id: `${card}-skeleton`, element: <SkeletonCard title={title} /> });
    });
  } else {
    if (cardsEnabled.content && contentVersions.length > 0) {
      cardItems.push({
        id: 'content-card',
        element: (
          <ContentCard
            content={contentVersions}
            currentVersion={contentIndex}
            onSave={() => handleCardSave('content')}
            onRegenerate={() => handleCardRegenerate('content')}
            status={getCardStatus('content')}
          />
        ),
      });
    }

    if (cardsEnabled.pictures && picturesVersions.length > 0) {
      cardItems.push({
        id: 'pictures-card',
        element: (
          <PicturesCard
            pictures={picturesVersions}
            currentVersion={picturesIndex}
            brandLocked={settings.quickProps.pictures.lockBrandColors ?? true}
            onSave={() => handleCardSave('pictures')}
            onRegenerate={() => handleCardRegenerate('pictures')}
            status={getCardStatus('pictures')}
          />
        ),
      });
    }

    if (cardsEnabled.video && videoVersions.length > 0) {
      cardItems.push({
        id: 'video-card',
        element: (
          <VideoCard
            videos={videoVersions}
            currentVersion={videoIndex}
            onSave={() => handleCardSave('video')}
            onRegenerate={() => handleCardRegenerate('video')}
            status={getCardStatus('video')}
          />
        ),
      });
    }
  }

  const topBar = (
    <AppTopBar
      active={activeTab}
      enabled={cardsEnabled}
      onChange={(tab) => {
        selectCard(tab);
        togglePanel(tab);
      }}
      onNewCampaign={handleNewCampaign}
      onSave={handleSaveCampaign}
      onOpenSettings={handleOpenSettingsPanel}
      onHelp={handleHelp}
      onSignOut={handleSignOut}
    />
  );

  const mainContent = (
    <>
      <TopBarPanels
        open={panelOpen}
        close={closePanel}
        renderContent={<MenuContent settings={settings} onSettingsChange={setSettings} />}
        renderPictures={<MenuPictures settings={settings} onSettingsChange={setSettings} />}
        renderVideo={<MenuVideo settings={settings} onSettingsChange={setSettings} />}
      />

      <div className="main-stage">
        <div className="mx-auto max-w-[1400px] grid gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex flex-col items-center gap-4">
            <AnimatePresence>
              {aiReadyHint && (
                <motion.div
                  key="ai-ready"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-[720px] rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 shadow-[0_8px_24px_rgba(16,185,129,0.25)]"
                >
                  Ask AI is ready
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full max-w-[720px]">
              <AiBox
                aiState={aiState}
                settings={settings}
                onGenerate={handleGenerate}
                onClear={handleClear}
                onCancel={handleCancelGeneration}
                highlight={aiReadyHint}
              />
            </div>
          </div>

          <div className="w-full lg:justify-self-end">
            <div id="settings-panel" className="w-full lg:w-[420px] xl:w-[440px]">
              <SettingsPanel settings={settings} onSettingsChange={setSettings} />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {aiState.generating && (
          <motion.div
            key="stepper"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="outputs-stage mx-auto max-w-[1400px] px-6"
          >
            <Stepper steps={aiState.steps} stepStatus={aiState.stepStatus} hiddenSteps={cardsHidden} />
          </motion.div>
        )}
      </AnimatePresence>

      {cardItems.length > 0 && (
        <section
          className="outputs-stage masonry mx-auto max-w-[1400px] px-6 pb-24"
          aria-label="Generated outputs"
        >
          {cardItems.map((item) => (
            <div key={item.id} className="masonry-item">
              {item.element}
            </div>
          ))}
        </section>
      )}
    </>
  );

  return <LayoutShell menu={topBar} main={mainContent} />;
}

export default App;
