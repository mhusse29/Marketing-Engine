"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedBorderGradientProps {
  children: ReactNode;
  isActive: boolean;
  blurIntensity?: number;
  borderWidth?: number;
  glowOpacity?: number;
  cornerGlowOpacity?: number;
  cornerGlowSize?: number;
  colors?: string[];
  className?: string;
  duration?: number;
}

export function AnimatedBorderGradient({
  children,
  isActive,
  blurIntensity = 60,
  borderWidth = 4,
  glowOpacity = 0.8,
  cornerGlowOpacity = 0.6,
  cornerGlowSize = 200,
  colors = ["#f97316", "#ec4899", "#8b5cf6", "#6366f1", "#3b82f6"],
  className,
  duration = 4,
}: AnimatedBorderGradientProps) {
  const [colorIndex, setColorIndex] = useState(0);

  // Rotate through colors smoothly
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colors.length);
    }, (duration * 1000) / colors.length);

    return () => clearInterval(interval);
  }, [isActive, duration, colors.length]);

  // Get current and next color for interpolation
  const currentColor = colors[colorIndex];
  const nextColor = colors[(colorIndex + 1) % colors.length];

  return (
    <div className={cn("relative", className)}>
      {/* Content */}
      <div className="relative">{children}</div>

      {/* Animated glow overlay - INSIDE the section */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 100 }}
          >
            {/* Top edge glow */}
            <motion.div
              className="absolute top-0 left-0 right-0"
              style={{
                height: `${blurIntensity * 2}px`,
                background: `linear-gradient(to bottom, ${currentColor}, transparent)`,
                filter: `blur(${blurIntensity}px)`,
                opacity: glowOpacity,
              }}
              animate={{
                background: [
                  `linear-gradient(to bottom, ${currentColor}, transparent)`,
                  `linear-gradient(to bottom, ${nextColor}, transparent)`,
                ],
              }}
              transition={{
                duration: duration / colors.length,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            {/* Bottom edge glow */}
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              style={{
                height: `${blurIntensity * 2}px`,
                background: `linear-gradient(to top, ${colors[2]}, transparent)`,
                filter: `blur(${blurIntensity}px)`,
                opacity: glowOpacity,
              }}
              animate={{
                background: [
                  `linear-gradient(to top, ${colors[2]}, transparent)`,
                  `linear-gradient(to top, ${colors[3]}, transparent)`,
                  `linear-gradient(to top, ${colors[4]}, transparent)`,
                  `linear-gradient(to top, ${colors[0]}, transparent)`,
                  `linear-gradient(to top, ${colors[1]}, transparent)`,
                ],
              }}
              transition={{
                duration: duration,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            {/* Left edge glow */}
            <motion.div
              className="absolute top-0 bottom-0 left-0"
              style={{
                width: `${blurIntensity * 2}px`,
                background: `linear-gradient(to right, ${colors[3]}, transparent)`,
                filter: `blur(${blurIntensity}px)`,
                opacity: glowOpacity,
              }}
              animate={{
                background: [
                  `linear-gradient(to right, ${colors[3]}, transparent)`,
                  `linear-gradient(to right, ${colors[4]}, transparent)`,
                  `linear-gradient(to right, ${colors[0]}, transparent)`,
                  `linear-gradient(to right, ${colors[1]}, transparent)`,
                  `linear-gradient(to right, ${colors[2]}, transparent)`,
                ],
              }}
              transition={{
                duration: duration,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            {/* Right edge glow */}
            <motion.div
              className="absolute top-0 bottom-0 right-0"
              style={{
                width: `${blurIntensity * 2}px`,
                background: `linear-gradient(to left, ${colors[1]}, transparent)`,
                filter: `blur(${blurIntensity}px)`,
                opacity: glowOpacity,
              }}
              animate={{
                background: [
                  `linear-gradient(to left, ${colors[1]}, transparent)`,
                  `linear-gradient(to left, ${colors[2]}, transparent)`,
                  `linear-gradient(to left, ${colors[3]}, transparent)`,
                  `linear-gradient(to left, ${colors[4]}, transparent)`,
                  `linear-gradient(to left, ${colors[0]}, transparent)`,
                ],
              }}
              transition={{
                duration: duration,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            {/* Sharp border line - top */}
            <motion.div
              className="absolute top-0 left-0 right-0"
              style={{
                height: `${borderWidth}px`,
                background: `linear-gradient(90deg, ${colors.join(", ")}, ${colors[0]})`,
                backgroundSize: "200% 100%",
              }}
              animate={{
                backgroundPosition: ["0% 0%", "100% 0%"],
              }}
              transition={{
                duration: duration,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            {/* Sharp border line - bottom */}
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              style={{
                height: `${borderWidth}px`,
                background: `linear-gradient(90deg, ${colors.join(", ")}, ${colors[0]})`,
                backgroundSize: "200% 100%",
              }}
              animate={{
                backgroundPosition: ["100% 0%", "0% 0%"],
              }}
              transition={{
                duration: duration,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            {/* Sharp border line - left */}
            <motion.div
              className="absolute top-0 bottom-0 left-0"
              style={{
                width: `${borderWidth}px`,
                background: `linear-gradient(180deg, ${colors.join(", ")}, ${colors[0]})`,
                backgroundSize: "100% 200%",
              }}
              animate={{
                backgroundPosition: ["0% 100%", "0% 0%"],
              }}
              transition={{
                duration: duration,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            {/* Sharp border line - right */}
            <motion.div
              className="absolute top-0 bottom-0 right-0"
              style={{
                width: `${borderWidth}px`,
                background: `linear-gradient(180deg, ${colors.join(", ")}, ${colors[0]})`,
                backgroundSize: "100% 200%",
              }}
              animate={{
                backgroundPosition: ["0% 0%", "0% 100%"],
              }}
              transition={{
                duration: duration,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            {/* Corner glows */}
            {/* Top-left */}
            <motion.div
              className="absolute top-0 left-0"
              style={{
                width: `${cornerGlowSize}px`,
                height: `${cornerGlowSize}px`,
                background: `radial-gradient(circle at 0% 0%, ${colors[0]}, transparent 70%)`,
                filter: `blur(${blurIntensity / 2}px)`,
                opacity: cornerGlowOpacity,
              }}
              animate={{
                background: [
                  `radial-gradient(circle at 0% 0%, ${colors[0]}, transparent 70%)`,
                  `radial-gradient(circle at 0% 0%, ${colors[1]}, transparent 70%)`,
                  `radial-gradient(circle at 0% 0%, ${colors[2]}, transparent 70%)`,
                ],
              }}
              transition={{
                duration: duration,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            {/* Top-right */}
            <motion.div
              className="absolute top-0 right-0"
              style={{
                width: `${cornerGlowSize}px`,
                height: `${cornerGlowSize}px`,
                background: `radial-gradient(circle at 100% 0%, ${colors[1]}, transparent 70%)`,
                filter: `blur(${blurIntensity / 2}px)`,
                opacity: cornerGlowOpacity,
              }}
              animate={{
                background: [
                  `radial-gradient(circle at 100% 0%, ${colors[1]}, transparent 70%)`,
                  `radial-gradient(circle at 100% 0%, ${colors[2]}, transparent 70%)`,
                  `radial-gradient(circle at 100% 0%, ${colors[3]}, transparent 70%)`,
                ],
              }}
              transition={{
                duration: duration,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            {/* Bottom-right */}
            <motion.div
              className="absolute bottom-0 right-0"
              style={{
                width: `${cornerGlowSize}px`,
                height: `${cornerGlowSize}px`,
                background: `radial-gradient(circle at 100% 100%, ${colors[2]}, transparent 70%)`,
                filter: `blur(${blurIntensity / 2}px)`,
                opacity: cornerGlowOpacity,
              }}
              animate={{
                background: [
                  `radial-gradient(circle at 100% 100%, ${colors[2]}, transparent 70%)`,
                  `radial-gradient(circle at 100% 100%, ${colors[3]}, transparent 70%)`,
                  `radial-gradient(circle at 100% 100%, ${colors[4]}, transparent 70%)`,
                ],
              }}
              transition={{
                duration: duration,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            {/* Bottom-left */}
            <motion.div
              className="absolute bottom-0 left-0"
              style={{
                width: `${cornerGlowSize}px`,
                height: `${cornerGlowSize}px`,
                background: `radial-gradient(circle at 0% 100%, ${colors[3]}, transparent 70%)`,
                filter: `blur(${blurIntensity / 2}px)`,
                opacity: cornerGlowOpacity,
              }}
              animate={{
                background: [
                  `radial-gradient(circle at 0% 100%, ${colors[3]}, transparent 70%)`,
                  `radial-gradient(circle at 0% 100%, ${colors[4]}, transparent 70%)`,
                  `radial-gradient(circle at 0% 100%, ${colors[0]}, transparent 70%)`,
                ],
              }}
              transition={{
                duration: duration,
                ease: "linear",
                repeat: Infinity,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
