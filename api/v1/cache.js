/**
 * Combined Cache Endpoint
 * GET /api/v1/cache - Get stats
 * DELETE /api/v1/cache/:key - Delete specific key
 */
import { authenticate, unauthorized, forbidden, isAdmin } from '../../lib/auth.js';
import { setCorsHeaders } from '../../lib/response.js';
import * as cache from '../../lib/cache.js';
import { logger } from '../../lib/logger.js';

export default async function handler(req, res) {
  setCorsHeaders(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = await authenticate(req);
  if (!auth.authenticated) return unauthorized(res);
  if (!isAdmin(auth)) return forbidden(res);

  // GET /api/v1/cache - Stats
  if (req.method === 'GET' && !req.query.key) {
    const stats = cache.getStats();
    return res.status(200).json({
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
      keyList: cache.keys()
    });
  }

  // DELETE /api/v1/cache?key=xxx - Delete specific key
  if (req.method === 'DELETE' && req.query.key) {
    const { key } = req.query;
    const deleted = cache.del(key);
    
    logger.info('cache_entry_removed', {
      key,
      deleted,
      actor: auth.user?.id || 'service'
    });

    return res.status(200).json({
      success: deleted > 0,
      key,
      deleted
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
