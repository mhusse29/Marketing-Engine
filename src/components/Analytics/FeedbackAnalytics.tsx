import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, TrendingUp, Clock, Users, Smile, Meh, Frown, Heart } from 'lucide-react';
import { KPICard } from './KPICard';

interface FeedbackSummary {
  touchpoint_type: string;
  total_feedback: number;
  bad_count: number;
  not_bad_count: number;
  good_count: number;
  avg_rating: number;
  satisfaction_percentage: number;
  avg_time_spent: number;
}

interface RecentFeedback {
  id: string;
  touchpoint_type: string;
  rating: number;
  rating_label: string;
  comments: string | null;
  time_spent_seconds: number | null;
  created_at: string;
  context_data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const touchpointLabels: Record<string, string> = {
  card_generation: 'Card Generation',
  window_open: 'Panel/Window',
  full_generation: 'Full Generation',
  session_end: 'Session End',
  image_generation: 'Image Generation',
  video_generation: 'Video Generation',
  chat_interaction: 'Chat (BADU)',
  feature_usage: 'General Features'
};

const ratingIcons = {
  0: { icon: Frown, color: 'text-[#ff3333]', bg: 'bg-[#111111] border border-[#ff3333]', label: 'BAD' },
  1: { icon: Meh, color: 'text-[#ffff00]', bg: 'bg-[#111111] border border-[#ffff00]', label: 'NOT BAD' },
  2: { icon: Smile, color: 'text-[#00ff00]', bg: 'bg-[#111111] border border-[#00ff00]', label: 'GOOD' }
};

export function FeedbackAnalytics() {
  const [summary, setSummary] = useState<FeedbackSummary[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<RecentFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [overallSatisfaction, setOverallSatisfaction] = useState(0);

  useEffect(() => {
    loadFeedbackData();
    const interval = setInterval(loadFeedbackData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadFeedbackData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
      
      // Get summary from backend server
      const summaryRes = await fetch(`${apiUrl}/api/feedback/summary`, {
        signal: AbortSignal.timeout(10000)
      });
      const summaryData = await summaryRes.json();
      
      if (summaryData.success && summaryData.summary) {
        setSummary(summaryData.summary);
        
        // Calculate totals
        const total = summaryData.summary.reduce((sum: number, item: FeedbackSummary) => 
          sum + item.total_feedback, 0
        );
        setTotalFeedback(total);
        
        // Calculate overall satisfaction
        const totalGood = summaryData.summary.reduce((sum: number, item: FeedbackSummary) => 
          sum + item.good_count, 0
        );
        const overallSat = total > 0 ? (totalGood / total) * 100 : 0;
        setOverallSatisfaction(overallSat);
      }

      // Get recent feedback from backend server
      const recentRes = await fetch(`${apiUrl}/api/feedback/history?limit=20`, {
        signal: AbortSignal.timeout(10000)
      });
      const recentData = await recentRes.json();
      
      if (recentData.success && recentData.feedback) {
        setRecentFeedback(recentData.feedback);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch feedback data:', error);
      setError('Failed to load feedback data. Please check API connection.');
    } finally {
      setLoading(false);
    }
  };

  const getRatingDistribution = () => {
    const total = summary.reduce((sum, item) => sum + item.total_feedback, 0);
    const bad = summary.reduce((sum, item) => sum + item.bad_count, 0);
    const notBad = summary.reduce((sum, item) => sum + item.not_bad_count, 0);
    const good = summary.reduce((sum, item) => sum + item.good_count, 0);

    return [
      { label: 'Good', count: good, percentage: total > 0 ? (good / total) * 100 : 0, color: 'bg-[#00ff00]' },
      { label: 'Not Bad', count: notBad, percentage: total > 0 ? (notBad / total) * 100 : 0, color: 'bg-[#ffff00]' },
      { label: 'Bad', count: bad, percentage: total > 0 ? (bad / total) * 100 : 0, color: 'bg-[#ff3333]' }
    ];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="terminal-panel p-8">
        <div className="terminal-loader">
          <div className="terminal-loader__spinner">|</div>
          <span>Loading feedback data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="terminal-panel p-8">
        <div className="text-center">
          <div className="text-[#ff3333] text-lg mb-2 terminal-uppercase">⚠️ {error}</div>
          <p className="terminal-text-muted text-sm">Check that API server is running at {import.meta.env.VITE_API_URL || 'http://localhost:8787'}</p>
        </div>
      </div>
    );
  }

  const distribution = getRatingDistribution();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Feedback"
          value={totalFeedback.toString()}
          icon={MessageSquare}
          status="neutral"
        />
        <KPICard
          title="Satisfaction Rate"
          value={`${overallSatisfaction.toFixed(1)}%`}
          icon={Heart}
          change={overallSatisfaction > 70 ? overallSatisfaction - 70 : undefined}
          status={overallSatisfaction > 70 ? "good" : overallSatisfaction > 50 ? "warning" : "critical"}
        />
        <KPICard
          title="Touchpoints"
          value={summary.length.toString()}
          icon={Users}
          status="neutral"
        />
        <KPICard
          title="Avg Response Time"
          value={
            summary.length > 0
              ? `${(summary.reduce((sum, item) => sum + (item.avg_time_spent || 0), 0) / summary.length).toFixed(0)}s`
              : '0s'
          }
          icon={Clock}
          status="neutral"
        />
      </div>

      {/* Rating Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="terminal-panel p-6"
      >
        <h3 className="terminal-panel__title text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#33ff33]" />
          Rating Distribution
        </h3>
        <div className="space-y-4">
          {distribution.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="terminal-text-muted">{item.label}</span>
                <span className="terminal-metric font-medium">
                  {item.count} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-[#111111] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full ${item.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Feedback by Touchpoint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="terminal-panel p-6"
      >
        <h3 className="terminal-panel__title text-lg mb-4">Feedback by Touchpoint</h3>
        <div className="space-y-3">
          {summary.sort((a, b) => b.total_feedback - a.total_feedback).map((item) => (
            <div key={item.touchpoint_type} className="terminal-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="terminal-metric font-medium">
                  {touchpointLabels[item.touchpoint_type] || item.touchpoint_type}
                </span>
                <span className="terminal-text-muted text-sm">{item.total_feedback} responses</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center p-2 bg-[#111111] border border-[#00ff00]">
                  <div className="text-[#00ff00] font-bold">{item.good_count}</div>
                  <div className="text-[#00ff00] text-xs">Good</div>
                </div>
                <div className="text-center p-2 bg-[#111111] border border-[#ffff00]">
                  <div className="text-[#ffff00] font-bold">{item.not_bad_count}</div>
                  <div className="text-[#ffff00] text-xs">Not Bad</div>
                </div>
                <div className="text-center p-2 bg-[#111111] border border-[#ff3333]">
                  <div className="text-[#ff3333] font-bold">{item.bad_count}</div>
                  <div className="text-[#ff3333] text-xs">Bad</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="terminal-text-muted">
                  Satisfaction: {item.satisfaction_percentage.toFixed(1)}%
                </span>
                {item.avg_time_spent > 0 && (
                  <span className="terminal-text-muted">
                    Avg time: {item.avg_time_spent.toFixed(0)}s
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="terminal-panel p-6"
      >
        <h3 className="terminal-panel__title text-lg mb-4">Recent Feedback</h3>
        <div className="space-y-3">
          {recentFeedback.length === 0 ? (
            <div className="text-center py-8 terminal-text-muted">No feedback received yet</div>
          ) : (
            recentFeedback.map((feedback) => {
              const ratingInfo = ratingIcons[feedback.rating as keyof typeof ratingIcons];
              const Icon = ratingInfo.icon;
              
              return (
                <div
                  key={feedback.id}
                  className="terminal-card p-4 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${ratingInfo.bg}`}>
                      <Icon className={`w-4 h-4 ${ratingInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="terminal-metric font-medium text-sm">
                          {touchpointLabels[feedback.touchpoint_type] || feedback.touchpoint_type}
                        </span>
                        <span className="terminal-text-muted text-xs">
                          {formatTimeAgo(feedback.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium ${ratingInfo.color}`}>
                          {feedback.rating_label}
                        </span>
                        {feedback.time_spent_seconds && (
                          <span className="terminal-text-muted text-xs">
                            • {feedback.time_spent_seconds}s session
                          </span>
                        )}
                      </div>
                      {feedback.comments && (
                        <p className="terminal-text-muted text-sm mt-2 italic">
                          "{feedback.comments}"
                        </p>
                      )}
                      {feedback.context_data?.feedbackType && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-[#111111] border border-[#33ff33] text-[#33ff33]">
                          {feedback.context_data.feedbackType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
