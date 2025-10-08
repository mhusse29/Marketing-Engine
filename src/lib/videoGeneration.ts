/**
 * Runway Video Generation Helper
 * Handles async video generation with proper polling
 */

import type { VideoQuickProps } from '../types';

const GATEWAY_DEFAULT_URL = 'http://localhost:8787';

function getApiBase(): string {
  const explicit = import.meta.env?.VITE_AI_GATEWAY_URL as string | undefined;
  if (explicit && explicit.trim().length > 0) {
    return explicit.replace(/\/$/, '');
  }
  return GATEWAY_DEFAULT_URL;
}

export interface RunwayGenerationRequest {
  promptText: string;
  model: 'gen3a_turbo' | 'gen3a';
  duration: 5 | 10;
  aspect: '9:16' | '1:1' | '16:9';
  watermark: boolean;
  seed?: number;
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
  duration: number;
  aspect: string;
  watermark: boolean;
  prompt: string;
  createdAt: string;
}

/**
 * Start Runway video generation
 */
export async function startVideoGeneration(
  props: VideoQuickProps
): Promise<{ taskId: string; status: string }> {
  const { promptText, model, duration, aspect, watermark, seed } = props;

  if (!promptText || promptText.trim().length < 10) {
    throw new Error('Video prompt must be at least 10 characters');
  }

  const request: RunwayGenerationRequest = {
    promptText: promptText.trim(),
    model,
    duration,
    aspect,
    watermark,
  };

  if (seed !== undefined && seed !== null) {
    request.seed = seed;
  }

  console.log('[Video Generation] Starting:', request);

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
  console.log('[Video Generation] Task created:', result.taskId);

  return {
    taskId: result.taskId,
    status: result.status,
  };
}

/**
 * Poll Runway task status
 */
export async function pollVideoTask(taskId: string): Promise<RunwayTask> {
  const response = await fetch(`${getApiBase()}/v1/videos/tasks/${taskId}`, {
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
  console.log('[Video Generation] Task status:', result.taskId, result.status, `${result.progress || 0}%`);

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
 * Generate video with full polling flow
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

  // Return structured video data
  return {
    url: result.videoUrl,
    taskId: result.taskId,
    model: props.model,
    duration: props.duration,
    aspect: props.aspect,
    watermark: props.watermark,
    prompt: props.promptText,
    createdAt: result.createdAt || new Date().toISOString(),
  };
}

