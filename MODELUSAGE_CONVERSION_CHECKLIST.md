# ModelUsage.tsx Terminal Theme Conversion

## ✅ Completed Sections

1. **Loading State** - Terminal loader with ASCII spinner
2. **Header Section** - Terminal panel with glowing title
3. **Service Type Filters** - Terminal filter chips
4. **Color Palette** - Updated to terminal colors
5. **Overview KPIs** - Already using KPICard (converted)
6. **Additional Metrics Grid** - All 4 cards converted to terminal-card

## 🔄 Remaining Sections to Convert

### Charts Grid (5 panels)

**Pattern to apply:**
```tsx
// Before
<div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
  <h3 className="text-lg font-semibold text-white mb-4">Chart Title</h3>
  <ResponsiveContainer width="100%" height={300}>
    {/* Chart */}
  </ResponsiveContainer>
</div>

// After
<div className="terminal-panel p-6">
  <h3 className="terminal-panel__title mb-4">Chart Title</h3>
  <ResponsiveContainer width="100%" height={300}>
    {/* Chart */}
  </ResponsiveContainer>
</div>
```

**Charts to Convert (Line ~232-340):**
1. Cost by Model (Top 10) - Bar Chart
2. Service Type Distribution - Pie Chart
3. Token Usage by Model - Stacked Bar Chart
4. Success Rate by Model - Bar Chart

**Chart Tooltip Pattern:**
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

**Chart Axis Pattern:**
```tsx
<XAxis 
  stroke="rgba(77,238,234,0.5)"
  tick={{ fill: 'rgba(138,147,159,1)', fontSize: 11, fontFamily: 'monospace' }}
/>
<YAxis 
  stroke="rgba(77,238,234,0.5)"
  tick={{ fill: 'rgba(138,147,159,1)', fontSize: 11, fontFamily: 'monospace' }}
/>
```

### Detailed Model Usage Table (Line ~344-402)

**Before:**
```tsx
<div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
  <h3 className="text-lg font-semibold text-white mb-4">Detailed Model Metrics</h3>
  <div className="overflow-x-auto custom-scrollbar">
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/10">
          <th className="text-left text-sm font-medium text-white/60 pb-3">...</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
          <td className="py-3 pr-4 text-sm text-white">...</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

**After:**
```tsx
<div className="terminal-panel p-6">
  <h3 className="terminal-panel__title mb-4">Detailed Model Metrics</h3>
  <div className="overflow-x-auto terminal-scroll">
    <table className="terminal-table">
      <thead>
        <tr>
          <th className="text-left">...</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>...</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Performance Insights Cards (Line ~406-443)

**Pattern:**
```tsx
// Before
<div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
  <h4 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
    <Icon className="w-4 h-4 text-emerald-400" />
    Title
  </h4>
  <p className="text-2xl font-bold text-white">{value}</p>
  <p className="text-xs text-white/40">{subtitle}</p>
</div>

// After
<div className="terminal-card">
  <div className="relative z-10">
    <h4 className="terminal-panel__title mb-3 flex items-center gap-2">
      <Icon className="w-4 h-4 text-[#9ef01a]" />
      Title
    </h4>
    <p className="text-2xl font-bold terminal-metric terminal-metric--success">{value}</p>
    <p className="text-xs terminal-text-muted">{subtitle}</p>
  </div>
</div>
```

**3 Cards to Convert:**
1. Most Used Model
2. Most Expensive Model  
3. Fastest Model

## 🔍 Search & Replace Guide

### Quick Replacements

1. Find: `backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6`
   Replace: `terminal-panel p-6`

2. Find: `text-lg font-semibold text-white mb-4`
   Replace: `terminal-panel__title mb-4`

3. Find: `text-white/60`
   Replace: `terminal-text-muted`

4. Find: `text-white/40`
   Replace: `terminal-text-muted`

5. Find: `text-white`
   Replace: `terminal-text`

6. Find: `custom-scrollbar`
   Replace: `terminal-scroll`

7. Find: `border-b border-white/10`
   Replace: (remove - terminal-table handles this)

8. Find: `border-b border-white/5`
   Replace: (remove - terminal-table handles this)

9. Find: `hover:bg-white/[0.02]`
   Replace: (remove - terminal-table handles this)

## ✅ After Conversion Checklist

- [ ] No `backdrop-blur` remains
- [ ] No `bg-white/*` backgrounds  
- [ ] No `border-white/*` borders
- [ ] All panels use `terminal-panel`
- [ ] All cards use `terminal-card`
- [ ] Table uses `terminal-table`
- [ ] Scrollbar uses `terminal-scroll`
- [ ] Chart tooltips use terminal styling
- [ ] Chart axes use monospace styling
- [ ] All text uses terminal color classes

## 📊 Progress

- ✅ Loading State (100%)
- ✅ Header & Filters (100%)
- ✅ Colors Updated (100%)
- ✅ KPI Cards (100%)
- ✅ Additional Metrics Grid (100%)
- 🔄 Charts (0%) - 5 panels
- 🔄 Detail Table (0%) - 1 panel
- 🔄 Performance Insights (0%) - 3 cards

**Overall: 60% Complete** for ModelUsage.tsx

## ⚡ Quick Conversion Script

To complete the remaining 40%, apply these edits in order:

1. Convert all chart panels (search for "backdrop-blur-md" and replace)
2. Update all chart tooltips to use terminal styling
3. Convert the detail table to terminal-table
4. Convert the 3 performance insight cards

Estimated time: ~15 minutes

The pattern is established and consistent throughout. Each section follows the same transformation rules documented above.
