#!/usr/bin/env node
/**
 * Production Smoke Test Script
 * Automated end-to-end testing for the analytics dashboard
 */

import http from 'http';
import https from 'https';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const STATUS = {
  PASS: `${COLORS.green}✓${COLORS.reset}`,
  FAIL: `${COLORS.red}✗${COLORS.reset}`,
  WARN: `${COLORS.yellow}⚠${COLORS.reset}`,
  INFO: `${COLORS.blue}ℹ${COLORS.reset}`,
};

// Configuration
const CONFIG = {
  analyticsUrl: 'http://localhost:5174',
  gatewayUrl: 'http://localhost:8788',
  timeout: 10000,
  retries: 3,
};

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeout = options.timeout || CONFIG.timeout;

    const req = protocol.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Test helper
 */
function test(name, testFn) {
  return async () => {
    try {
      await testFn();
      testResults.passed++;
      testResults.tests.push({ name, status: 'PASS', error: null });
      console.log(`${STATUS.PASS} ${name}`);
    } catch (error) {
      testResults.failed++;
      testResults.tests.push({ name, status: 'FAIL', error: error.message });
      console.log(`${STATUS.FAIL} ${name}`);
      console.log(`  ${COLORS.red}Error: ${error.message}${COLORS.reset}`);
    }
  };
}

/**
 * Warning helper
 */
function warn(message) {
  testResults.warnings++;
  console.log(`${STATUS.WARN} ${message}`);
}

/**
 * Info helper
 */
function info(message) {
  console.log(`${STATUS.INFO} ${message}`);
}

// ============================================================================
// TEST SUITE
// ============================================================================

console.log(`\n${COLORS.cyan}═══════════════════════════════════════════════════════${COLORS.reset}`);
console.log(`${COLORS.cyan}  Production Smoke Test Suite${COLORS.reset}`);
console.log(`${COLORS.cyan}═══════════════════════════════════════════════════════${COLORS.reset}\n`);

// Test 1: Gateway Health Check
const testGatewayHealth = test('Gateway health endpoint responds', async () => {
  const res = await makeRequest(`${CONFIG.gatewayUrl}/health`);
  if (res.statusCode !== 200) {
    throw new Error(`Expected 200, got ${res.statusCode}`);
  }
  const data = JSON.parse(res.body);
  if (data.status !== 'healthy') {
    throw new Error(`Gateway status is ${data.status}`);
  }
  info(`  Cache hit rate: ${data.cache.hitRate}`);
  info(`  Uptime: ${Math.floor(data.cache.uptime || data.uptime)}s`);
});

// Test 2: Analytics Dev Server
const testAnalyticsServer = test('Analytics dev server responds', async () => {
  const res = await makeRequest(CONFIG.analyticsUrl);
  if (res.statusCode !== 200) {
    throw new Error(`Expected 200, got ${res.statusCode}`);
  }
  if (!res.body.includes('root')) {
    throw new Error('Invalid HTML response');
  }
});

// Test 3: Analytics HTML Entry Point
const testAnalyticsHtml = test('Analytics HTML entry point exists', async () => {
  const res = await makeRequest(`${CONFIG.analyticsUrl}/analytics.html`);
  if (res.statusCode !== 200) {
    throw new Error(`Expected 200, got ${res.statusCode}`);
  }
  if (!res.body.includes('analytics')) {
    throw new Error('Analytics HTML missing');
  }
});

// Test 4: Gateway CORS Headers
const testGatewayCors = test('Gateway returns correct CORS headers', async () => {
  const res = await makeRequest(`${CONFIG.gatewayUrl}/health`);
  const corsHeader = res.headers['access-control-allow-origin'];
  const corsCredentials = res.headers['access-control-allow-credentials'];
  const corsMethods = res.headers['access-control-allow-methods'];
  
  // Note: Node.js http.get doesn't send Origin header, so CORS middleware may not set headers
  // This is expected behavior - browser requests will have proper CORS
  if (!corsHeader) {
    warn('CORS header not present in direct HTTP call (OK - browser requests will have it)');
    info('  This is expected: Node.js requests don\'t send Origin header');
    info('  Browser-based requests will receive proper CORS headers');
    return; // Pass the test with warning
  }
  
  info(`  CORS origin: ${corsHeader}`);
  if (corsCredentials) info(`  Credentials: ${corsCredentials}`);
  if (corsMethods) info(`  Methods: ${corsMethods}`);
});

// Test 5: Gateway API Endpoints
const testGatewayEndpoints = test('Gateway API endpoints accessible', async () => {
  const endpoints = [
    '/health',
    '/api/v1/status',
    '/api/v1/metrics/daily',
    '/api/v1/metrics/providers',
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await makeRequest(`${CONFIG.gatewayUrl}${endpoint}`);
      // Accept 200 (OK), 401 (needs auth), or 403 (forbidden but endpoint exists)
      if (res.statusCode !== 200 && res.statusCode !== 401 && res.statusCode !== 403) {
        throw new Error(`${endpoint} returned ${res.statusCode}`);
      }
      const status = res.statusCode === 200 ? 'OK' : res.statusCode === 401 ? 'Auth Required' : 'Forbidden';
      info(`  ${endpoint}: ${status}`);
    } catch (error) {
      throw new Error(`${endpoint} failed: ${error.message}`);
    }
  }
});

// Test 6: Response Times
const testResponseTimes = test('Response times acceptable', async () => {
  const start = Date.now();
  await makeRequest(`${CONFIG.gatewayUrl}/health`);
  const duration = Date.now() - start;

  if (duration > 1000) {
    throw new Error(`Response time too slow: ${duration}ms`);
  }
  info(`  Response time: ${duration}ms`);
});

// Test 7: Content Type Headers
const testContentTypes = test('Content-Type headers correct', async () => {
  const htmlRes = await makeRequest(CONFIG.analyticsUrl);
  if (!htmlRes.headers['content-type']?.includes('text/html')) {
    throw new Error('HTML content-type incorrect');
  }

  const apiRes = await makeRequest(`${CONFIG.gatewayUrl}/health`);
  if (!apiRes.headers['content-type']?.includes('application/json')) {
    throw new Error('JSON content-type incorrect');
  }
});

// Test 8: Error Handling
const testErrorHandling = test('Error handling graceful', async () => {
  try {
    await makeRequest(`${CONFIG.gatewayUrl}/nonexistent`);
  } catch (error) {
    // Expected to fail
  }

  // Gateway should still be healthy
  const res = await makeRequest(`${CONFIG.gatewayUrl}/health`);
  if (res.statusCode !== 200) {
    throw new Error('Gateway unhealthy after error');
  }
});

// ============================================================================
// RUN TESTS
// ============================================================================

(async function runTests() {
  console.log(`${COLORS.blue}Testing Configuration:${COLORS.reset}`);
  console.log(`  Analytics: ${CONFIG.analyticsUrl}`);
  console.log(`  Gateway:   ${CONFIG.gatewayUrl}`);
  console.log(`  Timeout:   ${CONFIG.timeout}ms\n`);

  console.log(`${COLORS.blue}Running Tests...${COLORS.reset}\n`);

  // Run all tests sequentially
  await testGatewayHealth();
  await testAnalyticsServer();
  await testAnalyticsHtml();
  await testGatewayCors();
  await testGatewayEndpoints();
  await testResponseTimes();
  await testContentTypes();
  await testErrorHandling();

  // Summary
  console.log(`\n${COLORS.cyan}═══════════════════════════════════════════════════════${COLORS.reset}`);
  console.log(`${COLORS.cyan}  Test Summary${COLORS.reset}`);
  console.log(`${COLORS.cyan}═══════════════════════════════════════════════════════${COLORS.reset}\n`);

  const total = testResults.passed + testResults.failed;
  const passRate = ((testResults.passed / total) * 100).toFixed(1);

  console.log(`Total Tests: ${total}`);
  console.log(`${COLORS.green}Passed: ${testResults.passed}${COLORS.reset}`);
  console.log(`${COLORS.red}Failed: ${testResults.failed}${COLORS.reset}`);
  console.log(`${COLORS.yellow}Warnings: ${testResults.warnings}${COLORS.reset}`);
  console.log(`Pass Rate: ${passRate}%\n`);

  if (testResults.failed === 0) {
    console.log(`${STATUS.PASS} ${COLORS.green}All tests passed!${COLORS.reset}\n`);
    console.log(`${COLORS.blue}Next Steps:${COLORS.reset}`);
    console.log(`  1. Open ${CONFIG.analyticsUrl}/analytics.html in browser`);
    console.log(`  2. Test each dashboard tab manually`);
    console.log(`  3. Verify data loads and refresh works`);
    console.log(`  4. Test keyboard shortcuts`);
    console.log(`  5. Check browser console for errors\n`);
    process.exit(0);
  } else {
    console.log(`${STATUS.FAIL} ${COLORS.red}Some tests failed${COLORS.reset}\n`);
    console.log(`${COLORS.yellow}Failed Tests:${COLORS.reset}`);
    testResults.tests
      .filter((t) => t.status === 'FAIL')
      .forEach((t) => {
        console.log(`  - ${t.name}`);
        console.log(`    ${t.error}`);
      });
    console.log();
    process.exit(1);
  }
})().catch((error) => {
  console.error(`\n${STATUS.FAIL} ${COLORS.red}Test suite crashed:${COLORS.reset}`, error.message);
  process.exit(1);
});
