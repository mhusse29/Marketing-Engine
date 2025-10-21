/**
 * POST /api/v1/refresh
 * Refresh materialized views (admin only)
 */
import { supabase } from '../../lib/supabase.js';
import { authenticate, unauthorized, forbidden, isAdmin } from '../../lib/auth.js';
import { sendError, setCorsHeaders } from '../../lib/response.js';
import * as cache from '../../lib/cache.js';
import { logger } from '../../lib/logger.js';

export default async function handler(req, res) {
  setCorsHeaders(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await authenticate(req);
  if (!auth.authenticated) return unauthorized(res);
  if (!isAdmin(auth)) return forbidden(res);

  try {
    cache.flushAll();
    logger.info('cache_cleared', { actor: auth.user?.id || 'service' });

    const { data, error } = await supabase.rpc('refresh_analytics_views');
    if (error) throw error;

    logger.info('materialized_views_refreshed', { actor: auth.user?.id || 'service' });

    return res.status(200).json({
      success: true,
      message: 'Views refreshed and cache cleared',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return sendError(res, err, { path: '/api/v1/refresh' });
  }
}
