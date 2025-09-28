// Minimal runtime-ish sanity for loader utilities (non-Jest envs can still type-check this).
import { platformSlug } from '@/icons/platforms/loader';

const cases = [
  ['Facebook', 'facebook'],
  ['Google Ads', 'google-ads'],
  ['  TikTok  ', 'tiktok'],
] as const;

cases.forEach(([input, expected]) => {
  const actual = platformSlug(input);
  if (actual !== expected) {
    throw new Error(`platformSlug failed: "${input}" -> "${actual}", expected "${expected}"`);
  }
});
