import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';

import { cn } from '../../lib/format';

interface CardShellProps extends HTMLMotionProps<'div'> {
  sheen?: boolean;
}

export default function CardShell({ children, className, sheen = false, style, ...rest }: CardShellProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'glass-card relative flex flex-col overflow-hidden rounded-2xl p-4 sm:p-5 lg:p-6 ring-1 ring-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.45)]',
        sheen && 'sheen',
        className
      )}
      style={{ breakInside: 'avoid', contain: 'layout paint', ...style }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
