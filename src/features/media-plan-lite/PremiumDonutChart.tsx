import { useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { premiumTheme, formatCompactNumber, formatCurrencyCompact } from './premium-theme';

interface DonutSegment {
  label: string;
  value: number;
  percent: number;
  color: string;
}

interface PremiumDonutChartProps {
  data: DonutSegment[];
  totalValue: number;
  currency?: string;
}

export function PremiumDonutChart({ data, totalValue, currency = 'USD' }: PremiumDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Spring animation for center value
  const springValue = useSpring(totalValue, {
    stiffness: 180,
    damping: 22,
  });
  
  const displayValue = useTransform(springValue, (latest) =>
    formatCurrencyCompact(latest, currency)
  );

  // SVG dimensions
  const size = 192; // 48 * 4 (12rem)
  const center = size / 2;
  const radius = 80;
  const innerRadius = 48;
  const strokeWidth = radius - innerRadius;

  // Calculate arc paths
  const createArcPath = (startAngle: number, endAngle: number, r: number): string => {
    const start = polarToCartesian(center, center, r, endAngle);
    const end = polarToCartesian(center, center, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    
    return [
      'M', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
    ].join(' ');
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Build segments with cumulative angles
  let cumulative = 0;
  const segments = data.map((item, index) => {
    const startAngle = cumulative;
    const endAngle = cumulative + (item.percent / 100) * 360;
    cumulative = endAngle;
    
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = radius + 20;
    const labelPos = polarToCartesian(center, center, labelRadius, midAngle);
    
    // Safety fallback for color to prevent NaN
    const safeColor = item.color || premiumTheme.accents.cyan;
    
    return {
      ...item,
      color: safeColor,
      startAngle,
      endAngle,
      midAngle,
      labelPos,
      arcPath: createArcPath(startAngle, endAngle, radius),
    };
  });

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="relative"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))' }}
      >
        {/* Segments */}
        {segments.map((segment, index) => (
          <g key={segment.label}>
            {/* Arc segment */}
            <motion.path
              d={segment.arcPath}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: hoveredIndex === index ? 0.9 : 0.7 }}
              transition={{
                pathLength: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.16 },
              }}
              style={{
                cursor: 'pointer',
                filter: hoveredIndex === index ? `drop-shadow(0 0 8px ${segment.color}80)` : 'none',
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            
            {/* Leader line (for segments > 5%) */}
            {segment.percent > 5 && (
              <line
                x1={polarToCartesian(center, center, radius + 4, segment.midAngle).x}
                y1={polarToCartesian(center, center, radius + 4, segment.midAngle).y}
                x2={segment.labelPos.x}
                y2={segment.labelPos.y}
                stroke={premiumTheme.textSecondary}
                strokeWidth="1"
                opacity="0.3"
              />
            )}
          </g>
        ))}
        
        {/* Center circle background */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill={premiumTheme.card}
          stroke={`rgba(255, 255, 255, 0.08)`}
          strokeWidth="1"
        />
      </svg>

      {/* Center value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.div
          className="font-semibold tabular-nums"
          style={{
            fontSize: 'clamp(18px, 4vw, 32px)',
            color: premiumTheme.textPrimary,
            lineHeight: 1,
          }}
        >
          {displayValue}
        </motion.div>
        <div
          className="text-xs uppercase tracking-wider mt-1"
          style={{
            color: premiumTheme.textSecondary,
            fontSize: 'clamp(9px, 1.5vw, 11px)',
          }}
        >
          Total
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredIndex !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.12 }}
          className="absolute pointer-events-none z-10 rounded-lg px-3 py-2 text-xs border"
          style={{
            top: segments[hoveredIndex].labelPos.y - center + size / 2,
            left: segments[hoveredIndex].labelPos.x - center + size / 2,
            backgroundColor: `${segments[hoveredIndex].color}28`,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            color: premiumTheme.textPrimary,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="font-semibold">{segments[hoveredIndex].label}</div>
          <div style={{ color: premiumTheme.textSecondary }}>
            {segments[hoveredIndex].percent.toFixed(1)}%
          </div>
        </motion.div>
      )}
    </div>
  );
}
