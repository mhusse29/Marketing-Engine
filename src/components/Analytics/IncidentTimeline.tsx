/**
 * Incident Timeline Component
 * Shows recent incidents with deployment correlation
 */

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Incident {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  started_at: string;
  resolved_at?: string;
  duration_minutes?: number;
  affected_services: string[];
  owner?: string;
  recent_deployments?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  errors_during_incident?: number;
}

export function IncidentTimeline() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('incidents_timeline')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'incidents' 
      }, () => fetchIncidents())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('mv_incident_timeline' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setIncidents(data as Incident[]);
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4"></div>
          <div className="h-20 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Incident Timeline</h3>
        </div>
        <p className="text-white/60 text-sm">No incidents in the last 90 days. All systems operational! 🎉</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Incident Timeline</h3>
        </div>
        <span className="text-sm text-white/50">{incidents.length} incidents (90 days)</span>
      </div>

      <div className="space-y-3">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            className={`
              p-4 rounded-lg border transition-all hover:border-white/20
              ${getSeverityBorder(incident.severity)}
              ${incident.status === 'resolved' ? 'opacity-70' : ''}
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">{incident.title}</h4>
                  <span className={`
                    px-2 py-0.5 rounded text-xs font-medium
                    ${getSeverityBadge(incident.severity)}
                  `}>
                    {incident.severity}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(incident.started_at).toLocaleString()}
                  </span>
                  {incident.duration_minutes && (
                    <span>
                      Duration: {formatDuration(incident.duration_minutes)}
                    </span>
                  )}
                </div>
              </div>
              <div className={`
                px-3 py-1 rounded-full text-xs font-medium
                ${getStatusStyle(incident.status)}
              `}>
                {incident.status}
              </div>
            </div>

            {/* Affected Services */}
            {incident.affected_services && incident.affected_services.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {incident.affected_services.map((service) => (
                  <span
                    key={service}
                    className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-white/70"
                  >
                    {service}
                  </span>
                ))}
              </div>
            )}

            {/* Recent Deployments */}
            {incident.recent_deployments && incident.recent_deployments.length > 0 && (
              <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs">
                <span className="text-amber-400 font-medium">⚠ Recent deployment detected</span>
                <span className="text-white/60 ml-2">
                  {incident.recent_deployments[0].version} deployed {
                    Math.round((new Date(incident.started_at).getTime() - 
                               new Date(incident.recent_deployments[0].deployed_at).getTime()) / 60000)
                  } min before incident
                </span>
              </div>
            )}

            {/* Impact */}
            {incident.errors_during_incident && incident.errors_during_incident > 0 && (
              <div className="mt-2 text-xs text-red-400">
                {incident.errors_during_incident.toLocaleString()} errors during incident
              </div>
            )}

            {/* Owner */}
            {incident.owner && (
              <div className="mt-2 text-xs text-white/50">
                Owner: {incident.owner}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getSeverityBorder(severity: string): string {
  switch (severity) {
    case 'critical': return 'bg-red-500/5 border-red-500/30';
    case 'high': return 'bg-orange-500/5 border-orange-500/30';
    case 'medium': return 'bg-amber-500/5 border-amber-500/30';
    case 'low': return 'bg-yellow-500/5 border-yellow-500/30';
    default: return 'bg-white/5 border-white/10';
  }
}

function getSeverityBadge(severity: string): string {
  switch (severity) {
    case 'critical': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    case 'medium': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'low': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    default: return 'bg-white/10 text-white/70';
  }
}

function getStatusStyle(status: string): string {
  switch (status) {
    case 'resolved': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    case 'monitoring': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'identified': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'investigating': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    default: return 'bg-white/10 text-white/70';
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}
