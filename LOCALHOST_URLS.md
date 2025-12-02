# 🚀 Marketing Engine Localhost URLs

## ✅ Your Marketing Engine is Running!

### Main Application
**URL:** http://localhost:5173

This is your main Marketing Engine application where you can:
- Generate marketing content for all platforms
- Generate images with multiple AI providers
- Generate videos with Runway and Luma
- Chat with Badu AI Assistant
- Access analytics dashboard

---

### API Gateway
**URL:** http://localhost:8787

**Health Check:** http://localhost:8787/health

**Status:** ✅ Running
- Primary Model: gpt-5
- Fallback Model: gpt-4o
- Chat Model: gpt-5-chat-latest

**Image Providers:**
- OpenAI DALL-E ✅
- Flux ✅
- Ideogram ✅
- Stability ❌ (optional)

**Video Providers:**
- Runway (veo3) ✅
- Luma (ray-2) ✅

---

### Analytics Gateway
**URL:** http://localhost:8788

**Status:** ✅ Running

---

## 🎯 Quick Start

1. **Open the app in your browser:**
   ```
   http://localhost:5173
   ```

2. **Check gateway health:**
   ```bash
   curl http://localhost:8787/health | jq
   ```

3. **View logs:**
   ```bash
   # Gateway logs
   tail -f gateway-main.log
   
   # Vite logs
   tail -f vite.log
   ```

---

## 🛠️ Managing Services

### Stop All Services
```bash
pkill -f "node server/ai-gateway.mjs"
pkill -f "vite"
pkill -f "analyticsGateway"
```

### Restart Services
```bash
# From project root
npm run gateway:dev &    # Start gateway
npm run web:dev &        # Start frontend
npm run gateway:start &  # Start analytics gateway
```

### Check Services Status
```bash
# Check if services are running
ps aux | grep -E "(gateway|vite)" | grep -v grep

# Test gateway health
curl http://localhost:8787/health

# Test frontend
curl http://localhost:5173
```

---

## 📊 Service Ports

| Service | Port | Status |
|---------|------|--------|
| Frontend (Vite) | 5173 | ✅ Running |
| AI Gateway | 8787 | ✅ Running |
| Analytics Gateway | 8788 | ✅ Running |

---

**Last Updated:** October 20, 2025  
**Status:** All services operational 🎉









