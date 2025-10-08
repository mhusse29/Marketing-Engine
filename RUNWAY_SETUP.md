# Runway API Setup Guide

## Environment Variables

Add your Runway API key to `/Users/mohamedhussein/Desktop/Marketing Engine/server/.env`:

```bash
# Runway ML API
RUNWAY_API_KEY=key_9d6123b7d5d991b73ec912d41495db414ddc1b9ccc248a180b69955124f6d75a7eae1c8fc492a143cc798d72bf006aafc26b3912139e79b5efccdc2e1d1da9bb
```

## Runway Gen-3 Alpha Models

### Available Models:
- **gen3a_turbo** - 7x faster, optimized for speed
- **gen3a** - Standard quality, balanced performance

### Supported Parameters:
- **promptText** (required) - Text description of desired video
- **promptImage** (optional) - Base64 image for image-to-video
- **model** - "gen3a_turbo" or "gen3a"
- **duration** - 5 or 10 seconds
- **ratio** - "1280:768" (16:9), "768:1280" (9:16), or "1024:1024" (1:1)
- **watermark** - true/false (default: true for free tier)
- **seed** - Integer for reproducible results

### API Flow:
1. POST /v1/image_to_video or /v1/text_to_video - Start generation
2. Returns task ID
3. Poll GET /v1/tasks/{id} until status = "SUCCEEDED"
4. Download video from returned URL

### Rate Limits:
- Free tier: 125 credits/month
- 5s video = 5 credits
- 10s video = 10 credits
- Turbo = same credits, faster generation

## Implementation Notes:
- Use polling with exponential backoff
- Cache task IDs for status checks
- Handle PENDING, RUNNING, SUCCEEDED, FAILED states
- Store video URLs in application state
- Videos expire after 24 hours (download immediately)

