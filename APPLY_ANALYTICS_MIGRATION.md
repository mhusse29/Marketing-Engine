# 🔧 Apply Analytics Migration

## **CRITICAL: Run this SQL in Supabase to fix your analytics dashboard**

Your analytics dashboard needs database views and functions that don't exist yet. Follow these steps:

---

## ✅ **Step 1: Open Supabase SQL Editor**

1. Go to: https://supabase.com/dashboard/project/wkhcakxjhmwapvqjrxld
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

---

## ✅ **Step 2: Copy and Run the Migration**

Copy the entire contents of this file:
```
supabase/migrations/20241018_add_analytics_views_functions.sql
```

Paste it into the SQL Editor and click **Run** (or press Cmd+Enter)

---

## ✅ **Step 3: Verify Installation**

Run this query to verify everything was created:

```sql
-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_health_score', 'get_churn_risk_users', 'refresh_analytics_views');

-- Check materialized views
SELECT matviewname 
FROM pg_matviews 
WHERE schemaname = 'public';

-- Check views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'v_daily_executive_dashboard';
```

You should see:
- ✅ 3 functions
- ✅ 3 materialized views
- ✅ 1 view

---

## ✅ **Step 4: Refresh Your Browser**

After running the migration:
1. Go back to: http://localhost:5174
2. Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Your analytics dashboard should now load with data!

---

## 📊 **What Was Created:**

### **Functions:**
- `get_health_score()` - Calculate system health metrics
- `get_churn_risk_users()` - Identify at-risk users
- `refresh_analytics_views()` - Refresh cached data

### **Materialized Views (cached for performance):**
- `mv_daily_metrics` - Daily usage statistics
- `mv_provider_performance` - Provider performance metrics
- `mv_user_segments` - User segmentation data

### **Views:**
- `v_daily_executive_dashboard` - Real-time executive KPIs

---

## 🔄 **Refreshing Analytics Data**

To refresh the cached views (run daily):
```sql
SELECT refresh_analytics_views();
```

---

## ⚠️ **Troubleshooting**

If you get an error about missing tables, first run:
```
supabase/migrations/20241017_create_usage_tracking_tables.sql
```

Then run the analytics migration again.

---

**Once you run this migration, your analytics dashboard will work perfectly!** 🎉
