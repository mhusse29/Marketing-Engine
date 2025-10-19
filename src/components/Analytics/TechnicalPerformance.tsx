import { KPICard } from './KPICard';
import { FilterControls } from './FilterControls';
import { useProviderPerformance, useDailyMetrics } from '../../hooks/useAnalytics';
import { Gauge, Zap, Server, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { useState } from 'react';

export function TechnicalPerformance() {
  const [provider, setProvider] = useState('all');
  // Note: Removed unused dateRange - data comes from last 30 days via materialized view
  const { providers, loading: providersLoading } = useProviderPerformance();
  const { metrics, loading: metricsLoading } = useDailyMetrics(30);

  if (providersLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white/80" />
            <span className="text-white/70">Loading technical metrics...</span>
          </div>
        </div>
      </div>
    );
  }

  // Filter providers based on selection
  const filteredProviders = provider === 'all' 
    ? providers 
    : providers.filter(p => p.provider?.toLowerCase() === provider);

  // Aggregate metrics from filtered providers
  const totalRequests = filteredProviders.reduce((sum, p) => sum + (p.total_requests || 0), 0);
  const avgSuccessRate = filteredProviders.reduce((sum, p) => sum + (p.success_rate_pct || 0), 0) / (filteredProviders.length || 1);
  const avgLatency = filteredProviders.reduce((sum, p) => sum + (p.avg_success_latency_ms || 0), 0) / (filteredProviders.length || 1);
  const latencyTrend = metrics.slice(0, 30).reverse().map(m => ({
    date: m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
    avg: m.avg_latency_ms || 0,
    p95: m.p95_latency_ms || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Technical Performance</h2>
          <p className="text-white/60">Provider metrics and system reliability • Last 30 days</p>
        </div>
        <FilterControls
          showProvider
          provider={provider}
          onProviderChange={setProvider}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Avg Success Rate"
          value={`${avgSuccessRate.toFixed(2)}%`}
          icon={Activity}
          status={avgSuccessRate > 99 ? 'good' : avgSuccessRate > 95 ? 'warning' : 'critical'}
          subtitle="Across all providers"
        />
        <KPICard
          title="Avg Latency"
          value={`${avgLatency.toFixed(0)}ms`}
          icon={Zap}
          status={avgLatency < 2000 ? 'good' : avgLatency < 5000 ? 'warning' : 'critical'}
          subtitle="Average response time"
        />
        <KPICard
          title="Total Requests"
          value={totalRequests.toLocaleString()}
          icon={Server}
          status="neutral"
          subtitle="Last 7 days"
        />
        <KPICard
          title="Active Providers"
          value={providers.length}
          icon={Gauge}
          status="good"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Trend */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Latency Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={latencyTrend}>
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
              <Legend />
              <Line type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} name="Avg Latency (ms)" />
              <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} name="P95 Latency (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Provider Comparison - Success Rate */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Provider Success Rates</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={providers.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <YAxis 
                dataKey="provider" 
                type="category" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                width={100}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="success_rate_pct" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Provider Comparison - Latency */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Provider Latencies</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={providers.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <YAxis 
                dataKey="provider" 
                type="category" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                width={100}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="avg_success_latency_ms" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Provider Performance Table */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Provider Performance Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm font-medium text-white/60 pb-3">Provider</th>
                <th className="text-left text-sm font-medium text-white/60 pb-3">Service</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3">Requests</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3">Success Rate</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3">Avg Latency</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3">Total Cost</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3">Cost/Req</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider, idx) => (
                <tr key={`${provider.provider}-${provider.service_type}-${idx}`} className="border-b border-white/5">
                  <td className="py-3 text-sm text-white font-medium">{provider.provider}</td>
                  <td className="py-3 text-sm text-white/80">{provider.service_type}</td>
                  <td className="py-3 text-sm text-white text-right">{(provider.total_requests || 0).toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      (provider.success_rate_pct || 0) > 99 ? 'bg-emerald-500/10 text-emerald-400' :
                      (provider.success_rate_pct || 0) > 95 ? 'bg-blue-500/10 text-blue-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {(provider.success_rate_pct || 0).toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 text-sm text-white text-right">
                    {provider.avg_success_latency_ms?.toFixed(0) || 0}ms
                  </td>
                  <td className="py-3 text-sm text-white text-right">${(provider.total_cost || 0).toFixed(2)}</td>
                  <td className="py-3 text-sm text-white/80 text-right">${(provider.avg_cost_per_request || 0).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-sm font-medium text-white/60 mb-3">Best Success Rate</h4>
          <p className="text-3xl font-bold text-emerald-400 mb-1">
            {providers.length > 0 ? Math.max(...providers.map(p => p.success_rate_pct || 0)).toFixed(2) : '0.00'}%
          </p>
          <p className="text-xs text-white/40">Top performing provider</p>
        </div>
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-sm font-medium text-white/60 mb-3">Fastest Provider</h4>
          <p className="text-3xl font-bold text-blue-400 mb-1">
            {Math.min(...providers.map(p => p.avg_success_latency_ms || Infinity)).toFixed(0)}ms
          </p>
          <p className="text-xs text-white/40">Lowest average latency</p>
        </div>
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-sm font-medium text-white/60 mb-3">Most Cost Efficient</h4>
          <p className="text-3xl font-bold text-purple-400 mb-1">
            ${providers.length > 0 ? Math.min(...providers.map(p => p.avg_cost_per_request || Infinity)).toFixed(4) : '0.0000'}
          </p>
          <p className="text-xs text-white/40">Lowest cost per request</p>
        </div>
      </div>
    </div>
  );
}
