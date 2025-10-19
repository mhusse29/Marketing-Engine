/**
 * Anomaly Detection Component
 * 
 * Detects and highlights anomalies in metrics using:
 * - Z-score detection (statistical)
 * - Threshold-based alerts
 * - Trend analysis
 */

import { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface Anomaly {
  id: string;
  metric: string;
  value: number;
  expected: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  type: 'spike' | 'drop' | 'trend_change';
}

interface AnomalyDetectorProps {
  data: number[];
  metricName: string;
  threshold?: number; // Z-score threshold (default 2)
}

export function AnomalyDetector({ data, metricName, threshold = 2 }: AnomalyDetectorProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  useEffect(() => {
    if (data.length < 3) return;

    const detected = detectAnomalies(data, metricName, threshold);
    setAnomalies(detected);
  }, [data, metricName, threshold]);

  if (anomalies.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">
          {anomalies.length} Anomal{anomalies.length === 1 ? 'y' : 'ies'} Detected
        </h3>
      </div>

      <div className="space-y-2">
        {anomalies.slice(0, 3).map((anomaly) => (
          <div
            key={anomaly.id}
            className={`
              p-3 rounded-lg border
              ${getSeverityStyles(anomaly.severity)}
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {anomaly.type === 'spike' && (
                    <TrendingUp className="w-4 h-4 text-red-400" />
                  )}
                  {anomaly.type === 'drop' && (
                    <TrendingDown className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="text-sm font-medium text-white">
                    {anomaly.metric}
                  </span>
                </div>
                <div className="mt-1 text-xs text-white/60">
                  Value: {anomaly.value.toFixed(2)} 
                  <span className="mx-1">•</span>
                  Expected: {anomaly.expected.toFixed(2)}
                  <span className="mx-1">•</span>
                  Deviation: {(anomaly.deviation * 100).toFixed(1)}%
                </div>
              </div>
              <div className={`
                px-2 py-1 rounded text-xs font-medium
                ${getSeverityBadge(anomaly.severity)}
              `}>
                {anomaly.severity.toUpperCase()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {anomalies.length > 3 && (
        <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
          View all {anomalies.length} anomalies →
        </button>
      )}
    </div>
  );
}

/**
 * Statistical anomaly detection using Z-score
 */
function detectAnomalies(data: number[], metricName: string, threshold: number): Anomaly[] {
  if (data.length < 3) return [];

  // Calculate mean and standard deviation
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  const anomalies: Anomaly[] = [];

  // Check each data point
  data.forEach((value, index) => {
    const zScore = Math.abs((value - mean) / stdDev);

    if (zScore > threshold) {
      const deviation = (value - mean) / mean;
      const type = value > mean ? 'spike' : 'drop';
      
      // Determine severity based on Z-score
      let severity: Anomaly['severity'];
      if (zScore > 4) severity = 'critical';
      else if (zScore > 3) severity = 'high';
      else if (zScore > 2.5) severity = 'medium';
      else severity = 'low';

      anomalies.push({
        id: `anomaly-${index}-${Date.now()}`,
        metric: metricName,
        value,
        expected: mean,
        deviation,
        severity,
        timestamp: new Date().toISOString(),
        type
      });
    }
  });

  return anomalies;
}

function getSeverityStyles(severity: Anomaly['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/10 border-red-500/30';
    case 'high':
      return 'bg-orange-500/10 border-orange-500/30';
    case 'medium':
      return 'bg-amber-500/10 border-amber-500/30';
    case 'low':
      return 'bg-yellow-500/10 border-yellow-500/30';
  }
}

function getSeverityBadge(severity: Anomaly['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'high':
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    case 'medium':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'low':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
  }
}
