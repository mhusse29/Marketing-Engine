# Analytics Tabs Styling Audit - Models, Technical & Advanced Tabs

## Executive Summary
Complete styling review of Models, Technical Performance, and Advanced tabs (Deployments, Capacity Forecasting) to ensure consistency with the SINAIQ Dashboard terminal theme.

---

## 🔴 CRITICAL ISSUES FOUND

### 1. **TechnicalPerformance.tsx** - MAJOR INCONSISTENCIES

#### ❌ Header Styling (Lines 45-49)
**Current (WRONG):**
```tsx
<h2 className="text-3xl font-bold text-white mb-2">Technical Performance</h2>
<p className="text-white/60">Provider metrics and system reliability • Last 30 days</p>
```

**Should Be (Terminal Theme):**
```tsx
<h2 className="text-3xl font-bold terminal-text-glow terminal-uppercase mb-2" style={{color: '#33ff33'}}>Technical Performance</h2>
<p className="text-[#7a7a7a]">Provider metrics and system reliability • Last 30 days</p>
```

#### ❌ Missing terminal-panel wrapper for header
**Line 45:** Header not wrapped in `terminal-panel p-6` like other tabs

#### ❌ Chart Title Styling (Lines 92, 124, 153, 183)
**Current (WRONG):**
```tsx
<h3 className="terminal-panel__title text-lg mb-4">
```

**Should Be (Consistent):**
```tsx
<h3 className="terminal-panel__title mb-4">
```

#### ❌ Table Header Styling (Lines 191-194)
**Current (Inconsistent):**
```tsx
<th className="text-right text-sm font-medium text-white/60 pb-3">Success Rate</th>
```

**Should Be (Terminal Theme):**
```tsx
<th className="text-right terminal-panel__title pb-3">Success Rate</th>
```

#### ❌ Summary Card Titles (Lines 227, 234, 241)
**Current (WRONG):**
```tsx
<h4 className="terminal-panel__title text-sm mb-3">Best Success Rate</h4>
```

**Should Be:**
```tsx
<h4 className="terminal-panel__title mb-3">Best Success Rate</h4>
```

---

### 2. **ModelUsage.tsx** - MODERATE ISSUES

#### ⚠️ Table Text Colors (Lines 372-404)
**Inconsistent usage of:**
- `text-white` - Should use terminal theme colors
- `text-white/80` - Should use `terminal-text-muted`
- `text-white/60` - Should use `terminal-text-muted`

**Lines 372, 383, 393, 396, 400, 403** need updating

#### ⚠️ Chart Tooltips (Lines 245-250, 276-282, 305-310, 338-344)
**Current (Mixed):**
```tsx
backgroundColor: 'rgba(0,0,0,0.8)', 
border: '1px solid rgba(255,255,255,0.1)',
```

**Should Be (Terminal Theme):**
```tsx
backgroundColor: 'rgba(11,13,19,0.95)', 
border: '1px solid #33ff33',
fontFamily: 'monospace'
```

#### ⚠️ CartesianGrid Colors (Lines 236, 292, 324)
**Current:**
```tsx
<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
```

**Should Be (Terminal Green):**
```tsx
<CartesianGrid strokeDasharray="3 3" stroke="rgba(51,255,51,0.15)" />
```

#### ⚠️ Axis Colors (Lines 237, 241, 295, 302, 327, 334)
**Current:**
```tsx
stroke="rgba(255,255,255,0.5)"
tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
```

**Should Be:**
```tsx
stroke="#33ff33"
tick={{ fill: '#7a7a7a', fontSize: 12, fontFamily: 'monospace' }}
```

---

### 3. **DeploymentHistory.tsx** - MINOR ISSUES

#### ⚠️ Button Styling (Lines 96-131)
**Current (Glassmorphism Theme):**
```tsx
className="px-3 py-1 rounded-lg text-xs font-medium transition-all
  bg-violet-500/20 text-violet-400 border border-violet-500/30"
```

**Should Be (Terminal Theme):**
```tsx
className="terminal-filter__chip terminal-filter__chip--active"
```

#### ⚠️ Icon Colors (Line 67, 90)
**Current:** Mix of `text-violet-400` and `text-[#33ff33]`
**Should Be:** Consistently use terminal theme colors

#### ⚠️ Card Borders (Lines 140-143)
Currently uses custom borders, should use terminal-card styling consistently

---

### 4. **CapacityForecasting.tsx** - MAJOR ISSUES

#### ❌ Header Styling (Lines 67-71)
**Current (WRONG):**
```tsx
<Activity className="w-6 h-6 text-violet-400" />
<h2 className="text-2xl font-bold text-white">Capacity & Forecasting</h2>
<p className="text-sm text-white/60 mt-1">Usage predictions and budget tracking</p>
```

**Should Be (Terminal Theme):**
```tsx
<Activity className="w-6 h-6 text-[#33ff33]" />
<h2 className="text-3xl font-bold terminal-text-glow terminal-uppercase mb-2" style={{color: '#33ff33'}}>Capacity & Forecasting</h2>
<p className="text-[#7a7a7a]">Usage predictions and budget tracking</p>
```

#### ❌ KPI Card Styling (Lines 77-141)
**Current:** Uses custom `terminal-panel-elevated` class
**Issue:** This class doesn't exist in CSS! Should use `terminal-card`

**Lines to fix:** 77, 91, 105, 119

#### ❌ Text Colors Throughout
- `text-white` → Should use terminal theme
- `text-white/60` → Should use `text-[#7a7a7a]` or `terminal-text-muted`
- `text-white/50` → Should use `terminal-text-muted`
- `text-white/70` → Should use terminal theme

**Affected lines:** 80, 82, 86, 94, 96, 100, 108, 110, 114, 122, 159, 174, 210, 233, 287, 290, 294, 298

#### ❌ Button Styling (Lines 178-213)
**Current (Glassmorphism):**
```tsx
bg-violet-500/20 text-violet-400 border border-violet-500/30
```

**Should Be (Terminal):**
```tsx
terminal-filter__chip terminal-filter__chip--active
```

#### ❌ Chart Styling (Lines 229-248)
**Issues:**
- Grid color not terminal theme
- Axis colors not terminal theme  
- Tooltip background not terminal theme

---

## 📋 COMPLETE FIX CHECKLIST

### TechnicalPerformance.tsx
- [ ] Add `terminal-panel p-6` wrapper for header (line 45)
- [ ] Update H2 to terminal style with uppercase and glow
- [ ] Update subtitle to use `text-[#7a7a7a]`
- [ ] Remove `text-lg` from all chart titles (4 locations)
- [ ] Update table headers to use `terminal-panel__title`
- [ ] Update table cell text colors to terminal theme
- [ ] Remove `text-sm` from summary card titles

### ModelUsage.tsx
- [ ] Update all tooltip backgrounds to terminal theme (4 locations)
- [ ] Update all CartesianGrid to green (3 locations)
- [ ] Update all axis colors to terminal theme (6 locations)
- [ ] Update table cell colors from white variants to terminal colors (6 lines)
- [ ] Add `fontFamily: 'monospace'` to all tooltips

### DeploymentHistory.tsx
- [ ] Replace glassmorphism buttons with terminal-filter__chip (3 buttons)
- [ ] Standardize icon colors to terminal theme
- [ ] Ensure consistent terminal-card usage

### CapacityForecasting.tsx
- [ ] Fix header styling to match terminal theme
- [ ] Replace `terminal-panel-elevated` with `terminal-card` (4 locations)
- [ ] Update all text color classes to terminal theme (18+ locations)
- [ ] Replace glassmorphism buttons with terminal theme (3 buttons)
- [ ] Update chart grid/axis/tooltip to terminal theme
- [ ] Update legend text colors

---

## ✅ TERMINAL THEME STANDARDS

### Headers (Main Page Titles)
```tsx
<h2 className="text-3xl font-bold terminal-text-glow terminal-uppercase mb-2" style={{color: '#33ff33'}}>
  TITLE HERE
</h2>
<p className="text-[#7a7a7a]">Subtitle here</p>
```

### Section Headers
```tsx
<h3 className="terminal-panel__title mb-4">Section Title</h3>
```

### Charts Configuration
```tsx
// Grid
<CartesianGrid strokeDasharray="3 3" stroke="rgba(51,255,51,0.15)" />

// Axes
<XAxis 
  dataKey="date" 
  stroke="#33ff33"
  tick={{ fill: '#7a7a7a', fontSize: 12, fontFamily: 'monospace' }}
/>

// Tooltips
<Tooltip 
  contentStyle={{ 
    backgroundColor: 'rgba(11,13,19,0.95)', 
    border: '1px solid #33ff33',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px'
  }}
  labelStyle={{ color: '#33ff33' }}
/>
```

### Buttons/Filters
```tsx
<button className={`terminal-filter__chip ${active ? 'terminal-filter__chip--active' : ''}`}>
  Filter Text
</button>
```

### Text Colors
- **Primary text:** `terminal-text` or `text-[#c0c0c0]`
- **Muted text:** `terminal-text-muted` or `text-[#7a7a7a]`
- **Headings:** `text-[#33ff33]` with `terminal-text-glow`
- **Success:** `text-[#00ff00]`
- **Warning:** `text-[#ffff00]`
- **Alert:** `text-[#ff3333]`

### Cards
```tsx
<div className="terminal-panel p-6">
  {/* Content */}
</div>

<div className="terminal-card">
  {/* Smaller content */}
</div>
```

---

## 🎯 PRIORITY ORDER

1. **HIGH:** TechnicalPerformance.tsx - Most inconsistent
2. **HIGH:** CapacityForecasting.tsx - Missing CSS classes, wrong colors
3. **MEDIUM:** ModelUsage.tsx - Chart styling needs polish
4. **LOW:** DeploymentHistory.tsx - Minor button styling

---

**Total Issues Found:** 50+
**Files Requiring Fixes:** 4
**Estimated Fix Time:** 15-20 minutes
