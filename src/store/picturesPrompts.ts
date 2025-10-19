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

  const styleSegment = `Create ${quickProps.style.toLowerCase()} imagery that highlights the hero product.`;
  const aspectSegment = `Frame for a ${quickProps.aspect} aspect ratio.`;

  segments.push(styleSegment, aspectSegment);

  if (quickProps.lockBrandColors) {
    segments.push('Keep brand colours locked and harmonised.');
  } else {
    segments.push('Use complementary colours that still feel on-brand.');
  }

  if (quickProps.backdrop && quickProps.backdrop !== 'Clean') {
    segments.push(`Backdrop preference: ${quickProps.backdrop.toLowerCase()}.`);
  }

  if (quickProps.lighting) {
    segments.push(`Lighting: ${quickProps.lighting.toLowerCase()} lighting.`);
  }

  if (quickProps.composition) {
    segments.push(`Composition: ${quickProps.composition.toLowerCase()}.`);
  }

  if (quickProps.camera) {
    segments.push(`Camera angle: ${quickProps.camera.toLowerCase()}.`);
  }

  if (quickProps.mood) {
    segments.push(`Overall mood: ${quickProps.mood.toLowerCase()}.`);
  }

  if (quickProps.colourPalette) {
    segments.push(`Colour palette: ${quickProps.colourPalette.toLowerCase()}.`);
  }

  if (quickProps.finish) {
    segments.push(`Surface finish: ${quickProps.finish.toLowerCase()}.`);
  }

  if (quickProps.texture) {
    segments.push(`Texture cues: ${quickProps.texture.toLowerCase()}.`);
  }

  if (quickProps.quality) {
    segments.push(`Prioritise a ${quickProps.quality.toLowerCase()} result.`);
  }

  if (quickProps.negative && quickProps.negative !== 'None') {
    segments.push(`Avoid ${quickProps.negative.toLowerCase()}.`);
  }

  return clampPrompt(segments.filter(Boolean).join(' '));
}

/**
 * Enhance a pictures prompt using GPT-5
 * Takes the current settings and campaign context to generate a professional, 
 * detailed image prompt optimized for the selected provider
 */
export async function enhancePicturesPrompt(
  quickProps: PicturesQuickProps,
  brief?: string
): Promise<{ suggestion: string; model: string }> {
  const response = await fetch(`${getApiBase()}/v1/tools/pictures/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      settings: {
        style: quickProps.style,
        aspect: quickProps.aspect,
        lighting: quickProps.lighting,
        composition: quickProps.composition,
        camera: quickProps.camera,
        mood: quickProps.mood,
        backdrop: quickProps.backdrop,
        colourPalette: quickProps.colourPalette,
        finish: quickProps.finish,
        texture: quickProps.texture,
        quality: quickProps.quality,
      },
      brief,
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
