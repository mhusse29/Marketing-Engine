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

    return () => {
      supabase.removeChannel(subscription);
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
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/3"></div>
          <div className="h-20 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">Deployment History</h3>
        </div>
        
        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`
              px-3 py-1 rounded-lg text-xs font-medium transition-all
              ${filter === 'all' 
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                : 'glass-button text-white/60'
              }
            `}
          >
            All
          </button>
          <button
            onClick={() => setFilter('production')}
            className={`
              px-3 py-1 rounded-lg text-xs font-medium transition-all
              ${filter === 'production' 
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                : 'glass-button text-white/60'
              }
            `}
          >
            Production
          </button>
          <button
            onClick={() => setFilter('staging')}
            className={`
              px-3 py-1 rounded-lg text-xs font-medium transition-all
              ${filter === 'staging' 
                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                : 'glass-button text-white/60'
              }
            `}
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
              p-3 rounded-lg border transition-all hover:border-white/20
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
                  
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
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
                    <div className="mt-1 font-mono text-xs text-white/40">
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
        <div className="text-center py-8 text-white/50 text-sm">
          No deployments found
        </div>
      )}
    </div>
  );
}

function getDeploymentStyle(status: string): string {
  switch (status) {
    case 'succeeded': return 'bg-emerald-500/5 border-emerald-500/20';
    case 'failed': return 'bg-red-500/5 border-red-500/30';
    case 'rolled_back': return 'bg-orange-500/5 border-orange-500/30';
    case 'deploying': return 'bg-blue-500/5 border-blue-500/20';
    default: return 'bg-white/5 border-white/10';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'succeeded': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case 'failed': return <XCircle className="w-5 h-5 text-red-400" />;
    case 'deploying': return <Clock className="w-5 h-5 text-blue-400 animate-spin" />;
    case 'rolled_back': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
    default: return <Package className="w-5 h-5 text-white/40" />;
  }
}

function getStatusIconBg(status: string): string {
  switch (status) {
    case 'succeeded': return 'bg-emerald-500/10';
    case 'failed': return 'bg-red-500/10';
    case 'deploying': return 'bg-blue-500/10';
    case 'rolled_back': return 'bg-orange-500/10';
    default: return 'bg-white/5';
  }
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'succeeded': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    case 'failed': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'deploying': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'rolled_back': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    default: return 'bg-white/10 text-white/70';
  }
}

function getEnvironmentBadge(env: string): string {
  switch (env) {
    case 'production': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'staging': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'dev': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    default: return 'bg-white/10 text-white/70';
  }
}
