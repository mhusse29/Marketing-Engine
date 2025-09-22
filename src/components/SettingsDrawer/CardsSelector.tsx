import * as Switch from '@radix-ui/react-switch';
import * as Tooltip from '@radix-ui/react-tooltip';

import { useCardsStore } from '../../store/useCardsStore';
import type { SettingsState, CardKey } from '../../types';

interface CardsSelectorProps {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}

const CARD_LABELS: Record<CardKey, string> = {
  content: 'Content',
  pictures: 'Pictures / Prompt',
  video: 'Video Prompt',
};

const CARD_KEYS: CardKey[] = ['content', 'pictures', 'video'];

export function CardsSelector({ settings, onSettingsChange }: CardsSelectorProps) {
  const setEnabled = useCardsStore((state) => state.setEnabled);

  const handleToggle = (card: CardKey) => (value: boolean) => {
    setEnabled(card, value);
    onSettingsChange({
      ...settings,
      cards: {
        ...settings.cards,
        [card]: value,
      },
    });
  };

  return (
    <section className="space-y-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
        Cards to Generate
      </div>

      <div className="space-y-3">
        {CARD_KEYS.map((card) => (
          <CardToggleRow
            key={card}
            title={CARD_LABELS[card]}
            checked={Boolean(settings.cards[card])}
            onCheckedChange={handleToggle(card)}
          />
        ))}
      </div>
    </section>
  );
}

interface CardToggleRowProps {
  title: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}

function CardToggleRow({ title, checked, onCheckedChange }: CardToggleRowProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">{title}</span>
        <Tooltip.Root delayDuration={120}>
          <Tooltip.Trigger asChild>
            <span className="cursor-help text-white/60 transition-colors hover:text-white">ⓘ</span>
          </Tooltip.Trigger>
          <Tooltip.Content className="rounded-lg border border-white/10 bg-[#0B1220]/90 backdrop-blur-sm px-2.5 py-1.5 text-xs text-white/95">
            Turn on to include this in generation. Edit details from the top tabs.
          </Tooltip.Content>
        </Tooltip.Root>
      </div>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="relative h-6 w-11 rounded-full bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#3E8BFF] data-[state=checked]:to-[#6B70FF]"
      >
        <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
      </Switch.Root>
    </div>
  );
}
