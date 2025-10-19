/**
 * Mock Analytics Gateway - No Supabase Required
 * Returns fake data for testing the admin dashboard
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.ANALYTICS_GATEWAY_PORT || 8788;
const ANALYTICS_GATEWAY_KEY = process.env.ANALYTICS_GATEWAY_KEY || 'admin-analytics-2024';
const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json());

// Simple auth middleware
function authenticateRequest(req, res, next) {
  const serviceKey = req.headers['x-analytics-key'];
  if (serviceKey && serviceKey === ANALYTICS_GATEWAY_KEY) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Unauthorized' });
}

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mode: 'MOCK',
  });
});

// Mock data generators
const generateMockMetrics = () => ({
  success: true,
  data: {
    date: new Date().toISOString().split('T')[0],
    total_requests: Math.floor(Math.random() * 1000) + 500,
    successful_requests: Math.floor(Math.random() * 900) + 450,
    failed_requests: Math.floor(Math.random() * 50) + 10,
    total_cost: (Math.random() * 100 + 50).toFixed(2),
    avg_latency_ms: Math.floor(Math.random() * 200) + 100,
  },
  metadata: {
    timestamp: new Date().toISOString(),
    cached: false,
    source: 'mock',
  },
});

// GET /api/v1/metrics/daily
app.get('/api/v1/metrics/daily', authenticateRequest, (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const data = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    return {
      date: date.toISOString().split('T')[0],
      total_requests: Math.floor(Math.random() * 1000) + 500,
      successful_requests: Math.floor(Math.random() * 900) + 450,
      failed_requests: Math.floor(Math.random() * 50) + 10,
      total_cost: parseFloat((Math.random() * 100 + 50).toFixed(2)),
      avg_latency_ms: Math.floor(Math.random() * 200) + 100,
    };
  });

  res.json({
    success: true,
    data,
    metadata: { timestamp: new Date().toISOString(), cached: false, source: 'mock' },
  });
});

// GET /api/v1/metrics/executive
app.get('/api/v1/metrics/executive', authenticateRequest, (req, res) => {
  res.json({
    success: true,
    data: {
      total_users: 1247,
      active_users_today: 342,
      total_requests_30d: 45823,
      success_rate: 97.8,
      total_cost_30d: 2847.65,
      avg_latency_ms: 145,
      health_score: 95,
      active_alerts: 0,
      revenue_30d: 15420.00,
      churn_rate: 2.3,
    },
    metadata: { timestamp: new Date().toISOString(), cached: false, source: 'mock' },
  });
});

// GET /api/v1/metrics/health
app.get('/api/v1/metrics/health', authenticateRequest, (req, res) => {
  res.json({
    success: true,
    data: {
      timestamp: new Date().toISOString(),
      health_score: 95,
      status: 'healthy',
      components: {
        database: 'healthy',
        api: 'healthy',
        cache: 'healthy',
      },
    },
    metadata: { timestamp: new Date().toISOString(), cached: false, source: 'mock' },
  });
});

// GET /api/v1/metrics/providers
app.get('/api/v1/metrics/providers', authenticateRequest, (req, res) => {
  res.json({
    success: true,
    data: [
      { provider: 'OpenAI', requests: 15234, cost: 1245.67, avg_latency_ms: 120, success_rate: 99.2 },
      { provider: 'Anthropic', requests: 12456, cost: 987.45, avg_latency_ms: 150, success_rate: 98.5 },
      { provider: 'Google', requests: 8745, cost: 654.32, avg_latency_ms: 180, success_rate: 97.8 },
    ],
    metadata: { timestamp: new Date().toISOString(), cached: false, source: 'mock' },
  });
});

// GET /api/v1/metrics/models
app.get('/api/v1/metrics/models', authenticateRequest, (req, res) => {
  res.json({
    success: true,
    data: [
      { model: 'gpt-4', requests: 8500, cost: 850.00, avg_latency_ms: 1200 },
      { model: 'gpt-3.5-turbo', requests: 15000, cost: 300.00, avg_latency_ms: 800 },
      { model: 'claude-3-opus', requests: 5000, cost: 500.00, avg_latency_ms: 1500 },
      { model: 'claude-3-sonnet', requests: 7000, cost: 420.00, avg_latency_ms: 1000 },
    ],
    metadata: { timestamp: new Date().toISOString(), cached: false, source: 'mock' },
  });
});

// GET /api/v1/metrics/realtime
app.get('/api/v1/metrics/realtime', authenticateRequest, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const data = Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
    id: `req_${Date.now()}_${i}`,
    timestamp: new Date(Date.now() - i * 60000).toISOString(),
    model: ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus'][Math.floor(Math.random() * 3)],
    provider: ['OpenAI', 'Anthropic'][Math.floor(Math.random() * 2)],
    latency_ms: Math.floor(Math.random() * 2000) + 500,
    cost: parseFloat((Math.random() * 0.5).toFixed(4)),
    status: Math.random() > 0.05 ? 'success' : 'error',
  }));

  res.json({
    success: true,
    data,
    metadata: { timestamp: new Date().toISOString(), cached: false, source: 'mock' },
  });
});

// GET /api/v1/segments/users
app.get('/api/v1/segments/users', authenticateRequest, (req, res) => {
  res.json({
    success: true,
    data: [
      { segment: 'Power Users', count: 124, percentage: 9.9 },
      { segment: 'Regular Users', count: 456, percentage: 36.6 },
      { segment: 'Occasional Users', count: 567, percentage: 45.5 },
      { segment: 'Inactive Users', count: 100, percentage: 8.0 },
    ],
    metadata: { timestamp: new Date().toISOString(), cached: false, source: 'mock' },
  });
});

// GET /api/v1/revenue/plans
app.get('/api/v1/revenue/plans', authenticateRequest, (req, res) => {
  res.json({
    success: true,
    data: [
      { plan: 'Enterprise', subscribers: 45, mrr: 8500, churn_rate: 1.2 },
      { plan: 'Pro', subscribers: 234, mrr: 4680, churn_rate: 2.5 },
      { plan: 'Starter', subscribers: 567, mrr: 2835, churn_rate: 5.8 },
      { plan: 'Free', subscribers: 401, mrr: 0, churn_rate: 12.3 },
    ],
    metadata: { timestamp: new Date().toISOString(), cached: false, source: 'mock' },
  });
});

// GET /api/v1/users/churn-risk
app.get('/api/v1/users/churn-risk', authenticateRequest, (req, res) => {
  res.json({
    success: true,
    data: [
      { user_id: 'user_1', email: 'user1@example.com', churn_score: 75, last_active: '2025-10-15' },
      { user_id: 'user_2', email: 'user2@example.com', churn_score: 68, last_active: '2025-10-14' },
      { user_id: 'user_3', email: 'user3@example.com', churn_score: 62, last_active: '2025-10-13' },
    ],
    metadata: { timestamp: new Date().toISOString(), cached: false, source: 'mock' },
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Mock Analytics Gateway Started');
  console.log('================================');
  console.log(`Port: ${PORT}`);
  console.log(`Mode: MOCK DATA (No Supabase required)`);
  console.log(`Gateway Key: ${ANALYTICS_GATEWAY_KEY}`);
  console.log('');
  console.log('✅ All endpoints returning fake data');
  console.log('✅ Ready for admin dashboard testing');
  console.log('');
});
