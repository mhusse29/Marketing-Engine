# 📋 Feedback System - Quick Reference Card

## 🚀 Quick Start (5 Minutes)

### 1. Apply Database Migration
```bash
cd "/Users/mohamedhussein/Desktop/Marketing Engine"
supabase db push
```

### 2. Restart Server
```bash
npm run dev
```

### 3. Add to Any Component
```tsx
import { useFeedback } from '@/hooks/useFeedback';
import FeedbackModal from '@/components/FeedbackModal';

function MyComponent() {
  const feedback = useFeedback({
    touchpointType: 'card_generation',
    autoStart: true
  });

  const handleAction = async () => {
    feedback.startSession();
    await doSomething();
    feedback.endSession();
    feedback.openModal();
  };

  return (
    <>
      <button onClick={handleAction}>Do Something</button>
      <FeedbackModal
        isOpen={feedback.isModalOpen}
        onClose={feedback.closeModal}
        onSubmit={feedback.submitFeedback}
        touchpointType="card_generation"
      />
    </>
  );
}
```

---

## 📍 Available Touchpoint Types

```typescript
'card_generation'      // When generating content cards
'window_open'          // When opening panels/windows
'full_generation'      // Complete multi-step workflows
'session_end'          // When user session ends
'image_generation'     // When generating images
'video_generation'     // When generating videos
'chat_interaction'     // BADU or chat features
'feature_usage'        // General feature usage
```

---

## 🎯 Common Patterns

### Pattern 1: After Generation
```tsx
const handleGenerate = async () => {
  feedback.startSession();
  await generateContent();
  feedback.endSession();
  setTimeout(() => feedback.openModal(), 2000); // Wait 2s
};
```

### Pattern 2: Panel Open/Close
```tsx
useEffect(() => {
  if (isOpen) {
    feedback.startSession();
  } else if (!isOpen && feedback.sessionId) {
    feedback.endSession();
    if (feedback.getTimeSpent() > 30) {
      feedback.openModal();
    }
  }
}, [isOpen]);
```

### Pattern 3: Quick Feedback (No Modal)
```tsx
const { submitQuickFeedback } = useQuickFeedback('feature_usage');

<button onClick={() => submitQuickFeedback(2, 'GOOD', { feature: 'export' })}>
  😊 Good
</button>
```

---

## 🔧 Hook Methods

### `useFeedback(options)`

```typescript
const {
  isModalOpen,        // Boolean: modal visibility state
  isSubmitting,       // Boolean: submission in progress
  openModal,          // Function: show feedback modal
  closeModal,         // Function: hide feedback modal
  submitFeedback,     // Function: (rating, label) => Promise
  startSession,       // Function: start time tracking
  endSession,         // Function: end time tracking
  getTimeSpent,       // Function: () => number (seconds)
  sessionId           // String: unique session ID
} = useFeedback({
  touchpointType: 'card_generation',  // Required
  autoStart: true,                     // Optional: auto-start tracking
  contextData: { key: 'value' },       // Optional: extra context
  onSubmitSuccess: (data) => {},       // Optional: success callback
  onSubmitError: (error) => {}         // Optional: error callback
});
```

---

## 📊 API Endpoints

### Submit Feedback
```bash
POST /api/feedback
Body: {
  touchpointType: 'card_generation',
  rating: 2,              // 0=Bad, 1=Not Bad, 2=Good
  ratingLabel: 'GOOD',
  timeSpentSeconds: 15,
  contextData: { ... }
}
```

### Get History
```bash
GET /api/feedback/history?limit=50
```

### Get Analytics
```bash
GET /api/feedback/summary
GET /api/feedback/summary?touchpoint=card_generation
GET /api/feedback/aggregations?period=daily&limit=30
```

---

## 🎨 Component Props

### FeedbackModal
```tsx
<FeedbackModal
  isOpen={boolean}                    // Required
  onClose={() => void}                // Required
  onSubmit={(rating, label) => void}  // Required
  touchpointType="card_generation"    // Required
  interactionType="complete"          // Optional
  contextData={{ key: 'value' }}      // Optional
  autoCloseDelay={1500}              // Optional (ms)
/>
```

---

## 📈 Quick Analytics Queries

### Today's Feedback Count
```sql
SELECT COUNT(*) FROM user_feedback 
WHERE created_at::date = CURRENT_DATE;
```

### Satisfaction by Touchpoint
```sql
SELECT 
  touchpoint_type,
  COUNT(*) FILTER (WHERE rating = 2)::float / COUNT(*) * 100 as satisfaction_pct
FROM user_feedback
GROUP BY touchpoint_type;
```

### Average Time Spent
```sql
SELECT 
  touchpoint_type,
  ROUND(AVG(time_spent_seconds), 1) as avg_seconds
FROM user_feedback
WHERE time_spent_seconds IS NOT NULL
GROUP BY touchpoint_type;
```

---

## 🐛 Quick Fixes

### Modal Not Showing
```tsx
console.log('Modal state:', feedback.isModalOpen);
feedback.openModal(); // Make sure this is called
```

### Time Shows 0
```tsx
feedback.startSession();  // Must call before endSession
// ... do work ...
feedback.endSession();    // Then end
const time = feedback.getTimeSpent(); // Now has value
```

### Feedback Not Saving
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Check server logs for errors
```

---

## 📁 File Locations

```
Database:
  supabase/migrations/20241018_create_user_feedback_table.sql

Server:
  server/feedbackTracker.mjs
  server/ai-gateway.mjs (endpoints added)

Client:
  src/components/ui/feedback-slider.tsx
  src/components/FeedbackModal.tsx
  src/hooks/useFeedback.ts

Examples:
  src/examples/FeedbackIntegrationExample.tsx

Documentation:
  FEEDBACK_SYSTEM_INTEGRATION_GUIDE.md
  FEEDBACK_IMPLEMENTATION_STEPS.md
  FEEDBACK_QUICK_REFERENCE.md (this file)
```

---

## ✅ Implementation Checklist

- [ ] Database migration applied
- [ ] Server restarted
- [ ] Test endpoint: `POST /api/feedback`
- [ ] Integrated in card generation
- [ ] Integrated in full workflow
- [ ] Integrated in BADU chat
- [ ] Analytics queries working
- [ ] No console errors

---

## 🎯 Best Practices

✅ **DO:**
- Start session before action
- End session after action
- Wait 1-2 seconds before showing modal
- Add meaningful contextData
- Only ask if user spent >30 seconds

❌ **DON'T:**
- Show modal during critical workflows
- Ask for feedback too frequently
- Forget to call startSession()
- Block user actions while modal is open

---

## 📞 Need Help?

1. Check examples: `src/examples/FeedbackIntegrationExample.tsx`
2. Read full guide: `FEEDBACK_SYSTEM_INTEGRATION_GUIDE.md`
3. Check implementation steps: `FEEDBACK_IMPLEMENTATION_STEPS.md`
4. Review browser console for errors
5. Check server logs for API errors

---

**Ready to collect feedback! 🚀**
