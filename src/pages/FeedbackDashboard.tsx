/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ThumbsUp, ThumbsDown, Meh, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeedbackRecord {
  id: string;
  user_id: string;
  touchpoint_type: string;
  rating: number;
  rating_label: string;
  comments: string | null;
  context_data: any;
  created_at: string;
}

interface FeedbackStats {
  total: number;
  good: number;
  notBad: number;
  bad: number;
  byTouchpoint: Record<string, { total: number; good: number; notBad: number; bad: number }>;
}

export default function FeedbackDashboard() {
  const navigate = useNavigate();
  const [feedbackList, setFeedbackList] = useState<FeedbackRecord[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    good: 0,
    notBad: 0,
    bad: 0,
    byTouchpoint: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFeedback = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
      const response = await fetch(`${apiUrl}/api/feedback/history?limit=100`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFeedbackList(data.feedback || []);
        calculateStats(data.feedback || []);
      }
    } catch (error) {
      console.error('[FeedbackDashboard] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (feedback: FeedbackRecord[]) => {
    const stats: FeedbackStats = {
      total: feedback.length,
      good: 0,
      notBad: 0,
      bad: 0,
      byTouchpoint: {}
    };

    feedback.forEach((item) => {
      // Overall stats
      if (item.rating === 2) stats.good++;
      else if (item.rating === 1) stats.notBad++;
      else if (item.rating === 0) stats.bad++;

      // By touchpoint
      if (!stats.byTouchpoint[item.touchpoint_type]) {
        stats.byTouchpoint[item.touchpoint_type] = { total: 0, good: 0, notBad: 0, bad: 0 };
      }
      stats.byTouchpoint[item.touchpoint_type].total++;
      if (item.rating === 2) stats.byTouchpoint[item.touchpoint_type].good++;
      else if (item.rating === 1) stats.byTouchpoint[item.touchpoint_type].notBad++;
      else if (item.rating === 0) stats.byTouchpoint[item.touchpoint_type].bad++;
    });

    setStats(stats);
  };

  const getRatingIcon = (rating: number) => {
    if (rating === 2) return <ThumbsUp className="h-5 w-5 text-green-400" />;
    if (rating === 1) return <Meh className="h-5 w-5 text-orange-400" />;
    return <ThumbsDown className="h-5 w-5 text-red-400" />;
  };

  const getRatingColor = (rating: number) => {
    if (rating === 2) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (rating === 1) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#0f1419] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="rounded-lg p-2 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold">Feedback Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-white/60">Loading feedback...</div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<MessageSquare className="h-6 w-6" />}
                label="Total Feedback"
                value={stats.total}
                color="blue"
              />
              <StatCard
                icon={<ThumbsUp className="h-6 w-6" />}
                label="Good"
                value={stats.good}
                percentage={stats.total > 0 ? (stats.good / stats.total * 100).toFixed(1) : '0'}
                color="green"
              />
              <StatCard
                icon={<Meh className="h-6 w-6" />}
                label="Not Bad"
                value={stats.notBad}
                percentage={stats.total > 0 ? (stats.notBad / stats.total * 100).toFixed(1) : '0'}
                color="orange"
              />
              <StatCard
                icon={<ThumbsDown className="h-6 w-6" />}
                label="Bad"
                value={stats.bad}
                percentage={stats.total > 0 ? (stats.bad / stats.total * 100).toFixed(1) : '0'}
                color="red"
              />
            </div>

            {/* By Touchpoint */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Feedback by Touchpoint
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.byTouchpoint).map(([touchpoint, data]) => (
                  <motion.div
                    key={touchpoint}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur"
                  >
                    <h3 className="font-medium mb-3 text-white/90 capitalize">
                      {touchpoint.replace(/_/g, ' ')}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Total:</span>
                        <span className="font-semibold">{data.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-400">Good:</span>
                        <span>{data.good} ({data.total > 0 ? ((data.good / data.total) * 100).toFixed(0) : 0}%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-400">Not Bad:</span>
                        <span>{data.notBad} ({data.total > 0 ? ((data.notBad / data.total) * 100).toFixed(0) : 0}%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-400">Bad:</span>
                        <span>{data.bad} ({data.total > 0 ? ((data.bad / data.total) * 100).toFixed(0) : 0}%)</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Feedback List */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Feedback
              </h2>
              <div className="space-y-3">
                {feedbackList.slice(0, 20).map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getRatingIcon(item.rating)}
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getRatingColor(item.rating)}`}>
                            {item.rating_label}
                          </span>
                          <span className="text-white/60 text-xs capitalize">
                            {item.touchpoint_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {item.comments && (
                          <p className="text-sm text-white/80 mt-2">{item.comments}</p>
                        )}
                        {item.context_data && (
                          <div className="mt-2 text-xs text-white/50">
                            {item.context_data.generationCount && `Generation: ${item.context_data.generationCount}`}
                            {item.context_data.cardsGenerated && ` • Cards: ${item.context_data.cardsGenerated}`}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-white/50">
                        {new Date(item.created_at).toLocaleDateString()}
                        <br />
                        {new Date(item.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, percentage, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  percentage?: string;
  color: 'blue' | 'green' | 'orange' | 'red';
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl border bg-gradient-to-br backdrop-blur p-6 ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-white/70">{icon}</div>
        {percentage && (
          <span className="text-xs text-white/50">{percentage}%</span>
        )}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-white/60">{label}</div>
    </motion.div>
  );
}
