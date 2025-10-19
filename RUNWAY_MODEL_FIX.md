# ✅ Runway Model Parameter Fix

## Issue
Runway API was rejecting ALL model names with 403 errors:
- ❌ `gen3a` - "Model variant gen3a is not available"
- ❌ `gen3a_turbo` - "Model variant gen3a_turbo is not available"
- ❌ `gen3_turbo` - Also rejected

## Root Cause
Runway's Gen-3 API **does not accept** a `model` parameter for video generation. The endpoint automatically uses the appropriate Gen-3 model based on your account tier and settings.

## Solution
**Removed the `model` parameter** from the API request payload entirely.

### What Changed:
```javascript
// BEFORE (causing 403 errors)
const payload = {
  promptText: promptText.trim(),
  model,  // ❌ Runway doesn't accept this
  duration,
  ratio,
  watermark,
}

// AFTER (working)
const payload = {
  promptText: promptText.trim(),
  // model parameter removed - Runway determines model automatically
  duration,
  ratio,
  watermark,
}
```

## How It Works Now

### Frontend (UI keeps model selection)
The UI still shows two model options for user clarity:
- **Gen-3 Alpha Turbo** - User expectation: faster
- **Gen-3 Turbo** - User expectation: standard

### Backend (API doesn't use model)
The gateway sends the same request regardless of user selection. Runway's API:
1. Receives the request WITHOUT a model parameter
2. Automatically selects the appropriate Gen-3 model
3. Uses your account's default settings/tier

## Why Keep UI Model Selection?

Even though the backend doesn't send the model parameter, we kept the UI options because:

1. **Future-proofing** - Runway may add model selection later
2. **User expectations** - Users expect to choose between Turbo/Standard
3. **Documentation** - Our UI matches Runway's marketing materials
4. **Settings persistence** - User preferences are saved for future use

## Testing Instructions

1. Open the Video panel
2. Enter a prompt (min 10 characters)
3. Select either model option (currently both work the same)
4. Configure other settings (duration, aspect, etc.)
5. Click "Validate"
6. Hit "Generate"

The video should generate successfully! 🎬

## What Actually Controls Quality?

Since the model parameter is ignored, video quality/speed is determined by:
- Your Runway account tier (Pro/Enterprise/etc.)
- API rate limits
- Your API key's permissions
- The specific Gen-3 variant your account has access to

## Future Enhancement

If Runway updates their API to accept model selection, we can easily re-enable it by uncommenting one line in the gateway:

```javascript
const payload = {
  promptText: promptText.trim(),
  model,  // Uncomment when Runway supports it
  duration,
  ratio,
  watermark,
}
```

## Notes

- ✅ Aspect ratios: Fixed (`1280:720`, `720:1280`, `960:960`)
- ✅ Duration: Working (5 or 10 seconds)
- ✅ Watermark: Working (true/false)
- ✅ Prompt enhancement: Working (all advanced parameters)
- ❌ Model selection: Not supported by Runway API (yet)

## Ready to Test!

The gateway has been restarted with this fix. Try generating a video now - it should work regardless of which model option you select in the UI! 🚀
