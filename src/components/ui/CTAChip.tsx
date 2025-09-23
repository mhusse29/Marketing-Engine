import { cn } from '../../lib/format';

type CTAChipSize = 'default' | 'small';

type CTAChipProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  size?: CTAChipSize;
  className?: string;
};

export default function CTAChip({
  label,
  active = false,
  onClick,
  title,
  disabled = false,
  size = 'default',
  className,
}: CTAChipProps) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      aria-disabled={disabled}
      disabled={disabled}
      className={cn(
        'cta-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]',
        active && 'is-active',
        size === 'small' && 'small',
        disabled && 'opacity-65 cursor-not-allowed',
        className
      )}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.();
      }}
    >
      {label}
    </button>
  );
}
