import { KPICard } from './KPICard';
import { useUserSegments, useChurnRiskUsers } from '../../hooks/useAnalytics';
import { Users, Award, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function UserIntelligence() {
  // Note: Removed unused dateRange - data comes from pre-segmented useUserSegments
  const { segments, loading: segmentsLoading } = useUserSegments();
  const { users: churnRiskUsers, loading: churnLoading } = useChurnRiskUsers(50);

  if (segmentsLoading || churnLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white/80" />
            <span className="text-white/70">Loading user intelligence...</span>
          </div>
        </div>
      </div>
    );
  }

  // Use all segments (no filter - data is pre-segmented)
  const filteredSegments = segments;

  const segmentCounts = filteredSegments.reduce((acc: Record<string, number>, user) => {
    const segment = user.usage_segment || 'Unknown';
    acc[segment] = (acc[segment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const segmentData = Object.entries(segmentCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const churnData = churnRiskUsers.reduce((acc: Record<string, number>, user) => {
    const category = user.risk_category || 'Unknown';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  // Filter for specific segments used in KPIs
  const powerUsers = filteredSegments.filter(s => s.usage_segment === 'Power User');
  const atRiskUsers = filteredSegments.filter(s => s.churn_risk_segment !== 'Active');

  const churnChartData = Object.entries(churnData).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">User Intelligence</h2>
        <p className="text-white/60">User behavior, segments, and engagement</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Users"
          value={segments.length}
          icon={Users}
          status="neutral"
        />
        <KPICard
          title="Power Users"
          value={powerUsers.length}
          icon={Award}
          status="good"
          subtitle={`${((powerUsers.length / segments.length) * 100).toFixed(1)}% of total`}
        />
        <KPICard
          title="At Risk Users"
          value={atRiskUsers.length}
          icon={AlertCircle}
          status={atRiskUsers.length > segments.length * 0.3 ? 'critical' : 'warning'}
          subtitle={`${((atRiskUsers.length / segments.length) * 100).toFixed(1)}% of total`}
        />
        <KPICard
          title="Churn Risk"
          value={churnRiskUsers.length}
          icon={AlertCircle}
          status={churnRiskUsers.length > 10 ? 'critical' : 'warning'}
          subtitle="High priority"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Segments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={segmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {segmentData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Churn Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={churnChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: ${entry.value}`} // eslint-disable-line @typescript-eslint/no-explicit-any
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {churnChartData.map((entry: any, index) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.name === 'Critical' ? '#ef4444' :
                      entry.name === 'High' ? '#f59e0b' :
                      entry.name === 'Medium' ? '#eab308' : '#10b981'
                    } 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Users Table */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Power Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm font-medium text-white/60 pb-3">User ID</th>
                <th className="text-left text-sm font-medium text-white/60 pb-3">Total Calls</th>
                <th className="text-left text-sm font-medium text-white/60 pb-3">Total Spent</th>
                <th className="text-left text-sm font-medium text-white/60 pb-3">Features Used</th>
                <th className="text-left text-sm font-medium text-white/60 pb-3">Last Active</th>
                <th className="text-left text-sm font-medium text-white/60 pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {powerUsers.slice(0, 10).map((user, idx) => (
                <tr key={user.user_id || idx} className="border-b border-white/5">
                  <td className="py-3 text-sm text-white/80 font-mono">{user.user_id ? user.user_id.slice(0, 8) + '...' : 'N/A'}</td>
                  <td className="py-3 text-sm text-white">{user.total_calls?.toLocaleString() || '0'}</td>
                  <td className="py-3 text-sm text-white">${Number(user.total_spent || 0).toFixed(2)}</td>
                  <td className="py-3 text-sm text-white">{user.features_used || 'N/A'}</td>
                  <td className="py-3 text-sm text-white/60">{user.last_active ? new Date(user.last_active).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.churn_risk_segment === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                      user.churn_risk_segment === 'Low Churn Risk' ? 'bg-blue-500/10 text-blue-400' :
                      user.churn_risk_segment === 'Medium Churn Risk' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {user.churn_risk_segment || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Churn Risk Users */}
      {churnRiskUsers.length > 0 && (
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            High Churn Risk Users
          </h3>
          <div className="space-y-2">
            {churnRiskUsers.slice(0, 5).map((user: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
              <div key={user.user_id} className="backdrop-blur-sm bg-white/[0.02] border border-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-sm text-white/80">{user.user_id.slice(0, 8)}...</div>
                    <div className="text-sm text-white/60">{user.days_inactive} days inactive</div>
                    <div className="text-sm text-white/60">Lifetime: ${Number(user.lifetime_cost || 0).toFixed(2)}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg font-medium text-sm ${
                    user.risk_category === 'Critical' ? 'bg-red-500/20 text-red-400' :
                    user.risk_category === 'High' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {user.risk_category} Risk (Score: {user.churn_score})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
