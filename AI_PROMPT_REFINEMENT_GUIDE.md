# AI-Powered Video Prompt Refinement - Quick Reference 🧠

## Overview

When your video prompts exceed 990 characters, the system automatically uses **GPT-4o** to intelligently compress them while preserving all critical details.

---

## How It Works

### Prompt Length Categories

| Length | Behavior | Details |
|--------|----------|---------|
| **≤990 chars** | ✅ Pass through unchanged | No processing needed |
| **991-2000 chars** | 🧠 AI intelligent refinement | GPT-4o compresses to ≤990 chars |
| **>2000 chars** | ⚠️ Truncate then AI refine | Frontend truncates to 2000, then AI refines |

### Processing Pipeline

```
User Input (e.g., 1,234 chars)
         ↓
Frontend Validation (settings.ts)
├─ If ≤990: Pass through ✅
├─ If 991-2000: Log info message, pass to backend 📤
└─ If >2000: Truncate to 2000, warn user ⚠️
         ↓
Backend Processing (ai-gateway.mjs)
├─ Safety check: Truncate if >2000
├─ If >990: Call refineVideoPrompt()
│   ├─ GPT-4o intelligently compresses
│   ├─ Preserves key elements
│   ├─ Returns ≤990 chars
│   └─ Logs character savings
└─ If ≤990: Pass to API ✅
         ↓
Video Provider API (Runway/Luma)
└─ Receives optimized prompt ≤990 chars 🎬
```

---

## What Gets Preserved

The AI refinement preserves these critical elements:

✅ **Subject/Scene**
- Main subject description
- Scene environment
- Key objects and elements

✅ **Camera Work**
- Camera movements (pan, tilt, zoom, etc.)
- Camera angles (high, low, eye-level, etc.)
- Shot types (wide, medium, close-up)
- Transitions between shots

✅ **Visual Style**
- Artistic style (cinematic, realistic, animated, etc.)
- Film look (35mm, 16mm, digital, etc.)
- Color grading (warm, cool, teal-orange, etc.)

✅ **Lighting**
- Lighting style (natural, dramatic, soft, etc.)
- Time of day (golden hour, night, etc.)
- Light sources and effects

✅ **Motion & Mood**
- Motion characteristics (speed, intensity)
- Emotional tone (energetic, calm, tense, etc.)
- Atmosphere (mysterious, joyful, etc.)

✅ **Technical Details**
- Aspect ratio (16:9, 9:16, 1:1)
- Duration (8 seconds)
- Depth of field settings
- Any specific technical requirements

---

## What Gets Removed

❌ **Redundant Language**
- Filler words ("the", "a", "and", etc. where unnecessary)
- Redundant adjectives ("very", "extremely", etc.)
- Verbose descriptions that can be shortened

❌ **Excessive Detail**
- Over-explanation of obvious elements
- Repetitive descriptions
- Unnecessary context

---

## Example Refinement

### Before (1,234 characters):
```
Create a cinematic video showcasing a luxury sports car driving through 
a neon-lit cyberpunk cityscape at night. The camera should start with an 
extreme wide shot from a high vantage point, capturing the sprawling 
megalopolis with its towering skyscrapers adorned with holographic 
advertisements and vibrant purple and blue lighting. As the car—a sleek, 
matte black hypercar with glowing red underglow—enters the frame from the 
left, execute a smooth orbital tracking shot that follows the vehicle as 
it weaves through the rain-slicked streets. The cinematography should 
emulate a 35mm film look with high contrast, rich blacks, and a subtle 
teal and orange color grade. Emphasize the motion blur of passing lights 
and the reflections on the wet asphalt. The mood should be tense and 
mysterious, with dramatic rim lighting highlighting the car's aerodynamic 
curves. Include atmospheric elements like light rain, steam rising from 
street vents, and occasional lens flares from the neon signs. The camera 
movement should be dynamic but controlled, maintaining focus on the car 
while showcasing the environment's depth and scale. Technical 
specifications: aspect ratio 16:9, duration 8 seconds, cinematic motion 
speed with moderate intensity, depth of field set to shallow to create 
background bokeh, and a moody, atmospheric lighting style consistent with 
blade runner aesthetics.
```

### After AI Refinement (967 characters):
```
Cinematic video: luxury matte black hypercar with red underglow driving 
through rain-slicked neon-lit cyberpunk cityscape at night. Camera: high 
vantage extreme wide establishing shot, transitioning to smooth orbital 
tracking following vehicle through streets. 35mm film look, high contrast, 
rich blacks, teal-orange grade. Emphasize motion blur, wet asphalt 
reflections, dramatic rim lighting on car's curves. Atmospheric: light 
rain, street steam vents, lens flares from holographic ads, purple-blue 
lighting, towering skyscrapers. Mood: tense, mysterious. Movement: dynamic 
yet controlled, showcasing depth while maintaining car focus. Shallow depth 
of field, background bokeh. Blade Runner aesthetics. 16:9 aspect, 8s 
duration, moderate motion intensity.
```

**Saved:** 267 characters (21.6% compression)
**Preserved:** All key visual, technical, and creative elements

---

## Console Messages

### When AI Refinement Happens:

```bash
# Frontend (if prompt 991-2000 chars)
ℹ️ Video prompt is 1234 chars. AI will intelligently compress to ≤990 while preserving meaning.

# Backend
[Prompt Refiner] Refining 1234 chars → 990 chars for runway
[Prompt Refiner] ✓ Success: 1234 → 967 chars (saved 267)
[Runway] Generating video: { 
  promptLength: 967, 
  wasTruncated: true 
}
```

### When Prompt Is Too Long (>2000):

```bash
# Frontend
⚠️ Video prompt truncated: 3500 → 2000 chars. Prompts >990 chars will be AI-refined on backend.

# Backend
[Runway] Prompt too long (2000 chars), truncating to 2000 before AI refinement
[Prompt Refiner] Refining 2000 chars → 990 chars for runway
[Prompt Refiner] ✓ Success: 2000 → 985 chars (saved 1015)
```

---

## Fallback Behavior

If the AI refinement fails or OpenAI is unavailable:

```bash
[Prompt Refiner] OpenAI not available, falling back to truncation
[Runway] Generating video: { promptLength: 990, wasTruncated: true }
```

The system automatically falls back to simple truncation to ensure video generation continues.

---

## Best Practices

### ✅ Do:
- Write detailed, descriptive prompts for best results
- Include all important visual and technical elements
- Let the AI handle compression—focus on describing your vision
- Check console logs to see how your prompt was refined

### ❌ Don't:
- Worry about prompt length (up to 2000 chars is fine)
- Manually truncate or compress your prompts
- Remove important details to fit arbitrary limits
- Use excessive filler words or redundancy

---

## Technical Details

### AI Model Used:
- **Model:** GPT-4o
- **Temperature:** 0.3 (consistent refinement)
- **Max Tokens:** 500
- **System Role:** Expert prompt refiner

### Processing Time:
- **Normal prompts (≤990):** Instant (no AI call)
- **Long prompts (991-2000):** ~1-3 seconds (AI refinement)
- **Fallback (if AI fails):** Instant (truncation)

### Cost Impact:
- **Input:** ~500-1000 tokens per refinement
- **Output:** ~250 tokens per refinement
- **Frequency:** Only when prompts exceed 990 characters
- **Provider:** OpenAI GPT-4o (cost-effective for this task)

---

## Troubleshooting

### Prompt still too long after refinement?
The AI tries to compress to ≤990, but if it can't, it will truncate the result. Check logs for details.

### Key details missing from refined prompt?
Report this as a bug! The AI should preserve all critical elements. Include original and refined prompts in your report.

### AI refinement taking too long?
Normal processing time is 1-3 seconds. If longer, check OpenAI API status or network connection.

### Video doesn't match original prompt?
Compare refined prompt in logs to original. If AI over-compressed, consider making original prompt more concise.

---

## Summary

🎯 **Goal:** Preserve your creative vision while meeting API limits
🧠 **Method:** Intelligent AI compression, not blind truncation
✅ **Result:** Better video generation with no API errors
🔄 **Fallback:** Graceful degradation to simple truncation if needed
📊 **Transparency:** Full logging of all prompt transformations
