/**
 * AUTH MIDDLEWARE - Extract user ID from requests
 * Supports multiple extraction methods for flexibility
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Extract user ID from request
 * Tries multiple sources in order:
 * 1. Authorization header (JWT token)
 * 2. Request body userId field
 * 3. Request headers x-user-id
 */
export async function extractUserIdMiddleware(req, res, next) {
  try {
    let userId = null;

    // Method 1: Extract from Authorization header (JWT token)
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && supabase) {
      const token = authHeader.substring(7);
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          userId = user.id;
          console.log('[Auth] User ID from JWT:', userId);
        }
      } catch (error) {
        console.warn('[Auth] JWT verification failed:', error.message);
      }
    }

    // Method 2: Extract from request body (for demo purposes)
    if (!userId && req.body?.userId) {
      userId = req.body.userId;
      console.log('[Auth] User ID from body:', userId);
    }

    // Method 3: Extract from custom header
    if (!userId && req.headers['x-user-id']) {
      userId = req.headers['x-user-id'];
      console.log('[Auth] User ID from header:', userId);
    }

    // Attach to request object for later use
    req.userId = userId;
    req.ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress;
    req.userAgent = req.headers['user-agent'];

    // Continue even if no user ID (for backwards compatibility)
    if (!userId) {
      console.warn('[Auth] No user ID found in request to:', req.path);
    }

    next();
  } catch (error) {
    console.error('[Auth] Middleware error:', error);
    // Don't block the request
    next();
  }
}

/**
 * Optional: Require authentication for protected routes
 */
export function requireAuth(req, res, next) {
  if (!req.userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide a valid authentication token'
    });
  }
  next();
}

export default extractUserIdMiddleware;
