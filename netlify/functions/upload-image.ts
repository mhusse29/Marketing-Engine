/**
 * Netlify Function: Image Upload Proxy
 * Fetches images from Azure blob and uploads to Supabase Storage
 * Bypasses CORS restrictions by running server-side
 */

import { Handler } from '@netlify/functions';

interface UploadImageRequest {
  tempUrl: string;
  userId: string;
  generationId: string;
  index: number;
  supabaseUrl: string;
  supabaseKey: string;
}

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body: UploadImageRequest = JSON.parse(event.body || '{}');
    const { tempUrl, userId, generationId, index, supabaseUrl, supabaseKey } = body;

    if (!tempUrl || !userId || !generationId || index === undefined || !supabaseUrl || !supabaseKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    console.log(`[Upload ${index}] Proxying image from Azure blob...`);

    // Fetch image from Azure blob (server-side, no CORS)
    const response = await fetch(tempUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Get image as ArrayBuffer
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log(`[Upload ${index}] Fetched image: ${imageBuffer.byteLength} bytes`);

    if (imageBuffer.byteLength === 0) {
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        success: true,
        url: publicUrl,
        filename: filename,
      }),
    };

  } catch (error) {
    console.error('Upload proxy error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
