/**
 * Vercel Serverless Function: Daily Metrics
 * GET /api/v1/metrics/daily?days=30
 */
import { handleCors } from '../../_lib/cors.js';
import { requireAuth } from '../../_lib/auth.js';
import { getSupabaseClient } from '../../_lib/supabase.js';

async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const days = parseInt(req.query.days) || 30;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('mv_daily_metrics')
      .select('*')
      .order('date', { ascending: false })
      .limit(days);

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
    console.error('[Daily Metrics] Error:', error);
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
