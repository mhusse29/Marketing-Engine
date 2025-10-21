/**
 * GET /api/v1/metrics/realtime
 */
import { supabase } from '../../../lib/supabase.js';
import { authenticate, unauthorized } from '../../../lib/auth.js';
import { addMetadata, sendError, setCorsHeaders } from '../../../lib/response.js';

export default async function handler(req, res) {
  setCorsHeaders(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await authenticate(req);
  if (!auth.authenticated) return unauthorized(res);

  try {
    const limit = parseInt(req.query.limit) || 50;
    const serviceType = req.query.service_type;
    const status = req.query.status;

    let query = supabase.from('api_usage').select('*').order('created_at', { ascending: false }).limit(limit);
    if (serviceType && serviceType !== 'all') query = query.eq('service_type', serviceType);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json(addMetadata(data, { cached: false, source: 'realtime', freshness: 'live' }));
  } catch (err) {
    return sendError(res, err, { path: '/api/v1/metrics/realtime' });
  }
}
