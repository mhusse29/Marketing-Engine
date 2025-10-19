import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { StageManager3DSettings } from './types';
import { defaultStageManager3DSettings } from './types';

interface StageManager3DControlProps {
  settings: StageManager3DSettings;
  onSettingsChange: (settings: StageManager3DSettings) => void;
}

export function StageManager3DControl({ settings, onSettingsChange }: StageManager3DControlProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [draft, setDraft] = useState<StageManager3DSettings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const updateSettings = (next: Partial<StageManager3DSettings>) => {
    setDraft((prev) => {
      const merged = { ...prev, ...next };
      console.log('StageManager3DControl - Settings changed:', merged);
      onSettingsChange(merged);
      return merged;
    });
  };

  const applyPreset = (preset: StageManager3DSettings) => {
    const next = { ...preset };
    setDraft(next);
    onSettingsChange(next);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-[100] bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl"
      style={{ width: isMinimized ? '200px' : '320px' }}
    >
      <div className="flex items-center justify-between p-4">
        <h3 className="text-white font-semibold text-sm">3D Stage Manager Controls</h3>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-white/60 hover:text-white text-lg transition-colors"
          title={isMinimized ? "Expand controls" : "Minimize controls"}
        >
          {isMinimized ? "▶" : "▼"}
        </button>
      </div>

      {/* Debug Info - Always Visible */}
      <div className="px-4 pb-2 text-xs text-white/60">
        <div>Rotate Y: {draft.rotateY}° | Z: {draft.translateZ}px</div>
        <div>Size: {draft.cardSize}px | Glass: {draft.glassBlur}px</div>
      </div>

      {!isMinimized && (
        <div className="px-4 pb-4 space-y-4">
          {/* Perspective */}
          <div>
            <label className="block text-xs text-white/80 mb-1">
              Perspective: {draft.perspective}px
            </label>
            <input
              type="range"
              min="1000"
              max="3000"
              step="100"
              value={draft.perspective}
              onChange={(e) => updateSettings({ perspective: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Translate Z (Depth) */}
          <div>
            <label className="block text-xs text-white/80 mb-1">
              Translate Z (Depth): {draft.translateZ}px
            </label>
            <input
              type="range"
              min="-200"
              max="-20"
              step="10"
              value={draft.translateZ}
              onChange={(e) => updateSettings({ translateZ: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Translate X (Horizontal) */}
          <div>
            <label className="block text-xs text-white/80 mb-1">
              Translate X (Horizontal): {draft.translateX}px
            </label>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={draft.translateX}
              onChange={(e) => updateSettings({ translateX: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Translate Y (Vertical) */}
          <div>
            <label className="block text-xs text-white/80 mb-1">
              Translate Y (Vertical): {draft.translateY}px
            </label>
            <input
              type="range"
              min="-10"
              max="20"
              step="1"
              value={draft.translateY}
              onChange={(e) => updateSettings({ translateY: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Rotate Y (Side Angle) */}
          <div>
            <label className="block text-xs text-white/80 mb-1">
              Rotate Y (Side Angle): {draft.rotateY}°
            </label>
            <input
              type="range"
              min="10"
              max="90"
              step="1"
              value={draft.rotateY}
              onChange={(e) => updateSettings({ rotateY: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Rotate X (Vertical Tilt) */}
          <div>
            <label className="block text-xs text-white/80 mb-1">
              Rotate X (Vertical Tilt): {draft.rotateX}°
            </label>
            <input
              type="range"
              min="-15"
              max="15"
              step="1"
              value={draft.rotateX}
              onChange={(e) => updateSettings({ rotateX: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Scale */}
          <div>
            <label className="block text-xs text-white/80 mb-1">
              Scale: {draft.scale.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.5"
              max="1.2"
              step="0.01"
              value={draft.scale}
              onChange={(e) => updateSettings({ scale: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Side Panel Width */}
          <div>
            <label className="block text-xs text-white/80 mb-1">
              Side Panel Width: {draft.sidePanelWidth}px
            </label>
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={draft.sidePanelWidth}
              onChange={(e) => updateSettings({ sidePanelWidth: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Side Panel Opacity */}
          <div>
            <label className="block text-xs text-white/80 mb-1">
              Side Panel Opacity: {draft.sidePanelOpacity}%
            </label>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={draft.sidePanelOpacity}
              onChange={(e) => updateSettings({ sidePanelOpacity: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Card Size */}
          <div>
            <label className="block text-xs text-white/80 mb-1">
              Card Size: {draft.cardSize}px
            </label>
            <input
              type="range"
              min="100"
              max="300"
              step="10"
              value={draft.cardSize}
              onChange={(e) => updateSettings({ cardSize: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Glass Blur */}
          <div>
            <label className="block text-xs text-white/80 mb-1">
              Glass Blur: {draft.glassBlur}px
            </label>
            <input
              type="range"
              min="0"
              max="30"
              step="2"
              value={draft.glassBlur}
              onChange={(e) => updateSettings({ glassBlur: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Glass Opacity */}
          <div>
            <label className="block text-xs text-white/80 mb-1">
              Glass Opacity: {draft.glassOpacity}%
            </label>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={draft.glassOpacity}
              onChange={(e) => updateSettings({ glassOpacity: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => applyPreset({
                translateZ: -120,
                translateX: 25,
                translateY: 8,
                rotateY: 60,
                rotateX: 8,
                scale: 0.85,
                perspective: 1500,
                sidePanelWidth: 10,
                sidePanelOpacity: 90,
                cardSize: 160,
                glassBlur: 12,
                glassOpacity: 5,
              })}
              className="px-3 py-1 text-xs bg-blue-500/30 hover:bg-blue-500/50 text-white rounded transition-colors"
            >
              Current
            </button>
            <button
              onClick={() => applyPreset({
                translateZ: -60,
                translateX: 12,
                translateY: 4,
                rotateY: 35,
                rotateX: 3,
                scale: 0.92,
                perspective: 1500,
                sidePanelWidth: 4,
                sidePanelOpacity: 60,
                cardSize: 140,
                glassBlur: 8,
                glassOpacity: 3,
              })}
              className="px-3 py-1 text-xs bg-green-500/30 hover:bg-green-500/50 text-white rounded transition-colors"
            >
              Subtle
            </button>
            <button
              onClick={() => applyPreset({
                translateZ: -120,
                translateX: 20,
                translateY: 6,
                rotateY: 60,
                rotateX: 5,
                scale: 0.88,
                perspective: 2500,
                sidePanelWidth: 8,
                sidePanelOpacity: 90,
                cardSize: 180,
                glassBlur: 18,
                glassOpacity: 8,
              })}
              className="px-3 py-1 text-xs bg-red-500/30 hover:bg-red-500/50 text-white rounded transition-colors"
            >
              Dramatic
            </button>
            <button
              onClick={() => applyPreset({
                translateZ: -100,
                translateX: 18,
                translateY: 5,
                rotateY: 50,
                rotateX: 4,
                scale: 0.9,
                perspective: 2000,
                sidePanelWidth: 6,
                sidePanelOpacity: 80,
                cardSize: 150,
                glassBlur: 10,
                glassOpacity: 4,
              })}
              className="px-3 py-1 text-xs bg-purple-500/30 hover:bg-purple-500/50 text-white rounded transition-colors"
            >
              macOS
            </button>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => applyPreset(defaultStageManager3DSettings)}
            className="w-full px-3 py-2 text-xs bg-gray-500/30 hover:bg-gray-500/50 text-white rounded transition-colors mt-2"
          >
            Reset All
          </button>
        </div>
      )}
    </motion.div>
  );
}
