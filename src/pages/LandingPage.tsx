import { Component as HorizonHeroSection } from '../components/ui/horizon-hero-section';
import MediaPlanScrollSection from '../components/ui/media-plan-scroll-section';
import NavigationMenu from '../components/ui/navigation-menu';
import ScrollProgressIndicator from '../components/ui/scroll-progress-indicator';
import '../styles/horizon-hero.css';
import '../styles/headline-wrapper.css';

/**
 * Landing Page - Public facing hero section for SINAIQ Marketing Engine
 * Features cosmic Three.js animation with scroll-based transitions
 * Landing-page-2 (Explore) is accessible via hamburger menu
 * 
 * Total sections breakdown:
 * - Mountain scene: 3 (CREATE, AMPLIFY, ELEVATE)
 * - Lamp section: 1
 * - Skiper28: 5 slides
 * - Pricing: 1
 * - Footer: 1
 * Total: 11 sections
 */
export default function LandingPage() {
  return (
    <>
      {/* Global Navigation Menu - visible on all sections */}
      <NavigationMenu />
      
      {/* Global Scroll Progress Indicator - visible across all sections */}
      <ScrollProgressIndicator totalSections={11} />
      
      {/* Hero Section with Three.js Scene */}
      <HorizonHeroSection />
      
      {/* Media Plan Calculator Section - includes Skiper28 with 5 slides */}
      <div style={{ 
        minHeight: '350vh', 
        background: '#000',
        position: 'relative',
        zIndex: 15
      }}>
        <MediaPlanScrollSection />
      </div>
    </>
  );
}
