"use client";

import React, { Suspense } from "react";
import { motion } from "framer-motion";
import {
  FluxProIcon,
  StabilityAIIcon,
  OpenAIIcon,
  IdeogramIcon,
  NanoBananaIcon,
  RunwayIcon,
} from "@/components/ui/ai-model-icons";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { HoverImageGallery } from "@/components/ui/hover-image-gallery";
import { GenerativeArtScene } from "@/components/ui/anomalous-matter-hero";

// Timeline data for the orbital component
const timelineData = [
  {
    id: 1,
    title: "RUNWAY Gen-4",
    provider: "Runway ML",
    tagline: "Cinematic Image Synthesis",
    content: "High-fidelity diffusion model specializing in reference-based consistency. Anchors style and character identity across multiple generations with cinematic lighting.",
    category: "Image Generation",
    icon: RunwayIcon,
    relatedIds: [2, 6],
    status: "completed" as const,
    superpower: "Reference Anchoring",
    specs: [
      { label: "Consistency", value: "High" },
      { label: "Style", value: "Cinematic" },
      { label: "Res", value: "Up to 4K" },
    ],
    capabilityMetric: {
      name: "Cinematic Fidelity",
      score: 98,
      color: "#FF3B30",
    },
    bestFor: "Storyboarding, Character Design, Lighting Effects",
    visualTheme: {
      beamColor: "rgba(255, 59, 48, 0.8)",
      coreTexture: "radial-gradient(circle, #FF3B30 0%, #FF6B5B 30%, transparent 70%)",
      coreIcon: "Eye" as const,
    },
  },
  {
    id: 2,
    title: "NANO BANANA (Pro)",
    provider: "Google DeepMind",
    tagline: "Reasoning & Search Grounded",
    content: "The first 'Thinking' image model. Uses live Google Search data to ground visuals in reality and reason through complex logic before rendering.",
    category: "Image Generation",
    icon: NanoBananaIcon,
    relatedIds: [1, 3],
    status: "completed" as const,
    superpower: "Live Data Grounding",
    specs: [
      { label: "Logic", value: "Gemini 3" },
      { label: "Context", value: "Live Web" },
      { label: "Text", value: "Native" },
    ],
    capabilityMetric: {
      name: "Logic & Reasoning",
      score: 96,
      color: "#007AFF",
    },
    bestFor: "Infographics, Data Viz, Accurate Diagrams",
    visualTheme: {
      beamColor: "rgba(0, 122, 255, 0.8)",
      coreTexture: "radial-gradient(circle, #007AFF 0%, #4DA3FF 30%, transparent 70%)",
      coreIcon: "BrainCircuit" as const,
    },
  },
  {
    id: 3,
    title: "FLUX 1.1 PRO",
    provider: "Black Forest Labs",
    tagline: "The New Standard in Detail",
    content: "A 12B parameter transformer model delivering state-of-the-art photorealism. Eliminates the 'AI plastic' look with dense texture generation.",
    category: "Image Generation",
    icon: FluxProIcon,
    relatedIds: [2, 4],
    status: "completed" as const,
    superpower: "Texture Density",
    specs: [
      { label: "Speed", value: "~0.5s (Turbo)" },
      { label: "Params", value: "12 Billion" },
      { label: "Detail", value: "Extreme" },
    ],
    capabilityMetric: {
      name: "Photorealism Score",
      score: 99,
      color: "#34C759",
    },
    bestFor: "Photography, Fashion, High-End Advertising",
    visualTheme: {
      beamColor: "rgba(52, 199, 89, 0.8)",
      coreTexture: "radial-gradient(circle, #34C759 0%, #6EDB8F 30%, transparent 70%)",
      coreIcon: "Zap" as const,
    },
  },
  {
    id: 4,
    title: "IDEOGRAM 2.0",
    provider: "Ideogram AI",
    tagline: "Typography & Graphic Design",
    content: "Specialized architecture for rendering flawless text and vector-style graphics. Handles complex font layouts and color palettes natively.",
    category: "Image Generation",
    icon: IdeogramIcon,
    relatedIds: [3, 5],
    status: "completed" as const,
    superpower: "Perfect Typography",
    specs: [
      { label: "Text", value: "10/10 Accuracy" },
      { label: "Format", value: "Vector/SVG" },
      { label: "Palette", value: "Hex Control" },
    ],
    capabilityMetric: {
      name: "Text Accuracy",
      score: 95,
      color: "#AF52DE",
    },
    bestFor: "Logos, T-Shirt Design, Social Graphics",
    visualTheme: {
      beamColor: "rgba(175, 82, 222, 0.8)",
      coreTexture: "radial-gradient(circle, #AF52DE 0%, #C77DFF 30%, transparent 70%)",
      coreIcon: "Palette" as const,
    },
  },
  {
    id: 5,
    title: "STABLE DIFFUSION 3.5",
    provider: "Stability AI",
    tagline: "Open & Customizable",
    content: "The ultimate base for fine-tuning. Supports custom LoRAs and ControlNets for absolute user control over composition and style.",
    category: "Image Generation",
    icon: StabilityAIIcon,
    relatedIds: [4, 6],
    status: "completed" as const,
    superpower: "Customizability",
    specs: [
      { label: "License", value: "Apache 2.0" },
      { label: "Weights", value: "Open" },
      { label: "VRAM", value: "Optimized" },
    ],
    capabilityMetric: {
      name: "Control Flexibility",
      score: 92,
      color: "#FF9500",
    },
    bestFor: "Local Workflows, Fine-Tuning, Game Assets",
    visualTheme: {
      beamColor: "rgba(255, 149, 0, 0.8)",
      coreTexture: "radial-gradient(circle, #FF9500 0%, #FFB340 30%, transparent 70%)",
      coreIcon: "Cpu" as const,
    },
  },
  {
    id: 6,
    title: "DALL-E 3",
    provider: "OpenAI",
    tagline: "Natural Language Master",
    content: "Translates complex, conversational prompts into images with high semantic fidelity. The easiest model to talk to.",
    category: "Image Generation",
    icon: OpenAIIcon,
    relatedIds: [5, 1],
    status: "completed" as const,
    superpower: "Prompt Adherence",
    specs: [
      { label: "Semantic", value: "High" },
      { label: "Safety", value: "Enterprise" },
      { label: "Simple", value: "Yes" },
    ],
    capabilityMetric: {
      name: "Prompt Obedience",
      score: 88,
      color: "#10A37F",
    },
    bestFor: "Complex Scenes, Surrealism, Chat Integration",
    visualTheme: {
      beamColor: "rgba(16, 163, 127, 0.8)",
      coreTexture: "radial-gradient(circle, #10A37F 0%, #3DC9A5 30%, transparent 70%)",
      coreIcon: "Wand2" as const,
    },
  },
];

// Bento grid item wrapper with glassmorphism
interface BentoItemProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}

function BentoItem({ children, className = "", style, delay = 0 }: BentoItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={`
        relative overflow-hidden rounded-3xl
        bg-white/[0.03] backdrop-blur-2xl
        border border-white/[0.08]
        shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]
        ${className}
      `}
      style={style}
    >
      {/* Inner highlight gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent pointer-events-none rounded-3xl" />
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none rounded-3xl" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
      {children}
    </motion.div>
  );
}

export function IntroBento() {
  return (
    <section className="relative h-screen max-h-[1000px] w-full overflow-hidden bg-black">
      {/* Dark gradient overlay for depth and contrast */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/50 via-black/30 to-black/70" />

      {/* Bento Grid Container */}
      <div className="relative z-10 flex items-center justify-center h-full p-4 md:p-6 lg:p-8">
        <div 
          className="grid gap-3 md:gap-4 w-full max-w-6xl"
          style={{
            gridTemplateColumns: "repeat(12, 1fr)",
            gridTemplateRows: "repeat(6, minmax(80px, 1fr))",
            height: "min(85vh, 720px)",
          }}
        >
          {/* ═══════════════════════════════════════════════════════════════
              CELL 1: HoverImageGallery over GenerativeArtScene peek-through
              Position: Top-left, 5 columns × 4 rows (square)
          ═══════════════════════════════════════════════════════════════ */}
          <BentoItem
            className="group"
            style={{ gridColumn: "1 / 6", gridRow: "1 / 5" }}
            delay={0.1}
          >
            <div className="relative w-full h-full flex items-center justify-center p-2 md:p-3">
              {/* Background: GenerativeArtScene peek-through at 50% opacity */}
              <div className="absolute inset-0 opacity-50 rounded-3xl overflow-hidden">
                <Suspense fallback={null}>
                  <GenerativeArtScene />
                </Suspense>
              </div>
              
              {/* Foreground: HoverImageGallery filling the cell */}
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <HoverImageGallery transparent className="w-full h-full max-w-[480px] max-h-[480px]" />
              </div>
            </div>
          </BentoItem>

          {/* ═══════════════════════════════════════════════════════════════
              CELL 2: RadialOrbitalTimeline
              Position: Top-right, 7 columns × 5 rows (wide rectangle)
          ═══════════════════════════════════════════════════════════════ */}
          <BentoItem
            className="!overflow-visible z-30"
            style={{ gridColumn: "6 / 13", gridRow: "1 / 6" }}
            delay={0.2}
          >
            <div className="relative w-full h-full flex items-center justify-center !overflow-visible z-30">
              {/* Subtle radial background glow */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: "radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%)"
                }}
              />
              
              {/* Timeline Component with proper size prop - no CSS scaling needed */}
              <RadialOrbitalTimeline timelineData={timelineData} size={420} />
            </div>
          </BentoItem>

          {/* ═══════════════════════════════════════════════════════════════
              CELL 3: Glowing Hero Title
              Position: Bottom-left, 5 columns × 2 rows (wide banner)
          ═══════════════════════════════════════════════════════════════ */}
          <BentoItem
            style={{ gridColumn: "1 / 6", gridRow: "5 / 7" }}
            delay={0.3}
          >
            <div className="relative w-full h-full flex flex-col justify-center p-4 md:p-5 lg:p-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight leading-[1.1]">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white/95 to-white/80">
                    Prompt.
                  </span>{" "}
                  <span className="bg-clip-text text-transparent bg-[length:200%_100%] bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 animate-shimmer">
                    Compare.
                  </span>{" "}
                  <span className="bg-clip-text text-transparent bg-[length:200%_100%] bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 animate-shimmer [animation-delay:0.5s]">
                    Combine.
                  </span>{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white/80 via-white/70 to-white/50">
                    Repeat.
                  </span>
                </h1>
                <p className="mt-2 md:mt-3 text-xs md:text-sm text-white/40 max-w-md leading-relaxed">
                  Harness the power of cutting-edge AI models to transform your creative vision.
                </p>
              </motion.div>
              
              {/* Decorative gradient corner */}
              <div className="absolute bottom-0 right-0 w-20 md:w-24 h-20 md:h-24 bg-gradient-to-tl from-purple-500/10 via-pink-500/5 to-transparent rounded-tl-full pointer-events-none" />
            </div>
          </BentoItem>

          {/* ═══════════════════════════════════════════════════════════════
              CELL 4: Stats / Model Count
              Position: Bottom-center, 3 columns × 1 row (small)
          ═══════════════════════════════════════════════════════════════ */}
          <BentoItem
            className="z-10"
            style={{ gridColumn: "6 / 9", gridRow: "6 / 7" }}
            delay={0.4}
          >
            <div className="relative w-full h-full flex flex-col justify-center items-center p-2 md:p-3 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4, type: "spring" }}
                className="flex items-center gap-2 md:gap-3"
              >
                <span className="text-3xl md:text-4xl font-bold text-[#34C759]">
                  6+
                </span>
                <span className="text-[10px] md:text-xs text-white/40 uppercase tracking-widest">
                  AI Models
                </span>
              </motion.div>
            </div>
          </BentoItem>

          {/* ═══════════════════════════════════════════════════════════════
              CELL 5: CTA Button - Full cell styled as green button
              Position: Bottom-right, 4 columns × 1 row (medium)
          ═══════════════════════════════════════════════════════════════ */}
          <motion.div
            className="cursor-pointer rounded-3xl bg-[#34C759] shadow-lg shadow-[#34C759]/25 hover:shadow-[#34C759]/40 hover:shadow-xl transition-all duration-300 flex items-center justify-center z-10 group"
            style={{ gridColumn: "9 / 13", gridRow: "6 / 7" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
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
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-20" />
    </section>
  );
}

export default IntroBento;
