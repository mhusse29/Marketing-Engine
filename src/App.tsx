import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { LayoutShell } from './components/LayoutShell';
import { SettingsPanel } from './components/SettingsDrawer/SettingsPanel';
import { AiBox } from './components/AskAI/AiBox';
import { Stepper } from './components/AskAI/Stepper';
import ContentCard from './components/Cards/ContentCard';
import { PicturesCard } from './components/Cards/PicturesCard';
import { VideoCard } from './components/Cards/VideoCard';
import { SkeletonCard } from './components/AskAI/SkeletonCard';
import AppTopBar from './components/AppTopBar';
import { TopBarPanels } from './components/TopBarPanels';
import { useTopBarPanels } from './components/useTopBarPanels';
import { MenuContent, MenuPictures, MenuVideo } from './components/AppMenuBar';

import {
  loadSettings,
  validateSettings,
  saveSettings,
} from './store/settings';
import {
  defaultAiState,
  generatePictures,
  generateVideo,
} from './store/ai';
import { useCardsStore } from './store/useCardsStore';
import type {
  SettingsState,
  AiUIState,
  CardKey,
  AiAttachment,
  Platform,
  ContentVariantResult,
  ContentGenerationMeta,
} from './types';
import type { GridStepState } from './state/ui';
import { useContentAI } from './useContentAI';

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

const mapContentStatusToGrid = (status: string): GridStepState => {
  switch (status) {
    case 'thinking':
      return 'thinking';
    case 'rendering':
      return 'rendering';
    case 'ready':
      return 'ready';
    case 'error':
      return 'error';
    case 'queued':
    case 'idle':
    default:
      return 'queued';
  }
};

const PLATFORM_GATEWAY_LABELS: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  x: 'X',
  youtube: 'YouTube',
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

  const {
    status: contentStatus,
    result: contentResult,
    error: contentError,
    run: runContent,
    regenerate: regenerateContent,
    runId: contentRunId,
  } = useContentAI();
  const [contentVariants, setContentVariants] = useState<ContentVariantResult[]>([]);
  const [contentMeta, setContentMeta] = useState<ContentGenerationMeta | null>(null);
  const contentStatusRef = useRef(contentStatus);
  const contentErrorRef = useRef<string | undefined>(undefined);

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
    contentStatusRef.current = contentStatus;
  }, [contentStatus]);

  useEffect(() => {
    contentErrorRef.current = contentError;
  }, [contentError]);

  useEffect(() => {
    if (contentStatus === 'ready' && contentResult) {
      if (import.meta.env?.DEV) {
        console.log('[App] applying contentResult', contentResult)
      }
      setContentVariants(contentResult.variants ?? []);
      setContentMeta(contentResult.meta ?? null);
    } else if (contentStatus === 'queued') {
      setContentVariants([]);
      setContentMeta(null);
    } else if (contentStatus === 'error') {
      setContentMeta(null);
    }
  }, [contentStatus, contentResult]);

  useEffect(() => {
    if (!settings.cards.content) return;
    const mapped = mapContentStatusToGrid(contentStatus);
    setAiState((prev) => {
      if (prev.stepStatus.content === mapped) {
        return prev;
      }
      return {
        ...prev,
        stepStatus: { ...prev.stepStatus, content: mapped },
      };
    });
  }, [contentStatus, settings.cards.content]);

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
      content: clampVersionIndex(prev.content, contentVariants.length),
      pictures: clampVersionIndex(prev.pictures, aiState.outputs.pictures?.versions.length ?? 0),
      video: clampVersionIndex(prev.video, aiState.outputs.video?.versions.length ?? 0),
    }));
  }, [
    contentVariants.length,
    aiState.outputs.pictures?.versions.length,
    aiState.outputs.video?.versions.length,
  ]);

  const makeAbortError = () => {
    const error = new Error('Generation aborted');
    error.name = 'AbortError';
    return error;
  };

  const waitWithAbort = (signal: AbortSignal, ms: number) =>
    new Promise<void>((resolve, reject) => {
      if (signal.aborted) {
        reject(makeAbortError());
        return;
      }

      const onAbort = () => {
        window.clearTimeout(timeoutId);
        signal.removeEventListener('abort', onAbort);
        reject(makeAbortError());
      };

      const timeoutId = window.setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);

      signal.addEventListener('abort', onAbort);
    });

  const parseCsv = (value?: string | string[]) => {
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === 'string' && item.trim().length > 0);
    }
    if (!value) return [];
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const contentOptions = useMemo(() => {
    const contentProps = settings.quickProps.content;
    const persona = contentProps.persona ?? 'Generic';
    const tones = contentProps.tone ? [contentProps.tone] : ['Professional'];
    const ctas = contentProps.cta ? [contentProps.cta] : ['Learn more'];
    const language = contentProps.language ?? 'EN';
    const ALLOWED_LABELS = ['Facebook', 'Instagram', 'TikTok', 'LinkedIn', 'X', 'YouTube'] as const;
    const allowedSet = new Set<string>(ALLOWED_LABELS);
    const platforms = settings.platforms.length
      ? settings.platforms
          .map((platform) => PLATFORM_GATEWAY_LABELS[platform])
          .filter((label): label is (typeof ALLOWED_LABELS)[number] => Boolean(label) && allowedSet.has(label))
      : ['LinkedIn', 'Facebook', 'X'];
    const keywords = parseCsv(contentProps.keywords);
    const avoid = parseCsv(contentProps.avoid);
    const hashtags = parseCsv(contentProps.hashtags).map((tag) =>
      tag.replace(/^#/, '').trim()
    );
    const copyLength = contentProps.copyLength ?? 'Standard';

    return {
      persona,
      tones,
      ctas,
      language,
      platforms,
      keywords,
      avoid,
      hashtags,
      copyLength,
    };
  }, [settings]);

  const waitForContentCompletion = (signal: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        window.clearInterval(intervalId);
        signal.removeEventListener('abort', onAbort);
      };

      const onAbort = () => {
        cleanup();
        reject(makeAbortError());
      };

      const check = () => {
        const current = contentStatusRef.current;
        if (current === 'ready') {
          cleanup();
          resolve();
        } else if (current === 'error') {
          cleanup();
          reject(new Error(contentErrorRef.current ?? 'provider_error'));
        }
      };

      const intervalId = window.setInterval(check, 200);
      signal.addEventListener('abort', onAbort);
      check();
    });

  const handleGenerate = async (brief: string, attachments: AiAttachment[]) => {
    const steps = cardsOrder.filter((card) => cardsEnabled[card]);

    generationAbortRef.current?.abort();
    const controller = new AbortController();
    generationAbortRef.current = controller;

    const attachmentSnapshot = attachments.map((item) => ({ ...item }));
    const imageUploads = attachmentSnapshot
      .filter((item) => item.kind === 'image')
      .map((item) => item.url);

    if (settings.cards.content) {
      setContentVariants([]);
      setContentMeta(null);
    }

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

    if (settings.cards.content) {
      const options = {
        ...contentOptions,
        copyLength: contentOptions.copyLength ?? 'Standard',
      };
      runContent(brief, options, settings.versions ?? 2);
    }

    const tasks: Promise<void>[] = [];

    if (settings.cards.content) {
      tasks.push(
        (async () => {
          try {
            await waitForContentCompletion(controller.signal);
          } catch (error) {
            console.error('Content generation task failed:', error);
            console.error('Content error details:', {
              message: (error as Error).message,
              stack: (error as Error).stack,
              name: (error as Error).name
            });
            throw error; // Re-throw to be caught by Promise.all
          }
        })()
      );
    }

    if (settings.cards.pictures) {
      tasks.push(
        (async () => {
          try {
            setAiState((prev) => ({
              ...prev,
              stepStatus: { ...prev.stepStatus, pictures: 'thinking' },
            }));

            await waitWithAbort(controller.signal, 700);

            setAiState((prev) => ({
              ...prev,
              stepStatus: { ...prev.stepStatus, pictures: 'rendering' },
            }));

            await waitWithAbort(controller.signal, 900);

            const versions = generatePictures(
              settings.versions,
              imageUploads.length > 0,
              imageUploads,
              settings.quickProps.pictures
            );

            setAiState((prev) => ({
              ...prev,
              outputs: { ...prev.outputs, pictures: { versions } },
              stepStatus: { ...prev.stepStatus, pictures: 'ready' },
            }));
          } catch (error) {
            if ((error as Error).name === 'AbortError') {
              return;
            }
            console.error('Picture generation failed', error);
            setAiState((prev) => ({
              ...prev,
              stepStatus: { ...prev.stepStatus, pictures: 'error' },
            }));
          }
        })()
      );
    }

    if (settings.cards.video) {
      tasks.push(
        (async () => {
          try {
            setAiState((prev) => ({
              ...prev,
              stepStatus: { ...prev.stepStatus, video: 'thinking' },
            }));

            await waitWithAbort(controller.signal, 700);

            setAiState((prev) => ({
              ...prev,
              stepStatus: { ...prev.stepStatus, video: 'rendering' },
            }));

            await waitWithAbort(controller.signal, 900);

            const versions = generateVideo(settings.versions, settings.quickProps.video);

            setAiState((prev) => ({
              ...prev,
              outputs: { ...prev.outputs, video: { versions } },
              stepStatus: { ...prev.stepStatus, video: 'ready' },
            }));
          } catch (error) {
            if ((error as Error).name === 'AbortError') {
              return;
            }
            console.error('Video generation failed', error);
            setAiState((prev) => ({
              ...prev,
              stepStatus: { ...prev.stepStatus, video: 'error' },
            }));
          }
        })()
      );
    }

    try {
      await Promise.all(tasks);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Generation run failed', error);
        console.error('Error details:', {
          message: (error as Error).message,
          stack: (error as Error).stack,
          name: (error as Error).name
        });
        
        // Set error status for all active steps
        setAiState((prev) => ({
          ...prev,
          stepStatus: Object.keys(prev.stepStatus).reduce(
            (acc, step) => ({ ...acc, [step]: 'error' as GridStepState }),
            {} as Partial<AiUIState['stepStatus']>
          ),
        }));
      }
    } finally {
      const aborted = controller.signal.aborted;

      if (aborted) {
        setAiState((prev) => ({
          ...prev,
          generating: false,
          steps: [],
          stepStatus: {},
        }));
      } else {
        setAiState((prev) => ({
          ...prev,
          generating: false,
        }));
        setCurrentVersions({ content: 0, pictures: 0, video: 0 });
      }

      if (generationAbortRef.current === controller) {
        generationAbortRef.current = null;
      }
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
    setContentVariants([]);
    setContentMeta(null);
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
    if (type === 'content') {
      const briefText = aiState.brief.trim();
      if (!briefText) {
        console.warn('Cannot regenerate content without a brief.');
        setAiState((prev) => ({
          ...prev,
          stepStatus: { ...prev.stepStatus, content: 'error' },
        }));
        return;
      }
      if (settings.cards.content) {
        setContentVariants([]);
        setContentMeta(null);
        const options = {
          ...contentOptions,
          copyLength: contentOptions.copyLength ?? 'Standard',
        };
        regenerateContent(briefText, options, settings.versions ?? 2, 'try a new hook and angle');
      }
      return;
    }

    setAiState((prev) => ({
      ...prev,
      stepStatus: { ...prev.stepStatus, [type]: 'rendering' },
    }));

    await new Promise((resolve) => window.setTimeout(resolve, 1200));

    setAiState((prev) => {
      const outputs = { ...prev.outputs };

      if (type === 'pictures' && outputs.pictures) {
        const imageUploads = prev.uploads
          .filter((item) => item.kind === 'image')
          .map((item) => item.url);
        const refreshed = generatePictures(
          1,
          imageUploads.length > 0,
          imageUploads,
          settings.quickProps.pictures
        )[0];
        const index = clampVersionIndex(
          currentVersions.pictures,
          outputs.pictures.versions.length || 1
        );
        const versions = [...outputs.pictures.versions];
        versions[index] = refreshed;
        outputs.pictures = { versions };
      } else if (type === 'video' && outputs.video) {
        const refreshed = generateVideo(1, settings.quickProps.video)[0];
        const index = clampVersionIndex(
          currentVersions.video,
          outputs.video.versions.length || 1
        );
        const versions = [...outputs.video.versions];
        versions[index] = refreshed;
        outputs.video = { versions };
      }

      return {
        ...prev,
        outputs,
        stepStatus: { ...prev.stepStatus, [type]: 'ready' },
      };
    });
  };

  const getCardStatus = (card: CardKey): GridStepState => {
    if (card === 'content') {
      return mapContentStatusToGrid(contentStatus);
    }

    const status = aiState.stepStatus[card];
    if (status) {
      return status;
    }

    switch (card) {
      case 'pictures':
        return aiState.outputs.pictures ? 'ready' : 'queued';
      case 'video':
        return aiState.outputs.video ? 'ready' : 'queued';
      default:
        return 'queued';
    }
  };

  const picturesVersions = aiState.outputs.pictures?.versions ?? [];
  const videoVersions = aiState.outputs.video?.versions ?? [];

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
    const shouldShowContentCard =
      cardsEnabled.content && (contentVariants.length > 0 || contentStatus !== 'idle');

    if (shouldShowContentCard) {
      cardItems.push({
        id: 'content-card',
        element: (
          <ContentCard
            status={contentStatus}
            variants={contentVariants}
            meta={contentMeta}
            error={contentError}
            briefText={aiState.brief}
            options={contentOptions}
            platformIds={settings.platforms}
            versions={settings.versions}
            runId={contentRunId}
            onRegenerate={regenerateContent}
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
      copyLength={settings.quickProps.content.copyLength}
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
                contentStatus={contentStatus}
                contentError={contentError}
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
