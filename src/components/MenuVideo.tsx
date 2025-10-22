import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';
import { ChevronDown, ChevronUp, ImageIcon, Wand2, Loader2 } from 'lucide-react';

import { cn } from '../lib/format';
import type {
  SettingsState,
  VideoAspect,
  VideoProvider
} from '../types';
import { useCardsStore } from '../store/useCardsStore';
import { HintChip } from './AppMenuBar';
import { enhanceVideoPrompt } from '../lib/videoPromptBuilder';

// Aspect Ratios
const VIDEO_ASPECT_OPTIONS: VideoAspect[] = ['9:16', '1:1', '16:9'];
const VIDEO_ASPECT_HINTS: Record<VideoAspect, string> = {
  '9:16': 'Vertical - Reels, Shorts, TikTok',
  '1:1': 'Square - Instagram feed',
  '16:9': 'Landscape - YouTube, website',
};

// Luma provider option catalogs
const LUMA_CAMERA_MOVEMENTS = [
  { value: 'static', label: 'Static', hint: 'Fixed camera position' },
  { value: 'pan_left', label: 'Pan Left', hint: 'Horizontal sweep left' },
  { value: 'pan_right', label: 'Pan Right', hint: 'Horizontal sweep right' },
  { value: 'zoom_in', label: 'Zoom In', hint: 'Push in toward subject' },
  { value: 'zoom_out', label: 'Zoom Out', hint: 'Pull back to reveal scene' },
  { value: 'orbit_right', label: 'Orbit Right', hint: 'Circle around subject' },
];

const LUMA_CAMERA_ANGLES = [
  { value: 'low', label: 'Low', hint: "Heroic worm's-eye view" },
  { value: 'eye_level', label: 'Eye Level', hint: 'Natural perspective' },
  { value: 'high', label: 'High', hint: 'Downward overview' },
  { value: 'bird_eye', label: "Bird's Eye", hint: 'Top-down look' },
];

const LUMA_CAMERA_DISTANCES = [
  { value: 'close_up', label: 'Close-up', hint: 'Focus on detail' },
  { value: 'medium', label: 'Medium', hint: 'Balanced framing' },
  { value: 'wide', label: 'Wide', hint: 'Environmental context' },
  { value: 'extreme_wide', label: 'Extreme Wide', hint: 'Epic establishing shot' },
];

const LUMA_STYLES = [
  { value: 'cinematic', label: 'Cinematic', hint: 'Premium film aesthetic' },
  { value: 'photorealistic', label: 'Photorealistic', hint: 'Natural realism' },
  { value: 'artistic', label: 'Artistic', hint: 'Creative painterly look' },
  { value: 'animated', label: 'Animated', hint: 'Stylised animation' },
  { value: 'vintage', label: 'Vintage', hint: 'Retro character' },
];

const LUMA_LIGHTING = [
  { value: 'natural', label: 'Natural', hint: 'Outdoor daylight' },
  { value: 'dramatic', label: 'Dramatic', hint: 'High-contrast shadows' },
  { value: 'soft', label: 'Soft', hint: 'Even, flattering light' },
  { value: 'hard', label: 'Hard', hint: 'Crisp highlights' },
  { value: 'golden_hour', label: 'Golden Hour', hint: 'Warm sunset glow' },
  { value: 'blue_hour', label: 'Blue Hour', hint: 'Cool twilight mood' },
];

const LUMA_MOODS = [
  { value: 'energetic', label: 'Energetic', hint: 'High-impact storytelling' },
  { value: 'calm', label: 'Calm', hint: 'Peaceful, relaxed' },
  { value: 'mysterious', label: 'Mysterious', hint: 'Intriguing atmosphere' },
  { value: 'joyful', label: 'Joyful', hint: 'Bright and optimistic' },
  { value: 'serious', label: 'Serious', hint: 'Professional tone' },
  { value: 'epic', label: 'Epic', hint: 'Grand cinematic scale' },
];

const LUMA_MOTION_INTENSITY = [
  { value: 'minimal', label: 'Minimal', hint: 'Subtle movement' },
  { value: 'moderate', label: 'Moderate', hint: 'Balanced motion' },
  { value: 'high', label: 'High', hint: 'Dynamic energy' },
  { value: 'extreme', label: 'Extreme', hint: 'Maximum impact' },
];

const LUMA_MOTION_SPEED = [
  { value: 'slow_motion', label: 'Slow Motion', hint: 'Elegant pacing' },
  { value: 'normal', label: 'Normal', hint: 'Real-time' },
  { value: 'fast_motion', label: 'Fast Motion', hint: 'Energetic acceleration' },
];

const LUMA_SUBJECT_MOVEMENT = [
  { value: 'static', label: 'Static', hint: 'No subject movement' },
  { value: 'subtle', label: 'Subtle', hint: 'Gentle motion' },
  { value: 'active', label: 'Active', hint: 'Clear action' },
  { value: 'dynamic', label: 'Dynamic', hint: 'High-energy motion' },
];

const LUMA_QUALITY = [
  { value: 'standard', label: 'Standard', hint: 'Balanced quality/speed' },
  { value: 'high', label: 'High', hint: 'Enhanced detail' },
  { value: 'premium', label: 'Premium', hint: 'Maximum fidelity' },
];

const LUMA_COLOR_GRADING = [
  { value: 'natural', label: 'Natural', hint: 'True-to-life colours' },
  { value: 'warm', label: 'Warm', hint: 'Golden tones' },
  { value: 'cool', label: 'Cool', hint: 'Modern blue palette' },
  { value: 'dramatic', label: 'Dramatic', hint: 'High contrast' },
  { value: 'desaturated', label: 'Desaturated', hint: 'Soft, muted look' },
];

const LUMA_FILM_LOOK = [
  { value: 'digital', label: 'Digital', hint: 'Clean contemporary' },
  { value: '35mm', label: '35mm', hint: 'Classic cinema texture' },
  { value: '16mm', label: '16mm', hint: 'Documentary aesthetic' },
  { value: 'vintage', label: 'Vintage', hint: 'Retro film grain' },
];

const sectionLabel = (label: string) => (
  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{label}</span>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3 flex items-center justify-between">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{children}</span>
  </div>
);

export function MenuVideo({
  settings,
  onSettingsChange,
}: {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}) {
  const qp = settings.quickProps.video;
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [validationNotice, setValidationNotice] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentError, setAttachmentError] = useState('');
  const latestSettingsRef = useRef(settings);

  useEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    setIsAdvancedOpen(false);
  }, [qp.provider]);

  const setVideo = useCallback(
    (patch: Partial<typeof qp>, options?: { resetValidation?: boolean }) => {
      const shouldResetValidation = options?.resetValidation ?? true;
      
      // If provider is changing, also update the model to match
      if (patch.provider && patch.provider !== qp.provider) {
        patch.model = patch.provider === 'luma' ? 'ray-2' : 'veo3';
      }
      
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
    [onSettingsChange, qp.provider]
  );

  const handlePromptChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value.slice(0, 1500); // Reasonable limit for video prompts
      setVideo({ promptText: value });
    },
    [setVideo]
  );

  const handleImageSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Check file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setAttachmentError('Please select a JPG, PNG, or WebP image');
        return;
      }

      // Check file size (10MB limit for images)
      if (file.size > 10 * 1024 * 1024) {
        setAttachmentError('Image must be under 10MB');
        return;
      }

      // Read and store the image
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setVideo({ promptImage: e.target.result as string });
          setAttachmentError('');
        }
      };
      reader.readAsDataURL(file);

      // Reset input
      event.target.value = '';
    },
    [setVideo]
  );

  const handleRemoveImage = useCallback(() => {
    setVideo({ promptImage: undefined });
  }, [setVideo]);

  const setCardEnabled = useCardsStore((state) => state.setEnabled);
  
  const handleEnhancePrompt = useCallback(async () => {
    if (isEnhancing || !qp.promptText || qp.promptText.trim().length < 10) return;
    if (!qp.provider || qp.provider === 'auto') {
      setEnhanceError('Please select a provider before enhancing the prompt');
      return;
    }
    
    setIsEnhancing(true);
    setEnhanceError('');

    try {
      const { enhanced } = await enhanceVideoPrompt(
        qp.promptText,
        qp.provider as VideoProvider,
        {
          aspect: qp.aspect,
          cameraMovement: qp.cameraMovement,
          visualStyle: qp.visualStyle,
          lightingStyle: qp.lightingStyle,
          mood: qp.mood,
          colorGrading: qp.colorGrading,
          motionSpeed: qp.motionSpeed,
          subjectFocus: qp.subjectFocus,
          depthOfField: qp.depthOfField,
        },
        settings.quickProps.content.brief // Include campaign brief for context
      );
      
      setVideo({ promptText: enhanced });
    } catch (error) {
      console.error('Failed to enhance video prompt:', error);
      setEnhanceError(error instanceof Error ? error.message : 'Failed to enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  }, [isEnhancing, qp, settings.quickProps.content.brief, setVideo]);

  const handleValidate = useCallback(() => {
    const trimmedPrompt = qp.promptText.trim();
    if (!trimmedPrompt || trimmedPrompt.length < 15) {
      setValidationNotice('Prompt must be at least 15 characters');
      return;
    }
    setVideo({ validated: true, validatedAt: new Date().toISOString() }, { resetValidation: false });
    setValidationNotice('');
    // Enable Video card when validated
    setCardEnabled('video', true);
  }, [qp.promptText, setVideo, setCardEnabled]);

  const promptLength = qp.promptText.trim().length;
  const MIN_PROMPT_LENGTH = 15;
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
    ? 'Validated and ready to generate.'
    : isValidateDisabled
    ? `Prompt needs ${MIN_PROMPT_LENGTH - promptLength} more character${MIN_PROMPT_LENGTH - promptLength === 1 ? '' : 's'}`
    : 'Validate to lock in these settings for generation.';

  // Provider selection panel first
  if (!qp.provider || qp.provider === 'auto') {
    const providers = [
      { 
        id: 'runway' as VideoProvider, 
        label: 'Runway', 
        model: 'Veo-3',
        desc: 'High quality • 8s videos',
        features: ['Cinema-quality output', 'Advanced controls', 'Slow generation']
      },
      { 
        id: 'luma' as VideoProvider, 
        label: 'Luma', 
        model: 'Ray-2',
        desc: 'Fast generation • 5s-9s • HD quality',
        features: ['Quick results', '720p/1080p HD', 'Seamless loops', '5s or 9s videos']
      },
    ];

    return (
      <div className="relative z-[1] rounded-3xl border border-white/10 bg-white/[0.05] p-5 pb-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur lg:p-6 lg:pb-7">
        {sectionLabel('Choose Video Provider')}
        <div className="grid gap-4">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => setVideo({ provider: provider.id })}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:border-white/20 hover:bg-white/8"
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-semibold text-white">{provider.label}</div>
                    <div className="mt-0.5 text-sm text-white/70">{provider.model}</div>
                  </div>
                  <div className="text-sm text-white/50">{provider.desc}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {provider.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Full settings panel after provider selection
  const currentProvider = qp.provider;
  const providerInfo = {
    runway: {
      name: 'Runway',
      model: 'Veo-3',
      description: 'Cinema-quality video generation with advanced controls',
      capabilities: ['8-second videos', 'Multiple aspect ratios', 'Camera movements', 'Visual styles'],
    },
    luma: {
      name: 'Luma',
      model: 'Ray-2',
      description: 'Fast, creative video generation with Dream Machine',
      capabilities: ['5s or 9s duration', '720p or 1080p HD', 'Seamless loops', 'Quick generation'],
    },
  };

  const info = providerInfo[currentProvider] || providerInfo.runway;

  return (
    <div className="relative z-[1] rounded-3xl border border-white/10 bg-white/[0.05] p-5 pb-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur lg:p-6 lg:pb-7">
      <div className="space-y-4">
        {!isValidated && validationNotice && (
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {validationNotice}
          </div>
        )}

        {/* Provider Info Card */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{info.name}</span>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">{info.model}</span>
              </div>
              <p className="mt-1 text-xs text-white/60">{info.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {info.capabilities.map((cap, idx) => (
                  <span key={idx} className="text-xs text-white/40">
                    {cap}
                    {idx < info.capabilities.length - 1 && ' •'}
                  </span>
                ))}
            </div>
            </div>
            <button
              type="button"
              onClick={() => setVideo({ provider: 'auto' as VideoProvider })}
              className="rounded-md px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white/90"
            >
              Change
            </button>
          </div>
        </div>

        {/* Prompt Input */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            {sectionLabel('Prompt')}
            <span className="text-xs text-white/45">{promptLength} chars</span>
          </div>
          <div className="relative">
        <textarea
          ref={textareaRef}
              value={qp.promptText}
          onChange={handlePromptChange}
              placeholder="Describe the video you want to create..."
              className={cn(
                'min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 pr-24 text-sm text-white/90',
                'placeholder:text-white/40 transition-all',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/35'
              )}
            />
            {qp.promptImage && (
              <div className="absolute top-3 right-24 flex h-9 w-9 items-center justify-center">
                <div className="relative">
                  <img
                    src={qp.promptImage}
                    alt="Reference"
                    className="h-8 w-8 rounded-md object-cover ring-1 ring-white/20"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    <span className="text-xs">×</span>
                  </button>
                </div>
              </div>
            )}
            {/* Enhance button */}
            <button
              type="button"
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || !qp.promptText || qp.promptText.trim().length < 10}
              className={cn(
                'absolute top-3 right-12 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/35',
                (isEnhancing || !qp.promptText || qp.promptText.trim().length < 10) && 'cursor-not-allowed opacity-50'
              )}
              aria-label="Enhance prompt with AI"
              title="Enhance with AI"
            >
              {isEnhancing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
            </button>
            {/* Image upload button */}
            <button
              type="button"
              onClick={handleImageSelect}
              className={cn(
                'absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/35'
              )}
              aria-label="Add reference image"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageFile}
            />
        </div>
          {enhanceError && <p className="text-xs text-rose-300">{enhanceError}</p>}
          <p className={cn('text-xs', attachmentError ? 'text-amber-300' : 'text-white/45')}>
            {attachmentError || 'Optional: Add a reference image • Click wand icon to enhance with AI'}
          </p>
      </section>

        {/* Basic Settings */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="space-y-4">
            {/* Aspect Ratio */}
            <div>
              <Label>Aspect Ratio</Label>
              <div className="flex flex-wrap gap-2">
            {VIDEO_ASPECT_OPTIONS.map((aspect) => (
              <HintChip
                key={aspect}
                label={aspect}
                hint={VIDEO_ASPECT_HINTS[aspect]}
                active={qp.aspect === aspect}
                onClick={() => setVideo({ aspect })}
                size="small"
              />
            ))}
          </div>
        </div>

            {/* Runway-specific basic controls */}
            {qp.provider === 'runway' && (
              <>
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Watermark</span>
                  <div className="flex gap-1.5">
                    <HintChip
                      label="Off"
                      hint="Clean export"
                      active={!qp.watermark}
                      onClick={() => setVideo({ watermark: false })}
                      size="small"
                    />
                    <HintChip
                      label="On"
                      hint="Runway branded"
                      active={qp.watermark === true}
                      onClick={() => setVideo({ watermark: true })}
                      size="small"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Seed (optional)</span>
                  <input
                    type="number"
                    placeholder="Random"
                    value={qp.seed ?? ''}
                    onChange={(e) => setVideo({ seed: e.target.value ? Number(e.target.value) : undefined })}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-blue-500/50 focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* Luma-specific Settings */}
            {qp.provider === 'luma' && (
              <>
                {/* Duration */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Duration</span>
                  <div className="flex gap-1.5">
                    <HintChip
                      label="5s"
                      hint="Quick • Lower cost"
                      active={qp.lumaDuration === '5s'}
                      onClick={() => setVideo({ lumaDuration: '5s' })}
                      size="small"
                    />
                    <HintChip
                      label="9s"
                      hint="Extended • More detailed"
                      active={qp.lumaDuration === '9s'}
                      onClick={() => setVideo({ lumaDuration: '9s' })}
                      size="small"
                    />
                  </div>
                </div>

                {/* Resolution */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Resolution</span>
                  <div className="flex gap-1.5">
                    <HintChip
                      label="720p"
                      hint="Standard HD • Faster"
                      active={qp.lumaResolution === '720p'}
                      onClick={() => setVideo({ lumaResolution: '720p' })}
                      size="small"
                    />
                    <HintChip
                      label="1080p"
                      hint="Full HD • Premium"
                      active={qp.lumaResolution === '1080p'}
                      onClick={() => setVideo({ lumaResolution: '1080p' })}
                      size="small"
                    />
                  </div>
                </div>

                {/* Loop */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Loop</span>
          <div className="flex gap-1.5">
            <HintChip
                      label="Off"
                      hint="Standard video"
                      active={!qp.lumaLoop}
                      onClick={() => setVideo({ lumaLoop: false })}
              size="small"
            />
            <HintChip
                      label="Seamless"
                      hint="Perfect loop"
                      active={qp.lumaLoop === true}
                      onClick={() => setVideo({ lumaLoop: true })}
              size="small"
            />
          </div>
        </div>
              </>
            )}
        </div>
      </section>

        {/* Advanced Settings for Luma */}
        {qp.provider === 'luma' && (
          <section className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5"
            >
              <span className="text-sm font-medium text-white">Advanced Settings</span>
              {isAdvancedOpen ? (
                <ChevronUp className="h-4 w-4 text-white/50" />
              ) : (
                <ChevronDown className="h-4 w-4 text-white/50" />
              )}
            </button>

            {isAdvancedOpen && (
              <div className="border-t border-white/10 p-4 space-y-6">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <Label>Camera Movement</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {LUMA_CAMERA_MOVEMENTS.map((option) => (
                        <HintChip
                          key={option.value}
                          label={option.label}
                          hint={option.hint}
                          active={qp.lumaCameraMovement === option.value}
                          onClick={() => setVideo({ lumaCameraMovement: option.value as import('../types').LumaCameraMovement })}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Camera Angle</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {LUMA_CAMERA_ANGLES.map((option) => (
                        <HintChip
                          key={option.value}
                          label={option.label}
                          hint={option.hint}
                          active={qp.lumaCameraAngle === option.value}
                          onClick={() => setVideo({ lumaCameraAngle: option.value as import('../types').LumaCameraAngle })}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Camera Distance</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {LUMA_CAMERA_DISTANCES.map((option) => (
                        <HintChip
                          key={option.value}
                          label={option.label}
                          hint={option.hint}
                          active={qp.lumaCameraDistance === option.value}
                          onClick={() => setVideo({ lumaCameraDistance: option.value as import('../types').LumaCameraDistance })}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <Label>Visual Style</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {LUMA_STYLES.map((option) => (
                        <HintChip
                          key={option.value}
                          label={option.label}
                          hint={option.hint}
                          active={qp.lumaStyle === option.value}
                          onClick={() => setVideo({ lumaStyle: option.value as import('../types').LumaStyle })}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Lighting</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {LUMA_LIGHTING.map((option) => (
                        <HintChip
                          key={option.value}
                          label={option.label}
                          hint={option.hint}
                          active={qp.lumaLighting === option.value}
                          onClick={() => setVideo({ lumaLighting: option.value as import('../types').LumaLighting })}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Mood</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {LUMA_MOODS.map((option) => (
                        <HintChip
                          key={option.value}
                          label={option.label}
                          hint={option.hint}
                          active={qp.lumaMood === option.value}
                          onClick={() => setVideo({ lumaMood: option.value as import('../types').LumaMood })}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <Label>Motion Intensity</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {LUMA_MOTION_INTENSITY.map((option) => (
                        <HintChip
                          key={option.value}
                          label={option.label}
                          hint={option.hint}
                          active={qp.lumaMotionIntensity === option.value}
                          onClick={() => setVideo({ lumaMotionIntensity: option.value as import('../types').LumaMotionIntensity })}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Motion Speed</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {LUMA_MOTION_SPEED.map((option) => (
                        <HintChip
                          key={option.value}
                          label={option.label}
                          hint={option.hint}
                          active={qp.lumaMotionSpeed === option.value}
                          onClick={() => setVideo({ lumaMotionSpeed: option.value as import('../types').LumaMotionSpeed })}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Subject Movement</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {LUMA_SUBJECT_MOVEMENT.map((option) => (
                        <HintChip
                          key={option.value}
                          label={option.label}
                          hint={option.hint}
                          active={qp.lumaSubjectMovement === option.value}
                          onClick={() => setVideo({ lumaSubjectMovement: option.value as import('../types').LumaSubjectMovement })}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <Label>Quality</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {LUMA_QUALITY.map((option) => (
                        <HintChip
                          key={option.value}
                          label={option.label}
                          hint={option.hint}
                          active={qp.lumaQuality === option.value}
                          onClick={() => setVideo({ lumaQuality: option.value as import('../types').LumaQuality })}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Color Grading</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {LUMA_COLOR_GRADING.map((option) => (
                        <HintChip
                          key={option.value}
                          label={option.label}
                          hint={option.hint}
                          active={qp.lumaColorGrading === option.value}
                          onClick={() => setVideo({ lumaColorGrading: option.value as import('../types').LumaColorGrading })}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Film Look</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {LUMA_FILM_LOOK.map((option) => (
                        <HintChip
                          key={option.value}
                          label={option.label}
                          hint={option.hint}
                          active={qp.lumaFilmLook === option.value}
                          onClick={() => setVideo({ lumaFilmLook: option.value as import('../types').LumaFilmLook })}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <Label>Seed (optional)</Label>
                    <input
                      type="number"
                      placeholder="Random"
                      value={qp.lumaSeed || ''}
                      onChange={(e) => setVideo({ lumaSeed: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-blue-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <Label>Guidance Scale (1-20)</Label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      value={qp.lumaGuidanceScale || 7.5}
                      onChange={(e) => setVideo({ lumaGuidanceScale: Number(e.target.value) })}
                      className="w-full"
                    />
                    <div className="mt-1 text-xs text-white/50">
                      {(qp.lumaGuidanceScale || 7.5).toFixed(1)} - {qp.lumaGuidanceScale && qp.lumaGuidanceScale > 14 ? 'Very strong prompt adherence' : qp.lumaGuidanceScale && qp.lumaGuidanceScale > 10 ? 'Strong guidance' : 'Creative balance'}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Negative Prompt (What to avoid)</Label>
                  <textarea
                    placeholder="blurry, low quality, distorted..."
                    value={qp.lumaNegativePrompt || ''}
                    onChange={(e) => setVideo({ lumaNegativePrompt: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-blue-500/50 focus:outline-none"
                    rows={2}
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {qp.provider === 'runway' && (
          <section className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5"
            >
              <span className="text-sm font-medium text-white">Advanced Guidance</span>
              {isAdvancedOpen ? (
                <ChevronUp className="h-4 w-4 text-white/50" />
              ) : (
                <ChevronDown className="h-4 w-4 text-white/50" />
              )}
            </button>

            {isAdvancedOpen && (
              <div className="border-t border-white/10 p-4 space-y-3 text-sm text-white/70">
                <p className="text-white/80">
                  Runway Veo-3 exposes only the core controls inside Marketing Engine: prompt text, aspect ratio,
                  watermark toggle, and optional seed. Cinematography (camera paths, lighting, mood) is managed within
                  Runway itself.
                </p>
                <p>
                  Describe the desired shot in your prompt to steer results, or switch to Luma Ray-2 when you need
                  explicit sliders for all 19 advanced settings.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Validate Button */}
        <section className="pt-6">
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
    </div>
  );
}
