/**
 * Runway Video Generation Helper
 * Handles async video generation with proper polling
 */

import type { VideoQuickProps } from '../types';
import { buildVideoPrompt } from './videoPromptBuilder';

const GATEWAY_DEFAULT_URL = 'http://localhost:8787';

function getApiBase(): string {
  const explicit = import.meta.env?.VITE_AI_GATEWAY_URL as string | undefined;
  if (explicit && explicit.trim().length > 0) {
    return explicit.replace(/\/$/, '');
  }
  return GATEWAY_DEFAULT_URL;
}

export interface VideoGenerationRequest {
  provider: 'runway' | 'luma';
  promptText: string;
  model: string;
  duration: 8;
  aspect: string;
  watermark: boolean;
  seed?: number;
  promptImage?: string;
  
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
  provider: 'runway' | 'luma';
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
    throw new Error('Provider must be selected (runway or luma), not auto');
  }

  // Build enhanced prompt from all parameters
  const enhancedPrompt = buildVideoPrompt(props);
  
  if (!enhancedPrompt || enhancedPrompt.length < 10) {
    throw new Error('Video prompt must be at least 10 characters');
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
  if (promptImages && promptImages.length > 0) {
    if (provider === 'runway') {
      // Runway: Single image for image-to-video
      request.promptImage = promptImages[0];
    } else if (provider === 'luma') {
      // Luma: Convert to keyframes (up to 2 images)
      request.keyframes = {
        frame0: {
          type: 'image',
          url: promptImages[0]
        }
      };
      
      // Add second image if provided
      if (promptImages.length > 1) {
        request.keyframes.frame1 = {
          type: 'image',
          url: promptImages[1]
        };
      }
    }
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
 * Poll video task status (Runway or Luma)
 */
export async function pollVideoTask(taskId: string, provider?: string): Promise<RunwayTask> {
  const url = new URL(`${getApiBase()}/v1/videos/tasks/${taskId}`);
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
  // Provider is guaranteed to be 'runway' or 'luma' due to validation above
  return {
    url: result.videoUrl,
    taskId: result.taskId,
    model: props.model,
    provider: props.provider as 'runway' | 'luma',
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
