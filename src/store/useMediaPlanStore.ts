import { create } from 'zustand';
import { useEffect } from 'react';

import type {
  Goal,
  MediaPlanAllocation,
  MediaPlanScenario,
  MediaPlanState,
  MediaPlanSummary,
} from '../types';
import { defaultSettings, loadSettings, saveSettings } from './settings';
import { saveMediaPlan, loadLatestMediaPlan } from '../services/mediaPlanPersistence';
import { useGeneratedCardsStore } from './useGeneratedCardsStore';

const CORE_FIELDS: Array<keyof Pick<MediaPlanState, 'budget' | 'market' | 'goal' | 'currency'>> = [
  'budget',
  'market',
  'goal',
  'currency',
];

type MediaPlanEditableField = keyof Pick<
  MediaPlanState,
  | 'budget'
  | 'market'
  | 'goal'
  | 'currency'
  | 'notes'
  | 'niche'
  | 'leadToSalePct'
  | 'revenuePerSale'
  | 'manageFx'
  | 'channelMode'
  | 'manualCplEnabled'
  | 'campaignDuration'
  | 'campaignStartDate'
  | 'campaignEndDate'
  | 'campaignObjective'
  | 'targetAudienceSize'
>;

type ValidationSection = 'planner' | 'channels' | 'advanced';

const PLANNER_VALIDATION_FIELDS = new Set<MediaPlanEditableField>([
  'budget',
  'market',
  'goal',
  'currency',
  'niche',
  'leadToSalePct',
  'revenuePerSale',
  'manageFx',
  'notes',
  'campaignDuration',
  'campaignStartDate',
  'campaignEndDate',
  'campaignObjective',
  'targetAudienceSize',
]);

const CHANNEL_VALIDATION_FIELDS = new Set<MediaPlanEditableField>(['channelMode']);
const ADVANCED_VALIDATION_FIELDS = new Set<MediaPlanEditableField>(['manualCplEnabled']);

const VALIDATION_FIELD_BY_SECTION: Record<ValidationSection, keyof MediaPlanState> = {
  planner: 'plannerValidatedAt',
  channels: 'channelsValidatedAt',
  advanced: 'advancedValidatedAt',
};

interface MediaPlanStoreState {
  mediaPlan: MediaPlanState;
  isHydrated: boolean;
  isHydrating: boolean;
  isLoadingSummary: boolean;
  isSaving: boolean;
  error: string | null;
  currentPlanId: string | null;
  updatePlanField: <Field extends MediaPlanEditableField>(
    field: Field,
    value: MediaPlanState[Field]
  ) => void;
  setAllocations: (allocations: MediaPlanAllocation[]) => void;
  setScenario: (scenario: MediaPlanScenario | null) => void;
  setNotes: (notes: string | null) => void;
  setSummary: (summary: MediaPlanSummary | null) => void;
  setChannels: (channels: string[]) => void;
  setChannelSplits: (splits: Record<string, number>) => void;
  setManualCplValues: (values: Record<string, number | null>) => void;
  pullPlanSummary: () => Promise<MediaPlanSummary | null>;
  hydrateFromSettings: (plan?: Partial<MediaPlanState>) => void;
  hydrateFromStorage: () => Promise<void>;
  saveToPersistence: () => Promise<void>;
  markSynced: (timestamp?: string | null) => void;
  markSectionValidated: (section: ValidationSection) => void;
  clearError: () => void;
}

const cloneDefaultMediaPlan = (): MediaPlanState => ({
  ...defaultSettings.mediaPlan,
  allocations: [...defaultSettings.mediaPlan.allocations],
  channels: [...defaultSettings.mediaPlan.channels],
  channelSplits: { ...defaultSettings.mediaPlan.channelSplits },
  manualCplValues: { ...defaultSettings.mediaPlan.manualCplValues },
});

const generateSummary = (plan: {
  budget: number;
  market: string;
  goal: Goal;
  currency: string;
  campaignDuration?: string;
  campaignStartDate?: string | null;
  campaignEndDate?: string | null;
  niche?: string | null;
  leadToSalePct?: number | null;
  revenuePerSale?: number | null;
}): MediaPlanSummary => {
  const budget = plan.budget ?? 0;
  
  // Calculate duration multiplier based on campaign duration
  let durationMonths = 6; // default
  if (plan.campaignDuration === '1-month') durationMonths = 1;
  else if (plan.campaignDuration === '3-months') durationMonths = 3;
  else if (plan.campaignDuration === '6-months') durationMonths = 6;
  else if (plan.campaignDuration === '1-year') durationMonths = 12;
  else if (plan.campaignDuration === 'custom' && plan.campaignStartDate && plan.campaignEndDate) {
    const start = new Date(plan.campaignStartDate);
    const end = new Date(plan.campaignEndDate);
    durationMonths = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  }
  
  // Scale impressions based on duration (monthly budget × months × multiplier)
  const monthlyBudget = budget / durationMonths;
  const baseImpressions = monthlyBudget * (plan.goal === 'Awareness' ? 150 : 100);
  const impressions = Math.floor(baseImpressions * durationMonths);
  
  const reach = Math.floor(impressions * 0.7);
  const clicks = Math.floor(impressions * (plan.goal === 'Sales' ? 0.05 : 0.03));
  
  // Use leadToSalePct if provided, otherwise use goal-based default
  const conversionRate = plan.leadToSalePct 
    ? plan.leadToSalePct / 100 
    : (plan.goal === 'Leads' ? 0.15 : 0.08);
  const leads = Math.floor(clicks * conversionRate);
  
  const roas = plan.goal === 'Sales' ? 3.2 : 2.1;

  return {
    impressions,
    reach,
    clicks,
    leads,
    roas,
  };
};

const generateAllocations = (goal: Goal): MediaPlanAllocation[] => {
  switch (goal) {
    case 'Awareness':
      return [
        { platform: 'Meta Ads', spendPercent: 45, reach: 45_000, status: 'increased' },
        { platform: 'TikTok', spendPercent: 30, reach: 30_000, status: 'steady' },
        { platform: 'YouTube', spendPercent: 25, reach: 22_000, status: 'increased' },
      ];
    case 'Sales':
      return [
        { platform: 'Google Ads', spendPercent: 40, cpa: 24, status: 'steady' },
        { platform: 'Meta Ads', spendPercent: 35, cpa: 28, status: 'increased' },
        { platform: 'Retargeting Network', spendPercent: 25, cpa: 18, status: 'increased' },
      ];
    case 'Leads':
      return [
        { platform: 'LinkedIn', spendPercent: 35, cpa: 32, status: 'increased' },
        { platform: 'Meta Ads', spendPercent: 40, cpa: 26, status: 'steady' },
        { platform: 'Google Ads', spendPercent: 25, cpa: 30, status: 'decreased' },
      ];
    case 'Traffic':
    default:
      return [
        { platform: 'Meta Ads', spendPercent: 38, cpa: 21, status: 'steady' },
        { platform: 'Google Ads', spendPercent: 32, cpa: 19, status: 'increased' },
        { platform: 'TikTok', spendPercent: 30, cpa: 25, status: 'increased' },
      ];
  }
};

const mergeMediaPlan = (base: MediaPlanState, patch?: Partial<MediaPlanState>): MediaPlanState => ({
  ...base,
  ...patch,
  summary: patch?.summary ?? base.summary ?? null,
  allocations: patch?.allocations ? patch.allocations.map((allocation) => ({ ...allocation })) : base.allocations.map((allocation) => ({ ...allocation })),
  channels: patch?.channels ? [...patch.channels] : [...base.channels],
  channelSplits: patch?.channelSplits ? { ...patch.channelSplits } : { ...base.channelSplits },
  manualCplValues: patch?.manualCplValues ? { ...patch.manualCplValues } : { ...base.manualCplValues },
  // Explicitly preserve validation timestamps
  plannerValidatedAt: patch?.plannerValidatedAt ?? base.plannerValidatedAt,
  channelsValidatedAt: patch?.channelsValidatedAt ?? base.channelsValidatedAt,
  advancedValidatedAt: patch?.advancedValidatedAt ?? base.advancedValidatedAt,
});

export const useMediaPlanStore = create<MediaPlanStoreState>()((set, get) => ({
  mediaPlan: cloneDefaultMediaPlan(),
  isHydrated: false,
  isHydrating: false,
  isLoadingSummary: false,
  isSaving: false,
  error: null,
  currentPlanId: null,

  updatePlanField: (field, value) => {
    set((state) => {
      const current = state.mediaPlan;
      const next = {
        ...current,
        [field]: value,
      } as MediaPlanState;

      if (CORE_FIELDS.includes(field as (typeof CORE_FIELDS)[number]) && current[field] !== value) {
        next.summary = null;
      }

      if (PLANNER_VALIDATION_FIELDS.has(field)) {
        next.plannerValidatedAt = null;
      }
      if (CHANNEL_VALIDATION_FIELDS.has(field)) {
        next.channelsValidatedAt = null;
      }
      if (ADVANCED_VALIDATION_FIELDS.has(field)) {
        next.advancedValidatedAt = null;
      }

      return {
        mediaPlan: next,
        error: null,
      };
    });
    
    // Auto-save after every field update
    setTimeout(() => {
      get().saveToPersistence();
    }, 100);
  },

  setAllocations: (allocations) => {
    set((state) => ({
      mediaPlan: {
        ...state.mediaPlan,
        allocations: allocations.map((allocation) => ({ ...allocation })),
      },
      error: null,
    }));
    
    // Auto-save
    setTimeout(() => {
      get().saveToPersistence();
    }, 100);
  },

  setScenario: (scenario) => {
    set((state) => ({
      mediaPlan: {
        ...state.mediaPlan,
        scenario,
      },
      error: null,
    }));
    
    // Auto-save
    setTimeout(() => {
      get().saveToPersistence();
    }, 100);
  },

  setNotes: (notes) => {
    set((state) => ({
      mediaPlan: {
        ...state.mediaPlan,
        notes: notes ?? null,
      },
      error: null,
    }));
    
    // Auto-save
    setTimeout(() => {
      get().saveToPersistence();
    }, 100);
  },

  setSummary: (summary) => {
    set((state) => ({
      mediaPlan: {
        ...state.mediaPlan,
        summary,
      },
    }));
    
    // Auto-save
    setTimeout(() => {
      get().saveToPersistence();
    }, 100);
  },

  setChannels: (channels) => {
    set((state) => ({
      mediaPlan: {
        ...state.mediaPlan,
        channels: [...channels],
        channelsValidatedAt: null,
        advancedValidatedAt: null,
      },
      error: null,
    }));
    
    // Auto-save
    setTimeout(() => {
      get().saveToPersistence();
    }, 100);
  },

  setChannelSplits: (splits) => {
    set((state) => ({
      mediaPlan: {
        ...state.mediaPlan,
        channelSplits: { ...splits },
        channelsValidatedAt: null,
      },
      error: null,
    }));
    
    // Auto-save
    setTimeout(() => {
      get().saveToPersistence();
    }, 100);
  },

  setManualCplValues: (values) => {
    set((state) => ({
      mediaPlan: {
        ...state.mediaPlan,
        manualCplValues: { ...values },
        advancedValidatedAt: null,
      },
      error: null,
    }));
    
    // Auto-save
    setTimeout(() => {
      get().saveToPersistence();
    }, 100);
  },

  pullPlanSummary: async () => {
    const { mediaPlan, isLoadingSummary } = get();
    if (isLoadingSummary) {
      return mediaPlan.summary ?? null;
    }

    const hasCoreFields =
      Boolean(mediaPlan.budget && mediaPlan.budget > 0) &&
      Boolean(mediaPlan.market) &&
      Boolean(mediaPlan.currency) &&
      Boolean(mediaPlan.goal);

    if (!hasCoreFields) {
      return mediaPlan.summary ?? null;
    }

    set({ isLoadingSummary: true, error: null });

    try {
      // mimic latency or call API in future
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const summary = generateSummary({
        budget: mediaPlan.budget as number,
        market: mediaPlan.market as string,
        goal: mediaPlan.goal as Goal,
        currency: mediaPlan.currency as string,
        campaignDuration: mediaPlan.campaignDuration,
        campaignStartDate: mediaPlan.campaignStartDate,
        campaignEndDate: mediaPlan.campaignEndDate,
        niche: mediaPlan.niche,
        leadToSalePct: mediaPlan.leadToSalePct,
        revenuePerSale: mediaPlan.revenuePerSale,
      });

      set((state) => ({
        mediaPlan: {
          ...state.mediaPlan,
          summary,
          allocations:
            state.mediaPlan.allocations.length > 0
              ? state.mediaPlan.allocations
              : generateAllocations(mediaPlan.goal as Goal),
        },
        isLoadingSummary: false,
        error: null,
      }));

      // Auto-save generated data
      setTimeout(() => {
        get().saveToPersistence();
      }, 100);

      return summary;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to pull media plan summary';
      console.error('[MediaPlanStore] pullPlanSummary error', error);
      set({ isLoadingSummary: false, error: message });
      throw error;
    }
  },

  hydrateFromSettings: (plan) => {
    set({
      mediaPlan: mergeMediaPlan(cloneDefaultMediaPlan(), plan),
      isHydrated: true,
      isHydrating: false,
      error: null,
    });
  },

  hydrateFromStorage: async () => {
    if (typeof window === 'undefined') {
      set({ isHydrated: true, isHydrating: false });
      return;
    }

    if (get().isHydrated || get().isHydrating) {
      return;
    }

    set({ isHydrating: true });
    try {
      // Try Supabase first (production-grade, cross-device persistence)
      const supabasePlan = await loadLatestMediaPlan();
      
      if (supabasePlan) {
        console.log('[MediaPlanStore] ✅ Loaded from Supabase (production database)');
        console.log('[MediaPlanStore] 📊 Loaded data:', {
          hasSummary: !!supabasePlan.summary,
          allocationsCount: supabasePlan.allocations?.length || 0,
          channelsCount: supabasePlan.channels?.length || 0,
          budget: supabasePlan.budget,
          goal: supabasePlan.goal,
          plannerValidatedAt: supabasePlan.plannerValidatedAt,
          channelsValidatedAt: supabasePlan.channelsValidatedAt,
          advancedValidatedAt: supabasePlan.advancedValidatedAt,
        });
        const merged = mergeMediaPlan(cloneDefaultMediaPlan(), supabasePlan);
        console.log('[MediaPlanStore] 🔄 After merge:', {
          hasSummary: !!merged.summary,
          allocationsCount: merged.allocations?.length || 0,
          channelsCount: merged.channels?.length || 0,
          plannerValidatedAt: merged.plannerValidatedAt,
          channelsValidatedAt: merged.channelsValidatedAt,
          advancedValidatedAt: merged.advancedValidatedAt,
        });
        set({
          mediaPlan: merged,
          isHydrated: true,
          isHydrating: false,
          error: null,
        });
        
        // Also save to localStorage as backup
        saveSettings({
          ...defaultSettings,
          mediaPlan: supabasePlan,
        });
        return;
      }
      
      // Fallback to localStorage if Supabase has no data (e.g., first-time user)
      const stored = loadSettings();
      console.log('[MediaPlanStore] Loaded from localStorage (fallback)');
      
      set({
        mediaPlan: mergeMediaPlan(cloneDefaultMediaPlan(), stored.mediaPlan),
        isHydrated: true,
        isHydrating: false,
        error: null,
      });
    } catch (error) {
      console.error('[MediaPlanStore] hydrateFromStorage error', error);
      
      // Even on error, try localStorage as last resort
      try {
        const stored = loadSettings();
        set({
          mediaPlan: mergeMediaPlan(cloneDefaultMediaPlan(), stored.mediaPlan),
          isHydrated: true,
          isHydrating: false,
          error: null,
        });
        console.warn('[MediaPlanStore] Recovered from localStorage after error');
      } catch (fallbackError) {
        set({
          isHydrated: true,
          isHydrating: false,
          error: error instanceof Error ? error.message : 'Failed to hydrate media plan',
        });
      }
    }
  },

  saveToPersistence: async () => {
    const { mediaPlan, isSaving, currentPlanId } = get();
    
    if (isSaving) {
      console.log('[MediaPlanStore] Already saving, skipping');
      return;
    }

    set({ isSaving: true });

    try {
      // Log what we're saving
      console.log('[MediaPlanStore] 💾 Saving data:', {
        hasSummary: !!mediaPlan.summary,
        allocationsCount: mediaPlan.allocations?.length || 0,
        channelsCount: mediaPlan.channels?.length || 0,
        budget: mediaPlan.budget,
        goal: mediaPlan.goal,
        plannerValidatedAt: mediaPlan.plannerValidatedAt,
        channelsValidatedAt: mediaPlan.channelsValidatedAt,
        advancedValidatedAt: mediaPlan.advancedValidatedAt,
      });
      
      // Save to Supabase first (production database)
      const result = await saveMediaPlan(mediaPlan, currentPlanId || undefined);
      
      if (result) {
        set({ currentPlanId: result.id });
        console.log('[MediaPlanStore] ✅ Saved to Supabase (production database)');
      } else {
        console.warn('[MediaPlanStore] ⚠️ Supabase save returned null');
      }

      // Also save to localStorage as backup
      saveSettings({
        ...defaultSettings,
        mediaPlan,
      });
      console.log('[MediaPlanStore] 💾 Backup saved to localStorage');

      set({ 
        isSaving: false,
        error: null,
      });
    } catch (error) {
      console.error('[MediaPlanStore] ❌ Save to Supabase failed:', error);
      
      // Even if Supabase fails, save to localStorage
      try {
        saveSettings({
          ...defaultSettings,
          mediaPlan,
        });
        console.log('[MediaPlanStore] 💾 Backup saved to localStorage after error');
        set({ 
          isSaving: false,
          error: null,
        });
      } catch (fallbackError) {
        set({ 
          isSaving: false,
          error: error instanceof Error ? error.message : 'Failed to save media plan',
        });
      }
    }
  },

  markSynced: (timestamp) => {
    set((state) => ({
      mediaPlan: {
        ...state.mediaPlan,
        lastSyncedAt: timestamp ?? new Date().toISOString(),
      },
      error: null,
    }));
    
    // Auto-save after marking synced
    setTimeout(() => {
      get().saveToPersistence();
    }, 100);
  },

  markSectionValidated: (section) => {
    const field = VALIDATION_FIELD_BY_SECTION[section];
    set((state) => ({
      mediaPlan: {
        ...state.mediaPlan,
        [field]: new Date().toISOString(),
      },
      error: null,
    }));
    
    // Auto-save after validation
    setTimeout(() => {
      get().saveToPersistence();
    }, 100);
    
    // Save to generation history when both planner and channels are validated
    const state = get();
    if (state.mediaPlan.plannerValidatedAt && state.mediaPlan.channelsValidatedAt) {
      setTimeout(() => {
        try {
          const { addGeneration } = useGeneratedCardsStore.getState();
          
          // Generate allocations from selected channels for history display
          const channels = state.mediaPlan.channels.length > 0 ? state.mediaPlan.channels : [];
          const manualMode = state.mediaPlan.channelMode === 'manual';
          const totalSplit = manualMode
            ? channels.reduce((sum, ch) => sum + (state.mediaPlan.channelSplits[ch] ?? 0), 0) || 100
            : 100;
          
          // Calculate actual metrics from summary or fallback to budget-based calculations
          const summary = state.mediaPlan.summary;
          const budget = state.mediaPlan.budget ?? 0;
          
          // Use summary if available, otherwise calculate from budget
          const totalImpressions = summary?.impressions ?? Math.max(1, Math.round(budget * 12));
          const totalReach = summary?.reach ?? Math.round(totalImpressions * 0.7);
          const totalClicks = summary?.clicks ?? Math.round(totalImpressions * 0.03);
          const totalLeads = summary?.leads ?? Math.max(1, Math.round(totalClicks * 0.15));
          
          const transformedAllocations = channels.map(channel => {
            // Calculate share from manual split or allocations
            let share: number;
            if (manualMode) {
              const channelSplit = state.mediaPlan.channelSplits[channel] ?? (100 / channels.length);
              share = channelSplit / totalSplit;
            } else {
              const allocation = state.mediaPlan.allocations.find(a => a.platform === channel);
              share = allocation 
                ? (allocation.spendPercent ?? (100 / channels.length)) / 100
                : 1 / channels.length;
            }
            
            const percentage = Math.round(share * 100);
            const budget = state.mediaPlan.budget 
              ? Math.round(state.mediaPlan.budget * share) 
              : 0;
            
            // Calculate actual metrics for this channel
            const impressions = Math.round(totalImpressions * share);
            const reach = Math.round(totalReach * share);
            const clicks = Math.round(totalClicks * share);
            const leads = Math.round(totalLeads * share);
            const views = Math.round(impressions * 0.65);
            const engagement = Math.round(clicks * 1.8);
            const cpl = leads > 0 ? budget / leads : null;
            const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
            const cpc = clicks > 0 ? budget / clicks : null;
            const cpm = impressions > 0 ? (budget / impressions) * 1000 : null;
            
            return {
              channel,
              percentage,
              budget,
              impressions,
              reach,
              clicks,
              leads,
              views,
              engagement,
              cpl,
              ctr,
              cpc,
              cpm,
            };
          });
          
          addGeneration('media-plan', {
            ...state.mediaPlan,
            allocations: transformedAllocations,
          }, {
            budget: state.mediaPlan.budget,
            goal: state.mediaPlan.goal,
            market: state.mediaPlan.market,
          }).then(() => {
            console.log('[MediaPlanStore] 📊 Media plan saved to generation history');
          }).catch((error) => {
            console.error('[MediaPlanStore] Failed to save to generation history:', error);
          });
        } catch (error) {
          console.error('[MediaPlanStore] Error accessing generation store:', error);
        }
      }, 200);
    }
  },

  clearError: () => set({ error: null }),
}));

export const useMediaPlanState = <T>(selector: (state: MediaPlanStoreState) => T): T =>
  useMediaPlanStore(selector);

export const updatePlanField = <Field extends MediaPlanEditableField>(
  field: Field,
  value: MediaPlanState[Field]
): void => {
  useMediaPlanStore.getState().updatePlanField(field, value);
};

export const setAllocations = (allocations: MediaPlanAllocation[]): void => {
  useMediaPlanStore.getState().setAllocations(allocations);
};

export const setScenario = (scenario: MediaPlanScenario | null): void => {
  useMediaPlanStore.getState().setScenario(scenario);
};

export const setPlanNotes = (notes: string | null): void => {
  useMediaPlanStore.getState().setNotes(notes);
};

export const setPlanSummary = (summary: MediaPlanSummary | null): void => {
  useMediaPlanStore.getState().setSummary(summary);
};

export const setChannels = (channels: string[]): void => {
  useMediaPlanStore.getState().setChannels(channels);
};

export const setChannelSplits = (splits: Record<string, number>): void => {
  useMediaPlanStore.getState().setChannelSplits(splits);
};

export const setManualCplValues = (values: Record<string, number | null>): void => {
  useMediaPlanStore.getState().setManualCplValues(values);
};

export const pullPlanSummary = (): Promise<MediaPlanSummary | null> =>
  useMediaPlanStore.getState().pullPlanSummary();

export const hydrateMediaPlan = (plan?: Partial<MediaPlanState>): void => {
  useMediaPlanStore.getState().hydrateFromSettings(plan);
};

export const hydrateMediaPlanFromStorage = (): Promise<void> =>
  useMediaPlanStore.getState().hydrateFromStorage();

export const markMediaPlanSynced = (timestamp?: string | null): void => {
  useMediaPlanStore.getState().markSynced(timestamp);
};

export const markMediaPlanSectionValidated = (section: ValidationSection): void => {
  useMediaPlanStore.getState().markSectionValidated(section);
};

export const clearMediaPlanError = (): void => {
  useMediaPlanStore.getState().clearError();
};

export function useHydrateMediaPlan() {
  const hydrate = useMediaPlanState((state) => state.hydrateFromStorage);
  const isHydrated = useMediaPlanState((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [hydrate, isHydrated]);
}

