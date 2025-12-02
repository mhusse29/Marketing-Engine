import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from 'recharts';
import { premiumTheme, formatCompactNumber } from './premium-theme';

interface LineData {
  label: string;
  values: number[];
  color: string;
}

interface PremiumLineChartProps {
  data: LineData[];
  timeLabels: string[];
  metricType: string;
}

// Shared tooltip component
function SharedTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="rounded-lg px-3 py-2.5 text-xs border"
      style={{
        backgroundColor: 'rgba(10, 14, 19, 0.95)',
        borderColor: premiumTheme.border,
        color: premiumTheme.textPrimary,
        backdropFilter: 'blur(12px)',
        boxShadow: premiumTheme.shadows.combined,
        pointerEvents: 'none',
      }}
    >
      <div
        className="font-semibold text-xs mb-2 pb-1.5"
        style={{ borderBottom: `1px solid ${premiumTheme.border}` }}
      >
        {label}
      </div>
      <div className="flex flex-col gap-1.5">
        {payload.map((entry: any, index: number) => {
          const prevValue = entry.payload[`${entry.dataKey}_prev`];
          const delta =
            prevValue !== null && prevValue !== undefined
              ? ((entry.value - prevValue) / prevValue) * 100
              : null;

          return (
            <div key={index} className="flex items-center gap-2 text-[11px]">
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: entry.color,
                  boxShadow: `0 0 6px ${entry.color}80`,
                }}
              />
              <span className="flex-1" style={{ color: premiumTheme.textSecondary }}>
                {entry.name}
              </span>
              <span className="font-semibold tabular-nums">
                {formatCompactNumber(entry.value)}
              </span>
              {delta !== null && (
                <span
                  className="text-[10px] tabular-nums min-w-[42px] text-right"
                  style={{
                    color: delta >= 0 ? premiumTheme.accents.mint : premiumTheme.accents.coral,
                  }}
                >
                  {delta >= 0 ? '+' : ''}
                  {delta.toFixed(1)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PremiumLineChart({ data, timeLabels, metricType }: PremiumLineChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center" style={{ color: premiumTheme.textSecondary }}>
        <p>No data available</p>
      </div>
    );
  }

  // Transform data for Recharts format
  const chartData = timeLabels.map((month, index) => {
    const dataPoint: any = { month };
    
    data.forEach((series) => {
      dataPoint[series.label] = series.values[index];
      // Store previous value for delta calculation
      dataPoint[`${series.label}_prev`] = index > 0 ? series.values[index - 1] : null;
    });
    
    return dataPoint;
  });

  return (
    <div className="w-full h-full" style={{ minHeight: '280px', maxHeight: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          onMouseMove={(e: any) => {
            if (!e || e.activeTooltipIndex == null) return;
            setActiveIndex(e.activeTooltipIndex);
          }}
          onMouseLeave={() => setActiveIndex(null)}
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <XAxis
            dataKey="month"
            type="category"
            allowDuplicatedCategory={false}
            stroke={premiumTheme.textSecondary}
            style={{ fontSize: '10px', opacity: 0.6 }}
            tick={{ fill: premiumTheme.textSecondary }}
          />
          <YAxis
            domain={['dataMin - 2', 'dataMax + 3']}
            stroke={premiumTheme.textSecondary}
            style={{ fontSize: '10px', opacity: 0.6 }}
            tick={{ fill: premiumTheme.textSecondary }}
            tickFormatter={(value) => formatCompactNumber(value)}
          />
          <RTooltip
            isAnimationActive={false}
            cursor={{
              stroke: premiumTheme.accents.cyan,
              strokeWidth: 1.5,
              strokeDasharray: '4 4',
            }}
            content={<SharedTooltip />}
            wrapperStyle={{ pointerEvents: 'none' }}
          />
          {data.map((series) => (
            <Line
              key={series.label}
              type="monotone"
              dataKey={series.label}
              name={series.label}
              stroke={series.color}
              strokeWidth={2}
              dot={{ r: 3, fill: series.color, stroke: premiumTheme.bg, strokeWidth: 2 }}
              activeDot={{
                r: 6,
                fill: series.color,
                stroke: premiumTheme.bg,
                strokeWidth: 2,
                filter: `drop-shadow(0 0 8px ${series.color}80)`,
              }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-2 px-2">
        {data.map((series) => (
          <div
            key={series.label}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1"
            style={{
              backgroundColor: `${series.color}10`,
              border: `1px solid ${series.color}30`,
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: series.color,
                boxShadow: `0 0 4px ${series.color}60`,
              }}
            />
            <span
              className="text-[10px]"
              style={{ color: premiumTheme.textSecondary }}
            >
              {series.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
