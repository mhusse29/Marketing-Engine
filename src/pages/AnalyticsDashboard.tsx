import { BackgroundGradientAnimation } from '../components/ui/background-gradient-animation';
import { KeyboardShortcuts } from '../components/Analytics/KeyboardShortcuts';
import { ExecutiveOverview } from '../components/Analytics/ExecutiveOverview';
import { RealtimeOperations } from '../components/Analytics/RealtimeOperations';
import { UserIntelligence } from '../components/Analytics/UserIntelligence';
import { FinancialAnalytics } from '../components/Analytics/FinancialAnalytics';
import { TechnicalPerformance } from '../components/Analytics/TechnicalPerformance';
import { ModelUsage } from '../components/Analytics/ModelUsage';
import { SLODashboard } from '../components/Analytics/SLODashboard';
import { AnalyticsHeader } from '../components/Analytics/AnalyticsHeader';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<'executive' | 'operations' | 'users' | 'finance' | 'technical' | 'models' | 'feedback' | 'slo'>('executive');
  const navigate = useNavigate();

  return (
    <BackgroundGradientAnimation
      gradientBackgroundStart="rgb(15, 23, 42)"
      gradientBackgroundEnd="rgb(8, 12, 25)"
      firstColor="59, 130, 246"
      secondColor="147, 51, 234"
      thirdColor="6, 182, 212"
      fourthColor="168, 85, 247"
      fifthColor="34, 211, 238"
      pointerColor="99, 102, 241"
      containerClassName="fixed inset-0"
    >
      <div className="relative z-10 h-screen w-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/10">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-white/70" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
                  <p className="text-sm text-white/50">Real-time insights & performance metrics</p>
                </div>
              </div>
              <AnalyticsHeader activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1800px] mx-auto px-6 py-8 pb-20">
          {activeTab === 'executive' && <ExecutiveOverview />}
          {activeTab === 'operations' && <RealtimeOperations />}
          {activeTab === 'models' && <ModelUsage />}
          {activeTab === 'users' && <UserIntelligence />}
          {activeTab === 'finance' && <FinancialAnalytics />}
          {activeTab === 'technical' && <TechnicalPerformance />}
          {activeTab === 'slo' && <SLODashboard />}
        </div>
      
      {/* Global Keyboard Shortcuts */}
      <KeyboardShortcuts onTabChange={setActiveTab} />
    </div>
  </BackgroundGradientAnimation>
  );
}
