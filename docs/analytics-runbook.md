# Analytics Command Center Runbook

## Authentication & Authorization

- **Gateway Auth**: Every HTTP and WebSocket request must include a valid Supabase access token. Optionally, backend services may use `ANALYTICS_GATEWAY_KEY`.
- **Admin Operations**: Manual refresh and cache APIs require an `admin` role (stored in `app_metadata.roles`).
- **Rate Limits**: `/api/v1/refresh` is limited to 3 calls per minute per actor. Exceeding the limit returns HTTP 429 and logs `refresh_rate_limited`.

## Routine Operations

### Manual Data Refresh
1. Ensure you are logged in with an admin role.
2. Use the dashboard “Refresh Data” button *or* call:
   ```bash
   curl -X POST "https://<gateway>/api/v1/refresh" \
     -H "Authorization: Bearer <SUPABASE_JWT>"
   ```
3. The gateway logs `cache_cleared` and `materialized_views_refreshed` along with the actor id.

### Cache Management
- Inspect cache stats:
  ```bash
  curl "https://<gateway>/api/v1/cache/stats" \
    -H "Authorization: Bearer <ADMIN_JWT>"
  ```
- Remove a cache key:
  ```bash
  curl -X DELETE "https://<gateway>/api/v1/cache/daily_metrics_30" \
    -H "Authorization: Bearer <ADMIN_JWT>"
  ```

## Incident Response

1. **Verify Gateway Health**
   ```bash
   curl "https://<gateway>/api/v1/status" \
     -H "Authorization: Bearer <JWT>"
   ```
   - `status: degraded` indicates Supabase connectivity issues.
2. **Check Logs**
   - Tail structured logs: `tail -f logs/analytics-gateway.log | jq`.
   - Look for `gateway_error`, `refresh_rate_limited`, or WebSocket warnings.
3. **Session Issues**
   - Unauthorized errors in the UI prompt a re-login. After signing in, the dashboard auto-refreshes tokens.
4. **Refresh Failures**
   - If `/refresh` ceases to work, inspect `materialized_view_refresh_failed` log entries and Supabase function health.

## Developer Notes

- Run lint + tests before committing:
  ```bash
  npm run verify
  ```
- Gateway auth tests:
  ```bash
  npm test       # runs node --test tests/
  ```
- Start the gateway locally with file logging:
  ```bash
  ANALYTICS_LOG_FILE=logs/gateway.log npm run gateway:dev
  ```

## Monitoring Script

`scripts/monitor/health-check.mjs` can be scheduled (cron, GitHub Actions) to alert on degraded or failed health responses. Exit codes:
- `0`: healthy
- `1`: degraded
- `2`: error/unreachable

> GitHub Actions: `.github/workflows/health-check.yml` runs every 15 minutes using `ANALYTICS_GATEWAY_URL` and `ANALYTICS_HEALTH_TOKEN` secrets.

### Alerting
- **Slack:** Set `SLACK_WEBHOOK_URL` in GitHub repository secrets (Slack → Integrations → Incoming Webhook).
- **Email:** Provide `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `ALERT_EMAIL`, and `ALERT_FROM` secrets. The workflow sends a message whenever the health check fails.
