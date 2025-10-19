/**
 * FEEDBACK TRACKER - Server-side tracking for user feedback
 * Tracks user experience at different touchpoints with time-awareness
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key (server-side only)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[FeedbackTracker] Supabase credentials missing - tracking disabled');
}

const supabase = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// =====================================================
// FEEDBACK TRACKING FUNCTIONS
// =====================================================

/**
 * Track user feedback in database
 */
export async function trackUserFeedback({
  userId,
  touchpointType,
  interactionType = 'complete',
  rating,
  ratingLabel,
  sessionId = null,
  timeSpentSeconds = null,
  interactionStartTime = null,
  interactionEndTime = null,
  contextData = null,
  pageUrl = null,
  comments = null,
  isAnonymous = false,
  ipAddress = null,
  userAgent = null
}) {
  if (!supabase) {
    console.warn('[FeedbackTracker] Tracking disabled - Supabase not configured');
    return null;
  }

  try {
    // Validate rating
    if (rating < 0 || rating > 2) {
      throw new Error('Invalid rating: must be 0 (Bad), 1 (Not Bad), or 2 (Good)');
    }

    // Ensure rating label matches rating value
    const validLabels = ['BAD', 'NOT BAD', 'GOOD'];
    const expectedLabel = validLabels[rating];
    const finalLabel = ratingLabel || expectedLabel;

    // Insert feedback record
    const { data: feedbackRecord, error: feedbackError } = await supabase
      .from('user_feedback')
      .insert({
        user_id: userId,
        touchpoint_type: touchpointType,
        interaction_type: interactionType,
        rating,
        rating_label: finalLabel,
        session_id: sessionId,
        time_spent_seconds: timeSpentSeconds,
        interaction_start_time: interactionStartTime,
        interaction_end_time: interactionEndTime,
        context_data: contextData,
        page_url: pageUrl,
        comments,
        is_anonymous: isAnonymous,
        user_agent: userAgent,
        ip_address: ipAddress
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('[FeedbackTracker] Insert error:', feedbackError);
      return null;
    }

    console.log('[FeedbackTracker] Feedback tracked:', {
      id: feedbackRecord.id,
      touchpoint: touchpointType,
      rating: finalLabel,
      timeSpent: timeSpentSeconds
    });

    return feedbackRecord;
  } catch (error) {
    console.error('[FeedbackTracker] Tracking error:', error);
    // Don't fail the request if tracking fails
    return null;
  }
}

/**
 * Get user's recent feedback
 */
export async function getUserFeedback(userId, limit = 50) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[FeedbackTracker] Get feedback error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[FeedbackTracker] Get feedback error:', error);
    return [];
  }
}

/**
 * Get all recent feedback (admin/analytics)
 */
export async function getAllFeedback(limit = 50) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[FeedbackTracker] Get all feedback error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[FeedbackTracker] Get all feedback error:', error);
    return [];
  }
}

/**
 * Get feedback aggregations by touchpoint
 */
export async function getFeedbackAggregations(periodType = 'daily', limit = 30) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('feedback_aggregations')
      .select('*')
      .eq('period_type', periodType)
      .order('period_start', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[FeedbackTracker] Get aggregations error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[FeedbackTracker] Get aggregations error:', error);
    return [];
  }
}

/**
 * Get feedback summary by touchpoint type
 */
export async function getFeedbackSummary(touchpointType = null) {
  if (!supabase) return null;

  try {
    let query = supabase
      .from('feedback_summary')
      .select('*');

    if (touchpointType) {
      query = query.eq('touchpoint_type', touchpointType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[FeedbackTracker] Get summary error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[FeedbackTracker] Get summary error:', error);
    return null;
  }
}

/**
 * Delete user feedback (GDPR compliance)
 */
export async function deleteUserFeedback(userId, feedbackId) {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('user_feedback')
      .delete()
      .eq('id', feedbackId)
      .eq('user_id', userId);

    if (error) {
      console.error('[FeedbackTracker] Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[FeedbackTracker] Delete error:', error);
    return false;
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Extract user ID from request (helper for middleware)
 */
export function extractUserId(req) {
  return req.userId || req.user?.id || req.auth?.userId || null;
}

/**
 * Extract IP address from request
 */
export function extractIPAddress(req) {
  return req.ip || 
         req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         null;
}

/**
 * Extract user agent from request
 */
export function extractUserAgent(req) {
  return req.headers['user-agent'] || null;
}

/**
 * Generate session ID for grouping related feedback
 */
export function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Calculate time spent (in seconds) between two timestamps
 */
export function calculateTimeSpent(startTime, endTime) {
  if (!startTime || !endTime) return null;
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  return Math.round((end - start) / 1000); // Convert to seconds
}

// =====================================================
// EXPORT ALL
// =====================================================

export default {
  trackUserFeedback,
  getUserFeedback,
  getAllFeedback,
  getFeedbackAggregations,
  getFeedbackSummary,
  deleteUserFeedback,
  extractUserId,
  extractIPAddress,
  extractUserAgent,
  generateSessionId,
  calculateTimeSpent
};
