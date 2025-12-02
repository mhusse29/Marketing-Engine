import { useState, useRef } from 'react';

interface WavyLineChartProps {
  data: Array<{
    label: string;
    values: number[];
    color: string;
  }>;
  timeLabels: string[];
}

interface SharedTooltipData {
  xPosition: number;
  pointIndex: number;
  month: string;
  series: Array<{
    label: string;
    value: number;
    color: string;
  }>;
}

export function WavyLineChart({ data, timeLabels }: WavyLineChartProps) {
  const [tooltipData, setTooltipData] = useState<SharedTooltipData | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-white/40">
        <p>No data available</p>
      </div>
    );
  }

  // Calculate dimensions
  const width = 800;
  const height = 280;
  const padding = { top: 20, right: 30, bottom: 35, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find max value for scaling
  const allValues = data.flatMap(d => d.values);
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue || 1;

  // Generate SVG path for smooth curves
  const createSmoothPath = (values: number[]) => {
    const points = values.map((value, i) => {
      const x = (i / (values.length - 1)) * chartWidth;
      const y = chartHeight - ((value - minValue) / valueRange) * chartHeight;
      return { x, y };
    });

    if (points.length === 0) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    // Create smooth curves using quadratic bezier
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      
      path += ` Q ${current.x} ${current.y}, ${midX} ${(current.y + next.y) / 2}`;
      
      if (i === points.length - 2) {
        path += ` Q ${next.x} ${next.y}, ${next.x} ${next.y}`;
      }
    }

    return path;
  };

  // Format numbers compactly
  const formatCompact = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  // Handle mouse move for shared tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Convert to SVG coordinate space
    const svgX = (mouseX / rect.width) * width;
    
    // Check if within chart area
    if (svgX < padding.left || svgX > padding.left + chartWidth) {
      setTooltipData(null);
      return;
    }

    // Find nearest time point
    const relativeX = svgX - padding.left;
    const normalizedX = relativeX / chartWidth;
    const pointIndex = Math.round(normalizedX * (timeLabels.length - 1));
    
    if (pointIndex < 0 || pointIndex >= timeLabels.length) {
      setTooltipData(null);
      return;
    }

    // Calculate x position for crosshair and tooltip
    const xPosition = padding.left + (pointIndex / (timeLabels.length - 1)) * chartWidth;

    // Gather all series data at this point
    const seriesData = data.map((series) => ({
      label: series.label,
      value: series.values[pointIndex],
      color: series.color,
    }));

    setTooltipData({
      xPosition,
      pointIndex,
      month: timeLabels[pointIndex],
      series: seriesData,
    });
  };

  const handleMouseLeave = () => {
    setTooltipData(null);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {/* SVG Chart */}
      <div className="relative flex-1 min-h-0">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          style={{ maxHeight: '350px' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y}
                  fill="rgba(255,255,255,0.4)"
                  fontSize="11"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {formatCompact(minValue + valueRange * ratio)}
                </text>
              </g>
            );
          })}

          {/* Time labels */}
          {timeLabels.map((label, i) => {
            const x = padding.left + (i / (timeLabels.length - 1)) * chartWidth;
            return (
              <text
                key={i}
                x={x}
                y={padding.top + chartHeight + 25}
                fill="rgba(255,255,255,0.4)"
                fontSize="11"
                textAnchor="middle"
              >
                {label}
              </text>
            );
          })}

          {/* Lines */}
          {data.map((series, idx) => {
            const path = createSmoothPath(series.values);
            return (
              <g key={series.label}>
                {/* Gradient background under line */}
                <defs>
                  <linearGradient id={`gradient-${idx}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={series.color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={series.color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Filled area */}
                <path
                  d={`${path} L ${padding.left + chartWidth} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`}
                  fill={`url(#gradient-${idx})`}
                  transform={`translate(${padding.left}, ${padding.top})`}
                />
                
                {/* Line with glow and animation */}
                <path
                  d={path}
                  fill="none"
                  stroke={series.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform={`translate(${padding.left}, ${padding.top})`}
                  style={{ 
                    filter: `drop-shadow(0 0 4px ${series.color}50)`,
                    transition: 'd 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />

                {/* Data points */}
                {series.values.map((value, i) => {
                  const x = padding.left + (i / (series.values.length - 1)) * chartWidth;
                  const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
                  const isActive = tooltipData?.pointIndex === i;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={isActive ? 5 : 3}
                      fill={series.color}
                      stroke="rgba(5,11,24,0.8)"
                      strokeWidth="2"
                      style={{ 
                        pointerEvents: 'none',
                        transition: 'r 0.15s ease',
                        filter: isActive ? `drop-shadow(0 0 6px ${series.color})` : 'none',
                      }}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Crosshair */}
          {tooltipData && (
            <line
              x1={tooltipData.xPosition}
              y1={padding.top}
              x2={tooltipData.xPosition}
              y2={padding.top + chartHeight}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
              strokeDasharray="4 4"
              style={{ pointerEvents: 'none' }}
            />
          )}
        </svg>

        {/* Shared Tooltip */}
        {tooltipData && (
          <div
            className="absolute pointer-events-none z-20 rounded-lg border px-3 py-2.5 text-xs"
            style={{
              left: `${(tooltipData.xPosition / width) * 100}%`,
              top: '10px',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(10, 14, 19, 0.95)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div
              className="font-semibold text-xs mb-2 pb-1.5"
              style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              {tooltipData.month}
            </div>
            <div className="flex flex-col gap-1.5">
              {tooltipData.series.map((seriesItem, index) => (
                <div key={index} className="flex items-center gap-2 text-[11px]">
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: seriesItem.color,
                      boxShadow: `0 0 6px ${seriesItem.color}80`,
                    }}
                  />
                  <span className="flex-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {seriesItem.label}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {seriesItem.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {data.map((series) => (
          <div
            key={series.label}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            <span className="text-xs text-white/70">{series.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
