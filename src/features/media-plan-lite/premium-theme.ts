/**
 * Premium Dark Theme with Neumorphism + Restrained Neon Glow
 * Exact tokens per spec - translucent surfaces to reveal grid
 */

export const premiumTheme = {
  // Background tokens
  bg: '#0A0E13',
  gridLines: 'rgba(255, 255, 255, 0.06)',
  surface: 'rgba(20, 26, 35, 0.72)',      // translucent to reveal grid
  card: 'rgba(16, 22, 31, 0.78)',         // translucent for major cards
  border: 'rgba(255, 255, 255, 0.08)',
  
  // Text tokens
  textPrimary: '#E9EEF6',
  textSecondary: '#A7B1C2',
  
  // Neon accent colors (restrained) - matched to menu bar
  accents: {
    cyan: '#49D3FF',
    violet: '#B78CFF',
    mint: '#10b981',        // Matched to menu bar emerald-500
    amber: '#FFD166',
    coral: '#FF8C73',
  },
  
  // Glow utilities (restrained, not cartoonish)
  glows: {
    outer: '0 0 16px rgba(73, 211, 255, 0.25)',
    soft: '0 0 10px rgba(183, 140, 255, 0.18)',
  },
  
  // Neumorphism shadows (soft depth)
  shadows: {
    outer: '0 10px 28px rgba(0, 0, 0, 0.45)',
    inner: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
    combined: '0 10px 28px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  },
  
  // Border radius
  radius: {
    xl: '16px',
  },
  
  // Spacing tokens
  spacing: {
    lg: '24px',
    md: '16px',
    sm: '12px',
  },
  
  // Animation easing (no fades)
  easing: {
    smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
    spring: { stiffness: 180, damping: 22 },
  },
  
  // Durations
  duration: {
    fast: 160,
    medium: 220,
    slow: 280,
  },
  
  // Card gradient (translucent to reveal grid)
  cardGradient: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
} as const;

/**
 * Compact number formatter
 * Returns SI-style notation: 1.2K, 1.2M, 1.2B
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
}

/**
 * Format percentage with 1 decimal
 */
export function formatPercentage(num: number): string {
  return `${num.toFixed(1)}%`;
}

/**
 * Format currency compact
 */
export function formatCurrencyCompact(num: number, currency: string = 'USD'): string {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
  if (num >= 1_000_000) return `${symbol}${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${symbol}${(num / 1_000).toFixed(1)}K`;
  return `${symbol}${num.toFixed(0)}`;
}

/**
 * Get chart accent color by index
 */
export function getAccentColor(index: number): string {
  const colors = Object.values(premiumTheme.accents);
  return colors[index % colors.length];
}
