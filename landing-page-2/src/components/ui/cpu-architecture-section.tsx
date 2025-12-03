"use client";

import { CpuArchitecture } from "@/components/ui/cpu-architecture";
import { GenerativeArtScene } from "@/components/ui/generative-art-scene";
import { motion, AnimatePresence } from "framer-motion";
import { useState, Suspense } from "react";

export default function CpuArchitectureSection() {
  const [isActivated, setIsActivated] = useState(false);

  return (
    <section className="relative min-h-screen w-full bg-black py-20 md:py-32 overflow-hidden">
      {/* Clear dark black background */}
      <div className="absolute inset-0 bg-black" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 flex flex-col items-center justify-center min-h-[80vh]">
        {/* Fixed height container for header to prevent layout shift */}
        <div className="h-[140px] md:h-[180px] w-full flex items-end justify-center mb-8 md:mb-12">
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
                  Powered by{" "}
                  <span className="bg-clip-text text-transparent bg-[length:200%_100%] bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-shimmer">
                    AI Intelligence
                  </span>
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="text-base md:text-lg text-white/50 max-w-2xl mx-auto"
                >
                  Our Marketing Engine processes your content through advanced neural
                  pathways, delivering results at machine speed.
                </motion.p>
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
                  width: "1000px", 
                  height: "1000px",
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
            onActivate={setIsActivated}
          />
        </motion.div>
      </div>
    </section>
  );
}
