/**
 * FEEDBACK INTEGRATION EXAMPLES
 * 
 * This file demonstrates how to integrate the feedback system
 * at different touchpoints in the Marketing Engine app.
 */

import React, { useState, useEffect } from 'react';
import { useFeedback, useQuickFeedback } from '@/hooks/useFeedback';
import FeedbackModal from '@/components/FeedbackModal';

// ============================================================================
// EXAMPLE 1: Card Generation Feedback
// ============================================================================

export function CardGenerationExample() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCard, setGeneratedCard] = useState(null);

  const feedback = useFeedback({
    touchpointType: 'card_generation',
    contextData: {
      feature: 'content-card',
      platform: 'Instagram'
    },
    onSubmitSuccess: (data) => {
      console.log('✅ Feedback submitted successfully:', data);
    },
    onSubmitError: (error) => {
      console.error('❌ Feedback submission failed:', error);
    }
  });

  const handleGenerateCard = async () => {
    setIsGenerating(true);
    feedback.startSession(); // Start tracking time

    try {
      // Simulate API call
      const response = await fetch('/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: 'Generate Instagram post',
          options: { platform: 'Instagram', variants: 3 }
        })
      });

      const card = await response.json();
      setGeneratedCard(card);

      feedback.endSession(); // End tracking time

      // Show feedback modal after 2 seconds
      setTimeout(() => {
        feedback.openModal();
      }, 2000);

    } catch (error) {
      console.error('Generation failed:', error);
      feedback.endSession();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Card Generation</h2>
      
      <button
        onClick={handleGenerateCard}
        disabled={isGenerating}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isGenerating ? 'Generating...' : 'Generate Card'}
      </button>

      {generatedCard && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p>Card generated! Time spent: {feedback.getTimeSpent()}s</p>
        </div>
      )}

      <FeedbackModal
        isOpen={feedback.isModalOpen}
        onClose={feedback.closeModal}
        onSubmit={feedback.submitFeedback}
        touchpointType="card_generation"
        contextData={{
          platform: 'Instagram',
          generatedSuccessfully: !!generatedCard
        }}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Window/Panel Open Feedback
// ============================================================================

export function SettingsPanelExample() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const feedback = useFeedback({
    touchpointType: 'window_open',
    autoStart: false, // Don't auto-start
    contextData: { panel: 'settings', section: 'video-settings' }
  });

  useEffect(() => {
    if (isPanelOpen) {
      // Start tracking when panel opens
      feedback.startSession();
      console.log('📊 Started tracking settings panel time');
    } else if (!isPanelOpen && feedback.sessionId) {
      // End tracking when panel closes
      feedback.endSession();
      const timeSpent = feedback.getTimeSpent();
      console.log(`⏱️ User spent ${timeSpent} seconds in settings`);

      // Only ask for feedback if user spent > 30 seconds
      if (timeSpent > 30) {
        setTimeout(() => {
          feedback.openModal();
        }, 1000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPanelOpen]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Settings Panel</h2>
      
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
      >
        {isPanelOpen ? 'Close Settings' : 'Open Settings'}
      </button>

      {isPanelOpen && (
        <div className="mt-4 p-6 bg-white border-2 border-gray-200 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">Video Settings</h3>
          <p className="text-gray-600 mb-4">Configure your video generation preferences...</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Resolution</label>
              <select className="w-full p-2 border rounded">
                <option>1080p</option>
                <option>720p</option>
                <option>4K</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Duration</label>
              <input type="range" min="5" max="30" className="w-full" />
            </div>
          </div>

          {feedback.sessionId && (
            <p className="mt-4 text-xs text-gray-500">
              Time in panel: {feedback.getTimeSpent()}s
            </p>
          )}
        </div>
      )}

      <FeedbackModal
        isOpen={feedback.isModalOpen}
        onClose={feedback.closeModal}
        onSubmit={feedback.submitFeedback}
        touchpointType="window_open"
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Full Generation Process Feedback
// ============================================================================

export function FullGenerationWorkflowExample() {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ['Brief', 'Content', 'Images', 'Video', 'Complete'];

  const feedback = useFeedback({
    touchpointType: 'full_generation',
    contextData: {
      totalSteps: steps.length - 1,
      workflow: 'complete-campaign'
    }
  });

  const handleStart = () => {
    setCurrentStep(1);
    feedback.startSession();
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleComplete = () => {
    setCurrentStep(steps.length - 1);
    feedback.endSession();

    // Show feedback modal after completion
    setTimeout(() => {
      feedback.openModal();
    }, 1500);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Full Generation Workflow</h2>

      {currentStep === 0 ? (
        <button
          onClick={handleStart}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
        >
          Start Workflow
        </button>
      ) : (
        <div className="space-y-4">
          {/* Progress indicator */}
          <div className="flex gap-2">
            {steps.slice(0, -1).map((step, idx) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full ${
                  idx < currentStep ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="p-6 bg-white border-2 border-gray-200 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">
              Step {currentStep}: {steps[currentStep - 1]}
            </h3>
            <p className="text-gray-600 mb-4">
              Complete this step to continue...
            </p>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={currentStep === steps.length - 2 ? handleComplete : handleNextStep}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                {currentStep === steps.length - 2 ? 'Complete Workflow' : 'Next Step'}
              </button>
            ) : (
              <div className="text-green-600 font-semibold">
                ✅ Workflow Complete! Time: {feedback.getTimeSpent()}s
              </div>
            )}
          </div>
        </div>
      )}

      <FeedbackModal
        isOpen={feedback.isModalOpen}
        onClose={feedback.closeModal}
        onSubmit={feedback.submitFeedback}
        touchpointType="full_generation"
        contextData={{
          stepsCompleted: currentStep,
          totalSteps: steps.length - 1,
          timeSpent: feedback.getTimeSpent()
        }}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Quick Feedback (No Modal)
// ============================================================================

export function QuickFeedbackExample() {
  const { submitQuickFeedback, isSubmitting } = useQuickFeedback('feature_usage');
  const [submitted, setSubmitted] = useState(false);

  const handleRating = async (rating: number, label: string) => {
    try {
      await submitQuickFeedback(rating, label, {
        feature: 'quick-export',
        exportFormat: 'PDF'
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Quick Feedback</h2>
      
      <p className="text-gray-600 mb-4">How was the PDF export feature?</p>
      
      <div className="flex gap-3">
        <button
          onClick={() => handleRating(0, 'BAD')}
          disabled={isSubmitting}
          className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors"
        >
          😞 Bad
        </button>
        <button
          onClick={() => handleRating(1, 'NOT BAD')}
          disabled={isSubmitting}
          className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors"
        >
          😐 Not Bad
        </button>
        <button
          onClick={() => handleRating(2, 'GOOD')}
          disabled={isSubmitting}
          className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-4 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors"
        >
          😊 Good
        </button>
      </div>

      {submitted && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          ✅ Thank you for your feedback!
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: BADU Chat Feedback
// ============================================================================

export function BaduChatFeedbackExample() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [messageCount, setMessageCount] = useState(0);

  const feedback = useFeedback({
    touchpointType: 'chat_interaction',
    autoStart: true,
    contextData: { assistant: 'BADU' }
  });

  const handleSendMessage = async (message: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    // Simulate BADU response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'This is a BADU response...' 
      }]);
      
      const newCount = messageCount + 1;
      setMessageCount(newCount);

      // Ask for feedback after 5 messages
      if (newCount === 5) {
        feedback.endSession();
        setTimeout(() => {
          feedback.openModal();
        }, 2000);
      }
    }, 1000);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">BADU Chat</h2>

      <div className="mb-4 p-4 bg-gray-50 rounded-lg h-64 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-100 text-blue-900 ml-8'
                : 'bg-gray-200 text-gray-900 mr-8'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <button
        onClick={() => handleSendMessage('Hello BADU!')}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        Send Message ({messageCount}/5)
      </button>

      <FeedbackModal
        isOpen={feedback.isModalOpen}
        onClose={feedback.closeModal}
        onSubmit={feedback.submitFeedback}
        touchpointType="chat_interaction"
        contextData={{
          messagesExchanged: messageCount,
          sessionDuration: feedback.getTimeSpent()
        }}
      />
    </div>
  );
}

// ============================================================================
// DEMO PAGE: Show all examples
// ============================================================================

export function FeedbackSystemDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Feedback System Examples
          </h1>
          <p className="text-gray-600">
            Interactive examples showing different feedback integration patterns
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <CardGenerationExample />
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <SettingsPanelExample />
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <FullGenerationWorkflowExample />
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <QuickFeedbackExample />
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden md:col-span-2">
            <BaduChatFeedbackExample />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackSystemDemo;
