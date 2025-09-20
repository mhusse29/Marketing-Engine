import type { KeyboardEvent } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cn } from '../../lib/format';
import type { SettingsState } from '../../types';

interface OutputVersionsProps {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}

const tooltipDark =
  'rounded-lg border border-white/10 bg-[#0B1220]/90 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,.6)] px-2.5 py-1.5 text-xs text-white/95';

const OPTIONS: ReadonlyArray<{ val: 1 | 2; tip: string }> = [
  { val: 1, tip: 'One variant (recommended)' },
  { val: 2, tip: 'Two = A/B variants' },
];

export function OutputVersions({ settings, onSettingsChange }: OutputVersionsProps) {
  const setVersions = (value: 1 | 2) => {
    if (settings.versions === value) return;
    onSettingsChange({
      ...settings,
      versions: value,
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const buttons = event.currentTarget
      .closest('[role="radiogroup"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]');

    if (!buttons || buttons.length === 0) return;

    const lastIndex = buttons.length - 1;
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = (index + 1) % buttons.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = (index - 1 + buttons.length) % buttons.length;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = lastIndex;
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        setVersions(OPTIONS[index].val);
        return;
      default:
        return;
    }

    if (nextIndex !== null) {
      buttons[nextIndex]?.focus();
      setVersions(OPTIONS[nextIndex].val);
    }
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold tracking-[0.24em] text-white/60">OUTPUT VERSIONS</span>
        <Tooltip.Root delayDuration={100}>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              aria-label="About output versions"
              className="text-white/60 transition-colors hover:text-white/80"
            >
              ⓘ
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
            Choose how many variants to generate.
          </Tooltip.Content>
        </Tooltip.Root>
      </div>

      <div role="radiogroup" className="flex flex-wrap gap-2">
        {OPTIONS.map((option, index) => {
          const isActive = settings.versions === option.val;
          const button = (
            <button
              key={option.val}
              type="button"
              role="radio"
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setVersions(option.val)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                'h-10 rounded-full border border-white/12 bg-white/5 px-3.5 text-sm text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/35',
                isActive && 'bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[inset_0_0_0_2px_rgba(62,139,255,0.25)]'
              )}
            >
              {option.val} {option.val === 1 ? 'Version' : 'Versions'}
            </button>
          );

          return (
            <Tooltip.Root key={option.val} delayDuration={80}>
              <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
              <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
                {option.tip}
              </Tooltip.Content>
            </Tooltip.Root>
          );
        })}
      </div>
    </section>
  );
}
