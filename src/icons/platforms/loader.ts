/**
 * Robust icon loader that works even if some import paths are wrong.
 * - Primary: eager glob of /src assets (Vite / Next).
 * - Fallback: public/ path URL.
 */
import facebookUrl from './facebook.svg?url';
import instagramUrl from './instagram.svg?url';
import tiktokUrl from './tiktok.svg?url';
import linkedinUrl from './linkedin.svg?url';
import googleUrl from './google.svg?url';
import googleAdsUrl from './google-ads.svg?url';
import youtubeUrl from './youtube.svg?url';
import xUrl from './x.svg?url';
import snapchatUrl from './snapchat.svg?url';
import pinterestUrl from './pinterest.svg?url';

const STATIC_MAP: Record<string, string> = {
  facebook: facebookUrl,
  instagram: instagramUrl,
  tiktok: tiktokUrl,
  linkedin: linkedinUrl,
  google: googleUrl,
  'google-ads': googleAdsUrl,
  youtube: youtubeUrl,
  x: xUrl,
  snapchat: snapchatUrl,
  pinterest: pinterestUrl,
};

/** Normalize a platform key to a file slug (e.g., "Facebook" -> "facebook"). */
export function platformSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

function tryLocalUrl(relativePath: string): string | undefined {
  try {
    return new URL(relativePath, import.meta.url).href;
  } catch {
    return undefined;
  }
}

/** Return a usable URL for a platform SVG, or undefined if missing. */
export function iconUrl(name: string): string | undefined {
  const slug = platformSlug(name);
  const aliasMap: Record<string, string> = {
    'google ads': 'google-ads',
    youtube: 'youtube',
    'youtube shorts': 'youtube',
    snap: 'snapchat',
  };

  const canonicalSlug = STATIC_MAP[slug]
    ? slug
    : STATIC_MAP[aliasMap[slug]]
    ? aliasMap[slug]
    : slug;

  if (STATIC_MAP[canonicalSlug]) {
    return STATIC_MAP[canonicalSlug];
  }

  const local = tryLocalUrl(`./${canonicalSlug}.svg`);
  if (local) return local;

  return `/icons/platforms/${canonicalSlug}.svg`;
}
