import { motion } from 'framer-motion';

interface SuccessIndicatorProps {
  isVisible: boolean;
  userName: string;
}

export default function SuccessIndicator({ isVisible, userName }: SuccessIndicatorProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
    >
      {/* Simple elegant greeting - scales with card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
        className="text-center"
      >
        <h2 className="text-2xl font-light text-white/90 tracking-wide">
          Welcome,
        </h2>
        <p className="text-xl font-medium text-white mt-1">
          {userName}
        </p>
      </motion.div>
    </motion.div>
  );
}
