# Implementation Guide - LLM Enhancements

This guide provides step-by-step instructions and code snippets to implement the missing LLM features identified in the audit.

---

## Quick Summary

**Missing Features to Implement**:
1. ❌ Video Prompt Enhancement (Critical)
2. ⚠️ Pictures Prompt Enhancement (High Priority - currently template-based)
3. 📎 Attachment Support for Pictures/Video (Medium Priority)

---

## Feature 1: Video Prompt Enhancement

### Step 1: Add Gateway Endpoint

**File**: `server/ai-gateway.mjs`  
**Location**: After line 1789 (after `/v1/tools/brief/refine`)

```javascript
// Video Prompt Enhancement
app.post('/v1/tools/video/enhance', async (req, res) => {
  const { prompt, provider = 'runway', settings = {}, brief } = req.body;
  const trimmedPrompt = typeof prompt === 'string' ? prompt.trim() : '';

  if (!trimmedPrompt) {
    return res.status(400).json({ error: 'prompt_required' });
  }

  if (!openai && !MOCK_OPENAI) {
    return res.status(503).json({ error: 'openai_not_configured' });
  }

  if (MOCK_OPENAI) {
    const mockEnhanced = `Enhanced video prompt (mock): ${trimmedPrompt} with cinematic lighting and smooth camera movement`;
    return res.json({ enhanced: mockEnhanced, model: 'mock-openai', mock: true });
  }

  const providerInfo = provider === 'luma' 
    ? {
        name: 'Luma Dream Machine (Ray-2)',
        capabilities: 'Fast generation, creative interpretation, seamless loops, text-to-video',
        strengths: 'Quick results, artistic style, perfect for social media content',
      }
    : {
        name: 'Runway (Veo-3)',
        capabilities: 'Cinema-quality output, advanced camera controls, photorealistic rendering',
        strengths: 'Highest quality, professional cinematography, detailed control',
      };

  const settingsContext = [];
  if (settings.aspect) settingsContext.push(`Aspect ratio: ${settings.aspect}`);
  if (settings.cameraMovement && settings.cameraMovement !== 'static') {
    settingsContext.push(`Camera movement: ${settings.cameraMovement}`);
  }
  if (settings.visualStyle) settingsContext.push(`Visual style: ${settings.visualStyle}`);
  if (settings.lightingStyle) settingsContext.push(`Lighting: ${settings.lightingStyle}`);
  if (settings.mood) settingsContext.push(`Mood: ${settings.mood}`);
  if (settings.colorGrading) settingsContext.push(`Color grading: ${settings.colorGrading}`);

  const systemPrompt = [
    `You are a professional cinematographer and video director with expertise in AI video generation.`,
    `You're helping create prompts for ${providerInfo.name}.`,
    '',
    `Provider Capabilities:`,
    `- ${providerInfo.capabilities}`,
    `- ${providerInfo.strengths}`,
    '',
    `Your task:`,
    `1. Enhance the user's video idea into a detailed, professional prompt`,
    `2. Incorporate cinematography terminology (framing, movement, lighting)`,
    `3. Be specific about subject, action, setting, and atmosphere`,
    `4. Optimize for ${provider === 'luma' ? 'fast creative generation' : 'cinema-quality output'}`,
    `5. Keep prompts between 50-200 words`,
    `6. Use vivid, descriptive language`,
    `7. Consider the selected settings: ${settingsContext.join(', ') || 'none specified'}`,
    '',
    `Response format: Return ONLY the enhanced prompt text, no explanations.`,
  ].join('\n');

  const userSections = [
    `--- USER'S VIDEO IDEA ---`,
    trimmedPrompt,
  ];

  if (brief && brief.trim()) {
    userSections.push('');
    userSections.push(`--- CAMPAIGN CONTEXT ---`);
    userSections.push(brief.trim());
  }

  if (settingsContext.length > 0) {
    userSections.push('');
    userSections.push(`--- SELECTED SETTINGS ---`);
    userSections.push(settingsContext.join('\n'));
  }

  userSections.push('');
  userSections.push(`--- TASK ---`);
  userSections.push(
    `Transform the video idea above into a professional, detailed prompt that will generate stunning ${provider === 'luma' ? 'creative' : 'cinematic'} video content. ` +
    `Focus on visual details, movement, composition, and atmosphere.`
  );

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userSections.join('\n') },
  ];

  const callModel = async (modelId) => {
    const params = { model: modelId, messages };

    if (modelId.startsWith('gpt-5')) {
      params.max_completion_tokens = 500;
    } else {
      params.max_tokens = 500;
      params.temperature = 0.65;
    }

    const response = await openai.chat.completions.create(params);
    const content = response.choices?.[0]?.message?.content?.trim() || '';
    return { content };
  };

  let enhanced = '';
  let usedModel = OPENAI_PRIMARY_MODEL;

  try {
    const primary = await callModel(OPENAI_PRIMARY_MODEL);
    enhanced = primary.content;
  } catch (error) {
    console.error('[video/enhance] primary model failed', error);
  }

  if (!enhanced && OPENAI_FALLBACK_MODEL && OPENAI_FALLBACK_MODEL !== OPENAI_PRIMARY_MODEL) {
    try {
      const fallback = await callModel(OPENAI_FALLBACK_MODEL);
      enhanced = fallback.content;
      usedModel = OPENAI_FALLBACK_MODEL;
    } catch (error) {
      console.error('[video/enhance] fallback model failed', error);
    }
  }

  if (!enhanced) {
    return res.status(500).json({ error: 'enhance_failed' });
  }

  res.json({ enhanced, model: usedModel, provider });
});
```

### Step 2: Create Video Prompt Builder Library

**File**: `src/lib/videoPromptBuilder.ts` (new file)

```typescript
import { getApiBase } from './api';
import type { VideoQuickProps, VideoProvider } from '../types';

export async function enhanceVideoPrompt(
  userPrompt: string,
  provider: VideoProvider,
  settings: Partial<VideoQuickProps>,
  brief?: string
): Promise<{ enhanced: string; model: string }> {
  if (!userPrompt || userPrompt.trim().length < 10) {
    throw new Error('Prompt must be at least 10 characters');
  }

  const response = await fetch(`${getApiBase()}/v1/tools/video/enhance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: userPrompt,
      provider,
      settings,
      brief,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'unknown_error' }));
    throw new Error(error.error || `Enhancement failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    enhanced: data.enhanced,
    model: data.model || 'gpt-5',
  };
}
```

### Step 3: Update Video Panel UI

**File**: `src/components/MenuVideo.tsx`  
**Location**: Add to imports

```typescript
import { Wand2 } from 'lucide-react'; // Add to existing imports
import { enhanceVideoPrompt } from '../lib/videoPromptBuilder';
```

**Add state variables** (after existing state declarations around line 131):

```typescript
const [isEnhancing, setIsEnhancing] = useState(false);
const [enhanceError, setEnhanceError] = useState('');
```

**Add enhance handler** (after existing handlers around line 209):

```typescript
const handleEnhancePrompt = useCallback(async () => {
  if (isEnhancing || !qp.promptText || qp.promptText.trim().length < 10) return;
  
  setIsEnhancing(true);
  setEnhanceError('');

  try {
    const { enhanced } = await enhanceVideoPrompt(
      qp.promptText,
      qp.provider as VideoProvider,
      {
        aspect: qp.aspect,
        cameraMovement: qp.cameraMovement,
        visualStyle: qp.visualStyle,
        lightingStyle: qp.lightingStyle,
        mood: qp.mood,
        colorGrading: qp.colorGrading,
      },
      settings.quickProps.content.brief // Include campaign brief for context
    );
    
    setVideo({ promptText: enhanced });
  } catch (error) {
    console.error('Failed to enhance video prompt:', error);
    setEnhanceError(error instanceof Error ? error.message : 'Failed to enhance prompt');
  } finally {
    setIsEnhancing(false);
  }
}, [isEnhancing, qp, settings.quickProps.content.brief, setVideo]);
```

**Update textarea section** (around line 330, inside the textarea div):

```typescript
<div className="relative">
  <textarea
    ref={textareaRef}
    value={qp.promptText}
    onChange={handlePromptChange}
    placeholder="Describe the video you want to create..."
    className={cn(
      'min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 pr-24 text-sm text-white/90',
      'placeholder:text-white/40 transition-all',
      'focus:outline-none focus:ring-2 focus:ring-blue-500/35'
    )}
  />
  {/* Existing image preview button */}
  {qp.promptImage && (
    <div className="absolute top-3 right-12 flex h-9 w-9 items-center justify-center">
      {/* ... existing code ... */}
    </div>
  )}
  
  {/* NEW: Enhance button */}
  <button
    type="button"
    onClick={handleEnhancePrompt}
    disabled={isEnhancing || !qp.promptText || qp.promptText.trim().length < 10}
    className={cn(
      'absolute top-3 right-12 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/35',
      (isEnhancing || !qp.promptText || qp.promptText.trim().length < 10) && 'cursor-not-allowed opacity-50'
    )}
    aria-label="Enhance prompt with AI"
    title="Enhance with AI"
  >
    {isEnhancing ? (
      <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    ) : (
      <Wand2 className="h-4 w-4" />
    )}
  </button>
  
  {/* Existing image upload button - adjust right position */}
  <button
    type="button"
    onClick={handleImageSelect}
    className={cn(
      'absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/35'
    )}
    aria-label="Add reference image"
  >
    <ImageIcon className="h-4 w-4" />
  </button>
  
  <input
    ref={fileInputRef}
    type="file"
    accept="image/jpeg,image/png,image/webp"
    className="hidden"
    onChange={handleImageFile}
  />
</div>
{enhanceError && <p className="text-xs text-rose-300">{enhanceError}</p>}
<p className={cn('text-xs', attachmentError ? 'text-amber-300' : 'text-white/45')}>
  {attachmentError || 'Optional: Add a reference image for style or composition • Click wand icon to enhance with AI'}
</p>
```

---

## Feature 2: Pictures Prompt Enhancement

### Step 1: Add Gateway Endpoint

**File**: `server/ai-gateway.mjs`  
**Location**: After the video enhance endpoint

```javascript
// Pictures Prompt Enhancement
app.post('/v1/tools/pictures/suggest', async (req, res) => {
  const { settings = {}, brief, provider = 'openai' } = req.body;

  if (!openai && !MOCK_OPENAI) {
    return res.status(503).json({ error: 'openai_not_configured' });
  }

  if (MOCK_OPENAI) {
    const mockSuggestion = `Professional product photography with ${settings.style || 'modern'} style, ${settings.lighting || 'natural'} lighting`;
    return res.json({ suggestion: mockSuggestion, model: 'mock-openai', mock: true });
  }

  const providerInfo = {
    openai: { name: 'DALL·E 3', strengths: 'Fast, vivid colors, great for illustrations' },
    flux: { name: 'FLUX Pro', strengths: 'Photorealistic, human faces, professional photography' },
    stability: { name: 'Stability AI SD 3.5', strengths: 'Fine control via CFG, creative freedom' },
    ideogram: { name: 'Ideogram', strengths: 'Typography, text in images, brand assets' },
  }[provider] || { name: provider, strengths: 'General purpose image generation' };

  const settingsContext = [];
  if (settings.style) settingsContext.push(`Style: ${settings.style}`);
  if (settings.aspect) settingsContext.push(`Aspect ratio: ${settings.aspect}`);
  if (settings.lighting) settingsContext.push(`Lighting: ${settings.lighting}`);
  if (settings.composition) settingsContext.push(`Composition: ${settings.composition}`);
  if (settings.camera) settingsContext.push(`Camera angle: ${settings.camera}`);
  if (settings.mood) settingsContext.push(`Mood: ${settings.mood}`);
  if (settings.backdrop) settingsContext.push(`Backdrop: ${settings.backdrop}`);

  const systemPrompt = [
    `You are a professional art director and image prompt engineer.`,
    `You're creating prompts for ${providerInfo.name}.`,
    '',
    `Provider Strengths: ${providerInfo.strengths}`,
    '',
    `Your task:`,
    `1. Create a detailed, descriptive image prompt optimized for ${provider}`,
    `2. Focus on visual composition, lighting, colors, and mood`,
    `3. Be specific about the subject, setting, and atmosphere`,
    `4. Use professional photography/art terminology`,
    `5. Keep prompts between 40-150 words`,
    `6. Make it vivid and evocative`,
    `7. Consider the selected settings: ${settingsContext.join(', ') || 'none specified'}`,
    '',
    `Response format: Return ONLY the prompt text, no explanations.`,
  ].join('\n');

  const userSections = [];

  if (brief && brief.trim()) {
    userSections.push(`--- CAMPAIGN CONTEXT ---`);
    userSections.push(brief.trim());
    userSections.push('');
  }

  if (settingsContext.length > 0) {
    userSections.push(`--- SELECTED SETTINGS ---`);
    userSections.push(settingsContext.join('\n'));
    userSections.push('');
  }

  userSections.push(`--- TASK ---`);
  userSections.push(
    `Create a compelling image prompt that will generate stunning visual content for this marketing campaign. ` +
    `Focus on composition, lighting, mood, and brand alignment.`
  );

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userSections.join('\n') },
  ];

  const callModel = async (modelId) => {
    const params = { model: modelId, messages };

    if (modelId.startsWith('gpt-5')) {
      params.max_completion_tokens = 400;
    } else {
      params.max_tokens = 400;
      params.temperature = 0.75;
    }

    const response = await openai.chat.completions.create(params);
    const content = response.choices?.[0]?.message?.content?.trim() || '';
    return { content };
  };

  let suggestion = '';
  let usedModel = OPENAI_PRIMARY_MODEL;

  try {
    const primary = await callModel(OPENAI_PRIMARY_MODEL);
    suggestion = primary.content;
  } catch (error) {
    console.error('[pictures/suggest] primary model failed', error);
  }

  if (!suggestion && OPENAI_FALLBACK_MODEL && OPENAI_FALLBACK_MODEL !== OPENAI_PRIMARY_MODEL) {
    try {
      const fallback = await callModel(OPENAI_FALLBACK_MODEL);
      suggestion = fallback.content;
      usedModel = OPENAI_FALLBACK_MODEL;
    } catch (error) {
      console.error('[pictures/suggest] fallback model failed', error);
    }
  }

  if (!suggestion) {
    // Fallback to client-side template if LLM fails
    return res.status(500).json({ error: 'suggest_failed' });
  }

  res.json({ suggestion, model: usedModel, provider });
});
```

### Step 2: Update Pictures Prompt Store

**File**: `src/store/picturesPrompts.ts`  
**Add new function**:

```typescript
import { getApiBase } from '../lib/api';

// Keep existing craftPicturesPrompt as fallback
export { craftPicturesPrompt };

// New LLM-powered enhancement
export async function enhancePicturesPrompt(
  quickProps: PicturesQuickProps,
  brief?: string
): Promise<{ suggestion: string; model: string }> {
  const response = await fetch(`${getApiBase()}/v1/tools/pictures/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      settings: {
        style: quickProps.style,
        aspect: quickProps.aspect,
        lighting: quickProps.lighting,
        composition: quickProps.composition,
        camera: quickProps.camera,
        mood: quickProps.mood,
        backdrop: quickProps.backdrop,
      },
      brief,
      provider: quickProps.imageProvider,
    }),
  });

  if (!response.ok) {
    // Fallback to client-side template
    throw new Error('LLM enhancement failed');
  }

  const data = await response.json();
  return {
    suggestion: data.suggestion,
    model: data.model || 'gpt-5',
  };
}
```

### Step 3: Update Pictures Panel UI

**File**: `src/components/AppMenuBar.tsx`  
**Update import** (around line 42):

```typescript
import { 
  craftPicturesPrompt,
  enhancePicturesPrompt, // Add this
  MAX_PICTURE_PROMPT_LENGTH,
} from '../store/picturesPrompts';
```

**Update handleSuggestPrompt** (around line 977):

```typescript
const handleSuggestPrompt = useCallback(async () => {
  if (isSuggesting) return;
  setIsSuggesting(true);

  try {
    // Try LLM-powered enhancement first
    const { suggestion } = await enhancePicturesPrompt(
      qp,
      settings.quickProps.content.brief // Include campaign brief
    );
    setPictures({ promptText: suggestion }, { resetValidation: false });
  } catch (error) {
    console.error('LLM enhancement failed, using template fallback:', error);
    // Fallback to template-based suggestion
    const suggested = craftPicturesPrompt(qp);
    setPictures({ promptText: suggested }, { resetValidation: false });
  } finally {
    setIsSuggesting(false);
  }
}, [isSuggesting, qp, settings.quickProps.content.brief, setPictures]);
```

---

## Testing the Implementations

### Test Video Enhancement

```bash
# In terminal
curl -X POST http://localhost:8787/v1/tools/video/enhance \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "product showcase",
    "provider": "runway",
    "settings": {
      "aspect": "9:16",
      "cameraMovement": "orbit_right",
      "visualStyle": "cinematic",
      "lightingStyle": "dramatic"
    },
    "brief": "Luxury smartwatch launch campaign"
  }'
```

### Test Pictures Enhancement

```bash
curl -X POST http://localhost:8787/v1/tools/pictures/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "flux",
    "settings": {
      "style": "Professional",
      "aspect": "16:9",
      "lighting": "Golden Hour",
      "mood": "Energetic"
    },
    "brief": "Tech startup launch campaign targeting millennials"
  }'
```

---

## Summary

After implementing these features:

✅ Video Panel will have AI-powered prompt enhancement  
✅ Pictures Panel will use LLM instead of templates  
✅ Consistent UX across all content creation panels  
✅ Better prompt quality leading to better generated content  
✅ Seamless integration with existing GPT-5 infrastructure

**Total Implementation Time**: 6-8 hours  
**Difficulty**: Medium  
**Impact**: High - significantly improves user experience
