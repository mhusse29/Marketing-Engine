import { create } from 'zustand';

import type { CardKey } from '@/types';

export type GenerationPhase = 'idle' | 'queued' | 'thinking' | 'rendering' | 'ready' | 'error';

export type ProgressSource = 'content-sse' | 'image-gateway' | 'video-polling' | 'manual';

export type PhaseEvent = {
  id: string;
  card: CardKey;
  phase: GenerationPhase;
  at: number;
  source?: ProgressSource;
  message?: string;
  runId?: string;
};

export type CardProgress = {
  card: CardKey;
  runId?: string;
  phase: GenerationPhase;
  startedAt: number;
  updatedAt: number;
  source?: ProgressSource;
  message?: string;
  events: PhaseEvent[];
};

export type GenerationProgressState = {
  cards: Partial<Record<CardKey, CardProgress>>;
  activeOrder: CardKey[];
  isRunning: boolean;
  startedAt?: number;
  setActiveCards: (cards: CardKey[], options?: { startedAt?: number }) => void;
  setRunId: (card: CardKey, runId: string) => void;
  updatePhase: (
    card: CardKey,
    phase: GenerationPhase,
    meta?: { runId?: string; source?: ProgressSource; message?: string }
  ) => void;
  clearCard: (card: CardKey) => void;
  reset: () => void;
};

const createEventId = (card: CardKey, phase: GenerationPhase) =>
  `${card}-${phase}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const initialState: Pick<GenerationProgressState, 'cards' | 'activeOrder' | 'isRunning' | 'startedAt'> = {
  cards: {},
  activeOrder: [],
  isRunning: false,
  startedAt: undefined,
};

export const useGenerationProgressStore = create<GenerationProgressState>()((set, get) => ({
  ...initialState,
  setActiveCards: (cards, options) => {
    const startedAt = options?.startedAt ?? Date.now();
    const now = startedAt;
    const existing = get().cards;

    const nextCards: Partial<Record<CardKey, CardProgress>> = { ...existing };
    cards.forEach((card) => {
      const current = existing[card];
      if (current && current.phase !== 'ready' && current.phase !== 'error') {
        nextCards[card] = {
          ...current,
          startedAt: current.startedAt ?? now,
          phase: 'queued',
          updatedAt: now,
          source: 'manual',
          message: undefined,
          events: [
            ...current.events,
            {
              id: createEventId(card, 'queued'),
              card,
              phase: 'queued',
              at: now,
              source: 'manual',
            },
          ],
        };
        return;
      }

      nextCards[card] = {
        card,
        phase: 'queued',
        startedAt: now,
        updatedAt: now,
        message: undefined,
        source: 'manual',
        events: [
          {
            id: createEventId(card, 'queued'),
            card,
            phase: 'queued',
            at: now,
            source: 'manual',
          },
        ],
      };
    });

    set({
      cards: nextCards,
      activeOrder: cards,
      isRunning: cards.length > 0,
      startedAt,
    });
  },
  setRunId: (card, runId) => {
    const { cards } = get();
    const current = cards[card];
    if (!current || current.runId === runId) {
      return;
    }
    set({
      cards: {
        ...cards,
        [card]: {
          ...current,
          runId,
        },
      },
    });
  },
  updatePhase: (card, phase, meta) => {
    const { cards } = get();
    const now = Date.now();
    const current = cards[card];

    if (!current) {
      const newEvent: PhaseEvent = {
        id: createEventId(card, phase),
        at: now,
        phase,
        card,
        source: meta?.source,
        message: meta?.message,
        runId: meta?.runId,
      };

      set((prev) => ({
        cards: {
          ...prev.cards,
          [card]: {
            card,
            phase,
            runId: meta?.runId,
            startedAt: now,
            updatedAt: now,
            source: meta?.source,
            message: meta?.message,
            events: [newEvent],
          },
        },
        activeOrder: prev.activeOrder.includes(card)
          ? prev.activeOrder
          : [...prev.activeOrder, card],
        isRunning: phase !== 'ready' && phase !== 'error',
        startedAt: prev.startedAt ?? now,
      }));
      return;
    }

    if (current.phase === phase && current.message === meta?.message) {
      return;
    }

    const event: PhaseEvent = {
      id: createEventId(card, phase),
      card,
      phase,
      at: now,
      source: meta?.source,
      message: meta?.message,
      runId: meta?.runId ?? current.runId,
    };

    const nextPhase: CardProgress = {
      ...current,
      phase,
      runId: meta?.runId ?? current.runId,
      updatedAt: now,
      source: meta?.source ?? current.source,
      message: meta?.message,
      events: [...current.events, event],
    };

    const nextCards: Partial<Record<CardKey, CardProgress>> = {
      ...cards,
      [card]: nextPhase,
    };

    const stillRunning = Object.values(nextCards).some(
      (progress) =>
        progress.phase !== 'ready' && progress.phase !== 'error' && progress.phase !== 'idle'
    );

    set({
      cards: nextCards,
      isRunning: stillRunning,
    });
  },
  clearCard: (card) => {
    const { cards, activeOrder } = get();
    if (!cards[card]) return;
    const nextCards = { ...cards };
    delete nextCards[card];
    set({
      cards: nextCards,
      activeOrder: activeOrder.filter((item) => item !== card),
      isRunning: Object.values(nextCards).some(
        (progress) =>
          progress.phase !== 'ready' && progress.phase !== 'error' && progress.phase !== 'idle'
      ),
    });
  },
  reset: () => {
    set({
      ...initialState,
    });
  },
}));

export const generationProgressSelectors = {
  selectActiveCards: (state: GenerationProgressState) => state.activeOrder,
  selectCards: (state: GenerationProgressState) => state.cards,
  selectIsRunning: (state: GenerationProgressState) => state.isRunning,
};

export const generationProgressActions = {
  setActiveCards: (cards: CardKey[], options?: { startedAt?: number }) =>
    useGenerationProgressStore.getState().setActiveCards(cards, options),
  setRunId: (card: CardKey, runId: string) =>
    useGenerationProgressStore.getState().setRunId(card, runId),
  updatePhase: (
    card: CardKey,
    phase: GenerationPhase,
    meta?: { runId?: string; source?: ProgressSource; message?: string }
  ) => useGenerationProgressStore.getState().updatePhase(card, phase, meta),
  clearCard: (card: CardKey) => useGenerationProgressStore.getState().clearCard(card),
  reset: () => useGenerationProgressStore.getState().reset(),
};
