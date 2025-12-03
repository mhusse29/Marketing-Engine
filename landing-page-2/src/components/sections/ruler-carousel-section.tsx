"use client";

import { RulerCarousel, type CarouselItem } from "@/components/ui/ruler-carousel";

const originalItems: CarouselItem[] = [
  { id: 1, title: "GEN-4 TURBO" },
  { id: 2, title: "GEN-3 ALPHA" },
  { id: 3, title: "VEO 3" },
  { id: 4, title: "RAY-2" },
];

export default function RulerCarouselSection() {
  return (
    <section className="min-h-screen overflow-hidden flex items-center justify-center bg-white">
      <RulerCarousel originalItems={originalItems} />
    </section>
  );
}
