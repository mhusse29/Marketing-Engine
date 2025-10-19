import PlatformIcon from '@/ui/PlatformIcon';
import { getPlatformLabel } from '@/ui/platformUtils';
import type { StageManagerContentData } from './types';

interface MiniContentPreviewProps {
  content?: StageManagerContentData;
}

export function MiniContentPreview({ content }: MiniContentPreviewProps) {
  const platformId = content?.platformId ?? content?.platformLabel ?? 'Content';
  const platformLabel = content?.platformLabel || getPlatformLabel(platformId);
  const headline = content?.headline || 'Content ready to review';
  const caption = content?.caption || 'Generated copy will appear here when available.';
  const hashtags = content?.hashtags;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] border border-white/12 bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_45px_rgba(0,0,0,0.55)]">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
      <div className="absolute inset-0 backdrop-blur-xl" />
      <div className="relative z-10 flex h-full flex-col gap-3 p-5">
        <div className="flex items-start gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12">
            <PlatformIcon name={platformId} size={18} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]" />
            <span className="sr-only">{platformLabel}</span>
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-[15px] font-semibold leading-snug text-white/95 line-clamp-2">
            {headline}
          </h3>
          <p className="text-[12px] leading-relaxed text-white/75 line-clamp-3">
            {caption}
          </p>
          {hashtags ? (
            <p className="text-[10px] font-medium tracking-wide text-white/55 line-clamp-2">
              {hashtags}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
