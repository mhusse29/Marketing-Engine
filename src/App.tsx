import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DndContext, type DragEndEvent, type DragStartEvent, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useAuth } from './contexts/AuthContext';
import SettingsPage from './pages/SettingsPage';
import { logActivity } from './lib/activityLogger';

import { LayoutShell } from './components/LayoutShell';
import ContentCard from './components/Cards/ContentCard';
import { PicturesCard } from './components/Cards/PicturesCard';
import { VideoCard } from './components/Cards/VideoCard';
import AppTopBar from './components/AppTopBar';
import { TopBarPanels } from './components/TopBarPanels';
import { useTopBarPanels } from './components/useTopBarPanels';
import { MenuContent, MenuPictures } from './components/AppMenuBar';
import { MenuVideo } from './components/MenuVideo';
import { BaduAssistantEnhanced as BaduAssistant } from './components/BaduAssistantEnhanced';
import SmartOutputGrid from './components/Outputs/SmartOutputGrid';
import DraggableCard from './components/Outputs/DraggableCard';
import { SmartGenerationLoader } from './components/SmartGenerationLoader';
import FeedbackSlider from './components/ui/feedback-slider';
import { feedbackManager, type FeedbackTouchpoint } from './lib/feedbackManager';
// import { InteractiveCardController } from './components/Debug/InteractiveCardController';

import {
  loadSettings,
  saveSettings,
} from './store/settings';
import {
  defaultAiState,
  generatePictures,
  generateVideo,
} from './store/ai';
import {
  generationProgressActions,
  type GenerationPhase,
  type ProgressSource,
} from './store/generationProgress';
import { useCardLayoutStore, cardLayoutActions } from './store/useCardLayoutStore';
import { useGenerationProgressStore } from './store/generationProgress';
import { getActivePicturesPrompt, MIN_PICTURE_PROMPT_LENGTH } from './store/picturesPrompts';
import { useCardsStore } from './store/useCardsStore';
import { useGeneratedCardsStore, useLoadGeneratedCards } from './store/useGeneratedCardsStore';
import {
  hydrateMediaPlan,
  useMediaPlanState,
} from './store/useMediaPlanStore';
import PersistentCardsDisplay from './components/PersistentCardsDisplay';
import { uploadGeneratedImages, uploadGeneratedVideos, getCurrentUserId } from './lib/imageStorage';
import type {
  SettingsState,
  AiUIState,
  CardKey,
  AiAttachment,
  Platform,
  ContentVariantResult,
  ContentGenerationMeta,
  GeneratedPictures,
  GeneratedVideo,
  MediaPlanState,
} from './types';
import type { GridStepState } from './state/ui';
import { useContentAI, type ContentAttachmentPayload } from './useContentAI';
import { revokeAttachmentUrl, withAttachmentData, clearAttachmentCache } from './lib/attachments';
import { supabase } from './lib/supabase';

const clampVersionIndex = (index: number, total: number) => {
  if (total <= 0) {
    return 0;
  }
  return Math.min(index, total - 1);
};

// Removed setAiLiveState - no longer needed without AiBox

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

const cloneAttachments = (attachments: AiAttachment[]): AiAttachment[] =>
  attachments.map((item) => ({ ...item, dataUrl: item.dataUrl }));

const attachmentsEqual = (a: AiAttachment[] = [], b: AiAttachment[] = []): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((item, index) => {
    const other = b[index];
    if (!other) return false;
    return (
      item.id === other.id &&
      item.url === other.url &&
      item.mime === other.mime &&
      item.name === other.name &&
      item.kind === other.kind &&
      item.size === other.size &&
      item.dataUrl === other.dataUrl
    );
  });
};

const mediaPlansEqual = (a: MediaPlanState, b: MediaPlanState): boolean =>
  a.budget === b.budget &&
  a.market === b.market &&
  a.goal === b.goal &&
  a.currency === b.currency &&
  a.niche === b.niche &&
  a.leadToSalePct === b.leadToSalePct &&
  a.revenuePerSale === b.revenuePerSale &&
  a.manageFx === b.manageFx &&
  a.channelMode === b.channelMode &&
  a.manualCplEnabled === b.manualCplEnabled &&
  JSON.stringify(a.channels) === JSON.stringify(b.channels) &&
  JSON.stringify(a.channelSplits) === JSON.stringify(b.channelSplits) &&
  JSON.stringify(a.manualCplValues) === JSON.stringify(b.manualCplValues) &&
  JSON.stringify(a.summary ?? null) === JSON.stringify(b.summary ?? null) &&
  JSON.stringify(a.allocations ?? []) === JSON.stringify(b.allocations ?? []) &&
  a.scenario === b.scenario &&
  a.notes === b.notes &&
  a.lastSyncedAt === b.lastSyncedAt &&
  a.plannerValidatedAt === b.plannerValidatedAt &&
  a.channelsValidatedAt === b.channelsValidatedAt &&
  a.advancedValidatedAt === b.advancedValidatedAt;

function App() {
  const initialSettings = useMemo(() => loadSettings(), []);
  const [settingsState, setSettingsState] = useState<SettingsState>(initialSettings);
  const mediaPlanState = useMediaPlanState((state) => state.mediaPlan);
  const settings = useMemo(
    () => ({
      ...settingsState,
      mediaPlan: mediaPlanState,
    }),
    [settingsState, mediaPlanState]
  );
  const [aiState, setAiState] = useState<AiUIState>(() => ({
    ...defaultAiState,
    brief: initialSettings.quickProps.content.brief,
    uploads: cloneAttachments(initialSettings.quickProps.content.attachments ?? []),
  }));
  const [currentVersions, setCurrentVersions] = useState({ content: 0, pictures: 0, video: 0 });
  // Track if generation has been triggered in this session (to hide cards on initial load)
  const [hasGeneratedInSession, setHasGeneratedInSession] = useState(false);
  const generationAbortRef = useRef<AbortController | null>(null);
  const recordPhase = useCallback(
    (
      card: CardKey,
      phase: GenerationPhase,
      meta?: { message?: string; source?: ProgressSource; runId?: string }
    ) => {
      generationProgressActions.updatePhase(card, phase, meta);
    },
    []
  );

  const [hiddenCardTypes, setHiddenCardTypes] = useState<Set<CardKey>>(() => new Set());

  // Multi-generation persistence
  const { addGeneration, setCurrentBatchId } = useGeneratedCardsStore();
  useLoadGeneratedCards(); // Load saved cards on mount
  const currentBatchIdRef = useRef<string | null>(null);
  
  // Track which generations we've already saved to prevent duplicates
  const savedGenerationsRef = useRef<Set<string>>(new Set());

  const { open: panelOpen, toggle: togglePanel, close: closePanel, openPanel, setHovering } = useTopBarPanels();


  useEffect(() => {
    hydrateMediaPlan(initialSettings.mediaPlan);
  }, [initialSettings]);

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
  const pendingPersistRef = useRef(false);
  const lastProgressRef = useRef<Record<CardKey, { runId: string | null; phase: GenerationPhase; message: string | null }>>({
    content: { runId: null, phase: 'idle', message: null },
    pictures: { runId: null, phase: 'idle', message: null },
    video: { runId: null, phase: 'idle', message: null },
  });

  // DEBUG: Log contentVariants after update
  useEffect(() => {
    if (contentStatus === 'ready' && contentResult) {
      if (import.meta.env?.DEV) {
        console.log('[App] applying contentResult', contentResult)
      }
      setContentVariants(contentResult.variants ?? []);
      setContentMeta(contentResult.meta ?? null);
      console.log('App.tsx - contentVariants updated:', contentResult.variants);
      
      // Persist to database ONLY ONCE per generation
      if (currentBatchIdRef.current && contentResult.variants && contentResult.variants.length > 0) {
        // Create unique key for this generation
        const generationKey = `content-${contentRunId || Date.now()}`;
        
        // Only save if we haven't saved this generation before
        if (!savedGenerationsRef.current.has(generationKey)) {
          console.log('💾 Saving content generation:', generationKey);
          savedGenerationsRef.current.add(generationKey);
          
          addGeneration('content', { variants: contentResult.variants, meta: contentResult.meta }, settings).catch(err => {
            console.error('Failed to persist content generation:', err);
            // Remove from saved set on error so it can be retried
            savedGenerationsRef.current.delete(generationKey);
          });
        } else {
          console.log('⏭️ Skipping duplicate save for:', generationKey);
        }
      }
    } else if (contentStatus === 'queued') {
      setContentVariants([]);
      setContentMeta(null);
    } else if (contentStatus === 'error') {
      setContentMeta(null);
    }
  }, [contentStatus, contentResult, addGeneration, settings, contentRunId]);

  const cardsEnabled = useCardsStore((state) => state.enabled);
  const cardsOrder = useCardsStore((state) => state.order);
  const selectedCard = useCardsStore((state) => state.selected);
  const setCardEnabled = useCardsStore((state) => state.setEnabled);
  const selectCard = useCardsStore((state) => state.select);
  const toggleHiddenCard = useCardsStore((state) => state.toggleHidden);
  const setCustomOrder = useCardsStore((state) => state.setCustomOrder);
  const cardsPinned = useCardsStore((state) => state.pinned);
  const toggleCardPinned = useCardsStore((state) => state.togglePinned);
  const cardOffsets = useCardLayoutStore((state) => state.offsets);

  useEffect(() => {
    const pendingTab = sessionStorage.getItem('me:return-tab');
    if (pendingTab && (pendingTab === 'content' || pendingTab === 'pictures' || pendingTab === 'video')) {
      sessionStorage.removeItem('me:return-tab');
      const tab = pendingTab as CardKey;
      selectCard(tab);
      openPanel(tab);
    }
  }, [openPanel, selectCard]);

  const syncAiStateWithSettings = useCallback((nextSettings: SettingsState) => {
    const nextBrief = nextSettings.quickProps.content.brief;
    const nextAttachments = cloneAttachments(nextSettings.quickProps.content.attachments ?? []);

    setAiState((prev) => {
      const briefSame = prev.brief === nextBrief;
      const uploadsSame = attachmentsEqual(prev.uploads, nextAttachments);
      if (briefSame && uploadsSame) {
        return prev;
      }

      return {
        ...prev,
        brief: nextBrief,
        uploads: nextAttachments,
      };
    });
  }, []);

  const setSettings = useCallback(
    (updater: SettingsState | ((prev: SettingsState) => SettingsState)) => {
      setSettingsState((prev) => {
        const next = typeof updater === 'function'
          ? (updater as (prev: SettingsState) => SettingsState)({
              ...prev,
              mediaPlan: mediaPlanState,
            })
          : updater;

        const { mediaPlan: nextMediaPlan, ...rest } = next;

        if (nextMediaPlan && !mediaPlansEqual(nextMediaPlan, mediaPlanState)) {
          hydrateMediaPlan(nextMediaPlan);
        }

        const nextSettingsState: SettingsState = {
          ...rest,
          mediaPlan: prev.mediaPlan,
        };

        syncAiStateWithSettings({
          ...nextSettingsState,
          mediaPlan: mediaPlanState,
        });

        return nextSettingsState;
      });
    },
    [mediaPlanState, syncAiStateWithSettings, hydrateMediaPlan]
  );

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

  // Handle aiState.generating for any card regeneration/generation
  useEffect(() => {
    const isContentBusy = settings.cards.content && 
      (contentStatus === 'queued' || contentStatus === 'thinking' || contentStatus === 'rendering');
    
    const isPicturesBusy = settings.cards.pictures && 
      (aiState.stepStatus.pictures === 'queued' || 
       aiState.stepStatus.pictures === 'thinking' || 
       aiState.stepStatus.pictures === 'rendering');
    
    const isVideoBusy = settings.cards.video && 
      (aiState.stepStatus.video === 'queued' || 
       aiState.stepStatus.video === 'thinking' || 
       aiState.stepStatus.video === 'rendering');
    
    const shouldBeGenerating = isContentBusy || isPicturesBusy || isVideoBusy;
    
    setAiState((prev) => {
      // Only update if state actually changed
      if (prev.generating === shouldBeGenerating) {
        return prev;
      }
      return {
        ...prev,
        generating: shouldBeGenerating,
      };
    });
  }, [contentStatus, aiState.stepStatus.pictures, aiState.stepStatus.video, settings.cards]);

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

  const prepareContentAttachments = useCallback(async (source?: AiAttachment[]) => {
    const base = source ?? settings.quickProps.content.attachments ?? [];
    const enriched = await Promise.all(base.map((item) => withAttachmentData(item)));
    const prevAttachments = settings.quickProps.content.attachments ?? [];

    if (!attachmentsEqual(enriched, prevAttachments)) {
      setSettings((prev) => ({
        ...prev,
        quickProps: {
          ...prev.quickProps,
          content: {
            ...prev.quickProps.content,
            attachments: cloneAttachments(enriched),
          },
        },
      }));
    }

    const payloadSources = enriched
      .map((item) => {
        const [, base64 = ''] = (item.dataUrl ?? '').split(',');
        if (!base64) return null;
        return {
          name: item.name,
          mime: item.mime,
          data: base64,
          kind: item.kind,
          size: item.size,
        };
      })
      .filter(
        (item): item is {
          name: string;
          mime: string;
          data: string;
          kind: 'image' | 'document';
          size: number;
        } => item !== null
      );

    const payload: ContentAttachmentPayload[] = payloadSources.map((item) => ({
      name: item.name,
      mime: item.mime,
      data: item.data,
      kind: item.kind,
      size: item.size,
    }));

    return { enriched, payload };
  }, [setSettings, settings.quickProps.content.attachments]);

  const preparePictureAttachments = useCallback(async () => {
    return [];
  }, []);

  const handleGenerate = async (requestBrief: string, requestAttachments: AiAttachment[]) => {
    // If already generating, stop it
    if (aiState.generating && generationAbortRef.current) {
      generationAbortRef.current.abort();
      generationAbortRef.current = null;
      return;
    }

    // Mark that generation has been triggered in this session
    setHasGeneratedInSession(true);
    
    // Generate unique batch ID for this generation session
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentBatchIdRef.current = batchId;
    setCurrentBatchId(batchId);

    const steps = cardsOrder.filter((card) => cardsEnabled[card]);

    generationProgressActions.setActiveCards(steps, { startedAt: Date.now() });


    generationAbortRef.current?.abort();
    const controller = new AbortController();
    generationAbortRef.current = controller;

    // Prepare Content brief (only needed if Content card is enabled)
    const trimmedRequestBrief = typeof requestBrief === 'string' ? requestBrief.trim() : '';
    const candidateBrief = trimmedRequestBrief || settings.quickProps.content.brief;
    const contentBrief = candidateBrief.trim();

    // Check if Content generation is needed and has valid brief
    const isContentEnabled = settings.cards.content;

    const { enriched: enrichedAttachments, payload: attachmentPayload } = await prepareContentAttachments(
      Array.isArray(requestAttachments) ? requestAttachments : undefined
    );

    const attachmentSnapshot = cloneAttachments(enrichedAttachments);
    const pictureAttachmentSnapshot: AiAttachment[] = await preparePictureAttachments();
    // Use promptImages from pictures quickProps (uploaded reference images)
    // These are base64 data URLs stored when user uploads images in the Pictures panel
    const promptImages = settings.quickProps.pictures.promptImages || [];
    const pictureUploads = promptImages.filter((url) => typeof url === 'string' && url.length > 0);
    const picturePromptSeed = getActivePicturesPrompt(settings.quickProps.pictures);
    const trimmedPicturePrompt = picturePromptSeed.trim();
    const pictureProviderKey = settings.quickProps.pictures.imageProvider;
    const resolvedPictureProvider = pictureProviderKey === 'auto' ? null : pictureProviderKey;
    const picturesBrief = trimmedPicturePrompt; // Pictures uses its own prompt, not content brief
    const isPicturePromptReady = trimmedPicturePrompt.length >= MIN_PICTURE_PROMPT_LENGTH;
    const isPictureValidated = settings.quickProps.pictures.validated && isPicturePromptReady;

    // Video validation
    const videoPrompt = settings.quickProps.video.promptText.trim();
    const isVideoValidated = settings.quickProps.video.validated && videoPrompt.length >= 10;

    // Check if we have at least one valid panel to generate
    const canGenerateContent = isContentEnabled && contentBrief;
    const canGeneratePictures = settings.cards.pictures && isPictureValidated && resolvedPictureProvider;
    const canGenerateVideo = settings.cards.video && isVideoValidated;
    
    if (!canGenerateContent && !canGeneratePictures && !canGenerateVideo) {
      console.error('❌ No valid panels to generate');
      if (isContentEnabled && !contentBrief) {
        console.error('   - Content panel needs a brief');
      }
      if (settings.cards.pictures && !isPictureValidated) {
        console.error('   - Pictures panel needs validation');
      }
      if (settings.cards.video && !isVideoValidated) {
        console.error('   - Video panel needs validation');
      }
      generationProgressActions.reset();
      alert('Please provide content for at least one panel:\n' +
            (isContentEnabled && !contentBrief ? '• Content needs a brief\n' : '') +
            (settings.cards.pictures && !isPictureValidated ? '• Pictures needs validation\n' : '') +
            (settings.cards.video && !isVideoValidated ? '• Video needs validation' : ''));
      return;
    }

    pendingPersistRef.current = true;

    // Only clear content data if content is actually being regenerated
    if (canGenerateContent && steps.includes('content')) {
      setContentVariants([]);
      setContentMeta(null);
    }

    setAiState((prev) => {
      // Preserve outputs for cards NOT being regenerated
      const preservedOutputs: AiUIState['outputs'] = {};
      
      // Only clear outputs for cards that are in the current generation steps
      if (!steps.includes('pictures') && prev.outputs.pictures) {
        preservedOutputs.pictures = prev.outputs.pictures;
      }
      if (!steps.includes('video') && prev.outputs.video) {
        preservedOutputs.video = prev.outputs.video;
      }
      // Note: content outputs are stored separately in contentVariants/contentMeta, not in outputs
      
      return {
        ...prev,
        brief: contentBrief || picturesBrief, // Use Pictures brief as fallback
        uploads: attachmentSnapshot,
        generating: true,
        steps,
        stepStatus: steps.reduce(
          (acc, step) => ({ ...acc, [step]: 'queued' as GridStepState }),
          {} as Partial<AiUIState['stepStatus']>
        ),
        outputs: preservedOutputs,
      };
    });

    const tasks: Promise<void>[] = [];

    // Only generate Content if it's enabled AND has a valid brief
    if (canGenerateContent) {
      const options = {
        ...contentOptions,
        copyLength: contentOptions.copyLength ?? 'Standard',
      };
      runContent(contentBrief, options, settings.versions ?? 2, undefined, attachmentPayload);
      
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
    } else if (settings.cards.content && steps.includes('content')) {
      console.warn('⚠️ Content card enabled but no brief provided, skipping');
      setAiState((prev) => ({
        ...prev,
        stepStatus: { ...prev.stepStatus, content: 'error' },
      }));
      recordPhase('content', 'error', {
        source: 'content-sse',
        message: 'Content brief required',
      });
    }

    if (settings.cards.pictures) {
      if (!resolvedPictureProvider || !isPicturePromptReady) {
        setAiState((prev) => ({
          ...prev,
          stepStatus: { ...prev.stepStatus, pictures: 'error' },
        }));
        recordPhase('pictures', 'error', {
          source: 'image-gateway',
          message: 'Pictures prompt or provider missing',
        });
      } else if (!isPictureValidated) {
        setAiState((prev) => ({
          ...prev,
          stepStatus: { ...prev.stepStatus, pictures: 'error' },
        }));
        recordPhase('pictures', 'error', {
          source: 'image-gateway',
          message: 'Pictures prompt not validated',
        });
      } else {
      tasks.push(
        (async () => {
          try {
            setAiState((prev) => ({
              ...prev,
              stepStatus: { ...prev.stepStatus, pictures: 'thinking' },
            }));
            recordPhase('pictures', 'thinking', {
              source: 'image-gateway',
              message: 'Crafting visual concepts',
            });

            await waitWithAbort(controller.signal, 700);

            setAiState((prev) => ({
              ...prev,
              stepStatus: { ...prev.stepStatus, pictures: 'rendering' },
            }));
            recordPhase('pictures', 'rendering', {
              source: 'image-gateway',
              message: 'Rendering high-resolution images',
            });

            await waitWithAbort(controller.signal, 900);

            console.log('[Pictures] Generating with uploads:', pictureUploads.length, 'images');
            if (pictureUploads.length > 0) {
              console.log('[Pictures] First image preview:', pictureUploads[0].substring(0, 50) + '...');
            }

            const versions = await generatePictures({
              versions: settings.versions ?? 1,
              brief: picturesBrief,
              quickProps: settings.quickProps.pictures,
              uploads: pictureUploads,
              attachments: pictureAttachmentSnapshot,
              signal: controller.signal,
            });

            if (!versions.length) {
              throw new Error('Picture generation yielded no outputs.');
            }

            // Upload images to PERMANENT Supabase Storage
            console.log('🚀 Starting PERMANENT image upload to Supabase Storage...');
            const userId = await getCurrentUserId();
            const generationKey = `pictures-${Date.now()}`;
            
            let versionsWithPermanentUrls = versions;
            
            if (!userId) {
              console.error('❌ CRITICAL: No user ID found - cannot upload images!');
              console.log('Current auth state:', await supabase.auth.getUser());
            } else {
              console.log('✅ User ID found:', userId);
              console.log('📤 Uploading', versions.length, 'image versions...');
              
              try {
                versionsWithPermanentUrls = await uploadGeneratedImages(versions, userId, generationKey);
                
                // Verify upload worked
                const hasSupabaseUrls = versionsWithPermanentUrls.some((v: any) => 
                  v?.assets?.some((a: any) => a?.url?.includes('supabase.co'))
                );
                
                if (hasSupabaseUrls) {
                  console.log('✅ SUCCESS! Images uploaded to PERMANENT Supabase Storage');
                } else {
                  console.error('❌ UPLOAD FAILED! Still using temporary URLs');
                  console.log('URLs:', versionsWithPermanentUrls[0]?.assets?.[0]?.url);
                }
              } catch (uploadError) {
                console.error('❌ UPLOAD ERROR:', uploadError);
                throw uploadError; // Don't save if upload fails
              }
            }

            setAiState((prev) => ({
              ...prev,
              outputs: { ...prev.outputs, pictures: { versions: versionsWithPermanentUrls } },
              stepStatus: { ...prev.stepStatus, pictures: 'ready' },
            }));
            recordPhase('pictures', 'ready', {
              source: 'image-gateway',
            });
            
            // Persist to database ONLY ONCE with permanent URLs
            if (currentBatchIdRef.current && versionsWithPermanentUrls.length > 0) {
              if (!savedGenerationsRef.current.has(generationKey)) {
                console.log('💾 Saving pictures generation with permanent URLs:', generationKey);
                savedGenerationsRef.current.add(generationKey);
                
                addGeneration('pictures', { versions: versionsWithPermanentUrls }, settings).catch(err => {
                  console.error('Failed to persist pictures generation:', err);
                  savedGenerationsRef.current.delete(generationKey);
                });
              } else {
                console.log('⏭️ Skipping duplicate picture save for:', generationKey);
              }
            }
          } catch (error) {
            if ((error as Error).name === 'AbortError') {
              return;
            }
            console.error('Picture generation failed', error);
            setAiState((prev) => ({
              ...prev,
              stepStatus: { ...prev.stepStatus, pictures: 'error' },
            }));
            recordPhase('pictures', 'error', {
              source: 'image-gateway',
              message: error instanceof Error ? error.message : undefined,
            });
          }
        })()
      );
      }
    }

    if (settings.cards.video) {
      if (!isVideoValidated) {
        setAiState((prev) => ({
          ...prev,
          stepStatus: { ...prev.stepStatus, video: 'error' },
        }));
        recordPhase('video', 'error', {
          source: 'video-polling',
          message: 'Video prompt not validated',
        });
      } else {
        tasks.push(
          (async () => {
            try {
              setAiState((prev) => ({
                ...prev,
                stepStatus: { ...prev.stepStatus, video: 'thinking' },
              }));
              recordPhase('video', 'thinking', {
                source: 'video-polling',
                message: 'Storyboarding scenes',
              });

              // Runway video generation with real API
              const versions = await generateVideo(
                settings.versions ?? 1,
                settings.quickProps.video,
                controller.signal
              );

              if (!versions.length) {
                throw new Error('Video generation yielded no outputs.');
              }

              // Upload videos to PERMANENT Supabase Storage
              console.log('🚀 Starting PERMANENT video upload to Supabase Storage...');
              const userId = await getCurrentUserId();
              const generationKey = `video-${Date.now()}`;
              
              let versionsWithPermanentUrls = versions;
              
              if (!userId) {
                console.error('❌ CRITICAL: No user ID found - cannot upload videos!');
                console.log('Current auth state:', await supabase.auth.getUser());
              } else {
                console.log('✅ User ID found:', userId);
                console.log('📤 Uploading', versions.length, 'video versions...');
                
                try {
                  versionsWithPermanentUrls = await uploadGeneratedVideos(versions, userId, generationKey);
                  
                  // Verify upload worked
                  const hasSupabaseUrls = versionsWithPermanentUrls.some((v: any) => 
                    v?.url?.includes('supabase.co')
                  );
                  
                  if (hasSupabaseUrls) {
                    console.log('✅ SUCCESS! Videos uploaded to PERMANENT Supabase Storage');
                  } else {
                    console.error('❌ UPLOAD FAILED! Still using temporary URLs');
                    console.log('URLs:', versionsWithPermanentUrls[0]?.url);
                  }
                } catch (uploadError) {
                  console.error('❌ VIDEO UPLOAD ERROR:', uploadError);
                  throw uploadError; // Don't save if upload fails
                }
              }

              setAiState((prev) => ({
                ...prev,
                outputs: { ...prev.outputs, video: { versions: versionsWithPermanentUrls } },
                stepStatus: { ...prev.stepStatus, video: 'ready' },
              }));
              recordPhase('video', 'ready', {
                source: 'video-polling',
              });
              
              // Persist to database ONLY ONCE with permanent URLs
              if (currentBatchIdRef.current && versionsWithPermanentUrls.length > 0) {
                if (!savedGenerationsRef.current.has(generationKey)) {
                  console.log('💾 Saving video generation with permanent URLs:', generationKey);
                  savedGenerationsRef.current.add(generationKey);
                  
                  addGeneration('video', { versions: versionsWithPermanentUrls }, settings).catch(err => {
                    console.error('Failed to persist video generation:', err);
                    savedGenerationsRef.current.delete(generationKey);
                  });
                } else {
                  console.log('⏭️ Skipping duplicate video save for:', generationKey);
                }
              }
            } catch (error) {
              if ((error as Error).name === 'AbortError') {
                return;
              }
              console.error('Video generation failed', error);
              setAiState((prev) => ({
                ...prev,
                stepStatus: { ...prev.stepStatus, video: 'error' },
              }));
              recordPhase('video', 'error', {
                source: 'video-polling',
                message: error instanceof Error ? error.message : undefined,
              });
            }
          })()
        );
      }
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
          generating: false, // Make sure to set generating to false on error
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
        pendingPersistRef.current = false;
        generationProgressActions.reset();
      } else {
        setAiState((prev) => ({
          ...prev,
          generating: false,
        }));
        setCurrentVersions({ content: 0, pictures: 0, video: 0 });
        
        // Record generation and check if we should show feedback
        feedbackManager.recordGeneration();
        const { show, touchpoint } = feedbackManager.shouldShowAfterGeneration();
        if (show && touchpoint) {
          setCurrentFeedbackTouchpoint(touchpoint);
          
          // Smart delays for generation feedback
          if (touchpoint === 'first_generation') {
            // First generation: 5 minutes delay to let user explore
            console.log('[Feedback] First generation complete - will show feedback in 5 minutes');
            feedbackTimeoutRef.current = setTimeout(() => {
              setShowFeedbackModal(true);
              console.log('[Feedback] Showing first generation feedback after 5 minutes');
            }, 5 * 60 * 1000); // 5 minutes
          } else if (touchpoint === 'milestone_generation') {
            // Milestone generation: 2-3 minutes delay (randomized for natural feel)
            const delayMinutes = Math.random() < 0.5 ? 2 : 3;
            console.log(`[Feedback] Milestone generation complete - will show feedback in ${delayMinutes} minutes`);
            feedbackTimeoutRef.current = setTimeout(() => {
              setShowFeedbackModal(true);
              console.log('[Feedback] Showing milestone feedback after delay');
            }, delayMinutes * 60 * 1000);
          } else {
            // For other touchpoints, show immediately
            setShowFeedbackModal(true);
          }
        }
      }

      if (generationAbortRef.current === controller) {
        generationAbortRef.current = null;
      }
    }
  };

  const handleNewCampaign = () => {
    closePanel();
    // Clear generation state
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    aiState.uploads.forEach((item) => revokeAttachmentUrl(item));
    clearAttachmentCache();
    setAiState((prev) => ({
      ...prev,
      brief: '',
      uploads: [],
      outputs: {},
      steps: [],
      stepStatus: {},
    }));
    setSettings((prev) => ({
      ...prev,
      quickProps: {
        ...prev.quickProps,
        content: {
          ...prev.quickProps.content,
          brief: '',
          attachments: [],
          validated: false,
          validatedAt: null,
        },
      },
    }));
    setContentVariants([]);
    setContentMeta(null);
    setCurrentVersions({ content: 0, pictures: 0, video: 0 });
    setHiddenCardTypes(new Set());
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveCampaign = () => {
    closePanel();
    saveSettings(settings);
    console.info('Campaign saved');
    
    // Check if we should show feedback after save
    const { show, touchpoint } = feedbackManager.shouldShowAfterCampaignSave();
    if (show && touchpoint) {
      setCurrentFeedbackTouchpoint(touchpoint);
      setShowFeedbackModal(true);
    }
  };

  const [showSettings, setShowSettings] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [currentFeedbackTouchpoint, setCurrentFeedbackTouchpoint] = useState<FeedbackTouchpoint | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpenSettingsPanel = () => {
    closePanel();
    setShowSettings(true);
  };

  const handleHelp = () => {
    closePanel();
    console.info('Open help');
  };

  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    closePanel();
    
    // Check if we should show feedback before sign out
    const { show, touchpoint } = feedbackManager.shouldShowBeforeSignOut();
    if (show && touchpoint) {
      setCurrentFeedbackTouchpoint(touchpoint);
      setShowFeedbackModal(true);
      // Delay sign out until feedback is given or modal is closed
      return;
    }
    
    try {
      await logActivity({ action: 'user_signed_out' });
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Check for extended usage periodically
  useEffect(() => {
    const checkExtendedUsage = () => {
      const { show, touchpoint } = feedbackManager.shouldShowForExtendedUsage();
      if (show && touchpoint && !showFeedbackModal) {
        setCurrentFeedbackTouchpoint(touchpoint);
        setShowFeedbackModal(true);
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkExtendedUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [showFeedbackModal]);

  // Cleanup feedback timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
        console.log('[Feedback] Cleared pending feedback timeout');
      }
    };
  }, []);


  const getCardStatus = useCallback((card: CardKey): GridStepState => {
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
  }, [aiState.outputs.pictures, aiState.outputs.video, aiState.stepStatus, contentStatus]);

  const picturesVersions = useMemo(
    () => aiState.outputs.pictures?.versions ?? [],
    [aiState.outputs.pictures]
  );
  const videoVersions = useMemo(
    () => aiState.outputs.video?.versions ?? [],
    [aiState.outputs.video]
  );

  const picturesIndex = clampVersionIndex(currentVersions.pictures, picturesVersions.length);
  const videoIndex = clampVersionIndex(currentVersions.video, videoVersions.length);



  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = useGenerationProgressStore.subscribe(
      (state) => state.cards,
      async (cards) => {
        const updates: Array<{ user_id: string; card_type: CardKey; run_id: string | null; phase: GenerationPhase; message: string | null; meta: Record<string, unknown> | null; }> = [];

        (['content', 'pictures', 'video'] as CardKey[]).forEach((cardType) => {
          const progress = cards[cardType];
          const phase = progress?.phase ?? 'idle';
          const runId = progress?.runId ?? null;
          const message = progress?.message ?? null;
          const last = lastProgressRef.current[cardType];

          if (!last || last.phase !== phase || last.runId !== runId || last.message !== message) {
            updates.push({
              user_id: user.id,
              card_type: cardType,
              run_id: runId,
              phase,
              message,
              meta: progress ? { events: progress.events } : null,
            });

            lastProgressRef.current[cardType] = { phase, runId, message };
          }
        });

        if (updates.length === 0) {
          return;
        }

        const { error } = await supabase.from('user_card_progress').upsert(
          updates.map((item) => ({
            ...item,
            updated_at: new Date().toISOString(),
          }))
        );

        if (error) {
          console.error('Failed to persist card progress', error);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);


  const activeCards = cardsOrder.filter((card) => cardsEnabled[card]);
  const activeTab = (selectedCard ?? activeCards[0] ?? 'content') as CardKey;

  const sortedCardItems = useMemo(() => {
    const cardItems: Array<{ id: string; cardType: CardKey; layoutId: string; element: ReactNode }> = [];

    // Only show content card if it has actual data
    const hasContentData = contentVariants && contentVariants.length > 0;
    const shouldShowContentCard =
      cardsEnabled.content &&
      !hiddenCardTypes.has('content') &&
      hasGeneratedInSession &&
      hasContentData;

    if (shouldShowContentCard) {
      cardItems.push({
        id: 'content-card',
        cardType: 'content',
        layoutId: 'stage-card-content',
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

    // Only show pictures card if it has actual data
    const hasPicturesData = picturesVersions && picturesVersions.length > 0;
    const shouldShowPicturesCard =
      cardsEnabled.pictures && 
      !hiddenCardTypes.has('pictures') &&
      hasGeneratedInSession &&
      hasPicturesData;

    if (shouldShowPicturesCard) {
      cardItems.push({
        id: 'pictures-card',
        cardType: 'pictures',
        layoutId: 'stage-card-pictures',
        element: (
          <PicturesCard
            pictures={picturesVersions}
            currentVersion={picturesIndex}
            status={getCardStatus('pictures')}
          />
        ),
      });
    }

    // Only show video card if it has actual data
    const hasVideoData = videoVersions && videoVersions.length > 0;
    const shouldShowVideoCard =
      cardsEnabled.video && 
      !hiddenCardTypes.has('video') &&
      hasGeneratedInSession &&
      hasVideoData;

    if (shouldShowVideoCard) {
      cardItems.push({
        id: 'video-card',
        cardType: 'video',
        layoutId: 'stage-card-video',
        element: (
          <VideoCard
            videos={videoVersions}
            status={getCardStatus('video')}
          />
        ),
      });
    }

    const orderMap = new Map(cardsOrder.map((card, index) => [card, index]));
    return [...cardItems].sort((a, b) => {
      const aPinned = Boolean(cardsPinned[a.cardType]);
      const bPinned = Boolean(cardsPinned[b.cardType]);
      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }
      const aOrder = orderMap.get(a.cardType) ?? 999;
      const bOrder = orderMap.get(b.cardType) ?? 999;
      return aOrder - bOrder;
    });
  }, [
    aiState.brief,
    cardsEnabled,
    cardsOrder,
    cardsPinned,
    contentError,
    contentMeta,
    contentOptions,
    contentRunId,
    contentStatus,
    contentVariants,
    getCardStatus,
    hasGeneratedInSession,
    hiddenCardTypes,
    picturesIndex,
    picturesVersions,
    regenerateContent,
    settings.platforms,
    settings.versions,
    toggleCardPinned,
    videoIndex,
    videoVersions,
  ]);


  // Track active drag for DragOverlay
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors for smooth dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start dragging after 8px movement
      },
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end to update card order
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, delta } = event;

      // Immediately clear activeId to hide DragOverlay
      setActiveId(null);

      const activeItem = sortedCardItems.find((item) => item.id === active.id);
      if (!activeItem) {
        return;
      }

      if (!over || active.id === over.id) {
        if (delta && (Math.abs(delta.x) > 1 || Math.abs(delta.y) > 1)) {
          cardLayoutActions.nudgeOffset(activeItem.cardType, {
            x: delta.x,
            y: delta.y,
          });
        }
        return;
      }

      const oldIndex = sortedCardItems.findIndex((item) => item.id === active.id);
      const newIndex = sortedCardItems.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const draggedCardType = sortedCardItems[oldIndex].cardType;
      const targetCardType = sortedCardItems[newIndex].cardType;

      const newOrder = [...cardsOrder];
      const draggedIndex = newOrder.indexOf(draggedCardType);
      const targetIndex = newOrder.indexOf(targetCardType);

      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedCardType);

      setCustomOrder(newOrder);
    },
    [sortedCardItems, cardsOrder, setCustomOrder]
  );

  const topBar = (
    <AppTopBar
      active={activeTab}
      enabled={cardsEnabled}
      copyLength={settings.quickProps.content.copyLength}
      contentValidated={settings.quickProps.content.validated && settings.platforms.length > 0}
      picturesValidated={settings.quickProps.pictures.validated}
      videoValidated={settings.quickProps.video.validated}
      isGenerating={aiState.generating}
      settings={settings}
      onSettingsChange={setSettings}
      onChange={(tab) => {
        selectCard(tab);
        togglePanel(tab);
      }}
      onOpenPanel={(tab) => {
        selectCard(tab);
        openPanel(tab);
      }}
      onSetHovering={setHovering}
      onGenerate={() => handleGenerate(settings.quickProps.content.brief, aiState.uploads)}
      onNewCampaign={handleNewCampaign}
      onSave={handleSaveCampaign}
      onOpenSettings={handleOpenSettingsPanel}
      onHelp={handleHelp}
      onSignOut={handleSignOut}
      onOpenFeedbackSlider={() => {
        setCurrentFeedbackTouchpoint('feature_discovery');
        setShowFeedbackModal(true);
      }}
    />
  );

  const getFeedbackTitle = (touchpoint: FeedbackTouchpoint | null): string => {
    switch (touchpoint) {
      case 'first_generation':
        return 'How was your first generation experience?';
      case 'milestone_generation':
        return `Congrats on ${feedbackManager.getState().generationCount} generations! How is it going?`;
      case 'campaign_saved':
        return 'How was your campaign creation experience?';
      case 'extended_usage':
        return 'You have been creating amazing content! How is your experience?';
      case 'sign_out':
        return 'Before you go, how was your session today?';
      case 'random_sampling':
        return 'Quick feedback: How are you enjoying the app?';
      default:
        return 'How was your experience?';
    }
  };

  const handleFeedbackDone = async () => {
    if (feedbackRating === null || !user || !currentFeedbackTouchpoint) return;

    // Submit feedback to backend
    try {
      await fetch('http://localhost:8787/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          touchpointType: currentFeedbackTouchpoint,
          rating: feedbackRating,
          ratingLabel: feedbackRating === 0 ? 'BAD' : feedbackRating === 1 ? 'NOT BAD' : 'GOOD',
          comments: null,
          contextData: {
            location: 'feedback-modal',
            touchpoint: currentFeedbackTouchpoint,
            cardsGenerated: sortedCardItems.length,
            cardTypes: sortedCardItems.map(item => item.id),
            generationCount: feedbackManager.getState().generationCount
          },
          pageUrl: window.location.href,
          userAgent: navigator.userAgent
        })
      });
      
      console.log('[Feedback] Submitted:', { rating: feedbackRating, touchpoint: currentFeedbackTouchpoint });
      
      // Record feedback given
      feedbackManager.recordFeedbackGiven();
    } catch (error) {
      console.error('[Feedback] Submission error:', error);
    }

    // Close modal and reset
    setShowFeedbackModal(false);
    setFeedbackRating(null);
    setCurrentFeedbackTouchpoint(null);
    
    // Clear any pending feedback timeout
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    
    // If sign out was pending, complete it now
    if (currentFeedbackTouchpoint === 'sign_out') {
      try {
        await logActivity({ action: 'user_signed_out' });
        await signOut();
        navigate('/auth');
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }
  };

  const mainContent = (
    <div className="relative w-full h-full flex flex-col">
      <TopBarPanels
        open={panelOpen}
        close={closePanel}
        renderContent={<MenuContent settings={settings} onSettingsChange={setSettings} />}
        renderPictures={<MenuPictures settings={settings} onSettingsChange={setSettings} />}
        renderVideo={<MenuVideo settings={settings} onSettingsChange={setSettings} />}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      />

      <div className="relative flex-1 w-full overflow-y-auto overflow-x-hidden">
        {/* Persistent Cards Display - Shows all saved cards from database */}
        <PersistentCardsDisplay
          settings={settings}
          cardsEnabled={cardsEnabled}
          cardsOrder={cardsOrder}
          cardsPinned={cardsPinned}
          hiddenCardTypes={hiddenCardTypes}
          cardOffsets={cardOffsets as Record<CardKey, { x: number; y: number }>}
        />
      </div>

      {/* Badu Assistant - Floating Chat */}
      <BaduAssistant />

      {/* Smart Generation Loader - Shows real-time progress */}
      <SmartGenerationLoader />

      {/* Full-Screen Feedback Modal - After Generation */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30
              }}
              className="relative w-full h-full max-w-[95vw] max-h-[95vh] flex items-center justify-center"
            >
              <FeedbackSlider 
                className="h-full w-full rounded-3xl shadow-[0_8px_64px_rgba(0,0,0,0.6)]"
                title={getFeedbackTitle(currentFeedbackTouchpoint)}
                onSubmit={(rating) => {
                  setFeedbackRating(rating);
                }}
                onDone={handleFeedbackDone}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Card FX Controller - Debug Tool (Removed - settings locked in) */}
      {/* <InteractiveCardController /> */}
      
    </div>
  );

  return (
    <>
      <LayoutShell menu={topBar} main={mainContent} />
      
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </>
  );
}

export default App;
