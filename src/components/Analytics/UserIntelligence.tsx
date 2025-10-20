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
        <div className="terminal-panel p-8">
          <div className="terminal-loader">
            <div className="terminal-loader__spinner">|</div>
            <span>Loading user intelligence...</span>
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

  const COLORS = ['#33ff33', '#00ff00', '#66ff66', '#99ff99'];

  // Filter for specific segments used in KPIs
  const powerUsers = filteredSegments.filter(s => s.usage_segment === 'Power User');
  const atRiskUsers = filteredSegments.filter(s => s.churn_risk_segment !== 'Active');

  const churnChartData = Object.entries(churnData).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6">
      <div className="terminal-panel p-6">
        <h2 className="text-3xl font-bold terminal-text-glow terminal-uppercase mb-2" style={{color: '#33ff33'}}>User Intelligence</h2>
        <p className="text-[#7a7a7a]">User behavior, segments, and engagement</p>
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
          subtitle={segments.length > 0 ? `${((powerUsers.length / segments.length) * 100).toFixed(1)}% of total` : '0% of total'}
        />
        <KPICard
          title="At Risk Users"
          value={atRiskUsers.length}
          icon={AlertCircle}
          status={atRiskUsers.length > segments.length * 0.3 ? 'critical' : 'warning'}
          subtitle={segments.length > 0 ? `${((atRiskUsers.length / segments.length) * 100).toFixed(1)}% of total` : '0% of total'}
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
        <div className="terminal-panel p-6">
          <h3 className="terminal-panel__title mb-4">User Segments</h3>
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
                  backgroundColor: 'rgba(11,13,19,0.95)', 
                  border: '1px solid #33ff33',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#33ff33' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="terminal-panel p-6">
          <h3 className="terminal-panel__title mb-4">Churn Risk Distribution</h3>
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
                      entry.name === 'Critical' ? '#ff3333' :
                      entry.name === 'High' ? '#ffff33' :
                      entry.name === 'Medium' ? '#ffff66' : '#33ff33'
                    } 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(11,13,19,0.95)', 
                  border: '1px solid #33ff33',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#33ff33' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Users Table */}
      <div className="terminal-panel p-6">
        <h3 className="terminal-panel__title mb-4">Top Power Users</h3>
        <div className="overflow-x-auto terminal-scroll">
          <table className="terminal-table">
            <thead>
              <tr>
                <th className="text-left">User ID</th>
                <th className="text-left">Total Calls</th>
                <th className="text-left">Total Spent</th>
                <th className="text-left">Features Used</th>
                <th className="text-left">Last Active</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {powerUsers.slice(0, 10).map((user, idx) => (
                <tr key={user.user_id || idx}>
                  <td className="font-mono">{user.user_id ? user.user_id.slice(0, 8) + '...' : 'N/A'}</td>
                  <td>{user.total_calls?.toLocaleString() || '0'}</td>
                  <td>${Number(user.total_spent || 0).toFixed(2)}</td>
                  <td>{user.features_used || 'N/A'}</td>
                  <td className="terminal-text-muted">{user.last_active ? new Date(user.last_active).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className={`terminal-badge ${
                      user.churn_risk_segment === 'Active' ? 'terminal-badge--active' :
                      user.churn_risk_segment === 'Low Churn Risk' ? '' :
                      user.churn_risk_segment === 'Medium Churn Risk' ? 'terminal-badge--warning' :
                      'terminal-badge--alert'
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
        <div className="terminal-panel p-6">
          <h3 className="terminal-panel__title mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#ff3333]" />
            High Churn Risk Users
          </h3>
          <div className="terminal-list">
            {churnRiskUsers.slice(0, 5).map((user: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
              <div key={user.user_id} className="terminal-list__row">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-sm terminal-text">{user.user_id.slice(0, 8)}...</div>
                    <div className="text-sm terminal-text-muted">{user.days_inactive} days inactive</div>
                    <div className="text-sm terminal-text-muted">Lifetime: ${Number(user.lifetime_cost || 0).toFixed(2)}</div>
                  </div>
                  <span className={`terminal-badge ${
                    user.risk_category === 'Critical' ? 'terminal-badge--alert' :
                    user.risk_category === 'High' ? 'terminal-badge--warning' :
                    'terminal-badge--warning'
                  }`}>
                    <span className={`terminal-led ${
                      user.risk_category === 'Critical' ? 'terminal-led--alert' :
                      'terminal-led--warning'
                    }`}></span>
                    {user.risk_category} Risk (Score: {user.churn_score})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
