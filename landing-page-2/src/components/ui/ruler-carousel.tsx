"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Rewind, FastForward } from "lucide-react";

export interface CarouselItem {
  id: number;
  title: string;
}

interface InfiniteCarouselItem {
  id: string;
  title: string;
  originalIndex: number;
}

// Create infinite items by triplicating the array
const createInfiniteItems = (originalItems: CarouselItem[]): InfiniteCarouselItem[] => {
  const items: InfiniteCarouselItem[] = [];
  for (let i = 0; i < 3; i++) {
    originalItems.forEach((item, index) => {
      items.push({
        id: `${i}-${item.id}`,
        title: item.title,
        originalIndex: index,
      });
    });
  }
  return items;
};

const RulerLines = ({
  top = true,
  totalLines = 100,
}: {
  top?: boolean;
  totalLines?: number;
}) => {
  const lines = [];
  const lineSpacing = 100 / (totalLines - 1);

  for (let i = 0; i < totalLines; i++) {
    const isFifth = i % 5 === 0;
    const isCenter = i === Math.floor(totalLines / 2);

    let height = "h-3";
    let color = "bg-gray-300";

    if (isCenter) {
      height = "h-8";
      color = "bg-gray-900";
    } else if (isFifth) {
      height = "h-4";
      color = "bg-gray-900";
    }

    const positionClass = top ? "" : "bottom-0";

    lines.push(
      <div
        key={i}
        className={`absolute w-0.5 ${height} ${color} ${positionClass}`}
        style={{ left: `${i * lineSpacing}%` }}
      />
    );
  }

  return <div className="relative w-full h-8 px-4">{lines}</div>;
};

export function RulerCarousel({
  originalItems,
}: {
  originalItems: CarouselItem[];
}) {
  const infiniteItems = createInfiniteItems(originalItems);
  const itemsPerSet = originalItems.length;

  // Start with the middle set, first item (index 0) centered
  const [activeIndex, setActiveIndex] = useState(itemsPerSet);
  const [isResetting, setIsResetting] = useState(false);
  const previousIndexRef = useRef(itemsPerSet);

  const handleItemClick = (newIndex: number) => {
    if (isResetting) return;

    // Find the original item index (0-8)
    const targetOriginalIndex = newIndex % itemsPerSet;

    // Find all instances of this item across the 3 copies
    const possibleIndices = [
      targetOriginalIndex, // First copy
      targetOriginalIndex + itemsPerSet, // Second copy
      targetOriginalIndex + itemsPerSet * 2, // Third copy
    ];

    // Find the closest index to current position
    let closestIndex = possibleIndices[0];
    let smallestDistance = Math.abs(possibleIndices[0] - activeIndex);

    for (const index of possibleIndices) {
      const distance = Math.abs(index - activeIndex);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestIndex = index;
      }
    }

    previousIndexRef.current = activeIndex;
    setActiveIndex(closestIndex);
  };

  const handlePrevious = () => {
    if (isResetting) return;
    setActiveIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (isResetting) return;
    setActiveIndex((prev) => prev + 1);
  };

  // Handle infinite scrolling
  useEffect(() => {
    if (isResetting) return;

    // If we're in the first set, jump to the equivalent position in the middle set
    if (activeIndex < itemsPerSet) {
      setIsResetting(true);
      setTimeout(() => {
        setActiveIndex(activeIndex + itemsPerSet);
        setIsResetting(false);
      }, 0);
    }
    // If we're in the last set, jump to the equivalent position in the middle set
    else if (activeIndex >= itemsPerSet * 2) {
      setIsResetting(true);
      setTimeout(() => {
        setActiveIndex(activeIndex - itemsPerSet);
        setIsResetting(false);
      }, 0);
    }
  }, [activeIndex, itemsPerSet, isResetting]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isResetting) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((prev) => prev - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((prev) => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isResetting]);

  // Calculate target position - center the active item
  // Each item is 400px wide + 100px gap = 500px per item
  // The flex container has 12 items (3 sets of 4)
  // We want the active item to be centered in the viewport
  // 
  // The motion.div is inside a centered flex container, so its natural position
  // has the flex content starting from the center of the viewport.
  // But we want item at activeIndex to be centered.
  //
  // For item I to be centered, we calculate how far it is from the center of the flex:
  // - Total items = 3 * itemsPerSet = 12
  // - Center of flex is at item index 6 (between items 5 and 6) for 12 items
  // - Actually, center is at totalWidth/2 = (12 * 500 - 100) / 2 ≈ 2950px
  // 
  // Simpler approach: Calculate x such that the center of item at activeIndex
  // is at position 0 (the center of the parent).
  // Item at index I has its center at: I * 500 + 200 (from flex start)
  // Total flex width ≈ 12 * 500 - 100 = 5900px (minus last gap)
  // Flex start is at -halfWidth from center due to justify-center
  // So item center from viewport center = I * 500 + 200 - totalWidth/2
  // To center it: x = -(I * 500 + 200 - totalWidth/2) = totalWidth/2 - I * 500 - 200
  //
  // Let's simplify: just offset based on distance from the base position
  const totalItems = infiniteItems.length; // 12
  const totalWidth = totalItems * 500 - 100; // Last item has no gap after it
  const halfWidth = totalWidth / 2;
  
  // Position of active item's center from start of flex
  const itemCenterFromStart = activeIndex * 500 + 200;
  
  // To center this item: x = halfWidth - itemCenterFromStart
  const targetX = halfWidth - itemCenterFromStart;

  // Get current page info
  const currentPage = (activeIndex % itemsPerSet) + 1;
  const totalPages = itemsPerSet;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-full h-[200px] flex flex-col justify-center relative">
        <div className="flex items-center justify-center">
          <RulerLines top />
        </div>
        <div className="flex items-center justify-center w-full h-full relative overflow-hidden">
          <motion.div
            className="flex items-center gap-[100px]"
            animate={{
              x: isResetting ? targetX : targetX,
            }}
            transition={
              isResetting
                ? { duration: 0 }
                : {
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    mass: 1,
                  }
            }
          >
            {infiniteItems.map((item, index) => {
              const isActive = index === activeIndex;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleItemClick(index)}
                  className={`text-4xl md:text-6xl font-bold whitespace-nowrap cursor-pointer flex items-center justify-center ${
                    isActive
                      ? "text-black"
                      : "text-black/30 hover:text-black/50"
                  }`}
                  animate={{
                    scale: isActive ? 1 : 0.75,
                    opacity: isActive ? 1 : 0.4,
                  }}
                  transition={
                    isResetting
                      ? { duration: 0 }
                      : {
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }
                  }
                  style={{
                    width: "400px",
                  }}
                >
                  {item.title}
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        <div className="flex items-center justify-center">
          <RulerLines top={false} />
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-10">
        <button
          onClick={handlePrevious}
          disabled={isResetting}
          className="flex items-center justify-center cursor-pointer"
          aria-label="Previous item"
        >
          <Rewind className="w-5 h-5 text-black" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-black">
            {currentPage}
          </span>
          <span className="text-sm text-black/50">
            /
          </span>
          <span className="text-sm font-medium text-black">
            {totalPages}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={isResetting}
          className="flex items-center justify-center cursor-pointer"
          aria-label="Next item"
        >
          <FastForward className="w-5 h-5 text-black" />
        </button>
      </div>
    </div>
  );
}
