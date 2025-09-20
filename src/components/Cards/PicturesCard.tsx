import { useEffect, useState } from 'react';
import { Check, Copy, Image as ImageIcon, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/format';
import type { GeneratedPictures } from '../../types';
import { CardHeader } from './CardHeader';

interface PicturesCardProps {
  pictures: GeneratedPictures[];
  currentVersion: number;
  brandLocked: boolean;
  onSave: () => void;
  onRegenerate: () => void;
  onReplaceImages?: () => void;
}

export function PicturesCard({
  pictures,
  currentVersion,
  brandLocked,
  onSave,
  onRegenerate,
  onReplaceImages,
}: PicturesCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [mode, setMode] = useState<'prompt' | 'uploads'>(pictures[currentVersion]?.mode || 'prompt');
  const [copiedPrompts, setCopiedPrompts] = useState<number[]>([]);

  const versionPictures = pictures[currentVersion];
  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  useEffect(() => {
    if (versionPictures) {
      setMode(versionPictures.mode);
    }
  }, [versionPictures]);

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

  const copyPrompt = async (prompt: string, index: number) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedPrompts((prev) => [...prev, index]);
    setTimeout(() => {
      setCopiedPrompts((prev) => prev.filter((i) => i !== index));
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.35)] lg:p-6"
    >
      <CardHeader
        title="Pictures / Prompt"
        subtitle={`Generated at ${timestamp}`}
        onSave={handleSave}
        onRegenerate={handleRegenerate}
        isSaved={isSaved}
        isRegenerating={isRegenerating}
      />

      {versionPictures && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setMode('prompt')}
              disabled={versionPictures.mode === 'uploads'}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-all',
                mode === 'prompt'
                  ? 'border-transparent bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[0_8px_24px_rgba(62,139,255,0.35)]'
                  : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white',
                versionPictures.mode === 'uploads' && 'cursor-not-allowed opacity-60'
              )}
              type="button"
            >
              Prompt only
            </button>
            <button
              onClick={() => setMode('uploads')}
              disabled={versionPictures.mode === 'prompt'}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-all',
                mode === 'uploads'
                  ? 'border-transparent bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[0_8px_24px_rgba(62,139,255,0.35)]'
                  : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white',
                versionPictures.mode === 'prompt' && 'cursor-not-allowed opacity-60'
              )}
              type="button"
            >
              Upload actual pictures
            </button>
          </div>

          {mode === 'prompt' && versionPictures.mode === 'prompt' && (
            <div className="space-y-3">
              {versionPictures.prompts.map((prompt, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                      <ImageIcon className="h-4 w-4" />
                      Prompt {index + 1}
                    </div>
                    <button
                      onClick={() => copyPrompt(prompt, index)}
                      className="inline-flex items-center gap-1 text-xs text-white/60 transition-colors hover:text-white"
                      type="button"
                    >
                      {copiedPrompts.includes(index) ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{prompt}</p>
                </motion.div>
              ))}
            </div>
          )}

          {mode === 'uploads' && versionPictures.mode === 'uploads' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {versionPictures.images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative overflow-hidden rounded-2xl border border-white/10"
                  >
                    <img src={image.src} alt={`Generated ${index + 1}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="text-xs text-white/80">{image.enhancement}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {onReplaceImages && (
                <button
                  onClick={onReplaceImages}
                  className="inline-flex items-center gap-2 text-sm text-[#3E8BFF] transition-colors hover:text-[#6B70FF]"
                  type="button"
                >
                  <Upload className="h-4 w-4" />
                  Replace images
                </button>
              )}
            </div>
          )}

          {brandLocked && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-white/60">
              Brand palette enforced
            </div>
          )}
        </div>
      )}

      {pictures.length > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/50">
          <span>Version {currentVersion + 1} of {pictures.length}</span>
        </div>
      )}
    </motion.div>
  );
}
