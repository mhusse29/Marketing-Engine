import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ScrollVideoSectionProps {
  videoSrc: string;
  posterSrc?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaAction?: () => void;
}

export const ScrollVideoSection: React.FC<ScrollVideoSectionProps> = ({
  videoSrc,
  posterSrc,
  title = "Stop Guessing.",
  subtitle = "Start Planning.",
  ctaText = "Launch Media Plan Calculator",
  ctaAction,
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const handleCTA = () => {
    if (ctaAction) {
      ctaAction();
    } else {
      navigate('/media-plan-calculator');
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let gsap: any;
    let ScrollTrigger: any;

    const initAnimation = async () => {
      try {
        // Import GSAP and ScrollTrigger
        const gsapModule = await import('gsap');
        gsap = gsapModule.gsap || gsapModule.default;

        const ScrollTriggerModule = await import('gsap/ScrollTrigger').catch(() =>
          import('gsap/dist/ScrollTrigger')
        );
        ScrollTrigger = ScrollTriggerModule.ScrollTrigger || ScrollTriggerModule.default;

        gsap.registerPlugin(ScrollTrigger);

        const container = containerRef.current;
        const video = videoRef.current;
        const overlay = overlayRef.current;
        const progressBar = progressBarRef.current;
        const text = textRef.current;

        if (!container || !video || !overlay || !progressBar || !text) return;

        // Calculate section height (300vh for smooth progression)
        const sectionHeight = window.innerHeight * 3;
        container.style.height = `${sectionHeight}px`;

        // Create ScrollTrigger directly (no timeline needed for onUpdate approach)
        ScrollTrigger.create({
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
          // markers: true, // Uncomment for debugging
          onUpdate: (self: any) => {
              const progress = self.progress;
              
              // Phase 1: Card emergence (0 - 0.25)
              if (progress <= 0.25) {
                const phase1Progress = progress / 0.25;
                const scale = 0.3 + (phase1Progress * 0.7); // 0.3 → 1.0
                const borderRadius = 20 - (phase1Progress * 20); // 20px → 0px
                
                gsap.set(video, {
                  scale: scale,
                  borderRadius: `${borderRadius}px`,
                  y: 0,
                  opacity: 1,
                });
                
                gsap.set(overlay, { opacity: 0 });
                gsap.set(text, { opacity: 0, y: 30 });
                gsap.set(progressBar, { scaleX: 0 });
              }
              // Phase 2: Overlay phase (0.25 - 0.6)
              else if (progress <= 0.6) {
                const phase2Progress = (progress - 0.25) / 0.35; // 0 → 1
                
                gsap.set(video, {
                  scale: 1,
                  borderRadius: '0px',
                  y: 0,
                  opacity: 1,
                });
                
                gsap.set(overlay, { opacity: 0.6 });
                gsap.set(text, { 
                  opacity: phase2Progress,
                  y: 30 - (phase2Progress * 30) // 30 → 0
                });
                gsap.set(progressBar, { scaleX: phase2Progress });
              }
              // Phase 3: Collapse / exit (0.6 - 1.0)
              else {
                const phase3Progress = (progress - 0.6) / 0.4; // 0 → 1
                
                gsap.set(video, {
                  scale: 1,
                  borderRadius: '0px',
                  scaleY: 1 - (phase3Progress * 0.8), // 1.0 → 0.2
                  y: -(phase3Progress * 200), // Slide up
                  opacity: 1 - (phase3Progress * 0.5),
                });
                
                gsap.set(overlay, { opacity: 0.6 - (phase3Progress * 0.6) });
                gsap.set(text, { 
                  opacity: 1 - phase3Progress,
                  y: -(phase3Progress * 50)
                });
                gsap.set(progressBar, { scaleX: 1 });
                
                // Darken background
                if (container) {
                  container.style.backgroundColor = `rgba(0, 0, 0, ${phase3Progress * 0.9})`;
                }
              }
            }
        });

        // Video autoplay handling
        if (video) {
          video.play().catch(() => {
            // Autoplay failed, which is fine
          });
        }

      } catch (error) {
        console.error('Failed to initialize scroll animation:', error);
      }
    };

    initAnimation();

    return () => {
      if (ScrollTrigger) {
        ScrollTrigger.getAll().forEach((trigger: any) => {
          if (containerRef.current?.contains(trigger.trigger)) {
            trigger.kill();
          }
        });
      }
    };
  }, [isVideoLoaded]);

  return (
    <div 
      ref={containerRef}
      className="scroll-video-section"
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#000',
        zIndex: 15,
      }}
    >
      {/* Sticky container */}
      <div 
        className="sticky-wrapper"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transformOrigin: 'center center',
            willChange: 'transform',
            scale: '0.3',
            borderRadius: '20px',
          }}
        />

        {/* Overlay */}
        <div
          ref={overlayRef}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
            opacity: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* Progress bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              ref={progressBarRef}
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, #7c3aed, #22d3ee)',
                transformOrigin: 'left',
                transform: 'scaleX(0)',
              }}
            />
          </div>

          {/* Text content */}
          <div
            ref={textRef}
            style={{
              textAlign: 'center',
              color: '#fff',
              padding: '2rem',
              maxWidth: '800px',
              opacity: 0,
              transform: 'translateY(30px)',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(40px, 8vw, 96px)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                margin: '0 0 1rem 0',
                background: 'linear-gradient(90deg, #fff 0%, #fff 50%, #22d3ee 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {title}
            </h2>
            <p
              style={{
                fontSize: 'clamp(18px, 3.5vw, 28px)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#9ca3af',
                margin: '0 0 2rem 0',
              }}
            >
              {subtitle}
            </p>
            <button
              onClick={handleCTA}
              style={{
                padding: '1rem 2.5rem',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#fff',
                background: 'linear-gradient(135deg, #7c3aed, #22d3ee)',
                border: 'none',
                borderRadius: '999px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 10px 30px rgba(124, 58, 237, 0.3)',
                pointerEvents: 'auto',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(124, 58, 237, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(124, 58, 237, 0.3)';
              }}
            >
              {ctaText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrollVideoSection;
