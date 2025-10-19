/**
 * FEEDBACK MANAGER
 * Manages when and how to show feedback modals throughout the app
 * Tracks touchpoints and ensures good UX (not annoying users)
 */

export type FeedbackTouchpoint = 
  | 'first_generation'
  | 'milestone_generation' // Every 5th, 10th generation
  | 'campaign_saved'
  | 'extended_usage' // After 30+ minutes
  | 'feature_discovery' // Used advanced feature
  | 'sign_out'
  | 'random_sampling'; // 10% of sessions

interface FeedbackState {
  generationCount: number;
  lastFeedbackTime: number;
  feedbackGivenCount: number;
  sessionStartTime: number;
  shownTouchpoints: string[];
}

const STORAGE_KEY = 'feedback_state';
const MIN_FEEDBACK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const GENERATION_MILESTONES = [1, 5, 10, 25, 50, 100];

class FeedbackManager {
  private state: FeedbackState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): FeedbackState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[FeedbackManager] Failed to load state:', error);
    }

    return {
      generationCount: 0,
      lastFeedbackTime: 0,
      feedbackGivenCount: 0,
      sessionStartTime: Date.now(),
      shownTouchpoints: [],
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.warn('[FeedbackManager] Failed to save state:', error);
    }
  }

  /**
   * Check if enough time has passed since last feedback
   */
  private hasEnoughTimeElapsed(): boolean {
    const now = Date.now();
    return now - this.state.lastFeedbackTime > MIN_FEEDBACK_INTERVAL;
  }

  /**
   * Mark that feedback was shown for this touchpoint
   */
  private markShown(touchpoint: FeedbackTouchpoint): void {
    if (!this.state.shownTouchpoints.includes(touchpoint)) {
      this.state.shownTouchpoints.push(touchpoint);
      this.saveState();
    }
  }

  /**
   * Record that user completed a generation
   */
  recordGeneration(): void {
    this.state.generationCount++;
    this.saveState();
  }

  /**
   * Record that feedback was given
   */
  recordFeedbackGiven(): void {
    this.state.feedbackGivenCount++;
    this.state.lastFeedbackTime = Date.now();
    this.state.shownTouchpoints = []; // Reset for next cycle
    this.saveState();
  }

  /**
   * Check if we should show feedback after generation
   */
  shouldShowAfterGeneration(): { show: boolean; touchpoint?: FeedbackTouchpoint } {
    const count = this.state.generationCount;

    // First generation (always show if not shown before)
    if (count === 1 && !this.state.shownTouchpoints.includes('first_generation')) {
      this.markShown('first_generation');
      return { show: true, touchpoint: 'first_generation' };
    }

    // Milestone generations (5th, 10th, 25th, etc.)
    if (GENERATION_MILESTONES.includes(count) && this.hasEnoughTimeElapsed()) {
      if (!this.state.shownTouchpoints.includes('milestone_generation')) {
        this.markShown('milestone_generation');
        return { show: true, touchpoint: 'milestone_generation' };
      }
    }

    return { show: false };
  }

  /**
   * Check if we should show feedback after saving campaign
   */
  shouldShowAfterCampaignSave(): { show: boolean; touchpoint?: FeedbackTouchpoint } {
    // Show after every 3rd save, if enough time elapsed
    const saveCount = this.state.feedbackGivenCount;
    if (saveCount % 3 === 0 && this.hasEnoughTimeElapsed()) {
      if (!this.state.shownTouchpoints.includes('campaign_saved')) {
        this.markShown('campaign_saved');
        return { show: true, touchpoint: 'campaign_saved' };
      }
    }
    return { show: false };
  }

  /**
   * Check if we should show feedback based on extended usage
   */
  shouldShowForExtendedUsage(): { show: boolean; touchpoint?: FeedbackTouchpoint } {
    const sessionDuration = Date.now() - this.state.sessionStartTime;
    const thirtyMinutes = 30 * 60 * 1000;

    if (sessionDuration > thirtyMinutes && this.hasEnoughTimeElapsed()) {
      if (!this.state.shownTouchpoints.includes('extended_usage')) {
        this.markShown('extended_usage');
        return { show: true, touchpoint: 'extended_usage' };
      }
    }
    return { show: false };
  }

  /**
   * Check if we should show feedback before sign out
   */
  shouldShowBeforeSignOut(): { show: boolean; touchpoint?: FeedbackTouchpoint } {
    // Show if user hasn't given feedback in this session
    if (this.state.shownTouchpoints.length === 0 && this.hasEnoughTimeElapsed()) {
      this.markShown('sign_out');
      return { show: true, touchpoint: 'sign_out' };
    }
    return { show: false };
  }

  /**
   * Random sampling - 10% chance to show
   */
  shouldShowRandomSampling(): { show: boolean; touchpoint?: FeedbackTouchpoint } {
    if (this.hasEnoughTimeElapsed() && Math.random() < 0.1) {
      if (!this.state.shownTouchpoints.includes('random_sampling')) {
        this.markShown('random_sampling');
        return { show: true, touchpoint: 'random_sampling' };
      }
    }
    return { show: false };
  }

  /**
   * Get current state for debugging
   */
  getState(): FeedbackState {
    return { ...this.state };
  }

  /**
   * Reset state (for testing)
   */
  reset(): void {
    this.state = {
      generationCount: 0,
      lastFeedbackTime: 0,
      feedbackGivenCount: 0,
      sessionStartTime: Date.now(),
      shownTouchpoints: [],
    };
    this.saveState();
  }
}

// Singleton instance
export const feedbackManager = new FeedbackManager();

/**
 * Hook for React components
 */
export function useFeedbackManager() {
  return feedbackManager;
}
