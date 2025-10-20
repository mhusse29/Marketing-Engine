#!/usr/bin/env node

/**
 * Comprehensive System Test
 * Tests all services for deployment readiness
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const TESTS = [];
let passed = 0;
let failed = 0;

// Color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';
const RESET = '\x1b[0m';

function log(msg, color = RESET) {
  console.log(`${color}${msg}${RESET}`);
}

function test(name, fn) {
  TESTS.push({ name, fn });
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════╗', BLUE);
  log('║     SINAIQ DASHBOARD - DEPLOYMENT TEST SUITE      ║', BLUE);
  log('╚════════════════════════════════════════════════════╝\n', BLUE);

  for (const { name, fn } of TESTS) {
    try {
      await fn();
      log(`✓ ${name}`, GREEN);
      passed++;
    } catch (error) {
      log(`✗ ${name}`, RED);
      log(`  Error: ${error.message}`, RED);
      failed++;
    }
  }

  log('\n' + '═'.repeat(52), BLUE);
  log(`Results: ${GREEN}${passed} passed${RESET} | ${failed > 0 ? RED : RESET}${failed} failed${RESET}`);
  log('═'.repeat(52) + '\n', BLUE);

  if (failed > 0) {
    log('❌ SYSTEM NOT READY FOR DEPLOYMENT', RED);
    process.exit(1);
  } else {
    log('✅ ALL TESTS PASSED - READY FOR DEPLOYMENT!', GREEN);
    process.exit(0);
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════

test('Environment variables are set', () => {
  if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL not set');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  if (!process.env.OPENAI_API_KEY && !process.env.MOCK_OPENAI) {
    throw new Error('OPENAI_API_KEY not set (and MOCK_OPENAI not enabled)');
  }
});

test('AI Gateway is running (port 8787)', async () => {
  const response = await fetch('http://localhost:8787/health');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error('Health check failed');
});

test('Analytics Gateway is running (port 8788)', async () => {
  const response = await fetch('http://localhost:8788/health');
  if (response.status === 404) {
    // /health endpoint might not exist, try metrics instead
    const metricsResponse = await fetch('http://localhost:8788/api/v1/metrics/daily?days=1');
    if (!metricsResponse.ok && metricsResponse.status !== 401) {
      throw new Error(`Analytics gateway not responding (HTTP ${metricsResponse.status})`);
    }
    return; // Gateway is running
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
});

test('Supabase connection works', async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data, error } = await supabase
    .from('api_usage')
    .select('id')
    .limit(1);
  
  if (error) throw new Error(error.message);
});

test('Analytics Gateway: Daily metrics endpoint', async () => {
  const response = await fetch('http://localhost:8788/api/v1/metrics/daily?days=7');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.data) throw new Error('No data returned');
});

test('Analytics Gateway: Executive metrics endpoint', async () => {
  const response = await fetch('http://localhost:8788/api/v1/metrics/executive?days=30');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.data) throw new Error('No data returned');
});

test('Analytics Gateway: Health score endpoint', async () => {
  const response = await fetch('http://localhost:8788/api/v1/metrics/health?interval=60');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.data) throw new Error('No data returned');
});

test('Analytics Gateway: Model usage endpoint', async () => {
  const response = await fetch('http://localhost:8788/api/v1/metrics/models');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.data) throw new Error('No data returned');
});

test('Analytics Gateway: Provider performance endpoint', async () => {
  const response = await fetch('http://localhost:8788/api/v1/metrics/providers');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.data) throw new Error('No data returned');
});

test('Analytics Gateway: Realtime usage endpoint', async () => {
  const response = await fetch('http://localhost:8788/api/v1/metrics/realtime?limit=10');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.data) throw new Error('No data returned');
});

test('AI Gateway: Has OpenAI configured', async () => {
  const response = await fetch('http://localhost:8787/health');
  const data = await response.json();
  if (!data.hasOpenAI && !process.env.MOCK_OPENAI) {
    throw new Error('OpenAI not configured');
  }
});

test('AI Gateway: Image providers available', async () => {
  const response = await fetch('http://localhost:8787/health');
  const data = await response.json();
  const providers = data.imageProviders || {};
  const available = Object.values(providers).some(v => v === true);
  if (!available) throw new Error('No image providers available');
});

test('AI Gateway: Video providers available', async () => {
  const response = await fetch('http://localhost:8787/health');
  const data = await response.json();
  const providers = data.videoProviders || {};
  const available = Object.values(providers).some(v => v === true);
  if (!available) throw new Error('No video providers available');
});

test('Database: api_usage table accessible', async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { error } = await supabase
    .from('api_usage')
    .select('count')
    .limit(1);
  
  if (error) throw new Error(error.message);
});

test('Database: user_subscriptions table accessible', async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { error } = await supabase
    .from('user_subscriptions')
    .select('count')
    .limit(1);
  
  if (error) throw new Error(error.message);
});

test('Database: Materialized views exist', async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { error } = await supabase
    .from('mv_daily_metrics')
    .select('count')
    .limit(1);
  
  if (error) throw new Error(error.message);
});

test('No API keys in backup files', async () => {
  // Check that sensitive files don't exist or don't contain real keys
  const fs = await import('fs');
  const files = ['.env.bak', '.env.backup', 'server/.env.bak', 'server/.env.backup'];
  
  for (const file of files) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('sk-') || content.includes('eyJ')) {
        throw new Error(`Real API keys found in ${file} - SECURITY RISK!`);
      }
    }
  }
});

// Run all tests
runTests().catch(error => {
  log(`\n❌ Test runner error: ${error.message}`, RED);
  process.exit(1);
});
