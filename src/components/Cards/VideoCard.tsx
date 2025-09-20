import { useState } from 'react';
import { Check, Clock, Copy, Film, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { GeneratedVideo } from '../../types';
import { CardHeader } from './CardHeader';

interface VideoCardProps {
  videos: GeneratedVideo[];
  currentVersion: number;
  onSave: () => void;
  onRegenerate: () => void;
}

const BEAT_ICONS = {
  Hook: '🎬',
  Problem: '❓',
  Solution: '💡',
  Proof: '✨',
  Value: '🎯',
  CTA: '🚀',
};

export function VideoCard({ videos, currentVersion, onSave, onRegenerate }: VideoCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const versionVideo = videos[currentVersion];
  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

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

  const copyFullPrompt = async () => {
    if (!versionVideo) return;
    await navigator.clipboard.writeText(versionVideo.fullPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.35)] lg:p-6"
    >
      <CardHeader
        title="Video Prompt"
        subtitle={`Generated at ${timestamp}`}
        onSave={handleSave}
        onRegenerate={handleRegenerate}
        isSaved={isSaved}
        isRegenerating={isRegenerating}
      />

      {versionVideo && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 text-xs text-white/70">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
              <Maximize2 className="h-3.5 w-3.5" />
              {versionVideo.aspect}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
              <Clock className="h-3.5 w-3.5" />
              {versionVideo.durationSec}s
            </span>
          </div>

          <div className="space-y-4">
            {versionVideo.scriptBeats.map((beat, index) => (
              <motion.div
                key={beat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex min-w-[90px] items-center gap-2 text-sm font-semibold text-white/70">
                  <span>{BEAT_ICONS[beat.label]}</span>
                  <span>{beat.label}</span>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-white/70">{beat.text}</p>
              </motion.div>
            ))}
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between text-xs text-white/60">
              <div className="flex items-center gap-2 font-medium text-white/70">
                <Film className="h-4 w-4" />
                Full Prompt
              </div>
              <button
                onClick={copyFullPrompt}
                className="inline-flex items-center gap-1 text-xs text-white/60 transition-colors hover:text-white"
                type="button"
              >
                {copiedPrompt ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy
              </button>
            </div>
            <p className="text-sm leading-relaxed text-white/70">{versionVideo.fullPrompt}</p>
          </div>

          <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 py-3 text-xs text-yellow-100/80">
            Prompt only · video render not included
          </div>
        </div>
      )}

      {videos.length > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/50">
          <span>Version {currentVersion + 1} of {videos.length}</span>
        </div>
      )}
    </motion.div>
  );
}
