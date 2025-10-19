# 🚀 Start Analytics Gateway - Quick Guide

## ⚠️ Prerequisites Check

The analytics gateway needs these environment variables in `server/.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ANALYTICS_GATEWAY_PORT=8788  # Optional, defaults to 8788
```

## 🔧 Setup Steps

### 1. Check if `server/.env` has Supabase credentials
```bash
cat server/.env | grep SUPABASE
```

If you see the credentials, you're good to go! If not, follow step 2.

### 2. Add Supabase credentials to `server/.env`

Open `server/.env` and add:
```bash
SUPABASE_URL=your_actual_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

**Where to find these:**
- Go to your Supabase project dashboard
- Settings → API
- Copy `URL` and `service_role` key (NOT the anon key)

### 3. Start the Gateway
```bash
cd server
node analyticsGateway.mjs
```

You should see the startup banner with endpoints listed.

### 4. Start the Frontend (in a new terminal)
```bash
npm run dev
```

### 5. Verify it's working
Open browser and navigate to analytics dashboard. Check Network tab - you should see requests going to `localhost:8788/api/v1/...`

## 🐛 Troubleshooting

**Error: "supabaseUrl is required"**
- Add `SUPABASE_URL` to `server/.env`

**Error: "Invalid API key"**
- Check that you're using the `service_role` key, not the `anon` key
- Verify the key in Supabase dashboard Settings → API

**Port already in use**
- Change `ANALYTICS_GATEWAY_PORT=8789` in `server/.env`
- Update frontend `.env`: `VITE_ANALYTICS_GATEWAY_URL=http://localhost:8789`

## ✅ Success Indicators

When running correctly you'll see:
```
╔═══════════════════════════════════════════════════════════════╗
║             🚀 Analytics Gateway Service                      ║
║  Port:         8788                                           ║
╚═══════════════════════════════════════════════════════════════╝
```

Then in your browser console, you'll see successful requests to the gateway endpoints!
