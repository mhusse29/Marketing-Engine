/**
 * Image Storage Utilities
 * Handles uploading generated images to permanent Supabase Storage
 * Replaces temporary Azure blob URLs with permanent storage URLs
 */

import { supabase } from './supabase';

/**
 * Upload an image from a temporary URL to Supabase Storage
 * @param tempUrl - Temporary Azure blob URL
 * @param userId - User ID for folder organization
 * @param generationId - Generation ID for filename
 * @param index - Index for multiple images in same generation
 * @returns Permanent Supabase Storage URL
 */
export async function uploadImageToStorage(
  tempUrl: string,
  userId: string,
  generationId: string,
  index: number = 0
): Promise<string> {
  console.log(`📤 [${index}] Starting upload via proxy server...`);

  // Check if Supabase is properly configured
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // Use backend proxy server to bypass CORS
  const proxyUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';
  
  try {
    console.log(`🔄 [${index}] Calling proxy server at ${proxyUrl}/api/upload-image`);
    
    const response = await fetch(`${proxyUrl}/api/upload-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tempUrl,
        userId,
        generationId,
        index,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Proxy server failed: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.url) {
      throw new Error(`Proxy returned error: ${result.error || 'Unknown error'}`);
    }

    console.log(`✅ [${index}] Upload successful via proxy:`, result.url);
    
    if (!result.url.includes('supabase.co')) {
      throw new Error('Invalid public URL returned: ' + result.url);
    }

    return result.url;
    
  } catch (error) {
    console.error(`❌ [${index}] Proxy upload failed:`, error);
    throw error;
  }
}

/**
 * Upload multiple images from a versions array
 * @param versions - Array of generated pictures with temporary URLs
 * @param userId - User ID
 * @param generationId - Generation ID
 * @returns Updated versions array with permanent URLs
 */
export async function uploadGeneratedImages(
  versions: Array<{
    assets?: Array<{ url?: string; [key: string]: any }>;
    [key: string]: any;
  }>,
  userId: string,
  generationId: string
): Promise<typeof versions> {
  console.log('📦 Starting batch upload:', {
    versions: versions.length,
    totalAssets: versions.reduce((sum, v) => sum + (v.assets?.length || 0), 0),
    userId: userId.substring(0, 8) + '...',
    generationId
  });

  const updatedVersions = await Promise.all(
    versions.map(async (version, versionIndex) => {
      if (!version.assets) {
        console.log(`⏭️ Version ${versionIndex}: No assets, skipping`);
        return version;
      }

      console.log(`🔄 Version ${versionIndex}: Processing ${version.assets.length} assets...`);

      const updatedAssets = await Promise.all(
        version.assets.map(async (asset, assetIndex) => {
          if (!asset.url) {
            console.log(`⏭️ [${versionIndex}-${assetIndex}] No URL, skipping`);
            return asset;
          }

          // Calculate global index for unique filenames
          const globalIndex = versionIndex * (version.assets?.length || 1) + assetIndex;

          try {
            // Upload to permanent storage (throws on error)
            const permanentUrl = await uploadImageToStorage(
              asset.url,
              userId,
              generationId,
              globalIndex
            );

            // Return asset with permanent URL
            return {
              ...asset,
              url: permanentUrl,
              originalUrl: asset.url, // Keep original for reference
              isPermanent: true,
            };
          } catch (uploadError) {
            console.error(`❌ Failed to upload asset [${versionIndex}-${assetIndex}]:`, uploadError);
            throw uploadError; // Propagate error - don't save if upload fails
          }
        })
      );

      return {
        ...version,
        assets: updatedAssets,
      };
    })
  );

  // Verify all uploads succeeded
  const totalAssets = updatedVersions.reduce((sum, v) => sum + (v.assets?.length || 0), 0);
  const permanentAssets = updatedVersions.reduce((count, version) => {
    return count + (version.assets?.filter((a: any) => a.isPermanent).length || 0);
  }, 0);

  if (permanentAssets !== totalAssets) {
    throw new Error(`Upload incomplete: ${permanentAssets}/${totalAssets} assets uploaded`);
  }

  console.log('🎉 BATCH UPLOAD COMPLETE:', {
    versions: updatedVersions.length,
    assetsUploaded: permanentAssets,
    allPermanent: true
  });

  return updatedVersions;
}

/**
 * Check if a URL is a temporary Azure blob URL
 */
export function isTemporaryUrl(url: string): boolean {
  return url.includes('blob.core.windows.net') && url.includes('?se=');
}

/**
 * Upload a video from a temporary URL to Supabase Storage
 * @param tempUrl - Temporary video URL (Runway/Luma with JWT token)
 * @param userId - User ID for folder organization
 * @param generationId - Generation ID for filename
 * @param index - Index for multiple videos in same generation
 * @returns Permanent Supabase Storage URL
 */
export async function uploadVideoToStorage(
  tempUrl: string,
  userId: string,
  generationId: string,
  index: number = 0
): Promise<string> {
  console.log(`📤 [Video ${index}] Starting upload via proxy server...`);

  // Check if Supabase is properly configured
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // Use backend proxy server to handle video download and upload
  const proxyUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';
  
  try {
    console.log(`🔄 [Video ${index}] Calling proxy server at ${proxyUrl}/api/upload-video`);
    
    const response = await fetch(`${proxyUrl}/api/upload-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tempUrl,
        userId,
        generationId,
        index,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Proxy server failed: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.url) {
      throw new Error(`Proxy returned error: ${result.error || 'Unknown error'}`);
    }

    console.log(`✅ [Video ${index}] Upload successful via proxy:`, result.url);
    
    if (!result.url.includes('supabase.co')) {
      throw new Error('Invalid public URL returned: ' + result.url);
    }

    return result.url;
    
  } catch (error) {
    console.error(`❌ [Video ${index}] Proxy upload failed:`, error);
    throw error;
  }
}

/**
 * Upload videos from GeneratedVideo array to permanent storage
 * @param videos - Array of generated videos with temporary URLs
 * @param userId - User ID
 * @param generationId - Generation ID
 * @returns Updated videos array with permanent URLs
 */
export async function uploadGeneratedVideos(
  videos: Array<{
    url: string;
    [key: string]: any;
  }>,
  userId: string,
  generationId: string
): Promise<typeof videos> {
  console.log('📦 Starting video batch upload:', {
    videos: videos.length,
    userId: userId.substring(0, 8) + '...',
    generationId
  });

  const updatedVideos = await Promise.all(
    videos.map(async (video, index) => {
      if (!video.url) {
        console.log(`⏭️ Video ${index}: No URL, skipping`);
        return video;
      }

      // Check if URL is temporary (has JWT token or other expiring signature)
      const isTemporary = video.url.includes('?_jwt=') || 
                         video.url.includes('cloudfront.net') ||
                         video.url.includes('blob.core.windows.net');

      if (!isTemporary) {
        console.log(`⏭️ Video ${index}: Already permanent URL, skipping`);
        return video;
      }

      try {
        console.log(`🔄 Video ${index}: Uploading to permanent storage...`);
        
        // Upload to permanent storage (throws on error)
        const permanentUrl = await uploadVideoToStorage(
          video.url,
          userId,
          generationId,
          index
        );

        // Return video with permanent URL
        return {
          ...video,
          url: permanentUrl,
          originalUrl: video.url, // Keep original for reference
          isPermanent: true,
        };
      } catch (uploadError) {
        console.error(`❌ Failed to upload video ${index}:`, uploadError);
        throw uploadError; // Propagate error - don't save if upload fails
      }
    })
  );

  // Verify all uploads succeeded
  const permanentVideos = updatedVideos.filter((v: any) => v.isPermanent || !v.url.includes('?_jwt=')).length;

  console.log('🎉 VIDEO BATCH UPLOAD COMPLETE:', {
    videos: updatedVideos.length,
    videosUploaded: permanentVideos,
    allPermanent: permanentVideos === updatedVideos.length
  });

  return updatedVideos;
}

/**
 * Get user ID from current session
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}
