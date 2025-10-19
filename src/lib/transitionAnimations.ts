/* eslint-disable @typescript-eslint/no-explicit-any */

import { gsap } from 'gsap';

export interface TransitionAnimationConfig {
  cardElement: HTMLElement;
  overlayElement: HTMLElement;
  bgElement?: HTMLElement; // Optional - background keeps running naturally
  onPhaseChange?: (phase: string) => void;
  onComplete?: () => void;
}

 
export function getCardTransitionConfig(): any {
  // No implementation
}

export function createSuccessTransitionTimeline(config: TransitionAnimationConfig): gsap.core.Timeline {
  const { cardElement, overlayElement, onPhaseChange, onComplete } = config;
  
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    autoRemoveChildren: false, // Keep all tweens until timeline completes
  });

  // Get the auth content wrapper and glass card
  const authContent = cardElement.querySelector('[data-auth-content]');
  const glassCard = cardElement.querySelector('[data-glass-card]');
  
  if (!authContent) {
    console.error('Auth content element not found!');
    return tl;
  }

  if (!glassCard) {
    console.error('Glass card element not found!');
    return tl;
  }

  // Phase 1: Fade out form content and show greeting (0.4s)
  tl.add(() => {
    console.log('Phase: success-show');
    onPhaseChange?.('success-show');
  }, 0)
    .to(authContent, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out',
    }, 0);

  // Phase 2: Simple smooth collapse to chip size (1.5s)
  tl.add(() => {
    console.log('Phase: liquid-collapse - simple shrink');
    onPhaseChange?.('liquid-collapse');
  }, 0.4)
    // Just smooth, slow shrink to chip size - no complex transforms
    .to(glassCard, {
      scale: 0.15,
      borderRadius: '24px',
      duration: 1.5,
      ease: 'power2.inOut',
    }, 0.4);

  // Phase 3: Fade out chip-sized card (0.6s)
  tl.add(() => {
    console.log('Phase: fade-out');
    onPhaseChange?.('fade-out');
  }, 1.9)
    .to(cardElement, {
      opacity: 0,
      filter: 'blur(6px)',
      duration: 0.6,
      ease: 'power2.out',
    }, 1.9);

  // Phase 4: Overlay fade to reveal background (0.4s)
  tl.add(() => {
    console.log('Phase: revealing');
    onPhaseChange?.('revealing');
  }, 2.1)
    .to(overlayElement, {
      opacity: 0.3,
      duration: 0.4,
      ease: 'power2.inOut',
    }, 2.1);

  // Phase 5: Background-only pause (0.6s)
  tl.add(() => {
    console.log('Phase: background-pause');
  })
    .to({}, { duration: 0.6 }, 2.5);

  // Phase 6: Fade to black for smooth transition (0.5s)
  tl.add(() => {
    console.log('Phase: fade-to-black');
    onPhaseChange?.('fade-to-black' as any);
  }, 3.1)
    .to(overlayElement, {
      opacity: 1,
      background: 'black',
      duration: 0.5,
      ease: 'power2.inOut',
    }, 3.1);

  // Phase 7: Navigate after screen is fully black
  tl.add(() => {
    console.log('✅ Screen black, navigating...');
    onPhaseChange?.('complete');
    onComplete?.();
  }, 3.6);

  console.log('Timeline created with duration:', tl.duration());
  
  return tl;
}

export function createLiquidMorphKeyframes() {
  return {
    from: {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    },
    to: {
      clipPath: 'ellipse(50% 50% at 50% 50%)',
    },
  };
}

export function createRippleEffect(
  element: HTMLElement,
  centerX: number,
  centerY: number,
  delay: number = 0
): gsap.core.Timeline {
  const tl = gsap.timeline({ delay });
  
  const ripple = document.createElement('div');
  ripple.style.position = 'absolute';
  ripple.style.left = `${centerX}px`;
  ripple.style.top = `${centerY}px`;
  ripple.style.width = '10px';
  ripple.style.height = '10px';
  ripple.style.borderRadius = '50%';
  ripple.style.border = '2px solid rgba(255, 255, 255, 0.6)';
  ripple.style.transform = 'translate(-50%, -50%)';
  ripple.style.pointerEvents = 'none';
  element.appendChild(ripple);

  tl.to(ripple, {
    width: '800px',
    height: '800px',
    opacity: 0,
    borderWidth: '1px',
    duration: 1.2,
    ease: 'power2.out',
    onComplete: () => ripple.remove(),
  });

  return tl;
}
