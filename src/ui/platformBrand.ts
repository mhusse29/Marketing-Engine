export type PlatformKey =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'google'
  | 'google-ads'
  | 'youtube'
  | 'x'
  | 'snapchat'
  | 'pinterest';

export const BRAND_BG: Record<PlatformKey, string> = {
  facebook: '#1877F2',
  instagram: 'linear-gradient(135deg,#F58529 0%,#FEDA77 25%,#DD2A7B 50%,#8134AF 75%,#515BD4 100%)',
  tiktok: 'linear-gradient(135deg,#25F4EE 0%,#FE2C55 100%)',
  linkedin: '#0A66C2',
  google: '#1A73E8',
  'google-ads': '#5F6368',
  youtube: '#FF0000',
  x: '#0F1419',
  snapchat: '#FFFC00',
  pinterest: '#E60023',
};

export const NEUTRAL_BG = 'rgba(255,255,255,0.06)';
export const NEUTRAL_RING = 'rgba(255,255,255,0.18)';
