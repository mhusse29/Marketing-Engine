"use client";

import { motion } from "framer-motion";
import DisplayCards from "@/components/ui/display-cards";
import { Eye, ShieldCheck, Zap } from "lucide-react";

const customCards = [
  {
    icon: <Eye className="size-4 text-cyan-400" />,
    title: "Master of Disguise",
    subtitle: "Become who they need.",
    description: "Shape-shift your voice in a heartbeat. Charm the casual visitor or command the boardroom. Be Bold, be Playful, be Unignorable.",
    iconClassName: "",
    titleClassName: "",
    className:
      "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <ShieldCheck className="size-4 text-blue-400" />,
    title: "Bulletproof Confidence",
    subtitle: "Zero risk. Pure impact.",
    description: "Create without fear. Our safety core creates an unbreakable shield around your brand, ensuring every word is dangerous enough to sell, but safe enough to publish.",
    iconClassName: "",
    titleClassName: "",
    className:
      "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <Zap className="size-4 text-purple-400" />,
    title: "Everywhere, All at Once",
    subtitle: "One spark. Infinite fire.",
    description: "Break every barrier. Deploy campaigns across 6 platforms and 3 languages in seconds. Your message shouldn't just travel; it should take over.",
    iconClassName: "",
    titleClassName: "",
    className:
      "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
  },
];

export default function DisplayCardsSection() {
  return (
    <section className="relative min-h-screen w-full bg-black py-20 md:py-32 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Title, Paragraph, CTA */}
          <div className="text-left">
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true, margin: "-100px" }}
            >
              Don&apos;t Just Write.<br />
              <span className="bg-clip-text text-transparent bg-[length:200%_100%] bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 animate-shimmer">Captivate.</span>
            </motion.h2>
            <motion.p 
              className="text-lg md:text-xl text-white/60 max-w-xl leading-relaxed mb-8"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true, margin: "-100px" }}
            >
              Stop guessing what works. Our content engine adapts to your audience&apos;s mindset—whether they&apos;re curious, skeptical, or ready to buy. Turn scrollers into customers, instantly.
            </motion.p>

            {/* CTA Button - left aligned */}
            <motion.button
              className="cursor-pointer rounded-full bg-[#34C759] shadow-lg shadow-[#34C759]/25 hover:shadow-[#34C759]/40 hover:shadow-xl transition-all duration-300 flex items-center justify-center group px-8 py-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ 
                delay: 0.2, 
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <span className="text-base md:text-lg lg:text-xl font-semibold text-black">
                  Start Creating
                </span>
                <svg 
                  className="w-4 h-4 md:w-5 md:h-5 text-black transition-transform duration-300 ease-in-out group-hover:translate-x-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2.5} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </div>
            </motion.button>
          </div>

          {/* Right side - Display Cards */}
          <motion.div 
            className="w-full flex justify-center lg:justify-end"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ 
              delay: 0.3, 
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <DisplayCards cards={customCards} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
