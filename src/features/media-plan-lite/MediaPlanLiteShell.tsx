import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, TrendingUp, Settings as SettingsIcon, Table2, BarChart3, Palette, Download } from 'lucide-react';
import { BarChart } from './BarChart';
import { WavyLineChart } from './WavyLineChart';
import { ThemeProvider, useTheme } from './ThemeContext';
import { PremiumDonutChart } from './PremiumDonutChart';
import { PremiumBarChart } from './PremiumBarChart';
import { premiumTheme, getAccentColor } from './premium-theme';

import { cn } from '../../lib/format';
import {
  markMediaPlanSectionValidated,
  pullPlanSummary,
  updatePlanField,
  useHydrateMediaPlan,
  useMediaPlanState,
  setChannels,
  setChannelSplits,
  setManualCplValues,
} from '../../store/useMediaPlanStore';
import type { Goal, ChannelMode, ChartMetricType, CampaignDuration } from '../../types';

const MARKET_OPTIONS = [
  'United States',
  'United Kingdom',
  'United Arab Emirates',
  'Saudi Arabia',
  'Egypt',
  'France',
  'Germany',
] as const;

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'EGP'] as const;
const GOALS: Goal[] = ['Awareness', 'Traffic', 'Leads', 'Sales'];
const CHANNEL_OPTIONS = ['Meta Ads', 'Google Ads', 'TikTok', 'LinkedIn', 'YouTube', 'Snapchat'] as const;
const pillInputClass =
  'w-full rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-white/90 placeholder-white/40 focus:border-emerald-300/50 focus:outline-none';

type NichePreset = {
  id: string;
  label: string;
  leadToSalePct: number;
  revenuePerSale: number;
  description: string;
};

const NICHE_OPTIONS: NichePreset[] = [
  {
    id: 'fintech-saas',
    label: 'Fintech SaaS',
    leadToSalePct: 18,
    revenuePerSale: 720,
    description: 'B2B trials with long diligence cycles and high ACV.',
  },
  {
    id: 'healthcare-platform',
    label: 'Healthcare Platform',
    leadToSalePct: 22,
    revenuePerSale: 880,
    description: 'Physician-reviewed journeys with compliance checkpoints.',
  },
  {
    id: 'luxury-retail',
    label: 'Luxury Retail',
    leadToSalePct: 11,
    revenuePerSale: 950,
    description: 'High-AOV collections for premium shoppers.',
  },
  {
    id: 'dtc-beauty',
    label: 'DTC Beauty',
    leadToSalePct: 16,
    revenuePerSale: 260,
    description: 'Subscription-friendly SKUs with rapid attribution.',
  },
  {
    id: 'b2b-infra',
    label: 'B2B Infrastructure',
    leadToSalePct: 15,
    revenuePerSale: 1050,
    description: 'Long sales cycles that rely on demos and pilots.',
  },
  {
    id: 'mobility-ev',
    label: 'Mobility & EV',
    leadToSalePct: 9,
    revenuePerSale: 1400,
    description: 'Fleet and EV rollouts with regional launches.',
  },
  {
    id: 'real-estate',
    label: 'Real Estate',
    leadToSalePct: 8,
    revenuePerSale: 1600,
    description: 'Property launches that depend on nurturing flows.',
  },
  {
    id: 'consumer-app',
    label: 'Consumer App',
    leadToSalePct: 24,
    revenuePerSale: 180,
    description: 'Freemium installs needing aggressive retargeting.',
  },
  {
    id: 'education-tech',
    label: 'Education Tech',
    leadToSalePct: 17,
    revenuePerSale: 520,
    description: 'Cohort-based programs with blended CAC.',
  },
];

const DEFAULT_NICHE_BASELINE: Pick<NichePreset, 'leadToSalePct' | 'revenuePerSale'> = {
  leadToSalePct: 12,
  revenuePerSale: 480,
};

const MARKET_MULTIPLIERS: Record<string, number> = {
  'United States': 1,
  'United Kingdom': 1.04,
  'United Arab Emirates': 1.12,
  'Saudi Arabia': 1.09,
  Egypt: 0.82,
  France: 1.02,
  Germany: 1.03,
};

const CURRENCY_WEIGHT: Record<string, number> = {
  USD: 1,
  EUR: 1.02,
  GBP: 1.08,
  AED: 0.76,
  SAR: 0.74,
  EGP: 0.32,
};

const SPLIT_TARGET = 100;
const SPLIT_TOLERANCE = 5;
const FX_ENDPOINT = 'https://open.er-api.com/v6/latest';
type FxQuote = {
  base: string;
  fetchedAt: string;
  rates: Record<string, number>;
};
const FX_CACHE_TTL = 1000 * 60 * 5;
const FX_COVERAGE_LABEL = CURRENCY_OPTIONS.join(' • ');
const DEFAULT_MANUAL_CHANNELS = CHANNEL_OPTIONS.slice(0, 3);
const FALLBACK_CHANNELS = [
  { label: 'Meta Ads', percent: 32, color: '#3E8BFF' },
  { label: 'Google Ads', percent: 24, color: '#7C5DFA' },
  { label: 'YouTube', percent: 18, color: '#F97316' },
  { label: 'TikTok', percent: 15, color: '#1DE9B6' },
  { label: 'LinkedIn', percent: 11, color: '#F472B6' },
];

const getNichePreset = (value: string | null): NichePreset | null =>
  NICHE_OPTIONS.find((option) => option.label === value || option.id === value) ?? null;

const computeBudgetFactor = (budget: number): number => {
  const normalized = Math.log10(Math.max(budget, 1000)) - 3;
  return Math.min(Math.max(normalized, 0), 2) / 2;
};

const derivePerformanceDefaults = ({
  budget,
  market,
  currency,
  niche,
}: {
  budget: number;
  market: string;
  currency: string;
  niche: string | null;
}): { leadToSalePct: number; revenuePerSale: number } | null => {
  if (!budget || !market || !niche || !currency) {
    return null;
  }
  const preset = getNichePreset(niche) ?? DEFAULT_NICHE_BASELINE;
  const marketMultiplier = MARKET_MULTIPLIERS[market] ?? 1;
  const currencyWeight = CURRENCY_WEIGHT[currency as keyof typeof CURRENCY_WEIGHT] ?? 1;
  const budgetFactor = computeBudgetFactor(budget);
  const lead = Math.round((preset.leadToSalePct + budgetFactor * 6) * 10) / 10;
  const revenue = Math.round(
    preset.revenuePerSale * marketMultiplier * (1 + budgetFactor * 0.45) * currencyWeight
  );
  return {
    leadToSalePct: lead,
    revenuePerSale: revenue,
  };
};

const formatCurrencyValue = (value: number | null | undefined, currency: string): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '--';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    }).format(value);
  } catch {
    return value.toFixed(0);
  }
};

const formatTimestamp = (value?: string | null): string => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

const sumSplits = (channels: string[], splits: Record<string, number>): number =>
  channels.reduce((total, channel) => total + (splits[channel] ?? 0), 0);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const normalizeSeries = (values: number[]): number[] => {
  if (values.length === 0) {
    return [];
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return values.map((value) => (value - min) / range);
};

interface MediaPlanLiteShellProps {
  displayUnlocked: boolean;
}

function MediaPlanLiteShellContent({ displayUnlocked }: MediaPlanLiteShellProps) {
  useHydrateMediaPlan();
  const mediaPlan = useMediaPlanState((state) => state.mediaPlan);
  const isLoadingSummary = useMediaPlanState((state) => state.isLoadingSummary);
  const [activeTab, setActiveTab] = useState<'schedule' | 'charts'>('schedule');
  const [barMetricType, setBarMetricType] = useState<ChartMetricType>('roi');
  const [lineMetricType, setLineMetricType] = useState<ChartMetricType>('roi');

  const summary = mediaPlan.summary;
  const allocations = mediaPlan.allocations;
  const plannerValidated = Boolean(mediaPlan.plannerValidatedAt);
  const channelsValidated = Boolean(mediaPlan.channelsValidatedAt);
  const budgetValue = typeof mediaPlan.budget === 'number' ? mediaPlan.budget : 0;
  const currency = mediaPlan.currency ?? 'USD';
  const goalLabel = mediaPlan.goal ?? 'Select goal';
  const shouldShowAnalytics = displayUnlocked && plannerValidated && channelsValidated;

  // Debug: Log UI state
  useEffect(() => {
    console.log('[UI] MediaPlanLite render state:', {
      displayUnlocked,
      plannerValidated,
      channelsValidated,
      shouldShowAnalytics,
      hasSummary: !!summary,
      allocationsCount: allocations?.length || 0,
      plannerValidatedAt: mediaPlan.plannerValidatedAt,
      channelsValidatedAt: mediaPlan.channelsValidatedAt,
    });
  }, [displayUnlocked, plannerValidated, channelsValidated, shouldShowAnalytics, summary, allocations, mediaPlan.plannerValidatedAt, mediaPlan.channelsValidatedAt]);

  useEffect(() => {
    if (
      plannerValidated &&
      channelsValidated &&
      budgetValue > 0 &&
      mediaPlan.market &&
      mediaPlan.currency &&
      mediaPlan.goal &&
      !summary &&
      !isLoadingSummary
    ) {
      void pullPlanSummary();
    }
  }, [
    plannerValidated,
    channelsValidated,
    budgetValue,
    mediaPlan.market,
    mediaPlan.currency,
    mediaPlan.goal,
    summary,
    isLoadingSummary,
  ]);

  const donutData = useMemo(() => {
    const palette = [premiumTheme.accents.cyan, premiumTheme.accents.violet, premiumTheme.accents.mint, premiumTheme.accents.amber, premiumTheme.accents.coral];
    // Always use ALL selected channels, not just allocations
    const channels = mediaPlan.channels.length > 0 ? mediaPlan.channels : [];
    if (channels.length === 0) {
      return [];
    }
    
    const manualMode = mediaPlan.channelMode === 'manual';
    const raw = channels.map((channel, index) => {
      let value: number;
      if (manualMode) {
        value = mediaPlan.channelSplits[channel] ?? (100 / channels.length);
      } else {
        // In auto mode, try to find allocation for this channel
        const allocation = allocations.find(a => a.platform === channel);
        value = allocation?.spendPercent ?? (100 / channels.length);
      }
      return {
        label: channel,
        value,
        color: palette[index % palette.length],
      };
    });
    
    const total = raw.reduce((sum, item) => sum + (item.value || 0), 0) || 100;
    return raw.map((item) => ({
      label: item.label,
      percent: (item.value / total) * 100,
      color: item.color,
    }));
  }, [mediaPlan.channelMode, mediaPlan.channelSplits, mediaPlan.channels, allocations]);

  const donutGradient = useMemo(() => {
    if (donutData.length === 0) {
      return 'conic-gradient(#1F2937 0deg, #0F172A 360deg)';
    }
    let current = 0;
    const segments = donutData.map((slice) => {
      const start = current;
      const end = current + slice.percent;
      current = end;
      return `${slice.color} ${start}% ${end}%`;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }, [donutData]);

  const mixLegend = (donutData.length > 0 ? donutData : FALLBACK_CHANNELS).map((slice) => ({
    label: slice.label,
    percent: slice.percent,
    color: slice.color,
  }));

  const tableRows = useMemo(() => {
    // Always use ALL selected channels, not just allocations
    const channels = mediaPlan.channels.length > 0 ? mediaPlan.channels : [];
    if (channels.length === 0) {
      return [];
    }

    const impressionsTotal =
      summary?.impressions ?? Math.max(1, Math.round((budgetValue || 1000) * 12));
    const reachTotal = summary?.reach ?? Math.round(impressionsTotal * 0.65);
    const clicksTotal = summary?.clicks ?? Math.round(impressionsTotal * 0.03);
    const leadsTotal = summary?.leads ?? Math.max(1, Math.round(clicksTotal * 0.2));

    // Get total split percentage for normalization
    const manualMode = mediaPlan.channelMode === 'manual';
    const totalSplit = manualMode
      ? channels.reduce((sum, ch) => sum + (mediaPlan.channelSplits[ch] ?? 0), 0) || 100
      : 100;

    return channels.map((channel) => {
      // Try to find allocation data for this channel
      const allocation = allocations.find(a => a.platform === channel);
      
      // Calculate share from manual split or equal distribution
      let share: number;
      if (manualMode) {
        const channelSplit = mediaPlan.channelSplits[channel] ?? (100 / channels.length);
        share = channelSplit / totalSplit;
      } else if (allocation) {
        share = (allocation.spendPercent ?? (100 / channels.length)) / 100;
      } else {
        share = 1 / channels.length;
      }

      const rowBudget = budgetValue * share;
      const impressions = Math.max(1, Math.round(impressionsTotal * share));
      const reach = Math.max(1, Math.round(reachTotal * share));
      const clicks = Math.max(1, Math.round(clicksTotal * share));
      const leads = Math.max(1, Math.round(leadsTotal * share));
      const views = Math.max(1, Math.round(impressions * 0.65));
      const cpl = leads > 0 ? rowBudget / leads : allocation?.cpa ?? null;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = clicks > 0 ? rowBudget / clicks : null;
      const cpm = impressions > 0 ? (rowBudget / impressions) * 1000 : null;
      const engagement = Math.round(clicks * 1.8);

      return {
        platform: channel,
        budget: rowBudget,
        impressions,
        reach,
        clicks,
        leads,
        views,
        cpl,
        engagement,
        ctr,
        cpc,
        cpm,
      };
    });
  }, [mediaPlan.channels, mediaPlan.channelMode, mediaPlan.channelSplits, allocations, budgetValue, summary]);

  const tableTotals = useMemo(() => {
    if (tableRows.length === 0) {
      return null;
    }
    return tableRows.reduce(
      (acc, row) => ({
        budget: acc.budget + row.budget,
        impressions: acc.impressions + row.impressions,
        reach: acc.reach + row.reach,
        clicks: acc.clicks + row.clicks,
        leads: acc.leads + row.leads,
        views: acc.views + row.views,
        engagement: acc.engagement + row.engagement,
      }),
      { budget: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, views: 0, engagement: 0 }
    );
  }, [tableRows]);

  const recommendations = useMemo(() => {
    if (tableRows.length === 0) {
      return [
        'Validate the planner + channels to unlock channel-level recommendations.',
        'Set manual CPL targets to help the engine watch performance drift.',
      ];
    }
    return tableRows.map((row) => {
      const healthyCtr = row.ctr >= 1;
      const tone = healthyCtr
        ? 'is pacing well — keep iterating on creative hooks.'
        : 'needs fresher hooks or tighter audiences.';
      const cplLabel =
        row.cpl && Number.isFinite(row.cpl) ? formatCurrencyValue(row.cpl, currency) : '—';
      return `${row.platform}: ${tone} Target CPL ${cplLabel}.`;
    });
  }, [tableRows, currency]);

  const recommendationHints = recommendations.slice(0, 4);

  const manualCplAverage = useMemo(() => {
    if (!mediaPlan.manualCplEnabled || mediaPlan.channels.length === 0) {
      return null;
    }
    const values = mediaPlan.channels
      .map((channel) => mediaPlan.manualCplValues[channel])
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    if (values.length === 0) {
      return null;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [mediaPlan.manualCplEnabled, mediaPlan.manualCplValues, mediaPlan.channels]);

  const impressionsValue = summary?.impressions ?? Math.round((budgetValue || 1000) * 10);
  const reachValue = summary?.reach ?? Math.round((budgetValue || 1000) * 4.2);
  const leadsValue = summary?.leads ?? Math.round((budgetValue || 1000) * 0.08);

  const highlightRows =
    tableRows.length > 0
      ? tableRows
      : (donutData.length > 0 ? donutData : FALLBACK_CHANNELS).map((slice) => {
          const share = slice.percent / 100;
          const fallbackLeads =
            summary?.leads ?? Math.max(1, Math.round((budgetValue || 1000) * 0.05));
          const leads = Math.max(1, Math.round(fallbackLeads * share));
          const rowBudget = budgetValue * share;
          const impressions = Math.max(1, Math.round((impressionsValue || 0) * share));
          const clicks = Math.max(1, Math.round((summary?.clicks ?? leadsValue * 6) * share));
          const views = Math.max(1, Math.round(impressions * 0.65));
          const cpl = leads > 0 ? rowBudget / leads : null;
          const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
          const cpc = clicks > 0 ? rowBudget / clicks : null;
          const cpm = impressions > 0 ? (rowBudget / impressions) * 1000 : null;
          const engagement = Math.round(clicks * 1.8);
          return {
            platform: slice.label,
            budget: rowBudget,
            impressions,
            reach: Math.round(reachValue * share),
            clicks,
            leads,
            views,
            cpl,
            engagement,
            ctr,
            cpc,
            cpm,
          };
        });

  const scheduleRows = tableRows.length > 0 ? tableRows : highlightRows;

  const barChartData = useMemo(() => {
    const palette = [premiumTheme.accents.cyan, premiumTheme.accents.violet, premiumTheme.accents.mint, premiumTheme.accents.amber, premiumTheme.accents.coral];
    const rows = scheduleRows;
    return rows.map((row, index) => {
      let value: number;
      switch (barMetricType) {
        case 'roi':
          value = row.cpl && Number.isFinite(row.cpl) ? row.cpl : 0;
          break;
        case 'conversion':
          value = row.ctr || 0;
          break;
        case 'engagement':
          value = row.engagement || 0;
          break;
        default:
          value = row.impressions;
      }
      return {
        label: row.platform,
        value,
        color: palette[index % palette.length],
      };
    });
  }, [scheduleRows, barMetricType]);

  // Wavy line chart data - time series simulation
  const wavyLineData = useMemo(() => {
    const palette = [premiumTheme.accents.cyan, premiumTheme.accents.violet, premiumTheme.accents.mint, premiumTheme.accents.amber, premiumTheme.accents.coral];
    
    // Dynamic time labels based on campaign duration
    // Generate time labels based on actual campaign start date
    let timeLabels: string[];
    const startDate = mediaPlan.campaignStartDate ? new Date(mediaPlan.campaignStartDate) : new Date();
    const endDate = mediaPlan.campaignEndDate && mediaPlan.campaignDuration === 'custom' 
      ? new Date(mediaPlan.campaignEndDate) 
      : null;
    
    switch (mediaPlan.campaignDuration) {
      case '1-month': {
        // Show 4 weeks from start date
        timeLabels = Array.from({ length: 4 }, (_, i) => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + (i * 7));
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        break;
      }
      case '3-months': {
        // Show 3 months from start date
        timeLabels = Array.from({ length: 3 }, (_, i) => {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + i);
          return date.toLocaleDateString('en-US', { month: 'short' });
        });
        break;
      }
      case '6-months': {
        // Show 6 months from start date
        timeLabels = Array.from({ length: 6 }, (_, i) => {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + i);
          return date.toLocaleDateString('en-US', { month: 'short' });
        });
        break;
      }
      case '1-year': {
        // Show quarters from start date
        timeLabels = Array.from({ length: 4 }, (_, i) => {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + (i * 3));
          return `Q${i + 1} ${date.getFullYear()}`;
        });
        break;
      }
      case 'custom': {
        // Calculate periods between start and end dates
        if (endDate) {
          const monthsDiff = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
          const periods = Math.min(6, Math.max(3, monthsDiff)); // 3-6 periods
          timeLabels = Array.from({ length: periods }, (_, i) => {
            const date = new Date(startDate);
            date.setMonth(date.getMonth() + Math.floor((i * monthsDiff) / periods));
            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          });
        } else {
          timeLabels = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6'];
        }
        break;
      }
      default: {
        // Default 6 months from start
        timeLabels = Array.from({ length: 6 }, (_, i) => {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + i);
          return date.toLocaleDateString('en-US', { month: 'short' });
        });
      }
    }
    
    const data = scheduleRows.map((row, index) => {
      let baseValue: number;
      switch (lineMetricType) {
        case 'roi':
          baseValue = row.leads || 0;
          break;
        case 'conversion':
          baseValue = row.clicks || 0;
          break;
        case 'engagement':
          baseValue = row.engagement || 0;
          break;
        default:
          baseValue = row.impressions;
      }
      
      const values = timeLabels.map((_, i) => {
        const variance = 0.15; // ±15% variance
        const trend = i * 0.05; // 5% growth per month
        const randomFactor = 1 + (Math.random() - 0.5) * variance;
        return Math.round(baseValue * (1 + trend) * randomFactor);
      });
      
      return {
        label: row.platform,
        values,
        color: palette[index % palette.length],
      };
    });
    
    return { data, timeLabels };
  }, [scheduleRows, lineMetricType, mediaPlan.campaignDuration, mediaPlan.campaignStartDate, mediaPlan.campaignEndDate]);

  const lockedChecklist = [
    { label: 'Media planner validated', ready: plannerValidated },
    { label: 'Channels validated', ready: channelsValidated },
  ];


  if (!shouldShowAnalytics) {
    return (
      <div className="media-plan-shell relative z-10 flex-1 overflow-y-auto px-4 pb-24 pt-6 md:px-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 text-center">
          <div className="rounded-[32px] border border-white/10 bg-white/5 px-8 py-10 shadow-[0_25px_70px_rgba(0,0,0,0.45)]">
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Media Plan Lite</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Validate your planner to unlock insights</h1>
            <p className="mt-3 text-white/60">
              Turn both pills green in the header, then press Generate to reveal the CRM workspace.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {lockedChecklist.map(({ label, ready }) => (
                <div
                  key={label}
                  className={cn(
                    'rounded-2xl border px-4 py-3 text-left text-sm',
                    ready
                      ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-white/70'
                  )}
                >
                  <p className="text-xs uppercase tracking-[0.3em]">{label}</p>
                  <p className="text-base font-semibold">{ready ? 'Ready' : 'Pending'}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-white/45">
              Need a hint? Open the Media Planner or Channels pill in the header and hit Validate.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="media-plan-shell relative z-10 flex flex-1 gap-4 overflow-auto px-6 py-6"
    >
      {/* Tab Switcher - Far Left */}
      <div className="flex flex-col gap-3">
        <div 
          className="flex flex-col gap-3 p-2"
          style={{
            background: 'rgba(255, 255, 255, 0.01)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            borderRadius: '28px',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.08)',
          }}
        >
          <button
            onClick={() => setActiveTab('schedule')}
            className="flex flex-col items-center gap-2 rounded-lg px-3 py-3 transition-all"
            style={{
              backgroundColor: activeTab === 'schedule' ? `${premiumTheme.accents.mint}30` : 'transparent',
              color: activeTab === 'schedule' ? premiumTheme.textPrimary : premiumTheme.textSecondary,
            }}
          >
            <Table2 size={20} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className="flex flex-col items-center gap-2 rounded-lg px-3 py-3 transition-all"
            style={{
              backgroundColor: activeTab === 'charts' ? `${premiumTheme.accents.violet}30` : 'transparent',
              color: activeTab === 'charts' ? premiumTheme.textPrimary : premiumTheme.textSecondary,
            }}
          >
            <BarChart3 size={20} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Charts</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'schedule' ? (
        // SCHEDULE TAB - Table only, full width
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex flex-col rounded-[28px] border border-white/10 bg-white/[0.01] p-1 backdrop-blur-xl shadow-[0_0_20px_rgba(139,92,246,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3 flex-shrink-0 px-4 pt-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Smart schedule</p>
                  <h3 className="text-lg font-semibold text-white">Cross-channel allocations</h3>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60"
                >
                  Columns
                </button>
              </div>
              <div className="mt-4 flex-shrink-0 px-4">
                <input
                  type="text"
                  placeholder="Search platform…"
                  className="h-10 w-full rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white/80 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/35"
                  readOnly
                />
              </div>
              <div className="mt-4 rounded-2xl border border-white/5 bg-[#050B18] overflow-hidden">
                <div className="max-h-[500px] overflow-x-auto overflow-y-auto">
                  <table className="min-w-[1000px] w-full text-left text-sm text-white/70">
                    <thead className="sticky top-0 bg-[#050B18] text-xs uppercase tracking-[0.2em] text-white/40">
                      <tr>
                        <th className="px-4 py-3">Platform</th>
                        <th className="px-3 py-3">Budget</th>
                        <th className="px-3 py-3">Impr.</th>
                        <th className="px-3 py-3">Reach</th>
                        <th className="px-3 py-3">Clicks</th>
                        <th className="px-3 py-3">Leads</th>
                        <th className="px-3 py-3">CPL</th>
                        <th className="px-3 py-3">Views</th>
                        <th className="px-3 py-3">Eng.</th>
                        <th className="px-3 py-3">CTR</th>
                        <th className="px-3 py-3">CPC</th>
                        <th className="px-3 py-3">CPM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {scheduleRows.map((row) => (
                        <tr key={row.platform}>
                          <td className="px-4 py-3 font-semibold text-white">{row.platform}</td>
                          <td className="px-3 py-3">{formatCurrencyValue(row.budget, currency)}</td>
                          <td className="px-3 py-3">{formatNumber(row.impressions)}</td>
                          <td className="px-3 py-3">{formatNumber(row.reach)}</td>
                          <td className="px-3 py-3">{formatNumber(row.clicks)}</td>
                          <td className="px-3 py-3">{formatNumber(row.leads)}</td>
                          <td className="px-3 py-3">
                            {row.cpl && Number.isFinite(row.cpl) ? formatCurrencyValue(row.cpl, currency) : '—'}
                          </td>
                          <td className="px-3 py-3">{formatNumber(row.views ?? 0)}</td>
                          <td className="px-3 py-3">{formatNumber(row.engagement ?? 0)}</td>
                          <td className="px-3 py-3">{row.ctr ? `${row.ctr.toFixed(2)}%` : '—'}</td>
                          <td className="px-3 py-3">
                            {row.cpc && Number.isFinite(row.cpc) ? formatCurrencyValue(row.cpc, currency) : '—'}
                          </td>
                          <td className="px-3 py-3">
                            {row.cpm && Number.isFinite(row.cpm) ? formatCurrencyValue(row.cpm, currency) : '—'}
                          </td>
                        </tr>
                      ))}
                      {tableTotals && (
                        <tr className="border-t border-white/10 text-white">
                          <td className="px-4 py-3 font-semibold">Total</td>
                          <td className="px-3 py-3">{formatCurrencyValue(tableTotals.budget, currency)}</td>
                          <td className="px-3 py-3">{formatNumber(tableTotals.impressions)}</td>
                          <td className="px-3 py-3">{formatNumber(tableTotals.reach)}</td>
                          <td className="px-3 py-3">{formatNumber(tableTotals.clicks)}</td>
                          <td className="px-3 py-3">{formatNumber(tableTotals.leads)}</td>
                          <td className="px-3 py-3">—</td>
                          <td className="px-3 py-3">{formatNumber(tableTotals.views ?? 0)}</td>
                          <td className="px-3 py-3">{formatNumber(tableTotals.engagement ?? 0)}</td>
                          <td className="px-3 py-3">—</td>
                          <td className="px-3 py-3">—</td>
                          <td className="px-3 py-3">—</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        </div>
      ) : (
        // CHARTS TAB
        <div className="w-full h-full p-6">
          {/* Grid Layout: Mix & Spotlight (left) | Trends (right, vertically centered) */}
          <div 
            className="max-w-7xl mx-auto grid items-center max-lg:grid-cols-1 max-lg:gap-4"
            style={{
              gridTemplateAreas: `
                "mix trends"
                "spotlight trends"
              `,
              gridTemplateColumns: 'minmax(420px, 1fr) 1.2fr',
              gridAutoRows: 'min-content',
              gap: premiumTheme.spacing.lg,
            }}
          >
            {/* Channel Mix (top-left) */}
            <div 
              className="flex flex-col p-6"
              style={{
                gridArea: 'mix',
                background: 'rgba(255, 255, 255, 0.01)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: '28px',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.08)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p 
                    className="text-xs uppercase tracking-wider mb-1"
                    style={{ color: premiumTheme.textSecondary }}
                  >
                    Channel mix
                  </p>
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: premiumTheme.textPrimary }}
                  >
                    Budget distribution
                  </h3>
                </div>
                <span 
                  className="text-xs"
                  style={{ color: premiumTheme.textSecondary }}
                >
                  {mediaPlan.channelMode === 'manual' ? 'Manual' : 'Auto'}
                </span>
              </div>
              <div className="flex items-center justify-center py-4">
                <PremiumDonutChart
                  data={donutData.map((item, idx) => ({
                    ...item,
                    value: (item.percent / 100) * budgetValue,
                  }))}
                  totalValue={budgetValue}
                  currency={currency}
                />
              </div>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {mixLegend.map((slice) => (
                  <div
                    key={slice.label}
                    className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs"
                    style={{
                      backgroundColor: 'transparent',
                      border: `1px solid rgba(255, 255, 255, 0.08)`,
                      color: premiumTheme.textSecondary,
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span 
                        className="h-2 w-2 rounded-full" 
                        style={{ backgroundColor: slice.color }} 
                      />
                      {slice.label}
                    </span>
                    <span 
                      className="font-semibold tabular-nums"
                      style={{ color: premiumTheme.textPrimary }}
                    >
                      {slice.percent.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Channel Spotlight (bottom-left) */}
            <div 
              style={{
                gridArea: 'spotlight',
                background: 'rgba(255, 255, 255, 0.01)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: '28px',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.08)',
                padding: '20px 20px 16px',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p 
                    className="uppercase tracking-wider mb-1"
                    style={{ 
                      color: premiumTheme.textSecondary,
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    CHANNEL SPOTLIGHT
                  </p>
                  <p 
                    className="text-xs"
                    style={{ 
                      color: premiumTheme.textSecondary,
                      opacity: 0.7,
                    }}
                  >
                    {barMetricType === 'roi' ? 'Cost per Lead' : 
                     barMetricType === 'conversion' ? 'Conversion Rate' : 
                     'Engagement'}
                  </p>
                </div>
                <select
                  value={barMetricType}
                  onChange={(e) => setBarMetricType(e.target.value as ChartMetricType)}
                  className="rounded-lg px-3 py-1.5 text-xs"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    color: premiumTheme.textPrimary,
                    border: `1px solid ${premiumTheme.border}`,
                    borderRadius: '10px',
                  }}
                >
                  <option value="engagement" style={{ backgroundColor: '#000', color: '#fff' }}>Engagement</option>
                  <option value="roi" style={{ backgroundColor: '#000', color: '#fff' }}>ROI Focus</option>
                  <option value="conversion" style={{ backgroundColor: '#000', color: '#fff' }}>Conversion</option>
                </select>
              </div>
              <PremiumBarChart 
                data={barChartData.map(item => ({
                  ...item,
                  format: barMetricType === 'roi' ? 'currency' : barMetricType === 'conversion' ? 'percentage' : 'number',
                }))}
                metricType={barMetricType}
              />
            </div>

            {/* Performance Trends (right column, spans both rows) */}
            <div 
              style={{
                gridArea: 'trends',
                background: 'rgba(255, 255, 255, 0.01)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: '28px',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.08)',
                padding: '16px',
                minHeight: '420px',
              }}
            >
              <div className="flex items-center justify-between mb-3 px-2">
                <div>
                  <p 
                    className="text-xs uppercase tracking-wider mb-1"
                    style={{ color: premiumTheme.textSecondary }}
                  >
                    Performance trends
                  </p>
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: premiumTheme.textPrimary }}
                  >
                    {lineMetricType === 'roi' ? 'Leads' : 
                     lineMetricType === 'conversion' ? 'Clicks' : 
                     'Engagement'} over time
                  </h3>
                </div>
                <select
                  value={lineMetricType}
                  onChange={(e) => setLineMetricType(e.target.value as ChartMetricType)}
                  className="rounded-lg px-3 py-2 text-xs"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    color: premiumTheme.textPrimary,
                    border: `1px solid rgba(255, 255, 255, 0.08)`,
                  }}
                >
                  <option value="roi" style={{ backgroundColor: '#000', color: '#fff' }}>ROI Focus</option>
                  <option value="conversion" style={{ backgroundColor: '#000', color: '#fff' }}>Conversion</option>
                  <option value="engagement" style={{ backgroundColor: '#000', color: '#fff' }}>Engagement</option>
                </select>
              </div>
              <WavyLineChart 
                key={lineMetricType}
                data={wavyLineData.data}
                timeLabels={wavyLineData.timeLabels}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper with ThemeProvider
export function MediaPlanLiteShell({ displayUnlocked }: MediaPlanLiteShellProps) {
  return (
    <ThemeProvider>
      <MediaPlanLiteShellContent displayUnlocked={displayUnlocked} />
    </ThemeProvider>
  );
}

export function MediaPlanNavInputs() {
  const mediaPlan = useMediaPlanState((state) => state.mediaPlan);
  const isLoadingSummary = useMediaPlanState((state) => state.isLoadingSummary);
  const [useCustomMarket, setUseCustomMarket] = useState(() => {
    const current = mediaPlan.market;
    return Boolean(current && !MARKET_OPTIONS.includes(current as (typeof MARKET_OPTIONS)[number]));
  });
  const [useCustomNiche, setUseCustomNiche] = useState(() => {
    const current = mediaPlan.niche;
    return Boolean(current && !getNichePreset(current));
  });
  const [leadEdited, setLeadEdited] = useState(false);
  const [revenueEdited, setRevenueEdited] = useState(false);
  const [plannerValidating, setPlannerValidating] = useState(false);
  const [channelsValidating, setChannelsValidating] = useState(false);
  const [advancedValidating, setAdvancedValidating] = useState(false);
  const [fxQuote, setFxQuote] = useState<FxQuote | null>(null);
  const [fxStatus, setFxStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [fxError, setFxError] = useState<string | null>(null);
  const fxCacheRef = useRef<Record<string, { quote: FxQuote; cachedAt: number }>>({});
  const metricsSignatureRef = useRef<string | null>(null);
  const budgetValue = typeof mediaPlan.budget === 'number' ? mediaPlan.budget : null;

  useEffect(() => {
    if (!mediaPlan.market) {
      setUseCustomMarket(false);
      return;
    }
    setUseCustomMarket(!MARKET_OPTIONS.includes(mediaPlan.market as (typeof MARKET_OPTIONS)[number]));
  }, [mediaPlan.market]);

  useEffect(() => {
    if (mediaPlan.niche === null) {
      setUseCustomNiche(false);
      return;
    }
    setUseCustomNiche(!getNichePreset(mediaPlan.niche));
  }, [mediaPlan.niche]);

  const metricsReady = Boolean(
    budgetValue &&
      budgetValue > 0 &&
      mediaPlan.currency &&
      mediaPlan.market &&
      mediaPlan.niche &&
      mediaPlan.goal
  );

  const computedDefaults = useMemo(() => {
    if (!metricsReady || !mediaPlan.currency) {
      return null;
    }
    return derivePerformanceDefaults({
      budget: budgetValue ?? 0,
      market: mediaPlan.market ?? '',
      currency: mediaPlan.currency,
      niche: mediaPlan.niche,
    });
  }, [metricsReady, budgetValue, mediaPlan.currency, mediaPlan.market, mediaPlan.niche]);

  const metricsSignature = metricsReady
    ? [budgetValue, mediaPlan.currency, mediaPlan.market, mediaPlan.niche].join('|')
    : null;

  useEffect(() => {
    if (!metricsReady || !computedDefaults || !metricsSignature) {
      metricsSignatureRef.current = null;
      return;
    }

    if (metricsSignatureRef.current !== metricsSignature) {
      metricsSignatureRef.current = metricsSignature;
      setLeadEdited(false);
      setRevenueEdited(false);
    }

    if (!leadEdited && computedDefaults.leadToSalePct !== mediaPlan.leadToSalePct) {
      updatePlanField('leadToSalePct', computedDefaults.leadToSalePct);
    }
    if (!revenueEdited && computedDefaults.revenuePerSale !== mediaPlan.revenuePerSale) {
      updatePlanField('revenuePerSale', computedDefaults.revenuePerSale);
    }
  }, [
    metricsReady,
    computedDefaults,
    metricsSignature,
    leadEdited,
    revenueEdited,
    mediaPlan.leadToSalePct,
    mediaPlan.revenuePerSale,
  ]);

  useEffect(() => {
    if (!mediaPlan.currency) {
      setFxQuote(null);
      setFxStatus('idle');
      setFxError(null);
      return;
    }
    const cached = fxCacheRef.current[mediaPlan.currency];
    if (cached && Date.now() - cached.cachedAt < FX_CACHE_TTL) {
      setFxQuote(cached.quote);
      setFxStatus('ready');
    } else {
      setFxQuote(null);
      setFxStatus('idle');
    }
  }, [mediaPlan.currency]);

  const plannerActive = Boolean(
    mediaPlan.budget ||
      mediaPlan.market ||
      mediaPlan.currency ||
      mediaPlan.niche ||
      mediaPlan.leadToSalePct ||
      mediaPlan.revenuePerSale ||
      mediaPlan.manageFx
  );
  const channelsActive = Boolean(mediaPlan.channels.length > 0 || mediaPlan.channelMode === 'manual');
  const advancedActive = Boolean(
    mediaPlan.manualCplEnabled ||
      Object.values(mediaPlan.manualCplValues).some((value) => isFiniteNumber(value))
  );

  const plannerReady = Boolean(
    budgetValue &&
      budgetValue > 0 &&
      mediaPlan.currency &&
      mediaPlan.market &&
      mediaPlan.goal &&
      mediaPlan.niche &&
      isFiniteNumber(mediaPlan.leadToSalePct) &&
      isFiniteNumber(mediaPlan.revenuePerSale)
  );
  const plannerNeeds: string[] = [];
  if (!budgetValue || budgetValue <= 0) plannerNeeds.push('budget');
  if (!mediaPlan.currency) plannerNeeds.push('currency');
  if (!mediaPlan.market) plannerNeeds.push('market');
  if (!mediaPlan.niche) plannerNeeds.push('niche');
  if (!mediaPlan.goal) plannerNeeds.push('goal');
  if (!isFiniteNumber(mediaPlan.leadToSalePct)) plannerNeeds.push('lead → sale %');
  if (!isFiniteNumber(mediaPlan.revenuePerSale)) plannerNeeds.push('revenue per sale');

  const channelSplitTotal = useMemo(
    () => sumSplits(mediaPlan.channels, mediaPlan.channelSplits),
    [mediaPlan.channels, mediaPlan.channelSplits]
  );
  const hasChannelsSelected = mediaPlan.channels.length > 0;
  const manualSplitsMissing =
    mediaPlan.channelMode === 'manual' &&
    mediaPlan.channels.some((channel) => !isFiniteNumber(mediaPlan.channelSplits[channel]));
  const splitsBalanced =
    mediaPlan.channelMode !== 'manual' ||
    Math.abs(channelSplitTotal - SPLIT_TARGET) <= SPLIT_TOLERANCE;
  const channelsReady =
    hasChannelsSelected &&
    (mediaPlan.channelMode !== 'manual' || (!manualSplitsMissing && splitsBalanced));

  const manualCplMissing =
    mediaPlan.manualCplEnabled &&
    mediaPlan.channels.some((channel) => !isFiniteNumber(mediaPlan.manualCplValues[channel]));
  const manualCplReady =
    mediaPlan.manualCplEnabled && hasChannelsSelected && !manualCplMissing;
  const manualCplAverage =
    manualCplReady && mediaPlan.channels.length > 0
      ? mediaPlan.channels.reduce(
          (sum, channel) => sum + (mediaPlan.manualCplValues[channel] ?? 0),
          0
        ) / mediaPlan.channels.length
      : null;

  const channelSplitValueLabel = Number.isFinite(channelSplitTotal)
    ? channelSplitTotal.toFixed(1)
    : '0.0';

  const plannerValidateDisabled = !plannerReady || plannerValidating || isLoadingSummary;
  const channelValidateDisabled = !channelsReady || channelsValidating;
  const advancedValidateDisabled = !manualCplReady || advancedValidating;

  const plannerValidated = Boolean(mediaPlan.plannerValidatedAt);
  const channelsValidated = Boolean(mediaPlan.channelsValidatedAt);
  const advancedValidated = Boolean(mediaPlan.advancedValidatedAt);

  const plannerValidationHint = plannerReady
    ? 'Validated planner locks KPIs for downstream AI outputs.'
    : `Need: ${plannerNeeds.join(', ') || 'core planner inputs'}`;

  const channelValidationHint = !hasChannelsSelected
    ? 'Add at least one channel to validate placements.'
    : mediaPlan.channelMode === 'manual'
    ? manualSplitsMissing
      ? 'Add % values next to each selected channel.'
      : splitsBalanced
      ? `Manual splits total ${channelSplitValueLabel}%.`
      : `Manual splits should total 100% ±${SPLIT_TOLERANCE}%. Currently ${channelSplitValueLabel}%.`
    : 'Auto allocation locks the selected placements.';

  const advancedValidationHint = !mediaPlan.manualCplEnabled
    ? 'Enable manual CPL to lock performance targets.'
    : !hasChannelsSelected
    ? 'Select channels before assigning CPL targets.'
    : manualCplMissing
    ? 'Add CPL targets for every selected channel.'
    : 'Validated CPL locks custom spend floors.';

  const activeNichePreset = getNichePreset(mediaPlan.niche ?? null);
  const nicheDescription = activeNichePreset
    ? activeNichePreset.description
    : useCustomNiche
    ? 'Describe your niche to guide auto-calculations.'
    : 'Pick a niche to auto-calc KPIs.';
  const suggestionLeadLabel = computedDefaults ? `${computedDefaults.leadToSalePct}%` : '--';
  const suggestionRevenueLabel = computedDefaults
    ? formatCurrencyValue(computedDefaults.revenuePerSale, mediaPlan.currency ?? 'USD')
    : '--';
  const goalLabel = mediaPlan.goal ?? 'Select goal';
  const autoMetricMessage =
    metricsReady && computedDefaults
      ? leadEdited || revenueEdited
        ? 'You edited the targets manually. Use suggestions to snap back.'
        : 'Auto metrics stay synced with your market and niche inputs.'
      : 'Auto metrics fill once budget, currency, market, and niche are set.';
  const autoMetricMessageClass =
    metricsReady && computedDefaults && !leadEdited && !revenueEdited
      ? 'text-emerald-200'
      : 'text-white/55';

  const coverageCopy = `Live coverage: ${FX_COVERAGE_LABEL}`;
  const fxPairs =
    fxQuote && mediaPlan.currency && fxQuote.base === mediaPlan.currency
      ? CURRENCY_OPTIONS.filter(
          (currency) => currency !== fxQuote.base && typeof fxQuote.rates?.[currency] === 'number'
        ).map((currency) => ({
          currency,
          rate: fxQuote.rates[currency] as number,
        }))
      : [];
  const fxButtonDisabled = !mediaPlan.currency || fxStatus === 'loading';
  const fxButtonLabel = fxStatus === 'loading' ? 'Syncing…' : 'Fetch live FX desk';
  const manualCplAverageLabel = manualCplAverage !== null
    ? formatCurrencyValue(manualCplAverage, mediaPlan.currency ?? 'USD')
    : null;

  const handleMarketSelectChange = (value: string) => {
    if (value === '__custom') {
      setUseCustomMarket(true);
      if (
        !mediaPlan.market ||
        MARKET_OPTIONS.includes(mediaPlan.market as (typeof MARKET_OPTIONS)[number])
      ) {
        updatePlanField('market', '');
      }
      return;
    }
    setUseCustomMarket(false);
    updatePlanField('market', value || null);
  };

  const handleNicheSelectChange = (value: string) => {
    if (value === '__custom') {
      setUseCustomNiche(true);
      updatePlanField('niche', '');
      return;
    }
    setUseCustomNiche(false);
    updatePlanField('niche', value || null);
  };

  const handleLeadChange = (value: string) => {
    setLeadEdited(true);
    updatePlanField('leadToSalePct', value ? Number(value) : null);
  };

  const handleRevenueChange = (value: string) => {
    setRevenueEdited(true);
    updatePlanField('revenuePerSale', value ? Number(value) : null);
  };

  const handleResetLead = () => {
    if (!computedDefaults) return;
    setLeadEdited(false);
    updatePlanField('leadToSalePct', computedDefaults.leadToSalePct);
  };

  const handleResetRevenue = () => {
    if (!computedDefaults) return;
    setRevenueEdited(false);
    updatePlanField('revenuePerSale', computedDefaults.revenuePerSale);
  };

  const handleChannelToggle = (channel: (typeof CHANNEL_OPTIONS)[number]) => {
    const current = new Set(mediaPlan.channels ?? []);
    if (current.has(channel)) {
      current.delete(channel);
    } else {
      current.add(channel);
    }
    const nextChannels = Array.from(current);
    setChannels(nextChannels);

    if (!current.has(channel)) {
      const nextSplits = { ...mediaPlan.channelSplits };
      delete nextSplits[channel];
      setChannelSplits(nextSplits);
      const nextManualCpl = { ...mediaPlan.manualCplValues };
      delete nextManualCpl[channel];
      setManualCplValues(nextManualCpl);
    }
  };

  const handleSplitChange = (channel: string, value: string) => {
    const numeric = Number(value);
    const next = {
      ...mediaPlan.channelSplits,
      [channel]: Number.isFinite(numeric) ? Math.max(0, numeric) : 0,
    };
    setChannelSplits(next);
  };

  const handleEvenSplit = () => {
    if (mediaPlan.channels.length === 0) {
      return;
    }
    const count = mediaPlan.channels.length;
    const base = Math.floor((SPLIT_TARGET / count) * 10) / 10;
    const nextSplits: Record<string, number> = {};
    let allocated = 0;
    mediaPlan.channels.forEach((channel, index) => {
      const value = index === count - 1 ? SPLIT_TARGET - allocated : base;
      const rounded = Number(value.toFixed(1));
      nextSplits[channel] = rounded;
      allocated += rounded;
    });
    setChannelSplits(nextSplits);
  };

  const handleChannelModeChange = (mode: ChannelMode) => {
    if (mode === mediaPlan.channelMode) {
      return;
    }
    if (mode === 'manual' && mediaPlan.channels.length === 0) {
      setChannels(DEFAULT_MANUAL_CHANNELS);
    }
    updatePlanField('channelMode', mode);
  };

  const handleManualCplToggle = () => {
    const next = !mediaPlan.manualCplEnabled;
    if (next && mediaPlan.channels.length === 0) {
      setChannels(DEFAULT_MANUAL_CHANNELS);
    }
    updatePlanField('manualCplEnabled', next);
  };

  const handleManualCplChange = (channel: string, value: string) => {
    const numeric = Number(value);
    const next = {
      ...mediaPlan.manualCplValues,
      [channel]: Number.isFinite(numeric) ? Math.max(0, numeric) : null,
    };
    setManualCplValues(next);
  };

  const handleFetchFxRates = useCallback(async () => {
    if (!mediaPlan.currency) {
      setFxError('Select a currency to fetch FX rates.');
      return;
    }
    const cached = fxCacheRef.current[mediaPlan.currency];
    if (cached && Date.now() - cached.cachedAt < FX_CACHE_TTL) {
      setFxQuote(cached.quote);
      setFxStatus('ready');
      setFxError(null);
      return;
    }
    setFxStatus('loading');
    setFxError(null);
    try {
      const response = await fetch(`${FX_ENDPOINT}/${mediaPlan.currency}`);
      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }
      const data = await response.json();
      if (!data?.rates) {
        throw new Error('FX desk did not return rates.');
      }
      const nextQuote: FxQuote = {
        base: mediaPlan.currency,
        fetchedAt: new Date().toISOString(),
        rates: data.rates as Record<string, number>,
      };
      fxCacheRef.current[mediaPlan.currency] = { quote: nextQuote, cachedAt: Date.now() };
      setFxQuote(nextQuote);
      setFxStatus('ready');
    } catch (error) {
      console.error('[MediaPlanLite] Failed to fetch FX rates', error);
      setFxStatus('error');
      setFxError(error instanceof Error ? error.message : 'Could not fetch live FX rates.');
    }
  }, [mediaPlan.currency]);

  const handlePlannerValidate = async () => {
    if (plannerValidateDisabled || plannerValidating) {
      return;
    }
    setPlannerValidating(true);
    try {
      await pullPlanSummary();
      markMediaPlanSectionValidated('planner');
    } catch (error) {
      console.error('[MediaPlanLite] Planner validation failed', error);
    } finally {
      setPlannerValidating(false);
    }
  };

  const handleChannelsValidate = async () => {
    if (channelValidateDisabled || channelsValidating) {
      return;
    }
    setChannelsValidating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      markMediaPlanSectionValidated('channels');
    } finally {
      setChannelsValidating(false);
    }
  };

  const handleAdvancedValidate = async () => {
    if (advancedValidateDisabled || advancedValidating) {
      return;
    }
    setAdvancedValidating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      markMediaPlanSectionValidated('advanced');
    } finally {
      setAdvancedValidating(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <InputPill
        label="MEDIA PLANNER"
        icon={<Sparkles className="h-5 w-5" />}
        active={plannerActive}
        validated={Boolean(mediaPlan.plannerValidatedAt)}
        panelWidth={520}
      >
        <div className="space-y-4 text-white/85 max-h-[70vh] overflow-y-auto pr-0.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <PillFieldLabel>Total budget</PillFieldLabel>
              <input
                type="number"
                min={0}
                value={mediaPlan.budget ?? ''}
                placeholder="25,000"
                onChange={(event) =>
                  updatePlanField('budget', event.target.value ? Number(event.target.value) : null)
                }
                className={pillInputClass}
              />
            </div>
            <div>
              <PillFieldLabel>Currency</PillFieldLabel>
              <select
                value={mediaPlan.currency ?? ''}
                onChange={(event) => updatePlanField('currency', event.target.value || null)}
                className={pillInputClass}
              >
                <option value="">Select</option>
                {CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <PillFieldLabel>Market</PillFieldLabel>
            <select
              value={useCustomMarket ? '__custom' : mediaPlan.market ?? ''}
              onChange={(event) => handleMarketSelectChange(event.target.value)}
              className={pillInputClass}
            >
              <option value="">Select market</option>
              {MARKET_OPTIONS.map((market) => (
                <option key={market} value={market}>
                  {market}
                </option>
              ))}
              <option value="__custom">Custom…</option>
            </select>
            {useCustomMarket && (
              <input
                type="text"
                value={mediaPlan.market ?? ''}
                placeholder="Enter custom market"
                onChange={(event) => updatePlanField('market', event.target.value)}
                className={`${pillInputClass} mt-2`}
              />
            )}
          </div>

          <div>
            <PillFieldLabel>Niche</PillFieldLabel>
            <select
              value={useCustomNiche ? '__custom' : mediaPlan.niche ?? ''}
              onChange={(event) => handleNicheSelectChange(event.target.value)}
              className={pillInputClass}
            >
              <option value="">Select niche</option>
              {NICHE_OPTIONS.map((option) => (
                <option key={option.id} value={option.label}>
                  {option.label}
                </option>
              ))}
              <option value="__custom">Custom…</option>
            </select>
            {useCustomNiche && (
              <input
                type="text"
                value={mediaPlan.niche ?? ''}
                placeholder="Describe your niche"
                onChange={(event) => updatePlanField('niche', event.target.value)}
                className={`${pillInputClass} mt-2`}
              />
            )}
            <p className="text-[11px] text-white/55">{nicheDescription}</p>
          </div>

          <div>
            <PillFieldLabel>Objective</PillFieldLabel>
            <p className="text-[11px] text-white/50">Keeps the KPI targets below tethered to your focus.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {GOALS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => updatePlanField('goal', goal)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition',
                    mediaPlan.goal === goal
                      ? 'border-emerald-400/60 bg-emerald-500/20 text-white'
                      : 'border-white/12 text-white/65 hover:text-white'
                  )}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <PillFieldLabel>Lead → Sale %</PillFieldLabel>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-white/55">
                  {goalLabel}
                </span>
                {leadEdited && computedDefaults ? (
                  <button
                    type="button"
                    onClick={handleResetLead}
                    className="text-[11px] text-white/60 transition hover:text-white"
                  >
                    Use {suggestionLeadLabel}
                  </button>
                ) : computedDefaults ? (
                  <span className="text-[11px] text-emerald-200">Auto {suggestionLeadLabel}</span>
                ) : null}
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={mediaPlan.leadToSalePct ?? ''}
                placeholder="12"
                onChange={(event) => handleLeadChange(event.target.value)}
                className={pillInputClass}
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2">
                <PillFieldLabel>Revenue per sale</PillFieldLabel>
                {revenueEdited && computedDefaults ? (
                  <button
                    type="button"
                    onClick={handleResetRevenue}
                    className="text-[11px] text-white/60 transition hover:text-white"
                  >
                    Use {suggestionRevenueLabel}
                  </button>
                ) : computedDefaults ? (
                  <span className="text-[11px] text-emerald-200">Auto {suggestionRevenueLabel}</span>
                ) : null}
              </div>
              <input
                type="number"
                min={0}
                value={mediaPlan.revenuePerSale ?? ''}
                placeholder="350"
                onChange={(event) => handleRevenueChange(event.target.value)}
                className={pillInputClass}
              />
            </div>
          </div>
          <p className={cn('text-[11px]', autoMetricMessageClass)}>{autoMetricMessage}</p>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/55">Manage FX</p>
                <p className="text-xs text-white/60">Lock conversions with hedging.</p>
              </div>
              <button
                type="button"
                onClick={() => updatePlanField('manageFx', !mediaPlan.manageFx)}
                className={cn(
                  'relative h-6 w-11 rounded-full border transition',
                  mediaPlan.manageFx ? 'border-emerald-400 bg-emerald-500/40' : 'border-white/20 bg-white/10'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white transition',
                    mediaPlan.manageFx ? 'right-0.5' : 'left-0.5'
                  )}
                />
              </button>
            </div>

            {mediaPlan.manageFx && (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-[#040915]/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-white/65">{coverageCopy}</p>
                  <button
                    type="button"
                    onClick={handleFetchFxRates}
                    disabled={fxButtonDisabled}
                    className={cn(
                      'rounded-xl border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition',
                      fxButtonDisabled
                        ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/40'
                        : 'border-white/15 bg-gradient-to-r from-[#3E8BFF]/50 to-[#6B70FF]/40 text-white hover:brightness-110'
                    )}
                  >
                    {fxButtonLabel}
                  </button>
                </div>

                {!mediaPlan.currency && (
                  <p className="text-xs text-amber-300">Select a currency to sync FX rates.</p>
                )}

                {fxStatus === 'error' && fxError && (
                  <p className="text-xs text-rose-300">{fxError}</p>
                )}

                {mediaPlan.currency && fxPairs.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {fxPairs.map(({ currency, rate }) => (
                      <div
                        key={currency}
                        className="rounded-xl border border-white/8 bg-white/[0.03] p-3"
                      >
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                          1 {fxQuote?.base} →
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {rate.toFixed(4)} {currency}
                        </p>
                        <p className="text-[11px] text-white/55">
                          {budgetValue
                            ? `Budget: ${formatCurrencyValue(budgetValue * rate, currency)}`
                            : 'Add a budget to see hedged value.'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : mediaPlan.currency ? (
                  <p className="text-xs text-white/55">
                    {fxStatus === 'loading' ? 'Fetching live desk…' : 'Fetch to hydrate live FX data.'}
                  </p>
                ) : null}

                {fxQuote?.fetchedAt && (
                  <p className="text-[11px] text-white/45">Synced {formatTimestamp(fxQuote.fetchedAt)}</p>
                )}
              </div>
            )}
          </div>

          {/* Campaign Timeline Section */}
          <div className="border-t border-white/10 pt-4 mt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-3">Campaign Timeline</p>
            
            <div>
              <PillFieldLabel required>Duration</PillFieldLabel>
              <select
                value={mediaPlan.campaignDuration}
                onChange={(e) => updatePlanField('campaignDuration', e.target.value as any)}
                className={pillInputClass}
              >
                <option value="1-month">1 Month</option>
                <option value="3-months">3 Months (Quarter)</option>
                <option value="6-months">6 Months</option>
                <option value="1-year">1 Year</option>
                <option value="custom">Custom Range</option>
              </select>
              <p className="text-[11px] text-white/50 mt-1">Defines projection timeline</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="relative z-10">
                <PillFieldLabel>Start Date</PillFieldLabel>
                <input
                  type="date"
                  value={mediaPlan.campaignStartDate ?? ''}
                  onChange={(e) => updatePlanField('campaignStartDate', e.target.value || null)}
                  onFocus={(e) => e.stopPropagation()}
                  onBlur={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={(e) => e.stopPropagation()}
                  onMouseLeave={(e) => e.stopPropagation()}
                  className={pillInputClass}
                />
              </div>
              {mediaPlan.campaignDuration === 'custom' && (
                <div className="relative z-10">
                  <PillFieldLabel>End Date</PillFieldLabel>
                  <input
                    type="date"
                    value={mediaPlan.campaignEndDate ?? ''}
                    onChange={(e) => updatePlanField('campaignEndDate', e.target.value || null)}
                    onFocus={(e) => e.stopPropagation()}
                    onBlur={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={(e) => e.stopPropagation()}
                    onMouseLeave={(e) => e.stopPropagation()}
                    className={pillInputClass}
                  />
                </div>
              )}
            </div>

            <div className="mt-3">
              <PillFieldLabel>Target Audience Size</PillFieldLabel>
              <input
                type="number"
                min={0}
                value={mediaPlan.targetAudienceSize ?? ''}
                placeholder="e.g., 500000"
                onChange={(e) => updatePlanField('targetAudienceSize', e.target.value ? Number(e.target.value) : null)}
                className={pillInputClass}
              />
              <p className="text-[11px] text-white/50 mt-1">For reach calculations (optional)</p>
            </div>
          </div>

          <PillValidationControl
            label="Validate planner"
            validatedLabel="Planner validated"
            hint={plannerValidationHint}
            validated={plannerValidated}
            validating={plannerValidating || isLoadingSummary}
            disabled={plannerValidateDisabled}
            onValidate={handlePlannerValidate}
            validatedAt={mediaPlan.plannerValidatedAt}
          />
        </div>
      </InputPill>

      <InputPill
        label="CHANNELS"
        icon={<TrendingUp className="h-5 w-5" />}
        active={channelsActive}
        validated={Boolean(mediaPlan.channelsValidatedAt)}
        panelWidth={520}
      >
        <div className="space-y-4 text-white/85 max-h-[70vh] overflow-y-auto pr-0.5">
          <div>
            <PillFieldLabel>Pick channels</PillFieldLabel>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map((channel) => {
                const selected = mediaPlan.channels.includes(channel);
                return (
                  <button
                    key={channel}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => handleChannelToggle(channel)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition',
                      selected
                        ? 'border-emerald-400/60 bg-emerald-500/20 text-white'
                        : 'border-white/12 text-white/60 hover:text-white'
                    )}
                  >
                    {channel}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <PillFieldLabel>Mode</PillFieldLabel>
            <div className="flex items-center gap-2">
              {(['auto', 'manual'] as ChannelMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleChannelModeChange(mode)}
                  className={cn(
                    'flex-1 rounded-xl border px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition',
                    mediaPlan.channelMode === mode
                      ? 'border-emerald-400/60 bg-emerald-500/15 text-white'
                      : 'border-white/12 text-white/60 hover:text-white/85'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {mediaPlan.channelMode === 'manual' && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                  Total allocation
                </span>
                <span
                  className={cn(
                    'text-xs font-semibold',
                    splitsBalanced ? 'text-emerald-200' : 'text-amber-300'
                  )}
                >
                  {channelSplitValueLabel}%
                </span>
              </div>

              {mediaPlan.channels.length > 1 && (
                <button
                  type="button"
                  onClick={handleEvenSplit}
                  className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/65 transition hover:text-white"
                >
                  Distribute evenly
                </button>
              )}

              {hasChannelsSelected ? (
                <div className="space-y-2">
                  {mediaPlan.channels.map((channel) => (
                    <div
                      key={channel}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                        {channel}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={mediaPlan.channelSplits[channel] ?? ''}
                        placeholder="30"
                        onChange={(event) => handleSplitChange(channel, event.target.value)}
                        className={pillInputClass}
                      />
                      <span className="text-xs text-white/60">%</span>
                    </div>
                  ))}
                  <p className="text-[11px] text-white/45">
                    Manual splits target {SPLIT_TARGET}% total (±{SPLIT_TOLERANCE}% tolerance).
                  </p>
                </div>
              ) : (
                <p className="text-xs text-white/55">Select channels above to adjust splits.</p>
              )}
            </div>
          )}

          <PillValidationControl
            label="Validate channels"
            validatedLabel="Channels validated"
            hint={channelValidationHint}
            validated={channelsValidated}
            validating={channelsValidating}
            disabled={channelValidateDisabled}
            onValidate={handleChannelsValidate}
            validatedAt={mediaPlan.channelsValidatedAt}
          />
        </div>
      </InputPill>

      <InputPill
        label="ADVANCED"
        icon={<SettingsIcon className="h-5 w-5" />}
        active={advancedActive}
        panelWidth={360}
      >
        <div className="space-y-4 text-white/85 max-h-[70vh] overflow-y-auto pr-0.5">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/55">Manual CPL</p>
              <p className="text-xs text-white/60">Syncs with the channel list above.</p>
            </div>
            <button
              type="button"
              onClick={handleManualCplToggle}
              className={cn(
                'relative h-6 w-11 rounded-full border transition',
                mediaPlan.manualCplEnabled ? 'border-emerald-400 bg-emerald-500/40' : 'border-white/20 bg-white/10'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white transition',
                  mediaPlan.manualCplEnabled ? 'right-0.5' : 'left-0.5'
                )}
              />
            </button>
          </div>

          {mediaPlan.manualCplEnabled && (
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
              {hasChannelsSelected ? (
                <>
                  {mediaPlan.channels.map((channel) => (
                    <div key={channel}>
                      <PillFieldLabel>{channel} CPL</PillFieldLabel>
                      <input
                        type="number"
                        min={0}
                        value={mediaPlan.manualCplValues[channel] ?? ''}
                        placeholder="45"
                        onChange={(event) => handleManualCplChange(channel, event.target.value)}
                        className={pillInputClass}
                      />
                    </div>
                  ))}
                  {manualCplAverageLabel && (
                    <p className="text-[11px] text-white/55">Avg target {manualCplAverageLabel}</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-white/60">Pick channels first to set CPL targets.</p>
              )}
            </div>
          )}

          <PillValidationControl
            label="Validate CPL targets"
            validatedLabel="Manual CPL validated"
            hint={advancedValidationHint}
            validated={advancedValidated}
            validating={advancedValidating}
            disabled={advancedValidateDisabled}
            onValidate={handleAdvancedValidate}
            validatedAt={mediaPlan.advancedValidatedAt}
          />
        </div>
      </InputPill>

      {/* Export Pill */}
      <button
        onClick={() => {
          const exportData = {
            ...mediaPlan,
            exportedAt: new Date().toISOString(),
          };
          const dataStr = JSON.stringify(exportData, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `media-plan-${new Date().toISOString().split('T')[0]}.json`;
          link.click();
          URL.revokeObjectURL(url);
        }}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium transition-all',
          'bg-white/5 text-white/90 hover:bg-white/10 hover:text-white',
          'border border-white/10 hover:border-white/20'
        )}
      >
        <Download className="h-4 w-4" />
        <span>Export Plan</span>
      </button>
    </div>
  );
}

function PillValidationControl({
  label,
  validatedLabel,
  hint,
  disabled,
  validated,
  validating = false,
  onValidate,
  validatedAt,
}: {
  label: string;
  validatedLabel: string;
  hint: ReactNode;
  disabled: boolean;
  validated: boolean;
  validating?: boolean;
  onValidate: () => void | Promise<void>;
  validatedAt?: string | null;
}) {
  const buttonDisabled = disabled || validating;
  const buttonClass = cn(
    'w-full rounded-2xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition',
    buttonDisabled
      ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/40'
      : validated
      ? 'border border-transparent bg-gradient-to-r from-[#3EE594] to-[#1CC8A8] text-[#052c23] shadow-[0_16px_32px_rgba(34,197,94,0.35)]'
      : 'border border-transparent bg-gradient-to-r from-[#3E8BFF] to-[#6B70FF] text-white shadow-[0_16px_32px_rgba(62,139,255,0.32)] hover:-translate-y-[1px]'
  );
  const stateLabel = validating ? 'Validating…' : validated ? validatedLabel : label;
  const hintClass = validated ? 'text-emerald-200' : 'text-white/55';
  const timestamp = validated && validatedAt ? formatTimestamp(validatedAt) : '';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <button type="button" onClick={onValidate} disabled={buttonDisabled} className={buttonClass}>
        {stateLabel}
      </button>
      <p className={cn('mt-2 text-[11px] leading-relaxed', hintClass)}>{hint}</p>
      {timestamp && (
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">{timestamp}</p>
      )}
    </div>
  );
}

type FloatingPosition = {
  top: number;
  left: number;
  width: number;
};

function InputPill({
  label,
  icon,
  children,
  active = false,
  validated = false,
  panelWidth = 400,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  active?: boolean;
  validated?: boolean;
  panelWidth?: number;
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<FloatingPosition | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }, [cancelClose]);

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined' || !triggerRef.current) {
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const width = Math.min(panelWidth, Math.max(300, viewportWidth - 32));
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(16, Math.min(left, viewportWidth - width - 16));
    const top = rect.bottom + 14;
    setPosition({ top, left, width });
  }, [panelWidth]);

  const openPanel = useCallback(() => {
    cancelClose();
    setOpen(true);
    updatePosition();
  }, [cancelClose, updatePosition]);

  const closePanel = useCallback(() => {
    cancelClose();
    setOpen(false);
  }, [cancelClose]);

  const handleTriggerPointerEnter = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse') {
      return;
    }
    openPanel();
  };

  const handleTriggerPointerLeave = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse') {
      return;
    }
    scheduleClose();
  };

  const handleTriggerFocus = () => {
    openPanel();
  };

  const handleTriggerBlur = (event: React.FocusEvent<HTMLButtonElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && panelRef.current?.contains(next)) {
      cancelClose();
      return;
    }
    scheduleClose();
  };

  const handlePanelBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (
      (next && panelRef.current?.contains(next)) ||
      (next && triggerRef.current?.contains(next))
    ) {
      cancelClose();
      return;
    }
    scheduleClose();
  };

  const handlePanelPointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') {
      return;
    }
    cancelClose();
  };

  const handlePanelPointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') {
      return;
    }
    // Don't close if a date/time/number input has focus (native pickers keep panel open)
    const activeElement = document.activeElement;
    if (activeElement && panelRef.current?.contains(activeElement)) {
      const tagName = activeElement.tagName.toLowerCase();
      const inputType = (activeElement as HTMLInputElement).type;
      if (tagName === 'input' && (inputType === 'date' || inputType === 'time' || inputType === 'number')) {
        return;
      }
    }
    scheduleClose();
  };

  const handlePanelFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    void event;
    cancelClose();
  };

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updatePosition();
    const handle = () => updatePosition();
    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle, true);
    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      closePanel();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open, closePanel]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePanel();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closePanel]);

  useEffect(
    () => () => {
      cancelClose();
    },
    [cancelClose]
  );

  const triggerClasses = cn(
    'relative flex min-w-[64px] items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] transition-all duration-300',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E8BFF]/40 backdrop-blur-xl',
    validated
      ? 'border-emerald-400/50 bg-gradient-to-r from-emerald-500/25 to-teal-500/20 text-emerald-100 shadow-[0_8px_28px_rgba(16,185,129,0.3)]'
      : active
      ? 'border-[#3E8BFF]/45 bg-gradient-to-r from-[#3E8BFF]/25 to-[#6B70FF]/20 text-white shadow-[0_8px_28px_rgba(62,139,255,0.25)]'
      : 'border-white/12 bg-white/5 text-white/70 hover:text-white'
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={triggerClasses}
        onPointerEnter={handleTriggerPointerEnter}
        onPointerLeave={handleTriggerPointerLeave}
        onFocus={handleTriggerFocus}
        onBlur={handleTriggerBlur}
        onClick={() => (open ? closePanel() : openPanel())}
      >
        <span className="text-base">{icon}</span>
        <span className="leading-tight">{label}</span>
      </button>

      <FloatingPanelPortal
        open={open}
        position={position}
        panelRef={panelRef}
        onPointerEnter={handlePanelPointerEnter}
        onPointerLeave={handlePanelPointerLeave}
        onFocusCapture={handlePanelFocus}
        onBlurCapture={handlePanelBlur}
      >
        {children}
      </FloatingPanelPortal>
    </div>
  );
}

type FloatingPanelPortalProps = {
  open: boolean;
  position: FloatingPosition | null;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onPointerEnter: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: (event: React.PointerEvent<HTMLDivElement>) => void;
  onFocusCapture: (event: React.FocusEvent<HTMLDivElement>) => void;
  onBlurCapture: (event: React.FocusEvent<HTMLDivElement>) => void;
  children: ReactNode;
};

function FloatingPanelPortal({
  open,
  position,
  panelRef,
  onPointerEnter,
  onPointerLeave,
  onFocusCapture,
  onBlurCapture,
  children,
}: FloatingPanelPortalProps) {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open && position ? (
        <motion.div
          key="media-plan-floating-panel"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            width: position.width,
            zIndex: 60,
            pointerEvents: 'none',
          }}
        >
          <div
            ref={panelRef}
            className="pointer-events-auto rounded-[28px] border border-white/12 bg-[#050B15]/92 p-5 shadow-[0_25px_70px_rgba(0,0,0,0.65)] backdrop-blur-2xl overflow-visible"
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onFocusCapture={onFocusCapture}
            onBlurCapture={onBlurCapture}
            tabIndex={-1}
          >
            {children}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) {
    return null;
  }
  const points = data.map((value, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * 100;
    const y = 35 - value * 25;
    return { x, y };
  });
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ');
  const last = points[points.length - 1];
  return (
    <svg viewBox="0 0 100 35" fill="none" className="h-full w-full opacity-80" role="presentation">
      <path d={path} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r={2.4} fill={color} />
    </svg>
  );
}

function TimelineChart({
  data,
  color,
}: {
  data: Array<{ label: string; value: number }>;
  color: string;
}) {
  if (data.length === 0) {
    return null;
  }
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * 100;
    const y = 90 - (item.value / max) * 70;
    return { x, y };
  });
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ');
  const areaPath = `${path} L100,100 L0,100 Z`;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" role="presentation">
      <defs>
        <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#timelineGradient)" opacity={0.5} />
      <path d={path} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={index === points.length - 1 ? 2 : 1.2} fill={color} />
      ))}
    </svg>
  );
}

function RadarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const sides = values.length;
  if (sides === 0) {
    return null;
  }
  const center = 50;
  const radius = 38;
  const points = values.map((value, index) => {
    const angle = (Math.PI * 2 * index) / sides;
    const r = radius * Math.max(0.12, value);
    const x = center + r * Math.sin(angle);
    const y = center - r * Math.cos(angle);
    return `${x},${y}`;
  });
  const gridLevels = [0.3, 0.6, 1];
  return (
    <svg viewBox="0 0 100 100" className="mt-4 h-52 w-full text-white/70" role="presentation">
      {gridLevels.map((level) => {
        const gridPoints = Array.from({ length: sides }, (_, index) => {
          const angle = (Math.PI * 2 * index) / sides;
          const r = radius * level;
          const x = center + r * Math.sin(angle);
          const y = center - r * Math.cos(angle);
          return `${x},${y}`;
        }).join(' ');
        return (
          <polygon
            key={level}
            points={gridPoints}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={0.6}
          />
        );
      })}
      <polygon
        points={points.join(' ')}
        fill="rgba(124,93,250,0.25)"
        stroke="#7C5DFA"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {labels.map((label, index) => {
        const angle = (Math.PI * 2 * index) / sides;
        const r = radius + 8;
        const x = center + r * Math.sin(angle);
        const y = center - r * Math.cos(angle);
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            alignmentBaseline="middle"
            className="text-[9px] fill-white/70"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function PillFieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/55">
      {children}
      {required && <span className="text-rose-400 ml-1">*</span>}
    </p>
  );
}
