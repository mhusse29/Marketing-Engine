"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

// AI Image data with model names and prompts
const aiImages = [
  {
    id: 1,
    src: "/AI images/-O4xKbGiS7uaDvVYCe8Oiw.png",
    model: "IDEOGRAM",
    prompt: "a colourful vector‑style illustration of a modern athletic sneaker with exaggerated curves and a patchwork of vibrant colours (teal, pink, yellow, purple and blue) on its panels; the shoe is set against a smooth gradient background blending magenta, violet and turquoise; energetic streaks and small star shapes accent the scene; large bold white typography spelling 'LEVEL UP' floats behind the shoe; clean crisp edges, flat shading with soft gradients, playful streetwear/arcade aesthetic",
  },
  {
    id: 2,
    src: "/AI images/NVyGBKgrTX6gYXIEHAamHg.png",
    model: "SD 3.5",
    prompt: "a photorealistic science‑fiction scene showing a massive futuristic structure in a desert landscape: a circular ring of polished black marble shot through with delicate white and pink veins, encircling a transparent glass dome patterned like solar panels; the object is perched on a rocky, windswept plain with distant mountains under a pale, partly cloudy sky; dramatic yet natural sunlight creates realistic reflections and highlights on the glossy surfaces and casts soft shadows on the sand; high level of detail, cinematic wide‑angle composition, realistic textures and lighting",
  },
  {
    id: 3,
    src: "/AI images/download.png",
    model: "SD 3.5",
    prompt: "a photorealistic science‑fiction scene showing a massive futuristic structure in a desert landscape: a circular ring of polished black marble shot through with delicate white and pink veins, encircling a transparent glass dome patterned like solar panels; the object is perched on a rocky, windswept plain with distant mountains under a pale, partly cloudy sky; dramatic yet natural sunlight creates realistic reflections and highlights on the glossy surfaces and casts soft shadows on the sand; high level of detail, cinematic wide‑angle composition, realistic textures and lighting",
  },
  {
    id: 4,
    src: "/AI images/hFPxQlg2QxuuYe0indl1BQ.png",
    model: "SD 3.5",
    prompt: "A photorealistic vintage 1970s American muscle car in beige parked on a dusty desert road. Tall saguaro cacti and dry shrubs surround the road, with rugged mountains in the distance. The sky is clear blue with a few fluffy clouds. The scene is shot in a wide-angle cinematic style with natural midday lighting.",
  },
  {
    id: 5,
    src: "/AI images/img-MoG4skbyEuOvazG3PfsNqtkT.png",
    model: "DALL-E 3",
    prompt: "A serene breakfast scene on a rustic wooden table in a tropical rainforest. A steaming bowl of oatmeal topped with sliced bananas, strawberries, and blueberries sits in the center. Wooden bowls of fresh berries, a glass of pink smoothie, and wooden utensils surround it. Sunbeams filter through dense jungle foliage, casting soft light and creating a dreamy, peaceful ambiance.",
  },
  {
    id: 6,
    src: "/AI images/k7gIovGPRdeMkaS5SpGSTw.png",
    model: "SD 3.5",
    prompt: "A surreal Art Nouveau‑inspired portrait of a woman seated in an ornate vintage chair. She wears a pleated purple skirt and bandeau top, and her hair, colored lavender, morphs into flames. The backdrop is an art‑deco frame with circular and triangular motifs in pastel lilac, teal, and cream. The overall mood is mystical and elegant, combining fantasy with vintage fashion design.",
  },
  {
    id: 7,
    src: "/AI images/orrs9OUfRBKRzYVLSxcAsg.png",
    model: "Flux Pro",
    prompt: "A stylized digital portrait of a young woman with long dark-blue hair and vivid green eyes. She wears a cream-colored off-the-shoulder top that drapes elegantly. Large gold hoop earrings accentuate her face. The background is an abstract swirl of blues, teals, and beiges with dynamic brush strokes and a soft triangular spotlight behind her head. The overall mood is serene and confident, with a modern painterly illustration style.",
  },
  {
    id: 8,
    src: "/AI images/sample (1).png",
    model: "Flux Pro",
    prompt: "A high‑contrast black‑and‑white studio portrait of a person with dark skin wearing a large, draped hood or headscarf. The subject is shown in profile against a pure white background, with dramatic lighting that emphasizes the facial contours and the texture of the fabric. The style is minimalist and fine‑art, evoking a serene and contemplative mood.",
  },
  {
    id: 9,
    src: "/AI images/sample (11).png",
    model: "SD 3.5",
    prompt: "A hyper-realistic image of a black panther reclining on a dark surface against a black background. The panther has glossy, subtly patterned fur, piercing golden eyes, and long white whiskers. Around its neck is a delicate string of pearls that drapes over its chest. The lighting is dramatic, creating striking highlights and shadows for a luxurious and mysterious mood.",
  },
  {
    id: 10,
    src: "/AI images/sample (13).png",
    model: "Flux Pro",
    prompt: "A highly detailed sci‑fi concept art of a large cylindrical space engine or satellite floating in outer space. The core of the engine glows bright orange like a fusion reactor, with sparks and metallic debris flying off as if it is charging or breaking apart. Surrounding the vessel are clouds of nebula, distant stars, and tiny planets. The scene is cinematic, with realistic metallic textures and dynamic lighting.",
  },
  {
    id: 11,
    src: "/AI images/sample (14).png",
    model: "Flux Pro",
    prompt: "A highly detailed sci‑fi concept art of a glossy, metallic disc-shaped platform hovering above a vast, rocky desert. The surface is smooth and fluid-like, with glowing white lines and patterns that resemble futuristic circuitry. Below, golden reflections highlight the underside. The background features distant hazy mountains and a bright, pale sky. The overall style is cinematic and realistic.",
  },
  {
    id: 12,
    src: "/AI images/sample (15).png",
    model: "SD 3.5",
    prompt: "An imaginative, picturesque coastal scene blending iconic elements. A whitewashed Mediterranean cliffside village cascades down a rugged, sunlit rock face toward a calm blue sea. The village is composed of cube‑shaped houses and chapels with rounded corners, many crowned with vibrant blue domes and accented by arched doorways and small bell towers. A palm tree and patches of greenery peek from terraces. In a whimsical twist, a statue resembling the Statue of Liberty stands atop the settlement, its green patina and raised torch contrasting with the Cycladic architecture. The background features a tranquil sea and distant, hazy mountains under a bright sky scattered with soft, fluffy clouds. Warm golden sunlight bathes everything, creating a serene and dreamlike atmosphere.",
  },
  {
    id: 13,
    src: "/AI images/sample (16).png",
    model: "SD 3.5",
    prompt: "A surreal, minimalist landscape featuring a vast, shallow reflective salt flat surrounded by distant, misty mountains. In the center stands an enormous upright rectangular monolith or mirror. The monolith's surface reflects the surrounding scenery and contains a glowing, white doorway cutout, hinting at an alternate dimension. Scattered dark mounds and puddles dot the reflective surface, and the sky is pale with soft fog rolling in. The entire scene is rendered in cool tones of blue and grey, evoking a calm, contemplative atmosphere.",
  },
  {
    id: 14,
    src: "/AI images/sample (2).png",
    model: "Flux Pro",
    prompt: "A high‑contrast black‑and‑white portrait of a person with dark skin, shown in side profile against a pure white background. They wear an intricately wrapped turban and a long scarf that covers part of their face and drapes around their neck and shoulders. The folds of the cloth are voluminous and layered, creating dramatic shapes. The subject's eyes are closed, conveying a sense of calm introspection. Dramatic lighting casts deep shadows and strong highlights, emphasizing the texture of the fabric and the contours of their face.",
  },
  {
    id: 15,
    src: "/AI images/sample (20).png",
    model: "Flux Pro",
    prompt: "A high‑contrast black‑and‑white portrait of a person with dark skin, shown in side profile against a pure white background. They wear an intricately wrapped turban and a long scarf that covers part of their face and drapes around their neck and shoulders. The folds of the cloth are voluminous and layered, creating dramatic shapes. The subject's eyes are closed, conveying a sense of calm introspection. Dramatic lighting casts deep shadows and strong highlights, emphasizing the texture of the fabric and the contours of their face.",
  },
  {
    id: 16,
    src: "/AI images/sample (3).png",
    model: "DALL-E 3",
    prompt: "Creative concept art with surreal elements, blending reality and imagination seamlessly",
  },
  {
    id: 17,
    src: "/AI images/sample (4).png",
    model: "IDEOGRAM",
    prompt: "Stylized illustration with bold typography integration and modern design aesthetics",
  },
  {
    id: 18,
    src: "/AI images/sample (5).jpeg",
    model: "Flux Pro",
    prompt: "Photorealistic scene with natural lighting, capturing authentic moments in high definition",
  },
  {
    id: 19,
    src: "/AI images/sample (6).jpeg",
    model: "SD 3.5",
    prompt: "Fantasy landscape with ethereal atmosphere, magical lighting and mystical elements",
  },
  {
    id: 20,
    src: "/AI images/sample (6).png",
    model: "DALL-E 3",
    prompt: "Abstract composition with geometric patterns, harmonious color palette and visual balance",
  },
  {
    id: 21,
    src: "/AI images/sample (7).jpeg",
    model: "IDEOGRAM",
    prompt: "Modern graphic design with clean lines, minimalist approach and impactful visual hierarchy",
  },
  {
    id: 22,
    src: "/AI images/sample (8).jpeg",
    model: "Flux Pro",
    prompt: "Studio quality portrait with professional retouching, perfect skin tones and sharp focus",
  },
  {
    id: 23,
    src: "/AI images/sample-2025-10-07T23-39-45.png",
    model: "DALL-E 3",
    prompt: "Contemporary art style with bold statement, unconventional perspective and artistic vision",
  },
  {
    id: 24,
    src: "/AI images/sample-2025-10-31T20-29-55.jpeg",
    model: "IDEOGRAM",
    prompt: "Seasonal themed design with festive elements, warm tones and celebratory mood",
  },
];

// Simple white text style for model names
const modelTextStyle = "text-white";

interface ImagePreviewModalProps {
  image: typeof aiImages[0] | null;
  onClose: () => void;
}

const ImagePreviewModal = ({ image, onClose }: ImagePreviewModalProps) => {
  if (!image) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 md:p-8"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20"
        aria-label="Close preview"
      >
        <X size={24} />
      </button>
      
      <div 
        className="relative flex h-full w-full max-w-6xl flex-col lg:flex-row gap-6 items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left - Image with real aspect ratio */}
        <div className="order-1 flex-1 flex items-center justify-center min-h-0">
          <Image
            src={image.src}
            alt={image.prompt}
            width={1920}
            height={1080}
            className="h-auto max-h-[60vh] lg:max-h-[80vh] w-auto max-w-full object-contain rounded-xl"
            quality={100}
            priority
          />
        </div>

        {/* Right Panel - Model & Prompt */}
        <div className="order-2 w-full lg:w-96 flex-shrink-0">
          <div className="relative rounded-3xl bg-white/10 backdrop-blur-2xl p-6 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
            {/* Glass highlight effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
            
            <div className="relative space-y-5">
              <div>
                <p className="text-xs text-white/50 mb-2">Model</p>
                <span className="text-lg font-bold text-white">
                  {image.model}
                </span>
              </div>
              
              <div>
                <p className="text-xs text-white/50 mb-2">Prompt</p>
                <div className="max-h-[250px] lg:max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  <p className="text-sm leading-relaxed text-white/90">
                    {image.prompt}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AIGallery = () => {
  const [selectedImage, setSelectedImage] = useState<typeof aiImages[0] | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll animation
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let animationId: number;
    const scrollSpeed = 0.5; // pixels per frame

    const animate = () => {
      if (!isPaused && container) {
        container.scrollLeft += scrollSpeed;
        
        // Reset to start when reaching the end
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
          container.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  return (
    <>
      <section className="relative w-full bg-black py-20">
        {/* Section Header */}
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24">
          <div className="mb-12">
            <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              AI Generated Gallery
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Explore stunning images created by leading AI models
            </p>
            
            {/* Model Legend */}
            <div className="mt-6 flex flex-wrap gap-6">
              {["Flux Pro", "SD 3.5", "DALL-E 3", "IDEOGRAM", "Nano Banana", "RUNWAY Gen-4"].map((model) => (
                <span
                  key={model}
                  className="text-sm font-semibold text-white"
                >
                  {model}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery Carousel */}
        <div 
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto px-6 pb-4 pt-2 hide-scrollbar md:px-12 lg:px-24"
          >
            {/* Duplicate images for seamless loop */}
            {[...aiImages, ...aiImages].map((image, index) => {
              return (
                <div
                  key={`${image.id}-${index}`}
                  className="group relative flex-shrink-0 w-[300px] md:w-[350px] cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-900">
                    <Image
                      src={image.src}
                      alt={image.model}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 300px, 350px"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/40">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-75">
                        <ZoomIn size={24} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Model name only */}
                  <div className="mt-3 text-center">
                    <span className="text-sm font-semibold text-white">
                      {image.model}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Preview Modal */}
      <ImagePreviewModal 
        image={selectedImage} 
        onClose={() => setSelectedImage(null)} 
      />
    </>
  );
};

export default AIGallery;
