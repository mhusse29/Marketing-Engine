/**
 * Vercel Serverless Function: Revenue by Plan
 * GET /api/v1/revenue/plans
 */
import { handleCors } from '../../_lib/cors.mjs';
import { requireAuth } from '../../_lib/auth.mjs';
import { getSupabaseClient } from '../../_lib/supabase.mjs';

async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('plan_name, is_active, current_month_cost, lifetime_cost, auto_renew');

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Aggregate by plan
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
      if (row.auto_renew) {
        acc[row.plan_name].auto_renew_count++;
      }
      return acc;
    }, {});

    // Calculate averages
    Object.values(aggregated).forEach((item) => {
      item.avg_lifetime_value = item.avg_lifetime_value / item.total_subscribers;
      item.auto_renew_pct = (item.auto_renew_count / item.total_subscribers) * 100;
    });

    res.status(200).json({
      data: Object.values(aggregated),
      metadata: {
        timestamp: new Date().toISOString(),
        cached: false,
        source: 'database',
        freshness: 'current',
        version: 'v1',
      }
    });
  } catch (error) {
    console.error('[Revenue Plans] Error:', error);
    res.status(500).json({
      data: null,
      metadata: {
        timestamp: new Date().toISOString(),
        cached: false,
        source: 'database',
        freshness: 'stale',
        version: 'v1',
        error: error.message,
      }
    });
  }
}

export default requireAuth(handler);
