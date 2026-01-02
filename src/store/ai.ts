import type {
  AiUIState,
  GeneratedContent,
  GeneratedVideo,
  Platform,
  SettingsState,
  CardKey,
} from '../types';
export { generatePictureOutputs as generatePictures } from '../lib/pictureGeneration';
import { generationProgressActions } from './generationProgress';

export const defaultAiState: AiUIState = {
  locked: true,
  brief: '',
  uploads: [],
  generating: false,
  steps: [],
  stepStatus: {},
  errorMessages: {},
  outputs: {},
};

const createAbortError = () => {
  const error = new Error('Generation aborted');
  error.name = 'AbortError';
  return error;
};

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, ms);

    function handleAbort() {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', handleAbort);
      reject(createAbortError());
    }

    signal?.addEventListener('abort', handleAbort);
  });

const GATEWAY_DEFAULT_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const PROVIDER_PLATFORM_LABELS: Record<Platform, string> = {
  facebook: 'FBIG',
  instagram: 'FBIG',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  x: 'X',
  youtube: 'YouTube',
};

const LANGUAGE_LABELS = {
  EN: 'English',
  AR: 'AR',
  FR: 'French',
} as const;

const VALID_STATUSES: Array<NonNullable<AiUIState['stepStatus'][CardKey]>> = [
  'queued',
  'thinking',
  'rendering',
  'ready',
  'error',
];

type StepStatus = (typeof VALID_STATUSES)[number];

type ContentGenerationOptions = {
  signal?: AbortSignal;
  onStatus?: (status: StepStatus) => void;
  gatewayUrl?: string;
};

const toStepStatus = (value: unknown): StepStatus | null => {
  if (typeof value !== 'string') return null;
  return VALID_STATUSES.includes(value as StepStatus) ? (value as StepStatus) : null;
};

const sanitizeList = (value?: string) =>
  value
    ? value
        .split(/[,|\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const normalizeHashtag = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const withoutHash = trimmed.replace(/^#+/, '');
  return withoutHash ? `#${withoutHash}` : '';
};

const asNonEmptyString = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const buildCaption = (primary?: unknown, hashtags?: unknown): string => {
  const parts: string[] = [];
  const primaryText = asNonEmptyString(primary);
  if (primaryText) {
    parts.push(primaryText);
  }

  if (Array.isArray(hashtags)) {
    const tags = hashtags
      .map((tag) => (typeof tag === 'string' ? normalizeHashtag(tag) : ''))
      .filter(Boolean);
    if (tags.length > 0) {
      parts.push(tags.join(' '));
    }
  }

  return parts.join('\n\n');
};

const mapVariantsToContent = (
  variants: unknown,
  platforms: Platform[],
  versionCount: number,
  fallbackHeadlineBase: string,
  fallbackCaption: string,
  fallbackCta: string
): GeneratedContent[][] => {
  const variantArray = Array.isArray(variants)
    ? variants.filter((item) => item && typeof item === 'object')
    : [];

  if (variantArray.length === 0) {
    variantArray.push({});
  }

  const ensureVariant = (index: number) =>
    variantArray[index] ?? variantArray[variantArray.length - 1] ?? {};

  return Array.from({ length: versionCount }, (_, versionIndex) => {
    const variant = ensureVariant(versionIndex) as Record<string, unknown>;
    const fallbackHeadline =
      versionCount > 1
        ? `${fallbackHeadlineBase} #${versionIndex + 1}`
        : fallbackHeadlineBase;
    const headline =
      asNonEmptyString(variant.headline) ??
      fallbackHeadline ??
      `Campaign concept #${versionIndex + 1}`;
    const caption = buildCaption(variant.primary_text ?? variant.caption, variant.hashtags) || fallbackCaption;
    const cta = asNonEmptyString(variant.cta_label) ?? fallbackCta;

    return platforms.map((platform) => ({
      platform,
      headline,
      caption,
      cta,
    }));
  });
};

export async function generateContent(
  platforms: Platform[],
  versions: number,
  props: SettingsState['quickProps']['content'],
  brief: string,
  options: ContentGenerationOptions = {}
): Promise<GeneratedContent[][]> {
  const trimmedBrief = brief.trim();
  if (!trimmedBrief) {
    throw new Error('Brief is required for generation');
  }

  const { signal, onStatus } = options;
  const gatewayUrl = options.gatewayUrl ?? import.meta.env?.VITE_AI_GATEWAY_URL ?? GATEWAY_DEFAULT_URL;

  const requestedPlatforms: Platform[] =
    platforms.length > 0 ? platforms : (['linkedin'] as Platform[]);
  const providerPlatforms = Array.from(
    new Set(requestedPlatforms.map((platform) => PROVIDER_PLATFORM_LABELS[platform] ?? platform))
  );

  const tones = props?.tone ? [props.tone] : [];
  const ctas = props?.cta ? [props.cta] : [];
  const keywords = sanitizeList(props?.keywords);
  const avoid = sanitizeList(props?.avoid);
  const hashtags = sanitizeList(props?.hashtags).map((tag) => tag.replace(/^#+/, ''));

  const language = props?.language
    ? LANGUAGE_LABELS[props.language] ?? props.language
    : LANGUAGE_LABELS.EN;

  const payload = {
    brief: trimmedBrief,
    versions: Math.max(1, Number.isFinite(versions) ? Number(versions) : 1),
    options: {
      persona: props?.persona,
      tones,
      ctas,
      language,
      platforms: providerPlatforms,
      keywords,
      avoid,
      hashtags,
    },
  };

  const startResponse = await fetch(`${gatewayUrl.replace(/\/$/, '')}/v1/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!startResponse.ok) {
    const text = await startResponse.text();
    throw new Error(`Failed to start content generation (${startResponse.status}): ${text}`);
  }

  const { runId } = (await startResponse.json()) as { runId: string };
  if (!runId) {
    throw new Error('Gateway did not return a run ID');
  }

  const eventsUrl = `${gatewayUrl.replace(/\/$/, '')}/v1/runs/${runId}/events`;

  return new Promise<GeneratedContent[][]>((resolve, reject) => {
    let settled = false;
    const source = new EventSource(eventsUrl);

    const cleanup = () => {
      settled = true;
      source.close();
      signal?.removeEventListener('abort', handleAbort);
    };

    const handleAbort = () => {
      cleanup();
      reject(createAbortError());
    };

    if (signal) {
      if (signal.aborted) {
        handleAbort();
        return;
      }
      signal.addEventListener('abort', handleAbort);
    }

    source.addEventListener('status', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data ?? '{}');
        const nextStatus = toStepStatus(data.status);
        if (nextStatus) {
          onStatus?.(nextStatus);
        }
      } catch (error) {
        console.warn('Failed to parse gateway status event', error);
      }
    });

    source.addEventListener('result', (event) => {
      if (settled) return;
      try {
        const data = JSON.parse((event as MessageEvent).data ?? '{}');
        const versionCount = Math.max(1, Number.isFinite(versions) ? Number(versions) : 1);
        const fallbackHeadline = 'Campaign concept';
        const fallbackCaption = 'Fresh copy is ready to ship.';
        const fallbackCta = props?.cta || 'Learn more';
        const mapped = mapVariantsToContent(
          data?.variants,
          requestedPlatforms,
          versionCount,
          fallbackHeadline,
          fallbackCaption,
          fallbackCta
        );
        cleanup();
        onStatus?.('ready');
        resolve(mapped);
      } catch (error) {
        cleanup();
        reject(error);
      }
    });

    source.addEventListener('error', (event) => {
      if (settled) return;
      try {
        const payload = (event as MessageEvent).data ? JSON.parse((event as MessageEvent).data) : {};
        const message = payload?.message || 'Gateway error';
        onStatus?.('error');
        cleanup();
        reject(new Error(message));
      } catch {
        onStatus?.('error');
        cleanup();
        reject(new Error('Gateway connection error'));
      }
    });
  });
}

/**
 * Real Runway video generation (async)
 * This is now a wrapper - actual implementation in lib/videoGeneration.ts
 */
export async function generateVideo(
  versions: number,
  props: SettingsState['quickProps']['video'],
  signal?: AbortSignal
): Promise<GeneratedVideo[]> {
  const { generateRunwayVideo } = await import('../lib/videoGeneration');
  
  const videoVersions: GeneratedVideo[] = [];
  
  // Generate requested number of versions
  for (let v = 0; v < versions; v++) {
    try {
      const video = await generateRunwayVideo(
        props,
        (progress, status) => {
          console.log(`[Video ${v + 1}/${versions}] ${status}: ${progress}%`);
          if (status === 'PENDING') {
            generationProgressActions.updatePhase('video', 'thinking', {
              source: 'video-polling',
              message: 'Video job acknowledged by provider',
            });
          } else if (status === 'RUNNING') {
            generationProgressActions.updatePhase('video', 'rendering', {
              source: 'video-polling',
              message: `Rendering in Runway (${Math.round(progress)}%)`,
            });
          } else if (status === 'SUCCEEDED') {
            generationProgressActions.updatePhase('video', 'ready', {
              source: 'video-polling',
            });
          } else if (status === 'FAILED') {
            generationProgressActions.updatePhase('video', 'error', {
              source: 'video-polling',
              message: 'Video generation failed',
            });
          }
        },
        signal
      );

      videoVersions.push(video);
      console.log(`[Video ${v + 1}/${versions}] Generated successfully!`);
    } catch (error) {
      console.error(`[Video ${v + 1}/${versions}] Generation failed:`, error);
      throw error; // Don't continue if one fails
    }
  }
  
  return videoVersions;
}

// Simulate async generation with progress updates
export async function simulateGeneration(
  steps: CardKey[],
  onProgress: (step: CardKey, status: NonNullable<AiUIState['stepStatus'][CardKey]>) => void,
  signal?: AbortSignal
): Promise<void> {
  for (const step of steps) {
    // Queued
    onProgress(step, 'queued');
    await delay(300, signal);

    // Thinking
    onProgress(step, 'thinking');
    await delay(800 + Math.random() * 400, signal);

    // Rendering
    onProgress(step, 'rendering');
    await delay(1000 + Math.random() * 500, signal);

    // Ready
    onProgress(step, 'ready');
    await delay(100, signal);
  }
}
