/**
 * Authentication middleware for Vercel serverless functions
 */
import { getSupabaseClient } from './supabase.mjs';

const ANALYTICS_GATEWAY_KEY = process.env.ANALYTICS_GATEWAY_KEY;

export async function authenticateRequest(req) {
  // Option 1: Service key authentication
  if (ANALYTICS_GATEWAY_KEY && req.headers['x-analytics-key'] === ANALYTICS_GATEWAY_KEY) {
    return { authenticated: true, user: null, isService: true };
  }

  // Option 2: JWT authentication
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getUser(token);
      
      if (!error && data?.user) {
        return { authenticated: true, user: data.user, isService: false };
      }
    } catch (error) {
      console.error('[Auth] Token verification failed:', error);
    }
  }

  // Option 3: Public access in development
  if (process.env.ANALYTICS_PUBLIC_ACCESS === 'true') {
    return { authenticated: true, user: null, isService: false, isPublic: true };
  }

  return { authenticated: false, user: null, isService: false };
}

export function requireAuth(handler) {
  return async (req, res) => {
    const auth = await authenticateRequest(req);
    
    if (!auth.authenticated) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    req.auth = auth;
    return handler(req, res);
  };
}
