import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/format';
import type { GeneratedContent } from '../../types';
import { CardHeader } from './CardHeader';

interface ContentCardProps {
  content: GeneratedContent[][];
  currentVersion: number;
  onSave: () => void;
  onRegenerate: () => void;
}

const PLATFORM_LABELS: Record<string, { label: string; icon: string }> = {
  facebook: { label: 'Facebook', icon: '📘' },
  instagram: { label: 'Instagram', icon: '📷' },
  tiktok: { label: 'TikTok', icon: '🎵' },
  linkedin: { label: 'LinkedIn', icon: '💼' },
  'google.search': { label: 'Search', icon: '🔍' },
  'google.display': { label: 'Display', icon: '🖼️' },
  'google.youtube': { label: 'YouTube', icon: '📺' },
};

export function ContentCard({
  content,
  currentVersion,
  onSave,
  onRegenerate,
}: ContentCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [expandedCaptions, setExpandedCaptions] = useState<string[]>([]);
  const [copiedItems, setCopiedItems] = useState<string[]>([]);

  const versionContent = content[currentVersion] || [];
  const defaultPlatform = versionContent[0]?.platform || 'facebook';

  const handleSave = () => {
    setIsSaved(true);
    onSave();
    setTimeout(() => setIsSaved(false), 1200);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await onRegenerate();
    setIsRegenerating(false);
  };

  const toggleCaption = (platform: string) => {
    setExpandedCaptions((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItems((prev) => [...prev, id]);
    setTimeout(() => {
      setCopiedItems((prev) => prev.filter((item) => item !== id));
    }, 1200);
  };

  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.35)] lg:p-6"
    >
      <CardHeader
        title="Content"
        subtitle={`Generated at ${timestamp} • ${versionContent.length} platforms`}
        onSave={handleSave}
        onRegenerate={handleRegenerate}
        isSaved={isSaved}
        isRegenerating={isRegenerating}
      />

      {versionContent.length > 0 && (
        <Tabs.Root defaultValue={defaultPlatform}>
          <Tabs.List className="flex flex-wrap gap-2">
            {versionContent.map((item) => {
              const platformInfo = PLATFORM_LABELS[item.platform];
              return (
                <Tabs.Trigger
                  key={item.platform}
                  value={item.platform}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                    'data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3E8BFF] data-[state=active]:to-[#6B70FF] data-[state=active]:text-white data-[state=active]:shadow-[0_8px_24px_rgba(62,139,255,0.35)]',
                    'data-[state=inactive]:border-white/10 data-[state=inactive]:bg-white/[0.04] data-[state=inactive]:text-white/70 data-[state=inactive]:hover:border-white/20 data-[state=inactive]:hover:text-white'
                  )}
                >
                  <span>{platformInfo.icon}</span>
                  <span>{platformInfo.label}</span>
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>

          <div className="mt-6 space-y-6">
            {versionContent.map((item) => {
              const isExpanded = expandedCaptions.includes(item.platform);
              const headlineId = `headline-${item.platform}`;
              const captionId = `caption-${item.platform}`;
              const ctaId = `cta-${item.platform}`;

              return (
                <Tabs.Content key={item.platform} value={item.platform} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>Headline</span>
                      <button
                        onClick={() => copyToClipboard(item.headline, headlineId)}
                        className="inline-flex items-center gap-1 text-white/60 transition-colors hover:text-white"
                        type="button"
                      >
                        {copiedItems.includes(headlineId) ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Copy
                      </button>
                    </div>
                    <p className="text-base font-semibold text-[rgba(231,236,243,0.90)]">
                      {item.headline}
                    </p>
                  </div>

                  {item.caption && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>Caption</span>
                        <button
                          onClick={() => copyToClipboard(item.caption || '', captionId)}
                          className="inline-flex items-center gap-1 text-white/60 transition-colors hover:text-white"
                          type="button"
                        >
                          {copiedItems.includes(captionId) ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy
                        </button>
                      </div>
                      <div className="space-y-2 text-sm text-white/70">
                        <p className={cn('leading-relaxed', !isExpanded && item.caption.length > 150 && 'line-clamp-3')}>
                          {item.caption}
                        </p>
                        {item.caption.length > 150 && (
                          <button
                            onClick={() => toggleCaption(item.platform)}
                            className="inline-flex items-center gap-1 text-xs text-[#3E8BFF] transition-colors hover:text-[#6B70FF]"
                            type="button"
                          >
                            <span>{isExpanded ? 'Show less' : 'Show more'}</span>
                            <ChevronDown
                              className={cn(
                                'h-3 w-3 transition-transform',
                                isExpanded && 'rotate-180'
                              )}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {item.cta && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>Call to action</span>
                        <button
                          onClick={() => copyToClipboard(item.cta || '', ctaId)}
                          className="inline-flex items-center gap-1 text-white/60 transition-colors hover:text-white"
                          type="button"
                        >
                          {copiedItems.includes(ctaId) ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy
                        </button>
                      </div>
                      <p className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm font-medium text-white/80">
                        {item.cta}
                      </p>
                    </div>
                  )}
                </Tabs.Content>
              );
            })}
          </div>
        </Tabs.Root>
      )}

      {content.length > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/50">
          <span>Version {currentVersion + 1} of {content.length}</span>
        </div>
      )}
    </motion.div>
  );
}
