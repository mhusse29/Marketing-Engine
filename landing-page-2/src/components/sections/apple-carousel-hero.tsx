"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const carouselItems = [
  {
    id: "camera-control",
    title: "Camera Control.",
    description: "Instantly take a photo, record video, adjust settings, and more. So you never miss a moment. Professional-grade camera system with advanced computational photography. Capture memories in stunning detail.",
    colorName: "Cosmic Orange",
    colorValue: "#f97316",
    image: "https://i.imgur.com/NfRWh2x.jpg",
  },
  {
    id: "colors",
    title: "Colors.",
    description: "Choose from three bold finishes. iPhone 17 Pro shown in Cosmic Orange. Available in Cosmic Orange, Natural Titanium, and Space Black. Each finish crafted with precision.",
    colorName: "Natural Titanium",
    colorValue: "#f1f5f9",
    image: "https://i.imgur.com/NfRWh2x.jpg",
  },
  {
    id: "display",
    title: "Display.",
    description: "The most advanced display ever on iPhone. ProMotion technology with adaptive refresh rates up to 120Hz. Always-On display keeps important information visible. Stunning brightness for any environment.",
    colorName: "Space Black",
    colorValue: "#1e293b",
    image: "https://i.imgur.com/NfRWh2x.jpg",
  },
];

const AppleCarouselHero = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % carouselItems.length);
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollWidth = scrollContainerRef.current.scrollWidth / carouselItems.length;
      scrollContainerRef.current.scrollTo({
        left: scrollWidth * activeIndex,
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  return (
    <section className="relative flex h-screen w-full items-center justify-center bg-black antialiased overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 h-full w-full">
        {carouselItems.map((item, index) => (
          <Image
            key={item.id}
            src={item.image}
            alt={`iPhone 17 Pro - ${item.title}`}
            fill
            priority={index === 0}
            className={cn(
              "object-cover transition-opacity duration-700 ease-in-out",
              activeIndex === index ? "opacity-100 z-10" : "opacity-0 z-0",
            )}
            style={{ objectPosition: "75% 50%" }}
            sizes="100vw"
          />
        ))}
      </div>

      {/* Bottom Scrollable Content Area */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center px-2 md:px-4">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          aria-label="Previous slide"
          className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full bg-neutral-800/70 text-white/80 backdrop-blur-sm transition-all hover:bg-neutral-700/90 hover:text-white hover:scale-110 z-30"
        >
          <ChevronLeft size={20} className="md:w-6 md:h-6" />
        </button>

        {/* Scrollable Content Container */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden scroll-smooth hide-scrollbar mx-3 md:mx-4"
          style={{ scrollSnapType: "x mandatory" }}
        >
          <div className="flex gap-4 pb-6 md:pb-8 pt-4">
            {carouselItems.map((item, index) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-[calc(100vw-120px)] md:w-[calc(100vw-180px)] lg:w-[900px] xl:w-[1100px] scroll-snap-align-center"
                style={{ scrollSnapAlign: "center" }}
              >
                <div className="rounded-2xl bg-black/60 p-6 md:p-8 lg:p-10 backdrop-blur-[20px] h-full">
                  <p className="text-[15px] font-normal leading-[1.6] text-white/90 tracking-[-0.01em]">
                    <span className="font-semibold text-white text-[16px]">{item.title}</span>{" "}
                    {item.description}
                  </p>
                  
                  {item.id === "colors" && (
                    <div className="mt-6 flex items-center gap-2">
                      {carouselItems.map((colorItem, colorIndex) => (
                        <button
                          key={colorItem.id}
                          onClick={() => setActiveIndex(colorIndex)}
                          aria-label={`Select ${colorItem.colorName} color`}
                          className="h-6 w-6 rounded-full transition-transform duration-200 ease-in-out focus:outline-none hover:scale-110"
                        >
                          <span
                            className={cn(
                              "block h-full w-full rounded-full ring-1 ring-inset ring-black/20 transition-all",
                              activeIndex === colorIndex
                                ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900"
                                : "hover:ring-1 hover:ring-white/50",
                            )}
                            style={{ backgroundColor: colorItem.colorValue }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          aria-label="Next slide"
          className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full bg-neutral-800/70 text-white/80 backdrop-blur-sm transition-all hover:bg-neutral-700/90 hover:text-white hover:scale-110 z-30"
        >
          <ChevronRight size={20} className="md:w-6 md:h-6" />
        </button>
      </div>
    </section>
  );
};

export default AppleCarouselHero;