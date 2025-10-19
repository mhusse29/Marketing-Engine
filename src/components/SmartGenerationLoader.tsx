import { useMemo, useState, useEffect, useRef } from 'react';
import { MultiStepLoader } from './ui/multi-step-loader';
import type { CardKey, AiUIState } from '@/types';

type LoadingState = {
  text: string;
};

const STATUS_MESSAGES = {
  queued: {
    content: 'Starting content generation...',
    pictures: 'Starting image generation...',
    video: 'Starting video generation...',
  },
  thinking: {
    content: 'Analyzing your brief and crafting compelling copy...',
    pictures: 'Creating stunning visuals from your concept...',
    video: 'Planning scenes and composition...',
  },
  rendering: {
    content: 'Polishing headlines, captions, and CTAs...',
    pictures: 'Rendering high-quality images...',
    video: 'Rendering your cinematic video...',
  },
  ready: {
    content: '✓ Content ready - headlines, captions, and more!',
    pictures: '✓ Images ready - looking amazing!',
    video: '✓ Video ready - prepare to be impressed!',
  },
};

interface SmartGenerationLoaderProps {
  aiState: AiUIState;
  enabledCards: Record<CardKey, boolean>;
}

export function SmartGenerationLoader({ aiState, enabledCards }: SmartGenerationLoaderProps) {
  const [displayedStep, setDisplayedStep] = useState(0);
  const [shouldShow, setShouldShow] = useState(false);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCardRef = useRef<CardKey | null>(null);
  const stepStartTimeRef = useRef<number>(Date.now());

  // Determine which cards are being generated
  const activeCards = useMemo(() => {
    const cards: CardKey[] = ['content', 'pictures', 'video'];
    return cards.filter((card) => enabledCards[card]);
  }, [enabledCards]);

  // Find the currently active card (the one being processed right now)
  const currentActiveCard = useMemo(() => {
    // Priority order: find first card that's actively processing
    const processingCard = activeCards.find((card) => {
      const status = aiState.stepStatus?.[card];
      return status === 'thinking' || status === 'rendering';
    });
    
    if (processingCard) return processingCard;
    
    // Fall back to queued card
    const queuedCard = activeCards.find((card) => {
      const status = aiState.stepStatus?.[card];
      return status === 'queued';
    });
    
    return queuedCard || activeCards[0];
  }, [activeCards, aiState.stepStatus]);

  // Check if any card is busy
  const isBusy = useMemo(() => {
    // Must be actively generating AND have enabled cards with busy status
    if (!aiState.generating) return false;
    
    return activeCards.some((card) => {
      const status = aiState.stepStatus?.[card];
      return status === 'queued' || status === 'thinking' || status === 'rendering';
    });
  }, [activeCards, aiState.stepStatus, aiState.generating]);

  // Generate dynamic loading states based on the currently active card
  const loadingStates = useMemo((): LoadingState[] => {
    const states: LoadingState[] = [];

    if (!currentActiveCard) return states;

    // Only show states for the currently active card (skip queued state)
    states.push({ text: STATUS_MESSAGES.thinking[currentActiveCard] });
    states.push({ text: STATUS_MESSAGES.rendering[currentActiveCard] });
    states.push({ text: STATUS_MESSAGES.ready[currentActiveCard] });

    return states;
  }, [currentActiveCard]);

  // Calculate the actual step based on status
  const actualStep = useMemo(() => {
    if (!isBusy || !currentActiveCard) return 0;

    const status = aiState.stepStatus?.[currentActiveCard];
    
    // Map status to step index (0-2 for the 3 states, skip queued)
    let step = 0;
    if (status === 'queued' || status === 'thinking') {
      step = 0; // Start at thinking
    } else if (status === 'rendering') {
      step = 1;
    } else if (status === 'ready') {
      step = 2; // Success state
    }

    return Math.min(step, loadingStates.length - 1);
  }, [currentActiveCard, aiState.stepStatus, loadingStates.length, isBusy]);

  // Reset displayed step when card changes or generation starts
  useEffect(() => {
    if (currentActiveCard !== lastCardRef.current) {
      lastCardRef.current = currentActiveCard;
      setDisplayedStep(0);
      stepStartTimeRef.current = Date.now();
    }
  }, [currentActiveCard]);

  // Show loader when generation starts
  useEffect(() => {
    if (isBusy) {
      setShouldShow(true);
      // Clear any pending close timer
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    }
  }, [isBusy]);

  // Advance to success state and hold it when generation finishes
  useEffect(() => {
    if (!isBusy && shouldShow && currentActiveCard) {
      const status = aiState.stepStatus?.[currentActiveCard];
      
      // If status is 'ready', force advance to success step and hold
      if (status === 'ready') {
        const successStepIndex = loadingStates.length - 1;
        
        // Force to success step if not already there
        if (displayedStep < successStepIndex) {
          setDisplayedStep(successStepIndex);
          stepStartTimeRef.current = Date.now();
        }
        
        // Hold success state for 3 seconds to showcase the green waves
        const SUCCESS_DISPLAY_TIME = 3000;
        closeTimerRef.current = setTimeout(() => {
          setShouldShow(false);
          setDisplayedStep(0);
        }, SUCCESS_DISPLAY_TIME);
      } else {
        // Generation stopped before reaching ready state, close immediately
        setShouldShow(false);
        setDisplayedStep(0);
      }
      
      // Clean up step timer
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    }
    
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isBusy, shouldShow, currentActiveCard, aiState.stepStatus, displayedStep, loadingStates.length]);

  // Smooth step progression with minimum display time per step (only while busy)
  useEffect(() => {
    if (!isBusy || !shouldShow) return;

    const MIN_STEP_DURATION = 800; // Minimum 800ms per step
    
    const advanceStep = () => {
      const now = Date.now();
      const timeOnCurrentStep = now - stepStartTimeRef.current;
      
      // Only advance if we've been on this step long enough AND actual step is ahead
      if (timeOnCurrentStep >= MIN_STEP_DURATION && displayedStep < actualStep) {
        setDisplayedStep((prev) => {
          const next = Math.min(prev + 1, actualStep);
          if (next !== prev) {
            stepStartTimeRef.current = Date.now();
          }
          return next;
        });
      }
      
      // If actual step is ahead, keep checking
      if (displayedStep < actualStep) {
        stepTimerRef.current = setTimeout(advanceStep, 100);
      }
    };

    // Start checking for step advancement
    if (displayedStep < actualStep) {
      stepTimerRef.current = setTimeout(advanceStep, 100);
    }

    return () => {
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    };
  }, [isBusy, shouldShow, displayedStep, actualStep]);

  // Only show if we should be visible (includes success display time)
  if (!shouldShow) return null;

  return (
    <MultiStepLoader
      loadingStates={loadingStates}
      loading={shouldShow}
      duration={1500}
      loop={false}
      currentStep={displayedStep}
    />
  );
}

