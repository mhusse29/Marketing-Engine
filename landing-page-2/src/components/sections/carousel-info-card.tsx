"use client";

import { ChevronRight } from "lucide-react";

const CarouselInfoCard = () => {
  return (
    <div className="flex w-full max-w-lg items-center justify-between gap-4 rounded-2xl bg-[rgba(20,20,20,0.95)] p-6 shadow-xl backdrop-blur-lg">
      <div className="flex flex-col gap-4">
        <p className="text-[15px] leading-relaxed text-zinc-200">
          <span className="font-semibold text-white">Colors.</span>
          Choose from three bold finishes. iPhone 17 Pro shown in Cosmic
          Orange Available in Cosmic Orange, Natural Titanium, and Space Black.
          Each finish{" "}
          <span className="text-[#ff8c66]">crafted with precision.</span>
        </p>
        <div className="flex items-center gap-2.5">
          <button
            aria-label="Select Natural Titanium color"
            className="h-3.5 w-3.5 rounded-full bg-[#E4E4E7] transition-transform hover:scale-110"
            title="Natural Titanium"
          />
          <button
            aria-label="Select Cosmic Orange color"
            className="h-3.5 w-3.5 rounded-full bg-[#f97316] ring-2 ring-white ring-offset-2 ring-offset-[#141414] transition-transform hover:scale-110"
            title="Cosmic Orange"
          />
          <button
            aria-label="Select Space Black color"
            className="h-3.5 w-3.5 rounded-full bg-[#1e293b] transition-transform hover:scale-110"
            title="Space Black"
          />
        </div>
      </div>
      <button
        aria-label="Next item"
        className="ml-4 flex-shrink-0 rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
};

export default CarouselInfoCard;