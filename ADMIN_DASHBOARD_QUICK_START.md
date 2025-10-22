# 🚀 Admin Dashboard - Quick Start

## ⚡ The Fastest Way to Start

### Step 1: Get Your Service Role Key
👉 **Open this link:** https://supabase.com/dashboard/project/wkhcakxjhmwapvqjrxld/settings/api

Copy the **`service_role`** key (click the eye icon 👁️ to reveal it)

### Step 2: Run These Commands

```bash
cd "/Users/mohamedhussein/Desktop/Marketing Engine"

# Set your service role key (paste your actual key)
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Start everything
./start-admin-dashboard.sh
```

### Step 3: Access Dashboard
Open: **http://localhost:5174/admin.html**  
Password: **admin123**

---

## 🎯 What the Script Does

✅ Verifies your credentials  
✅ Checks/clears ports 8788 and 5174  
✅ Starts Analytics Gateway (backend)  
✅ Starts Admin Dashboard (frontend)  
✅ Sets up proper authentication  
✅ Creates logs in `logs/` directory  

---

## 🛠️ Troubleshooting

### Problem: 401 Unauthorized Errors
**Cause:** Missing gateway key environment variable  
**Solution:** The script now sets this automatically! Just make sure you have the service role key.

### Problem: "Permission denied"
```bash
chmod +x start-admin-dashboard.sh
```

### Problem: Ports already in use
The script will ask if you want to kill existing processes.

### Problem: Gateway won't start
Check logs:
```bash
tail -f logs/gateway.log
```

Common causes:
- Wrong service role key
- Missing `SUPABASE_URL` (script sets this automatically)
- Port 8788 blocked by firewall

---

## 📋 Project Information

Your Supabase project (retrieved via MCP):
- **Name:** SINAIQ
- **ID:** wkhcakxjhmwapvqjrxld
- **Region:** us-east-1
- **Status:** ✅ ACTIVE_HEALTHY
- **Database:** PostgreSQL 17.6.1
- **URL:** https://wkhcakxjhmwapvqjrxld.supabase.co

All of these are already configured in the script. You only need your **service role key**.

---

## 🔄 Stopping Services

Press `Ctrl+C` in the terminal. The script will automatically stop both:
- Analytics Gateway (port 8788)
- Admin Dashboard (port 5174)

---

## 📝 Alternative: Manual Start

If you prefer to run services separately:

### Terminal 1 (Gateway):
```bash
export SUPABASE_URL="https://wkhcakxjhmwapvqjrxld.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-key"
export ANALYTICS_GATEWAY_KEY="admin-analytics-2024"
npm run gateway:start
```

### Terminal 2 (Dashboard):
```bash
export VITE_ANALYTICS_GATEWAY_KEY="admin-analytics-2024"
npm run admin:dev
```

---

## ✅ Verification

Once started, you should see:

**In Terminal:**
```
✅ Gateway is healthy
✅ Services Started Successfully!

Access the admin dashboard at:
👉 http://localhost:5174/admin.html

Default credentials:
Password: admin123
```

**In Browser:**
- No 401 errors in console
- Metrics loading successfully
- Charts displaying data

---

## 🎓 What Was Fixed

The **401 Unauthorized** errors were caused by:
1. Admin dashboard not sending the gateway authentication key
2. Missing `VITE_ANALYTICS_GATEWAY_KEY` environment variable
3. Analytics gateway rejecting unauthenticated requests

**The automated script now:**
- ✅ Sets all required environment variables
- ✅ Handles authentication properly
- ✅ Manages both services with one command
- ✅ Provides clear error messages

---

## 📚 Additional Documentation

- **GET_CREDENTIALS.md** - Detailed guide to get your service role key
- **START_ADMIN_DASHBOARD_COMPLETE.md** - Original detailed setup guide
- **ANALYTICS_GATEWAY_SECURITY.md** - Security architecture details
- **RLS_PERFORMANCE_REPORT.md** - Database security & performance tests

---

## 🤝 Need Help?

**Check logs:**
```bash
# Gateway logs
tail -f logs/gateway.log

# Admin dashboard output
# (visible in terminal)
```

**Verify service is running:**
```bash
# Check gateway
curl http://localhost:8788/health

# Check admin dashboard
lsof -i :5174
```

**Test authentication:**
```bash
# Should return healthy status
curl -H "x-analytics-key: admin-analytics-2024" \
  http://localhost:8788/health
```

---

**🎉 You're all set! Enjoy your admin dashboard.**
