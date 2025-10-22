# Production Smoke Test Checklist

**Date:** October 19, 2025  
**Purpose:** End-to-end verification before production deployment

---

## Pre-Flight Checks

### Build Verification
- [ ] TypeScript compilation passes (`npx tsc -b`)
- [ ] Web build succeeds (`npm run web:build`)
- [ ] Analytics build succeeds (`npm run analytics:build`)
- [ ] Admin build succeeds (`npm run admin:build`)
- [ ] No critical warnings in build output

### Environment Setup
- [ ] `.env.analytics` configured with Supabase credentials
- [ ] Analytics gateway running on port 8788
- [ ] Analytics dev server running on port 5174
- [ ] Supabase project accessible
- [ ] API keys valid and not expired

---

## Analytics Dashboard Tests

### Tab 1: Overview
- [ ] Page loads without errors
- [ ] Total requests counter displays
- [ ] Cost metrics show data
- [ ] Usage charts render
- [ ] Real-time updates work
- [ ] Refresh button updates data
- [ ] No console errors

### Tab 2: Cost Analysis
- [ ] Cost breakdown by provider loads
- [ ] Charts render correctly
- [ ] Historical data displays
- [ ] Filter controls work
- [ ] Export functionality works
- [ ] Refresh updates data

### Tab 3: Performance Metrics
- [ ] Response time charts load
- [ ] Latency metrics display
- [ ] Provider comparison works
- [ ] Time range filters work
- [ ] Real-time updates active
- [ ] Refresh button works

### Tab 4: Provider Analytics
- [ ] Provider list populates
- [ ] Model usage data shows
- [ ] Success/failure rates display
- [ ] Charts render correctly
- [ ] Filtering works
- [ ] Refresh updates data

### Tab 5: Usage Trends
- [ ] Trend charts load
- [ ] Historical data displays
- [ ] Time series data correct
- [ ] Aggregations work
- [ ] Refresh updates data
- [ ] No data gaps

### Tab 6: Capacity Forecasting
- [ ] Forecast models load
- [ ] Predictions display
- [ ] Budget alerts work
- [ ] Capacity warnings show
- [ ] Refresh updates data
- [ ] Charts render correctly

### Tab 7: Feedback Analytics
- [ ] Feedback data loads
- [ ] Rating distributions show
- [ ] Sentiment analysis works
- [ ] Touchpoint breakdown displays
- [ ] Refresh updates data
- [ ] Charts render correctly

---

## Supabase Integration Tests

### Data Fetching
- [ ] Initial load fetches from Supabase
- [ ] Materialized views refresh correctly
- [ ] Real-time subscriptions work
- [ ] Error handling graceful
- [ ] Loading states display
- [ ] Empty states handled

### Data Updates
- [ ] Manual refresh triggers re-fetch
- [ ] Auto-refresh interval works (if enabled)
- [ ] Data changes reflected in UI
- [ ] Optimistic updates work
- [ ] Stale data warnings show
- [ ] Cache invalidation works

### Authentication
- [ ] Auth tokens valid
- [ ] RLS policies enforced
- [ ] Unauthorized access blocked
- [ ] Token refresh works
- [ ] Logout clears auth state
- [ ] Re-login seamless

---

## Interactive Features

### Navigation
- [ ] All tabs accessible
- [ ] Tab switching smooth
- [ ] Back/forward buttons work
- [ ] Deep linking works
- [ ] URL updates correctly
- [ ] No navigation errors

### User Actions
- [ ] Refresh button (all tabs)
- [ ] Filter controls responsive
- [ ] Date range pickers work
- [ ] Export buttons functional
- [ ] Search/filter instant
- [ ] Keyboard shortcuts work

### Keyboard Shortcuts
- [ ] `Cmd+R` / `Ctrl+R` - Refresh current tab
- [ ] Tab navigation shortcuts
- [ ] Focus management correct
- [ ] Accessibility maintained
- [ ] No shortcut conflicts

---

## Performance Checks

### Load Times
- [ ] Initial page load < 3s
- [ ] Tab switch < 500ms
- [ ] Data fetch < 2s
- [ ] Chart render < 1s
- [ ] No UI blocking
- [ ] Smooth animations

### Bundle Size
- [ ] Analytics bundle analyzed
- [ ] Code splitting effective
- [ ] Lazy loading works
- [ ] No duplicate dependencies
- [ ] Tree shaking effective
- [ ] Asset optimization done

### Runtime Performance
- [ ] No memory leaks
- [ ] CPU usage reasonable
- [ ] Network requests optimized
- [ ] No redundant fetches
- [ ] Caching works
- [ ] No infinite loops

---

## Error Handling

### Network Errors
- [ ] Offline mode graceful
- [ ] Timeout handling works
- [ ] Retry logic functional
- [ ] Error messages clear
- [ ] Recovery automatic
- [ ] User notified appropriately

### Data Errors
- [ ] Invalid data handled
- [ ] Missing data displays empty state
- [ ] Corrupt data caught
- [ ] Type mismatches handled
- [ ] Null/undefined safe
- [ ] Error boundaries work

### UI Errors
- [ ] Component errors caught
- [ ] React error boundaries active
- [ ] Graceful degradation
- [ ] User can recover
- [ ] Errors logged
- [ ] No white screens

---

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] All features work
- [ ] No visual bugs
- [ ] Performance acceptable

### Mobile Browsers (if applicable)
- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Responsive layout
- [ ] Touch events work
- [ ] Performance acceptable

---

## Production Build Tests

### Build Process
- [ ] Clean build succeeds
- [ ] Assets optimized
- [ ] Source maps generated
- [ ] Environment variables set
- [ ] No dev dependencies included
- [ ] Build reproducible

### Deployment Readiness
- [ ] Static files generated
- [ ] CDN assets ready
- [ ] Compression enabled
- [ ] Cache headers correct
- [ ] Security headers set
- [ ] HTTPS enforced

---

## Technical Debt Items

### CSS Gradients
- [ ] Identify outdated gradient syntax
- [ ] Update to new syntax (e.g., `closest-side at 0 0`)
- [ ] Test visual appearance unchanged
- [ ] Verify browser compatibility
- [ ] Document changes

### Bundle Optimization
- [ ] Analyze 2.4 MB analytics bundle
- [ ] Implement code splitting strategy
- [ ] Lazy load heavy components
- [ ] Consider dynamic imports
- [ ] Measure impact on load time
- [ ] Document optimization choices

### Feature Flags
- [ ] Review disabled video features
- [ ] Verify menu features intentional
- [ ] Document feature decisions
- [ ] Clean up unused code
- [ ] Update feature documentation
- [ ] Test re-enablement if needed

---

## Security Checks

### Authentication
- [ ] API keys not exposed
- [ ] Service role key secure
- [ ] Client-side auth safe
- [ ] Tokens expire correctly
- [ ] No XSS vulnerabilities
- [ ] CSRF protection active

### Data Access
- [ ] RLS policies tested
- [ ] User data isolated
- [ ] Admin access controlled
- [ ] Query injection prevented
- [ ] Input validation works
- [ ] Output sanitized

---

## Monitoring & Logging

### Application Logs
- [ ] Client errors logged
- [ ] Server errors logged
- [ ] Warning thresholds set
- [ ] Log levels appropriate
- [ ] PII not logged
- [ ] Logs accessible

### Analytics Tracking
- [ ] User actions tracked
- [ ] Performance metrics captured
- [ ] Error rates monitored
- [ ] Usage patterns visible
- [ ] Alerts configured
- [ ] Dashboards accessible

---

## Final Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No critical issues
- [ ] Documentation updated
- [ ] Team notified
- [ ] Rollback plan ready
- [ ] Monitoring active

### Deployment
- [ ] Staging environment tested
- [ ] Production credentials verified
- [ ] DNS configured correctly
- [ ] SSL certificates valid
- [ ] CDN configured
- [ ] Health checks passing

### Post-Deployment
- [ ] Smoke test in production
- [ ] Monitor for errors
- [ ] Check performance metrics
- [ ] Verify user access
- [ ] Confirm data flow
- [ ] Document any issues

---

## Test Results

### Build Status
```
TypeScript: ✅ PASS
Web Build: [ ]
Analytics Build: [ ]
Admin Build: [ ]
```

### Runtime Tests
```
Gateway Health: [ ]
Analytics Dev: [ ]
Tab Loading: [ ]
Data Fetching: [ ]
Refresh Actions: [ ]
Keyboard Shortcuts: [ ]
```

### Performance
```
Initial Load: [ ]
Tab Switch: [ ]
Data Fetch: [ ]
Bundle Size: [ ]
Memory Usage: [ ]
```

---

## Issues Found

### Critical (Blockers)
- None

### High Priority
- TBD

### Medium Priority
- CSS gradient syntax warnings
- Large bundle size (2.4 MB)

### Low Priority
- TBD

---

## Sign-Off

**Tested By:** _________________  
**Date:** _________________  
**Production Ready:** [ ] Yes [ ] No  
**Notes:** _________________

