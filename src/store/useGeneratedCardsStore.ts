/**
 * Generated Cards Store
 * Manages state for all generated cards across sessions
 */

import { create } from 'zustand';
import { useEffect } from 'react';
import type { CardKey } from '../types';
import type { GeneratedCard } from '../lib/cardPersistence';
import {
  loadUserGenerations,
  loadAllUserGenerations,
  saveGeneration,
  updateCardPosition,
  deleteGeneration,
  toggleCardPin,
  batchUpdatePositions,
  generateThumbnailUrl,
  calculateAspectRatio,
  hideCardGeneration,
  restoreCardGeneration,
} from '../lib/cardPersistence';

interface GeneratedCardsState {
  // State
  cards: GeneratedCard[];
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  currentBatchId: string | null;

  // Actions
  loadCards: () => Promise<void>;
  loadAllCards: () => Promise<void>;
  addGeneration: (cardType: CardKey, data: unknown, settings?: Record<string, unknown>) => Promise<string>;
  removeCard: (generationId: string) => Promise<void>;
  hideCard: (generationId: string) => Promise<void>;
  restoreCard: (generationId: string) => Promise<void>;
  updatePosition: (generationId: string, dragX: number, dragY: number, displayOrder: number) => Promise<void>;
  togglePin: (generationId: string) => Promise<void>;
  reorderCards: (newOrder: string[]) => Promise<void>;
  setCurrentBatchId: (batchId: string) => void;
  clearError: () => void;
  
  // Selectors
  getCardsByType: (cardType: CardKey) => GeneratedCard[];
  getPinnedCards: () => GeneratedCard[];
  getCardsByBatch: (batchId: string) => GeneratedCard[];
}

export const useGeneratedCardsStore = create<GeneratedCardsState>((set, get) => ({
  // Initial state
  cards: [],
  isLoading: false,
  isHydrated: false,
  error: null,
  currentBatchId: null,

  // Load visible cards from database (not hidden)
  loadCards: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const cards = await loadUserGenerations();
      set({ cards, isLoading: false, isHydrated: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load cards';
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to load generated cards:', error);
    }
  },

  // Load ALL cards including hidden (for history panel)
  loadAllCards: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const cards = await loadAllUserGenerations();
      set({ cards, isLoading: false, isHydrated: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load all cards';
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to load all generated cards:', error);
    }
  },

  // Add a new generation
  addGeneration: async (cardType, data, settings) => {
    const { currentBatchId, cards } = get();
    const batchId = currentBatchId || `batch_${Date.now()}`;
    
    // Calculate position based on existing cards in this batch
    const batchCards = cards.filter(c => c.generationBatchId === batchId);
    const position = batchCards.length;

    // Generate thumbnail and aspect ratio
    const thumbnailUrl = generateThumbnailUrl(cardType, data);
    const aspectRatio = calculateAspectRatio(cardType, data);

    try {
      const generationId = await saveGeneration({
        cardType,
        data,
        settings,
        batchId,
        position,
        aspectRatio,
        thumbnailUrl,
      });

      // Create optimistic card object
      const newCard: GeneratedCard = {
        id: generationId,
        userId: '', // Will be set by backend
        cardType,
        generationId,
        generationBatchId: batchId,
        snapshot: {
          data,
          settings,
          timestamp: Date.now(),
        },
        dragOffsetX: 0,
        dragOffsetY: 0,
        isPinned: false,
        isHidden: false,
        displayOrder: position,
        aspectRatio,
        thumbnailUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically update UI
      set({ cards: [...cards, newCard] });

      return generationId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add generation';
      set({ error: errorMessage });
      console.error('Failed to add generation:', error);
      throw error;
    }
  },

  // Remove a card (permanent delete)
  removeCard: async (generationId) => {
    const { cards } = get();
    
    // Optimistically remove from UI
    set({ cards: cards.filter(c => c.generationId !== generationId) });

    try {
      await deleteGeneration(generationId);
    } catch (error) {
      // Rollback on error
      set({ cards });
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove card';
      set({ error: errorMessage });
      console.error('Failed to remove card:', error);
      throw error;
    }
  },

  // Hide a card from main screen (keeps in history)
  hideCard: async (generationId) => {
    const { cards } = get();
    
    // Optimistically remove from UI
    set({ cards: cards.filter(c => c.generationId !== generationId) });

    try {
      await hideCardGeneration(generationId);
    } catch (error) {
      // Rollback on error
      set({ cards });
      const errorMessage = error instanceof Error ? error.message : 'Failed to hide card';
      set({ error: errorMessage });
      console.error('Failed to hide card:', error);
      throw error;
    }
  },

  // Restore a hidden card to main screen
  restoreCard: async (generationId) => {
    const { cards } = get();
    
    try {
      await restoreCardGeneration(generationId);
      
      // Reload cards to show the restored one
      const updatedCards = await loadUserGenerations();
      set({ cards: updatedCards });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore card';
      set({ error: errorMessage });
      console.error('Failed to restore card:', error);
      throw error;
    }
  },

  // Update card position
  updatePosition: async (generationId, dragX, dragY, displayOrder) => {
    const { cards } = get();
    
    // Optimistically update UI
    const updatedCards = cards.map(card =>
      card.generationId === generationId
        ? { ...card, dragOffsetX: dragX, dragOffsetY: dragY, displayOrder }
        : card
    );
    set({ cards: updatedCards });

    try {
      await updateCardPosition(generationId, dragX, dragY, displayOrder);
    } catch (error) {
      // Rollback on error
      set({ cards });
      const errorMessage = error instanceof Error ? error.message : 'Failed to update position';
      set({ error: errorMessage });
      console.error('Failed to update card position:', error);
    }
  },

  // Toggle pin state
  togglePin: async (generationId) => {
    const { cards } = get();
    const card = cards.find(c => c.generationId === generationId);
    
    if (!card) return;

    // Optimistically update UI
    const updatedCards = cards.map(c =>
      c.generationId === generationId
        ? { ...c, isPinned: !c.isPinned }
        : c
    );
    set({ cards: updatedCards });

    try {
      await toggleCardPin(generationId);
    } catch (error) {
      // Rollback on error
      set({ cards });
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle pin';
      set({ error: errorMessage });
      console.error('Failed to toggle pin:', error);
    }
  },

  // Reorder cards (for drag-and-drop)
  reorderCards: async (newOrder) => {
    const { cards } = get();
    
    // Create position update map
    const updates = newOrder.map((generationId, index) => {
      const card = cards.find(c => c.generationId === generationId);
      return {
        generationId,
        dragX: card?.dragOffsetX || 0,
        dragY: card?.dragOffsetY || 0,
        displayOrder: index,
      };
    });

    // Optimistically update UI
    const updatedCards = cards.map(card => {
      const update = updates.find(u => u.generationId === card.generationId);
      return update ? { ...card, displayOrder: update.displayOrder } : card;
    });
    
    // Sort by display order
    updatedCards.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return a.displayOrder - b.displayOrder;
    });
    
    set({ cards: updatedCards });

    try {
      await batchUpdatePositions(updates);
    } catch (error) {
      // Rollback on error
      set({ cards });
      const errorMessage = error instanceof Error ? error.message : 'Failed to reorder cards';
      set({ error: errorMessage });
      console.error('Failed to reorder cards:', error);
    }
  },

  // Set current batch ID
  setCurrentBatchId: (batchId) => {
    set({ currentBatchId: batchId });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Selectors
  getCardsByType: (cardType) => {
    return get().cards.filter(card => card.cardType === cardType);
  },

  getPinnedCards: () => {
    return get().cards.filter(card => card.isPinned);
  },

  getCardsByBatch: (batchId) => {
    return get().cards.filter(card => card.generationBatchId === batchId);
  },
}));

// Helper hook for loading cards on mount
export function useLoadGeneratedCards() {
  const { loadCards, isHydrated } = useGeneratedCardsStore();

  // Load cards on mount if not already hydrated
  useEffect(() => {
    if (!isHydrated) {
      loadCards();
    }
  }, [isHydrated, loadCards]);
}
