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
import { SLODashboard } from '../components/Analytics/SLODashboard';
import { AnalyticsHeader } from '../components/Analytics/AnalyticsHeader';
import { KeyboardShortcuts } from '../components/Analytics/KeyboardShortcuts';
import { useState, useEffect } from 'react';
import { Terminal, Layers } from 'lucide-react';

type TabType = 'executive' | 'operations' | 'users' | 'finance' | 'technical' | 'models' | 'feedback' | 'slo' | 'deployments' | 'experiments' | 'capacity' | 'incidents';

export default function StandaloneAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('executive');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Set theme on document root for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'terminal');
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  return (
    <div className="terminal-app fixed inset-0 overflow-hidden" data-theme="terminal">
      <div className="relative z-10 h-screen w-screen overflow-y-auto terminal-scroll">
        {/* Header */}
        <div className="terminal-header sticky top-0 z-50 backdrop-blur-xl">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 border-2 border-[#33ff33] bg-black">
                  <Terminal className="w-6 h-6 text-[#33ff33]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#33ff33] terminal-uppercase" style={{letterSpacing: '0.08em'}}>SINAIQ Dashboard</h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <AnalyticsHeader activeTab={activeTab} onTabChange={setActiveTab} />
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`terminal-button flex items-center gap-2 text-sm font-medium ${
                    showAdvanced 
                      ? 'terminal-button--secondary' 
                      : ''
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
          <div className="sticky top-[73px] z-40 bg-[#0f1220] border-b border-[#4deeea]/30" style={{boxShadow: '0 0 12px rgba(77, 238, 234, 0.15)'}}>
            <div className="max-w-[1800px] mx-auto px-6 py-3">
              <div className="terminal-nav">
                <button
                  onClick={() => setActiveTab('deployments')}
                  className={`terminal-nav__item ${
                    activeTab === 'deployments'
                      ? 'terminal-nav__item--active'
                      : ''
                  }`}
                >
                  Deployments
                </button>
                <button
                  onClick={() => setActiveTab('incidents')}
                  className={`terminal-nav__item ${
                    activeTab === 'incidents'
                      ? 'terminal-nav__item--active'
                      : ''
                  }`}
                >
                  Incidents
                </button>
                <button
                  onClick={() => setActiveTab('experiments')}
                  className={`terminal-nav__item ${
                    activeTab === 'experiments'
                      ? 'terminal-nav__item--active'
                      : ''
                  }`}
                >
                  Experiments
                </button>
                <button
                  onClick={() => setActiveTab('capacity')}
                  className={`terminal-nav__item ${
                    activeTab === 'capacity'
                      ? 'terminal-nav__item--active'
                      : ''
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
          {activeTab === 'slo' && <SLODashboard />}
          {activeTab === 'deployments' && <DeploymentHistory />}
          {activeTab === 'incidents' && <IncidentTimeline />}
          {activeTab === 'experiments' && <ExperimentDashboard />}
          {activeTab === 'capacity' && <CapacityForecasting />}
        </div>

        {/* Footer */}
        <div className="terminal-footer fixed bottom-0 left-0 right-0">
          <div className="max-w-[1800px] mx-auto">
            <div className="flex items-center justify-between">
              <span className="terminal-uppercase">© 2025 SINAIQ Dashboard</span>
              <div className="flex items-center gap-4">
                <span>Powered by Supabase</span>
                <div className="terminal-live-indicator">
                  <span className="terminal-led"></span>
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
