import { useState, useEffect } from 'react';
import { X, Settings, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/format';

export interface CardEffectSettings {
  // Tilt
  enableTilt: boolean;
  tiltIntensityX: number;
  tiltIntensityY: number;
  
  // Gradient
  gradientOpacity: number;
  gradientSize: number;
  gradientColor1: string;
  gradientColor2: string;
  
  // Shine
  shineOpacity: number;
  shineSize: number;
  
  // Glare
  glareOpacity: number;
  glareSize: number;
  glareColor: string;
  
  // Border
  borderOpacity: number;
  borderGlowOpacity: number;
  borderRadius: number;
  
  // Animation
  transitionDuration: number;
  
  // Card
  cardPadding: number;
  cardShadowIntensity: number;
}

const DEFAULT_SETTINGS: CardEffectSettings = {
  enableTilt: true,
  tiltIntensityX: 19.5,
  tiltIntensityY: 19.5,
  gradientOpacity: 0,
  gradientSize: 50,
  gradientColor1: '#ffef3d',
  gradientColor2: '#ff0000',
  shineOpacity: 0,
  shineSize: 150,
  glareOpacity: 0,
  glareSize: 200,
  glareColor: '#678eff',
  borderOpacity: 0.15,
  borderGlowOpacity: 0.2,
  borderRadius: 48,
  transitionDuration: 980,
  cardPadding: 16,
  cardShadowIntensity: 0.55
};

export function InteractiveCardController() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [settings, setSettings] = useState<CardEffectSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'tilt' | 'effects' | 'card'>('tilt');

  // Apply settings to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--card-tilt-x', settings.tiltIntensityX.toString());
    root.style.setProperty('--card-tilt-y', settings.tiltIntensityY.toString());
    root.style.setProperty('--card-gradient-opacity', settings.gradientOpacity.toString());
    root.style.setProperty('--card-gradient-size', `${settings.gradientSize}%`);
    root.style.setProperty('--card-gradient-color-1', settings.gradientColor1);
    root.style.setProperty('--card-gradient-color-2', settings.gradientColor2);
    root.style.setProperty('--card-shine-opacity', settings.shineOpacity.toString());
    root.style.setProperty('--card-shine-size', `${settings.shineSize}%`);
    root.style.setProperty('--card-glare-opacity', settings.glareOpacity.toString());
    root.style.setProperty('--card-glare-size', `${settings.glareSize}%`);
    root.style.setProperty('--card-glare-color', settings.glareColor);
    root.style.setProperty('--card-border-opacity', settings.borderOpacity.toString());
    root.style.setProperty('--card-border-glow', settings.borderGlowOpacity.toString());
    root.style.setProperty('--card-border-radius', `${settings.borderRadius}px`);
    root.style.setProperty('--card-transition', `${settings.transitionDuration}ms`);
    root.style.setProperty('--card-padding', `${settings.cardPadding}px`);
    root.style.setProperty('--card-shadow', settings.cardShadowIntensity.toString());
  }, [settings]);

  const updateSetting = <K extends keyof CardEffectSettings>(key: K, value: CardEffectSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const exportSettings = () => {
    const json = JSON.stringify(settings, null, 2);
    navigator.clipboard.writeText(json);
    alert('Settings copied to clipboard!');
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999]">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-xl hover:shadow-2xl transition-all"
        >
          <Settings className="h-5 w-5" />
          Card FX Controller
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-[380px]">
      <div className="rounded-2xl border border-white/20 bg-[#0A0F1A]/95 backdrop-blur-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-white">Interactive Card FX</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              title="Reset to defaults"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('tilt')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'tilt'
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-white/60 hover:text-white/80'
            )}
          >
            Tilt & Motion
          </button>
          <button
            onClick={() => setActiveTab('effects')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'effects'
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-white/60 hover:text-white/80'
            )}
          >
            Visual Effects
          </button>
          <button
            onClick={() => setActiveTab('card')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'card'
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-white/60 hover:text-white/80'
            )}
          >
            Card Style
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[500px] overflow-y-auto p-4 space-y-4">
          {activeTab === 'tilt' && (
            <>
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Enable Tilt</span>
                  <input
                    type="checkbox"
                    checked={settings.enableTilt}
                    onChange={(e) => updateSetting('enableTilt', e.target.checked)}
                    className="rounded"
                  />
                </label>
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Tilt X Intensity</span>
                  <span className="text-xs text-blue-400">{settings.tiltIntensityX}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={settings.tiltIntensityX}
                  onChange={(e) => updateSetting('tiltIntensityX', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Tilt Y Intensity</span>
                  <span className="text-xs text-blue-400">{settings.tiltIntensityY}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={settings.tiltIntensityY}
                  onChange={(e) => updateSetting('tiltIntensityY', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Transition Speed (ms)</span>
                  <span className="text-xs text-blue-400">{settings.transitionDuration}</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="10"
                  value={settings.transitionDuration}
                  onChange={(e) => updateSetting('transitionDuration', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          )}

          {activeTab === 'effects' && (
            <>
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Gradient Opacity</span>
                  <span className="text-xs text-blue-400">{settings.gradientOpacity.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.gradientOpacity}
                  onChange={(e) => updateSetting('gradientOpacity', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Gradient Size</span>
                  <span className="text-xs text-blue-400">{settings.gradientSize}%</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="10"
                  value={settings.gradientSize}
                  onChange={(e) => updateSetting('gradientSize', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block mb-2">
                  <span className="text-sm text-white/80">Gradient Color 1</span>
                </label>
                <input
                  type="color"
                  value={settings.gradientColor1}
                  onChange={(e) => updateSetting('gradientColor1', e.target.value)}
                  className="w-full h-10 rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2">
                  <span className="text-sm text-white/80">Gradient Color 2</span>
                </label>
                <input
                  type="color"
                  value={settings.gradientColor2}
                  onChange={(e) => updateSetting('gradientColor2', e.target.value)}
                  className="w-full h-10 rounded-lg"
                />
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Shine Opacity</span>
                  <span className="text-xs text-blue-400">{settings.shineOpacity.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.shineOpacity}
                  onChange={(e) => updateSetting('shineOpacity', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Glare Opacity</span>
                  <span className="text-xs text-blue-400">{settings.glareOpacity.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.glareOpacity}
                  onChange={(e) => updateSetting('glareOpacity', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block mb-2">
                  <span className="text-sm text-white/80">Glare Color</span>
                </label>
                <input
                  type="color"
                  value={settings.glareColor}
                  onChange={(e) => updateSetting('glareColor', e.target.value)}
                  className="w-full h-10 rounded-lg"
                />
              </div>
            </>
          )}

          {activeTab === 'card' && (
            <>
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Border Opacity</span>
                  <span className="text-xs text-blue-400">{settings.borderOpacity.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={settings.borderOpacity}
                  onChange={(e) => updateSetting('borderOpacity', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Border Glow Opacity</span>
                  <span className="text-xs text-blue-400">{settings.borderGlowOpacity.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.3"
                  step="0.01"
                  value={settings.borderGlowOpacity}
                  onChange={(e) => updateSetting('borderGlowOpacity', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Border Radius</span>
                  <span className="text-xs text-blue-400">{settings.borderRadius}px</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="48"
                  step="2"
                  value={settings.borderRadius}
                  onChange={(e) => updateSetting('borderRadius', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Card Padding</span>
                  <span className="text-xs text-blue-400">{settings.cardPadding}px</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="48"
                  step="2"
                  value={settings.cardPadding}
                  onChange={(e) => updateSetting('cardPadding', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Shadow Intensity</span>
                  <span className="text-xs text-blue-400">{settings.cardShadowIntensity.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.cardShadowIntensity}
                  onChange={(e) => updateSetting('cardShadowIntensity', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={exportSettings}
            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:from-blue-500 hover:to-purple-500 transition-all"
          >
            Copy Settings to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
}

