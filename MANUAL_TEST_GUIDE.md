# Manual Testing Guide - Analytics Dashboard

**Quick reference for completing end-to-end smoke tests**

---

## Prerequisites

### 1. Ensure Services Are Running

```bash
# Terminal 1: Analytics Gateway
cd /Users/mohamedhussein/Desktop/Marketing\ Engine
source .env.analytics  # Load Supabase credentials
npm run gateway:dev

# Terminal 2: Analytics Dashboard
npm run analytics:dev
```

**Expected Output:**
- Gateway: `Analytics Gateway listening on port 8788`
- Dashboard: `Local: http://localhost:5174/`

### 2. Verify Health

```bash
# Check gateway health
curl http://localhost:8788/health

# Expected response:
# {"status":"healthy","service":"analytics-gateway","version":"1.0.0",...}
```

---

## Test Procedure

### Step 1: Open Dashboard
1. Navigate to: **http://localhost:5174/analytics.html**
2. Open browser DevTools (F12)
3. Check Console tab for errors (should be clean)

### Step 2: Test Each Tab

#### Tab 1: Overview / Dashboard
- **Actions:**
  - [ ] Observe page loads without errors
  - [ ] Check Total Requests counter displays number
  - [ ] Verify Cost metrics show dollar amounts
  - [ ] Confirm charts render (not blank/broken)
  - [ ] Click "Refresh" button (top right)
  - [ ] Press `Cmd+R` (Mac) or `Ctrl+R` (Windows)
  
- **Expected Results:**
  - Data appears within 2-3 seconds
  - Charts animate smoothly
  - Refresh triggers new data fetch
  - No console errors

#### Tab 2: Cost Analysis
- **Actions:**
  - [ ] Navigate to Cost Analysis tab
  - [ ] Check cost breakdown by provider displays
  - [ ] Verify pie/bar charts render
  - [ ] Test date range filter
  - [ ] Click refresh button
  
- **Expected Results:**
  - Provider costs visible (OpenAI, Anthropic, etc.)
  - Charts color-coded
  - Filter updates data
  - No loading spinners stuck

#### Tab 3: Performance Metrics
- **Actions:**
  - [ ] Navigate to Performance tab
  - [ ] Check response time charts load
  - [ ] Verify latency metrics display
  - [ ] Test provider comparison filter
  - [ ] Check time range selector
  
- **Expected Results:**
  - Response time graph shows line chart
  - Average latency numbers present
  - Provider filter works
  - Data updates on filter change

#### Tab 4: Provider Analytics
- **Actions:**
  - [ ] Navigate to Provider Analytics
  - [ ] Check provider list populates
  - [ ] Verify model usage data shows
  - [ ] Check success/failure rates display
  - [ ] Test sorting (if available)
  
- **Expected Results:**
  - All configured providers listed
  - Model names visible per provider
  - Success rates show percentages
  - Data sorted correctly

#### Tab 5: Usage Trends
- **Actions:**
  - [ ] Navigate to Usage Trends
  - [ ] Check trend charts load
  - [ ] Verify historical data displays
  - [ ] Test time period selector (7d, 30d, etc.)
  - [ ] Click refresh
  
- **Expected Results:**
  - Line/area charts show trends over time
  - Data points visible
  - Time period changes update chart
  - Trends show growth/decline patterns

#### Tab 6: Capacity Forecasting
- **Actions:**
  - [ ] Navigate to Capacity Forecasting
  - [ ] Check forecast models load
  - [ ] Verify predictions display
  - [ ] Look for budget alerts/warnings
  - [ ] Test forecast period selector
  
- **Expected Results:**
  - Forecast line extends into future
  - Budget thresholds visible (if set)
  - Warnings display if over budget
  - Predictions calculated from historical data

#### Tab 7: Feedback Analytics
- **Actions:**
  - [ ] Navigate to Feedback Analytics
  - [ ] Check feedback data loads
  - [ ] Verify rating distributions show
  - [ ] Check sentiment breakdown
  - [ ] Test touchpoint filter
  
- **Expected Results:**
  - Rating counts (Good/Bad/Not Bad)
  - Pie chart or bar chart for distribution
  - Touchpoint breakdown (card_generation, etc.)
  - Comments/feedback text visible (if any)

---

## Keyboard Shortcuts Test

### Global Shortcuts
- [ ] `Cmd/Ctrl + R` - Refresh current tab
- [ ] `Tab` - Navigate between interactive elements
- [ ] `Escape` - Close modals/dropdowns (if any)
- [ ] Arrow keys - Navigate charts (if interactive)

**Expected:** Shortcuts work, no conflicts, focus visible

---

## Data Refresh Test

### Manual Refresh
1. Note current data (e.g., total requests count)
2. Click "Refresh" button
3. Observe:
   - [ ] Loading spinner appears briefly
   - [ ] Data updates (numbers may change slightly)
   - [ ] Charts re-render smoothly
   - [ ] Timestamp updates (if displayed)

### Auto-Refresh (if enabled)
1. Leave dashboard open for 5 minutes
2. Observe:
   - [ ] Data updates automatically
   - [ ] No page flicker/reload
   - [ ] Smooth transitions
   - [ ] Console shows refresh log messages

---

## Supabase Integration Test

### Verify Data Source
1. Open Network tab in DevTools
2. Filter by "supabase" or gateway URL
3. Click refresh on any tab
4. Observe:
   - [ ] Request sent to `localhost:8788` or Supabase
   - [ ] Response status 200
   - [ ] JSON data returned
   - [ ] Response time <2 seconds

### Check Materialized Views
```bash
# In Supabase Dashboard or psql
SELECT * FROM analytics_daily_metrics LIMIT 5;
SELECT * FROM provider_performance LIMIT 5;
SELECT * FROM model_usage LIMIT 5;
```

- [ ] Views contain data
- [ ] Data is recent (not stale)
- [ ] No NULL values where unexpected

### Test Data Changes
1. Generate new API usage (run a test request through main app)
2. Wait for materialized view refresh (may take minutes depending on schedule)
3. Refresh analytics dashboard
4. Verify:
   - [ ] New data appears
   - [ ] Counts incremented
   - [ ] Charts updated

---

## Error Handling Test

### Network Error
1. Stop the analytics gateway: `Ctrl+C` in gateway terminal
2. Try to refresh a dashboard tab
3. Expected:
   - [ ] Error message displays
   - [ ] "Unable to connect" or similar
   - [ ] Dashboard doesn't crash
   - [ ] Retry button appears (if implemented)

4. Restart gateway, click retry/refresh
5. Expected:
   - [ ] Data loads successfully
   - [ ] Error message disappears

### Invalid Data
1. Check console for any errors
2. Check for empty states:
   - [ ] "No data available" message when appropriate
   - [ ] Empty charts show placeholder
   - [ ] Loading states don't hang

---

## Browser Console Check

### No Errors Expected
Look for these in Console tab (should NOT see):
- ❌ Red error messages
- ❌ "Failed to fetch"
- ❌ "undefined is not a function"
- ❌ "Cannot read property"
- ❌ TypeScript errors
- ❌ React warnings (yellow)

### Acceptable Logs (may see):
- ✅ "[Gateway] Connected"
- ✅ "Data fetched successfully"
- ✅ "Cache hit" / "Cache miss"
- ✅ Network request logs

---

## Performance Check

### Load Time
- [ ] Initial page load <3 seconds
- [ ] Tab switch <500ms
- [ ] Chart render <1 second
- [ ] Data fetch <2 seconds

### Responsiveness
- [ ] No UI freezing
- [ ] Smooth animations
- [ ] Buttons respond immediately
- [ ] Charts interactive (hover, zoom, etc.)

### Memory
Open DevTools > Performance > Memory
1. Load dashboard
2. Switch between all tabs 3 times
3. Check:
   - [ ] Memory usage stable (not climbing indefinitely)
   - [ ] No memory leaks
   - [ ] Garbage collection working

---

## Browser Compatibility

Test in at least 2 browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest) - Mac only

**Check:**
- Layout consistent
- Charts render correctly
- Colors match
- Fonts load properly
- No visual glitches

---

## Final Checklist

### Before Approving Production
- [ ] All tabs load successfully
- [ ] Data displays correctly
- [ ] Refresh button works on all tabs
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Performance acceptable
- [ ] Charts render smoothly
- [ ] Keyboard shortcuts work
- [ ] Error handling graceful
- [ ] At least 2 browsers tested
- [ ] Gateway healthy and responding
- [ ] Supabase connection verified
- [ ] Data updates when refreshed

### Issues Found
Document any issues here:

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Sign-Off
**Tested By:** _________________  
**Date:** _________________  
**All Tests Passed:** [ ] Yes [ ] No  
**Ready for Production:** [ ] Yes [ ] No [ ] With caveats

---

## Quick Troubleshooting

### Dashboard won't load
- Check gateway is running: `curl http://localhost:8788/health`
- Check dev server running: `ps aux | grep vite`
- Clear browser cache: Cmd+Shift+R
- Check `.env.analytics` file has Supabase credentials

### No data showing
- Verify Supabase credentials correct
- Check materialized views exist in Supabase
- Check gateway logs for errors
- Test API endpoint directly: `curl http://localhost:8788/api/v1/metrics/daily`

### Charts not rendering
- Check browser console for errors
- Verify chart library loaded (recharts)
- Check data format matches expected schema
- Try different browser

### Slow performance
- Check network requests (DevTools > Network)
- Look for repeated/redundant requests
- Check bundle size in Network tab
- Monitor gateway cache hit rate

---

## Test Automation Script

Run automated checks:
```bash
npm run test:smoke  # or
node scripts/smoke-test.mjs
```

This tests:
- Gateway health
- Server responses
- API endpoints
- CORS configuration
- Response times
- Error handling

---

## Next Steps After Testing

If all tests pass:
1. Update `PRODUCTION_SMOKE_TEST.md` with results
2. Check off items in `PRODUCTION_READINESS_REPORT.md`
3. Document any issues found
4. Create tickets for optimizations
5. Proceed with deployment planning

If tests fail:
1. Document exact failure steps
2. Check error messages in console
3. Review gateway logs
4. Fix issues and re-test
5. Update test documentation

