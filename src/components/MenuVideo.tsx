import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';
import { ImageIcon, Wand2, Loader2, X, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '../lib/format';
import type {
  SettingsState,
  VideoAspect,
  VideoProvider,
  RunwayModel,
  GoogleVeoModel,
} from '../types';
import { useCardsStore } from '../store/useCardsStore';
import { HintChip } from './AppMenuBar';
import { enhanceVideoPrompt } from '../lib/videoPromptBuilder';
import { RUNWAY_MODEL_CONFIGS, GOOGLE_VEO_MODEL_CONFIGS } from '../store/settings';

// Aspect Ratios
const VIDEO_ASPECT_OPTIONS: VideoAspect[] = ['9:16', '1:1', '16:9'];
const VIDEO_ASPECT_HINTS: Record<VideoAspect, string> = {
  '9:16': 'Vertical - Reels, Shorts, TikTok',
  '1:1': 'Square - Instagram feed',
  '16:9': 'Landscape - YouTube, website',
};

// Google Veo only supports 16:9 and 9:16 (not 1:1)
const GOOGLE_VEO_ASPECT_OPTIONS: VideoAspect[] = ['9:16', '16:9'];

// Runway model options
const RUNWAY_MODEL_OPTIONS: { value: RunwayModel; label: string; hint: string }[] = [
  { value: 'gen4_turbo', label: 'Gen-4 Turbo', hint: 'Latest flagship • Fast & high quality' },
  { value: 'gen3a_turbo', label: 'Gen-3 Alpha', hint: 'Legacy • Reliable & well-tested' },
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
};

// Google Veo model options
const GOOGLE_VEO_MODEL_OPTIONS: { value: GoogleVeoModel; label: string; hint: string }[] = [
  { value: 'veo-3', label: 'Veo 3', hint: 'High quality • Best results' },
  { value: 'veo-3-fast', label: 'Veo 3 Fast', hint: 'Faster generation' },
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

  const setVideo = useCallback(
    (patch: Partial<typeof qp>, options?: { resetValidation?: boolean }) => {
      const shouldResetValidation = options?.resetValidation ?? true;
      
      // If provider is changing, also update the model to match
      if (patch.provider && patch.provider !== qp.provider) {
        if (patch.provider === 'luma') {
          patch.model = 'ray-2';
        } else if (patch.provider === 'google') {
          // Default to veo-3-fast for Google
          patch.model = 'veo-3-fast';
          patch.googleVeoModel = 'veo-3-fast';
          patch.googleVeoDuration = 8;
          patch.duration = 8;
          // Google Veo doesn't support 1:1 aspect ratio - reset to 16:9 if needed
          if (qp.aspect === '1:1') {
            patch.aspect = '16:9';
          }
          // Google supports 1 image - keep only the first if multiple
          const currentImages = qp.promptImages?.length ?? 0;
          if (currentImages > 1) {
            patch.promptImages = qp.promptImages?.slice(0, 1);
          }
        } else if (patch.provider === 'sora') {
          // Default to sora-2 for OpenAI Sora
          patch.soraModel = 'sora-2';
          patch.soraSize = '1280x720';
          // Sora is text-to-video only - clear any images
          patch.promptImages = [];
        } else {
          // Default to gen4_turbo for Runway
          patch.model = 'gen4_turbo';
          patch.runwayDuration = 5;
          patch.duration = 5;
        }
        
        // Handle image limits when switching providers
        const currentImages = qp.promptImages?.length ?? 0;
        if (patch.provider === 'runway' && currentImages > 1) {
          // Runway only supports 1 image - keep the first one
          patch.promptImages = qp.promptImages?.slice(0, 1);
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
    [onSettingsChange, qp.provider, qp.promptImages]
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
      id: 'google' as VideoProvider, 
      label: 'Google Veo 3', 
      model: 'Veo 3 / Veo 3 Fast',
      desc: 'Native audio • ~8s videos • 1 reference image',
      features: ['Native audio', '~8s fixed duration', '1 reference image', 'Best quality'],
      imageLimit: 1, // Single image for image-to-video
      imageNote: 'Add 1 reference image for image-to-video',
    },
    { 
      id: 'runway' as VideoProvider, 
      label: 'Runway', 
      model: 'Gen-4 Turbo / Gen-3 Alpha',
      desc: '1 reference image • 5s-10s videos',
      features: ['Gen-4 Turbo (fastest)', 'Gen-3 Alpha (reliable)', '1 reference image', 'Cinema quality'],
      imageLimit: 1, // Single image for image-to-video
      imageNote: 'Add 1 reference image for image-to-video',
    },
    { 
      id: 'luma' as VideoProvider, 
      label: 'Luma', 
      model: 'Ray-2',
      desc: '2 keyframe images • 5s-9s • HD',
      features: ['2 keyframe images', '720p/1080p HD', 'Seamless loops', '5s or 9s videos'],
      imageLimit: 2, // Two images via keyframes (frame0, frame1)
      imageNote: 'Add up to 2 images as start/end keyframes',
    },
    { 
      id: 'sora' as VideoProvider, 
      label: 'OpenAI Sora', 
      model: 'Sora 2 / Sora 2 Pro',
      desc: 'Up to 20s • HD/Standard quality',
      features: ['Up to 20 seconds', 'HD quality', 'Text-to-video', 'Professional grade'],
      imageLimit: 0, // Text-to-video only
      imageNote: 'Text-to-video generation',
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
  
  // Google Veo model config for display
  const googleVeoModelConfig = GOOGLE_VEO_MODEL_CONFIGS[qp.googleVeoModel || 'veo-3-fast'];

  const providerInfo: Record<VideoProvider, { name: string; model: string; description: string; capabilities: string[] }> = {
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
    google: {
      name: 'Google',
      model: googleVeoModelConfig.name,
      description: googleVeoModelConfig.description,
      capabilities: googleVeoModelConfig.features,
    },
    sora: {
      name: 'OpenAI Sora',
      model: qp.soraModel === 'sora-2-pro' ? 'Sora 2 Pro' : 'Sora 2',
      description: 'OpenAI video generation with professional quality',
      capabilities: ['Up to 20s duration', 'HD quality', 'Text-to-video', 'Professional grade'],
    },
    auto: {
      name: 'Select Provider',
      model: '—',
      description: 'Choose a video generation provider to continue',
      capabilities: [],
    },
  };

  const info = providerInfo[currentProvider] || providerInfo.runway;

  return (
    <div 
      className="relative z-[1] rounded-3xl p-4 lg:p-5"
      style={{
        background: 'linear-gradient(180deg, rgba(10, 14, 20, 0.92), rgba(8, 12, 18, 0.92))',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 12px 50px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(255, 255, 255, 0.04) inset',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {/* Validation Notice */}
      {!isValidated && validationNotice && (
        <div className="mb-3 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {validationNotice}
        </div>
      )}

      {/* Two Column Layout: Settings Left, Prompt Right */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        
        {/* LEFT COLUMN: Settings */}
        <div className="space-y-3">
          {/* Provider Header - Compact */}
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{info.name}</span>
              <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300">{info.model}</span>
            </div>
            <button
              type="button"
              onClick={() => setVideo({ provider: 'auto' as VideoProvider })}
              className="text-[10px] text-white/50 hover:text-white/80"
            >
              Change
            </button>
          </div>

          {/* Settings Card - Compact */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
            {/* Aspect Ratio - Hidden for Sora (uses Size instead), Google Veo only supports 16:9 and 9:16 */}
            {qp.provider !== 'sora' && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Aspect</span>
                <div className="flex gap-1">
                  {(qp.provider === 'google' ? GOOGLE_VEO_ASPECT_OPTIONS : VIDEO_ASPECT_OPTIONS).map((aspect) => (
                    <HintChip
                      key={aspect}
                      label={aspect}
                      hint={VIDEO_ASPECT_HINTS[aspect]}
                      active={qp.aspect === aspect}
                      onClick={() => setVideo({ aspect: qp.aspect === aspect ? undefined : aspect })}
                      size="small"
                    />
                  ))}
                </div>
              </div>
            )}

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
                          // Toggle off if already selected
                          if (currentRunwayModel === option.value) {
                            setVideo({ model: undefined, runwayDuration: undefined, duration: undefined });
                            return;
                          }
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
                        onClick={() => {
                          const currentValue = qp.runwayDuration || qp.duration;
                          if (currentValue === option.value) {
                            setVideo({ runwayDuration: undefined, duration: undefined });
                          } else {
                            setVideo({ runwayDuration: option.value, duration: option.value as 5 | 8 | 10 });
                          }
                        }}
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

            {/* Google Veo-specific Settings */}
            {qp.provider === 'google' && (
              <>
                {/* Model Selection */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Model</span>
                  <div className="flex gap-1.5">
                    {GOOGLE_VEO_MODEL_OPTIONS.map((option) => (
                      <HintChip
                        key={option.value}
                        label={option.label}
                        hint={option.hint}
                        active={qp.googleVeoModel === option.value}
                        onClick={() => {
                          if (qp.googleVeoModel === option.value) {
                            setVideo({ googleVeoModel: undefined, model: undefined });
                          } else {
                            setVideo({ googleVeoModel: option.value, model: option.value });
                          }
                        }}
                        size="small"
                      />
                    ))}
                  </div>
                </div>

                {/* Info about fixed duration and audio */}
                <div className="mt-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-[10px] text-blue-400/70">
                    ~8s video • Native audio included
                  </p>
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
                      onClick={() => setVideo({ lumaDuration: qp.lumaDuration === '5s' ? undefined : '5s' })}
                      size="small"
                    />
                    <HintChip
                      label="9s"
                      hint="Extended • More detailed"
                      active={qp.lumaDuration === '9s'}
                      onClick={() => setVideo({ lumaDuration: qp.lumaDuration === '9s' ? undefined : '9s' })}
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
                      onClick={() => setVideo({ lumaResolution: qp.lumaResolution === '720p' ? undefined : '720p' })}
                      size="small"
                    />
                    <HintChip
                      label="1080p"
                      hint="Full HD • Premium"
                      active={qp.lumaResolution === '1080p'}
                      onClick={() => setVideo({ lumaResolution: qp.lumaResolution === '1080p' ? undefined : '1080p' })}
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
                      active={qp.lumaLoop === false}
                      onClick={() => setVideo({ lumaLoop: qp.lumaLoop === false ? undefined : false })}
                      size="small"
                    />
                    <HintChip
                      label="Seamless"
                      hint="Perfect loop"
                      active={qp.lumaLoop === true}
                      onClick={() => setVideo({ lumaLoop: qp.lumaLoop === true ? undefined : true })}
                      size="small"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Sora-specific Settings */}
            {qp.provider === 'sora' && (
              <>
                {/* Model Selection */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Model</span>
                  <div className="flex gap-1.5">
                    <HintChip
                      label="Sora 2"
                      hint="Fast • 720p"
                      active={qp.soraModel === 'sora-2' || !qp.soraModel}
                      onClick={() => {
                        // Reset size to 720p if switching from pro with HD size selected
                        const needsSizeReset = qp.soraSize === '1024x1792' || qp.soraSize === '1792x1024';
                        setVideo({ 
                          soraModel: qp.soraModel === 'sora-2' ? undefined : 'sora-2',
                          ...(needsSizeReset ? { soraSize: '1280x720' } : {})
                        });
                      }}
                      size="small"
                    />
                    <HintChip
                      label="Sora 2 Pro"
                      hint="Premium quality"
                      active={qp.soraModel === 'sora-2-pro'}
                      onClick={() => setVideo({ soraModel: qp.soraModel === 'sora-2-pro' ? undefined : 'sora-2-pro' })}
                      size="small"
                    />
                  </div>
                </div>

                {/* Size/Aspect - sora-2 only supports 720p, sora-2-pro supports HD sizes */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Size</span>
                  <div className="flex gap-1.5">
                    <HintChip
                      label="720p"
                      hint="Landscape"
                      active={qp.soraSize === '1280x720' || !qp.soraSize}
                      onClick={() => setVideo({ soraSize: qp.soraSize === '1280x720' ? undefined : '1280x720', aspect: '16:9' })}
                      size="small"
                    />
                    <HintChip
                      label="Portrait"
                      hint="9:16"
                      active={qp.soraSize === '720x1280'}
                      onClick={() => setVideo({ soraSize: qp.soraSize === '720x1280' ? undefined : '720x1280', aspect: '9:16' })}
                      size="small"
                    />
                    {/* HD sizes only available for sora-2-pro */}
                    {qp.soraModel === 'sora-2-pro' && (
                      <>
                        <HintChip
                          label="Tall HD"
                          hint="9:16"
                          active={qp.soraSize === '1024x1792'}
                          onClick={() => setVideo({ soraSize: qp.soraSize === '1024x1792' ? undefined : '1024x1792', aspect: '9:16' })}
                          size="small"
                        />
                        <HintChip
                          label="Wide HD"
                          hint="16:9"
                          active={qp.soraSize === '1792x1024'}
                          onClick={() => setVideo({ soraSize: qp.soraSize === '1792x1024' ? undefined : '1792x1024', aspect: '16:9' })}
                          size="small"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="mt-3 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-[10px] text-purple-400/70">
                    Text-to-video • No reference images
                  </p>
                </div>
              </>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Prompt */}
        <div className="space-y-3">
          {/* Prompt Input */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Prompt</span>
              <span className="text-[10px] text-white/40">{promptLength} chars</span>
            </div>
            <textarea
              ref={textareaRef}
              value={qp.promptText}
              onChange={handlePromptChange}
              placeholder="Describe the video you want to create..."
              className={cn(
                'min-h-[180px] w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 pr-20 text-sm text-white/90',
                'placeholder:text-white/40 transition-all',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/35'
              )}
            />
            {/* Action buttons */}
            <div className="absolute top-10 right-2 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !qp.promptText || qp.promptText.trim().length < 10}
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white',
                  (isEnhancing || !qp.promptText || qp.promptText.trim().length < 10) && 'cursor-not-allowed opacity-50'
                )}
                title="Enhance with AI"
              >
                {isEnhancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              </button>
              {imageLimit > 0 && (
                <button
                  type="button"
                  onClick={handleImageSelect}
                  disabled={!canAddMoreImages}
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white',
                    currentImageCount > 0 && 'border-blue-500/40 bg-blue-500/10 text-blue-400',
                    !canAddMoreImages && 'cursor-not-allowed opacity-50'
                  )}
                  title={currentProviderInfo?.imageNote}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
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
          
          {enhanceError && <p className="text-xs text-rose-300">{enhanceError}</p>}
          
          {/* Image hint & thumbnails */}
          <p className={cn('text-[10px]', attachmentError ? 'text-rose-300' : currentImageCount > 0 ? 'text-emerald-400' : 'text-white/40')}>
            {attachmentError || (
              currentImageCount > 0
                ? imageLimit === 2
                  ? `✓ ${currentImageCount}/${imageLimit} keyframes (Luma)`
                  : `✓ 1 reference image added`
                : currentProviderInfo?.imageNote || 'Add reference image'
            )}
          </p>

          {/* Image Thumbnails */}
          {currentImageCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {qp.promptImages?.map((img, idx) => (
                <div key={idx} className="group relative w-14 h-14 overflow-hidden rounded-lg border border-white/20 bg-black/40 cursor-pointer hover:border-blue-400/50 transition-all">
                  <div className="h-full w-full flex items-center justify-center" onClick={() => setExpandedImageIndex(idx)}>
                    <img src={img} alt={`Ref ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveImage(idx); }}
                    className="absolute right-0.5 top-0.5 z-10 flex h-4 w-4 items-center justify-center rounded bg-black/80 text-white opacity-0 hover:bg-red-600 group-hover:opacity-100"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center pointer-events-none">
                    <Maximize2 className="w-3 h-3 text-white opacity-0 group-hover:opacity-70" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full-width Validate Button */}
      <div className="mt-4">
        <button
          type="button"
          onClick={handleValidate}
          disabled={isValidateDisabled}
          className={cn(
            validateButtonClass,
            'w-full'
          )}
        >
          {isValidated ? 'Validated ✓' : 'Validate Settings'}
        </button>
        <p className={cn('mt-2 text-[10px] text-center', isValidated ? 'text-emerald-400' : 'text-white/40')}>
          {isValidated && qp.validatedAt
            ? `Locked ${new Date(qp.validatedAt).toLocaleTimeString()}`
            : validationHint}
        </p>
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
