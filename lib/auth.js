/**
 * Authentication Utilities for Vercel Functions
 */
import { supabase } from './supabase.js';
import { logger } from './logger.js';

const ANALYTICS_GATEWAY_KEY = process.env.ANALYTICS_GATEWAY_KEY;

/**
 * Verify Supabase JWT token
 */
export async function verifySupabaseUser(token) {
  if (!token) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      logger.warn('supabase_token_verification_failed', { error: error.message });
      return null;
    }
    return data?.user || null;
  } catch (err) {
    logger.error('supabase_token_verification_error', { error: err.message });
    return null;
  }
}

/**
 * Authentication middleware for Vercel functions
 * Returns { authenticated: boolean, user?: object, service?: boolean, publicAccess?: boolean }
 */
export async function authenticate(req) {
  // Option 1: Service key authentication
  if (ANALYTICS_GATEWAY_KEY && req.headers['x-analytics-key'] === ANALYTICS_GATEWAY_KEY) {
    return { authenticated: true, service: true };
  }

  // Option 2: JWT authentication
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    const user = await verifySupabaseUser(token);
    if (user) {
      return { authenticated: true, user };
    }
  }

  // Option 3: Development/public access mode
  if (process.env.NODE_ENV !== 'production' || process.env.ANALYTICS_PUBLIC_ACCESS === 'true') {
    logger.warn('unauthenticated_access_allowed');
    return { authenticated: true, publicAccess: true };
  }

  return { authenticated: false };
}

/**
 * Check if user is admin
 */
export function isAdmin(authResult) {
  if (authResult.service) return true;
  const roles = authResult.user?.app_metadata?.roles;
  return Array.isArray(roles) && roles.includes('admin');
}

/**
 * Send 401 Unauthorized response
 */
export function unauthorized(res) {
  return res.status(401).json({ 
    success: false, 
    error: 'Unauthorized' 
  });
}

/**
 * Send 403 Forbidden response
 */
export function forbidden(res) {
  return res.status(403).json({ 
    success: false, 
    error: 'Forbidden' 
  });
}
