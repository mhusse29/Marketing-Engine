/**
 * Image Upload Proxy Endpoint
 * Fetches images from Azure blob and uploads to Supabase Storage
 * Bypasses CORS restrictions by running server-side
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS for frontend
app.use('/*', cors({
  origin: ['http://localhost:5173', 'https://*.netlify.app'],
  credentials: true,
}));

interface UploadImageRequest {
  tempUrl: string;
  userId: string;
  generationId: string;
  index: number;
  supabaseUrl: string;
  supabaseKey: string;
}

app.post('/upload-image', async (c) => {
  try {
    const body = await c.req.json<UploadImageRequest>();
    const { tempUrl, userId, generationId, index, supabaseUrl, supabaseKey } = body;

    console.log(`[Upload ${index}] Proxying image from Azure blob...`);

    // Fetch image from Azure blob (server-side, no CORS)
    const response = await fetch(tempUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Get image as ArrayBuffer
    const imageBuffer = await response.arrayBuffer();
    const blob = new Blob([imageBuffer], { type: response.headers.get('content-type') || 'image/jpeg' });

    console.log(`[Upload ${index}] Fetched image: ${blob.size} bytes`);

    if (blob.size === 0) {
      throw new Error('Image blob is empty');
    }

    // Generate filename
    const extension = blob.type.split('/')[1] || 'jpeg';
    const filename = `${userId}/${generationId}/image-${index}.${extension}`;

    console.log(`[Upload ${index}] Uploading to Supabase: ${filename}`);

    // Upload to Supabase Storage using fetch
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/generated-images/${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': blob.type,
          'x-upsert': 'true',
        },
        body: blob,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Supabase upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    // Generate public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/generated-images/${filename}`;

    console.log(`[Upload ${index}] Success: ${publicUrl}`);

    return c.json({
      success: true,
      url: publicUrl,
      filename: filename,
    });

  } catch (error) {
    console.error('Upload proxy error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default app;
