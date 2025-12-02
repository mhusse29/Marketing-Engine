/**
 * Simple Express Proxy Server for Image Uploads
 * Runs on port 8787 to proxy image uploads from Azure to Supabase
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 8787;

// Enable CORS for all routes
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy server running' });
});

// Proxy ALL other requests to the real backend
// (This handles /v1/generate, /v1/images/generate, etc.)
app.use((req, res, next) => {
  // Skip if it's our upload endpoint
  if (req.path === '/api/upload-image') {
    return next();
  }
  
  // For all other requests, proxy to the real backend
  const realBackendUrl = process.env.REAL_BACKEND_URL || 'https://marketing-engine-backend.your-domain.workers.dev';
  
  console.log(`🔀 Proxying ${req.method} ${req.path} to real backend...`);
  
  res.status(503).json({
    error: 'Backend not configured',
    message: 'Please set REAL_BACKEND_URL environment variable or start your Cloudflare Worker',
    requestedPath: req.path,
    hint: 'This proxy only handles /api/upload-image. Other endpoints need your actual backend.',
  });
});

// Image upload proxy endpoint  
app.post('/api/upload-image', async (req, res) => {
  try {
    const { tempUrl, userId, generationId, index, supabaseUrl, supabaseKey } = req.body;

    if (!tempUrl || !userId || !generationId || index === undefined || !supabaseUrl || !supabaseKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    console.log(`[Upload ${index}] Proxying image from Azure blob...`);

    // Fetch image from Azure blob (server-side, no CORS restrictions)
    const response = await fetch(tempUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Get image as buffer
    const imageBuffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log(`[Upload ${index}] Fetched image: ${imageBuffer.length} bytes`);

    if (imageBuffer.length === 0) {
      throw new Error('Image buffer is empty');
    }

    // Generate filename
    const extension = contentType.split('/')[1] || 'jpeg';
    const filename = `${userId}/${generationId}/image-${index}.${extension}`;

    console.log(`[Upload ${index}] Uploading to Supabase: ${filename}`);

    // Upload to Supabase Storage
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/generated-images/${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: imageBuffer,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`[Upload ${index}] Supabase upload failed:`, errorText);
      throw new Error(`Supabase upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    // Generate public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/generated-images/${filename}`;

    console.log(`[Upload ${index}] Success: ${publicUrl}`);

    res.json({
      success: true,
      url: publicUrl,
      filename: filename,
    });

  } catch (error) {
    console.error('Upload proxy error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Ready to proxy image uploads to Supabase Storage`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✅ Upload endpoint: http://localhost:${PORT}/api/upload-image`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use! Stop the other server or use a different port.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});
