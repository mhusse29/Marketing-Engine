/**
 * GET /api/v1/status
 * Database connectivity status
 */
import { supabase } from '../../lib/supabase.js';
import { authenticate, unauthorized } from '../../lib/auth.js';
import { sendError, setCorsHeaders } from '../../lib/response.js';

export default async function handler(req, res) {
  // Handle CORS
  setCorsHeaders(res, req.headers.origin);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate
  const auth = await authenticate(req);
  if (!auth.authenticated) {
    return unauthorized(res);
  }

  try {
    // Check database connectivity
    const { data, error } = await supabase
      .from('api_usage')
      .select('id')
      .limit(1);

    return res.status(200).json({
      status: error ? 'degraded' : 'operational',
      database: error ? 'error' : 'connected',
      cache: 'operational',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return sendError(res, err, { path: '/api/v1/status' });
  }
}
