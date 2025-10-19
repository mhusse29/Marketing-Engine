/**
 * TRACKING WRAPPER - Simplified tracking for all endpoints
 * Makes it easy to track any API call with minimal code
 */

import usageTracker from './usageTracker.mjs';

/**
 * Wrap an async endpoint handler with automatic tracking
 * Usage:
 *   app.post('/v1/generate', trackEndpoint('content', async (req, res) => {
 *     // Your endpoint logic
 *   }))
 */
export function trackEndpoint(serviceType, handler, options = {}) {
  return async (req, res) => {
    const startTime = Date.now();
    let trackingData = {
      userId: req.userId || 'anonymous',
      serviceType,
      provider: options.provider || 'unknown',
      model: options.model || 'unknown',
      endpoint: req.path,
      status: 'success',
      ipAddress: req.ipAddress,
      userAgent: req.userAgent,
      requestId: options.requestId || null,
    };

    try {
      // Execute the actual handler
      await handler(req, res, trackingData);

      // Calculate latency
      trackingData.latency = Date.now() - startTime;

      // Track success (if not already tracked in handler)
      if (!trackingData._tracked) {
        await trackUsage(trackingData);
      }
    } catch (error) {
      // Track error
      trackingData.status = 'error';
      trackingData.errorMessage = error.message;
      trackingData.latency = Date.now() - startTime;
      
      await trackUsage(trackingData);

      // Re-throw error
      throw error;
    }
  };
}

/**
 * Track usage data
 */
async function trackUsage(data) {
  try {
    await usageTracker.trackAPIUsage({
      userId: data.userId,
      serviceType: data.serviceType,
      provider: data.provider,
      model: data.model,
      endpoint: data.endpoint,
      requestId: data.requestId,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      imagesGenerated: data.imagesGenerated || 0,
      videoSeconds: data.videoSeconds || 0,
      inputCost: data.inputCost || 0,
      outputCost: data.outputCost || 0,
      generationCost: data.generationCost || 0,
      totalCost: data.totalCost || 0,
      latency: data.latency || 0,
      status: data.status,
      errorMessage: data.errorMessage,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      campaignId: data.campaignId,
    });
    console.log(`[Tracking] ✅ ${data.serviceType} tracked for user ${data.userId}`);
  } catch (error) {
    console.error('[Tracking] ❌ Failed to track usage:', error);
    // Don't throw - tracking failures shouldn't break the API
  }
}

/**
 * Manual tracking helper for complex scenarios
 */
export async function trackManually(data) {
  return trackUsage(data);
}

export default { trackEndpoint, trackManually };
