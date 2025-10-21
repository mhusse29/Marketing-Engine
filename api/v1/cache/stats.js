/**
 * GET /api/v1/cache/stats
 * Cache statistics (admin only)
 */
import { authenticate, unauthorized, forbidden, isAdmin } from '../../../lib/auth.js';
import { setCorsHeaders } from '../../../lib/response.js';
import * as cache from '../../../lib/cache.js';

export default async function handler(req, res) {
  setCorsHeaders(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await authenticate(req);
  if (!auth.authenticated) return unauthorized(res);
  if (!isAdmin(auth)) return forbidden(res);

  const stats = cache.getStats();
  return res.status(200).json({
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits / (stats.hits + stats.misses) || 0,
    keyList: cache.keys()
  });
}
