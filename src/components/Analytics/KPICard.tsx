import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  status?: 'good' | 'warning' | 'critical' | 'neutral';
  subtitle?: string;
}

export function KPICard({ title, value, change, changeLabel, icon: Icon, status = 'neutral', subtitle }: KPICardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'text-[#33ff33] border-[#33ff33]/30 bg-[#33ff33]/8';
      case 'warning':
        return 'text-[#ffff33] border-[#ffff33]/30 bg-[#ffff33]/8';
      case 'critical':
        return 'text-[#ff3333] border-[#ff3333]/30 bg-[#ff3333]/8';
      default:
        return 'text-[#33ff33] border-[#33ff33]/30 bg-[#33ff33]/8';
    }
  };

  const getMetricClass = () => {
    switch (status) {
      case 'good':
        return 'terminal-metric--success';
      case 'warning':
        return 'terminal-metric--warning';
      case 'critical':
        return 'terminal-metric--alert';
      default:
        return 'terminal-metric';
    }
  };

  const getChangeIcon = () => {
    if (change === undefined || change === null) return Minus;
    return change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  };

  const getChangeColor = () => {
    if (change === undefined || change === null) return 'text-[#8a939f]';
    return change > 0 ? 'text-[#33ff33]' : change < 0 ? 'text-[#ff3333]' : 'text-[#7a7a7a]';
  };

  const ChangeIcon = getChangeIcon();

  return (
    <div className="relative group">
      {/* Terminal card with enhanced hierarchy */}
      <div className="terminal-card">
        {/* Icon badge */}
        {Icon && (
          <div className={`absolute top-6 right-6 flex items-center justify-center w-10 h-10 rounded-lg border ${getStatusColor()}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}

        {/* Content */}
        <div className="space-y-2 relative z-10">
          {/* Title with subtle divider */}
          <div className="pb-2 border-b border-[#33ff33]/10">
            <p className="terminal-panel__title font-bold">{title}</p>
          </div>
          
          {/* Value */}
          <p className={`text-3xl font-bold tracking-tight ${getMetricClass()}`}>{value}</p>
          
          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs terminal-text-muted">{subtitle}</p>
          )}

          {/* Change indicator */}
          {change !== undefined && change !== null && (
            <div className="flex items-center gap-2 pt-2 border-t border-[#33ff33]/10">
              <div className={`flex items-center gap-1 ${getChangeColor()}`}>
                <ChangeIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {Math.abs(change).toFixed(1)}%
                </span>
              </div>
              {changeLabel && (
                <span className="text-xs terminal-text-muted">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
