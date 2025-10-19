# Analytics Command Center - Quick Test Guide

## 🚀 Start Services

### Terminal 1: Analytics Gateway
```bash
cd server
node analyticsGateway.mjs
```

Expected output:
```
╔═══════════════════════════════════════════════════════════════╗
║             🚀 Analytics Gateway Service                      ║
║  Port:         8788                                           ║
║  Version:      v1.1.0                                         ║
╚═══════════════════════════════════════════════════════════════╝
```

### Terminal 2: Frontend
```bash
npm run dev
```

---

## ✅ Test Checklist (5 Minutes)

### **1. Gateway Health** (30 seconds)
```bash
curl http://localhost:8788/health
```

✅ Should return: `{"status":"healthy",...}`

### **2. Keyboard Shortcuts** (1 minute)
- Open analytics dashboard in browser
- Press **`?`** → Shortcuts overlay appears
- Press **`1`** → Executive tab loads
- Press **`2`** → Operations tab loads
- Press **`3`** → Technical tab loads
- Press **`R`** → Refresh triggered, toast appears
- Press **`R`** 10x rapidly → Rate limit message shows

✅ All shortcuts change tabs without URL hash

### **3. Advanced Panels** (1 minute)
- Click **"Advanced"** button in header
- Secondary nav bar appears
- Click **"Deployments"** → Panel renders
- Click **"Incidents"** → Panel renders
- Click **"Experiments"** → Panel renders
- Click **"Capacity Forecasting"** → Charts render

✅ All panels accessible and render

### **4. Gateway Routing** (1 minute)
- Open **DevTools → Network tab**
- Navigate between tabs
- Look for requests to **`localhost:8788/api/v1/...`**
- Check response has `metadata` object

✅ Example response:
```json
{
  "data": [...],
  "metadata": {
    "timestamp": "2025-10-18T23:30:00Z",
    "cached": true,
    "source": "cache",
    "freshness": "current"
  }
}
```

### **5. Metadata Badges** (1 minute)
- Look at any analytics panel
- Find colored badge showing data status:
  - 🟢 **Live** (green)
  - 🔵 **Cached** (blue)
  - ⚪ **Fresh** (white)
  - 🟡 **Stale** (amber)
  - 🔴 **Error** (red)

✅ Badges visible on all panels

### **6. Error Handling** (1 minute)
- Stop analytics gateway: `Ctrl+C` in server terminal
- Refresh browser
- Navigate between tabs
- Look for red **Error** badges on panels

✅ UI gracefully shows error state

- Restart gateway: `node analyticsGateway.mjs`
- Refresh browser
- Badges turn green/blue

✅ Recovery works automatically

---

## 🔍 Deep Testing (Optional)

### **Test Individual Gateway Endpoints**

```bash
# Health score
curl http://localhost:8788/api/v1/metrics/health?interval=60

# User segments
curl http://localhost:8788/api/v1/segments/users?limit=100

# Revenue plans
curl http://localhost:8788/api/v1/revenue/plans

# Churn risk
curl http://localhost:8788/api/v1/users/churn-risk?min_score=50

# Manual refresh
curl -X POST http://localhost:8788/api/v1/refresh

# Cache stats
curl http://localhost:8788/api/v1/cache/stats
```

### **Test Cache Behavior**

1. Open Executive Overview tab
2. Check Network tab - first request shows `"cached": false`
3. Switch to Operations tab and back
4. Check Network tab - second request shows `"cached": true`
5. Wait 60 seconds
6. Switch tabs again
7. Check Network tab - cache expired, shows `"cached": false`

### **Test Rate Limiting**

Open browser console:
```javascript
// Spam refresh endpoint
for (let i = 0; i < 20; i++) {
  fetch('http://localhost:8788/api/v1/refresh', { method: 'POST' })
    .then(r => r.json())
    .then(console.log);
}
```

✅ Should see rate limit errors after ~6 requests

---

## 🐛 Troubleshooting

### **Gateway won't start**
**Error**: `supabaseUrl is required`  
**Fix**: Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `server/.env`

### **Frontend shows errors**
**Error**: `fetch failed` or `Network error`  
**Fix**: Check gateway is running on port 8788

### **Keyboard shortcuts don't work**
**Cause**: Focus in input field  
**Fix**: Click outside input, then press shortcuts

### **Cache never expires**
**Cause**: TTL set too high  
**Fix**: Edit `server/analyticsGateway.mjs`, change `stdTTL: 60` to lower value

### **Refresh button doesn't work**
**Cause**: Rate limited  
**Fix**: Wait 10 seconds, try again

---

## 📊 Performance Benchmarks

### **Expected Response Times**

| Endpoint | First Hit | Cached Hit | Cache TTL |
|----------|-----------|------------|-----------|
| Daily Metrics | 50-200ms | <10ms | 60s |
| Provider Performance | 30-150ms | <10ms | 60s |
| Model Usage | 40-180ms | <10ms | 60s |
| Executive Summary | 100-300ms | <10ms | 30s |
| Health Score | 80-250ms | <10ms | 60s |
| User Segments | 60-200ms | <10ms | 60s |
| Revenue Plans | 70-220ms | <10ms | 60s |
| Churn Risk | 90-270ms | <10ms | 60s |

### **Cache Hit Rate**

After 5 minutes of normal use, check:
```bash
curl http://localhost:8788/api/v1/cache/stats
```

✅ Expected: 70-90% hit rate

---

## ✅ Success Criteria

All tests pass if:
- [x] Gateway starts successfully on port 8788
- [x] Frontend loads without errors
- [x] Keyboard shortcuts change tabs (no URL hash)
- [x] Advanced panels accessible via toggle
- [x] Network requests go to `localhost:8788/api/v1/...`
- [x] All responses include `metadata` object
- [x] Metadata badges visible on panels
- [x] Refresh button rate-limited (6/min)
- [x] Error states show when gateway down
- [x] Cache hit rate >70% after warm-up
- [x] No TypeScript errors in console
- [x] No `any` types in codebase

---

## 🎯 Quick Commands

```bash
# Start everything
cd server && node analyticsGateway.mjs &
cd .. && npm run dev

# Test gateway health
curl http://localhost:8788/health

# Check cache stats
curl http://localhost:8788/api/v1/cache/stats

# Trigger refresh
curl -X POST http://localhost:8788/api/v1/refresh

# Stop gateway
lsof -ti:8788 | xargs kill -9

# Restart gateway
cd server && node analyticsGateway.mjs
```

---

**All systems operational. Command center ready for production use!** 🚀
