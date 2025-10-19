import { ExecutiveOverview } from '../components/Analytics/ExecutiveOverview';
import { RealtimeOperations } from '../components/Analytics/RealtimeOperations';
import { UserIntelligence } from '../components/Analytics/UserIntelligence';
import { FinancialAnalytics } from '../components/Analytics/FinancialAnalytics';
import { TechnicalPerformance } from '../components/Analytics/TechnicalPerformance';
import { ModelUsage } from '../components/Analytics/ModelUsage';
import { FeedbackAnalytics } from '../components/Analytics/FeedbackAnalytics';
import { DeploymentHistory } from '../components/Analytics/DeploymentHistory';
import { ExperimentDashboard } from '../components/Analytics/ExperimentDashboard';
import { CapacityForecasting } from '../components/Analytics/CapacityForecasting';
import { IncidentTimeline } from '../components/Analytics/IncidentTimeline';
import { AnalyticsHeader } from '../components/Analytics/AnalyticsHeader';
import { KeyboardShortcuts } from '../components/Analytics/KeyboardShortcuts';
import { useState } from 'react';
import { BarChart3, Layers } from 'lucide-react';

type TabType = 'executive' | 'operations' | 'users' | 'finance' | 'technical' | 'models' | 'feedback' | 'deployments' | 'experiments' | 'capacity' | 'incidents';

export default function StandaloneAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('executive');
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] overflow-hidden">
      {/* Subtle grid pattern for depth */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Subtle gradient overlay for depth */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)
          `
        }}
      />

      <div className="relative z-10 h-screen w-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/10">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">SINAIQ Dashboard</h1>
                  <p className="text-sm text-white/50">Real-time insights & performance metrics</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <AnalyticsHeader activeTab={activeTab} onTabChange={setActiveTab} />
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    showAdvanced 
                      ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300' 
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                  title="Toggle advanced panels"
                >
                  <Layers className="w-4 h-4" />
                  <span>Advanced</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Navigation (when enabled) */}
        {showAdvanced && (
          <div className="sticky top-[73px] z-40 backdrop-blur-xl bg-black/40 border-b border-white/10">
            <div className="max-w-[1800px] mx-auto px-6 py-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('deployments')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === 'deployments'
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'text-white/60 hover:bg-white/10'
                  }`}
                >
                  Deployments
                </button>
                <button
                  onClick={() => setActiveTab('incidents')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === 'incidents'
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'text-white/60 hover:bg-white/10'
                  }`}
                >
                  Incidents
                </button>
                <button
                  onClick={() => setActiveTab('experiments')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === 'experiments'
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'text-white/60 hover:bg-white/10'
                  }`}
                >
                  Experiments
                </button>
                <button
                  onClick={() => setActiveTab('capacity')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === 'capacity'
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'text-white/60 hover:bg-white/10'
                  }`}
                >
                  Capacity Forecasting
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-[1800px] mx-auto px-6 py-8 pb-20">
          {activeTab === 'executive' && <ExecutiveOverview />}
          {activeTab === 'operations' && <RealtimeOperations />}
          {activeTab === 'models' && <ModelUsage />}
          {activeTab === 'users' && <UserIntelligence />}
          {activeTab === 'finance' && <FinancialAnalytics />}
          {activeTab === 'technical' && <TechnicalPerformance />}
          {activeTab === 'feedback' && <FeedbackAnalytics />}
          {activeTab === 'deployments' && <DeploymentHistory />}
          {activeTab === 'incidents' && <IncidentTimeline />}
          {activeTab === 'experiments' && <ExperimentDashboard />}
          {activeTab === 'capacity' && <CapacityForecasting />}
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 backdrop-blur-md bg-black/60 border-t border-white/10 py-3">
          <div className="max-w-[1800px] mx-auto px-6">
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>© 2025 SINAIQ Dashboard</span>
              <div className="flex items-center gap-4">
                <span>Powered by Supabase</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Global Keyboard Shortcuts */}
        <KeyboardShortcuts onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
