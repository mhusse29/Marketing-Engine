"use client";

import {
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "framer-motion";
import ReactLenis from "lenis/react";
import { useRef } from "react";

const Skiper28 = () => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });

  // Your five headline/tagline pairs
  const messages = [
    { title: "Imagine. Create. Captivate.", tagline: "Turn ideas into unforgettable stories with AI‑powered copy, images and videos." },
    { title: "Your Vision, Amplified.", tagline: "Weave words, visuals and motion into campaigns that inspire and delight." },
    { title: "Lights. Camera. AI.", tagline: "From text to art to cinema – our marketing engine brings your brand to life." },
    { title: "Dream It. See It. Show It.", tagline: "Let one tool write, design and animate your next big idea." },
    { title: "Write. Visualise. Wow.", tagline: "Harness the magic of AI to craft copy, create art and film stories that move people." },
  ];

  /**
   * Reduced vertical travel: 60px per message (5 × 60 = 300px).
   * Creates a quicker slide effect for shorter scroll distance.
   */
  const startOffset = messages.length * 60; // 300px
  const yMotionValue = useTransform(scrollYProgress, [0, 1], [startOffset, 0]);

  /**
   * Gentle growth as you scroll for subtle zoom effect.
   * Scaling from 1 to 1.05 gives a slight enlargement without overwhelming.
   */
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  /**
   * 3‑D transform: 30° tilt, long upward slide, moderate Z‑shift, and scale-up.
   * A short perspective (250px) reinforces the depth.
   */
  const transform = useMotionTemplate`
    rotateX(30deg)
    translateY(${yMotionValue}px)
    translateZ(8px)
    scale(${scale})
  `;

  return (
    <ReactLenis root options={{ duration: 1.2, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) }}>
      <div
        ref={targetRef}
        className="relative z-10 h-[150vh] w-full bg-black text-white"
      >
        <div
          className="sticky top-0 mx-auto flex h-screen items-center justify-center bg-transparent py-20"
          style={{
            transformStyle: "preserve-3d",
            perspective: "250px",  // shorter perspective intensifies the 3-D effect
          }}
        >
          <motion.div
            style={{
              transformStyle: "preserve-3d",
              transform,
              transformOrigin: "center bottom",
            }}
            className="relative w-full max-w-4xl text-center font-geist tracking-tight"
          >
            {messages.map(({ title, tagline }, idx) => (
              <div key={idx} className="leading-none">
                <h2 className="text-4xl font-bold text-[#00ff00]">
                  {title}
                </h2>
                <p className="text-xl font-medium text-white max-w-3xl mx-auto">
                  {tagline}
                </p>
              </div>
            ))}

            {/* Extended fade-out overlay for smooth exit */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60vh] bg-gradient-to-b from-transparent to-black -z-10" />
          </motion.div>
        </div>
      </div>
    </ReactLenis>
  );
};

export { Skiper28 };
