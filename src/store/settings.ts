import type {
  SettingsState,
  Goal,
  ContentQuickProps,
  Language,
  Persona,
  Tone,
  ContentFormat,
  PicturesQuickProps,
  PicStyle,
  PicAspect,
  VideoQuickProps,
  VideoHook,
  VideoAspect,
} from '../types';

const STORAGE_KEY = 'marketingEngine.settings.v1';

const CTA_MAX_LENGTH = 60;
const VIDEO_DURATION_MIN = 6;
const VIDEO_DURATION_MAX = 30;

const PERSONAS: readonly Persona[] = ['Generic', 'First-time', 'Warm lead', 'B2B DM', 'Returning'];
const TONES: readonly Tone[] = ['Friendly', 'Informative', 'Bold', 'Premium', 'Playful', 'Professional'];
const LANGUAGES: readonly Language[] = ['EN', 'AR', 'FR'];
const CONTENT_FORMATS: readonly ContentFormat[] = ['Auto', 'FB/IG', 'LinkedIn', 'TikTok', 'X'];
const PICTURE_STYLES: readonly PicStyle[] = ['Product', 'Lifestyle', 'UGC', 'Abstract'];
const PICTURE_ASPECTS: readonly PicAspect[] = ['1:1', '4:5', '16:9'];
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
  keywords: '',
  avoid: '',
  hashtags: '',
};

const defaultPicturesQuickProps: PicturesQuickProps = {
  mode: 'images',
  style: 'Product',
  aspect: '1:1',
  lockBrandColors: true,
  backdrop: 'Clean',
  lighting: 'Soft',
  negative: 'None',
  quality: 'High detail',
};

const defaultVideoQuickProps: VideoQuickProps = {
  duration: 12,
  hook: 'Question',
  aspect: '9:16',
  captions: true,
  cta: 'Learn more',
  voiceover: 'On-screen text only',
  density: 'Medium (5–6)',
  proof: 'Social proof',
  doNots: 'No claims',
};

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

  return {
    ...defaultContentQuickProps,
    ...candidate,
    persona,
    tone,
    language,
    format,
    cta,
    keywords: typeof candidate.keywords === 'string' ? candidate.keywords : '',
    avoid: typeof candidate.avoid === 'string' ? candidate.avoid : '',
    hashtags: typeof candidate.hashtags === 'string' ? candidate.hashtags : '',
  };
}

function normalizePicturesQuickProps(
  pictures: Partial<PicturesQuickProps> | undefined
): PicturesQuickProps {
  const candidate = {
    ...defaultPicturesQuickProps,
    ...pictures,
  };

  const mode = candidate.mode === 'prompt' ? 'prompt' : 'images';

  const style = PICTURE_STYLES.includes(candidate.style as PicStyle)
    ? (candidate.style as PicStyle)
    : defaultPicturesQuickProps.style;
  const aspect = PICTURE_ASPECTS.includes(candidate.aspect as PicAspect)
    ? (candidate.aspect as PicAspect)
    : defaultPicturesQuickProps.aspect;
  const lockBrandColors =
    typeof candidate.lockBrandColors === 'boolean'
      ? candidate.lockBrandColors
      : defaultPicturesQuickProps.lockBrandColors;

  const backdrop = candidate.backdrop && (PICTURE_BACKDROPS as readonly string[]).includes(candidate.backdrop)
    ? candidate.backdrop
    : defaultPicturesQuickProps.backdrop;
  const lighting = candidate.lighting && (PICTURE_LIGHTING as readonly string[]).includes(candidate.lighting)
    ? candidate.lighting
    : defaultPicturesQuickProps.lighting;

  const negativeRaw = typeof candidate.negative === 'string' ? candidate.negative.trim() : '';
  const negative = negativeRaw.length === 0
    ? defaultPicturesQuickProps.negative
    : (PICTURE_NEGATIVE_OPTIONS as readonly string[]).includes(negativeRaw)
      ? negativeRaw
      : negativeRaw.slice(0, CTA_MAX_LENGTH);

  const quality = candidate.quality && (PICTURE_QUALITY_OPTIONS as readonly string[]).includes(candidate.quality)
    ? candidate.quality
    : defaultPicturesQuickProps.quality;

  return {
    mode,
    style,
    aspect,
    lockBrandColors,
    backdrop,
    lighting,
    negative,
    quality,
  };
}

function normalizeVideoQuickProps(
  video: Partial<VideoQuickProps> | undefined
): VideoQuickProps {
  const candidate = {
    ...defaultVideoQuickProps,
    ...video,
  };

  const duration = typeof candidate.duration === 'number'
    ? Math.min(VIDEO_DURATION_MAX, Math.max(VIDEO_DURATION_MIN, Math.round(candidate.duration)))
    : defaultVideoQuickProps.duration;
  const hook = VIDEO_HOOKS.includes(candidate.hook as VideoHook)
    ? (candidate.hook as VideoHook)
    : defaultVideoQuickProps.hook;
  const aspect = VIDEO_ASPECTS.includes(candidate.aspect as VideoAspect)
    ? (candidate.aspect as VideoAspect)
    : defaultVideoQuickProps.aspect;
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

  return {
    duration,
    hook,
    aspect,
    captions,
    cta,
    voiceover,
    density,
    proof,
    doNots,
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
    video: false,
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
