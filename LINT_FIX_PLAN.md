# Comprehensive Lint Fix Plan

**Current Status:** 139 errors (130 errors, 9 warnings)  
**Target:** 0 errors, minimal warnings

---

## Error Categories

### 1. **Unused Variables** (~40 errors) - HIGHEST IMPACT
**Files affected:**
- AppTopBar.tsx: `active`, `onNewCampaign`, `enabled`, `copyLength`, `settings`, `onSettingsChange`
- SettingsPage.tsx: `Unlink`, `Lock`, `Trash2`, `setError`, `setSuccess`, `currentPassword`, `setCurrentPassword`
- MenuVideo.tsx: `CameraMovement`, `VisualStyle`, `LightingStyle`, `MotionSpeed`, `SubjectFocus`, `FilmLook`, `ColorGrading`, `DEPTH_OF_FIELD`
- MarkdownMessage.tsx: `node`, `ordered` (multiple instances)
- BaduAssistant.tsx: `callBaduAPI`, `renderFormattedText`
- AnimatedMessage.tsx: `messageId`
- InteractiveCardController.tsx: `onClose`
- useFeedback.ts: `FeedbackSubmission`
- useTypingAnimation.ts: `nextChar`

**Fix:** Remove or use these variables

---

### 2. **no-explicit-any** (~60 errors) - HIGH IMPACT
**Files affected:**
- useAdvancedAnalytics.ts (11 instances)
- SettingsPage.tsx (9 instances)
- useFeedback.ts (5 instances)
- useAnalytics.ts (4 instances - NEW materialized views, keep with eslint-disable)
- UserIntelligence.tsx (9 instances)
- FinancialAnalytics.tsx (2 instances)
- Many others

**Fix:** 
- For NEW database objects (mv_*, experiments): Keep `as any` with `// eslint-disable-line`
- For others: Add proper type definitions

---

### 3. **rules-of-hooks** (1 error) - CRITICAL
**File:** ModelUsage.tsx line 29

**Status:** ✅ ALREADY FIXED (lint cache stale)
- useMemo is now on line 17, before conditional return

---

### 4. **Missing useEffect dependencies** (9 warnings) - LOW PRIORITY
**Files:**
- DeploymentHistory.tsx: `fetchDeployments`
- ExperimentDashboard.tsx: `fetchExperiments`
- FeedbackDashboard.tsx: `fetchFeedback`
- FeedbackIntegrationExample.tsx: `feedback`
- BaduAssistantEnhanced.tsx: `blobUrlsRef.current`

**Fix:** Add `// eslint-disable-next-line react-hooks/exhaustive-deps` where intentional

---

### 5. **react-refresh/only-export-components** (2 errors) - LOW PRIORITY
**Files:**
- AuthContext.tsx
- AuthTransitionContext.tsx

**Fix:** Move non-component exports to separate files or add eslint-disable

---

## Execution Strategy

### Phase 1: Quick Wins (Removes ~40 errors)
Remove all unused variables

### Phase 2: Type Safety (Removes ~50 errors)
Fix explicit-any where possible, disable for database objects

### Phase 3: Cleanup (Removes remaining errors)
Fix useEffect dependencies and context exports

---

## Expected Outcome
- **Before:** 139 errors
- **After Phase 1:** ~99 errors
- **After Phase 2:** ~49 errors  
- **After Phase 3:** 0-5 errors (only intentional eslint-disables)
