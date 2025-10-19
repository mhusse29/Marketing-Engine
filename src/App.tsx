import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import { SmartGenerationLoader } from './components/SmartGenerationLoader';
import { StageManager } from './components/StageManager/StageManager';
import FeedbackSlider from './components/ui/feedback-slider';
import { feedbackManager, type FeedbackTouchpoint } from './lib/feedbackManager';
import {
  createStageManagerEntry,
  defaultStageManager3DSettings,
  defaultStageManagerTraySettings,
  type StageManagerEntry,
  type StageManagerEntryInput,
} from './components/StageManager/types';
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
import { getActivePicturesPrompt, MIN_PICTURE_PROMPT_LENGTH } from './store/picturesPrompts';
import { useCardsStore } from './store/useCardsStore';
import type {
  SettingsState,
  AiUIState,
  CardKey,
  AiAttachment,
  Platform,
  ContentVariantResult,
  ContentGenerationMeta,
  PictureRemixOptions,
  PicturesQuickProps,
} from './types';
import type { GridStepState } from './state/ui';
import { useContentAI, type ContentAttachmentPayload } from './useContentAI';
import { revokeAttachmentUrl, withAttachmentData, clearAttachmentCache } from './lib/attachments';

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

function App() {
  const initialSettings = useMemo(() => loadSettings(), []);
  const [settings, setSettingsState] = useState<SettingsState>(initialSettings);
  const [aiState, setAiState] = useState<AiUIState>(() => ({
    ...defaultAiState,
    brief: initialSettings.quickProps.content.brief,
    uploads: cloneAttachments(initialSettings.quickProps.content.attachments ?? []),
  }));
  const [currentVersions, setCurrentVersions] = useState({ content: 0, pictures: 0, video: 0 });
  const generationAbortRef = useRef<AbortController | null>(null);

  // Stage Manager: minimized entries and visibility
  const [stageEntries, setStageEntries] = useState<StageManagerEntry[]>([]);
  const [hiddenCardTypes, setHiddenCardTypes] = useState<Set<CardKey>>(() => new Set());

  // Stage Manager positioning and tray styling
  const threeDSettings = useMemo(
    () => ({
      ...defaultStageManager3DSettings,
    }),
    []
  );
  const traySettings = useMemo(
    () => ({
      ...defaultStageManagerTraySettings,
    }),
    []
  );

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
  const picturesStatusRef = useRef(aiState.stepStatus.pictures ?? 'idle');
  const videoStatusRef = useRef(aiState.stepStatus.video ?? 'idle');

  // DEBUG: Log contentVariants after update
  useEffect(() => {
    if (contentStatus === 'ready' && contentResult) {
      if (import.meta.env?.DEV) {
        console.log('[App] applying contentResult', contentResult)
      }
      setContentVariants(contentResult.variants ?? []);
      setContentMeta(contentResult.meta ?? null);
      console.log('App.tsx - contentVariants updated:', contentResult.variants);
    } else if (contentStatus === 'queued') {
      setContentVariants([]);
      setContentMeta(null);
    } else if (contentStatus === 'error') {
      setContentMeta(null);
    }
  }, [contentStatus, contentResult]);

  const cardsEnabled = useCardsStore((state) => state.enabled);
  const cardsOrder = useCardsStore((state) => state.order);
  const selectedCard = useCardsStore((state) => state.selected);
  const setCardEnabled = useCardsStore((state) => state.setEnabled);
  const selectCard = useCardsStore((state) => state.select);
  const toggleHiddenCard = useCardsStore((state) => state.toggleHidden);
  const { open: panelOpen, toggle: togglePanel, close: closePanel, openPanel, setHovering } = useTopBarPanels();

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
        const next = typeof updater === 'function' ? (updater as (prev: SettingsState) => SettingsState)(prev) : updater;
        syncAiStateWithSettings(next);
        return next;
      });
    },
    [syncAiStateWithSettings]
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
    const previous = contentStatusRef.current;
    contentStatusRef.current = contentStatus;
    if (contentStatus === 'ready' && previous && previous !== 'ready') {
      setHiddenCardTypes((prev) => {
        if (!prev.has('content')) {
          return prev;
        }
        const next = new Set(prev);
        next.delete('content');
        return next;
      });
    }
  }, [contentStatus]);

  useEffect(() => {
    contentErrorRef.current = contentError;
  }, [contentError]);

  useEffect(() => {
    const nextStatus = aiState.stepStatus.pictures ?? (aiState.outputs.pictures ? 'ready' : 'idle');
    const previous = picturesStatusRef.current;
    picturesStatusRef.current = nextStatus;
    if (nextStatus === 'ready' && previous !== 'ready') {
      setHiddenCardTypes((prev) => {
        if (!prev.has('pictures')) {
          return prev;
        }
        const next = new Set(prev);
        next.delete('pictures');
        return next;
      });
    }
  }, [aiState.outputs.pictures, aiState.stepStatus.pictures]);

  useEffect(() => {
    const nextStatus = aiState.stepStatus.video ?? (aiState.outputs.video ? 'ready' : 'idle');
    const previous = videoStatusRef.current;
    videoStatusRef.current = nextStatus;
    if (nextStatus === 'ready' && previous !== 'ready') {
      setHiddenCardTypes((prev) => {
        if (!prev.has('video')) {
          return prev;
        }
        const next = new Set(prev);
        next.delete('video');
        return next;
      });
    }
  }, [aiState.outputs.video, aiState.stepStatus.video]);

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
    const steps = cardsOrder.filter((card) => cardsEnabled[card]);

    generationAbortRef.current?.abort();
    const controller = new AbortController();
    generationAbortRef.current = controller;

    // Prepare Content brief (only needed if Content card is enabled)
    const trimmedRequestBrief = typeof requestBrief === 'string' ? requestBrief.trim() : '';
    const candidateBrief = trimmedRequestBrief || settings.quickProps.content.brief;
    const contentBrief = candidateBrief.trim();

    // Check if Content generation is needed and has valid brief
    const isContentEnabled = settings.cards.content;
    if (isContentEnabled && !contentBrief) {
      console.warn('Cannot generate content without a brief.');
      // Don't return - other panels might still be able to generate
    }

    const { enriched: enrichedAttachments, payload: attachmentPayload } = await prepareContentAttachments(
      Array.isArray(requestAttachments) ? requestAttachments : undefined
    );

    const attachmentSnapshot = cloneAttachments(enrichedAttachments);
    const pictureAttachmentSnapshot: AiAttachment[] = await preparePictureAttachments();
    const pictureUploads = pictureAttachmentSnapshot
      .filter((item) => item.kind === 'image')
      .map((item) => item.dataUrl ?? item.url)
      .filter((url) => typeof url === 'string' && url.length > 0);
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
      console.warn('No valid panels to generate. Please validate at least one panel.');
      return;
    }

    if (settings.cards.content) {
      setContentVariants([]);
      setContentMeta(null);
    }

    setAiState((prev) => ({
      ...prev,
      brief: contentBrief || picturesBrief, // Use Pictures brief as fallback
      uploads: attachmentSnapshot,
      generating: true,
      steps,
      stepStatus: steps.reduce(
        (acc, step) => ({ ...acc, [step]: 'queued' as GridStepState }),
        {} as Partial<AiUIState['stepStatus']>
      ),
      outputs: {},
    }));

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
    }

    if (settings.cards.pictures) {
      if (!resolvedPictureProvider || !isPicturePromptReady) {
        setAiState((prev) => ({
          ...prev,
          stepStatus: { ...prev.stepStatus, pictures: 'error' },
        }));
      } else if (!isPictureValidated) {
        setAiState((prev) => ({
          ...prev,
          stepStatus: { ...prev.stepStatus, pictures: 'error' },
        }));
      } else {
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
    }

    if (settings.cards.video) {
      if (!isVideoValidated) {
        setAiState((prev) => ({
          ...prev,
          stepStatus: { ...prev.stepStatus, video: 'error' },
        }));
      } else {
        tasks.push(
          (async () => {
            try {
              setAiState((prev) => ({
                ...prev,
                stepStatus: { ...prev.stepStatus, video: 'thinking' },
              }));

              // Runway video generation with real API
              const versions = await generateVideo(
                settings.versions ?? 1,
                settings.quickProps.video,
                controller.signal
              );

              if (!versions.length) {
                throw new Error('Video generation yielded no outputs.');
              }

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
    // Clear stage manager entries
    setStageEntries([]);
    setHiddenCardTypes(new Set());
    console.log('App.tsx - Cleared stage manager entries');
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

  const handleCardSave = (type: string) => {
    console.log(`Saving ${type} card`);
  };

  // Stage Manager: Minimize/Restore handlers
  const handleMinimizeCard = useCallback((entryInput: StageManagerEntryInput) => {
    const entry = createStageManagerEntry(entryInput);
    setStageEntries((prev) => [entry, ...prev]);
    setHiddenCardTypes((prev) => {
      if (prev.has(entryInput.cardType)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(entryInput.cardType);
      return next;
    });
    console.log('App.tsx - Minimized card entry:', entry);
  }, []);

  const handleRestoreCard = useCallback((entryId: string, cardType: CardKey) => {
    console.log(`App.tsx - Restoring card entry: ${entryId}`);
    setStageEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    setHiddenCardTypes((hidden) => {
      if (!hidden.has(cardType)) {
        return hidden;
      }
      const next = new Set(hidden);
      next.delete(cardType);
      return next;
    });
  }, []);

  const handleCardRegenerate = async (type: CardKey, pictureOptions?: PictureRemixOptions) => {
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
        const { payload: attachmentPayload, enriched } = await prepareContentAttachments();
        if (!attachmentsEqual(enriched, aiState.uploads)) {
          setAiState((prev) => ({
            ...prev,
            uploads: cloneAttachments(enriched),
          }));
        }
        regenerateContent(briefText, options, settings.versions ?? 2, 'try a new hook and angle', attachmentPayload);
      }
      return;
    }

    setAiState((prev) => ({
      ...prev,
      stepStatus: { ...prev.stepStatus, [type]: 'rendering' },
    }));

    await new Promise((resolve) => window.setTimeout(resolve, 1200));

    if (type === 'pictures') {
      try {
        const baseQuickProps = settings.quickProps.pictures;
        const pictureAttachments: AiAttachment[] = await preparePictureAttachments();
        const imageUploads = pictureAttachments
          .filter((item) => item.kind === 'image')
          .map((item) => item.dataUrl ?? item.url)
          .filter((url) => typeof url === 'string' && url.length > 0);

        const quickProps: PicturesQuickProps = {
          ...baseQuickProps,
        };

        if (pictureOptions?.aspect) {
          quickProps.aspect = pictureOptions.aspect;
        }
        if (pictureOptions?.mode) {
          quickProps.mode = pictureOptions.mode === 'image' ? 'images' : 'prompt';
        }

        const versionCount = Math.max(1, pictureOptions?.versionCount ?? settings.versions ?? 1);

        const picturePrompt = getActivePicturesPrompt(quickProps);
        const briefInput = pictureOptions?.prompt?.trim() || picturePrompt || aiState.brief;

        const versions = await generatePictures({
          versions: versionCount,
          brief: briefInput,
          quickProps,
          uploads: imageUploads,
          attachments: pictureAttachments,
          remixPrompt: pictureOptions?.prompt,
        });

        if (!versions.length) {
          throw new Error('Picture regeneration returned no result.');
        }

        setAiState((prev) => ({
          ...prev,
          outputs: { ...prev.outputs, pictures: { versions } },
          stepStatus: { ...prev.stepStatus, pictures: 'ready' },
        }));
        setCurrentVersions((prev) => ({ ...prev, pictures: 0 }));
      } catch (error) {
        console.error('Picture regeneration failed', error);
        setAiState((prev) => ({
          ...prev,
          stepStatus: { ...prev.stepStatus, pictures: 'error' },
        }));
      }
      return;
    }

    setAiState((prev) => {
      const outputs = { ...prev.outputs };

      if (type === 'video' && outputs.video) {
        // Video regeneration now requires async Runway API call
        generateVideo(1, settings.quickProps.video).then(refreshed => {
          const index = clampVersionIndex(
            currentVersions.video,
            outputs.video!.versions.length || 1
          );
          const versions = [...outputs.video!.versions];
          versions[index] = refreshed[0];
          
          setAiState((prev) => ({
            ...prev,
            outputs: {
              ...prev.outputs,
              video: { versions },
            },
            stepStatus: { ...prev.stepStatus, video: 'ready' },
          }));
        }).catch(error => {
          console.error('Video regeneration failed:', error);
          setAiState((prev) => ({
            ...prev,
            stepStatus: { ...prev.stepStatus, video: 'error' },
          }));
        });
        return prev; // Return early for async operation
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
  
  // Determine which cards are actually being generated
  if (!aiState.generating) {
    // Only show Content card if it was actually validated AND has generated content
    // This prevents empty content card from showing when only Pictures is generated
  const shouldShowContentCard =
      cardsEnabled.content && 
      settings.quickProps.content.validated && 
      (contentVariants.length > 0 || contentStatus !== 'idle') &&
      !hiddenCardTypes.has('content');

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
            onMinimize={handleMinimizeCard}
          />
        ),
      });
    }

    // Only show Pictures card if it was validated AND has generated images
  const shouldShowPicturesCard = 
      cardsEnabled.pictures && 
      settings.quickProps.pictures.validated &&
      picturesVersions.length > 0 &&
      !hiddenCardTypes.has('pictures');

    if (shouldShowPicturesCard) {
      cardItems.push({
        id: 'pictures-card',
        element: (
          <PicturesCard
            pictures={picturesVersions}
            currentVersion={picturesIndex}
            brandLocked={settings.quickProps.pictures.lockBrandColors ?? true}
            onSave={() => handleCardSave('pictures')}
            onRegenerate={(options) => handleCardRegenerate('pictures', options)}
            status={getCardStatus('pictures')}
            onMinimize={handleMinimizeCard}
          />
        ),
      });
    }

    // Only show Video card if it was validated AND has generated videos
  const shouldShowVideoCard = 
      cardsEnabled.video && 
      settings.quickProps.video.validated &&
      videoVersions.length > 0 &&
      !hiddenCardTypes.has('video');

    if (shouldShowVideoCard) {
      cardItems.push({
        id: 'video-card',
        element: (
          <VideoCard
            videos={videoVersions}
            currentVersion={videoIndex}
            onSave={() => handleCardSave('video')}
            onRegenerate={() => handleCardRegenerate('video')}
            status={getCardStatus('video')}
            onMinimize={handleMinimizeCard}
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
            cardsGenerated: cardItems.length,
            cardTypes: cardItems.map(item => item.id),
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
    <>
      <TopBarPanels
        open={panelOpen}
        close={closePanel}
        renderContent={<MenuContent settings={settings} onSettingsChange={setSettings} />}
        renderPictures={<MenuPictures settings={settings} onSettingsChange={setSettings} />}
        renderVideo={<MenuVideo settings={settings} onSettingsChange={setSettings} />}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      />

      {/* Stage Manager - Minimized Cards */}
      <StageManager
        entries={stageEntries}
        onRestoreEntry={handleRestoreCard}
        threeDSettings={threeDSettings}
        traySettings={traySettings}
      />

      {/* Main content area - now empty, cards will appear after generation */}

      <AnimatePresence mode="wait">
        {cardItems.length > 0 && !aiState.generating && (
          <motion.section
            key={`cards-display-${cardItems.length}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              delay: 0.2,
            }}
            className="outputs-stage mx-auto w-full max-w-[1600px] px-6 pb-24"
            aria-label="Generated outputs"
            style={{
              paddingTop: cardItems.length === 1 ? '0' : '48px',
            }}
          >
            <SmartOutputGrid 
              cardCount={cardItems.length}
              isGenerating={false}
            >
              {cardItems.map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 1.0,
                    ease: "easeInOut",
                    delay: 0.3 + (index * 0.15),
                  }}
                >
                  {item.element}
                </motion.div>
              ))}
            </SmartOutputGrid>

          </motion.section>
        )}
      </AnimatePresence>

      {/* Badu Assistant - Floating Chat */}
      <BaduAssistant />

      {/* Smart Generation Loader - Shows real-time progress */}
      <SmartGenerationLoader aiState={aiState} enabledCards={cardsEnabled} />

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
    </>
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
