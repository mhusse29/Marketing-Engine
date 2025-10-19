# ⚠️ CRITICAL: Runway UI Issue - Fake Parameters

## 🚨 **PROBLEM DISCOVERED**

The recent changes to `MenuVideo.tsx` added many Runway-specific controls:
- Time of Day (Dawn, Morning, Noon, Afternoon, Sunset, etc.)
- Weather (Clear, Cloudy, Rainy, Foggy, Snowy, Stormy)
- Motion Amount (Minimal, Moderate, High, Extreme)
- Expanded Camera Movements (Tilt Up/Down, Dolly Forward/Back, Orbit Left/Right, Crane Up/Down, FPV)
- Expanded Visual Styles (Noir, Muted, etc.)
- Expanded Lighting (Golden Hour, Blue Hour, Backlit, etc.)
- Mood controls
- Expanded Film Looks (70mm, Vintage Film, etc.)

**THESE DO NOT EXIST IN RUNWAY VEO-3 API!**

---

## 🔍 **EVIDENCE**

### **Runway API Function (`server/ai-gateway.mjs` line 766):**
```javascript
async function generateRunwayVideo({
  promptText,      // ✅ Real
  promptImage,     // ✅ Real  
  model,           // ✅ Real
  duration,        // ✅ Real (fixed 8s)
  ratio,           // ✅ Real (aspect ratio)
  watermark,       // ✅ Real
  seed,            // ✅ Real
}) {
  const payload = {
    promptText: promptText.trim(),
    model,
    duration: normalizedDuration,
    ratio,
    watermark,
  }
  // ONLY 5 parameters in payload!
  // NO camera, mood, weather, time of day, etc!
}
```

### **Actual API Call:**
```javascript
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RUNWAY_API_KEY}`,
    'Content-Type': 'application/json',
    'X-Runway-Version': '2024-11-06',
  },
  body: JSON.stringify(payload), // Only has 5-6 fields!
});
```

### **Test Result:**
```
Badu said: "time‑of‑day parameter is available in Runway Veo‑3 under 
its *advanced > timeOfDay* controls (Dawn, Morning, Noon...)"

This is FALSE! ❌
```

**Hallucinations detected:** 3  
**Source:** Badu learned about the fake UI controls

---

## 🎯 **ROOT CAUSE**

The UI was updated to show these controls for Runway, but:
1. ❌ Runway API doesn't accept these parameters
2. ❌ Backend doesn't send them to Runway
3. ❌ They don't affect the generated video
4. ✅ They're just cosmetic/misleading

**Result:** Users think they have control they don't have!

---

## ✅ **SOLUTION OPTIONS**

### **Option 1: Remove Fake Runway Controls (RECOMMENDED)**

**Action:** Revert MenuVideo.tsx to show only REAL Runway parameters

**Runway Advanced Settings should ONLY have:**
- Seed (optional number input)

**That's it!** Veo-3 is prompt-driven.

**Benefit:**
- ✅ Honest UX
- ✅ No user confusion
- ✅ Badu won't hallucinate
- ✅ Clear expectations

---

### **Option 2: Label as "Prompt Helpers"**

**Action:** Keep the controls but add clear disclaimer

**Add banner at top of Runway Advanced Settings:**
```tsx
<div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
  <p className="text-xs text-yellow-200">
    ⚠️ <strong>Prompt Enhancement Helpers</strong>
    <br />
    Veo-3 is prompt-driven. These controls help enhance your prompt text, 
    but are NOT sent as API parameters. All creative control comes from your 
    written description.
  </p>
</div>
```

**Benefit:**
- ⚠️ Keeps helper functionality
- ⚠️ But requires disclaimer
- ⚠️ May still confuse some users

---

### **Option 3: Use for Prompt Enhancement Only**

**Action:** Have these controls inject text into the prompt

**Example:**
If user selects:
- Time of Day: "Golden Hour"
- Weather: "Foggy"
- Mood: "Mysterious"

Then enhance prompt:
```
Original: "Person walking in forest"
Enhanced: "Person walking in foggy forest during golden hour, mysterious atmosphere..."
```

**Benefit:**
- ✅ Controls actually do something
- ✅ Honest about how they work
- ⚠️ Requires implementation work

---

## 🎯 **MY RECOMMENDATION**

**Remove the fake Runway controls (Option 1).**

**Why:**
1. **Honest UX** - Users aren't misled
2. **Badu accuracy** - Won't hallucinate about them
3. **Simple** - Veo-3 is actually simpler than Luma
4. **Clear** - Focus on writing great prompts

**Runway Veo-3 should show:**
```
Provider: Runway (Veo-3)

Core Settings:
- Duration: 8s (fixed)
- Aspect Ratio: 16:9, 9:16, 1:1
- Watermark: Yes/No

Advanced:
- Seed: (optional number)

Tip: ✨ Veo-3 is prompt-driven! 
Write detailed descriptions for best results.
All creative control comes from your text prompt.
```

**Luma Ray-2 keeps all 19 parameters** (those are real!).

---

## 📋 **IMMEDIATE ACTION REQUIRED**

**Either:**
1. Revert MenuVideo.tsx Runway section to original (simple)
2. Add disclaimer that these are "prompt helpers" not API params
3. Update Badu's system prompt to clarify these are UI helpers only

**Current Risk:**
- ❌ Users confused about what works
- ❌ Badu hallucinating about fake parameters
- ❌ Misleading product experience

---

**Should I revert the Runway UI to show only the 4 real parameters?**
