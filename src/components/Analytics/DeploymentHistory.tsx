/**
 * Deployment History Component
 * Track deployments with incident correlation
 */

import { useState, useEffect } from 'react';
import { Package, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Deployment {
  id: string;
  version: string;
  environment: 'dev' | 'staging' | 'production';
  status: 'deploying' | 'succeeded' | 'failed' | 'rolled_back';
  deployed_by: string;
  deployed_at: string;
  deployment_duration_minutes?: number;
  incidents_after_deployment?: number;
  commit_sha?: string;
}

export function DeploymentHistory() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'production' | 'staging'>('all');

  useEffect(() => {
    fetchDeployments();

    const subscription = supabase
      .channel('deployments_history')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'deployments' 
      }, () => fetchDeployments())
      .subscribe();

    // Listen for manual refresh events
    const handleRefresh = () => fetchDeployments();
    window.addEventListener('refreshAnalytics', handleRefresh);

    return () => {
      supabase.removeChannel(subscription);
      window.removeEventListener('refreshAnalytics', handleRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchDeployments = async () => {
    try {
      let query = supabase
        .from('mv_deployment_history' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .select('*')
        .order('deployed_at', { ascending: false })
        .limit(20);

      if (filter !== 'all') {
        query = query.eq('environment', filter);
      }

      const { data, error } = await query;

      if (!error && data) {
        setDeployments(data as unknown as Deployment[]);
      }
    } catch (err) {
      console.error('Failed to fetch deployments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="terminal-panel p-8">
        <div className="terminal-loader">
          <div className="terminal-loader__spinner">|</div>
          <span>Loading deployments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-panel p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-[#33ff33]" />
          <h3 className="terminal-panel__title text-lg">Deployment History</h3>
        </div>
        
        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`terminal-filter__chip ${filter === 'all' ? 'terminal-filter__chip--active' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('production')}
            className={`terminal-filter__chip ${filter === 'production' ? 'terminal-filter__chip--active' : ''}`}
          >
            Production
          </button>
          <button
            onClick={() => setFilter('staging')}
            className={`terminal-filter__chip ${filter === 'staging' ? 'terminal-filter__chip--active' : ''}`}
          >
            Staging
          </button>
        </div>
      </div>

      {/* Deployments */}
      <div className="space-y-2">
        {deployments.map((deployment) => (
          <div
            key={deployment.id}
            className={`
              terminal-card p-3 transition-all
              ${getDeploymentStyle(deployment.status)}
            `}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: Version & Status */}
              <div className="flex items-center gap-3 flex-1">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${getStatusIconBg(deployment.status)}
                `}>
                  {getStatusIcon(deployment.status)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {deployment.version}
                    </span>
                    <span className={`
                      px-2 py-0.5 rounded text-xs font-medium
                      ${getEnvironmentBadge(deployment.environment)}
                    `}>
                      {deployment.environment}
                    </span>
                    {deployment.incidents_after_deployment && deployment.incidents_after_deployment > 0 && (
                      <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {deployment.incidents_after_deployment} incident{deployment.incidents_after_deployment > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1 text-xs terminal-text-muted">
                    <span>{new Date(deployment.deployed_at).toLocaleString()}</span>
                    <span>•</span>
                    <span>{deployment.deployed_by}</span>
                    {deployment.deployment_duration_minutes && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.round(deployment.deployment_duration_minutes)}m
                        </span>
                      </>
                    )}
                  </div>

                  {deployment.commit_sha && (
                    <div className="mt-1 font-mono text-xs terminal-text-muted">
                      {deployment.commit_sha.substring(0, 7)}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Status Badge */}
              <div className={`
                px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
                ${getStatusBadge(deployment.status)}
              `}>
                {deployment.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      {deployments.length === 0 && (
        <div className="text-center py-8 terminal-text-muted text-sm">
          No deployments found
        </div>
      )}
    </div>
  );
}

function getDeploymentStyle(status: string): string {
  switch (status) {
    case 'success': return 'border-[#00ff00]';
    case 'failed': return 'border-[#ff3333]';
    case 'rolled_back': return 'border-[#ffff00]';
    case 'deploying': return 'border-[#33ff33]';
    default: return '';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'success': return <CheckCircle2 className="w-5 h-5 text-[#00ff00]" />;
    case 'failed': return <XCircle className="w-5 h-5 text-[#ff3333]" />;
    case 'deploying': return <Clock className="w-5 h-5 text-[#33ff33] animate-spin" />;
    case 'rolled_back': return <AlertTriangle className="w-5 h-5 text-[#ffff00]" />;
    default: return <Package className="w-5 h-5 terminal-text-muted" />;
  }
}

function getStatusIconBg(status: string): string {
  switch (status) {
    case 'success': return 'bg-[#111111] border border-[#00ff00]';
    case 'failed': return 'bg-[#111111] border border-[#ff3333]';
    case 'deploying': return 'bg-[#111111] border border-[#33ff33]';
    case 'rolled_back': return 'bg-[#111111] border border-[#ffff00]';
    default: return 'bg-[#111111]';
  }
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'success': return 'terminal-badge terminal-badge--active';
    case 'failed': return 'terminal-badge terminal-badge--alert';
    case 'deploying': return 'bg-[#111111] border border-[#33ff33] text-[#33ff33]';
    case 'rolled_back': return 'terminal-badge terminal-badge--warning';
    default: return 'terminal-badge';
  }
}

function getEnvironmentBadge(env: string): string {
  switch (env) {
    case 'production': return 'bg-[#111111] border border-[#ff3333] text-[#ff3333]';
    case 'staging': return 'terminal-badge terminal-badge--warning';
    case 'dev': return 'bg-[#111111] border border-[#33ff33] text-[#33ff33]';
    default: return 'terminal-badge';
  }
}
