/**
 * GET /api/v1/metrics/executive
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
    const days = parseInt(req.query.days) || 30;
    const result = await cachedQuery(
      `executive_${days}`,
      async () => {
        const { data, error } = await supabase.rpc('get_executive_summary', { days_back: days });
        if (error) throw error;
        return { data, error: null };
      },
      30
    );
    return res.status(200).json(result);
  } catch (err) {
    return sendError(res, err, { path: '/api/v1/metrics/executive' });
  }
}
