"use client";

import { cn } from "@/lib/utils";

interface CarouselNavigationDotsProps {
  totalSlides: number;
  activeIndex: number;
  onDotClick: (index: number) => void;
  className?: string;
}

const CarouselNavigationDots = ({
  totalSlides,
  activeIndex,
  onDotClick,
  className,
}: CarouselNavigationDotsProps) => {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          aria-label={`Go to slide ${index + 1} of ${totalSlides}`}
          onClick={() => onDotClick(index)}
          className={cn(
            "h-2 w-2 rounded-full cursor-pointer transition-all duration-300 ease-in-out hover:scale-110",
            activeIndex === index ? "bg-white" : "bg-dot-inactive"
          )}
        />
      ))}
    </div>
  );
};

export default CarouselNavigationDots;