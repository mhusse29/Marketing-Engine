# 🎯 Independent Analytics Admin Dashboard

Complete setup guide for the standalone analytics admin dashboard with GLSLHills 3D background.

---

## ✨ **Features**

- **🔐 Independent Authentication** - Simple password-based admin access (no Supabase needed)
- **🌊 GLSLHills 3D Background** - Beautiful animated hills using Three.js shaders
- **📊 Full Analytics Dashboard** - Same powerful analytics as before
- **🚀 Separate App** - Runs on port 5174, completely independent from marketing engine (port 5173)
- **💾 Persistent Login** - Stay logged in using localStorage

---

## 📁 **Architecture**

```
Marketing Engine (Port 5173)          Analytics Admin (Port 5174)
├── index.html                        ├── admin.html
├── src/main.tsx                      ├── src/admin-main.tsx
└── src/Router.tsx                    └── src/AdminRouter.tsx
```

**Completely separate apps - can run simultaneously!**

---

## 🚀 **Quick Start**

### **1. Set Admin Password**

Create a `.env` file in the project root:

```bash
VITE_ADMIN_PASSWORD=your-secure-password-here
```

**Default password (if not set):** `admin123`

### **2. Start Analytics Gateway**

```bash
# Terminal 1: Start the analytics gateway
export SUPABASE_URL="https://wkhcakxjhmwapvqjrxld.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
npm run gateway:start
```

### **3. Start Admin Dashboard**

```bash
# Terminal 2: Start admin dashboard
npm run admin:dev
```

### **4. Access Dashboard**

Open: **http://localhost:5174/admin**

---

## 🎨 **Login Page**

The admin login page features:

- **SINAIQ Logo** with "Admin" badge
- **GLSLHills 3D Animation** - Animated procedural hills
- **Glass-morphism Card** - Modern transparent design
- **Simple Password Input** - Just one field, no sign up
- **Loading States** - Smooth authentication feedback

**Login Credentials:**
- Password: `admin123` (or your custom password from `.env`)

---

## 📊 **Dashboard Features**

After login, you get access to:

### **Executive Overview**
- Total users and active users today
- Success rate and health score
- Total cost and average latency
- Active alerts

### **Real-time Operations**
- Live API usage via WebSocket
- Recent requests with details
- Performance metrics

### **Model Usage**
- Cost breakdown by model
- Request counts
- Performance statistics

### **Provider Performance**
- Speed and reliability metrics
- Provider comparison
- Error rates

### **User Intelligence**
- User segments
- Churn risk analysis
- Behavior patterns

### **Revenue Analytics**
- Subscription plans
- Monthly recurring revenue
- Growth metrics

---

## 🔒 **Security**

### **Authentication Flow**

1. User enters password on `/admin`
2. Password compared against `VITE_ADMIN_PASSWORD` (or default)
3. On success: `localStorage.setItem('analytics_admin_auth', 'authenticated')`
4. Redirect to `/dashboard`
5. Protected route checks localStorage on page load

### **Logout**

To logout manually:

```javascript
// In browser console
localStorage.removeItem('analytics_admin_auth');
location.reload();
```

Or add a logout button (TODO).

### **Production Security**

For production:
1. ✅ Set strong `VITE_ADMIN_PASSWORD` in environment
2. ✅ Use HTTPS only
3. ✅ Consider adding rate limiting
4. ✅ Add session expiry (currently never expires)
5. ✅ Add IP whitelist if needed

---

## 🛠️ **Development**

### **File Structure**

```
src/
├── admin-main.tsx                # Admin app entry point
├── AdminRouter.tsx               # Admin routes
├── contexts/
│   └── AdminAuthContext.tsx      # Admin authentication
├── components/
│   ├── AdminProtectedRoute.tsx   # Route protection
│   └── ui/
│       └── glsl-hills.tsx        # 3D background component
└── pages/
    ├── AdminAuthPage.tsx         # Login page with GLSLHills
    └── StandaloneAnalyticsDashboard.tsx  # Main dashboard
```

### **Routes**

| Route | Description | Protected |
|-------|-------------|-----------|
| `/admin` | Login page | ❌ Public |
| `/dashboard` | Analytics dashboard | ✅ Protected |
| `*` | Catch-all | → Redirects to `/admin` |

### **NPM Scripts**

```bash
# Development (with hot reload)
npm run admin:dev

# Build for production
npm run admin:build

# Preview production build
npm run admin:preview
```

---

## 🎭 **Customization**

### **Change Admin Password**

Edit `.env`:
```bash
VITE_ADMIN_PASSWORD=my-super-secret-password
```

### **Customize GLSLHills Animation**

Edit `src/pages/AdminAuthPage.tsx`:

```tsx
<GLSLHills 
  width="100vw" 
  height="100vh" 
  cameraZ={125}      // Camera distance (higher = further back)
  planeSize={256}    // Size of the plane
  speed={0.5}        // Animation speed (0.1 = slow, 1.0 = fast)
/>
```

### **Change Login Card Style**

The login card uses Tailwind classes:
- `bg-black/40` - Background transparency
- `backdrop-blur-xl` - Blur effect
- `border-white/10` - Border color

Edit in `src/pages/AdminAuthPage.tsx`

---

## 🐛 **Troubleshooting**

### **Port 5174 already in use**

```bash
# Kill the process on port 5174
lsof -ti:5174 | xargs kill -9

# Or use a different port
npm run admin:dev -- --port 5175
```

### **401 Unauthorized errors**

Gateway is not running or wrong credentials:

```bash
# Make sure gateway is running
npm run gateway:start

# Check gateway health
curl http://localhost:8788/health
```

### **GLSLHills not showing**

Three.js not installed:

```bash
npm install three
```

### **Password not working**

Check environment variable:

```bash
# View current setting
echo $VITE_ADMIN_PASSWORD

# Or check in browser console
console.log(import.meta.env.VITE_ADMIN_PASSWORD)
```

---

## 🚢 **Production Deployment**

### **Build**

```bash
npm run admin:build
```

Output: `dist-admin/` directory

### **Serve**

```bash
# Using a simple static server
npx serve dist-admin -p 5174

# Or with Nginx
server {
    listen 5174;
    root /path/to/dist-admin;
    index admin.html;
    
    location / {
        try_files $uri $uri/ /admin.html;
    }
}
```

### **Environment Variables**

Make sure to set in production:

```bash
VITE_ADMIN_PASSWORD=production-password-here
```

---

## 📦 **Dependencies**

### **New Dependencies Added**

- `three` (^0.180.0) - For GLSLHills 3D animation

### **Reused Dependencies**

- React, React Router, Tailwind CSS, Lucide React
- All existing analytics components

---

## ✅ **Testing**

### **Manual Test Checklist**

- [ ] Login page loads with GLSLHills animation
- [ ] "Admin" badge appears below SINAIQ logo
- [ ] Wrong password shows error message
- [ ] Correct password redirects to dashboard
- [ ] Dashboard loads analytics data
- [ ] Refresh page keeps you logged in
- [ ] Direct access to `/dashboard` without login redirects to `/admin`

### **Test Commands**

```bash
# Start everything
npm run gateway:start  # Terminal 1
npm run admin:dev      # Terminal 2

# Test auth flow
open http://localhost:5174/admin

# Test protected route (should redirect)
open http://localhost:5174/dashboard
```

---

## 🎯 **Next Steps**

### **Recommended Enhancements**

1. **Add Logout Button**
   - Add logout button in dashboard header
   - Clear localStorage and redirect to `/admin`

2. **Session Expiry**
   - Add timestamp to localStorage
   - Check expiry on page load
   - Force re-login after 24 hours

3. **Multi-Admin Support**
   - Store multiple admin credentials
   - Add username field
   - Use JWT tokens

4. **2FA Support**
   - Add TOTP integration
   - Backup codes
   - Email verification

5. **Audit Log**
   - Log all admin logins
   - Track dashboard actions
   - Store in Supabase

---

## 🆘 **Support**

Having issues? Check:

1. **Gateway running?** → `curl http://localhost:8788/health`
2. **Port available?** → `lsof -i:5174`
3. **Dependencies installed?** → `npm install`
4. **Environment vars set?** → Check `.env` file

---

## 📝 **Summary**

**What you have now:**

✅ Independent analytics admin dashboard (port 5174)  
✅ Beautiful GLSLHills 3D login page  
✅ Simple password authentication  
✅ Full analytics capabilities  
✅ Completely separate from marketing engine  
✅ Production-ready build process  

**Access:** http://localhost:5174/admin  
**Password:** `admin123` (or your custom password)  

**Enjoy your new admin dashboard!** 🚀📊
