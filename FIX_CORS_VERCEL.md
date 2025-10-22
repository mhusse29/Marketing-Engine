# 🚀 Fix CORS Error - Vercel Deployment Complete

## Problem Fixed

Your production app on Vercel was trying to connect to `localhost:8788` which doesn't exist in production. I've created Vercel serverless functions to replace the Express analytics gateway.

## ✅ What I Did

### 1. Created Serverless API Functions
Created the following files in `/api` directory:
- `api/health.mjs` - Health check endpoint
- `api/_lib/supabase.mjs` - Shared Supabase client
- `api/_lib/cors.mjs` - CORS handling
- `api/_lib/auth.mjs` - Authentication middleware
- `api/v1/metrics/health.mjs` - Health score metrics
- `api/v1/metrics/daily.mjs` - Daily metrics
- `api/v1/metrics/executive.mjs` - Executive summary
- `api/v1/metrics/providers.mjs` - Provider performance
- `api/v1/metrics/models.mjs` - Model usage
- `api/v1/metrics/realtime.mjs` - Real-time API usage
- `api/v1/segments/users.mjs` - User segments
- `api/v1/revenue/plans.mjs` - Revenue metrics
- `api/v1/users/churn-risk.mjs` - Churn risk users

### 2. Updated Configuration
- Updated `vercel.json` to configure serverless functions
- Created deployment documentation

## 🎯 Next Steps - You Need To Do This

### Step 1: Add Environment Variables to Vercel

Go to your Vercel project → Settings → Environment Variables and add:

#### **Required Variables:**
```bash
# Supabase (Server-side only)
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Analytics Gateway Key (optional, for admin access)
ANALYTICS_GATEWAY_KEY=<generate-with-crypto.randomBytes>

# Public Access (set to false for production)
ANALYTICS_PUBLIC_ACCESS=false

# CORS Origins (use your Vercel domain)
ANALYTICS_ALLOWED_ORIGINS=*
```

#### **Already Set (from build env):**
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`
- ✅ `VITE_ANALYTICS_GATEWAY_URL=/api`

### Step 2: Get Your Supabase Service Role Key

1. Go to https://supabase.com/dashboard
2. Select your project: `wkhcakxjhmwapvqjrxld`
3. Go to **Settings** → **API**
4. Copy the **service_role key** (NOT the anon key)
5. Paste it as `SUPABASE_SERVICE_ROLE_KEY` in Vercel

### Step 3: Deploy to Vercel

#### Option A: Automatic (Recommended)
```bash
git add .
git commit -m "Add serverless analytics API"
git push origin main
```
Vercel will auto-deploy.

#### Option B: Manual Deploy
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Deploy
vercel --prod
```

### Step 4: Verify Deployment

After deployment, test these URLs (replace with your domain):

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Metrics endpoint (requires auth)
curl https://your-app.vercel.app/api/v1/metrics/daily?days=30 \
  -H "Authorization: Bearer <your-supabase-jwt>"
```

## 📋 Environment Variables Quick Reference

### Vercel Dashboard Setup

| Variable | Scope | Value |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | All | `https://wkhcakxjhmwapvqjrxld.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | All | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_ANALYTICS_GATEWAY_URL` | All | `/api` |
| `SUPABASE_SERVICE_ROLE_KEY` | All | *Get from Supabase dashboard* |
| `ANALYTICS_GATEWAY_KEY` | All | *Optional, for admin dashboard* |
| `ANALYTICS_PUBLIC_ACCESS` | All | `false` |
| `ANALYTICS_ALLOWED_ORIGINS` | All | `*` or your domain list |

## 🔒 Security Notes

### Authentication
The API supports 3 auth methods (in order of priority):

1. **Service Key** - Use `x-analytics-key` header
2. **JWT Token** - Use `Authorization: Bearer <token>`
3. **Public Access** - Only if `ANALYTICS_PUBLIC_ACCESS=true`

### Production Security
For production, set:
```bash
ANALYTICS_PUBLIC_ACCESS=false
ANALYTICS_ALLOWED_ORIGINS=https://your-domain.vercel.app,https://www.your-domain.com
```

## ⚠️ Important: WebSocket Limitation

Vercel serverless functions **do not support WebSocket connections**. The real-time WebSocket features have been removed. The dashboard now uses:
- Auto-refresh every 30 seconds
- Polling for updates

If you need WebSocket real-time updates, you have two options:

### Option 1: Keep Express Gateway for Real-time
Deploy `server/analyticsGateway.mjs` to Railway/Render/Fly.io and update:
```bash
VITE_ANALYTICS_GATEWAY_URL=https://your-gateway.railway.app
```

### Option 2: Use Supabase Realtime
Modify the frontend to use Supabase Realtime directly instead of Socket.io.

## 🧪 Testing Locally

Test the serverless functions locally:

```bash
# Start Vercel dev server
vercel dev

# Access at http://localhost:3000
# API available at http://localhost:3000/api/*
```

## 📊 Monitoring

View logs:
1. Go to Vercel Dashboard
2. Select your project
3. **Deployments** → Click deployment → **Functions**
4. Click function name to view logs

## ❓ Troubleshooting

### Still Getting CORS Errors?
- Clear browser cache and hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
- Check Vercel deployment logs for errors
- Verify all environment variables are set

### 401 Unauthorized?
- Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Verify user is logged in and JWT token is valid
- For testing, temporarily set `ANALYTICS_PUBLIC_ACCESS=true`

### 500 Internal Server Error?
- Check Vercel function logs
- Verify Supabase database migrations are applied
- Check that materialized views exist in database

## 📚 Documentation

See `VERCEL_DEPLOYMENT.md` for full deployment documentation.

---

## Quick Checklist

- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel env vars
- [ ] Add `ANALYTICS_GATEWAY_KEY` to Vercel env vars (optional)
- [ ] Set `ANALYTICS_PUBLIC_ACCESS=false` for production
- [ ] Configure `ANALYTICS_ALLOWED_ORIGINS` for your domain
- [ ] Deploy to Vercel (`git push` or `vercel --prod`)
- [ ] Test `/api/health` endpoint
- [ ] Test analytics dashboard loads without CORS errors
- [ ] Verify data displays correctly

Once you complete these steps, the CORS error will be resolved! 🎉
