import { motion } from 'framer-motion';
import { premiumTheme, formatCompactNumber, formatPercentage, formatCurrencyCompact } from './premium-theme';

interface BarData {
  label: string;
  value: number;
  color: string;
  format?: 'number' | 'percentage' | 'currency';
}

interface PremiumBarChartProps {
  data: BarData[];
  metricType: 'roi' | 'conversion' | 'engagement';
}

export function PremiumBarChart({ data, metricType }: PremiumBarChartProps) {
  const formatValue = (value: number, format?: string) => {
    if (format === 'percentage') return formatPercentage(value);
    if (format === 'currency') return formatCurrencyCompact(value, 'USD');
    return formatCompactNumber(value);
  };

  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
      }}
    >
      {data.map((item, index) => {
        // Safety fallback for color to prevent NaN in boxShadow
        const safeColor = item.color || premiumTheme.accents.cyan;
        
        return (
          <motion.div
            key={`${metricType}-${item.label}`}
            initial={{ y: 6, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -6, scale: 0.96 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 24,
              duration: 0.16,
              delay: index * 0.03,
            }}
            className="flex items-center gap-3 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
              border: `1px solid ${premiumTheme.border}`,
              padding: '8px 12px',
              minWidth: '156px',
              boxShadow: `0 0 0px ${safeColor}00, inset 0 0 0 0px ${safeColor}00`,
              transition: 'box-shadow 0.2s ease',
            }}
            whileHover={{
              boxShadow: `0 0 12px ${safeColor}40, inset 0 0 0 1px ${safeColor}20`,
            }}
          >
            {/* Color swatch with soft glow */}
            <span
              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: safeColor,
                boxShadow: `0 0 6px ${safeColor}80`,
              }}
            />

            {/* Channel name - left aligned */}
            <span
              className="flex-1 truncate"
              style={{
                fontSize: '13px',
                color: premiumTheme.textSecondary,
              }}
            >
              {item.label}
            </span>

            {/* Value - right aligned, tabular numerals */}
            <span
              className="tabular-nums font-semibold"
              style={{
                fontSize: 'clamp(12px, 2vw, 18px)',
                color: premiumTheme.textPrimary,
              }}
            >
              {formatValue(item.value, item.format)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
