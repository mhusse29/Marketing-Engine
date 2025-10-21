/**
 * Simple in-memory cache for Vercel functions
 * Note: Each function instance has its own cache (serverless limitation)
 * For shared cache across functions, consider Vercel KV or Redis
 */

const cache = new Map();
const ttls = new Map();

/**
 * Get value from cache
 */
export function get(key) {
  // Check if expired
  const ttl = ttls.get(key);
  if (ttl && Date.now() > ttl) {
    cache.delete(key);
    ttls.delete(key);
    return null;
  }
  
  return cache.get(key) || null;
}

/**
 * Set value in cache with TTL (seconds)
 */
export function set(key, value, ttlSeconds = 60) {
  cache.set(key, value);
  if (ttlSeconds > 0) {
    ttls.set(key, Date.now() + (ttlSeconds * 1000));
  }
}

/**
 * Delete value from cache
 */
export function del(key) {
  cache.delete(key);
  ttls.delete(key);
  return 1;
}

/**
 * Clear all cache
 */
export function flushAll() {
  cache.clear();
  ttls.clear();
}

/**
 * Get cache stats
 */
export function getStats() {
  return {
    keys: cache.size,
    // Serverless functions don't persist stats, so return basic info
    hits: 0,
    misses: 0
  };
}

/**
 * Get all cache keys
 */
export function keys() {
  return Array.from(cache.keys());
}
