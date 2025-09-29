export type CardKey = 'content' | 'pictures' | 'video';

// Settings Types
export type Goal = 'Awareness' | 'Traffic' | 'Leads' | 'Sales';

export type Platform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'x'
  | 'youtube';

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
export type CopyLength = 'Compact' | 'Standard' | 'Detailed';

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
  copyLength?: CopyLength;
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

export type PicturePromptIntent = 'hero' | 'variation' | 'detail';

export type PicturePrompt = {
  id: string;
  text: string;
  intent: PicturePromptIntent;
};

export type PictureAsset = {
  id: string;
  url: string;
  thumbUrl?: string;
  prompt: string;
  mimeType: string;
  width: number;
  height: number;
  seed?: string;
};

export type PictureResultMeta = {
  style: PicStyle;
  aspect: PicAspect;
  lockBrandColors: boolean;
  createdAt: string;
};

export type PictureProvider = 'gpt' | 'openai';

export type PictureRemixOptions = {
  mode?: 'prompt' | 'image';
  aspect?: PicAspect;
  versionCount?: number;
  prompt?: string;
};

export type GeneratedPictures =
  | {
      id: string;
      mode: 'prompt';
      provider: Extract<PictureProvider, 'gpt'>;
      prompts: PicturePrompt[];
      meta: PictureResultMeta;
    }
  | {
      id: string;
      mode: 'image';
      provider: Extract<PictureProvider, 'openai'>;
      assets: PictureAsset[];
      meta: PictureResultMeta & { prompt: string };
    };

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

export type ContentVariantResult = {
  platform?: string;
  headline?: string;
  primary_text?: string;
  cta_label?: string;
  hashtags?: string[];
  alt_text?: string;
  approx_length?: number;
  [key: string]: unknown;
};

export type ContentGenerationMeta = {
  model?: string;
  promptVersion?: string;
  platforms?: string[];
  versions?: number;
  salvaged?: boolean;
  triedPlain?: boolean;
  backfilled?: boolean;
  counts?: Record<string, number>;
  mock?: boolean;
  runId?: string;
  [key: string]: unknown;
};

export type CardsState = {
  enabled: Record<CardKey, boolean>;
  hidden: Record<CardKey, boolean>;
  order: CardKey[];
  selected: CardKey | null;
};
