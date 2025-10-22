/**
 * Vercel Serverless Function: Health Score Metrics
 * GET /api/metrics-health?interval=60
 * TEST VERSION - NO AUTH
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple test response
  res.status(200).json({
    success: true,
    message: 'Health endpoint working!',
    timestamp: new Date().toISOString(),
    interval: req.query.interval || '60',
    note: 'This is a test - no database connection yet'
  });
}
