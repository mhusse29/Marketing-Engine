import type {
  AiUIState,
  GeneratedContent,
  GeneratedPictures,
  GeneratedVideo,
  Platform,
  SettingsState,
  CardKey,
} from '../types';

export const defaultAiState: AiUIState = {
  locked: true,
  brief: '',
  uploads: [],
  generating: false,
  steps: [],
  stepStatus: {},
  outputs: {},
};

// Mock content generation
export function generateContent(
  platforms: Platform[],
  versions: number,
  props: SettingsState['quickProps']['content']
): GeneratedContent[][] {
  const contentVersions: GeneratedContent[][] = [];
  
  const contentTemplates = {
    facebook: {
      headlines: [
        'Transform Your Business Today',
        'Unlock New Growth Opportunities',
        'Scale Smarter, Not Harder',
      ],
      captions: [
        'Discover how leading companies are revolutionizing their approach.',
        'Join thousands of businesses already seeing results.',
        'The future of business starts here.',
      ],
      ctas: ['Learn More', 'Get Started', 'See How'],
    },
    instagram: {
      headlines: [
        '✨ Level Up Your Game',
        '🚀 Ready for Growth?',
        '💡 Smart Solutions Inside',
      ],
      captions: [
        'Swipe up to see how we\'re changing the game.',
        'Your success story starts with one tap.',
        'Real results from real businesses.',
      ],
      ctas: ['Shop Now', 'Swipe Up', 'Link in Bio'],
    },
    tiktok: {
      headlines: [
        'POV: You Found the Secret',
        'This Changes Everything',
        'Wait for It...',
      ],
      captions: [
        'The hack everyone\'s talking about 👀',
        'Why didn\'t I know this sooner?',
        'Game changer alert 🚨',
      ],
      ctas: ['Try It', 'Get Yours', 'Start Now'],
    },
    linkedin: {
      headlines: [
        'Driving Innovation in Your Industry',
        'Strategic Growth Solutions',
        'Enterprise-Ready Solutions',
      ],
      captions: [
        'Learn how industry leaders are staying ahead of the curve.',
        'Data-driven insights for sustainable growth.',
        'Transform your business with proven strategies.',
      ],
      ctas: ['Download Report', 'Schedule Demo', 'Learn More'],
    },
    'google.search': {
      headlines: [
        'Best Solutions for Your Business',
        'Top-Rated by Industry Leaders',
        'Transform Your Results Today',
      ],
      captions: [
        'Trusted by over 10,000 businesses worldwide.',
        'See why we\'re the #1 choice.',
        'Get started in minutes.',
      ],
      ctas: ['Get Quote', 'Start Free', 'Learn More'],
    },
    'google.display': {
      headlines: [
        'Upgrade Your Business',
        'Smart Solutions, Real Results',
        'Join Industry Leaders',
      ],
      captions: [
        'See the difference quality makes.',
        'Proven results you can trust.',
        'Start your journey today.',
      ],
      ctas: ['Explore', 'Discover', 'Get Started'],
    },
    'google.youtube': {
      headlines: [
        'See It In Action',
        'Watch How It Works',
        'Real Results, Real Stories',
      ],
      captions: [
        'Discover what makes us different.',
        'Join thousands of satisfied customers.',
        'Your success story starts here.',
      ],
      ctas: ['Watch Now', 'Learn More', 'Subscribe'],
    },
  };
  
  for (let v = 0; v < versions; v++) {
    const versionContent: GeneratedContent[] = [];
    
    for (const platform of platforms) {
      const template = contentTemplates[platform] || contentTemplates.facebook;
      const randomIndex = Math.floor(Math.random() * template.headlines.length);
      
      versionContent.push({
        platform,
        headline: template.headlines[randomIndex],
        caption: template.captions[randomIndex],
        cta: props?.cta || template.ctas[randomIndex],
      });
    }
    
    contentVersions.push(versionContent);
  }
  
  return contentVersions;
}

// Mock picture generation
export function generatePictures(
  versions: number,
  hasUploads: boolean,
  uploads: string[],
  props: SettingsState['quickProps']['pictures']
): GeneratedPictures[] {
  const pictureVersions: GeneratedPictures[] = [];
  const mode = props?.mode === 'prompt' ? 'prompt' : 'images';
  
  for (let v = 0; v < versions; v++) {
    if (mode === 'images' && hasUploads && uploads.length > 0) {
      pictureVersions.push({
        mode: 'uploads',
        images: uploads.map((src) => ({
          src,
          enhancement: `Enhance with ${props?.style || 'Product'} style, ${
            props?.lockBrandColors ? 'maintaining brand colors' : 'vibrant colors'
          }`,
        })),
      });
    } else {
      const prompts = [
        `Create a ${props?.style || 'Product'} photography shot with ${
          props?.aspect || '1:1'
        } aspect ratio, featuring modern aesthetics and ${
          props?.lockBrandColors ? 'brand color palette' : 'dynamic colors'
        }`,
        `Design a compelling visual in ${props?.style || 'Product'} style, optimized for social media in ${
          props?.aspect || '1:1'
        } format`,
        `Generate an eye-catching ${props?.style || 'Product'} image that tells a story, formatted as ${
          props?.aspect || '1:1'
        }`,
      ];
      
      pictureVersions.push({
        mode: 'prompt',
        prompts: prompts.slice(0, Math.max(1, Math.floor(Math.random() * 3) + 1)),
      });
    }
  }
  
  return pictureVersions;
}

// Mock video generation
export function generateVideo(
  versions: number,
  props: SettingsState['quickProps']['video']
): GeneratedVideo[] {
  const videoVersions: GeneratedVideo[] = [];
  
  const hookTemplates = {
    'Pain-point': 'Struggling with [specific challenge]? You\'re not alone.',
    'Bold claim': 'What if I told you there\'s a better way?',
    'Question': 'Ever wondered how top performers do it?',
    'Pattern interrupt': 'STOP! Before you scroll...',
  };
  
  const scriptBeats = [
    { label: 'Hook' as const, text: '' },
    { label: 'Problem' as const, text: 'Most businesses waste time and money on outdated solutions.' },
    { label: 'Solution' as const, text: 'Our innovative approach changes everything.' },
    { label: 'Proof' as const, text: 'See real results from real customers.' },
    { label: 'Value' as const, text: 'Transform your business in just days, not months.' },
    { label: 'CTA' as const, text: props?.cta || 'Start your journey today!' },
  ];
  
  for (let v = 0; v < versions; v++) {
    const hookType = props?.hook || 'Question';
    const beats = [...scriptBeats];
    beats[0].text = hookTemplates[hookType];
    
    videoVersions.push({
      aspect: props?.aspect || '9:16',
      durationSec: props?.duration || 12,
      scriptBeats: beats,
      fullPrompt: `Create a ${props?.duration || 12}-second video in ${
        props?.aspect || '9:16'
      } format. Start with a ${hookType} hook. Include dynamic transitions, ${
        props?.captions ? 'bold captions' : 'minimal text'
      }, and end with a strong call-to-action: "${props?.cta || 'Start your journey today!'}"`,
    });
  }
  
  return videoVersions;
}

// Simulate async generation with progress updates
export async function simulateGeneration(
  steps: CardKey[],
  onProgress: (step: CardKey, status: NonNullable<AiUIState['stepStatus'][CardKey]>) => void
): Promise<void> {
  for (const step of steps) {
    // Queued
    onProgress(step, 'queued');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Thinking
    onProgress(step, 'thinking');
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    
    // Rendering
    onProgress(step, 'rendering');
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
    
    // Ready
    onProgress(step, 'ready');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
