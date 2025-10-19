import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface TransitionEffectsProps {
  isActive: boolean;
  phase: string;
}

export default function TransitionEffects({ isActive, phase }: TransitionEffectsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ripplesRef = useRef<HTMLDivElement[]>([]);
  const raysRef = useRef<HTMLDivElement>(null);
  const chromaticRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Create ripple elements
    const createRipples = () => {
      const rippleCount = 5;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      for (let i = 0; i < rippleCount; i++) {
        const ripple = document.createElement('div');
        ripple.className = 'absolute rounded-full border-2 border-white/30';
        ripple.style.left = `${centerX}px`;
        ripple.style.top = `${centerY}px`;
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.pointerEvents = 'none';
        container.appendChild(ripple);
        ripplesRef.current.push(ripple);

        // Animate ripple
        gsap.to(ripple, {
          width: '1200px',
          height: '1200px',
          opacity: 0,
          borderWidth: '1px',
          duration: 2,
          delay: i * 0.15,
          ease: 'power2.out',
        });
      }
    };

    // Create light rays
    const createLightRays = () => {
      if (!raysRef.current) return;
      
      const rays = raysRef.current;
      
      gsap.fromTo(rays, 
        {
          opacity: 0,
          rotate: -45,
        },
        {
          opacity: 0.3,
          rotate: 45,
          duration: 1.5,
          ease: 'power2.inOut',
          onComplete: () => {
            gsap.to(rays, {
              opacity: 0,
              duration: 0.5,
            });
          },
        }
      );
    };

    // Create chromatic aberration effect
    const createChromaticEffect = () => {
      if (!chromaticRef.current) return;
      
      const chromatic = chromaticRef.current;
      
      gsap.to(chromatic, {
        opacity: 0.6,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut',
      });
    };

    // Trigger effects based on phase
    if (phase === 'liquid-collapse') {
      createRipples();
    } else if (phase === 'revealing') {
      createLightRays();
    } else if (phase === 'transitioning') {
      createChromaticEffect();
    }

    return () => {
      // Cleanup ripples
      ripplesRef.current.forEach(ripple => ripple.remove());
      ripplesRef.current = [];
    };
  }, [isActive, phase]);

  if (!isActive) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-40">
      {/* Light Rays */}
      <div
        ref={raysRef}
        className="absolute inset-0 opacity-0"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255, 255, 255, 0.03) 40px, rgba(255, 255, 255, 0.03) 80px)',
          transformOrigin: 'center center',
        }}
      />
      
      {/* Chromatic Aberration Overlay */}
      <div
        ref={chromaticRef}
        className="absolute inset-0 opacity-0 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(255, 0, 0, 0.1) 60%, rgba(0, 255, 255, 0.1) 80%)',
          animation: 'pulse 0.5s ease-in-out',
        }}
      />
      
      {/* Radial Glow Pulse */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-0"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: phase === 'success-pulse' ? 'glowPulse 0.4s ease-out' : 'none',
        }}
      />

      <style>{`
        @keyframes glowPulse {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
