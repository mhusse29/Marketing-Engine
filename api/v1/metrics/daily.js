/**
 * GET /api/v1/metrics/daily
 * Daily aggregated metrics
 */
import { supabase } from '../../../lib/supabase.js';
import { authenticate, unauthorized } from '../../../lib/auth.js';
import { cachedQuery, sendError, setCorsHeaders } from '../../../lib/response.js';

export default async function handler(req, res) {
  setCorsHeaders(res, req.headers.origin);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticate(req);
  if (!auth.authenticated) {
    return unauthorized(res);
  }

  try {
    const days = parseInt(req.query.days) || 30;
    const cacheKey = `daily_metrics_${days}`;

    const result = await cachedQuery(
      cacheKey,
      () => supabase
        .from('mv_daily_metrics')
        .select('*')
        .order('date', { ascending: false })
        .limit(days),
      60
    );

    return res.status(200).json(result);
  } catch (err) {
    return sendError(res, err, { path: '/api/v1/metrics/daily' });
  }
}
