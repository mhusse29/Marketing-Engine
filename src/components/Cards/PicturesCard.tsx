import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Download, ExternalLink, Image as ImageIcon, Upload } from 'lucide-react';

import { cn } from '../../lib/format';
import type { GeneratedPictures, PicAspect, PictureAsset, PictureRemixOptions } from '../../types';
import type { GridStepState } from '../../state/ui';
import CardShell from '../Outputs/CardShell';
import { StepDot } from '../Outputs/StepDot';
import NanoGridBloom from '@/ui/NanoGridBloom';
import PerimeterProgressSegmented from '@/ui/PerimeterProgressSegmented';

const STATUS_LABELS: Record<GridStepState, string> = {
  queued: 'Queued',
  thinking: 'Thinking…',
  rendering: 'Rendering…',
  ready: 'Ready',
  error: 'Needs attention',
};

const MODE_OPTIONS: Array<'prompt' | 'image'> = ['prompt', 'image'];
const ASPECT_OPTIONS: PicAspect[] = ['1:1', '4:5', '16:9'];
const VERSION_OPTIONS = [1, 2, 3, 4];

const ACTION_BUTTON =
  'inline-flex h-9 items-center rounded-full border border-white/12 bg-white/10 px-3 text-sm font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/16 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 disabled:cursor-not-allowed disabled:opacity-60';

const CONTROL_PILL =
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors';

const formatIntent = (intent: string) => intent.charAt(0).toUpperCase() + intent.slice(1);

const extractBasePrompt = (version: GeneratedPictures | undefined, mode: 'prompt' | 'image'): string => {
  if (!version) return '';
  if (mode === 'image') {
    if (version.mode === 'image') {
      return version.meta.prompt;
    }
    return version.prompts.map((prompt) => prompt.text).join('\n\n');
  }

  if (version.mode === 'prompt') {
    return version.prompts.map((prompt) => prompt.text).join('\n\n');
  }

  return version.meta.prompt;
};

async function downloadAsset(asset: PictureAsset, index: number) {
  const response = await fetch(asset.url);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `render-${index + 1}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

type PicturesCardProps = {
  pictures: GeneratedPictures[];
  currentVersion: number;
  brandLocked: boolean;
  onSave: () => void;
  onRegenerate: (options?: PictureRemixOptions) => Promise<void> | void;
  onReplaceImages?: () => void;
  status: GridStepState;
};

export function PicturesCard({
  pictures,
  currentVersion,
  brandLocked,
  onSave,
  onRegenerate,
  onReplaceImages,
  status,
}: PicturesCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedPrompts, setCopiedPrompts] = useState<number[]>([]);
  const [isRemixOpen, setIsRemixOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const versionPictures = pictures[currentVersion];
  const totalVersions = pictures.length;
  const statusLabel = STATUS_LABELS[status];
  const isBusy = status === 'queued' || status === 'thinking' || status === 'rendering';

  const [modeSelection, setModeSelection] = useState<'prompt' | 'image'>(versionPictures?.mode || 'prompt');
  const [aspectSelection, setAspectSelection] = useState<PicAspect>(versionPictures?.meta.aspect || '1:1');
  const [versionCount, setVersionCount] = useState(Math.max(1, totalVersions || 1));
  const [remixDraft, setRemixDraft] = useState(extractBasePrompt(versionPictures, modeSelection));

  const promptDirtyRef = useRef(false);
  const versionIdRef = useRef<string | undefined>(versionPictures?.id);

  useEffect(() => {
    if (!versionPictures) return;
    if (versionIdRef.current === versionPictures.id) return;
    versionIdRef.current = versionPictures.id;
    const nextMode = versionPictures.mode;
    setModeSelection(nextMode);
    setAspectSelection(versionPictures.meta.aspect);
    setVersionCount(Math.max(1, pictures.length || 1));
    const basePrompt = extractBasePrompt(versionPictures, nextMode);
    setRemixDraft(basePrompt);
    promptDirtyRef.current = false;
    setCopiedPrompts([]);
    setDownloadError('');
    setIsDownloading(false);
  }, [pictures.length, versionPictures]);

  useEffect(() => {
    if (!versionPictures || promptDirtyRef.current) return;
    setRemixDraft(extractBasePrompt(versionPictures, modeSelection));
  }, [modeSelection, versionPictures]);

  const providerLabel = useMemo(() => {
    if (!versionPictures) return null;
    return versionPictures.provider === 'openai' ? 'OpenAI image renders' : 'GPT prompt pack';
  }, [versionPictures]);

  const createdAtLabel = useMemo(() => {
    if (!versionPictures) return '';
    try {
      return new Date(versionPictures.meta.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }, [versionPictures]);

  const summaryItems = useMemo(
    () => [
      { label: 'Mode', value: modeSelection === 'image' ? 'Renders' : 'Prompts' },
      { label: 'Aspect', value: aspectSelection },
      { label: 'Style', value: versionPictures?.meta.style ?? '—' },
      { label: 'Versions', value: versionCount.toString() },
      { label: 'Palette', value: brandLocked ? 'Brand locked' : 'Adaptive' },
    ],
    [aspectSelection, brandLocked, modeSelection, versionCount, versionPictures?.meta.style]
  );

  const handleCopyPrompt = async (prompt: string, index: number) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedPrompts((prev) => [...prev, index]);
    window.setTimeout(() => {
      setCopiedPrompts((prev) => prev.filter((i) => i !== index));
    }, 1200);
  };

  const handleOpenAll = () => {
    if (versionPictures?.mode !== 'image') return;
    versionPictures.assets.forEach((asset) => {
      window.open(asset.url, '_blank', 'noopener,noreferrer');
    });
  };

  const handleDownloadAll = async () => {
    if (versionPictures?.mode !== 'image') return;
    setIsDownloading(true);
    setDownloadError('');
    try {
      for (let index = 0; index < versionPictures.assets.length; index += 1) {
        const asset = versionPictures.assets[index];
        await downloadAsset(asset, index);
      }
    } catch (error) {
      setDownloadError((error as Error).message || 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    onSave();
    window.setTimeout(() => setIsSaved(false), 1200);
  };

  const handleRemixChange = (value: string) => {
    promptDirtyRef.current = true;
    setRemixDraft(value);
  };

  const handleApplyRemix = async () => {
    if (!onRegenerate) return;
    setIsRegenerating(true);
    try {
      await onRegenerate({
        mode: modeSelection,
        aspect: aspectSelection,
        versionCount,
        prompt: remixDraft.trim() ? remixDraft.trim() : undefined,
      });
      promptDirtyRef.current = false;
      setIsRemixOpen(false);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <CardShell sheen={false} className="relative isolate overflow-hidden">
      <div className="relative z-10 flex h-full flex-col gap-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <h3 className="text-lg font-semibold text-white">Pictures / Prompt</h3>
              <StepDot state={status} />
              <span className="text-xs uppercase tracking-[0.18em] text-white/55">{statusLabel}</span>
            </div>
            <p className="text-xs text-white/55">Generated at {createdAtLabel || '—'}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaved || isBusy}
              className={cn(ACTION_BUTTON, isSaved && 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200')}
              type="button"
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={handleApplyRemix}
              disabled={isBusy || isRegenerating}
              className={ACTION_BUTTON}
              type="button"
            >
              {isRegenerating ? 'Regenerating…' : 'Regenerate'}
            </button>
          </div>
        </header>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-3 py-2 text-xs text-white/70">
            <div className="flex items-center gap-1">
              {MODE_OPTIONS.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setModeSelection(mode)}
                  className={cn(
                    CONTROL_PILL,
                    modeSelection === mode
                      ? 'border-transparent bg-white/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'
                  )}
                >
                  {mode === 'image' ? 'OpenAI renders' : 'Prompt only'}
                </button>
              ))}
            </div>

            <span className="h-6 w-px bg-white/10" aria-hidden />

            <label className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">Aspect</span>
              <select
                value={aspectSelection}
                onChange={(event) => setAspectSelection(event.target.value as PicAspect)}
                className="rounded-lg border border-white/10 bg-transparent px-2 py-1 text-xs text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
              >
                {ASPECT_OPTIONS.map((aspect) => (
                  <option key={aspect} value={aspect} className="bg-[#101827] text-white">
                    {aspect}
                  </option>
                ))}
              </select>
            </label>

            <span className="h-6 w-px bg-white/10" aria-hidden />

            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">Versions</span>
              <div className="inline-flex rounded-full bg-white/5 p-1">
                {VERSION_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setVersionCount(option)}
                    className={cn(
                      'mx-[1px] rounded-full px-2 py-1 text-xs transition-colors',
                      versionCount === option ? 'bg-white/25 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <span className="h-6 w-px bg-white/10" aria-hidden />

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRemixOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/75 transition-colors hover:border-white/20 hover:text-white"
              >
                Remix prompt
              </button>
              <button
                type="button"
                onClick={handleOpenAll}
                disabled={versionPictures?.mode !== 'image'}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/75 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open all
              </button>
              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={versionPictures?.mode !== 'image' || isDownloading}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/75 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {isDownloading ? 'Downloading…' : 'Download'}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              {modeSelection === 'prompt' && versionPictures?.mode === 'prompt' ? (
                <div className="space-y-3">
                  {versionPictures.prompts.map((prompt, index) => (
                    <div key={prompt.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-white/75">
                          <ImageIcon className="h-4 w-4" />
                          Prompt {index + 1}
                          <span className="text-white/45">• {formatIntent(prompt.intent)}</span>
                        </div>
                        <button
                          onClick={() => handleCopyPrompt(prompt.text, index)}
                          className="inline-flex items-center gap-1 text-xs text-white/60 transition-colors hover:text-white"
                          type="button"
                        >
                          {copiedPrompts.includes(index) ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          Copy
                        </button>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-white/70">{prompt.text}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {modeSelection === 'image' && versionPictures?.mode === 'image' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {versionPictures.assets.map((asset, index) => (
                      <div key={asset.id} className="group relative overflow-hidden rounded-2xl border border-white/10">
                        <img src={asset.url} alt={`Generated ${index + 1}`} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                          <p className="line-clamp-3 text-xs text-white/80">{asset.prompt}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => window.open(asset.url, '_blank', 'noopener,noreferrer')}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 transition-colors hover:border-white/30 hover:text-white"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await downloadAsset(asset, index);
                                } catch (error) {
                                  setDownloadError((error as Error).message || 'Download failed');
                                }
                              }}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 transition-colors hover:border-white/30 hover:text-white"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {onReplaceImages ? (
                    <button
                      onClick={onReplaceImages}
                      className="inline-flex items-center gap-2 text-sm text-[color:var(--ac-1)] transition-colors hover:text-[color:var(--ac-2)]"
                      type="button"
                    >
                      <Upload className="h-4 w-4" />
                      Replace images
                    </button>
                  ) : null}
                </div>
              ) : null}

              {modeSelection !== versionPictures?.mode && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60">
                  Selected mode will take effect on the next regenerate.
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">Snapshot</span>
                <dl className="mt-3 space-y-2">
                  {summaryItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4 text-sm text-white/70">
                      <dt className="text-white/50">{item.label}</dt>
                      <dd className="font-medium text-white/80">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {isRemixOpen ? (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">
                      Remix prompt
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRemixDraft(extractBasePrompt(versionPictures, modeSelection));
                        promptDirtyRef.current = false;
                      }}
                      className="text-xs text-white/60 underline-offset-4 transition-colors hover:text-white"
                    >
                      Reset
                    </button>
                  </div>
                  <textarea
                    value={remixDraft}
                    onChange={(event) => handleRemixChange(event.target.value)}
                    rows={8}
                    className="w-full rounded-xl border border-white/12 bg-[#0f172a]/60 p-3 text-sm text-white/80 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRemixOpen(false)}
                      className="inline-flex items-center rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyRemix}
                      disabled={isRegenerating || isBusy}
                      className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0d1420] transition-colors hover:bg-white/90 disabled:opacity-50"
                    >
                      {isRegenerating ? 'Sending…' : 'Apply remix'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-relaxed text-white/65">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                    Render prompt
                  </span>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/70">
                    {extractBasePrompt(versionPictures, modeSelection) || 'Prompt will appear after generation.'}
                  </p>
                </div>
              )}

              {downloadError ? (
                <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-xs text-amber-100">
                  {downloadError}
                </div>
              ) : null}
            </aside>
          </div>
        </div>

        {brandLocked && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-white/60">
            Brand palette enforced
          </div>
        )}

        <footer className="border-t border-white/10 pt-3 text-xs text-white/60">
          {totalVersions > 0 && versionPictures
            ? `Version ${Math.min(currentVersion + 1, totalVersions)} of ${totalVersions} • ${providerLabel}`
            : 'Awaiting first generation'}
        </footer>
      </div>

      <NanoGridBloom busy={isBusy || isRegenerating} />
      <PerimeterProgressSegmented status={status} />
    </CardShell>
  );
}
