import type { ReactNode, ChangeEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, HelpCircle, LogOut, Wand2, Paperclip, FileText, X, Loader2, ImageIcon, Maximize2, ChevronLeft, Download } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '../lib/format';
import type {
  CardKey,
  Language,
  Persona,
  PicAspect,
  PicStyle,
  PicturesQuickProps,
  SettingsState,
  Tone,
  Platform,
} from '../types';
import { useCardsStore } from '../store/useCardsStore';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from './ui/menubar';
import { menuSurface, barHeight } from '../ui/tokens';
import CTAChip from './ui/CTAChip';
import TooltipPrimitive from './primitives/Tooltip';
import GradientMenu from './ui/gradient-menu';
import PlatformPill from '../ui/PlatformPill';
import { getApiBase } from '../lib/api';
import {
  createAttachment,
  isAcceptedFile,
  revokeAttachmentUrl,
  withAttachmentData,
  clearAttachmentCache,
} from '../lib/attachments';
import { MAX_ATTACHMENT_SIZE_MB } from '../lib/attachmentLimits';
import { 
  craftPicturesPrompt,
  enhancePicturesPrompt,
  MAX_PICTURE_PROMPT_LENGTH,
} from '../store/picturesPrompts';

interface AppMenuBarProps {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

const MAX_CONTENT_ATTACHMENTS = 5;

const FILE_ACTIONS = {
  onNewProject: () => console.info('New project'),
  onOpen: () => console.info('Open project'),
  onSignOut: () => console.info('Sign out'),
};

const EDIT_ACTIONS = {
  onUndo: () => console.info('Undo'),
  onRedo: () => console.info('Redo'),
};

const trigger =
  'inline-flex h-full items-center gap-2 px-3 text-sm font-medium text-white/80 hover:text-white rounded-md ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500/35 data-[state=open]:text-white ' +
  'data-[state=open]:bg-gradient-to-r data-[state=open]:from-[#3E8BFF]/25 data-[state=open]:to-[#6B70FF]/25';

const PERSONA_OPTIONS: Persona[] = ['Generic', 'First-time', 'Warm lead', 'B2B DM', 'Returning'];
const PERSONA_HINTS: Record<Persona, string> = {
  Generic: 'Balanced messaging that works across broad audiences.',
  'First-time': 'Introduce the brand to completely new prospects.',
  'Warm lead': 'Assumes previous site visits or list engagement.',
  'B2B DM': 'Targets business decision-makers evaluating solutions.',
  Returning: 'Speaks to people who already purchased or subscribed.',
};

const TONE_OPTIONS: Tone[] = ['Friendly', 'Informative', 'Bold', 'Premium', 'Playful', 'Professional'];
const TONE_HINTS: Record<Tone, string> = {
  Friendly: 'Approachable, conversational voice.',
  Informative: 'Data-forward, educational messaging.',
  Bold: 'High-energy copy that grabs attention fast.',
  Premium: 'Luxe, refined tone for upscale positioning.',
  Playful: 'Light-hearted, upbeat vibe.',
  Professional: 'Formal, authoritative delivery.',
};

const LANGUAGE_OPTIONS: Language[] = ['EN', 'AR', 'FR'];
const LANGUAGE_HINTS: Record<Language, string> = {
  EN: 'English copy for global markets.',
  AR: 'Arabic localisation for MENA audiences.',
  FR: 'French localisation for EU/Canadian reach.',
};

const CTA_OPTIONS = [
  'Learn more',
  'Get a demo',
  'Sign up',
  'Shop now',
  'Start free trial',
  'Book a call',
  'Download guide',
] as const;
const CTA_HINTS: Record<(typeof CTA_OPTIONS)[number], string> = {
  'Learn more': 'Low-friction CTA for awareness or education.',
  'Get a demo': 'High-intent CTA suited to B2B product tours.',
  'Sign up': 'Mid-funnel conversion for account creation.',
  'Shop now': 'Ready-to-buy e-commerce traffic.',
  'Start free trial': 'Trial or freemium subscription offers.',
  'Book a call': 'Sales-assisted, consultative funnel.',
  'Download guide': 'Lead magnet or gated content capture.',
};

const PLATFORM_OPTIONS: Array<{ id: Platform; label: string }> = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X (Twitter)' },
  { id: 'youtube', label: 'YouTube' },
];

const arraysEqual = <T,>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
};

const sameMembers = <T,>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  const setB = new Set(b);
  return a.every((item) => setB.has(item)) && b.every((item) => setA.has(item));
};

// const COPY_LENGTH_OPTIONS = ['Compact', 'Standard', 'Detailed'] as const;

const PICTURE_STYLE_OPTIONS: PicStyle[] = ['Product', 'Lifestyle', 'UGC', 'Abstract'];
const PICTURE_STYLE_HINTS: Record<PicStyle, string> = {
  Product: 'Clean product hero shots with focus on the item.',
  Lifestyle: 'Real people using the product in context.',
  UGC: 'Creator-style, handheld authentic visuals.',
  Abstract: 'Conceptual, art-led imagery for campaigns.',
};

const PICTURE_ASPECT_HINTS: Record<PicAspect, string> = {
  '1:1': 'Square feed placements (FB/IG grid, thumbnails).',
  '4:5': 'Portrait feed optimised for Meta/LinkedIn.',
  '16:9': 'Landscape hero, web banners, or YouTube thumbs.',
  '2:3': 'Poster-ready portrait framing with tall presence.',
  '3:2': 'Classic 35mm storytelling with balanced breathing room.',
  '7:9': 'Mobile-first hero crop with extra vertical emphasis.',
  '9:7': 'Editorial leaning crop with space for overlays.',
};

const PICTURE_BACKDROP_OPTIONS = ['Clean', 'Gradient', 'Real-world'] as const;
const PICTURE_BACKDROP_HINTS: Record<(typeof PICTURE_BACKDROP_OPTIONS)[number], string> = {
  Clean: 'Studio seamless background.',
  Gradient: 'Soft colour gradient backdrops.',
  'Real-world': 'Environmental, on-location scenes.',
};

const PICTURE_LIGHTING_OPTIONS = ['Soft', 'Hard', 'Neon'] as const;
const PICTURE_LIGHTING_HINTS: Record<(typeof PICTURE_LIGHTING_OPTIONS)[number], string> = {
  Soft: 'Diffused lighting with gentle shadows.',
  Hard: 'Directional light with crisp contrast.',
  Neon: 'Bold, neon-accent lighting cues.',
};

const PICTURE_QUALITY_OPTIONS = ['High detail', 'Sharp', 'Minimal noise'] as const;
const PICTURE_QUALITY_HINTS: Record<(typeof PICTURE_QUALITY_OPTIONS)[number], string> = {
  'High detail': 'Maximum texture and fine detail.',
  Sharp: 'Extra crisp focus and edges.',
  'Minimal noise': 'Smooth finish with low grain.',
};

const PICTURE_NEGATIVE_OPTIONS = ['None', 'Logos', 'Busy background', 'Extra hands', 'Glare'] as const;
const PICTURE_NEGATIVE_HINTS: Record<(typeof PICTURE_NEGATIVE_OPTIONS)[number], string> = {
  None: 'No additional negative guidance applied.',
  Logos: 'Avoid third-party logos and trademarks.',
  'Busy background': 'Keep backgrounds uncluttered.',
  'Extra hands': 'Prevent extra limbs or duplicate hands.',
  Glare: 'Reduce reflective glare and hotspots.',
};

// Video constants - all moved to MenuVideo.tsx
const BRAND_LOCK_HINT = 'Locks palettes to your brand colours for consistency.';

// Glass-morphism style used across all menu panels
const glassStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(10, 14, 20, 0.92), rgba(8, 12, 18, 0.92))',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  boxShadow: '0 12px 50px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(255, 255, 255, 0.04) inset',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

export function AppMenuBar({ settings, onGenerate, isGenerating = false }: AppMenuBarProps) {
  // const order = useCardsStore((state) => state.order); // Removed - using GradientMenu instead
  const enabled = useCardsStore((state) => state.enabled);

  // const cards = useMemo(() => order.filter((card) => enabled[card]), [order, enabled]); // Removed - using GradientMenu instead

  // Check validation states
  const contentValidated = enabled.content && settings.quickProps.content.validated && settings.platforms.length > 0;
  const picturesValidated = enabled.pictures && settings.quickProps.pictures.validated;
  const videoValidated = enabled.video && settings.quickProps.video.validated;
  const anyValidated = contentValidated || picturesValidated || videoValidated;
  const canGenerate = anyValidated && !isGenerating;

  return (
    <div 
      className={cn('flex h-full w-full items-center border-b border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.02)_inset]', barHeight)}
    >
      <div className="mx-auto flex h-full w-full max-w-[1240px] items-center px-4">
        <Menubar className="flex h-full w-full items-center border-0 bg-transparent px-0">
          <div className="flex w-full items-center gap-2" role="presentation">
            <MenubarMenu>
              <MenubarTrigger className={trigger}>File</MenubarTrigger>
              <MenubarContent className={cn(menuSurface, 'pointer-events-auto z-[80] min-w-[220px]')} sideOffset={8} align="start">
                <MenubarItem onSelect={FILE_ACTIONS.onNewProject}>New Project</MenubarItem>
                <MenubarItem onSelect={FILE_ACTIONS.onOpen}>Open…</MenubarItem>
                <MenubarSeparator className="bg-white/10" />
                <MenubarItem onSelect={FILE_ACTIONS.onSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
              <MenubarTrigger className={trigger}>Edit</MenubarTrigger>
              <MenubarContent className={cn(menuSurface, 'pointer-events-auto z-[80] min-w-[180px]')} sideOffset={8} align="start">
                <MenubarItem onSelect={EDIT_ACTIONS.onUndo}>Undo</MenubarItem>
                <MenubarItem onSelect={EDIT_ACTIONS.onRedo}>Redo</MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <div className="flex-1" role="presentation" />

            <div className="flex items-center justify-center" role="presentation">
              <GradientMenu 
                onItemClick={(item) => {
                  const card = item as CardKey;
                  useCardsStore.getState().select(card);
                }}
                validatedItems={[
                  ...(contentValidated ? ['content'] : []),
                  ...(picturesValidated ? ['pictures'] : []),
                  ...(videoValidated ? ['video'] : [])
                ]}
              />
            </div>

            <div className="flex-1" role="presentation" />

            {/* Export Menu */}
            <MenubarMenu>
              <MenubarTrigger className={cn(
                trigger,
                'inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium',
                'bg-white/5 text-white/90 hover:bg-white/10 hover:text-white',
                'transition-all duration-200'
              )}>
                <Download className="h-4 w-4" />
                <span>Export</span>
              </MenubarTrigger>
              <MenubarContent className={cn(menuSurface, 'pointer-events-auto z-[80] min-w-[180px]')} sideOffset={8} align="end">
                <MenubarItem 
                  className="gap-2 cursor-pointer"
                  onClick={() => {
                    const dataStr = JSON.stringify(settings, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `marketing-engine-${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Export as JSON
                </MenubarItem>
                <MenubarItem 
                  className="gap-2 cursor-pointer"
                  onClick={() => {
                    // CSV export logic - flatten settings to CSV
                    const csvRows = [
                      ['Setting', 'Value'],
                      ['Format', settings.format],
                      ['Language', settings.language],
                      ['Tone', settings.tone],
                      ['Persona', settings.persona],
                      ['Platforms', settings.platforms.join(', ')],
                      ['Content Validated', settings.quickProps.content.validated ? 'Yes' : 'No'],
                      ['Pictures Validated', settings.quickProps.pictures.validated ? 'Yes' : 'No'],
                      ['Video Validated', settings.quickProps.video.validated ? 'Yes' : 'No'],
                    ];
                    const csvContent = csvRows.map(row => row.join(',')).join('\n');
                    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `marketing-engine-${new Date().toISOString().split('T')[0]}.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Export as CSV
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            {/* Generate CTA Button */}
            <button
              onClick={onGenerate}
              disabled={!canGenerate}
              className={cn(
                'relative inline-flex h-9 items-center gap-2 rounded-lg px-5 text-sm font-semibold transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                canGenerate
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 focus:ring-emerald-500/50'
                  : 'bg-white/5 text-white/30 cursor-not-allowed',
                isGenerating && 'opacity-75 cursor-wait'
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <span>Generate</span>
              )}
            </button>

            <MenubarMenu>
              <MenubarTrigger className={trigger}>Help</MenubarTrigger>
              <MenubarContent className={cn(menuSurface, 'pointer-events-auto z-[80] min-w-[180px]')} sideOffset={8} align="end">
                <MenubarItem className="gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Shortcuts
                </MenubarItem>
                <MenubarItem>What’s new</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </div>
        </Menubar>
      </div>
    </div>
  );
}

// CardMenu component removed - replaced with GradientMenu


// function labelFor(card: CardKey): string { // Removed - using GradientMenu instead
//   switch (card) {
//     case 'pictures':
//       return 'Pictures';
//     case 'video':
//       return 'Video';
//     default:
//       return 'Content';
//   }
// }

export function HintChip({
  label,
  hint,
  active,
  onClick,
  disabled,
  size = 'default',
}: {
  label: string;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'default' | 'small';
}) {
  return (
    <TooltipPrimitive label={hint ?? label}>
      <CTAChip label={label} active={active} onClick={onClick} size={size} disabled={disabled} />
    </TooltipPrimitive>
  );
}


export function MenuContent({
  settings,
  onSettingsChange,
}: {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}) {
  const qp = settings.quickProps.content;
  const copyLength = qp.copyLength ?? 'Standard';
  const [attachmentError, setAttachmentError] = useState('');
  const [refineError, setRefineError] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [validationNotice, setValidationNotice] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const latestSettingsRef = useRef(settings);

  useEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  const autosize = useCallback((node?: HTMLTextAreaElement | null) => {
    const textarea = node ?? textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const maxHeight = 8 * 24 + 48;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    autosize(textareaRef.current);
  }, [autosize, qp.brief]);

  const setContent = useCallback(
    (patch: Partial<SettingsState['quickProps']['content']>, options?: { resetValidation?: boolean }) => {
      const currentSettings = latestSettingsRef.current;
      const currentContent = currentSettings.quickProps.content;
      const shouldReset = options?.resetValidation && currentContent.validated;
      const nextContent = {
        ...currentContent,
        ...patch,
        ...(shouldReset
          ? {
              validated: false,
              validatedAt: null,
            }
          : {}),
      } as SettingsState['quickProps']['content'];

      onSettingsChange({
        ...currentSettings,
        quickProps: {
          ...currentSettings.quickProps,
          content: nextContent,
        },
      });

      if (shouldReset) {
        setValidationNotice('Validation reset — revalidate before generating.');
      }
    },
    [onSettingsChange]
  );

  const setPlatforms = useCallback(
    (nextPlatforms: Platform[]) => {
      const currentSettings = latestSettingsRef.current;
      const currentContent = currentSettings.quickProps.content;
      const orderChanged = !arraysEqual(currentSettings.platforms, nextPlatforms);
      const membershipChanged = !sameMembers(currentSettings.platforms, nextPlatforms);
      const changed = orderChanged || membershipChanged;
      const nextContent = changed && currentContent.validated
        ? { ...currentContent, validated: false, validatedAt: null }
        : currentContent;

      onSettingsChange({
        ...currentSettings,
        platforms: nextPlatforms,
        quickProps: {
          ...currentSettings.quickProps,
          content: nextContent,
        },
      });

      if (changed && currentContent.validated) {
        setValidationNotice('Validation reset — revalidate before generating.');
      }
    },
    [onSettingsChange]
  );

  const handleBriefChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setContent({ brief: event.target.value }, { resetValidation: true });
    },
    [setContent]
  );

  const handleAttachmentAdd = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const currentSettings = latestSettingsRef.current;
      const currentAttachments = currentSettings.quickProps.content.attachments ?? [];
      const remainingSlots = Math.max(0, MAX_CONTENT_ATTACHMENTS - currentAttachments.length);
      if (remainingSlots === 0) {
        setAttachmentError(`Maximum of ${MAX_CONTENT_ATTACHMENTS} attachments reached.`);
        return;
      }

      const accepted = files.filter(isAcceptedFile);
      if (accepted.length === 0) {
        setAttachmentError(`Use PNG, JPG, WEBP, or PDF under ${MAX_ATTACHMENT_SIZE_MB}MB.`);
        return;
      }

      const selection = accepted.slice(0, remainingSlots);
      const created = selection.map((file) => createAttachment(file));

      try {
        const enriched = await Promise.all(created.map((attachment) => withAttachmentData(attachment)));
        setAttachmentError('');
        setContent({ attachments: [...currentAttachments, ...enriched] }, { resetValidation: true });
      } catch (error) {
        console.error('Failed to prepare attachments', error);
        setAttachmentError('Could not attach one or more files. Try again with smaller files.');
      }
    },
    [setContent]
  );

  const handleAttachmentRemove = useCallback(
    (id: string) => {
      const currentSettings = latestSettingsRef.current;
      const currentAttachments = currentSettings.quickProps.content.attachments ?? [];
      const nextAttachments = currentAttachments.filter((item) => item.id !== id);
      const removed = currentAttachments.find((item) => item.id === id);
      if (removed) {
        revokeAttachmentUrl(removed);
        clearAttachmentCache([removed.id]);
      }
      setAttachmentError('');
      setContent({ attachments: nextAttachments }, { resetValidation: true });
    },
    [setContent]
  );

  const handleFilePick = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) return;
      handleAttachmentAdd(Array.from(event.target.files));
      event.target.value = '';
    },
    [handleAttachmentAdd]
  );

  const setCardEnabled = useCardsStore((state) => state.setEnabled);

  const handleValidate = useCallback(() => {
    const currentSettings = latestSettingsRef.current;
    const trimmedBrief = currentSettings.quickProps.content.brief.trim();
    if (!trimmedBrief || currentSettings.platforms.length === 0) {
      return;
    }
    setContent({ validated: true, validatedAt: new Date().toISOString() });
    setValidationNotice('');
    // Enable Content card when validated
    setCardEnabled('content', true);
  }, [setContent, setCardEnabled]);

  const handleRefineBrief = useCallback(async () => {
    const currentSettings = latestSettingsRef.current;
    const trimmedBrief = currentSettings.quickProps.content.brief.trim();
    if (!trimmedBrief || isRefining) {
      return;
    }

    setRefineError('');
    setIsRefining(true);

    try {
      const attachments = currentSettings.quickProps.content.attachments ?? [];
      const enriched = await Promise.all(attachments.map((item) => withAttachmentData(item)));
      const payload = {
        brief: trimmedBrief,
        attachments: enriched
          .filter((item) => typeof item.dataUrl === 'string' && item.dataUrl.length > 0)
          .map((item) => {
            const [, base64 = ''] = (item.dataUrl ?? '').split(',');
            return {
              name: item.name,
              mime: item.mime,
              data: base64,
            };
          }),
      };

      const response = await fetch(`${getApiBase()}/v1/tools/brief/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Refine failed (${response.status})`);
      }

      const data = await response.json();
      const refined =
        typeof data?.brief === 'string'
          ? data.brief
          : typeof data?.refined === 'string'
          ? data.refined
          : typeof data?.result === 'string'
          ? data.result
          : '';

      if (refined && refined !== currentSettings.quickProps.content.brief) {
        setContent({ brief: refined }, { resetValidation: true });
      }

      const hasNewData = enriched.some((item, index) => item.dataUrl !== attachments[index]?.dataUrl);
      if (hasNewData) {
        setContent({ attachments: enriched });
      }
    } catch (error) {
      console.error('Failed to refine brief', error);
      setRefineError('Could not refine the brief. Try again in a moment.');
    } finally {
      setIsRefining(false);
    }
  }, [isRefining, setContent]);

  const handlePlatformToggle = useCallback(
    (platform: Platform) => {
      const currentSettings = latestSettingsRef.current;
      const next = currentSettings.platforms.includes(platform)
        ? currentSettings.platforms.filter((item) => item !== platform)
        : [...currentSettings.platforms, platform];
      setPlatforms(next);
    },
    [setPlatforms]
  );

  const handleSelectAllPlatforms = useCallback(() => {
    setPlatforms(PLATFORM_OPTIONS.map((item) => item.id));
  }, [setPlatforms]);

  const handleClearPlatforms = useCallback(() => {
    setPlatforms([]);
  }, [setPlatforms]);

  const briefLength = qp.brief.trim().length;
  const isValidateDisabled = briefLength === 0 || settings.platforms.length === 0;
  const isValidated = qp.validated && !isValidateDisabled;

  const validateButtonClass = cn(
    'inline-flex h-12 w-full items-center justify-center rounded-2xl px-6 text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
    isValidateDisabled
      ? 'cursor-not-allowed border border-white/10 bg-white/5 text-white/45'
      : isValidated
      ? 'border border-transparent bg-gradient-to-r from-[#3EE594] to-[#1CC8A8] text-[#052c23] shadow-[0_16px_32px_rgba(34,197,94,0.35)]'
      : 'border border-transparent bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[0_16px_32px_rgba(62,139,255,0.32)] hover:-translate-y-[1px]'
  );

  const validationHint = isValidated
    ? 'Validated and ready to generate.'
    : isValidateDisabled
    ? 'Add a brief and at least one platform to validate.'
    : 'Validate to lock in these settings for generation.';

  const sectionLabel = (label: string) => (
    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{label}</span>
  );

  return (
    <div className="relative z-[1] rounded-3xl p-5 pb-6 lg:p-6 lg:pb-7" style={glassStyle}>
      <div className="space-y-4">
        {!isValidated && validationNotice && (
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {validationNotice}
          </div>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            {sectionLabel('Creative brief')}
            <span className="text-xs text-white/45">{briefLength} chars</span>
          </div>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={qp.brief}
              onChange={handleBriefChange}
              placeholder="Describe the audience, offer, objections, and desired outcome..."
              className={cn(
                'min-h-[140px] w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 pr-16 text-sm text-white/90',
                'placeholder:text-white/40 transition-all',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/35'
              )}
            />
            <div className="absolute top-3 right-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleRefineBrief}
                disabled={isRefining || briefLength === 0}
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/35',
                  (isRefining || briefLength === 0) && 'cursor-not-allowed opacity-50'
                )}
                aria-label="Refine brief with AI"
              >
                {isRefining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={qp.attachments.length >= MAX_CONTENT_ATTACHMENTS}
                className={cn(
                  'relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/35',
                  qp.attachments.length >= MAX_CONTENT_ATTACHMENTS && 'cursor-not-allowed opacity-50'
                )}
                aria-label="Attach reference files"
              >
                <Paperclip className="h-4 w-4" />
                {qp.attachments.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#3E8BFF] px-1 text-[10px] font-semibold text-white shadow-[0_0_0_2px_rgba(12,20,32,0.85)]">
                    {qp.attachments.length}
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                multiple
                className="hidden"
                onChange={handleFilePick}
              />
            </div>
          </div>
          {refineError && <p className="text-xs text-rose-300">{refineError}</p>}
          <p className={cn('text-xs', attachmentError ? 'text-amber-300' : 'text-white/45')}>
            {attachmentError || `PNG, JPG, WEBP, PDF • up to ${MAX_CONTENT_ATTACHMENTS} attachments • ${MAX_ATTACHMENT_SIZE_MB}MB max each`}
          </p>
          {qp.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {qp.attachments.map((attachment) => (
                <span
                  key={attachment.id}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-white/85 shadow-[0_18px_32px_rgba(6,10,28,0.45)]"
                >
                  <FileText className="h-3.5 w-3.5 text-white/70" aria-hidden />
                  <span className="max-w-[160px] truncate">{attachment.name}</span>
                  <button
                    type="button"
                    onClick={() => handleAttachmentRemove(attachment.id)}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                    aria-label={`Remove ${attachment.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Persona</Label>
            <div className="flex flex-wrap gap-2">
              {PERSONA_OPTIONS.map((persona) => (
                <HintChip
                  key={persona}
                  label={persona}
                  hint={PERSONA_HINTS[persona]}
                  active={qp.persona === persona}
                  onClick={() => setContent({ persona })}
                    size="small"
                />
              ))}
            </div>
          </div>
            <div>
              <Label>Tone</Label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((tone) => (
                <HintChip
                  key={tone}
                  label={tone}
                  hint={TONE_HINTS[tone]}
                  active={qp.tone === tone}
                  onClick={() => setContent({ tone })}
                    size="small"
                />
              ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Call to action</Label>
            <div className="flex flex-wrap gap-2">
              {CTA_OPTIONS.map((cta) => (
                <HintChip
                  key={cta}
                  label={cta}
                  hint={CTA_HINTS[cta]}
                  active={qp.cta === cta}
                  onClick={() => setContent({ cta }, { resetValidation: true })}
                    size="small"
                />
              ))}
            </div>
          </div>
            <div>
              <Label>Language</Label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((language) => (
                <HintChip
                  key={language}
                  label={language}
                  hint={LANGUAGE_HINTS[language]}
                  active={qp.language === language}
                  onClick={() => setContent({ language })}
                    size="small"
                />
              ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Copy length</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { k: 'Compact', hint: '1–2 sentences; tight hooks for fast feeds.' },
                  { k: 'Standard', hint: 'Balanced coverage for most placements.' },
                  { k: 'Detailed', hint: '3–5 sentence narratives for longer placements.' },
                ] as const
              ).map(({ k, hint }) => (
                <HintChip
                  key={k}
                  label={k}
                  hint={hint}
                  active={copyLength === k}
                  onClick={() => setContent({ copyLength: k })}
                    size="small"
                />
              ))}
            </div>
          </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Platforms</Label>
              <span className="text-xs font-medium text-white/60">
                {settings.platforms.length}/{PLATFORM_OPTIONS.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {PLATFORM_OPTIONS.map((platform) => (
                <PlatformPill
                  key={platform.id}
                  name={platform.id}
                  selected={settings.platforms.includes(platform.id)}
                  onClick={() => handlePlatformToggle(platform.id)}
                  tooltip={platform.label}
                  className="shadow-[0_12px_30px_rgba(6,12,32,0.45)]"
                />
              ))}
            </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/55">
              <button
                type="button"
                onClick={handleSelectAllPlatforms}
                className="font-medium text-white/70 transition hover:text-white"
                disabled={settings.platforms.length === PLATFORM_OPTIONS.length}
              >
                Select all
              </button>
              <span className="text-white/30">•</span>
              <button
                type="button"
                onClick={handleClearPlatforms}
                className="font-medium text-white/70 transition hover:text-white"
                disabled={settings.platforms.length === 0}
              >
                Clear
              </button>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-10">
          <button
            type="button"
            onClick={handleValidate}
            disabled={isValidateDisabled}
            className={validateButtonClass}
          >
            {isValidated ? 'Validated' : 'Validate content settings'}
          </button>
          <div className={cn('mt-2 text-xs', isValidated ? 'text-emerald-200' : 'text-white/55')}>
            {isValidated && qp.validatedAt
              ? `Locked ${new Date(qp.validatedAt).toLocaleTimeString()}`
              : validationHint}
          </div>
        </section>
      </div>
    </div>
  );
}

export function MenuPictures({
  settings,
  onSettingsChange,
}: {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}) {
  const qp = settings.quickProps.pictures;
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [validationNotice, setValidationNotice] = useState('');
  const [attachmentError, setAttachmentError] = useState('');
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestSettingsRef = useRef(settings);

  useEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  const autosize = useCallback((node?: HTMLTextAreaElement | null) => {
    const textarea = node ?? textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const maxHeight = 8 * 24;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  const currentPrompt = qp.promptText || '';
  const promptLength = currentPrompt.length;

  useEffect(() => {
    autosize(textareaRef.current);
  }, [autosize, currentPrompt]);

  const setPictures = useCallback(
    (patch: Partial<PicturesQuickProps>, options?: { resetValidation?: boolean }) => {
      const shouldResetValidation = options?.resetValidation ?? true;
    onSettingsChange({
        ...latestSettingsRef.current,
      quickProps: {
          ...latestSettingsRef.current.quickProps,
        pictures: {
            ...latestSettingsRef.current.quickProps.pictures,
          ...patch,
            ...(shouldResetValidation ? { validated: false } : {}),
        },
      },
    });
      if (shouldResetValidation) {
        setValidationNotice('');
      }
    },
    [onSettingsChange]
  );

  const handlePromptChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value.slice(0, MAX_PICTURE_PROMPT_LENGTH);
      setPictures({ promptText: value });
    },
    [setPictures]
  );

  const handleSuggestPrompt = useCallback(async () => {
    if (isSuggesting) return;
    setIsSuggesting(true);

    try {
      // Try LLM-powered enhancement first
      const { suggestion } = await enhancePicturesPrompt(
        qp,
        settings.quickProps.content.brief // Include campaign brief for context
      );
      setPictures({ promptText: suggestion }, { resetValidation: false });
    } catch (error) {
      console.error('LLM enhancement failed, using template fallback:', error);
      // Fallback to template-based suggestion
      try {
        const suggested = craftPicturesPrompt(qp);
        setPictures({ promptText: suggested }, { resetValidation: false });
      } catch (fallbackError) {
        console.error('Template fallback also failed:', fallbackError);
      }
    } finally {
      setIsSuggesting(false);
    }
  }, [isSuggesting, qp, settings.quickProps.content.brief, setPictures]);

  // Provider configuration - must be defined before handlers use it
  const providers = [
    { id: 'openai', label: 'DALL·E 3', desc: 'Fast, vivid', supportsImageRef: false, imageLimit: 0 },
    { id: 'flux', label: 'FLUX Pro', desc: 'Photoreal', supportsImageRef: true, imageLimit: 1 },
    { id: 'stability', label: 'SD 3.5', desc: 'CFG control', supportsImageRef: true, imageLimit: 10 },
    { id: 'ideogram', label: 'Ideogram', desc: 'Typography', supportsImageRef: true, imageLimit: 3 },
    { id: 'gemini', label: 'Nano Banana', desc: '4K, Thinking', supportsImageRef: true, imageLimit: 14 },
    { id: 'runway', label: 'Runway Gen-4', desc: 'Requires refs', supportsImageRef: true, imageLimit: 3, requiresImageRef: true },
  ] as const;

  const activeProvider = qp.imageProvider === 'auto' ? 'openai' : qp.imageProvider;
  const currentProviderInfo = providers.find((p) => p.id === activeProvider);

  const handleImageSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Check if limit reached
      const currentImages = qp.promptImages || [];
      const limit = currentProviderInfo?.imageLimit ?? 0;
      if (currentImages.length >= limit) {
        setAttachmentError(`Maximum ${limit} image${limit > 1 ? 's' : ''} allowed for ${currentProviderInfo?.label}`);
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setAttachmentError('Please upload a JPEG, PNG, or WebP image');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setAttachmentError('Image must be under 10MB');
        return;
      }

      // Read and add to array
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const newImages = [...currentImages, e.target.result as string];
          setPictures({ promptImages: newImages });
          setAttachmentError('');
        }
      };
      reader.readAsDataURL(file);

      // Reset input
      event.target.value = '';
    },
    [setPictures, qp.promptImages, currentProviderInfo]
  );

  const handleRemoveImage = useCallback((index: number) => {
    const currentImages = qp.promptImages || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    setPictures({ promptImages: newImages.length > 0 ? newImages : undefined });
    setAttachmentError('');
  }, [setPictures, qp.promptImages]);

  const setCardEnabled = useCardsStore((state) => state.setEnabled);
  
  const handleValidate = useCallback(() => {
    setPictures({ validated: true }, { resetValidation: false });
    setValidationNotice('Settings locked. Ready to generate images.');
    // Enable Pictures card when validated
    setCardEnabled('pictures', true);
  }, [setPictures, setCardEnabled]);

  const aspectsByProvider: Record<string, PicAspect[]> = {
    openai: ['1:1', '16:9'],
    flux: ['1:1', '16:9', '2:3', '3:2', '7:9', '9:7'],
    stability: ['1:1', '2:3', '3:2', '16:9'],
    ideogram: ['1:1', '16:9'],
    gemini: ['1:1', '2:3', '3:2', '4:5', '16:9'], // Gemini supports many aspect ratios
    runway: ['1:1', '16:9', '4:5'], // Runway uses pixel ratios, mapped to standard aspects
  };

  const availableAspects = aspectsByProvider[activeProvider] || aspectsByProvider.openai;
  const supportsImageRef = currentProviderInfo?.supportsImageRef ?? false;
  const imageLimit = currentProviderInfo?.imageLimit ?? 0;
  const currentImageCount = qp.promptImages?.length ?? 0;
  const canAddMoreImages = supportsImageRef && currentImageCount < imageLimit;

  const MIN_PROMPT_LENGTH = 10;
  // Runway requires at least 1 reference image
  const requiresImageRef = activeProvider === 'runway';
  const missingRequiredImage = requiresImageRef && currentImageCount === 0;
  const isValidateDisabled = promptLength < MIN_PROMPT_LENGTH || missingRequiredImage;
  const isValidated = qp.validated && !isValidateDisabled;

  const validateButtonClass = cn(
    'inline-flex h-12 w-full items-center justify-center rounded-2xl px-6 text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
    isValidateDisabled
      ? 'cursor-not-allowed border border-white/10 bg-white/5 text-white/45'
      : isValidated
      ? 'border border-transparent bg-gradient-to-r from-[#3EE594] to-[#1CC8A8] text-[#052c23] shadow-[0_16px_32px_rgba(34,197,94,0.35)]'
      : 'border border-transparent bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[0_16px_32px_rgba(62,139,255,0.32)] hover:-translate-y-[1px]'
  );

  const validationHint = isValidated
    ? '✓ Validated and ready to generate images.'
    : missingRequiredImage
    ? '⚠️ Runway requires at least 1 reference image. Please upload an image first.'
    : isValidateDisabled
    ? `Prompt needs ${MIN_PROMPT_LENGTH - promptLength} more character${MIN_PROMPT_LENGTH - promptLength === 1 ? '' : 's'} (${promptLength}/${MIN_PROMPT_LENGTH})`
    : 'Validate to lock in these settings for generation.';

  const sectionLabel = (label: string) => (
    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{label}</span>
  );

  // Provider selection first (compact)
  if (qp.imageProvider === 'auto') {
  return (
      <div className="relative z-[1] rounded-3xl p-5 pb-6 lg:p-6 lg:pb-7" style={glassStyle}>
        {sectionLabel('Choose Provider')}
        <div className="grid grid-cols-2 gap-3">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => setPictures({ imageProvider: provider.id as any })} // eslint-disable-line @typescript-eslint/no-explicit-any
              className="group rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/20 hover:bg-white/8"
            >
              <div className="text-sm font-semibold text-white">{provider.label}</div>
              <div className="mt-1 text-xs text-white/50">{provider.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Full panel after provider selection
  return (
    <>
    <div className="relative z-[1] rounded-3xl p-5 pb-6 lg:p-6 lg:pb-7" style={glassStyle}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{providers.find((p) => p.id === activeProvider)?.label}</span>
          <button
            type="button"
            onClick={() => setPictures({ imageProvider: 'auto', promptImages: undefined })}
            className="rounded-md px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white/90"
          >
            Change
          </button>
        </div>
        {supportsImageRef && currentImageCount > 0 && (
          <span className="text-xs text-emerald-400">
            ✓ {currentImageCount} image{currentImageCount > 1 ? 's' : ''} added
          </span>
        )}
      </div>

          <div className="space-y-4">
            {/* Prompt */}
    <div>
              {sectionLabel('Prompt')}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={currentPrompt}
                onChange={handlePromptChange}
                placeholder="Describe the image you want to generate..."
                className="min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 pr-24 text-sm text-white/90 placeholder-white/40 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/35"
              />
              <div className="absolute right-3 top-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSuggestPrompt}
                  disabled={isSuggesting}
                  className={cn(
                    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/35',
                    isSuggesting && 'cursor-not-allowed opacity-50'
                  )}
                  aria-label="Auto-suggest prompt"
                >
                  {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                </button>
                {supportsImageRef && (
                  <button
                    type="button"
                    onClick={handleImageSelect}
                    disabled={!canAddMoreImages}
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/35',
                      currentImageCount > 0 && 'border-blue-500/40 bg-blue-500/10 text-blue-400',
                      !canAddMoreImages && 'cursor-not-allowed opacity-50'
                    )}
                    aria-label="Add reference image"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageFile}
              />
            </div>
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={cn(
                  'font-medium',
                  promptLength < MIN_PROMPT_LENGTH
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                )}>
                  {promptLength < MIN_PROMPT_LENGTH
                    ? `Need ${MIN_PROMPT_LENGTH - promptLength} more chars to validate`
                    : '✓ Ready to validate'}
                </span>
                <span className="text-white/40">
                  {promptLength} / {MAX_PICTURE_PROMPT_LENGTH}
                </span>
              </div>
              {supportsImageRef && (
                <p className={cn('text-xs', attachmentError ? 'text-rose-300' : currentImageCount > 0 ? 'text-emerald-400' : activeProvider === 'runway' && currentImageCount === 0 ? 'text-amber-400' : 'text-white/45')}>
                  {attachmentError || (
                    currentImageCount > 0
                      ? activeProvider === 'runway'
                        ? `✓ ${currentImageCount} of ${imageLimit} reference images (use @Ref1${currentImageCount > 1 ? ', @Ref2' : ''}${currentImageCount > 2 ? ', @Ref3' : ''} in prompt)`
                        : imageLimit === 1
                        ? '✓ 1 reference image added'
                        : `✓ ${currentImageCount} of ${imageLimit} reference images added`
                      : activeProvider === 'runway'
                      ? '⚠️ Upload at least 1 reference image (required for Runway)'
                      : activeProvider === 'gemini'
                      ? `Add up to ${imageLimit} reference images (optional)`
                      : imageLimit === 1
                      ? 'Add 1 reference image for style guidance (FLUX Pro)'
                      : imageLimit === 3
                      ? 'Add up to 3 reference images for style guidance (Ideogram)'
                      : `Add multiple reference images for style guidance (Stability AI - up to ${imageLimit})`
                  )}
                </p>
              )}
              {!supportsImageRef && (
                <p className="text-xs text-white/40">
                  {currentProviderInfo?.label} doesn't support reference images
                </p>
              )}
            </div>
            
            {/* Image Thumbnails Grid */}
            {currentImageCount > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {qp.promptImages?.map((img, idx) => (
                  <div key={idx} className="group relative w-16 h-16 overflow-hidden rounded-lg border border-white/20 bg-black/40 cursor-pointer hover:border-blue-400/50 transition-all">
                    <div 
                      className="h-full w-full flex items-center justify-center"
                      onClick={() => setExpandedImageIndex(idx)}
                    >
                      <img 
                        src={img} 
                        alt={`Reference ${idx + 1}`} 
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      className="absolute right-0.5 top-0.5 z-10 flex h-5 w-5 items-center justify-center rounded bg-black/80 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                      aria-label={`Remove image ${idx + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {/* Runway tag badge - clickable to insert into prompt */}
                    {activeProvider === 'runway' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const tag = `@Ref${idx + 1}`;
                          const currentText = qp.promptText || '';
                          if (!currentText.includes(tag)) {
                            setPictures({ promptText: currentText + (currentText.endsWith(' ') || currentText === '' ? '' : ' ') + tag });
                          }
                        }}
                        className="absolute bottom-0.5 left-0.5 rounded bg-purple-600/90 px-1.5 py-0.5 text-[9px] text-white font-medium hover:bg-purple-500 transition-colors"
                        title={`Click to insert @Ref${idx + 1} into prompt`}
                      >
                        @Ref{idx + 1}
                      </button>
                    ) : (
                      <div className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 py-0.5 text-[9px] text-white font-medium pointer-events-none">
                        {idx + 1}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                      <Maximize2 className="w-3 h-3 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Style & Aspect - Sectioned Panel (hidden for Runway which uses pixel ratios, and Gemini which has its own aspect selector) */}
          {activeProvider !== 'runway' && activeProvider !== 'gemini' && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Style</Label>
                <div className="flex flex-wrap gap-2">
            {PICTURE_STYLE_OPTIONS.map((style) => (
              <HintChip
                key={style}
                label={style}
                hint={PICTURE_STYLE_HINTS[style]}
                active={qp.style === style}
                      onClick={() => setPictures({ style })}
                      size="small"
              />
            ))}
        </div>
        </div>

              <div>
                <Label>Aspect</Label>
                <div className="flex flex-wrap gap-2">
                  {availableAspects.map((aspect) => (
              <HintChip
                key={aspect}
                label={aspect}
                hint={PICTURE_ASPECT_HINTS[aspect]}
                active={qp.aspect === aspect}
                      onClick={() => setPictures({ aspect })}
                      size="small"
              />
            ))}
        </div>
              </div>
            </div>
          </div>
          )}

          {/* Provider-specific controls - Sectioned Panels */}
          {activeProvider === 'openai' && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-sm font-medium text-white/90">DALL·E Settings</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quality</Label>
                  <div className="flex gap-2">
                    <HintChip label="Standard" hint="Faster generation" active={qp.dalleQuality === 'standard'} onClick={() => setPictures({ dalleQuality: 'standard' })} size="small" />
                    <HintChip label="HD" hint="Higher detail" active={qp.dalleQuality === 'hd'} onClick={() => setPictures({ dalleQuality: 'hd' })} size="small" />
                  </div>
                </div>
                <div>
                  <Label>Style</Label>
                  <div className="flex gap-2">
                    <HintChip label="Vivid" hint="Dramatic colors" active={qp.dalleStyle === 'vivid'} onClick={() => setPictures({ dalleStyle: 'vivid' })} size="small" />
                    <HintChip label="Natural" hint="Subtle tones" active={qp.dalleStyle === 'natural'} onClick={() => setPictures({ dalleStyle: 'natural' })} size="small" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeProvider === 'flux' && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-sm font-medium text-white/90">FLUX Settings</div>
              <div className="space-y-3">
                <div>
                  <Label>Mode</Label>
                  <div className="flex gap-2">
                    <HintChip label="Standard" hint="Balanced quality" active={qp.fluxMode === 'standard'} onClick={() => setPictures({ fluxMode: 'standard' })} size="small" />
                    <HintChip label="Ultra" hint="Max detail" active={qp.fluxMode === 'ultra'} onClick={() => setPictures({ fluxMode: 'ultra' })} size="small" />
                  </div>
                </div>
                {qp.fluxMode === 'standard' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 flex items-center justify-between text-xs text-white/60">
                        <span>Guidance</span>
                        <span className="text-white/80">{qp.fluxGuidance ?? 3}</span>
                      </label>
                      <input
                        type="range"
                        min="1.5"
                        max="5"
                        step="0.1"
                        value={qp.fluxGuidance ?? 3}
                        onChange={(e) => setPictures({ fluxGuidance: Number(e.target.value) })}
                        className="h-2 w-full appearance-none rounded-full bg-white/10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 flex items-center justify-between text-xs text-white/60">
                        <span>Steps</span>
                        <span className="text-white/80">{qp.fluxSteps ?? 40}</span>
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="50"
                        step="5"
                        value={qp.fluxSteps ?? 40}
                        onChange={(e) => setPictures({ fluxSteps: Number(e.target.value) })}
                        className="h-2 w-full appearance-none rounded-full bg-white/10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Prompt Upsampling</Label>
                    <div className="flex gap-2">
                      <HintChip label="Off" hint="Use as-is" active={!qp.fluxPromptUpsampling} onClick={() => setPictures({ fluxPromptUpsampling: false })} size="small" />
                      <HintChip label="On" hint="Enhance prompt" active={qp.fluxPromptUpsampling} onClick={() => setPictures({ fluxPromptUpsampling: true })} size="small" />
                    </div>
                  </div>
                  <div>
                    <Label>RAW Mode</Label>
                    <div className="flex gap-2">
                      <HintChip label="Off" hint="Standard" active={!qp.fluxRaw} onClick={() => setPictures({ fluxRaw: false })} size="small" />
                      <HintChip label="On" hint="Unprocessed" active={qp.fluxRaw} onClick={() => setPictures({ fluxRaw: true })} size="small" />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Output Format</Label>
                  <div className="flex gap-2">
                    <HintChip label="JPEG" hint="Smaller files" active={qp.fluxOutputFormat === 'jpeg'} onClick={() => setPictures({ fluxOutputFormat: 'jpeg' })} size="small" />
                    <HintChip label="PNG" hint="Lossless" active={qp.fluxOutputFormat === 'png'} onClick={() => setPictures({ fluxOutputFormat: 'png' })} size="small" />
                    <HintChip label="WebP" hint="Modern" active={qp.fluxOutputFormat === 'webp'} onClick={() => setPictures({ fluxOutputFormat: 'webp' })} size="small" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeProvider === 'stability' && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-sm font-medium text-white/90">Stability Settings</div>
              <div className="space-y-3">
                <div>
                  <Label>Model</Label>
                  <div className="flex gap-2">
                    <HintChip label="Large" hint="Best quality" active={qp.stabilityModel === 'large'} onClick={() => setPictures({ stabilityModel: 'large' })} size="small" />
                    <HintChip label="Turbo" hint="Faster" active={qp.stabilityModel === 'large-turbo'} onClick={() => setPictures({ stabilityModel: 'large-turbo' })} size="small" />
                    <HintChip label="Medium" hint="Balanced" active={qp.stabilityModel === 'medium'} onClick={() => setPictures({ stabilityModel: 'medium' })} size="small" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 flex items-center justify-between text-xs text-white/60">
                      <span>CFG Scale</span>
                      <span className="text-white/80">{qp.stabilityCfg ?? 7}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      value={qp.stabilityCfg ?? 7}
                      onChange={(e) => setPictures({ stabilityCfg: Number(e.target.value) })}
                      className="h-2 w-full appearance-none rounded-full bg-white/10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center justify-between text-xs text-white/60">
                      <span>Steps</span>
                      <span className="text-white/80">{qp.stabilitySteps ?? 40}</span>
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="60"
                      step="5"
                      value={qp.stabilitySteps ?? 40}
                      onChange={(e) => setPictures({ stabilitySteps: Number(e.target.value) })}
                      className="h-2 w-full appearance-none rounded-full bg-white/10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <Label>Style Preset</Label>
                  <select
                    value={qp.stabilityStylePreset || ''}
                    onChange={(e) => setPictures({ stabilityStylePreset: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/35"
                  >
                    <option value="">None</option>
                    <option value="3d-model">3D Model</option>
                    <option value="analog-film">Analog Film</option>
                    <option value="anime">Anime</option>
                    <option value="cinematic">Cinematic</option>
                    <option value="comic-book">Comic Book</option>
                    <option value="digital-art">Digital Art</option>
                    <option value="enhance">Enhance</option>
                    <option value="fantasy-art">Fantasy Art</option>
                    <option value="isometric">Isometric</option>
                    <option value="line-art">Line Art</option>
                    <option value="low-poly">Low Poly</option>
                    <option value="modeling-compound">Modeling Compound</option>
                    <option value="neon-punk">Neon Punk</option>
                    <option value="origami">Origami</option>
                    <option value="photographic">Photographic</option>
                    <option value="pixel-art">Pixel Art</option>
                    <option value="tile-texture">Tile Texture</option>
                  </select>
                </div>
                <div>
                  <Label>Negative Prompt</Label>
                  <textarea
                    value={qp.stabilityNegativePrompt || ''}
                    onChange={(e) => setPictures({ stabilityNegativePrompt: e.target.value.slice(0, 500) })}
                    placeholder="Things to avoid..."
                    className="min-h-[60px] w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/90 placeholder-white/40 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/35"
                  />
                  <div className="mt-1 text-xs text-white/40">{(qp.stabilityNegativePrompt || '').length} / 500</div>
                </div>
              </div>
            </div>
          )}

          {activeProvider === 'ideogram' && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-sm font-medium text-white/90">Ideogram Settings</div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Model</Label>
                    <div className="flex gap-2">
                      <HintChip label="V2" hint="Latest" active={qp.ideogramModel === 'v2'} onClick={() => setPictures({ ideogramModel: 'v2' })} size="small" />
                      <HintChip label="V1" hint="Classic" active={qp.ideogramModel === 'v1'} onClick={() => setPictures({ ideogramModel: 'v1' })} size="small" />
                      <HintChip label="Turbo" hint="Fast" active={qp.ideogramModel === 'turbo'} onClick={() => setPictures({ ideogramModel: 'turbo' })} size="small" />
                    </div>
                  </div>
                  <div>
                    <Label>Magic Prompt</Label>
                    <div className="flex gap-2">
                      <HintChip label="On" hint="AI enhancement" active={qp.ideogramMagicPrompt} onClick={() => setPictures({ ideogramMagicPrompt: true })} size="small" />
                      <HintChip label="Off" hint="Use as-is" active={!qp.ideogramMagicPrompt} onClick={() => setPictures({ ideogramMagicPrompt: false })} size="small" />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Style Type</Label>
                  <select
                    value={qp.ideogramStyleType || 'AUTO'}
                    onChange={(e) => setPictures({ ideogramStyleType: e.target.value as PicturesQuickProps['ideogramStyleType'] })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/35"
                  >
                    <option value="AUTO">Auto</option>
                    <option value="GENERAL">General</option>
                    <option value="REALISTIC">Realistic</option>
                    <option value="DESIGN">Design</option>
                    <option value="RENDER_3D">3D Render</option>
                    <option value="ANIME">Anime</option>
                  </select>
                </div>
                <div>
                  <Label>Negative Prompt</Label>
                  <textarea
                    value={qp.ideogramNegativePrompt || ''}
                    onChange={(e) => setPictures({ ideogramNegativePrompt: e.target.value.slice(0, 500) })}
                    placeholder="Things to avoid..."
                    className="min-h-[60px] w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/90 placeholder-white/40 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/35"
                  />
                  <div className="mt-1 text-xs text-white/40">{(qp.ideogramNegativePrompt || '').length} / 500</div>
                </div>
              </div>
            </div>
          )}

          {activeProvider === 'gemini' && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-sm font-medium text-white/90">Nano Banana Settings</div>
              <div className="space-y-3">
                {/* Style - same as other providers */}
                <div>
                  <Label>Style</Label>
                  <div className="flex flex-wrap gap-2">
                    {PICTURE_STYLE_OPTIONS.map((style) => (
                      <HintChip
                        key={style}
                        label={style}
                        hint={PICTURE_STYLE_HINTS[style]}
                        active={qp.style === style}
                        onClick={() => setPictures({ style })}
                        size="small"
                      />
                    ))}
                  </div>
                </div>
                {/* Aspect Ratio - Gemini supported ratios */}
                <div>
                  <Label>Aspect Ratio</Label>
                  <div className="flex flex-wrap gap-2">
                    <HintChip label="1:1" hint="Square" active={qp.aspect === '1:1'} onClick={() => setPictures({ aspect: '1:1' })} size="small" />
                    <HintChip label="16:9" hint="Landscape wide" active={qp.aspect === '16:9'} onClick={() => setPictures({ aspect: '16:9' })} size="small" />
                    <HintChip label="4:5" hint="Portrait feed" active={qp.aspect === '4:5'} onClick={() => setPictures({ aspect: '4:5' })} size="small" />
                    <HintChip label="3:2" hint="Classic photo" active={qp.aspect === '3:2'} onClick={() => setPictures({ aspect: '3:2' })} size="small" />
                    <HintChip label="2:3" hint="Portrait tall" active={qp.aspect === '2:3'} onClick={() => setPictures({ aspect: '2:3' })} size="small" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Model</Label>
                    <div className="flex flex-col gap-2">
                      <HintChip label="Nano Banana Pro" hint="4K, Thinking, Grounding" active={qp.geminiModel === 'gemini-3-pro-image-preview'} onClick={() => setPictures({ geminiModel: 'gemini-3-pro-image-preview' })} size="small" />
                      <HintChip label="Nano Banana" hint="Fast, 1K" active={qp.geminiModel === 'gemini-2.5-flash-preview-image'} onClick={() => setPictures({ geminiModel: 'gemini-2.5-flash-preview-image' })} size="small" />
                    </div>
                  </div>
                  <div>
                    <Label>Resolution</Label>
                    <div className="flex flex-col gap-2">
                      <HintChip label="1K" hint="1024px (fast)" active={qp.geminiResolution === '1K'} onClick={() => setPictures({ geminiResolution: '1K' })} size="small" />
                      <HintChip label="2K" hint="2048px" active={qp.geminiResolution === '2K'} onClick={() => setPictures({ geminiResolution: '2K' })} size="small" />
                      <HintChip label="4K" hint="4096px (Pro only)" active={qp.geminiResolution === '4K'} onClick={() => setPictures({ geminiResolution: '4K' })} size="small" disabled={qp.geminiModel !== 'gemini-3-pro-image-preview'} />
                    </div>
                  </div>
                </div>
                {qp.geminiModel === 'gemini-3-pro-image-preview' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Thinking Mode</Label>
                      <div className="flex gap-2">
                        <HintChip label="On" hint="Refines composition" active={qp.geminiThinking} onClick={() => setPictures({ geminiThinking: true })} size="small" />
                        <HintChip label="Off" hint="Direct generation" active={!qp.geminiThinking} onClick={() => setPictures({ geminiThinking: false })} size="small" />
                      </div>
                    </div>
                    <div>
                      <Label>Google Search</Label>
                      <div className="flex gap-2">
                        <HintChip label="On" hint="Real-world grounding" active={qp.geminiGrounding} onClick={() => setPictures({ geminiGrounding: true })} size="small" />
                        <HintChip label="Off" hint="No search" active={!qp.geminiGrounding} onClick={() => setPictures({ geminiGrounding: false })} size="small" />
                      </div>
                    </div>
                  </div>
                )}
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                  <p className="text-xs text-blue-200">
                    <strong>Nano Banana Pro</strong> supports up to 14 reference images, 4K output, thinking mode for complex prompts, and Google Search grounding for real-time data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeProvider === 'runway' && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-sm font-medium text-white/90">Runway Gen-4 Image Settings</div>
              <div className="space-y-3">
                {/* Style - for prompt context */}
                <div>
                  <Label>Style</Label>
                  <div className="flex flex-wrap gap-2">
                    {PICTURE_STYLE_OPTIONS.map((style) => (
                      <HintChip
                        key={style}
                        label={style}
                        hint={PICTURE_STYLE_HINTS[style]}
                        active={qp.style === style}
                        onClick={() => setPictures({ style })}
                        size="small"
                      />
                    ))}
                  </div>
                </div>
                {/* Resolution - Runway uses pixel dimensions */}
                <div>
                  <Label>Output Size</Label>
                  <div className="flex flex-wrap gap-2">
                    <HintChip label="1024×1024" hint="Square 1:1" active={qp.runwayImageRatio === '1024:1024'} onClick={() => setPictures({ runwayImageRatio: '1024:1024' })} size="small" />
                    <HintChip label="1920×1080" hint="Landscape 16:9" active={qp.runwayImageRatio === '1920:1080'} onClick={() => setPictures({ runwayImageRatio: '1920:1080' })} size="small" />
                    <HintChip label="1080×1920" hint="Portrait 9:16" active={qp.runwayImageRatio === '1080:1920'} onClick={() => setPictures({ runwayImageRatio: '1080:1920' })} size="small" />
                    <HintChip label="1440×1080" hint="Standard 4:3" active={qp.runwayImageRatio === '1440:1080'} onClick={() => setPictures({ runwayImageRatio: '1440:1080' })} size="small" />
                    <HintChip label="1280×720" hint="HD 16:9" active={qp.runwayImageRatio === '1280:720'} onClick={() => setPictures({ runwayImageRatio: '1280:720' })} size="small" />
                  </div>
                </div>
                {/* Model */}
                <div>
                  <Label>Model</Label>
                  <div className="flex gap-2">
                    <HintChip label="Gen-4 Image" hint="Best quality" active={qp.runwayImageModel === 'gen4_image'} onClick={() => setPictures({ runwayImageModel: 'gen4_image' })} size="small" />
                    <HintChip label="Gen-4 Turbo" hint="Faster" active={qp.runwayImageModel === 'gen4_image_turbo'} onClick={() => setPictures({ runwayImageModel: 'gen4_image_turbo' })} size="small" />
                  </div>
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                  <p className="text-xs text-amber-200">
                    <strong>⚠️ Requires reference image.</strong> Upload 1-3 images. Click the purple tags on thumbnails to insert them, or we'll auto-add them for you.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Advanced */}
        <AdvancedSection>
          <div>
              <Label>Brand colors</Label>
              <div className="flex flex-wrap gap-2">
              <HintChip
                  label={qp.lockBrandColors ? 'Locked' : 'Flexible'}
                hint={BRAND_LOCK_HINT}
                active={qp.lockBrandColors}
                  onClick={() => setPictures({ lockBrandColors: !qp.lockBrandColors })}
                  size="small"
              />
            </div>
          </div>

          <div>
            <Label>Backdrop</Label>
              <div className="flex flex-wrap gap-2">
              {PICTURE_BACKDROP_OPTIONS.map((item) => (
                <HintChip
                  key={item}
                  label={item}
                  hint={PICTURE_BACKDROP_HINTS[item]}
                  active={qp.backdrop === item}
                    onClick={() => setPictures({ backdrop: item })}
                  size="small"
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Lighting</Label>
              <div className="flex flex-wrap gap-2">
              {PICTURE_LIGHTING_OPTIONS.map((item) => (
                <HintChip
                  key={item}
                  label={item}
                  hint={PICTURE_LIGHTING_HINTS[item]}
                  active={qp.lighting === item}
                    onClick={() => setPictures({ lighting: item })}
                  size="small"
                />
              ))}
            </div>
          </div>

          <div>
              <Label>Quality</Label>
              <div className="flex flex-wrap gap-2">
              {PICTURE_QUALITY_OPTIONS.map((item) => (
                <HintChip
                  key={item}
                  label={item}
                  hint={PICTURE_QUALITY_HINTS[item]}
                  active={qp.quality === item}
                    onClick={() => setPictures({ quality: item })}
                  size="small"
                />
              ))}
            </div>
          </div>

          <div>
              <Label>Avoid</Label>
              <div className="flex flex-wrap gap-2">
              {PICTURE_NEGATIVE_OPTIONS.map((item) => (
                <HintChip
                  key={item}
                  label={item}
                  hint={PICTURE_NEGATIVE_HINTS[item]}
                  active={qp.negative === item}
                    onClick={() => setPictures({ negative: item })}
                  size="small"
                />
              ))}
            </div>
          </div>
        </AdvancedSection>

          {/* Validation CTA */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleValidate}
              disabled={isValidateDisabled}
              className={validateButtonClass}
            >
              {isValidated ? 'Validated ✓' : 'Validate'}
            </button>
            <p className="mt-2 text-center text-xs text-white/50">{validationHint}</p>
            {validationNotice && <p className="mt-1 text-center text-xs text-emerald-300">{validationNotice}</p>}
          </div>
        </div>

        {/* Image Expansion Modal */}
        <AnimatePresence>
          {expandedImageIndex !== null && qp.promptImages && qp.promptImages[expandedImageIndex] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
              onClick={() => setExpandedImageIndex(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-4xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">Reference Image {expandedImageIndex + 1}</h3>
                  <button
                    onClick={() => setExpandedImageIndex(null)}
                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Image */}
                <div className="flex-1 flex items-center justify-center rounded-xl overflow-hidden bg-white/5 border border-white/20">
                  {qp.promptImages && qp.promptImages[expandedImageIndex] && (
                    <img
                      src={qp.promptImages[expandedImageIndex]}
                      alt={`Reference ${expandedImageIndex + 1}`}
                      className="max-w-full max-h-[calc(90vh-120px)] object-contain"
                    />
                  )}
                </div>

                {/* Navigation */}
                {qp.promptImages && qp.promptImages.length > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <button
                      onClick={() => setExpandedImageIndex(Math.max(0, expandedImageIndex - 1))}
                      disabled={expandedImageIndex === 0}
                      className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <span className="text-white/80 text-sm">
                      {expandedImageIndex + 1} / {qp.promptImages.length}
                    </span>

                    <button
                      onClick={() => qp.promptImages && setExpandedImageIndex(Math.min(qp.promptImages.length - 1, expandedImageIndex + 1))}
                      disabled={qp.promptImages ? expandedImageIndex === qp.promptImages.length - 1 : true}
                      className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
    </>
  );
}

// MenuVideoLegacy removed - see MenuVideo.tsx for implementation

function AdvancedSection({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-2xl px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-blue-500/35"
      >
        <span className="text-sm font-medium text-white/90">Advanced</span>
        <ChevronRight
          className={cn(
            'h-4 w-4 text-white/60 transition-transform duration-200',
            isOpen && 'rotate-90 text-white/80'
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 px-4 pb-4 pt-1">
            {children}
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{children}</div>;
}
