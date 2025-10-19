# 📊 Feedback System Integration Guide
## Time-Sequenced User Experience Tracking

---

## 🎯 Overview

This feedback system captures user experience at different touchpoints throughout the Marketing Engine app, with precise time tracking to understand how long users interact with features before providing feedback.

### **Key Features:**
- ✅ **Time-aware tracking** - Measures interaction duration
- ✅ **Multiple touchpoints** - Card generation, window opening, full generation, etc.
- ✅ **Session grouping** - Links related feedback events
- ✅ **Context capture** - Stores relevant metadata with each feedback
- ✅ **Database integration** - Full Supabase tracking and analytics
- ✅ **Beautiful UI** - Animated feedback slider with smooth transitions

---

## 📦 What Was Created

### **Database Layer**
- `user_feedback` table - Stores all feedback with time tracking
- `feedback_aggregations` table - Pre-calculated analytics
- Automated daily aggregation function
- RLS policies for secure access

### **Server Layer**
- `feedbackTracker.mjs` - Server-side tracking utilities
- API endpoints: `/api/feedback`, `/api/feedback/history`, `/api/feedback/summary`

### **Client Layer**
- `FeedbackSlider` component - Animated feedback UI
- `FeedbackModal` component - Modal wrapper with context
- `useFeedback` hook - Time tracking and submission
- `useQuickFeedback` hook - Simplified one-time feedback

---

## 🚀 Quick Start

### **1. Apply Database Migration**

First, apply the feedback table migration:

```bash
# Using Supabase CLI (recommended)
supabase db push

# Or apply manually via Supabase Dashboard
# Copy content from: supabase/migrations/20241018_create_user_feedback_table.sql
```

### **2. Basic Usage Example**

```tsx
import { useState } from 'react';
import { useFeedback } from '@/hooks/useFeedback';
import FeedbackModal from '@/components/FeedbackModal';

function MyComponent() {
  const {
    isModalOpen,
    openModal,
    closeModal,
    submitFeedback,
    startSession,
    endSession
  } = useFeedback({
    touchpointType: 'card_generation',
    autoStart: true, // Auto-start time tracking
    contextData: {
      feature: 'content-card',
      platform: 'Instagram'
    }
  });

  const handleGenerateCard = async () => {
    startSession(); // Start tracking time
    
    // Your generation logic here
    await generateCard();
    
    endSession(); // End tracking time
    openModal(); // Show feedback modal
  };

  return (
    <>
      <button onClick={handleGenerateCard}>
        Generate Card
      </button>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={submitFeedback}
        touchpointType="card_generation"
      />
    </>
  );
}
```

---

## 📍 Integration Points (Touchpoints)

### **1. Card Generation Feedback**

**When to trigger:** After user generates a content card

```tsx
import { useFeedback } from '@/hooks/useFeedback';
import FeedbackModal from '@/components/FeedbackModal';

function CardGenerator() {
  const feedback = useFeedback({
    touchpointType: 'card_generation',
    contextData: { cardType: 'social-post' },
    onSubmitSuccess: (data) => {
      console.log('Feedback submitted:', data);
    }
  });

  const handleGenerate = async () => {
    feedback.startSession(); // Start timer
    
    try {
      const result = await generateCard(briefData);
      feedback.endSession(); // End timer
      
      // Show feedback modal after 2 seconds
      setTimeout(() => feedback.openModal(), 2000);
    } catch (error) {
      feedback.endSession();
    }
  };

  return (
    <>
      <button onClick={handleGenerate}>Generate</button>
      
      <FeedbackModal
        isOpen={feedback.isModalOpen}
        onClose={feedback.closeModal}
        onSubmit={feedback.submitFeedback}
        touchpointType="card_generation"
        contextData={{ cardType: 'social-post' }}
      />
    </>
  );
}
```

### **2. Window/Panel Open Feedback**

**When to trigger:** After user spends time in a specific panel

```tsx
import { useEffect } from 'react';
import { useFeedback } from '@/hooks/useFeedback';

function SettingsPanel({ isOpen }) {
  const feedback = useFeedback({
    touchpointType: 'window_open',
    autoStart: false, // Don't auto-start
    contextData: { panel: 'settings' }
  });

  useEffect(() => {
    if (isOpen) {
      feedback.startSession(); // Start when panel opens
    } else if (!isOpen && feedback.sessionId) {
      feedback.endSession(); // End when panel closes
      
      // Get time spent
      const timeSpent = feedback.getTimeSpent();
      
      // Only ask for feedback if user spent > 30 seconds
      if (timeSpent > 30) {
        setTimeout(() => feedback.openModal(), 1000);
      }
    }
  }, [isOpen]);

  return (
    <div>
      {/* Panel content */}
      
      <FeedbackModal
        isOpen={feedback.isModalOpen}
        onClose={feedback.closeModal}
        onSubmit={feedback.submitFeedback}
        touchpointType="window_open"
      />
    </div>
  );
}
```

### **3. Full Generation Process Feedback**

**When to trigger:** After completing a full multi-step generation

```tsx
function FullGenerationWorkflow() {
  const feedback = useFeedback({
    touchpointType: 'full_generation',
    contextData: {
      steps: ['brief', 'content', 'images', 'video'],
      totalSteps: 4
    }
  });

  const [currentStep, setCurrentStep] = useState(0);

  const handleStartWorkflow = () => {
    feedback.startSession();
    setCurrentStep(1);
  };

  const handleCompleteWorkflow = () => {
    setCurrentStep(4);
    feedback.endSession();
    
    // Show feedback after completion
    setTimeout(() => feedback.openModal(), 1500);
  };

  return (
    <>
      {/* Workflow steps */}
      
      <FeedbackModal
        isOpen={feedback.isModalOpen}
        onClose={feedback.closeModal}
        onSubmit={feedback.submitFeedback}
        touchpointType="full_generation"
        contextData={{
          stepsCompleted: currentStep,
          timeSpent: feedback.getTimeSpent()
        }}
      />
    </>
  );
}
```

### **4. Session End Feedback**

**When to trigger:** When user is about to leave or close the app

```tsx
import { useEffect } from 'react';
import { useQuickFeedback } from '@/hooks/useFeedback';

function App() {
  const { submitQuickFeedback } = useQuickFeedback('session_end');

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Optional: Show feedback before leaving
      const timeInApp = sessionStorage.getItem('sessionStartTime');
      if (timeInApp) {
        const timeSpent = Date.now() - parseInt(timeInApp);
        
        // If spent > 5 minutes, consider asking for feedback
        if (timeSpent > 300000) {
          // You can trigger feedback modal here
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return <div>{/* App content */}</div>;
}
```

### **5. BADU Chat Interaction Feedback**

**When to trigger:** After a BADU chat session

```tsx
function BaduChat() {
  const [messageCount, setMessageCount] = useState(0);
  const feedback = useFeedback({
    touchpointType: 'chat_interaction',
    autoStart: true,
    contextData: { assistant: 'BADU' }
  });

  const handleSendMessage = async (message) => {
    const response = await sendToBadu(message);
    setMessageCount(prev => prev + 1);

    // Ask for feedback after 5 messages
    if (messageCount === 5) {
      feedback.endSession();
      feedback.openModal();
    }
  };

  return (
    <>
      {/* Chat UI */}
      
      <FeedbackModal
        isOpen={feedback.isModalOpen}
        onClose={feedback.closeModal}
        onSubmit={feedback.submitFeedback}
        touchpointType="chat_interaction"
        contextData={{ messagesExchanged: messageCount }}
      />
    </>
  );
}
```

---

## 🎨 Customizing the Feedback Modal

### **Custom Titles & Messages**

The `FeedbackModal` automatically shows context-appropriate messages based on `touchpointType`. You can customize these in `FeedbackModal.tsx`:

```tsx
const touchpointMessages: Record<TouchpointType, { title: string; subtitle?: string }> = {
  card_generation: {
    title: "How was the card generation?",
    subtitle: "Your feedback helps us improve content quality",
  },
  // Add your custom messages
  my_custom_feature: {
    title: "How was [Feature Name]?",
    subtitle: "Tell us about your experience",
  }
};
```

### **Auto-Close Timing**

```tsx
<FeedbackModal
  isOpen={isModalOpen}
  onClose={closeModal}
  onSubmit={submitFeedback}
  touchpointType="card_generation"
  autoCloseDelay={3000} // Close 3 seconds after submission (default: 1500ms)
/>
```

---

## 📊 Analytics & Reporting

### **Get User's Feedback History**

```tsx
const response = await fetch('/api/feedback/history?limit=50');
const { feedback, count } = await response.json();

console.log(`User has submitted ${count} feedback items`);
```

### **Get Feedback Aggregations**

```tsx
// Daily aggregations
const daily = await fetch('/api/feedback/aggregations?period=daily&limit=30');
const { aggregations } = await daily.json();

// Weekly aggregations
const weekly = await fetch('/api/feedback/aggregations?period=weekly&limit=12');
```

### **Get Feedback Summary**

```tsx
// All touchpoints
const allSummary = await fetch('/api/feedback/summary');

// Specific touchpoint
const cardSummary = await fetch('/api/feedback/summary?touchpoint=card_generation');
const { summary } = await cardSummary.json();

console.log('Satisfaction:', summary.satisfaction_percentage);
console.log('Average rating:', summary.avg_rating);
```

---

## 🔧 Advanced Usage

### **Programmatic Feedback Submission**

```tsx
import { useQuickFeedback } from '@/hooks/useFeedback';

function QuickFeedbackExample() {
  const { submitQuickFeedback, isSubmitting } = useQuickFeedback('feature_usage');

  const handleQuickRating = async (rating: number) => {
    try {
      await submitQuickFeedback(rating, ['BAD', 'NOT BAD', 'GOOD'][rating], {
        feature: 'export-to-pdf',
        platform: 'Desktop'
      });
      console.log('Feedback submitted!');
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  };

  return (
    <div>
      <button onClick={() => handleQuickRating(0)} disabled={isSubmitting}>😞 Bad</button>
      <button onClick={() => handleQuickRating(1)} disabled={isSubmitting}>😐 Not Bad</button>
      <button onClick={() => handleQuickRating(2)} disabled={isSubmitting}>😊 Good</button>
    </div>
  );
}
```

### **Session Grouping**

All feedback from the same session gets the same `sessionId`, allowing you to group related feedback:

```tsx
const feedback = useFeedback({
  touchpointType: 'full_generation',
  autoStart: true
});

// Session ID is automatically generated
console.log('Session ID:', feedback.sessionId);
// Example: "session_1697654321000_abc123"
```

### **Time Tracking Without Modal**

```tsx
const feedback = useFeedback({
  touchpointType: 'card_generation',
  autoStart: true
});

// Later...
const timeSpent = feedback.getTimeSpent(); // Returns seconds
console.log(`User spent ${timeSpent} seconds`);

// Submit without showing modal
await feedback.submitFeedback(2, 'GOOD');
```

---

## 🎯 Best Practices

### **1. Timing is Everything**

- ✅ Ask for feedback **after** a completed action, not during
- ✅ Wait 1-2 seconds after completion before showing modal
- ✅ Don't interrupt critical workflows
- ❌ Don't ask too frequently (track last feedback timestamp)

### **2. Context is Key**

Always provide meaningful context data:

```tsx
const feedback = useFeedback({
  touchpointType: 'card_generation',
  contextData: {
    platform: 'Instagram',
    contentType: 'carousel',
    variantsGenerated: 3,
    provider: 'gpt-5',
    hadErrors: false
  }
});
```

### **3. Respect User's Time**

```tsx
// Only ask if user spent meaningful time
useEffect(() => {
  if (!isOpen && feedback.getTimeSpent() > 30) {
    feedback.openModal();
  }
}, [isOpen]);
```

### **4. Analytics Integration**

Query the database to find insights:

```sql
-- Average time spent before feedback
SELECT 
  touchpoint_type,
  AVG(time_spent_seconds) as avg_time,
  AVG(rating) as avg_rating
FROM user_feedback
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY touchpoint_type;

-- Satisfaction by touchpoint
SELECT 
  touchpoint_type,
  COUNT(*) FILTER (WHERE rating = 2)::float / COUNT(*) * 100 as satisfaction_pct
FROM user_feedback
GROUP BY touchpoint_type
ORDER BY satisfaction_pct DESC;
```

---

## 🔍 Troubleshooting

### **Feedback not saving?**

1. Check Supabase connection:
```bash
# Verify environment variables
echo $VITE_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

2. Check browser console for errors
3. Verify migration was applied:
```sql
SELECT * FROM user_feedback LIMIT 1;
```

### **Modal not appearing?**

1. Ensure `isModalOpen` state is being set:
```tsx
console.log('Modal open:', feedback.isModalOpen);
```

2. Check that `openModal()` is being called

### **Time tracking not working?**

1. Verify session started:
```tsx
console.log('Session ID:', feedback.sessionId);
console.log('Time spent:', feedback.getTimeSpent());
```

2. Make sure to call `startSession()` before `getTimeSpent()`

---

## 📈 Next Steps

1. **Apply the migration** to your Supabase database
2. **Choose integration points** based on your app's key features
3. **Test feedback flow** in development
4. **Monitor analytics** to understand user satisfaction
5. **Iterate based on feedback** patterns

---

## 🎉 Summary

You now have a complete feedback system that:

- ✅ Tracks user experience at multiple touchpoints
- ✅ Measures time spent on interactions
- ✅ Stores feedback with full context in database
- ✅ Provides beautiful animated UI
- ✅ Offers analytics and aggregations
- ✅ Integrates seamlessly with your Marketing Engine

**Ready to deploy! 🚀**
