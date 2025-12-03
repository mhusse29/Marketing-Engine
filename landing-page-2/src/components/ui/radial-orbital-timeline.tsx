"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { SiriOrb } from "@/components/ui/siri-orb";

interface Spec {
  label: string;
  value: string;
}

interface CapabilityMetric {
  name: string;
  score: number;
  color: string;
}

interface VisualTheme {
  beamColor: string;
  coreTexture: string;
  coreIcon: "BrainCircuit" | "Cpu" | "Palette" | "Zap" | "Eye" | "Wand2";
}

interface TimelineItem {
  id: number;
  title: string;
  provider: string;
  tagline: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  superpower: string;
  specs: Spec[];
  capabilityMetric: CapabilityMetric;
  bestFor: string;
  visualTheme: VisualTheme;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
  size?: number; // Optional size prop, defaults to 500px
}

// Helper to convert hex/rgba to oklch-like colors for SiriOrb
function getOrbColorsFromTheme(theme: VisualTheme | null) {
  if (!theme) {
    // Apple Intelligence gradient: Orange → Pink → Purple → Blue
    return {
      c1: "oklch(75% 0.18 45)",   // Warm Orange
      c2: "oklch(72% 0.22 350)",  // Hot Pink / Magenta
      c3: "oklch(65% 0.25 300)",  // Purple
      c4: "oklch(68% 0.20 260)",  // Indigo / Blue-Purple
      c5: "oklch(70% 0.18 230)",  // Blue
    };
  }
  
  // Map beam colors to oklch for the orb when a satellite is active
  const colorMap: Record<string, { c1: string; c2: string; c3: string; c4: string; c5: string }> = {
    "rgba(255, 59, 48, 0.8)": { // Red - Runway
      c1: "oklch(65% 0.28 25)",
      c2: "oklch(68% 0.25 35)",
      c3: "oklch(62% 0.26 20)",
      c4: "oklch(70% 0.23 40)",
      c5: "oklch(60% 0.27 15)",
    },
    "rgba(0, 122, 255, 0.8)": { // Blue - Nano Banana
      c1: "oklch(60% 0.22 250)",
      c2: "oklch(65% 0.20 245)",
      c3: "oklch(58% 0.24 255)",
      c4: "oklch(62% 0.21 240)",
      c5: "oklch(55% 0.23 260)",
    },
    "rgba(52, 199, 89, 0.8)": { // Green - Flux
      c1: "oklch(70% 0.22 145)",
      c2: "oklch(75% 0.20 150)",
      c3: "oklch(68% 0.24 140)",
      c4: "oklch(72% 0.21 155)",
      c5: "oklch(65% 0.23 135)",
    },
    "rgba(175, 82, 222, 0.8)": { // Purple - Ideogram
      c1: "oklch(60% 0.28 300)",
      c2: "oklch(65% 0.25 310)",
      c3: "oklch(58% 0.30 295)",
      c4: "oklch(62% 0.27 305)",
      c5: "oklch(55% 0.29 290)",
    },
    "rgba(255, 149, 0, 0.8)": { // Orange - SD
      c1: "oklch(75% 0.22 55)",
      c2: "oklch(78% 0.20 60)",
      c3: "oklch(72% 0.24 50)",
      c4: "oklch(76% 0.21 65)",
      c5: "oklch(70% 0.23 45)",
    },
    "rgba(16, 163, 127, 0.8)": { // Teal - DALL-E
      c1: "oklch(65% 0.18 170)",
      c2: "oklch(70% 0.16 175)",
      c3: "oklch(62% 0.20 165)",
      c4: "oklch(67% 0.17 180)",
      c5: "oklch(60% 0.19 160)",
    },
  };

  return colorMap[theme.beamColor] || {
    c1: "oklch(75% 0.18 45)",
    c2: "oklch(72% 0.22 350)",
    c3: "oklch(65% 0.25 300)",
    c4: "oklch(68% 0.20 260)",
    c5: "oklch(70% 0.18 230)",
  };
}

// Helper to get HSL glow colors that match the theme (for CSS compatibility)
function getGlowColorsFromTheme(theme: VisualTheme | null) {
  if (!theme) {
    // Apple Intelligence gradient: Orange → Pink → Purple → Blue
    return {
      g1: "hsl(35 100% 55%)",    // Warm Orange
      g2: "hsl(340 100% 60%)",   // Hot Pink / Magenta
      g3: "hsl(280 70% 55%)",    // Purple
      g4: "hsl(250 70% 60%)",    // Indigo / Blue-Purple
      g5: "hsl(210 100% 50%)",   // Blue
    };
  }
  
  // Map beam colors to HSL for the glow when a satellite is active
  const colorMap: Record<string, { g1: string; g2: string; g3: string; g4: string; g5: string }> = {
    "rgba(255, 59, 48, 0.8)": { // Red - Runway
      g1: "hsl(4 100% 60%)",
      g2: "hsl(10 95% 55%)",
      g3: "hsl(0 90% 50%)",
      g4: "hsl(15 85% 55%)",
      g5: "hsl(355 95% 55%)",
    },
    "rgba(0, 122, 255, 0.8)": { // Blue - Nano Banana
      g1: "hsl(211 100% 50%)",
      g2: "hsl(220 95% 55%)",
      g3: "hsl(205 100% 45%)",
      g4: "hsl(215 90% 50%)",
      g5: "hsl(225 100% 55%)",
    },
    "rgba(52, 199, 89, 0.8)": { // Green - Flux
      g1: "hsl(142 70% 50%)",
      g2: "hsl(150 65% 55%)",
      g3: "hsl(135 75% 45%)",
      g4: "hsl(155 60% 50%)",
      g5: "hsl(130 70% 50%)",
    },
    "rgba(175, 82, 222, 0.8)": { // Purple - Ideogram
      g1: "hsl(280 70% 60%)",
      g2: "hsl(290 65% 55%)",
      g3: "hsl(270 75% 55%)",
      g4: "hsl(285 70% 60%)",
      g5: "hsl(265 75% 55%)",
    },
    "rgba(255, 149, 0, 0.8)": { // Orange - SD
      g1: "hsl(35 100% 50%)",
      g2: "hsl(40 95% 55%)",
      g3: "hsl(30 100% 45%)",
      g4: "hsl(45 90% 50%)",
      g5: "hsl(25 100% 50%)",
    },
    "rgba(16, 163, 127, 0.8)": { // Teal - DALL-E
      g1: "hsl(165 82% 35%)",
      g2: "hsl(170 75% 40%)",
      g3: "hsl(160 85% 30%)",
      g4: "hsl(175 70% 35%)",
      g5: "hsl(155 80% 35%)",
    },
  };

  return colorMap[theme.beamColor] || {
    g1: "hsl(35 100% 55%)",
    g2: "hsl(340 100% 60%)",
    g3: "hsl(280 70% 55%)",
    g4: "hsl(250 70% 60%)",
    g5: "hsl(210 100% 50%)",
  };
}

// ReactiveCore Component with SiriOrb
interface ReactiveCoreProps {
  activeItem: TimelineItem | null;
  isIdle: boolean;
  onCoreClick: () => void;
  satellitePosition: { x: number; y: number } | null;
}

function ReactiveCore({ activeItem, isIdle, onCoreClick, satellitePosition }: ReactiveCoreProps) {
  const theme = activeItem?.visualTheme || null;
  const orbColors = getOrbColorsFromTheme(theme);
  const glowColors = getGlowColorsFromTheme(theme);

  return (
    <>
      {/* Gravity Tether - SVG beam connecting core to active satellite */}
      {activeItem && satellitePosition && theme && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 5 }}
        >
          <defs>
            <linearGradient
              id={`beam-gradient-${activeItem.id}`}
              x1="50%"
              y1="50%"
              x2={`${50 + (satellitePosition.x / 4)}%`}
              y2={`${50 + (satellitePosition.y / 4)}%`}
            >
              <stop offset="0%" stopColor={theme.beamColor} stopOpacity="1" />
              <stop offset="100%" stopColor={theme.beamColor} stopOpacity="0" />
            </linearGradient>
            <filter id="beam-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.line
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ pathLength: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            x1="50%"
            y1="50%"
            x2={`calc(50% + ${satellitePosition.x}px)`}
            y2={`calc(50% + ${satellitePosition.y}px)`}
            stroke={`url(#beam-gradient-${activeItem.id})`}
            strokeWidth="2"
            filter="url(#beam-glow)"
          />
        </svg>
      )}

      {/* SiriOrb as the Reactive Core */}
      <motion.div
        className="absolute flex items-center justify-center siri-glow-container"
        style={{ 
          zIndex: 10,
          // @ts-expect-error CSS custom property
          "--glow-duration": isIdle ? "20s" : "12s",
        }}
        animate={{
          scale: isIdle ? [0.98, 1.02, 0.98] : 1,
        }}
        transition={{
          scale: {
            duration: 3,
            repeat: isIdle ? Infinity : 0,
            ease: "easeInOut",
          },
        }}
      >
        {/* CSS for synced glow rotation - matches SiriOrb animation */}
        <style jsx>{`
          @property --glow-angle {
            syntax: "<angle>";
            inherits: true;
            initial-value: 0deg;
          }
          
          .siri-glow-ring {
            --glow-angle: 0deg;
            animation: glow-rotate 20s linear infinite;
          }
          
          @keyframes glow-rotate {
            from { --glow-angle: 0deg; }
            to { --glow-angle: 360deg; }
          }
        `}</style>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem?.id || "idle"}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <SiriOrb
              size="96px"
              colors={orbColors}
              animationDuration={isIdle ? 20 : 12}
              onClick={onCoreClick}
              className="drop-shadow-2xl"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Soft fading glow - only visible in idle state, synced with SiriOrb colors */}
        <AnimatePresence>
          {isIdle && (
            <motion.div
              key="idle-glow"
              className="siri-glow-ring absolute rounded-full pointer-events-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [1, 0.74, 1], scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15, ease: "easeIn" } }}
              transition={{
                opacity: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5, // Glow appears AFTER SiriOrb (0.4s SiriOrb + 0.1s gap)
                },
                scale: { 
                  duration: 0.4, 
                  ease: "easeOut",
                  delay: 0.5, // Glow scales in AFTER SiriOrb
                },
              }}
              style={{
                width: "190px",
                height: "190px",
                background: `conic-gradient(
                  from var(--glow-angle, 0deg),
                  hsl(35 100% 55% / 0.68),
                  hsl(340 100% 60% / 0.68),
                  hsl(280 70% 55% / 0.68),
                  hsl(250 70% 60% / 0.68),
                  hsl(210 100% 50% / 0.68),
                  hsl(35 100% 55% / 0.68)
                )`,
                mask: "radial-gradient(circle, transparent 46px, rgba(0,0,0,0.85) 48px, rgba(0,0,0,0.19) 54px, transparent 73px)",
                WebkitMask: "radial-gradient(circle, transparent 46px, rgba(0,0,0,0.85) 48px, rgba(0,0,0,0.19) 54px, transparent 73px)",
                filter: "blur(25px)",
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

// Custom hook for orbit rotation with spring physics
function useOrbitRotation(
  activeIndex: number | null,
  totalItems: number,
  autoRotate: boolean,
  anchorAngle: number = 270 // Top center (270 degrees = -90 degrees from right)
) {
  const [rotation, setRotation] = useState(0);
  const autoRotationRef = useRef(0);

  // Calculate target rotation to bring active item to anchor position
  const targetRotation = useMemo(() => {
    if (activeIndex === null) return null;
    const itemAngle = (activeIndex / totalItems) * 360;
    return anchorAngle - itemAngle;
  }, [activeIndex, totalItems, anchorAngle]);

  // Auto-rotation when idle
  useEffect(() => {
    let animationFrame: number;
    
    if (autoRotate && activeIndex === null) {
      const animate = () => {
        autoRotationRef.current = (autoRotationRef.current + 0.3) % 360;
        setRotation(autoRotationRef.current);
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [autoRotate, activeIndex]);

  // Update rotation when active item changes
  useEffect(() => {
    if (targetRotation !== null) {
      // Preserve the auto-rotation offset for smooth transition
      autoRotationRef.current = targetRotation;
      setRotation(targetRotation);
    }
  }, [targetRotation]);

  return { rotation, targetRotation };
}

export default function RadialOrbitalTimeline({
  timelineData,
  size = 500, // Default size matching original hardcoded value
}: RadialOrbitalTimelineProps) {
  // Calculate proportional dimensions based on size
  const scaleFactor = size / 500;
  const orbitRingSize = Math.round(384 * scaleFactor); // Original w-96 = 384px
  const orbitRadius = Math.round(200 * scaleFactor); // Original radius = 200px
  
  // Scaled dimensions for satellite nodes and cards
  const nodeSize = Math.max(28, Math.round(40 * scaleFactor)); // Min 28px
  const labelTop = Math.round(56 * scaleFactor); // top-14 = 56px
  const cardTop = Math.round(90 * scaleFactor); // Reduced from 112px for tighter fit
  const cardWidth = Math.max(220, Math.round(288 * scaleFactor)); // Min 220px, original w-72 = 288px
  const iconSize = Math.max(12, Math.round(16 * scaleFactor)); // Min 12px
  
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {}
  );
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Get active item and its index
  const activeItem = activeNodeId
    ? timelineData.find((item) => item.id === activeNodeId) || null
    : null;
  const activeIndex = activeNodeId
    ? timelineData.findIndex((item) => item.id === activeNodeId)
    : null;

  // Use custom orbit rotation hook
  const { rotation, targetRotation } = useOrbitRotation(
    activeIndex,
    timelineData.length,
    autoRotate
  );

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  // Handle core click - triggers primary action for active satellite
  const handleCoreClick = () => {
    if (activeItem) {
      // Could navigate to model page or trigger generation
      console.log(`Open model: ${activeItem.title}`);
      // For now, we'll just toggle off the active state
      // In production, this would route to the model's page
    }
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotation) % 360;
    const radius = orbitRadius; // Use dynamic radius based on size prop
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(
      0.4,
      Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))
    );

    return { x, y, angle, zIndex, opacity };
  };

  // Get position of active satellite for the beam
  const activeSatellitePosition = useMemo(() => {
    if (activeIndex === null) return null;
    const pos = calculateNodePosition(activeIndex, timelineData.length);
    return { x: pos.x, y: pos.y };
  }, [activeIndex, rotation, timelineData.length]);

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  return (
    <div
      className="relative flex items-center justify-center"
      ref={containerRef}
      onClick={handleContainerClick}
      style={{
        perspective: "1000px",
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {/* Orbit Ring - dynamic size based on prop */}
      <div 
        className="absolute rounded-full border border-white/10" 
        style={{ 
          width: `${orbitRingSize}px`, 
          height: `${orbitRingSize}px`,
          zIndex: 1 
        }} 
      />

      {/* ReactiveCore Component */}
      <ReactiveCore
        activeItem={activeItem}
        isIdle={autoRotate}
        onCoreClick={handleCoreClick}
        satellitePosition={activeSatellitePosition}
      />

      {/* Satellite Nodes */}
          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const isActive = item.id === activeNodeId;
            const Icon = item.icon;

            return (
              <motion.div
                key={item.id}
                ref={(el) => {
                  nodeRefs.current[item.id] = el;
                }}
                className="absolute cursor-pointer"
                initial={false}
                animate={{
                  x: position.x,
                  y: position.y,
                  zIndex: isExpanded ? 500 : position.zIndex,
                  opacity: isExpanded ? 1 : position.opacity,
                }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                  mass: 1,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                <div
                  className={`absolute rounded-full -inset-1 ${
                    isPulsing ? "animate-pulse duration-1000" : ""
                  }`}
                  style={{
                    background: isExpanded 
                      ? `radial-gradient(circle, ${item.capabilityMetric.color}40 0%, ${item.capabilityMetric.color}00 70%)`
                      : `radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)`,
                    width: `${item.capabilityMetric.score * 0.5 + 40}px`,
                    height: `${item.capabilityMetric.score * 0.5 + 40}px`,
                    left: `-${(item.capabilityMetric.score * 0.5 + 40 - 40) / 2}px`,
                    top: `-${(item.capabilityMetric.score * 0.5 + 40 - 40) / 2}px`,
                  }}
                />

                <motion.div
                  className={`
                  rounded-full flex items-center justify-center
                  ${isExpanded
                      ? "bg-white text-black"
                      : isRelated
                      ? "bg-white/50 text-black"
                      : "bg-black text-white"
                  }
                  border-2 
                  ${isExpanded
                      ? "border-white shadow-lg shadow-white/30"
                      : isRelated
                      ? "border-white animate-pulse"
                      : "border-white/40"
                  }
                `}
                  animate={{
                    scale: isExpanded ? 1.3 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  style={{
                    width: `${nodeSize}px`,
                    height: `${nodeSize}px`,
                    boxShadow: isActive
                      ? `0 0 20px ${item.visualTheme?.beamColor || item.capabilityMetric.color}`
                      : undefined,
                  }}
                >
                  <Icon size={iconSize} />
                </motion.div>

                <div
                  className={`
                  absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center
                  text-xs font-semibold tracking-wider
                  transition-all duration-300
                  ${isExpanded ? "text-white scale-110" : "text-white/70"}
                `}
                  style={{ top: `${labelTop}px` }}
                >
                  {item.title}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <Card 
                        className="absolute left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-lg border-white/30 shadow-xl overflow-visible"
                        style={{
                          top: `${cardTop}px`,
                          width: `${cardWidth}px`,
                          boxShadow: `0 0 30px ${item.capabilityMetric.color}30, 0 0 60px ${item.capabilityMetric.color}15`,
                          borderColor: `${item.capabilityMetric.color}50`,
                        }}
                      >
                        <div 
                          className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4" 
                          style={{ backgroundColor: item.capabilityMetric.color }}
                        />
                        <CardHeader className="pb-1 px-3 pt-3">
                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              className="px-1.5 py-0.5 text-[10px] bg-transparent border shrink-0"
                              style={{ 
                                borderColor: `${item.capabilityMetric.color}80`,
                                color: item.capabilityMetric.color 
                              }}
                            >
                              {item.superpower}
                            </Badge>
                            <span className="text-[10px] font-mono text-white/50 text-right truncate max-w-[90px]">
                              {item.provider}
                            </span>
                          </div>
                          <CardTitle className="text-sm mt-1.5 text-white">
                            {item.title}
                          </CardTitle>
                          <p className="text-[11px] text-white/50">{item.tagline}</p>
                        </CardHeader>
                        <CardContent className="text-[11px] text-white/80 px-3 pb-3 pt-0">
                          <p className="line-clamp-2">{item.content}</p>

                          {/* Specs Grid - compact sizing */}
                          <div className="mt-2.5 pt-2 border-t border-white/10">
                            <div className="grid grid-cols-3 gap-1">
                              {item.specs.map((spec, idx) => (
                                <div 
                                  key={idx} 
                                  className="flex flex-col items-center justify-center p-1 rounded bg-white/5 border border-white/10 text-center min-h-[38px]"
                                >
                                  <span className="text-[7px] uppercase tracking-wider text-white/40 leading-tight line-clamp-1">{spec.label}</span>
                                  <span className="text-[9px] font-semibold text-white/90 mt-0.5 leading-tight line-clamp-1">{spec.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Capability Metric Bar */}
                          <div className="mt-2.5 pt-2 border-t border-white/10">
                            <div className="flex justify-between items-center text-[10px] mb-1">
                              <span className="flex items-center">
                                <Sparkles size={8} className="mr-1" style={{ color: item.capabilityMetric.color }} />
                                {item.capabilityMetric.name}
                              </span>
                              <span className="font-mono font-bold" style={{ color: item.capabilityMetric.color }}>
                                {item.capabilityMetric.score}%
                              </span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${item.capabilityMetric.score}%` }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                style={{ 
                                  background: `linear-gradient(90deg, ${item.capabilityMetric.color}80, ${item.capabilityMetric.color})`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Best For */}
                          <div className="mt-2.5 pt-2 border-t border-white/10">
                            <span className="text-[7px] uppercase tracking-wider text-white/40">Best For</span>
                            <p className="text-[10px] text-white/70 mt-0.5 line-clamp-2">{item.bestFor}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
    </div>
  );
}

export type { TimelineItem, RadialOrbitalTimelineProps, Spec, CapabilityMetric, VisualTheme };
