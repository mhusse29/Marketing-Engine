"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface GlowSettings {
  blurIntensity: number;
  borderWidth: number;
  glowOpacity: number;
  cornerGlowOpacity: number;
  cornerGlowSize: number;
  duration: number;
  colors: string[];
}

interface GlowControlsProps {
  settings: GlowSettings;
  onSettingsChange: (settings: GlowSettings) => void;
  isVisible: boolean;
}

export function GlowControls({ settings, onSettingsChange, isVisible }: GlowControlsProps) {
  const [isOpen, setIsOpen] = useState(true);

  const updateSetting = <K extends keyof GlowSettings>(key: K, value: GlowSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const updateColor = (index: number, color: string) => {
    const newColors = [...settings.colors];
    newColors[index] = color;
    onSettingsChange({ ...settings, colors: newColors });
  };

  const copySettings = () => {
    const code = `<AnimatedBorderGradient
  isActive={isActivated}
  blurIntensity={${settings.blurIntensity}}
  borderWidth={${settings.borderWidth}}
  glowOpacity={${settings.glowOpacity}}
  cornerGlowOpacity={${settings.cornerGlowOpacity}}
  cornerGlowSize={${settings.cornerGlowSize}}
  duration={${settings.duration}}
  colors={${JSON.stringify(settings.colors)}}
/>`;
    navigator.clipboard.writeText(code);
    alert('Settings copied to clipboard!');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed top-4 right-4 z-[10000] font-mono text-xs"
      >
        <div className="bg-black/90 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden shadow-2xl min-w-[280px]">
          {/* Header */}
          <div 
            className="flex items-center justify-between px-4 py-2 bg-white/5 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="text-white/80 font-semibold">🎨 Glow Controls</span>
            <span className="text-white/50">{isOpen ? '−' : '+'}</span>
          </div>

          {isOpen && (
            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Blur Intensity */}
              <div className="space-y-1">
                <div className="flex justify-between text-white/60">
                  <span>Blur Intensity</span>
                  <span className="text-cyan-400">{settings.blurIntensity}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.blurIntensity}
                  onChange={(e) => updateSetting('blurIntensity', Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Border Width */}
              <div className="space-y-1">
                <div className="flex justify-between text-white/60">
                  <span>Border Width</span>
                  <span className="text-cyan-400">{settings.borderWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={settings.borderWidth}
                  onChange={(e) => updateSetting('borderWidth', Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Glow Opacity */}
              <div className="space-y-1">
                <div className="flex justify-between text-white/60">
                  <span>Glow Opacity</span>
                  <span className="text-cyan-400">{Math.round(settings.glowOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.glowOpacity * 100}
                  onChange={(e) => updateSetting('glowOpacity', Number(e.target.value) / 100)}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Corner Glow Opacity */}
              <div className="space-y-1">
                <div className="flex justify-between text-white/60">
                  <span>Corner Glow Opacity</span>
                  <span className="text-cyan-400">{Math.round(settings.cornerGlowOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.cornerGlowOpacity * 100}
                  onChange={(e) => updateSetting('cornerGlowOpacity', Number(e.target.value) / 100)}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Corner Glow Size */}
              <div className="space-y-1">
                <div className="flex justify-between text-white/60">
                  <span>Corner Glow Size</span>
                  <span className="text-cyan-400">{settings.cornerGlowSize}px</span>
                </div>
                <input
                  type="range"
                  min="32"
                  max="256"
                  value={settings.cornerGlowSize}
                  onChange={(e) => updateSetting('cornerGlowSize', Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Animation Speed */}
              <div className="space-y-1">
                <div className="flex justify-between text-white/60">
                  <span>Animation Speed</span>
                  <span className="text-cyan-400">{settings.duration}s</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={settings.duration}
                  onChange={(e) => updateSetting('duration', Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <span className="text-white/60">Gradient Colors</span>
                <div className="grid grid-cols-5 gap-2">
                  {settings.colors.map((color, index) => (
                    <div key={index} className="flex flex-col items-center gap-1">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => updateColor(index, e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-white/20"
                      />
                      <span className="text-white/40 text-[10px]">{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-2">
                <span className="text-white/60">Presets</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSettingsChange({
                      ...settings,
                      blurIntensity: 20,
                      borderWidth: 2,
                      glowOpacity: 0.3,
                      cornerGlowOpacity: 0.2,
                      cornerGlowSize: 80,
                      duration: 5,
                    })}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-white/70 transition-colors"
                  >
                    Subtle
                  </button>
                  <button
                    onClick={() => onSettingsChange({
                      ...settings,
                      blurIntensity: 40,
                      borderWidth: 3,
                      glowOpacity: 0.5,
                      cornerGlowOpacity: 0.4,
                      cornerGlowSize: 120,
                      duration: 4,
                    })}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-white/70 transition-colors"
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => onSettingsChange({
                      ...settings,
                      blurIntensity: 60,
                      borderWidth: 5,
                      glowOpacity: 0.7,
                      cornerGlowOpacity: 0.6,
                      cornerGlowSize: 180,
                      duration: 3,
                    })}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-white/70 transition-colors"
                  >
                    Strong
                  </button>
                  <button
                    onClick={() => onSettingsChange({
                      ...settings,
                      colors: ["#f97316", "#ec4899", "#a855f6", "#6366f1", "#3b82f6"],
                    })}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-white/70 transition-colors"
                  >
                    Apple AI
                  </button>
                </div>
              </div>

              {/* Copy Button */}
              <button
                onClick={copySettings}
                className="w-full px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 transition-colors"
              >
                📋 Copy Settings
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
