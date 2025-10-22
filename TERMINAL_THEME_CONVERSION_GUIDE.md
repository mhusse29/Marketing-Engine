# Terminal Theme Conversion Guide

## Conversion Status

### ✅ Completed
1. **FilterControls** - Terminal filter bar with chips and selects
2. **AnalyticsMetadataBadge** - Terminal badges for all states (live, cached, error, stale)
3. **PanelHeader** - Terminal panel with glowing headers
4. **ErrorState** - Terminal error display
5. **LoadingState** - ASCII spinner loader
6. **RealtimeOperations** - Terminal stream with status badges
7. **AnalyticsHeader** - Terminal navigation
8. **KPICard** - Terminal metrics with glow
9. **RefreshButton** - Terminal button styling
10. **ExecutiveOverview** - Charts and panels
11. **StandaloneAnalyticsDashboard** - Main layout with matrix background

### 🔄 Remaining Components

These components still use glass/blur styling and need conversion:

1. **KeyboardShortcuts.tsx** (lines 82-158)
2. **AnomalyDetector.tsx** (lines 45-164)
3. **UserIntelligence.tsx** (lines 33-156)
4. **CapacityForecasting.tsx** (lines 65-210)
5. **DeploymentHistory.tsx** (lines 76-199)
6. **ExperimentDashboard.tsx** (lines 85-281)
7. **IncidentTimeline.tsx** (lines 71-185)
8. **SLODashboard.tsx** (lines 161-417)
9. **ModelUsage.tsx** - May have some glass elements
10. **FeedbackAnalytics.tsx** - May have some glass elements
11. **TechnicalPerformance.tsx** - May have some glass elements
12. **FinancialAnalytics.tsx** - May have some glass elements

## Conversion Pattern

### Step 1: Loading States

**Before:**
```tsx
<div className="glass-card p-8">
  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white/80" />
  <span className="text-white/70">Loading...</span>
</div>
```

**After:**
```tsx
<div className="terminal-panel p-8">
  <div className="terminal-loader">
    <div className="terminal-loader__spinner">|</div>
    <span>Loading...</span>
  </div>
</div>
```

### Step 2: Panel/Card Containers

**Before:**
```tsx
<div className="glass-card-elevated p-6">
<div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
```

**After:**
```tsx
<div className="terminal-panel p-6">
<div className="terminal-card">  <!-- for interactive cards -->
```

### Step 3: Headers & Titles

**Before:**
```tsx
<h3 className="text-lg font-semibold text-white mb-4">Title</h3>
```

**After:**
```tsx
<h3 className="terminal-panel__title mb-4">Title</h3>
```

For main headers with glow:
```tsx
<h2 className="text-2xl font-bold terminal-text-glow terminal-uppercase" style={{color: '#4deeea'}}>
  Title
</h2>
```

### Step 4: Text Colors

**Replace:**
- `text-white` → `terminal-text`
- `text-white/60` → `terminal-text-muted`
- `text-white/40` → `terminal-text-muted`
- `text-emerald-400` → `terminal-text-success` or `text-[#9ef01a]`
- `text-red-400` → `terminal-text-alert` or `text-[#ff1178]`
- `text-amber-400` → `terminal-text-warning` or `text-[#f7b32b]`
- `text-blue-400` → `terminal-text-primary` or `text-[#4deeea]`

### Step 5: Buttons

**Before:**
```tsx
<button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white">
  Action
</button>
```

**After:**
```tsx
<button className="terminal-button terminal-button--primary">
  Action
</button>
```

Button variants:
- Primary → `terminal-button terminal-button--primary`
- Secondary → `terminal-button terminal-button--secondary`
- Success → `terminal-button terminal-button--success`

### Step 6: Badges & Status

**Before:**
```tsx
<span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
  Active
</span>
```

**After:**
```tsx
<span className="terminal-badge terminal-badge--active">
  <span className="terminal-led"></span>
  Active
</span>
```

Badge variants:
- Active/Success → `terminal-badge--active`
- Alert/Error → `terminal-badge--alert` 
- Warning → `terminal-badge--warning`
- Offline/Disabled → `terminal-badge--offline`

### Step 7: Lists & Tables

**Before:**
```tsx
<div className="space-y-2">
  <div className="bg-white/[0.02] border border-white/5 p-4">
    Row content
  </div>
</div>
```

**After:**
```tsx
<div className="terminal-list">
  <div className="terminal-list__row">
    Row content
  </div>
</div>
```

For tables:
```tsx
<table className="terminal-table">
  <thead>
    <tr>
      <th>Header</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data</td>
    </tr>
  </tbody>
</table>
```

### Step 8: Streams/Feeds

**Before:**
```tsx
<div className="max-h-[400px] overflow-y-auto">
  <div className="bg-white/[0.02] border-l-2 border-emerald-500 p-3">
    Item
  </div>
</div>
```

**After:**
```tsx
<div className="terminal-stream terminal-scroll">
  <div className="terminal-stream__item terminal-stream__item--success">
    Item
  </div>
</div>
```

Stream item variants:
- Success → `terminal-stream__item--success`
- Error → `terminal-stream__item--error`

### Step 9: Modals

**Before:**
```tsx
<div className="fixed inset-0 bg-black/80 backdrop-blur-sm">
  <div className="glass-card p-6">
    Modal content
  </div>
</div>
```

**After:**
```tsx
<div className="fixed inset-0 terminal-modal-overlay">
  <div className="terminal-modal">
    <div className="terminal-modal__header">
      <h3 className="terminal-modal__title">Title</h3>
    </div>
    <div className="terminal-modal__content">
      Content
    </div>
    <div className="terminal-modal__footer">
      Footer
    </div>
  </div>
</div>
```

### Step 10: Progress Bars

**Before:**
```tsx
<div className="h-2 bg-white/10 rounded-full">
  <div className="h-full bg-blue-500 rounded-full" style={{width: '60%'}}></div>
</div>
```

**After:**
```tsx
<div className="terminal-progress">
  <div className="terminal-progress__bar" style={{width: '60%'}}></div>
</div>
```

### Step 11: Toggles/Switches

**Before:**
```tsx
<input type="checkbox" className="..." />
```

**After:**
```tsx
<label className="terminal-toggle">
  <input type="checkbox" />
  <span className="terminal-toggle__slider"></span>
</label>
```

### Step 12: Metrics with Glow

**Before:**
```tsx
<p className="text-3xl font-bold text-white">{value}</p>
```

**After:**
```tsx
<p className="terminal-metric">{value}</p>
<!-- Or with status -->
<p className="terminal-metric terminal-metric--success">{value}</p>
<p className="terminal-metric terminal-metric--warning">{value}</p>
<p className="terminal-metric terminal-metric--alert">{value}</p>
```

### Step 13: Icons

Update icon colors to match terminal theme:
- `text-white/40` → `text-[#4deeea]` or `text-[#8a939f]`
- Status icons → use appropriate terminal color

## Chart Styling Pattern

For any Recharts components:

```tsx
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={data}>
    <defs>
      <linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#4deeea" stopOpacity={0.3}/>
        <stop offset="95%" stopColor="#4deeea" stopOpacity={0}/>
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(77,238,234,0.1)" />
    <XAxis 
      stroke="rgba(77,238,234,0.5)"
      tick={{ fill: 'rgba(138,147,159,1)', fontSize: 11, fontFamily: 'monospace' }}
    />
    <YAxis 
      stroke="rgba(77,238,234,0.5)"
      tick={{ fill: 'rgba(138,147,159,1)', fontSize: 11, fontFamily: 'monospace' }}
    />
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
    <Area 
      dataKey="value" 
      stroke="#4deeea" 
      strokeWidth={2}
      fill="url(#colorCyan)"
      filter="drop-shadow(0 0 8px rgba(77,238,234,0.4))" 
    />
  </AreaChart>
</ResponsiveContainer>
```

Chart colors:
- Data/Primary → `#4deeea` (cyan)
- Success metrics → `#9ef01a` (green)
- Cost/Financial → `#9d4edd` (purple)
- Warning → `#f7b32b` (amber)

## Quick Find & Replace

Search for these patterns and replace with terminal equivalents:

1. `glass-card` → `terminal-panel`
2. `glass-card-elevated` → `terminal-panel`
3. `glass-button` → `terminal-button`
4. `bg-white/5` → remove (terminal-panel handles this)
5. `border border-white/10` → remove (terminal-panel handles this)
6. `backdrop-blur` → remove
7. `text-white/60` → `terminal-text-muted`
8. `bg-emerald-500/10` → check context, likely `terminal-badge--active`
9. `bg-red-500/10` → check context, likely `terminal-badge--alert`
10. `bg-amber-500/10` → check context, likely `terminal-badge--warning`

## Testing Checklist

After converting each component:

1. ✅ No `glass-*` classes remain
2. ✅ No `bg-white/*` background colors
3. ✅ No `border-white/*` borders
4. ✅ No `backdrop-blur` effects
5. ✅ All text uses terminal color classes
6. ✅ Buttons use terminal-button classes
7. ✅ Panels use terminal-panel or terminal-card
8. ✅ Loading states use terminal-loader
9. ✅ Charts use terminal color palette
10. ✅ Badges use terminal-badge variants

## Component-Specific Notes

### KeyboardShortcuts
- Modal overlay → `terminal-modal-overlay`
- Modal container → `terminal-modal`
- Shortcut list → `terminal-list`

### AnomalyDetector
- Alert cards → `terminal-badge--alert` or `terminal-badge--warning`
- Threshold indicators → use terminal colors

### UserIntelligence
- User table → `terminal-table`
- User tier badges → `terminal-badge` with appropriate variant

### CapacityForecasting
- Forecast chart → cyan/green gradient
- Progress bars → `terminal-progress`
- Capacity warnings → `terminal-badge--warning`

### DeploymentHistory
- Timeline → `terminal-list` with timestamp styling
- Status badges → appropriate terminal-badge variant
- Deployment cards → `terminal-card`

### ExperimentDashboard
- Experiment cards → `terminal-card`
- Variant comparison → use terminal colors for diff
- Status indicators → `terminal-badge` variants

### IncidentTimeline
- Incident list → `terminal-stream` or `terminal-list`
- Severity badges → `terminal-badge--alert` / `--warning`
- Timeline items → add LED indicators

### SLODashboard
- SLO cards → `terminal-card`
- Progress toward target → `terminal-progress`
- Status indicators → `terminal-badge` with LED

## After Full Conversion

Once all components are converted:

1. Remove or comment out `theme-command-center.css` import in `analytics-main.tsx`
2. Search codebase for any remaining:
   - `glass-`
   - `bg-white/`
   - `backdrop-blur`
   - `border-white/`
3. Run build to check for unused CSS
4. Test all dashboard tabs
5. Verify accessibility (contrast ratios)

The terminal theme should now be 100% applied across the analytics dashboard!
