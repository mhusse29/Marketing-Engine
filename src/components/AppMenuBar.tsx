import type { ReactNode, ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, HelpCircle, LogOut, Wand2, Paperclip, FileText, X, Loader2 } from 'lucide-react';
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
  VideoAspect,
  VideoHook,
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
import { menuSurface, barHeight, hairline } from '../ui/tokens';
import CTAChip from './ui/CTAChip';
import TooltipPrimitive from './primitives/Tooltip';
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

// Runway Gen-3 supports 5s and 10s durations
const VIDEO_DURATION_OPTIONS = [5, 10] as const;
const VIDEO_DURATION_HINTS: Record<number, string> = {
  5: 'Quick clip - Perfect for social media reels & ads (5 credits)',
  10: 'Standard video - Full storytelling & product demos (10 credits)',
};

const VIDEO_HOOK_OPTIONS: VideoHook[] = ['Pain-point', 'Bold claim', 'Question', 'Pattern interrupt'];
const VIDEO_HOOK_HINTS: Record<VideoHook, string> = {
  'Pain-point': 'Lead with the audience’s main frustration.',
  'Bold claim': 'Grab attention with a strong promise.',
  Question: 'Engage viewers with a provocative question.',
  'Pattern interrupt': 'Unexpected opener to reset attention.',
};

const VIDEO_ASPECT_OPTIONS: VideoAspect[] = ['9:16', '1:1', '16:9'];
const VIDEO_ASPECT_HINTS: Record<VideoAspect, string> = {
  '9:16': 'Vertical video for Reels, Shorts, TikTok.',
  '1:1': 'Square feed-friendly layout.',
  '16:9': 'Landscape for YouTube or widescreen placements.',
};

const VIDEO_VOICEOVER_OPTIONS = ['On-screen text only', 'AI voiceover'] as const;
const VIDEO_VOICEOVER_HINTS: Record<(typeof VIDEO_VOICEOVER_OPTIONS)[number], string> = {
  'On-screen text only': 'Captions + supers without narration.',
  'AI voiceover': 'Adds generated narration to the script.',
};

const VIDEO_DENSITY_OPTIONS = ['Light (3–4)', 'Medium (5–6)', 'Fast (7–8)'] as const;
const VIDEO_DENSITY_HINTS: Record<(typeof VIDEO_DENSITY_OPTIONS)[number], string> = {
  'Light (3–4)': 'Fewer scenes, slower pace.',
  'Medium (5–6)': 'Balanced pacing for most stories.',
  'Fast (7–8)': 'Rapid sequence for high-energy edits.',
};

const VIDEO_PROOF_OPTIONS = ['Social proof', 'Feature highlight', 'Before/After'] as const;
const VIDEO_PROOF_HINTS: Record<(typeof VIDEO_PROOF_OPTIONS)[number], string> = {
  'Social proof': 'Testimonials, stats, credibility cues.',
  'Feature highlight': 'Focus on key product capabilities.',
  'Before/After': 'Show the transformation or outcome.',
};

const VIDEO_DONOT_OPTIONS = ['No claims', 'No cramped shots', 'No busy bg'] as const;
const VIDEO_DONOT_HINTS: Record<(typeof VIDEO_DONOT_OPTIONS)[number], string> = {
  'No claims': 'Avoid unverified benefit statements.',
  'No cramped shots': 'Keep framing airy and spacious.',
  'No busy bg': 'Maintain clean, simple backdrops.',
};

const BRAND_LOCK_HINT = 'Locks palettes to your brand colours for consistency.';
const CAPTIONS_HINT = 'Toggle burned-in captions for accessibility.';

export function AppMenuBar({ settings, onSettingsChange, onGenerate, isGenerating = false }: AppMenuBarProps) {
  const order = useCardsStore((state) => state.order);
  const enabled = useCardsStore((state) => state.enabled);

  const cards = useMemo(() => order.filter((card) => enabled[card]), [order, enabled]);

  // Check validation states
  const contentValidated = enabled.content && settings.quickProps.content.validated && settings.platforms.length > 0;
  const picturesValidated = enabled.pictures && settings.quickProps.pictures.validated;
  const videoValidated = enabled.video && settings.quickProps.video.validated;
  const anyValidated = contentValidated || picturesValidated || videoValidated;
  const canGenerate = anyValidated && !isGenerating;

  return (
    <div className={cn('flex h-full w-full items-center bg-white/4 backdrop-blur', hairline, barHeight)}>
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

            <div className="flex items-center justify-center gap-2" role="presentation">
              {cards.map((card) => (
                <CardMenu
                  key={card}
                  card={card}
                  settings={settings}
                  onSettingsChange={onSettingsChange}
                />
              ))}
            </div>

            <div className="flex-1" role="presentation" />

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

function CardMenu({
  card,
  settings,
  onSettingsChange,
}: {
  card: CardKey;
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}) {
  const selectCard = useCardsStore((state) => state.select);
  const selected = useCardsStore((state) => state.selected);
  // Removed isEnabled check - all cards always clickable now
  const { justEnabled } = useGlowOnEnable(card);

  return (
    <MenubarMenu>
      <MenubarTrigger
        asChild
        onClick={() => {
          // ALWAYS allow clicks - removed isEnabled check
          selectCard(card);
        }}
      >
        <CTAChip
          label={labelFor(card)}
          active={selected === card}
          disabled={false}  // FORCE always enabled
          className={cn(justEnabled && 'animate-[pulse_1.2s_ease-in-out_2]')}
        />
      </MenubarTrigger>
      <MenubarContent
        className={cn(menuSurface, 'menu-sheet w-[95vw] max-w-[580px] space-y-3 rounded-2xl p-4 sm:p-5')}
        sideOffset={8}
        align="center"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {card === 'content' && <MenuContent settings={settings} onSettingsChange={onSettingsChange} />}
        {card === 'pictures' && <MenuPictures settings={settings} onSettingsChange={onSettingsChange} />}
        {card === 'video' && <MenuVideo settings={settings} onSettingsChange={onSettingsChange} />}
      </MenubarContent>
    </MenubarMenu>
  );
}

function useGlowOnEnable(card: CardKey) {
  const isEnabled = useCardsStore((state) => state.enabled[card]);
  const previousEnabled = useRef(isEnabled);
  const [justEnabled, setJustEnabled] = useState(false);

  useEffect(() => {
    const wasEnabled = previousEnabled.current;
    previousEnabled.current = isEnabled;
    let timeout: number | undefined;

    if (isEnabled && !wasEnabled) {
      setJustEnabled(true);
      timeout = window.setTimeout(() => setJustEnabled(false), 1200);
    }

    if (!isEnabled && wasEnabled) {
      setJustEnabled(false);
    }

    return () => {
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }
    };
  }, [isEnabled]);

  return { justEnabled };
}

function labelFor(card: CardKey): string {
  switch (card) {
    case 'pictures':
      return 'Pictures';
    case 'video':
      return 'Video';
    default:
      return 'Content';
  }
}

function HintChip({
  label,
  hint,
  active,
  onClick,
  size = 'default',
}: {
  label: string;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
  size?: 'default' | 'small';
}) {
  return (
    <TooltipPrimitive label={hint ?? label}>
      <CTAChip label={label} active={active} onClick={onClick} size={size} />
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
    <div className="relative z-[1] rounded-3xl border border-white/10 bg-white/[0.05] p-5 pb-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur lg:p-6 lg:pb-7">
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
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
      const suggested = craftPicturesPrompt(qp);
      setPictures({ promptText: suggested });
    } catch (error) {
      console.error('Failed to craft prompt', error);
    } finally {
      setIsSuggesting(false);
    }
  }, [isSuggesting, qp, setPictures]);

  const setCardEnabled = useCardsStore((state) => state.setEnabled);
  
  const handleValidate = useCallback(() => {
    setPictures({ validated: true }, { resetValidation: false });
    setValidationNotice('Settings locked. Ready to generate images.');
    // Enable Pictures card when validated
    setCardEnabled('pictures', true);
  }, [setPictures, setCardEnabled]);

  const providers = [
    { id: 'openai', label: 'DALL·E 3', desc: 'Fast, vivid' },
    { id: 'flux', label: 'FLUX Pro', desc: 'Photoreal' },
    { id: 'stability', label: 'SD 3.5', desc: 'CFG control' },
    { id: 'ideogram', label: 'Ideogram', desc: 'Typography' },
  ] as const;

  const aspectsByProvider: Record<string, PicAspect[]> = {
    openai: ['1:1', '16:9'],
    flux: ['1:1', '16:9', '2:3', '3:2', '7:9', '9:7'],
    stability: ['1:1', '2:3', '3:2', '16:9'],
    ideogram: ['1:1', '16:9'],
  };

  const activeProvider = qp.imageProvider === 'auto' ? 'openai' : qp.imageProvider;
  const availableAspects = aspectsByProvider[activeProvider] || aspectsByProvider.openai;

  const MIN_PROMPT_LENGTH = 10;
  const isValidateDisabled = promptLength < MIN_PROMPT_LENGTH;
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
    : isValidateDisabled
    ? `Prompt needs ${MIN_PROMPT_LENGTH - promptLength} more character${MIN_PROMPT_LENGTH - promptLength === 1 ? '' : 's'} (${promptLength}/${MIN_PROMPT_LENGTH})`
    : 'Validate to lock in these settings for generation.';

  const sectionLabel = (label: string) => (
    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{label}</span>
  );

  // Provider selection first (compact)
  if (qp.imageProvider === 'auto') {
  return (
      <div className="relative z-[1] rounded-3xl border border-white/10 bg-white/[0.05] p-5 pb-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur lg:p-6 lg:pb-7">
        {sectionLabel('Choose Provider')}
        <div className="grid grid-cols-2 gap-3">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => setPictures({ imageProvider: provider.id as any })}
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
    <div className="relative z-[1] rounded-3xl border border-white/10 bg-white/[0.05] p-5 pb-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur lg:p-6 lg:pb-7">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{providers.find((p) => p.id === activeProvider)?.label}</span>
          <button
            type="button"
            onClick={() => setPictures({ imageProvider: 'auto' })}
            className="rounded-md px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white/90"
          >
            Change
          </button>
        </div>
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
                className="min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 pr-12 text-sm text-white/90 placeholder-white/40 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/35"
              />
              <button
                type="button"
                onClick={handleSuggestPrompt}
                disabled={isSuggesting}
                className={cn(
                  'absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/35',
                  isSuggesting && 'cursor-not-allowed opacity-50'
                )}
                aria-label="Auto-suggest prompt"
              >
                {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
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
          </div>

          {/* Style & Aspect - Sectioned Panel */}
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
                    onChange={(e) => setPictures({ ideogramStyleType: e.target.value as any })}
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
      </div>
  );
}

export function MenuVideo({
  settings,
  onSettingsChange,
}: {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}) {
  const qp = settings.quickProps.video;
  const [_validationNotice, setValidationNotice] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
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

  const setVideo = useCallback(
    (patch: Partial<typeof qp>, options?: { resetValidation?: boolean }) => {
      const shouldResetValidation = options?.resetValidation ?? true;
    onSettingsChange({
        ...latestSettingsRef.current,
      quickProps: {
          ...latestSettingsRef.current.quickProps,
        video: {
            ...latestSettingsRef.current.quickProps.video,
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
      const value = event.target.value.slice(0, 1000); // Max 1000 chars for Runway
      setVideo({ promptText: value });
    },
    [setVideo]
  );

  const setCardEnabled = useCardsStore((state) => state.setEnabled);
  
  const MIN_PROMPT_LENGTH = 10;
  const isValidateDisabled = promptLength < MIN_PROMPT_LENGTH;
  const isValidated = qp.validated && !isValidateDisabled;

  const handleValidate = useCallback(() => {
    setVideo({ validated: true, validatedAt: new Date().toISOString() }, { resetValidation: false });
    setValidationNotice('Settings locked. Ready to generate video.');
    setCardEnabled('video', true);
  }, [setVideo, setCardEnabled]);

  const validateButtonClass = cn(
    'inline-flex h-12 w-full items-center justify-center rounded-2xl px-6 text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
    isValidateDisabled
      ? 'cursor-not-allowed border border-white/10 bg-white/5 text-white/45'
      : isValidated
      ? 'border border-transparent bg-gradient-to-r from-[#3EE594] to-[#1CC8A8] text-[#052c23] shadow-[0_16px_32px_rgba(34,197,94,0.35)]'
      : 'border border-transparent bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[0_16px_32px_rgba(62,139,255,0.32)] hover:-translate-y-[1px]'
  );

  const validationHint = isValidated
    ? '✓ Validated and ready to generate video.'
    : isValidateDisabled
    ? `Prompt needs ${MIN_PROMPT_LENGTH - promptLength} more character${MIN_PROMPT_LENGTH - promptLength === 1 ? '' : 's'} (${promptLength}/${MIN_PROMPT_LENGTH})`
    : 'Validate to lock in these settings for generation.';

  const sectionLabel = (label: string) => (
    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{label}</span>
  );

  return (
    <div className="relative z-[1] w-[95vw] max-w-[580px] rounded-3xl border border-white/10 bg-white/[0.05] p-5 pb-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur lg:p-6 lg:pb-7">
      {/* Model Selection */}
      <section className="space-y-3 pb-6">
        {sectionLabel('Runway Model')}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setVideo({ model: 'gen3a_turbo' })}
            className={cn(
              'group rounded-xl border p-4 text-left transition-all',
              qp.model === 'gen3a_turbo'
                ? 'border-blue-400/40 bg-blue-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
            )}
          >
            <div className="text-sm font-semibold text-white">Gen-3 Alpha Turbo</div>
            <div className="mt-1 text-xs text-white/60">7x faster • Lower cost</div>
          </button>
          <button
            type="button"
            onClick={() => setVideo({ model: 'gen3a' })}
            className={cn(
              'group rounded-xl border p-4 text-left transition-all',
              qp.model === 'gen3a'
                ? 'border-blue-400/40 bg-blue-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
            )}
          >
            <div className="text-sm font-semibold text-white">Gen-3 Alpha</div>
            <div className="mt-1 text-xs text-white/60">Standard quality</div>
          </button>
        </div>
      </section>

      {/* Video Prompt */}
      <section className="space-y-3 pb-6">
        {sectionLabel('Video Description')}
        <textarea
          ref={textareaRef}
          value={currentPrompt}
          onChange={handlePromptChange}
          placeholder="Describe the video you want to generate..."
          className="content-brief-input w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 placeholder-white/40 transition-colors focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          rows={3}
        />
        <div className="mt-1.5 flex items-center justify-between text-xs">
          <span
            className={cn(
              'font-medium',
              promptLength < MIN_PROMPT_LENGTH ? 'text-amber-400' : 'text-emerald-400'
            )}
          >
            {promptLength < MIN_PROMPT_LENGTH
              ? `Need ${MIN_PROMPT_LENGTH - promptLength} more chars to validate`
              : '✓ Ready to validate'}
          </span>
          <span className="text-white/40">{promptLength} / 1000</span>
        </div>
      </section>

      {/* Core Settings - Duration & Aspect */}
      <section className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5 pb-6">
    <div>
          {sectionLabel('Duration')}
          <div className="flex flex-wrap gap-2">
            {VIDEO_DURATION_OPTIONS.map((duration) => (
              <HintChip
                key={duration}
                label={`${duration}s`}
                hint={VIDEO_DURATION_HINTS[duration]}
                active={qp.duration === duration}
                onClick={() => setVideo({ duration })}
              />
            ))}
        </div>
        </div>

        <div>
          {sectionLabel('Aspect Ratio')}
          <div className="flex flex-wrap gap-2">
            {VIDEO_ASPECT_OPTIONS.map((aspect) => (
              <HintChip
                key={aspect}
                label={aspect}
                hint={VIDEO_ASPECT_HINTS[aspect]}
                active={qp.aspect === aspect}
                onClick={() => setVideo({ aspect })}
              />
            ))}
        </div>
        </div>

        <div>
          {sectionLabel('Watermark')}
          <div className="flex flex-wrap gap-2">
            <HintChip
              label="No Watermark"
              hint="Remove Runway watermark (production quality)"
              active={!qp.watermark}
              onClick={() => setVideo({ watermark: false })}
            />
            <HintChip
              label="With Watermark"
              hint="Include Runway watermark (free tier)"
              active={qp.watermark}
              onClick={() => setVideo({ watermark: true })}
            />
          </div>
        </div>
      </section>

      {/* Advanced Settings */}
        <AdvancedSection>
        <div>
          <Label>Hook Style</Label>
          <div className="flex flex-wrap gap-2">
            {VIDEO_HOOK_OPTIONS.map((hook) => (
              <HintChip
                key={hook}
                label={hook}
                hint={VIDEO_HOOK_HINTS[hook]}
                active={qp.hook === hook}
                onClick={() => setVideo({ hook })}
                size="small"
              />
            ))}
          </div>
        </div>

          <div>
            <Label>Captions</Label>
          <div className="flex flex-wrap gap-2">
              <HintChip
                label={qp.captions ? 'Captions on' : 'Captions off'}
                hint={CAPTIONS_HINT}
                active={qp.captions}
              onClick={() => setVideo({ captions: !qp.captions })}
                size="small"
              />
            </div>
          </div>

          <div>
            <Label>CTA</Label>
          <div className="flex flex-wrap gap-2">
              {CTA_OPTIONS.map((cta) => (
                <HintChip
                  key={cta}
                  label={cta}
                  hint={CTA_HINTS[cta]}
                  active={qp.cta === cta}
                onClick={() => setVideo({ cta })}
                  size="small"
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Voiceover</Label>
          <div className="flex flex-wrap gap-2">
              {VIDEO_VOICEOVER_OPTIONS.map((option) => (
                <HintChip
                  key={option}
                  label={option}
                  hint={VIDEO_VOICEOVER_HINTS[option]}
                  active={qp.voiceover === option}
                onClick={() => setVideo({ voiceover: option })}
                  size="small"
                />
              ))}
            </div>
          </div>

          <div>
          <Label>Shot Density</Label>
          <div className="flex flex-wrap gap-2">
              {VIDEO_DENSITY_OPTIONS.map((option) => (
                <HintChip
                  key={option}
                  label={option}
                  hint={VIDEO_DENSITY_HINTS[option]}
                  active={qp.density === option}
                onClick={() => setVideo({ density: option })}
                  size="small"
                />
              ))}
            </div>
          </div>

          <div>
          <Label>Proof Point</Label>
          <div className="flex flex-wrap gap-2">
              {VIDEO_PROOF_OPTIONS.map((option) => (
                <HintChip
                  key={option}
                  label={option}
                  hint={VIDEO_PROOF_HINTS[option]}
                  active={qp.proof === option}
                onClick={() => setVideo({ proof: option })}
                  size="small"
                />
              ))}
            </div>
          </div>

          <div>
          <Label>Do-Nots</Label>
          <div className="flex flex-wrap gap-2">
              {VIDEO_DONOT_OPTIONS.map((option) => (
                <HintChip
                  key={option}
                  label={option}
                  hint={VIDEO_DONOT_HINTS[option]}
                  active={qp.doNots === option}
                onClick={() => setVideo({ doNots: option })}
                  size="small"
                />
              ))}
            </div>
          </div>
        </AdvancedSection>

      {/* Validation CTA */}
      <section className="pt-10">
        <button
          type="button"
          onClick={handleValidate}
          disabled={isValidateDisabled}
          className={validateButtonClass}
        >
          {isValidated ? 'Validated' : 'Validate video settings'}
        </button>
        <div className={cn('mt-2 text-xs', isValidated ? 'text-emerald-200' : 'text-white/55')}>
          {isValidated && qp.validatedAt
            ? `Locked ${new Date(qp.validatedAt).toLocaleTimeString()}`
            : validationHint}
      </div>
      </section>
    </div>
  );
}

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
