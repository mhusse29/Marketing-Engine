# Hackathon Terminal Theme Guide

## Overview

The **Hackathon Terminal Theme** transforms the analytics admin dashboard into a high-energy, cyberpunk-inspired interface with neon cyan accents, monospace typography, and matrix-style animations. This theme maintains all existing functionality while providing a dramatically different visual experience.

## Activation

The theme is **automatically enabled** for the analytics dashboard. It uses `data-theme="terminal"` on the root container.

To toggle the theme in your own components:
```tsx
<div data-theme="terminal">
  {/* Your content */}
</div>
```

## Color Palette

### Core Colors
- **Background**: `#0b0d13` - Deep space black
- **Panel Background**: `#111522` - Dark slate
- **Secondary Panel**: `#161b2a` - Midnight blue

### Accent Colors
- **Primary (Cyan)**: `#4deeea` - Neon cyan for navigation, primary actions, metrics
- **Success (Green)**: `#9ef01a` - Bright green for positive states, success badges
- **Warning (Amber)**: `#f7b32b` - Electric amber for warnings, caution states
- **Alert (Magenta)**: `#ff1178` - Hot pink for critical alerts, errors
- **Secondary (Purple)**: `#9d4edd` - Violet for secondary actions, cost metrics

### Text Colors
- **Primary Text**: `#e5f8ff` - Ice blue
- **Muted Text**: `#8a939f` - Steel gray
- **Disabled**: `#5f677c` - Charcoal

## Typography

**Monospace Stack** (applied globally):
```css
font-family: "JetBrains Mono", "Fira Code", ui-monospace, 
  SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", 
  "Courier New", monospace;
```

### Text Utilities
- `.terminal-uppercase` - Uppercase with letter-spacing
- `.terminal-text-glow` - Adds cyan neon glow effect
- `.terminal-panel__title` - Small uppercase section headers

## Component Classes

### Panels & Cards

**`.terminal-panel`** - Standard panel with gradient background and neon border
```tsx
<div className="terminal-panel p-6">
  <h3 className="terminal-panel__title">Section Title</h3>
  {/* content */}
</div>
```

**`.terminal-card`** - Interactive card with hover glow effect
```tsx
<div className="terminal-card">
  {/* content */}
</div>
```

### Navigation

**`.terminal-nav`** - Navigation container
**`.terminal-nav__item`** - Navigation button
**`.terminal-nav__item--active`** - Active navigation state

```tsx
<div className="terminal-nav">
  <button className="terminal-nav__item terminal-nav__item--active">
    Active Tab
  </button>
  <button className="terminal-nav__item">
    Inactive Tab
  </button>
</div>
```

### Buttons

**`.terminal-button`** - Base button style (transparent with border)
**`.terminal-button--primary`** - Primary cyan button
**`.terminal-button--secondary`** - Purple accent button
**`.terminal-button--success`** - Green success button

```tsx
<button className="terminal-button terminal-button--primary">
  Execute
</button>
```

### Badges & Status Indicators

**Status Badges:**
- `.terminal-badge` - Base badge
- `.terminal-badge--active` - Green active state
- `.terminal-badge--alert` - Red pulsing alert (animated)
- `.terminal-badge--warning` - Amber with diagonal stripes
- `.terminal-badge--offline` - Gray with dashed border

```tsx
<span className="terminal-badge terminal-badge--active">
  <span className="terminal-led"></span>
  Online
</span>
```

**LED Indicators:**
- `.terminal-led` - Green LED (default)
- `.terminal-led--alert` - Red blinking LED
- `.terminal-led--warning` - Amber LED
- `.terminal-led--primary` - Cyan LED

### Metrics & KPIs

**`.terminal-metric`** - Large glowing metric display with pulse animation
**`.terminal-metric--success`** - Green metric
**`.terminal-metric--warning`** - Amber metric
**`.terminal-metric--alert`** - Red metric

```tsx
<div className="terminal-kpi">
  <p className="terminal-kpi__label">Active Users</p>
  <p className="terminal-metric">1,247</p>
</div>
```

### Tables

**`.terminal-table`** - Styled table with neon accents

```tsx
<table className="terminal-table">
  <thead>
    <tr>
      <th>Metric</th>
      <th>Value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Requests</td>
      <td>10,234</td>
    </tr>
  </tbody>
</table>
```

Features:
- Alternating row colors
- Uppercase headers with cyan underline
- Hover highlight effect
- Neon scrollbar

### Forms & Inputs

**`.terminal-input`** - Input field with focus glow

```tsx
<input 
  type="text" 
  className="terminal-input" 
  placeholder="Enter command..."
/>
```

### Loading States

**ASCII Spinner:**
```tsx
<div className="terminal-loader">
  <div className="terminal-loader__spinner">|</div>
  <span>Loading...</span>
</div>
```

**Progress Bar:**
```tsx
<div className="terminal-loader__bar"></div>
```

### Utility Classes

**`.terminal-separator`** - Dashed horizontal separator
```tsx
<div className="terminal-separator"></div>
```

**`.terminal-scroll`** - Apply neon scrollbar styling
```tsx
<div className="terminal-scroll overflow-auto">
  {/* scrollable content */}
</div>
```

**`.terminal-live-indicator`** - Blinking cursor effect for live data
```tsx
<div className="terminal-live-indicator">
  <span className="terminal-led terminal-led--primary"></span>
  LIVE
</div>
```

## Background Effects

The theme includes an animated matrix-style background:

**`.terminal-matrix-bg`** - Matrix grid animation (automatically applied to dashboard)
**`.terminal-matrix-overlay`** - Pulsing highlight overlay

These are automatically applied to the main dashboard container and shouldn't need manual application.

## Chart Styling

Charts are automatically styled with:
- Neon grid lines (cyan at 10% opacity)
- Monospace axis labels
- Terminal-style tooltips with dark background and cyan border
- Glowing data lines with drop-shadow filters

### Example Chart Configuration
```tsx
<Tooltip 
  contentStyle={{ 
    backgroundColor: 'rgba(11,13,19,0.95)', 
    border: '1px solid #4deeea',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px'
  }}
  labelStyle={{ color: '#e5f8ff' }}
/>
```

## Animations

All animations are defined in the theme CSS:

- **`terminal-alert-pulse`** - Pulsing glow for alerts (1.5s)
- **`terminal-led-blink`** - LED blinking effect (1s)
- **`terminal-matrix-scroll`** - Background matrix animation (20s)
- **`terminal-pulse-bg`** - Background pulse (3s)
- **`terminal-metric-pulse`** - Metric glow pulse (2s)
- **`terminal-cursor-blink`** - Cursor blink for live indicators (1s)
- **`terminal-spinner`** - ASCII spinner rotation (1s, 4 steps)
- **`terminal-bar-slide`** - Progress bar slide (1.5s)

## Implementation Example

Here's a complete panel with all terminal theme elements:

```tsx
<div className="terminal-panel p-6">
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="terminal-panel__title">System Status</h3>
    <span className="terminal-badge terminal-badge--active">
      <span className="terminal-led"></span>
      Operational
    </span>
  </div>

  {/* Separator */}
  <div className="terminal-separator"></div>

  {/* Metrics Grid */}
  <div className="grid grid-cols-3 gap-4 mb-4">
    <div>
      <p className="terminal-panel__title">Uptime</p>
      <p className="terminal-metric terminal-metric--success">99.9%</p>
    </div>
    <div>
      <p className="terminal-panel__title">Latency</p>
      <p className="terminal-metric terminal-metric--warning">245ms</p>
    </div>
    <div>
      <p className="terminal-panel__title">Errors</p>
      <p className="terminal-metric terminal-metric--alert">3</p>
    </div>
  </div>

  {/* Action Button */}
  <button className="terminal-button terminal-button--primary w-full">
    Run Diagnostics
  </button>
</div>
```

## CSS Variables

All colors and effects are defined as CSS custom properties in `:root[data-theme='terminal']`:

```css
--terminal-bg: #0b0d13;
--terminal-accent-primary: #4deeea;
--terminal-accent-success: #9ef01a;
--terminal-accent-warning: #f7b32b;
--terminal-accent-alert: #ff1178;
--terminal-accent-secondary: #9d4edd;
--terminal-font-family: 'JetBrains Mono', ...;
--terminal-border-radius: 8px;
--terminal-glow-primary: 0 0 20px rgba(77, 238, 234, 0.4);
```

## Accessibility

The theme maintains accessibility with:
- High contrast text (cyan #4deeea on dark backgrounds meets WCAG AA)
- Monospace fonts improve readability for data-heavy interfaces
- Color is supplemented with icons and labels
- Animations can be disabled via `prefers-reduced-motion`

## Browser Compatibility

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **Fallbacks**: Monospace fonts fall back to system defaults
- **Animations**: Hardware-accelerated transforms and opacity

## Performance

The theme is optimized for performance:
- CSS-only animations (no JavaScript)
- GPU-accelerated effects (transform, opacity)
- Minimal repaints (fixed/absolute positioned overlays)
- Lazy-loaded background effects

## Migration from Existing Styles

To convert existing components:

1. **Replace glass cards**: `glass-card` → `terminal-panel`
2. **Replace buttons**: Custom styles → `terminal-button terminal-button--primary`
3. **Replace badges**: Custom → `terminal-badge terminal-badge--active`
4. **Update colors**: Use hex codes from palette or CSS variables
5. **Add glow effects**: Apply `terminal-text-glow` to key metrics

## Files Modified

- `src/styles/theme-hackathon.css` - Complete theme stylesheet (686 lines)
- `src/pages/StandaloneAnalyticsDashboard.tsx` - Main dashboard with theme activation
- `src/components/Analytics/AnalyticsHeader.tsx` - Terminal navigation
- `src/components/Analytics/KPICard.tsx` - Terminal metrics cards
- `src/components/Analytics/RefreshButton.tsx` - Terminal button styling
- `src/components/Analytics/ExecutiveOverview.tsx` - Charts and panels

## Next Steps

To apply the terminal theme to additional components:

1. Import the theme CSS (already done via `analytics-main.tsx`)
2. Add `data-theme="terminal"` to container
3. Replace component classes with terminal equivalents
4. Use terminal color palette for custom styles
5. Apply terminal typography (monospace)

## Support

For theme customization, edit `src/styles/theme-hackathon.css` and modify the CSS custom properties at the top of the file.
