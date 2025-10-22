/**
 * CORS middleware for Vercel serverless functions
 */

const ALLOWED_ORIGINS = process.env.ANALYTICS_ALLOWED_ORIGINS
  ? process.env.ANALYTICS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : ['*'];

export function setCorsHeaders(req, res) {
  const origin = req.headers.origin || req.headers.referer || '*';
  
  // Check if origin is allowed
  const allowedOrigin = ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Analytics-Key');
}

export function handleCors(req, res, handler) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}
