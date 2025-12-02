import { useContext } from 'react';

import { EdgeBlendSettingsContext } from './edgeBlendSettings';

export function useEdgeBlendSettings() {
  const context = useContext(EdgeBlendSettingsContext);

  if (!context) {
    throw new Error('useEdgeBlendSettings must be used within EdgeBlendSettingsProvider');
  }

  return context;
}
