import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { LayoutShell } from './components/LayoutShell';
import { SettingsPanel } from './components/SettingsDrawer/SettingsPanel';
import { AiBox } from './components/AskAI/AiBox';
import { Stepper } from './components/AskAI/Stepper';
import { SkeletonCard } from './components/AskAI/SkeletonCard';
import { ContentCard } from './components/Cards/ContentCard';
import { PicturesCard } from './components/Cards/PicturesCard';
import { VideoCard } from './components/Cards/VideoCard';
import { AppMenuBar } from './components/AppMenuBar';

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
import type { SettingsState, AiUIState, CardKey } from './types';

function App() {
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings());
  const [aiState, setAiState] = useState<AiUIState>(defaultAiState);
  const [currentVersions, setCurrentVersions] = useState({ content: 0, pictures: 0, video: 0 });
  const [aiReadyHint, setAiReadyHint] = useState(false);
  const wasValidRef = useRef(false);
  const hintTimeoutRef = useRef<number | null>(null);
  const isValid = validateSettings(settings);

  const cardsEnabled = useCardsStore((state) => state.enabled);
  const cardsHidden = useCardsStore((state) => state.hidden);
  const cardsOrder = useCardsStore((state) => state.order);
  const selectedCard = useCardsStore((state) => state.selected);
  const setCardEnabled = useCardsStore((state) => state.setEnabled);
  const selectCard = useCardsStore((state) => state.select);
  const toggleHiddenCard = useCardsStore((state) => state.toggleHidden);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    (['content', 'pictures', 'video'] as CardKey[]).forEach((card) => {
      setCardEnabled(card, settings.cards[card]);
    });
  }, [settings.cards.content, settings.cards.pictures, settings.cards.video, setCardEnabled]);

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

  const handleGenerate = async (brief: string, uploads: string[]) => {
    const steps = cardsOrder.filter((card) => cardsEnabled[card]);

    setAiState((prev) => ({
      ...prev,
      brief,
      uploads,
      generating: true,
      steps,
      stepStatus: steps.reduce((acc, step) => ({ ...acc, [step]: 'queued' }), {}),
      outputs: {},
    }));

    await simulateGeneration(steps, (step, status) => {
      setAiState((prev) => ({
        ...prev,
        stepStatus: { ...prev.stepStatus, [step]: status },
      }));
    });

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
          uploads.length > 0,
          uploads,
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
  };

  const handleClear = () => {
    setAiState((prev) => ({
      ...prev,
      brief: '',
      uploads: [],
      outputs: {},
      steps: [],
      stepStatus: {},
    }));
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
      newOutputs.pictures.versions[currentVersion] = generatePictures(
        1,
        aiState.uploads.length > 0,
        aiState.uploads,
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

  const menuBar = <AppMenuBar settings={settings} onSettingsChange={setSettings} />;

  const mainContent = (
    <>
      <AnimatePresence>
        {aiReadyHint && (
          <motion.div
            key="ai-ready"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 shadow-[0_8px_24px_rgba(16,185,129,0.25)]"
          >
            Ask AI is ready
          </motion.div>
        )}
      </AnimatePresence>

      <AiBox
        aiState={aiState}
        settings={settings}
        onGenerate={handleGenerate}
        onClear={handleClear}
        highlight={aiReadyHint}
      />

      <AnimatePresence>
        {aiState.generating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Stepper steps={aiState.steps} stepStatus={aiState.stepStatus} hiddenSteps={cardsHidden} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {aiState.generating && (
            <>
              {cardsEnabled.content && <SkeletonCard key="s-content" type="content" />}
              {cardsEnabled.pictures && <SkeletonCard key="s-pictures" type="pictures" />}
              {cardsEnabled.video && <SkeletonCard key="s-video" type="video" />}
            </>
          )}

          {!aiState.generating && aiState.outputs.content && (
            <ContentCard
              key="content"
              content={aiState.outputs.content.versions}
              currentVersion={currentVersions.content}
              onSave={() => handleCardSave('content')}
              onRegenerate={() => handleCardRegenerate('content')}
            />
          )}

          {!aiState.generating && aiState.outputs.pictures && (
            <PicturesCard
              key="pictures"
              pictures={aiState.outputs.pictures.versions}
              currentVersion={currentVersions.pictures}
              brandLocked={settings.quickProps.pictures.lockBrandColors ?? true}
              onSave={() => handleCardSave('pictures')}
              onRegenerate={() => handleCardRegenerate('pictures')}
            />
          )}

          {!aiState.generating && aiState.outputs.video && (
            <VideoCard
              key="video"
              videos={aiState.outputs.video.versions}
              currentVersion={currentVersions.video}
              onSave={() => handleCardSave('video')}
              onRegenerate={() => handleCardRegenerate('video')}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );

  const sidebarContent = (
    <SettingsPanel
      settings={settings}
      onSettingsChange={setSettings}
    />
  );

  return <LayoutShell menu={menuBar} main={mainContent} sidebar={sidebarContent} />;
}

export default App;
