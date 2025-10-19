import type { CardKey } from '../../types';

export type StageManager3DSettings = {
  translateZ: number;
  translateX: number;
  translateY: number;
  rotateY: number;
  rotateX: number;
  scale: number;
  perspective: number;
  sidePanelWidth: number;
  sidePanelOpacity: number;
  cardSize: number;
  glassBlur: number;
  glassOpacity: number;
};

export type StageManagerTraySettings = {
  paddingX: number;
  paddingY: number;
  borderRadius: number;
  blur: number;
  opacity: number;
  saturation: number;
  borderOpacity: number;
  shadowStrength: number;
  backgroundPreset: 'midnight' | 'onyx' | 'carbon' | 'aurora';
  backgroundCustom?: string;
};

export type StageManagerContentData = {
  platformId?: string;
  platformLabel?: string;
  headline?: string;
  caption?: string;
  hashtags?: string;
};

export type StageManagerEntryData = {
  content?: StageManagerContentData;
  pictures?: { url: string; provider?: string };
  video?: { url: string; provider?: string; model?: string };
};

export type StageManagerEntry = {
  id: string;
  cardType: CardKey;
  createdAt: number;
  data?: StageManagerEntryData;
};

export type StageManagerEntryInput = {
  cardType: CardKey;
  data?: StageManagerEntryData;
};

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `stage-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
};

export const createStageManagerEntry = (input: StageManagerEntryInput): StageManagerEntry => ({
  id: createId(),
  cardType: input.cardType,
  createdAt: Date.now(),
  data: input.data,
});

export const defaultStageManager3DSettings: StageManager3DSettings = {
  translateZ: -200,
  translateX: 9,
  translateY: -9,
  rotateY: 46,
  rotateX: 3,
  scale: 0.98,
  perspective: 2100,
  sidePanelWidth: 2,
  sidePanelOpacity: 25,
  cardSize: 300,
  glassBlur: 0,
  glassOpacity: 3,
};

export const defaultStageManagerTraySettings: StageManagerTraySettings = {
  paddingX: 0,
  paddingY: 20,
  borderRadius: 23,
  blur: 0,
  opacity: 0.4,
  saturation: 0.8,
  borderOpacity: 0,
  shadowStrength: 0,
  backgroundPreset: 'midnight',
  backgroundCustom: '',
};
