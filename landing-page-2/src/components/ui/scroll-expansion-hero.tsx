'use client';

import { useRef, ReactNode } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

const ScrollExpandMedia = ({
  mediaType = 'video',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend,
  children,
}: ScrollExpandMediaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll progress within this section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Animation mappings (0-0.5 = expansion phase, 0.5-1 = content reveal phase)
  // Media dimensions - starts small, expands to full viewport
  const mediaWidth = useTransform(scrollYProgress, [0, 0.5], [300, 2000]);
  const mediaHeight = useTransform(scrollYProgress, [0, 0.5], [400, 1200]);

  // Background opacity - fades out as media expands
  const bgOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Media overlay - gets lighter as it expands
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.5, 0.2]);

  // Text translation - title words split apart FASTER and fade out before video is fully expanded
  const textTranslateX = useTransform(scrollYProgress, [0, 0.35], [0, 250]);
  const textTranslateXNeg = useTransform(scrollYProgress, [0, 0.35], [0, -250]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.25, 0.4], [1, 0.5, 0]);

  // Content opacity - children fade in after expansion
  const contentOpacity = useTransform(scrollYProgress, [0.4, 0.6], [0, 1]);

  // Date and scroll hint opacity - fade out during expansion
  const hintOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Split title into first word and rest
  const firstWord = title ? title.split(' ')[0] : '';
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: '200vh' }} // Creates scroll distance for the animation
    >
      {/* Sticky container - stays fixed during scroll */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden bg-white">
        {/* Background image - fades out */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ opacity: bgOpacity }}
        >
          <Image
            src={bgImageSrc}
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/10" />
        </motion.div>

        {/* Main content area */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
          {/* Expanding media container */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden z-0"
            style={{
              width: mediaWidth,
              height: mediaHeight,
              maxWidth: '100vw',
              maxHeight: '100vh',
            }}>
          >
            {mediaType === 'video' ? (
              mediaSrc.includes('youtube.com') ? (
                <div className="relative w-full h-full pointer-events-none">
                  <iframe
                    width="100%"
                    height="100%"
                    src={
                      mediaSrc.includes('embed')
                        ? mediaSrc +
                          (mediaSrc.includes('?') ? '&' : '?') +
                          'autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1'
                        : mediaSrc.replace('watch?v=', 'embed/') +
                          '?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=' +
                          mediaSrc.split('v=')[1]
                    }
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <div
                    className="absolute inset-0 z-10"
                    style={{ pointerEvents: 'none' }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-black/30"
                    style={{ opacity: overlayOpacity }}
                  />
                </div>
              ) : (
                <div className="relative w-full h-full pointer-events-none">
                  <video
                    src={mediaSrc}
                    poster={posterSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover"
                    controls={false}
                    disablePictureInPicture
                    disableRemotePlayback
                  />
                  <div
                    className="absolute inset-0 z-10"
                    style={{ pointerEvents: 'none' }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-black/30"
                    style={{ opacity: overlayOpacity }}
                  />
                </div>
              )
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src={mediaSrc}
                  alt={title || 'Media content'}
                  fill
                  className="object-cover"
                />
                <motion.div
                  className="absolute inset-0 bg-black/50"
                  style={{ opacity: overlayOpacity }}
                />
              </div>
            )}
          </motion.div>

          {/* Title text - splits apart on scroll and fades out before full expansion */}
          <motion.div
            className={`flex items-center justify-center text-center gap-4 w-full relative z-10 flex-col ${
              textBlend ? 'mix-blend-difference' : 'mix-blend-normal'
            }`}
            style={{ opacity: titleOpacity }}
          >
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white"
              style={{ x: textTranslateXNeg }}
            >
              {firstWord}
            </motion.h2>
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-white"
              style={{ x: textTranslateX }}
            >
              {restOfTitle}
            </motion.h2>
          </motion.div>

          {/* Date and scroll hint - below the media, fade out on scroll */}
          <motion.div
            className="absolute bottom-[15%] left-1/2 -translate-x-1/2 flex flex-col items-center text-center z-10"
            style={{ opacity: hintOpacity }}
          >
            {date && (
              <p className="text-2xl text-white mb-2">{date}</p>
            )}
            {scrollToExpand && (
              <p className="text-white/70 font-medium text-center">
                {scrollToExpand}
              </p>
            )}
          </motion.div>
        </div>

        {/* Children content - fades in after expansion */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 z-20 px-8 py-10 md:px-16 lg:py-20"
          style={{ opacity: contentOpacity }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default ScrollExpandMedia;
