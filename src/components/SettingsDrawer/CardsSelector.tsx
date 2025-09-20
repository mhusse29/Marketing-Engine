import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import * as Switch from '@radix-ui/react-switch';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cn } from '../../lib/format';
import type {
  SettingsState,
  Persona,
  Tone,
  Language,
  ContentFormat,
  PicStyle,
  PicAspect,
  VideoHook,
  VideoAspect,
} from '../../types';

interface CardsSelectorProps {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}

const inputClass =
  'h-11 w-full rounded-xl border-0 bg-white/5 px-3 text-[rgba(231,236,243,0.9)] placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/35 transition-all';

const tooltipDark =
  'rounded-lg border border-white/10 bg-[#0B1220]/90 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,.6)] px-2.5 py-1.5 text-xs text-white/95 z-50';

const CTA_LIMIT = 60;
const VIDEO_DURATION_MIN = 6;
const VIDEO_DURATION_MAX = 30;
const presetDurations = [6, 10, 12, 15, 20, 30] as const;

const PERSONA_OPTIONS: ReadonlyArray<{ val: Persona; tip: string }> = [
  { val: 'Generic', tip: 'Default audience.' },
  { val: 'First-time', tip: 'New visitors.' },
  { val: 'Warm lead', tip: 'Engaged & familiar.' },
  { val: 'B2B DM', tip: 'Decision-maker tone.' },
  { val: 'Returning', tip: 'Existing customers.' },
];

const TONE_OPTIONS: ReadonlyArray<{ val: Tone; tip: string }> = [
  { val: 'Friendly', tip: 'Warm, approachable.' },
  { val: 'Informative', tip: 'Clear, factual.' },
  { val: 'Bold', tip: 'Direct, high-energy.' },
  { val: 'Premium', tip: 'Refined & concise.' },
  { val: 'Playful', tip: 'Light, witty.' },
  { val: 'Professional', tip: 'Formal, polished.' },
];

const CONTENT_CTA_STANDARD = [
  'Learn more',
  'Get a demo',
  'Sign up',
  'Shop now',
  'Start free trial',
  'Book a call',
  'Download guide',
] as const;

type ContentCTAStandard = typeof CONTENT_CTA_STANDARD[number];
type ContentCTAOption = ContentCTAStandard | typeof CONTENT_CTA_CUSTOM;
const CONTENT_CTA_CUSTOM = '__content_custom_cta';

const LANGUAGE_OPTIONS: ReadonlyArray<{ val: Language; tip: string }> = [
  { val: 'EN', tip: 'Output language.' },
  { val: 'AR', tip: 'Output language.' },
  { val: 'FR', tip: 'Output language.' },
];

const FORMAT_OPTIONS: ReadonlyArray<{ val: ContentFormat; tip: string }> = [
  { val: 'Auto', tip: 'Auto-detect best layout.' },
  { val: 'FB/IG', tip: 'Facebook & Instagram placements.' },
  { val: 'LinkedIn', tip: 'Optimised for LinkedIn.' },
  { val: 'TikTok', tip: 'Vertical video focus.' },
  { val: 'X', tip: 'Twitter / X feed format.' },
];

const PICTURE_STYLE_OPTIONS: ReadonlyArray<{ val: PicStyle; tip: string }> = [
  { val: 'Product', tip: 'Clean product emphasis.' },
  { val: 'Lifestyle', tip: 'Real-life usage context.' },
  { val: 'UGC', tip: 'Creator / authentic vibe.' },
  { val: 'Abstract', tip: 'Shapes, gradients, textures.' },
];

const PICTURE_MODE_OPTIONS: ReadonlyArray<{ val: 'images' | 'prompt'; tip: string; label: string }> = [
  { val: 'images', tip: 'Generate finished images.', label: 'AI images' },
  { val: 'prompt', tip: 'Produce text prompts only.', label: 'Prompt only' },
];

const PICTURE_ASPECT_OPTIONS: ReadonlyArray<{ val: PicAspect; tip: string }> = [
  { val: '1:1', tip: 'Square – feed & carousels.' },
  { val: '4:5', tip: 'Portrait – IG feeds.' },
  { val: '16:9', tip: 'Landscape – banners/video.' },
];

const PICTURE_BACKDROP_OPTIONS = (
  ['Clean', 'Gradient', 'Real-world'] as const
).map((option) => ({ val: option, tip: option === 'Clean' ? 'Minimal studio setting.' : option === 'Gradient' ? 'Soft color transitions.' : 'Lifestyle environment.' }));

const PICTURE_LIGHTING_OPTIONS = (
  ['Soft', 'Hard', 'Neon'] as const
).map((option) => ({ val: option, tip: option === 'Soft' ? 'Diffuse light, gentle shadows.' : option === 'Hard' ? 'Defined edges & contrast.' : 'Vivid coloured lighting.' }));

const PICTURE_QUALITY_OPTIONS = (
  ['High detail', 'Sharp', 'Minimal noise'] as const
).map((option) => ({ val: option, tip: option === 'High detail' ? 'Focus on fine texture.' : option === 'Sharp' ? 'Crisp edges throughout.' : 'Smooth gradients, no grain.' }));

type PictureNegativeOption = 'None' | 'Logos' | 'Busy background' | 'Extra hands' | 'Glare';
const PICTURE_NEGATIVE_OPTIONS: ReadonlyArray<{ val: PictureNegativeOption; tip: string }> = [
  { val: 'None', tip: 'No specific exclusions.' },
  { val: 'Logos', tip: 'Avoid third-party logos.' },
  { val: 'Busy background', tip: 'Keep the scene clean.' },
  { val: 'Extra hands', tip: 'Prevent distorted limbs.' },
  { val: 'Glare', tip: 'Remove reflective hotspots.' },
];
const PICTURE_NEGATIVE_CUSTOM = '__pictures_custom_negative';

const VIDEO_HOOK_OPTIONS: ReadonlyArray<{ val: VideoHook; tip: string }> = [
  { val: 'Pain-point', tip: 'Lead with the problem.' },
  { val: 'Bold claim', tip: 'Strong promise opener.' },
  { val: 'Question', tip: 'Spark curiosity.' },
  { val: 'Pattern interrupt', tip: 'Break the scroll.' },
];

const VIDEO_ASPECT_OPTIONS: ReadonlyArray<{ val: VideoAspect; tip: string }> = [
  { val: '9:16', tip: 'Vertical – Shorts/Reels/TikTok.' },
  { val: '1:1', tip: 'Square – feeds.' },
  { val: '16:9', tip: 'Landscape – YouTube/Display.' },
];

const VIDEO_VOICEOVER_OPTIONS = (
  ['On-screen text only', 'AI voiceover'] as const
).map((option) => ({ val: option, tip: option === 'On-screen text only' ? 'Rely on subtitles & supers.' : 'Use generated narration.' }));

const VIDEO_DENSITY_OPTIONS = (
  ['Light (3–4)', 'Medium (5–6)', 'Fast (7–8)'] as const
).map((option) => ({ val: option, tip: option === 'Light (3–4)' ? 'Relaxed pace.' : option === 'Medium (5–6)' ? 'Balanced cadence.' : 'Quick-cut montage.' }));

const VIDEO_PROOF_OPTIONS = (
  ['Social proof', 'Feature highlight', 'Before/After'] as const
).map((option) => ({ val: option, tip: option === 'Social proof' ? 'Testimonials / stats.' : option === 'Feature highlight' ? 'Showcase key differentiator.' : 'Visual transformation.' }));

type VideoDoNotOption = 'No claims' | 'No cramped shots' | 'No busy bg';
const VIDEO_DONOT_OPTIONS: ReadonlyArray<{ val: VideoDoNotOption; tip: string }> = [
  { val: 'No claims', tip: 'Avoid compliance risk.' },
  { val: 'No cramped shots', tip: 'Maintain breathing room.' },
  { val: 'No busy bg', tip: 'Keep visuals clean.' },
];
const VIDEO_DONOT_CUSTOM = '__video_custom_donot';

type VideoCTAStandard = typeof CONTENT_CTA_STANDARD[number];
type VideoCTAOption = VideoCTAStandard | typeof VIDEO_CTA_CUSTOM;
const VIDEO_CTA_CUSTOM = '__video_custom_cta';

export function CardsSelector({ settings, onSettingsChange }: CardsSelectorProps) {
  const { cards, quickProps } = settings;
  const [advancedOpen, setAdvancedOpen] = useState({
    content: false,
    pictures: false,
    video: false,
  });
  const [editingContentCustomCTA, setEditingContentCustomCTA] = useState(false);
  const [editingPictureNegative, setEditingPictureNegative] = useState(false);
  const [editingCustomDuration, setEditingCustomDuration] = useState(false);
  const [editingVideoCustomCTA, setEditingVideoCustomCTA] = useState(false);
  const [editingVideoDoNot, setEditingVideoDoNot] = useState(false);
  const salesAutoAppliedRef = useRef(false);

  const contentQuickProps = quickProps.content;
  const picturesQuickProps = quickProps.pictures;
  const videoQuickProps = quickProps.video;

  const updateQuickProps = <K extends keyof SettingsState['quickProps']>(
    card: K,
    props: Partial<SettingsState['quickProps'][K]>
  ) => {
    onSettingsChange({
      ...settings,
      quickProps: {
        ...quickProps,
        [card]: {
          ...quickProps[card],
          ...props,
        },
      },
    });
  };

  const setContentProps = (props: Partial<SettingsState['quickProps']['content']>) =>
    updateQuickProps('content', props);
  const setPicturesProps = (props: Partial<SettingsState['quickProps']['pictures']>) =>
    updateQuickProps('pictures', props);
  const setVideoProps = (props: Partial<SettingsState['quickProps']['video']>) =>
    updateQuickProps('video', props);

  const personaValue = contentQuickProps.persona;
  const toneValue = contentQuickProps.tone;
  const languageValue = contentQuickProps.language;
  const formatValue = contentQuickProps.format ?? 'Auto';

  const initialContentCTA = contentQuickProps.cta?.trim() || 'Learn more';
  const [contentCtaSelection, setContentCtaSelection] = useState<ContentCTAOption>(() =>
    CONTENT_CTA_STANDARD.includes(initialContentCTA as ContentCTAStandard)
      ? (initialContentCTA as ContentCTAStandard)
      : CONTENT_CTA_CUSTOM
  );
  const [contentCustomCtaDraft, setContentCustomCtaDraft] = useState(
    CONTENT_CTA_STANDARD.includes(initialContentCTA as ContentCTAStandard) ? '' : initialContentCTA
  );

  useEffect(() => {
    const current = contentQuickProps.cta?.trim() || 'Learn more';
    if (CONTENT_CTA_STANDARD.includes(current as ContentCTAStandard)) {
      setContentCtaSelection(current as ContentCTAStandard);
      setContentCustomCtaDraft('');
      if (editingContentCustomCTA) {
        setEditingContentCustomCTA(false);
      }
    } else {
      setContentCtaSelection(CONTENT_CTA_CUSTOM);
      setContentCustomCtaDraft(current);
    }
  }, [contentQuickProps.cta, editingContentCustomCTA]);

  useEffect(() => {
    if (settings.mediaPlan.goal === 'Sales') {
      if (!salesAutoAppliedRef.current && contentQuickProps.cta === 'Learn more') {
        salesAutoAppliedRef.current = true;
        setContentProps({ cta: 'Shop now' });
      }
    } else {
      salesAutoAppliedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.mediaPlan.goal, contentQuickProps.cta]);

  const contentCustomChipLabel = useMemo(() => {
    const current = contentQuickProps.cta?.trim() || '';
    if (!current || CONTENT_CTA_STANDARD.includes(current as ContentCTAStandard)) {
      return 'Custom…';
    }
    return `Custom: ${truncateLabel(current)}`;
  }, [contentQuickProps.cta]);

  const contentCtaOptions = useMemo<ReadonlyArray<ChipOption<ContentCTAOption>>>(() => {
    const standard = CONTENT_CTA_STANDARD.map((val) => ({ val, tip: getCtaTip(val) }));
    return [
      ...standard,
      { val: CONTENT_CTA_CUSTOM as ContentCTAOption, label: contentCustomChipLabel, tip: 'Write your own CTA (≤60 characters).' },
    ];
  }, [contentCustomChipLabel]);

  const pictureNegativeValue = picturesQuickProps.negative?.trim() || 'None';
  const isPictureNegativeCustom = (
    value: string
  ) => !PICTURE_NEGATIVE_OPTIONS.some(({ val }) => val === value);
  const [pictureNegativeSelection, setPictureNegativeSelection] = useState<PictureNegativeOption | typeof PICTURE_NEGATIVE_CUSTOM>(
    isPictureNegativeCustom(pictureNegativeValue) ? PICTURE_NEGATIVE_CUSTOM : (pictureNegativeValue as PictureNegativeOption)
  );
  const [pictureNegativeDraft, setPictureNegativeDraft] = useState(
    isPictureNegativeCustom(pictureNegativeValue) ? pictureNegativeValue : ''
  );

  useEffect(() => {
    const current = picturesQuickProps.negative?.trim() || 'None';
    if (isPictureNegativeCustom(current)) {
      setPictureNegativeSelection(PICTURE_NEGATIVE_CUSTOM);
      setPictureNegativeDraft(current);
    } else {
      setPictureNegativeSelection(current as PictureNegativeOption);
      setPictureNegativeDraft('');
      setEditingPictureNegative(false);
    }
  }, [picturesQuickProps.negative]);

  const videoDuration = videoQuickProps.duration ?? 12;
  const isDurationPreset = presetDurations.includes(videoDuration as typeof presetDurations[number]);
  const [customDurationDraft, setCustomDurationDraft] = useState(String(videoDuration));

  useEffect(() => {
    setCustomDurationDraft(String(videoDuration));
    if (isDurationPreset) {
      setEditingCustomDuration(false);
    }
  }, [videoDuration, isDurationPreset]);

  const videoCtaCurrent = videoQuickProps.cta?.trim() || 'Learn more';
  const isVideoCtaCustom = (value: string) => !CONTENT_CTA_STANDARD.includes(value as ContentCTAStandard);
  const [videoCtaSelection, setVideoCtaSelection] = useState<VideoCTAOption>(
    isVideoCtaCustom(videoCtaCurrent) ? VIDEO_CTA_CUSTOM : (videoCtaCurrent as VideoCTAStandard)
  );
  const [videoCustomCtaDraft, setVideoCustomCtaDraft] = useState(
    isVideoCtaCustom(videoCtaCurrent) ? videoCtaCurrent : ''
  );

  useEffect(() => {
    const current = videoQuickProps.cta?.trim() || 'Learn more';
    if (isVideoCtaCustom(current)) {
      setVideoCtaSelection(VIDEO_CTA_CUSTOM);
      setVideoCustomCtaDraft(current);
    } else {
      setVideoCtaSelection(current as VideoCTAStandard);
      setVideoCustomCtaDraft('');
      setEditingVideoCustomCTA(false);
    }
  }, [videoQuickProps.cta]);

  const videoCustomChipLabel = useMemo(() => {
    const current = videoQuickProps.cta?.trim() || '';
    if (!current || !isVideoCtaCustom(current)) {
      return 'Custom…';
    }
    return `Custom: ${truncateLabel(current)}`;
  }, [videoQuickProps.cta]);

  const videoCtaOptions = useMemo<ReadonlyArray<ChipOption<VideoCTAOption>>>(() => {
    const standard = CONTENT_CTA_STANDARD.map((val) => ({ val, tip: getCtaTip(val) }));
    return [
      ...standard,
      { val: VIDEO_CTA_CUSTOM as VideoCTAOption, label: videoCustomChipLabel, tip: 'Write your own CTA (≤60 characters).' },
    ];
  }, [videoCustomChipLabel]);

  const videoDoNotValue = videoQuickProps.doNots?.trim() || 'No claims';
  const isVideoDoNotCustom = (value: string) => !VIDEO_DONOT_OPTIONS.some(({ val }) => val === value);
  const [videoDoNotSelection, setVideoDoNotSelection] = useState<VideoDoNotOption | typeof VIDEO_DONOT_CUSTOM>(
    isVideoDoNotCustom(videoDoNotValue) ? VIDEO_DONOT_CUSTOM : (videoDoNotValue as VideoDoNotOption)
  );
  const [videoDoNotDraft, setVideoDoNotDraft] = useState(
    isVideoDoNotCustom(videoDoNotValue) ? videoDoNotValue : ''
  );

  useEffect(() => {
    const current = videoQuickProps.doNots?.trim() || 'No claims';
    if (isVideoDoNotCustom(current)) {
      setVideoDoNotSelection(VIDEO_DONOT_CUSTOM);
      setVideoDoNotDraft(current);
    } else {
      setVideoDoNotSelection(current as VideoDoNotOption);
      setVideoDoNotDraft('');
      setEditingVideoDoNot(false);
    }
  }, [videoQuickProps.doNots]);

  const toggleCard = (card: keyof SettingsState['cards']) => {
    onSettingsChange({
      ...settings,
      cards: {
        ...cards,
        [card]: !cards[card],
      },
    });
  };

  const toggleAdvanced = (card: keyof typeof advancedOpen) => {
    setAdvancedOpen((prev) => ({ ...prev, [card]: !prev[card] }));
  };

  const handlePersonaChange = (value: Persona) => setContentProps({ persona: value });
  const handleToneChange = (value: Tone) => setContentProps({ tone: value });
  const handleLanguageChange = (value: Language) => setContentProps({ language: value });
  const handleFormatChange = (value: ContentFormat) => setContentProps({ format: value });

  const handleContentCtaChange = (value: ContentCTAOption) => {
    if (value === CONTENT_CTA_CUSTOM) {
      setContentCtaSelection(CONTENT_CTA_CUSTOM);
      setEditingContentCustomCTA(true);
      setContentCustomCtaDraft((draft) => (draft ? draft : contentQuickProps.cta && !CONTENT_CTA_STANDARD.includes(contentQuickProps.cta as ContentCTAStandard) ? contentQuickProps.cta : ''));
      return;
    }

    setEditingContentCustomCTA(false);
    setContentCtaSelection(value);
    setContentProps({ cta: value });
  };

  const saveContentCustomCta = () => {
    const trimmed = contentCustomCtaDraft.trim().slice(0, CTA_LIMIT);
    const next = trimmed || 'Custom';
    setContentProps({ cta: next });
    setContentCtaSelection(CONTENT_CTA_CUSTOM);
    setEditingContentCustomCTA(false);
  };

  const cancelContentCustomCta = () => {
    const current = contentQuickProps.cta?.trim() || 'Learn more';
    if (CONTENT_CTA_STANDARD.includes(current as ContentCTAStandard)) {
      setContentCtaSelection(current as ContentCTAStandard);
    } else {
      setContentCtaSelection(CONTENT_CTA_CUSTOM);
      setContentCustomCtaDraft(current);
    }
    setEditingContentCustomCTA(false);
  };

  const handleContentCustomCtaKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveContentCustomCta();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelContentCustomCta();
    }
  };

  const handlePictureNegativeChange = (value: PictureNegativeOption | typeof PICTURE_NEGATIVE_CUSTOM) => {
    if (value === PICTURE_NEGATIVE_CUSTOM) {
      setPictureNegativeSelection(PICTURE_NEGATIVE_CUSTOM);
      setEditingPictureNegative(true);
      setPictureNegativeDraft((draft) => (draft ? draft : isPictureNegativeCustom(pictureNegativeValue) ? pictureNegativeValue : ''));
      return;
    }

    setEditingPictureNegative(false);
    setPictureNegativeSelection(value);
    setPictureNegativeDraft('');
    setPicturesProps({ negative: value });
  };

  const savePictureNegative = () => {
    const trimmed = pictureNegativeDraft.trim().slice(0, CTA_LIMIT);
    const next = trimmed || 'None';
    setPicturesProps({ negative: next });
    setPictureNegativeSelection(trimmed ? PICTURE_NEGATIVE_CUSTOM : 'None');
    setEditingPictureNegative(false);
  };

  const cancelPictureNegative = () => {
    const current = picturesQuickProps.negative?.trim() || 'None';
    if (isPictureNegativeCustom(current)) {
      setPictureNegativeSelection(PICTURE_NEGATIVE_CUSTOM);
      setPictureNegativeDraft(current);
    } else {
      setPictureNegativeSelection(current as PictureNegativeOption);
    }
    setEditingPictureNegative(false);
  };

  const handleCustomDurationOpen = () => {
    setCustomDurationDraft(String(videoDuration));
    setEditingCustomDuration(true);
  };

  const saveCustomDuration = () => {
    const numeric = Number(customDurationDraft);
    const clamped = Number.isFinite(numeric)
      ? Math.min(VIDEO_DURATION_MAX, Math.max(VIDEO_DURATION_MIN, Math.round(numeric)))
      : videoDuration;
    setVideoProps({ duration: clamped });
    setEditingCustomDuration(false);
  };

  const cancelCustomDuration = () => {
    setCustomDurationDraft(String(videoDuration));
    setEditingCustomDuration(false);
  };

  const handleVideoCtaChange = (value: VideoCTAOption) => {
    if (value === VIDEO_CTA_CUSTOM) {
      setVideoCtaSelection(VIDEO_CTA_CUSTOM);
      setEditingVideoCustomCTA(true);
      setVideoCustomCtaDraft((draft) => (draft ? draft : isVideoCtaCustom(videoCtaCurrent) ? videoCtaCurrent : ''));
      return;
    }

    setEditingVideoCustomCTA(false);
    setVideoCtaSelection(value);
    setVideoProps({ cta: value });
  };

  const saveVideoCustomCta = () => {
    const trimmed = videoCustomCtaDraft.trim().slice(0, CTA_LIMIT);
    const next = trimmed || 'Custom';
    setVideoProps({ cta: next });
    setVideoCtaSelection(VIDEO_CTA_CUSTOM);
    setEditingVideoCustomCTA(false);
  };

  const cancelVideoCustomCta = () => {
    const current = videoQuickProps.cta?.trim() || 'Learn more';
    if (isVideoCtaCustom(current)) {
      setVideoCtaSelection(VIDEO_CTA_CUSTOM);
      setVideoCustomCtaDraft(current);
    } else {
      setVideoCtaSelection(current as VideoCTAStandard);
    }
    setEditingVideoCustomCTA(false);
  };

  const handleVideoCustomCtaKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveVideoCustomCta();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelVideoCustomCta();
    }
  };

  const handleVideoDoNotChange = (value: VideoDoNotOption | typeof VIDEO_DONOT_CUSTOM) => {
    if (value === VIDEO_DONOT_CUSTOM) {
      setVideoDoNotSelection(VIDEO_DONOT_CUSTOM);
      setEditingVideoDoNot(true);
      setVideoDoNotDraft((draft) => (draft ? draft : isVideoDoNotCustom(videoDoNotValue) ? videoDoNotValue : ''));
      return;
    }

    setEditingVideoDoNot(false);
    setVideoDoNotSelection(value);
    setVideoDoNotDraft('');
    setVideoProps({ doNots: value });
  };

  const saveVideoDoNot = () => {
    const trimmed = videoDoNotDraft.trim().slice(0, CTA_LIMIT);
    const next = trimmed || 'No claims';
    setVideoProps({ doNots: next });
    setVideoDoNotSelection(trimmed ? VIDEO_DONOT_CUSTOM : 'No claims');
    setEditingVideoDoNot(false);
  };

  const cancelVideoDoNot = () => {
    const current = videoQuickProps.doNots?.trim() || 'No claims';
    if (isVideoDoNotCustom(current)) {
      setVideoDoNotSelection(VIDEO_DONOT_CUSTOM);
      setVideoDoNotDraft(current);
    } else {
      setVideoDoNotSelection(current as VideoDoNotOption);
    }
    setEditingVideoDoNot(false);
  };

  const handleVideoDoNotKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveVideoDoNot();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelVideoDoNot();
    }
  };

  const customDurationActive = editingCustomDuration || !isDurationPreset;
  const customDurationLabel = isDurationPreset ? 'Custom…' : `Custom: ${videoDuration}s`;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">Cards to Generate</p>
        <Tooltip.Root delayDuration={100}>
          <Tooltip.Trigger asChild>
            <span className="cursor-help text-white/50 transition-colors hover:text-white/80">ⓘ</span>
          </Tooltip.Trigger>
          <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
            Choose which creative cards the AI prepares.
          </Tooltip.Content>
        </Tooltip.Root>
      </div>

      <div className="space-y-4">
        {/* Content */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">Content</p>
              <Tooltip.Root delayDuration={100}>
                <Tooltip.Trigger asChild>
                  <span className="cursor-help text-white/50 transition-colors hover:text-white/80">ⓘ</span>
                </Tooltip.Trigger>
                <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
                  Headlines, captions, and CTA copy.
                </Tooltip.Content>
              </Tooltip.Root>
            </div>
            <Switch.Root
              id="content-switch"
              checked={cards.content}
              onCheckedChange={() => toggleCard('content')}
              className="relative h-6 w-11 rounded-full bg-white/10 transition-colors data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#3E8BFF] data-[state=checked]:to-[#6B70FF]"
            >
              <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
          </div>

          <AnimatePresence initial={false}>
            {cards.content && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-4">
                  <ChipGroup
                    label="Persona"
                    value={personaValue}
                    onChange={handlePersonaChange}
                    options={PERSONA_OPTIONS}
                  />
                  <ChipGroup
                    label="Tone"
                    value={toneValue}
                    onChange={handleToneChange}
                    options={TONE_OPTIONS}
                  />
                  <ChipGroup
                    label="CTA"
                    value={contentCtaSelection}
                    onChange={handleContentCtaChange}
                    options={contentCtaOptions}
                  />

                  {editingContentCustomCTA && (
                    <InlineInputPill
                      value={contentCustomCtaDraft}
                      placeholder="Custom CTA…"
                      onChange={setContentCustomCtaDraft}
                      onSave={saveContentCustomCta}
                      onCancel={cancelContentCustomCta}
                      onKeyDown={handleContentCustomCtaKeyDown}
                    />
                  )}

                  <ChipGroup
                    label="Language"
                    value={languageValue}
                    onChange={handleLanguageChange}
                    options={LANGUAGE_OPTIONS}
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => toggleAdvanced('content')}
                      className="flex items-center gap-1 text-xs text-white/60 transition-colors hover:text-white"
                    >
                      Advanced
                      <ChevronDown className={cn('h-3 w-3 transition-transform', advancedOpen.content && 'rotate-180')} />
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {advancedOpen.content && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                          <ChipGroup
                            label="Platform format"
                            value={formatValue}
                            onChange={handleFormatChange}
                            options={FORMAT_OPTIONS}
                          />
                          <div className="grid gap-2 lg:grid-cols-2">
                            <input
                              type="text"
                              placeholder="Keywords"
                              value={contentQuickProps.keywords ?? ''}
                              onChange={(event) => setContentProps({ keywords: event.target.value })}
                              className={inputClass}
                            />
                            <input
                              type="text"
                              placeholder="Avoid"
                              value={contentQuickProps.avoid ?? ''}
                              onChange={(event) => setContentProps({ avoid: event.target.value })}
                              className={inputClass}
                            />
                            <input
                              type="text"
                              placeholder="Hashtags"
                              value={contentQuickProps.hashtags ?? ''}
                              onChange={(event) => setContentProps({ hashtags: event.target.value })}
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pictures */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">Pictures / Prompt</p>
              <Tooltip.Root delayDuration={100}>
                <Tooltip.Trigger asChild>
                  <span className="cursor-help text-white/50 transition-colors hover:text-white/80">ⓘ</span>
                </Tooltip.Trigger>
                <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
                  Control image prompts, styles, and uploads.
                </Tooltip.Content>
              </Tooltip.Root>
            </div>
            <Switch.Root
              id="pictures-switch"
              checked={cards.pictures}
              onCheckedChange={() => toggleCard('pictures')}
              className="relative h-6 w-11 rounded-full bg-white/10 transition-colors data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#3E8BFF] data-[state=checked]:to-[#6B70FF]"
            >
              <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
          </div>

          <AnimatePresence initial={false}>
            {cards.pictures && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-4">
                  <ChipGroup
                    label="Style"
                    value={picturesQuickProps.style}
                    onChange={(value: PicStyle) => setPicturesProps({ style: value })}
                    options={PICTURE_STYLE_OPTIONS}
                  />
                  <ChipGroup
                    label="Output"
                    value={picturesQuickProps.mode}
                    onChange={(value: 'images' | 'prompt') => setPicturesProps({ mode: value })}
                    options={PICTURE_MODE_OPTIONS}
                  />
                  <ChipGroup
                    label="Aspect"
                    value={picturesQuickProps.aspect}
                    onChange={(value: PicAspect) => setPicturesProps({ aspect: value })}
                    options={PICTURE_ASPECT_OPTIONS}
                  />
                  <div className="space-y-2">
                    <div className="text-xs font-semibold tracking-wide text-white/60">Constraints</div>
                    <div className="flex flex-wrap gap-2">
                      <ToggleChip
                        checked={!!picturesQuickProps.lockBrandColors}
                        onChange={(value) => setPicturesProps({ lockBrandColors: value })}
                        tip="Force brand palette in generated images."
                      >
                        Brand palette {picturesQuickProps.lockBrandColors ? 'locked' : 'unlocked'}
                      </ToggleChip>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => toggleAdvanced('pictures')}
                      className="flex items-center gap-1 text-xs text-white/60 transition-colors hover:text-white"
                    >
                      Advanced
                      <ChevronDown className={cn('h-3 w-3 transition-transform', advancedOpen.pictures && 'rotate-180')} />
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {advancedOpen.pictures && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                          <ChipGroup
                            label="Backdrop"
                            value={picturesQuickProps.backdrop ?? 'Clean'}
                            onChange={(value: string) => setPicturesProps({ backdrop: value })}
                            options={PICTURE_BACKDROP_OPTIONS}
                          />
                          <ChipGroup
                            label="Lighting"
                            value={picturesQuickProps.lighting ?? 'Soft'}
                            onChange={(value: string) => setPicturesProps({ lighting: value })}
                            options={PICTURE_LIGHTING_OPTIONS}
                          />
                          <ChipGroup
                            label="Negative prompts"
                            value={pictureNegativeSelection}
                            onChange={handlePictureNegativeChange}
                            options={[
                              ...PICTURE_NEGATIVE_OPTIONS,
                              { val: PICTURE_NEGATIVE_CUSTOM, label: 'Custom…', tip: 'Specify a custom exclusion.' },
                            ]}
                          />

                          {editingPictureNegative && (
                            <InlineInputPill
                              value={pictureNegativeDraft}
                              placeholder="Custom exclusion…"
                              onChange={setPictureNegativeDraft}
                              onSave={savePictureNegative}
                              onCancel={cancelPictureNegative}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  savePictureNegative();
                                } else if (event.key === 'Escape') {
                                  event.preventDefault();
                                  cancelPictureNegative();
                                }
                              }}
                            />
                          )}

                          <ChipGroup
                            label="Quality hints"
                            value={picturesQuickProps.quality ?? 'High detail'}
                            onChange={(value: string) => setPicturesProps({ quality: value })}
                            options={PICTURE_QUALITY_OPTIONS}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Video */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">Video Prompt</p>
              <Tooltip.Root delayDuration={100}>
                <Tooltip.Trigger asChild>
                  <span className="cursor-help text-white/50 transition-colors hover:text-white/80">ⓘ</span>
                </Tooltip.Trigger>
                <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
                  Define hooks, beats, and CTA direction.
                </Tooltip.Content>
              </Tooltip.Root>
            </div>
            <Switch.Root
              id="video-switch"
              checked={cards.video}
              onCheckedChange={() => toggleCard('video')}
              className="relative h-6 w-11 rounded-full bg-white/10 transition-colors data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#3E8BFF] data-[state=checked]:to-[#6B70FF]"
            >
              <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
          </div>

          <AnimatePresence initial={false}>
            {cards.video && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold tracking-wide text-white/60">Duration</div>
                    <div className="flex flex-wrap gap-2">
                      {presetDurations.map((duration) => {
                        const isActive = videoDuration === duration;
                        return (
                          <Tooltip.Root key={duration} delayDuration={80}>
                            <Tooltip.Trigger asChild>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCustomDuration(false);
                                  setVideoProps({ duration });
                                }}
                                className={cn(
                                  'h-10 rounded-full border border-white/12 bg-white/5 px-3.5 text-sm text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/35',
                                  isActive && 'bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[inset_0_0_0_2px_rgba(62,139,255,0.25)]'
                                )}
                              >
                                {duration}s
                              </button>
                            </Tooltip.Trigger>
                            <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
                              Optimal cut length.
                            </Tooltip.Content>
                          </Tooltip.Root>
                        );
                      })}
                      <Tooltip.Root delayDuration={80}>
                        <Tooltip.Trigger asChild>
                          <button
                            type="button"
                            onClick={handleCustomDurationOpen}
                            className={cn(
                              'h-10 rounded-full border border-white/12 bg-white/5 px-3.5 text-sm text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/35',
                              customDurationActive && 'bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[inset_0_0_0_2px_rgba(62,139,255,0.25)]'
                            )}
                          >
                            {customDurationLabel}
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
                          Set a custom duration.
                        </Tooltip.Content>
                      </Tooltip.Root>
                    </div>
                  </div>

                  {editingCustomDuration && (
                    <InlineInputPill
                      value={customDurationDraft}
                      placeholder="Seconds"
                      onChange={setCustomDurationDraft}
                      onSave={saveCustomDuration}
                      onCancel={cancelCustomDuration}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          saveCustomDuration();
                        } else if (event.key === 'Escape') {
                          event.preventDefault();
                          cancelCustomDuration();
                        }
                      }}
                      type="number"
                      min={VIDEO_DURATION_MIN}
                      max={VIDEO_DURATION_MAX}
                    />
                  )}

                  <ChipGroup
                    label="Hook"
                    value={videoQuickProps.hook}
                    onChange={(value: VideoHook) => setVideoProps({ hook: value })}
                    options={VIDEO_HOOK_OPTIONS}
                  />
                  <ChipGroup
                    label="Aspect"
                    value={videoQuickProps.aspect}
                    onChange={(value: VideoAspect) => setVideoProps({ aspect: value })}
                    options={VIDEO_ASPECT_OPTIONS}
                  />
                  <div className="space-y-2">
                    <div className="text-xs font-semibold tracking-wide text-white/60">Accessibility</div>
                    <div className="flex flex-wrap gap-2">
                      <ToggleChip
                        checked={!!videoQuickProps.captions}
                        onChange={(value) => setVideoProps({ captions: value })}
                        tip="Burn-in captions for silent autoplay."
                      >
                        Captions {videoQuickProps.captions ? 'on' : 'off'}
                      </ToggleChip>
                    </div>
                  </div>
                  <ChipGroup
                    label="CTA"
                    value={videoCtaSelection}
                    onChange={handleVideoCtaChange}
                    options={videoCtaOptions}
                  />

                  {editingVideoCustomCTA && (
                    <InlineInputPill
                      value={videoCustomCtaDraft}
                      placeholder="Custom CTA…"
                      onChange={setVideoCustomCtaDraft}
                      onSave={saveVideoCustomCta}
                      onCancel={cancelVideoCustomCta}
                      onKeyDown={handleVideoCustomCtaKeyDown}
                    />
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => toggleAdvanced('video')}
                      className="flex items-center gap-1 text-xs text-white/60 transition-colors hover:text-white"
                    >
                      Advanced
                      <ChevronDown className={cn('h-3 w-3 transition-transform', advancedOpen.video && 'rotate-180')} />
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {advancedOpen.video && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                          <ChipGroup
                            label="Voiceover"
                            value={videoQuickProps.voiceover ?? 'On-screen text only'}
                            onChange={(value: string) => setVideoProps({ voiceover: value })}
                            options={VIDEO_VOICEOVER_OPTIONS}
                          />
                          <ChipGroup
                            label="Shot density"
                            value={videoQuickProps.density ?? 'Medium (5–6)'}
                            onChange={(value: string) => setVideoProps({ density: value })}
                            options={VIDEO_DENSITY_OPTIONS}
                          />
                          <ChipGroup
                            label="Proof element"
                            value={videoQuickProps.proof ?? 'Social proof'}
                            onChange={(value: string) => setVideoProps({ proof: value })}
                            options={VIDEO_PROOF_OPTIONS}
                          />
                          <ChipGroup
                            label="Do-nots"
                            value={videoDoNotSelection}
                            onChange={handleVideoDoNotChange}
                            options={[
                              ...VIDEO_DONOT_OPTIONS,
                              { val: VIDEO_DONOT_CUSTOM, label: 'Custom…', tip: 'Add a custom exclusion.' },
                            ]}
                          />

                          {editingVideoDoNot && (
                            <InlineInputPill
                              value={videoDoNotDraft}
                              placeholder="Custom do-not…"
                              onChange={setVideoDoNotDraft}
                              onSave={saveVideoDoNot}
                              onCancel={cancelVideoDoNot}
                              onKeyDown={handleVideoDoNotKeyDown}
                            />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

type ChipOption<T extends string> = {
  val: T;
  label?: string;
  tip?: string;
};

interface ChipGroupProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<ChipOption<T>>;
}

function ChipGroup<T extends string>({ label, value, onChange, options }: ChipGroupProps<T>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const group = event.currentTarget.closest('[role="radiogroup"]');
    if (!group) {
      return;
    }
    const radios = Array.from(group.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
    const lastIndex = radios.length - 1;
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = (index + 1) % radios.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = (index - 1 + radios.length) % radios.length;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = lastIndex;
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        onChange(options[index].val);
        return;
      default:
        return;
    }

    if (nextIndex !== null && radios[nextIndex]) {
      radios[nextIndex].focus();
      onChange(options[nextIndex].val);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold tracking-wide text-white/60">{label}</div>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const isActive = value === option.val;
          const chip = (
            <button
              key={option.val}
              type="button"
              role="radio"
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                if (!isActive) {
                  onChange(option.val);
                }
              }}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                'h-10 rounded-full border border-white/12 bg-white/5 px-3.5 text-sm text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/35',
                isActive && 'bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[inset_0_0_0_2px_rgba(62,139,255,0.25)]'
              )}
            >
              {option.label ?? option.val}
            </button>
          );

          if (!option.tip) {
            return chip;
          }

          return (
            <Tooltip.Root key={option.val} delayDuration={100}>
              <Tooltip.Trigger asChild>{chip}</Tooltip.Trigger>
              <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
                {option.tip}
              </Tooltip.Content>
            </Tooltip.Root>
          );
        })}
      </div>
    </div>
  );
}

function ToggleChip({ checked, onChange, children, tip }: ToggleChipProps) {
  const baseClasses = 'h-10 px-3.5 rounded-full border border-white/12 bg-white/5 text-sm text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/35';
  const activeClasses = 'bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[inset_0_0_0_2px_rgba(62,139,255,0.25)]';
  const button = (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cn(baseClasses, checked && activeClasses)}
    >
      {children}
    </button>
  );

  if (!tip) {
    return button;
  }

  return (
    <Tooltip.Root delayDuration={100}>
      <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
      <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
        {tip}
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

interface ToggleChipProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: ReactNode;
  tip?: string;
}

interface InlineInputPillProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  type?: 'text' | 'number';
  min?: number;
  max?: number;
}

function InlineInputPill({
  value,
  placeholder,
  onChange,
  onSave,
  onCancel,
  onKeyDown,
  type = 'text',
  min,
  max,
}: InlineInputPillProps) {
  return (
    <div className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5">
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        autoFocus
        min={min}
        max={max}
        maxLength={type === 'text' ? CTA_LIMIT : undefined}
        className="w-48 bg-transparent text-sm text-white/90 placeholder-white/40 outline-none"
      />
      <div className="flex items-center gap-2 text-xs">
        <button type="button" onClick={onSave} className="text-white/70 transition-colors hover:text-white">
          Save
        </button>
        <button type="button" onClick={onCancel} className="text-white/50 transition-colors hover:text-white">
          Cancel
        </button>
      </div>
    </div>
  );
}

function getCtaTip(cta: ContentCTAStandard | VideoCTAStandard) {
  switch (cta) {
    case 'Learn more':
      return 'Education focus.';
    case 'Get a demo':
      return 'B2B lead intent.';
    case 'Sign up':
      return 'Account creation.';
    case 'Shop now':
      return 'Purchase intent.';
    case 'Start free trial':
      return 'Try before buy.';
    case 'Book a call':
      return 'Sales conversation.';
    case 'Download guide':
      return 'Lead magnet.';
    default:
      return '';
  }
}

function truncateLabel(text: string, max = 28): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
}
