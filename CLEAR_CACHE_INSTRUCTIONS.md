# ⚠️ Important: Clear Browser Cache

## Issue
Your browser has cached the old video settings with `gen3a_turbo` model. The new `veo3` default hasn't loaded yet.

## Quick Fix

### Option 1: Use Incognito/Private Window (Fastest)
1. Open a **new incognito/private window**
2. Go to http://localhost:5173
3. Test video generation
4. Should use veo3 by default ✅

### Option 2: Clear localStorage (Permanent Fix)
1. Open http://localhost:5173
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Type: `localStorage.clear()`
5. Press **Enter**
6. **Refresh the page** (F5 or Cmd+R)
7. Settings will reset to veo3 ✅

### Option 3: Manual Update (Advanced)
1. Open http://localhost:5173
2. Press **F12** → **Console** tab
3. Type:
```javascript
const settings = JSON.parse(localStorage.getItem('sinaiq-settings'));
settings.quickProps.video.model = 'veo3';
settings.quickProps.video.duration = 8;
localStorage.setItem('sinaiq-settings', JSON.stringify(settings));
location.reload();
```
4. Press **Enter**
5. Page will reload with veo3 ✅

## Why This Happens

The `settings` object (including video model and duration) is saved in browser `localStorage`. When you made changes to the code:
- ✅ Code default is now `veo3`
- ❌ But your browser loaded the old `gen3a_turbo` from cache

## After Clearing

Once cleared, you'll see:
- ✅ Model: Veo-3 by Google DeepMind
- ✅ Duration: 8 seconds
- ✅ Video generation works!

## Test Again

After clearing cache:
1. Open Video panel
2. Verify it shows "Veo-3 by Google DeepMind"
3. Enter prompt
4. Click Validate
5. Hit Generate

Should work perfectly! 🎬✨
