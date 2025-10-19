# 🚀 Quick Start: Analytics Dashboard

## ✅ **Your Database Status**

- **Project:** SINAIQ (wkhcakxjhmwapvqjrxld)
- **Status:** ACTIVE_HEALTHY ✅
- **Data Available:** 
  - 3 API usage records
  - 1 unique user
  - Latest activity: Oct 18, 2025
- **Materialized Views:**
  - ✅ mv_daily_metrics (1 row)
  - ✅ mv_provider_performance (2 rows)
  - ✅ mv_model_usage (3 rows)

---

## 🎯 **3-Step Setup**

### **Step 1: Get Your Service Role Key**

1. Open: https://supabase.com/dashboard/project/wkhcakxjhmwapvqjrxld/settings/api
2. Scroll to **"Project API keys"**
3. Copy the **`service_role`** key (the secret one, NOT the anon key)
4. It looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **Step 2: Set Environment Variable**

```bash
export SUPABASE_SERVICE_ROLE_KEY="your-key-here"
```

### **Step 3: Start Gateway**

```bash
./start-analytics.sh
```

---

## 🎯 **Alternative: One-Command Start**

```bash
# Set the key and start in one command
SUPABASE_SERVICE_ROLE_KEY="your-key-here" ./start-analytics.sh
```

---

## 📊 **Access Dashboard**

Once gateway is running:

1. **Gateway:** http://localhost:8788/health (should show "healthy")
2. **Dashboard:** http://localhost:5173/analytics-standalone
3. **Login:** Use your Supabase credentials
   - Email: `mohamed@sinaiq.com`
   - Your Supabase password

---

## 🔍 **Verify Everything is Working**

```bash
# Check gateway health
curl http://localhost:8788/health

# Check metrics endpoint
curl http://localhost:8788/api/v1/status

# Both should return JSON data
```

---

## ❌ **Troubleshooting**

### **"Connection refused" error**

Gateway isn't running. Run: `./start-analytics.sh`

### **"Unauthorized" error**

Service role key is wrong or not set. Check the key in Supabase dashboard.

### **No data in dashboard**

1. Check browser console (F12)
2. Look for errors
3. Verify gateway is responding: `curl http://localhost:8788/health`

---

## 📁 **Files Created**

- `start-analytics.sh` - Startup script (run this!)
- `.env.analytics` - Environment template
- `QUICK_START_ANALYTICS.md` - This guide

---

## 🎉 **What You'll See**

Your dashboard will show:

- **Executive Overview**
  - Total users: 1
  - API requests: 3
  - Latest activity: Oct 18
  
- **Model Usage**
  - 3 models tracked
  
- **Provider Performance**  
  - 2 providers active

---

## 💡 **Pro Tip: Permanent Setup**

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# Analytics Gateway
export SUPABASE_SERVICE_ROLE_KEY="your-key-here"
```

Then just run: `./start-analytics.sh` anytime!

---

## ✅ **Ready!**

Run this now:

```bash
# 1. Set your key (get from Supabase dashboard)
export SUPABASE_SERVICE_ROLE_KEY="your-actual-key"

# 2. Start gateway
./start-analytics.sh

# 3. Open dashboard
open http://localhost:5173/analytics-standalone
```

**Dashboard link:** http://localhost:5173/analytics-standalone 🚀
