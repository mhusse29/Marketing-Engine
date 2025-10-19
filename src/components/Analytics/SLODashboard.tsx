import { useState, useEffect, useCallback } from 'react';
import { KPICard } from './KPICard';
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
// import { supabase } from '../../lib/supabase'; // TODO: Use real data once SLO tables are created

interface SLO {
  id: string;
  name: string;
  description: string;
  target: number; // e.g., 99.9
  current: number;
  window: '1h' | '24h' | '7d' | '30d';
  status: 'healthy' | 'at_risk' | 'breached';
  error_budget: number; // remaining %
  burn_rate: number; // how fast consuming budget
  metric_type: 'latency' | 'availability' | 'error_rate';
}

interface SLOMeasurement {
  timestamp: string;
  value: number;
  target: number;
  error_budget: number;
}

export function SLODashboard() {
  const [slos, setSlos] = useState<SLO[]>([]);
  const [selectedSLO, setSelectedSLO] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<SLOMeasurement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSLOs = useCallback(async () => {
    try {
      // Mock data - replace with actual Supabase query once tables are created
      const mockSLOs: SLO[] = [
        {
          id: 'slo-1',
          name: 'API Availability',
          description: '99.9% uptime for all API endpoints',
          target: 99.9,
          current: 99.95,
          window: '30d',
          status: 'healthy',
          error_budget: 99.2, // % of budget remaining
          burn_rate: 0.5, // % per day
          metric_type: 'availability'
        },
        {
          id: 'slo-2',
          name: 'Response Time P95',
          description: '95% of requests under 2000ms',
          target: 95,
          current: 96.2,
          window: '24h',
          status: 'healthy',
          error_budget: 88.5,
          burn_rate: 1.2,
          metric_type: 'latency'
        },
        {
          id: 'slo-3',
          name: 'Error Rate',
          description: 'Less than 1% error rate',
          target: 99,
          current: 97.8,
          window: '7d',
          status: 'at_risk',
          error_budget: 45.2,
          burn_rate: 5.8,
          metric_type: 'error_rate'
        },
        {
          id: 'slo-4',
          name: 'Model Response Quality',
          description: '90% user satisfaction rating',
          target: 90,
          current: 92.5,
          window: '30d',
          status: 'healthy',
          error_budget: 95.0,
          burn_rate: 0.3,
          metric_type: 'error_rate'
        }
      ];

      setSlos(mockSLOs);
      if (!selectedSLO && mockSLOs.length > 0) {
        setSelectedSLO(mockSLOs[0].id);
      }
    } catch (error) {
      console.error('Error fetching SLOs:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSLO]);

  const fetchMeasurements = useCallback(async (sloId: string) => {
    try {
      // Mock historical data - replace with actual query
      const now = Date.now();
      const mockMeasurements: SLOMeasurement[] = Array.from({ length: 24 }, (_, i) => {
        const timestamp = new Date(now - (23 - i) * 3600000).toISOString();
        const slo = slos.find(s => s.id === sloId);
        const target = slo?.target || 99;
        const baseValue = target + (Math.random() - 0.5) * 2;
        const value = Math.max(0, Math.min(100, baseValue));
        const errorBudget = 100 - ((target - value) / (100 - target)) * 100;
        
        return {
          timestamp,
          value,
          target,
          error_budget: Math.max(0, Math.min(100, errorBudget))
        };
      });

      setMeasurements(mockMeasurements);
    } catch (error) {
      console.error('Error fetching measurements:', error);
    }
  }, [slos]);

  useEffect(() => {
    fetchSLOs();
    const interval = setInterval(fetchSLOs, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchSLOs]);

  useEffect(() => {
    if (selectedSLO) {
      fetchMeasurements(selectedSLO);
    }
  }, [selectedSLO, fetchMeasurements]);

  const getStatusColor = (status: SLO['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'at_risk':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'breached':
        return 'text-red-400 border-red-500/30 bg-red-500/10';
    }
  };

  const getStatusIcon = (status: SLO['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'at_risk':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'breached':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="glass-card p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white/80" />
            <span className="text-white/70">Loading SLO data...</span>
          </div>
        </div>
      </div>
    );
  }

  const selectedSLOData = slos.find(s => s.id === selectedSLO);
  const chartData = measurements.map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    value: m.value,
    target: m.target,
    errorBudget: m.error_budget
  }));

  // Calculate overall SLO health
  const healthySLOs = slos.filter(s => s.status === 'healthy').length;
  const atRiskSLOs = slos.filter(s => s.status === 'at_risk').length;
  const breachedSLOs = slos.filter(s => s.status === 'breached').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-3xl font-bold text-white">SLO Dashboard</h2>
            <p className="text-white/60">Service Level Objectives & Error Budgets</p>
          </div>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Total SLOs"
          value={slos.length}
          icon={Target}
          status="neutral"
          subtitle={`${healthySLOs} healthy, ${atRiskSLOs} at risk`}
        />
        <KPICard
          title="Healthy SLOs"
          value={healthySLOs}
          icon={CheckCircle2}
          status="good"
          subtitle={`${((healthySLOs / slos.length) * 100).toFixed(0)}% of total`}
        />
        <KPICard
          title="At Risk"
          value={atRiskSLOs}
          icon={AlertTriangle}
          status={atRiskSLOs > 0 ? 'warning' : 'good'}
          subtitle="Needs attention"
        />
        <KPICard
          title="Breached"
          value={breachedSLOs}
          icon={AlertTriangle}
          status={breachedSLOs > 0 ? 'critical' : 'good'}
          subtitle="Immediate action required"
        />
      </div>

      {/* SLO Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {slos.map((slo) => (
          <div
            key={slo.id}
            onClick={() => setSelectedSLO(slo.id)}
            className={`
              glass-card-elevated p-6 cursor-pointer transition-all hover:scale-[1.02]
              ${selectedSLO === slo.id ? 'ring-2 ring-blue-500/50' : ''}
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{slo.name}</h3>
                <p className="text-sm text-white/60">{slo.description}</p>
              </div>
              {getStatusIcon(slo.status)}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-white/50 mb-1">Current</p>
                <p className="text-2xl font-bold text-white">{slo.current.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Target</p>
                <p className="text-2xl font-bold text-white/80">{slo.target.toFixed(1)}%</p>
              </div>
            </div>

            {/* Error Budget Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/60">Error Budget</span>
                <span className="text-xs font-medium text-white">{slo.error_budget.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    slo.error_budget > 50 ? 'bg-emerald-400' :
                    slo.error_budget > 20 ? 'bg-amber-400' :
                    'bg-red-400'
                  }`}
                  style={{ width: `${slo.error_budget}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(slo.status)}`}>
                {slo.status.toUpperCase()}
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50">Burn Rate</p>
                <p className={`text-sm font-medium ${
                  slo.burn_rate < 1 ? 'text-emerald-400' :
                  slo.burn_rate < 3 ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {slo.burn_rate.toFixed(1)}%/day
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Chart for Selected SLO */}
      {selectedSLOData && (
        <div className="glass-card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">{selectedSLOData.name}</h3>
              <p className="text-sm text-white/60">Last 24 hours • Window: {selectedSLOData.window}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-white/50">Current</p>
                <p className="text-2xl font-bold text-white">{selectedSLOData.current.toFixed(2)}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50">Target</p>
                <p className="text-2xl font-bold text-white/80">{selectedSLOData.target.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="time"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                domain={[selectedSLOData.target - 5, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <ReferenceLine
                y={selectedSLOData.target}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{ value: 'Target', fill: '#f59e0b', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }}
                name="Actual"
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Error Budget Chart */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-white/80 mb-3">Error Budget Consumption</h4>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="time"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="errorBudget"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Budget Remaining %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">Recommendations</h3>
        </div>
        <div className="space-y-3">
          {slos.filter(s => s.status === 'at_risk').map(slo => (
            <div key={slo.id} className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-400 mb-1">{slo.name}</p>
              <p className="text-xs text-white/70">
                Error budget at {slo.error_budget.toFixed(1)}%. Consider: reducing traffic, improving caching, or adjusting SLO target.
              </p>
            </div>
          ))}
          {slos.filter(s => s.status === 'breached').map(slo => (
            <div key={slo.id} className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm font-medium text-red-400 mb-1">⚠️ {slo.name} - BREACHED</p>
              <p className="text-xs text-white/70">
                Immediate action required. Error budget exhausted. Review incidents and implement fixes.
              </p>
            </div>
          ))}
          {slos.every(s => s.status === 'healthy') && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <p className="text-sm font-medium text-emerald-400">✓ All SLOs Healthy</p>
              <p className="text-xs text-white/70">
                All service level objectives are meeting targets. Continue monitoring burn rates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
