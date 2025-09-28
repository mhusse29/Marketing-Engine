import { type ComponentType } from 'react';
import { SiFacebook, SiInstagram, SiTiktok, SiLinkedin, SiX, SiYoutube } from 'react-icons/si';

import type { Platform as PlatformId } from '../../types';

interface PlatformDefinition {
  label: string;
  description: string;
  Icon: ComponentType<{ className?: string }>;
}

export const PLATFORM_KEYS = ['Facebook', 'Instagram', 'TikTok', 'LinkedIn', 'X', 'YouTube'] as const;

export const PLATFORMS: Record<PlatformId, PlatformDefinition> = {
  facebook: {
    label: 'Facebook',
    description: 'Paid social reach + retargeting.',
    Icon: SiFacebook,
  },
  instagram: {
    label: 'Instagram',
    description: 'Stories, reels, and feed placements.',
    Icon: SiInstagram,
  },
  tiktok: {
    label: 'TikTok',
    description: 'Short-form video discovery.',
    Icon: SiTiktok,
  },
  linkedin: {
    label: 'LinkedIn',
    description: 'B2B and professional audiences.',
    Icon: SiLinkedin,
  },
  x: {
    label: 'X',
    description: 'High-velocity social conversation.',
    Icon: SiX,
  },
  youtube: {
    label: 'YouTube',
    description: 'Video campaigns across YouTube.',
    Icon: SiYoutube,
  },
} as const;

export const PLATFORM_ORDER: PlatformId[] = Object.keys(PLATFORMS) as PlatformId[];

export type { PlatformId };
