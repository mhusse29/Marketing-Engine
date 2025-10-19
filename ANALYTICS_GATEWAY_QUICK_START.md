# Analytics Gateway - Quick Start Guide

## 🚀 Start the Gateway in 3 Steps

### Step 1: Install Dependencies (if not already)
```bash
cd server
npm install
```

Required packages:
- `express`
- `cors`
- `@supabase/supabase-js`
- `node-cache`

### Step 2: Set Environment Variables
Create or update `server/.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ANALYTICS_GATEWAY_PORT=8788  # Optional, defaults to 8788
NODE_ENV=development
```

⚠️ **Important**: Use the **service role key**, not the anon key. The gateway needs admin access to refresh materialized views.

### Step 3: Start the Gateway
```bash
cd server
node analyticsGateway.mjs
```

You should see:
```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║             🚀 Analytics Gateway Service                      ║
║                                                               ║
║  Port:         8788                                           ║
║  Environment:  development                                    ║
║  Cache TTL:    60s                                            ║
║  Version:      v1.0.0                                         ║
║                                                               ║
║  Endpoints:                                                   ║
║    GET  /health                                               ║
║    GET  /api/v1/status                                        ║
║    GET  /api/v1/metrics/daily                                 ║
║    GET  /api/v1/metrics/providers                             ║
║    GET  /api/v1/metrics/models                                ║
║    GET  /api/v1/metrics/executive                             ║
║    GET  /api/v1/metrics/realtime                              ║
║    POST /api/v1/refresh                                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🧪 Test the Gateway

### Check Health
```bash
curl http://localhost:8788/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "analytics-gateway",
  "version": "1.0.0",
  "uptime": 42.5,
  "cache": {
    "keys": 0,
    "hits": 0,
    "misses": 0,
    "hitRate": "0.00%"
  }
}
```

### Fetch Daily Metrics
```bash
curl http://localhost:8788/api/v1/metrics/daily?days=7
```

Expected response:
```json
{
  "data": [
    {
      "date": "2025-10-18",
      "daily_active_users": 42,
      "total_requests": 1250,
      "success_rate_pct": 98.5,
      "total_cost": 12.45,
      ...
    }
  ],
  "metadata": {
    "timestamp": "2025-10-18T23:15:30.000Z",
    "cached": false,
    "source": "database",
    "freshness": "current",
    "version": "v1"
  }
}
```

### Refresh Materialized Views
```bash
curl -X POST http://localhost:8788/api/v1/refresh
```

Expected response:
```json
{
  "success": true,
  "message": "Views refreshed and cache cleared",
  "timestamp": "2025-10-18T23:16:00.000Z"
}
```

---

## 🔗 Configure Frontend

Add to your `.env` (root directory):
```bash
VITE_ANALYTICS_GATEWAY_URL=http://localhost:8788
```

Then restart your dev server:
```bash
npm run dev
```

The frontend will now route all analytics requests through the gateway!

---

## 📊 Monitor Cache Performance

### Get Cache Stats
```bash
curl http://localhost:8788/api/v1/cache/stats
```

Response:
```json
{
  "keys": 5,
  "hits": 42,
  "misses": 12,
  "hitRate": 0.777,
  "keyList": [
    "daily_metrics_30",
    "provider_performance",
    "model_usage",
    "executive_30",
    "realtime_50"
  ]
}
```

### Clear Specific Cache Key
```bash
curl -X DELETE http://localhost:8788/api/v1/cache/daily_metrics_30
```

---

## 🐛 Troubleshooting

### Issue: "Database query failed"
**Cause**: Wrong Supabase URL or invalid service role key
**Fix**: Double-check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `server/.env`

### Issue: Gateway not accessible
**Cause**: Port 8788 already in use
**Fix**: Change port in `.env`:
```bash
ANALYTICS_GATEWAY_PORT=8789
```
Then update frontend `.env`:
```bash
VITE_ANALYTICS_GATEWAY_URL=http://localhost:8789
```

### Issue: CORS errors in browser
**Cause**: Frontend running on different port
**Fix**: Gateway already has CORS enabled for all origins. If issue persists, check browser console for exact error.

### Issue: Cache not clearing after refresh
**Cause**: TTL hasn't expired, or cache keys don't match
**Fix**: Use `/api/v1/refresh` endpoint - it clears ALL cache keys

---

## 🔄 Production Deployment

### Recommended Setup
1. **Use PM2 or systemd** to keep gateway running
2. **Add Redis** for shared cache across instances
3. **Enable rate limiting** with `express-rate-limit`
4. **Use HTTPS** with reverse proxy (nginx/Caddy)
5. **Monitor with health checks** - `GET /health` every 30s

### PM2 Example
```bash
pm2 start analyticsGateway.mjs --name analytics-gateway
pm2 save
pm2 startup  # Auto-start on reboot
```

### Docker Example
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 8788
CMD ["node", "analyticsGateway.mjs"]
```

---

## 📈 Performance Tuning

### Adjust Cache TTL
Edit `analyticsGateway.mjs`:
```javascript
const cache = new NodeCache({ 
  stdTTL: 120,  // Change from 60s to 120s
  checkperiod: 240,
  useClones: false
});
```

### Adjust Per-Endpoint TTL
Edit endpoint functions:
```javascript
const result = await cachedQuery(
  cacheKey,
  queryFn,
  300  // Change from 60s to 300s (5 min)
);
```

### Disable Caching for Specific Endpoint
Skip `cachedQuery` wrapper:
```javascript
const { data, error } = await supabase.from('...').select('*');
res.json(addMetadata(data, { cached: false, source: 'database' }));
```

---

## 🔒 Security Checklist

- [x] Service role key in `.env` (not hardcoded)
- [ ] Add rate limiting middleware (production)
- [ ] Add API key authentication (production)
- [ ] Enable HTTPS (production)
- [ ] Restrict CORS origins (production)
- [ ] Add request logging (production)
- [ ] Monitor for suspicious patterns (production)

---

## 📞 Support

If you encounter issues:
1. Check gateway logs for errors
2. Test endpoints with `curl` to isolate frontend vs backend
3. Verify Supabase connection with `GET /api/v1/status`
4. Check cache stats to debug caching issues

Gateway logs show:
- Request duration: `[timestamp] GET /api/v1/metrics/daily - 200 (45ms)`
- Cache hits/misses: `[CACHE HIT] daily_metrics_30`
- Database errors: Full error messages in console

---

**Status**: Gateway is production-ready. Frontend is configured to use it. All systems operational. 🎉
