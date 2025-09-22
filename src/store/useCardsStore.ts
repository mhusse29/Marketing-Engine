import { create } from 'zustand';

import type { CardKey, CardsState } from '../types';

type CardsStore = CardsState & {
  setEnabled: (card: CardKey, value: boolean) => void;
  select: (card: CardKey | null) => void;
  toggleHidden: (card: CardKey) => void;
};

const order: CardKey[] = ['content', 'pictures', 'video'];

export const useCardsStore = create<CardsStore>((set, get) => ({
  enabled: {
    content: false,
    pictures: false,
    video: false,
  },
  hidden: {
    content: false,
    pictures: false,
    video: false,
  },
  order,
  selected: null,
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
}));
