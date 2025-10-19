/**
 * Experiment Dashboard
 * A/B testing and feature flag management
 */

import { useState, useEffect } from 'react';
import { Beaker, TrendingUp, CheckCircle2, Play, Pause, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Experiment {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  started_at?: string;
  ended_at?: string;
  target_metric: string;
  control_variant: string;
  test_variants: string[];
  traffic_allocation: Record<string, number>;
  control_value?: number;
  test_values?: Record<string, number>;
  lift_percentage?: number;
  confidence_level?: number;
  statistical_significance?: boolean;
  winner?: string;
  owner?: string;
}

export function ExperimentDashboard() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed'>('all');

  useEffect(() => {
    fetchExperiments();

    const subscription = supabase
      .channel('experiments_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'experiments' 
      }, () => fetchExperiments())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchExperiments = async () => {
    try {
      let query = supabase
        .from('experiments' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'running') {
        query = query.eq('status', 'running');
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      }

      const { data, error } = await query;

      if (!error && data) {
        setExperiments(data as unknown as Experiment[]);
      }
    } catch (err) {
      console.error('Failed to fetch experiments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4"></div>
          <div className="h-32 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Beaker className="w-6 h-6 text-violet-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Experiments</h2>
              <p className="text-sm text-white/60 mt-1">A/B tests and feature rollouts</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${filter === 'all' 
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                  : 'glass-button'
                }
              `}
            >
              All ({experiments.length})
            </button>
            <button
              onClick={() => setFilter('running')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${filter === 'running' 
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                  : 'glass-button'
                }
              `}
            >
              Running ({experiments.filter(e => e.status === 'running').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${filter === 'completed' 
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                  : 'glass-button'
                }
              `}
            >
              Completed ({experiments.filter(e => e.status === 'completed').length})
            </button>
          </div>
        </div>
      </div>

      {/* Experiments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {experiments.map((exp) => (
          <div key={exp.id} className="glass-card p-6 hover-lift">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white">{exp.name}</h3>
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${getStatusBadge(exp.status)}
                  `}>
                    {exp.status}
                  </span>
                </div>
                {exp.description && (
                  <p className="text-sm text-white/60">{exp.description}</p>
                )}
              </div>
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${getStatusIconBg(exp.status)}
              `}>
                {getStatusIcon(exp.status)}
              </div>
            </div>

            {/* Target Metric */}
            <div className="mb-4">
              <div className="text-xs text-white/50 mb-1">Target Metric</div>
              <div className="text-sm font-medium text-white">{exp.target_metric}</div>
            </div>

            {/* Variants */}
            <div className="mb-4">
              <div className="text-xs text-white/50 mb-2">Variants</div>
              <div className="space-y-2">
                {/* Control */}
                <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/70">
                      {exp.control_variant} (control)
                    </span>
                    {exp.control_value !== undefined && (
                      <span className="text-xs text-white/50">
                        {formatValue(exp.control_value)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-white/40">
                    {exp.traffic_allocation[exp.control_variant] || 50}%
                  </span>
                </div>

                {/* Test Variants */}
                {exp.test_variants.map((variant) => (
                  <div key={variant} className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white/70">{variant}</span>
                      {exp.test_values?.[variant] !== undefined && (
                        <span className="text-xs text-emerald-400">
                          {formatValue(exp.test_values[variant])}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-white/40">
                      {exp.traffic_allocation[variant] || 50}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            {exp.status === 'completed' && exp.lift_percentage !== undefined && (
              <div className={`
                p-3 rounded-lg mb-4
                ${exp.lift_percentage > 0 
                  ? 'bg-emerald-500/10 border border-emerald-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
                }
              `}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-white/60 mb-1">Lift</div>
                    <div className={`
                      text-xl font-bold flex items-center gap-1
                      ${exp.lift_percentage > 0 ? 'text-emerald-400' : 'text-red-400'}
                    `}>
                      {exp.lift_percentage > 0 ? <TrendingUp className="w-5 h-5" /> : null}
                      {exp.lift_percentage > 0 ? '+' : ''}{exp.lift_percentage.toFixed(2)}%
                    </div>
                  </div>
                  
                  {exp.confidence_level && (
                    <div className="text-right">
                      <div className="text-xs text-white/60 mb-1">Confidence</div>
                      <div className="text-sm font-semibold text-white">
                        {(exp.confidence_level * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>

                {exp.statistical_significance && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    Statistically significant
                  </div>
                )}

                {exp.winner && (
                  <div className="mt-2 text-xs text-white/70">
                    Winner: <span className="font-semibold text-white">{exp.winner}</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-white/50">
              {exp.owner && <span>Owner: {exp.owner}</span>}
              {exp.started_at && (
                <span>Started {new Date(exp.started_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {experiments.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Beaker className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No experiments found</p>
          <p className="text-sm text-white/40 mt-2">Create your first experiment to get started</p>
        </div>
      )}
    </div>
  );
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'running': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'completed': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    case 'paused': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'cancelled': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'draft': return 'bg-white/10 text-white/70';
    default: return 'bg-white/10 text-white/70';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'running': return <Play className="w-5 h-5 text-blue-400" />;
    case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case 'paused': return <Pause className="w-5 h-5 text-amber-400" />;
    case 'cancelled': return <X className="w-5 h-5 text-red-400" />;
    default: return <Beaker className="w-5 h-5 text-white/40" />;
  }
}

function getStatusIconBg(status: string): string {
  switch (status) {
    case 'running': return 'bg-blue-500/10';
    case 'completed': return 'bg-emerald-500/10';
    case 'paused': return 'bg-amber-500/10';
    case 'cancelled': return 'bg-red-500/10';
    default: return 'bg-white/5';
  }
}

function formatValue(value: number): string {
  if (value < 0.01) return value.toFixed(4);
  if (value < 1) return value.toFixed(3);
  if (value < 10) return value.toFixed(2);
  return value.toFixed(1);
}
