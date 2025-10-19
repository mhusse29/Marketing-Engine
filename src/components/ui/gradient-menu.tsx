import {
  IoDocumentTextOutline, 
  IoImagesOutline, 
  IoVideocamOutline 
} from 'react-icons/io5';
import { cn } from '../../lib/format';

const menuItems = [
  { 
    title: 'Content', 
    icon: <IoDocumentTextOutline />
  },
  { 
    title: 'Pictures', 
    icon: <IoImagesOutline />
  },
  { 
    title: 'Video', 
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

  const handleItemClick = (item: string) => {
    onItemClick?.(item);
  };

  const handleMouseEnter = (item: string) => {
    onItemHover?.(item);
  };

  return (
    <>
      <div className="flex justify-center items-center">
        <div 
          className="flex gap-4 relative"
          onMouseLeave={onMouseLeave}
        >
          {menuItems.map(({ title, icon }, idx) => {
            const isValidated = validatedItems.includes(title.toLowerCase());
            
            return (
              <div 
                key={idx}
                className="relative"
                onMouseEnter={() => handleMouseEnter(title.toLowerCase())}
              >
                <button
                className={cn(
                  'relative w-[56px] h-[56px] rounded-full flex items-center justify-center',
                  'backdrop-blur-xl border',
                  'transition-all duration-500 ease-out',
                  'hover:w-[160px]',
                  'group cursor-pointer',
                  isValidated
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-500/30'
                    : 'bg-white/5 text-white/70 border-white/10'
                )}
                  onClick={() => handleItemClick(title.toLowerCase())}
                >
                  {/* Icon - initially visible */}
                  <span className={cn(
                    'relative z-10 transition-all duration-500 text-2xl',
                    'group-hover:scale-0 delay-0'
                  )}>
                    {icon}
                  </span>
                  
                  {/* Title - shown when hover */}
                  <span className={cn(
                    'absolute text-white uppercase tracking-wide text-xs font-medium',
                    'transition-all duration-500',
                    'scale-0 group-hover:scale-100 delay-150'
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
