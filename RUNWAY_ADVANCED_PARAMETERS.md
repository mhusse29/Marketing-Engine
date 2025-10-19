# 🎬 Runway Gen-3 Advanced Parameters Analysis

## Current Implementation vs Full Potential

### ✅ Parameters We Currently Have:
1. **model** - gen3a_turbo or gen3a
2. **promptText** - Video description
3. **duration** - 5 or 10 seconds
4. **ratio** - Aspect ratios (16:9, 9:16, 1:1)
5. **watermark** - true/false
6. **seed** - For reproducibility

### 🚀 MISSING Parameters We Should Add:

## 1. **promptImage** (Image-to-Video) 🖼️
**What it does**: Use an image as the starting frame for video generation
**Why it's powerful**: 
- Perfect product consistency - start with your product photo
- Character consistency - use the same face/person
- Scene matching - extend existing images into videos
**Implementation**:
```javascript
promptImage: base64ImageString // Optional base64-encoded image
```

## 2. **Camera Movement Controls** 📹
Based on Gen-4 documentation, we should add structured camera controls:

### Camera Movement Types:
- **Static** - Camera remains fixed
- **Pan** - Horizontal camera movement (left/right)
- **Tilt** - Vertical camera movement (up/down)
- **Zoom In/Out** - Camera moves closer/further
- **Dolly** - Camera moves forward/backward
- **Orbit** - Camera circles around subject
- **Crane** - Vertical elevation change
- **FPV (First Person View)** - Dynamic motion through scene

### Suggested Implementation:
```typescript
cameraMovement: 'static' | 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down' | 
                'zoom_in' | 'zoom_out' | 'dolly_forward' | 'dolly_back' | 
                'orbit_left' | 'orbit_right' | 'crane_up' | 'crane_down' | 'fpv'
```

## 3. **Style Parameters** 🎨
Runway responds well to style directives in prompts. We should add:

### Visual Style:
```typescript
visualStyle: 'photorealistic' | 'cinematic' | 'animated' | 'artistic' | 
             'vintage' | 'modern' | 'noir' | 'vibrant' | 'muted'
```

### Lighting:
```typescript
lighting: 'natural' | 'golden_hour' | 'blue_hour' | 'studio' | 
          'dramatic' | 'soft' | 'hard' | 'neon' | 'backlit'
```

### Mood:
```typescript
mood: 'energetic' | 'calm' | 'mysterious' | 'joyful' | 'serious' | 
      'dreamlike' | 'tense' | 'romantic' | 'epic'
```

## 4. **Motion Parameters** 🏃
Control the speed and type of motion:

### Motion Speed:
```typescript
motionSpeed: 'slow_motion' | 'normal' | 'fast_motion' | 'time_lapse'
```

### Motion Amount:
```typescript
motionAmount: 'minimal' | 'moderate' | 'high' | 'extreme'
```

## 5. **Advanced Prompt Structure** 📝
We should help users structure prompts better:

### Prompt Template:
```
[CAMERA]: [SCENE]. [SUBJECT ACTION]. [STYLE/MOOD]. [DETAILS].
```

### Example Implementation:
```typescript
// Build structured prompt from parameters
const buildStructuredPrompt = (params) => {
  const parts = [];
  
  if (params.cameraMovement) {
    parts.push(`${params.cameraMovement} shot`);
  }
  
  parts.push(params.basePrompt);
  
  if (params.visualStyle) {
    parts.push(`${params.visualStyle} style`);
  }
  
  if (params.lighting) {
    parts.push(`${params.lighting} lighting`);
  }
  
  if (params.mood) {
    parts.push(`${params.mood} mood`);
  }
  
  return parts.join('. ');
};
```

## 6. **Quality Enhancement Parameters** ✨

### Prompt Upsampling:
```typescript
enhancePrompt: boolean // Use AI to enhance/expand the prompt
```

### Detail Level:
```typescript
detailLevel: 'low' | 'medium' | 'high' | 'ultra'
```

## 7. **Subject Control** 👤

### Subject Focus:
```typescript
subjectFocus: 'wide' | 'medium' | 'close_up' | 'extreme_close_up'
```

### Subject Count:
```typescript
subjectCount: 'single' | 'multiple' | 'crowd'
```

## 8. **Environment Parameters** 🌍

### Setting:
```typescript
setting: 'indoor' | 'outdoor' | 'studio' | 'abstract' | 'fantasy'
```

### Time of Day:
```typescript
timeOfDay: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'sunset' | 
           'blue_hour' | 'night' | 'golden_hour'
```

### Weather (if outdoor):
```typescript
weather: 'clear' | 'cloudy' | 'rainy' | 'foggy' | 'snowy' | 'stormy'
```

## 9. **Professional Film Parameters** 🎥

### Film Look:
```typescript
filmLook: '35mm' | '16mm' | '70mm' | 'digital' | 'vintage_film'
```

### Depth of Field:
```typescript
depthOfField: 'shallow' | 'medium' | 'deep'
```

### Color Grading:
```typescript
colorGrading: 'natural' | 'warm' | 'cool' | 'desaturated' | 
              'high_contrast' | 'low_contrast' | 'cinematic'
```

## 10. **Experimental Parameters** 🔬

### Prompt Strength (if supported):
```typescript
guidance_scale: number // 1.0 to 20.0 - How closely to follow prompt
```

### Inference Steps (if supported):
```typescript
steps: number // 20 to 50 - Quality vs speed tradeoff
```

## Implementation Priority:

### 🥇 HIGH Priority (Add First):
1. **promptImage** - Image-to-video capability
2. **cameraMovement** - Essential for professional videos
3. **visualStyle** - Major impact on output quality
4. **motionSpeed** - Control pacing

### 🥈 MEDIUM Priority:
5. **lighting** - Enhances mood
6. **mood** - Emotional tone
7. **subjectFocus** - Framing control
8. **enhancePrompt** - Better prompts

### 🥉 NICE to Have:
9. **filmLook** - Professional touch
10. **colorGrading** - Post-production feel
11. **weather** - Environmental detail
12. **depthOfField** - Cinematic quality

## Example Enhanced Video Request:

```javascript
{
  // Base parameters (existing)
  promptText: "A person walking through a busy city",
  model: "gen3a_turbo",
  duration: 10,
  ratio: "1280:768",
  
  // New parameters
  promptImage: base64String, // Start from product photo
  cameraMovement: "dolly_forward",
  visualStyle: "cinematic",
  lighting: "golden_hour",
  mood: "energetic",
  motionSpeed: "normal",
  subjectFocus: "medium",
  filmLook: "35mm",
  colorGrading: "warm"
}
```

This would generate: "Dolly forward shot. A person walking through a busy city. Cinematic style. Golden hour lighting. Energetic mood. 35mm film look with warm color grading."

## Benefits of These Parameters:

1. **Professional Quality**: Match Hollywood-style cinematography
2. **Brand Consistency**: Use promptImage for product videos
3. **Creative Control**: Fine-tune every aspect
4. **User-Friendly**: Dropdowns instead of complex prompts
5. **Reproducibility**: More parameters = more consistent results
6. **Marketing Ready**: Perfect for ads, social media, demos

## Testing Strategy:

1. Start with promptImage (biggest impact)
2. Add camera movements (most requested)
3. Layer in style controls
4. Test combinations for best results
5. Create presets for common use cases
