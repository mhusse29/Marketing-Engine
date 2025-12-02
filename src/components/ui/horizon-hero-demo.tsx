import { Component } from './horizon-hero-section';
import MediaPlanScrollSection from './media-plan-scroll-section';
import '../../styles/horizon-hero.css';
import '../../styles/headline-wrapper.css';

/**
 * Demo component for HorizonHeroSection
 * Use this as a standalone page or integrate into your routing
 */
export default function HorizonHeroDemo() {
  return (
    <div style={{ width: '100%', overflow: 'visible', position: 'relative' }}>
      <Component />
      
      {/* Spacer to ensure smooth transition */}
      <div style={{ 
        height: '50vh', 
        background: 'linear-gradient(to bottom, #000000, #0a0a1a)',
        position: 'relative',
        zIndex: 10
      }} />
      
      <div style={{ position: 'relative', zIndex: 100, pointerEvents: 'auto', background: '#000' }}>
        <MediaPlanScrollSection />
      </div>
    </div>
  );
}
