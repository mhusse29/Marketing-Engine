# Observability & Logging Guide

The analytics gateway emits structured JSON logs for every request, cache event, and real-time broadcast. By default logs go to stdout. To persist them for analysis or ship to a collector, set the `ANALYTICS_LOG_FILE` environment variable before starting the gateway:

```bash
export ANALYTICS_LOG_FILE=logs/analytics-gateway.log
npm run gateway:start
```

Each log entry contains:

- `level`: info, warn, or error
- `message`: semantic event name (e.g., `request_completed`, `cache_hit`)
- `timestamp`: ISO8601 string
- contextual fields (HTTP method, path, user id, cache key, etc.)

You can tail the log locally:

```bash
tail -f logs/analytics-gateway.log | jq
```

## Shipping Logs to Grafana / Loki (Example)

1. Install the Loki Docker stack (or your preferred log collector).
2. Pipe the log file to the collector. Example using `promtail`:
   ```yaml
   scrape_configs:
     - job_name: analytics-gateway
       static_configs:
         - targets: ['localhost']
           labels:
             job: analytics-gateway
             __path__: /absolute/path/to/logs/analytics-gateway.log
   ```
3. Start `promtail` and verify entries appear in Grafana.

Alternatively, you can forward stdout directly when running the gateway inside a container; most orchestrators (ECS, Kubernetes) will pick up the JSON logs automatically.

## Metrics & Alerts

The `/api/v1/status` endpoint returns a simple health document. You can run the provided health-check script (see `scripts/monitor/health-check.mjs`) via cron or your monitoring system to detect degraded or failed states.
