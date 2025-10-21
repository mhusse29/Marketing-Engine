/**
 * GET /api/v1/metrics/health
 */
import { supabase } from '../../../lib/supabase.js';
import { authenticate, unauthorized } from '../../../lib/auth.js';
import { cachedQuery, sendError, setCorsHeaders } from '../../../lib/response.js';

export default async function handler(req, res) {
  setCorsHeaders(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await authenticate(req);
  if (!auth.authenticated) return unauthorized(res);

  try {
    const intervalMinutes = parseInt(req.query.interval) || 60;
    const result = await cachedQuery(
      `health_score_${intervalMinutes}`,
      () => supabase.rpc('get_health_score', { interval_duration: `${intervalMinutes} minutes` }),
      60
    );
    return res.status(200).json(result);
  } catch (err) {
    return sendError(res, err, { path: '/api/v1/metrics/health' });
  }
}
