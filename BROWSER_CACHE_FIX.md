# How to Fix the 503 Error - Browser Cache Issue

## The Problem
Your browser has cached the **old version** of `BaduAssistantEnhanced.tsx` that doesn't include the authentication header. Even though we fixed the code, the browser is still using the old cached version.

## Solution: Hard Refresh

### For Chrome/Edge/Brave:
1. **Windows/Linux:** Press `Ctrl + Shift + R` or `Ctrl + F5`
2. **Mac:** Press `Cmd + Shift + R`

### For Firefox:
1. **Windows/Linux:** Press `Ctrl + Shift + R` or `Ctrl + F5`
2. **Mac:** Press `Cmd + Shift + R`

### For Safari:
1. **Mac:** Press `Cmd + Option + R`
2. Or: Hold `Shift` and click the refresh button

## Alternative: Clear Vite Cache

If hard refresh doesn't work:

```bash
# Stop the dev server (Ctrl+C in terminal)
# Then run:
rm -rf node_modules/.vite
npm run dev
```

## Verify the Fix

After hard refresh, open the browser console (F12) and check:

1. **Network tab** - Look for the request to `/v1/chat/enhanced`
2. **Request Headers** should now include:
   ```
   Authorization: Bearer eyJ... (long token)
   ```
3. **Response** should be a valid JSON response, not 503

## What Changed

The file `src/components/BaduAssistantEnhanced.tsx` now includes:

```typescript
// Get authentication token
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(`${getApiBase()}/v1/chat/enhanced`, {
  headers: {
    'Authorization': `Bearer ${session.access_token}`, // ✅ Added!
  },
});
```

## Current Gateway Status
✅ Gateway running on port 8787
✅ OpenAI API configured
✅ Authentication working
✅ Enhanced endpoint ready

**Just need to refresh the browser to load the new code!**
