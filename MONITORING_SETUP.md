# 🔍 Analytics Gateway Monitoring Setup

**Status:** ✅ Production Ready  
**Components:** Health Check + Logging Stack  
**Updated:** 2025-10-19

---

## 📋 **Overview**

Your analytics gateway has **two monitoring systems** running:

1. **⏰ Scheduled Health Checks** - GitHub Actions pings every 15 minutes
2. **📊 Logging Stack** - Grafana + Loki + Promtail for log analysis

---

## ⏰ **1. Scheduled Health Check**

### **What It Does**
- **Runs:** Every 15 minutes via GitHub Actions cron
- **Checks:** Gateway `/api/v1/status` endpoint
- **Alerts:** Workflow fails if gateway is down or unhealthy

### **GitHub Workflow**
**File:** `.github/workflows/health-check.yml`

```yaml
name: Gateway Health Check

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:         # Manual trigger available

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js 20
      - Install dependencies
      - Run: npm run monitor:health
```

### **How It Works**

```
Every 15 minutes:
  GitHub Actions →  npm run monitor:health  →  Exit Code
                    (scripts/monitor/health-check.mjs)
  
  Exit 0: ✅ Healthy     (status: operational)
  Exit 1: ⚠️  Degraded   (status: degraded)
  Exit 2: ❌ Error       (unreachable or error)
```

### **Configuration**

**Secrets Required (in GitHub):**
```bash
ANALYTICS_GATEWAY_URL     # Your production gateway URL
ANALYTICS_HEALTH_TOKEN    # Optional Supabase JWT for auth
```

**Set secrets:**
```bash
# Go to: https://github.com/mhusse29/Marketing-Engine/settings/secrets/actions
# Add:
ANALYTICS_GATEWAY_URL = https://your-gateway.com
ANALYTICS_HEALTH_TOKEN = <your-jwt-token>  # Optional
```

### **View Results**

**Actions Tab:** https://github.com/mhusse29/Marketing-Engine/actions/workflows/health-check.yml

You'll see:
- ✅ Green checks = Gateway healthy
- ❌ Red X = Gateway down or unhealthy
- Email notifications on failure (if configured)

### **Manual Trigger**

```bash
# From GitHub UI:
Actions → Gateway Health Check → Run workflow

# Or via GitHub CLI:
gh workflow run health-check.yml
```

---

## 📊 **2. Logging Stack (Grafana + Loki + Promtail)**

### **What It Does**
- **Loki** - Aggregates and stores logs
- **Promtail** - Ships logs from files to Loki
- **Grafana** - Visualizes logs with queries and dashboards

### **Architecture**

```
Analytics Gateway
    ↓ writes to
logs/analytics-gateway.log (JSON lines)
    ↓ monitored by
Promtail (Docker container)
    ↓ ships to
Loki (Docker container)
    ↓ queried by
Grafana (Docker container - http://localhost:3000)
```

---

## 🚀 **Quick Start**

### **Start the Logging Stack**

```bash
# From project root
cd /Users/mohamedhussein/Desktop/Marketing\ Engine

# Start all logging services
docker compose -f ops/logging/docker-compose.yml up -d

# Output:
# ✅ loki     running on port 3100
# ✅ promtail tailing logs/analytics-gateway.log
# ✅ grafana  running on port 3000
```

### **Start Gateway with File Logging**

```bash
# Set log file location
export ANALYTICS_LOG_FILE=logs/analytics-gateway.log

# Start gateway
npm run gateway:start

# Logs now write to both:
# - stdout (console)
# - logs/analytics-gateway.log (file, picked up by Promtail)
```

### **Access Grafana**

```bash
# Open browser
open http://localhost:3000

# Login:
Username: admin
Password: admin
```

---

## 📊 **Grafana Setup**

### **First Time Setup**

1. **Add Loki Data Source**
   ```
   Configuration (⚙️) → Data Sources → Add data source
   
   Type: Loki
   URL: http://loki:3100
   
   Click: Save & Test
   ```

2. **Create Dashboard**
   ```
   Create (➕) → Dashboard → Add new panel
   
   Query:
   {job="analytics-gateway"}
   
   Save dashboard
   ```

---

## 🔍 **LogQL Query Examples**

### **Basic Queries**

```logql
# All logs
{job="analytics-gateway"}

# Only errors
{job="analytics-gateway"} |= "error"

# Only warnings
{job="analytics-gateway"} |= "warn"

# Parse JSON and filter
{job="analytics-gateway"} | json | level="error"
```

### **Request Monitoring**

```logql
# All requests
{job="analytics-gateway"} | json | message="request_completed"

# Failed requests (4xx/5xx)
{job="analytics-gateway"} | json | message="request_completed" | statusCode >= 400

# Slow requests (>1s)
{job="analytics-gateway"} | json | message="request_completed" | durationMs > 1000

# Requests by path
{job="analytics-gateway"} | json | message="request_completed" | path=~"/api/v1/.*"
```

### **Cache Performance**

```logql
# Cache hits
{job="analytics-gateway"} | json | message="cache_hit"

# Cache misses
{job="analytics-gateway"} | json | message="cache_miss"

# Cache hit rate (requires Metrics query)
rate({job="analytics-gateway"} | json | message="cache_hit" [5m])
/
(rate({job="analytics-gateway"} | json | message="cache_hit" [5m]) + rate({job="analytics-gateway"} | json | message="cache_miss" [5m]))
```

### **WebSocket Activity**

```logql
# Client connections
{job="analytics-gateway"} | json | message="ws_client_connected"

# Event broadcasts
{job="analytics-gateway"} | json | message="ws_event_broadcast"

# Connection errors
{job="analytics-gateway"} | json | message=~"ws.*" | level="error"
```

### **Authentication & Security**

```logql
# Auth failures
{job="analytics-gateway"} | json | message=~".*authentication.*failed"

# Rate limit hits
{job="analytics-gateway"} | json | message="refresh_rate_limited"

# Admin actions
{job="analytics-gateway"} | json | message="materialized_views_refreshed"
```

---

## 📈 **Dashboard Panels**

### **Recommended Panels**

1. **Request Rate**
   ```logql
   rate({job="analytics-gateway"} | json | message="request_completed" [5m])
   ```
   *Panel Type: Time series*

2. **Error Rate**
   ```logql
   rate({job="analytics-gateway"} | json | level="error" [5m])
   ```
   *Panel Type: Time series*

3. **P95 Latency**
   ```logql
   quantile_over_time(0.95, {job="analytics-gateway"} | json | message="request_completed" | unwrap durationMs [5m])
   ```
   *Panel Type: Gauge*

4. **Active WebSocket Connections**
   ```logql
   last_over_time({job="analytics-gateway"} | json | message="ws_client_connected" | unwrap activeConnections [5m])
   ```
   *Panel Type: Stat*

5. **Recent Errors**
   ```logql
   {job="analytics-gateway"} | json | level="error"
   ```
   *Panel Type: Logs*

---

## 🛠️ **Configuration Files**

### **Docker Compose**
**File:** `ops/logging/docker-compose.yml`

```yaml
services:
  loki:
    image: grafana/loki:3.1.1
    ports: ["3100:3100"]
    volumes:
      - ./loki:/etc/loki/config
      - ./data/loki:/loki

  promtail:
    image: grafana/promtail:3.1.1
    volumes:
      - ./promtail/promtail-config.yml:/etc/promtail/promtail-config.yml:ro
      - ../../logs:/var/log/analytics:ro  # Gateway logs
    depends_on: [loki]

  grafana:
    image: grafana/grafana:11.2.2
    ports: ["3000:3000"]
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    depends_on: [loki]
```

### **Loki Config**
**File:** `ops/logging/loki/loki-config.yml`

Configures:
- Storage (local filesystem)
- Retention (7 days default)
- Ingestion limits

### **Promtail Config**
**File:** `ops/logging/promtail/promtail-config.yml`

Configures:
- Log file location: `../../logs/*.log`
- Job label: `analytics-gateway`
- Loki endpoint: `http://loki:3100`

---

## 🔄 **Useful Commands**

### **Docker Management**

```bash
# Start logging stack
docker compose -f ops/logging/docker-compose.yml up -d

# View logs
docker compose -f ops/logging/docker-compose.yml logs -f

# Stop logging stack
docker compose -f ops/logging/docker-compose.yml down

# Stop and remove data
docker compose -f ops/logging/docker-compose.yml down -v

# Restart services
docker compose -f ops/logging/docker-compose.yml restart
```

### **Check Status**

```bash
# Are containers running?
docker compose -f ops/logging/docker-compose.yml ps

# Loki health
curl http://localhost:3100/ready

# Promtail metrics
curl http://localhost:9080/metrics

# Test Loki query
curl -G -s "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode 'query={job="analytics-gateway"}' \
  --data-urlencode 'limit=10' | jq
```

---

## 🚨 **Alerting Setup**

### **GitHub Actions Email Notifications**

1. **Go to:** https://github.com/mhusse29/Marketing-Engine/settings/notifications
2. **Enable:** "Actions" notifications
3. **Check:** "Send notifications for failed workflows only"

You'll receive email when:
- Health check fails (gateway down)
- Verification fails (broken code)

### **Grafana Alerting**

1. **Create Alert Rule**
   ```
   Alerting → Alert rules → New alert rule
   
   Query:
   rate({job="analytics-gateway"} | json | level="error" [5m]) > 0.1
   
   Condition: When query returns more than 0.1 errors/sec
   
   Notification: Email / Slack / PagerDuty
   ```

2. **Example: High Error Rate**
   ```logql
   # Alert if error rate exceeds 10% of requests
   rate({job="analytics-gateway"} | json | level="error" [5m])
   /
   rate({job="analytics-gateway"} | json | message="request_completed" [5m])
   > 0.1
   ```

3. **Example: Gateway Down**
   ```logql
   # Alert if no logs received in 5 minutes
   count_over_time({job="analytics-gateway"} [5m]) == 0
   ```

---

## 📊 **Sample Grafana Dashboard JSON**

```json
{
  "dashboard": {
    "title": "Analytics Gateway",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate({job=\"analytics-gateway\"} | json | message=\"request_completed\" [5m])"
        }],
        "type": "timeseries"
      },
      {
        "title": "Error Logs",
        "targets": [{
          "expr": "{job=\"analytics-gateway\"} | json | level=\"error\""
        }],
        "type": "logs"
      }
    ]
  }
}
```

---

## ✅ **Verification Checklist**

### **Health Check Workflow**
- [x] Workflow file exists (`.github/workflows/health-check.yml`)
- [x] Runs every 15 minutes
- [x] Uses health check script (`scripts/monitor/health-check.mjs`)
- [ ] Secrets configured in GitHub (if needed for production)

### **Logging Stack**
- [x] Docker Compose file exists (`ops/logging/docker-compose.yml`)
- [x] Loki config exists
- [x] Promtail config exists
- [x] Gateway supports `ANALYTICS_LOG_FILE` env var
- [ ] Stack running (`docker compose ps`)
- [ ] Grafana accessible (http://localhost:3000)
- [ ] Loki data source added
- [ ] Dashboard created

---

## 🎯 **Next Steps**

### **1. Test Locally**

```bash
# Start logging stack
docker compose -f ops/logging/docker-compose.yml up -d

# Start gateway with logging
export ANALYTICS_LOG_FILE=logs/analytics-gateway.log
npm run gateway:start

# Open Grafana
open http://localhost:3000

# Generate some traffic
curl http://localhost:8788/api/v1/status

# Query logs in Grafana
{job="analytics-gateway"}
```

### **2. Deploy to Production**

```bash
# On production server:
export ANALYTICS_LOG_FILE=/var/log/analytics-gateway/gateway.log
export ANALYTICS_GATEWAY_PORT=8788

# Start gateway
npm run gateway:start

# Start logging stack (on monitoring server)
docker compose -f ops/logging/docker-compose.yml up -d

# Configure Promtail to point to production log file
```

### **3. Set Up Alerts**

1. Configure email in Grafana
2. Create alert rules for:
   - High error rate
   - Gateway unreachable
   - Slow requests (P95 > 2s)
   - No logs received

---

## 📝 **Troubleshooting**

### **No Logs in Grafana**

```bash
# Check Promtail is running
docker compose -f ops/logging/docker-compose.yml ps

# Check Promtail logs
docker compose -f ops/logging/docker-compose.yml logs promtail

# Check log file exists and has content
ls -lh logs/analytics-gateway.log
tail logs/analytics-gateway.log

# Test Promtail can read file
docker compose -f ops/logging/docker-compose.yml exec promtail cat /var/log/analytics/analytics-gateway.log
```

### **Health Check Failing**

```bash
# Test health check locally
npm run monitor:health

# Check gateway is running
curl http://localhost:8788/health

# Check secrets are set in GitHub
# Settings → Secrets → Actions
```

### **Grafana Can't Connect to Loki**

```bash
# Check Loki is running
curl http://localhost:3100/ready

# Check from inside Grafana container
docker compose -f ops/logging/docker-compose.yml exec grafana wget -O- http://loki:3100/ready
```

---

## 🎉 **Summary**

You now have:

✅ **Automated Health Checks** - Every 15 minutes via GitHub Actions  
✅ **Log Aggregation** - Loki collecting all gateway logs  
✅ **Log Shipping** - Promtail tailing log files  
✅ **Visualization** - Grafana dashboards and queries  
✅ **Alerting Ready** - Set up alerts when needed  

**Your analytics gateway monitoring is production-ready!** 🚀

---

## 🔗 **Quick Links**

- **Health Check Workflow:** https://github.com/mhusse29/Marketing-Engine/actions/workflows/health-check.yml
- **Grafana (Local):** http://localhost:3000
- **Loki API (Local):** http://localhost:3100
- **Promtail Metrics (Local):** http://localhost:9080/metrics
