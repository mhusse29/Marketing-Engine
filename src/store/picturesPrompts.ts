import type { PicturesQuickProps } from '../types';
import { getApiBase } from '../lib/api';

export const MAX_PICTURE_PROMPT_LENGTH = 4000;
export const MIN_PICTURE_PROMPT_LENGTH = 10;

export const clampPrompt = (value: string) => value.slice(0, MAX_PICTURE_PROMPT_LENGTH);
const normalisePrompt = (value: string) => clampPrompt((value ?? '').trim());

export function getActivePicturesPrompt(quickProps: PicturesQuickProps): string {
  return (quickProps.promptText ?? '').trim();
}

export function withActivePromptForProvider(
  quickProps: PicturesQuickProps,
  _provider: unknown,
  nextPrompt: string
): PicturesQuickProps {
  const prompt = normalisePrompt(nextPrompt ?? '');
  return {
    ...quickProps,
    promptText: prompt,
  };
}

export function craftPicturesPrompt(quickProps: PicturesQuickProps): string {
  const segments: string[] = [];

  if (quickProps.style) {
    segments.push(`Create ${quickProps.style.toLowerCase()} imagery that highlights the hero product.`);
  }
  if (quickProps.aspect) {
    segments.push(`Frame for a ${quickProps.aspect} aspect ratio.`);
  }

  return clampPrompt(segments.filter(Boolean).join(' '));
}

/**
 * Enhance a pictures prompt using GPT-5
 * Takes the current settings and campaign context to generate a professional, 
 * detailed image prompt optimized for the selected provider.
 * If the user has already typed a prompt, it will be refined rather than replaced.
 */
export async function enhancePicturesPrompt(
  quickProps: PicturesQuickProps,
  brief?: string
): Promise<{ suggestion: string; model: string }> {
  const currentPrompt = (quickProps.promptText ?? '').trim();
  
  const response = await fetch(`${getApiBase()}/v1/tools/pictures/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      settings: {
        style: quickProps.style,
        aspect: quickProps.aspect,
      },
      brief,
      currentPrompt, // Pass the user's current prompt for refinement
      provider: quickProps.imageProvider === 'auto' ? 'openai' : quickProps.imageProvider,
    }),
  });

  if (!response.ok) {
    // Let error bubble up so caller can fall back to craftPicturesPrompt
    const error = await response.json().catch(() => ({ error: 'unknown_error' }));
    throw new Error(error.error || `Enhancement failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    suggestion: data.suggestion,
    model: data.model || 'gpt-5',
  };
}
