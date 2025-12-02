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
  RunwayModel,
  LumaModel,
  AiAttachment,
  RunwayModelConfig,
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
const PICTURE_BACKDROPS = ['Clean', 'Gradient', 'Real-world'] as const;
const PICTURE_LIGHTING = ['Soft', 'Hard', 'Neon'] as const;
const PICTURE_NEGATIVE_OPTIONS = ['None', 'Logos', 'Busy background', 'Extra hands', 'Glare'] as const;
const PICTURE_QUALITY_OPTIONS = ['High detail', 'Sharp', 'Minimal noise'] as const;

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
  veo3: {
    id: 'veo3',
    name: 'Veo 3',
    description: 'Google Veo 3 via Runway - High quality, fixed 8s duration',
    durations: [8],
    ratios: ['1280:720', '720:1280', '960:960'],
    features: ['Google AI', 'Fixed 8s', 'High quality', 'Consistent results'],
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
  veo3: {
    '16:9': '1280:720',   // Landscape widescreen
    '9:16': '720:1280',   // Portrait mobile
    '1:1': '960:960',     // Square
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
  style: 'Product',
  aspect: '1:1',
  promptText: '',
  validated: false,
  // DALL-E
  dalleQuality: 'standard',
  dalleStyle: 'vivid',
  // FLUX
  fluxMode: 'standard',
  fluxGuidance: 3,
  fluxSteps: 40,
  fluxPromptUpsampling: false,
  fluxRaw: false,
  fluxOutputFormat: 'jpeg',
  // Stability
  stabilityModel: 'large',
  stabilityCfg: 7,
  stabilitySteps: 40,
  stabilityNegativePrompt: '',
  stabilityStylePreset: '',
  // Ideogram
  ideogramModel: 'v2',
  ideogramMagicPrompt: true,
  ideogramStyleType: 'AUTO',
  ideogramNegativePrompt: '',
  // Gemini Imagen 3
  geminiModel: 'gemini-3-pro-image-preview',
  geminiResolution: '1K',
  geminiThinking: true,
  geminiGrounding: false,
  // Runway Gen-4 Image
  runwayImageModel: 'gen4_image',
  runwayImageRatio: '1024:1024',
  // Advanced
  lockBrandColors: true,
  backdrop: 'Clean',
  lighting: 'Soft',
  negative: 'None',
  quality: 'High detail',
  composition: '',
  camera: '',
  mood: '',
  colourPalette: '',
  finish: '',
  texture: '',
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
  runwayDuration: 5, // 5s or 10s for gen4_turbo/gen3a_turbo, fixed 8s for veo3
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
  const fluxModes: FluxMode[] = ['standard', 'ultra'];
  const stabilityModels: StabilityModel[] = ['large-turbo', 'large', 'medium'];
  const ideogramModels: IdeogramModel[] = ['v1', 'v2', 'turbo'];
  const geminiModels: GeminiModel[] = ['gemini-3-pro-image-preview', 'gemini-2.5-flash-preview-image'];
  const geminiResolutions: GeminiResolution[] = ['1K', '2K', '4K'];
  const runwayImageModels: RunwayImageModel[] = ['gen4_image', 'gen4_image_turbo'];
  const runwayImageRatios: RunwayImageRatio[] = ['1024:1024', '1080:1080', '720:720', '1920:1080', '1080:1920', '1280:720', '720:1280', '1440:1080', '1080:1440'];
  const dalleQualities = ['standard', 'hd'] as const;
  const dalleStyles = ['vivid', 'natural'] as const;

  const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return fallback;
    }
    const rounded = Math.round(value * 10) / 10; // One decimal place
    if (!Number.isFinite(rounded)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, rounded));
  };

  const asBoolean = (value: unknown, fallback: boolean) =>
    typeof value === 'boolean' ? value : fallback;

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

  const style = PICTURE_STYLES.includes(candidate.style as PicStyle)
    ? (candidate.style as PicStyle)
    : defaultPicturesQuickProps.style;

  const aspect = PICTURE_ASPECTS.includes(candidate.aspect as PicAspect)
    ? (candidate.aspect as PicAspect)
    : defaultPicturesQuickProps.aspect;

  const backdrop =
    candidate.backdrop && (PICTURE_BACKDROPS as readonly string[]).includes(candidate.backdrop)
      ? candidate.backdrop
      : defaultPicturesQuickProps.backdrop;

  const lighting =
    candidate.lighting && (PICTURE_LIGHTING as readonly string[]).includes(candidate.lighting)
      ? candidate.lighting
      : defaultPicturesQuickProps.lighting;

  const negativeRaw = typeof candidate.negative === 'string' ? candidate.negative.trim() : '';
  const negative =
    negativeRaw.length === 0
      ? defaultPicturesQuickProps.negative
      : (PICTURE_NEGATIVE_OPTIONS as readonly string[]).includes(negativeRaw)
        ? negativeRaw
        : negativeRaw.slice(0, CTA_MAX_LENGTH);

  const quality =
    candidate.quality && (PICTURE_QUALITY_OPTIONS as readonly string[]).includes(candidate.quality)
      ? candidate.quality
      : defaultPicturesQuickProps.quality;

  return {
    imageProvider: providerOptions.includes(candidate.imageProvider as PicturesProviderKey)
      ? (candidate.imageProvider as PicturesProviderKey)
      : defaultPicturesQuickProps.imageProvider,
    mode: candidate.mode === 'prompt' ? 'prompt' : 'images',
    style,
    aspect,
    promptText: sanitizePrompt(candidate.promptText),
    validated: asBoolean(candidate.validated, false),
    // DALL-E
    dalleQuality: dalleQualities.includes(candidate.dalleQuality as (typeof dalleQualities)[number])
      ? (candidate.dalleQuality as (typeof dalleQualities)[number])
      : defaultPicturesQuickProps.dalleQuality,
    dalleStyle: dalleStyles.includes(candidate.dalleStyle as (typeof dalleStyles)[number])
      ? (candidate.dalleStyle as (typeof dalleStyles)[number])
      : defaultPicturesQuickProps.dalleStyle,
    // FLUX
    fluxMode: fluxModes.includes(candidate.fluxMode as FluxMode)
      ? (candidate.fluxMode as FluxMode)
      : defaultPicturesQuickProps.fluxMode,
    fluxGuidance: clampNumber(candidate.fluxGuidance, 1.5, 5, defaultPicturesQuickProps.fluxGuidance),
    fluxSteps: clampNumber(candidate.fluxSteps, 20, 50, defaultPicturesQuickProps.fluxSteps),
    fluxPromptUpsampling: asBoolean(candidate.fluxPromptUpsampling, defaultPicturesQuickProps.fluxPromptUpsampling),
    fluxRaw: asBoolean(candidate.fluxRaw, defaultPicturesQuickProps.fluxRaw),
    fluxOutputFormat: ['jpeg', 'png', 'webp'].includes(candidate.fluxOutputFormat as string)
      ? (candidate.fluxOutputFormat as 'jpeg' | 'png' | 'webp')
      : defaultPicturesQuickProps.fluxOutputFormat,
    // Stability
    stabilityModel: stabilityModels.includes(candidate.stabilityModel as StabilityModel)
      ? (candidate.stabilityModel as StabilityModel)
      : defaultPicturesQuickProps.stabilityModel,
    stabilityCfg: clampNumber(candidate.stabilityCfg, 1, 20, defaultPicturesQuickProps.stabilityCfg),
    stabilitySteps: clampNumber(candidate.stabilitySteps, 20, 60, defaultPicturesQuickProps.stabilitySteps),
    stabilityNegativePrompt: sanitizeFreeText(candidate.stabilityNegativePrompt, defaultPicturesQuickProps.stabilityNegativePrompt ?? ''),
    stabilityStylePreset: typeof candidate.stabilityStylePreset === 'string' 
      ? candidate.stabilityStylePreset.trim().slice(0, 50)
      : defaultPicturesQuickProps.stabilityStylePreset,
    // Ideogram
    ideogramModel: ideogramModels.includes(candidate.ideogramModel as IdeogramModel)
      ? (candidate.ideogramModel as IdeogramModel)
      : defaultPicturesQuickProps.ideogramModel,
    ideogramMagicPrompt: asBoolean(candidate.ideogramMagicPrompt, defaultPicturesQuickProps.ideogramMagicPrompt),
    ideogramStyleType: ['AUTO', 'GENERAL', 'REALISTIC', 'DESIGN', 'RENDER_3D', 'ANIME'].includes(candidate.ideogramStyleType as string)
      ? (candidate.ideogramStyleType as 'AUTO' | 'GENERAL' | 'REALISTIC' | 'DESIGN' | 'RENDER_3D' | 'ANIME')
      : defaultPicturesQuickProps.ideogramStyleType,
    ideogramNegativePrompt: sanitizeFreeText(candidate.ideogramNegativePrompt, defaultPicturesQuickProps.ideogramNegativePrompt ?? ''),
    // Gemini Imagen 3
    geminiModel: geminiModels.includes(candidate.geminiModel as GeminiModel)
      ? (candidate.geminiModel as GeminiModel)
      : defaultPicturesQuickProps.geminiModel,
    geminiResolution: geminiResolutions.includes(candidate.geminiResolution as GeminiResolution)
      ? (candidate.geminiResolution as GeminiResolution)
      : defaultPicturesQuickProps.geminiResolution,
    geminiThinking: asBoolean(candidate.geminiThinking, defaultPicturesQuickProps.geminiThinking),
    geminiGrounding: asBoolean(candidate.geminiGrounding, defaultPicturesQuickProps.geminiGrounding),
    // Runway Gen-4 Image
    runwayImageModel: runwayImageModels.includes(candidate.runwayImageModel as RunwayImageModel)
      ? (candidate.runwayImageModel as RunwayImageModel)
      : defaultPicturesQuickProps.runwayImageModel,
    runwayImageRatio: runwayImageRatios.includes(candidate.runwayImageRatio as RunwayImageRatio)
      ? (candidate.runwayImageRatio as RunwayImageRatio)
      : defaultPicturesQuickProps.runwayImageRatio,
    // Advanced
    lockBrandColors: asBoolean(candidate.lockBrandColors, defaultPicturesQuickProps.lockBrandColors),
    backdrop,
    lighting,
    negative,
    quality,
    composition: sanitizeFreeText(candidate.composition, defaultPicturesQuickProps.composition ?? ''),
    camera: sanitizeFreeText(candidate.camera, defaultPicturesQuickProps.camera ?? ''),
    mood: sanitizeFreeText(candidate.mood, defaultPicturesQuickProps.mood ?? ''),
    colourPalette: sanitizeFreeText(candidate.colourPalette, defaultPicturesQuickProps.colourPalette ?? ''),
    finish: sanitizeFreeText(candidate.finish, defaultPicturesQuickProps.finish ?? ''),
    texture: sanitizeFreeText(candidate.texture, defaultPicturesQuickProps.texture ?? ''),
  };
}

function normalizeVideoQuickProps(
  video: Partial<VideoQuickProps> | undefined
): VideoQuickProps {
  const candidate = {
    ...defaultVideoQuickProps,
    ...video,
  };

  // Provider selection
  const provider = (candidate.provider === 'luma' || candidate.provider === 'runway' || candidate.provider === 'auto')
    ? candidate.provider
    : defaultVideoQuickProps.provider;

  // Valid Runway models
  const validRunwayModels: RunwayModel[] = ['gen4_turbo', 'gen3a_turbo', 'veo3'];
  
  // Model based on provider
  const model: VideoModel = provider === 'luma'
    ? ((candidate.model as LumaModel) === 'ray-2' ? 'ray-2' : 'ray-2')
    : validRunwayModels.includes(candidate.model as RunwayModel)
      ? (candidate.model as RunwayModel)
      : 'gen4_turbo'; // Default to Gen-4 Turbo for Runway

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

  // Duration based on model
  // - gen4_turbo: 5 or 10 seconds
  // - gen3a_turbo: 5 or 10 seconds  
  // - veo3: fixed 8 seconds
  const modelConfig = RUNWAY_MODEL_CONFIGS[model as RunwayModel];
  const validDurations = modelConfig?.durations || [8];
  
  // Get runway-specific duration or use candidate duration
  const requestedDuration = candidate.runwayDuration ?? candidate.duration ?? validDurations[0];
  const duration = validDurations.includes(requestedDuration as number)
    ? (requestedDuration as 5 | 8 | 10)
    : (validDurations[0] as 5 | 8 | 10);
  
  // Also store the runway-specific duration
  const runwayDuration = duration;

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

  return {
    provider,
    model,
    promptText,
    duration,
    aspect,
    watermark,
    seed,
    runwayDuration,
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
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
