# Pictures Provider Image Reference Capabilities

## Research Summary (2024)

### Provider Support Matrix

| Provider | Image Reference Support | Max Images | Notes |
|----------|------------------------|------------|-------|
| **DALL-E 3** | ❌ No | 0 | Text-to-image only. No image reference capability in API |
| **FLUX Pro** | ✅ Yes | 1 | Supports image references via FLUX Kontext Pro. Limited to 1 reference image |
| **Stability AI (SD 3.5)** | ✅ Yes | Multiple | Full image-to-image support with multiple reference images |
| **Ideogram v3.0** | ✅ Yes | Up to 3 | Style reference feature allows up to 3 reference images |

### Implementation Details

#### DALL-E 3 (OpenAI)
- **Support**: None
- **API**: Text-to-image only
- **Workaround**: None available via API
- **Source**: [OpenAI Community Forum](https://community.openai.com/t/is-it-possible-to-give-reference-image-to-dall-e3-api/596804)

#### FLUX Pro
- **Support**: Yes (via Kontext Pro)
- **Max Images**: 1 reference image
- **Format**: URL or base64
- **Use Case**: Image-to-image generation with style transfer
- **Implementation**: Already supported in `/src/lib/pictureGeneration.ts` line 303

#### Stability AI (SD 3.5)
- **Support**: Full image-to-image
- **Max Images**: Multiple references supported
- **Format**: URL or base64
- **Features**: Inpainting, masking, variants, multi-prompting
- **API Endpoint**: `/v1/image-to-image`

#### Ideogram v3.0
- **Support**: Style Reference feature
- **Max Images**: Up to 3 reference images
- **Format**: URL or base64
- **Use Case**: Visual style basis for generation
- **Versions**: Available in v3.0 (v2.0 has different style options)

### UI/UX Guidelines

1. **Show upload button only for supported providers**: FLUX, Stability, Ideogram
2. **Hide upload button for**: DALL-E 3
3. **Validation**:
   - Max file size: 10MB
   - Supported formats: JPEG, PNG, WebP
   - Provider-specific limits (1 for FLUX, 3 for Ideogram)
4. **User feedback**:
   - Clear messaging when provider doesn't support images
   - Visual preview of uploaded reference
   - Easy removal option

### Code References

- Picture generation: `/src/lib/pictureGeneration.ts`
- Video upload example: `/src/components/MenuVideo.tsx` (lines 482-498)
- Gateway request type: `ImageGatewayRequest` (line 303 limits FLUX to 1 image)
