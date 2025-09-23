export type CardKey = 'content' | 'pictures' | 'video';

// Settings Types
export type Goal = 'Awareness' | 'Traffic' | 'Leads' | 'Sales';

export type Platform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'google.search'
  | 'google.display'
  | 'google.youtube';

export type Persona =
  | 'Generic'
  | 'First-time'
  | 'Warm lead'
  | 'B2B DM'
  | 'Returning';

export type Tone =
  | 'Friendly'
  | 'Informative'
  | 'Bold'
  | 'Premium'
  | 'Playful'
  | 'Professional';

export type Language = 'EN' | 'AR' | 'FR';

export type ContentFormat = 'Auto' | 'FB/IG' | 'LinkedIn' | 'TikTok' | 'X';

export type PicStyle = 'Product' | 'Lifestyle' | 'UGC' | 'Abstract';
export type PicAspect = '1:1' | '4:5' | '16:9';

export type VideoHook = 'Pain-point' | 'Bold claim' | 'Question' | 'Pattern interrupt';
export type VideoAspect = '9:16' | '1:1' | '16:9';

export type ContentQuickProps = {
  persona: Persona;
  tone: Tone;
  cta: string;
  language: Language;
  format?: ContentFormat;
  keywords?: string;
  avoid?: string;
  hashtags?: string;
};

export type PicturesQuickProps = {
  mode: 'images' | 'prompt';
  style: PicStyle;
  aspect: PicAspect;
  lockBrandColors: boolean;
  backdrop?: 'Clean' | 'Gradient' | 'Real-world' | string;
  lighting?: 'Soft' | 'Hard' | 'Neon' | string;
  negative?: string;
  quality?: 'High detail' | 'Sharp' | 'Minimal noise' | string;
};

export type VideoQuickProps = {
  duration: number;
  hook: VideoHook;
  aspect: VideoAspect;
  captions: boolean;
  cta: string;
  voiceover?: 'On-screen text only' | 'AI voiceover' | string;
  density?: 'Light (3–4)' | 'Medium (5–6)' | 'Fast (7–8)' | string;
  proof?: 'Social proof' | 'Feature highlight' | 'Before/After' | string;
  doNots?: string;
};

export type SettingsState = {
  mediaPlan: {
    budget: number | null;
    market: string | null;
    goal: Goal | null;
    currency: string | null;
    summary?: {
      impressions: number;
      reach: number;
      clicks: number;
      leads: number;
      roas: number;
    } | null;
  };
  platforms: Platform[];
  cards: {
    content: boolean;
    pictures: boolean;
    video: boolean;
  };
  quickProps: {
    content: ContentQuickProps;
    pictures: PicturesQuickProps;
    video: VideoQuickProps;
  };
  versions: 1 | 2;
};

// AI Types
export type GeneratedContent = {
  platform: Platform;
  headline: string;
  caption?: string;
  cta?: string;
};

export type GeneratedPictures =
  | { mode: 'prompt'; prompts: string[] }
  | { mode: 'uploads'; images: { src: string; enhancement: string }[] };

export type GeneratedVideo = {
  aspect: '9:16' | '1:1' | '16:9';
  durationSec: number;
  scriptBeats: { 
    label: 'Hook' | 'Value' | 'CTA' | 'Problem' | 'Solution' | 'Proof'; 
    text: string 
  }[];
  fullPrompt: string;
};

export type AiAttachment = {
  id: string;
  url: string;
  name: string;
  mime: string;
  kind: 'image' | 'document';
  extension: string;
  size: number;
};

export type AiUIState = {
  locked: boolean;
  brief: string;
  uploads: AiAttachment[];
  generating: boolean;
  steps: CardKey[];
  stepStatus: Partial<Record<CardKey, 'queued' | 'thinking' | 'rendering' | 'ready' | 'error'>>;
  outputs: {
    content?: { versions: GeneratedContent[][] }; // per version -> per platform
    pictures?: { versions: GeneratedPictures[] };
    video?: { versions: GeneratedVideo[] };
  };
};

export type CardsState = {
  enabled: Record<CardKey, boolean>;
  hidden: Record<CardKey, boolean>;
  order: CardKey[];
  selected: CardKey | null;
};
