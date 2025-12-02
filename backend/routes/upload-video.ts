/**
 * Video Upload Proxy Endpoint
 * Fetches videos from Runway/Luma temporary URLs and uploads to Supabase Storage
 * Bypasses CORS restrictions and handles expired JWT tokens by running server-side
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS for frontend
app.use('/*', cors({
  origin: ['http://localhost:5173', 'https://*.netlify.app'],
  credentials: true,
}));

interface UploadVideoRequest {
  tempUrl: string;
  userId: string;
  generationId: string;
  index: number;
  supabaseUrl: string;
  supabaseKey: string;
}

app.post('/upload-video', async (c) => {
  try {
    const body = await c.req.json<UploadVideoRequest>();
    const { tempUrl, userId, generationId, index, supabaseUrl, supabaseKey } = body;

    console.log(`[Video Upload ${index}] Proxying video from temporary URL...`);
    console.log(`[Video Upload ${index}] Source: ${tempUrl.substring(0, 80)}...`);

    // Fetch video from temporary URL (server-side, no CORS, works with expired JWTs)
    const response = await fetch(tempUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
    }

    // Get video as ArrayBuffer
    const videoBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'video/mp4';
    const blob = new Blob([videoBuffer], { type: contentType });

    console.log(`[Video Upload ${index}] Fetched video: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);

    if (blob.size === 0) {
      throw new Error('Video blob is empty');
    }

    // Generate filename with proper extension
    const extension = contentType.split('/')[1] || 'mp4';
    const filename = `${userId}/${generationId}/video-${index}.${extension}`;

    console.log(`[Video Upload ${index}] Uploading to Supabase Storage: ${filename}`);

    // Upload to Supabase Storage using fetch
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/generated-videos/${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': contentType,
          'x-upsert': 'true', // Allows overwriting existing files
        },
        body: blob,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Supabase upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    // Generate public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/generated-videos/${filename}`;

    console.log(`[Video Upload ${index}] ✅ Success: ${publicUrl}`);

    return c.json({
      success: true,
      url: publicUrl,
      filename: filename,
      size: blob.size,
      contentType: contentType,
    });

  } catch (error) {
    console.error('[Video Upload] Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default app;
