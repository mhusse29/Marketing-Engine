import type { PicturesQuickProps } from '../types';

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
