import type {
  SettingsState,
  ContentQuickProps,
  Language,
  Persona,
  Tone,
  ContentFormat,
  CopyLength,
  PicturesQuickProps,
  PicStyle,
  PicAspect,
  PicturesProviderKey,
  OpenAIImageModel,
  OpenAIImageQuality,
  OpenAIImageBackground,
  PictureOutputFormat,
  FluxMode,
  StabilityModel,
  IdeogramModel,
  GeminiModel,
  GeminiResolution,
  RunwayImageModel,
  RunwayImageRatio,
  VideoQuickProps,
  VideoHook,
  VideoAspect,
  VideoProvider,
  VideoModel,
  VideoDuration,
  RunwayModel,
  LumaModel,
  GoogleVeoModel,
  GoogleVeoDuration,
  SoraModel,
  SoraModelConfig,
  AiAttachment,
  RunwayModelConfig,
  GoogleVeoModelConfig,
} from '../types';
import { MAX_PICTURE_PROMPT_LENGTH } from './picturesPrompts';

const STORAGE_KEY = 'marketingEngine.settings.v1';

const CTA_MAX_LENGTH = 60;
const VIDEO_DURATION_MIN = 6;
const VIDEO_DURATION_MAX = 30;
// Runway API limit is 1000. Frontend allows up to 2000 chars for AI refinement on backend
const MAX_VIDEO_PROMPT_LENGTH = 2000;

const PERSONAS: readonly Persona[] = ['Generic', 'First-time', 'Warm lead', 'B2B DM', 'Returning'];
const TONES: readonly Tone[] = ['Friendly', 'Informative', 'Bold', 'Premium', 'Playful', 'Professional'];
const LANGUAGES: readonly Language[] = ['EN', 'AR', 'FR'];
const CONTENT_FORMATS: readonly ContentFormat[] = ['Auto', 'FB/IG', 'LinkedIn', 'TikTok', 'X'];
// const STANDARD_CTAS = [
//   'Learn more',
//   'Get a demo',
//   'Sign up',
//   'Shop now',
//   'Start free trial',
//   'Book a call',
//   'Download guide',
// ] as const;

const PICTURE_STYLES: readonly PicStyle[] = ['Product', 'Lifestyle', 'UGC', 'Abstract'];
const PICTURE_ASPECTS: readonly PicAspect[] = ['1:1', '4:5', '16:9', '2:3', '3:2', '7:9', '9:7'];

const VIDEO_HOOKS: readonly VideoHook[] = ['Pain-point', 'Bold claim', 'Question', 'Pattern interrupt'];
const VIDEO_ASPECTS: readonly VideoAspect[] = ['9:16', '1:1', '16:9'];
const VIDEO_VOICEOVER_OPTIONS = ['On-screen text only', 'AI voiceover'] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// RUNWAY MODEL CONFIGURATIONS
// Based on API testing and documentation: https://docs.dev.runwayml.com/assets/inputs/
// ═══════════════════════════════════════════════════════════════════════════════

export const RUNWAY_MODEL_CONFIGS: Record<RunwayModel, RunwayModelConfig> = {
  gen4_turbo: {
    id: 'gen4_turbo',
    name: 'Gen-4 Turbo',
    description: 'Latest flagship model - Fast, high quality video generation',
    durations: [5, 10],
    ratios: ['1280:720', '720:1280', '1104:832', '832:1104', '960:960', '1584:672'],
    features: ['Fastest Gen-4', 'Cinema quality', 'Multiple durations', 'Wide aspect ratios'],
    maxPromptLength: 1000,
  },
  gen3a_turbo: {
    id: 'gen3a_turbo',
    name: 'Gen-3 Alpha Turbo',
    description: 'Legacy model - Reliable and well-tested',
    durations: [5, 10],
    ratios: ['1280:768', '768:1280'],
    features: ['Proven reliability', 'Fast generation', 'Good for portraits'],
    maxPromptLength: 1000,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE VEO MODEL CONFIGURATIONS
// Native Google API - 62.5% cheaper than via Runway for Veo 3 Fast
// ═══════════════════════════════════════════════════════════════════════════════

export const GOOGLE_VEO_MODEL_CONFIGS: Record<GoogleVeoModel, GoogleVeoModelConfig> = {
  'veo-3': {
    id: 'veo-3',
    name: 'Veo 3',
    description: 'High quality video with native audio',
    durations: [5, 6, 7, 8],
    aspects: ['16:9', '9:16', '1:1'],
    features: ['Native audio', 'High quality', 'Up to 8s', 'Best results'],
    costPerSecond: 0,
    maxPromptLength: 1000,
  },
  'veo-3-fast': {
    id: 'veo-3-fast',
    name: 'Veo 3 Fast',
    description: 'Faster video generation with native audio',
    durations: [5, 6, 7, 8],
    aspects: ['16:9', '9:16', '1:1'],
    features: ['Fast generation', 'Native audio', 'Up to 8s'],
    costPerSecond: 0,
    maxPromptLength: 1000,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// OPENAI SORA MODEL CONFIGURATIONS
// OpenAI's video generation models
// ═══════════════════════════════════════════════════════════════════════════════

export const SORA_MODEL_CONFIGS: Record<SoraModel, SoraModelConfig> = {
  'sora-2': {
    id: 'sora-2',
    name: 'Sora 2',
    description: 'Speed and flexibility for fast video generation',
    durations: [5, 10, 15, 20],
    sizes: ['720x1280', '1280x720'], // sora-2 only supports 720p sizes
    features: ['Fast generation', 'Up to 20s', '720p quality', 'Text-to-video'],
    costPerSecond: 0.10,
    maxPromptLength: 1000,
  },
  'sora-2-pro': {
    id: 'sora-2-pro',
    name: 'Sora 2 Pro',
    description: 'Premium quality for professional video content',
    durations: [5, 10, 15, 20],
    sizes: ['720x1280', '1280x720', '1024x1792', '1792x1024'], // Pro supports larger sizes
    features: ['Best quality', 'Up to 20s', 'HD sizes', 'Enhanced detail'],
    costPerSecond: 0.20,
    maxPromptLength: 1000,
  },
};

// Helper to get aspect ratio mapping for each model
export const RUNWAY_ASPECT_TO_RATIO: Record<RunwayModel, Record<VideoAspect, string>> = {
  gen4_turbo: {
    '16:9': '1280:720',   // Landscape widescreen
    '9:16': '720:1280',   // Portrait mobile
    '1:1': '960:960',     // Square
  },
  gen3a_turbo: {
    '16:9': '1280:768',   // Landscape (slightly different ratio)
    '9:16': '768:1280',   // Portrait
    '1:1': '1280:768',    // No square, fallback to landscape
  },
};
const VIDEO_DENSITY_OPTIONS = ['Light (3–4)', 'Medium (5–6)', 'Fast (7–8)'] as const;
const VIDEO_PROOF_OPTIONS = ['Social proof', 'Feature highlight', 'Before/After'] as const;
const VIDEO_DONOT_OPTIONS = ['No claims', 'No cramped shots', 'No busy bg'] as const;

const defaultContentQuickProps: ContentQuickProps = {
  persona: 'Generic',
  tone: 'Friendly',
  cta: 'Learn more',
  language: 'EN',
  format: 'Auto',
  copyLength: 'Standard',
  keywords: '',
  avoid: '',
  hashtags: '',
  brief: '',
  attachments: [],
  validated: false,
  validatedAt: null,
};

const defaultPicturesQuickProps: PicturesQuickProps = {
  imageProvider: 'auto',
  mode: 'images',
  style: undefined, // Let user choose
  aspect: undefined, // Let user choose - REQUIRED field
  promptText: '',
  validated: false,
  // DALL-E
  dalleQuality: undefined, // Let user choose - REQUIRED field
  dalleStyle: undefined, // Let user choose
  // OpenAI GPT Image
  openaiImageModel: undefined, // Let user choose
  openaiQuality: undefined, // Let user choose
  openaiOutputFormat: undefined, // Let user choose
  openaiBackground: undefined, // Let user choose
  openaiOutputCompression: undefined, // Optional
  // FLUX
  fluxMode: undefined, // Let user choose - REQUIRED field
  fluxGuidance: undefined, // Let user choose
  fluxSteps: undefined, // Let user choose
  fluxPromptUpsampling: undefined, // Let user choose
  fluxRaw: undefined, // Let user choose
  fluxOutputFormat: undefined, // Let user choose
  // Stability
  stabilityModel: undefined, // Let user choose - REQUIRED field
  stabilityCfg: undefined, // Let user choose
  stabilitySteps: undefined, // Let user choose
  stabilityNegativePrompt: '',
  stabilityStylePreset: undefined, // Let user choose
  // Ideogram
  ideogramModel: undefined, // Let user choose - REQUIRED field
  ideogramMagicPrompt: undefined, // Let user choose
  ideogramStyleType: undefined, // Let user choose
  ideogramNegativePrompt: '',
  // Gemini Imagen 3
  geminiModel: undefined, // Let user choose - REQUIRED field
  geminiResolution: undefined, // Let user choose
  geminiThinking: undefined, // Let user choose
  geminiGrounding: undefined, // Let user choose
  // Runway Gen-4 Image
  runwayImageModel: undefined, // Let user choose - REQUIRED field
  runwayImageRatio: undefined, // Let user choose - REQUIRED field
};

const defaultVideoQuickProps: VideoQuickProps = {
  // Provider selection
  provider: 'auto' as VideoProvider, // Show provider selection first
  // Runway API parameters
  model: 'gen4_turbo', // Default to Gen-4 Turbo (fastest, highest quality)
  promptText: '',
  promptImages: undefined,
  duration: 5, // Gen-4 Turbo default: 5 seconds (also supports 10s)
  aspect: '9:16',
  watermark: false,
  seed: undefined,
  // Runway model-specific duration (for models with multiple options)
  runwayDuration: 5, // 5s or 10s for gen4_turbo/gen3a_turbo
  // Google Veo-specific parameters
  googleVeoModel: 'veo-3-fast' as GoogleVeoModel, // Default to budget-friendly option
  googleVeoDuration: 8 as GoogleVeoDuration, // Default to 8 seconds
  googleVeoAudio: true, // Enable native audio by default
  // Luma-specific parameters
  lumaLoop: false,
  lumaDuration: '5s',
  lumaResolution: '1080p',
  lumaKeyframes: undefined,
  
  // Luma advanced parameters (matching Veo-3 style)
  lumaCameraMovement: 'static',
  lumaCameraAngle: 'eye_level',
  lumaCameraDistance: 'medium',
  lumaStyle: 'cinematic',
  lumaLighting: 'natural',
  lumaMood: 'energetic',
  lumaMotionIntensity: 'moderate',
  lumaMotionSpeed: 'normal',
  lumaSubjectMovement: 'subtle',
  lumaQuality: 'standard',
  lumaColorGrading: 'natural',
  lumaFilmLook: 'digital',
  lumaSeed: undefined,
  lumaNegativePrompt: '',
  lumaGuidanceScale: 7.5,
  
  // Camera & Movement
  cameraMovement: 'static',
  motionSpeed: 'normal',
  motionAmount: 'moderate',
  
  // Visual & Style
  visualStyle: 'cinematic',
  lightingStyle: 'natural',
  mood: 'energetic',
  
  // Framing & Composition
  subjectFocus: 'medium',
  depthOfField: 'medium',
  
  // Environment
  timeOfDay: 'golden_hour',
  weather: 'clear',
  
  // Professional Film
  filmLook: '35mm',
  colorGrading: 'natural',
  
  // Advanced prompt engineering
  enhancePrompt: false,
  hook: 'Question',
  captions: true,
  cta: 'Learn more',
  voiceover: 'On-screen text only',
  density: 'Medium (5–6)',
  proof: 'Social proof',
  doNots: 'No claims',
  
  // Validation
  validated: false,
  validatedAt: null,
};

function asCopyLength(value: unknown, fallback: CopyLength): CopyLength {
  return (['Compact', 'Standard', 'Detailed'] as CopyLength[]).includes(value as CopyLength)
    ? (value as CopyLength)
    : fallback;
}

function sanitizeAttachments(items: unknown): AiAttachment[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item): item is AiAttachment => {
      if (!item || typeof item !== 'object') return false;
      const record = item as Partial<AiAttachment>;
      return (
        typeof record.id === 'string' &&
        typeof record.url === 'string' &&
        typeof record.name === 'string' &&
        typeof record.mime === 'string' &&
        typeof record.kind === 'string' &&
        typeof record.extension === 'string' &&
        typeof record.size === 'number'
      );
    })
    .map((item) => ({
      ...item,
      dataUrl: typeof item.dataUrl === 'string' ? item.dataUrl : undefined,
    }));
}

function normalizeContentQuickProps(
  content: Partial<ContentQuickProps> | undefined
): ContentQuickProps {
  const candidate = {
    ...defaultContentQuickProps,
    ...content,
  };

  const persona = PERSONAS.includes(candidate.persona) ? candidate.persona : defaultContentQuickProps.persona;
  const tone = TONES.includes(candidate.tone) ? candidate.tone : defaultContentQuickProps.tone;
  const language = LANGUAGES.includes(candidate.language)
    ? candidate.language
    : defaultContentQuickProps.language;
  const format = candidate.format && CONTENT_FORMATS.includes(candidate.format)
    ? candidate.format
    : defaultContentQuickProps.format;

  const cta = typeof candidate.cta === 'string' && candidate.cta.trim().length > 0
    ? candidate.cta.trim().slice(0, CTA_MAX_LENGTH)
    : defaultContentQuickProps.cta;

  const copyLength = asCopyLength(candidate.copyLength, defaultContentQuickProps.copyLength);
  const brief = typeof candidate.brief === 'string' ? candidate.brief : defaultContentQuickProps.brief;
  const attachments = sanitizeAttachments(candidate.attachments);
  const validated = typeof candidate.validated === 'boolean' ? candidate.validated : false;
  const validatedAt = typeof candidate.validatedAt === 'string' ? candidate.validatedAt : null;

  return {
    ...defaultContentQuickProps,
    ...candidate,
    persona,
    tone,
    language,
    format,
    cta,
    copyLength,
    keywords: typeof candidate.keywords === 'string' ? candidate.keywords : '',
    avoid: typeof candidate.avoid === 'string' ? candidate.avoid : '',
    hashtags: typeof candidate.hashtags === 'string' ? candidate.hashtags : '',
    brief,
    attachments,
    validated,
    validatedAt,
  };
}

function normalizePicturesQuickProps(
  pictures: Partial<PicturesQuickProps> | undefined
): PicturesQuickProps {
  const candidate = {
    ...defaultPicturesQuickProps,
    ...pictures,
  };

  const providerOptions: PicturesProviderKey[] = ['auto', 'flux', 'stability', 'openai', 'ideogram', 'gemini', 'runway'];
  const fluxModes: FluxMode[] = ['standard', 'ultra', 'flux2-pro', 'flux2-flex'];
  const stabilityModels: StabilityModel[] = ['large-turbo', 'large', 'medium'];
  const ideogramModels: IdeogramModel[] = ['v1', 'v1-turbo', 'v2', 'v2-turbo'];
  const geminiModels: GeminiModel[] = ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image-preview', 'imagen-4.0-generate-001', 'imagen-4.0-ultra-generate-001', 'imagen-4.0-fast-generate-001'];
  const geminiResolutions: GeminiResolution[] = ['1K', '2K', '4K'];
  const runwayImageModels: RunwayImageModel[] = ['gen4_image', 'gen4_image_turbo'];
  const runwayImageRatios: RunwayImageRatio[] = ['1024:1024', '1080:1080', '720:720', '1920:1080', '1080:1920', '1280:720', '720:1280', '1440:1080', '1080:1440'];
  const dalleQualities = ['standard', 'hd'] as const;
  const dalleStyles = ['vivid', 'natural'] as const;
  const openaiImageModels: OpenAIImageModel[] = ['gpt-image-1.5', 'gpt-image-1', 'gpt-image-1-mini'];
  const openaiQualities: OpenAIImageQuality[] = ['low', 'medium', 'high', 'auto'];
  const openaiOutputFormats: PictureOutputFormat[] = ['png', 'jpeg', 'webp'];
  const openaiBackgrounds: OpenAIImageBackground[] = ['transparent', 'opaque', 'auto'];

  // Allow undefined to pass through - no forced defaults
  const clampNumberOptional = (value: unknown, min: number, max: number): number | undefined => {
    if (value === undefined) return undefined;
    if (typeof value !== 'number' || Number.isNaN(value)) return undefined;
    const rounded = Math.round(value * 10) / 10;
    if (!Number.isFinite(rounded)) return undefined;
    return Math.min(max, Math.max(min, rounded));
  };

  const asBooleanOptional = (value: unknown): boolean | undefined =>
    typeof value === 'boolean' ? value : undefined;

  const sanitizePrompt = (value: unknown) =>
    typeof value === 'string' ? value.trim().slice(0, MAX_PICTURE_PROMPT_LENGTH) : '';

  const ADVANCED_LIMIT = 200;
  const sanitizeFreeText = (value: unknown, fallback: string) => {
    if (typeof value !== 'string') {
      return fallback;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    return trimmed.slice(0, ADVANCED_LIMIT);
  };

  // Allow undefined for optional fields - user chooses their preferences
  const style = PICTURE_STYLES.includes(candidate.style as PicStyle)
    ? (candidate.style as PicStyle)
    : undefined;

  const aspect = PICTURE_ASPECTS.includes(candidate.aspect as PicAspect)
    ? (candidate.aspect as PicAspect)
    : undefined;

  return {
    imageProvider: providerOptions.includes(candidate.imageProvider as PicturesProviderKey)
      ? (candidate.imageProvider as PicturesProviderKey)
      : defaultPicturesQuickProps.imageProvider,
    mode: candidate.mode === 'prompt' ? 'prompt' : 'images',
    style,
    aspect,
    promptText: sanitizePrompt(candidate.promptText),
    validated: candidate.validated === true,
    // DALL-E - allow undefined (user chooses)
    dalleQuality: dalleQualities.includes(candidate.dalleQuality as (typeof dalleQualities)[number])
      ? (candidate.dalleQuality as (typeof dalleQualities)[number])
      : undefined,
    dalleStyle: dalleStyles.includes(candidate.dalleStyle as (typeof dalleStyles)[number])
      ? (candidate.dalleStyle as (typeof dalleStyles)[number])
      : undefined,
    openaiImageModel: openaiImageModels.includes(candidate.openaiImageModel as OpenAIImageModel)
      ? (candidate.openaiImageModel as OpenAIImageModel)
      : undefined,
    openaiQuality: openaiQualities.includes(candidate.openaiQuality as OpenAIImageQuality)
      ? (candidate.openaiQuality as OpenAIImageQuality)
      : undefined,
    openaiOutputFormat: openaiOutputFormats.includes(candidate.openaiOutputFormat as PictureOutputFormat)
      ? (candidate.openaiOutputFormat as PictureOutputFormat)
      : undefined,
    openaiBackground: openaiBackgrounds.includes(candidate.openaiBackground as OpenAIImageBackground)
      ? (candidate.openaiBackground as OpenAIImageBackground)
      : undefined,
    openaiOutputCompression: clampNumberOptional(candidate.openaiOutputCompression, 0, 100),
    // FLUX - allow undefined (user chooses)
    fluxMode: fluxModes.includes(candidate.fluxMode as FluxMode)
      ? (candidate.fluxMode as FluxMode)
      : undefined,
    fluxGuidance: clampNumberOptional(candidate.fluxGuidance, 1.5, 5),
    fluxSteps: clampNumberOptional(candidate.fluxSteps, 20, 50),
    fluxPromptUpsampling: asBooleanOptional(candidate.fluxPromptUpsampling),
    fluxRaw: asBooleanOptional(candidate.fluxRaw),
    fluxOutputFormat: ['jpeg', 'png', 'webp'].includes(candidate.fluxOutputFormat as string)
      ? (candidate.fluxOutputFormat as 'jpeg' | 'png' | 'webp')
      : undefined,
    // Stability - allow undefined (user chooses)
    stabilityModel: stabilityModels.includes(candidate.stabilityModel as StabilityModel)
      ? (candidate.stabilityModel as StabilityModel)
      : undefined,
    stabilityCfg: clampNumberOptional(candidate.stabilityCfg, 1, 20),
    stabilitySteps: clampNumberOptional(candidate.stabilitySteps, 20, 60),
    stabilityNegativePrompt: sanitizeFreeText(candidate.stabilityNegativePrompt, ''),
    stabilityStylePreset: typeof candidate.stabilityStylePreset === 'string' 
      ? candidate.stabilityStylePreset.trim().slice(0, 50) || undefined
      : undefined,
    // Ideogram - allow undefined (user chooses)
    ideogramModel: ideogramModels.includes(candidate.ideogramModel as IdeogramModel)
      ? (candidate.ideogramModel as IdeogramModel)
      : undefined,
    ideogramMagicPrompt: asBooleanOptional(candidate.ideogramMagicPrompt),
    ideogramStyleType: ['AUTO', 'GENERAL', 'REALISTIC', 'DESIGN', 'RENDER_3D', 'ANIME'].includes(candidate.ideogramStyleType as string)
      ? (candidate.ideogramStyleType as 'AUTO' | 'GENERAL' | 'REALISTIC' | 'DESIGN' | 'RENDER_3D' | 'ANIME')
      : undefined,
    ideogramNegativePrompt: sanitizeFreeText(candidate.ideogramNegativePrompt, ''),
    // Gemini Imagen 3 - allow undefined (user chooses)
    geminiModel: geminiModels.includes(candidate.geminiModel as GeminiModel)
      ? (candidate.geminiModel as GeminiModel)
      : undefined,
    geminiResolution: geminiResolutions.includes(candidate.geminiResolution as GeminiResolution)
      ? (candidate.geminiResolution as GeminiResolution)
      : undefined,
    geminiThinking: asBooleanOptional(candidate.geminiThinking),
    geminiGrounding: asBooleanOptional(candidate.geminiGrounding),
    // Runway Gen-4 Image - allow undefined (user chooses)
    runwayImageModel: runwayImageModels.includes(candidate.runwayImageModel as RunwayImageModel)
      ? (candidate.runwayImageModel as RunwayImageModel)
      : undefined,
    runwayImageRatio: runwayImageRatios.includes(candidate.runwayImageRatio as RunwayImageRatio)
      ? (candidate.runwayImageRatio as RunwayImageRatio)
      : undefined,
  };
}

function normalizeVideoQuickProps(
  video: Partial<VideoQuickProps> | undefined
): VideoQuickProps {
  const candidate = {
    ...defaultVideoQuickProps,
    ...video,
  };

  // Provider selection (now includes 'google')
  const provider = (candidate.provider === 'luma' || candidate.provider === 'runway' || candidate.provider === 'google' || candidate.provider === 'auto')
    ? candidate.provider
    : defaultVideoQuickProps.provider;

  // Valid Runway models (veo3 removed - now native Google)
  const validRunwayModels: RunwayModel[] = ['gen4_turbo', 'gen3a_turbo'];
  const validGoogleVeoModels: GoogleVeoModel[] = ['veo-3', 'veo-3-fast'];
  
  // Model based on provider
  let model: VideoModel;
  if (provider === 'luma') {
    model = (candidate.model as LumaModel) === 'ray-2' ? 'ray-2' : 'ray-2';
  } else if (provider === 'google') {
    // For Google provider, use googleVeoModel or fallback to veo-3-fast
    model = validGoogleVeoModels.includes(candidate.googleVeoModel as GoogleVeoModel)
      ? (candidate.googleVeoModel as GoogleVeoModel)
      : 'veo-3-fast';
  } else {
    // Runway provider
    model = validRunwayModels.includes(candidate.model as RunwayModel)
      ? (candidate.model as RunwayModel)
      : 'gen4_turbo';
  }

  const rawPromptText = typeof candidate.promptText === 'string'
    ? candidate.promptText.trim()
    : defaultVideoQuickProps.promptText;
  
  // Long prompts: AI refinement on backend (991-2000 chars), hard limit at 2000
  const promptText = rawPromptText.length > MAX_VIDEO_PROMPT_LENGTH
    ? (() => {
        console.warn(`⚠️ Video prompt truncated: ${rawPromptText.length} → ${MAX_VIDEO_PROMPT_LENGTH} chars. Prompts >990 chars will be AI-refined on backend.`);
        return rawPromptText.slice(0, MAX_VIDEO_PROMPT_LENGTH);
      })()
    : rawPromptText.length > 990
      ? (() => {
          console.log(`ℹ️ Video prompt is ${rawPromptText.length} chars. AI will intelligently compress to ≤990 while preserving meaning.`);
          return rawPromptText;
        })()
      : rawPromptText;

  // Duration based on provider and model
  let duration: number;
  let runwayDuration: number | undefined;
  let googleVeoDuration: GoogleVeoDuration | undefined;
  
  if (provider === 'google') {
    // Google Veo durations: 5-8 seconds
    const validGoogleDurations = [5, 6, 7, 8];
    const requestedGoogleDuration = candidate.googleVeoDuration ?? candidate.duration ?? 8;
    googleVeoDuration = validGoogleDurations.includes(requestedGoogleDuration as number)
      ? (requestedGoogleDuration as GoogleVeoDuration)
      : 8;
    duration = googleVeoDuration;
    runwayDuration = undefined;
  } else if (provider === 'runway') {
    // Runway durations based on model
    const modelConfig = RUNWAY_MODEL_CONFIGS[model as RunwayModel];
    const validDurations = modelConfig?.durations || [5];
    const requestedDuration = candidate.runwayDuration ?? candidate.duration ?? validDurations[0];
    duration = validDurations.includes(requestedDuration as number)
      ? (requestedDuration as number)
      : validDurations[0];
    runwayDuration = duration;
    googleVeoDuration = undefined;
  } else {
    // Luma or auto - use default
    duration = candidate.duration ?? 5;
    runwayDuration = undefined;
    googleVeoDuration = undefined;
  }

  const aspect = VIDEO_ASPECTS.includes(candidate.aspect as VideoAspect)
    ? (candidate.aspect as VideoAspect)
    : defaultVideoQuickProps.aspect;

  const watermark = typeof candidate.watermark === 'boolean'
    ? candidate.watermark
    : defaultVideoQuickProps.watermark;

  const seed = typeof candidate.seed === 'number' && candidate.seed >= 0
    ? Math.floor(candidate.seed)
    : undefined;

  // Advanced prompt engineering
  const hook = VIDEO_HOOKS.includes(candidate.hook as VideoHook)
    ? (candidate.hook as VideoHook)
    : defaultVideoQuickProps.hook;
  const captions = typeof candidate.captions === 'boolean' ? candidate.captions : defaultVideoQuickProps.captions;

  const cta = typeof candidate.cta === 'string' && candidate.cta.trim().length > 0
    ? candidate.cta.trim().slice(0, CTA_MAX_LENGTH)
    : defaultVideoQuickProps.cta;

  const voiceover = candidate.voiceover && (VIDEO_VOICEOVER_OPTIONS as readonly string[]).includes(candidate.voiceover)
    ? candidate.voiceover
    : defaultVideoQuickProps.voiceover;
  const density = candidate.density && (VIDEO_DENSITY_OPTIONS as readonly string[]).includes(candidate.density)
    ? candidate.density
    : defaultVideoQuickProps.density;
  const proof = candidate.proof && (VIDEO_PROOF_OPTIONS as readonly string[]).includes(candidate.proof)
    ? candidate.proof
    : defaultVideoQuickProps.proof;

  const doNotsRaw = typeof candidate.doNots === 'string' ? candidate.doNots.trim() : '';
  const doNots = doNotsRaw.length === 0
    ? defaultVideoQuickProps.doNots
    : (VIDEO_DONOT_OPTIONS as readonly string[]).includes(doNotsRaw)
      ? doNotsRaw
      : doNotsRaw.slice(0, CTA_MAX_LENGTH);

  const validated = typeof candidate.validated === 'boolean' ? candidate.validated : defaultVideoQuickProps.validated;
  const validatedAt = typeof candidate.validatedAt === 'string' ? candidate.validatedAt : null;

  // Luma-specific parameters
  const lumaLoop = typeof candidate.lumaLoop === 'boolean' ? candidate.lumaLoop : defaultVideoQuickProps.lumaLoop;
  const lumaDuration = (candidate.lumaDuration === '5s' || candidate.lumaDuration === '9s')
    ? candidate.lumaDuration
    : defaultVideoQuickProps.lumaDuration;
  const lumaResolution = (candidate.lumaResolution === '720p' || candidate.lumaResolution === '1080p')
    ? candidate.lumaResolution
    : defaultVideoQuickProps.lumaResolution;
  const lumaKeyframes = candidate.lumaKeyframes || undefined;
  
  // Luma advanced parameters
  const lumaCameraMovement = candidate.lumaCameraMovement || defaultVideoQuickProps.lumaCameraMovement;
  const lumaCameraAngle = candidate.lumaCameraAngle || defaultVideoQuickProps.lumaCameraAngle;
  const lumaCameraDistance = candidate.lumaCameraDistance || defaultVideoQuickProps.lumaCameraDistance;
  const lumaStyle = candidate.lumaStyle || defaultVideoQuickProps.lumaStyle;
  const lumaLighting = candidate.lumaLighting || defaultVideoQuickProps.lumaLighting;
  const lumaMood = candidate.lumaMood || defaultVideoQuickProps.lumaMood;
  const lumaMotionIntensity = candidate.lumaMotionIntensity || defaultVideoQuickProps.lumaMotionIntensity;
  const lumaMotionSpeed = candidate.lumaMotionSpeed || defaultVideoQuickProps.lumaMotionSpeed;
  const lumaSubjectMovement = candidate.lumaSubjectMovement || defaultVideoQuickProps.lumaSubjectMovement;
  const lumaQuality = candidate.lumaQuality || defaultVideoQuickProps.lumaQuality;
  const lumaColorGrading = candidate.lumaColorGrading || defaultVideoQuickProps.lumaColorGrading;
  const lumaFilmLook = candidate.lumaFilmLook || defaultVideoQuickProps.lumaFilmLook;
  const lumaSeed = typeof candidate.lumaSeed === 'number' && candidate.lumaSeed >= 0 ? candidate.lumaSeed : undefined;
  const lumaNegativePrompt = typeof candidate.lumaNegativePrompt === 'string' ? candidate.lumaNegativePrompt : '';
  const lumaGuidanceScale = typeof candidate.lumaGuidanceScale === 'number' && candidate.lumaGuidanceScale >= 1 && candidate.lumaGuidanceScale <= 20 
    ? candidate.lumaGuidanceScale 
    : defaultVideoQuickProps.lumaGuidanceScale;

  // Google Veo-specific parameters
  const googleVeoModel = validGoogleVeoModels.includes(candidate.googleVeoModel as GoogleVeoModel)
    ? (candidate.googleVeoModel as GoogleVeoModel)
    : defaultVideoQuickProps.googleVeoModel;
  const googleVeoAudio = typeof candidate.googleVeoAudio === 'boolean'
    ? candidate.googleVeoAudio
    : defaultVideoQuickProps.googleVeoAudio;

  return {
    provider,
    model,
    promptText,
    duration: duration as VideoDuration,
    aspect,
    watermark,
    seed,
    runwayDuration,
    googleVeoModel,
    googleVeoDuration,
    googleVeoAudio,
    lumaLoop,
    lumaDuration,
    lumaResolution,
    lumaKeyframes,
    lumaCameraMovement,
    lumaCameraAngle,
    lumaCameraDistance,
    lumaStyle,
    lumaLighting,
    lumaMood,
    lumaMotionIntensity,
    lumaMotionSpeed,
    lumaSubjectMovement,
    lumaQuality,
    lumaColorGrading,
    lumaFilmLook,
    lumaSeed,
    lumaNegativePrompt,
    lumaGuidanceScale,
    cameraMovement: candidate.cameraMovement,
    motionSpeed: candidate.motionSpeed,
    motionAmount: candidate.motionAmount,
    visualStyle: candidate.visualStyle,
    lightingStyle: candidate.lightingStyle,
    mood: candidate.mood,
    subjectFocus: candidate.subjectFocus,
    depthOfField: candidate.depthOfField,
    timeOfDay: candidate.timeOfDay,
    weather: candidate.weather,
    filmLook: candidate.filmLook,
    colorGrading: candidate.colorGrading,
    enhancePrompt: candidate.enhancePrompt,
    hook,
    captions,
    cta,
    voiceover,
    density,
    proof,
    doNots,
    validated,
    validatedAt,
  };
}

export const defaultSettings: SettingsState = {
  mediaPlan: {
    budget: null,
    market: null,
    goal: null,
    currency: null,
    niche: null,
    leadToSalePct: null,
    revenuePerSale: null,
    manageFx: false,
    channels: [],
    channelMode: 'auto',
    channelSplits: {},
    manualCplEnabled: false,
    manualCplValues: {},
    summary: null,
    allocations: [],
    scenario: null,
    notes: null,
    lastSyncedAt: null,
    plannerValidatedAt: null,
    channelsValidatedAt: null,
    advancedValidatedAt: null,
    campaignDuration: '6-months',
    campaignStartDate: null,
    campaignEndDate: null,
    campaignObjective: null,
    targetAudienceSize: null,
  },
  platforms: [],
  cards: {
    content: true,
    pictures: true,
    video: true,
  },
  quickProps: {
    content: defaultContentQuickProps,
    pictures: defaultPicturesQuickProps,
    video: defaultVideoQuickProps,
  },
  versions: 1,
};

export function isMediaPlannerComplete(settings: SettingsState): boolean {
  const { mediaPlan } = settings;
  return Boolean(
    mediaPlan.budget &&
    mediaPlan.budget > 0 &&
    mediaPlan.currency &&
    mediaPlan.market &&
    mediaPlan.goal
  );
}

export function isSettingsValid(settings: SettingsState): boolean {
  if (!isMediaPlannerComplete(settings)) {
    return false;
  }

  if (settings.platforms.length === 0) {
    return false;
  }

  if (!settings.cards.content && !settings.cards.pictures && !settings.cards.video) {
    return false;
  }

  return true;
}

export function loadSettings(): SettingsState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const parsedQuickProps = parsed.quickProps ?? {};
      // Merge with defaults to ensure all fields exist
      return {
        ...defaultSettings,
        ...parsed,
        mediaPlan: {
          ...defaultSettings.mediaPlan,
          ...parsed.mediaPlan,
        },
        quickProps: {
          content: normalizeContentQuickProps(parsedQuickProps.content),
          pictures: normalizePicturesQuickProps(parsedQuickProps.pictures),
          video: normalizeVideoQuickProps(parsedQuickProps.video),
        },
      };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return defaultSettings;
}

export function saveSettings(settings: SettingsState): void {
  try {
    // Strip out large base64 data before saving to localStorage
    // promptImages can be several MB and will exceed the 5MB localStorage quota
    const settingsToSave = {
      ...settings,
      quickProps: {
        ...settings.quickProps,
        pictures: {
          ...settings.quickProps.pictures,
          promptImages: undefined, // Don't persist base64 reference images
        },
        video: {
          ...settings.quickProps.video,
          promptImages: undefined, // Don't persist base64 reference images for video
        },
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function validateSettings(settings: SettingsState): boolean {
  const { cards, quickProps } = settings;

  if (!isSettingsValid(settings)) {
    return false;
  }

  // Check quick props bounds
  if (cards.content && quickProps.content.cta && quickProps.content.cta.length > CTA_MAX_LENGTH) {
    return false;
  }

  if (
    cards.video &&
    quickProps.video.duration &&
    (quickProps.video.duration < VIDEO_DURATION_MIN || quickProps.video.duration > VIDEO_DURATION_MAX)
  ) {
    return false;
  }

  if (cards.video && quickProps.video.cta && quickProps.video.cta.length > CTA_MAX_LENGTH) {
    return false;
  }

  return true;
}
