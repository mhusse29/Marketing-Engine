# Deploy Analytics Gateway to Railway - Complete Guide

## The Problem

Vercel serverless functions are not working correctly for the analytics API. The fastest solution is to deploy the Express gateway to Railway (or Render) as a separate backend service.

## ✅ Solution: Deploy Express Gateway to Railway

Railway provides free hosting for the analytics gateway with WebSocket support.

---

## Step 1: Deploy to Railway (5 minutes)

### A. Sign Up / Login
1. Go to https://railway.app
2. Sign in with GitHub

### B. Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Select your repository: `mhusse29/Marketing-Engine`
4. Railway will automatically detect it's a Node.js project

### C. Configure Environment Variables
Click on your project → **"Variables"** tab → Add these:

```bash
NODE_ENV=production
PORT=8788
ANALYTICS_GATEWAY_PORT=8788
SUPABASE_URL=https://wkhcakxjhmwapvqjrxld.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<GET_FROM_SUPABASE_DASHBOARD>
ANALYTICS_ALLOWED_ORIGINS=https://sinaiq-analytics.vercel.app,https://sinaiq-analytics-ehwbdd6qt-mohamed-3276s-projects.vercel.app
ANALYTICS_PUBLIC_ACCESS=false
```

**Important**: Get `SUPABASE_SERVICE_ROLE_KEY` from:
- Supabase Dashboard → Your Project → Settings → API → `service_role` key

### D. Configure Start Command
Click **"Settings"** → **"Deploy"** section:
- **Start Command**: `node server/analyticsGateway.mjs`
- **Watch Paths**: Leave default

### E. Deploy
1. Click **"Deploy"** or push to main branch (auto-deploys)
2. Wait 2-3 minutes for deployment
3. Railway will give you a URL like: `https://marketing-engine-production.up.railway.app`

---

## Step 2: Update Vercel Environment Variable

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select project: **sinaiq-analytics**
3. Go to **Settings** → **Environment Variables**
4. Update or add:

```bash
VITE_ANALYTICS_GATEWAY_URL=https://your-app.up.railway.app
```

**Replace** `your-app.up.railway.app` with your actual Railway URL.

5. **Important**: Set for all environments (Production, Preview, Development)
6. Click **"Redeploy"** to apply changes

---

## Step 3: Verify Deployment

### Test Railway Gateway
```bash
# Replace with your Railway URL
curl https://your-app.up.railway.app/health

# Expected response:
{
  "status": "healthy",
  "service": "analytics-gateway",
  "version": "1.0.0",
  "uptime": 123.45,
  "cache": {...}
}
```

### Test Analytics API
```bash
# Health metrics (requires auth)
curl https://your-app.up.railway.app/api/v1/metrics/health?interval=60 \
  -H "Authorization: Bearer <your-supabase-jwt>"
```

### Test from Vercel Frontend
1. Go to https://sinaiq-analytics.vercel.app
2. Open browser console (F12)
3. Check Network tab
4. Should see requests to `your-app.up.railway.app`
5. **No more CORS errors!** ✅

---

## Alternative: Deploy to Render (if Railway doesn't work)

### Render Deployment
1. Go to https://render.com
2. Click **"New +" → "Web Service"**
3. Connect GitHub repository
4. Configure:
   - **Name**: `sinaiq-analytics-gateway`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/analyticsGateway.mjs`
   - **Plan**: Free
5. Add environment variables (same as Railway)
6. Click **"Create Web Service"**
7. Get URL: `https://sinaiq-analytics-gateway.onrender.com`
8. Update Vercel env variable

---

## Troubleshooting

### Gateway Returns 503
- Check Railway logs: Project → **"Deployments"** → Click latest → **"View Logs"**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check `PORT` environment variable is set

### Still Getting CORS Errors
1. Verify `ANALYTICS_ALLOWED_ORIGINS` includes your Vercel domain
2. Check gateway logs for CORS errors
3. Ensure Vercel has the correct `VITE_ANALYTICS_GATEWAY_URL`
4. Hard refresh browser (Cmd+Shift+R)

### 401 Unauthorized
- Verify user is logged in to Supabase
- Check JWT token is being passed
- For testing, temporarily set `ANALYTICS_PUBLIC_ACCESS=true`

### Railway/Render Free Tier Limits
- **Railway**: 500 hours/month, $5 credit
- **Render**: 750 hours/month free

Both are sufficient for development/testing.

---

## Benefits of This Approach

✅ **WebSocket Support** - Real-time updates work
✅ **No CORS Issues** - Proper backend with CORS configured
✅ **Production Ready** - Uses existing tested code
✅ **Free Tier** - Railway/Render offer free hosting
✅ **Easy Debugging** - Full logs and monitoring
✅ **Auto Deploy** - Push to GitHub = auto deploy

---

## Summary Checklist

- [ ] Deploy to Railway (or Render)
- [ ] Get Service Role Key from Supabase
- [ ] Add all environment variables
- [ ] Confirm deployment successful
- [ ] Test `/health` endpoint
- [ ] Update `VITE_ANALYTICS_GATEWAY_URL` in Vercel
- [ ] Redeploy Vercel
- [ ] Test frontend - CORS errors should be gone!

---

**Total Time**: 10-15 minutes
**Result**: CORS errors completely fixed with fully functional analytics dashboard

---

## Files Added

- `railway.json` - Railway deployment config
- `Procfile` - Render/Heroku deployment config  
- `CORS_FINAL_FIX.md` - Problem analysis
- This file - Complete deployment guide

**Next Step**: Follow Step 1 above to deploy to Railway!
