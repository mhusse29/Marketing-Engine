# 🚀 START ANALYTICS DASHBOARD

## Quick Start (Copy & Paste)

### Terminal 1: Start Gateway
```bash
export SUPABASE_URL="https://wkhcakxjhmwapvqjrxld.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraGNha3hqaG13YXB2cWpyeGxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDcyMDgwNywiZXhwIjoyMDc2Mjk2ODA3fQ.jb0oagXh_FS36VIVG-wourLnpd-21sN01QElFT0HhHI"
export ANALYTICS_GATEWAY_KEY="d0f615cb40ed30ff1798b2697a5dbe5599937aa1bb2098e43f3d325dddac00ae"
npm run gateway:start
```

### Terminal 2: Start Analytics
```bash
npm run analytics:dev
```

### Access
- **Analytics Dashboard**: http://localhost:5176/analytics
- **Gateway Health**: http://localhost:8788/health

---

## ✅ What Was Fixed

1. **Removed old dashboard** - Deleted `AnalyticsDashboard.tsx` with old styling
2. **Unified routes** - Both `/analytics` routes now use `StandaloneAnalyticsDashboard` (terminal theme)
3. **Authentication configured** - Gateway key properly set in `.env`

---

## 🔍 If You Get 401 Errors

### Check Gateway is Running
```bash
curl http://localhost:8788/health
```

Should return: `{"status":"healthy"...}`

### Check Gateway Key in Browser
Open `http://localhost:5176/analytics` and check console:
```javascript
console.log(import.meta.env.VITE_ANALYTICS_GATEWAY_KEY)
```

Should show: `d0f615cb40ed30ff1798b2697a5dbe5599937aa1bb2098e43f3d325dddac00ae`

### Test Gateway Auth
```bash
curl -H "x-analytics-key: d0f615cb40ed30ff1798b2697a5dbe5599937aa1bb2098e43f3d325dddac00ae" \
  http://localhost:8788/api/v1/metrics/executive
```

Should return JSON data, not `{"success":false,"error":"Unauthorized"}`

---

## 🎯 Three Ways to Access Analytics

| Method | URL | Auth | Login Required |
|--------|-----|------|----------------|
| **Main App** | http://localhost:5173/analytics | Supabase JWT | ✓ Yes (Supabase) |
| **Standalone** | http://localhost:5176/analytics | Gateway Key | ✗ No |
| **Admin** | http://localhost:5174/admin | Gateway Key | ✗ No (password only) |

**Recommended**: Use **Admin** or **Standalone** to avoid Supabase login requirement.

---

## 💡 Easiest Method: Admin Dashboard

```bash
# Terminal 1
npm run gateway:start

# Terminal 2
npm run admin:dev
```

Access: http://localhost:5174/admin  
Password: `admin123` (or check `VITE_ADMIN_PASSWORD` in `.env`)

**Advantage**: No Supabase login needed, just password!

---

## ✅ Success Indicators

When working correctly:
- ✓ No 401 errors in console
- ✓ Dashboard shows real data (not empty)
- ✓ Terminal theme (green on black)
- ✓ Live updates working
- ✓ All metrics loading

---

## 🛠️ Configuration Files

All keys are configured in `.env`:
- `VITE_ANALYTICS_GATEWAY_KEY` - Frontend (client)
- `ANALYTICS_GATEWAY_KEY` - Backend (gateway)
- `SUPABASE_URL` - Database connection
- `SUPABASE_SERVICE_ROLE_KEY` - Database auth
- `VITE_ADMIN_PASSWORD` - Admin dashboard password

---

##Ready to Use! 🎉

Everything is configured. Just start the two services and access the dashboard!
