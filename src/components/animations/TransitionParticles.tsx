import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

interface TransitionParticlesProps {
  isActive: boolean;
  centerX?: number;
  centerY?: number;
  particleCount?: number;
}

export default function TransitionParticles({ 
  isActive, 
  centerX = window.innerWidth / 2, 
  centerY = window.innerHeight / 2,
  particleCount = 80 
}: TransitionParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize particles
    particlesRef.current = Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      const maxLife = 60 + Math.random() * 120;
      
      return {
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + Math.sin(timeRef.current * 0.5) * 2, // Add wave motion
        size: 2 + Math.random() * 4,
        opacity: 0.8,
        color: `hsl(${180 + Math.random() * 60}, 70%, ${60 + Math.random() * 30}%)`,
        life: 0,
        maxLife,
      };
    });

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;
      
      timeRef.current += 0.016; // Approximate 60fps
      
      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        // Update position with wave influence
        const waveInfluence = Math.sin(particle.x * 0.01 + timeRef.current * 2) * 0.5;
        particle.x += particle.vx;
        particle.y += particle.vy + waveInfluence;
        particle.life += 1;

        // Update opacity
        const lifeRatio = particle.life / particle.maxLife;
        particle.opacity = 0.8 * (1 - lifeRatio);

        // Draw particle with glow
        if (particle.opacity > 0) {
          ctx.save();
          
          // Glow effect
          ctx.shadowBlur = 15;
          ctx.shadowColor = particle.color;
          
          // Draw particle
          ctx.globalAlpha = particle.opacity;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          
          // Add trail
          ctx.globalAlpha = particle.opacity * 0.3;
          ctx.beginPath();
          ctx.arc(
            particle.x - particle.vx * 2,
            particle.y - particle.vy * 2,
            particle.size * 0.6,
            0,
            Math.PI * 2
          );
          ctx.fill();
          
          ctx.restore();
        }

        // Remove dead particles
        if (particle.life >= particle.maxLife) {
          particlesRef.current.splice(index, 1);
        }
      });

      if (particlesRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Fade in canvas
    gsap.to(canvas, {
      opacity: 1,
      duration: 0.3,
    });

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Fade out canvas
      gsap.to(canvas, {
        opacity: 0,
        duration: 0.3,
      });
    };
  }, [isActive, centerX, centerY, particleCount]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ opacity: 0 }}
    />
  );
}
