# Analytics Dashboard - Verified Provider Configuration

**Last Updated:** Oct 18, 2025  
**Status:** ✅ Fully Synchronized with Codebase

---

## 🎯 **Actual Providers Implemented**

### **1. Content Generation (Text)**
- **Provider:** `openai`
- **Models:**
  - `gpt-5` (Primary - Content Panel)
  - `gpt-5-chat-latest` (BADU Assistant - Chat optimized)
  - `gpt-4o` (Fallback)
  - `gpt-4o-mini` (Cost-effective option)
- **Service Type:** `content`
- **Pricing:** Per 1M tokens (input/output)

---

### **2. Image Generation**

#### **OpenAI (DALL-E)**
- **Provider:** `openai`
- **Model:** `dall-e-3`
- **Service Type:** `images`
- **Quality Options:** `standard`, `hd`, `hd_large`
- **Pricing:** $0.040 - $0.120 per image

#### **FLUX**
- **Provider:** `flux`
- **Modes:** `standard`, `ultra`
- **Service Type:** `images`
- **Parameters:** guidance, steps, safety tolerance, prompt upsampling, seed
- **Pricing:** $0.045 (standard), $0.060 (ultra) per image

#### **Stability AI**
- **Provider:** `stability`
- **Model:** `large`
- **Service Type:** `images`
- **Parameters:** CFG scale, style preset, seed
- **Pricing:** $0.035 per image

#### **Ideogram**
- **Provider:** `ideogram`
- **Models:** `v2`
- **Service Type:** `images`
- **Quality Options:** `base`, `magic`
- **Parameters:** Magic prompt, style type, negative prompt, seed
- **Pricing:** $0.080 (base), $0.090 (magic) per image

---

### **3. Video Generation**

#### **Runway**
- **Provider:** `runway`
- **Model:** `veo3`
- **Service Type:** `video`
- **Duration:** 8 seconds (fixed for veo3)
- **Ratios:** 1280:720, 16:9, etc.
- **Features:** Text-to-video, image-to-video
- **Pricing:** $0.05 per second

#### **Luma Dream Machine**
- **Provider:** `luma`
- **Model:** `ray-2`
- **Service Type:** `video`
- **Duration:** 5s or 9s options
- **Resolution:** 720p or 1080p
- **Aspect Ratios:** 16:9, 9:16, 4:3, 3:4, 21:9, 9:21, 1:1
- **Features:** Loop mode, keyframes, text-to-video, image-to-video
- **Pricing:** $0.02 per second

---

## 📊 **Analytics Dashboard Configuration**

### **Filter Options (Updated)**
```javascript
serviceTypes: ['all', 'content', 'images', 'video']
providers: ['all', 'openai', 'flux', 'stability', 'ideogram', 'runway', 'luma']
statuses: ['all', 'success', 'failed']
```

### **Previous Issues - FIXED ✅**
1. ❌ **Removed:** `anthropic` - Not implemented in codebase
2. ✅ **Added:** `flux` - Image generation provider
3. ✅ **Added:** `ideogram` - Image generation provider

---

## 🗂️ **Provider Tracking Details**

### **What Gets Tracked**

All API calls are tracked in the `api_usage` table with:

| Field | Description |
|-------|-------------|
| `user_id` | User making the request |
| `service_type` | content / images / video |
| `provider` | openai / flux / stability / ideogram / runway / luma |
| `model` | Specific model used |
| `status` | success / failed |
| `input_tokens` | For text models |
| `output_tokens` | For text models |
| `images_generated` | Count for image generation |
| `video_seconds` | Duration for video generation |
| `input_cost` | Token input cost |
| `output_cost` | Token output cost |
| `generation_cost` | Image/video generation cost |
| `total_cost` | Combined cost |
| `latency_ms` | Request duration |
| `created_at` | Timestamp |

### **Analytics Views**

The dashboard queries these materialized views:
- `mv_daily_metrics` - Daily aggregated usage
- `mv_provider_performance` - Provider-specific metrics
- `mv_user_segments` - User behavior patterns
- `v_daily_executive_dashboard` - Executive KPIs

---

## 🔍 **Model-Specific Tracking**

### **Content Models (OpenAI)**
```javascript
'gpt-5': { input: $2.50, output: $10.00 per 1M tokens }
'gpt-5-chat-latest': { input: $2.50, output: $10.00 per 1M tokens }
'gpt-4o': { input: $0.25, output: $1.00 per 1M tokens }
'gpt-4o-mini': { input: $0.15, output: $0.60 per 1M tokens }
```

### **Image Models**
```javascript
openai (DALL-E): $0.040 - $0.120 per image
flux: $0.045 - $0.060 per image
stability: $0.035 per image
ideogram: $0.080 - $0.090 per image
```

### **Video Models**
```javascript
runway (veo3): $0.05 per second × 8 seconds = $0.40 per video
luma (ray-2): $0.02 per second × 5-9 seconds = $0.10 - $0.18 per video
```

---

## ✅ **Verification Checklist**

- [x] All providers in FilterControls match actual implementations
- [x] Service types correctly categorize all providers
- [x] Pricing constants match current provider rates
- [x] Database views include all provider fields
- [x] Analytics components handle all provider types
- [x] No phantom/unused providers in filters
- [x] All API endpoints track usage correctly

---

## 🚀 **Usage**

The analytics dashboard will now correctly display metrics for:
1. **Content tab** - OpenAI GPT models only
2. **Images** - OpenAI DALL-E, FLUX, Stability, Ideogram
3. **Video** - Runway (veo3), Luma (ray-2)
4. **Models tab** - Detailed breakdown by provider and model
5. **Operations tab** - Real-time API call monitoring

All filter dropdowns now reflect the actual providers being tracked in your system.

---

## 📝 **Notes**

- **Anthropic** was listed but never implemented - removed from filters
- **FLUX** and **Ideogram** were implemented but missing from filters - now added
- All pricing is current as of October 2025
- Video duration constraints are enforced per provider (Runway: 8s, Luma: 5s/9s)
