# 🚀 Complete Admin Dashboard Startup Guide

## 📋 **Prerequisites**

You need your **Supabase Service Role Key**:
1. Go to: https://supabase.com/dashboard/project/wkhcakxjhmwapvqjrxld/settings/api
2. Copy the **"service_role"** key (the secret one)

---

## ⚡ **Quick Start (2 Terminals)**

### **Terminal 1: Analytics Gateway**

```bash
cd "/Users/mohamedhussein/Desktop/Marketing Engine"

# Set environment variables
export SUPABASE_URL="https://wkhcakxjhmwapvqjrxld.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
export ANALYTICS_GATEWAY_KEY="admin-analytics-2024"

# Start gateway
npm run gateway:start
```

**Keep this terminal open!** Gateway runs on port **8788**

---

### **Terminal 2: Admin Dashboard**

```bash
cd "/Users/mohamedhussein/Desktop/Marketing Engine"

# Set gateway key for frontend
export VITE_ANALYTICS_GATEWAY_KEY="admin-analytics-2024"

# Start admin dashboard
npm run admin:dev
```

**Keep this terminal open!** Admin dashboard runs on port **5174**

---

## 🌐 **Access Points**

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| **Admin Dashboard** | 5174 | http://localhost:5174/admin.html | Password: `admin123` |
| **Analytics Gateway** | 8788 | http://localhost:8788/health | N/A |
| Marketing Engine | 5173 | http://localhost:5173 | Email/Password |

---

## ✅ **Verification Steps**

### **1. Check Gateway is Running**

```bash
curl http://localhost:8788/health
```

**Expected output:**
```json
{
  "status": "healthy",
  "timestamp": "...",
  ...
}
```

### **2. Check Admin Dashboard is Running**

```bash
lsof -i :5174
```

**Should show:** `node` process listening on port 5174

### **3. Test Admin Auth**

1. Open: http://localhost:5174/admin.html
2. You should see:
   - ✅ GLSLHills 3D animated background
   - ✅ SINAIQ logo with "Admin" badge
   - ✅ Password input field

### **4. Test Data Loading**

1. Enter password: `admin123`
2. Click "Access Dashboard"
3. Wait 2-3 seconds
4. **You should see:** Executive overview with metrics loading

**If you see 401 errors:**
- Check that `VITE_ANALYTICS_GATEWAY_KEY` is set in Terminal 2
- Check that `ANALYTICS_GATEWAY_KEY` is set in Terminal 1
- Both must be: `admin-analytics-2024`

---

## 🐛 **Troubleshooting**

### **Port Already in Use**

```bash
# Kill process on port 8788
lsof -ti:8788 | xargs kill -9

# Kill process on port 5174
lsof -ti:5174 | xargs kill -9
```

### **Gateway Won't Start**

**Error:** "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"

**Fix:** Make sure you exported the variables in Terminal 1:
```bash
echo $SUPABASE_SERVICE_ROLE_KEY  # Should print your key
```

### **401 Unauthorized Errors**

**Check frontend has the key:**
```bash
# In Terminal 2
echo $VITE_ANALYTICS_GATEWAY_KEY  # Should print: admin-analytics-2024
```

**Check gateway has the key:**
```bash
# In Terminal 1  
echo $ANALYTICS_GATEWAY_KEY  # Should print: admin-analytics-2024
```

**Both must match!**

### **Admin Dashboard Shows Empty**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors
4. Check Network tab for failed requests

---

## 📊 **Testing with Puppeteer**

Run this to verify everything is working:

```bash
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Test gateway health
  const gatewayResponse = await fetch('http://localhost:8788/health');
  console.log('Gateway Health:', gatewayResponse.status === 200 ? '✅' : '❌');
  
  // Test admin dashboard loads
  await page.goto('http://localhost:5174/admin.html');
  await page.waitForTimeout(2000);
  const title = await page.title();
  console.log('Admin Dashboard:', title.includes('Analytics') ? '✅' : '❌');
  
  await browser.close();
})();
"
```

---

## 🔑 **Environment Variables Summary**

### **Terminal 1 (Gateway):**
- `SUPABASE_URL` = `https://wkhcakxjhmwapvqjrxld.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = Your secret key from Supabase
- `ANALYTICS_GATEWAY_KEY` = `admin-analytics-2024`

### **Terminal 2 (Admin Dashboard):**
- `VITE_ANALYTICS_GATEWAY_KEY` = `admin-analytics-2024`

---

## 🎯 **Port Map**

```
5173 ← Marketing Engine (main app, Supabase auth)
5174 ← Admin Dashboard (admin password auth)
8788 ← Analytics Gateway (data API)
8787 ← AI Gateway (not used by admin)
```

---

## 💡 **Pro Tips**

### **Make Environment Persistent**

Add to `~/.zshrc` (or `~/.bashrc`):

```bash
# Supabase
export SUPABASE_URL="https://wkhcakxjhmwapvqjrxld.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-key-here"

# Analytics Keys
export ANALYTICS_GATEWAY_KEY="admin-analytics-2024"
export VITE_ANALYTICS_GATEWAY_KEY="admin-analytics-2024"
```

Then: `source ~/.zshrc`

### **Quick Start Aliases**

Add to `~/.zshrc`:

```bash
alias start-gateway='cd "/Users/mohamedhussein/Desktop/Marketing Engine" && npm run gateway:start'
alias start-admin='cd "/Users/mohamedhussein/Desktop/Marketing Engine" && npm run admin:dev'
```

---

## ✅ **Success Checklist**

- [ ] Gateway running on port 8788
- [ ] Gateway health returns 200 OK
- [ ] Admin dashboard running on port 5174
- [ ] Admin login page loads with GLSLHills background
- [ ] Can login with password `admin123`
- [ ] Dashboard shows without 401 errors
- [ ] Metrics load successfully

---

## 🆘 **Still Having Issues?**

1. **Check logs:**
   ```bash
   # Gateway output in Terminal 1
   # Admin dashboard output in Terminal 2
   ```

2. **Verify ports:**
   ```bash
   lsof -i :5173 -i :5174 -i :8788 | grep LISTEN
   ```

3. **Test gateway directly:**
   ```bash
   curl -H "x-analytics-key: admin-analytics-2024" \
        http://localhost:8788/api/v1/metrics/health?interval=60
   ```

   Should return JSON data, not 401.

---

**Last Updated:** October 19, 2025  
**Version:** 1.0
