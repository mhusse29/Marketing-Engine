# Terminal Theme Quick Reference

## 🎨 Color Palette Cheat Sheet

```
BACKGROUNDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#0b0d13  Main background
#111522  Panel background
#161b2a  Secondary panel

ACCENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#4deeea  ███ Primary (Cyan)      - Navigation, metrics, data
#9ef01a  ███ Success (Green)     - Positive states, active
#f7b32b  ███ Warning (Amber)     - Warnings, latency
#ff1178  ███ Alert (Magenta)     - Critical, errors
#9d4edd  ███ Secondary (Purple)  - Secondary actions, cost

TEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#e5f8ff  Primary text
#8a939f  Muted text
#5f677c  Disabled text
```

## 🔧 Common Class Patterns

### Panels
```tsx
// Standard panel
<div className="terminal-panel p-6">
  <h3 className="terminal-panel__title">Section Title</h3>
  {/* content */}
</div>

// Interactive card
<div className="terminal-card">
  {/* content with hover glow */}
</div>
```

### Buttons
```tsx
// Primary button (cyan)
<button className="terminal-button terminal-button--primary">
  Execute
</button>

// Secondary button (purple)
<button className="terminal-button terminal-button--secondary">
  Cancel
</button>

// Success button (green)
<button className="terminal-button terminal-button--success">
  Confirm
</button>
```

### Badges
```tsx
// Active status (green)
<span className="terminal-badge terminal-badge--active">
  <span className="terminal-led"></span>
  Online
</span>

// Alert status (red, pulsing)
<span className="terminal-badge terminal-badge--alert">
  <span className="terminal-led terminal-led--alert"></span>
  Critical
</span>

// Warning status (amber with stripes)
<span className="terminal-badge terminal-badge--warning">
  <span className="terminal-led terminal-led--warning"></span>
  Warning
</span>

// Offline status (gray, dashed)
<span className="terminal-badge terminal-badge--offline">
  Offline
</span>
```

### Metrics
```tsx
// Primary metric (cyan, pulsing glow)
<div className="terminal-kpi">
  <p className="terminal-kpi__label">Active Users</p>
  <p className="terminal-metric">1,247</p>
</div>

// Success metric (green)
<p className="terminal-metric terminal-metric--success">99.9%</p>

// Warning metric (amber)
<p className="terminal-metric terminal-metric--warning">245ms</p>

// Alert metric (red)
<p className="terminal-metric terminal-metric--alert">3</p>
```

### Navigation
```tsx
<div className="terminal-nav">
  <button className="terminal-nav__item terminal-nav__item--active">
    Dashboard
  </button>
  <button className="terminal-nav__item">
    Metrics
  </button>
  <button className="terminal-nav__item">
    Logs
  </button>
</div>
```

### Loading States
```tsx
// ASCII spinner
<div className="terminal-loader">
  <div className="terminal-loader__spinner">|</div>
  <span>Loading...</span>
</div>

// Progress bar
<div className="terminal-loader__bar"></div>
```

### Tables
```tsx
<table className="terminal-table">
  <thead>
    <tr>
      <th>Metric</th>
      <th>Value</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Uptime</td>
      <td>99.9%</td>
      <td>
        <span className="terminal-badge terminal-badge--active">
          Online
        </span>
      </td>
    </tr>
  </tbody>
</table>
```

### Inputs
```tsx
<input 
  type="text" 
  className="terminal-input" 
  placeholder="Enter command..."
/>
```

## 📊 Chart Configuration

### Area Chart (User Metrics)
```tsx
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
```

### Bar Chart (Cost Metrics)
```tsx
<BarChart data={data}>
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
      border: '1px solid #9d4edd',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}
    labelStyle={{ color: '#e5f8ff' }}
  />
  <Bar 
    dataKey="cost" 
    fill="#9d4edd" 
    radius={[4, 4, 0, 0]} 
    style={{filter: 'drop-shadow(0 0 8px rgba(157,78,221,0.4))'}} 
  />
</BarChart>
```

### Line Chart (Performance)
```tsx
<LineChart data={data}>
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
  <Line 
    dataKey="value" 
    stroke="#9ef01a" 
    strokeWidth={2}
    dot={{ fill: '#9ef01a', r: 4 }}
    filter="drop-shadow(0 0 4px rgba(158,240,26,0.4))"
  />
</LineChart>
```

## 🎭 Utility Classes

```tsx
// Text Effects
<h1 className="terminal-text-glow">Glowing Title</h1>
<h2 className="terminal-uppercase">Section Header</h2>

// Border Glow
<div className="terminal-border-glow">
  Element with border glow
</div>

// Separator
<div className="terminal-separator" />

// Custom Scrollbar
<div className="terminal-scroll overflow-auto max-h-96">
  {/* scrollable content with neon scrollbar */}
</div>

// Live Indicator
<div className="terminal-live-indicator">
  <span className="terminal-led terminal-led--primary"></span>
  LIVE
</div>
```

## 🎬 Animation Classes

All animations are automatic when using the classes:

- **terminal-metric** → 2s glow pulse
- **terminal-badge--alert** → 1.5s box-shadow pulse
- **terminal-led--alert** → 1s blink on/off
- **terminal-live-indicator** → 1s cursor blink
- **terminal-loader__spinner** → 1s ASCII rotation
- **terminal-loader__bar::after** → 1.5s slide animation
- **terminal-matrix-bg::before** → 20s vertical scroll
- **terminal-matrix-overlay** → 3s opacity pulse

## 📐 Layout Helpers

```tsx
// Full dashboard container
<div className="terminal-app" data-theme="terminal">
  {/* Matrix background automatically applied */}
  
  {/* Header (sticky) */}
  <div className="terminal-header sticky top-0">
    {/* 60px height with gradient */}
  </div>
  
  {/* Main content with scrollbar */}
  <div className="terminal-scroll overflow-y-auto">
    {/* Dashboard content */}
  </div>
</div>
```

## 🔢 Common Metric Patterns

```tsx
// KPI Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div className="terminal-card">
    <div className="relative z-10">
      <p className="terminal-panel__title">Active Users</p>
      <p className="terminal-metric terminal-metric--success">1,247</p>
      <p className="text-xs text-[#8a939f] mt-1">+12% from yesterday</p>
    </div>
  </div>
  
  <div className="terminal-card">
    <div className="relative z-10">
      <p className="terminal-panel__title">Avg Latency</p>
      <p className="terminal-metric terminal-metric--warning">245ms</p>
      <p className="text-xs text-[#8a939f] mt-1">Within threshold</p>
    </div>
  </div>
  
  <div className="terminal-card">
    <div className="relative z-10">
      <p className="terminal-panel__title">Error Rate</p>
      <p className="terminal-metric terminal-metric--alert">0.8%</p>
      <p className="text-xs text-[#8a939f] mt-1">3 incidents</p>
    </div>
  </div>
</div>
```

## 🎯 Status Indicator Patterns

```tsx
// System status panel
<div className="terminal-panel p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="terminal-panel__title">Services</h3>
    <span className="terminal-live-indicator">
      <span className="terminal-led terminal-led--primary"></span>
      LIVE
    </span>
  </div>
  
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-[#e5f8ff]">API Gateway</span>
      <span className="terminal-badge terminal-badge--active">
        <span className="terminal-led"></span>
        Operational
      </span>
    </div>
    
    <div className="flex items-center justify-between">
      <span className="text-[#e5f8ff]">Database</span>
      <span className="terminal-badge terminal-badge--warning">
        <span className="terminal-led terminal-led--warning"></span>
        Degraded
      </span>
    </div>
    
    <div className="flex items-center justify-between">
      <span className="text-[#e5f8ff]">Cache</span>
      <span className="terminal-badge terminal-badge--alert">
        <span className="terminal-led terminal-led--alert"></span>
        Critical
      </span>
    </div>
  </div>
</div>
```

## 💡 Pro Tips

1. **Always add `relative z-10`** to content inside terminal-panel/terminal-card to ensure it appears above the radial gradient overlay

2. **Use monospace-friendly spacing** - Numbers align better with tabular-nums utility

3. **Combine LED + Badge** for maximum impact on status indicators

4. **Chart colors** - Use cyan (#4deeea) for data, green (#9ef01a) for success metrics, purple (#9d4edd) for financial

5. **Text hierarchy** - terminal-panel__title for labels, terminal-metric for big numbers, text-[#8a939f] for subtitles

6. **Loading states** - Use terminal-loader for operations, terminal-loader__bar for progress

7. **Accessibility** - Always include text labels with LED indicators, not just colors

---

**Quick Start**: Copy any pattern above and adjust the content/data. All styles are pre-configured in `theme-hackathon.css`.
