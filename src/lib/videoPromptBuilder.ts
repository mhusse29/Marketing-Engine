import { getApiBase } from './api';
import type { VideoQuickProps, VideoProvider } from '../types';

/**
 * Build video prompt from VideoQuickProps
 * Simple pass-through that returns the prompt text
 */
export function buildVideoPrompt(props: VideoQuickProps): string {
  return props.promptText || '';
}

/**
 * Enhance a video prompt using GPT-5
 * Takes a basic user idea and transforms it into a professional, detailed prompt
 * optimized for the selected video provider (Runway or Luma)
 */
export async function enhanceVideoPrompt(
  userPrompt: string,
  provider: VideoProvider,
  settings: Partial<VideoQuickProps>,
  brief?: string
): Promise<{ enhanced: string; model: string }> {
  if (!userPrompt || userPrompt.trim().length < 10) {
    throw new Error('Prompt must be at least 10 characters');
  }

  // Don't enhance if provider is 'auto' - wait for provider selection
  if (provider === 'auto') {
    throw new Error('Please select a provider before enhancing the prompt');
  }

  const response = await fetch(`${getApiBase()}/v1/tools/video/enhance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: userPrompt,
      provider,
      settings: {
        aspect: settings.aspect,
        cameraMovement: settings.cameraMovement,
        visualStyle: settings.visualStyle,
        lightingStyle: settings.lightingStyle,
        mood: settings.mood,
        colorGrading: settings.colorGrading,
        motionSpeed: settings.motionSpeed,
        subjectFocus: settings.subjectFocus,
        depthOfField: settings.depthOfField,
      },
      brief,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'unknown_error' }));
    throw new Error(error.error || `Enhancement failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    enhanced: data.enhanced,
    model: data.model || 'gpt-5',
  };
}
