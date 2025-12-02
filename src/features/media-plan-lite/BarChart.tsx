import { useState } from 'react';

interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
}

export function BarChart({ data }: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  // Compact number formatter
  const formatCompact = (num: number): string => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {data.map((item, index) => {
        const widthPercent = (item.value / maxValue) * 100;
        const isHovered = hoveredIndex === index;
        // Safety fallback for color to prevent NaN
        const safeColor = item.color || '#49D3FF';
        
        return (
          <div 
            key={item.label} 
            className="flex items-center gap-3 group"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span className={`w-20 truncate text-xs transition-colors ${isHovered ? 'text-white font-medium' : 'text-white/60'}`}>
              {item.label}
            </span>
            <div className="flex-1 min-w-0 relative">
              <div className="h-8 w-full rounded-xl bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-xl transition-all duration-700 ease-out relative"
                  style={{
                    width: `${widthPercent}%`,
                    background: `linear-gradient(90deg, ${safeColor}99, ${safeColor}cc)`,
                    boxShadow: isHovered ? `0 0 16px ${safeColor}50` : `0 0 8px ${safeColor}20`,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${safeColor}40)`,
                    }}
                  />
                </div>
              </div>
              {isHovered && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20 text-xs text-white whitespace-nowrap pointer-events-none z-10">
                  <div className="font-semibold" style={{ color: safeColor }}>
                    {item.label}
                  </div>
                  <div className="text-white/80">{item.value.toLocaleString()}</div>
                </div>
              )}
            </div>
            <span className={`min-w-[60px] max-w-[80px] text-right text-xs font-semibold transition-colors truncate ${isHovered ? 'text-white' : 'text-white/70'}`}>
              {formatCompact(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default BarChart;
