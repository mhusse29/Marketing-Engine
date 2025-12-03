"use client";

import { CpuArchitecture } from "@/components/ui/cpu-architecture";
import { GenerativeArtScene } from "@/components/ui/generative-art-scene";
import { AnimatedBorderGradient } from "@/components/ui/animated-border-gradient";
import { useActivationSounds } from "@/hooks/use-sound";
import { motion, AnimatePresence } from "framer-motion";
import { useState, Suspense, useCallback } from "react";

export default function CpuArchitectureSection() {
  const [isActivated, setIsActivated] = useState(false);
  const { playActivationSound, playDeactivationSound } = useActivationSounds();

  const handleActivate = useCallback((active: boolean) => {
    setIsActivated(active);
    if (active) {
      playActivationSound();
    } else {
      playDeactivationSound();
    }
  }, [playActivationSound, playDeactivationSound]);

  return (
    <>
      <AnimatedBorderGradient
        isActive={isActivated}
        blurIntensity={64}
        borderWidth={0}
        glowOpacity={1}
        cornerGlowOpacity={0}
        cornerGlowSize={256}
        duration={10}
        colors={["#f97316", "#ec4899", "#a855f6", "#6366f1", "#3b82f6"]}
        className="relative"
      >
        <section className="relative min-h-screen w-full bg-black py-20 md:py-32">
      {/* Clear dark black background */}
      <div className="absolute inset-0 bg-black" style={{ zIndex: 0 }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 flex flex-col items-center justify-center min-h-[80vh]">
        {/* Fixed height container for header to prevent layout shift */}
        <div className="h-[220px] md:h-[260px] w-full flex items-end justify-center mb-8 md:mb-12">
          <AnimatePresence mode="wait">
            {isActivated ? (
              <motion.div
                key="header"
                initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -30, filter: "blur(12px)" }}
                transition={{ 
                  duration: 0.7, 
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="text-center"
              >
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight"
                >
                  The{" "}
                  <span className="bg-clip-text text-transparent bg-[length:200%_100%] bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-shimmer">
                    Brain
                  </span>
                  {" "}Behind Your{" "}
                  <span className="text-green-500">
                    Brand
                  </span>
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="text-base md:text-lg text-white/50 max-w-2xl mx-auto"
                >
                  From copy to visuals to video, our unified AI platform generates, 
                  refines, and delivers marketing content 10x faster than traditional workflows.
                </motion.p>
                <motion.button
                  className="mt-8 mx-auto cursor-pointer rounded-full bg-[#34C759] shadow-lg shadow-[#34C759]/25 hover:shadow-[#34C759]/40 hover:shadow-xl transition-all duration-300 flex items-center justify-center group px-8 py-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="text-base md:text-lg lg:text-xl font-semibold text-black">
                      Start Creating
                    </span>
                    <svg 
                      className="w-4 h-4 md:w-5 md:h-5 text-black transition-transform duration-300 ease-in-out group-hover:translate-x-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2.5} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </div>
                </motion.button>
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-center text-white/30 text-sm"
              >
                Click on Marketing Engine to activate
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* CPU Architecture Visualization - Fixed position */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full"
        >
          {/* Generative Art Background - centered on Marketing Engine chip */}
          <AnimatePresence>
            {isActivated && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute z-[1] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ 
                  width: "800px", 
                  height: "800px",
                }}
              >
                <Suspense fallback={<div className="w-full h-full bg-transparent" />}>
                  <GenerativeArtScene />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
          
          <CpuArchitecture 
            className="w-full h-auto max-h-[500px] relative z-[2]" 
            onActivate={handleActivate}
          />
        </motion.div>
      </div>
    </section>
    </AnimatedBorderGradient>
    </>
  );
}
