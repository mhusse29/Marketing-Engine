import type { MediaPlanState } from '../types';

interface SaveMediaPlanLitePayload {
  plan: MediaPlanState;
  userId?: string | null;
}

interface SaveMediaPlanLiteResult {
  success: boolean;
  timestamp: string;
}

/**
 * Placeholder persistence layer for Media Plan Lite.
 * Replace with Supabase mutation when backend endpoint is ready.
 */
export async function saveMediaPlanLite(
  payload: SaveMediaPlanLitePayload
): Promise<SaveMediaPlanLiteResult> {
  if (import.meta.env.DEV) {
    console.info('[MediaPlanLite] saveMediaPlanLite stub', payload);
  }

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    success: true,
    timestamp: new Date().toISOString(),
  };
}



