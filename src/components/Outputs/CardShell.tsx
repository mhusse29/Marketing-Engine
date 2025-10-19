import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';

import { cn } from '../../lib/format';
import { InteractiveCardWrapper } from './InteractiveCardWrapper';
import './InteractiveCard.css';

interface CardShellProps extends HTMLMotionProps<'div'> {
  sheen?: boolean;
  enableInteractive?: boolean;
}

export default function CardShell({ children, className, sheen = false, enableInteractive = true, style, ...rest }: CardShellProps) {
  const cardContent = (
    <motion.div
      layout
      initial={{ 
        opacity: 0, 
        y: 20,
        scale: 0.96,
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: -20,
        scale: 0.96,
        transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
      }}
      transition={{ 
        duration: 0.45,
        ease: [0.25, 0.1, 0.25, 1], // Premium cubic-bezier easing
        opacity: { duration: 0.35 },
        scale: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }, // Slight overshoot for premium feel
      }}
      className={cn(
        'glass-card relative flex flex-col overflow-hidden rounded-2xl p-4 sm:p-5 lg:p-6 ring-1 ring-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.45)] transition-shadow duration-300',
        sheen && 'sheen',
        className
      )}
      style={{ 
        breakInside: 'avoid', 
        contain: 'layout paint',
        transformOrigin: 'center top',
        ...style 
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );

  if (!enableInteractive) {
    return cardContent;
  }

  return (
    <InteractiveCardWrapper enableTilt={true} enableMobileTilt={false}>
      {cardContent}
    </InteractiveCardWrapper>
  );
}
