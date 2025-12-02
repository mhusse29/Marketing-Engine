# Test Plan for Bug Fixes

## Quick Verification Steps

### Issue 1: Content Generation
**Test 1 - Empty Brief Validation**
1. Open the app (http://localhost:5173)
2. Click "Generate" without entering a brief
3. ✅ **Expected**: Alert appears saying "Content needs a brief"
4. ❌ **Failure**: Silent fail or blank results

**Test 2 - Successful Generation**
1. Enter a brief: "Social media post about sustainable energy"
2. Click "Generate"
3. ✅ **Expected**: Content appears in cards
4. Check console for clean logging (no errors)

**Test 3 - Empty Results Feedback**
1. If AI returns empty results (rare but possible)
2. ✅ **Expected**: Amber warning box with helpful suggestions
3. Message should say "The AI didn't generate any content. Try:"

---

### Issue 2: Stage Manager Performance

**Test 4 - Smooth Animations**
1. Generate content
2. Click minimize button on any card
3. ✅ **Expected**: Stage Manager appears smoothly (no stuttering)
4. Animation should feel like 60fps

**Test 5 - Scrolling Performance**
1. Minimize 3-4 different cards
2. Scroll through Stage Manager list
3. ✅ **Expected**: Smooth scrolling, no lag
4. Open DevTools Performance tab - should see consistent 60fps

**Test 6 - Hover Effects**
1. Hover over cards in Stage Manager
2. ✅ **Expected**: Smooth 3D tilt effect
3. No flickering or jumping

**Test 7 - Restoration**
1. Click on a minimized card
2. ✅ **Expected**: Card restores smoothly to main view
3. Stage Manager updates without lag

---

### Issue 3: Smart Card Behavior

**Test 8 - Clear Error States**
1. Try generating with network disconnected
2. ✅ **Expected**: Red error box with clear message
3. Should differentiate from empty results

**Test 9 - Loading States**
1. Click "Generate" with valid brief
2. ✅ **Expected**: Clear loading indicator
3. Cards show "Queued → Thinking → Rendering → Ready"

**Test 10 - Platform Switching**
1. Generate multi-platform content
2. Click between platform tabs (LinkedIn, Facebook, etc.)
3. ✅ **Expected**: Instant switching, content persists

---

## Performance Benchmarks

### Stage Manager FPS Test
```javascript
// Open DevTools Console and run:
let fps = 0;
let lastTime = performance.now();
function measureFPS() {
  const now = performance.now();
  fps = 1000 / (now - lastTime);
  lastTime = now;
  console.log(`FPS: ${fps.toFixed(1)}`);
  requestAnimationFrame(measureFPS);
}
measureFPS();
// Then scroll Stage Manager - should stay ~60fps
```

### Memory Usage Test
1. Open DevTools → Performance tab
2. Click "Record"
3. Minimize 5 cards, scroll, restore 2 cards
4. Stop recording
5. ✅ **Expected**: No memory leaks, ~40% less GPU time vs before

---

## Regression Tests

**Test 11 - Multi-Card Generation**
1. Enable all 3 cards (Content, Pictures, Video)
2. Generate all at once
3. ✅ **Expected**: All cards populate correctly
4. No interference between cards

**Test 12 - Regeneration**
1. Generate content
2. Click "Regenerate"
3. ✅ **Expected**: Old content minimized to Stage Manager
4. New content appears smoothly

**Test 13 - Settings Persistence**
1. Change settings (tone, platform, etc.)
2. Generate content
3. Reload page
4. ✅ **Expected**: Settings persist
5. Previous content restored from Stage Manager

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (primary)
- [ ] Firefox
- [ ] Safari

All fixes should work across browsers.

---

## Known Limitations

1. Pre-existing TypeScript errors (documented in DIAGNOSTIC_REPORT.md)
2. Stage Manager 3D effects require GPU acceleration
3. Some animations may be reduced in Firefox

---

## Quick Command Reference

```bash
# Start dev server
npm run dev

# Check for console errors
# Open DevTools → Console

# Monitor performance
# Open DevTools → Performance → Record

# Check network requests
# Open DevTools → Network → Filter: "generate"
```

---

## Success Criteria

✅ All 13 tests pass
✅ No new console errors
✅ Performance at 60fps
✅ Clear user feedback at every step
✅ No confusion about app state

---

## If Issues Persist

1. Clear browser cache
2. Restart dev server
3. Check `DIAGNOSTIC_REPORT.md` for details
4. Verify AI Gateway is running: `curl http://localhost:8787/health`
5. Check console for specific error messages
