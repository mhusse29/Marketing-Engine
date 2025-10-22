/**
 * Vercel Serverless Function: Health Check
 * GET /api/health
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({
    status: 'healthy',
    service: 'analytics-gateway',
    version: '1.0.0',
    environment: 'vercel',
    timestamp: new Date().toISOString()
  });
}
