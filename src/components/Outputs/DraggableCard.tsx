import React, { useEffect, useRef, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import './DraggableCard.css';

interface DraggableCardProps {
  id: string;
  layoutId: string;
  children: ReactNode;
  offset?: {
    x: number;
    y: number;
  };
}

export default function DraggableCard({ id, layoutId, offset, children }: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ 
    id,
    transition: {
      duration: 350,
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    },
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const prevDraggingRef = useRef<boolean>(false);

  // Check if an element is an interactive element (simplified to only block actual interactive elements)
  const isInteractiveElement = useCallback((element: HTMLElement | null): boolean => {
    if (!element) return false;

    // Only block actual interactive elements
    const tagName = element.tagName.toLowerCase();
    const interactiveTags = ['button', 'input', 'textarea', 'select', 'a'];
    
    // Check the element itself
    if (interactiveTags.includes(tagName)) return true;
    
    // Check for role="button"
    if (element.getAttribute('role') === 'button') return true;
    
    // Check for explicit data-no-drag attribute
    if (element.hasAttribute('data-no-drag')) return true;

    // Check immediate parent only (not 3 levels deep)
    const parent = element.parentElement;
    if (parent) {
      const parentTagName = parent.tagName.toLowerCase();
      if (interactiveTags.includes(parentTagName)) return true;
      if (parent.getAttribute('role') === 'button') return true;
      if (parent.hasAttribute('data-no-drag')) return true;
    }

    return false;
  }, []);

  // Custom drag handler that respects interactive elements
  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    
    // If clicking on an interactive element, don't start drag
    if (isInteractiveElement(target)) {
      return;
    }
    
    // Otherwise, use the default drag behavior
    // Pass the React event directly, not nativeEvent
    if (listeners?.onPointerDown && typeof listeners.onPointerDown === 'function') {
      try {
        // dnd-kit expects the PointerEvent, not nativeEvent
        listeners.onPointerDown(event as any);
      } catch (error) {
        console.error('❌ Drag start error:', error);
      }
    }
  }, [listeners, isInteractiveElement]);

  // Mark as dragging and disable InteractiveCardWrapper when dragging
  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    if (isDragging) {
      element.setAttribute('data-dragging', 'true');
      element.classList.add('is-dragging');
      
      // Disable pointer events on InteractiveCardWrapper
      const interactiveWrapper = element.querySelector('.interactive-card-wrapper');
      if (interactiveWrapper) {
        (interactiveWrapper as HTMLElement).style.pointerEvents = 'none';
      }
      
      // Hide heavy elements during drag
      const platformRails = element.querySelectorAll('[class*="platform-rail"]');
      platformRails.forEach(rail => {
        (rail as HTMLElement).style.visibility = 'hidden';
      });
      
      const platformIcons = element.querySelectorAll('[class*="platform-icon"]');
      platformIcons.forEach(icon => {
        (icon as HTMLElement).style.visibility = 'hidden';
      });
    } else {
      element.removeAttribute('data-dragging');
      element.classList.remove('is-dragging');
      
      const interactiveWrapper = element.querySelector('.interactive-card-wrapper');
      if (interactiveWrapper) {
        (interactiveWrapper as HTMLElement).style.pointerEvents = '';
      }
      
      // Restore heavy elements after drag
      const platformRails = element.querySelectorAll('[class*="platform-rail"]');
      platformRails.forEach(rail => {
        (rail as HTMLElement).style.visibility = '';
      });
      
      const platformIcons = element.querySelectorAll('[class*="platform-icon"]');
      platformIcons.forEach(icon => {
        (icon as HTMLElement).style.visibility = '';
      });
    }
  }, [isDragging]);

  // Update dragging ref
  useEffect(() => {
    prevDraggingRef.current = isDragging;
  }, [isDragging]);

  // During drag, allow free movement following the cursor
  // After drag, smoothly transition to grid position using dnd-kit's transform
  const composedTransform = transform
    ? {
        ...transform,
        x: (transform.x ?? 0) + (offset?.x ?? 0),
        y: (transform.y ?? 0) + (offset?.y ?? 0),
      }
    : {
        x: offset?.x ?? 0,
        y: offset?.y ?? 0,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        rotate: 0,
      };

  const style = {
    transform: CSS.Transform.toString(composedTransform),
  };

  return (
    <motion.div
      ref={(node) => {
        setNodeRef(node);
        wrapperRef.current = node;
      }}
      layout
      layoutId={layoutId}
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: isDragging ? 0 : 1, // Hide original when dragging
        scale: 1, 
      }}
      exit={{ opacity: 0, scale: 0.98, y: 8 }}
      transition={{
        layout: {
          type: 'spring',
          stiffness: 350,
          damping: 30,
        },
        opacity: {
          duration: 0.15,
          ease: 'easeOut',
        },
        scale: {
          duration: 0.2,
          ease: 'easeOut',
        },
      }}
      style={{
        ...style,
        pointerEvents: isDragging ? 'none' : 'auto',
        touchAction: 'none',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      {...attributes}
      onPointerDown={handlePointerDown}
      className="draggable-card relative group"
      data-dragging={isDragging}
      data-draggable-card="true"
    >
      {children}
    </motion.div>
  );
}
