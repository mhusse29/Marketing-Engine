import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cn } from '../../lib/format';
import { AnimatedCounter } from '../AnimatedCounter';
import type { Goal, SettingsState } from '../../types';
import { pullMediaPlan } from '../../store/settings';

interface MediaPlannerProps {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}

type MediaPlanPatch = Partial<SettingsState['mediaPlan']>;

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'EGP'] as const;
const MARKETS = [
  'United States',
  'United Kingdom',
  'United Arab Emirates',
  'Saudi Arabia',
  'Egypt',
  'France',
  'Germany',
];

const tooltipDark =
  'rounded-lg border border-white/10 bg-[#0B1220]/90 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,.6)] px-2.5 py-1.5 text-xs text-white/95 z-50';

const goals: Goal[] = ['Awareness', 'Traffic', 'Leads', 'Sales'];

const goalTips: Record<Goal, string> = {
  Awareness: 'Top-funnel reach.',
  Traffic: 'Site visits & mid-funnel clicks.',
  Leads: 'Capture interest for nurture.',
  Sales: 'Drive conversions now.',
};

export function MediaPlanner({ settings, onSettingsChange }: MediaPlannerProps) {
  const { mediaPlan } = settings;
  const [open, setOpen] = useState(true);
  const [pulling, setPulling] = useState(false);
  const autoCollapsed = useRef(false);
  const [useCustomMarket, setUseCustomMarket] = useState(() => {
    const current = mediaPlan.market;
    return Boolean(current && !MARKETS.includes(current));
  });

  const updateMediaPlan = (patch: MediaPlanPatch) => {
    const coreFields: Array<keyof SettingsState['mediaPlan']> = ['budget', 'market', 'goal', 'currency'];
    const coreFieldChanged = coreFields.some((field) =>
      Object.prototype.hasOwnProperty.call(patch, field) && patch[field] !== mediaPlan[field]
    );

    const nextSummary = Object.prototype.hasOwnProperty.call(patch, 'summary')
      ? patch.summary ?? null
      : coreFieldChanged
        ? null
        : mediaPlan.summary ?? null;

    onSettingsChange({
      ...settings,
      mediaPlan: {
        ...mediaPlan,
        ...patch,
        summary: nextSummary,
      },
    });
  };

  const handleBudgetChange = (raw: string) => {
    if (!raw) {
      updateMediaPlan({ budget: null });
      return;
    }
    const numeric = Number(raw);
    updateMediaPlan({ budget: Number.isFinite(numeric) ? numeric : null });
  };

  const handleMarketChange = (value: string) => {
    updateMediaPlan({ market: value.trim() ? value : null });
  };

  const handleCurrencyChange = (value: string) => {
    updateMediaPlan({ currency: value ? (value as SettingsState['mediaPlan']['currency']) : null });
  };

  const handleGoalSelect = (goal: Goal) => {
    updateMediaPlan({ goal });
  };

  useEffect(() => {
    if (mediaPlan.market && !MARKETS.includes(mediaPlan.market)) {
      setUseCustomMarket(true);
    } else if (mediaPlan.market && MARKETS.includes(mediaPlan.market)) {
      setUseCustomMarket(false);
    }
  }, [mediaPlan.market]);

  const marketSelectValue = useCustomMarket ? '__custom' : mediaPlan.market ?? '';

  const handleMarketSelectChange = (value: string) => {
    if (value === '__custom') {
      setUseCustomMarket(true);
      if (!mediaPlan.market || MARKETS.includes(mediaPlan.market)) {
        updateMediaPlan({ market: '' });
      }
      return;
    }

    setUseCustomMarket(false);

    if (!value) {
      updateMediaPlan({ market: null });
      return;
    }

    updateMediaPlan({ market: value });
  };

  const hasCoreFields = useMemo(
    () =>
      Boolean(
        mediaPlan.budget &&
          mediaPlan.budget > 0 &&
          mediaPlan.currency &&
          mediaPlan.market &&
          mediaPlan.goal
      ),
    [mediaPlan.budget, mediaPlan.currency, mediaPlan.goal, mediaPlan.market]
  );

  useEffect(() => {
    if (open && hasCoreFields && !autoCollapsed.current) {
      setOpen(false);
      autoCollapsed.current = true;
    }
  }, [hasCoreFields, open]);

  const handlePullPlan = async () => {
    if (!hasCoreFields || pulling) {
      return;
    }

    setPulling(true);
    try {
      if (!mediaPlan.goal || !mediaPlan.market || !mediaPlan.currency || !mediaPlan.budget) {
        return;
      }
      const summary = await pullMediaPlan({
        budget: mediaPlan.budget,
        market: mediaPlan.market,
        goal: mediaPlan.goal,
        currency: mediaPlan.currency,
      });
      updateMediaPlan({ summary });
      if (!autoCollapsed.current) {
        setOpen(false);
        autoCollapsed.current = true;
      }
    } catch (error) {
      console.error('Failed to pull media plan', error);
    } finally {
      setPulling(false);
    }
  };

  const summary = mediaPlan.summary;

  const kpis = useMemo(() => {
    if (!summary) {
      return null;
    }

    const impressionSafe = Math.max(summary.impressions || 0, 1);
    const reachPct = Math.min((summary.reach || 0) / impressionSafe, 1);
    const clickRate = summary.impressions ? (summary.clicks / summary.impressions) * 100 : 0;
    const clickRatePct = Math.min(clickRate / 5, 1);
    const roasPct = Math.min((summary.roas || 0) / 5, 1);

    return [
      {
        label: 'Reach',
        value: summary.reach ?? 0,
        display: summary.reach ? summary.reach.toLocaleString() : '--',
        percent: reachPct,
        gradient: 'from-[#3E8BFF] to-[#6B70FF]',
      },
      {
        label: 'Click-through',
        value: clickRate,
        display: summary.clicks && summary.impressions ? `${clickRate.toFixed(1)}%` : '--',
        percent: clickRatePct,
        gradient: 'from-[#6B70FF] to-[#A855F7]',
      },
      {
        label: 'ROAS',
        value: summary.roas ?? 0,
        display: summary.roas ? `${summary.roas.toFixed(1)}x` : '--',
        percent: roasPct,
        gradient: 'from-[#18C964] to-[#0EA5E9]',
      },
    ];
  }, [summary]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-2xl px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-blue-500/35"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Media Planner</span>
          <Tooltip.Root delayDuration={100}>
            <Tooltip.Trigger asChild>
              <span className="cursor-help text-white/60 transition-colors hover:text-white/80">ⓘ</span>
            </Tooltip.Trigger>
            <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
              Set budget, currency, market, and goal.
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <ChevronRight
          className={cn(
            'h-4 w-4 text-white/60 transition-transform duration-200',
            open && 'rotate-90 text-white/80'
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="media-plan-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-4 px-4 pb-4 pt-2">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <FieldWithTip label="Budget" tip="Media spend only; excludes fees.">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="25000"
                    value={mediaPlan.budget ?? ''}
                    onChange={(event) => handleBudgetChange(event.target.value)}
                    className="h-12 w-full rounded-xl border-0 bg-white/5 px-3 text-sm text-white/90 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/35"
                  />
                </FieldWithTip>

                <FieldWithTip label="Market" tip="Country/region for delivery.">
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        value={marketSelectValue}
                        onChange={(event) => handleMarketSelectChange(event.target.value)}
                        className="h-12 w-full appearance-none rounded-xl border-0 bg-white/5 px-3 pr-10 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500/35"
                      >
                        <option value="">Select market</option>
                        {MARKETS.map((market) => (
                          <option key={market} value={market}>
                            {market}
                          </option>
                        ))}
                        <option value="__custom">Custom…</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                    </div>
                    {useCustomMarket && (
                      <input
                        type="text"
                        placeholder="Enter market"
                        value={mediaPlan.market ?? ''}
                        onChange={(event) => handleMarketChange(event.target.value)}
                        className="h-12 w-full rounded-xl border border-white/12 bg-white/5 px-3 text-sm text-white/90 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/35"
                      />
                    )}
                  </div>
                </FieldWithTip>

                <FieldWithTip label="Currency" tip="Billing currency for plan math.">
                  <select
                    value={mediaPlan.currency ?? ''}
                    onChange={(event) => handleCurrencyChange(event.target.value)}
                    className="h-12 w-full rounded-xl border-0 bg-white/5 px-3 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500/35"
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </FieldWithTip>

                <FieldWithTip label="Goal" tip="Pick the primary objective." className="lg:col-span-2">
                  <div className="no-scrollbar overflow-x-auto">
                    <div className="flex min-w-max gap-2.5 whitespace-nowrap py-0.5">
                      {goals.map((goal) => (
                        <Tooltip.Root key={goal} delayDuration={100}>
                          <Tooltip.Trigger asChild>
                            <button
                              type="button"
                              onClick={() => handleGoalSelect(goal)}
                              className={cn(
                                'h-9 rounded-full border border-white/12 bg-white/5 px-3.5 text-sm text-white/80 transition-colors',
                                mediaPlan.goal === goal &&
                                  'bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[inset_0_0_0_2px_rgba(62,139,255,0.25)]'
                              )}
                            >
                              {goal}
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
                            {goalTips[goal]}
                          </Tooltip.Content>
                        </Tooltip.Root>
                      ))}
                    </div>
                  </div>
                </FieldWithTip>
              </div>

              <div className="flex justify-end">
                <Tooltip.Root delayDuration={100}>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      onClick={handlePullPlan}
                      disabled={!hasCoreFields || pulling}
                      className={cn(
                        'inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold transition-all',
                        hasCoreFields && !pulling
                          ? 'bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[0_6px_20px_rgba(62,139,255,0.35)] hover:brightness-110'
                          : 'cursor-not-allowed border border-white/10 bg-white/5 text-white/50'
                      )}
                    >
                      {pulling ? 'Pulling…' : 'Pull plan'}
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
                    Pull a simulated plan preview.
                  </Tooltip.Content>
                </Tooltip.Root>
              </div>

              {summary && kpis && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="grid gap-3">
                    {kpis.map(({ label, display, percent, gradient, value }) => (
                      <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-white/70">
                          <span className="uppercase tracking-[0.18em] text-white/50">{label}</span>
                          <AnimatedCounter value={value} formatter={() => display} />
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className={cn('h-full rounded-full bg-gradient-to-r', gradient)}
                            style={{ width: `${Math.max(0.12, Math.min(percent, 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FieldWithTipProps {
  label: string;
  tip: string;
  children: ReactNode;
  className?: string;
}

function FieldWithTip({ label, tip, children, className }: FieldWithTipProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
        <span>{label}</span>
        <Tooltip.Root delayDuration={100}>
          <Tooltip.Trigger asChild>
            <span className="cursor-help text-white/50 transition-colors hover:text-white/80">ⓘ</span>
          </Tooltip.Trigger>
          <Tooltip.Content side="top" sideOffset={6} className={tooltipDark}>
            {tip}
          </Tooltip.Content>
        </Tooltip.Root>
      </div>
      {children}
    </div>
  );
}
