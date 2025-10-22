/**
 * Vercel Serverless Function: Health Score Metrics
 * GET /api/v1/metrics/health?interval=60
 */
import { handleCors } from '../../_lib/cors.mjs';
import { requireAuth } from '../../_lib/auth.mjs';
import { getSupabaseClient } from '../../_lib/supabase.mjs';

async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const intervalMinutes = parseInt(req.query.interval) || 60;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc('get_health_score', {
      interval_duration: `${intervalMinutes} minutes`,
    });

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    res.status(200).json({
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        cached: false,
        source: 'database',
        freshness: 'current',
        version: 'v1',
      }
    });
  } catch (error) {
    console.error('[Health Metrics] Error:', error);
    res.status(500).json({
      data: null,
      metadata: {
        timestamp: new Date().toISOString(),
        cached: false,
        source: 'database',
        freshness: 'stale',
        version: 'v1',
        error: error.message,
      }
    });
  }
}

export default requireAuth(handler);
