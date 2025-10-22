/**
 * Vercel Serverless Function: Realtime API Usage
 * GET /api/v1/metrics/realtime?limit=50&service_type=chat&status=success
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
    const limit = parseInt(req.query.limit) || 50;
    const serviceType = req.query.service_type;
    const status = req.query.status;
    
    const supabase = getSupabaseClient();

    let query = supabase
      .from('api_usage')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (serviceType && serviceType !== 'all') {
      query = query.eq('service_type', serviceType);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    res.status(200).json({
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        cached: false,
        source: 'realtime',
        freshness: 'live',
        version: 'v1',
      }
    });
  } catch (error) {
    console.error('[Realtime Metrics] Error:', error);
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
