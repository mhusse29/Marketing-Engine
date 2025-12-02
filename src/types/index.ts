export type CardKey = 'content' | 'pictures' | 'video' | 'media-plan';

// Settings Types
export type Goal = 'Awareness' | 'Traffic' | 'Leads' | 'Sales';

// Media Plan Types
export type CampaignDuration = '1-month' | '3-months' | '6-months' | '1-year' | 'custom';
export type CampaignObjective = 'awareness' | 'leads' | 'sales' | 'traffic' | 'engagement';
export type ChartMetricType = 'roi' | 'conversion' | 'engagement';

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

export type PicturesProvider = 'flux' | 'stability' | 'openai' | 'ideogram' | 'gemini' | 'runway';
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

// Gemini Imagen 3 types
export type GeminiModel = 'gemini-3-pro-image-preview' | 'gemini-2.5-flash-preview-image';
export type GeminiResolution = '1K' | '2K' | '4K';
export type GeminiAspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';

// Runway Gen-4 Image types
export type RunwayImageModel = 'gen4_image' | 'gen4_image_turbo';
export type RunwayImageRatio = '1024:1024' | '1080:1080' | '720:720' | '1920:1080' | '1080:1920' | '1280:720' | '720:1280' | '1440:1080' | '1080:1440';

export type VideoHook = 'Pain-point' | 'Bold claim' | 'Question' | 'Pattern interrupt';
export type VideoAspect = '9:16' | '1:1' | '16:9';

// Runway Video Models - Supported by API key
export type RunwayModel = 
  | 'gen4_turbo'   // Gen-4 Turbo - Fast, high quality (5s or 10s)
  | 'gen3a_turbo'  // Gen-3 Alpha Turbo - Legacy, reliable (5s or 10s)
  | 'veo3';        // Google Veo 3 via Runway (8s fixed)

export type LumaModel = 'ray-2'; // Luma Ray model (ray-2 is currently available)
export type VideoModel = RunwayModel | LumaModel;

// Duration types per model
export type Gen4TurboDuration = 5 | 10;  // Gen-4 Turbo supports 5s or 10s
export type Gen3aTurboDuration = 5 | 10; // Gen-3 Alpha Turbo supports 5s or 10s
export type Veo3Duration = 8;            // Veo-3 fixed 8-second duration
export type VideoDuration = Gen4TurboDuration | Gen3aTurboDuration | Veo3Duration;
export type LumaDuration = '5s' | '9s'; // Luma Ray-2 duration options
export type LumaResolution = '720p' | '1080p'; // Luma resolution options

// Runway model-specific aspect ratios
export type Gen4TurboRatio = '1280:720' | '720:1280' | '1104:832' | '832:1104' | '960:960' | '1584:672';
export type Gen3aTurboRatio = '1280:768' | '768:1280';

// Luma-specific advanced parameters
export type LumaCameraMovement = 'static' | 'pan_left' | 'pan_right' | 'zoom_in' | 'zoom_out' | 'orbit_right';
export type LumaCameraAngle = 'low' | 'eye_level' | 'high' | 'bird_eye';
export type LumaCameraDistance = 'close_up' | 'medium' | 'wide' | 'extreme_wide';
export type LumaStyle = 'cinematic' | 'photorealistic' | 'artistic' | 'animated' | 'vintage';
export type LumaLighting = 'natural' | 'dramatic' | 'soft' | 'hard' | 'golden_hour' | 'blue_hour';
export type LumaMood = 'energetic' | 'calm' | 'mysterious' | 'joyful' | 'serious' | 'epic';
export type LumaMotionIntensity = 'minimal' | 'moderate' | 'high' | 'extreme';
export type LumaMotionSpeed = 'slow_motion' | 'normal' | 'fast_motion';
export type LumaSubjectMovement = 'static' | 'subtle' | 'active' | 'dynamic';
export type LumaQuality = 'standard' | 'high' | 'premium';
export type LumaColorGrading = 'natural' | 'warm' | 'cool' | 'dramatic' | 'desaturated';
export type LumaFilmLook = 'digital' | '35mm' | '16mm' | 'vintage';
export type RunwayRatio = Gen4TurboRatio | Gen3aTurboRatio;
export type VideoProvider = 'runway' | 'luma' | 'auto';

// Runway model configuration metadata
export type RunwayModelConfig = {
  id: RunwayModel;
  name: string;
  description: string;
  durations: number[];
  ratios: string[];
  features: string[];
  maxPromptLength: number;
};

// Advanced Video Parameters
export type CameraMovement = 'static' | 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down' | 
                            'zoom_in' | 'zoom_out' | 'dolly_forward' | 'dolly_back' | 
                            'orbit_left' | 'orbit_right' | 'crane_up' | 'crane_down' | 'fpv';

export type VisualStyle = 'photorealistic' | 'cinematic' | 'animated' | 'artistic' | 
                         'vintage' | 'modern' | 'noir' | 'vibrant' | 'muted';

export type LightingStyle = 'natural' | 'golden_hour' | 'blue_hour' | 'studio' | 
                           'dramatic' | 'soft' | 'hard' | 'neon' | 'backlit';

export type MotionSpeed = 'slow_motion' | 'normal' | 'fast_motion' | 'time_lapse';
export type MotionAmount = 'minimal' | 'moderate' | 'high' | 'extreme';

export type VideoMood = 'energetic' | 'calm' | 'mysterious' | 'joyful' | 'serious' | 
                       'dreamlike' | 'tense' | 'romantic' | 'epic';

export type SubjectFocus = 'wide' | 'medium' | 'close_up' | 'extreme_close_up';

export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'sunset' | 
                       'blue_hour' | 'night' | 'golden_hour';

export type Weather = 'clear' | 'cloudy' | 'rainy' | 'foggy' | 'snowy' | 'stormy';

export type FilmLook = '35mm' | '16mm' | '70mm' | 'digital' | 'vintage_film';

export type ColorGrading = 'natural' | 'warm' | 'cool' | 'desaturated' | 
                          'high_contrast' | 'low_contrast' | 'cinematic';

export type DepthOfField = 'shallow' | 'medium' | 'deep';

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
  promptImages?: string[]; // Base64 images for reference (FLUX: 1, Stability: multiple, Ideogram: up to 3)
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
  // Gemini Imagen 3 settings
  geminiModel: GeminiModel;
  geminiResolution: GeminiResolution;
  geminiThinking: boolean; // Enable thinking mode for complex prompts
  geminiGrounding: boolean; // Enable Google Search grounding
  // Runway Gen-4 Image settings
  runwayImageModel: RunwayImageModel;
  runwayImageRatio: RunwayImageRatio;
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
  // Provider selection
  provider: VideoProvider;
  // Runway API parameters
  model: VideoModel;
  promptText: string;
  promptImages?: string[]; // Base64 images for image-to-video (Runway: 1, Luma: multiple)
  duration: VideoDuration;
  aspect: VideoAspect;
  watermark: boolean;
  seed?: number;
  // Runway model-specific duration (gen4_turbo/gen3a_turbo: 5|10, veo3: 8 fixed)
  runwayDuration?: number;
  // Luma-specific parameters
  lumaLoop?: boolean; // Whether to make the video loop seamlessly
  lumaDuration?: LumaDuration; // Luma duration: 5s or 9s (ray-2)
  lumaResolution?: LumaResolution; // Luma resolution: 720p or 1080p
  lumaKeyframes?: {
    frame0?: {
      type: 'image' | 'generation';
      url?: string; // For image keyframe
    };
    frame1?: {
      type: 'image' | 'generation';
      url?: string; // For image keyframe
    };
  };
  
  // Luma advanced parameters (matching Veo-3 style)
  lumaCameraMovement?: LumaCameraMovement;
  lumaCameraAngle?: LumaCameraAngle;
  lumaCameraDistance?: LumaCameraDistance;
  lumaStyle?: LumaStyle;
  lumaLighting?: LumaLighting;
  lumaMood?: LumaMood;
  lumaMotionIntensity?: LumaMotionIntensity;
  lumaMotionSpeed?: LumaMotionSpeed;
  lumaSubjectMovement?: LumaSubjectMovement;
  lumaQuality?: LumaQuality;
  lumaColorGrading?: LumaColorGrading;
  lumaFilmLook?: LumaFilmLook;
  lumaSeed?: number; // For reproducible results
  lumaNegativePrompt?: string; // What to avoid
  lumaGuidanceScale?: number; // How closely to follow prompt (1-20)
  
  // Camera & Movement
  cameraMovement?: CameraMovement;
  motionSpeed?: MotionSpeed;
  motionAmount?: MotionAmount;
  
  // Visual & Style
  visualStyle?: VisualStyle;
  lightingStyle?: LightingStyle;
  mood?: VideoMood;
  
  // Framing & Composition
  subjectFocus?: SubjectFocus;
  depthOfField?: DepthOfField;
  
  // Environment
  timeOfDay?: TimeOfDay;
  weather?: Weather;
  
  // Professional Film
  filmLook?: FilmLook;
  colorGrading?: ColorGrading;
  
  // Advanced prompt engineering
  enhancePrompt?: boolean;
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

export type MediaPlanSummary = {
  impressions: number;
  reach: number;
  clicks: number;
  leads: number;
  roas: number;
};

export type MediaPlanAllocation = {
  platform: string;
  spendPercent: number;
  cpa?: number | null;
  reach?: number | null;
  status?: 'increased' | 'decreased' | 'steady';
};

export type MediaPlanScenario = Goal;

export type ChannelMode = 'auto' | 'manual';

export type MediaPlanState = {
  budget: number | null;
  market: string | null;
  goal: Goal | null;
  currency: string | null;
  niche: string | null;
  leadToSalePct: number | null;
  revenuePerSale: number | null;
  manageFx: boolean;
  channels: string[];
  channelMode: ChannelMode;
  channelSplits: Record<string, number>;
  manualCplEnabled: boolean;
  manualCplValues: Record<string, number | null>;
  summary: MediaPlanSummary | null;
  allocations: MediaPlanAllocation[];
  scenario: MediaPlanScenario | null;
  notes: string | null;
  lastSyncedAt: string | null;
  plannerValidatedAt: string | null;
  channelsValidatedAt: string | null;
  advancedValidatedAt: string | null;
  // New timeline fields
  campaignDuration: CampaignDuration;
  campaignStartDate: string | null;
  campaignEndDate: string | null;
  campaignObjective: CampaignObjective | null;
  targetAudienceSize: number | null;
};

export type SettingsState = {
  mediaPlan: MediaPlanState;
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

export type PictureProvider = 'flux' | 'stability' | 'openai' | 'ideogram' | 'gemini' | 'runway';

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
  url: string;
  taskId: string;
  model: string;
  provider: VideoProvider;
  duration: number;
  aspect: string;
  watermark: boolean;
  prompt: string;
  createdAt: string;
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
  pinned: Record<CardKey, boolean>;
};
