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
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white/80" />
            <span className="text-white/70">Loading model usage data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Cost breakdown by model
  const costData = topModels.map(m => ({
    name: m.model,
    cost: Number(m.total_cost.toFixed(2)),
    calls: m.total_calls,
  }));

  // Token usage breakdown
  const tokenData = topModels.map(m => ({
    name: m.model,
    input: m.input_tokens,
    output: m.output_tokens,
  }));

  // Success rate comparison
  const successRateData = topModels.map(m => ({
    name: m.model,
    successRate: Number(m.success_rate.toFixed(2)),
    failedCalls: m.failed_calls,
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

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Model API Usage</h2>
          <p className="text-white/60">Detailed usage metrics for each AI model</p>
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
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize
                  ${selectedServiceType === type
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/[0.07]'
                  }
                `}
              >
                {type}
              </button>
            ))}
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
          value={`$${totalCost.toFixed(2)}`}
          icon={DollarSign}
          status="neutral"
          subtitle={`$${(totalCost / totalCalls).toFixed(4)} per call`}
        />
        <KPICard
          title="Avg Success Rate"
          value={`${avgSuccessRate.toFixed(1)}%`}
          icon={CheckCircle2}
          status={avgSuccessRate > 95 ? 'good' : avgSuccessRate > 90 ? 'warning' : 'critical'}
          subtitle="Across all models"
        />
      </div>

      {/* Additional Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <h4 className="text-sm font-medium text-white/60">Total Tokens</h4>
          </div>
          <p className="text-2xl font-bold text-white">{(totalTokens / 1000000).toFixed(2)}M</p>
          <p className="text-xs text-white/40 mt-1">Input + Output tokens</p>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Image className="w-5 h-5 text-purple-400" />
            <h4 className="text-sm font-medium text-white/60">Images Generated</h4>
          </div>
          <p className="text-2xl font-bold text-white">{totalImages.toLocaleString()}</p>
          <p className="text-xs text-white/40 mt-1">Total image outputs</p>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Video className="w-5 h-5 text-pink-400" />
            <h4 className="text-sm font-medium text-white/60">Video Seconds</h4>
          </div>
          <p className="text-2xl font-bold text-white">{totalVideoSeconds.toFixed(0)}</p>
          <p className="text-xs text-white/40 mt-1">Total video duration</p>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-medium text-white/60">Avg Latency</h4>
          </div>
          <p className="text-2xl font-bold text-white">
            {(models.reduce((sum, m) => sum + m.avg_latency_ms, 0) / models.length).toFixed(0)}ms
          </p>
          <p className="text-xs text-white/40 mt-1">Average response time</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Model */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cost by Model (Top 10)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                width={120}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="cost" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service Type Distribution */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Service Type Distribution</h3>
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
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Token Usage by Model</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tokenData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
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
              <Bar dataKey="input" stackId="a" fill="#3b82f6" name="Input Tokens" />
              <Bar dataKey="output" stackId="a" fill="#8b5cf6" name="Output Tokens" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Success Rate Comparison */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Success Rate by Model</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={successRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="successRate" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Model Usage Table */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Detailed Model Metrics</h3>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm font-medium text-white/60 pb-3 pr-4">Model</th>
                <th className="text-left text-sm font-medium text-white/60 pb-3 pr-4">Provider</th>
                <th className="text-left text-sm font-medium text-white/60 pb-3 pr-4">Service</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3 pr-4">Calls</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3 pr-4">Success Rate</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3 pr-4">Tokens</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3 pr-4">Cost</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3 pr-4">Avg Latency</th>
                <th className="text-right text-sm font-medium text-white/60 pb-3">Last Used</th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.map((model, idx) => (
                <tr key={`${model.model}-${model.provider}-${idx}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4 text-sm text-white font-medium">{model.model}</td>
                  <td className="py-3 pr-4 text-sm text-white/80">{model.provider}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      model.service_type === 'content' ? 'bg-blue-500/10 text-blue-400' :
                      model.service_type === 'images' ? 'bg-purple-500/10 text-purple-400' :
                      'bg-pink-500/10 text-pink-400'
                    }`}>
                      {model.service_type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-sm text-white text-right">{model.total_calls.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      model.success_rate > 95 ? 'bg-emerald-500/10 text-emerald-400' :
                      model.success_rate > 90 ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {model.success_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-sm text-white/80 text-right">
                    {(model.total_tokens / 1000).toFixed(1)}K
                  </td>
                  <td className="py-3 pr-4 text-sm text-white text-right">
                    ${model.total_cost.toFixed(4)}
                    <div className="text-xs text-white/40">${model.avg_cost_per_call.toFixed(6)}/call</div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-white/80 text-right">
                    {model.avg_latency_ms.toFixed(0)}ms
                  </td>
                  <td className="py-3 text-sm text-white/60 text-right">
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
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Most Used Model
          </h4>
          <p className="text-xl font-bold text-white mb-1">{topModels[0]?.model || 'N/A'}</p>
          <p className="text-xs text-white/40">{topModels[0]?.total_calls.toLocaleString() || 0} calls</p>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            Most Expensive Model
          </h4>
          <p className="text-xl font-bold text-white mb-1">
            {[...filteredModels].sort((a, b) => b.total_cost - a.total_cost)[0]?.model || 'N/A'}
          </p>
          <p className="text-xs text-white/40">
            ${[...filteredModels].sort((a, b) => b.total_cost - a.total_cost)[0]?.total_cost.toFixed(2) || 0}
          </p>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            Fastest Model
          </h4>
          <p className="text-xl font-bold text-white mb-1">
            {[...filteredModels].sort((a, b) => a.avg_latency_ms - b.avg_latency_ms)[0]?.model || 'N/A'}
          </p>
          <p className="text-xs text-white/40">
            {[...filteredModels].sort((a, b) => a.avg_latency_ms - b.avg_latency_ms)[0]?.avg_latency_ms.toFixed(0) || 0}ms
          </p>
        </div>
      </div>
    </div>
  );
}
