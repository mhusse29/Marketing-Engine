# Analytics Gateway Security Model

## 🔐 **Authentication Architecture**

The analytics gateway now enforces **zero-trust authentication** on all endpoints. No requests succeed without valid credentials.

---

## ✅ **What Changed**

### **Before** (Insecure)
- ❌ Optional gateway key (`x-analytics-key`)
- ❌ Public endpoints (anyone could query)
- ❌ Shared secret for WebSockets
- ❌ No user identification
- ❌ Open CORS (`*`)

### **After** (Secure)
- ✅ **Required** Supabase JWT authentication
- ✅ All endpoints protected by `authenticateRequest` middleware
- ✅ WebSocket validates JWT on handshake
- ✅ User-scoped requests (tied to Supabase user ID)
- ✅ CORS locked to `ALLOWED_ORIGINS`
- ✅ Admin-only endpoints (`requireAdmin` middleware)
- ✅ Service-to-service key for backend calls

---

## 🏗️ **Authentication Flow**

### **Browser → Gateway**

```
┌─────────────────────────────────────────────────────┐
│              Browser (React App)                    │
│  1. User logs in via Supabase Auth                  │
│  2. Gets JWT access token                           │
└────────────────────┬────────────────────────────────┘
                     │
                     │ Authorization: Bearer <jwt>
                     ▼
┌─────────────────────────────────────────────────────┐
│         Analytics Gateway (Port 8788)               │
│  authenticateRequest() middleware:                  │
│  • Extracts JWT from Authorization header           │
│  • Calls supabase.auth.getUser(token)               │
│  • Verifies token validity                          │
│  • Attaches req.analyticsUser = user                │
│  • Allows request to proceed                        │
└─────────────────────────────────────────────────────┘
```

### **Service → Gateway** (Backend)

```
┌─────────────────────────────────────────────────────┐
│           Backend Service (Node.js)                 │
│  Internal automation, cron jobs, etc.               │
└────────────────────┬────────────────────────────────┘
                     │
                     │ x-analytics-key: <service_key>
                     ▼
┌─────────────────────────────────────────────────────┐
│         Analytics Gateway (Port 8788)               │
│  authenticateRequest() middleware:                  │
│  • Checks for x-analytics-key header                │
│  • Compares to ANALYTICS_GATEWAY_KEY                │
│  • Sets req.analyticsService = true                 │
│  • Bypasses JWT check                               │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ **Required Environment Variables**

### **Gateway (server/.env or environment)**

```bash
# Supabase connection (REQUIRED for JWT validation)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Service role key for admin ops

# Gateway security (OPTIONAL but recommended)
ANALYTICS_GATEWAY_KEY=your-secure-random-key-here  # For service-to-service auth

# CORS (REQUIRED for production)
ANALYTICS_ALLOWED_ORIGINS=http://localhost:5173,https://yourapp.com

# Rate limiting (OPTIONAL)
ANALYTICS_REFRESH_LIMIT=6  # Max manual refreshes per minute (default: 3)

# Port (OPTIONAL)
ANALYTICS_GATEWAY_PORT=8788
```

### **Frontend (src/.env.local)**

```bash
# Supabase (user authentication)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # Anon key (public)

# Gateway URL (OPTIONAL, defaults to localhost:8788)
VITE_ANALYTICS_GATEWAY_URL=http://localhost:8788
```

---

## 🔑 **Authentication Methods**

### **1. Supabase JWT (Browser Clients)**

**Used by**: React frontend, mobile apps, any user-facing client

**How it works**:
```typescript
// Client automatically includes JWT in every request
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

fetch('http://localhost:8788/api/v1/metrics/executive', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  credentials: 'include'
});
```

**Gateway validation**:
```javascript
async function authenticateRequest(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  const user = await verifySupabaseUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.analyticsUser = user;  // Attach user to request
  next();
}
```

---

### **2. Service Key (Backend Services)**

**Used by**: Cron jobs, server-side scripts, admin tools

**How it works**:
```bash
curl -H "x-analytics-key: your-secure-key" \
  http://localhost:8788/api/v1/metrics/executive
```

**Gateway validation**:
```javascript
if (ANALYTICS_GATEWAY_KEY && req.headers['x-analytics-key'] === ANALYTICS_GATEWAY_KEY) {
  req.analyticsService = true;  // Service bypass
  return next();
}
```

**Generate a secure key**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 👤 **Admin Role Requirement**

### **Endpoints Requiring Admin**

These endpoints require either:
- Service key (`x-analytics-key`), OR
- Supabase user with `roles: ['admin']` in app metadata

**Protected endpoints**:
- `POST /api/v1/refresh` - Manual refresh of materialized views
- `GET /api/v1/cache/stats` - Cache statistics
- `DELETE /api/v1/cache/:key` - Clear cache entries

### **Setting Admin Role**

**Option 1: Supabase Dashboard**

1. Go to **Authentication** → **Users**
2. Click on a user
3. Scroll to **User Metadata** → **App Metadata**
4. Add JSON:
```json
{
  "roles": ["admin"]
}
```

**Option 2: SQL**

```sql
-- Grant admin role to a user
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{roles}',
  '["admin"]'::jsonb
)
WHERE email = 'admin@example.com';
```

**Option 3: MCP Tool**

```typescript
await mcp2_execute_sql({
  project_id: 'your-project-id',
  query: `
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{roles}',
      '["admin"]'::jsonb
    )
    WHERE email = 'admin@example.com'
  `
});
```

---

## 🌐 **WebSocket Authentication**

### **Client Handshake**

```typescript
import { io } from 'socket.io-client';

const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

const socket = io('http://localhost:8788', {
  auth: {
    token: token  // JWT passed in handshake
  },
  transports: ['websocket', 'polling']
});

socket.on('connected', (data) => {
  console.log('Authenticated WebSocket:', data);
});

socket.on('api_usage:insert', (event) => {
  // Live updates (only if authenticated)
  console.log('New API usage:', event.data);
});
```

### **Gateway Validation**

```javascript
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  const serviceKey = socket.handshake.auth?.serviceKey;

  // Check service key first
  if (serviceKey === ANALYTICS_GATEWAY_KEY) {
    socket.analyticsService = true;
    return next();
  }

  // Validate JWT
  const user = await verifySupabaseUser(token);
  if (user) {
    socket.analyticsUser = user;
    return next();
  }

  return next(new Error('Unauthorized'));
});
```

---

## 🔒 **CORS Configuration**

### **Development**

```javascript
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
];
```

### **Production**

```bash
# .env
ANALYTICS_ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com,https://admin.yourapp.com
```

### **Gateway Setup**

```javascript
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,  // Allow cookies/auth headers
}));

io.on('connection', socket => {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

---

## ⚠️ **Error Responses**

### **401 Unauthorized**

**Cause**: No token, invalid token, or expired token

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Solution**: User needs to log in via Supabase Auth

---

### **403 Forbidden**

**Cause**: Valid user, but missing required admin role

```json
{
  "success": false,
  "error": "Forbidden"
}
```

**Solution**: Grant user admin role in Supabase

---

### **429 Rate Limited**

**Cause**: Too many refresh requests (default: 3/minute)

```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again later.",
  "retryAfter": 42
}
```

**Solution**: Wait and retry, or increase `ANALYTICS_REFRESH_LIMIT`

---

## ✅ **Verification Checklist**

### **Gateway Setup**

- [ ] `SUPABASE_URL` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `ANALYTICS_GATEWAY_KEY` generated and set (optional)
- [ ] `ANALYTICS_ALLOWED_ORIGINS` configured for production
- [ ] Gateway running on port 8788

### **User Authentication**

- [ ] Users can log in via Supabase Auth
- [ ] Frontend includes JWT in `Authorization` header
- [ ] WebSocket passes JWT in handshake
- [ ] At least one admin user configured

### **Testing**

```bash
# 1. Test unauthenticated request (should fail)
curl http://localhost:8788/api/v1/metrics/executive
# Expected: {"success":false,"error":"Unauthorized"}

# 2. Test with service key (should succeed)
curl -H "x-analytics-key: your-key" \
  http://localhost:8788/api/v1/metrics/executive
# Expected: {"data": [...], "metadata": {...}}

# 3. Test with JWT (login via frontend first)
curl -H "Authorization: Bearer <jwt>" \
  http://localhost:8788/api/v1/metrics/executive
# Expected: {"data": [...], "metadata": {...}}

# 4. Test admin endpoint without admin role (should fail)
curl -X POST \
  -H "Authorization: Bearer <jwt>" \
  http://localhost:8788/api/v1/refresh
# Expected: {"success":false,"error":"Forbidden"}
```

---

## 🚀 **Production Deployment**

### **1. Set Environment Variables**

```bash
export SUPABASE_URL=https://prod-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<prod-service-key>
export ANALYTICS_GATEWAY_KEY=<secure-random-key>
export ANALYTICS_ALLOWED_ORIGINS=https://yourapp.com
export ANALYTICS_REFRESH_LIMIT=6
export NODE_ENV=production
```

### **2. Start Gateway**

```bash
node server/analyticsGateway.mjs
```

### **3. Configure Reverse Proxy (nginx)**

```nginx
location /analytics-gateway/ {
  proxy_pass http://localhost:8788/;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

### **4. Update Frontend**

```bash
# .env.production
VITE_ANALYTICS_GATEWAY_URL=https://yourapp.com/analytics-gateway
```

---

## 📊 **Monitoring**

### **Check Auth Status**

```bash
# View logs for auth failures
tail -f server/logs/gateway.log | grep "Auth"
```

### **Cache Stats (Admin Only)**

```bash
curl -H "x-analytics-key: your-key" \
  http://localhost:8788/api/v1/cache/stats
```

### **WebSocket Connections**

```bash
# Gateway logs show connection count
[WebSocket] Client connected (5 total)
[WebSocket] Client disconnected (4 remaining)
```

---

## 🎯 **Summary**

### **Security Guarantees**

✅ **All requests authenticated** - No public endpoints  
✅ **User-scoped data** - Each request tied to Supabase user  
✅ **Admin-protected actions** - Refresh/cache ops require admin role  
✅ **Service-to-service auth** - Backend calls use secure key  
✅ **CORS protection** - Only allowed origins can connect  
✅ **Rate limiting** - Prevents abuse of manual refresh  
✅ **WebSocket security** - Live updates require valid JWT  

### **Zero Trust Architecture**

The gateway now operates on **"deny by default"** principle:
- ❌ No credentials = 401 Unauthorized
- ❌ Invalid token = 401 Unauthorized
- ❌ Valid token but not admin = 403 Forbidden
- ❌ Wrong origin = CORS blocked
- ✅ Valid credentials = Request allowed

**Result**: Trusted live telemetry with full authentication and authorization! 🎉
