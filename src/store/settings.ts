import type {
  SettingsState,
  Goal,
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
  VideoQuickProps,
  VideoHook,
  VideoAspect,
  AiAttachment,
} from '../types';
import { MAX_PICTURE_PROMPT_LENGTH } from './picturesPrompts';

const STORAGE_KEY = 'marketingEngine.settings.v1';

const CTA_MAX_LENGTH = 60;
const VIDEO_DURATION_MIN = 6;
const VIDEO_DURATION_MAX = 30;

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
  // Runway API parameters
  model: 'gen3a_turbo',
  promptText: '',
  duration: 5,
  aspect: '9:16',
  watermark: false,
  seed: undefined,
  
  // Advanced prompt engineering
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

  const providerOptions: PicturesProviderKey[] = ['auto', 'flux', 'stability', 'openai', 'ideogram'];
  const fluxModes: FluxMode[] = ['standard', 'ultra'];
  const stabilityModels: StabilityModel[] = ['large-turbo', 'large', 'medium'];
  const ideogramModels: IdeogramModel[] = ['v1', 'v2', 'turbo'];
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

  // Runway API parameters
  const runwayModels = ['gen3a_turbo', 'gen3a'] as const;
  const model = runwayModels.includes(candidate.model as any)
    ? candidate.model
    : defaultVideoQuickProps.model;

  const promptText = typeof candidate.promptText === 'string'
    ? candidate.promptText.trim().slice(0, 1000)
    : defaultVideoQuickProps.promptText;

  const validDurations = [5, 10] as const;
  const duration = validDurations.includes(candidate.duration as any)
    ? candidate.duration
    : defaultVideoQuickProps.duration;

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

  return {
    model,
    promptText,
    duration,
    aspect,
    watermark,
    seed,
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
    summary: null,
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

// Mock function to simulate pulling plan data
export async function pullMediaPlan(settings: {
  budget: number;
  market: string;
  goal: Goal;
  currency: string;
}): Promise<SettingsState['mediaPlan']['summary']> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate mock data based on budget and goal
  const impressions = Math.floor(settings.budget * (settings.goal === 'Awareness' ? 150 : 100));
  const reach = Math.floor(impressions * 0.7);
  const clicks = Math.floor(impressions * (settings.goal === 'Sales' ? 0.05 : 0.03));
  const leads = Math.floor(clicks * (settings.goal === 'Leads' ? 0.15 : 0.08));
  const roas = settings.goal === 'Sales' ? 3.2 : 2.1;

  return {
    impressions,
    reach,
    clicks,
    leads,
    roas,
  };
}
