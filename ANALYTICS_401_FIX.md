# 🔧 Analytics Dashboard 401 Error - Complete Fix

## Problem Summary

Getting **401 Unauthorized** errors when accessing admin analytics dashboard:
```
GET http://localhost:8788/api/v1/metrics/health?interval=60 401 (Unauthorized)
```

## Root Cause

The **admin dashboard** (`admin.html`) uses `AdminAuthProvider` (simple password), NOT `AuthProvider` (Supabase). 

There are **3 different entry points** for analytics:
1. **Main app** (`/analytics-standalone`) → Uses Supabase JWT authentication
2. **Admin app** (`/admin#/dashboard`) → Should use **gateway key** authentication  
3. **Standalone** (`/analytics.html`) → Should use **gateway key** authentication

The `analyticsClient` supports BOTH authentication methods:
- **JWT tokens** (from Supabase session) - for main app users
- **Gateway key** (x-analytics-key header) - for admin/standalone access

## The Fix

### **Step 1: Generate a Secure Gateway Key**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example output:
```
0bd1bd19049d1913c322d82a5bc3689b06054926b2e92119acfcb51d0094c1e3
```

### **Step 2: Create `.env` File**

Create a `.env` file in project root with:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://wkhcakxjhmwapvqjrxld.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Server URLs
VITE_API_URL=http://localhost:8787
VITE_ANALYTICS_GATEWAY_URL=http://localhost:8788

# Admin Dashboard Password
VITE_ADMIN_PASSWORD=your_admin_password

# Analytics Gateway Key (CRITICAL - use your generated key)
VITE_ANALYTICS_GATEWAY_KEY=0bd1bd19049d1913c322d82a5bc3689b06054926b2e92119acfcb51d0094c1e3

# Server-side Configuration
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ANALYTICS_GATEWAY_KEY=0bd1bd19049d1913c322d82a5bc3689b06054926b2e92119acfcb51d0094c1e3
```

**⚠️ CRITICAL:** 
- `VITE_ANALYTICS_GATEWAY_KEY` → Client-side (Vite loads this)
- `ANALYTICS_GATEWAY_KEY` → Server-side (Gateway validates this)
- **Both must have the SAME value!**

### **Step 3: Start the Analytics Gateway**

```bash
# Terminal 1
export SUPABASE_URL="https://wkhcakxjhmwapvqjrxld.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export ANALYTICS_GATEWAY_KEY="0bd1bd19049d1913c322d82a5bc3689b06054926b2e92119acfcb51d0094c1e3"

npm run gateway:start
```

Or load from .env.analytics:
```bash
source .env.analytics
npm run gateway:start
```

You should see:
```
✅ [Gateway] Analytics Gateway listening on http://localhost:8788
```

### **Step 4: Start Admin Dashboard**

```bash
# Terminal 2
npm run admin:dev
```

Opens at: **http://localhost:5174/admin**

### **Step 5: Test**

1. Navigate to `http://localhost:5174/admin`
2. Enter admin password
3. You should see the analytics dashboard load WITHOUT 401 errors

## How It Works

### **analyticsClient.ts Authentication Logic**

```typescript
async buildHeaders(existingHeaders?: HeadersInit): Promise<Headers> {
  const headers = new Headers(existingHeaders || {});
  
  // Priority 1: If gateway key is set, use it (admin/standalone mode)
  if (this.gatewayKey) {
    headers.set('x-analytics-key', this.gatewayKey);
    return headers;
  }
  
  // Priority 2: Otherwise, try to get Supabase JWT (main app mode)
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } catch (error) {
    console.error('Failed to retrieve Supabase session:', error);
  }
  
  return headers;
}
```

### **Gateway Authentication Flow**

```typescript
// analyticsGateway.mjs
async function authenticateRequest(req, res, next) {
  // Check for service key first (admin/standalone)
  if (ANALYTICS_GATEWAY_KEY && req.headers['x-analytics-key'] === ANALYTICS_GATEWAY_KEY) {
    req.analyticsService = true;
    return next();
  }
  
  // Check for JWT token (main app users)
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  const user = await verifySupabaseUser(token);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  req.analyticsUser = user;
  return next();
}
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    THREE ENTRY POINTS                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. MAIN APP (index.html → main.tsx)                       │
│     ├── AuthProvider (Supabase)                            │
│     ├── Router → /analytics-standalone                     │
│     └── StandaloneAnalyticsDashboard                       │
│          ↓ Uses: Supabase JWT token                        │
│                                                             │
│  2. ADMIN APP (admin.html → admin-main.tsx)                │
│     ├── AdminAuthProvider (password-based)                 │
│     ├── AdminRouter → /dashboard                           │
│     └── StandaloneAnalyticsDashboard                       │
│          ↓ Uses: Gateway key (x-analytics-key)             │
│                                                             │
│  3. STANDALONE (analytics.html → analytics-main.tsx)       │
│     ├── NO auth provider                                   │
│     └── StandaloneAnalyticsDashboard                       │
│          ↓ Uses: Gateway key (x-analytics-key)             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                   All three routes hit:                     │
│         analyticsClient → Analytics Gateway                 │
│              (localhost:8788)                               │
└─────────────────────────────────────────────────────────────┘
```

## Verification Checklist

- [ ] Generated secure gateway key
- [ ] Created `.env` file with both `VITE_ANALYTICS_GATEWAY_KEY` and `ANALYTICS_GATEWAY_KEY`
- [ ] Both keys have **identical values**
- [ ] Analytics gateway running on port 8788
- [ ] Admin dashboard running on port 5174
- [ ] Can access `/admin` and log in
- [ ] Dashboard loads without 401 errors
- [ ] Can see live metrics updating

## Testing Commands

```bash
# Test gateway health (should work with key)
curl -H "x-analytics-key: YOUR_KEY_HERE" http://localhost:8788/health

# Test metrics endpoint (should work with key)
curl -H "x-analytics-key: YOUR_KEY_HERE" http://localhost:8788/api/v1/metrics/executive

# Test without key (should return 401)
curl http://localhost:8788/api/v1/metrics/executive
```

## Common Issues

### **Issue: Still getting 401 errors**

**Cause:** Gateway key not set or mismatch between client/server

**Fix:**
```bash
# Check client-side (browser console)
console.log(import.meta.env.VITE_ANALYTICS_GATEWAY_KEY)

# Check server-side
echo $ANALYTICS_GATEWAY_KEY

# Must be the same!
```

### **Issue: Gateway not starting**

**Cause:** Missing SUPABASE_SERVICE_ROLE_KEY

**Fix:**
```bash
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
npm run gateway:start
```

### **Issue: Admin dashboard not connecting to gateway**

**Cause:** CORS or wrong gateway URL

**Fix:** Check `.env`:
```bash
VITE_ANALYTICS_GATEWAY_URL=http://localhost:8788
```

## Documentation References

- **Gateway Security:** `ANALYTICS_GATEWAY_SECURITY.md`
- **Admin Setup:** `ADMIN_DASHBOARD_SETUP.md`
- **Gateway Monitoring:** `ANALYTICS_GATEWAY_MONITORING.md`

## Summary

✅ **StandaloneAnalyticsDashboard** should NOT have auth logic  
✅ **analyticsClient** handles both JWT and gateway key authentication  
✅ **Admin dashboard** uses gateway key, NOT Supabase JWT  
✅ **Main app** uses Supabase JWT  
✅ **Standalone** uses gateway key  

The key is properly configuring **VITE_ANALYTICS_GATEWAY_KEY** in your environment!
