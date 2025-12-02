import { create } from 'zustand';

import type { CardKey } from '@/types';
import { processCardPosition, debounce, getViewportSize, getElementSize } from '@/utils/dragUtils';

export type CardOffset = {
  x: number;
  y: number;
};

type CardLayoutStore = {
  offsets: Partial<Record<CardKey, CardOffset>>;
  hydrated: boolean;
  setOffset: (card: CardKey, offset: CardOffset, element?: HTMLElement) => void;
  nudgeOffset: (card: CardKey, delta: CardOffset) => void;
  resetOffset: (card: CardKey) => void;
  resetAll: () => void;
  setHydrated: (value: boolean) => void;
  hydrateOffsets: (offsets: Partial<Record<CardKey, CardOffset>>) => void;
};

export const useCardLayoutStore = create<CardLayoutStore>()((set) => ({
  offsets: {},
  hydrated: false,
  setOffset: (card, offset, element) => {
    let processedOffset = offset;
    
    // Apply snapping and constraints if element is provided
    if (element) {
      const elementSize = getElementSize(element);
      const viewportSize = getViewportSize();
      
      processedOffset = processCardPosition(offset, elementSize, viewportSize, {
        enableSnapping: true,
        enableConstraints: true,
      });
    }
    
    set((state) => ({
      offsets: {
        ...state.offsets,
        [card]: processedOffset,
      },
    }));
  },
  nudgeOffset: (card, delta) =>
    set((state) => {
      const current = state.offsets[card] ?? { x: 0, y: 0 };
      return {
        offsets: {
          ...state.offsets,
          [card]: {
            x: current.x + delta.x,
            y: current.y + delta.y,
          },
        },
      };
    }),
  resetOffset: (card) =>
    set((state) => {
      if (!state.offsets[card]) {
        return state;
      }
      const next = { ...state.offsets };
      delete next[card];
      return { offsets: next };
    }),
  resetAll: () => set({ offsets: {} }),
  setHydrated: (value) => set({ hydrated: value }),
  hydrateOffsets: (offsets) => set({ offsets, hydrated: true }),
}));

// Create debounced persistence trigger
const triggerPersistence = debounce(() => {
  // This will be called by App.tsx when positions change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardPositionsChanged'));
  }
}, 500);

export const cardLayoutActions = {
  setOffset: (card: CardKey, offset: CardOffset, element?: HTMLElement) => {
    useCardLayoutStore.getState().setOffset(card, offset, element);
    triggerPersistence();
  },
  nudgeOffset: (card: CardKey, delta: CardOffset) => {
    useCardLayoutStore.getState().nudgeOffset(card, delta);
    triggerPersistence();
  },
  resetOffset: (card: CardKey) => {
    useCardLayoutStore.getState().resetOffset(card);
    triggerPersistence();
  },
  resetAll: () => {
    useCardLayoutStore.getState().resetAll();
    triggerPersistence();
  },
  setHydrated: (value: boolean) => useCardLayoutStore.getState().setHydrated(value),
  hydrateOffsets: (offsets: Partial<Record<CardKey, CardOffset>>) =>
    useCardLayoutStore.getState().hydrateOffsets(offsets),
};
