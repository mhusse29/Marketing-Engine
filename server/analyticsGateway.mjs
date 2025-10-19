/**
 * Analytics Gateway Service
 * 
 * Centralized backend tier for analytics dashboard
 * - Schema validation & versioning
 * - Intelligent caching (in-memory + Redis ready)
 * - Stale data detection
 * - Alert hooks (Slack/PagerDuty)
 * - Rate limiting
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import NodeCache from 'node-cache';
import fs from 'fs';

const app = express();
const PORT = process.env.ANALYTICS_GATEWAY_PORT || 8788;
const httpServer = createServer(app);
const ANALYTICS_GATEWAY_KEY = process.env.ANALYTICS_GATEWAY_KEY;
const ALLOWED_ORIGINS = process.env.ANALYTICS_ALLOWED_ORIGINS
  ? process.env.ANALYTICS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

// Supabase client
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('[Config] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('[Config] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// In-memory cache (TTL: 60s default)
const cache = new NodeCache({ 
  stdTTL: 60, 
  checkperiod: 120,
  useClones: false // Better performance
});

const logFilePath = process.env.ANALYTICS_LOG_FILE;
const logStream = logFilePath ? fs.createWriteStream(logFilePath, { flags: 'a' }) : null;

const logger = {
  log(level, message, context = {}) {
    const payload = JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    });
    console.log(payload);
    if (logStream) {
      logStream.write(`${payload}\n`);
    }
  },
  info(message, context) {
    logger.log('info', message, context);
  },
  warn(message, context) {
    logger.log('warn', message, context);
  },
  error(message, context) {
    logger.log('error', message, context);
  },
};

function handleError(res, err, context = {}) {
  logger.error('gateway_error', { error: err.message, ...context });
  res.status(500).json({ error: err.message });
}

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json());

// Socket.io server for real-time subscriptions
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('request_completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      userId: req.analyticsUser?.id,
      service: req.analyticsService || undefined,
    });
  });
  next();
});

const refreshRateWindowMs = 60 * 1000;
const refreshRateLimit = parseInt(process.env.ANALYTICS_REFRESH_LIMIT || '3', 10);
const refreshAttempts = new Map();

function enforceRefreshRateLimit(identifier) {
  const now = Date.now();
  const windowStart = now - refreshRateWindowMs;
  const history = refreshAttempts.get(identifier) || [];
  const recentHistory = history.filter((timestamp) => timestamp > windowStart);

  if (recentHistory.length >= refreshRateLimit) {
    return false;
  }

  recentHistory.push(now);
  refreshAttempts.set(identifier, recentHistory);
  return true;
}

async function verifySupabaseUser(token) {
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

async function authenticateRequest(req, res, next) {
  try {
    if (ANALYTICS_GATEWAY_KEY && req.headers['x-analytics-key'] === ANALYTICS_GATEWAY_KEY) {
      req.analyticsService = true;
      return next();
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const user = await verifySupabaseUser(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    req.analyticsUser = user;
    return next();
  } catch (err) {
    logger.error('request_authentication_failed', { error: err.message });
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}

function requireAdmin(req, res, next) {
  if (req.analyticsService) return next();
  const roles = req.analyticsUser?.app_metadata?.roles;
  if (Array.isArray(roles) && roles.includes('admin')) {
    return next();
  }
  return res.status(403).json({ success: false, error: 'Forbidden' });
}

io.use(async (socket, next) => {
  try {
    const auth = socket.handshake.auth || {};
    const token = auth.token;
    const serviceKey = auth.serviceKey || socket.handshake.headers['x-analytics-key'];

    if (serviceKey && ANALYTICS_GATEWAY_KEY && serviceKey === ANALYTICS_GATEWAY_KEY) {
      socket.analyticsService = true;
      return next();
    }

    const user = await verifySupabaseUser(token);
    if (user) {
      socket.analyticsUser = user;
      return next();
    }

    return next(new Error('Unauthorized'));
  } catch (err) {
    logger.error('websocket_authentication_failed', { error: err.message });
    return next(new Error('Unauthorized'));
  }
});

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Check if data is stale based on max age
 */
function isDataStale(lastRefresh, maxAgeMinutes = 5) {
  if (!lastRefresh) return true;
  const ageMinutes = (Date.now() - new Date(lastRefresh).getTime()) / 1000 / 60;
  return ageMinutes > maxAgeMinutes;
}

/**
 * Add metadata to response
 */
function addMetadata(data, options = {}) {
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
 * Cache wrapper for Supabase queries
 */
async function cachedQuery(cacheKey, queryFn, ttl = 60) {
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

// ═══════════════════════════════════════════════════════════════
// WEBSOCKET REAL-TIME PROXY
// ═══════════════════════════════════════════════════════════════

// Track active WebSocket subscriptions
let supabaseSubscription = null;
let activeConnections = 0;

/**
 * Validate and enrich real-time event
 */
function validateAndEnrichEvent(payload) {
  try {
    const event = payload.new;
    
    // Basic validation
    if (!event || typeof event !== 'object') {
      throw new Error('Invalid event payload');
    }

    // Enrich with metadata
    return {
      data: event,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'realtime',
        freshness: 'live',
        cached: false,
        version: 'v1.1.0',
        eventType: payload.eventType || 'INSERT',
        table: payload.table || 'api_usage'
      }
    };
  } catch (error) {
    console.error('[WebSocket] Event validation failed:', error);
    return null;
  }
}

/**
 * Start Supabase subscription (only when clients connect)
 */
function startSupabaseSubscription() {
  if (supabaseSubscription) {
    logger.info('ws_subscription_active');
    return;
  }

  logger.info('ws_subscription_start');
  
  supabaseSubscription = supabase
    .channel('api_usage_gateway_proxy')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'api_usage',
      },
      (payload) => {
        // Validate and enrich event
        const enrichedEvent = validateAndEnrichEvent(payload);
        
        if (enrichedEvent) {
          // Broadcast to all connected clients
          io.emit('api_usage:insert', enrichedEvent);
          logger.info('ws_event_broadcast', { activeConnections });
        }
      }
    )
    .subscribe((status) => {
      logger.info('ws_subscription_status', { status });
    });
}

/**
 * Stop Supabase subscription (when no clients connected)
 */
async function stopSupabaseSubscription() {
  if (!supabaseSubscription) return;

  logger.info('ws_subscription_stop');
  try {
    await supabaseSubscription.unsubscribe();
    logger.info('ws_subscription_stopped');
  } catch (error) {
    console.error('[WebSocket] Error stopping subscription:', error.message);
  }
  supabaseSubscription = null;
}

/**
 * Handle Socket.io client connections
 */
io.on('connection', (socket) => {
  activeConnections++;
  logger.info('ws_client_connected', { activeConnections });

  // Start subscription on first client
  if (activeConnections === 1) {
    startSupabaseSubscription();
  }

  // Handle client disconnect
  socket.on('disconnect', () => {
    activeConnections--;
    logger.info('ws_client_disconnected', { activeConnections });

    // Stop subscription when no clients connected
    if (activeConnections === 0) {
      stopSupabaseSubscription();
    }
  });

  // Send connection confirmation
  socket.emit('connected', {
    message: 'Connected to Analytics Gateway WebSocket',
    version: 'v1.1.0',
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════════
// HEALTH & STATUS
// ═══════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'analytics-gateway',
    version: '1.0.0',
    uptime: process.uptime(),
    cache: {
      keys: cache.keys().length,
      hits: cache.getStats().hits,
      misses: cache.getStats().misses,
      hitRate: (cache.getStats().hits / (cache.getStats().hits + cache.getStats().misses) * 100).toFixed(2) + '%'
    }
  });
});

app.get('/api/v1/status', async (req, res) => {
  try {
    // Check database connectivity
    const { data, error } = await supabase
      .from('api_usage')
      .select('id')
      .limit(1);

    res.json({
      status: error ? 'degraded' : 'operational',
      database: error ? 'error' : 'connected',
      cache: 'operational',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    handleError(res, err, { path: '/api/v1/status' });
  }
});

// ═══════════════════════════════════════════════════════════════
// METRICS ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/v1/metrics/daily
 * Daily aggregated metrics
 */
app.get('/api/v1/metrics/daily', authenticateRequest, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const cacheKey = `daily_metrics_${days}`;

    const result = await cachedQuery(
      cacheKey,
      () => supabase
        .from('mv_daily_metrics')
        .select('*')
        .order('date', { ascending: false })
        .limit(days),
      60 // 60s TTL
    );

    res.json(result);
  } catch (err) {
    handleError(res, err, { path: '/api/v1/metrics/daily' });
  }
});

/**
 * GET /api/v1/metrics/providers
 * Provider performance metrics
 */
app.get('/api/v1/metrics/providers', authenticateRequest, async (req, res) => {
  try {
    const cacheKey = 'provider_performance';

    const result = await cachedQuery(
      cacheKey,
      () => supabase
        .from('mv_provider_performance')
        .select('*')
        .order('total_requests', { ascending: false }),
      60
    );

    res.json(result);
  } catch (err) {
    handleError(res, err, { path: '/api/v1/metrics/providers' });
  }
});

/**
 * GET /api/v1/metrics/models
 * Model usage and cost metrics
 */
app.get('/api/v1/metrics/models', authenticateRequest, async (req, res) => {
  try {
    const cacheKey = 'model_usage';

    const result = await cachedQuery(
      cacheKey,
      () => supabase
        .from('mv_model_usage')
        .select('*')
        .order('total_calls', { ascending: false }),
      60
    );

    res.json(result);
  } catch (err) {
    handleError(res, err, { path: '/api/v1/metrics/models' });
  }
});

/**
 * GET /api/v1/metrics/executive
 * Executive summary metrics
 */
app.get('/api/v1/metrics/executive', authenticateRequest, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const cacheKey = `executive_${days}`;

    const result = await cachedQuery(
      cacheKey,
      async () => {
        const { data, error } = await supabase.rpc('get_executive_summary', { days_back: days });
        if (error) throw error;
        return { data, error: null };
      },
      30 // 30s TTL for executive dashboard
    );

    res.json(result);
  } catch (err) {
    handleError(res, err, { path: '/api/v1/metrics/executive' });
  }
});

/**
 * GET /api/v1/metrics/realtime
 * Real-time operations data
 */
app.get('/api/v1/metrics/realtime', authenticateRequest, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const serviceType = req.query.service_type;
    const status = req.query.status;

    // Real-time data shouldn't be cached
    let query = supabase
      .from('api_usage')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (serviceType && serviceType !== 'all') {
      query = query.eq('service_type', serviceType);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(addMetadata(data, { 
      cached: false, 
      source: 'realtime',
      freshness: 'live' 
    }));
  } catch (err) {
    handleError(res, err, { path: '/api/v1/metrics/realtime' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DATA REFRESH
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/v1/refresh
 * Manually refresh materialized views
 */
app.post('/api/v1/refresh', authenticateRequest, requireAdmin, async (req, res) => {
  try {
    const identifier = req.analyticsService
      ? 'service'
      : (req.analyticsUser?.id || req.ip || 'anonymous');
    if (!enforceRefreshRateLimit(identifier)) {
      logger.warn('refresh_rate_limited', {
        actor: identifier,
        path: req.path,
        ip: req.ip,
      });
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait before refreshing again.'
      });
    }

    cache.flushAll();
    logger.info('cache_cleared', {
      actor: identifier,
      path: req.path,
    });

    // Refresh materialized views
    const { data, error } = await supabase.rpc('refresh_analytics_views');

    if (error) throw error;

    logger.info('materialized_views_refreshed', {
      actor: identifier,
      path: req.path,
      ip: req.ip,
      userId: req.analyticsUser?.id,
    });

    res.json({
      success: true,
      message: 'Views refreshed and cache cleared',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('materialized_view_refresh_failed', {
      error: err.message,
      path: req.path,
      userId: req.analyticsUser?.id,
      service: req.analyticsService || undefined,
    });
    return handleError(res, err, { path: req.path, userId: req.analyticsUser?.id });
  }
});

/**
 * GET /api/v1/metrics/health
 * Health score metrics
 */
app.get('/api/v1/metrics/health', authenticateRequest, async (req, res) => {
  try {
    const intervalMinutes = parseInt(req.query.interval) || 60;
    const cacheKey = `health_score_${intervalMinutes}`;

    const result = await cachedQuery(
      cacheKey,
      () => supabase.rpc('get_health_score', {
        interval_duration: `${intervalMinutes} minutes`,
      }),
      60
    );

    res.json(result);
  } catch (err) {
    handleError(res, err, { path: '/api/v1/metrics/health' });
  }
});

/**
 * GET /api/v1/segments/users
 * User segments data
 */
app.get('/api/v1/segments/users', authenticateRequest, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const cacheKey = `user_segments_${limit}`;

    const result = await cachedQuery(
      cacheKey,
      () => supabase
        .from('mv_user_segments')
        .select('*')
        .order('total_calls', { ascending: false })
        .limit(limit),
      60
    );

    res.json(result);
  } catch (err) {
    handleError(res, err, { path: '/api/v1/segments/users' });
  }
});

/**
 * GET /api/v1/revenue/plans
 * Revenue metrics by plan
 */
app.get('/api/v1/revenue/plans', authenticateRequest, async (req, res) => {
  try {
    const cacheKey = 'revenue_plans';

    const result = await cachedQuery(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('plan_name, is_active, current_month_cost, lifetime_cost, auto_renew');

        if (error) throw error;

        // Aggregate by plan
        const aggregated = (data || []).reduce((acc, row) => {
          if (!acc[row.plan_name]) {
            acc[row.plan_name] = {
              plan_name: row.plan_name,
              total_subscribers: 0,
              active_subscribers: 0,
              total_monthly_revenue: 0,
              avg_lifetime_value: 0,
              auto_renew_count: 0,
              auto_renew_pct: 0,
            };
          }
          acc[row.plan_name].total_subscribers++;
          if (row.is_active) {
            acc[row.plan_name].active_subscribers++;
            acc[row.plan_name].total_monthly_revenue += Number(row.current_month_cost || 0);
          }
          acc[row.plan_name].avg_lifetime_value += Number(row.lifetime_cost || 0);
          if (row.auto_renew) {
            acc[row.plan_name].auto_renew_count++;
          }
          return acc;
        }, {});

        // Calculate averages
        Object.values(aggregated).forEach((item) => {
          item.avg_lifetime_value = item.avg_lifetime_value / item.total_subscribers;
          item.auto_renew_pct = (item.auto_renew_count / item.total_subscribers) * 100;
        });

        return { data: Object.values(aggregated), error: null };
      },
      60
    );

    res.json(result);
  } catch (err) {
    handleError(res, err, { path: '/api/v1/revenue/plans' });
  }
});

/**
 * GET /api/v1/users/churn-risk
 * Users at risk of churning
 */
app.get('/api/v1/users/churn-risk', authenticateRequest, async (req, res) => {
  try {
    const minScore = parseInt(req.query.min_score) || 50;
    const cacheKey = `churn_risk_${minScore}`;

    const result = await cachedQuery(
      cacheKey,
      () => supabase.rpc('get_churn_risk_users', { min_score: minScore }),
      60
    );

    res.json(result);
  } catch (err) {
    handleError(res, err, { path: '/api/v1/users/churn-risk' });
  }
});

/**
 * GET /api/v1/cache/stats
 * Cache statistics
 */
app.get('/api/v1/cache/stats', authenticateRequest, requireAdmin, (req, res) => {
  const stats = cache.getStats();
  res.json({
    keys: cache.keys().length,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits / (stats.hits + stats.misses) || 0,
    keyList: cache.keys()
  });
});

/**
 * DELETE /api/v1/cache/:key
 * Clear specific cache key
 */
app.delete('/api/v1/cache/:key', authenticateRequest, requireAdmin, (req, res) => {
  const { key } = req.params;
  const deleted = cache.del(key);
  logger.info('cache_entry_removed', {
    key,
    deleted,
    actor: req.analyticsUser?.id || req.analyticsService || 'unknown',
  });
  res.json({
    success: deleted > 0,
    key,
    deleted
  });
});

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════

app.use((err, req, res, next) => {
  logger.error('unhandled_error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════

async function startServer(port = PORT) {
  return new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, () => {
      const address = httpServer.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      logger.info('gateway_started', {
        port: actualPort,
        environment: process.env.NODE_ENV || 'development',
      });
      resolve(actualPort);
    });
  });
}

async function stopServer() {
  return new Promise((resolve, reject) => {
    httpServer.close((err) => {
      if (err) {
        reject(err);
      } else {
        if (logStream) {
          logStream.end();
        }
        logger.info('gateway_stopped');
        resolve();
      }
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    logger.error('gateway_start_failed', { error: error.message });
    process.exit(1);
  });
}

export { app, httpServer, startServer, stopServer, supabase, logger };

export default httpServer;
