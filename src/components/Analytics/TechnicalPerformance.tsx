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
        <div className="terminal-panel p-8">
          <div className="terminal-loader">
            <div className="terminal-loader__spinner">|</div>
            <span>Loading technical metrics...</span>
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
      <div className="terminal-panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold terminal-text-glow terminal-uppercase mb-2" style={{color: '#33ff33'}}>Technical Performance</h2>
            <p className="text-[#7a7a7a]">Provider metrics and system reliability • Last 30 days</p>
          </div>
          <FilterControls
            showProvider
            provider={provider}
            onProviderChange={setProvider}
          />
        </div>
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
        <div className="terminal-panel p-6 lg:col-span-2">
          <h3 className="terminal-panel__title mb-4">Latency Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={latencyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,255,51,0.15)" />
              <XAxis 
                dataKey="date" 
                stroke="#33ff33"
                tick={{ fill: '#7a7a7a', fontSize: 12 }}
              />
              <YAxis 
                stroke="#33ff33"
                tick={{ fill: '#7a7a7a', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #33ff33',
                  borderRadius: '0px',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#c0c0c0' }}
              />
              <Legend />
              <Line type="monotone" dataKey="avg" stroke="#33ff33" strokeWidth={2} name="Avg Latency (ms)" />
              <Line type="monotone" dataKey="p95" stroke="#ffff00" strokeWidth={2} name="P95 Latency (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Provider Comparison - Success Rate */}
        <div className="terminal-panel p-6">
          <h3 className="terminal-panel__title mb-4">Provider Success Rates</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={providers.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#33ff33" />
              <XAxis type="number" stroke="#33ff33" tick={{ fill: '#7a7a7a', fontSize: 12 }} />
              <YAxis 
                dataKey="provider" 
                type="category" 
                stroke="#33ff33"
                tick={{ fill: '#7a7a7a', fontSize: 12 }}
                width={100}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #33ff33',
                  borderRadius: '0px',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#c0c0c0' }}
              />
              <Bar dataKey="success_rate_pct" fill="#00ff00" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Provider Comparison - Latency */}
        <div className="terminal-panel p-6">
          <h3 className="terminal-panel__title mb-4">Provider Latencies</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={providers.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#33ff33" />
              <XAxis type="number" stroke="#33ff33" tick={{ fill: '#7a7a7a', fontSize: 12 }} />
              <YAxis 
                dataKey="provider" 
                type="category" 
                stroke="#33ff33"
                tick={{ fill: '#7a7a7a', fontSize: 12 }}
                width={100}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #33ff33',
                  borderRadius: '0px',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#c0c0c0' }}
              />
              <Bar dataKey="avg_success_latency_ms" fill="#33ff33" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Provider Performance Table */}
      <div className="terminal-panel p-6">
        <h3 className="terminal-panel__title mb-4">Provider Performance Details</h3>
        <div className="overflow-x-auto">
          <table className="terminal-table">
            <thead>
              <tr>
                <th className="text-left">Provider</th>
                <th className="text-left">Service</th>
                <th className="text-right terminal-panel__title pb-3">Requests</th>
                <th className="text-right terminal-panel__title pb-3">Success Rate</th>
                <th className="text-right terminal-panel__title pb-3">Avg Latency</th>
                <th className="text-right terminal-panel__title pb-3">Total Cost</th>
                <th className="text-right terminal-panel__title pb-3">Cost/Req</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider, idx) => (
                <tr key={`${provider.provider}-${provider.service_type}-${idx}`}>
                  <td className="py-3 text-sm font-medium terminal-text">{provider.provider}</td>
                  <td className="py-3 text-sm terminal-text-muted">{provider.service_type}</td>
                  <td className="py-3 text-sm terminal-text text-right">{(provider.total_requests || 0).toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <span className={`terminal-badge ${
                      (provider.success_rate_pct || 0) > 99 ? 'terminal-badge--active' :
                      (provider.success_rate_pct || 0) > 95 ? '' :
                      'terminal-badge--alert'
                    }`}>
                      {(provider.success_rate_pct || 0).toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 text-sm terminal-text text-right">
                    {provider.avg_success_latency_ms?.toFixed(0) || 0}ms
                  </td>
                  <td className="py-3 text-sm terminal-text text-right">${(provider.total_cost || 0).toFixed(2)}</td>
                  <td className="py-3 text-sm terminal-text-muted text-right">${(provider.avg_cost_per_request || 0).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="terminal-card p-6">
          <h4 className="terminal-panel__title mb-3">Best Success Rate</h4>
          <p className="text-3xl font-bold terminal-metric--success mb-1">
            {providers.length > 0 ? Math.max(...providers.map(p => p.success_rate_pct || 0)).toFixed(2) : '0.00'}%
          </p>
          <p className="text-xs terminal-text-muted">Top performing provider</p>
        </div>
        <div className="terminal-card p-6">
          <h4 className="terminal-panel__title mb-3">Fastest Provider</h4>
          <p className="text-3xl font-bold terminal-metric mb-1">
            {Math.min(...providers.map(p => p.avg_success_latency_ms || Infinity)).toFixed(0)}ms
          </p>
          <p className="text-xs terminal-text-muted">Lowest average latency</p>
        </div>
        <div className="terminal-card p-6">
          <h4 className="terminal-panel__title mb-3">Most Cost Efficient</h4>
          <p className="text-3xl font-bold terminal-metric mb-1">
            ${providers.length > 0 ? Math.min(...providers.map(p => p.avg_cost_per_request || Infinity)).toFixed(4) : '0.0000'}
          </p>
          <p className="text-xs terminal-text-muted">Lowest cost per request</p>
        </div>
      </div>
    </div>
  );
}
