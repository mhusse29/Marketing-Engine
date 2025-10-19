/**
 * Enhanced Knowledge Base for Badu Assistant
 * Professional-grade RAG knowledge base with structured documentation
 */

export const KNOWLEDGE_BASE = {
  meta: {
    version: '2.0.0',
    lastUpdated: '2025-01-10',
    purpose: 'Comprehensive guide for Marketing Engine app usage',
  },

  // Core App Information
  app: {
    name: 'Marketing Engine',
    company: 'SINAIQ',
    assistant: 'BADU',
    description: 'AI-powered marketing content creation platform supporting Content, Pictures, and Video generation',
  },

  // Content Panel Documentation
  content: {
    title: 'Content Panel',
    description: 'Generate platform-optimized marketing copy',
    purpose: 'Create engaging headlines, captions, and CTAs for multiple social platforms',
    
    steps: [
      'Enter your campaign brief (minimum 15 characters)',
      'Select target platforms (Facebook, Instagram, TikTok, LinkedIn, X, YouTube)',
      'Choose audience persona',
      'Select tone and language',
      'Add CTA and optional keywords',
      'Click Validate to enable generation',
    ],
    
    settings: {
      persona: {
        label: 'Persona',
        description: 'Target audience type',
        options: ['Generic', 'First-time', 'Warm lead', 'B2B DM', 'Returning'],
        default: 'Generic',
        tip: 'Choose Generic for broad audiences, B2B DM for professional outreach',
        recommendations: {
          'B2B campaigns': 'B2B DM',
          'Business to business': 'B2B DM',
          'Professional': 'B2B DM',
          'LinkedIn': 'B2B DM',
          'Enterprise': 'B2B DM',
          'Consumer': 'Generic',
          'New customers': 'First-time',
          'Retargeting': 'Warm lead',
          'Existing customers': 'Returning',
        },
        details: {
          'Generic': 'Broad audience, mass market appeal',
          'First-time': 'New customers, first interaction with brand',
          'Warm lead': 'Engaged prospects, familiar with brand',
          'B2B DM': 'Business decision makers, professional tone, focus on ROI and efficiency. Best for LinkedIn, enterprise sales, B2B services.',
          'Returning': 'Existing customers, loyalty focus',
        },
      },
      tone: {
        label: 'Tone',
        description: 'Communication style',
        options: ['Friendly', 'Informative', 'Bold', 'Premium', 'Playful', 'Professional'],
        default: 'Friendly',
        tip: 'Professional for B2B, Playful for consumer brands',
      },
      language: {
        label: 'Language',
        description: 'Output language',
        options: ['EN', 'AR', 'FR'],
        default: 'EN',
      },
      copyLength: {
        label: 'Copy Length',
        description: 'Amount of content generated',
        options: ['Compact', 'Standard', 'Detailed'],
        default: 'Standard',
        tip: 'Compact for Twitter/X, Detailed for blog posts',
      },
      cta: {
        label: 'Call to Action',
        description: 'Action button text',
        examples: ['Learn more', 'Get a demo', 'Sign up', 'Shop now', 'Start free trial', 'Book a call', 'Download guide'],
        default: 'Learn more',
      },
      keywords: {
        label: 'Keywords (Optional)',
        description: 'Comma-separated keywords to include',
        placeholder: 'e.g., innovation, AI, automation',
      },
      hashtags: {
        label: 'Hashtags (Optional)',
        description: 'Comma-separated hashtags (without #)',
        placeholder: 'e.g., marketing, digital, AI',
      },
    },
    
    bestPractices: [
      'Write clear, specific briefs for better results',
      'Match persona to your target audience',
      'Use Professional tone for B2B, Friendly for B2C',
      'Add relevant keywords to improve targeting',
      'Always validate before generating',
    ],
    
    troubleshooting: {
      'Cannot validate': 'Brief must be at least 15 characters and select at least one platform',
      'Generation fails': 'Check that brief is clear and platforms are selected',
      'Poor quality output': 'Try adding keywords or using more specific brief',
    },
  },

  // Pictures Panel Documentation
  pictures: {
    title: 'Pictures Panel',
    description: 'Generate AI-powered images with multiple providers',
    purpose: 'Create product shots, lifestyle imagery, and brand visuals',
    
    steps: [
      'Select image provider (Auto, FLUX, Stability, OpenAI, Ideogram)',
      'Choose style and aspect ratio',
      'Enter image prompt (minimum 10 characters)',
      'Configure provider-specific settings',
      'Click Validate to enable generation',
    ],
    
    providers: {
      openai: {
        name: 'DALL-E 3',
        bestFor: ['Quick product visuals', 'Clean commercial imagery', 'Professional photos'],
        speed: 'Fast',
        quality: 'High',
        settings: {
          quality: {
            label: 'Quality',
            options: ['standard', 'hd'],
            default: 'standard',
            note: 'HD quality forces 1:1 aspect ratio',
          },
          style: {
            label: 'Style',
            options: ['vivid', 'natural'],
            default: 'vivid',
            tip: 'Vivid for bold colors, Natural for realistic tones',
          },
        },
        tips: [
          'Best for commercial product photography',
          'HD quality provides superior detail but limited to square format',
          'Natural style works well for lifestyle photography',
        ],
      },
      
      flux: {
        name: 'FLUX Pro 1.1',
        bestFor: ['Photorealistic people', 'Premium lifestyle scenes', 'High-detail imagery'],
        speed: 'Medium',
        quality: 'Premium',
        settings: {
          mode: {
            label: 'Mode',
            options: ['standard', 'ultra'],
            default: 'standard',
            tip: 'Ultra for maximum quality and detail',
          },
          guidance: {
            label: 'Guidance Scale',
            range: [1.5, 5],
            default: 3,
            description: 'How closely to follow prompt (higher = stricter)',
          },
          steps: {
            label: 'Steps',
            range: [20, 50],
            default: 40,
            description: 'More steps = higher quality but slower',
          },
          promptUpsampling: {
            label: 'Prompt Upsampling',
            type: 'boolean',
            default: false,
            description: 'AI enhances your prompt automatically',
          },
          raw: {
            label: 'Raw Mode',
            type: 'boolean',
            default: false,
            description: 'Bypass safety filters for artistic freedom',
          },
          outputFormat: {
            label: 'Output Format',
            options: ['jpeg', 'png', 'webp'],
            default: 'jpeg',
          },
        },
        tips: [
          'Best for photorealistic human portraits',
          'Increase guidance scale for precise adherence to prompt',
          'Use prompt upsampling for better results with simple prompts',
        ],
      },
      
      stability: {
        name: 'Stable Diffusion 3.5',
        bestFor: ['Artistic concepts', 'Style experimentation', 'Creative freedom'],
        speed: 'Fast-Medium',
        quality: 'High',
        settings: {
          model: {
            label: 'Model',
            options: ['large', 'large-turbo', 'medium'],
            default: 'large',
            tip: 'large-turbo for speed, large for quality',
          },
          cfg: {
            label: 'CFG Scale',
            range: [1, 20],
            default: 7,
            description: 'How closely to follow prompt',
          },
          steps: {
            label: 'Steps',
            range: [20, 60],
            default: 40,
          },
          stylePreset: {
            label: 'Style Preset',
            description: 'Optional artistic style',
            examples: ['photographic', 'digital-art', 'comic-book', 'fantasy-art', 'line-art', '3d-model'],
          },
          negativePrompt: {
            label: 'Negative Prompt',
            description: 'What to avoid in the image',
            placeholder: 'e.g., blurry, distorted, low quality',
          },
        },
        tips: [
          'Best for creative and artistic styles',
          'Use negative prompt to improve quality',
          'Experiment with style presets for unique looks',
        ],
      },
      
      ideogram: {
        name: 'Ideogram v2',
        bestFor: ['Typography', 'Posters', 'Graphic design', 'Text-heavy visuals'],
        speed: 'Medium',
        quality: 'High',
        settings: {
          model: {
            label: 'Model',
            options: ['v2', 'v1', 'turbo'],
            default: 'v2',
            tip: 'v2 has best typography, turbo is fastest',
          },
          magicPrompt: {
            label: 'Magic Prompt',
            type: 'boolean',
            default: true,
            description: 'AI enhances prompt for better results',
          },
          styleType: {
            label: 'Style Type',
            options: ['AUTO', 'GENERAL', 'REALISTIC', 'DESIGN', 'RENDER_3D', 'ANIME'],
            default: 'AUTO',
          },
          negativePrompt: {
            label: 'Negative Prompt',
            description: 'Elements to exclude',
          },
        },
        tips: [
          'Excellent for text and typography in images',
          'Use DESIGN style for posters and graphics',
          'Magic Prompt improves most generations',
        ],
      },
    },
    
    commonSettings: {
      style: {
        label: 'Style',
        options: ['Product', 'Lifestyle', 'UGC', 'Abstract'],
        default: 'Product',
        descriptions: {
          Product: 'Clean product photography with neutral background',
          Lifestyle: 'Real-world scenes with context and environment',
          UGC: 'User-generated content style, authentic and relatable',
          Abstract: 'Creative, artistic, conceptual imagery',
        },
      },
      aspect: {
        label: 'Aspect Ratio',
        options: ['1:1', '4:5', '16:9', '2:3', '3:2', '7:9', '9:7'],
        default: '1:1',
        platformGuide: {
          '1:1': ['Instagram feed', 'Facebook feed'],
          '4:5': ['Instagram portrait'],
          '16:9': ['YouTube thumbnail', 'Website header'],
          '9:16': ['Instagram Stories', 'TikTok'],
        },
      },
      lockBrandColors: {
        label: 'Lock Brand Colors',
        type: 'boolean',
        default: true,
        description: 'Maintain consistent brand color palette',
      },
    },
    
    bestPractices: [
      'Choose provider based on your content needs: DALL-E for products, FLUX for people, Ideogram for graphics',
      'Start with Auto provider selection if unsure',
      'Write detailed, specific prompts for better results',
      'Use negative prompts with Stability to avoid unwanted elements',
      'Match aspect ratio to your target platform',
      'Enable Lock Brand Colors for consistent branding',
    ],
    
    troubleshooting: {
      'Validation fails': 'Prompt must be at least 10 characters and provider must be selected',
      'Poor image quality': 'Try increasing steps/quality settings or using more detailed prompt',
      'Wrong style/look': 'Adjust provider-specific settings or try different provider',
      'Text looks wrong': 'Use Ideogram provider for text-heavy images',
    },
  },

  // Video Panel Documentation
  video: {
    title: 'Video Panel',
    description: 'Generate professional videos with Runway Veo-3 or Luma Ray-2',
    purpose: 'Create engaging video content for social media and marketing campaigns',
    
    steps: [
      'Select video provider (Auto, Runway Veo-3, or Luma Ray-2)',
      'Enter video prompt (minimum 15 characters)',
      'Choose aspect ratio for target platform',
      'Configure camera movement and style settings',
      'Click Validate to enable generation',
    ],
    
    providers: {
      runway: {
        name: 'Runway Veo-3',
        model: 'veo3',
        bestFor: ['Cinema-quality videos', 'Premium campaigns', 'Professional content'],
        strengths: ['Highest quality output', 'Advanced cinematography', 'Photorealistic rendering'],
        speed: 'Slower (30-90 seconds)',
        quality: 'Premium',
        duration: '8 seconds (fixed)',
        settings: {
          aspect: {
            label: 'Aspect Ratio',
            options: ['9:16', '1:1', '16:9'],
            default: '9:16',
            platformGuide: {
              '9:16': 'Instagram Stories, TikTok, Reels',
              '1:1': 'Instagram Feed, Facebook',
              '16:9': 'YouTube, Website',
            },
          },
          watermark: {
            label: 'Watermark',
            type: 'boolean',
            default: false,
          },
          seed: {
            label: 'Seed (Optional)',
            description: 'Number for reproducible results',
          },
        },
        promptGuide: [
          'Describe camera movements explicitly (pan, zoom, dolly)',
          'Specify lighting conditions (golden hour, dramatic, soft)',
          'Detail subject actions and movements',
          'Include environment and atmosphere details',
        ],
        examples: [
          'Cinematic dolly shot moving forward through a modern office, golden hour lighting streaming through floor-to-ceiling windows, professional businessman reviewing documents, warm color grade, shallow depth of field',
          'Smooth orbital camera movement around premium smartphone on marble surface, dramatic studio lighting with blue accent, product slowly rotating, high-end commercial aesthetic, shallow DOF',
        ],
        note: 'Runway handles cinematography internally. Use detailed prompts for best results.',
      },
      
      luma: {
        name: 'Luma Ray-2',
        model: 'ray-2',
        bestFor: ['Quick iterations', 'Social media content', 'Fast turnarounds', 'Seamless loops'],
        strengths: ['Fast generation', 'Flexible duration (5s or 9s)', 'Loop support', 'Full HD 1080p'],
        speed: 'Fast (20-45 seconds)',
        quality: 'High',
        duration: 'Flexible (5s or 9s)',
        
        settings: {
          duration: {
            label: 'Duration',
            options: ['5s', '9s'],
            default: '5s',
            tip: '5s for social media, 9s for detailed scenes',
          },
          resolution: {
            label: 'Resolution',
            options: ['720p', '1080p'],
            default: '1080p',
            tip: '1080p for final delivery, 720p for faster previews',
          },
          loop: {
            label: 'Seamless Loop',
            type: 'boolean',
            default: false,
            description: 'Makes video loop smoothly for continuous playback',
          },
          
          camera: {
            movement: {
              label: 'Camera Movement',
              options: ['Static', 'Pan Left', 'Pan Right', 'Zoom In', 'Zoom Out', 'Orbit Right'],
              default: 'Static',
              descriptions: {
                Static: 'No camera movement, locked shot',
                'Pan Left': 'Camera pans horizontally left',
                'Pan Right': 'Camera pans horizontally right',
                'Zoom In': 'Camera zooms toward subject',
                'Zoom Out': 'Camera pulls back from subject',
                'Orbit Right': 'Camera orbits clockwise around subject',
              },
            },
            angle: {
              label: 'Camera Angle',
              options: ['Low', 'Eye Level', 'High', 'Bird\'s Eye'],
              default: 'Eye Level',
              descriptions: {
                Low: 'Camera positioned below subject, looking up',
                'Eye Level': 'Camera at subject\'s eye level (most natural)',
                High: 'Camera above subject, looking down',
                'Bird\'s Eye': 'Top-down view from directly above',
              },
            },
            distance: {
              label: 'Camera Distance',
              options: ['Close-up', 'Medium', 'Wide', 'Extreme Wide'],
              default: 'Medium',
              descriptions: {
                'Close-up': 'Very close to subject, detail focus',
                Medium: 'Standard framing showing subject fully',
                Wide: 'Subject in environment with context',
                'Extreme Wide': 'Expansive view, subject small in frame',
              },
            },
          },
          
          visual: {
            style: {
              label: 'Visual Style',
              options: ['Cinematic', 'Photorealistic', 'Artistic', 'Animated', 'Vintage'],
              default: 'Cinematic',
              descriptions: {
                Cinematic: 'Film-like quality with dramatic composition',
                Photorealistic: 'Real-world, natural appearance',
                Artistic: 'Creative, stylized aesthetic',
                Animated: 'Animation-style rendering',
                Vintage: 'Retro, aged film look',
              },
            },
            lighting: {
              label: 'Lighting Style',
              options: ['Natural', 'Dramatic', 'Soft', 'Hard', 'Golden Hour', 'Blue Hour'],
              default: 'Natural',
              descriptions: {
                Natural: 'Realistic ambient lighting',
                Dramatic: 'High contrast, moody lighting',
                Soft: 'Diffused, gentle illumination',
                Hard: 'Sharp shadows, direct light',
                'Golden Hour': 'Warm sunset/sunrise glow',
                'Blue Hour': 'Cool twilight atmosphere',
              },
            },
            mood: {
              label: 'Mood',
              options: ['Energetic', 'Calm', 'Mysterious', 'Joyful', 'Serious', 'Epic'],
              default: 'Energetic',
            },
            colorGrading: {
              label: 'Color Grading',
              options: ['Natural', 'Warm', 'Cool', 'Dramatic', 'Desaturated'],
              default: 'Natural',
            },
            filmLook: {
              label: 'Film Look',
              options: ['Digital', '35mm', '16mm', 'Vintage'],
              default: 'Digital',
            },
          },
          
          motion: {
            intensity: {
              label: 'Motion Intensity',
              options: ['Minimal', 'Moderate', 'High', 'Extreme'],
              default: 'Moderate',
              description: 'Amount of movement in scene',
            },
            speed: {
              label: 'Motion Speed',
              options: ['Slow Motion', 'Normal', 'Fast Motion'],
              default: 'Normal',
            },
            subjectMovement: {
              label: 'Subject Movement',
              options: ['Static', 'Subtle', 'Active', 'Dynamic'],
              default: 'Subtle',
              descriptions: {
                Static: 'Subject stays still',
                Subtle: 'Minor movements, natural',
                Active: 'Noticeable subject actions',
                Dynamic: 'Fast, energetic movements',
              },
            },
          },
          
          technical: {
            quality: {
              label: 'Quality',
              options: ['Standard', 'High', 'Premium'],
              default: 'Standard',
              tip: 'Premium for final delivery, Standard for iterations',
            },
            seed: {
              label: 'Seed (Optional)',
              description: 'Number for reproducible results',
            },
            guidanceScale: {
              label: 'Guidance Scale',
              range: [1, 20],
              default: 7.5,
              description: 'How closely to follow prompt (higher = stricter)',
            },
            negativePrompt: {
              label: 'Negative Prompt (Optional)',
              description: 'Elements to avoid in video',
              placeholder: 'e.g., blur, distortion, artifacts',
            },
          },
        },
        
        tips: [
          'Use Static camera movement for product showcases',
          'Combine camera movement with subject movement for dynamic scenes',
          'Golden Hour lighting creates warm, appealing content',
          'Enable Loop for GIFs and repeating backgrounds',
          'Increase guidance scale for precise prompt adherence',
          'Use negative prompts to avoid unwanted artifacts',
        ],
      },
    },
    
    providerComparison: {
      'Choose Runway when': [
        'You need absolute highest quality',
        'Cinema-grade output is required',
        'Professional campaigns and premium content',
        'You want provider-managed cinematography',
      ],
      'Choose Luma when': [
        'You need quick iterations',
        'Creating social media content',
        'Want flexible duration (5s or 9s)',
        'Need seamless loops',
        'Want manual control over all parameters',
      ],
    },
    
    bestPractices: [
      'Write detailed prompts describing action, setting, and mood',
      'Choose provider based on use case: Runway for premium, Luma for speed',
      'Match aspect ratio to target platform (9:16 for Stories/TikTok)',
      'For Luma: Start with Eye Level camera angle and Medium distance',
      'Use camera movement purposefully, not every video needs it',
      'Enable Loop for content that repeats (backgrounds, product rotations)',
      'Add negative prompts to improve quality consistency',
    ],
    
    troubleshooting: {
      'Validation fails': 'Prompt must be at least 15 characters',
      'Slow generation': 'Runway takes 30-90s, Luma is faster at 20-45s',
      'Video doesn\'t match prompt': 'Increase guidance scale or add more details to prompt',
      'Poor video quality': 'Try Premium quality setting and add negative prompt',
      'Camera movement too fast': 'Use Subtle or Moderate motion intensity',
    },
  },

  // Common Questions and Answers
  faq: [
    {
      question: 'How do I validate a panel?',
      answer: 'Each panel has a Validate button that appears after you fill in the required fields. Content requires a brief and platform selection. Pictures requires a prompt and provider. Video requires a prompt. Click Validate to enable the Generate button.',
      panels: ['content', 'pictures', 'video'],
    },
    {
      question: 'What persona should I choose for B2B campaigns?',
      answer: 'For B2B campaigns, choose the "B2B DM" (Business Decision Maker) persona. This targets business professionals and decision makers. Pair it with "Professional" tone and select LinkedIn as your primary platform. B2B DM persona focuses on ROI, efficiency, and professional value propositions - perfect for enterprise sales, SaaS products, and B2B services.',
      panels: ['content'],
    },
    {
      question: 'What is the best provider for product photography?',
      answer: 'Use DALL-E 3 (OpenAI) for clean, professional product shots. For lifestyle product photography with people, use FLUX Pro. For artistic or creative product shots, use Stability.',
      panels: ['pictures'],
    },
    {
      question: 'How long does video generation take?',
      answer: 'Runway Veo-3 takes 30-90 seconds for cinema-quality 8-second videos. Luma Ray-2 is faster at 20-45 seconds for 5-9 second videos.',
      panels: ['video'],
    },
    {
      question: 'Can I create videos with text overlays?',
      answer: 'Both video providers focus on visual generation. For text overlays, describe them in your prompt (e.g., "text saying SALE appears at bottom"). For guaranteed text, use Ideogram for images and add text in post-production.',
      panels: ['video'],
    },
    {
      question: 'What aspect ratio should I use?',
      answer: 'Use 9:16 for Instagram Stories, TikTok, and Reels. Use 1:1 for Instagram and Facebook feeds. Use 16:9 for YouTube and websites. Pictures panel supports more ratios including 4:5 for Instagram portrait.',
      panels: ['pictures', 'video'],
    },
  ],

  // Error Messages and Solutions
  errors: {
    'Brief too short': {
      message: 'Content brief must be at least 15 characters',
      solution: 'Write a more detailed description of your campaign or content needs',
      panel: 'content',
    },
    'No platforms selected': {
      message: 'Select at least one platform',
      solution: 'Choose one or more platforms from Facebook, Instagram, TikTok, LinkedIn, X, or YouTube',
      panel: 'content',
    },
    'Picture prompt too short': {
      message: 'Image prompt must be at least 10 characters',
      solution: 'Describe your desired image in more detail',
      panel: 'pictures',
    },
    'Video prompt too short': {
      message: 'Video prompt must be at least 15 characters',
      solution: 'Provide a detailed description of the video scene, actions, and setting',
      panel: 'video',
    },
    'No provider selected': {
      message: 'Select an image provider',
      solution: 'Choose Auto for automatic selection, or pick FLUX, Stability, OpenAI, or Ideogram',
      panel: 'pictures',
    },
  },

  // Workflow guides
  workflows: {
    'complete-campaign': {
      title: 'Create a Complete Campaign',
      steps: [
        { step: 1, panel: 'content', action: 'Write campaign brief describing your product/service and goals' },
        { step: 2, panel: 'content', action: 'Select target platforms and configure persona, tone, CTA' },
        { step: 3, panel: 'content', action: 'Validate and generate content' },
        { step: 4, panel: 'pictures', action: 'Use content brief or write specific image prompt' },
        { step: 5, panel: 'pictures', action: 'Choose provider (Auto, FLUX, DALL-E, etc.) and style' },
        { step: 6, panel: 'pictures', action: 'Validate and generate images' },
        { step: 7, panel: 'video', action: 'Select Runway for premium or Luma for speed' },
        { step: 8, panel: 'video', action: 'Write video prompt with camera and scene details' },
        { step: 9, panel: 'video', action: 'Configure settings and validate' },
        { step: 10, panel: 'all', action: 'Click Generate All to create complete campaign assets' },
      ],
    },
    'social-media-post': {
      title: 'Quick Social Media Post',
      steps: [
        { step: 1, panel: 'content', action: 'Write brief post idea (minimum 15 characters)' },
        { step: 2, panel: 'content', action: 'Select Instagram and/or Facebook' },
        { step: 3, panel: 'content', action: 'Choose Friendly or Playful tone' },
        { step: 4, panel: 'content', action: 'Validate and generate' },
        { step: 5, panel: 'pictures', action: 'Use DALL-E or FLUX with 1:1 or 4:5 aspect' },
        { step: 6, panel: 'pictures', action: 'Set style to Lifestyle or UGC' },
        { step: 7, panel: 'pictures', action: 'Generate image to pair with content' },
      ],
    },
    'video-ad-creation': {
      title: 'Create Video Advertisement',
      steps: [
        { step: 1, panel: 'video', action: 'Decide on Runway (premium) or Luma (fast)' },
        { step: 2, panel: 'video', action: 'Write detailed prompt with scene, action, lighting' },
        { step: 3, panel: 'video', action: 'Choose 9:16 for Stories or 16:9 for YouTube' },
        { step: 4, panel: 'video', action: 'For Luma: Configure camera movement and style' },
        { step: 5, panel: 'video', action: 'Set mood and lighting to match brand' },
        { step: 6, panel: 'video', action: 'Validate and generate' },
        { step: 7, panel: 'video', action: 'Download and add captions in post-production' },
      ],
    },
  },
};

/**
 * Search knowledge base for relevant information
 */
export function searchKnowledge(query, maxResults = 5) {
  const results = [];
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter(word => word.length > 2);
  
  // Helper to calculate relevance score
  const calculateScore = (text, source) => {
    let score = 0;
    const textLower = text.toLowerCase();
    
    // Exact phrase match
    if (textLower.includes(queryLower)) {
      score += 10;
    }
    
    // Keyword matches
    keywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        score += 2;
      }
    });
    
    // Boost score for relevant sections
    if (queryLower.includes('content') && source.includes('content')) score += 5;
    if (queryLower.includes('picture') && source.includes('pictures')) score += 5;
    if (queryLower.includes('video') && source.includes('video')) score += 5;
    if (queryLower.includes('image') && source.includes('pictures')) score += 5;
    
    return score;
  };
  
  // Search Content Panel
  if (keywords.some(k => ['content', 'copy', 'text', 'headline', 'caption', 'persona', 'tone', 'b2b', 'business', 'professional', 'linkedin'].includes(k))) {
    const content = KNOWLEDGE_BASE.content;
    const score = calculateScore(JSON.stringify(content), 'content');
    if (score > 0) {
      results.push({
        source: 'Content Panel',
        panel: 'content',
        relevance: score,
        data: content,
      });
    }
  }
  
  // Search FAQ for B2B-specific questions
  if (keywords.some(k => ['b2b', 'business', 'persona', 'professional', 'enterprise', 'linkedin'].includes(k))) {
    const b2bFaq = KNOWLEDGE_BASE.faq.find(f => f.question.toLowerCase().includes('b2b'));
    if (b2bFaq) {
      results.push({
        source: 'FAQ: B2B Persona Selection',
        panel: 'content',
        relevance: 15, // High relevance for B2B queries
        data: b2bFaq,
      });
    }
  }
  
  // Search Pictures Panel
  if (keywords.some(k => ['picture', 'image', 'photo', 'visual', 'dall', 'flux', 'stability', 'ideogram'].includes(k))) {
    const pictures = KNOWLEDGE_BASE.pictures;
    const score = calculateScore(JSON.stringify(pictures), 'pictures');
    if (score > 0) {
      results.push({
        source: 'Pictures Panel',
        panel: 'pictures',
        relevance: score,
        data: pictures,
      });
    }
  }
  
  // Search Video Panel - prioritize specific provider if mentioned
  if (keywords.some(k => ['video', 'runway', 'luma', 'veo', 'ray', 'camera', 'cinematic', 'settings', 'parameters', 'options'].includes(k))) {
    const video = KNOWLEDGE_BASE.video;
    
    // If specifically asking about Luma, return Luma-specific data with high priority
    if (keywords.some(k => ['luma', 'ray'].includes(k))) {
      const lumaData = video.providers?.luma;
      if (lumaData) {
        results.push({
          source: 'Luma Ray-2 Provider Settings',
          panel: 'video',
          relevance: 20, // Very high priority for specific Luma queries
          data: lumaData,
        });
      }
    }
    
    // If asking about Runway, return Runway-specific data
    if (keywords.some(k => ['runway', 'veo'].includes(k))) {
      const runwayData = video.providers?.runway;
      if (runwayData) {
        results.push({
          source: 'Runway Veo-3 Provider Settings',
          panel: 'video',
          relevance: 20,
          data: runwayData,
        });
      }
    }
    
    // General video panel (lower priority if specific provider mentioned)
    const generalScore = calculateScore(JSON.stringify(video), 'video');
    if (generalScore > 0) {
      const isPriorityLow = keywords.some(k => ['luma', 'ray', 'runway', 'veo'].includes(k));
      results.push({
        source: 'Video Panel',
        panel: 'video',
        relevance: isPriorityLow ? generalScore - 5 : generalScore,
        data: video,
      });
    }
  }
  
  // Search FAQ
  KNOWLEDGE_BASE.faq.forEach((item, index) => {
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
  
  // Search Workflows
  Object.entries(KNOWLEDGE_BASE.workflows).forEach(([key, workflow]) => {
    const score = calculateScore(workflow.title + ' ' + JSON.stringify(workflow.steps), 'workflow');
    if (score > 0) {
      results.push({
        source: `Workflow: ${workflow.title}`,
        panel: 'all',
        relevance: score,
        data: workflow,
      });
    }
  });
  
  // Sort by relevance and return top results
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults);
}

/**
 * Extract concise context for LLM from search results
 */
export function buildContextFromResults(results) {
  if (!results || results.length === 0) {
    return 'No specific documentation found. Please ask about Content, Pictures, or Video panels.';
  }
  
  const contexts = results.map(result => {
    const source = result.source;
    const data = result.data;
    
    try {
      // For Luma Ray-2 provider settings - comprehensive extraction
      if (source.includes('Luma Ray-2')) {
        let lumaContext = `### ${source}\n\n`;
        lumaContext += `**Provider:** ${data.name}\n`;
        lumaContext += `**Best For:** ${data.bestFor?.join(', ')}\n`;
        lumaContext += `**Speed:** ${data.speed}\n`;
        lumaContext += `**Duration:** ${data.duration}\n\n`;
        
        if (data.settings) {
          lumaContext += `**All Available Settings:**\n\n`;
          
          // Duration & Resolution
          if (data.settings.duration) {
            lumaContext += `- **Duration:** ${data.settings.duration.options?.join(', ')} (${data.settings.duration.tip})\n`;
          }
          if (data.settings.resolution) {
            lumaContext += `- **Resolution:** ${data.settings.resolution.options?.join(', ')} (${data.settings.resolution.tip})\n`;
          }
          if (data.settings.loop) {
            lumaContext += `- **Loop:** ${data.settings.loop.description}\n`;
          }
          
          // Camera settings
          if (data.settings.camera) {
            lumaContext += `\n**Camera Controls:**\n`;
            if (data.settings.camera.movement) {
              lumaContext += `- **Movement:** ${data.settings.camera.movement.options?.join(', ')}\n`;
            }
            if (data.settings.camera.angle) {
              lumaContext += `- **Angle:** ${data.settings.camera.angle.options?.join(', ')}\n`;
            }
            if (data.settings.camera.distance) {
              lumaContext += `- **Distance:** ${data.settings.camera.distance.options?.join(', ')}\n`;
            }
          }
          
          // Visual settings
          if (data.settings.visual) {
            lumaContext += `\n**Visual Settings:**\n`;
            if (data.settings.visual.style) {
              lumaContext += `- **Style:** ${data.settings.visual.style.options?.join(', ')}\n`;
            }
            if (data.settings.visual.lighting) {
              lumaContext += `- **Lighting:** ${data.settings.visual.lighting.options?.join(', ')}\n`;
            }
            if (data.settings.visual.mood) {
              lumaContext += `- **Mood:** ${data.settings.visual.mood.options?.join(', ')}\n`;
            }
            if (data.settings.visual.colorGrading) {
              lumaContext += `- **Color Grading:** ${data.settings.visual.colorGrading.options?.join(', ')}\n`;
            }
            if (data.settings.visual.filmLook) {
              lumaContext += `- **Film Look:** ${data.settings.visual.filmLook.options?.join(', ')}\n`;
            }
          }
          
          // Motion settings
          if (data.settings.motion) {
            lumaContext += `\n**Motion Controls:**\n`;
            if (data.settings.motion.intensity) {
              lumaContext += `- **Motion Intensity:** ${data.settings.motion.intensity.options?.join(', ')}\n`;
            }
            if (data.settings.motion.speed) {
              lumaContext += `- **Motion Speed:** ${data.settings.motion.speed.options?.join(', ')}\n`;
            }
            if (data.settings.motion.subjectMovement) {
              lumaContext += `- **Subject Movement:** ${data.settings.motion.subjectMovement.options?.join(', ')}\n`;
            }
          }
          
          // Technical settings
          if (data.settings.technical) {
            lumaContext += `\n**Technical Settings:**\n`;
            if (data.settings.technical.quality) {
              lumaContext += `- **Quality:** ${data.settings.technical.quality.options?.join(', ')} (${data.settings.technical.quality.tip})\n`;
            }
            if (data.settings.technical.guidanceScale) {
              lumaContext += `- **Guidance Scale:** ${data.settings.technical.guidanceScale.range?.join('-')} (default: ${data.settings.technical.guidanceScale.default})\n`;
            }
            if (data.settings.technical.seed) {
              lumaContext += `- **Seed:** ${data.settings.technical.seed.description}\n`;
            }
            if (data.settings.technical.negativePrompt) {
              lumaContext += `- **Negative Prompt:** ${data.settings.technical.negativePrompt.description}\n`;
            }
          }
        }
        
        if (data.tips && Array.isArray(data.tips)) {
          lumaContext += `\n**Tips:**\n${data.tips.map(t => `- ${t}`).join('\n')}`;
        }
        
        return lumaContext;
      }
      
      // For Runway provider settings
      if (source.includes('Runway')) {
        let runwayContext = `### ${source}\n\n`;
        runwayContext += `**Provider:** ${data.name}\n`;
        runwayContext += `**Best For:** ${data.bestFor?.join(', ')}\n`;
        runwayContext += `**Speed:** ${data.speed}\n`;
        runwayContext += `**Duration:** ${data.duration}\n\n`;
        
        if (data.settings) {
          runwayContext += `**Available Settings:**\n`;
          Object.entries(data.settings).forEach(([key, setting]) => {
            if (setting.label) {
              runwayContext += `- **${setting.label}:** `;
              if (setting.options) {
                runwayContext += `${setting.options.join(', ')}\n`;
              } else if (setting.description) {
                runwayContext += `${setting.description}\n`;
              } else {
                runwayContext += `Available\n`;
              }
            }
          });
        }
        
        return runwayContext;
      }
      
      // For panel data, extract key information
      if (result.panel === 'content' || result.panel === 'pictures' || result.panel === 'video') {
        if (data.purpose && data.steps && Array.isArray(data.steps)) {
          return `### ${source}\n\n**Purpose:** ${data.purpose}\n\n**Steps:**\n${data.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
        }
      }
      
      // For FAQ
      if (data.question && data.answer) {
        return `### ${source}\n\n**Q:** ${data.question}\n**A:** ${data.answer}`;
      }
      
      // For workflows
      if (data.title && data.steps && Array.isArray(data.steps)) {
        return `### ${source}\n\n${data.steps.map(s => `Step ${s.step} [${s.panel}]: ${s.action}`).join('\n')}`;
      }
      
      // Fallback: try to extract useful information
      if (typeof data === 'object') {
        const brief = data.brief || data.description || '';
        const title = data.title || '';
        return `### ${source}\n\n${title}${brief ? '\n\n' + brief : ''}`;
      }
      
      return `### ${source}\n\n${JSON.stringify(data, null, 2).substring(0, 500)}`;
    } catch (error) {
      console.warn('[buildContext] Error processing result:', error);
      return `### ${source}\n\n(Context available but formatting error)`;
    }
  });
  
  return contexts.join('\n\n---\n\n');
}

