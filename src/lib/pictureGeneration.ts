import type {
  AiAttachment,
  GeneratedPictures,
  PictureAsset,
  PicturePrompt,
  PictureResultMeta,
  PicturesQuickProps,
} from '../types';

type PictureGenerationMode = PicturesQuickProps['mode'];

type PictureGenerationConfig = {
  brief: string;
  versions: number;
  quickProps: PicturesQuickProps;
  uploads?: string[];
  attachments?: AiAttachment[];
  signal?: AbortSignal;
  remixPrompt?: string;
};

type ImageGatewayRequest = {
  prompt: string;
  aspect: PicturesQuickProps['aspect'];
  style: PicturesQuickProps['style'];
  referenceImages: string[];
  count: number;
};

type ImageGatewayResponse = {
  assets: PictureAsset[];
};

const PROMPT_INTENTS: PicturePrompt['intent'][] = ['hero', 'variation', 'detail'];

const FALLBACK_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=1200&q=80',
];

const ASPECT_DIMENSIONS: Record<
  PicturesQuickProps['aspect'],
  { width: number; height: number; size: '1024x1024' | '1024x1536' | '1536x1024' }
> = {
  '1:1': { width: 1024, height: 1024, size: '1024x1024' },
  '4:5': { width: 1024, height: 1536, size: '1024x1536' },
  '16:9': { width: 1536, height: 1024, size: '1536x1024' },
};

const pick = <T,>(list: T[], index: number) => list[index % list.length];

const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const throwAbort = (): never => {
  const error = new Error('Picture generation aborted');
  error.name = 'AbortError';
  throw error;
};

const toMeta = (quickProps: PicturesQuickProps): PictureResultMeta => ({
  style: quickProps.style,
  aspect: quickProps.aspect,
  lockBrandColors: quickProps.lockBrandColors,
  createdAt: new Date().toISOString(),
});

const resolveImageGatewayEndpoint = () => {
  const explicit = import.meta.env?.VITE_IMAGE_GATEWAY_URL as string | undefined;
  if (explicit && explicit.trim().length > 0) {
    return explicit.replace(/\/$/, '');
  }

  const base = import.meta.env?.VITE_AI_GATEWAY_URL as string | undefined;
  if (base && base.trim().length > 0) {
    return `${base.replace(/\/$/, '')}/v1/images/generate`;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin.replace(/\/$/, '')}/v1/images/generate`;
  }

  return 'http://localhost:8787/v1/images/generate';
};

const basePromptFromQuickProps = (brief: string, quickProps: PicturesQuickProps, uploads: string[]): string => {
  const segments = [
    brief.trim(),
    `Desired visual style: ${quickProps.style}.`,
    `Aspect ratio: ${quickProps.aspect}.`,
    quickProps.lockBrandColors
      ? 'Honor brand palette and keep tones consistent with uploaded assets.'
      : 'Use complementary colors that feel on-brand.',
    quickProps.backdrop ? `Backdrop preference: ${quickProps.backdrop}.` : null,
    quickProps.lighting ? `Lighting preference: ${quickProps.lighting}.` : null,
    quickProps.quality ? `Quality preference: ${quickProps.quality}.` : null,
    quickProps.negative ? `Avoid: ${quickProps.negative}.` : null,
    uploads.length ? `Reference imagery provided: ${uploads.length} asset${uploads.length > 1 ? 's' : ''}.` : null,
  ];
  return segments.filter(Boolean).join(' ');
};

const buildPromptVariants = (
  basePrompt: string,
  quickProps: PicturesQuickProps,
  versionIndex: number
): PicturePrompt[] => {
  const variants: PicturePrompt[] = [
    {
      id: createId('prompt'),
      intent: 'hero',
      text: `${basePrompt} Focus on a hero composition with the primary subject centered, framed for ${quickProps.aspect}.`,
    },
    {
      id: createId('prompt'),
      intent: 'variation',
      text: `${basePrompt} Provide an alternative angle that feels candid and ready for organic social placements.`,
    },
    {
      id: createId('prompt'),
      intent: 'detail',
      text: `${basePrompt} Zoom into product details with tactile textures while maintaining narrative cohesion.`,
    },
  ];

  if (versionIndex % 2 === 1) {
    variants.reverse();
  }

  return variants;
};

const simulateOpenAIAssets = (
  request: ImageGatewayRequest,
  versionIndex: number
): PictureAsset[] => {
  const dims = ASPECT_DIMENSIONS[request.aspect] ?? ASPECT_DIMENSIONS['1:1'];
  const count = Math.max(2, Math.min(request.count, 6));
  return Array.from({ length: count }).map((_, idx) => {
    const url = pick(FALLBACK_IMAGE_URLS, versionIndex + idx);
    return {
      id: createId('asset'),
      url,
      thumbUrl: `${url}&w=480`,
      width: dims.width,
      height: dims.height,
      mimeType: 'image/jpeg',
      prompt: `${request.prompt} (variation ${idx + 1})`,
      seed: `${versionIndex}-${idx}`,
    } satisfies PictureAsset;
  });
};

const parseGatewayResponse = (payload: unknown): PictureAsset[] => {
  if (!payload || typeof payload !== 'object') return [];
  const data = payload as ImageGatewayResponse;
  if (!Array.isArray(data.assets)) return [];
  return data.assets.filter((asset): asset is PictureAsset => Boolean(asset && asset.url));
};

const splitPromptVariants = (source?: string) =>
  source
    ? source
        .split(/\n{2,}/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const requestOpenAIImages = async (
  payload: ImageGatewayRequest,
  versionIndex: number,
  signal?: AbortSignal
): Promise<PictureAsset[]> => {
  const endpoint = resolveImageGatewayEndpoint();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Image gateway responded with ${response.status}`);
    }

    const data = await response.json();
    const assets = parseGatewayResponse(data);
    if (!assets.length) {
      return simulateOpenAIAssets(payload, versionIndex);
    }
    return assets;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Image gateway request failed, falling back to simulated assets', error);
    return simulateOpenAIAssets(payload, versionIndex);
  }
};

const normalizeUploads = (uploads: string[] | undefined) =>
  Array.isArray(uploads) ? uploads.filter((item) => typeof item === 'string' && item.length > 0) : [];

const buildImagePrompt = (
  brief: string,
  quickProps: PicturesQuickProps,
  uploads: string[],
  versionIndex: number
) => {
  const referenceNote = uploads.length ? 'Incorporate cues from the provided reference imagery.' : '';
  const nuance = versionIndex % 2 === 0 ? 'Bias toward polished commercial lighting.' : 'Lean into documentary-style storytelling.';
  return [
    basePromptFromQuickProps(brief, quickProps, uploads),
    referenceNote,
    nuance,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
};

const generatePromptMode = (
  config: PictureGenerationConfig,
  uploads: string[]
): GeneratedPictures[] => {
  const results: GeneratedPictures[] = [];
  const remixVariants = splitPromptVariants(config.remixPrompt);

  for (let version = 0; version < config.versions; version += 1) {
    if (config.signal?.aborted) {
      throwAbort();
    }
    const basePrompt = config.remixPrompt?.trim() || basePromptFromQuickProps(config.brief, config.quickProps, uploads);
    const prompts = remixVariants.length
      ? remixVariants.slice(0, 3).map((text, idx) => ({
          id: createId(`prompt-remix-${version}-${idx}`),
          intent: PROMPT_INTENTS[Math.min(idx, PROMPT_INTENTS.length - 1)],
          text,
        }))
      : buildPromptVariants(basePrompt, config.quickProps, version);

    results.push({
      id: createId('prompt-result'),
      mode: 'prompt',
      provider: 'gpt',
      prompts,
      meta: toMeta(config.quickProps),
    });
  }
  return results;
};

const generateImageMode = async (
  config: PictureGenerationConfig,
  uploads: string[]
): Promise<GeneratedPictures[]> => {
  const results: GeneratedPictures[] = [];
  for (let version = 0; version < config.versions; version += 1) {
    if (config.signal?.aborted) {
      throwAbort();
    }
    const prompt = config.remixPrompt?.trim() || buildImagePrompt(config.brief, config.quickProps, uploads, version);
    const dims = ASPECT_DIMENSIONS[config.quickProps.aspect] ?? ASPECT_DIMENSIONS['1:1'];
    const assets = await requestOpenAIImages(
      {
        prompt,
        aspect: config.quickProps.aspect,
        style: config.quickProps.style,
        referenceImages: uploads,
        count: 3,
      },
      version,
      config.signal
    );

    results.push({
      id: createId('openai-result'),
      mode: 'image',
      provider: 'openai',
      assets: assets.map((asset) => ({
        ...asset,
        width: asset.width || dims.width,
        height: asset.height || dims.height,
        mimeType: asset.mimeType || 'image/png',
      })),
      meta: { ...toMeta(config.quickProps), prompt },
    });
  }
  return results;
};

export async function generatePictureOutputs(config: PictureGenerationConfig): Promise<GeneratedPictures[]> {
  const uploads = normalizeUploads(config.uploads);
  const mode: PictureGenerationMode = config.quickProps.mode;

  if (mode === 'prompt') {
    return generatePromptMode(config, uploads);
  }

  return generateImageMode(config, uploads);
}
