"use client";
import { cn } from "@/lib/format";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { DottedSurface } from "./dotted-surface";

const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6 ", className)}
    >
      <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
};

const CheckFilled = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("w-6 h-6 ", className)}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export type LoadingState = {
  text: string;
};

const LoaderCore = ({
  loadingStates,
  value = 0,
}: {
  loadingStates: LoadingState[];
  value?: number;
}) => {
  return (
    <div className="flex relative justify-start max-w-xl mx-auto flex-col mt-40">
      {loadingStates.map((loadingState, index) => {
        const distance = Math.abs(index - value);
        const opacity = Math.max(1 - distance * 0.2, 0);
        const isActive = value === index;
        const isSuccessStep = index === loadingStates.length - 1 && isActive;

        return (
          <motion.div
            key={index}
            className={cn("text-left flex gap-2 mb-4")}
            initial={{ opacity: 0, y: -(value * 40) }}
            animate={{ opacity: opacity, y: -(value * 40) }}
            transition={{ 
              duration: 0.4,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <div>
              {index > value && (
                <CheckIcon className="text-white/40" />
              )}
              {index <= value && (
                <motion.div
                  animate={isActive ? {
                    scale: [1, 1.15, 1],
                    opacity: [1, 0.8, 1],
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: isActive ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                >
                  <CheckFilled
                    className={cn(
                      "text-white/60",
                      isActive && !isSuccessStep && "text-[#00b3ff] opacity-100",
                      isSuccessStep && "text-[#10b981] opacity-100"
                    )}
                  />
                </motion.div>
              )}
            </div>
            <span
              className={cn(
                "text-white/60 text-sm",
                isActive && "text-white/95 opacity-100 font-medium text-base"
              )}
              style={isActive ? {
                background: isSuccessStep 
                  ? 'linear-gradient(90deg, #ffffff 0%, #10b981 50%, #ffffff 100%)'
                  : 'linear-gradient(90deg, #ffffff 0%, #00b3ff 50%, #ffffff 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'shimmer 3s linear infinite',
              } : {}}
            >
              {loadingState.text}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export const MultiStepLoader = ({
  loadingStates,
  loading,
  duration = 2000,
  loop = false,
  currentStep,
}: {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
  currentStep?: number;
}) => {
  const [currentState, setCurrentState] = useState(0);
  // Modal overlay at z-9999 to cover everything including nav bar

  // Prevent body scroll when loading
  useEffect(() => {
    if (loading) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [loading]);

  // If currentStep is provided, use it immediately for real-time updates
  useEffect(() => {
    if (currentStep !== undefined) {
      setCurrentState(currentStep);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }
    // Skip auto-advance if currentStep is controlled externally
    if (currentStep !== undefined) {
      return;
    }
    const timeout = setTimeout(() => {
      setCurrentState((prevState) =>
        loop
          ? prevState === loadingStates.length - 1
            ? 0
            : prevState + 1
          : Math.min(prevState + 1, loadingStates.length - 1)
      );
    }, duration);

    return () => clearTimeout(timeout);
  }, [currentState, loading, loop, loadingStates.length, duration, currentStep]);

  // Check if we're at the success step (last step)
  const isSuccessStep = currentState === loadingStates.length - 1;

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
          }}
          className="w-full h-full flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            pointerEvents: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Layer 1: Dotted Surface Background - Syncs color with processing step */}
          <motion.div 
            className="absolute inset-0" 
            style={{ zIndex: 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
            }}
          >
            <DottedSurface 
              className="absolute inset-0" 
              style={{ opacity: 0.6 }} 
              isSuccess={isSuccessStep}
            />
          </motion.div>
          
          {/* Layer 2: Radial gradient overlay for focus effect */}
          <motion.div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.3) 80%)',
              zIndex: 2,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
            }}
          />

          {/* Layer 3: Loading Content - ON TOP */}
          <motion.div 
            className="h-96 relative pointer-events-none" 
            style={{ zIndex: 3 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.2,
              ease: "easeInOut",
            }}
          >
            <LoaderCore value={currentState} loadingStates={loadingStates} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

