import { motion } from "framer-motion";
import HeroScrollVideo from "./scroll-animated-video";
import { LampContainer } from './lamp';
import { HandWrittenTitle } from './hand-writing-text';
import { LayeredText } from "./layered-text";
import { MagnetizeButton } from "./magnetize-button";
import { Skiper28 } from "./skiper28";

export default function MediaPlanScrollSection() {
  // Fixed configuration values
  const fontSize = 86;
  const lineHeight = 64;
  const baseOffset = 37;
  const letterSpacing = -4;
  
  return (
    <div style={{ position: 'relative' }}>
      {/* Lamp Section */}
      <LampContainer>
        <motion.h1
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="mt-8 py-4 text-center text-4xl font-medium tracking-tight md:text-7xl"
          style={{
            color: '#b8d4c8'
          }}
        >
          Stop Guessing. <br /> Start Planning.
        </motion.h1>
        
        <HandWrittenTitle 
          title="" 
          subtitle="Media Plan Calculator" 
        />
      </LampContainer>
      
      {/* Video Demo Section - Expanding Animation */}
      <div style={{ marginTop: '-40vh' }}>
        <HeroScrollVideo
          credits={null}
          title=""
          subtitle=""
          meta=""
          
          media="/assets/videos/media-plan-calculator-demo.webm"
          mediaType="video"
          muted={true}
          loop={true}
          playsInline={true}
          autoPlay={true}
          
          initialBoxSize={360}
          targetSize="fullscreen"
          scrollHeightVh={320}
        showHeroExitAnimation={true}
        sticky={true}
        overlayBlur={10}
        overlayRevealDelay={0.35}
        
        smoothScroll={false}
        
        overlay={{
          layout: "full-bleed",
          caption: null,
          heading: null,
          paragraphs: [],
          extra: (
            <div className="w-full h-screen flex items-center justify-center overflow-visible relative">
              <LayeredText 
                className="text-white italic !p-0 !m-0"
                lines={[
                  { top: "\u00A0", bottom: "Planning" },
                  { top: "Planning", bottom: "Analysis" },
                  { top: "Analysis", bottom: "Execution" },
                  { top: "Execution", bottom: "Growth" },
                  { top: "Growth", bottom: "Success" },
                  { top: "Success", bottom: "ROI" },
                  { top: "ROI", bottom: "\u00A0" }
                ]}
                colorMap={{
                  "\u00A0": "transparent",
                  "Planning": "#39FF14",
                  "Analysis": "#66FF66",
                  "Execution": "#99FF99",
                  "Growth": "#CCFFCC",
                  "Success": "#E6FFE6",
                  "ROI": "white"
                }}
                fontSize={fontSize}
                fontSizeMd={`${Math.floor(fontSize * 0.5)}px`}
                lineHeight={lineHeight}
                lineHeightMd={Math.floor(lineHeight * 0.6)}
                baseOffset={baseOffset}
                letterSpacing={letterSpacing}
              />
              
              {/* CTA Button - Media Planner */}
              <div className="absolute bottom-8 right-8">
                <MagnetizeButton 
                  particleCount={28}
                  attractRadius={50}
                  className="text-base font-semibold px-6 py-3 h-auto bg-[#39FF14] hover:bg-[#2ecc10] text-black border-none rounded-full"
                >
                  Access Calculator →
                </MagnetizeButton>
              </div>
            </div>
          )
        }}
      />
      </div>
      
      <Skiper28 />
    </div>
  );
}
