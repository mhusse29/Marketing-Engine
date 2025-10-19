# Luma Dream Machine Integration

## Overview

This document describes the complete Luma AI Dream Machine integration for video generation in the Marketing Engine.

## Features

✅ **Full Luma Dream Machine API Integration**
- Dream Machine v1 and v1.5 models
- Text-to-video generation
- Image-to-video generation
- Seamless loop support
- Keyframe control (start & end frames)

✅ **Multi-Provider Video System**
- Provider selection (Runway / Luma)
- Provider-specific UI and parameters
- Unified video generation pipeline
- Consistent polling and status tracking

✅ **Production-Ready Implementation**
- Complete error handling
- Comprehensive logging
- Type-safe throughout
- Gateway abstraction layer
- Async polling with exponential backoff

## Architecture

### Components

1. **Backend (Gateway)**
   - `server/ai-gateway.mjs` - Main gateway with Luma functions
   - Endpoints:
     - `POST /v1/videos/generate` - Start generation (supports `provider` param)
     - `GET /v1/videos/tasks/:taskId` - Poll task status

2. **Frontend (React + TypeScript)**
   - `src/types/index.ts` - Type definitions for Luma models
   - `src/store/settings.ts` - Luma settings state management
   - `src/lib/videoGeneration.ts` - Video generation helper
   - `src/components/MenuVideo.tsx` - UI with provider selection
   - `src/components/Cards/VideoCard.tsx` - Video display with provider badges

### API Flow

```
User → MenuVideo UI → Settings Store → Video Generation Helper → Gateway → Luma API
                                                                      ↓
User ← Video Card ← Store Update ← Poll Status ← Gateway ← Luma API
```

## Setup

### 1. Environment Configuration

Add your Luma API key to `server/.env`:

```bash
# Luma AI Dream Machine
LUMA_API_KEY=luma_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. API Key Acquisition

1. Visit [Luma AI](https://lumalabs.ai/)
2. Sign up for an account
3. Navigate to API settings
4. Generate an API key
5. Copy the key to your `.env` file

### 3. Verify Integration

Check the health endpoint to confirm Luma is configured:

```bash
curl http://localhost:8787/health
```

Expected response should include:
```json
{
  "videoProviders": {
    "runway": true,
    "luma": true
  }
}
```

## Usage

### Provider Selection

In the Video panel, users can select between providers:
- **Runway** - Veo-3 model (8 seconds, high quality)
- **Luma** - Dream Machine (5 seconds, fast generation)

### Luma-Specific Parameters

#### Core Settings
- **Model**: `dream-machine-v1` | `dream-machine-v1.5` (default)
- **Aspect Ratio**: `9:16` | `1:1` | `16:9`
- **Duration**: Fixed at 5 seconds (Luma standard)
- **Loop**: Enable seamless video looping

#### Advanced Options (shared with Runway)
- Camera Movement: Pan, tilt, zoom, orbit, etc.
- Visual Style: Cinematic, photorealistic, modern, etc.
- Lighting: Golden hour, studio, natural, dramatic, etc.
- Motion Speed: Slow motion, normal, fast
- Film Look: 35mm, 70mm, digital, vintage
- Color Grading: Natural, warm, cool, cinematic

#### Keyframe Control (Luma Only)
- **frame0**: Starting frame (image URL or generation ID)
- **frame1**: Ending frame (image URL or generation ID)

### Example API Request

```javascript
const response = await fetch('http://localhost:8787/v1/videos/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'luma',
    promptText: 'A serene ocean sunset with gentle waves',
    model: 'dream-machine-v1.5',
    aspect: '16:9',
    loop: true,
  }),
});

const { taskId } = await response.json();
```

### Polling for Results

```javascript
const pollTask = async (taskId) => {
  const response = await fetch(
    `http://localhost:8787/v1/videos/tasks/${taskId}?provider=luma`
  );
  const result = await response.json();
  
  if (result.status === 'SUCCEEDED') {
    return result.videoUrl;
  }
  
  // Continue polling...
};
```

## API Reference

### Luma Generation Endpoint

**Request:**
```typescript
POST /v1/videos/generate
{
  provider: 'luma',
  promptText: string,          // Video description (required)
  model: 'dream-machine-v1.5', // Model selection
  aspect: '16:9',              // Aspect ratio
  loop: boolean,               // Enable seamless loop
  promptImage?: string,        // Base64 image for image-to-video
  keyframes?: {
    frame0?: { type: 'image', url: string },
    frame1?: { type: 'image', url: string }
  }
}
```

**Response:**
```typescript
{
  taskId: string,
  status: 'pending' | 'dreaming' | 'completed' | 'failed',
  provider: 'luma',
  message: string
}
```

### Luma Poll Endpoint

**Request:**
```
GET /v1/videos/tasks/:taskId?provider=luma
```

**Response:**
```typescript
{
  taskId: string,
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED',
  progress: number,           // 0-100
  provider: 'luma',
  videoUrl?: string,          // Available when status=SUCCEEDED
  createdAt?: string,
  error?: string              // Available when status=FAILED
}
```

## Type Definitions

```typescript
// Provider types
type VideoProvider = 'runway' | 'luma';
type LumaModel = 'dream-machine-v1' | 'dream-machine-v1.5';

// Luma-specific parameters
interface VideoQuickProps {
  provider: VideoProvider;
  model: VideoModel;
  // ... other params
  lumaLoop?: boolean;
  lumaKeyframes?: {
    frame0?: { type: 'image' | 'generation'; url?: string };
    frame1?: { type: 'image' | 'generation'; url?: string };
  };
}
```

## Error Handling

The integration includes comprehensive error handling:

### API Errors
- `luma_not_configured` - API key missing
- `luma_model_not_supported` - Invalid model selection
- `luma_model_forbidden` - Tier access issue
- `generation_failed` - Generation error

### Client-Side Handling
```typescript
try {
  const video = await generateVideo(props);
} catch (error) {
  if (error.message.includes('luma_not_configured')) {
    // Show API key setup instructions
  }
  // Handle other errors...
}
```

## Rate Limits & Quotas

Refer to Luma's official documentation for current rate limits:
- Rate limits apply per API key
- Quota based on subscription tier
- Recommended: Implement exponential backoff (already included)

## Testing

### Manual Testing

1. **Start the gateway:**
   ```bash
   cd server
   node ai-gateway.mjs
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Test workflow:**
   - Open video panel
   - Select "Luma" provider
   - Enter a video prompt
   - Enable "Loop" option (Luma-specific)
   - Validate settings
   - Generate video
   - Verify badge shows "LUMA-DREAM-V1.5"

### Automated Testing

Run the test script (create if needed):
```bash
node test-luma-api.mjs
```

## Performance

**Expected Generation Times:**
- Luma Dream Machine v1.5: ~30-60 seconds
- Luma Dream Machine v1: ~40-80 seconds

**Polling Strategy:**
- Initial delay: 2 seconds
- Exponential backoff: 2s → 4s → 8s → 10s (max)
- Max attempts: 150 (5 minutes timeout)

## Comparison: Runway vs Luma

| Feature | Runway (Veo-3) | Luma (Dream Machine) |
|---------|----------------|----------------------|
| Duration | 8 seconds | 5 seconds |
| Quality | Highest | High |
| Speed | ~2-3 minutes | ~30-60 seconds |
| Loop Support | ❌ | ✅ |
| Keyframes | ❌ | ✅ |
| Models | veo3 | v1, v1.5 |
| Best For | Premium content | Fast iteration |

## Best Practices

1. **Choose the right provider:**
   - Runway: High-quality hero videos, final output
   - Luma: Quick previews, looping content, social media

2. **Optimize prompts:**
   - Be specific and descriptive
   - Include camera movements in text
   - Mention lighting and mood

3. **Use advanced parameters:**
   - Camera movement for dynamic shots
   - Visual style for consistent aesthetic
   - Loop for social media content

4. **Monitor generation:**
   - Track progress via polling
   - Handle failures gracefully
   - Provide user feedback

## Troubleshooting

### Issue: "luma_not_configured"
**Solution:** Ensure `LUMA_API_KEY` is set in `server/.env`

### Issue: Video generation timeout
**Solution:** Check Luma API status, verify quota limits

### Issue: Provider not showing in UI
**Solution:** Verify types are imported correctly in `MenuVideo.tsx`

### Issue: Loop not working
**Solution:** Ensure `loop: true` is passed and provider is 'luma'

## Future Enhancements

Potential additions:
- [ ] Luma Imagine 3D integration
- [ ] Extended duration support (when available)
- [ ] Batch generation
- [ ] Custom keyframe UI uploader
- [ ] Generation history and replay
- [ ] Cost estimation per generation

## Support

For issues related to:
- **Luma API**: Visit [Luma Labs Documentation](https://docs.lumalabs.ai/)
- **Integration bugs**: Check console logs in browser and server
- **Feature requests**: Submit via project repository

---

**Integration Version:** 1.0.0  
**Last Updated:** December 2024  
**Status:** ✅ Production Ready

