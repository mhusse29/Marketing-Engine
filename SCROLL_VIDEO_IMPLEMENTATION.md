# Scroll Video Section - 3-Phase Implementation

## ✅ Component Created: `scroll-video-section.tsx`

### Architecture

**Self-contained React component** with scroll-driven GSAP animations across 3 distinct phases.

---

## 🎬 Three Animation Phases

### **Phase 1: Card Emergence (0% - 25% scroll)**
- **Video scales**: 0.3 → 1.0 (small card → full screen)
- **Border radius**: 20px → 0px (rounded → sharp corners)
- **Opacity**: Fully visible
- **Overlay**: Hidden (opacity: 0)
- **Text**: Hidden

### **Phase 2: Overlay Phase (25% - 60% scroll)**
- **Video**: Full size, locked at scale: 1.0
- **Overlay**: Fades in to 60% opacity with dark background
- **Text**: Fades in and slides up (y: 30 → 0)
- **Progress bar**: Animates from 0% → 100% width
- **Interactive**: CTA button appears and is clickable

### **Phase 3: Collapse/Exit (60% - 100% scroll)**
- **Video**: 
  - ScaleY: 1.0 → 0.2 (vertical squash)
  - TranslateY: 0 → -200px (slides up)
  - Opacity: 1.0 → 0.5 (fades)
- **Overlay**: Fades out completely
- **Text**: Fades out and slides up further
- **Background**: Darkens to black (rgba 0 → 0.9)

---

## 🏗️ Component Structure

```tsx
<div className="scroll-video-section" style={{ position: relative, height: 300vh }}>
  <div className="sticky-wrapper" style={{ position: sticky, top: 0, height: 100vh }}>
    <video ref={videoRef} />
    <div ref={overlayRef}>
      <div ref={progressBarRef} /> {/* Progress bar */}
      <div ref={textRef}>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <button onClick={handleCTA}>{ctaText}</button>
      </div>
    </div>
  </div>
</div>
```

---

## 📦 Props Interface

```typescript
interface ScrollVideoSectionProps {
  videoSrc: string;           // Path to video file
  posterSrc?: string;         // Optional poster image
  title?: string;             // Main heading (default: "Stop Guessing.")
  subtitle?: string;          // Subheading (default: "Start Planning.")
  ctaText?: string;           // Button text (default: "Launch Media Plan Calculator")
  ctaAction?: () => void;     // Optional custom action
}
```

---

## 🎯 Usage in LandingPage.tsx

```tsx
import { ScrollVideoSection } from '@/components/ui/scroll-video-section';

<ScrollVideoSection
  videoSrc="/assets/videos/media-plan-calculator-demo.webm"
  title="Stop Guessing."
  subtitle="Start Planning."
  ctaText="Launch Media Plan Calculator"
/>
```

---

## ⚙️ Technical Implementation

### GSAP ScrollTrigger Setup
- **Trigger**: Container element (300vh tall)
- **Start**: 'top top'
- **End**: 'bottom bottom'
- **Scrub**: 1.2 (smooth synchronized scrolling)
- **Pin**: false (uses sticky positioning instead)

### Manual Phase Control
```javascript
onUpdate: (self) => {
  const progress = self.progress; // 0 to 1
  
  if (progress <= 0.25) {
    // Phase 1: Emergence
    const phase1Progress = progress / 0.25;
    gsap.set(video, { scale: 0.3 + (phase1Progress * 0.7) });
  }
  else if (progress <= 0.6) {
    // Phase 2: Overlay
    const phase2Progress = (progress - 0.25) / 0.35;
    gsap.set(overlay, { opacity: 0.6 });
    gsap.set(progressBar, { scaleX: phase2Progress });
  }
  else {
    // Phase 3: Collapse
    const phase3Progress = (progress - 0.6) / 0.4;
    gsap.set(video, { scaleY: 1 - (phase3Progress * 0.8) });
  }
}
```

### Sticky Positioning
```css
.sticky-wrapper {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### GPU Acceleration
- Video element has `will-change: transform`
- All animations use `transform` and `opacity` (GPU-accelerated properties)

---

## 🎨 Visual Elements

### Progress Bar
- **Position**: Top of overlay (4px height)
- **Background**: Gradient from violet to cyan
- **Animation**: ScaleX from 0 to 1 during Phase 2
- **Style**: `linear-gradient(90deg, #7c3aed, #22d3ee)`

### Overlay
- **Background**: `rgba(0, 0, 0, 0.4)`
- **Backdrop filter**: `blur(2px)`
- **Content**: Centered flex column
- **Pointer events**: Disabled except on CTA button

### Text Styling
- **Title**: 
  - Gradient text effect
  - Responsive: clamp(40px, 8vw, 96px)
  - Font weight: 900
- **Subtitle**:
  - Uppercase, letter-spaced
  - Color: #9ca3af
- **CTA Button**:
  - Gradient background
  - Hover effects (lift + glow)
  - Fully interactive during Phase 2

---

## 🚀 Performance Optimizations

1. **Video Preload**: `onLoadedData` event ensures video is ready
2. **GPU Hints**: `will-change: transform` on animated elements
3. **Smooth Scrub**: GSAP scrub: 1.2 for butter-smooth animation
4. **Cleanup**: All ScrollTriggers killed on unmount
5. **Autoplay**: Video starts muted with playsInline for mobile

---

## 📐 Section Height Calculation

- **Total section height**: 300vh (3x viewport height)
- **Sticky container**: 100vh (always fills viewport)
- **Phase breakdown**:
  - Phase 1: 0-75vh scroll (25% of 300vh)
  - Phase 2: 75vh-180vh scroll (35% of 300vh)
  - Phase 3: 180vh-300vh scroll (40% of 300vh)

---

## 🎯 Key Differences from Original HeroScrollVideo

| Feature | Original | New Scroll Video Section |
|---------|----------|--------------------------|
| Phases | 1 continuous timeline | 3 distinct phases |
| Control | Timeline-based | Manual onUpdate calculations |
| Collapse | No collapse | Phase 3 vertical squash + exit |
| Progress Bar | No progress bar | Animated progress in Phase 2 |
| Headline Exit | Roll-away 3D rotation | Fade + slide up |
| Section Height | 280vh (configurable) | 300vh (fixed for 3 phases) |
| Sticky | CSS sticky + GSAP | CSS sticky only |

---

## 🔧 Dependencies

```bash
npm install gsap@^3
```

Already installed in your project:
- `gsap@^3.13.0` ✅
- `@gsap/react@^2.1.2` ✅

---

## 🐛 Debugging

Uncomment this line in `scroll-video-section.tsx`:
```javascript
// markers: true, // Line 81
```

This shows ScrollTrigger start/end markers for visual debugging.

---

## ✨ Result

A self-contained, high-performance scroll video component with:
- ✅ 3-phase scroll-driven animation
- ✅ Card emergence with scale + border-radius
- ✅ Overlay phase with progress bar
- ✅ Collapse/exit with vertical squash
- ✅ Sticky positioning (position: sticky)
- ✅ GPU-accelerated transforms
- ✅ Interactive CTA button
- ✅ Responsive text sizing
- ✅ Video autoplay handling
- ✅ Clean unmount/cleanup

Total scroll range: **300vh** for smooth, controlled animation across all 3 phases.
