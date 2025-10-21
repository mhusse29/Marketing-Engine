/**
 * GET /api/v1/revenue/plans
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
    const result = await cachedQuery(
      'revenue_plans',
      async () => {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('plan_name, is_active, current_month_cost, lifetime_cost, auto_renew');

        if (error) throw error;

        const aggregated = (data || []).reduce((acc, row) => {
          if (!acc[row.plan_name]) {
            acc[row.plan_name] = {
              plan_name: row.plan_name,
              total_subscribers: 0,
              active_subscribers: 0,
              total_monthly_revenue: 0,
              avg_lifetime_value: 0,
              auto_renew_count: 0,
              auto_renew_pct: 0,
            };
          }
          acc[row.plan_name].total_subscribers++;
          if (row.is_active) {
            acc[row.plan_name].active_subscribers++;
            acc[row.plan_name].total_monthly_revenue += Number(row.current_month_cost || 0);
          }
          acc[row.plan_name].avg_lifetime_value += Number(row.lifetime_cost || 0);
          if (row.auto_renew) acc[row.plan_name].auto_renew_count++;
          return acc;
        }, {});

        Object.values(aggregated).forEach((item) => {
          item.avg_lifetime_value = item.avg_lifetime_value / item.total_subscribers;
          item.auto_renew_pct = (item.auto_renew_count / item.total_subscribers) * 100;
        });

        return { data: Object.values(aggregated), error: null };
      },
      60
    );
    return res.status(200).json(result);
  } catch (err) {
    return sendError(res, err, { path: '/api/v1/revenue/plans' });
  }
}
