/**
 * BADU Analytics Dashboard
 * Displays metrics from the 9 SQL views for monitoring performance, costs, and user engagement
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Activity,
  Zap,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Database,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface PerformanceMetric {
  date: string
  total_requests: number
  avg_latency_ms: number
  p95_latency_ms: number
  avg_retrieval_ms: number
  avg_llm_ms: number
  avg_chunks: number
  total_tokens: number
  total_cost: number
  successful_requests: number
  failed_requests: number
  success_rate: number
}

interface ModelUsage {
  model: string
  panel: string
  request_count: number
  avg_latency_ms: number
  total_tokens: number
  avg_tokens_per_request: number
  total_cost: number
  avg_cost_per_request: number
  cost_per_1k_tokens: number
  successful: number
  success_rate: number
}

interface UserEngagement {
  week: string
  active_users: number
  total_sessions: number
  avg_messages_per_session: number
  engaged_users: number
  avg_session_duration_min: number
}

interface FeedbackAnalysis {
  week: string
  avg_rating: number
  feedback_count: number
  positive_feedback: number
  negative_feedback: number
  positive_rate: number
  common_tags: string
}

export function BaduDashboard() {
  const [performance, setPerformance] = useState<PerformanceMetric[]>([])
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([])
  const [engagement, setEngagement] = useState<UserEngagement[]>([])
  const [feedback, setFeedback] = useState<FeedbackAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch from SQL views
      const [perfData, modelData, engagementData, feedbackData] = await Promise.all([
        supabase.from('badu_performance_overview').select('*').order('date', { ascending: false }).limit(30),
        supabase.from('badu_model_usage').select('*').order('request_count', { ascending: false }).limit(20),
        supabase.from('badu_user_engagement').select('*').order('week', { ascending: false }).limit(12),
        supabase.from('badu_feedback_analysis').select('*').order('week', { ascending: false }).limit(12),
      ])

      if (perfData.data) setPerformance(perfData.data as any)
      if (modelData.data) setModelUsage(modelData.data as any)
      if (engagementData.data) setEngagement(engagementData.data as any)
      if (feedbackData.data) setFeedback(feedbackData.data as any)
    } catch (err) {
      console.error('[BADU Dashboard] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="text-white/60">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="text-red-400">Error: {error}</div>
      </div>
    )
  }

  const latestPerf = performance[0]
  const latestEngagement = engagement[0]
  const latestFeedback = feedback[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">BADU Analytics</h1>
          <p className="text-white/60">Real-time insights into BADU performance and user engagement</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Avg Latency"
            value={`${latestPerf?.avg_latency_ms?.toFixed(0) || 0}ms`}
            subtitle={`P95: ${latestPerf?.p95_latency_ms?.toFixed(0) || 0}ms`}
            icon={<Zap className="h-5 w-5" />}
            trend={calculateTrend(performance.slice(0, 2), 'avg_latency_ms', true)}
            trendLabel="vs yesterday"
          />
          <MetricCard
            title="Success Rate"
            value={`${latestPerf?.success_rate?.toFixed(1) || 0}%`}
            subtitle={`${latestPerf?.successful_requests || 0}/${latestPerf?.total_requests || 0} successful`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            trend={calculateTrend(performance.slice(0, 2), 'success_rate')}
            trendLabel="vs yesterday"
          />
          <MetricCard
            title="Daily Cost"
            value={`$${latestPerf?.total_cost?.toFixed(2) || '0.00'}`}
            subtitle={`${latestPerf?.total_tokens?.toLocaleString() || 0} tokens`}
            icon={<DollarSign className="h-5 w-5" />}
            trend={calculateTrend(performance.slice(0, 2), 'total_cost', true)}
            trendLabel="vs yesterday"
          />
          <MetricCard
            title="Active Users"
            value={latestEngagement?.active_users?.toString() || '0'}
            subtitle={`${latestEngagement?.total_sessions || 0} sessions`}
            icon={<Users className="h-5 w-5" />}
            trend={calculateTrend(engagement.slice(0, 2), 'active_users')}
            trendLabel="vs last week"
          />
        </div>

        {/* Model Usage Table */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-white text-lg font-semibold flex items-center gap-2 mb-4">
            <Database className="h-5 w-5" />
            Model Usage & Costs
          </h2>
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-white/60">
                    <th className="text-left py-3 px-4">Model</th>
                    <th className="text-left py-3 px-4">Panel</th>
                    <th className="text-right py-3 px-4">Requests</th>
                    <th className="text-right py-3 px-4">Avg Latency</th>
                    <th className="text-right py-3 px-4">Total Cost</th>
                    <th className="text-right py-3 px-4">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {modelUsage.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-blue-400 font-mono text-xs">{row.model}</td>
                      <td className="py-3 px-4 text-white/80 capitalize">{row.panel}</td>
                      <td className="py-3 px-4 text-right text-white/80">{row.request_count.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-white/80">{row.avg_latency_ms.toFixed(0)}ms</td>
                      <td className="py-3 px-4 text-right text-emerald-400">${row.total_cost.toFixed(3)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={row.success_rate >= 95 ? 'text-green-400' : 'text-yellow-400'}>
                          {row.success_rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* User Satisfaction */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-white text-lg font-semibold flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5" />
            User Satisfaction
          </h2>
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/30 rounded-lg p-4">
                <div className="text-white/60 text-sm mb-1">Average Rating</div>
                <div className="text-2xl font-bold text-white">
                  {latestFeedback?.avg_rating?.toFixed(2) || 'N/A'} / 5.0
                </div>
                <div className="text-xs text-white/40 mt-1">
                  {latestFeedback?.feedback_count || 0} responses
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-4">
                <div className="text-white/60 text-sm mb-1">Positive Rate</div>
                <div className="text-2xl font-bold text-green-400">
                  {latestFeedback?.positive_rate?.toFixed(1) || 0}%
                </div>
                <div className="text-xs text-white/40 mt-1">
                  {latestFeedback?.positive_feedback || 0} positive
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-4">
                <div className="text-white/60 text-sm mb-1">Engagement</div>
                <div className="text-2xl font-bold text-blue-400">
                  {latestEngagement?.avg_messages_per_session?.toFixed(1) || 0}
                </div>
                <div className="text-xs text-white/40 mt-1">messages / session</div>
              </div>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  trend?: number
  trendLabel?: string
}

function MetricCard({ title, value, subtitle, icon, trend, trendLabel }: MetricCardProps) {
  const isPositive = trend !== undefined && trend > 0
  const isNegative = trend !== undefined && trend < 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-white/60 text-sm font-medium">{title}</div>
        <div className="text-blue-400">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {subtitle && <div className="text-xs text-white/40 mb-2">{subtitle}</div>}
      {trend !== undefined && (
        <div className="flex items-center gap-1 text-xs">
          {isPositive && <TrendingUp className="h-3 w-3 text-green-400" />}
          {isNegative && <TrendingDown className="h-3 w-3 text-red-400" />}
          {!isPositive && !isNegative && <Activity className="h-3 w-3 text-white/40" />}
          <span className={isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-white/40'}>
            {Math.abs(trend).toFixed(1)}% {trendLabel}
          </span>
        </div>
      )}
    </motion.div>
  )
}

// Calculate trend between two data points
function calculateTrend(
  data: any[],
  key: string,
  invertPositive: boolean = false
): number | undefined {
  if (!data || data.length < 2 || !data[0] || !data[1]) return undefined

  const current = data[0][key]
  const previous = data[1][key]

  if (current === undefined || previous === undefined || previous === 0) return undefined

  const change = ((current - previous) / previous) * 100
  return invertPositive ? -change : change
}
