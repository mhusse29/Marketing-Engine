import { useState } from 'react';
import type { ReactNode } from 'react';

import {
  DEFAULT_EDGE_BLEND_SETTINGS,
  EdgeBlendSettingsContext,
  type EdgeBlendSettings,
} from './edgeBlendSettings';

export function EdgeBlendSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<EdgeBlendSettings>(DEFAULT_EDGE_BLEND_SETTINGS);

  const updateSettings = (newSettings: Partial<EdgeBlendSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_EDGE_BLEND_SETTINGS);
  };

  return (
    <EdgeBlendSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </EdgeBlendSettingsContext.Provider>
  );
}
