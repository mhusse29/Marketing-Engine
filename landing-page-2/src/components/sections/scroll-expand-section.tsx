'use client';

import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';

interface MediaAbout {
  overview: string;
  conclusion: string;
}

interface MediaContent {
  src: string;
  poster?: string;
  background: string;
  title: string;
  date: string;
  scrollToExpand: string;
  about: MediaAbout;
}

interface MediaContentCollection {
  [key: string]: MediaContent;
}

const sampleMediaContent: MediaContentCollection = {
  video: {
    src: 'https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYuZ5R8ahEEZ4aQK56LizRdfBSqeDMsmUIrJN1',
    poster:
      'https://images.pexels.com/videos/5752729/space-earth-universe-cosmos-5752729.jpeg',
    background:
      'https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYMNjMlBUYHaeYpxduXPVNwf8mnFA61L7rkcoS',
    title: 'Cinematic AI Revolution',
    date: 'Video Generation Engine',
    scrollToExpand: 'Scroll to Unleash the Future',
    about: {
      overview:
        'Harness the power of Gen-4 Turbo, Veo 3, and Ray-2 to create stunning cinematic content. Our AI video engine transforms your ideas into professional marketing campaigns in seconds.',
      conclusion:
        'From text-to-video to advanced motion control, experience the next generation of AI-powered video creation for marketing that captivates and converts.',
    },
  },
  image: {
    src: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?q=80&w=1280&auto=format&fit=crop',
    background:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop',
    title: 'Dynamic Image Showcase',
    date: 'Underwater Adventure',
    scrollToExpand: 'Scroll to Expand Demo',
    about: {
      overview:
        'This is a demonstration of the ScrollExpandMedia component with an image. The same smooth expansion effect works beautifully with static images, allowing you to create engaging visual experiences without video content.',
      conclusion:
        'The ScrollExpandMedia component works equally well with images and videos. This flexibility allows you to choose the media type that best suits your content while maintaining the same engaging user experience.',
    },
  },
};

const MediaContent = ({ mediaType }: { mediaType: 'video' | 'image' }) => {
  return null; // No content after expansion, just the immersive video
};

// Default export - Video with text blend
export default function ScrollExpandSection() {
  const mediaType = 'video';
  const currentMedia = sampleMediaContent[mediaType];

  return (
    <ScrollExpandMedia
      mediaType={mediaType}
      mediaSrc={currentMedia.src}
      posterSrc={currentMedia.poster}
      bgImageSrc={currentMedia.background}
      title={currentMedia.title}
      date={currentMedia.date}
      scrollToExpand={currentMedia.scrollToExpand}
      textBlend
    >
      <MediaContent mediaType={mediaType} />
    </ScrollExpandMedia>
  );
}

// Named exports for different variants
export const VideoExpansionTextBlend = () => {
  const mediaType = 'video';
  const currentMedia = sampleMediaContent[mediaType];

  return (
    <ScrollExpandMedia
      mediaType={mediaType}
      mediaSrc={currentMedia.src}
      posterSrc={currentMedia.poster}
      bgImageSrc={currentMedia.background}
      title={currentMedia.title}
      date={currentMedia.date}
      scrollToExpand={currentMedia.scrollToExpand}
      textBlend
    >
      <MediaContent mediaType={mediaType} />
    </ScrollExpandMedia>
  );
};

export const ImageExpansionTextBlend = () => {
  const mediaType = 'image';
  const currentMedia = sampleMediaContent[mediaType];

  return (
    <ScrollExpandMedia
      mediaType={mediaType}
      mediaSrc={currentMedia.src}
      bgImageSrc={currentMedia.background}
      title={currentMedia.title}
      date={currentMedia.date}
      scrollToExpand={currentMedia.scrollToExpand}
      textBlend
    >
      <MediaContent mediaType={mediaType} />
    </ScrollExpandMedia>
  );
};

export const VideoExpansion = () => {
  const mediaType = 'video';
  const currentMedia = sampleMediaContent[mediaType];

  return (
    <ScrollExpandMedia
      mediaType={mediaType}
      mediaSrc={currentMedia.src}
      posterSrc={currentMedia.poster}
      bgImageSrc={currentMedia.background}
      title={currentMedia.title}
      date={currentMedia.date}
      scrollToExpand={currentMedia.scrollToExpand}
    >
      <MediaContent mediaType={mediaType} />
    </ScrollExpandMedia>
  );
};

export const ImageExpansion = () => {
  const mediaType = 'image';
  const currentMedia = sampleMediaContent[mediaType];

  return (
    <ScrollExpandMedia
      mediaType={mediaType}
      mediaSrc={currentMedia.src}
      bgImageSrc={currentMedia.background}
      title={currentMedia.title}
      date={currentMedia.date}
      scrollToExpand={currentMedia.scrollToExpand}
    >
      <MediaContent mediaType={mediaType} />
    </ScrollExpandMedia>
  );
};
