#!/usr/bin/env node
import 'dotenv/config';

const gatewayUrl = process.env.ANALYTICS_GATEWAY_URL || 'http://localhost:8788';
const token = process.env.ANALYTICS_HEALTH_TOKEN; // Optional Supabase JWT for auth

async function main() {
  try {
    const headers = new Headers();
    headers.set('Accept', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${gatewayUrl}/api/v1/status`, { headers });
    if (!response.ok) {
      console.error(JSON.stringify({
        level: 'error',
        message: 'health_endpoint_failed',
        status: response.status,
        url: `${gatewayUrl}/api/v1/status`,
      }));
      process.exit(2);
    }

    const body = await response.json();
    const payload = {
      level: body.status === 'operational' ? 'info' : 'warn',
      message: 'gateway_health',
      status: body.status,
      database: body.database,
      cache: body.cache,
      timestamp: body.timestamp,
    };

    console.log(JSON.stringify(payload));

    if (body.status !== 'operational') {
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'health_check_error',
      error: error.message,
    }));
    process.exit(2);
  }
}

main();
