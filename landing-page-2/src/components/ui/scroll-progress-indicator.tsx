"use client";

import { useState, useEffect, useRef } from 'react';

interface ScrollProgressIndicatorProps {
  totalSections?: number;
}

export default function ScrollProgressIndicator({ totalSections = 10 }: ScrollProgressIndicatorProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(1);
  const docHeightRef = useRef(0);

  useEffect(() => {
    // Get document height
    const getDocHeight = () => {
      return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      ) - window.innerHeight;
    };

    // Calculate and update progress
    const updateProgress = () => {
      // Always get fresh document height
      docHeightRef.current = getDocHeight();
      
      const scrollTop = window.scrollY || window.pageYOffset;
      const maxScroll = docHeightRef.current > 0 ? docHeightRef.current : 1;
      
      // Calculate progress (0 to 1)
      const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
      
      setScrollProgress(progress);
      
      // Calculate current section (1-indexed)
      const section = Math.min(
        Math.max(Math.ceil(progress * totalSections), 1),
        totalSections
      );
      setCurrentSection(section);
    };

    // Scroll handler
    const handleScroll = () => {
      requestAnimationFrame(updateProgress);
    };

    // Initial calculation
    updateProgress();

    // Listen for scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    
    // Recalculate periodically as content loads
    const intervals = [100, 300, 500, 1000, 2000];
    const timeouts = intervals.map(ms => setTimeout(updateProgress, ms));
    
    // Observe body size changes
    const observer = new ResizeObserver(() => {
      updateProgress();
    });
    observer.observe(document.body);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateProgress);
      observer.disconnect();
      timeouts.forEach(clearTimeout);
    };
  }, [totalSections]);

  const progressHeight = `${Math.round(scrollProgress * 100)}%`;

  return (
    <div className="scroll-progress-global">
      <div className="scroll-text">SCROLL</div>
      <div className="progress-track">
        <div 
          className="progress-fill" 
          style={{ 
            height: progressHeight,
            minHeight: scrollProgress > 0 ? '2px' : '0'
          }}
        />
      </div>
      <div className="section-counter">
        {String(currentSection).padStart(2, '0')} / {String(totalSections).padStart(2, '0')}
      </div>
    </div>
  );
}
