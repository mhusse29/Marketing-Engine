import { useEffect, useState } from 'react';
import { cn } from '../lib/format';

interface AnimatedCounterProps {
  value: number | null | undefined;
  formatter?: (value: number | null | undefined) => string;
}

const defaultFormatter = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }
  return value.toLocaleString();
};

export function AnimatedCounter({ value, formatter = defaultFormatter }: AnimatedCounterProps) {
  const [pop, setPop] = useState(false);

  useEffect(() => {
    setPop(true);
    const timeout = setTimeout(() => setPop(false), 320);
    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <span
      className={cn(
        'text-white font-semibold tabular-nums transition-transform duration-[320ms]',
        pop && 'scale-105'
      )}
    >
      {formatter(value)}
    </span>
  );
}
