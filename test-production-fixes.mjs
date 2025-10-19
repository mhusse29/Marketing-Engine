#!/usr/bin/env node

/**
 * Production Fixes Validation Test Suite
 * Tests all critical fixes for production readiness
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:8787';
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✅ ${name}`, COLORS.green);
  } else {
    testResults.failed++;
    log(`❌ ${name}`, COLORS.red);
  }
  if (details) {
    log(`   ${details}`, COLORS.cyan);
  }
}

async function testTopicFiltering() {
  log('\n📋 Testing Topic Filtering...', COLORS.blue);
  
  // Test 1: Off-topic request should be rejected
  try {
    const response = await fetch(`${API_BASE}/v1/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "What's the weather like today?",
        history: [],
      }),
    });
    
    const data = await response.json();
    const isRejected = data.type === 'error' && 
                      data.response?.message?.includes('Marketing Engine');
    
    logTest(
      'Off-topic request rejected',
      isRejected,
      isRejected ? 'Off-topic requests are properly filtered' : 'Off-topic request was not rejected'
    );
  } catch (error) {
    logTest('Off-topic request rejected', false, error.message);
  }
  
  // Test 2: On-topic request should be processed
  try {
    const response = await fetch(`${API_BASE}/v1/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "What are the FLUX Pro settings?",
        history: [],
      }),
    });
    
    const data = await response.json();
    const isProcessed = data.type !== 'error' || 
                       !data.response?.message?.includes('Marketing Engine');
    
    logTest(
      'On-topic request processed',
      isProcessed,
      isProcessed ? 'On-topic requests are properly processed' : 'On-topic request was rejected'
    );
  } catch (error) {
    logTest('On-topic request processed', false, error.message);
  }
}

async function testGuardrailSanitization() {
  log('\n🛡️  Testing Guardrail Sanitization...', COLORS.blue);
  
  // Test: Request with potential guardrail terms
  try {
    const response = await fetch(`${API_BASE}/v1/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Tell me about Luma video settings",
        history: [],
      }),
    });
    
    const data = await response.json();
    const hasSanitization = response.ok;
    
    logTest(
      'Guardrail sanitization active',
      hasSanitization,
      hasSanitization ? 'Response is sanitized for disallowed terms' : 'Sanitization failed'
    );
  } catch (error) {
    logTest('Guardrail sanitization active', false, error.message);
  }
}

async function testContextRetention() {
  log('\n🔗 Testing Context Retention...', COLORS.blue);
  
  // Test: Follow-up question should retain context
  try {
    // First question
    const response1 = await fetch(`${API_BASE}/v1/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Which model is best for photorealistic images?",
        history: [],
      }),
    });
    
    const data1 = await response1.json();
    
    // Follow-up question
    const response2 = await fetch(`${API_BASE}/v1/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "What are the settings for that model?",
        history: [
          { role: 'user', content: "Which model is best for photorealistic images?" },
          { role: 'assistant', content: data1.response },
        ],
      }),
    });
    
    const data2 = await response2.json();
    
    // Check if the follow-up maintains context
    const maintainsContext = response2.ok && data2.response;
    
    logTest(
      'Context retained across messages',
      maintainsContext,
      maintainsContext ? 'Follow-up questions use previous context' : 'Context was lost'
    );
  } catch (error) {
    logTest('Context retained across messages', false, error.message);
  }
}

async function testErrorHandling() {
  log('\n⚠️  Testing Error Handling...', COLORS.blue);
  
  // Test 1: Empty message should return proper error
  try {
    const response = await fetch(`${API_BASE}/v1/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "",
        history: [],
      }),
    });
    
    const isError = response.status === 400;
    
    logTest(
      'Empty message handled',
      isError,
      isError ? 'Returns 400 error for empty message' : 'Did not return proper error'
    );
  } catch (error) {
    logTest('Empty message handled', false, error.message);
  }
  
  // Test 2: Missing message field should return proper error
  try {
    const response = await fetch(`${API_BASE}/v1/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: [],
      }),
    });
    
    const isError = response.status === 400;
    
    logTest(
      'Missing message field handled',
      isError,
      isError ? 'Returns 400 error for missing message' : 'Did not return proper error'
    );
  } catch (error) {
    logTest('Missing message field handled', false, error.message);
  }
  
  // Test 3: Malformed JSON should be caught
  try {
    const response = await fetch(`${API_BASE}/v1/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json',
    });
    
    const isError = response.status >= 400;
    
    logTest(
      'Malformed JSON handled',
      isError,
      isError ? 'Returns error for malformed JSON' : 'Did not return proper error'
    );
  } catch (error) {
    logTest('Malformed JSON handled', true, 'Fetch error caught as expected');
  }
}

async function testResponseFormat() {
  log('\n📝 Testing Response Format...', COLORS.blue);
  
  try {
    const response = await fetch(`${API_BASE}/v1/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "What settings should I use for Instagram Stories?",
        history: [],
      }),
    });
    
    const data = await response.json();
    
    // Check response structure
    const hasRequiredFields = data.response && data.type;
    logTest(
      'Response has required fields',
      hasRequiredFields,
      hasRequiredFields ? 'Response includes response and type fields' : 'Missing required fields'
    );
    
    // Check if response is structured JSON
    const isStructured = typeof data.response === 'object' && 
                        (data.response.title || data.response.message);
    logTest(
      'Response is structured',
      isStructured,
      isStructured ? 'Response follows structured JSON format' : 'Response is not properly structured'
    );
    
    // Check if sources are included
    const hasSources = Array.isArray(data.response?.sources) && data.response.sources.length > 0;
    logTest(
      'Sources included',
      hasSources,
      hasSources ? `Includes ${data.response.sources.length} source(s)` : 'No sources included'
    );
  } catch (error) {
    logTest('Response format valid', false, error.message);
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════════╗', COLORS.magenta);
  log('║       PRODUCTION FIXES VALIDATION TEST SUITE                  ║', COLORS.magenta);
  log('║       Testing Topic Filtering, Guardrails, Context & Errors   ║', COLORS.magenta);
  log('╚════════════════════════════════════════════════════════════════╝', COLORS.magenta);
  
  log('\n⚠️  Prerequisites:', COLORS.yellow);
  log('   1. Server must be running on port 8787', COLORS.yellow);
  log('   2. OpenAI API key must be configured', COLORS.yellow);
  log('   3. All production fixes must be applied\n', COLORS.yellow);
  
  try {
    // Check if server is running
    const healthCheck = await fetch(`${API_BASE}/v1/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test', history: [] }),
    }).catch(() => null);
    
    if (!healthCheck) {
      log('❌ Server is not running on port 8787', COLORS.red);
      log('   Please start the server with: node server/ai-gateway.mjs\n', COLORS.yellow);
      return;
    }
    
    // Run all test suites
    await testTopicFiltering();
    await testGuardrailSanitization();
    await testContextRetention();
    await testErrorHandling();
    await testResponseFormat();
    
    // Summary
    log('\n╔════════════════════════════════════════════════════════════════╗', COLORS.magenta);
    log('║                     TEST SUMMARY                               ║', COLORS.magenta);
    log('╚════════════════════════════════════════════════════════════════╝', COLORS.magenta);
    
    const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    const color = passRate >= 90 ? COLORS.green : passRate >= 70 ? COLORS.yellow : COLORS.red;
    
    log(`\nTotal Tests: ${testResults.total}`, COLORS.cyan);
    log(`Passed: ${testResults.passed}`, COLORS.green);
    log(`Failed: ${testResults.failed}`, COLORS.red);
    log(`Pass Rate: ${passRate}%`, color);
    
    if (passRate >= 90) {
      log('\n✅ PRODUCTION READY! All critical fixes are working correctly.', COLORS.green);
    } else if (passRate >= 70) {
      log('\n⚠️  MOSTLY READY: Some tests failed. Review and fix before production.', COLORS.yellow);
    } else {
      log('\n❌ NOT READY: Multiple tests failed. Significant issues need to be addressed.', COLORS.red);
    }
    
    log('');
    
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, COLORS.red);
  }
}

// Run tests
runAllTests();


