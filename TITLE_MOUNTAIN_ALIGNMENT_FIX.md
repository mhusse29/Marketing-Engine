# Title-Mountain Alignment Fix ✅

## Problem
The titles (CREATE, AMPLIFY, ELEVATE) were transitioning too quickly, appearing before the mountains fully descended to reveal the white lightning beam. This caused a disconnect between the visual narrative and the title progression.

## Root Cause
The scroll sections had insufficient spacing:
- `.scroll-sections` had `margin-top: 100vh` (~1080px)
- Each `.content-section` was `100vh` tall (~1080px)
- This meant AMPLIFY appeared at ~1080px and ELEVATE at ~2160px
- But mountains don't hide until **4900px** (0.7 progress)
- Titles were transitioning **way too early** before the mountain descent animation completed

## Solution

### CSS Changes (`src/styles/horizon-hero.css`)

**Before:**
```css
.scroll-sections {
  margin-top: 100vh;  /* ~1080px - too early! */
}

.content-section {
  min-height: 100vh;  /* ~1080px - sections too short */
}
```

**After:**
```css
.scroll-sections {
  /* Delay title transitions to align with mountain descent (~4000px) */
  margin-top: 3800px;
}

.content-section {
  /* Taller sections so titles stay visible longer */
  min-height: 1600px;
}
```

## New Title Timing

| Scroll Range | Title | Mountain State | White Beam | Progress |
|--------------|-------|----------------|------------|----------|
| 0-3800px | CREATE | Visible, beginning descent | Starting to glow | 0.00-0.54 |
| 3800-5400px | AMPLIFY | Descending → Hidden | Expanding | 0.54-0.77 |
| 5400-7000px | ELEVATE | Fully hidden | Fully revealed | 0.77-1.00 |

### Key Improvements ✅

**CREATE (0-3800px)**
- Now stays visible for 3800px instead of just 1080px
- Mountains are prominent and beginning their descent
- Viewer has time to absorb the opening message

**AMPLIFY (3800-5400px)**
- Appears at 3800px when mountains are descending
- Mountains hide at 4900px (middle of AMPLIFY section)
- Perfect timing: "AMPLIFY" appears as scene amplifies visually
- 1600px duration gives smooth transition

**ELEVATE (5400-7000px)**
- Appears at 5400px after mountains are fully gone
- White beam is fully revealed and dominant
- Scene has "elevated" to pure light/energy
- Final 1600px lets message resonate before Media Plan section

## Visual Narrative Flow

1. **CREATE (Mountains + Cosmic Sky)**
   - Mountains frame the title
   - Sense of foundation and beginning
   - Camera flying forward

2. **AMPLIFY (Mountains Descending)**
   - Visual intensity increases
   - Mountains breaking apart/pixelating
   - White beam emerging

3. **ELEVATE (Pure White Beam)**
   - Mountains completely gone
   - Camera deep in the light
   - Climactic visual peak
   - Counter shows "02 / 02" - journey complete

## Technical Details

### Spacing Calculation
```
Total scroll range: 7000px (HORIZON_SCROLL_HEIGHT)
Mountains hide at: 4900px (0.7 * 7000)

CREATE section: 0-3800px (fixed title)
scroll-sections margin-top: 3800px
AMPLIFY section: 3800-5400px (1600px tall)
ELEVATE section: 5400-7000px (1600px tall)
```

### Mountain Hide Timing
```typescript
// In horizon-hero-section.tsx line 605-611
if (progress > 0.7) {
  mountain.position.z = 600000;  // Hide mountains at 4900px
}
```

This happens during the AMPLIFY section (3800-5400px), creating a seamless transition where:
- AMPLIFY appears → mountains begin descending
- Middle of AMPLIFY → mountains disappear
- ELEVATE appears → pure white beam visible

## Verification Screenshots

### 0px - CREATE with Mountains
✅ Mountains fully visible, framing the title

### 4000px - AMPLIFY Transition
✅ Mountains descending, AMPLIFY visible

### 4900px - Mountains Hidden
✅ AMPLIFY still showing, white beam prominent, mountains gone

### 5500px - ELEVATE Visible
✅ ELEVATE on screen with full white beam

### 7000px - End State
✅ Complete white beam, "02 / 02" counter, ready for Media Plan section

## Files Modified

1. **src/styles/horizon-hero.css**
   - `.scroll-sections` margin-top: `100vh` → `3800px`
   - `.content-section` min-height: `100vh` → `1600px`
   - (Updated both occurrences in the file)

## Benefits

✅ **Narrative Coherence**: Titles now match visual story progression
✅ **Pacing**: Each title visible for appropriate duration (~1600-3800px)
✅ **Mountain Alignment**: AMPLIFY appears as mountains descend, ELEVATE after they're gone
✅ **User Experience**: Smooth, cinematic flow without jarring transitions
✅ **Beam Reveal**: White beam fully revealed before ELEVATE appears

## Related Documentation
- Previous fix: `HORIZON_SCROLL_FIX_COMPLETE.md` (fixed scroll calculation)
- Component: `src/components/ui/horizon-hero-section.tsx`
- Styles: `src/styles/horizon-hero.css`
