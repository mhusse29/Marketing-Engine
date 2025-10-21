/**
 * Response helpers for Vercel functions
 */
import { logger } from './logger.js';

/**
 * Add metadata to response data
 */
export function addMetadata(data, options = {}) {
  return {
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      cached: options.cached || false,
      source: options.source || 'database',
      freshness: options.freshness || 'current',
      version: 'v1',
      ...options.extra
    }
  };
}

/**
 * Send error response
 */
export function sendError(res, err, context = {}) {
  logger.error('api_error', { error: err.message, ...context });
  return res.status(500).json({ 
    error: err.message,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle CORS for Vercel functions
 */
export function setCorsHeaders(res, origin = '*') {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [
        'http://localhost:5173',
        'http://localhost:5176',
        'https://animated-twilight-3ff73f.netlify.app',
        'https://sinaiq-analytics.netlify.app',
        'https://sinaiq-analytics.vercel.app'
      ];
  
  const requestOrigin = typeof origin === 'string' ? origin : allowedOrigins[0];
  const allowOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
  
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Analytics-Key');
  
  return res;
}

/**
 * Cached query helper
 */
import * as cache from './cache.js';

export async function cachedQuery(cacheKey, queryFn, ttl = 60) {
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.info('cache_hit', { cacheKey });
    return addMetadata(cached, { cached: true, source: 'cache' });
  }

  // Cache miss - execute query
  logger.info('cache_miss', { cacheKey });
  const { data, error } = await queryFn();
  
  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  // Store in cache
  cache.set(cacheKey, data, ttl);
  
  return addMetadata(data, { cached: false, source: 'database' });
}
