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
    <div className="flex items-center gap-4">
      <div className="terminal-nav">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`terminal-nav__item flex items-center gap-2 ${
                isActive ? 'terminal-nav__item--active' : ''
              }`}
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
