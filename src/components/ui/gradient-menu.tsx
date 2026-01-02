import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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

export default function GradientMenu({ onItemClick, validatedItems = [] }: GradientMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside - shrinks pill back
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isInsidePills = containerRef.current?.contains(target);
      const isInsideSettingsPanel = target.closest('.cta-popover');
      
      if (!isInsidePills && !isInsideSettingsPanel) {
        setSelectedItem(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item: string) => {
    // Toggle selection - if already selected, deselect; otherwise select
    if (selectedItem === item) {
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
    }
    onItemClick?.(item);
  };

  return (
    <div className="flex justify-center items-center">
      <div 
        ref={containerRef}
        className="flex gap-4 relative"
        onMouseLeave={() => setHoveredItem(null)}
      >
        {menuItems.map(({ title, icon, value }) => {
          const isValidated = validatedItems.includes(value);
          const isHovered = hoveredItem === value;
          const isSelected = selectedItem === value;
          const isExpanded = isHovered || isSelected;
          
          return (
            <div 
              key={value}
              className="relative"
              onMouseEnter={() => setHoveredItem(value)}
            >
              <motion.button
                className={cn(
                  'relative h-[56px] rounded-full flex items-center justify-center',
                  'backdrop-blur-xl border',
                  'cursor-pointer overflow-hidden',
                  isValidated
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-500/30'
                    : isSelected
                    ? 'bg-white/10 text-white border-white/20'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/8 hover:border-white/15'
                )}
                initial={false}
                animate={{
                  width: isExpanded ? 160 : 56,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 28,
                }}
                onClick={() => handleItemClick(value)}
              >
                {/* Icon - fades out when expanded */}
                <motion.span 
                  className="relative z-10 text-2xl"
                  animate={{
                    scale: isExpanded ? 0 : 1,
                    opacity: isExpanded ? 0 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                >
                  {icon}
                </motion.span>
                
                {/* Title - shown when expanded */}
                <motion.span 
                  className="absolute text-white uppercase tracking-wide text-xs font-medium"
                  animate={{
                    scale: isExpanded ? 1 : 0.75,
                    opacity: isExpanded ? 1 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                >
                  {title}
                </motion.span>
              </motion.button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
