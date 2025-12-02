import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { LayoutShell } from '../components/LayoutShell';
import AppTopBar from '../components/AppTopBar';
import { MediaPlanLiteShell, MediaPlanNavInputs } from '../features/media-plan-lite/MediaPlanLiteShell';
import { useAuth } from '../contexts/AuthContext';
import { useMediaPlanState } from '../store/useMediaPlanStore';
import SettingsPage from './SettingsPage';
import FeedbackSlider from '../components/ui/feedback-slider';
import { feedbackManager, type FeedbackTouchpoint } from '../lib/feedbackManager';

const BUILDER_TABS = ['content', 'pictures', 'video'] as const;
type BuilderTab = (typeof BUILDER_TABS)[number];

export default function MediaPlanLite() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const mediaPlan = useMediaPlanState((state) => state.mediaPlan);
  const [displayUnlocked, setDisplayUnlocked] = useState(false);
  const plannerValidated = Boolean(mediaPlan.plannerValidatedAt);
  const channelsValidated = Boolean(mediaPlan.channelsValidatedAt);
  const canGenerate = plannerValidated && channelsValidated;

  const navigateToEngine = useCallback(
    (tab?: BuilderTab) => {
      if (tab) {
        sessionStorage.setItem('me:return-tab', tab);
      }
      navigate('/');
    },
    [navigate]
  );

  const handleTabChange = useCallback(
    (tab: BuilderTab) => {
      navigateToEngine(tab);
    },
    [navigateToEngine]
  );

  const handleSignOut = useCallback(() => {
    void signOut();
  }, [signOut]);

  const handleGenerateView = useCallback(() => {
    if (!canGenerate) {
      return;
    }
    setDisplayUnlocked(true);
  }, [canGenerate]);

  // Settings and feedback state
  const [showSettings, setShowSettings] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentFeedbackTouchpoint, setCurrentFeedbackTouchpoint] = useState<FeedbackTouchpoint | null>(null);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleOpenFeedback = useCallback(() => {
    setCurrentFeedbackTouchpoint('feature_discovery');
    setShowFeedbackModal(true);
  }, []);

  useEffect(() => {
    if (!canGenerate) {
      setDisplayUnlocked(false);
    } else {
      // Auto-unlock if user has already validated (e.g., after refresh)
      setDisplayUnlocked(true);
    }
  }, [canGenerate]);

  const getFeedbackTitle = (touchpoint: FeedbackTouchpoint | null) => {
    switch (touchpoint) {
      case 'first_generation':
        return 'How was your first generation?';
      case 'milestone_generation':
        return 'How was your experience?';
      case 'campaign_saved':
        return 'Enjoying Marketing Engine?';
      case 'extended_usage':
        return 'Enjoying Marketing Engine?';
      case 'feature_discovery':
        return 'Tell us what you think';
      default:
        return 'Share your feedback';
    }
  };

  const handleFeedbackSubmit = () => {
    feedbackManager.recordFeedbackGiven();
    setShowFeedbackModal(false);
    setCurrentFeedbackTouchpoint(null);
  };

  return (
    <>
      <LayoutShell
        menu={
          <AppTopBar
            active="content"
            enabled={{ content: true, pictures: true, video: true }}
            onChange={handleTabChange}
            onNewCampaign={() => navigateToEngine('content')}
            onOpenSettings={handleOpenSettings}
            onHelp={() => window.open('https://marketing.engine.help', '_blank', 'noopener')}
            onSignOut={handleSignOut}
            contentValidated={canGenerate}
            picturesValidated={false}
            videoValidated={false}
            onGenerate={handleGenerateView}
            onOpenPanel={handleTabChange}
            onSetHovering={() => {}}
            onOpenFeedbackSlider={handleOpenFeedback}
            showPrimaryTabs={false}
            customNavContent={<MediaPlanNavInputs />}
          />
        }
        main={<MediaPlanLiteShell displayUnlocked={displayUnlocked} />}
      />

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowFeedbackModal(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="relative w-full h-full max-w-[95vw] max-h-[95vh] flex items-center justify-center"
            >
              <FeedbackSlider 
                className="h-full w-full rounded-3xl shadow-[0_8px_64px_rgba(0,0,0,0.6)]"
                title={getFeedbackTitle(currentFeedbackTouchpoint)}
                onSubmit={handleFeedbackSubmit}
                onDone={() => setShowFeedbackModal(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
