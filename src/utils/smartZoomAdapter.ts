/**
 * Smart Zoom Adapter - Detects zoom and automatically adjusts layout
 * Does NOT prevent zoom - just adapts the layout intelligently
 */

export class SmartZoomAdapter {
  private baseScale = 1;
  private currentZoomLevel = 1;
  private observers: Set<(zoomLevel: number) => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    // Use Visual Viewport API for accurate zoom detection
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        this.detectAndAdapt();
      });
      
      window.visualViewport.addEventListener('scroll', () => {
        this.detectAndAdapt();
      });
    }

    // Fallback for older browsers
    window.addEventListener('resize', () => {
      this.detectAndAdapt();
    });

    // Initial detection
    this.detectAndAdapt();
  }

  private detectAndAdapt() {
    const newZoomLevel = this.calculateZoomLevel();
    
    if (Math.abs(newZoomLevel - this.currentZoomLevel) > 0.01) {
      this.currentZoomLevel = newZoomLevel;
      this.adaptLayout(newZoomLevel);
      this.notifyObservers(newZoomLevel);
    }
  }

  private calculateZoomLevel(): number {
    if (window.visualViewport) {
      return window.visualViewport.scale;
    }
    
    // Fallback calculation
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenWidth = window.screen.width;
    const windowWidth = window.innerWidth;
    
    return (screenWidth / windowWidth) / devicePixelRatio;
  }

  private adaptLayout(zoomLevel: number) {
    const root = document.documentElement;
    
    // Calculate adaptive font size based on zoom
    const baseFontSize = 16; // px
    const adaptiveFontSize = baseFontSize / zoomLevel;
    
    // Apply adaptive CSS variables
    root.style.setProperty('--zoom-level', zoomLevel.toString());
    root.style.setProperty('--adaptive-font-size', `${adaptiveFontSize}px`);
    root.style.setProperty('--adaptive-spacing', `${1 / zoomLevel}rem`);
    
    // Add zoom class for CSS targeting
    root.setAttribute('data-zoom-level', 
      zoomLevel > 1.2 ? 'zoomed-in' : 
      zoomLevel < 0.8 ? 'zoomed-out' : 
      'normal'
    );
  }

  public subscribe(callback: (zoomLevel: number) => void) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(zoomLevel: number) {
    this.observers.forEach(callback => callback(zoomLevel));
  }

  public getCurrentZoomLevel(): number {
    return this.currentZoomLevel;
  }
}

// Singleton instance
export const smartZoomAdapter = new SmartZoomAdapter();
