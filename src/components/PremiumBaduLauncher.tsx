/**
 * Premium BADU Launcher Button
 * High-grade design matching the A++ quality chatbot
 */

import { Brain, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface PremiumBaduLauncherProps {
  isOpen: boolean;
  onClick: () => void;
  hasNotification?: boolean;
}

export function PremiumBaduLauncher({ isOpen, onClick, hasNotification = false }: PremiumBaduLauncherProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[90]">
      {/* Pulsing Background Glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(62, 139, 255, 0.4), transparent 70%)',
          filter: 'blur(20px)',
          scale: 1.5,
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1.4, 1.6, 1.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main Launcher Button */}
      <motion.button
        onClick={onClick}
        className="relative flex h-16 w-16 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #3E8BFF 0%, #6B70FF 50%, #A08BFF 100%)',
          boxShadow: `
            0 0 30px rgba(62, 139, 255, 0.5),
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2)
          `,
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        aria-label={isOpen ? 'Close BADU Assistant' : 'Open BADU Assistant'}
        aria-expanded={isOpen}
      >
        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{ width: '200%' }}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Icon Container */}
        <motion.div
          className="relative z-10"
          animate={isOpen ? {
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          } : {
            rotate: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.5,
            ease: 'easeInOut',
          }}
        >
          {isOpen ? (
            // Brain icon when open (showing intelligence)
            <Brain className="h-7 w-7 text-white drop-shadow-lg" strokeWidth={2} />
          ) : (
            // Brain icon when closed
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Brain className="h-7 w-7 text-white drop-shadow-lg" strokeWidth={2} />
            </motion.div>
          )}
        </motion.div>

        {/* Sparkle Effect on Hover */}
        <motion.div
          className="absolute top-2 right-2"
          initial={{ opacity: 0, scale: 0 }}
          whileHover={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Sparkles className="h-3 w-3 text-white/80" />
        </motion.div>

        {/* Notification Badge */}
        {hasNotification && (
          <motion.div
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-red-500 to-pink-600 border-2 border-[#0B1220]"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500/50"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        )}

        {/* Rotating Ring Effect */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/10"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            borderTopColor: 'rgba(255, 255, 255, 0.3)',
            borderRightColor: 'transparent',
          }}
        />

        {/* Particle Effects Container */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/60 rounded-full"
              style={{
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: [0, Math.cos((i * Math.PI * 2) / 6) * 25],
                y: [0, Math.sin((i * Math.PI * 2) / 6) * 25],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      </motion.button>

      {/* Status Indicator Text (appears on hover) */}
      <motion.div
        className="absolute bottom-0 right-20 whitespace-nowrap pointer-events-none"
        initial={{ opacity: 0, x: 10 }}
        whileHover={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-gradient-to-r from-[#0C121C] to-[#0A0F18] px-3 py-1.5 rounded-lg border border-white/10 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-white/90">BADU Assistant</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Simple version without complex animations (optional lightweight alternative)
export function SimplePremiumLauncher({ isOpen, onClick }: PremiumBaduLauncherProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[90] flex h-16 w-16 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #3E8BFF, #6B70FF, #A08BFF)',
        boxShadow: '0 0 30px rgba(62, 139, 255, 0.5), 0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      animate={{
        boxShadow: [
          '0 0 30px rgba(62, 139, 255, 0.5), 0 8px 32px rgba(0, 0, 0, 0.4)',
          '0 0 40px rgba(62, 139, 255, 0.7), 0 8px 32px rgba(0, 0, 0, 0.4)',
          '0 0 30px rgba(62, 139, 255, 0.5), 0 8px 32px rgba(0, 0, 0, 0.4)',
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      aria-label={isOpen ? 'Close BADU Assistant' : 'Open BADU Assistant'}
      aria-expanded={isOpen}
    >
      <Brain className="h-7 w-7 text-white drop-shadow-lg" strokeWidth={2} />
    </motion.button>
  );
}


