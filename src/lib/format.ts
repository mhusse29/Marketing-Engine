import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactNumber(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '--';
  }

  const abs = Math.abs(value);
  const suffix = abs >= 1_000_000 ? 'm' : abs >= 1_000 ? 'k' : '';
  const divisor = suffix === 'm' ? 1_000_000 : suffix === 'k' ? 1_000 : 1;
  const raw = value / divisor;
  const formatted = raw % 1 === 0 ? raw.toFixed(0) : raw.toFixed(1);
  return `${formatted}${suffix}`;
}
