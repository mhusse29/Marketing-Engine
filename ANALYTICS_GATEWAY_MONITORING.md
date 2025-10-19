# Analytics Gateway Monitoring & Observability

## 📊 **Structured Logging**

The gateway now emits **structured JSON logs** for all operations, making it easy to parse, filter, and analyze events.

---

## 🔍 **Log Format**

### **Base Structure**

Every log entry follows this format:

```json
{
  "level": "info|warn|error",
  "message": "event_type",
  "timestamp": "2025-10-19T05:04:00.866Z",
  ...additionalFields
}
```

### **Log Levels**

- **`info`** - Normal operations (requests, cache hits, connections)
- **`warn`** - Potential issues (rate limits, auth failures)
- **`error`** - Actual errors (crashes, query failures, unhandled exceptions)

---

## 📋 **Event Types**

### **HTTP Request Lifecycle**

#### **`request_completed`**

Logged after every HTTP request completes.

```json
{
  "level": "info",
  "message": "request_completed",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "method": "GET",
  "path": "/api/v1/metrics/executive",
  "statusCode": 200,
  "durationMs": 145,
  "userId": "a1b2c3d4-...",
  "service": true
}
```

**Fields:**
- `method` - HTTP verb (GET, POST, DELETE)
- `path` - Request path
- `statusCode` - HTTP status code (200, 401, 403, 500)
- `durationMs` - Request duration in milliseconds
- `userId` - Supabase user ID (if authenticated with JWT)
- `service` - `true` if authenticated with service key

**Query Examples:**

```bash
# All slow requests (>1 second)
cat gateway.log | jq -c 'select(.message == "request_completed" and .durationMs > 1000)'

# All failed requests
cat gateway.log | jq -c 'select(.message == "request_completed" and .statusCode >= 400)'

# Requests by specific user
cat gateway.log | jq -c 'select(.userId == "a1b2c3d4-...")'

# Average response time per endpoint
cat gateway.log | jq -s 'group_by(.path) | map({path: .[0].path, avg: (map(.durationMs) | add / length)})'
```

---

### **Authentication Events**

#### **`supabase_token_verification_failed`**

JWT validation failed (expired, invalid, or revoked).

```json
{
  "level": "warn",
  "message": "supabase_token_verification_failed",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "error": "JWT expired"
}
```

**Action:** Client should refresh their session.

---

#### **`request_authentication_failed`**

Request lacks valid credentials.

```json
{
  "level": "error",
  "message": "request_authentication_failed",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "error": "No authorization header"
}
```

**Action:** Ensure client sends `Authorization: Bearer <token>` header.

---

#### **`websocket_authentication_failed`**

WebSocket handshake authentication failed.

```json
{
  "level": "error",
  "message": "websocket_authentication_failed",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "error": "Invalid token"
}
```

**Action:** Client should refresh token and reconnect.

---

### **Cache Operations**

#### **`cache_hit`**

Data served from cache (fast response).

```json
{
  "level": "info",
  "message": "cache_hit",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "cacheKey": "executive_30"
}
```

**Monitoring:**
- High hit rate = good performance
- Low hit rate = may need cache tuning

---

#### **`cache_miss`**

Data fetched from database (slower response).

```json
{
  "level": "info",
  "message": "cache_miss",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "cacheKey": "executive_30"
}
```

**Query Examples:**

```bash
# Cache hit rate
cat gateway.log | jq -s '[.[] | select(.message | contains("cache"))] | group_by(.message) | map({type: .[0].message, count: length})'

# Most frequently missed cache keys
cat gateway.log | jq -s '[.[] | select(.message == "cache_miss")] | group_by(.cacheKey) | map({key: .[0].cacheKey, count: length}) | sort_by(.count) | reverse'
```

---

#### **`cache_cleared`**

All cache entries flushed (manual refresh).

```json
{
  "level": "info",
  "message": "cache_cleared",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "actor": "a1b2c3d4-...",
  "path": "/api/v1/refresh"
}
```

**Fields:**
- `actor` - User ID or `'service'` if backend triggered

---

#### **`cache_entry_removed`**

Specific cache key deleted.

```json
{
  "level": "info",
  "message": "cache_entry_removed",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "key": "executive_30",
  "deleted": 1,
  "actor": "a1b2c3d4-..."
}
```

**Fields:**
- `deleted` - Number of keys removed (1 = success, 0 = not found)

---

### **Materialized View Refresh**

#### **`materialized_views_refreshed`**

Views successfully refreshed.

```json
{
  "level": "info",
  "message": "materialized_views_refreshed",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "actor": "a1b2c3d4-...",
  "path": "/api/v1/refresh",
  "ip": "127.0.0.1",
  "userId": "a1b2c3d4-..."
}
```

**Audit Trail:**
- `actor` - Who triggered the refresh
- `ip` - Source IP address
- `userId` - Supabase user ID

---

#### **`materialized_view_refresh_failed`**

View refresh encountered an error.

```json
{
  "level": "error",
  "message": "materialized_view_refresh_failed",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "error": "Function public.refresh_analytics_views() does not exist",
  "path": "/api/v1/refresh",
  "userId": "a1b2c3d4-...",
  "service": false
}
```

**Action:** Check that database functions are deployed.

---

### **Rate Limiting**

#### **`refresh_rate_limited`**

User hit the manual refresh quota.

```json
{
  "level": "warn",
  "message": "refresh_rate_limited",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "actor": "a1b2c3d4-...",
  "path": "/api/v1/refresh",
  "ip": "127.0.0.1"
}
```

**Monitoring:**
- Frequent rate limits = potential abuse
- Track by `actor` to identify problematic users

**Query Example:**

```bash
# Users hitting rate limits most often
cat gateway.log | jq -s '[.[] | select(.message == "refresh_rate_limited")] | group_by(.actor) | map({actor: .[0].actor, count: length}) | sort_by(.count) | reverse'
```

---

### **WebSocket Lifecycle**

#### **`ws_subscription_start`**

Supabase real-time subscription started.

```json
{
  "level": "info",
  "message": "ws_subscription_start",
  "timestamp": "2025-10-19T05:04:00.866Z"
}
```

---

#### **`ws_subscription_status`**

Subscription status changed.

```json
{
  "level": "info",
  "message": "ws_subscription_status",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "status": "SUBSCRIBED"
}
```

**Statuses:**
- `SUBSCRIBED` - Connected to Supabase
- `CLOSED` - Disconnected from Supabase
- `CHANNEL_ERROR` - Subscription error

---

#### **`ws_client_connected`**

Client WebSocket connection established.

```json
{
  "level": "info",
  "message": "ws_client_connected",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "activeConnections": 5
}
```

**Monitoring:** Track concurrent connections.

---

#### **`ws_client_disconnected`**

Client WebSocket disconnected.

```json
{
  "level": "info",
  "message": "ws_client_disconnected",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "activeConnections": 4
}
```

---

#### **`ws_event_broadcast`**

Real-time event broadcasted to clients.

```json
{
  "level": "info",
  "message": "ws_event_broadcast",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "activeConnections": 5
}
```

**Monitoring:** Events per second = real-time activity level.

---

### **Error Handling**

#### **`gateway_error`**

General error in endpoint handler.

```json
{
  "level": "error",
  "message": "gateway_error",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "error": "Connection timeout",
  "path": "/api/v1/metrics/executive"
}
```

---

#### **`unhandled_error`**

Uncaught exception in Express middleware.

```json
{
  "level": "error",
  "message": "unhandled_error",
  "timestamp": "2025-10-19T05:04:00.866Z",
  "error": "Cannot read property 'data' of undefined",
  "stack": "Error: Cannot read property...\n    at ...",
  "path": "/api/v1/metrics/executive",
  "method": "GET"
}
```

**Critical:** These indicate bugs in the code.

---

## 📊 **Monitoring Queries**

### **Request Throughput**

```bash
# Requests per minute
cat gateway.log | jq -c 'select(.message == "request_completed")' | jq -r '.timestamp[0:16]' | uniq -c
```

### **Error Rate**

```bash
# Error percentage
cat gateway.log | jq -s '[.[] | select(.message == "request_completed")] | group_by(.statusCode >= 400) | map({status: (if .[0].statusCode >= 400 then "error" else "success" end), count: length})'
```

### **P95 Latency**

```bash
# 95th percentile response time
cat gateway.log | jq -s '[.[] | select(.message == "request_completed") | .durationMs] | sort | .[length * 95 / 100 | floor]'
```

### **Active Users**

```bash
# Unique users in last hour
cat gateway.log | jq -c 'select(.message == "request_completed" and .userId != null)' | jq -r '.userId' | sort | uniq | wc -l
```

### **Most Popular Endpoints**

```bash
# Request count by endpoint
cat gateway.log | jq -s '[.[] | select(.message == "request_completed")] | group_by(.path) | map({path: .[0].path, count: length}) | sort_by(.count) | reverse | .[0:10]'
```

### **Authentication Failures**

```bash
# Auth errors by type
cat gateway.log | jq -c 'select(.message | contains("authentication"))'
```

### **WebSocket Activity**

```bash
# WebSocket connection timeline
cat gateway.log | jq -c 'select(.message == "ws_client_connected" or .message == "ws_client_disconnected")' | jq -c '{time: .timestamp, event: .message, total: .activeConnections}'
```

---

## 🚀 **Production Integration**

### **1. Log Aggregation**

#### **Send to Datadog**

```javascript
// Add to gateway startup
const { createLogger, format, transports } = require('winston');
const DatadogWinston = require('datadog-winston');

const logger = createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    new DatadogWinston({
      apiKey: process.env.DATADOG_API_KEY,
      hostname: 'analytics-gateway',
      service: 'analytics-gateway',
      ddsource: 'nodejs'
    })
  ]
});
```

#### **Send to Elastic Stack**

```bash
# Filebeat configuration
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/analytics-gateway/*.log
    json.keys_under_root: true
    json.add_error_key: true

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "analytics-gateway-%{+yyyy.MM.dd}"
```

#### **Send to CloudWatch**

```bash
# Install AWS CloudWatch agent
npm install winston-cloudwatch

# Add to logger
const CloudWatchTransport = require('winston-cloudwatch');

logger.add(new CloudWatchTransport({
  logGroupName: '/analytics-gateway',
  logStreamName: 'application',
  awsRegion: 'us-east-1'
}));
```

---

### **2. Alerting Rules**

#### **High Error Rate**

```yaml
# Prometheus alert
- alert: HighErrorRate
  expr: |
    sum(rate(gateway_requests_total{status=~"5.."}[5m]))
    /
    sum(rate(gateway_requests_total[5m]))
    > 0.05
  for: 5m
  annotations:
    summary: "Error rate above 5% for 5 minutes"
```

#### **Slow Requests**

```yaml
- alert: SlowRequests
  expr: |
    histogram_quantile(0.95, gateway_request_duration_ms) > 1000
  for: 10m
  annotations:
    summary: "P95 latency above 1 second"
```

#### **Authentication Failures**

```bash
# Query logs every 5 minutes
cat gateway.log | jq -c 'select(.message | contains("authentication_failed"))' | wc -l

# Alert if >10 failures/minute
if [ $failures -gt 10 ]; then
  send_alert "High auth failure rate: $failures/min"
fi
```

---

### **3. Dashboards**

#### **Grafana Dashboard**

```json
{
  "dashboard": {
    "title": "Analytics Gateway",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "sum(rate(gateway_requests_total[5m])) by (path)"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "sum(rate(gateway_requests_total{status=~\"4..|5..\"}[5m]))"
        }]
      },
      {
        "title": "P95 Latency",
        "targets": [{
          "expr": "histogram_quantile(0.95, gateway_request_duration_ms)"
        }]
      },
      {
        "title": "Cache Hit Rate",
        "targets": [{
          "expr": "sum(rate(gateway_cache_hits[5m])) / (sum(rate(gateway_cache_hits[5m])) + sum(rate(gateway_cache_misses[5m])))"
        }]
      },
      {
        "title": "Active WebSocket Connections",
        "targets": [{
          "expr": "gateway_ws_connections"
        }]
      }
    ]
  }
}
```

---

### **4. Health Checks**

```bash
#!/bin/bash
# Health check script (run every minute)

GATEWAY_URL="http://localhost:8788"

# Check if gateway is running
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $GATEWAY_URL/health)

if [ "$STATUS" != "200" ]; then
  echo "Gateway is down! Status: $STATUS"
  # Restart gateway
  systemctl restart analytics-gateway
  # Send alert
  send_alert "Analytics gateway restarted (was down)"
fi

# Check response time
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" $GATEWAY_URL/health)
if (( $(echo "$RESPONSE_TIME > 1.0" | bc -l) )); then
  send_alert "Gateway slow: ${RESPONSE_TIME}s response time"
fi

# Check WebSocket
WS_CONNECTIONS=$(curl -s $GATEWAY_URL/api/v1/status | jq '.connections')
echo "Active WebSocket connections: $WS_CONNECTIONS"
```

---

## 🎯 **Key Metrics to Monitor**

### **Availability**
- ✅ Uptime %
- ✅ Failed health checks
- ✅ 5xx error rate

### **Performance**
- ✅ P50, P95, P99 latency
- ✅ Requests per second
- ✅ Cache hit rate

### **Security**
- ✅ Authentication failures
- ✅ Authorization denials (403)
- ✅ Rate limit triggers
- ✅ Suspicious IPs

### **Business Metrics**
- ✅ Active users
- ✅ Most popular endpoints
- ✅ Real-time event volume
- ✅ Manual refreshes per day

---

## 📝 **Log Rotation**

```bash
# /etc/logrotate.d/analytics-gateway
/var/log/analytics-gateway/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 node node
    sharedscripts
    postrotate
        systemctl reload analytics-gateway > /dev/null 2>&1 || true
    endscript
}
```

---

## ✅ **Summary**

With structured JSON logging, you now have:

✅ **Full audit trail** - Every request, auth attempt, and admin action logged  
✅ **Easy parsing** - JSON format works with jq, Elasticsearch, Datadog  
✅ **Security monitoring** - Track auth failures, rate limits, suspicious activity  
✅ **Performance insights** - Latency, cache efficiency, throughput  
✅ **Debugging** - Stack traces, error context, request metadata  
✅ **Compliance** - User actions tracked with timestamps and IPs  

Your analytics gateway is now **production-ready with enterprise observability**! 🎉📊
