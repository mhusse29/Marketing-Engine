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
export type PicAspect = '1:1' | '4:5' | '16:9' | '2:3' | '3:2' | '7:9' | '9:7';

export type PicturesProvider = 'flux' | 'stability' | 'openai' | 'ideogram';
export type PicturesProviderKey = PicturesProvider | 'auto';
export type PictureOutputFormat = 'png' | 'jpeg' | 'webp';
export type FluxMode = 'standard' | 'ultra';
export type StabilityModel = 'large-turbo' | 'large' | 'medium';
export type IdeogramModel = 'v1' | 'v2' | 'turbo';
export type IdeogramMagicPrompt = 'auto' | 'on' | 'off';
export type IdeogramStyleType =
  | 'auto'
  | 'general'
  | 'realistic'
  | 'design'
  | 'render3d'
  | 'anime'
  | 'illustration'
  | 'logo'
  | 'poster'
  | 'product';

export type VideoHook = 'Pain-point' | 'Bold claim' | 'Question' | 'Pattern interrupt';
export type VideoAspect = '9:16' | '1:1' | '16:9';
export type RunwayModel = 'gen3a_turbo' | 'gen3a';
export type VideoDuration = 5 | 10;
export type RunwayRatio = '1280:768' | '768:1280' | '1024:1024';

export type AiAttachment = {
  id: string;
  url: string;
  name: string;
  mime: string;
  kind: 'image' | 'document';
  extension: string;
  size: number;
  dataUrl?: string;
};

export type ContentQuickProps = {
  persona: Persona;
  tone: Tone;
  cta: string;
  language: Language;
  format?: ContentFormat;
  copyLength: CopyLength;
  keywords?: string;
  avoid?: string;
  hashtags?: string;
  brief: string;
  attachments: AiAttachment[];
  validated: boolean;
  validatedAt?: string | null;
};

export type PicturesValidatedPrompts = Partial<Record<PicturesProvider, string>>;

export type PicturesQuickProps = {
  imageProvider: PicturesProviderKey;
  mode: 'images' | 'prompt';
  style: PicStyle;
  aspect: PicAspect;
  promptText: string;
  validated: boolean;
  // DALL-E settings
  dalleQuality: 'standard' | 'hd';
  dalleStyle: 'vivid' | 'natural';
  // FLUX settings
  fluxMode: FluxMode;
  fluxGuidance: number;
  fluxSteps: number;
  fluxPromptUpsampling: boolean;
  fluxRaw: boolean;
  fluxOutputFormat: 'jpeg' | 'png' | 'webp';
  // Stability settings
  stabilityModel: StabilityModel;
  stabilityCfg: number;
  stabilitySteps: number;
  stabilityNegativePrompt: string;
  stabilityStylePreset: string;
  // Ideogram settings
  ideogramModel: IdeogramModel;
  ideogramMagicPrompt: boolean;
  ideogramStyleType: 'AUTO' | 'GENERAL' | 'REALISTIC' | 'DESIGN' | 'RENDER_3D' | 'ANIME';
  ideogramNegativePrompt: string;
  // Advanced settings
  lockBrandColors: boolean;
  backdrop?: 'Clean' | 'Gradient' | 'Real-world' | string;
  lighting?: 'Soft' | 'Hard' | 'Neon' | string;
  negative?: string;
  quality?: 'High detail' | 'Sharp' | 'Minimal noise' | string;
  composition?: string;
  camera?: string;
  mood?: string;
  colourPalette?: string;
  finish?: string;
  texture?: string;
};

export type VideoQuickProps = {
  // Runway API parameters
  model: RunwayModel;
  promptText: string;
  duration: VideoDuration;
  aspect: VideoAspect;
  watermark: boolean;
  seed?: number;
  
  // Advanced video settings (for prompt engineering)
  hook: VideoHook;
  captions: boolean;
  cta: string;
  voiceover?: 'On-screen text only' | 'AI voiceover' | string;
  density?: 'Light (3–4)' | 'Medium (5–6)' | 'Fast (7–8)' | string;
  proof?: 'Social proof' | 'Feature highlight' | 'Before/After' | string;
  doNots?: string;
  
  // Validation
  validated: boolean;
  validatedAt?: string | null;
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
  provider: PictureProvider;
  mode: 'prompt' | 'image';
  prompt?: string;
  model?: string;
  quality?: string;
  outputFormat?: PictureOutputFormat;
  guidance?: number;
  steps?: number;
  blend?: number;
  safetyTolerance?: number;
};

export type PictureProvider = 'flux' | 'stability' | 'openai' | 'ideogram';

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
      provider: PictureProvider;
      prompt: string;
      meta: PictureResultMeta;
    }
  | {
      id: string;
      mode: 'image';
      provider: PictureProvider;
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
