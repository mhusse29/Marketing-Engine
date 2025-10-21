/**
 * DELETE /api/v1/cache/:key
 * Clear specific cache key (admin only)
 */
import { authenticate, unauthorized, forbidden, isAdmin } from '../../../lib/auth.js';
import { setCorsHeaders } from '../../../lib/response.js';
import * as cache from '../../../lib/cache.js';
import { logger } from '../../../lib/logger.js';

export default async function handler(req, res) {
  setCorsHeaders(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await authenticate(req);
  if (!auth.authenticated) return unauthorized(res);
  if (!isAdmin(auth)) return forbidden(res);

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
