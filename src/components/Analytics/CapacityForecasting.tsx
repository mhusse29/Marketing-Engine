/**
 * Capacity Forecasting Component
 * Usage predictions, cost forecasting, and budget tracking
 */

import { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Line } from 'recharts';
import { useDailyMetrics } from '../../hooks/useAnalytics';

export function CapacityForecasting() {
  const { metrics } = useDailyMetrics(30);
  const [forecastDays, setForecastDays] = useState(7);

  // Generate forecast using simple linear regression
  const forecast = useMemo(() => {
    if (metrics.length < 7) return [];

    const costs = metrics.map(m => Number(m.total_cost || 0));
    const forecast = generateForecast(costs, forecastDays);
    
    return forecast.map((value, index) => ({
      date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      predicted: value.predicted,
      confidence_lower: value.lower,
      confidence_upper: value.upper
    }));
  }, [metrics, forecastDays]);

  // Combine historical + forecast
  const chartData = useMemo(() => {
    const historical = metrics.slice(0, 14).reverse().map(m => ({
      date: m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      actual: Number(m.total_cost || 0),
      predicted: undefined,
      confidence_lower: undefined,
      confidence_upper: undefined
    }));

    return [...historical, ...forecast];
  }, [metrics, forecast]);

  // Budget calculations
  const currentMonthSpend = useMemo(() => {
    return metrics.slice(0, 30).reduce((sum, m) => sum + Number(m.total_cost || 0), 0);
  }, [metrics]);

  const projectedMonthSpend = useMemo(() => {
    const daysInMonth = 30;
    const daysElapsed = metrics.length;
    const avgDailyCost = currentMonthSpend / daysElapsed;
    return avgDailyCost * daysInMonth;
  }, [currentMonthSpend, metrics]);

  const monthlyBudget = 1000; // TODO: Make configurable
  const budgetRemaining = monthlyBudget - currentMonthSpend;
  const budgetUsagePercent = (currentMonthSpend / monthlyBudget) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-violet-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Capacity & Forecasting</h2>
            <p className="text-sm text-white/60 mt-1">Usage predictions and budget tracking</p>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Current Spend */}
          <div className="glass-card-elevated p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-white/60">Month to Date</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${currentMonthSpend.toFixed(2)}
            </div>
            <div className="text-xs text-white/50 mt-1">
              {metrics.length} days tracked
            </div>
          </div>

          {/* Projected Spend */}
          <div className="glass-card-elevated p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-white/60">Projected Total</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${projectedMonthSpend.toFixed(2)}
            </div>
            <div className="text-xs text-white/50 mt-1">
              Based on current trend
            </div>
          </div>

          {/* Budget Remaining */}
          <div className="glass-card-elevated p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-white/60">Budget Remaining</span>
            </div>
            <div className={`text-2xl font-bold ${budgetRemaining < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              ${Math.abs(budgetRemaining).toFixed(2)}
            </div>
            <div className="text-xs text-white/50 mt-1">
              of ${monthlyBudget.toFixed(2)} budget
            </div>
          </div>

          {/* Budget Usage */}
          <div className="glass-card-elevated p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`w-4 h-4 ${budgetUsagePercent > 80 ? 'text-red-400' : 'text-amber-400'}`} />
              <span className="text-xs text-white/60">Budget Usage</span>
            </div>
            <div className={`text-2xl font-bold ${
              budgetUsagePercent > 100 ? 'text-red-400' : 
              budgetUsagePercent > 80 ? 'text-amber-400' : 
              'text-emerald-400'
            }`}>
              {budgetUsagePercent.toFixed(1)}%
            </div>
            <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  budgetUsagePercent > 100 ? 'bg-red-400' :
                  budgetUsagePercent > 80 ? 'bg-amber-400' :
                  'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Budget Alert */}
        {budgetUsagePercent > 80 && (
          <div className={`
            mt-4 p-4 rounded-lg border
            ${budgetUsagePercent > 100 
              ? 'bg-red-500/10 border-red-500/30' 
              : 'bg-amber-500/10 border-amber-500/30'
            }
          `}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${budgetUsagePercent > 100 ? 'text-red-400' : 'text-amber-400'}`} />
              <div className="flex-1">
                <h4 className={`text-sm font-semibold ${budgetUsagePercent > 100 ? 'text-red-400' : 'text-amber-400'}`}>
                  {budgetUsagePercent > 100 ? 'Budget Exceeded' : 'Budget Warning'}
                </h4>
                <p className="text-xs text-white/70 mt-1">
                  {budgetUsagePercent > 100 
                    ? `You've exceeded your monthly budget by $${(currentMonthSpend - monthlyBudget).toFixed(2)}.`
                    : `You're approaching your monthly budget limit. ${100 - budgetUsagePercent.toFixed(1)}% remaining.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Forecast Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Cost Forecast</h3>
          
          {/* Forecast Range Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setForecastDays(7)}
              className={`
                px-3 py-1 rounded-lg text-xs font-medium transition-all
                ${forecastDays === 7 
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                  : 'glass-button text-white/60'
                }
              `}
            >
              7 days
            </button>
            <button
              onClick={() => setForecastDays(14)}
              className={`
                px-3 py-1 rounded-lg text-xs font-medium transition-all
                ${forecastDays === 14 
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                  : 'glass-button text-white/60'
                }
              `}
            >
              14 days
            </button>
            <button
              onClick={() => setForecastDays(30)}
              className={`
                px-3 py-1 rounded-lg text-xs font-medium transition-all
                ${forecastDays === 30 
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                  : 'glass-button text-white/60'
                }
              `}
            >
              30 days
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.5)"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(10, 10, 10, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.9)' }}
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']} // eslint-disable-line @typescript-eslint/no-explicit-any
            />
            
            {/* Confidence Interval */}
            <Area
              type="monotone"
              dataKey="confidence_upper"
              stroke="none"
              fill="rgba(59, 130, 246, 0.1)"
            />
            <Area
              type="monotone"
              dataKey="confidence_lower"
              stroke="none"
              fill="rgba(59, 130, 246, 0.1)"
            />
            
            {/* Actual Line */}
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', r: 3 }}
              name="Actual"
            />
            
            {/* Forecast Line */}
            <Line 
              type="monotone" 
              dataKey="predicted" 
              stroke="#3b82f6" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#3b82f6', r: 3 }}
              name="Forecast"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-4 flex items-center gap-4 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-violet-500"></div>
            <span>Actual Spend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Forecasted Spend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 bg-blue-500/20"></div>
            <span>Confidence Interval</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Simple linear regression forecast with confidence intervals
 */
function generateForecast(data: number[], days: number): Array<{predicted: number, lower: number, upper: number}> {
  const n = data.length;
  if (n < 2) return [];

  // Calculate linear regression
  const x = Array.from({ length: n }, (_, i) => i);
  const meanX = x.reduce((a, b) => a + b) / n;
  const meanY = data.reduce((a, b) => a + b) / n;

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - meanX) * (data[i] - meanY);
    den += Math.pow(x[i] - meanX, 2);
  }

  const slope = num / den;
  const intercept = meanY - slope * meanX;

  // Calculate standard error
  let sumSquaredErrors = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * x[i] + intercept;
    sumSquaredErrors += Math.pow(data[i] - predicted, 2);
  }
  const stdError = Math.sqrt(sumSquaredErrors / (n - 2));

  // Generate forecast
  const forecast = [];
  for (let i = 0; i < days; i++) {
    const xValue = n + i;
    const predicted = Math.max(0, slope * xValue + intercept);
    const margin = stdError * 1.96; // 95% confidence
    
    forecast.push({
      predicted,
      lower: Math.max(0, predicted - margin),
      upper: predicted + margin
    });
  }

  return forecast;
}
