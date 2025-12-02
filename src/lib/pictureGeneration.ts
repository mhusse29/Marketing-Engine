import type {
  AiAttachment,
  GeneratedPictures,
  PictureAsset,
  PictureResultMeta,
  PictureProvider,
  PicturesQuickProps,
} from '../types';
import { getActivePicturesPrompt } from '../store/picturesPrompts';

type PictureGenerationMode = 'images' | 'prompt';

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
  provider: string;
  aspect: PicturesQuickProps['aspect'];
  style?: PicturesQuickProps['style'];
  referenceImages?: string[];
  count?: number;
  // DALL-E specific
  dalleQuality?: string;
  dalleStyle?: string;
  // FLUX specific
  fluxMode?: string;
  fluxGuidance?: number;
  fluxSteps?: number;
  fluxSafetyTolerance?: number;
  fluxPromptUpsampling?: boolean;
  fluxRaw?: boolean;
  fluxOutputFormat?: string;
  fluxSeed?: number;
  // Stability specific
  stabilityModel?: string;
  stabilityCfg?: number;
  stabilitySteps?: number;
  stabilityNegativePrompt?: string;
  stabilityStylePreset?: string;
  stabilityOutputFormat?: string;
  stabilitySeed?: number;
  // Ideogram specific
  ideogramModel?: string;
  ideogramMagicPrompt?: boolean;
  ideogramStyleType?: string;
  ideogramNegativePrompt?: string;
  ideogramSeed?: number;
  // Gemini specific
  geminiModel?: string;
  geminiResolution?: string;
  geminiThinking?: boolean;
  geminiGrounding?: boolean;
  // Runway Gen-4 Image specific
  runwayImageModel?: string;
  runwayImageRatio?: string;
};

type ImageGatewayResponse = {
  assets: PictureAsset[];
};

const FALLBACK_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=1200&q=80',
];

const ASPECT_DIMENSIONS: Record<PicturesQuickProps['aspect'], { width: number; height: number; size: string }> = {
  '1:1': { width: 1024, height: 1024, size: '1024x1024' },
  '4:5': { width: 1024, height: 1280, size: '1024x1280' },
  '16:9': { width: 1536, height: 864, size: '1536x864' },
  '2:3': { width: 1024, height: 1536, size: '1024x1536' },
  '3:2': { width: 1536, height: 1024, size: '1536x1024' },
  '7:9': { width: 1120, height: 1440, size: '1120x1440' },
  '9:7': { width: 1440, height: 1120, size: '1440x1120' },
};

const pick = <T,>(list: T[], index: number) => list[index % list.length];

const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const throwAbort = (): never => {
  const error = new Error('Picture generation aborted');
  error.name = 'AbortError';
  throw error;
};

const resolveImageGatewayEndpoint = () => {
  // Check for explicit image gateway URL first
  const explicit = import.meta.env?.VITE_IMAGE_GATEWAY_URL as string | undefined;
  if (explicit && explicit.trim().length > 0) {
    return explicit.replace(/\/$/, '');
  }

  // Use AI gateway base URL (same as content generation)
  const base = import.meta.env?.VITE_AI_GATEWAY_URL as string | undefined;
  if (base && base.trim().length > 0) {
    return `${base.replace(/\/$/, '')}/v1/images/generate`;
  }

  // Default to localhost gateway (not the Vite dev server)
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

const simulateOpenAIAssets = (
  request: ImageGatewayRequest,
  versionIndex: number
): PictureAsset[]=> {
  const dims = ASPECT_DIMENSIONS[request.aspect] ?? ASPECT_DIMENSIONS['1:1'];
  const count = Math.max(2, Math.min(request.count ?? 3, 6));
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

const requestUnifiedImages = async (
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
      const errorText = await response.text();
      console.error(`Image gateway error (${response.status}):`, errorText);
      throw new Error(`Image gateway responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const assets = parseGatewayResponse(data);
    if (!assets.length) {
      console.warn(`No assets returned from ${payload.provider}, using fallback`);
      return simulateOpenAIAssets(payload, versionIndex);
    }
    return assets;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error(`Image gateway request failed for ${payload.provider}, falling back to simulated assets:`, error);
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

function resolveProvider(quickProps: PicturesQuickProps): PictureProvider {
  switch (quickProps.imageProvider) {
    case 'flux':
    case 'stability':
    case 'openai':
    case 'ideogram':
    case 'gemini':
    case 'runway':
      return quickProps.imageProvider;
    default:
      return 'openai';
  }
}

function resolvePrompt(
  config: PictureGenerationConfig,
  _provider: PictureProvider,
  uploads: string[],
  versionIndex = 0
): string {
  const remix = config.remixPrompt?.trim();
  if (remix) {
    return remix;
  }

  const providerPrompt = getActivePicturesPrompt(config.quickProps).trim();
  if (providerPrompt.length > 0) {
    return providerPrompt;
  }

  const genericPrompt = (config.quickProps.promptText ?? '').trim();
  if (genericPrompt.length > 0) {
    return genericPrompt;
  }

  return buildImagePrompt(config.brief, config.quickProps, uploads, versionIndex);
}

function buildMeta(
  provider: PictureProvider,
  mode: PictureGenerationMode,
  prompt: string,
  quickProps: PicturesQuickProps
): PictureResultMeta {
  const normalizedMode = mode === 'images' ? 'image' : 'prompt';
  const meta: PictureResultMeta = {
    style: quickProps.style,
    aspect: quickProps.aspect,
    lockBrandColors: quickProps.lockBrandColors,
    createdAt: new Date().toISOString(),
    provider,
    mode: normalizedMode,
    prompt,
  };

  switch (provider) {
    case 'flux':
      meta.model = `flux-pro-1.1-${quickProps.fluxMode}`;
      meta.quality = quickProps.fluxMode;
      meta.outputFormat = 'png';
      meta.guidance = quickProps.fluxGuidance;
      meta.steps = quickProps.fluxSteps;
      break;
    case 'stability':
      meta.model = quickProps.stabilityModel;
      meta.outputFormat = 'png';
      meta.guidance = quickProps.stabilityCfg;
      meta.steps = quickProps.stabilitySteps;
      break;
    case 'openai':
      meta.model = 'dall-e-3';
      meta.quality = quickProps.dalleQuality;
      meta.outputFormat = 'png';
      break;
    case 'ideogram':
      meta.model = quickProps.ideogramModel;
      meta.quality = quickProps.ideogramMagicPrompt ? 'on' : 'off';
      meta.outputFormat = 'png';
      break;
    case 'gemini':
      meta.model = quickProps.geminiModel;
      meta.quality = quickProps.geminiResolution;
      meta.outputFormat = 'png';
      break;
    case 'runway':
      meta.model = quickProps.runwayImageModel;
      meta.quality = quickProps.runwayImageRatio;
      meta.outputFormat = 'png';
      break;
    default:
      break;
  }

  return meta;
}

async function requestAssetsForProvider(
  provider: PictureProvider,
  prompt: string,
  config: PictureGenerationConfig,
  uploads: string[],
  versionIndex: number
): Promise<PictureAsset[]> {
  const referenceImages = provider === 'flux' ? uploads.slice(0, 1) : uploads;
  const qp = config.quickProps;
  
  const payload: ImageGatewayRequest = {
    prompt,
    provider,
    aspect: qp.aspect,
    style: qp.style,
    referenceImages,
    count: 3,
  };

  // Add provider-specific settings
  switch (provider) {
    case 'openai':
      payload.dalleQuality = qp.dalleQuality;
      payload.dalleStyle = qp.dalleStyle;
      break;
    case 'flux':
      payload.fluxMode = qp.fluxMode;
      payload.fluxGuidance = qp.fluxGuidance;
      payload.fluxSteps = qp.fluxSteps;
      payload.fluxSafetyTolerance = 2; // Default value
      payload.fluxPromptUpsampling = qp.fluxPromptUpsampling;
      payload.fluxRaw = qp.fluxRaw;
      payload.fluxOutputFormat = qp.fluxOutputFormat;
      break;
    case 'stability':
      payload.stabilityModel = qp.stabilityModel;
      payload.stabilityCfg = qp.stabilityCfg;
      payload.stabilitySteps = qp.stabilitySteps;
      payload.stabilityNegativePrompt = qp.stabilityNegativePrompt;
      payload.stabilityStylePreset = qp.stabilityStylePreset;
      payload.stabilityOutputFormat = 'png';
      break;
    case 'ideogram':
      payload.ideogramModel = qp.ideogramModel;
      payload.ideogramMagicPrompt = qp.ideogramMagicPrompt;
      payload.ideogramStyleType = qp.ideogramStyleType;
      payload.ideogramNegativePrompt = qp.ideogramNegativePrompt;
      break;
    case 'gemini':
      payload.geminiModel = qp.geminiModel;
      payload.geminiResolution = qp.geminiResolution;
      payload.geminiThinking = qp.geminiThinking;
      payload.geminiGrounding = qp.geminiGrounding;
      // Gemini supports up to 14 reference images
      payload.referenceImages = uploads.slice(0, 14);
      break;
    case 'runway':
      payload.runwayImageModel = qp.runwayImageModel;
      payload.runwayImageRatio = qp.runwayImageRatio;
      // Runway Gen-4 supports up to 3 reference images with tags
      payload.referenceImages = uploads.slice(0, 3);
      break;
  }

  return requestUnifiedImages(payload, versionIndex, config.signal);
}

// Removed generatePromptResults - always generate images now

const generateImageResults = async (
  config: PictureGenerationConfig,
  provider: PictureProvider,
  prompt: string,
  uploads: string[]
): Promise<GeneratedPictures[]> => {
  const results: GeneratedPictures[] = [];
  const count = Math.max(1, config.versions);
  const dims = ASPECT_DIMENSIONS[config.quickProps.aspect] ?? ASPECT_DIMENSIONS['1:1'];

  for (let version = 0; version < count; version += 1) {
    if (config.signal?.aborted) {
      throwAbort();
    }
    const promptForVersion = version === 0 ? prompt : resolvePrompt(config, provider, uploads, version);
    const assets = await requestAssetsForProvider(provider, promptForVersion, config, uploads, version);

    results.push({
      id: createId(`${provider}-result`),
      mode: 'image',
      provider,
      assets: assets.map((asset) => ({
        ...asset,
        width: asset.width || dims.width,
        height: asset.height || dims.height,
        mimeType: asset.mimeType || 'image/png',
      })),
      meta: {
        ...buildMeta(provider, 'images', promptForVersion, config.quickProps),
        prompt: promptForVersion,
        // Add reference images to meta for history panel display
        ...(uploads.length > 0 && { 
          referenceImages: uploads,
          referenceImageCount: uploads.length 
        }),
      },
    });
  }

  return results;
};

export async function generatePictureOutputs(config: PictureGenerationConfig): Promise<GeneratedPictures[]> {
  const uploads = normalizeUploads(config.uploads);
  const provider = resolveProvider(config.quickProps);
  const prompt = resolvePrompt(config, provider, uploads);
  
  // Always generate images now that Output section was removed
  return generateImageResults(config, provider, prompt, uploads);
}
