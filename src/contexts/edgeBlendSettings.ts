import { createContext } from 'react';

export interface EdgeBlendSettings {
  topEnabled: boolean;
  topHeight: number;
  topStartOpacity: number;
  topMidOpacity: number;
  topEndOpacity: number;
  topMidStop: number;
  topEndStop: number;
  bottomEnabled: boolean;
  bottomHeight: number;
  bottomStartOpacity: number;
  bottomMidOpacity: number;
  bottomEndOpacity: number;
  bottomMidStop: number;
  bottomEndStop: number;
  leftEnabled: boolean;
  leftWidth: number;
  leftStartOpacity: number;
  leftMidOpacity: number;
  leftEndOpacity: number;
  leftMidStop: number;
  leftEndStop: number;
  rightEnabled: boolean;
  rightWidth: number;
  rightStartOpacity: number;
  rightMidOpacity: number;
  rightEndOpacity: number;
  rightMidStop: number;
  rightEndStop: number;
  edgeColorR: number;
  edgeColorG: number;
  edgeColorB: number;
  backdropBlur: number;
  backdropBlurEnabled: boolean;
  radialEnabled: boolean;
  radialSize: number;
  radialCenterOpacity: number;
  radialEdgeOpacity: number;
  radialBlendMode: 'multiply' | 'overlay' | 'screen' | 'normal';
  overlayZIndex: number;
  imageZIndex: number;
}

export interface EdgeBlendSettingsContextValue {
  settings: EdgeBlendSettings;
  updateSettings: (settings: Partial<EdgeBlendSettings>) => void;
  resetSettings: () => void;
}

export const DEFAULT_EDGE_BLEND_SETTINGS: EdgeBlendSettings = {
  topEnabled: false,
  topHeight: 80,
  topStartOpacity: 0.92,
  topMidOpacity: 0.65,
  topEndOpacity: 0.25,
  topMidStop: 30,
  topEndStop: 60,
  bottomEnabled: false,
  bottomHeight: 80,
  bottomStartOpacity: 0.92,
  bottomMidOpacity: 0.65,
  bottomEndOpacity: 0.25,
  bottomMidStop: 30,
  bottomEndStop: 60,
  leftEnabled: false,
  leftWidth: 60,
  leftStartOpacity: 0.92,
  leftMidOpacity: 0.65,
  leftEndOpacity: 0.25,
  leftMidStop: 30,
  leftEndStop: 60,
  rightEnabled: false,
  rightWidth: 60,
  rightStartOpacity: 0.92,
  rightMidOpacity: 0.65,
  rightEndOpacity: 0.25,
  rightMidStop: 30,
  rightEndStop: 60,
  edgeColorR: 0,
  edgeColorG: 0,
  edgeColorB: 0,
  backdropBlur: 0,
  backdropBlurEnabled: false,
  radialEnabled: false,
  radialSize: 80,
  radialCenterOpacity: 0,
  radialEdgeOpacity: 0.2,
  radialBlendMode: 'multiply',
  overlayZIndex: 0,
  imageZIndex: -10,
};

export const EdgeBlendSettingsContext = createContext<EdgeBlendSettingsContextValue | undefined>(undefined);
