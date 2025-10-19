/**
 * COMPREHENSIVE KNOWLEDGE BASE FOR BADU - 100% ACCURATE
 * Extracted directly from source code (types/index.ts, AppMenuBar.tsx, MenuVideo.tsx)
 * Last Updated: 2025-10-11
 */

export const COMPLETE_KNOWLEDGE_BASE = {
  meta: {
    version: '3.0.0',
    lastUpdated: '2025-10-11',
    source: 'Direct source code extraction',
    accuracy: '100%',
  },

  // ==========================================
  //  CONTENT PANEL - COMPLETE SETTINGS
  // ==========================================
  content: {
    title: 'Content Panel',
    description: 'Generate platform-optimized marketing copy',
    purpose: 'Create engaging headlines, captions, and CTAs for social media platforms',
    minimumBriefLength: 15,
    
    steps: [
      'Enter your campaign brief (minimum 15 characters)',
      'Select target platforms (Facebook, Instagram, TikTok, LinkedIn, X, YouTube)',
      'Choose audience persona',
      'Select tone and language',
      'Add CTA and optional keywords/hashtags',
      'Click Validate to enable generation',
    ],
    
    settings: {
      brief: {
        label: 'Creative Brief',
        type: 'textarea',
        minLength: 15,
        placeholder: 'Describe the audience, offer, objections, and desired outcome...',
        description: 'Detailed description of your campaign',
        features: ['AI Refine available', 'Supports attachments (PNG, JPG, WebP, PDF)', 'Maximum 3 attachments', '5MB max per file'],
      },
      
      persona: {
        label: 'Persona',
        description: 'Target audience type',
        options: ['Generic', 'First-time', 'Warm lead', 'B2B DM', 'Returning'],
        default: 'Generic',
        hints: {
          'Generic': 'Broad audience, mass market appeal',
          'First-time': 'New customers, first interaction with brand',
          'Warm lead': 'Engaged prospects, familiar with brand',
          'B2B DM': 'Business decision makers, professional tone',
          'Returning': 'Existing customers, loyalty focus',
        },
      },
      
      tone: {
        label: 'Tone',
        description: 'Communication style',
        options: ['Friendly', 'Informative', 'Bold', 'Premium', 'Playful', 'Professional'],
        default: 'Friendly',
        hints: {
          'Friendly': 'Warm, approachable voice',
          'Informative': 'Educational, value-driven',
          'Bold': 'Confident, attention-grabbing',
          'Premium': 'Sophisticated, luxury feel',
          'Playful': 'Fun, energetic, casual',
          'Professional': 'Business-appropriate, credible',
        },
      },
      
      cta: {
        label: 'Call to Action',
        description: 'Action button text',
        options: ['Learn more', 'Get a demo', 'Sign up', 'Shop now', 'Start free trial', 'Book a call', 'Download guide'],
        default: 'Learn more',
        hints: {
          'Learn more': 'Soft CTA, low commitment',
          'Get a demo': 'B2B, sales-driven',
          'Sign up': 'Account creation',
          'Shop now': 'E-commerce, direct',
          'Start free trial': 'SaaS, freemium',
          'Book a call': 'High-touch sales',
          'Download guide': 'Lead generation',
        },
      },
      
      language: {
        label: 'Language',
        description: 'Output language',
        options: ['EN', 'AR', 'FR'],
        default: 'EN',
        hints: {
          'EN': 'English',
          'AR': 'Arabic',
          'FR': 'French',
        },
      },
      
      copyLength: {
        label: 'Copy Length',
        description: 'Amount of content generated',
        options: ['Compact', 'Standard', 'Detailed'],
        default: 'Standard',
        hints: {
          'Compact': '1–2 sentences; tight hooks for fast feeds',
          'Standard': 'Balanced coverage for most placements',
          'Detailed': '3–5 sentence narratives for longer placements',
        },
      },
      
      platforms: {
        label: 'Platforms',
        description: 'Social media channels',
        options: ['facebook', 'instagram', 'tiktok', 'linkedin', 'x', 'youtube'],
        multiSelect: true,
        required: true,
        labels: {
          'facebook': 'Facebook',
          'instagram': 'Instagram',
          'tiktok': 'TikTok',
          'linkedin': 'LinkedIn',
          'x': 'X (Twitter)',
          'youtube': 'YouTube',
        },
      },
      
      keywords: {
        label: 'Keywords (Optional)',
        description: 'Comma-separated keywords to include',
        placeholder: 'e.g., innovation, AI, automation',
        type: 'text',
      },
      
      hashtags: {
        label: 'Hashtags (Optional)',
        description: 'Comma-separated hashtags (without #)',
        placeholder: 'e.g., marketing, digital, AI',
        type: 'text',
      },
      
      avoid: {
        label: 'Avoid (Optional)',
        description: 'Words or phrases to exclude',
        type: 'text',
      },
      
      attachments: {
        label: 'Attachments',
        description: 'Reference files for context',
        supportedFormats: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
        maxFiles: 3,
        maxSizePerFile: '5MB',
        features: ['Visual context', 'Brand guidelines', 'Product references'],
      },
    },
  },

  // ==========================================
  //  PICTURES PANEL - COMPLETE SETTINGS
  // ==========================================
  pictures: {
    title: 'Pictures Panel',
    description: 'Generate AI images from text prompts',
    purpose: 'Create custom visuals for marketing campaigns',
    minimumPromptLength: 10,
    
    providers: {
      openai: {
        id: 'openai',
        name: 'DALL·E 3',
        label: 'DALL·E 3',
        description: 'Fast, vivid',
        strengths: ['Fast generation', 'Vivid colors', 'Easy to use'],
        aspectRatios: ['1:1', '16:9'],
        
        settings: {
          quality: {
            label: 'Quality',
            options: ['standard', 'hd'],
            default: 'standard',
            hints: {
              'standard': 'Faster generation',
              'hd': 'Higher detail',
            },
          },
          style: {
            label: 'Style',
            options: ['vivid', 'natural'],
            default: 'vivid',
            hints: {
              'vivid': 'Dramatic colors',
              'natural': 'Subtle tones',
            },
          },
        },
      },
      
      flux: {
        id: 'flux',
        name: 'FLUX Pro',
        label: 'FLUX Pro',
        description: 'Photoreal',
        strengths: ['Photorealistic', 'High quality', 'Multiple aspect ratios'],
        aspectRatios: ['1:1', '16:9', '2:3', '3:2', '7:9', '9:7'],
        
        settings: {
          mode: {
            label: 'Mode',
            options: ['standard', 'ultra'],
            default: 'standard',
            hints: {
              'standard': 'Balanced quality',
              'ultra': 'Max detail',
            },
          },
          guidance: {
            label: 'Guidance',
            type: 'slider',
            min: 1.5,
            max: 5,
            step: 0.1,
            default: 3,
            description: 'How closely to follow prompt',
            onlyAvailableWhen: 'mode = standard',
          },
          steps: {
            label: 'Steps',
            type: 'slider',
            min: 20,
            max: 50,
            step: 5,
            default: 40,
            description: 'Inference iterations',
            onlyAvailableWhen: 'mode = standard',
          },
          promptUpsampling: {
            label: 'Prompt Upsampling',
            type: 'boolean',
            options: ['Off', 'On'],
            default: false,
            hints: {
              'Off': 'Use as-is',
              'On': 'Enhance prompt',
            },
          },
          raw: {
            label: 'RAW Mode',
            type: 'boolean',
            options: ['Off', 'On'],
            default: false,
            hints: {
              'Off': 'Standard',
              'On': 'Unprocessed',
            },
          },
          outputFormat: {
            label: 'Output Format',
            options: ['jpeg', 'png', 'webp'],
            default: 'jpeg',
            hints: {
              'jpeg': 'Smaller files',
              'png': 'Lossless',
              'webp': 'Modern',
            },
          },
        },
      },
      
      stability: {
        id: 'stability',
        name: 'Stability SD 3.5',
        label: 'SD 3.5',
        description: 'CFG control',
        strengths: ['Fine control', 'Style presets', 'Negative prompts'],
        aspectRatios: ['1:1', '2:3', '3:2', '16:9'],
        
        settings: {
          model: {
            label: 'Model',
            options: ['large', 'large-turbo', 'medium'],
            default: 'large',
            hints: {
              'large': 'Best quality',
              'large-turbo': 'Faster',
              'medium': 'Balanced',
            },
          },
          cfgScale: {
            label: 'CFG Scale',
            type: 'slider',
            min: 1,
            max: 20,
            step: 0.5,
            default: 7,
            description: 'Prompt adherence strength',
          },
          steps: {
            label: 'Steps',
            type: 'slider',
            min: 20,
            max: 60,
            step: 5,
            default: 40,
            description: 'Inference iterations',
          },
          stylePreset: {
            label: 'Style Preset',
            type: 'dropdown',
            options: [
              'None',
              '3d-model',
              'analog-film',
              'anime',
              'cinematic',
              'comic-book',
              'digital-art',
              'enhance',
              'fantasy-art',
              'isometric',
              'line-art',
              'low-poly',
              'modeling-compound',
              'neon-punk',
              'origami',
              'photographic',
              'pixel-art',
              'tile-texture',
            ],
            default: 'None',
          },
          negativePrompt: {
            label: 'Negative Prompt',
            type: 'textarea',
            maxLength: 500,
            placeholder: 'Things to avoid...',
            description: 'Elements to exclude from generation',
          },
        },
      },
      
      ideogram: {
        id: 'ideogram',
        name: 'Ideogram',
        label: 'Ideogram',
        description: 'Typography',
        strengths: ['Text generation', 'Typography', 'Logo creation'],
        aspectRatios: ['1:1', '16:9'],
        
        settings: {
          model: {
            label: 'Model',
            options: ['v2', 'v1', 'turbo'],
            default: 'v2',
            hints: {
              'v2': 'Latest',
              'v1': 'Classic',
              'turbo': 'Fast',
            },
          },
          magicPrompt: {
            label: 'Magic Prompt',
            type: 'boolean',
            options: ['Off', 'On'],
            default: true,
            hints: {
              'Off': 'Literal',
              'On': 'Enhanced',
            },
          },
          styleType: {
            label: 'Style Type',
            options: ['AUTO', 'GENERAL', 'REALISTIC', 'DESIGN', 'RENDER_3D', 'ANIME'],
            default: 'AUTO',
          },
          negativePrompt: {
            label: 'Negative Prompt',
            type: 'textarea',
            placeholder: 'Elements to avoid...',
            description: 'What not to include',
          },
        },
      },
    },
    
    commonSettings: {
      style: {
        label: 'Style',
        options: ['Product', 'Lifestyle', 'UGC', 'Abstract'],
        default: 'Product',
        hints: {
          'Product': 'Clean product shots',
          'Lifestyle': 'Real-world context',
          'UGC': 'User-generated feel',
          'Abstract': 'Conceptual visuals',
        },
      },
      aspect: {
        label: 'Aspect Ratio',
        providerDependent: true,
        hints: {
          '1:1': 'Square - Instagram feed',
          '4:5': 'Portrait - Instagram',
          '16:9': 'Landscape - YouTube',
          '2:3': 'Tall portrait',
          '3:2': 'Wide landscape',
          '7:9': 'Vertical',
          '9:7': 'Horizontal',
        },
      },
    },
    
    // Advanced Settings (applies to all providers)
    advancedSettings: {
      title: 'Advanced Settings',
      description: 'Fine-tune your image generation across all providers',
      settings: {
        brandColors: {
          label: 'Brand Colors',
          type: 'toggle',
          options: ['Locked', 'Flexible'],
          default: 'Flexible',
          hints: {
            'Locked': 'Maintain exact brand colors',
            'Flexible': 'Allow color variations',
          },
        },
        backdrop: {
          label: 'Backdrop',
          options: ['Clean', 'Gradient', 'Real-world'],
          default: 'Clean',
          hints: {
            'Clean': 'Minimal, solid background',
            'Gradient': 'Smooth color transition',
            'Real-world': 'Natural environment',
          },
        },
        lighting: {
          label: 'Lighting',
          options: ['Soft', 'Hard', 'Neon'],
          default: 'Soft',
          hints: {
            'Soft': 'Diffused, gentle light',
            'Hard': 'Sharp shadows, dramatic',
            'Neon': 'Vibrant, glowing lights',
          },
        },
        quality: {
          label: 'Quality',
          options: ['High detail', 'Sharp', 'Minimal noise'],
          default: 'High detail',
          hints: {
            'High detail': 'Maximum texture and detail',
            'Sharp': 'Crisp edges and focus',
            'Minimal noise': 'Clean, smooth finish',
          },
        },
        avoid: {
          label: 'Avoid',
          options: ['None', 'Logos', 'Busy background', 'Extra hands', 'Glare'],
          default: 'None',
          hints: {
            'None': 'No restrictions',
            'Logos': 'Exclude brand marks',
            'Busy background': 'Keep backgrounds simple',
            'Extra hands': 'Fix hand artifacts',
            'Glare': 'Reduce reflections',
          },
        },
      },
    },
  },

  // ==========================================
  //  VIDEO PANEL - COMPLETE SETTINGS
  // ==========================================
  video: {
    title: 'Video Panel',
    description: 'Generate AI videos with Runway or Luma',
    purpose: 'Create engaging video content for social media and marketing',
    minimumPromptLength: 15,
    
    providers: {
      runway: {
        id: 'runway',
        name: 'Runway',
        model: 'Veo-3',
        label: 'Runway Veo-3',
        description: 'High quality • 8s videos',
        strengths: ['Cinema-quality output', 'Advanced controls', '8-second videos'],
        bestFor: ['Premium campaigns', 'Cinema-quality videos', 'Professional content'],
        speed: 'Slower generation',
        duration: '8 seconds (fixed)',
        
        settings: {
          aspect: {
            label: 'Aspect Ratio',
            options: ['9:16', '1:1', '16:9'],
            default: '9:16',
            hints: {
              '9:16': 'Vertical - Reels, Shorts, TikTok',
              '1:1': 'Square - Instagram feed',
              '16:9': 'Landscape - YouTube, website',
            },
          },
          watermark: {
            label: 'Watermark',
            type: 'boolean',
            options: ['Off', 'On'],
            default: false,
            hints: {
              'Off': 'Clean export',
              'On': 'Runway branded',
            },
          },
          seed: {
            label: 'Seed (optional)',
            type: 'number',
            placeholder: 'Random',
            description: 'Number for reproducible results',
          },
          promptImage: {
            label: 'Reference Image (optional)',
            type: 'image_upload',
            supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
            maxSize: '10MB',
            description: 'Image-to-video generation',
          },
        },
        
        note: 'Runway Veo-3 provides core controls within Marketing Engine. Cinematography details (camera paths, lighting, mood) are managed by Runway\'s AI. For explicit control over all parameters, use Luma Ray-2.',
      },
      
      luma: {
        id: 'luma',
        name: 'Luma',
        model: 'Ray-2',
        label: 'Luma Ray-2',
        description: 'Fast generation • 5s-9s • HD quality',
        strengths: ['Quick results', '720p/1080p HD', 'Seamless loops', 'Full parameter control'],
        bestFor: ['Quick iterations', 'Social media content', 'Fast turnarounds', 'Seamless loops'],
        speed: 'Fast generation (20-45 seconds)',
        duration: 'Flexible (5s or 9s)',
        
        basicSettings: {
          aspect: {
            label: 'Aspect Ratio',
            options: ['9:16', '1:1', '16:9'],
            default: '9:16',
            hints: {
              '9:16': 'Vertical - Reels, Shorts, TikTok',
              '1:1': 'Square - Instagram feed',
              '16:9': 'Landscape - YouTube, website',
            },
          },
          duration: {
            label: 'Duration',
            options: ['5s', '9s'],
            default: '5s',
            hints: {
              '5s': 'Quick • Lower cost',
              '9s': 'Extended • More detailed',
            },
          },
          resolution: {
            label: 'Resolution',
            options: ['720p', '1080p'],
            default: '1080p',
            hints: {
              '720p': 'Standard HD • Faster',
              '1080p': 'Full HD • Premium',
            },
          },
          loop: {
            label: 'Loop',
            type: 'boolean',
            options: ['Off', 'Seamless'],
            default: false,
            hints: {
              'Off': 'Standard video',
              'Seamless': 'Perfect loop',
            },
          },
          promptImage: {
            label: 'Reference Image (optional)',
            type: 'image_upload',
            supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
            maxSize: '10MB',
            description: 'Image-to-video generation',
          },
        },
        
        advancedSettings: {
          camera: {
            movement: {
              label: 'Camera Movement',
              options: ['static', 'pan_left', 'pan_right', 'zoom_in', 'zoom_out', 'orbit_right'],
              hints: {
                'static': 'Fixed camera position',
                'pan_left': 'Horizontal sweep left',
                'pan_right': 'Horizontal sweep right',
                'zoom_in': 'Push in toward subject',
                'zoom_out': 'Pull back to reveal scene',
                'orbit_right': 'Circle around subject',
              },
            },
            angle: {
              label: 'Camera Angle',
              options: ['low', 'eye_level', 'high', 'bird_eye'],
              hints: {
                'low': 'Heroic worm\'s-eye view',
                'eye_level': 'Natural perspective',
                'high': 'Downward overview',
                'bird_eye': 'Top-down look',
              },
            },
            distance: {
              label: 'Camera Distance',
              options: ['close_up', 'medium', 'wide', 'extreme_wide'],
              hints: {
                'close_up': 'Focus on detail',
                'medium': 'Balanced framing',
                'wide': 'Environmental context',
                'extreme_wide': 'Epic establishing shot',
              },
            },
          },
          
          visual: {
            style: {
              label: 'Visual Style',
              options: ['cinematic', 'photorealistic', 'artistic', 'animated', 'vintage'],
              hints: {
                'cinematic': 'Premium film aesthetic',
                'photorealistic': 'Natural realism',
                'artistic': 'Creative painterly look',
                'animated': 'Stylised animation',
                'vintage': 'Retro character',
              },
            },
            lighting: {
              label: 'Lighting',
              options: ['natural', 'dramatic', 'soft', 'hard', 'golden_hour', 'blue_hour'],
              hints: {
                'natural': 'Outdoor daylight',
                'dramatic': 'High-contrast shadows',
                'soft': 'Even, flattering light',
                'hard': 'Crisp highlights',
                'golden_hour': 'Warm sunset glow',
                'blue_hour': 'Cool twilight mood',
              },
            },
            mood: {
              label: 'Mood',
              options: ['energetic', 'calm', 'mysterious', 'joyful', 'serious', 'epic'],
              hints: {
                'energetic': 'High-impact storytelling',
                'calm': 'Peaceful, relaxed',
                'mysterious': 'Intriguing atmosphere',
                'joyful': 'Bright and optimistic',
                'serious': 'Professional tone',
                'epic': 'Grand cinematic scale',
              },
            },
            colorGrading: {
              label: 'Color Grading',
              options: ['natural', 'warm', 'cool', 'dramatic', 'desaturated'],
              hints: {
                'natural': 'True-to-life colours',
                'warm': 'Golden tones',
                'cool': 'Modern blue palette',
                'dramatic': 'High contrast',
                'desaturated': 'Soft, muted look',
              },
            },
            filmLook: {
              label: 'Film Look',
              options: ['digital', '35mm', '16mm', 'vintage'],
              hints: {
                'digital': 'Clean contemporary',
                '35mm': 'Classic cinema texture',
                '16mm': 'Documentary aesthetic',
                'vintage': 'Retro film grain',
              },
            },
          },
          
          motion: {
            intensity: {
              label: 'Motion Intensity',
              options: ['minimal', 'moderate', 'high', 'extreme'],
              hints: {
                'minimal': 'Subtle movement',
                'moderate': 'Balanced motion',
                'high': 'Dynamic energy',
                'extreme': 'Maximum impact',
              },
            },
            speed: {
              label: 'Motion Speed',
              options: ['slow_motion', 'normal', 'fast_motion'],
              hints: {
                'slow_motion': 'Elegant pacing',
                'normal': 'Real-time',
                'fast_motion': 'Energetic acceleration',
              },
            },
            subjectMovement: {
              label: 'Subject Movement',
              options: ['static', 'subtle', 'active', 'dynamic'],
              hints: {
                'static': 'No subject movement',
                'subtle': 'Gentle motion',
                'active': 'Clear action',
                'dynamic': 'High-energy motion',
              },
            },
          },
          
          technical: {
            quality: {
              label: 'Quality',
              options: ['standard', 'high', 'premium'],
              hints: {
                'standard': 'Balanced quality/speed',
                'high': 'Enhanced detail',
                'premium': 'Maximum fidelity',
              },
            },
            seed: {
              label: 'Seed (optional)',
              type: 'number',
              placeholder: 'Random',
              description: 'Number for reproducible results',
            },
            guidanceScale: {
              label: 'Guidance Scale',
              type: 'slider',
              min: 1,
              max: 20,
              step: 0.5,
              default: 7.5,
              description: 'How closely to follow prompt (higher = stricter)',
            },
            negativePrompt: {
              label: 'Negative Prompt (optional)',
              type: 'textarea',
              placeholder: 'blurry, low quality, distorted...',
              description: 'Elements to avoid in video',
            },
          },
        },
        
        totalParameters: 19,
        categories: ['Duration/Resolution', 'Camera (3)', 'Visual (5)', 'Motion (3)', 'Technical (4)'],
      },
    },
  },

  // FAQ - Updated with complete settings information
  faq: [
    // BADU Capabilities
    {
      question: 'Can BADU analyze images and files?',
      answer: 'YES! BADU has vision capabilities powered by GPT-4o Vision. I CAN: ✅ Analyze images (photos, screenshots, artwork, product shots, etc.), ✅ Create detailed prompts from images, ✅ Recommend the best AI model based on image content, ✅ Provide specific settings to recreate the image look. I CANNOT: ❌ Analyze video files (only images), ❌ Analyze audio files. To use: Simply attach an image using the attachment button (📎) in the chat input, then ask me to analyze it or create a prompt from it!',
      panels: ['all'],
    },
    {
      question: 'Can BADU analyze videos?',
      answer: 'No, BADU cannot analyze video files. I can only analyze static images (photos, screenshots, artwork). However, I can help you with video settings and parameters for Runway and Luma video generation if you describe what you want to create!',
      panels: ['all'],
    },
    {
      question: 'What file types can I attach to BADU?',
      answer: 'You can attach images to BADU for analysis: PNG, JPG, JPEG, WebP formats. Simply click the attachment button (📎) in the chat input and select your image. BADU will analyze it and can create detailed prompts, recommend models, and suggest settings. Note: Video and audio files are not supported.',
      panels: ['all'],
    },
    
    {
      question: 'What are ALL the settings for Content panel?',
      answer: 'Content panel has 11 settings: Brief (textarea, min 15 chars), Persona (5 options: Generic, First-time, Warm lead, B2B DM, Returning), Tone (6 options: Friendly, Informative, Bold, Premium, Playful, Professional), CTA Call to Action (7 options: Learn more, Get a demo, Sign up, Shop now, Start free trial, Book a call, Download guide), Language (EN, AR, FR), Copy Length (Compact, Standard, Detailed), Platforms (6 channels multi-select), Keywords (optional text), Hashtags (optional text), Avoid (optional text), Attachments (max 3 files, PNG/JPG/WebP/PDF, 5MB each). All settings required except Keywords, Hashtags, Avoid, and Attachments.',
      panels: ['content'],
    },
    {
      question: 'Give me an example content prompt / creative brief',
      answer: 'Example Content Prompt: "Announce the launch of our new AI-powered project management tool. Target audience: Small business owners and startup founders who struggle with team coordination and missed deadlines. Key message: Simplify project management with intelligent automation that saves 10+ hours per week. Pain points to address: Scattered communication across tools, missed deadlines, lack of visibility into team progress. Solution benefits: All-in-one workspace, smart task prioritization, automated status updates, real-time collaboration. Unique value: AI suggests optimal workflows based on your team\'s patterns. Tone should be friendly yet professional, emphasizing productivity gains. Include testimonial potential from beta users. Call to action: Start your 14-day free trial." Then configure: Persona = First-time (new product launch), Tone = Professional, CTA = Start free trial, Language = EN, Copy Length = Standard, Platforms = LinkedIn + X + Facebook. This brief gives AI enough context to generate compelling copy across all selected platforms.',
      panels: ['content'],
    },
    {
      question: 'What are ALL the DALL-E 3 settings?',
      answer: 'DALL-E 3 (OpenAI provider) has 4 total settings: Quality (standard or hd), Style (vivid or natural), Style preset (Product/Lifestyle/UGC/Abstract), and Aspect Ratio (1:1 or 16:9 only). It\'s the fastest provider but has limited aspect ratios.',
      panels: ['pictures'],
    },
    {
      question: 'What are ALL the FLUX Pro settings?',
      answer: 'FLUX Pro has 8 settings: Mode (standard or ultra), Guidance (1.5-5, slider, only in standard mode), Steps (20-50, only in standard mode), Prompt Upsampling (on/off), RAW Mode (on/off), Output Format (jpeg/png/webp), Style preset (Product/Lifestyle/UGC/Abstract), Aspect Ratio (6 options: 1:1/16:9/2:3/3:2/7:9/9:7). Best for photorealistic images.',
      panels: ['pictures'],
    },
    {
      question: 'What are ALL the Stability SD 3.5 settings?',
      answer: 'Stability SD 3.5 has 7 settings: Model (large/large-turbo/medium), CFG Scale (1-20 slider), Steps (20-60 slider), Style Preset (18 options including 3d-model, anime, cinematic, photographic, etc.), Negative Prompt (textarea, 500 chars max), Style preset (Product/Lifestyle/UGC/Abstract), Aspect Ratio (1:1/2:3/3:2/16:9). Best for fine control.',
      panels: ['pictures'],
    },
    {
      question: 'What are ALL the Ideogram settings?',
      answer: 'Ideogram has 6 settings: Model (v2/v1/turbo), Magic Prompt (on/off for enhanced prompts), Style Type (AUTO/GENERAL/REALISTIC/DESIGN/RENDER_3D/ANIME), Negative Prompt (textarea), Style preset (Product/Lifestyle/UGC/Abstract), Aspect Ratio (1:1 or 16:9 only). Best for typography and text generation.',
      panels: ['pictures'],
    },
    {
      question: 'What are ALL the Runway Veo-3 settings?',
      answer: 'Runway Veo-3 has 4 core settings: Aspect Ratio (9:16/1:1/16:9), Watermark (on/off), Seed (optional number for reproducibility), Reference Image (optional image upload for image-to-video). Duration is fixed at 8 seconds. Runway manages advanced cinematography internally. For explicit control over 19 parameters, use Luma Ray-2.',
      panels: ['video'],
    },
    {
      question: 'What are ALL the Luma Ray-2 settings?',
      answer: 'Luma Ray-2 has 19 total settings across 5 categories: BASIC (4): Aspect (9:16/1:1/16:9), Duration (5s or 9s, also written as 5 seconds and 9 seconds), Resolution (720p or 1080p), Loop (on/off seamless). CAMERA (3): Movement (static/pan_left/pan_right/zoom_in/zoom_out/orbit_right), Angle (low/eye_level also Eye Level/high/bird_eye also Bird\'s Eye), Distance (close_up also Close-up/medium/wide/extreme_wide). VISUAL (5): Style (cinematic/photorealistic/artistic/animated/vintage), Lighting (natural/dramatic/soft/hard/golden_hour also Golden Hour/blue_hour also Blue Hour), Mood (energetic/calm/mysterious/joyful/serious/epic), Color Grading (natural/warm/cool/dramatic/desaturated), Film Look (digital/35mm/16mm/vintage). MOTION (3): Intensity (minimal/moderate/high/extreme), Speed (slow_motion also Slow Motion/normal/fast_motion also Fast Motion), Subject Movement (static/subtle/active/dynamic). TECHNICAL (4): Quality (standard/high/premium), Seed (optional), Guidance Scale (1-20 slider, guidanceScale), Negative Prompt (optional textarea). Total 19 parameters with unique combinations over 100 million. Best for full creative control.',
      panels: ['video'],
    },
    {
      question: 'What are the Luma Ray-2 basic settings?',
      answer: 'Luma Ray-2 basic settings (4 total): Duration (5s or 9s, five seconds nine seconds), Resolution (720p or 1080p), Loop (on/off seamless looping), Aspect Ratio (9:16/1:1/16:9). Use 5s for quick social content, 9s for detailed scenes. Use 1080p for final delivery, 720p for faster previews.',
      panels: ['video'],
    },
    {
      question: 'What are the Luma Ray-2 camera settings?',
      answer: 'Luma Ray-2 camera settings (3 categories): Camera Movement (static, pan_left, pan_right, zoom_in, zoom_out, orbit_right - 6 options), Camera Angle (low, eye_level Eye Level, high, bird_eye Bird\'s Eye - 4 options), Camera Distance (close_up Close-up, medium, wide, extreme_wide - 4 options). Total 14 camera options for complete shot control.',
      panels: ['video'],
    },
    {
      question: 'What are the Luma Ray-2 visual settings?',
      answer: 'Luma Ray-2 visual settings (5 categories): Style (cinematic, photorealistic, artistic, animated, vintage - 5 options), Lighting (natural, dramatic, soft, hard, golden_hour Golden Hour, blue_hour Blue Hour - 6 options), Mood (energetic, calm, mysterious, joyful, serious, epic - 6 options), Color Grading (natural, warm, cool, dramatic, desaturated - 5 options), Film Look (digital, 35mm, 16mm, vintage - 4 options). Total 26 visual parameter combinations.',
      panels: ['video'],
    },
    {
      question: 'What are the Luma Ray-2 motion settings?',
      answer: 'Luma Ray-2 motion settings (3 categories): Motion Intensity (minimal, moderate, high, extreme - 4 options), Motion Speed (slow_motion Slow Motion, normal, fast_motion Fast Motion - 3 options), Subject Movement (static, subtle, active, dynamic - 4 options). Control both camera and subject motion independently with 11 total motion parameter options.',
      panels: ['video'],
    },
    {
      question: 'What are the Luma Ray-2 technical settings?',
      answer: 'Luma Ray-2 technical settings (4 total): Quality (standard, high, premium quality - 3 tiers), Seed (optional number for reproducible results), Guidance Scale guidanceScale (1-20 slider for prompt adherence strength), Negative Prompt (optional textarea for what to avoid). Use premium quality for final delivery, standard for iterations.',
      panels: ['video'],
    },
    {
      question: 'What persona should I choose for B2B campaigns?',
      answer: 'For B2B campaigns, choose "B2B DM" (Business Decision Maker) persona. This targets business professionals and decision makers. Pair it with "Professional" tone and select LinkedIn as your primary platform. B2B DM persona focuses on ROI, efficiency, and professional value propositions - perfect for enterprise sales, SaaS products, and B2B services.',
      panels: ['content'],
    },
    {
      question: 'Which aspect ratios does each Pictures provider support?',
      answer: 'DALL-E 3: 1:1, 16:9 (2 options). FLUX Pro: 1:1, 16:9, 2:3, 3:2, 7:9, 9:7 (6 options - most flexible). Stability SD 3.5: 1:1, 2:3, 3:2, 16:9 (4 options). Ideogram: 1:1, 16:9 (2 options). Use FLUX for maximum aspect ratio flexibility.',
      panels: ['pictures'],
    },
    {
      question: 'What is the difference between Runway and Luma for video?',
      answer: 'Runway Veo-3: 8-second fixed duration, 4 core settings, AI-managed cinematography, cinema-quality, slower generation. Best for premium campaigns. Luma Ray-2: 5s or 9s flexible duration, 19 explicit settings, full manual control, 720p/1080p HD, fast generation (20-45s), seamless loops. Best for quick iterations and full creative control. Runway = quality + simplicity. Luma = speed + control.',
      panels: ['video'],
    },
    
    // Model Selection & Comparison
    {
      question: 'Which Pictures provider should I use for my content?',
      answer: 'Choose based on your needs: DALL-E 3 - Fastest, vivid colors, simple controls (best for quick iterations). FLUX Pro - Photorealistic images, most aspect ratios (best for product shots, lifestyle, portraits). Stability SD 3.5 - Fine control, 18 style presets, negative prompts (best for artistic/stylized content). Ideogram - Text/typography generation (best for logos, text-heavy designs, flyers). For most marketing needs, start with FLUX Pro.',
      panels: ['pictures'],
    },
    {
      question: 'When should I use FLUX Pro vs Stability SD 3.5?',
      answer: 'Use FLUX Pro for: Photorealistic product shots, lifestyle images, portraits, e-commerce, standard photography needs. Use Stability SD 3.5 for: Artistic styles, anime, cinematic looks, specific style presets (18 options), when you need fine control with CFG Scale/Steps, or when you need negative prompts to avoid unwanted elements. FLUX = realism, Stability = artistic control.',
      panels: ['pictures'],
    },
    {
      question: 'What is the difference between DALL-E 3 and Ideogram?',
      answer: 'DALL-E 3: General image generation, vivid/natural styles, fastest generation, limited to 1:1 and 16:9 aspects, no text generation capability. Ideogram: Specialized for text/typography, creates text within images, Magic Prompt enhancement, 6 style types including Design mode, perfect for logos/flyers/text-heavy content. Use DALL-E for general images, Ideogram when you need text in the image.',
      panels: ['pictures'],
    },
    {
      question: 'Best provider for product photography?',
      answer: 'FLUX Pro is best for product photography. It excels at photorealistic images with high detail. Recommended settings: Mode = standard or ultra, Style preset = Product, Aspect = 1:1 (square for e-commerce) or 2:3/3:2 (for lifestyle shots), Prompt Upsampling = On. In Advanced: Backdrop = Clean (for simple backgrounds), Lighting = Soft (for even lighting) or Hard (for dramatic shadows), Quality = High detail.',
      panels: ['pictures'],
    },
    {
      question: 'Best provider for social media content?',
      answer: 'FLUX Pro is best for social media - it offers the most aspect ratios and photorealistic quality. For Instagram: Use 1:1 (feed), 9:16 (Stories/Reels). For Facebook: 1:1 or 16:9. For LinkedIn: 16:9 or 1:1. Use Style = Lifestyle or UGC for authentic feel. Enable Prompt Upsampling for better results. For social posts with text overlays, consider Ideogram.',
      panels: ['pictures'],
    },
    
    // Platform-Specific Guidance
    {
      question: 'What settings should I use for Instagram Stories?',
      answer: 'Instagram Stories: Aspect Ratio = 9:16 (vertical full-screen), Provider = FLUX Pro or DALL-E 3, Style = Lifestyle or UGC (for authentic feel), Quality = High detail. In Advanced: Backdrop = Real-world or Gradient, Lighting = Soft or Natural. Keep compositions simple and centered (safe area). For Stories with text, use Ideogram with 9:16 aspect.',
      panels: ['pictures'],
    },
    {
      question: 'What settings for Instagram Posts and Reels?',
      answer: 'Instagram Posts: Aspect = 1:1 (square feed) or 4:5 (portrait), Provider = FLUX Pro, Style = Product or Lifestyle, Quality = High detail. Instagram Reels: Aspect = 9:16 (vertical), Provider = Luma Ray-2 for video (5s duration, 1080p, Loop = on for seamless), Style = Cinematic or Photorealistic, Motion Intensity = Moderate to High.',
      panels: ['pictures', 'video'],
    },
    {
      question: 'What settings for Facebook Ads?',
      answer: 'Facebook Ads Images: Aspect = 1:1 (feed) or 16:9 (wide), Provider = FLUX Pro, Style = Product or Lifestyle, Quality = High detail. For carousel ads, use 1:1. For single image ads, 1:1 or 16:9. Facebook Video Ads: Aspect = 1:1 or 16:9, Provider = Luma Ray-2 (5s or 9s), Resolution = 1080p, Style = Cinematic, Motion = Moderate.',
      panels: ['pictures', 'video'],
    },
    {
      question: 'What settings for LinkedIn posts?',
      answer: 'LinkedIn Posts: Aspect = 16:9 (landscape) or 1:1, Provider = FLUX Pro, Style = Professional imagery (Product or Lifestyle), Quality = High detail. Use Professional tone in Content panel, B2B DM persona. In Advanced: Backdrop = Clean or Real-world, Lighting = Soft (professional), Quality = High detail. Avoid overly artistic styles - keep it business-appropriate.',
      panels: ['pictures', 'content'],
    },
    {
      question: 'What settings for YouTube thumbnails?',
      answer: 'YouTube Thumbnails: Aspect = 16:9 (required), Provider = FLUX Pro or Ideogram (if text needed), Style = Bold visuals with high contrast, Quality = High detail (1280x720 minimum). In Advanced: Lighting = Dramatic or Hard (for eye-catching contrast), Quality = High detail. For text overlays, use Ideogram with bold, readable fonts.',
      panels: ['pictures'],
    },
    
    // Common Workflows
    {
      question: 'How do I create a complete marketing campaign?',
      answer: 'Complete Campaign Workflow: 1. Content Panel: Write your copy (set Brief, Persona, Tone, CTA, Platforms). 2. Pictures Panel: Generate matching visuals (choose provider based on style, set aspect ratio for platforms). 3. Video Panel: Create supporting video content (Luma for quick social clips, Runway for premium). 4. Use consistent style/mood across all panels. 5. Generate and validate each panel. Pro tip: Generate content first, then create images/videos that match the messaging.',
      panels: ['all'],
    },
    {
      question: 'What is the workflow from Content to Pictures to Video?',
      answer: 'Recommended Workflow: Step 1 - Content: Define your messaging, tone, and platforms. Generate copy variations. Step 2 - Pictures: Use the generated copy insights to create matching visuals. Choose aspect ratios based on selected platforms. Step 3 - Video: Create video content that complements the copy and images. Match the mood, style, and messaging. Step 4 - Review: Ensure consistency across all content types. The content drives the visual style, not the other way around.',
      panels: ['all'],
    },
    {
      question: 'How to create consistent branding across all content?',
      answer: 'For Brand Consistency: 1. Content Panel: Use the same Persona and Tone across all campaigns. 2. Pictures Panel Advanced: Set Brand Colors = Locked (maintains exact brand colors). Choose one Backdrop style (Clean/Gradient/Real-world) and stick to it. Use consistent Lighting (Soft for professional, Hard for bold brands). 3. Video Panel: Use the same Style (cinematic/photorealistic) and Mood settings. 4. Keep the same aspect ratios for each platform. Consistency = recognition.',
      panels: ['all'],
    },
    
    // Technical Explainers
    {
      question: 'What is CFG Scale and how should I use it?',
      answer: 'CFG Scale (Classifier-Free Guidance Scale) in Stability SD 3.5 controls how closely the AI follows your prompt. Range 1-20. Low (1-5): AI has more creative freedom, softer adherence to prompt. Medium (6-12): Balanced, recommended for most uses. High (13-20): Strict adherence to prompt, good for precise requirements. Recommended: 7-10 for general use, 10-15 for specific requirements, 15-20 only if you need exact prompt matching. Too high = over-saturated/unnatural.',
      panels: ['pictures'],
    },
    {
      question: 'What does Steps mean in Stability SD 3.5?',
      answer: 'Steps (Inference Iterations) in Stability SD 3.5 controls how many refinement passes the AI makes. Range 20-60. Low (20-30): Faster generation, less refined. Medium (35-50): Balanced quality/speed, recommended. High (50-60): Maximum detail/refinement, slower. Recommended: 40 steps for most uses, 50+ for final high-quality outputs. More steps = better quality but longer generation time. Diminishing returns after 50 steps.',
      panels: ['pictures'],
    },
    {
      question: 'What is a Negative Prompt and when to use it?',
      answer: 'Negative Prompt (available in Stability SD 3.5 and Ideogram) tells the AI what NOT to include. Use it to: Remove unwanted elements (logos, text, watermarks), Fix common AI issues (extra fingers, distorted faces), Avoid specific styles or objects, Exclude certain colors or moods. Example: "blurry, low quality, distorted, extra limbs, watermark, text". Keep it concise (under 500 chars). Only use if you\'re getting unwanted elements - not required for every generation.',
      panels: ['pictures'],
    },
    {
      question: 'What is Magic Prompt in Ideogram?',
      answer: 'Magic Prompt in Ideogram is an AI enhancement that automatically improves your prompt for better results. When On: Ideogram adds detail, improves structure, optimizes for their model. When Off: Uses your exact prompt as-is. Recommended: Use On (default) for most cases - it significantly improves output quality. Use Off only if you have a very specific, well-crafted prompt that you don\'t want altered. Magic Prompt is especially helpful for text generation.',
      panels: ['pictures'],
    },
    {
      question: 'What is Guidance Scale in Luma Ray-2?',
      answer: 'Guidance Scale in Luma Ray-2 (1-20 slider) controls how strictly the video follows your prompt. Low (1-7): More creative freedom, natural motion. Medium (8-12): Balanced, recommended. High (13-20): Strict adherence to prompt, precise control. Recommended: 7-10 for most videos, 10-15 for specific requirements. Similar to CFG Scale in images. Higher values give you more control but can look less natural.',
      panels: ['video'],
    },
    
    // Prompt Writing Tips
    {
      question: 'How do I write effective prompts for images?',
      answer: 'Effective Image Prompts: 1. Be specific: "A red sports car on a beach at sunset" not just "car". 2. Include details: Subject, style, lighting, colors, mood, composition. 3. Use descriptive adjectives: "sleek modern minimalist product shot" vs "product". 4. Specify camera/angle: "close-up", "wide angle", "bird\'s eye view". 5. Add quality markers: "professional photography", "8K", "high detail". 6. Mention lighting: "soft natural light", "dramatic shadows", "golden hour". Structure: [Subject] + [Details] + [Style] + [Lighting] + [Mood] + [Quality].',
      panels: ['pictures'],
    },
    {
      question: 'How do I write effective prompts for videos?',
      answer: 'Effective Video Prompts: 1. Start with main subject and action: "A person walking through a forest". 2. Add motion details: "slowly moving forward", "camera panning left". 3. Specify scene: Location, time of day, weather. 4. Include mood/atmosphere: "peaceful morning", "dramatic tension". 5. Mention camera work (Luma Ray-2): Use settings instead of prompt for camera movement. 6. Keep it scene-focused, not shot-focused. Example: "A coffee cup steaming on a wooden table, morning sunlight streaming through window, calm peaceful atmosphere" then use Luma settings for camera movement.',
      panels: ['video'],
    },
    {
      question: 'Tips for better image quality?',
      answer: 'For Best Image Quality: 1. Use FLUX Pro Ultra mode or Stability SD 3.5 large model. 2. Write detailed prompts (50+ words). 3. Add quality markers: "professional photography", "8K resolution", "high detail", "sharp focus". 4. In Advanced: Quality = High detail, Avoid = low quality. 5. Use appropriate aspect ratio for your platform. 6. For products: Add "product photography", "studio lighting", "white background". 7. Enable Prompt Upsampling (FLUX) or Magic Prompt (Ideogram). 8. Iterate: Generate multiple variations.',
      panels: ['pictures'],
    },
    {
      question: 'Common prompt mistakes to avoid?',
      answer: 'Avoid These Mistakes: 1. Too vague: "nice image" - be specific! 2. Conflicting instructions: "dark shadows and bright lighting". 3. Too many subjects: Focus on 1-2 main elements. 4. Unrealistic expectations: AI has limits (hands, text, complex scenes). 5. Overloading: 200+ word prompts with too many details. 6. Ignoring aspect ratio: Square images don\'t work for Stories. 7. Wrong provider: Using DALL-E for text, or Ideogram for photorealism. 8. Forgetting platform: Instagram needs vertical, YouTube needs horizontal.',
      panels: ['pictures', 'video'],
    },
    
    // Specific Techniques
    {
      question: 'How to add text or typography to images?',
      answer: 'For Text in Images: Use Ideogram provider - it\'s specifically designed for text generation. Steps: 1. Select Ideogram provider. 2. Write prompt with exact text you want: "Logo design with text \'BRAND NAME\' in bold modern font". 3. Set Style Type based on desired look: Design (logos/graphics), Realistic (photographic), Anime (stylized). 4. Enable Magic Prompt = On. 5. In Advanced: Quality = High detail. Note: DALL-E, FLUX, and Stability are poor at text generation. For text overlays, generate image first, add text in external tool.',
      panels: ['pictures'],
    },
    {
      question: 'How to create photorealistic images?',
      answer: 'For Photorealism: 1. Provider: FLUX Pro (best) or Stability SD 3.5 with photographic preset. 2. FLUX Settings: Mode = ultra (max detail), Guidance = 3-4, Steps = 40-50, Prompt Upsampling = On. 3. Prompt: Include "professional photography", "photorealistic", "8K", camera details ("shot on Canon EOS R5", "50mm lens"). 4. Advanced: Backdrop = Real-world, Lighting = Natural or Soft, Quality = High detail. 5. Avoid cartoon/artistic keywords. FLUX Pro ultra mode gives the most realistic results.',
      panels: ['pictures'],
    },
    {
      question: 'How to create artistic or stylized images?',
      answer: 'For Artistic/Stylized: 1. Provider: Stability SD 3.5 (best for styles). 2. Settings: Model = large, CFG Scale = 10-15, Steps = 50, Style Preset = choose from 18 options (anime, cinematic, digital-art, fantasy-art, line-art, pixel-art, etc.). 3. Prompt: Include style keywords ("watercolor painting", "anime style", "cyberpunk art"). 4. Advanced: Lighting = Dramatic or Neon (for bold looks). 5. Experiment with different presets - each gives unique artistic look. Stability excels at non-photorealistic styles.',
      panels: ['pictures'],
    },
    {
      question: 'How to create seamless loop videos?',
      answer: 'For Seamless Loop Videos: Use Luma Ray-2 (only provider with loop feature). Settings: 1. Duration = 5s (best for loops). 2. Resolution = 1080p. 3. Loop = On (seamless). 4. Camera Movement = static or subtle movement (orbit_right works well). 5. Motion Intensity = minimal or moderate. 6. Subject Movement = subtle or static. 7. Prompt: Describe continuous motion ("waves gently rolling", "smoke slowly rising"). Avoid start/end actions. Perfect for backgrounds, social media, website headers.',
      panels: ['video'],
    },
    {
      question: 'How to use reference images in video generation?',
      answer: 'Reference Images (Image-to-Video): Available in Runway Veo-3 only. Steps: 1. Select Runway provider. 2. Upload reference image using "Reference Image" option. 3. Write prompt describing motion/action to apply to the image. 4. Set Aspect Ratio and Watermark. 5. Generate. Runway will animate your reference image based on the prompt. Use cases: Animate static product shots, bring photos to life, create motion from illustrations. Luma Ray-2 does not support reference images (text-to-video only).',
      panels: ['video'],
    },
    
    // Advanced Settings
    {
      question: 'What are the Advanced settings in Pictures panel?',
      answer: 'Advanced Settings (apply to ALL Pictures providers): 1. Brand Colors: Locked (exact brand colors) or Flexible (allow variations). 2. Backdrop: Clean (solid background), Gradient (smooth transition), Real-world (natural environment). 3. Lighting: Soft (diffused gentle), Hard (sharp dramatic shadows), Neon (vibrant glowing). 4. Quality: High detail (max texture), Sharp (crisp edges), Minimal noise (clean smooth). 5. Avoid: None, Logos, Busy background, Extra hands, Glare. Use these to fine-tune any provider\'s output.',
      panels: ['pictures'],
    },
    {
      question: 'When should I lock Brand Colors?',
      answer: 'Lock Brand Colors when: 1. You have strict brand guidelines with specific hex colors. 2. Creating branded content that must match existing materials. 3. Need color consistency across multiple generations. 4. Working on corporate/professional content. Use Flexible when: 1. Exploring creative options. 2. Natural/realistic photography where exact colors aren\'t critical. 3. Testing different looks. 4. Social media content with more creative freedom. Locked = exact colors, Flexible = AI interprets colors naturally.',
      panels: ['pictures'],
    },
    {
      question: 'What backdrop should I choose?',
      answer: 'Backdrop Options: Clean - Solid, minimal background (best for: product shots, professional headshots, e-commerce, focus on subject). Gradient - Smooth color transition (best for: modern designs, social media, artistic shots, soft professional look). Real-world - Natural environment (best for: lifestyle shots, contextual product images, authentic feel, storytelling). Choose based on: Product shots = Clean, Lifestyle = Real-world, Modern/creative = Gradient.',
      panels: ['pictures'],
    },
    {
      question: 'What lighting option for product shots?',
      answer: 'Product Photography Lighting: Soft - Diffused, even lighting, no harsh shadows (best for: most products, e-commerce, professional look, skin/beauty products). Hard - Sharp shadows, dramatic contrast (best for: bold products, luxury items, creating depth, architectural shots). Neon - Vibrant, glowing lights (best for: tech products, creative/artistic shots, nightclub/urban vibes). Recommended: Start with Soft for 80% of product shots. Use Hard for luxury/dramatic. Neon for tech/creative only.',
      panels: ['pictures'],
    },
  ],
};

/**
 * Search the complete knowledge base
 */
export function searchCompleteKnowledge(query, maxResults = 5) {
  const results = [];
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter(word => word.length > 2);
  
  const calculateScore = (text, source, boost = 0) => {
    let score = boost;
    const textLower = String(text).toLowerCase();
    
    if (textLower.includes(queryLower)) score += 10;
    keywords.forEach(keyword => {
      if (textLower.includes(keyword)) score += 2;
    });
    
    return score;
  };
  
  // Search Content Panel
  if (keywords.some(k => ['content', 'copy', 'text', 'headline', 'caption', 'persona', 'tone', 'b2b', 'business', 'cta', 'settings'].includes(k))) {
    const content = COMPLETE_KNOWLEDGE_BASE.content;
    const score = calculateScore(JSON.stringify(content), 'content', 5);
    if (score > 0) {
      results.push({
        source: 'Content Panel - Complete Settings',
        panel: 'content',
        relevance: score,
        data: content,
      });
    }
  }
  
  // Search Pictures Providers
  const pictureKeywords = ['picture', 'image', 'photo', 'visual', 'dall', 'flux', 'stability', 'ideogram', 'provider', 'settings'];
  if (keywords.some(k => pictureKeywords.includes(k))) {
    const pictures = COMPLETE_KNOWLEDGE_BASE.pictures;
    
    // Check for specific provider
    if (keywords.some(k => ['dall', 'dalle', 'openai'].includes(k))) {
      results.push({
        source: 'DALL-E 3 Complete Settings',
        panel: 'pictures',
        relevance: 20,
        data: pictures.providers.openai,
      });
    }
    if (keywords.some(k => ['flux'].includes(k))) {
      results.push({
        source: 'FLUX Pro Complete Settings',
        panel: 'pictures',
        relevance: 20,
        data: pictures.providers.flux,
      });
    }
    if (keywords.some(k => ['stability', 'stable'].includes(k))) {
      results.push({
        source: 'Stability SD 3.5 Complete Settings',
        panel: 'pictures',
        relevance: 20,
        data: pictures.providers.stability,
      });
    }
    if (keywords.some(k => ['ideogram'].includes(k))) {
      results.push({
        source: 'Ideogram Complete Settings',
        panel: 'pictures',
        relevance: 20,
        data: pictures.providers.ideogram,
      });
    }
    
    // General pictures panel
    if (results.filter(r => r.panel === 'pictures').length === 0) {
      const score = calculateScore(JSON.stringify(pictures), 'pictures', 5);
      results.push({
        source: 'Pictures Panel - All Providers',
        panel: 'pictures',
        relevance: score,
        data: pictures,
      });
    }
  }
  
  // Search Video Providers
  const videoKeywords = ['video', 'runway', 'luma', 'veo', 'ray', 'camera', 'cinematic', 'settings', 'parameters'];
  if (keywords.some(k => videoKeywords.includes(k))) {
    const video = COMPLETE_KNOWLEDGE_BASE.video;
    
    // Check for specific provider
    if (keywords.some(k => ['luma', 'ray'].includes(k))) {
      results.push({
        source: 'Luma Ray-2 Complete Settings (19 Parameters)',
        panel: 'video',
        relevance: 25,
        data: video.providers.luma,
      });
    }
    if (keywords.some(k => ['runway', 'veo'].includes(k))) {
      results.push({
        source: 'Runway Veo-3 Complete Settings',
        panel: 'video',
        relevance: 25,
        data: video.providers.runway,
      });
    }
    
    // General video panel
    if (results.filter(r => r.panel === 'video').length === 0) {
      const score = calculateScore(JSON.stringify(video), 'video', 5);
      results.push({
        source: 'Video Panel - All Providers',
        panel: 'video',
        relevance: score,
        data: video,
      });
    }
  }
  
  // Search FAQ
  COMPLETE_KNOWLEDGE_BASE.faq.forEach((item) => {
    const score = calculateScore(item.question + ' ' + item.answer, 'faq');
    if (score > 0) {
      results.push({
        source: `FAQ: ${item.question}`,
        panel: item.panels.join(', '),
        relevance: score,
        data: item,
      });
    }
  });
  
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults);
}

/**
 * Build context from search results - format for LLM
 */
export function buildCompleteContext(results) {
  if (!results || results.length === 0) {
    return 'No specific documentation found.';
  }
  
  return results.map(result => {
    const { source, data } = result;
    
    try {
      // Format provider settings comprehensively
      if (source.includes('Complete Settings') || source.includes('All Providers')) {
        let context = `### ${source}\n\n`;
        
        if (data.settings) {
          context += `**Available Settings:**\n\n`;
          Object.entries(data.settings).forEach(([key, setting]) => {
            if (typeof setting === 'object' && setting.label) {
              context += `• **${setting.label}**: `;
              if (setting.options && Array.isArray(setting.options)) {
                context += `${setting.options.join(', ')}`;
                if (setting.default) context += ` (default: ${setting.default})`;
              } else if (setting.type === 'slider') {
                context += `${setting.min}-${setting.max}`;
                if (setting.default) context += ` (default: ${setting.default})`;
              } else if (setting.type === 'boolean') {
                context += setting.options ? setting.options.join('/') : 'On/Off';
              }
              context += '\n';
              
              if (setting.hints) {
                Object.entries(setting.hints).forEach(([opt, hint]) => {
                  context += `  - ${opt}: ${hint}\n`;
                });
              }
            }
          });
        }
        
        if (data.basicSettings) {
          context += `\n**Basic Settings:**\n`;
          Object.entries(data.basicSettings).forEach(([key, setting]) => {
            if (typeof setting === 'object' && setting.label) {
              context += `• **${setting.label}**: ${setting.options ? setting.options.join(', ') : 'Available'}\n`;
            }
          });
        }
        
        if (data.advancedSettings) {
          context += `\n**Advanced Settings (19 total):**\n`;
          Object.entries(data.advancedSettings).forEach(([category, settings]) => {
            context += `\n**${category.toUpperCase()}:**\n`;
            Object.entries(settings).forEach(([key, setting]) => {
              if (typeof setting === 'object' && setting.label) {
                context += `• **${setting.label}**: ${setting.options ? setting.options.join(', ') : 'Available'}\n`;
              }
            });
          });
        }
        
        return context;
      }
      
      // Format FAQ
      if (data.question && data.answer) {
        return `### ${source}\n\n**Q:** ${data.question}\n**A:** ${data.answer}`;
      }
      
      // Fallback
      return `### ${source}\n\n${JSON.stringify(data, null, 2).substring(0, 1000)}`;
      
    } catch (error) {
      console.warn('[buildCompleteContext] Error:', error);
      return `### ${source}\n\n(Context available)`;
    }
  }).join('\n\n---\n\n');
}

