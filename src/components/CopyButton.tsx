/**
 * Copy to Clipboard Button Component
 * One-click copy with visual feedback
 */

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../lib/format';

interface CopyButtonProps {
  text: string;
  className?: string;
  label?: string;
}

export function CopyButton({ text, className, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md',
        'text-[11px] font-medium uppercase tracking-wide',
        'transition-all duration-200',
        copied
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80',
        className
      )}
      aria-label={copied ? 'Copied!' : label}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}


