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
        <div className="terminal-panel p-8">
          <div className="terminal-loader">
            <div className="terminal-loader__spinner">|</div>
            <span>Loading real-time data...</span>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="terminal-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="terminal-panel__title">Recent Requests</h3>
          <span className="text-sm terminal-text-muted">{filteredApiUsage.length} of {apiUsage.length} requests</span>
        </div>
        
        <div className="terminal-stream terminal-scroll">
          {filteredApiUsage.map((request, idx) => (
            <div
              key={request.id}
              className={`terminal-stream__item ${request.status === 'success' ? 'terminal-stream__item--success' : (request.status === 'error' || request.status === 'failed') ? 'terminal-stream__item--error' : ''}`}
              style={{ animationDelay: `${idx * 20}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg border ${
                    request.status === 'success' ? 'bg-[#33ff33]/10 text-[#33ff33] border-[#33ff33]/30' : 
                    (request.status === 'error' || request.status === 'failed') ? 'bg-[#ff3333]/10 text-[#ff3333] border-[#ff3333]/30' :
                    'bg-[#ffff33]/10 text-[#ffff33] border-[#ffff33]/30'
                  }`}>
                    {request.status === 'success' ? '✓' : request.status === 'failed' || request.status === 'error' ? '✗' : '⚠'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium terminal-text text-sm terminal-uppercase">{request.service_type}</span>
                      <span className="text-xs terminal-text-muted">•</span>
                      <span className="text-xs text-[#33ff33]">{request.provider}</span>
                      <span className="text-xs terminal-text-muted">•</span>
                      <span className="text-xs terminal-text-muted truncate">{request.model}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs terminal-text-muted">
                      <span>{request.created_at ? new Date(request.created_at).toLocaleTimeString() : 'N/A'}</span>
                      <span>•</span>
                      <span>{request.latency_ms}ms</span>
                      <span>•</span>
                      <span>${Number(request.total_cost).toFixed(4)}</span>
                    </div>
                  </div>
                </div>
                <span className={`terminal-badge ${request.status === 'success' ? 'terminal-badge--active' : (request.status === 'error' || request.status === 'failed') ? 'terminal-badge--alert' : 'terminal-badge--warning'}`}>
                  {request.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="terminal-card">
          <div className="relative z-10">
            <h4 className="terminal-panel__title mb-3">Request Rate</h4>
            <p className="text-3xl font-bold terminal-metric">{((healthScore?.total_requests || 0) / 60).toFixed(1)}</p>
            <p className="text-xs terminal-text-muted">requests per minute</p>
          </div>
        </div>
        <div className="terminal-card">
          <div className="relative z-10">
            <h4 className="terminal-panel__title mb-3">Error Rate</h4>
            <p className="text-3xl font-bold terminal-metric terminal-metric--alert">{(100 - Number(healthScore?.uptime_pct || 100)).toFixed(2)}%</p>
            <p className="text-xs terminal-text-muted">Failed requests</p>
          </div>
        </div>
        <div className="terminal-card">
          <div className="relative z-10">
            <h4 className="terminal-panel__title mb-3">Active Users</h4>
            <p className="text-3xl font-bold terminal-metric terminal-metric--success">{new Set(apiUsage.map(r => r.user_id)).size}</p>
            <p className="text-xs terminal-text-muted">In last hour</p>
          </div>
        </div>
      </div>
    </div>
  );
}
