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
        <div className="terminal-panel p-8">
          <div className="terminal-loader">
            <div className="terminal-loader__spinner">|</div>
            <span>Loading financial data...</span>
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

  const COLORS = ['#33ff33', '#00ff00', '#66ff66', '#99ff99', '#ccffcc'];

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="terminal-panel p-6">
        <h2 className="text-3xl font-bold terminal-text-glow terminal-uppercase mb-2" style={{color: '#33ff33'}}>Financial Analytics</h2>
        <p className="text-[#7a7a7a]">Revenue metrics and subscription analysis • Real-time data</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Monthly Recurring Revenue"
          value={`$${Number(totalMRR ?? 0).toFixed(2)}`}
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
          value={`$${Number(avgLTV ?? 0).toFixed(2)}`}
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
        <div className="terminal-panel p-6">
          <h3 className="terminal-panel__title text-lg mb-4">Revenue by Plan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenue as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.plan_name}: $${Number(entry.total_monthly_revenue ?? 0).toFixed(0)}`} // eslint-disable-line @typescript-eslint/no-explicit-any
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
                  backgroundColor: 'rgba(11,13,19,0.95)', 
                  border: '1px solid #33ff33',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#33ff33' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Trend */}
        <div className="terminal-panel p-6">
          <h3 className="terminal-panel__title text-lg mb-4">Daily Cost Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={recentCosts}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,255,51,0.15)" />
              <XAxis 
                dataKey="date" 
                stroke="#33ff33"
                tick={{ fill: '#7a7a7a', fontSize: 12, fontFamily: 'monospace' }}
              />
              <YAxis 
                stroke="#33ff33"
                tick={{ fill: '#7a7a7a', fontSize: 12, fontFamily: 'monospace' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(11,13,19,0.95)', 
                  border: '1px solid #33ff33',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#33ff33' }}
              />
              <Bar dataKey="cost" fill="#33ff33" radius={[4, 4, 0, 0]} style={{filter: 'drop-shadow(0 0 8px rgba(51,255,51,0.4))'}} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Plan Details Table */}
      <div className="terminal-panel p-6">
        <h3 className="terminal-panel__title text-lg mb-4">Plan Performance</h3>
        <div className="overflow-x-auto">
          <table className="terminal-table">
            <thead>
              <tr>
                <th className="text-left">Plan Name</th>
                <th className="text-right">Subscribers</th>
                <th className="text-right">Active</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3">MRR</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3">Avg LTV</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3">Auto-Renew %</th>
              </tr>
            </thead>
            <tbody>
              {revenue.map((plan) => (
                <tr key={plan.plan_name}>
                  <td className="py-3 text-sm font-medium">{plan.plan_name}</td>
                  <td className="py-3 text-sm text-right">{plan.total_subscribers}</td>
                  <td className="py-3 text-sm text-[#00ff00] text-right">{plan.active_subscribers}</td>
                  <td className="py-3 text-sm text-white text-right">${Number(plan.total_monthly_revenue ?? 0).toFixed(2)}</td>
                  <td className="py-3 text-sm text-white/80 text-right">${Number(plan.avg_lifetime_value ?? 0).toFixed(2)}</td>
                  <td className="py-3 text-right">
                    <span className={`terminal-badge ${
                      plan.auto_renew_pct > 80 ? 'terminal-badge--active' :
                      plan.auto_renew_pct > 50 ? '' :
                      'terminal-badge--warning'
                    }`}>
                      {Number(plan.auto_renew_pct ?? 0).toFixed(1)}%
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
        <div className="terminal-card p-6">
          <h4 className="terminal-panel__title text-sm mb-3">Monthly Revenue</h4>
          <p className="text-3xl font-bold terminal-metric mb-1">${Number(totalMRR ?? 0).toFixed(2)}</p>
          <p className="text-xs terminal-text-muted">All active plans</p>
        </div>
        <div className="terminal-card p-6">
          <h4 className="terminal-panel__title text-sm mb-3">Avg Cost Per Day</h4>
          <p className="text-3xl font-bold terminal-metric mb-1">
            ${recentCosts.length > 0 ? (recentCosts.reduce((sum, d) => sum + Number(d.cost ?? 0), 0) / recentCosts.length).toFixed(2) : '0.00'}
          </p>
          <p className="text-xs terminal-text-muted">Last 30 days</p>
        </div>
        <div className="terminal-card p-6">
          <h4 className="terminal-panel__title text-sm mb-3">Projected Monthly Margin</h4>
          <p className="text-3xl font-bold terminal-metric--success mb-1">
            ${recentCosts.length > 0 ? (Number(totalMRR ?? 0) - (recentCosts.reduce((sum, d) => sum + Number(d.cost ?? 0), 0) / recentCosts.length) * 30).toFixed(2) : Number(totalMRR ?? 0).toFixed(2)}
          </p>
          <p className="text-xs terminal-text-muted">Revenue - Est. Costs</p>
        </div>
      </div>
    </div>
  );
}
