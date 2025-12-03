"use client";
import React, { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface HandwrittenCircleProps {
  color?: string;
  strokeWidth?: number;
  glowColor?: string;
  className?: string;
}

export function HandwrittenCircle({
  color = "#32CD32",
  strokeWidth = 12,
  glowColor = "rgba(50, 205, 50, 0.6)",
  className = "",
}: HandwrittenCircleProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.3, once: false });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.svg
      ref={ref}
      className={`absolute pointer-events-auto ${className}`}
      style={{
        left: "-35%",
        top: "-45%",
        width: "170%",
        height: "190%",
      }}
      viewBox="0 0 1200 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.path
        d="M 950 90 
           C 1250 300, 1050 480, 600 520
           C 250 520, 150 480, 150 300
           C 150 120, 350 80, 600 80
           C 850 80, 950 180, 950 180"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{
          filter: `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 12px ${glowColor.replace("0.6", "0.4")})`,
        }}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          isHovered
            ? { pathLength: 1, opacity: 1 }
            : isInView
            ? { pathLength: 1, opacity: 1 }
            : { pathLength: 0, opacity: 0 }
        }
        transition={
          isHovered
            ? {
                pathLength: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] },
                opacity: { duration: 0.2 },
              }
            : {
                pathLength: {
                  duration: 2.5,
                  ease: [0.43, 0.13, 0.23, 0.96],
                  delay: 1.1,
                },
                opacity: { duration: 0.5, delay: 1.1 },
              }
        }
      />
    </motion.svg>
  );
}

interface HandWrittenTitleProps {
  title: string;
  subtitle?: string;
  highlightWord?: string;
  highlightColor?: string;
  circleColor?: string;
  className?: string;
}

export function HandWrittenTitle({
  title,
  subtitle,
  highlightWord,
  highlightColor = "#22c55e",
  circleColor = "#32CD32",
  className = "",
}: HandWrittenTitleProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.3, once: false });

  // Split title to find and highlight the word
  const renderTitle = () => {
    if (!highlightWord) {
      return title;
    }

    const parts = title.split(new RegExp(`(${highlightWord})`, "gi"));

    return parts.map((part, index) => {
      if (part.toLowerCase() === highlightWord.toLowerCase()) {
        return (
          <span key={index} className="relative inline-block">
            <span style={{ color: highlightColor }}>{part}</span>
            <HandwrittenCircle color={circleColor} />
          </span>
        );
      }
      return part;
    });
  };

  return (
    <motion.div
      ref={ref}
      className={`text-center ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h2 className="text-3xl md:text-5xl font-semibold leading-tight text-gray-800">
        {renderTitle()}
      </h2>
      {subtitle && (
        <motion.p
          className="mt-4 text-gray-500 text-lg md:text-xl"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}

export default HandWrittenTitle;
