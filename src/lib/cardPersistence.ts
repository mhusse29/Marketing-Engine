/**
 * Card Persistence Service
 * Handles all Supabase operations for generated card storage
 */

import { supabase } from './supabase';
import type { CardKey } from '../types';

export interface GeneratedCard {
  id: string;
  userId: string;
  cardType: CardKey;
  generationId: string;
  generationBatchId: string;
  snapshot: {
    data: unknown;
    settings?: Record<string, unknown>;
    timestamp: number;
  };
  dragOffsetX: number;
  dragOffsetY: number;
  isPinned: boolean;
  isHidden: boolean;
  displayOrder: number;
  aspectRatio: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveGenerationOptions {
  cardType: CardKey;
  data: unknown;
  settings?: Record<string, unknown>;
  batchId: string;
  position?: number;
  aspectRatio?: number;
  thumbnailUrl?: string;
}

/**
 * Load all active generations for the current user
 */
export async function loadUserGenerations(): Promise<GeneratedCard[]> {
  console.log('[CardPersistence] Loading user generations...');
  const startTime = Date.now();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Use lightweight RPC function (excludes heavy snapshot data)
  const { data, error } = await supabase.rpc('get_user_active_generations') as {
    data: Array<{
      id: string;
      user_id: string;
      card_type: string;
      generation_id: string;
      generation_batch_id: string;
      drag_offset_x: number;
      drag_offset_y: number;
      is_pinned: boolean;
      is_hidden: boolean;
      display_order: number;
      aspect_ratio: number;
      thumbnail_url: string | null;
      created_at: string;
      updated_at: string;
    }> | null;
    error: Error | null;
  };

  if (error) {
    console.error('[CardPersistence] Failed to load user generations:', error);
    throw error;
  }
  
  console.log(`[CardPersistence] Loaded ${data?.length || 0} card metadata in ${Date.now() - startTime}ms`);

  // Return cards with placeholder snapshot - will be loaded on-demand
  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    cardType: row.card_type as CardKey,
    generationId: row.generation_id,
    generationBatchId: row.generation_batch_id,
    snapshot: { data: null, timestamp: 0 } as GeneratedCard['snapshot'], // Placeholder - loaded on demand
    dragOffsetX: row.drag_offset_x,
    dragOffsetY: row.drag_offset_y,
    isPinned: row.is_pinned,
    isHidden: row.is_hidden || false,
    displayOrder: row.display_order,
    aspectRatio: row.aspect_ratio,
    thumbnailUrl: row.thumbnail_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Load all snapshots for user - splits into light (non-video) and video requests
 * Video snapshots are huge (12MB each) so we extract only essential fields
 * Returns a Map of generationId -> snapshot for efficient lookup
 */
export async function loadAllSnapshots(): Promise<Map<string, GeneratedCard['snapshot']>> {
  const snapshotMap = new Map<string, GeneratedCard['snapshot']>();

  // Load non-video snapshots (small, fast)
  const { data: lightData, error: lightError } = await supabase.rpc('get_user_snapshots_light') as {
    data: Array<{ generation_id: string; snapshot: GeneratedCard['snapshot'] }> | null;
    error: Error | null;
  };

  if (lightError) {
    console.error('[CardPersistence] Failed to load light snapshots:', lightError);
  } else {
    (lightData || []).forEach(row => {
      snapshotMap.set(row.generation_id, row.snapshot);
    });
  }

  // Load video snapshots (extracted essential data only)
  const { data: videoData, error: videoError } = await supabase.rpc('get_user_video_snapshots') as {
    data: Array<{ generation_id: string; snapshot: GeneratedCard['snapshot'] }> | null;
    error: Error | null;
  };

  if (videoError) {
    console.error('[CardPersistence] Failed to load video snapshots:', videoError);
  } else {
    (videoData || []).forEach(row => {
      snapshotMap.set(row.generation_id, row.snapshot);
    });
  }
  
  console.log(`[CardPersistence] Loaded ${snapshotMap.size} snapshots (light + video)`);
  return snapshotMap;
}

export async function loadUserPicturePrompts(limit = 200): Promise<Map<string, string>> {
  const promptMap = new Map<string, string>();

  const { data, error } = await supabase.rpc('get_user_picture_prompts', {
    _limit: limit,
  }) as {
    data: Array<{ generation_id: string; prompt: string }> | null;
    error: Error | null;
  };

  if (error) {
    console.error('[CardPersistence] Failed to load picture prompts:', error);
    return promptMap;
  }

  (data || []).forEach((row) => {
    if (!row.generation_id) return;
    promptMap.set(row.generation_id, row.prompt || '');
  });

  return promptMap;
}

export async function loadGenerationSnapshotCompact(generationId: string): Promise<GeneratedCard['snapshot'] | null> {
  const { data, error } = await supabase.rpc('get_generation_snapshot_compact', {
    _generation_id: generationId,
  }) as {
    data: GeneratedCard['snapshot'] | null;
    error: Error | null;
  };

  if (error) {
    console.error('[CardPersistence] Failed to load snapshot (compact):', error);
    return null;
  }

  return data;
}

/**
 * Save a new generation to the database
 */
export async function saveGeneration(options: SaveGenerationOptions): Promise<string> {
  console.log('[CardPersistence] Saving generation:', options.cardType);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('[CardPersistence] User not authenticated');
    throw new Error('User not authenticated');
  }
  
  console.log('[CardPersistence] User ID:', user.id);

  const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Insert into user_generations table
  const { error } = await supabase
    .from('user_generations')
    .insert({
      user_id: user.id,
      card_type: options.cardType,
      generation_id: generationId,
      generation_batch_id: options.batchId,
      position: options.position ?? 0,
      snapshot: JSON.parse(JSON.stringify({
        data: options.data,
        settings: options.settings || {},
        timestamp: Date.now(),
      })),
      thumbnail_url: options.thumbnailUrl || null,
      aspect_ratio: options.aspectRatio ?? 1.0,
      is_hidden: false,
      is_pinned: false,
    });

  if (error) {
    console.error('[CardPersistence] Failed to save generation:', error);
    throw error;
  }

  console.log('[CardPersistence] Save successful, generationId:', generationId);
  return generationId;
}

/**
 * Update card position after drag-and-drop
 */
let positionUpdateTimeout: NodeJS.Timeout | null = null;

export async function updateCardPosition(
  generationId: string,
  dragX: number,
  dragY: number,
  displayOrder: number
): Promise<void> {
  // Debounce position updates
  if (positionUpdateTimeout) {
    clearTimeout(positionUpdateTimeout);
  }

  return new Promise((resolve, reject) => {
    positionUpdateTimeout = setTimeout(async () => {
      try {
        const { error } = await supabase.rpc('update_card_position', {
          _generation_id: generationId,
          _drag_x: dragX,
          _drag_y: dragY,
          _display_order: displayOrder,
        });

        if (error) {
          console.error('Failed to update card position:', error);
          reject(error);
        } else {
          resolve();
        }
      } catch (err) {
        reject(err);
      }
    }, 300); // 300ms debounce
  });
}

/**
 * Delete a generation (soft delete)
 */
export async function deleteGeneration(generationId: string): Promise<void> {
  console.log('[CardPersistence] Deleting generation:', generationId);
  
  const { error, data } = await supabase.rpc('delete_card_generation', {
    _generation_id: generationId,
  });

  if (error) {
    console.error('[CardPersistence] Failed to delete generation:', error);
    throw error;
  }
  
  console.log('[CardPersistence] Delete successful, response:', data);
}

/**
 * Toggle pin state for a card
 */
export async function toggleCardPin(generationId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_card_pin', {
    _generation_id: generationId,
  });

  if (error) {
    console.error('Failed to toggle card pin:', error);
    throw error;
  }

  return data as boolean;
}

/**
 * Batch update multiple card positions
 */
export async function batchUpdatePositions(
  updates: Array<{ generationId: string; dragX: number; dragY: number; displayOrder: number }>
): Promise<void> {
  // Execute updates in parallel
  const promises = updates.map(({ generationId, dragX, dragY, displayOrder }) =>
    supabase.rpc('update_card_position', {
      _generation_id: generationId,
      _drag_x: dragX,
      _drag_y: dragY,
      _display_order: displayOrder,
    })
  );

  const results = await Promise.allSettled(promises);
  
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map(r => r.reason);

  if (errors.length > 0) {
    console.error('Some position updates failed:', errors);
  }
}

/**
 * Get thumbnail URL for a card based on type and data
 * 
 * Pictures data structure: { versions: GeneratedPictures[] }
 * where GeneratedPictures has { assets: Array<{ url, width, height }> }
 */
export function generateThumbnailUrl(cardType: CardKey, data: unknown): string | undefined {
  if (cardType === 'pictures' && data && typeof data === 'object') {
    const picturesData = data as {
      versions?: Array<{
        assets?: Array<{ url?: string; src?: string; uri?: string }>;
        url?: string;
        src?: string;
        uri?: string;
      }>;
    };
    
    // The actual structure: versions[0].assets[0].url
    if (picturesData.versions && picturesData.versions.length > 0) {
      const firstVersion = picturesData.versions[0];
      
      // Try assets array first (this is the real structure)
      if (firstVersion.assets && firstVersion.assets.length > 0) {
        const firstAsset = firstVersion.assets[0];
        const url = firstAsset.url || firstAsset.src || firstAsset.uri;
        if (url) return url;
      }
      
      // Fallback to version-level url
      const url = firstVersion.url || firstVersion.src || firstVersion.uri;
      if (url) return url;
    }
  }
  
  if (cardType === 'video' && data && typeof data === 'object') {
    const videoData = data as {
      versions?: Array<{
        url?: string;          // Video URL (GeneratedVideo structure)
        thumbnailUrl?: string; // Future: dedicated thumbnail
        thumbnail?: string;
        assets?: Array<{ url?: string; thumbnailUrl?: string; thumbnail?: string }>;
      }>;
    };
    
    // GeneratedVideo structure: versions[0].url is the video URL
    // For now, use the video URL as thumbnail (browser will show first frame)
    if (videoData.versions && videoData.versions.length > 0) {
      const firstVersion = videoData.versions[0];
      
      // Prefer dedicated thumbnail if available
      if (firstVersion.thumbnailUrl) return firstVersion.thumbnailUrl;
      if (firstVersion.thumbnail) return firstVersion.thumbnail;
      
      // Try assets array (legacy/future structure)
      if (firstVersion.assets && firstVersion.assets.length > 0) {
        const firstAsset = firstVersion.assets[0];
        const url = firstAsset.thumbnailUrl || firstAsset.thumbnail || firstAsset.url;
        if (url) return url;
      }
      
      // Use video URL as thumbnail (browsers show first frame)
      if (firstVersion.url) return firstVersion.url;
    }
  }
  
  // Media plan: No thumbnail URL - use icon in UI
  if (cardType === 'media-plan') {
    // Future: Could generate chart thumbnails via canvas/service
    return undefined;
  }
  
  // Content cards don't have thumbnails
  return undefined;
}

/**
 * Hide a card from main screen (keeps in history)
 */
export async function hideCardGeneration(generationId: string): Promise<void> {
  const { error } = await supabase.rpc('hide_card_generation', {
    _generation_id: generationId,
  });

  if (error) {
    console.error('Failed to hide card:', error);
    throw error;
  }
}

/**
 * Restore a hidden card to main screen
 */
export async function restoreCardGeneration(generationId: string): Promise<void> {
  const { error } = await supabase.rpc('restore_card_generation', {
    _generation_id: generationId,
  });

  if (error) {
    console.error('Failed to restore card:', error);
    throw error;
  }
}

/**
 * Load ALL generations including hidden ones (for history panel)
 */
export async function loadAllUserGenerations(): Promise<GeneratedCard[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Use RPC to avoid pulling huge snapshot blobs (especially video) via the REST view.
  // Server trims video snapshots to essential fields.
  const { data, error } = await supabase.rpc('get_user_all_generations', {
    _limit: 200,
  }) as {
    data: Array<{
      id: string;
      user_id: string;
      card_type: string;
      generation_id: string;
      generation_batch_id: string | null;
      snapshot: GeneratedCard['snapshot'] | null;
      drag_offset_x: number;
      drag_offset_y: number;
      is_pinned: boolean;
      is_hidden: boolean;
      display_order: number;
      aspect_ratio: number;
      thumbnail_url: string | null;
      created_at: string;
      updated_at: string;
    }> | null;
    error: Error | null;
  };

  if (error) {
    console.error('Failed to load all generations:', error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    cardType: row.card_type as CardKey,
    generationId: row.generation_id,
    generationBatchId: row.generation_batch_id || '',
    snapshot: (row.snapshot ?? { data: null, timestamp: 0 }) as GeneratedCard['snapshot'],
    dragOffsetX: row.drag_offset_x,
    dragOffsetY: row.drag_offset_y,
    isPinned: row.is_pinned,
    isHidden: row.is_hidden || false,
    displayOrder: row.display_order,
    aspectRatio: row.aspect_ratio,
    thumbnailUrl: row.thumbnail_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Calculate aspect ratio for a card based on type and data
 */
export function calculateAspectRatio(cardType: CardKey, data: unknown): number {
  // Default aspect ratios per card type
  const defaults: Record<CardKey, number> = {
    content: 4 / 5,      // Portrait for social content
    pictures: 1,          // Square by default
    video: 16 / 9,        // Standard video
    'media-plan': 16 / 9, // Landscape for charts/tables
  };

  if (cardType === 'pictures' && data && typeof data === 'object') {
    const picturesData = data as { width?: number; height?: number };
    if (picturesData.width && picturesData.height) {
      return picturesData.width / picturesData.height;
    }
  }

  if (cardType === 'video' && data && typeof data === 'object') {
    const videoData = data as { 
      versions?: Array<{ aspect?: string }>;
      aspect?: string; 
      aspectRatio?: string; 
      width?: number; 
      height?: number;
    };
    
    // Check versions array first (the actual structure from addGeneration)
    const aspect = videoData.versions?.[0]?.aspect || videoData.aspect || videoData.aspectRatio;
    
    if (aspect === '9:16') return 9 / 16;
    if (aspect === '16:9') return 16 / 9;
    if (aspect === '1:1') return 1;
    
    if (videoData.width && videoData.height) {
      return videoData.width / videoData.height;
    }
  }

  return defaults[cardType];
}
