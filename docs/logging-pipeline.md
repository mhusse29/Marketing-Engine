# Logging Pipeline Setup

The analytics gateway emits structured JSON logs. To ship them into a collector:

## 1. Enable File Logging

Set `ANALYTICS_LOG_FILE` when starting the gateway:

```bash
ANALYTICS_LOG_FILE=/var/log/analytics-gateway.log npm run gateway:start
```

## 2. Promtail + Loki + Grafana (Example)

### Promtail Config (`promtail-config.yml`)
```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yml

clients:
  - url: http://localhost:3100/loki/api/v1/push

scrape_configs:
  - job_name: analytics-gateway
    static_configs:
      - targets: ['localhost']
        labels:
          job: analytics-gateway
          __path__: /var/log/analytics-gateway.log
```

Start Promtail pointing to this config and confirm logs show up in Grafana Loki.

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
