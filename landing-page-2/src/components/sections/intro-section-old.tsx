"use client";

import React from "react";
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

const IntroSection = () => {
  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden shadow-2xl">
      {/* 3D Background - Large and Centered */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <div className="w-[2500px] h-[2500px] opacity-80">
          <RadialOrbitalTimeline timelineData={timelineData} onlyBackground={true} />
        </div>
      </div>

      {/* Left: Hover Image Gallery */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10">
        <HoverImageGallery />
      </div>

      {/* Right: Orbital Timeline */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-10">
        <RadialOrbitalTimeline timelineData={timelineData} onlyOrbit={true} />
      </div>

      {/* Bottom Center: TextColor */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
        <RadialOrbitalTimeline timelineData={timelineData} onlyText={true} />
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-20" />
    </div>
  );
};

export default IntroSection;
