import React from 'react';

// Shared grid constants for perfect seam alignment
const GRID_PX = 96;
const LINE_PX = 1;
const LINE_ALPHA = 0.35; // Enhanced for premium glow effect - increased visibility
const LINE_COLOR = `rgba(62, 139, 255, ${LINE_ALPHA})`; // Brand blue with glow

// Enhanced grid with subtle glow effect
const gridImage = `linear-gradient(to right, ${LINE_COLOR} ${LINE_PX}px, transparent 0), linear-gradient(to bottom, ${LINE_COLOR} ${LINE_PX}px, transparent 0)`;

export function TwoDimensionStackedGrid() {
  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: 'transparent' }}>
      {/* Split wrapper */}
      <div className="absolute inset-0 flex flex-col">
        
        {/* WALL - Top Half (vertical plane) */}
        <div className="relative h-1/2 w-full overflow-hidden">
          <div
            className="absolute inset-0 premium-grid-glow"
            style={{
              opacity: 0.8,
              transform: 'perspective(800px) translateY(0px) translateZ(-10px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
              transformOrigin: '50% 50% 0',
              backgroundImage: gridImage,
              backgroundSize: `${GRID_PX}px ${GRID_PX}px`,
              backgroundRepeat: 'repeat',
              backgroundPosition: '50% 100%', // Anchor to bottom edge (seam)
              filter: 'drop-shadow(0 0 2px rgba(62, 139, 255, 0.4)) drop-shadow(0 0 4px rgba(62, 139, 255, 0.2))',
            }}
          />
          {/* Enhanced bottom fade for ambient lighting */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.6))' }}
          />
          {/* Left edge fade */}
          <div
            className="absolute inset-y-0 left-0 w-48 pointer-events-none"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.5), transparent)' }}
          />
          {/* Right edge fade */}
          <div
            className="absolute inset-y-0 right-0 w-48 pointer-events-none"
            style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.5), transparent)' }}
          />
        </div>

        {/* FLOOR - Bottom Half (horizontal tilted plane) */}
        <div className="relative h-1/2 w-full overflow-hidden">
          <div
            className="absolute left-0 w-full premium-grid-glow"
            style={{
              top: 0,
              height: '120vh',
              opacity: 0.7,
              transform: 'perspective(800px) translateY(0px) translateZ(-20px) rotateX(50deg) rotateY(0deg) rotateZ(0deg)',
              transformOrigin: '50% 0% 0',
              backgroundImage: gridImage,
              backgroundSize: `${GRID_PX}px ${GRID_PX}px`,
              backgroundRepeat: 'repeat',
              backgroundPosition: '50% 0%', // Anchor to top edge (seam)
              filter: 'drop-shadow(0 0 2px rgba(62, 139, 255, 0.4)) drop-shadow(0 0 4px rgba(62, 139, 255, 0.2))',
            }}
          />
          {/* Enhanced top fade for ambient lighting */}
          <div
            className="absolute inset-x-0 top-0 h-32 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0), rgba(0,0,0,0.7))' }}
          />
          {/* Left edge fade */}
          <div
            className="absolute inset-y-0 left-0 w-48 pointer-events-none"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.5), transparent)' }}
          />
          {/* Right edge fade */}
          <div
            className="absolute inset-y-0 right-0 w-48 pointer-events-none"
            style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.5), transparent)' }}
          />
        </div>
      </div>

      {/* Premium Radial Vignette - creates focus on center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 35%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Corner Accent Fades - Premium depth perception */}
      {/* Top-left corner */}
      <div
        className="absolute top-0 left-0 w-1/2 h-1/2 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top left, rgba(0,0,0,0.6) 0%, transparent 60%)',
        }}
      />
      {/* Top-right corner */}
      <div
        className="absolute top-0 right-0 w-1/2 h-1/2 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top right, rgba(0,0,0,0.6) 0%, transparent 60%)',
        }}
      />
      {/* Bottom-left corner */}
      <div
        className="absolute bottom-0 left-0 w-1/2 h-1/2 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at bottom left, rgba(0,0,0,0.6) 0%, transparent 60%)',
        }}
      />
      {/* Bottom-right corner */}
      <div
        className="absolute bottom-0 right-0 w-1/2 h-1/2 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at bottom right, rgba(0,0,0,0.6) 0%, transparent 60%)',
        }}
      />
    </div>
  );
}

