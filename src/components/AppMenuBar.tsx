import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, HelpCircle, LogOut } from 'lucide-react';

import { cn } from '../lib/format';
import type {
  CardKey,
  ContentFormat,
  Language,
  Persona,
  PicAspect,
  PicStyle,
  PicturesQuickProps,
  SettingsState,
  Tone,
  VideoAspect,
  VideoHook,
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
import { menuSurface, menuPanel, tooltipSurface, barHeight, hairline } from '../ui/tokens';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface AppMenuBarProps {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}

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

const DEFAULT_HINT = 'Adjusts prompt guidance for this option.';
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

const FORMAT_OPTIONS: ContentFormat[] = ['Auto', 'FB/IG', 'LinkedIn', 'TikTok', 'X'];
const FORMAT_HINTS: Record<ContentFormat, string> = {
  Auto: 'Let the system select the best fit per platform.',
  'FB/IG': 'Optimised structure for Meta feed placements.',
  LinkedIn: 'B2B framing for professional audiences.',
  TikTok: 'Short-form video copy patterns.',
  X: 'Concise formats optimised for X/Twitter.',
};

const PICTURE_STYLE_OPTIONS: PicStyle[] = ['Product', 'Lifestyle', 'UGC', 'Abstract'];
const PICTURE_STYLE_HINTS: Record<PicStyle, string> = {
  Product: 'Clean product hero shots with focus on the item.',
  Lifestyle: 'Real people using the product in context.',
  UGC: 'Creator-style, handheld authentic visuals.',
  Abstract: 'Conceptual, art-led imagery for campaigns.',
};

const PICTURE_MODE_OPTIONS: PicturesQuickProps['mode'][] = ['images', 'prompt'];
const PICTURE_MODE_HINTS: Record<PicturesQuickProps['mode'], string> = {
  images: 'Return rendered image variations.',
  prompt: 'Return prompt strings only—no renders.',
};

const PICTURE_ASPECT_OPTIONS: PicAspect[] = ['1:1', '4:5', '16:9'];
const PICTURE_ASPECT_HINTS: Record<PicAspect, string> = {
  '1:1': 'Square feed placements (FB/IG grid, thumbnails).',
  '4:5': 'Portrait feed optimised for Meta/LinkedIn.',
  '16:9': 'Landscape hero, web banners, or YouTube thumbs.',
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

const VIDEO_DURATION_OPTIONS = [6, 9, 12, 15, 20, 30] as const;
const VIDEO_DURATION_HINTS: Record<number, string> = {
  6: 'Ultra-short hooks for reels/ads.',
  9: 'TikTok-friendly quick spots.',
  12: 'Balance of context and pace.',
  15: 'Standard paid social length.',
  20: 'Extended storytelling format.',
  30: 'Longer product explainer or hero spot.',
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

export function AppMenuBar({ settings, onSettingsChange }: AppMenuBarProps) {
  const order = useCardsStore((state) => state.order);
  const enabled = useCardsStore((state) => state.enabled);

  const cards = useMemo(() => order.filter((card) => enabled[card]), [order, enabled]);

  return (
    <div className={cn('fixed inset-x-0 top-0 z-40 bg-white/4 backdrop-blur', hairline)}>
      <div className="mx-auto max-w-[1240px] px-4">
        <Menubar className={cn('flex w-full items-center border-0 bg-transparent px-0', barHeight)}>
          <div className="flex w-full items-center gap-2" role="presentation">
            <MenubarMenu>
              <MenubarTrigger className={trigger}>File</MenubarTrigger>
              <MenubarContent className={menuSurface} sideOffset={8} align="start">
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
              <MenubarContent className={menuSurface} sideOffset={8} align="start">
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

            <MenubarMenu>
              <MenubarTrigger className={trigger}>Help</MenubarTrigger>
              <MenubarContent className={menuSurface} sideOffset={8} align="end">
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
  const { justEnabled } = useGlowOnEnable(card);

  return (
    <MenubarMenu>
      <MenubarTrigger
        onClick={() => selectCard(card)}
        className={cn(
          trigger,
          'px-4',
          selected === card && 'text-white',
          justEnabled && 'animate-[pulse_1.2s_ease-in-out_2] shadow-[inset_0_0_0_2px_rgba(62,139,255,.25)]'
        )}
      >
        {labelFor(card)}
      </MenubarTrigger>
      <MenubarContent
        className={cn(menuSurface, 'min-w-[580px] space-y-3 p-3')}
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

function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'cursor-pointer h-8 rounded-full border border-white/12 bg-white/6 px-3 text-sm text-white/85 transition-colors',
        'hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/35',
        active && 'bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white'
      )}
    >
      {children}
    </button>
  );
}

function HintChip({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Chip active={active} onClick={onClick}>
          {label}
        </Chip>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center" sideOffset={8} className={tooltipSurface}>
        {hint ?? DEFAULT_HINT}
      </TooltipContent>
    </Tooltip>
  );
}

function MenuContent({
  settings,
  onSettingsChange,
}: {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}) {
  const qp = settings.quickProps.content;
  const setQP = (patch: Partial<typeof qp>) => {
    onSettingsChange({
      ...settings,
      quickProps: {
        ...settings.quickProps,
        content: {
          ...qp,
          ...patch,
        },
      },
    });
  };

  return (
    <div className="space-y-3">
        <MenuPanel title="Persona">
          <div className="flex flex-wrap gap-2">
            {PERSONA_OPTIONS.map((persona) => (
              <HintChip
                key={persona}
                label={persona}
                hint={PERSONA_HINTS[persona]}
                active={qp.persona === persona}
                onClick={() => setQP({ persona })}
              />
            ))}
          </div>
        </MenuPanel>

        <MenuPanel title="Tone">
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((tone) => (
              <HintChip
                key={tone}
                label={tone}
                hint={TONE_HINTS[tone]}
                active={qp.tone === tone}
                onClick={() => setQP({ tone })}
              />
            ))}
          </div>
        </MenuPanel>

        <MenuPanel title="CTA">
          <div className="flex flex-wrap gap-2">
            {CTA_OPTIONS.map((cta) => (
              <HintChip
                key={cta}
                label={cta}
                hint={CTA_HINTS[cta]}
                active={qp.cta === cta}
                onClick={() => setQP({ cta })}
              />
            ))}
          </div>
        </MenuPanel>

        <MenuPanel title="Language">
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((language) => (
              <HintChip
                key={language}
                label={language}
                hint={LANGUAGE_HINTS[language]}
                active={qp.language === language}
                onClick={() => setQP({ language })}
              />
            ))}
          </div>
        </MenuPanel>

        <AdvancedSection>
          <div>
            <Label>Platform format</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((format) => (
                <HintChip
                  key={format}
                  label={format}
                  hint={FORMAT_HINTS[format]}
                  active={qp.format === format}
                  onClick={() => setQP({ format })}
                />
              ))}
            </div>
          </div>

          <MenuInput
            label="Keywords"
            value={qp.keywords ?? ''}
            placeholder="Add comma separated keywords"
            onChange={(value) => setQP({ keywords: value })}
          />
          <MenuInput
            label="Avoid"
            value={qp.avoid ?? ''}
            placeholder="Words to avoid"
            onChange={(value) => setQP({ avoid: value })}
          />
          <MenuInput
            label="Hashtags"
            value={qp.hashtags ?? ''}
            placeholder="#brand, #campaign"
            onChange={(value) => setQP({ hashtags: value })}
          />
        </AdvancedSection>
      </div>
  );
}

function MenuPictures({
  settings,
  onSettingsChange,
}: {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}) {
  const qp = settings.quickProps.pictures;
  const setQP = (patch: Partial<PicturesQuickProps>) => {
    onSettingsChange({
      ...settings,
      quickProps: {
        ...settings.quickProps,
        pictures: {
          ...qp,
          ...patch,
        },
      },
    });
  };

  return (
    <div className="space-y-3">
        <MenuPanel title="Style">
          <div className="flex flex-wrap gap-2">
            {PICTURE_STYLE_OPTIONS.map((style) => (
              <HintChip
                key={style}
                label={style}
                hint={PICTURE_STYLE_HINTS[style]}
                active={qp.style === style}
                onClick={() => setQP({ style })}
              />
            ))}
          </div>
        </MenuPanel>

        <MenuPanel title="Output">
          <div className="flex flex-wrap gap-2">
            {PICTURE_MODE_OPTIONS.map((mode) => (
              <HintChip
                key={mode}
                label={mode === 'images' ? 'All images' : 'Prompt only'}
                hint={PICTURE_MODE_HINTS[mode]}
                active={qp.mode === mode}
                onClick={() => setQP({ mode })}
              />
            ))}
          </div>
        </MenuPanel>

        <MenuPanel title="Aspect">
          <div className="flex flex-wrap gap-2">
            {PICTURE_ASPECT_OPTIONS.map((aspect) => (
              <HintChip
                key={aspect}
                label={aspect}
                hint={PICTURE_ASPECT_HINTS[aspect]}
                active={qp.aspect === aspect}
                onClick={() => setQP({ aspect })}
              />
            ))}
          </div>
        </MenuPanel>

        <AdvancedSection>
          <div>
            <Label>Brand palette</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              <HintChip
                label={qp.lockBrandColors ? 'Brand palette locked' : 'Brand palette unlocked'}
                hint={BRAND_LOCK_HINT}
                active={qp.lockBrandColors}
                onClick={() => setQP({ lockBrandColors: !qp.lockBrandColors })}
              />
            </div>
          </div>

          <div>
            <Label>Backdrop</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PICTURE_BACKDROP_OPTIONS.map((item) => (
                <HintChip
                  key={item}
                  label={item}
                  hint={PICTURE_BACKDROP_HINTS[item]}
                  active={qp.backdrop === item}
                  onClick={() => setQP({ backdrop: item })}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Lighting</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PICTURE_LIGHTING_OPTIONS.map((item) => (
                <HintChip
                  key={item}
                  label={item}
                  hint={PICTURE_LIGHTING_HINTS[item]}
                  active={qp.lighting === item}
                  onClick={() => setQP({ lighting: item })}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Quality hints</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PICTURE_QUALITY_OPTIONS.map((item) => (
                <HintChip
                  key={item}
                  label={item}
                  hint={PICTURE_QUALITY_HINTS[item]}
                  active={qp.quality === item}
                  onClick={() => setQP({ quality: item })}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Negative prompts</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PICTURE_NEGATIVE_OPTIONS.map((item) => (
                <HintChip
                  key={item}
                  label={item}
                  hint={PICTURE_NEGATIVE_HINTS[item]}
                  active={qp.negative === item}
                  onClick={() => setQP({ negative: item })}
                />
              ))}
            </div>
          </div>
        </AdvancedSection>
      </div>
  );
}

function MenuVideo({
  settings,
  onSettingsChange,
}: {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}) {
  const qp = settings.quickProps.video;
  const setQP = (patch: Partial<typeof qp>) => {
    onSettingsChange({
      ...settings,
      quickProps: {
        ...settings.quickProps,
        video: {
          ...qp,
          ...patch,
        },
      },
    });
  };

  return (
    <div className="space-y-3">
        <MenuPanel title="Duration">
          <div className="flex flex-wrap gap-2">
            {VIDEO_DURATION_OPTIONS.map((duration) => (
              <HintChip
                key={duration}
                label={`${duration}s`}
                hint={VIDEO_DURATION_HINTS[duration]}
                active={qp.duration === duration}
                onClick={() => setQP({ duration })}
              />
            ))}
          </div>
        </MenuPanel>

        <MenuPanel title="Hook">
          <div className="flex flex-wrap gap-2">
            {VIDEO_HOOK_OPTIONS.map((hook) => (
              <HintChip
                key={hook}
                label={hook}
                hint={VIDEO_HOOK_HINTS[hook]}
                active={qp.hook === hook}
                onClick={() => setQP({ hook })}
              />
            ))}
          </div>
        </MenuPanel>

        <MenuPanel title="Aspect">
          <div className="flex flex-wrap gap-2">
            {VIDEO_ASPECT_OPTIONS.map((aspect) => (
              <HintChip
                key={aspect}
                label={aspect}
                hint={VIDEO_ASPECT_HINTS[aspect]}
                active={qp.aspect === aspect}
                onClick={() => setQP({ aspect })}
              />
            ))}
          </div>
        </MenuPanel>

        <AdvancedSection>
          <div>
            <Label>Captions</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              <HintChip
                label={qp.captions ? 'Captions on' : 'Captions off'}
                hint={CAPTIONS_HINT}
                active={qp.captions}
                onClick={() => setQP({ captions: !qp.captions })}
              />
            </div>
          </div>

          <div>
            <Label>CTA</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CTA_OPTIONS.map((cta) => (
                <HintChip
                  key={cta}
                  label={cta}
                  hint={CTA_HINTS[cta]}
                  active={qp.cta === cta}
                  onClick={() => setQP({ cta })}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Voiceover</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {VIDEO_VOICEOVER_OPTIONS.map((option) => (
                <HintChip
                  key={option}
                  label={option}
                  hint={VIDEO_VOICEOVER_HINTS[option]}
                  active={qp.voiceover === option}
                  onClick={() => setQP({ voiceover: option })}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Shot density</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {VIDEO_DENSITY_OPTIONS.map((option) => (
                <HintChip
                  key={option}
                  label={option}
                  hint={VIDEO_DENSITY_HINTS[option]}
                  active={qp.density === option}
                  onClick={() => setQP({ density: option })}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Proof point</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {VIDEO_PROOF_OPTIONS.map((option) => (
                <HintChip
                  key={option}
                  label={option}
                  hint={VIDEO_PROOF_HINTS[option]}
                  active={qp.proof === option}
                  onClick={() => setQP({ proof: option })}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Do-nots</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {VIDEO_DONOT_OPTIONS.map((option) => (
                <HintChip
                  key={option}
                  label={option}
                  hint={VIDEO_DONOT_HINTS[option]}
                  active={qp.doNots === option}
                  onClick={() => setQP({ doNots: option })}
                />
              ))}
            </div>
          </div>
        </AdvancedSection>
      </div>
  );
}

function MenuInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-white/10 bg-white/10 px-3 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-blue-500/35"
      />
    </div>
  );
}

function MenuPanel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className={cn(menuPanel, 'space-y-2')}>
      {title ? (
        <>
          <Label>{title}</Label>
          <div className="mt-1.5">{children}</div>
        </>
      ) : (
        children
      )}
    </div>
  );
}

function AdvancedSection({ children }: { children: ReactNode }) {
  return (
    <MenuPanel>
      <Collapsible>
        <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md bg-white/5 px-2 py-1 text-xs text-white/70 transition-colors hover:text-white focus:outline-none">
          <span>Advanced</span>
          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 grid grid-rows-[0fr] data-[state=open]:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out relative before:absolute before:inset-x-1 before:top-0 before:h-px before:bg-white/12">
          <div className="overflow-hidden pt-3 space-y-3">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </MenuPanel>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <div className="text-[11px] uppercase tracking-wide text-white/55">{children}</div>;
}
