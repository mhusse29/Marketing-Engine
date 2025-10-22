# Vercel Analytics Deployment Guide

## Overview

The analytics dashboard is now deployed as a **static frontend** + **serverless API functions** on Vercel. The API endpoints are implemented as Vercel serverless functions in the `/api` directory.

## Architecture

- **Frontend**: React app built with Vite → deployed to Vercel CDN
- **Backend**: Express analytics gateway → converted to Vercel serverless functions
- **Database**: Supabase (PostgreSQL)
- **Real-time**: WebSocket support removed (serverless doesn't support persistent connections)

## Environment Variables Required in Vercel

You **must** set these environment variables in your Vercel project settings:

### 1. Supabase Configuration
```bash
VITE_SUPABASE_URL=https://wkhcakxjhmwapvqjrxld.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Analytics Configuration
```bash
VITE_ANALYTICS_GATEWAY_URL=/api
ANALYTICS_GATEWAY_KEY=your_secure_gateway_key_here
ANALYTICS_PUBLIC_ACCESS=false
ANALYTICS_ALLOWED_ORIGINS=*
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with the following scope:
   - `VITE_*` variables: **Production, Preview, Development** (exposed to client)
   - `SUPABASE_SERVICE_ROLE_KEY`: **Production, Preview, Development** (server-only)
   - `ANALYTICS_*` variables: **Production, Preview, Development** (server-only)

## Deployment Steps

### Option 1: Automatic Deployment (Connected to Git)
```bash
# Push to your main branch
git add .
git commit -m "Add serverless analytics API"
git push origin main

# Vercel will automatically deploy
```

### Option 2: Manual Deployment via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## API Endpoints

All analytics endpoints are now available at:

- `GET /api/health` - Health check
- `GET /api/v1/metrics/health?interval=60` - Health score
- `GET /api/v1/metrics/daily?days=30` - Daily metrics
- `GET /api/v1/metrics/executive?days=30` - Executive summary
- `GET /api/v1/metrics/providers` - Provider performance
- `GET /api/v1/metrics/models` - Model usage
- `GET /api/v1/metrics/realtime?limit=50` - Recent API usage
- `GET /api/v1/segments/users?limit=100` - User segments
- `GET /api/v1/revenue/plans` - Revenue by plan
- `GET /api/v1/users/churn-risk?min_score=50` - Churn risk users

## Authentication

The serverless functions support three authentication methods:

1. **Service Key**: Use `x-analytics-key` header with `ANALYTICS_GATEWAY_KEY`
2. **JWT Token**: Use `Authorization: Bearer <token>` with Supabase JWT
3. **Public Access**: Set `ANALYTICS_PUBLIC_ACCESS=true` for development only

## CORS Configuration

By default, CORS is set to allow all origins (`*`). For production, set specific origins:

```bash
ANALYTICS_ALLOWED_ORIGINS=https://your-domain.vercel.app,https://www.your-domain.com
```

## Testing Locally

Test the serverless functions locally with Vercel CLI:

```bash
# Install dependencies
npm install

# Start Vercel dev server
vercel dev

# Access at http://localhost:3000
```

## Limitations

### WebSocket Real-time Updates Removed
Vercel serverless functions don't support WebSocket connections. The real-time WebSocket features from `analyticsGateway.mjs` are not available in this deployment. The dashboard will use polling instead (auto-refresh every 30 seconds).

If you need real-time WebSocket support, consider:
- Deploy the full Express gateway to Railway, Render, or Fly.io
- Use Supabase Realtime directly in the frontend
- Use Vercel Edge Functions with Server-Sent Events (SSE)

## Troubleshooting

### CORS Errors
- Check that `ANALYTICS_ALLOWED_ORIGINS` includes your Vercel domain
- Verify CORS headers are set in `vercel.json`

### 401 Unauthorized Errors
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check that Supabase JWT tokens are being passed in requests
- For development, set `ANALYTICS_PUBLIC_ACCESS=true`

### 500 Internal Server Errors
- Check Vercel function logs in dashboard
- Verify all Supabase environment variables are set
- Ensure database migrations are applied

## Monitoring

View serverless function logs:
1. Go to Vercel Dashboard
2. Select your project
3. Navigate to **Deployments** → Select deployment → **Functions**
4. Click on any function to view logs

## Cost Considerations

Vercel Free Tier includes:
- 100GB bandwidth
- 100 serverless function executions per day
- 10 second function timeout

For higher usage, upgrade to Pro plan.
