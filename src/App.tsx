import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';

import { LayoutShell } from './components/LayoutShell';
import { SettingsPanel } from './components/SettingsDrawer/SettingsPanel';
import { AiBox } from './components/AskAI/AiBox';
import { Stepper } from './components/AskAI/Stepper';
import { SkeletonCard } from './components/AskAI/SkeletonCard';
import { ContentCard } from './components/Cards/ContentCard';
import { PicturesCard } from './components/Cards/PicturesCard';
import { VideoCard } from './components/Cards/VideoCard';

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
import type { SettingsState, AiUIState } from './types';

function App() {
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings());
  const [aiState, setAiState] = useState<AiUIState>(defaultAiState);
  const [currentVersions, setCurrentVersions] = useState({ content: 0, pictures: 0, video: 0 });
  const [aiReadyHint, setAiReadyHint] = useState(false);
  const wasValidRef = useRef(false);
  const hintTimeoutRef = useRef<number | null>(null);
  const isValid = validateSettings(settings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Update AI locked state based on settings validity
  useEffect(() => {
    setAiState(prev => ({ ...prev, locked: !isValid }));
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
    // Determine which cards to generate
    const steps: ('content' | 'pictures' | 'video')[] = [];
    if (settings.cards.content) steps.push('content');
    if (settings.cards.pictures) steps.push('pictures');
    if (settings.cards.video) steps.push('video');

    // Update AI state
    setAiState(prev => ({
      ...prev,
      brief,
      uploads,
      generating: true,
      steps,
      stepStatus: steps.reduce((acc, step) => ({ ...acc, [step]: 'queued' }), {}),
      outputs: {},
    }));

    // Simulate generation with progress updates
    await simulateGeneration(steps, (step, status) => {
      setAiState(prev => ({
        ...prev,
        stepStatus: { ...prev.stepStatus, [step]: status },
      }));
    });

    // Generate outputs
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

    // Update state with outputs
    setAiState(prev => ({
      ...prev,
      generating: false,
      outputs,
    }));

    // Reset current versions
    setCurrentVersions({ content: 0, pictures: 0, video: 0 });
  };

  const handleClear = () => {
    setAiState(prev => ({
      ...prev,
      brief: '',
      uploads: [],
      outputs: {},
      steps: [],
      stepStatus: {},
    }));
  };

  const handleCardSave = (type: string) => {
    // In a real app, this would save to backend
    console.log(`Saving ${type} card`);
  };

  const handleCardRegenerate = async (type: 'content' | 'pictures' | 'video') => {
    // Mark as regenerating
    setAiState(prev => ({
      ...prev,
      stepStatus: { ...prev.stepStatus, [type]: 'rendering' },
    }));

    // Simulate regeneration delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Generate new output for current version
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

    setAiState(prev => ({
      ...prev,
      outputs: newOutputs,
      stepStatus: { ...prev.stepStatus, [type]: 'ready' },
    }));
  };

  const mainContent = (
    <div className="space-y-6 lg:space-y-8">
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
            <Stepper steps={aiState.steps} stepStatus={aiState.stepStatus} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {aiState.generating && (
            <>
              {settings.cards.content && <SkeletonCard key="s-content" type="content" />}
              {settings.cards.pictures && <SkeletonCard key="s-pictures" type="pictures" />}
              {settings.cards.video && <SkeletonCard key="s-video" type="video" />}
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
    </div>
  );

  const sidebarContent = (
    <SettingsPanel
      settings={settings}
      onSettingsChange={setSettings}
    />
  );

  return (
    <Tooltip.Provider>
      <LayoutShell main={mainContent} sidebar={sidebarContent} />
    </Tooltip.Provider>
  );
}

export default App;
