// ═══════════════════════════════════════════════════════════════
// ANALYTICS SCHEDULER
// Periodic tasks for alerts, quality analysis, and forecasting
// ═══════════════════════════════════════════════════════════════

import cron from 'node-cron';
import budgetEnforcement from './budgetEnforcement.mjs';
import qualityTracking from './qualityTracking.mjs';
import predictiveAnalytics from './predictiveAnalytics.mjs';

/**
 * Start all scheduled tasks
 */
export function startScheduler() {
  console.log('[Scheduler] Starting analytics scheduler...');

  // ═══════════════════════════════════════════════════════════
  // EVERY 15 MINUTES: Budget & Alert Checks
  // ═══════════════════════════════════════════════════════════
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Scheduler] Running 15-minute checks...');
    try {
      await budgetEnforcement.runPeriodicChecks();
    } catch (error) {
      console.error('[Scheduler] 15-minute check failed:', error);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // DAILY AT 2 AM: Quality Analysis & Optimization
  // ═══════════════════════════════════════════════════════════
  cron.schedule('0 2 * * *', async () => {
    console.log('[Scheduler] Running daily quality analysis...');
    try {
      await qualityTracking.runDailyQualityAnalysis();
    } catch (error) {
      console.error('[Scheduler] Daily quality analysis failed:', error);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // DAILY AT 3 AM: Predictive Analytics & Forecasting
  // ═══════════════════════════════════════════════════════════
  cron.schedule('0 3 * * *', async () => {
    console.log('[Scheduler] Running daily predictive analysis...');
    try {
      await predictiveAnalytics.runDailyPredictiveAnalysis();
    } catch (error) {
      console.error('[Scheduler] Daily predictive analysis failed:', error);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // WEEKLY ON MONDAY AT 1 AM: Comprehensive Report Generation
  // ═══════════════════════════════════════════════════════════
  cron.schedule('0 1 * * 1', async () => {
    console.log('[Scheduler] Generating weekly reports...');
    try {
      await generateWeeklyReports();
    } catch (error) {
      console.error('[Scheduler] Weekly report generation failed:', error);
    }
  });

  console.log('[Scheduler] All tasks scheduled successfully');
}

/**
 * Generate weekly reports for all active users
 */
async function generateWeeklyReports() {
  // Implementation would query active users and generate comprehensive reports
  console.log('[Reports] Weekly report generation started');
  // This would integrate with the analytics_reports table
}

/**
 * Run all tasks immediately (for testing)
 */
export async function runAllTasksNow() {
  console.log('[Scheduler] Running all tasks immediately...');
  
  await budgetEnforcement.runPeriodicChecks();
  await qualityTracking.runDailyQualityAnalysis();
  await predictiveAnalytics.runDailyPredictiveAnalysis();
  
  console.log('[Scheduler] All tasks completed');
}

export default {
  startScheduler,
  runAllTasksNow
};
