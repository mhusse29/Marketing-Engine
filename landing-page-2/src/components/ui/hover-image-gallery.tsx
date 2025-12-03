"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HoverImageGalleryProps {
  images?: string[];
  className?: string;
  transparent?: boolean;
}

export function HoverImageGallery({
  images = [
    "https://images.masterworksfineart.com/product/marilyn-monroe-marilyn-1967-copy/andy-warhol-screenprint-marilyn-30-for-sale-not-ours-550x547.jpg",
    "https://images.masterworksfineart.com/product/marilyn-monroe-marilyn-1967-fs30/warholmarilynfs30-548x550.jpg",
    "https://images.masterworksfineart.com/product/marilyn-monroe-marilyn-1967-8/andy-warhol-screenprint-marilyn-monroe-for-sale-use-548x550.jpg",
    "https://images.masterworksfineart.com/product/marilyn-monroe-marilyn-1967-3/warhol-screenprint-marilyn-monroe-marilyn-1967-for-sale-543x550.jpg",
    "https://images.masterworksfineart.com/warhol-screenprint-marilyn-monroe-marilyn-1967-for-sale-3-550x550.jpg",
    "https://images.masterworksfineart.com/product/marilyn-monroe-marilyn-1967-5/andy-warhol-screenprint-warhol-marilyn-monroe-for-sale-550x550.jpeg",
    "https://images.masterworksfineart.com/product/marilyn-monroe-marilyn-1967-4/warhol-screenprint-marilyn-monroe-marilyn-1967-for-sale-550x550.jpg",
    "https://images.masterworksfineart.com/product/marilyn-monroe-marilyn-1967-10/marilyn-28-550x527.jpg",
    "https://images.masterworksfineart.com/product/marilyn-monroe-marilyn-1967-9/warhol-screenprint-marilyn-monroe-marilyn-1967-fs-22-for-sale-550x550.jpg",
    "https://images.masterworksfineart.com/product/marilyn-monroe-marilyn-1967-1-2/andy-warhol-screenprint-marilyn-monroe-marilyn-1967-for-sale-2-547x550.jpg",
    "https://images.masterworksfineart.com/product/marilyn-monroe-marilyn-1967-12/warholmary1-1-547x550.jpg"
  ],
  className = "",
  transparent = false,
}: HoverImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;

    // Update mouse position for tooltip
    setMousePosition({ x, y });

    // Calculate which image to show based on horizontal position
    const imageIndex = Math.floor((x / width) * images.length);
    const clampedIndex = Math.max(0, Math.min(images.length - 1, imageIndex));

    setCurrentImageIndex(clampedIndex);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <div className={`relative group ${className}`}>
      <motion.div
        className={`
          relative w-full h-full overflow-hidden rounded-2xl 
          shadow-2xl cursor-none
          ${transparent ? 'bg-transparent' : 'bg-black/20'}
        `}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Main displayed image with crossfade */}
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={images[currentImageIndex]}
            alt={`Gallery image ${currentImageIndex + 1}`}
            className={`
              w-full h-full object-cover
              ${transparent ? 'opacity-80' : 'opacity-100'}
            `}
            initial={{ opacity: 0 }}
            animate={{ opacity: transparent ? 0.8 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          />
        </AnimatePresence>

        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* Glassmorphic Tooltip with Both Chevrons */}
        <AnimatePresence>
          {isHovering && (
            <motion.div
              className="absolute pointer-events-none z-20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              style={{
                left: mousePosition.x,
                top: mousePosition.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="bg-white/20 backdrop-blur-md rounded-full p-2 shadow-lg border border-white/30 w-12 h-12 flex items-center justify-center">
                <div className="flex items-center space-x-1">
                  {/* Left Chevron */}
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>

                  {/* Right Chevron */}
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
