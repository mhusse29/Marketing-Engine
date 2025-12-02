/**
 * Media Plan Supabase Persistence Service
 * Syncs media plan data to Supabase for cross-session and cross-device persistence
 */

import { supabase } from '../lib/supabase';
import type { MediaPlanState } from '../types';

export interface MediaPlanRecord {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  
  // Budget & Targeting
  total_budget: number;
  currency: string;
  market: string;
  goal: string;
  niche?: string;
  
  // Conversion Metrics
  lead_to_sale_percent?: number;
  revenue_per_sale?: number;
  
  // Planning Mode
  manual_split: boolean;
  manual_cpl: boolean;
  
  // Full state as JSONB
  full_state: MediaPlanState;
  
  created_at: string;
  updated_at: string;
}

/**
 * Save or update media plan to Supabase
 * Production-grade persistence with full error handling
 */
export async function saveMediaPlan(plan: MediaPlanState, planId?: string): Promise<MediaPlanRecord | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[MediaPlanPersistence] No authenticated user, skipping save');
      return null;
    }

    const record: Partial<MediaPlanRecord> = {
      user_id: user.id,
      name: plan.notes || `Media Plan ${new Date().toLocaleDateString()}`,
      status: 'draft',
      total_budget: plan.budget || 0,
      currency: plan.currency || 'USD',
      market: plan.market || 'Egypt',
      goal: plan.goal || 'LEADS',
      niche: plan.niche || undefined,
      lead_to_sale_percent: plan.leadToSalePct || undefined,
      revenue_per_sale: plan.revenuePerSale || undefined,
      manual_split: plan.channelMode === 'manual',
      manual_cpl: plan.manualCplEnabled || false,
      full_state: plan,
    };

    let result;
    
    if (planId) {
      // Update existing plan
      const { data, error } = await supabase
        .from('media_plans')
        .update(record)
        .eq('id', planId)
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    } else {
      // Create new plan
      const { data, error } = await supabase
        .from('media_plans')
        .insert(record)
        .select()
        .single();
        
      if (error) throw error;
      result = data;
      
      // Save platforms
      if (plan.channels.length > 0) {
        await savePlatforms(result.id, plan);
      }
    }

    console.log('[MediaPlanPersistence] Saved successfully:', result.id);
    return result as MediaPlanRecord;
  } catch (error) {
    console.error('[MediaPlanPersistence] Save failed:', error);
    return null;
  }
}

/**
 * Save platform allocations for a media plan
 */
async function savePlatforms(mediaPlanId: string, plan: MediaPlanState): Promise<void> {
  try {
    const platforms = plan.channels.map((channel) => {
      const allocation = plan.channelMode === 'manual' 
        ? plan.channelSplits[channel] || 0
        : plan.allocations.find(a => a.platform === channel)?.spendPercent || 0;
        
      return {
        media_plan_id: mediaPlanId,
        platform: channel.toUpperCase().replace(/\s+/g, '_'),
        allocation_percent: allocation,
        manual_cpl: plan.manualCplValues[channel] || null,
      };
    });

    // Delete existing platforms
    await supabase
      .from('media_plan_platforms')
      .delete()
      .eq('media_plan_id', mediaPlanId);

    // Insert new platforms
    const { error } = await supabase
      .from('media_plan_platforms')
      .insert(platforms);

    if (error) throw error;
  } catch (error) {
    console.error('[MediaPlanPersistence] Platform save failed:', error);
  }
}

/**
 * Load the most recent media plan for the current user
 * Production-grade load with full error handling
 */
export async function loadLatestMediaPlan(): Promise<MediaPlanState | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[MediaPlanPersistence] No authenticated user, skipping load');
      return null;
    }

    // Use limit(1) without .single() to avoid 406 errors when no data exists
    const { data, error } = await supabase
      .from('media_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[MediaPlanPersistence] Load failed:', error);
      return null;
    }

    // Check if any data was returned
    if (!data || data.length === 0) {
      console.log('[MediaPlanPersistence] No saved plans found (first-time user)');
      return null;
    }

    const plan = data[0];
    console.log('[MediaPlanPersistence] ✅ Loaded successfully:', plan.id);
    return plan.full_state as MediaPlanState;
  } catch (error) {
    console.error('[MediaPlanPersistence] Load failed:', error);
    return null;
  }
}

/**
 * Load all media plans for the current user
 */
export async function loadAllMediaPlans(): Promise<MediaPlanRecord[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('media_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data as MediaPlanRecord[];
  } catch (error) {
    console.error('[MediaPlanPersistence] Load all failed:', error);
    return [];
  }
}

/**
 * Delete a media plan
 */
export async function deleteMediaPlan(planId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('media_plans')
      .delete()
      .eq('id', planId);

    if (error) throw error;

    console.log('[MediaPlanPersistence] Deleted successfully:', planId);
    return true;
  } catch (error) {
    console.error('[MediaPlanPersistence] Delete failed:', error);
    return false;
  }
}

/**
 * Create a snapshot of the current media plan
 */
export async function createSnapshot(mediaPlanId: string, plan: MediaPlanState, snapshotName?: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

    // Get next version number
    const { data: snapshots } = await supabase
      .from('media_plan_snapshots')
      .select('snapshot_version')
      .eq('media_plan_id', mediaPlanId)
      .order('snapshot_version', { ascending: false })
      .limit(1);

    const nextVersion = (snapshots && snapshots[0]?.snapshot_version) ? snapshots[0].snapshot_version + 1 : 1;

    const { error } = await supabase
      .from('media_plan_snapshots')
      .insert({
        media_plan_id: mediaPlanId,
        snapshot_data: plan,
        snapshot_version: nextVersion,
        snapshot_name: snapshotName || `Version ${nextVersion}`,
        created_by: user.id,
      });

    if (error) throw error;

    console.log('[MediaPlanPersistence] Snapshot created:', nextVersion);
    return true;
  } catch (error) {
    console.error('[MediaPlanPersistence] Snapshot failed:', error);
    return false;
  }
}
