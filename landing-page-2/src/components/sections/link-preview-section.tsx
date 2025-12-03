"use client";
import React, { useState } from "react";
import { motion, useInView } from "framer-motion";
import { LinkPreview } from "@/components/ui/link-preview";
import { RulerCarousel, type CarouselItem } from "@/components/ui/ruler-carousel";

const videoModels: CarouselItem[] = [
  { id: 1, title: "GEN-4 TURBO" },
  { id: 2, title: "GEN-3 ALPHA" },
  { id: 3, title: "VEO 3" },
  { id: 4, title: "RAY-2" },
];

// Handwritten Circle Component
function HandwrittenCircle() {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { amount: 0.3, once: false });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.svg
      ref={ref}
      className="absolute pointer-events-none"
      style={{
        left: '-30%',
        top: '-60%',
        width: '160%',
        height: '220%',
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
        stroke="#000000"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
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
                pathLength: { duration: 2.5, ease: [0.43, 0.13, 0.23, 0.96], delay: 1.1 },
                opacity: { duration: 0.5, delay: 1.1 },
              }
        }
      />
    </motion.svg>
  );
}

export default function LinkPreviewSection() {
  return (
    <section className="min-h-screen flex flex-col justify-center items-center bg-white px-4 py-20">
      {/* Header */}
      <div className="max-w-4xl text-center mb-8">
        <p className="text-gray-800 text-3xl md:text-5xl font-semibold leading-tight">
          <span 
            className="relative inline-block"
            style={{ pointerEvents: 'auto' }}
          >
            <span className="text-green-500">Powered</span>
            <HandwrittenCircle />
          </span>{" "}
          by the world&apos;s most advanced{" "}
          <span className="bg-clip-text text-transparent bg-[length:200%_100%] bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 animate-shimmer">
            AI video models
          </span>.
        </p>
        <p className="mt-4 text-gray-500 text-lg md:text-xl">
          One platform. Infinite possibilities.
        </p>
      </div>

      {/* Integrated Ruler Carousel */}
      <div className="w-full max-w-6xl mb-16">
        <RulerCarousel originalItems={videoModels} />
      </div>

      {/* Model Descriptions */}
      <div className="max-w-4xl space-y-8">
        <p className="text-gray-600 text-lg md:text-xl text-center">
          <LinkPreview
            url="https://runwayml.com"
            className="font-bold bg-clip-text text-transparent bg-gradient-to-br from-cyan-500 to-blue-600"
          >
            GEN-4 TURBO
          </LinkPreview>{" "}
          — Your fastest path to cinema-quality video. 5s or 10s, your choice.
        </p>

        <p className="text-gray-600 text-lg md:text-xl text-center">
          <LinkPreview
            url="https://runwayml.com"
            className="font-bold bg-clip-text text-transparent bg-gradient-to-br from-emerald-500 to-teal-600"
          >
            GEN-3 ALPHA
          </LinkPreview>{" "}
          — Trusted by creators worldwide. Consistent results, every time.
        </p>

        <p className="text-gray-600 text-lg md:text-xl text-center">
          <LinkPreview
            url="https://deepmind.google"
            className="font-bold bg-clip-text text-transparent bg-gradient-to-br from-purple-500 to-pink-500"
          >
            VEO 3
          </LinkPreview>{" "}
          — Google&apos;s flagship video AI. 8 seconds of breathtaking realism.
        </p>

        <p className="text-gray-600 text-lg md:text-xl text-center">
          <LinkPreview
            url="https://lumalabs.ai"
            className="font-bold bg-clip-text text-transparent bg-gradient-to-br from-orange-500 to-red-500"
          >
            RAY-2
          </LinkPreview>{" "}
          — Total creative control. Camera, lighting, motion—19 parameters at your fingertips.
        </p>
      </div>

      {/* CTA Button */}
      <motion.button
        className="mt-16 cursor-pointer rounded-full bg-[#34C759] shadow-lg shadow-[#34C759]/25 hover:shadow-[#34C759]/40 hover:shadow-xl transition-all duration-300 flex items-center justify-center group px-8 py-4"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
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
    </section>
  );
}
