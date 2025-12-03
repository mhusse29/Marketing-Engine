'use client';

import { WavyBlock, WavyBlockItem } from '@/components/ui/wavy-text-block';

const titles = [
  'Text-to-Video',
  'Image-to-Video',
  'Motion Control',
  'Style Transfer',
  'Cinematic AI',
  'Brand Ready',
  '4K Output',
];

export default function WavyTextSection() {
  return (
    <section className="h-[200vh] pt-40 overflow-hidden bg-white">
      <div className="max-w-6xl">
        <WavyBlock className="flex flex-col justify-start items-start gap-6">
          {titles.map((title, index) => (
            <WavyBlockItem key={title} index={index}>
              <h2 className="text-[9.3vw] font-bold leading-none tracking-tighter uppercase whitespace-nowrap text-gray-900">
                {title}
              </h2>
            </WavyBlockItem>
          ))}
        </WavyBlock>
      </div>
    </section>
  );
}
