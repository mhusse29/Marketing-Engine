import { KPICard } from './KPICard';
import { FilterControls } from './FilterControls';
import { useHealthScore, useDailyMetrics, useExecutiveSummary } from '../../hooks/useAnalytics';
import { TrendingUp, Users, DollarSign, Activity, Zap, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState } from 'react';

export function ExecutiveOverview() {
  const [dateRange, setDateRange] = useState(30);
  const { loading: scoreLoading } = useHealthScore();
  const { metrics, loading: metricsLoading } = useDailyMetrics(dateRange);
  const { summary, loading: summaryLoading } = useExecutiveSummary();

  if (summaryLoading || metricsLoading || scoreLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="glass-card p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white/80" />
            <span className="text-white/70">Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  const chartData = metrics?.slice().reverse().map((m) => ({
    date: m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
    users: m.daily_active_users,
    requests: m.total_requests,
    cost: Number(m.total_cost || 0), // Fix MEDIUM: Keep as number for proper charting
    successRate: m.success_rate_pct,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="glass-card p-6">
        <h2 className="text-3xl font-bold gradient-text-violet mb-2">Executive Overview</h2>
        <p className="text-white/60">High-level performance metrics and insights • Real-time updates</p>
      </div>
      <FilterControls
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="Active Users Today"
          value={summary?.active_users_today ?? 0}
          icon={Users}
          status="good"
          subtitle={`${summary?.total_users ?? 0} total users`}
        />
        <KPICard
          title="Success Rate"
          value={`${summary?.success_rate ?? 0}%`}
          icon={Activity}
          status={(summary?.success_rate ?? 0) > 99 ? 'good' : (summary?.success_rate ?? 0) > 95 ? 'warning' : 'critical'}
          subtitle={`${summary?.total_requests_today ?? 0} requests today`}
        />
        <KPICard
          title="Health Score"
          value={summary?.health_score ?? 0}
          icon={Zap}
          status={(summary?.health_score ?? 0) > 80 ? 'good' : (summary?.health_score ?? 0) > 50 ? 'warning' : 'critical'}
          subtitle="System health composite"
        />
        <KPICard
          title="Cost Today"
          value={`$${Number(summary?.total_cost_today ?? 0).toFixed(2)}`}
          icon={DollarSign}
          status="neutral"
          subtitle="API usage cost"
        />
        <KPICard
          title="Avg Latency"
          value={`${Math.round(summary?.avg_latency_ms ?? 0)}ms`}
          icon={TrendingUp}
          status={(summary?.avg_latency_ms ?? 0) < 1000 ? 'good' : (summary?.avg_latency_ms ?? 0) < 2000 ? 'warning' : 'critical'}
          subtitle="Average response time"
        />
        <KPICard
          title="Active Alerts"
          value={0}
          icon={AlertCircle}
          status="good"
          subtitle="No critical issues"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Active Users Trend */}
        <div className="glass-card-elevated p-6 hover-lift">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Active Users (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
                  backdropFilter: 'blur(12px)'
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorUsers)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Trend */}
        <div className="glass-card-elevated p-6 hover-lift">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Cost (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
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
                  backdropFilter: 'blur(12px)'
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="cost" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Success Rate Trend */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Success Rate & Request Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(12px)'
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend 
                wrapperStyle={{ color: '#fff' }}
                iconType="circle"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="successRate" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                name="Success Rate (%)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="requests" 
                stroke="#06b6d4" 
                strokeWidth={2}
                dot={{ fill: '#06b6d4', r: 4 }}
                name="Total Requests"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Today's Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-white/60 mb-1">Total Requests</p>
            <p className="text-2xl font-bold text-white">{summary?.total_requests_today?.toLocaleString() ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-white/60 mb-1">Avg Latency</p>
            <p className="text-2xl font-bold text-white">{summary?.avg_latency_ms || 0}ms</p>
          </div>
          <div>
            <p className="text-sm text-white/60 mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-white">{summary?.success_rate ?? 0}%</p>
          </div>
          <div>
            <p className="text-sm text-white/60 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-white">{summary?.total_users ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
