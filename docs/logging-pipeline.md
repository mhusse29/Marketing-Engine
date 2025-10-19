# Logging Pipeline Setup

The analytics gateway emits structured JSON logs. To ship them into a collector:

## 1. Enable File Logging

Set `ANALYTICS_LOG_FILE` when starting the gateway:

```bash
mkdir -p logs
ANALYTICS_LOG_FILE=logs/analytics-gateway.log npm run gateway:start
```

## 2. Promtail + Loki + Grafana (Example)

### Local Stack (Docker Compose)

A full Loki/Promtail/Grafana stack is provided under `ops/logging/docker-compose.yml`.

1. Start the stack:
   ```bash
   docker compose -f ops/logging/docker-compose.yml up -d
   ```
2. Ensure the gateway writes logs into `logs/analytics-gateway.log` from the project root.
3. Visit Grafana at http://localhost:3000 (default credentials `admin` / `admin`).
4. Add Loki (`http://loki:3100`) as a data source and query `{job="analytics-gateway"}`.

## 3. Structured Fields

Every log entry includes:
- `level`
- `message`
- `timestamp`
- `method`, `path`, `statusCode` for HTTP requests
- `cacheKey`, `actor`, etc. for cache/refresh events

## 4. Alerting

Use Grafana/Loki alerts or your collector’s alerting system to watch for:
- `gateway_error` events
- High frequency of `refresh_rate_limited`
- Absence of `request_completed` (dead gateway)

## 5. Cloud Platforms

In AWS (ECS/EKS), you can skip the log file and rely on stdout: CloudWatch, Datadog, etc., can ingest container logs automatically.
