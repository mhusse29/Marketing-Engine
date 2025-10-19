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
        return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
      case 'warning':
        return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
      case 'critical':
        return 'text-red-400 border-red-500/20 bg-red-500/5';
      default:
        return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
    }
  };

  const getChangeIcon = () => {
    if (change === undefined || change === null) return Minus;
    return change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  };

  const getChangeColor = () => {
    if (change === undefined || change === null) return 'text-white/40';
    return change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-white/40';
  };

  const ChangeIcon = getChangeIcon();

  return (
    <div className="relative group">
      {/* Glass card */}
      <div className="relative backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all duration-300">
        {/* Icon badge */}
        {Icon && (
          <div className={`absolute top-6 right-6 flex items-center justify-center w-10 h-10 rounded-lg ${getStatusColor()}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}

        {/* Content */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/60">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          
          {subtitle && (
            <p className="text-xs text-white/40">{subtitle}</p>
          )}

          {/* Change indicator */}
          {change !== undefined && change !== null && (
            <div className="flex items-center gap-2 pt-2">
              <div className={`flex items-center gap-1 ${getChangeColor()}`}>
                <ChangeIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {Math.abs(change).toFixed(1)}%
                </span>
              </div>
              {changeLabel && (
                <span className="text-xs text-white/40">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500 pointer-events-none" />
      </div>
    </div>
  );
}
