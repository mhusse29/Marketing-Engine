/**
 * GET /api/health
 * Basic health check endpoint
 */
import * as cache from '../lib/cache.js';
import { setCorsHeaders } from '../lib/response.js';

export default async function handler(req, res) {
  // Handle CORS
  setCorsHeaders(res, req.headers.origin);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stats = cache.getStats();
  
  return res.status(200).json({
    status: 'healthy',
    service: 'analytics-gateway',
    version: '2.0.0-vercel',
    environment: process.env.VERCEL_ENV || 'development',
    cache: {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses
    },
    timestamp: new Date().toISOString()
  });
}
