# 🔑 Get Your Supabase Service Role Key

## Step 1: Access Supabase Dashboard

**Direct Link:**
👉 https://supabase.com/dashboard/project/wkhcakxjhmwapvqjrxld/settings/api

Or manually:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: **SINAIQ** (wkhcakxjhmwapvqjrxld)
3. Click **Settings** (gear icon on left sidebar)
4. Click **API** in settings menu

---

## Step 2: Copy Service Role Key

Look for the **"Project API keys"** section.

You'll see two keys:
- ✅ **`service_role` key** - This is what you need (secret key, very long JWT)
- ❌ `anon` key - NOT this one

The service role key looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```

Click the **👁️ (eye icon)** to reveal it, then click **📋 (copy icon)** to copy.

---

## Step 3: Set Environment Variable

```bash
export SUPABASE_SERVICE_ROLE_KEY="paste-your-key-here"
```

⚠️ **Important:** Replace `paste-your-key-here` with your actual key.

---

## Step 4: Start Admin Dashboard

```bash
./start-admin-dashboard.sh
```

That's it! The script will:
- ✅ Verify your credentials
- ✅ Start analytics gateway (port 8788)
- ✅ Start admin dashboard (port 5174)
- ✅ Open automatically in your browser

---

## 🎯 Quick Copy-Paste

```bash
# 1. Get key from: https://supabase.com/dashboard/project/wkhcakxjhmwapvqjrxld/settings/api
# 2. Then run:

export SUPABASE_SERVICE_ROLE_KEY="your-actual-service-role-key-here"
./start-admin-dashboard.sh
```

---

## ❓ Troubleshooting

### "Permission denied" when running script
```bash
chmod +x start-admin-dashboard.sh
```

### "Service role key not set"
Make sure you used `export` (not just assignment):
```bash
# ❌ Wrong:
SUPABASE_SERVICE_ROLE_KEY="key"

# ✅ Correct:
export SUPABASE_SERVICE_ROLE_KEY="key"
```

### Verify your key is set
```bash
echo $SUPABASE_SERVICE_ROLE_KEY
# Should print your key
```

---

## 📋 Project Info (Already Configured)

- **Project:** SINAIQ
- **Project ID:** wkhcakxjhmwapvqjrxld
- **Region:** us-east-1
- **Status:** ACTIVE_HEALTHY
- **Database:** PostgreSQL 17.6
- **Project URL:** https://wkhcakxjhmwapvqjrxld.supabase.co
- **Gateway Key:** admin-analytics-2024 (already configured)

You only need to provide the **service role key** from Supabase dashboard.
