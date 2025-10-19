# 🚀 How to Start the Marketing Engine

## The App Has TWO Parts

### **Backend (AI Gateway)** - Port 8787
```bash
npm run dev
```
This runs the AI gateway with all LLM endpoints.

### **Frontend (React App)** - Port 5173
```bash
npm run web:dev
```
This runs the Vite development server with the UI.

## ⚡ Quick Start

### **Option 1: Two Terminals** (Recommended)

**Terminal 1 - Backend**:
```bash
cd "/Users/mohamedhussein/Desktop/Marketing Engine"
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd "/Users/mohamedhussein/Desktop/Marketing Engine"  
npm run web:dev
```

Then open: **http://localhost:5173**

### **Option 2: Single Command** (Background)

```bash
npm run dev & npm run web:dev
```

---

## 🔍 Verify Both Are Running

### Check Backend
```bash
curl http://localhost:8787/health
```
Should return: `{"ok":true,...}`

### Check Frontend
Open browser: **http://localhost:5173**  
Should see: Marketing Engine app

---

## ✅ Both Are Now Running!

**I've started the frontend for you!**

- ✅ Backend (Gateway): http://localhost:8787
- ✅ Frontend (UI): http://localhost:5173

**Open http://localhost:5173 in your browser now!**

---

## 🎯 Test the Features

### **Badu Animation**
1. Click Badu icon (bottom right)
2. Send a message
3. Watch the smooth typing effect! ✨

### **Luma Settings**
1. Open Video Panel
2. Select Luma
3. See Duration, Resolution, Loop controls

### **Enhancements**
1. Click wand icons ✨ on prompts
2. Get AI-enhanced text

**Enjoy!** 🚀

