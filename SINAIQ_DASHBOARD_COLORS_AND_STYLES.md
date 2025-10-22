# SINAIQ Dashboard - Colors and Styles Reference

## Model Graph Colors

### Current Implementation

All model-related graphs use a consistent green color palette to match the terminal theme:

```javascript
const COLORS = ['#33ff33', '#00ff00', '#66ff66', '#99ff99', '#ccffcc', '#33ff33'];
```

**Located in:**
- `/src/components/Analytics/ModelUsage.tsx` (line 103)

### Individual Graph Color Schemes

#### 1. **Service Type Distribution** (Pie Chart)
- Uses the green gradient palette above
- Automatically cycles through colors for each service type
- Example: `<Cell fill={COLORS[index % COLORS.length]} />`

#### 2. **Cost by Model** (Bar Chart)
- **Color:** `#8b5cf6` (Violet)
- Horizontal bar chart showing cost distribution

#### 3. **Token Usage by Model** (Stacked Bar Chart)
- **Input Tokens:** `#3b82f6` (Blue)
- **Output Tokens:** `#8b5cf6` (Violet)

#### 4. **Success Rate by Model** (Bar Chart)
- **Color:** `#10b981` (Emerald Green)
- Shows percentage-based success rates

---

## Other Analytics Colors

### User Intelligence Dashboard
```javascript
const COLORS = ['#33ff33', '#00ff00', '#66ff66', '#99ff99'];
```
**Located in:** `/src/components/Analytics/UserIntelligence.tsx` (line 44)

### Financial Analytics
```javascript
const COLORS = ['#33ff33', '#00ff00', '#66ff66', '#99ff99', '#ccffcc'];
```
**Located in:** `/src/components/Analytics/FinancialAnalytics.tsx` (line 34)

### Feedback Analytics
```javascript
const ratingIcons = {
  0: { icon: Frown, color: 'text-[#ff3333]', bg: 'bg-[#111111] border border-[#ff3333]', label: 'BAD' },
  1: { icon: Meh, color: 'text-[#ffff00]', bg: 'bg-[#111111] border border-[#ffff00]', label: 'NOT BAD' },
  2: { icon: Smile, color: 'text-[#00ff00]', bg: 'bg-[#111111] border border-[#00ff00]', label: 'GOOD' }
};
```
**Located in:** `/src/components/Analytics/FeedbackAnalytics.tsx` (lines 40-42)

### SLO Dashboard
- **Target Line:** `#ffff00` (Yellow)
- **Actual Line:** `#33ff33` (Bright Green)
- **Error Budget:** `#00ff00` (Green)

---

## Terminal Theme Colors

### Primary Palette
```css
--terminal-bg: #000000;                /* Deep black background */
--terminal-surface: #0a0a0a;           /* Surface elements */
--terminal-surface-alt: #111111;       /* Alternative surface */

--terminal-accent-primary: #33ff33;    /* Bright green - primary accent */
--terminal-accent-success: #00ff00;    /* Pure green - success */
--terminal-accent-warning: #ffff00;    /* Yellow - warnings */
--terminal-accent-alert: #ff3333;      /* Red - alerts */

--terminal-text: #c0c0c0;              /* Primary text */
--terminal-text-muted: #7a7a7a;        /* Muted text */
--terminal-muted: #5a5a5a;             /* Even more muted */
```

### Border & Effects
```css
--terminal-border: rgba(51, 255, 51, 0.35);      /* Primary borders */
--terminal-border-soft: rgba(51, 255, 51, 0.15); /* Subtle borders */
```

---

## KeyboardShortcuts Modal Issue

### Current Issue
The KeyboardShortcuts modal uses `terminal-modal-overlay` class which **lacks CSS definition**, resulting in a transparent background that makes content hard to see.

### Current Implementation
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 terminal-modal-overlay">
  <div className="terminal-modal max-w-2xl w-full shadow-2xl">
    {/* Content */}
  </div>
</div>
```

### Missing CSS Classes
The following classes are referenced but not defined in CSS:
1. `.terminal-modal-overlay` - Should have a solid/semi-transparent background
2. `.terminal-modal` - Modal container styles
3. `.terminal-modal__header` - Header section
4. `.terminal-modal__content` - Content section
5. `.terminal-modal__footer` - Footer section

---

## Graph Style Consistency

All graphs should follow these terminal-style conventions:

### Recharts Configuration
```javascript
// Grid
<CartesianGrid strokeDasharray="3 3" stroke="rgba(51,255,51,0.15)" />

// X/Y Axis
<XAxis 
  stroke="#33ff33"
  tick={{ fill: '#7a7a7a', fontSize: 12, fontFamily: 'monospace' }}
/>

// Tooltip
<Tooltip
  contentStyle={{
    backgroundColor: 'rgba(0,0,0,0.8)',
    border: '1px solid rgba(51,255,51,0.3)',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '12px'
  }}
  labelStyle={{ color: '#33ff33' }}
/>
```

---

## Color Matching Guide

When adding new graphs or components to match the SINAIQ Dashboard aesthetic:

### Primary Colors
- **Main Accent:** `#33ff33` (Bright Green)
- **Success/Positive:** `#00ff00` (Pure Green)  
- **Warning:** `#ffff00` (Yellow)
- **Error/Alert:** `#ff3333` (Red)

### Secondary/Data Visualization
- **Violet:** `#8b5cf6` (Used for costs)
- **Blue:** `#3b82f6` (Used for input metrics)
- **Emerald:** `#10b981` (Used for success rates)

### Green Gradient Scale
```
#33ff33 → #00ff00 → #66ff66 → #99ff99 → #ccffcc
```

Use this gradient for categorical data visualization (pie charts, segmented bar charts).

---

## Typography

```css
font-family: 'JetBrains Mono', 'Fira Code', ui-monospace,
  SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
  monospace;

letter-spacing: 0.08em;
text-transform: uppercase; /* For labels and titles */
```

---

## Next Steps

1. ✅ **Document complete color scheme**
2. ⏳ **Add missing CSS for terminal-modal classes**
3. ⏳ **Verify KeyboardShortcuts visibility**
4. ⏳ **Test all graphs match documented colors**
