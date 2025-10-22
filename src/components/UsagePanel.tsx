import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Activity, TrendingUp, DollarSign, Zap } from 'lucide-react';

interface UsageStats {
  content_generations_used: number;
  content_generations_limit: number;
  image_generations_used: number;
  image_generations_limit: number;
  video_generations_used: number;
  video_generations_limit: number;
  chat_messages_used: number;
  chat_messages_limit: number;
  current_month_cost: number;
  lifetime_cost: number;
  plan_name: string;
}

interface RecentUsage {
  id: string;
  service_type: string;
  provider: string;
  model: string | null;
  total_cost: number;
  status: string;
  created_at: string | null;
}

export function UsagePanel() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [recentUsage, setRecentUsage] = useState<RecentUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUsageData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadUsageData() {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Load subscription stats
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError) throw subError;
      
      // Map subscription data to UsageStats format
      if (subscription) {
        setStats({
          content_generations_used: 0,
          content_generations_limit: 100,
          image_generations_used: 0,
          image_generations_limit: 100,
          video_generations_used: 0,
          video_generations_limit: 10,
          chat_messages_used: 0,
          chat_messages_limit: 1000,
          current_month_cost: 0,
          lifetime_cost: 0,
          plan_name: subscription.plan_name || 'Free',
        });
      }

      // Load recent usage
      const { data: usage, error: usageError } = await supabase
        .from('api_usage')
        .select('id, service_type, provider, model, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (usageError) throw usageError;
      
      // Map usage data to include total_cost (even if column doesn't exist)
      const mappedUsage: RecentUsage[] = (usage || []).map(item => ({
        ...item,
        total_cost: 0, // Default value since column doesn't exist yet
      }));
      
      setRecentUsage(mappedUsage);
    } catch (error) {
      console.error('Error loading usage:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-white/60">
        <p>No usage data available</p>
      </div>
    );
  }

  const usageItems = [
    {
      label: 'Content Generations',
      used: stats.content_generations_used,
      limit: stats.content_generations_limit,
      icon: Activity,
      color: 'emerald'
    },
    {
      label: 'Images Generated',
      used: stats.image_generations_used,
      limit: stats.image_generations_limit,
      icon: TrendingUp,
      color: 'blue'
    },
    {
      label: 'Video Generations',
      used: stats.video_generations_used,
      limit: stats.video_generations_limit,
      icon: Zap,
      color: 'purple'
    },
    {
      label: 'Chat Messages',
      used: stats.chat_messages_used,
      limit: stats.chat_messages_limit,
      icon: Activity,
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Plan Info */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <h3 className="text-lg font-semibold text-white mb-2">{stats.plan_name}</h3>
        <p className="text-sm text-white/60">
          Track your API usage and costs across all services
        </p>
      </div>

      {/* Usage Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {usageItems.map((item) => {
          const percentage = (item.used / item.limit) * 100;
          const Icon = item.icon;
          
          return (
            <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-white/75" />
                <span className="text-sm font-medium text-white/90">{item.label}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-white">{item.used.toLocaleString()}</span>
                  <span className="text-sm text-white/60">/ {item.limit.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-white/60">{percentage.toFixed(1)}% used</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cost Summary */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-4 w-4 text-white/75" />
          <h3 className="text-sm font-semibold text-white/90">Cost Summary</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-white/60 mb-1">This Month</p>
            <p className="text-xl font-bold text-white">${stats.current_month_cost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">Lifetime</p>
            <p className="text-xl font-bold text-white">${stats.lifetime_cost.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <h3 className="text-sm font-semibold text-white/90 mb-3">Recent Activity</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {recentUsage.length === 0 ? (
            <p className="text-sm text-white/60 text-center py-4">No recent activity</p>
          ) : (
            recentUsage.map((usage) => (
              <div key={usage.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {usage.service_type} · {usage.provider}
                  </p>
                  <p className="text-xs text-white/60 truncate">{usage.model}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-medium text-white">${usage.total_cost.toFixed(4)}</p>
                  <p className="text-xs text-white/60">
                    {usage.created_at ? new Date(usage.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Demo Notice */}
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-300">
          🎉 <strong>Demo Mode:</strong> You have unlimited access to all features. Usage tracking is enabled for analytics purposes.
        </p>
      </div>
    </div>
  );
}

export default UsagePanel;
