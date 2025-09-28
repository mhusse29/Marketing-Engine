import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CircleStop, FileText, Lock, Paperclip, Sparkles, X } from 'lucide-react';
import { cn } from '../../lib/format';
import type { AiAttachment, AiUIState, CardKey, SettingsState } from '../../types';

interface AiBoxProps {
  aiState: AiUIState;
  settings: SettingsState;
  onGenerate: (brief: string, attachments: AiAttachment[]) => void;
  onClear: () => void;
  onCancel?: () => void;
  highlight?: boolean;
  contentStatus?: string;
  contentError?: string;
}

const SMART_PROMPTS = [
  'Write for first-time visitors',
  'Highlight social proof',
  'Keep it playful',
] as const;
const MAX_ATTACHMENTS = 5;

const ACCEPTED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/jpg',
  'application/pdf',
]);

const ACCEPTED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'pdf']);

const isAcceptedFile = (file: File) => {
  if (ACCEPTED_MIME_TYPES.has(file.type)) {
    return true;
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ACCEPTED_EXTENSIONS.has(extension);
};

const ATTACHMENTS_HELPER_ID = 'ai-attachments-helper';

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  x: 'X',
  youtube: 'YouTube',
};

const STEP_LABELS: Record<CardKey, string> = {
  content: 'Content',
  pictures: 'Pictures/Prompt',
  video: 'Video Prompt',
};

const makeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isBlobUrl = (url: string) => url.startsWith('blob:');

const createAttachment = (file: File): AiAttachment => {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mime = file.type || (extension ? `application/${extension}` : 'application/octet-stream');
  const url = URL.createObjectURL(file);
  const isImageMime = mime.startsWith('image/');
  const isImageExtension = ['png', 'jpg', 'jpeg', 'webp'].includes(extension);

  return {
    id: makeId(),
    url,
    name: file.name,
    mime,
    kind: isImageMime || isImageExtension ? 'image' : 'document',
    extension,
    size: file.size,
  };
};

export function AiBox({
  aiState,
  settings,
  onGenerate,
  onClear,
  onCancel,
  highlight = false,
  contentStatus,
  contentError,
}: AiBoxProps) {
  const [brief, setBrief] = useState(aiState.brief);
  const [uploads, setUploads] = useState<AiAttachment[]>(() =>
    aiState.uploads.map((item) => ({ ...item }))
  );
  const [fieldError, setFieldError] = useState('');
  const [focusWithin, setFocusWithin] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [shortcutKey, setShortcutKey] = useState<'⌘' | 'Ctrl'>('Ctrl');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const uploadsRef = useRef<AiAttachment[]>(uploads);
  const dragDepthRef = useRef(0);

  const isLocked = aiState.locked;
  const isBusy = aiState.generating;
  const canSubmit = !isLocked && !isBusy && brief.trim().length >= 10;

  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  useEffect(() => {
    return () => {
      uploadsRef.current.forEach((item) => {
        if (isBlobUrl(item.url)) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, []);

  useEffect(() => {
    setBrief(aiState.brief);
  }, [aiState.brief]);

  useEffect(() => {
    setUploads(aiState.uploads.map((item) => ({ ...item })));
  }, [aiState.uploads]);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setShortcutKey(/Mac|iPhone|iPad|Touch/.test(navigator.platform) ? '⌘' : 'Ctrl');
    }
  }, []);

  const autoResize = useCallback((node?: HTMLTextAreaElement | null) => {
    const textarea = node ?? textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const maxHeight = 8 * 24 + 48; // approx line-height * max lines + padding buffer
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [brief, autoResize]);

  const stepperSteps = useMemo(
    () => aiState.steps.filter((step): step is CardKey => step in STEP_LABELS),
    [aiState.steps]
  );

  const remoteError = useMemo(() => {
    return stepperSteps.some((step) => aiState.stepStatus?.[step] === 'error')
      ? 'Something broke. Try again.'
      : '';
  }, [aiState.stepStatus, stepperSteps]);

  const handleBriefChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setBrief(event.target.value);
      if (fieldError) {
        setFieldError('');
      }
      autoResize(event.target);
    },
    [autoResize, fieldError]
  );

  const handleSmartPrompt = useCallback(
    (prompt: string) => {
      if (isLocked || isBusy) return;
      setBrief((prev) => {
        if (!prev) return prompt;
        if (prev.includes(prompt)) return prev;
        return `${prev.trim()} ${prompt}`.trim();
      });
      setFieldError('');
      requestAnimationFrame(() => autoResize());
    },
    [autoResize, isBusy, isLocked]
  );

  const handleFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const accepted = files.filter(isAcceptedFile);
    if (accepted.length === 0) return;

    setUploads((prev) => {
      if (prev.length >= MAX_ATTACHMENTS) {
        return prev;
      }

      const remaining = Math.max(0, MAX_ATTACHMENTS - prev.length);
      if (remaining === 0) return prev;

      const nextAttachments = accepted.slice(0, remaining).map(createAttachment);
      return [...prev, ...nextAttachments];
    });
    setFieldError('');
  }, []);

  const handleFilePick = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) return;
      handleFiles(Array.from(event.target.files));
      event.target.value = '';
    },
    [handleFiles]
  );

  const handleDragEnter = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (isLocked || isBusy) return;
      dragDepthRef.current += 1;
      setIsDragging(true);
    },
    [isBusy, isLocked]
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      dragDepthRef.current = 0;
      setIsDragging(false);
      if (isLocked || isBusy) return;
      handleFiles(Array.from(event.dataTransfer.files));
    },
    [handleFiles, isBusy, isLocked]
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (isLocked || isBusy) return;
      setIsDragging(true);
    },
    [isBusy, isLocked]
  );

  const handleDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => {
      const next = prev.filter((item) => item.id !== id);
      const removed = prev.find((item) => item.id === id);
      if (removed && isBlobUrl(removed.url)) {
        URL.revokeObjectURL(removed.url);
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    if (isLocked) return;
    uploads.forEach((item) => {
      if (isBlobUrl(item.url)) {
        URL.revokeObjectURL(item.url);
      }
    });
    setUploads([]);
    setBrief('');
    setFieldError('');
    onClear();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = '';
    }
  }, [isLocked, onClear, uploads]);

  const handleGenerateClick = useCallback(() => {
    if (isLocked || isBusy) return;

    const nextBrief = brief.trim();
    if (nextBrief.length < 10) {
      setFieldError('Brief must be at least 10 characters.');
      return;
    }

    setFieldError('');
    onGenerate(nextBrief, uploads.map((item) => ({ ...item })));
  }, [brief, isBusy, isLocked, onGenerate, uploads]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        if (!canSubmit) return;
        event.preventDefault();
        handleGenerateClick();
      }
      if (event.key === 'Escape') {
        setIsDragging(false);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [canSubmit, handleGenerateClick]);

  return (
    <motion.section
      id="ai-box"
      ref={cardRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!cardRef.current?.contains(event.relatedTarget as Node | null)) {
          setFocusWithin(false);
        }
      }}
      aria-busy={isBusy}
      className={cn(
        'relative z-[1] overflow-hidden rounded-[32px] border border-white/8 bg-[#0D1420]/90 p-6 sm:p-8',
        'backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.55)] transition-all duration-300',
        'before:pointer-events-none before:absolute before:-inset-[1px] before:rounded-[inherit]',
        'before:bg-[linear-gradient(120deg,rgba(62,139,255,0.26),rgba(107,112,255,0.24))] before:transition-opacity before:duration-500',
        'after:pointer-events-none after:absolute after:inset-[1px] after:rounded-[inherit] after:border after:border-white/[0.08]',
        focusWithin && !isLocked && !isBusy
          ? '-translate-y-[3px] shadow-[0_24px_80px_rgba(3,12,28,0.65)]'
          : null,
        !isLocked && !isBusy
          ? 'before:opacity-60 before:animate-[halo_3000ms_ease-in-out_infinite]'
          : 'before:opacity-0 before:animate-none',
        !isLocked && !isBusy && isDragging && 'before:opacity-90 before:animate-none after:border-[#3E8BFF]/35',
        highlight && !isBusy && !isLocked ? 'before:opacity-80' : null,
        isLocked ? 'opacity-100' : null
      )}
    >
      {isLocked && (
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[#0D1420]/65" />
      )}

      <div className="relative z-[1]">
        <header className="mb-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center rounded-md bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-white/60">
              Ask AI
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] text-white/60 transition-colors',
                isLocked ? 'text-white/55' : isBusy ? 'text-white/65' : 'text-white/70'
              )}
              aria-live="polite"
            >
              {isLocked ? (
                <Lock className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
              )}
              {isLocked ? 'Complete Settings to continue' : isBusy ? 'Generating…' : 'Ready'}
            </span>
          </div>

          <div className="relative">
            <AnimatePresence>
              {focusWithin && !isLocked && !isBusy && (
                <motion.div
                  key="aurora"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 0.75, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.28 }}
                  className="pointer-events-none absolute -top-10 left-1/2 h-32 w-[340px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(62,139,255,0.32),transparent_70%)] blur-3xl"
                />
              )}
            </AnimatePresence>
            <h2 className="relative text-2xl font-extrabold text-white sm:text-3xl">
              Give me a quick brief for this campaign.
            </h2>
          </div>
          <p id="brief-helper" className="text-sm text-white/60">
            We’ll fan out to every selected format once you hit generate.
          </p>
        </header>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="ai-brief"
              className="text-[11px] font-medium uppercase tracking-[0.26em] text-white/55"
            >
              Campaign Brief
            </label>
            <div className="relative mt-3">
              <textarea
                ref={textareaRef}
                id="ai-brief"
                value={brief}
                onChange={handleBriefChange}
                disabled={isLocked || isBusy}
                rows={3}
                placeholder="Describe your audience, offer, and desired outcome..."
                aria-describedby={`brief-helper ${ATTACHMENTS_HELPER_ID}`}
                aria-invalid={Boolean(fieldError)}
                className={cn(
                  'w-full resize-none rounded-2xl border border-white/12 bg-white/[0.04] p-4 pr-16 text-base text-white/90',
                  'placeholder:text-white/35 caret-[#3E8BFF] transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(62,139,255,0.35)] focus-visible:border-white/20',
                  'focus-visible:shadow-[0_0_0_1px_rgba(62,139,255,0.25),0_18px_40px_rgba(6,22,54,0.45)]',
                  !isLocked && !isBusy && 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]',
                  isLocked || isBusy ? 'opacity-60' : null,
                  !isLocked && !isBusy && isDragging && 'border-[#3E8BFF]/60 bg-[#3E8BFF0f]'
                )}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                multiple
                className="hidden"
                onChange={handleFilePick}
                disabled={isLocked || isBusy || uploads.length >= MAX_ATTACHMENTS}
              />
              <button
                type="button"
                onClick={() => {
                  if (isLocked || isBusy || uploads.length >= MAX_ATTACHMENTS) return;
                  fileInputRef.current?.click();
                }}
                aria-label="Attach files"
                aria-describedby={ATTACHMENTS_HELPER_ID}
                disabled={isLocked || isBusy || uploads.length >= MAX_ATTACHMENTS}
                className={cn(
                  'absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/6 text-white/75 transition-all duration-150',
                  'hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(62,139,255,0.55)] disabled:pointer-events-none disabled:opacity-50',
                  !isLocked && !isBusy && uploads.length > 0 && 'border-[#3E8BFF]/45 bg-[#3E8BFF1a] text-white',
                  !isLocked && !isBusy && isDragging && 'border-[#3E8BFF] bg-[#3E8BFF20] text-white'
                )}
              >
                <Paperclip className="h-5 w-5" aria-hidden />
                {uploads.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#3E8BFF] px-1 text-[10px] font-semibold text-white shadow-[0_0_0_2px_rgba(13,20,32,0.85)]">
                    {uploads.length}
                  </span>
                )}
              </button>
            </div>
            {fieldError && (
              <p className="mt-2 text-xs text-rose-300">{fieldError}</p>
            )}
            <p id={ATTACHMENTS_HELPER_ID} className="mt-2 text-xs text-white/45">
              PNG · JPG · WEBP · PDF · max {MAX_ATTACHMENTS}
            </p>
            <AnimatePresence mode="popLayout">
              {uploads.length > 0 && (
                <motion.div
                  key="attachments"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="mt-3 flex flex-wrap gap-2"
                >
                  {uploads.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="group flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-3 py-2 text-xs text-white/85 shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
                    >
                      {item.kind === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="h-8 w-8 rounded-lg border border-white/10 object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/75">
                          <FileText className="h-4 w-4" aria-hidden />
                        </span>
                      )}
                      <span className="max-w-[160px] truncate" title={item.name}>
                        {item.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeUpload(item.id)}
                        disabled={isLocked || isBusy}
                        className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white transition-colors duration-150 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(62,139,255,0.55)] disabled:pointer-events-none disabled:opacity-50"
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap gap-2">
            {SMART_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSmartPrompt(prompt)}
                disabled={isLocked || isBusy}
                className="inline-flex h-9 items-center rounded-full border border-white/12 bg-white/6 px-4 text-sm text-white/80 transition-all duration-150 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(62,139,255,0.55)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {settings.platforms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {settings.platforms.map((platform) => (
                <span
                  key={platform}
                  className="inline-flex items-center rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs text-white/80"
                >
                  {PLATFORM_LABELS[platform] ?? platform}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={clearAll}
              disabled={isLocked || isBusy}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/12 bg-white/6 px-5 text-sm font-medium text-white/80 transition-all duration-150 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(62,139,255,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleGenerateClick}
              disabled={isLocked || isBusy || brief.trim().length < 10}
              className="ml-auto inline-flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-[linear-gradient(180deg,#3E8BFF,#6B70FF)] px-6 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(62,139,255,0.35)] transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1420] focus-visible:ring-[rgba(62,139,255,0.6)] disabled:pointer-events-none disabled:opacity-55"
            >
              {isBusy ? (
                <span className="inline-flex items-center gap-2">
                  <motion.span
                    aria-hidden
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
                    className="inline-flex h-4 w-4 items-center justify-center"
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.span>
                  Generating…
                </span>
              ) : (
                <span className="inline-flex items-center gap-3">
                  Generate
                  {brief.trim().length >= 10 && (
                    <span className="hidden text-xs text-white/70 sm:inline">{shortcutKey}↵</span>
                  )}
                </span>
              )}
            </button>
          </div>

          <div className="text-xs text-white/60">
            Status: {contentStatus ?? 'idle'}
            {contentError && contentStatus === 'error' && (
              <span className="ml-2 text-red-300">• {contentError}</span>
            )}
          </div>

          {remoteError && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-400/15 px-3 py-1 text-xs text-red-200">
              {remoteError}
              <button
                type="button"
                onClick={handleGenerateClick}
                disabled={isLocked || isBusy}
                className="font-medium text-red-100 underline underline-offset-4 transition-colors hover:text-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70 disabled:pointer-events-none disabled:text-red-200"
              >
                Try again
              </button>
            </div>
          )}

          {isBusy && (
            <div className="mt-5 flex w-full flex-wrap items-center gap-3 text-sm text-white/70">
              <div className="flex flex-wrap items-center gap-3">
                {stepperSteps.map((step) => (
                  <StepPill key={step} label={STEP_LABELS[step]} status={aiState.stepStatus?.[step]} />
                ))}
              </div>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/70 transition-all duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(62,139,255,0.55)]"
                  aria-label="Stop generation"
                >
                  <CircleStop className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function StepPill({
  label,
  status,
}: {
  label: string;
  status?: NonNullable<AiUIState['stepStatus'][CardKey]>;
}) {
  const currentStatus = status ?? 'queued';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs text-white/75',
        currentStatus === 'ready' && 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
        currentStatus === 'error' && 'border-rose-500/35 bg-rose-500/10 text-rose-200'
      )}
    >
      <StepStatusIcon status={currentStatus} />
      <span className="font-medium tracking-wide">{label}</span>
    </div>
  );
}

function StepStatusIcon({
  status,
}: {
  status: NonNullable<AiUIState['stepStatus'][CardKey]>;
}) {
  switch (status) {
    case 'thinking':
      return (
        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
          <span className="absolute h-full w-full rounded-full border border-white/40 opacity-70 animate-[dotHalo_900ms_ease-in-out_infinite]" />
        </span>
      );
    case 'rendering':
      return (
        <span className="relative h-3 w-6 overflow-hidden rounded-full bg-white/10">
          <span className="absolute inset-0 w-6 animate-[barShimmer_900ms_linear_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        </span>
      );
    case 'ready':
      return (
        <motion.span
          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-200"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.14 }}
        >
          <Check className="h-3 w-3" />
        </motion.span>
      );
    case 'error':
      return (
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500/20 text-rose-200">
          <X className="h-3 w-3" />
        </span>
      );
    default:
      return <span className="h-2 w-2 rounded-full bg-white/30" />;
  }
}
