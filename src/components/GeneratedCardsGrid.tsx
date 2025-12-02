/**
 * Generated Cards Grid
 * Displays all generated cards in a responsive 3-column grid with drag-and-drop
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useGeneratedCardsStore } from '../store/useGeneratedCardsStore';
import type { GeneratedCard } from '../lib/cardPersistence';
import ContentVariantCard from '../cards/ContentVariantCard';
import { Pin, Trash2, Maximize2 } from 'lucide-react';

interface GeneratedCardsGridProps {
  className?: string;
}

export default function GeneratedCardsGrid({ className = '' }: GeneratedCardsGridProps) {
  const { cards, reorderCards, removeCard, togglePin } = useGeneratedCardsStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start dragging after 8px movement
      },
    })
  );

  // Sort cards: pinned first, then by display order
  const sortedCards = useMemo(() => {
    return [...cards]
      .filter(card => card && card.generationId) // Filter out null/undefined cards
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return a.displayOrder - b.displayOrder;
      });
  }, [cards]);

  const cardIds = useMemo(() => 
    sortedCards.map(c => c.generationId).filter(Boolean),
    [sortedCards]
  );

  // Don't render anything if there are no cards
  if (sortedCards.length === 0) {
    return null;
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = cardIds.indexOf(active.id as string);
    const newIndex = cardIds.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) return;

    // Create new order
    const newOrder = [...cardIds];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);

    reorderCards(newOrder);
  };

  const activeCard = sortedCards.find(c => c.generationId === activeId);

  if (cards.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center space-y-4">
          <div className="text-white/40 text-lg font-medium">No generations yet</div>
          <p className="text-white/30 text-sm max-w-md">
            Start generating content, pictures, or videos. They'll all be saved here automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={cardIds} strategy={rectSortingStrategy}>
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto ${className}`}
        >
          <AnimatePresence mode="popLayout">
            {sortedCards.map((card) => (
              <SortableCardWrapper
                key={card.generationId}
                card={card}
                onDelete={removeCard}
                onTogglePin={togglePin}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>

      <DragOverlay>
        {activeCard && (
          <div className="opacity-80 scale-105">
            <CardPreview card={activeCard} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

interface SortableCardWrapperProps {
  card: GeneratedCard;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

function SortableCardWrapper({ card, onDelete, onTogglePin }: SortableCardWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.generationId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative group"
    >
      {/* Card Controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(card.generationId);
          }}
          className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${
            card.isPinned
              ? 'bg-blue-500/30 text-blue-100'
              : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
          }`}
          title={card.isPinned ? 'Unpin' : 'Pin to top'}
        >
          <Pin size={14} className={card.isPinned ? 'fill-current' : ''} />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this generation?')) {
              onDelete(card.generationId);
            }
          }}
          className="p-2 rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30 backdrop-blur-sm transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Drag Handle */}
      <div
        {...listeners}
        className="absolute top-2 left-2 z-10 p-2 rounded-lg bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <Maximize2 size={14} className="text-white/60" />
      </div>

      {/* Card Content */}
      <div
        style={{
          aspectRatio: card.aspectRatio || 1,
        }}
      >
        <CardPreview card={card} />
      </div>

      {/* Metadata Footer */}
      <div className="mt-2 flex items-center justify-between text-xs text-white/40">
        <span className="capitalize">{card.cardType}</span>
        <span>{new Date(card.createdAt).toLocaleTimeString()}</span>
      </div>
    </motion.div>
  );
}

function CardPreview({ card }: { card: GeneratedCard }) {
  const { cardType, snapshot } = card;

  // Render appropriate card based on type
  if (cardType === 'content') {
    const data = snapshot.data as { variants?: Array<{ platform?: string; headline?: string; primary_text?: string; hashtags?: string[] }> };
    const variant = data.variants?.[0];
    
    return (
      <ContentVariantCard
        status="ready"
        variant={variant ? {
          platform: variant.platform || 'Generic',
          headline: variant.headline,
          caption: variant.primary_text,
          hashtags: variant.hashtags?.join(' '),
        } : null}
      />
    );
  }

  if (cardType === 'pictures') {
    const data = snapshot.data as { url?: string };
    return (
      <div className="w-full h-full rounded-2xl overflow-hidden bg-white/5 border border-white/10">
        {data.url ? (
          <img
            src={data.url}
            alt="Generated"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">
            No preview
          </div>
        )}
      </div>
    );
  }

  if (cardType === 'video') {
    const data = snapshot.data as { url?: string; thumbnailUrl?: string };
    return (
      <div className="w-full h-full rounded-2xl overflow-hidden bg-white/5 border border-white/10">
        {data.thumbnailUrl || data.url ? (
          <div className="relative w-full h-full">
            {data.thumbnailUrl && (
              <img
                src={data.thumbnailUrl}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">
            No preview
          </div>
        )}
      </div>
    );
  }

  return null;
}
