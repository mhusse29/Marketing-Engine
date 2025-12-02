import { create } from 'zustand';

import type { CardKey, CardsState } from '../types';

type CardsStore = CardsState & {
  hydrated: boolean;
  setEnabled: (card: CardKey, value: boolean) => void;
  select: (card: CardKey | null) => void;
  toggleHidden: (card: CardKey) => void;
  setCustomOrder: (order: CardKey[]) => void;
  togglePinned: (card: CardKey) => void;
  setPinned: (card: CardKey, value: boolean) => void;
  setHydrated: (value: boolean) => void;
  hydratePinned: (pinned: Record<CardKey, boolean>) => void;
};

const defaultOrder: CardKey[] = ['content', 'pictures', 'video'];
const defaultPinned: Record<CardKey, boolean> = {
  content: false,
  pictures: false,
  video: false,
};

// Load custom order from localStorage
const loadCustomOrder = (): CardKey[] => {
  if (typeof window === 'undefined') return defaultOrder;
  try {
    const stored = localStorage.getItem('marketing-engine-card-order');
    if (stored) {
      const parsed = JSON.parse(stored) as CardKey[];
      // Validate that all three cards are present
      if (Array.isArray(parsed) && parsed.length === 3 && 
          parsed.includes('content') && parsed.includes('pictures') && parsed.includes('video')) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load custom card order:', error);
  }
  return defaultOrder;
};

// Save custom order to localStorage
const saveCustomOrder = (order: CardKey[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('marketing-engine-card-order', JSON.stringify(order));
  } catch (error) {
    console.error('Failed to save custom card order:', error);
  }
};

const initialOrder = loadCustomOrder();
const PIN_STORAGE_KEY = 'marketing-engine-card-pins';

const loadPinned = (): Record<CardKey, boolean> => {
  if (typeof window === 'undefined') return { ...defaultPinned };
  try {
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<Record<CardKey, boolean>>;
      if (parsed && typeof parsed === 'object') {
        return {
          content: Boolean(parsed.content),
          pictures: Boolean(parsed.pictures),
          video: Boolean(parsed.video),
        };
      }
    }
  } catch (error) {
    console.error('Failed to load pinned cards:', error);
  }
  return { ...defaultPinned };
};

const savePinned = (pinned: Record<CardKey, boolean>): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(pinned));
  } catch (error) {
    console.error('Failed to save pinned cards:', error);
  }
};

const initialPinned = loadPinned();

export const useCardsStore = create<CardsStore>((set, get) => ({
  enabled: {
    content: true,
    pictures: true,
    video: true,
  },
  hidden: {
    content: false,
    pictures: false,
    video: false,
  },
  pinned: initialPinned,
  order: initialOrder,
  selected: null,
  hydrated: false,
  setEnabled: (card, value) => {
    set((state) => {
      const nextEnabled: CardsState['enabled'] = {
        ...state.enabled,
        [card]: value,
      };

      let nextSelected = state.selected;

      if (value) {
        if (!nextSelected || !nextEnabled[nextSelected]) {
          nextSelected = state.order.find((key) => nextEnabled[key]) ?? card;
        }
      } else {
        if (nextSelected === card) {
          nextSelected = state.order.find((key) => key !== card && nextEnabled[key]) ?? null;
        }
        if (!Object.values(nextEnabled).some(Boolean)) {
          nextSelected = null;
        }
      }

      return {
        enabled: nextEnabled,
        selected: nextSelected,
      };
    });
  },
  select: (card) => {
    if (card === null) {
      set({ selected: null });
      return;
    }
    const { enabled } = get();
    if (!enabled[card]) {
      return;
    }
    set({ selected: card });
  },
  toggleHidden: (card) => {
    set((state) => ({
      hidden: {
        ...state.hidden,
        [card]: !state.hidden[card],
      },
    }));
  },
  setCustomOrder: (order) => {
    // Validate order
    if (Array.isArray(order) && order.length === 3 && 
        order.includes('content') && order.includes('pictures') && order.includes('video')) {
      set({ order });
      saveCustomOrder(order);
    }
  },
  togglePinned: (card) => {
    set((state) => {
      const nextPinned: Record<CardKey, boolean> = {
        ...state.pinned,
        [card]: !state.pinned[card],
      };
      // Keep localStorage as fallback
      savePinned(nextPinned);
      return { pinned: nextPinned };
    });
  },
  setPinned: (card, value) => {
    set((state) => {
      if (state.pinned[card] === value) {
        return state;
      }
      const nextPinned: Record<CardKey, boolean> = {
        ...state.pinned,
        [card]: value,
      };
      // Keep localStorage as fallback
      savePinned(nextPinned);
      return { pinned: nextPinned };
    });
  },
  setHydrated: (value) => set({ hydrated: value }),
  hydratePinned: (pinned) => set({ pinned, hydrated: true }),
}));
