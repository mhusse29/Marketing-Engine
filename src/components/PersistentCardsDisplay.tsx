/**
 * Persistent Cards Display
 * Renders all saved cards from the persistent store in the main app view
 * Replaces the temporary card display system with permanent storage
 */

import { useMemo, useCallback, useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useGeneratedCardsStore } from '../store/useGeneratedCardsStore';
import ContentCard from './Cards/ContentCard';
import { PicturesCard } from './Cards/PicturesCard';
import { VideoCard } from './Cards/VideoCard';
import SmartOutputGrid from './Outputs/SmartOutputGrid';
import DraggableCard from './Outputs/DraggableCard';
import type { CardKey, SettingsState, ContentGenerationMeta, ContentVariantResult, GeneratedPictures, GeneratedVideo } from '../types';

interface PersistentCardsDisplayProps {
  settings: SettingsState;
  cardsEnabled: Record<CardKey, boolean>;
  cardsOrder: CardKey[];
  cardsPinned: Record<CardKey, boolean>;
  hiddenCardTypes: Set<CardKey>;
  cardOffsets: Record<CardKey, { x: number; y: number }>;
}

export default function PersistentCardsDisplay({
  settings,
  cardsEnabled,
  cardsOrder,
  cardsPinned,
  hiddenCardTypes,
  cardOffsets,
}: PersistentCardsDisplayProps) {
  const { cards, reorderCards, hideCard } = useGeneratedCardsStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Store cardItems in a ref to avoid circular dependencies
  const cardItemsRef = useRef<Array<{ id: string; cardType: CardKey; layoutId: string; element: ReactNode; displayOrder: number; isPinned: boolean }>>([]);
  
  // Convert Set to Array to prevent reference changes
  const hiddenCardTypesArray = useMemo(() => Array.from(hiddenCardTypes), [hiddenCardTypes.size]);

  // Configure sensors for smooth dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Convert persistent cards to display items  
  const cardItems = useMemo(() => {
    const items: Array<{ id: string; cardType: CardKey; layoutId: string; element: ReactNode; displayOrder: number; isPinned: boolean }> = [];

    // Process cards (no duplicates found in database)
    cards.forEach((card) => {

      // Skip if card is hidden (user clicked X button)
      if (card.isHidden) {
        return;
      }

      // Skip if card type is disabled or hidden
      if (!cardsEnabled[card.cardType] || hiddenCardTypesArray.includes(card.cardType)) {
        return;
      }

      const snapshot = card.snapshot;
      let element: ReactNode = null;

      // Skip if snapshot data hasn't loaded yet (progressive loading)
      if (!snapshot?.data) {
        return;
      }

      // Render based on card type
      if (card.cardType === 'content') {
        const data = snapshot.data as { 
          variants?: ContentVariantResult[] | ContentVariantResult[][]; 
          meta?: ContentGenerationMeta 
        };
        
        // Handle different variants structures:
        // 1. Array of arrays: [[variant1, variant2]] - nested
        // 2. Flat array: [variant1, variant2] - already flat
        // 3. Single object: {platform: 'Facebook', ...} - wrap in array
        let flatVariants: ContentVariantResult[] = [];
        
        if (Array.isArray(data.variants)) {
          if (data.variants.length > 0) {
            // Check if first item is an array (nested structure)
            if (Array.isArray(data.variants[0])) {
              flatVariants = data.variants[0] as ContentVariantResult[];
            } else {
              // Already flat - but check if items are valid variant objects
              flatVariants = (data.variants as ContentVariantResult[]).filter(v => 
                v && typeof v === 'object' && 'platform' in v
              );
            }
          }
        } else if (data.variants && typeof data.variants === 'object' && 'platform' in data.variants) {
          // Single variant object with platform property
          flatVariants = [data.variants as ContentVariantResult];
        }
        
        if (flatVariants.length > 0) {
          element = (
            <ContentCard
              status="ready"
              variants={flatVariants}
              meta={data.meta}
              error={undefined}
              briefText=""
              options={{}}
              platformIds={settings.platforms}
              versions={settings.versions}
              runId={null}
              onRegenerate={() => {}}
              onHide={() => hideCard(card.generationId)}
            />
          );
        }
      } else if (card.cardType === 'pictures') {
        const data = snapshot.data as { versions?: GeneratedPictures[] };
        if (data.versions && data.versions.length > 0) {
          element = (
            <PicturesCard
              pictures={data.versions}
              currentVersion={0}
              status="ready"
              onHide={() => hideCard(card.generationId)}
            />
          );
        }
      } else if (card.cardType === 'video') {
        // Video structure: { versions: GeneratedVideo[] } where GeneratedVideo has url directly
        const data = snapshot.data as { versions?: GeneratedVideo[] };
        if (data.versions && data.versions.length > 0 && data.versions[0].url) {
          element = (
            <VideoCard
              videos={data.versions}
              status="ready"
              onHide={() => hideCard(card.generationId)}
            />
          );
        }
      }

      if (element) {
        // Ensure unique ID - use generationId if available, otherwise create from cardType + dbId
        const uniqueId = card.generationId || `${card.cardType}-${card.id || Date.now()}`;
        
        items.push({
          id: uniqueId,
          cardType: card.cardType,
          layoutId: `persistent-card-${uniqueId}`,
          element,
          displayOrder: card.displayOrder,
          isPinned: card.isPinned,
        });
      }
    });

    // Sort: pinned first, then by display order, then by card type order
    const orderMap = new Map(cardsOrder.map((cardType, index) => [cardType, index]));
    return items.sort((a, b) => {
      // Pinned cards first
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      // Then by card type pinned state
      const aTypePinned = Boolean(cardsPinned[a.cardType]);
      const bTypePinned = Boolean(cardsPinned[b.cardType]);
      if (aTypePinned !== bTypePinned) {
        return aTypePinned ? -1 : 1;
      }
      // Then by display order
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      // Finally by card type order
      const aTypeOrder = orderMap.get(a.cardType) ?? 999;
      const bTypeOrder = orderMap.get(b.cardType) ?? 999;
      return aTypeOrder - bTypeOrder;
    });
  }, [cards, cardsEnabled, hiddenCardTypesArray, settings.platforms, settings.versions, cardsOrder, cardsPinned]);
  
  // Store cardItems in ref for handleDragEnd
  useEffect(() => {
    cardItemsRef.current = cardItems;
  }, [cardItems]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end to update card order
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      // Use ref to get latest cardItems without creating dependency
      const currentItems = cardItemsRef.current;
      const oldIndex = currentItems.findIndex((item) => item.id === active.id);
      const newIndex = currentItems.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Create new order based on IDs
      const newOrder = currentItems.map(item => item.id);
      const [moved] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, moved);

      // Update persistent store
      reorderCards(newOrder);
    },
    [reorderCards]
  );

  if (cardItems.length === 0) {
    return null;
  }

  return (
    <LayoutGroup id="persistent-cards">
      <AnimatePresence mode="popLayout">
        <motion.section
          key={`persistent-cards-${cardItems.length}`}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 28,
            mass: 0.6,
          }}
          className="outputs-stage relative flex-1"
          aria-label="Generated outputs"
        >
          <div className="h-full w-full">
            <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-6 pb-20 pt-8">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={cardItems.map((item) => item.id)}
                  strategy={rectSortingStrategy}
                >
                  <SmartOutputGrid
                    cardCount={Math.max(cardItems.length, 3)}
                    isGenerating={false}
                  >
                    {cardItems.map((item) => (
                      <DraggableCard
                        key={item.id}
                        id={item.id}
                        layoutId={item.layoutId}
                        offset={cardOffsets[item.cardType]}
                      >
                        {item.element}
                      </DraggableCard>
                    ))}
                  </SmartOutputGrid>
                </SortableContext>
                <DragOverlay
                  dropAnimation={null}
                  style={{ 
                    pointerEvents: 'none',
                  }}
                >
                  {activeId ? (
                    <div
                      style={{
                        cursor: 'grabbing',
                        opacity: 1,
                        filter: 'none',
                        transform: 'none',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                      }}
                      className="drag-overlay-content"
                    >
                      {cardItems.find((item) => item.id === activeId)?.element}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        </motion.section>
      </AnimatePresence>
    </LayoutGroup>
  );
}
