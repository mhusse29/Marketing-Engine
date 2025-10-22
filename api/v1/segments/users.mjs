/**
 * Vercel Serverless Function: User Segments
 * GET /api/v1/segments/users?limit=100
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
    const limit = parseInt(req.query.limit) || 100;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('mv_user_segments')
      .select('*')
      .order('total_calls', { ascending: false })
      .limit(limit);

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
    console.error('[User Segments] Error:', error);
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
