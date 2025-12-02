import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';
import { ChevronDown, ChevronUp, ImageIcon, Wand2, Loader2, X, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '../lib/format';
import type {
  SettingsState,
  VideoAspect,
  VideoProvider,
  RunwayModel,
} from '../types';
import { useCardsStore } from '../store/useCardsStore';
import { HintChip } from './AppMenuBar';
import { enhanceVideoPrompt } from '../lib/videoPromptBuilder';
import { RUNWAY_MODEL_CONFIGS } from '../store/settings';

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

// Runway model options
const RUNWAY_MODEL_OPTIONS: { value: RunwayModel; label: string; hint: string }[] = [
  { value: 'gen4_turbo', label: 'Gen-4 Turbo', hint: 'Latest flagship • Fast & high quality' },
  { value: 'gen3a_turbo', label: 'Gen-3 Alpha', hint: 'Legacy • Reliable & well-tested' },
  { value: 'veo3', label: 'Veo 3', hint: 'Google AI • Fixed 8s duration' },
];

// Runway duration options per model
const RUNWAY_DURATION_OPTIONS: Record<RunwayModel, { value: number; label: string; hint: string }[]> = {
  gen4_turbo: [
    { value: 5, label: '5s', hint: 'Quick • Lower cost' },
    { value: 10, label: '10s', hint: 'Extended • More detail' },
  ],
  gen3a_turbo: [
    { value: 5, label: '5s', hint: 'Quick • Lower cost' },
    { value: 10, label: '10s', hint: 'Extended • More detail' },
  ],
  veo3: [
    { value: 8, label: '8s', hint: 'Fixed duration' },
  ],
};

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
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);
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
        if (patch.provider === 'luma') {
          patch.model = 'ray-2';
        } else {
          // Default to gen4_turbo for Runway
          patch.model = 'gen4_turbo';
          patch.runwayDuration = 5;
          patch.duration = 5;
        }
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

      // Get provider-specific limit
      const currentImages = qp.promptImages || [];
      const limit = qp.provider === 'runway' ? 1 : 5; // Runway: 1, Luma: 5
      
      if (currentImages.length >= limit) {
        setAttachmentError(`Maximum ${limit} image${limit > 1 ? 's' : ''} allowed for ${qp.provider === 'runway' ? 'Runway' : 'Luma'}`);
        return;
      }

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

      // Read and add to array
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const newImages = [...currentImages, e.target.result as string];
          setVideo({ promptImages: newImages });
          setAttachmentError('');
        }
      };
      reader.readAsDataURL(file);

      // Reset input
      event.target.value = '';
    },
    [setVideo, qp.promptImages, qp.provider]
  );

  const handleRemoveImage = useCallback((index: number) => {
    const currentImages = qp.promptImages || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    setVideo({ promptImages: newImages.length > 0 ? newImages : undefined });
    setAttachmentError('');
  }, [setVideo, qp.promptImages]);

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

  // Provider configuration with image limits
  const providers = [
    { 
      id: 'runway' as VideoProvider, 
      label: 'Runway', 
      model: 'Gen-4 Turbo / Gen-3 Alpha / Veo-3',
      desc: 'Multiple models • 5s-10s videos',
      features: ['Gen-4 Turbo (fastest)', 'Gen-3 Alpha (reliable)', 'Veo-3 (Google AI)', 'Cinema quality'],
      imageLimit: 1 // Single image for image-to-video
    },
    { 
      id: 'luma' as VideoProvider, 
      label: 'Luma', 
      model: 'Ray-2',
      desc: 'Fast generation • 5s-9s • HD quality',
      features: ['Quick results', '720p/1080p HD', 'Seamless loops', '5s or 9s videos'],
      imageLimit: 2 // Two images via keyframes (frame0, frame1)
    },
  ];

  const currentImageCount = qp.promptImages?.length ?? 0;
  const currentProviderInfo = providers.find(p => p.id === qp.provider);
  const imageLimit = currentProviderInfo?.imageLimit ?? 0;
  const canAddMoreImages = currentImageCount < imageLimit;

  // Provider selection panel first
  if (!qp.provider || qp.provider === 'auto') {

    return (
      <div 
        className="relative z-[1] rounded-3xl p-5 pb-6 lg:p-6 lg:pb-7"
        style={{
          background: 'linear-gradient(180deg, rgba(10, 14, 20, 0.92), rgba(8, 12, 18, 0.92))',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 12px 50px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(255, 255, 255, 0.04) inset',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
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
  
  // Get current Runway model info
  const currentRunwayModel = (qp.model as RunwayModel) || 'gen4_turbo';
  const runwayModelConfig = RUNWAY_MODEL_CONFIGS[currentRunwayModel] || RUNWAY_MODEL_CONFIGS.gen4_turbo;
  
  const providerInfo = {
    runway: {
      name: 'Runway',
      model: runwayModelConfig.name,
      description: runwayModelConfig.description,
      capabilities: runwayModelConfig.features,
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
    <div 
      className="relative z-[1] rounded-3xl p-5 pb-6 lg:p-6 lg:pb-7"
      style={{
        background: 'linear-gradient(180deg, rgba(10, 14, 20, 0.92), rgba(8, 12, 18, 0.92))',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 12px 50px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(255, 255, 255, 0.04) inset',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
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
              disabled={!canAddMoreImages}
              className={cn(
                'absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/35',
                currentImageCount > 0 && 'border-blue-500/40 bg-blue-500/10 text-blue-400',
                !canAddMoreImages && 'cursor-not-allowed opacity-50'
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
          
          {/* Provider-specific messaging */}
          <div className="space-y-1">
            <p className={cn('text-xs', attachmentError ? 'text-rose-300' : currentImageCount > 0 ? 'text-emerald-400' : 'text-white/45')}>
              {attachmentError || (
                currentImageCount > 0
                  ? imageLimit === 1
                    ? '✓ 1 reference image added'
                    : `✓ ${currentImageCount} of ${imageLimit} reference images added`
                  : imageLimit === 1
                  ? 'Add 1 reference image for image-to-video (Runway)'
                  : `Add up to 2 reference images as start/end frames (Luma keyframes)`
              )}
            </p>
            <p className="text-xs text-white/40">Click wand icon to enhance prompt with AI</p>
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
                  <div className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 py-0.5 text-[9px] text-white font-medium pointer-events-none">
                    {idx + 1}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                    <Maximize2 className="w-3 h-3 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
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
                {/* Model Selection */}
                <div className="pt-3 border-t border-white/5">
                  <Label>Model</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {RUNWAY_MODEL_OPTIONS.map((option) => (
                      <HintChip
                        key={option.value}
                        label={option.label}
                        hint={option.hint}
                        active={currentRunwayModel === option.value}
                        onClick={() => {
                          // When changing model, also update duration to valid value for new model
                          const newModelConfig = RUNWAY_MODEL_CONFIGS[option.value];
                          const currentDuration = qp.runwayDuration || qp.duration;
                          const validDuration = newModelConfig.durations.includes(currentDuration)
                            ? currentDuration
                            : newModelConfig.durations[0];
                          setVideo({ 
                            model: option.value, 
                            runwayDuration: validDuration,
                            duration: validDuration as 5 | 8 | 10,
                          });
                        }}
                        size="small"
                      />
                    ))}
                  </div>
                </div>

                {/* Duration (model-specific) */}
                <div className="flex items-center justify-between pt-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Duration</span>
                  <div className="flex gap-1.5">
                    {RUNWAY_DURATION_OPTIONS[currentRunwayModel].map((option) => (
                      <HintChip
                        key={option.value}
                        label={option.label}
                        hint={option.hint}
                        active={(qp.runwayDuration || qp.duration) === option.value}
                        onClick={() => setVideo({ 
                          runwayDuration: option.value,
                          duration: option.value as 5 | 8 | 10,
                        })}
                        size="small"
                      />
                    ))}
                  </div>
                </div>

                {/* Watermark */}
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
  );
}
