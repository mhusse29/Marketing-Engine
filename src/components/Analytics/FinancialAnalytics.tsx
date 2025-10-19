import { KPICard } from './KPICard';
import { useRevenueMetrics, useDailyMetrics } from '../../hooks/useAnalytics';
import { DollarSign, TrendingUp, PieChart as PieChartIcon, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function FinancialAnalytics() {
  // Note: dateRange filter removed as useRevenueMetrics doesn't support date filtering
  // Revenue data comes from user_subscriptions which is not time-based
  const { revenue, loading: revenueLoading } = useRevenueMetrics();
  const { metrics, loading: metricsLoading } = useDailyMetrics(30);

  if (revenueLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white/80" />
            <span className="text-white/70">Loading financial data...</span>
          </div>
        </div>
      </div>
    );
  }

  const totalMRR = revenue.reduce((sum: number, r: { total_monthly_revenue: number }) => sum + r.total_monthly_revenue, 0);
  const totalSubscribers = revenue.reduce((sum: number, r: { active_subscribers: number }) => sum + r.active_subscribers, 0);
  const avgLTV = revenue.reduce((sum: number, r: { avg_lifetime_value: number; active_subscribers: number }) => sum + r.avg_lifetime_value * r.active_subscribers, 0) / totalSubscribers || 0;
  
  const recentCosts = metrics.slice(0, 30).reverse().map(m => ({
    date: m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
    cost: Number(m.total_cost || 0),
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Financial Analytics</h2>
          <p className="text-white/60">Revenue metrics and subscription analysis • Real-time data</p>
        </div>
        {/* Filter removed: Revenue data from user_subscriptions is not time-based */}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Monthly Recurring Revenue"
          value={`$${totalMRR.toFixed(2)}`}
          icon={DollarSign}
          status="good"
          subtitle="From all plans"
        />
        <KPICard
          title="Active Subscribers"
          value={totalSubscribers}
          icon={CreditCard}
          status="good"
        />
        <KPICard
          title="Avg Lifetime Value"
          value={`$${avgLTV.toFixed(2)}`}
          icon={TrendingUp}
          status="good"
          subtitle="Per customer"
        />
        <KPICard
          title="Total Plans"
          value={revenue.length}
          icon={PieChartIcon}
          status="neutral"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue by Plan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenue as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.plan_name}: $${entry.total_monthly_revenue.toFixed(0)}`} // eslint-disable-line @typescript-eslint/no-explicit-any
                outerRadius={100}
                fill="#8884d8"
                dataKey="total_monthly_revenue"
              >
                {revenue.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Trend */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Cost Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={recentCosts}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="cost" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Plan Details Table */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Plan Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm font-medium text-white/60 pb-3">Plan Name</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3">Subscribers</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3">Active</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3">MRR</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3">Avg LTV</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3">Auto-Renew %</th>
              </tr>
            </thead>
            <tbody>
              {revenue.map((plan) => (
                <tr key={plan.plan_name} className="border-b border-white/5">
                  <td className="py-3 text-sm text-white font-medium">{plan.plan_name}</td>
                  <td className="py-3 text-sm text-white/80 text-right">{plan.total_subscribers}</td>
                  <td className="py-3 text-sm text-emerald-400 text-right">{plan.active_subscribers}</td>
                  <td className="py-3 text-sm text-white text-right">${plan.total_monthly_revenue.toFixed(2)}</td>
                  <td className="py-3 text-sm text-white/80 text-right">${plan.avg_lifetime_value.toFixed(2)}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      plan.auto_renew_pct > 80 ? 'bg-emerald-500/10 text-emerald-400' :
                      plan.auto_renew_pct > 50 ? 'bg-blue-500/10 text-blue-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {plan.auto_renew_pct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-sm font-medium text-white/60 mb-3">Monthly Revenue</h4>
          <p className="text-3xl font-bold text-white mb-1">${totalMRR.toFixed(2)}</p>
          <p className="text-xs text-white/40">All active plans</p>
        </div>
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-sm font-medium text-white/60 mb-3">Avg Cost Per Day</h4>
          <p className="text-3xl font-bold text-white mb-1">
            ${(recentCosts.reduce((sum, d) => sum + d.cost, 0) / recentCosts.length).toFixed(2)}
          </p>
          <p className="text-xs text-white/40">Last 30 days</p>
        </div>
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-sm font-medium text-white/60 mb-3">Projected Monthly Margin</h4>
          <p className="text-3xl font-bold text-emerald-400 mb-1">
            ${(totalMRR - (recentCosts.reduce((sum, d) => sum + d.cost, 0) / recentCosts.length) * 30).toFixed(2)}
          </p>
          <p className="text-xs text-white/40">Revenue - Est. Costs</p>
        </div>
      </div>
    </div>
  );
}
