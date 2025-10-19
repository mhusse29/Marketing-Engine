# 🚀 Luma AI Integration - Quick Setup Guide

## Step 1: Add Your Luma API Key

1. Open `server/.env` file (create if it doesn't exist)
2. Add your Luma API key:

```bash
LUMA_API_KEY=luma_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get your API key from:** https://lumalabs.ai/

---

## Step 2: Start the Gateway

Open a terminal and run:

```bash
cd server
node ai-gateway.mjs
```

✅ You should see: `AI Gateway listening on 8787`

---

## Step 3: Start the Dev Server

Open another terminal and run:

```bash
npm run dev
```

✅ Your app should open at `http://localhost:5173`

---

## Step 4: Test the Integration

### Option A: Automated Test (Recommended)

Run the test script:

```bash
node test-luma-integration.mjs
```

This will verify:
- ✓ Environment configuration
- ✓ Gateway health check
- ✓ Direct Luma API connection
- ✓ Task polling
- ✓ Gateway integration
- ✓ End-to-end flow

### Option B: Manual Test in UI

1. Open the app in your browser
2. Navigate to the **Video panel**
3. Select **"Luma"** as the provider (top section)
4. Enter a video prompt (min 10 characters):
   ```
   A peaceful mountain landscape with flowing clouds at sunset
   ```
5. Enable **"Loop"** option (Luma-specific feature)
6. Click **"Validate video settings"**
7. Click **"Generate"** button
8. Watch the progress and see your video!

---

## Features Available

### Luma-Specific Settings

- **Loop**: Create seamless looping videos
- **Models**: Dream Machine v1 and v1.5
- **Speed**: Fast generation (~30-60 seconds)
- **Duration**: 5 seconds per video

### Shared Settings

- **Aspect Ratio**: 9:16, 1:1, 16:9
- **Camera Movement**: Pan, zoom, orbit, static, etc.
- **Visual Style**: Cinematic, photorealistic, modern
- **Lighting**: Golden hour, studio, natural, dramatic
- **Advanced**: Motion speed, framing, film look, color grading

---

## Troubleshooting

### "luma_not_configured" Error

**Problem:** Gateway can't find Luma API key

**Solution:**
1. Check `server/.env` file exists
2. Verify `LUMA_API_KEY=luma_...` is present
3. Restart the gateway: `node server/ai-gateway.mjs`

### Gateway Won't Start

**Problem:** Port 8787 is already in use

**Solution:**
1. Kill existing process: `lsof -ti:8787 | xargs kill -9`
2. Or change port in `server/.env`: `PORT=8788`

### Video Generation Timeout

**Problem:** Video takes too long to generate

**Solution:**
- Wait longer (Luma can take 30-60 seconds)
- Check your API quota at https://lumalabs.ai/
- Try a simpler prompt

### Provider Not Showing in UI

**Problem:** Only Runway appears, no Luma option

**Solution:**
1. Verify `LUMA_API_KEY` in `server/.env`
2. Restart gateway
3. Check browser console for errors
4. Clear browser cache and reload

---

## Health Check

Verify everything is working:

```bash
curl http://localhost:8787/health
```

Expected response:
```json
{
  "ok": true,
  "videoProviders": {
    "runway": true,
    "luma": true
  }
}
```

---

## Provider Comparison

| Feature | Runway (Veo-3) | Luma (Dream Machine) |
|---------|----------------|----------------------|
| Duration | 8 seconds | 5 seconds |
| Quality | Highest | High |
| Speed | ~2-3 min | ~30-60 sec |
| Loop | ❌ | ✅ |
| Best For | Premium hero videos | Quick social content |

---

## What's Next?

### For Production:

1. ✅ Add Luma API key to production `.env`
2. ✅ Set appropriate rate limits
3. ✅ Monitor API usage and quotas
4. ✅ Test error handling under load
5. ✅ Configure logging and monitoring

### For Development:

- Experiment with different prompts
- Try the loop feature for social media
- Compare Runway vs Luma for different use cases
- Test image-to-video (upload image in Advanced settings)

---

## Documentation

Full technical documentation: `LUMA_INTEGRATION.md`

API reference and advanced features available in the full docs.

---

## Support

- **Luma API Issues:** https://docs.lumalabs.ai/
- **Integration Questions:** Check console logs (browser + server)
- **Feature Requests:** Submit via project repository

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** December 2024

Happy creating! 🎬✨

