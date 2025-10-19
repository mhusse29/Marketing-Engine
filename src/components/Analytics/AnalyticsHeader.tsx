import { Activity, Users, DollarSign, Gauge, BarChart3, Cpu, MessageSquare, Target } from 'lucide-react';
import { RefreshButton } from './RefreshButton';

interface AnalyticsHeaderProps {
  activeTab: string;
  onTabChange: (tab: 'executive' | 'operations' | 'users' | 'finance' | 'technical' | 'models' | 'feedback' | 'slo') => void;
}

export function AnalyticsHeader({ activeTab, onTabChange }: AnalyticsHeaderProps) {
  const tabs = [
    { id: 'executive', label: 'Executive', icon: BarChart3 },
    { id: 'operations', label: 'Operations', icon: Activity },
    { id: 'models', label: 'Models', icon: Cpu },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'technical', label: 'Technical', icon: Gauge },
    { id: 'slo', label: 'SLO', icon: Target },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  ] as const;

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/20 backdrop-blur-md'
                    : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10 hover:text-white/80 backdrop-blur-sm'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      <RefreshButton />
    </div>
  );
}
