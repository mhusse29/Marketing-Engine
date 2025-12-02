import { useState } from 'react';
import {
  IoDocumentTextOutline,
  IoImagesOutline,
  IoVideocamOutline,
} from 'react-icons/io5';
import { cn } from '../../lib/format';

const menuItems = [
  { 
    title: 'Content',
    value: 'content',
    icon: <IoDocumentTextOutline />
  },
  { 
    title: 'Pictures',
    value: 'pictures',
    icon: <IoImagesOutline />
  },
  { 
    title: 'Video',
    value: 'video',
    icon: <IoVideocamOutline />
  }
];

interface GradientMenuProps {
  onItemClick?: (item: string) => void;
  validatedItems?: string[];
  onItemHover?: (item: string) => void;
  onMouseLeave?: () => void;
}

export default function GradientMenu({ onItemClick, validatedItems = [], onItemHover, onMouseLeave }: GradientMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleItemClick = (item: string) => {
    onItemClick?.(item);
  };

  const handleMouseEnter = (item: string) => {
    setHoveredItem(item);
    onItemHover?.(item);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
    onMouseLeave?.();
  };

  return (
    <>
      <div className="flex justify-center items-center">
        <div 
          className="flex gap-4 relative"
          onMouseLeave={handleMouseLeave}
        >
          {menuItems.map(({ title, icon, value }) => {
            const isValidated = validatedItems.includes(value);
            const isHovered = hoveredItem === value;
            
            return (
              <div 
                key={value}
                className="relative"
                onMouseEnter={() => handleMouseEnter(value)}
              >
                <button
                className={cn(
                  'relative h-[56px] rounded-full flex items-center justify-center',
                  'backdrop-blur-xl border',
                  'cursor-pointer overflow-hidden',
                  // Smooth liquid transition - slower and more fluid
                  'transition-[width,background,border-color,box-shadow] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                  // Width based on hover state
                  isHovered ? 'w-[160px]' : 'w-[56px]',
                  isValidated
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-500/30'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/8 hover:border-white/15'
                )}
                  onClick={() => handleItemClick(value)}
                >
                  {/* Icon - initially visible, fades out on hover */}
                  <span className={cn(
                    'relative z-10 text-2xl',
                    'transition-all duration-500 ease-out',
                    isHovered ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                  )}>
                    {icon}
                  </span>
                  
                  {/* Title - shown when hover with delay */}
                  <span className={cn(
                    'absolute text-white uppercase tracking-wide text-xs font-medium',
                    'transition-all duration-500 ease-out',
                    isHovered ? 'scale-100 opacity-100 delay-100' : 'scale-75 opacity-0'
                  )}>
                    {title}
                  </span>
                </button>

              </div>
            );
          })}
        </div>
      </div>

    </>
  );
}
