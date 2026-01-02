/**
 * Runway Video Generation Helper
 * Handles async video generation with proper polling
 */

import type { VideoQuickProps } from '../types';
import { buildVideoPrompt } from './videoPromptBuilder';

const GATEWAY_DEFAULT_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const MAX_IMAGE_DIMENSION = 1024; // Max width/height for video reference images
const MAX_IMAGE_SIZE_KB = 500; // Target size in KB

function getApiBase(): string {
  const explicit = import.meta.env?.VITE_AI_GATEWAY_URL as string | undefined;
  if (explicit && explicit.trim().length > 0) {
    return explicit.replace(/\/$/, '');
  }
  return GATEWAY_DEFAULT_URL;
}

/**
 * Compress a base64 image to reduce payload size for video APIs
 * Runway and other providers have payload limits (~10MB)
 */
async function compressImageForVideo(base64Image: string): Promise<string> {
  // If it's a URL (not base64), return as-is
  if (base64Image.startsWith('http://') || base64Image.startsWith('https://')) {
    return base64Image;
  }

  // Skip if already small enough (rough estimate: base64 is ~1.37x larger than binary)
  const estimatedSizeKB = (base64Image.length * 0.75) / 1024;
  if (estimatedSizeKB < MAX_IMAGE_SIZE_KB) {
    console.log(`[Video] Image already small: ${estimatedSizeKB.toFixed(0)}KB`);
    return base64Image;
  }

  console.log(`[Video] Compressing image from ${estimatedSizeKB.toFixed(0)}KB...`);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Scale down if larger than max dimension
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        const scale = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try progressively lower quality until size is acceptable
      let quality = 0.8;
      let result = canvas.toDataURL('image/jpeg', quality);
      
      while ((result.length * 0.75) / 1024 > MAX_IMAGE_SIZE_KB && quality > 0.3) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }

      const finalSizeKB = (result.length * 0.75) / 1024;
      console.log(`[Video] Compressed to ${finalSizeKB.toFixed(0)}KB (quality: ${quality.toFixed(1)})`);
      resolve(result);
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = base64Image;
  });
}

export interface VideoGenerationRequest {
  provider: 'runway' | 'luma' | 'google' | 'sora';
  promptText: string;
  model: string;
  duration: number;
  aspect: string;
  watermark: boolean;
  seed?: number;
  promptImage?: string;
  
  // Google Veo-specific parameters
  googleVeoModel?: string;
  googleVeoDuration?: number;
  googleVeoAudio?: boolean;
  
  // OpenAI Sora-specific parameters
  soraModel?: string;
  soraDuration?: number;
  soraQuality?: string;
  soraSize?: string;
  
  // Luma-specific core settings
  loop?: boolean;
  lumaDuration?: string;
  lumaResolution?: string;
  keyframes?: {
    frame0?: {
      type: 'image' | 'generation';
      url?: string;
    };
    frame1?: {
      type: 'image' | 'generation';
      url?: string;
    };
  };
  
  // Luma advanced parameters (FIX #2: Added all 15 missing parameters)
  lumaCameraMovement?: string;
  lumaCameraAngle?: string;
  lumaCameraDistance?: string;
  lumaStyle?: string;
  lumaLighting?: string;
  lumaMood?: string;
  lumaMotionIntensity?: string;
  lumaMotionSpeed?: string;
  lumaSubjectMovement?: string;
  lumaQuality?: string;
  lumaColorGrading?: string;
  lumaFilmLook?: string;
  lumaSeed?: number;
  lumaNegativePrompt?: string;
  lumaGuidanceScale?: number;
}

export interface RunwayTask {
  taskId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  progress?: number;
  videoUrl?: string;
  createdAt?: string;
  error?: string;
  failureCode?: string;
}

export interface GeneratedVideo {
  url: string;
  taskId: string;
  model: string;
  provider: 'runway' | 'luma' | 'google' | 'sora';
  duration: number;
  aspect: string;
  watermark: boolean;
  prompt: string;
  createdAt: string;
  meta?: {
    prompt: string;
    provider: string;
    model: string;
    aspect: string;
    duration: number;
    referenceImages?: string[];
    referenceImageCount?: number;
    [key: string]: unknown;
  };
}

/**
 * Start video generation (Runway or Luma)
 */
export async function startVideoGeneration(
  props: VideoQuickProps
): Promise<{ taskId: string; status: string; provider: string }> {
  const { provider, model, duration, aspect, watermark, seed, promptImages, lumaLoop, lumaKeyframes } = props;

  // Validate provider is resolved (not 'auto')
  if (provider === 'auto') {
    throw new Error('Provider must be selected (runway, luma, google, or sora), not auto');
  }

  // Build enhanced prompt from all parameters
  const enhancedPrompt = buildVideoPrompt(props);
  
  if (!enhancedPrompt || enhancedPrompt.length < 10) {
    throw new Error('Video prompt must be at least 10 characters');
  }

  // Compress reference images to avoid 413 Payload Too Large errors
  let compressedImages: string[] = [];
  if (promptImages && promptImages.length > 0) {
    console.log(`[Video] Compressing ${promptImages.length} reference image(s)...`);
    compressedImages = await Promise.all(
      promptImages.map(img => compressImageForVideo(img))
    );
  }

  const request: VideoGenerationRequest = {
    provider,
    promptText: enhancedPrompt,
    model,
    duration,
    aspect,
    watermark,
  };

  if (seed !== undefined && seed !== null) {
    request.seed = seed;
  }

  // Handle reference images based on provider
  if (compressedImages.length > 0) {
    if (provider === 'runway') {
      // Runway: Single image for image-to-video
      request.promptImage = compressedImages[0];
    } else if (provider === 'google') {
      // Google Veo: Single image for image-to-video
      request.promptImage = compressedImages[0];
    } else if (provider === 'luma') {
      // Luma: Convert to keyframes (up to 2 images)
      request.keyframes = {
        frame0: {
          type: 'image',
          url: compressedImages[0]
        }
      };
      
      // Add second image if provided
      if (compressedImages.length > 1) {
        request.keyframes.frame1 = {
          type: 'image',
          url: compressedImages[1]
        };
      }
    }
  }

  // Add Google Veo-specific parameters
  if (provider === 'google') {
    request.googleVeoModel = props.googleVeoModel || 'veo-3-fast';
    request.googleVeoDuration = props.googleVeoDuration || 8;
    request.googleVeoAudio = props.googleVeoAudio !== false;
    // Override duration with Google-specific duration
    request.duration = props.googleVeoDuration || 8;
  }

  // Add Luma-specific parameters (FIX #2: Send ALL 19 parameters to backend)
  if (provider === 'luma') {
    // Core settings
    if (lumaLoop !== undefined) request.loop = lumaLoop;
    if (props.lumaDuration) request.lumaDuration = props.lumaDuration;
    if (props.lumaResolution) request.lumaResolution = props.lumaResolution;
    if (lumaKeyframes) request.keyframes = lumaKeyframes;
    
    // Camera controls
    if (props.lumaCameraMovement) request.lumaCameraMovement = props.lumaCameraMovement;
    if (props.lumaCameraAngle) request.lumaCameraAngle = props.lumaCameraAngle;
    if (props.lumaCameraDistance) request.lumaCameraDistance = props.lumaCameraDistance;
    
    // Visual style & aesthetic
    if (props.lumaStyle) request.lumaStyle = props.lumaStyle;
    if (props.lumaLighting) request.lumaLighting = props.lumaLighting;
    if (props.lumaMood) request.lumaMood = props.lumaMood;
    
    // Motion controls
    if (props.lumaMotionIntensity) request.lumaMotionIntensity = props.lumaMotionIntensity;
    if (props.lumaMotionSpeed) request.lumaMotionSpeed = props.lumaMotionSpeed;
    if (props.lumaSubjectMovement) request.lumaSubjectMovement = props.lumaSubjectMovement;
    
    // Quality & color
    if (props.lumaQuality) request.lumaQuality = props.lumaQuality;
    if (props.lumaColorGrading) request.lumaColorGrading = props.lumaColorGrading;
    if (props.lumaFilmLook) request.lumaFilmLook = props.lumaFilmLook;
    
    // Technical controls
    if (props.lumaSeed !== undefined) request.lumaSeed = props.lumaSeed;
    if (props.lumaNegativePrompt) request.lumaNegativePrompt = props.lumaNegativePrompt;
    if (props.lumaGuidanceScale !== undefined) request.lumaGuidanceScale = props.lumaGuidanceScale;
  }

  // Add OpenAI Sora-specific parameters
  if (provider === 'sora') {
    request.soraModel = props.soraModel || 'sora-2';
    request.soraSize = props.soraSize || '1280x720';
  }

  console.log('[Video] Starting generation:', {
    provider,
    model,
    enhancedPromptLength: enhancedPrompt.length,
    hasImages: !!promptImages && promptImages.length > 0,
    imageCount: promptImages?.length || 0,
    hasKeyframes: !!request.keyframes,
    aspect,
    duration,
  });

  const response = await fetch(`${getApiBase()}/v1/videos/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Video Generation] Start failed:', response.status, errorText);
    throw new Error(`Failed to start video generation: ${response.status}`);
  }

  const result = await response.json();
  console.log('[Video Generation] Task created:', result.taskId, 'provider:', result.provider);

  return {
    taskId: result.taskId,
    status: result.status,
    provider: result.provider || provider,
  };
}

/**
 * Poll video task status (Runway, Luma, or Google)
 */
export async function pollVideoTask(taskId: string, provider?: string): Promise<RunwayTask> {
  // Google Veo returns taskId with slashes (e.g., "models/veo-3.0.../operations/xyz")
  // Use query param instead of path param to avoid URL routing issues
  const url = new URL(`${getApiBase()}/v1/videos/tasks/status`);
  url.searchParams.set('taskId', taskId);
  if (provider) {
    url.searchParams.set('provider', provider);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Video Generation] Poll failed:', response.status, errorText);
    throw new Error(`Failed to poll video task: ${response.status}`);
  }

  const result: RunwayTask = await response.json();
  console.log('[Video Generation] Task status:', result.taskId, result.status, `${result.progress || 0}%`, 'provider:', (result as RunwayTask & { provider?: string }).provider);

  return result;
}

/**
 * Poll video task with exponential backoff until completion
 */
export async function waitForVideoCompletion(
  taskId: string,
  onProgress?: (progress: number, status: string) => void,
  signal?: AbortSignal
): Promise<RunwayTask> {
  const MAX_ATTEMPTS = 150; // 5 minutes max (with exponential backoff)
  const INITIAL_DELAY = 2000; // Start with 2s
  const MAX_DELAY = 10000; // Max 10s between polls

  let attempt = 0;
  let delay = INITIAL_DELAY;

  while (attempt < MAX_ATTEMPTS) {
    if (signal?.aborted) {
      throw new Error('Video generation cancelled');
    }

    const task = await pollVideoTask(taskId);

    if (onProgress) {
      onProgress(task.progress || 0, task.status);
    }

    if (task.status === 'SUCCEEDED') {
      console.log('[Video Generation] Success! Video URL:', task.videoUrl);
      return task;
    }

    if (task.status === 'FAILED') {
      console.error('[Video Generation] Failed:', task.error);
      throw new Error(task.error || 'Video generation failed');
    }

    // PENDING or RUNNING - wait and retry
    console.log(`[Video Generation] Status: ${task.status}, waiting ${delay}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Exponential backoff: 2s → 4s → 8s → 10s (max)
    delay = Math.min(delay * 2, MAX_DELAY);
    attempt++;
  }

  throw new Error('Video generation timed out after 5 minutes');
}

/**
 * Generate video with full polling flow (Runway or Luma)
 */
export async function generateRunwayVideo(
  props: VideoQuickProps,
  onProgress?: (progress: number, status: string) => void,
  signal?: AbortSignal
): Promise<GeneratedVideo> {
  // Start generation
  const { taskId } = await startVideoGeneration(props);

  // Wait for completion with polling
  const result = await waitForVideoCompletion(taskId, onProgress, signal);

  if (!result.videoUrl) {
    throw new Error('Video generation succeeded but no URL returned');
  }

  // Return structured video data with metadata including reference images
  // Provider is guaranteed to be 'runway', 'luma', or 'google' due to validation above
  return {
    url: result.videoUrl,
    taskId: result.taskId,
    model: props.model,
    provider: props.provider as 'runway' | 'luma' | 'google',
    duration: props.duration,
    aspect: props.aspect,
    watermark: props.watermark,
    prompt: props.promptText,
    createdAt: result.createdAt || new Date().toISOString(),
    meta: {
      prompt: props.promptText,
      provider: props.provider as string,
      model: props.model,
      aspect: props.aspect,
      duration: props.duration,
      // Include reference images if provided
      ...(props.promptImages && props.promptImages.length > 0 && {
        referenceImages: props.promptImages,
        referenceImageCount: props.promptImages.length,
      }),
    },
  };
}
