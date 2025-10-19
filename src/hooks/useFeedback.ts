/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type TouchpointType =
  | 'card_generation'
  | 'window_open'
  | 'full_generation'
  | 'session_end'
  | 'image_generation'
  | 'video_generation'
  | 'chat_interaction'
  | 'feature_usage';

export type InteractionType = 'start' | 'end' | 'cancel' | 'complete' | 'error';

interface FeedbackSession {
  sessionId: string;
  touchpointType: TouchpointType;
  startTime: Date;
  endTime?: Date;
  contextData?: Record<string, any>;
}

interface UseFeedbackOptions {
  touchpointType: TouchpointType;
  autoStart?: boolean;
  contextData?: Record<string, any>;
  onSubmitSuccess?: (data: any) => void;  
  onSubmitError?: (error: Error) => void;
}

export function useFeedback({
  touchpointType,
  autoStart = false,
  contextData = {},
  onSubmitSuccess,
  onSubmitError
}: UseFeedbackOptions) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sessionRef = useRef<FeedbackSession | null>(null);

  // Generate unique session ID
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }, []);

  // Start tracking session
  const startSession = useCallback(() => {
    sessionRef.current = {
      sessionId: generateSessionId(),
      touchpointType,
      startTime: new Date(),
      contextData
    };
    
    console.log('[Feedback] Session started:', {
      sessionId: sessionRef.current.sessionId,
      touchpoint: touchpointType
    });
  }, [touchpointType, contextData, generateSessionId]);

  // End tracking session
  const endSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.endTime = new Date();
      console.log('[Feedback] Session ended:', {
        sessionId: sessionRef.current.sessionId,
        duration: sessionRef.current.endTime.getTime() - sessionRef.current.startTime.getTime()
      });
    }
  }, []);

  // Calculate time spent
  const getTimeSpent = useCallback((): number => {
    if (!sessionRef.current) return 0;
    
    const endTime = sessionRef.current.endTime || new Date();
    const timeSpentMs = endTime.getTime() - sessionRef.current.startTime.getTime();
    return Math.round(timeSpentMs / 1000); // Convert to seconds
  }, []);

  // Submit feedback to server
  const submitFeedback = useCallback(async (rating: number, label: string) => {
    if (!user) {
      console.warn('[Feedback] No user logged in');
      return;
    }

    setIsSubmitting(true);

    try {
      const timeSpentSeconds = getTimeSpent();
      endSession();

      const feedbackData = {
        userId: user.id,
        touchpointType,
        interactionType: 'complete' as InteractionType,
        rating,
        ratingLabel: label,
        sessionId: sessionRef.current?.sessionId || null,
        timeSpentSeconds,
        interactionStartTime: sessionRef.current?.startTime?.toISOString() || null,
        interactionEndTime: sessionRef.current?.endTime?.toISOString() || new Date().toISOString(),
        contextData: {
          ...contextData,
          ...(sessionRef.current?.contextData || {})
        },
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
      };

      console.log('[Feedback] Submitting:', feedbackData);

      // Send to server
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        throw new Error(`Feedback submission failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[Feedback] Submitted successfully:', result);

      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }

      // Close modal after successful submission
      setIsModalOpen(false);
    } catch (error) {
      console.error('[Feedback] Submission error:', error);
      if (onSubmitError) {
        onSubmitError(error as Error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [user, touchpointType, contextData, getTimeSpent, endSession, onSubmitSuccess, onSubmitError]);

  // Open feedback modal
  const openModal = useCallback(() => {
    if (!sessionRef.current) {
      startSession();
    }
    setIsModalOpen(true);
  }, [startSession]);

  // Close feedback modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Auto-start session if enabled
  useEffect(() => {
    if (autoStart) {
      startSession();
    }
  }, [autoStart, startSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current && !sessionRef.current.endTime) {
        endSession();
      }
    };
  }, [endSession]);

  return {
    isModalOpen,
    isSubmitting,
    openModal,
    closeModal,
    submitFeedback,
    startSession,
    endSession,
    getTimeSpent,
    sessionId: sessionRef.current?.sessionId || null
  };
}

/**
 * Hook for simple one-time feedback (no session tracking)
 */
export function useQuickFeedback(touchpointType: TouchpointType) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitQuickFeedback = useCallback(async (
    rating: number,
    label: string,
    contextData: Record<string, any> = {}
  ) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const feedbackData = {
        userId: user.id,
        touchpointType,
        interactionType: 'complete' as InteractionType,
        rating,
        ratingLabel: label,
        contextData,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        throw new Error(`Feedback submission failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[QuickFeedback] Error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, touchpointType]);

  return {
    isSubmitting,
    submitQuickFeedback
  };
}
