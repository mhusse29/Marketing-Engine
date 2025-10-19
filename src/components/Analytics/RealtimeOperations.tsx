import { KPICard } from './KPICard';
import { FilterControls } from './FilterControls';
import { useHealthScore, useRealtimeApiUsage } from '../../hooks/useAnalytics';
import { PanelHeader, ErrorState } from './AnalyticsMetadataBadge';
import { Activity, Zap, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export function RealtimeOperations() {
  const [serviceType, setServiceType] = useState('all');
  const [status, setStatus] = useState('all');
  const { healthScore, loading: healthLoading, error: healthError } = useHealthScore(60);
  const { apiUsage, loading: usageLoading, metadata: usageMetadata, error: usageError } = useRealtimeApiUsage(50);

  if (healthLoading || usageLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white/80" />
            <span className="text-white/70">Loading real-time data...</span>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    // Fix: Check for both 'error' and 'failed' statuses
    return status === 'success' ? 'text-emerald-400' : 
           (status === 'error' || status === 'failed') ? 'text-red-400' : 
           'text-amber-400';
  };

  // Fix HIGH: Actually filter the data based on selected filters
  const filteredApiUsage = apiUsage.filter(request => {
    const serviceMatch = serviceType === 'all' || request.service_type === serviceType;
    const statusMatch = status === 'all' || request.status === status;
    return serviceMatch && statusMatch;
  });

  // Show error state if critical data fails to load
  if (healthError && usageError) {
    return <ErrorState error={healthError || usageError} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Metadata */}
      <PanelHeader
        title="Real-time Operations"
        description="Live API requests and system health"
        metadata={usageMetadata}
        error={usageError}
        icon={<Activity className="w-6 h-6" />}
        actions={
          <FilterControls
            showServiceType
            serviceType={serviceType}
            onServiceTypeChange={setServiceType}
            showStatus
            status={status}
            onStatusChange={setStatus}
          />
        }
      />

      {/* Real-Time KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Health Score"
          value={healthScore?.health_score?.toFixed(1) || '0'}
          icon={Zap}
          status={Number(healthScore?.health_score) > 80 ? 'good' : Number(healthScore?.health_score) > 50 ? 'warning' : 'critical'}
          subtitle="Last hour"
        />
        <KPICard
          title="Uptime"
          value={`${healthScore?.uptime_pct?.toFixed(2) || 0}%`}
          icon={Activity}
          status={Number(healthScore?.uptime_pct) > 99 ? 'good' : 'warning'}
          subtitle={`${healthScore?.total_requests || 0} requests`}
        />
        <KPICard
          title="Avg Latency"
          value={`${healthScore?.avg_latency_ms?.toFixed(0) || 0}ms`}
          icon={Clock}
          status={Number(healthScore?.avg_latency_ms) < 2000 ? 'good' : 'warning'}
          subtitle="Average response time"
        />
        <KPICard
          title="P95 Latency"
          value={`${healthScore?.p95_latency_ms?.toFixed(0) || 0}ms`}
          icon={AlertTriangle}
          status={Number(healthScore?.p95_latency_ms) < 5000 ? 'good' : 'warning'}
          subtitle="95th percentile"
        />
      </div>

      {/* Live API Requests Stream */}
      <div className="glass-card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Requests</h3>
          <span className="text-sm text-white/50">{filteredApiUsage.length} of {apiUsage.length} requests</span>
        </div>
        
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredApiUsage.map((request, idx) => (
            <div
              key={request.id}
              className="backdrop-blur-sm bg-white/[0.02] border border-white/5 rounded-lg p-4 hover:bg-white/[0.04] transition-all animate-fade-in"
              style={{ animationDelay: `${idx * 20}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    request.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 
                    (request.status === 'error' || request.status === 'failed') ? 'bg-red-500/10 text-red-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {request.status === 'success' ? '✓' : request.status === 'failed' || request.status === 'error' ? '✗' : '⚠'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm">{request.service_type}</span>
                      <span className="text-xs text-white/40">•</span>
                      <span className="text-xs text-white/60">{request.provider}</span>
                      <span className="text-xs text-white/40">•</span>
                      <span className="text-xs text-white/60 truncate">{request.model}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span>{request.created_at ? new Date(request.created_at).toLocaleTimeString() : 'N/A'}</span>
                      <span>•</span>
                      <span>{request.latency_ms}ms</span>
                      <span>•</span>
                      <span>${Number(request.total_cost).toFixed(4)}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                  {request.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-sm font-medium text-white/60 mb-3">Request Rate</h4>
          <p className="text-3xl font-bold text-white mb-1">{((healthScore?.total_requests || 0) / 60).toFixed(1)}</p>
          <p className="text-xs text-white/40">requests per minute</p>
        </div>
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-sm font-medium text-white/60 mb-3">Error Rate</h4>
          <p className="text-3xl font-bold text-white mb-1">{(100 - Number(healthScore?.uptime_pct || 100)).toFixed(2)}%</p>
          <p className="text-xs text-white/40">Failed requests</p>
        </div>
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-sm font-medium text-white/60 mb-3">Active Users</h4>
          <p className="text-3xl font-bold text-white mb-1">{new Set(apiUsage.map(r => r.user_id)).size}</p>
          <p className="text-xs text-white/40">In last hour</p>
        </div>
      </div>
    </div>
  );
}
