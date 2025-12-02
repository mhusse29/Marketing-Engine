/**
 * Drag and Drop Utilities
 * Provides snapping, constraints, and position helpers for card dragging
 */

export const SNAP_GRID_SIZE = 24; // 24px grid for alignment

/**
 * Snaps a coordinate to the nearest grid position
 */
export function snapToGrid(value: number, gridSize: number = SNAP_GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snaps a position object to the grid
 */
export function snapPositionToGrid(position: { x: number; y: number }): { x: number; y: number } {
  return {
    x: snapToGrid(position.x),
    y: snapToGrid(position.y),
  };
}

/**
 * Constrains position within viewport bounds
 */
export function constrainToViewport(
  position: { x: number; y: number },
  elementSize: { width: number; height: number },
  viewportSize: { width: number; height: number },
  padding: number = 16
): { x: number; y: number } {
  const minX = padding;
  const minY = padding;
  const maxX = viewportSize.width - elementSize.width - padding;
  const maxY = viewportSize.height - elementSize.height - padding;

  return {
    x: Math.max(minX, Math.min(maxX, position.x)),
    y: Math.max(minY, Math.min(maxY, position.y)),
  };
}

/**
 * Combines snapping and viewport constraints
 */
export function processCardPosition(
  rawPosition: { x: number; y: number },
  elementSize: { width: number; height: number },
  viewportSize: { width: number; height: number },
  options: {
    enableSnapping?: boolean;
    enableConstraints?: boolean;
    gridSize?: number;
    padding?: number;
  } = {}
): { x: number; y: number } {
  const {
    enableSnapping = true,
    enableConstraints = true,
    gridSize = SNAP_GRID_SIZE,
    padding = 16,
  } = options;

  let position = { ...rawPosition };

  // Apply snapping first
  if (enableSnapping) {
    position = {
      x: snapToGrid(position.x, gridSize),
      y: snapToGrid(position.y, gridSize),
    };
  }

  // Then apply viewport constraints
  if (enableConstraints) {
    position = constrainToViewport(position, elementSize, viewportSize, padding);
  }

  return position;
}

/**
 * Debounce utility for batching position updates
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * Gets current viewport size
 */
export function getViewportSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 720 }; // Default for SSR
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Gets element bounding box
 */
export function getElementSize(element: HTMLElement): { width: number; height: number } {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
  };
}
