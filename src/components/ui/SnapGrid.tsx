import { useMemo } from 'react';
import { SNAP_GRID_SIZE } from '@/utils/dragUtils';

interface SnapGridProps {
  /** Whether to show the grid overlay */
  visible?: boolean;
  /** Grid size in pixels */
  gridSize?: number;
  /** Grid opacity (0-1) */
  opacity?: number;
  /** Grid color */
  color?: string;
}

/**
 * Visual grid overlay to show snapping positions during drag operations
 */
export function SnapGrid({ 
  visible = false, 
  gridSize = SNAP_GRID_SIZE, 
  opacity = 0.1,
  color = '#ffffff'
}: SnapGridProps) {
  const gridStyle = useMemo(() => {
    if (!visible) return { display: 'none' };

    return {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none' as const,
      zIndex: 1000,
      opacity,
      backgroundImage: `
        linear-gradient(to right, ${color} 1px, transparent 1px),
        linear-gradient(to bottom, ${color} 1px, transparent 1px)
      `,
      backgroundSize: `${gridSize}px ${gridSize}px`,
    };
  }, [visible, gridSize, opacity, color]);

  if (!visible) return null;

  return <div style={gridStyle} aria-hidden="true" />;
}

/**
 * Hook to show grid during drag operations
 */
export function useSnapGridVisibility() {
  // This could be enhanced to automatically show/hide during drag
  // For now, it's a simple state that can be controlled externally
  return {
    showGrid: false, // Would be true during drag
    setShowGrid: () => {}, // Would toggle grid visibility
  };
}
