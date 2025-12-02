import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useGenerationProgressStore, type GenerationProgressState, type CardProgress, type GenerationPhase } from '@/store/generationProgress';
import type { CardKey } from '@/types';

import { MultiStepLoader } from './ui/multi-step-loader';

type LoadingState = {
  text: string;
};

const ROTATION_INTERVAL_MS = 2800;
const LONG_RUNNING_THRESHOLD_MS = 12000;
const SUCCESS_HOLD_MS = 900;
const ERROR_HOLD_MS = 1800;

const ACTIVE_PHASES: GenerationPhase[] = ['queued', 'thinking', 'rendering'];

const BASE_COPY: Record<
  CardKey,
  {
    queued: string;
    thinking: string;
    rendering: string;
    ready: string;
    error: string;
  }
> = {
  content: {
    queued: 'Content · Queued up behind another card...',
    thinking: 'Content · Analyzing your brief for strong angles...',
    rendering: 'Content · Polishing headlines, captions, and CTAs...',
    ready: 'Content · ✓ Copy ready to review.',
    error: 'Content · Something went wrong. Try regenerating.',
  },
  pictures: {
    queued: 'Pictures · Queued while we prep prompts...',
    thinking: 'Pictures · Sketching style, lighting, and variations...',
    rendering: 'Pictures · Rendering gallery-quality images...',
    ready: 'Pictures · ✓ New gallery ready.',
    error: 'Pictures · Image gateway hit an issue. Adjust the prompt and retry.',
  },
  video: {
    queued: 'Video · Queued while Runway spins up the task...',
    thinking: 'Video · Storyboarding key shots and motion...',
    rendering: 'Video · Rendering frames and stitching the final cut...',
    ready: 'Video · ✓ Motion preview ready.',
    error: 'Video · The provider reported an issue. Try again in a moment.',
  },
};

const LONG_RUNNING_COPY: Partial<
  Record<CardKey, Partial<Record<'thinking' | 'rendering', string>>>
> = {
  content: {
    thinking: 'Content · Taking a closer pass at your brief for better results...',
  },
  pictures: {
    rendering: 'Pictures · Still rendering hi-res variations—hang tight!',
  },
  video: {
    rendering: 'Video · Runway is stitching frames. Longer prompts can take a minute.',
  },
};

const MIN_STEP_DURATION_MS = 800;

// Removed selectLoaderState to prevent infinite loops - using individual selectors instead

const isActivePhase = (phase: GenerationPhase) => ACTIVE_PHASES.includes(phase);

const buildLoadingStates = (
  progress: CardProgress,
  referenceNow: number
): { states: LoadingState[]; actualStep: number } => {
  const base = BASE_COPY[progress.card];
  const elapsed = Math.max(0, referenceNow - progress.updatedAt);
  const longRunning = elapsed >= LONG_RUNNING_THRESHOLD_MS;

  const thinkingText =
    progress.phase === 'queued' || progress.phase === 'idle'
      ? base.queued
      : longRunning && LONG_RUNNING_COPY[progress.card]?.thinking
        ? LONG_RUNNING_COPY[progress.card]?.thinking ?? base.thinking
        : base.thinking;

  const renderingText =
    progress.phase === 'rendering' && longRunning && LONG_RUNNING_COPY[progress.card]?.rendering
      ? LONG_RUNNING_COPY[progress.card]?.rendering ?? base.rendering
      : base.rendering;

  const terminalText = progress.phase === 'error' ? base.error : base.ready;

  const states: LoadingState[] = [
    { text: thinkingText },
    { text: renderingText },
    { text: terminalText },
  ];

  let actualStep = 0;
  if (progress.phase === 'rendering') {
    actualStep = 1;
  } else if (progress.phase === 'ready' || progress.phase === 'error') {
    actualStep = 2;
  } else {
    actualStep = 0;
  }

  return { states, actualStep };
};

export function SmartGenerationLoader() {
  // Use individual selectors to prevent infinite loops
  const cards = useGenerationProgressStore((state) => state.cards);
  const activeOrder = useGenerationProgressStore((state) => state.activeOrder);
  const isRunning = useGenerationProgressStore((state) => state.isRunning);
  const [displayedStep, setDisplayedStep] = useState(0);
  const [shouldShow, setShouldShow] = useState(false);
  const [, forceTick] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);

  const stepTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const rotationIntervalRef = useRef<number | null>(null);
  const lastCardRef = useRef<string | null>(null);
  const stepStartTimeRef = useRef<number>(Date.now());

  const orderedProgress = useMemo(() => {
    const fromOrder = activeOrder
      .map((card) => cards[card])
      .filter((item): item is CardProgress => Boolean(item));
    const extras = Object.values(cards)
      .filter(
        (item): item is CardProgress =>
          Boolean(item) && !activeOrder.includes(item.card)
      );
    return [...fromOrder, ...extras];
  }, [activeOrder, cards]);

  const activeCards = useMemo(
    () => orderedProgress.filter((progress) => isActivePhase(progress.phase)),
    [orderedProgress]
  );
  const errorCards = useMemo(
    () => orderedProgress.filter((progress) => progress.phase === 'error'),
    [orderedProgress]
  );
  const readyCards = useMemo(
    () => orderedProgress.filter((progress) => progress.phase === 'ready'),
    [orderedProgress]
  );

  const displayCandidates = useMemo(() => {
    if (activeCards.length > 0) return activeCards;
    if (errorCards.length > 0) return errorCards;
    if (readyCards.length > 0) return readyCards;
    return [];
  }, [activeCards, errorCards, readyCards]);

  const hasActive = activeCards.length > 0;
  const hasError = errorCards.length > 0;
  const hasReady = readyCards.length > 0;

  const candidateKey = useMemo(
    () =>
      displayCandidates
        .map((item) => `${item.card}:${item.runId ?? 'none'}:${item.phase}:${item.updatedAt}`)
        .join('|'),
    [displayCandidates]
  );

  useEffect(() => {
    if (displayCandidates.length === 0) {
      setDisplayIndex(0);
      return;
    }
    if (displayIndex > displayCandidates.length - 1) {
      setDisplayIndex(displayCandidates.length - 1);
    }
  }, [displayCandidates.length, displayIndex]);

  useEffect(() => {
    setDisplayIndex(0);
  }, [candidateKey]);

  useEffect(() => {
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
      rotationIntervalRef.current = null;
    }

    if (displayCandidates.length > 1 && activeCards.length > 1) {
      rotationIntervalRef.current = window.setInterval(() => {
        setDisplayIndex((prev) => (prev + 1) % displayCandidates.length);
      }, ROTATION_INTERVAL_MS);
    }

    return () => {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
    };
  }, [displayCandidates.length, activeCards.length, candidateKey]);

  useEffect(() => {
    if (hasActive) {
      setShouldShow(true);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      return;
    }

    if (!shouldShow) {
      return;
    }

    const holdDuration = hasError ? ERROR_HOLD_MS : hasReady ? SUCCESS_HOLD_MS : 0;

    if (holdDuration === 0) {
      setShouldShow(false);
      return;
    }

    closeTimerRef.current = window.setTimeout(() => {
      setShouldShow(false);
      closeTimerRef.current = null;
    }, holdDuration);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [hasActive, hasError, hasReady, shouldShow]);

  useEffect(() => {
    if (!hasActive) {
      return;
    }

    const interval = window.setInterval(() => {
      forceTick((tick) => tick + 1);
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [hasActive, candidateKey]);

  const currentCard = displayCandidates[displayIndex] ?? displayCandidates[0] ?? orderedProgress[0];

  const loadingStateResult = currentCard
    ? buildLoadingStates(currentCard, Date.now())
    : { states: [] as LoadingState[], actualStep: 0 };
  const loadingStates = loadingStateResult.states;
  const actualStep = loadingStateResult.actualStep;

  useEffect(() => {
    if (!currentCard) return;
    const key = `${currentCard.card}-${currentCard.runId ?? 'none'}`;
    if (key !== lastCardRef.current) {
      lastCardRef.current = key;
      setDisplayedStep((prev) => {
        if (actualStep === 2 && prev === 2) {
          return prev;
        }
        return 0;
      });
      stepStartTimeRef.current = Date.now();
    }
  }, [currentCard, actualStep]);

  useEffect(() => {
    if (!shouldShow || !currentCard) {
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
      return;
    }

    const advanceStep = () => {
      const now = Date.now();
      const elapsed = now - stepStartTimeRef.current;
      if (elapsed >= MIN_STEP_DURATION_MS && displayedStep < actualStep) {
        setDisplayedStep((prev) => {
          const next = Math.min(prev + 1, actualStep);
          if (next !== prev) {
            stepStartTimeRef.current = Date.now();
          }
          return next;
        });
      }

      if (displayedStep < actualStep) {
        stepTimerRef.current = window.setTimeout(advanceStep, 100);
      }
    };

    if (displayedStep < actualStep) {
      stepTimerRef.current = window.setTimeout(advanceStep, 100);
    }

    return () => {
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    };
  }, [actualStep, displayedStep, shouldShow, currentCard]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
      }
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
      }
    };
  }, []);

  if (!shouldShow || !currentCard || loadingStates.length === 0) {
    return null;
  }

  return (
    <MultiStepLoader
      loadingStates={loadingStates}
      loading={isRunning || shouldShow}
      duration={1500}
      loop={false}
      currentStep={displayedStep}
    />
  );
}
