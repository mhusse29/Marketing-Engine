/**
 * GET /api/v1/users/churn-risk
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
    const minScore = parseInt(req.query.min_score) || 50;
    const result = await cachedQuery(
      `churn_risk_${minScore}`,
      () => supabase.rpc('get_churn_risk_users', { min_score: minScore }),
      60
    );
    return res.status(200).json(result);
  } catch (err) {
    return sendError(res, err, { path: '/api/v1/users/churn-risk' });
  }
}
