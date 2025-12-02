import React from 'react';
import { Component as HorizonHeroSection } from '../components/ui/horizon-hero-section';
import MediaPlanScrollSection from '../components/ui/media-plan-scroll-section';
import '../styles/horizon-hero.css';
import '../styles/headline-wrapper.css';

/**
 * Landing Page - Public facing hero section for SINAIQ Marketing Engine
 * Features cosmic Three.js animation with scroll-based transitions
 */
export default function LandingPage() {
  return (
    <>
      {/* Hero Section with Three.js Scene */}
      <HorizonHeroSection />
      
      {/* Media Plan Calculator Section - pushes up from below as continuous paper */}
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
