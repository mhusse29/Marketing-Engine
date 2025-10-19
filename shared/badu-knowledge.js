export const BADU_KNOWLEDGE = {
  company: {
    name: 'SINAIQ',
    assistantName: 'BADU',
    mission:
      'Deliver an always-on creative copilot that guides marketing teams through the Marketing Engine app.',
    voice:
      'Warm, encouraging, professional teammate who keeps conversations inspiring and grounded in facts.',
    model: 'gpt-5-chat-latest',
  },
  panels: {
    content: {
      purpose: 'Generate platform-ready marketing copy with clear strategy guidance.',
      personas: ['Generic', 'First-time', 'Warm lead', 'B2B DM', 'Returning'],
      tones: ['Friendly', 'Informative', 'Bold', 'Premium', 'Playful', 'Professional'],
      ctas: [
        'Learn more',
        'Get a demo',
        'Sign up',
        'Shop now',
        'Start free trial',
        'Book a call',
        'Download guide',
      ],
      languages: ['EN', 'AR', 'FR'],
      copyLengths: ['Compact', 'Standard', 'Detailed'],
      formats: ['Auto', 'FB/IG', 'LinkedIn', 'TikTok', 'X'],
      guidance: [
        'Match persona, tone, and CTA to the campaign objective.',
        'Keep responses platform-specific when advising on distribution.',
        'Explain why a recommendation fits the brief before listing steps.',
      ],
    },
    pictures: {
      purpose: 'Create on-brand imagery with provider-specific controls.',
      providers: {
        openai: {
          name: 'DALL-E 3',
          bestFor: ['Quick product visuals', 'Clean commercial imagery'],
          quality: ['standard', 'hd (forces 1:1)'],
          styles: ['vivid', 'natural'],
        },
        flux: {
          name: 'FLUX Pro 1.1',
          bestFor: ['Photorealistic people', 'Premium lifestyle scenes'],
          modes: ['standard', 'ultra'],
          standardControls: {
            guidance: '1.5 - 5 (default 3)',
            steps: '20 - 50 (default 40)',
            extras: ['prompt upsampling', 'raw output', 'output format jpeg/png/webp'],
          },
        },
        stability: {
          name: 'Stability SD 3.5',
          bestFor: ['Artistic concepts', 'Style experimentation'],
          models: ['large', 'large-turbo', 'medium'],
          controls: ['cfg scale 1 - 20 (default 7)', 'steps 20 - 60', 'style preset', 'negative prompt'],
        },
        ideogram: {
          name: 'Ideogram',
          bestFor: ['Typography', 'Posters and graphic design'],
          models: ['v2', 'v1', 'turbo'],
          options: ['magic prompt on/off', 'style type AUTO/GENERAL/REALISTIC/DESIGN/RENDER_3D/ANIME'],
        },
      },
      coreSettings: {
        styles: ['Product', 'Lifestyle', 'UGC', 'Abstract'],
        aspects: ['1:1', '4:5', '16:9', '2:3', '3:2', '7:9', '9:7'],
        advanced: [
          'Lock brand colors',
          'Backdrop: Clean / Gradient / Real-world',
          'Lighting: Soft / Hard / Neon',
          'Quality: High detail / Sharp / Minimal noise',
          'Composition, camera, mood, colour palette, finish, texture notes',
        ],
      },
      coaching: [
        'Clarify campaign goal before recommending provider.',
        'Map each suggestion to a real provider setting from the lists above.',
        'If a user asks for an unsupported option, steer them back to supported controls.',
      ],
    },
    video: {
      purpose: 'Guide users through Runway Veo-3 and Luma Ray-2 video creation.',
      shared: {
        aspects: ['9:16', '1:1', '16:9'],
        hooks: ['Pain-point', 'Bold claim', 'Question', 'Pattern interrupt'],
        ctas: ['Learn more', 'Get a demo', 'Sign up', 'Shop now', 'Start free trial', 'Book a call', 'Download guide'],
        validationRule: 'Prompt must be at least 15 characters before generation.',
      },
      providers: {
        runway: {
          model: 'Veo-3',
          strengths: ['Cinema-quality output', 'Provider-managed cinematography'],
          fixedDuration: '8 seconds',
          bestFor: ['Hero videos', 'Premium campaigns', 'Detailed cinematography'],
          controls: {
            prompt: 'Describe camera moves, lighting, subjects in free text',
            aspectRatio: ['9:16', '1:1', '16:9'],
            watermark: ['On', 'Off'],
            seed: 'Optional number for reproducibility',
          },
          note: 'Runway handles advanced cinematography internally. Use prompt detail or switch to Luma Ray-2 for manual parameter sliders.',
        },
        luma: {
          model: 'Ray-2',
          strengths: ['Fast generation', '5s or 9s duration', 'Seamless loops', 'Full HD 1080p option'],
          duration: ['5s', '9s'],
          resolution: ['720p', '1080p'],
          loop: ['Off', 'Seamless'],
          cameraMovement: ['Static', 'Pan Left', 'Pan Right', 'Zoom In', 'Zoom Out', 'Orbit Right'],
          cameraAngle: ['Low', 'Eye Level', 'High', 'Bird\'s Eye'],
          cameraDistance: ['Close-up', 'Medium', 'Wide', 'Extreme Wide'],
          style: ['Cinematic', 'Photorealistic', 'Artistic', 'Animated', 'Vintage'],
          lighting: ['Natural', 'Dramatic', 'Soft', 'Hard', 'Golden Hour', 'Blue Hour'],
          mood: ['Energetic', 'Calm', 'Mysterious', 'Joyful', 'Serious', 'Epic'],
          motionIntensity: ['Minimal', 'Moderate', 'High', 'Extreme'],
          motionSpeed: ['Slow Motion', 'Normal', 'Fast Motion'],
          subjectMovement: ['Static', 'Subtle', 'Active', 'Dynamic'],
          quality: ['Standard', 'High', 'Premium'],
          colorGrading: ['Natural', 'Warm', 'Cool', 'Dramatic', 'Desaturated'],
          filmLook: ['Digital', '35mm', '16mm', 'Vintage'],
          technical: ['Seed (number)', 'Guidance scale 1 - 20', 'Negative prompt text'],
          keyframes: ['frame0', 'frame1 (optional image or generation refs)'],
        },
      },
      coaching: [
        'Ask about campaign goal, platform, and desired mood before prescribing settings.',
        'Recommend Runway when precision and cinematography control matter most.',
        'Recommend Luma for fast iterations, loops, or flexible durations.',
        'If a user asks for an unsupported Luma parameter, explain the limitation and suggest prompt phrasing instead.',
      ],
    },
  },
  lumaGuards: {
    supportedParameters: {
      duration: ['5s', '9s'],
      resolution: ['720p', '1080p'],
      loop: ['Off', 'Seamless'],
      cameraMovement: ['Static', 'Pan Left', 'Pan Right', 'Zoom In', 'Zoom Out', 'Orbit Right'],
          cameraAngle: ['Low', 'Eye Level', 'High', 'Bird\'s Eye'],
      cameraDistance: ['Close-up', 'Medium', 'Wide', 'Extreme Wide'],
      style: ['Cinematic', 'Photorealistic', 'Artistic', 'Animated', 'Vintage'],
      lighting: ['Natural', 'Dramatic', 'Soft', 'Hard', 'Golden Hour', 'Blue Hour'],
      mood: ['Energetic', 'Calm', 'Mysterious', 'Joyful', 'Serious', 'Epic'],
      motionIntensity: ['Minimal', 'Moderate', 'High', 'Extreme'],
      motionSpeed: ['Slow Motion', 'Normal', 'Fast Motion'],
      subjectMovement: ['Static', 'Subtle', 'Active', 'Dynamic'],
      quality: ['Standard', 'High', 'Premium'],
      colorGrading: ['Natural', 'Warm', 'Cool', 'Dramatic', 'Desaturated'],
      filmLook: ['Digital', '35mm', '16mm', 'Vintage'],
      technical: ['Seed', 'Guidance Scale', 'Negative Prompt'],
    },
    disallowedPhrases: [
      'subject framing',
      'framing control',
      'framing option',
      'shot type',
      'medium shot',
      'wide shot setting',
      'close shot setting',
      'depth of field',
      'focus control',
      'focus distance',
      'aperture',
      'f-stop',
      'iso setting',
      'exposure control',
      'time of day setting',
      'dawn mode',
      'sunset setting',
      'weather control',
      'cloudy toggle',
      'rain mode',
      'snow mode',
    ],
  },
  guardrails: {
    fallbackOutsideScope:
      "I'm here to focus on SINAIQ's Marketing Engine settings for Content, Pictures, and Video panels. Let's stay within those controls.",
    uncertaintyMessage:
      'I do not have data beyond the documented app settings. Let me know which panel or option you want to explore.',
  },
};

export function buildBaduSettingsReference() {
  const { company, panels, lumaGuards } = BADU_KNOWLEDGE;

  const jsonReference = JSON.stringify(
    {
      company,
      panels,
      lumaSupported: lumaGuards.supportedParameters,
    },
    null,
    2
  );

  return jsonReference;
}
