import { KPICard } from './KPICard';
import { FilterControls } from './FilterControls';
import { useModelUsage } from '../../hooks/useAnalytics';
import { Cpu, TrendingUp, Zap, DollarSign, Clock, CheckCircle2, Image, Video } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState, useMemo } from 'react';

export function ModelUsage() {
  const [dateRange, setDateRange] = useState(30);
  const [provider, setProvider] = useState('all');
  const [sortBy, setSortBy] = useState('calls');
  const { models, loading: modelsLoading } = useModelUsage(dateRange);
  const [selectedServiceType, setSelectedServiceType] = useState<string>('all');

  // Fix MEDIUM: Memoize filtering and sorting to prevent re-computation on every render
  // MUST be before conditional return to satisfy rules-of-hooks
  const filteredModels = useMemo(() => {
    // Filter by service type and provider
    let filtered = selectedServiceType === 'all' 
      ? models 
      : models.filter(m => m.service_type === selectedServiceType);
    
    if (provider !== 'all') {
      filtered = filtered.filter(m => m.provider.toLowerCase() === provider);
    }

    // Sort based on selected criteria
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'cost':
          return b.total_cost - a.total_cost;
        case 'latency':
          return a.avg_latency_ms - b.avg_latency_ms;
        case 'success':
          return b.success_rate - a.success_rate;
        case 'calls':
        default:
          return b.total_calls - a.total_calls;
      }
    });
  }, [models, selectedServiceType, provider, sortBy]);

  // All computed values that don't use hooks
  const totalCalls = models.reduce((sum, m) => sum + m.total_calls, 0);
  const totalCost = models.reduce((sum, m) => sum + m.total_cost, 0);
  const avgSuccessRate = models.reduce((sum, m) => sum + m.success_rate, 0) / (models.length || 1);
  const totalTokens = models.reduce((sum, m) => sum + m.total_tokens, 0);
  const totalImages = models.reduce((sum, m) => sum + m.images_generated, 0);
  const totalVideoSeconds = models.reduce((sum, m) => sum + m.video_seconds, 0);

  // Service type breakdown
  const serviceTypes = ['all', ...new Set(models.map(m => m.service_type))];
  
  // Top models by usage (filteredModels is already sorted by total_calls descending)
  const topModels = filteredModels.slice(0, 5);

  // Early return AFTER all hooks and computed values
  if (modelsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="terminal-panel p-8">
          <div className="terminal-loader">
            <div className="terminal-loader__spinner">|</div>
            <span>Loading model usage data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Cost breakdown by model
  const costData = topModels.map(m => ({
    name: m.model,
    cost: Number(Number(m.total_cost || 0).toFixed(2)),
    calls: m.total_calls || 0,
  }));

  // Token usage breakdown
  const tokenData = topModels.map(m => ({
    name: m.model,
    input: m.input_tokens || 0,
    output: m.output_tokens || 0,
  }));

  // Success rate comparison
  const successRateData = topModels.map(m => ({
    name: m.model,
    successRate: Number(Number(m.success_rate || 0).toFixed(2)),
    failedCalls: m.failed_calls || 0,
  }));

  // Service type distribution
  const serviceTypeDistribution = models.reduce((acc: Record<string, number>, m) => {
    acc[m.service_type] = (acc[m.service_type] || 0) + m.total_calls;
    return acc;
  }, {} as Record<string, number>);

  const serviceTypePieData = Object.entries(serviceTypeDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#33ff33', '#00ff00', '#66ff66', '#99ff99', '#ccffcc', '#33ff33'];

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="terminal-panel p-6 mb-6">
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-3xl font-bold terminal-text-glow terminal-uppercase mb-2" style={{color: '#33ff33'}}>Model API Usage</h2>
            <p className="terminal-text-muted">Detailed usage metrics for each AI model</p>
          </div>
        
        <div className="flex flex-col gap-3">
          {/* Primary Filters */}
          <FilterControls
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            showProvider
            provider={provider}
            onProviderChange={setProvider}
            showSortBy
            sortBy={sortBy}
            onSortByChange={setSortBy}
          />
          
          {/* Service Type Filter */}
          <div className="flex items-center gap-2 justify-end">
            {serviceTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedServiceType(type)}
                className={`terminal-filter__chip capitalize ${
                  selectedServiceType === type ? 'terminal-filter__chip--active' : ''
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Models"
          value={filteredModels.length}
          icon={Cpu}
          status="neutral"
          subtitle={`${models.length} total across all services`}
        />
        <KPICard
          title="Total API Calls"
          value={totalCalls.toLocaleString()}
          icon={TrendingUp}
          status="good"
          subtitle="Last 30 days"
        />
        <KPICard
          title="Total Cost"
          value={`$${Number(totalCost ?? 0).toFixed(2)}`}
          icon={DollarSign}
          status="neutral"
          subtitle={totalCalls > 0 ? `$${(Number(totalCost ?? 0) / totalCalls).toFixed(4)} per call` : '$0.0000 per call'}
        />
        <KPICard
          title="Avg Success Rate"
          value={`${Number(avgSuccessRate ?? 0).toFixed(1)}%`}
          icon={CheckCircle2}
          status={avgSuccessRate > 95 ? 'good' : avgSuccessRate > 90 ? 'warning' : 'critical'}
          subtitle="Across all models"
        />
      </div>

      {/* Additional Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="terminal-card">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-[#33ff33]" />
              <h4 className="terminal-panel__title">Total Tokens</h4>
            </div>
            <p className="text-2xl font-bold terminal-metric">{totalTokens.toLocaleString()}</p>
            <p className="text-xs terminal-text-muted mt-1">Input + Output tokens</p>
          </div>
        </div>

        <div className="terminal-card">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Image className="w-5 h-5 text-[#33ff33]" />
              <h4 className="terminal-panel__title">Images Generated</h4>
            </div>
            <p className="text-2xl font-bold terminal-metric terminal-metric--success">{totalImages.toLocaleString()}</p>
            <p className="text-xs terminal-text-muted mt-1">Total image outputs</p>
          </div>
        </div>

        <div className="terminal-card">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Video className="w-5 h-5 text-[#33ff33]" />
              <h4 className="terminal-panel__title">Video Seconds</h4>
            </div>
            <p className="text-2xl font-bold terminal-metric terminal-metric--alert">{totalVideoSeconds.toLocaleString()}</p>
            <p className="text-xs terminal-text-muted mt-1">Total video duration</p>
          </div>
        </div>

        <div className="terminal-card">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-[#33ff33]" />
              <h4 className="terminal-panel__title">Avg Latency</h4>
            </div>
            <p className="text-2xl font-bold terminal-metric terminal-metric--warning">
              {filteredModels.length > 0
                ? Math.round(filteredModels.reduce((sum, m) => sum + m.avg_latency_ms, 0) / filteredModels.length)
                : 0}ms
            </p>
            <p className="text-xs terminal-text-muted mt-1">Across all models</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Model */}
        <div className="terminal-panel p-6">
          <h3 className="terminal-panel__title mb-4">Cost by Model (Top 10)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,255,51,0.15)" />
              <XAxis type="number" stroke="#33ff33" tick={{ fill: '#7a7a7a', fontSize: 12, fontFamily: 'monospace' }} />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#33ff33"
                tick={{ fill: '#7a7a7a', fontSize: 10, fontFamily: 'monospace' }}
                width={120}
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
              <Bar dataKey="cost" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service Type Distribution */}
        <div className="terminal-panel p-6">
          <h3 className="terminal-panel__title mb-4">Service Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceTypePieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: ${entry.value}`} // eslint-disable-line @typescript-eslint/no-explicit-any
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {serviceTypePieData.map((_entry, index) => (
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

        {/* Token Usage Breakdown */}
        <div className="terminal-panel p-6 lg:col-span-2">
          <h3 className="terminal-panel__title mb-4">Token Usage by Model</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tokenData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,255,51,0.15)" />
              <XAxis 
                dataKey="name" 
                stroke="#33ff33"
                tick={{ fill: '#7a7a7a', fontSize: 12, fontFamily: 'monospace' }}
                angle={-45}
                textAnchor="end"
                height={100}
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
              <Legend />
              <Bar dataKey="input" stackId="a" fill="#33ff33" name="Input Tokens" />
              <Bar dataKey="output" stackId="a" fill="#00ff00" name="Output Tokens" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Success Rate Comparison */}
        <div className="terminal-panel p-6 lg:col-span-2">
          <h3 className="terminal-panel__title mb-4">Success Rate by Model</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={successRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,255,51,0.15)" />
              <XAxis 
                dataKey="name" 
                stroke="#33ff33"
                tick={{ fill: '#7a7a7a', fontSize: 12, fontFamily: 'monospace' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis 
                stroke="#33ff33"
                tick={{ fill: '#7a7a7a', fontSize: 12, fontFamily: 'monospace' }}
                domain={[0, 100]}
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
              <Bar dataKey="successRate" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Model Usage Table */}
      <div className="terminal-panel p-6">
        <h3 className="terminal-panel__title mb-4">Detailed Model Metrics</h3>
        <div className="overflow-x-auto terminal-scroll">
          <table className="terminal-table">
            <thead>
              <tr>
                <th className="text-left pr-4">Model</th>
                <th className="text-left pr-4">Provider</th>
                <th className="text-left pr-4">Service</th>
                <th className="text-right terminal-panel__title pb-3 pr-4">Calls</th>
                <th className="text-right terminal-panel__title pb-3 pr-4">Success Rate</th>
                <th className="text-right terminal-panel__title pb-3 pr-4">Tokens</th>
                <th className="text-right terminal-panel__title pb-3 pr-4">Cost</th>
                <th className="text-right terminal-panel__title pb-3 pr-4">Avg Latency</th>
                <th className="text-right terminal-panel__title pb-3">Last Used</th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.map((model, idx) => (
                <tr key={`${model.model}-${model.provider}-${idx}`} className="">
                  <td className="py-3 pr-4 text-sm terminal-text font-medium">{model.model}</td>
                  <td className="py-3 pr-4 text-sm terminal-text-muted">{model.provider}</td>
                  <td className="py-3 pr-4">
                    <span className={`terminal-badge ${
                      model.service_type === 'content' ? '' :
                      model.service_type === 'images' ? 'terminal-badge--warning' :
                      'terminal-badge--alert'
                    }`}>
                      {model.service_type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-sm terminal-text text-right">{model.total_calls.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      model.success_rate > 95 ? 'bg-emerald-500/10 text-[#33ff33]' :
                      model.success_rate > 90 ? 'bg-amber-500/10 text-[#ffff33]' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {Number(model.success_rate ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-sm terminal-text-muted text-right">
                    {(Number(model.total_tokens ?? 0) / 1000).toFixed(1)}K
                  </td>
                  <td className="py-3 pr-4 text-sm terminal-text text-right">
                    ${Number(model.total_cost ?? 0).toFixed(4)}
                    <div className="text-xs terminal-text-muted">${Number(model.avg_cost_per_call ?? 0).toFixed(6)}/call</div>
                  </td>
                  <td className="py-3 pr-4 text-sm terminal-text-muted text-right">
                    {Number(model.avg_latency_ms ?? 0).toFixed(0)}ms
                  </td>
                  <td className="py-3 text-sm terminal-text-muted text-right">
                    {new Date(model.last_used).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="terminal-panel p-6">
          <h4 className="terminal-panel__title mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#33ff33]" />
            Most Used Model
          </h4>
          <p className="text-xl font-bold terminal-metric mb-1">{topModels[0]?.model || 'N/A'}</p>
          <p className="text-xs terminal-text-muted">{topModels[0]?.total_calls.toLocaleString() || 0} calls</p>
        </div>

        <div className="terminal-panel p-6">
          <h4 className="terminal-panel__title mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#33ff33]" />
            Most Expensive Model
          </h4>
          <p className="text-xl font-bold terminal-metric mb-1">
            {[...filteredModels].sort((a, b) => b.total_cost - a.total_cost)[0]?.model || 'N/A'}
          </p>
          <p className="text-xs terminal-text-muted">
            ${Number([...filteredModels].sort((a, b) => b.total_cost - a.total_cost)[0]?.total_cost ?? 0).toFixed(2)}
          </p>
        </div>

        <div className="terminal-panel p-6">
          <h4 className="terminal-panel__title mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#33ff33]" />
            Fastest Model
          </h4>
          <p className="text-xl font-bold terminal-metric mb-1">
            {[...filteredModels].sort((a, b) => a.avg_latency_ms - b.avg_latency_ms)[0]?.model || 'N/A'}
          </p>
          <p className="text-xs terminal-text-muted">
            {Number([...filteredModels].sort((a, b) => a.avg_latency_ms - b.avg_latency_ms)[0]?.avg_latency_ms ?? 0).toFixed(0)}ms
          </p>
        </div>
      </div>
    </div>
  );
}
