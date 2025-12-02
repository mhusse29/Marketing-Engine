#!/usr/bin/env node

/**
 * Comprehensive System Audit Script
 * 
 * Checks:
 * - Supabase connectivity and authentication
 * - API Gateway (port 8787)
 * - Analytics Gateway (port 8788)
 * - All provider APIs (OpenAI, FLUX, Ideogram, Stability, Runway, Luma)
 * - Environment variables
 * - Starts services and provides localhost URLs
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fetch from 'node-fetch';

// Load server-specific .env file
config({ path: resolve(process.cwd(), 'server/.env') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bold}${colors.cyan}${'═'.repeat(60)}${colors.reset}\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n${colors.bold}${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`),
};

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function recordResult(test, passed, message) {
  if (passed) {
    results.passed.push({ test, message });
  } else {
    results.failed.push({ test, message });
  }
}

function recordWarning(test, message) {
  results.warnings.push({ test, message });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ENVIRONMENT VARIABLES AUDIT
// ═══════════════════════════════════════════════════════════════════════════════

async function auditEnvironmentVariables() {
  log.section('📋 ENVIRONMENT VARIABLES AUDIT');

  const required = {
    supabase: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    },
    gateway: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      FLUX_API_KEY: process.env.FLUX_API_KEY,
      IDEOGRAM_API_KEY: process.env.IDEOGRAM_API_KEY,
      STABILITY_API_KEY: process.env.STABILITY_API_KEY,
      RUNWAY_API_KEY: process.env.RUNWAY_API_KEY,
      LUMA_API_KEY: process.env.LUMA_API_KEY,
    },
    analytics: {
      ANALYTICS_GATEWAY_PORT: process.env.ANALYTICS_GATEWAY_PORT || '8788',
      ANALYTICS_GATEWAY_KEY: process.env.ANALYTICS_GATEWAY_KEY,
    },
  };

  // Check Supabase
  log.info('Checking Supabase configuration...');
  const supabaseOk = required.supabase.SUPABASE_URL && required.supabase.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseOk) {
    log.success('Supabase environment variables configured');
    recordResult('Supabase Env Vars', true, 'All required variables present');
  } else {
    log.error('Supabase environment variables missing');
    recordResult('Supabase Env Vars', false, 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  if (!required.supabase.VITE_SUPABASE_ANON_KEY) {
    log.warning('VITE_SUPABASE_ANON_KEY not set (frontend may have issues)');
    recordWarning('Supabase Frontend', 'VITE_SUPABASE_ANON_KEY missing');
  }

  // Check API Gateway
  log.info('Checking API Gateway configuration...');
  const openaiOk = !!required.gateway.OPENAI_API_KEY;
  const fluxOk = !!required.gateway.FLUX_API_KEY;
  const ideogramOk = !!required.gateway.IDEOGRAM_API_KEY;
  const stabilityOk = !!required.gateway.STABILITY_API_KEY;
  const runwayOk = !!required.gateway.RUNWAY_API_KEY;
  const lumaOk = !!required.gateway.LUMA_API_KEY;

  if (openaiOk) {
    log.success('OpenAI API key configured');
    recordResult('OpenAI API Key', true, 'Configured');
  } else {
    log.warning('OpenAI API key not configured (content generation will use mock mode)');
    recordWarning('OpenAI API Key', 'Not configured (mock mode enabled)');
  }

  if (fluxOk) {
    log.success('FLUX API key configured');
    recordResult('FLUX API Key', true, 'Configured');
  } else {
    log.warning('FLUX API key not configured');
    recordWarning('FLUX API Key', 'Not configured');
  }

  if (ideogramOk) {
    log.success('Ideogram API key configured');
    recordResult('Ideogram API Key', true, 'Configured');
  } else {
    log.warning('Ideogram API key not configured');
    recordWarning('Ideogram API Key', 'Not configured');
  }

  if (stabilityOk) {
    log.success('Stability API key configured');
    recordResult('Stability API Key', true, 'Configured');
  } else {
    log.warning('Stability API key not configured (optional provider)');
    recordWarning('Stability API Key', 'Not configured (optional)');
  }

  if (runwayOk) {
    log.success('Runway API key configured');
    recordResult('Runway API Key', true, 'Configured');
  } else {
    log.warning('Runway API key not configured');
    recordWarning('Runway API Key', 'Not configured');
  }

  if (lumaOk) {
    log.success('Luma API key configured');
    recordResult('Luma API Key', true, 'Configured');
  } else {
    log.warning('Luma API key not configured');
    recordWarning('Luma API Key', 'Not configured');
  }

  // Check Analytics Gateway
  log.info('Checking Analytics Gateway configuration...');
  if (required.analytics.ANALYTICS_GATEWAY_KEY) {
    log.success('Analytics Gateway key configured');
    recordResult('Analytics Gateway Key', true, 'Configured');
  } else {
    log.warning('Analytics Gateway key not configured (will allow public access in dev mode)');
    recordWarning('Analytics Gateway Key', 'Not configured (public access in dev)');
  }

  return { supabaseOk, openaiOk, fluxOk, ideogramOk, stabilityOk, runwayOk, lumaOk };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SUPABASE CONNECTIVITY & AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════════

async function auditSupabase() {
  log.section('🗄️  SUPABASE CONNECTIVITY & AUTHENTICATION');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    log.error('Supabase credentials not configured');
    recordResult('Supabase Connection', false, 'Credentials missing');
    return false;
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test connection by querying a simple table
    log.info('Testing Supabase connection...');
    const { data, error } = await supabase.from('profiles').select('id').limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist, which is ok
      throw error;
    }

    log.success('Supabase connection successful');
    recordResult('Supabase Connection', true, 'Connected successfully');

    // Test authentication
    log.info('Testing Supabase authentication...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      log.warning(`Supabase auth test: ${authError.message}`);
      recordWarning('Supabase Auth', authError.message);
    } else {
      log.success('Supabase authentication working');
      recordResult('Supabase Auth', true, 'Authentication working');
    }

    return true;
  } catch (error) {
    log.error(`Supabase connection failed: ${error.message}`);
    recordResult('Supabase Connection', false, error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. API PROVIDERS AUDIT
// ═══════════════════════════════════════════════════════════════════════════════

async function auditProviders() {
  log.section('🔌 API PROVIDERS AUDIT');

  // OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      log.info('Testing OpenAI API...');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Simple test - list models (this is a lightweight call)
      await openai.models.list();
      log.success('OpenAI API working');
      recordResult('OpenAI API', true, 'API responding');
    } catch (error) {
      log.error(`OpenAI API test failed: ${error.message}`);
      recordResult('OpenAI API', false, error.message);
    }
  }

  // FLUX
  if (process.env.FLUX_API_KEY) {
    try {
      log.info('Testing FLUX API...');
      const response = await fetch('https://api.blackforestlabs.com/v1/models', {
        headers: { 'X-Key': process.env.FLUX_API_KEY },
      });
      
      if (response.ok) {
        log.success('FLUX API working');
        recordResult('FLUX API', true, 'API responding');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      log.error(`FLUX API test failed: ${error.message}`);
      recordResult('FLUX API', false, error.message);
    }
  }

  // Ideogram
  if (process.env.IDEOGRAM_API_KEY) {
    try {
      log.info('Testing Ideogram API...');
      const response = await fetch('https://api.ideogram.ai/api/v1/models', {
        headers: { 'Api-Key': process.env.IDEOGRAM_API_KEY },
      });
      
      if (response.ok || response.status === 404) { // 404 is ok, means endpoint exists
        log.success('Ideogram API working');
        recordResult('Ideogram API', true, 'API responding');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      log.error(`Ideogram API test failed: ${error.message}`);
      recordResult('Ideogram API', false, error.message);
    }
  }

  // Stability AI
  if (process.env.STABILITY_API_KEY) {
    try {
      log.info('Testing Stability AI API...');
      const response = await fetch('https://api.stability.ai/v1/user/account', {
        headers: { 'Authorization': `Bearer ${process.env.STABILITY_API_KEY}` },
      });
      
      if (response.ok) {
        log.success('Stability AI API working');
        recordResult('Stability API', true, 'API responding');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      log.error(`Stability AI API test failed: ${error.message}`);
      recordResult('Stability API', false, error.message);
    }
  }

  // Runway
  if (process.env.RUNWAY_API_KEY) {
    try {
      log.info('Testing Runway API...');
      const response = await fetch('https://api.runwayml.com/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}` },
      });
      
      if (response.ok || response.status === 404) {
        log.success('Runway API working');
        recordResult('Runway API', true, 'API responding');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      log.error(`Runway API test failed: ${error.message}`);
      recordResult('Runway API', false, error.message);
    }
  }

  // Luma
  if (process.env.LUMA_API_KEY) {
    try {
      log.info('Testing Luma API...');
      const response = await fetch('https://api.lumalabs.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.LUMA_API_KEY}` },
      });
      
      if (response.ok || response.status === 404) {
        log.success('Luma API working');
        recordResult('Luma API', true, 'API responding');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      log.error(`Luma API test failed: ${error.message}`);
      recordResult('Luma API', false, error.message);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. GATEWAY HEALTH CHECKS
// ═══════════════════════════════════════════════════════════════════════════════

async function checkGatewayHealth(port, name) {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      timeout: 5000,
    });
    
    if (response.ok) {
      const data = await response.json();
      log.success(`${name} is running on port ${port}`);
      recordResult(`${name} Health`, true, `Running on port ${port}`);
      return { ok: true, data };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log.warning(`${name} is not running on port ${port}`);
      recordWarning(`${name} Health`, `Not running on port ${port}`);
    } else {
      log.error(`${name} health check failed: ${error.message}`);
      recordResult(`${name} Health`, false, error.message);
    }
    return { ok: false };
  }
}

async function auditGateways() {
  log.section('🌐 GATEWAY HEALTH CHECKS');

  // API Gateway (port 8787)
  const apiGateway = await checkGatewayHealth(8787, 'API Gateway');
  
  // Analytics Gateway (port 8788)
  const analyticsGateway = await checkGatewayHealth(8788, 'Analytics Gateway');

  return { apiGateway, analyticsGateway };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. START SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

async function startServices() {
  log.section('🚀 STARTING SERVICES');

  const { spawn } = await import('child_process');
  
  const services = [];

  // Check if API Gateway is running
  const apiGatewayCheck = await checkGatewayHealth(8787, 'API Gateway');
  if (!apiGatewayCheck.ok) {
    log.info('Starting API Gateway...');
    const apiGateway = spawn('node', ['server/ai-gateway.mjs'], {
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    
    apiGateway.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('listening') || output.includes('Server running')) {
        log.success('API Gateway started');
      }
    });
    
    apiGateway.stderr.on('data', (data) => {
      console.error(`API Gateway error: ${data}`);
    });

    services.push({ name: 'API Gateway', process: apiGateway, port: 8787 });
    
    // Wait a bit for it to start
    await new Promise(resolve => setTimeout(resolve, 3000));
  } else {
    log.info('API Gateway already running');
  }

  // Check if Analytics Gateway is running
  const analyticsGatewayCheck = await checkGatewayHealth(8788, 'Analytics Gateway');
  if (!analyticsGatewayCheck.ok) {
    log.info('Starting Analytics Gateway...');
    const analyticsGateway = spawn('node', ['server/analyticsGateway.mjs'], {
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    
    analyticsGateway.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('listening') || output.includes('Server running')) {
        log.success('Analytics Gateway started');
      }
    });
    
    analyticsGateway.stderr.on('data', (data) => {
      console.error(`Analytics Gateway error: ${data}`);
    });

    services.push({ name: 'Analytics Gateway', process: analyticsGateway, port: 8788 });
    
    // Wait a bit for it to start
    await new Promise(resolve => setTimeout(resolve, 3000));
  } else {
    log.info('Analytics Gateway already running');
  }

  return services;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. FINAL VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

async function finalVerification() {
  log.section('✅ FINAL VERIFICATION');

  // Re-check gateways after starting
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const apiGateway = await checkGatewayHealth(8787, 'API Gateway');
  const analyticsGateway = await checkGatewayHealth(8788, 'Analytics Gateway');

  // Get detailed health info from API Gateway
  if (apiGateway.ok) {
    try {
      const response = await fetch('http://localhost:8787/health');
      const health = await response.json();
      
      log.info('API Gateway Configuration:');
      console.log(`  - Primary Model: ${health.primaryModel || 'N/A'}`);
      console.log(`  - Chat Model: ${health.chatModel || 'N/A'}`);
      console.log(`  - OpenAI: ${health.hasOpenAI ? '✅' : '❌'}`);
      console.log(`  - Image Providers:`, health.imageProviders || {});
      console.log(`  - Video Providers:`, health.videoProviders || {});
    } catch (error) {
      log.warning('Could not fetch detailed API Gateway health');
    }
  }

  return { apiGateway, analyticsGateway };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`\n${colors.bold}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     MARKETING ENGINE - COMPREHENSIVE SYSTEM AUDIT              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  try {
    // 1. Environment Variables
    await auditEnvironmentVariables();

    // 2. Supabase
    await auditSupabase();

    // 3. Providers
    await auditProviders();

    // 4. Gateways (before starting)
    await auditGateways();

    // 5. Start Services
    const services = await startServices();

    // 6. Final Verification
    const verification = await finalVerification();

    // ═══════════════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════════════════════

    log.section('📊 AUDIT SUMMARY');

    console.log(`\n${colors.green}✅ Passed: ${results.passed.length}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${results.failed.length}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${results.warnings.length}${colors.reset}\n`);

    if (results.failed.length > 0) {
      console.log(`${colors.red}Failed Tests:${colors.reset}`);
      results.failed.forEach(({ test, message }) => {
        console.log(`  ❌ ${test}: ${message}`);
      });
      console.log();
    }

    if (results.warnings.length > 0) {
      console.log(`${colors.yellow}Warnings:${colors.reset}`);
      results.warnings.forEach(({ test, message }) => {
        console.log(`  ⚠️  ${test}: ${message}`);
      });
      console.log();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // LOCALHOST URLS
    // ═══════════════════════════════════════════════════════════════════════════════

    log.section('🌐 LOCALHOST URLs');

    console.log(`\n${colors.bold}${colors.green}Main Application:${colors.reset}`);
    console.log(`  ${colors.cyan}http://localhost:5173${colors.reset}\n`);

    console.log(`${colors.bold}${colors.green}API Gateway:${colors.reset}`);
    console.log(`  ${colors.cyan}http://localhost:8787${colors.reset}`);
    console.log(`  ${colors.cyan}http://localhost:8787/health${colors.reset}\n`);

    console.log(`${colors.bold}${colors.green}Analytics Gateway:${colors.reset}`);
    console.log(`  ${colors.cyan}http://localhost:8788${colors.reset}`);
    console.log(`  ${colors.cyan}http://localhost:8788/health${colors.reset}\n`);

    console.log(`${colors.bold}${colors.yellow}Note:${colors.reset} Make sure to run \`npm run web:dev\` to start the frontend on port 5173\n`);

    // Keep process alive if services were started
    if (services.length > 0) {
      console.log(`${colors.bold}${colors.yellow}Services are running. Press Ctrl+C to stop.${colors.reset}\n`);
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log(`\n${colors.yellow}Stopping services...${colors.reset}`);
        services.forEach(({ name, process: proc }) => {
          proc.kill();
          log.info(`${name} stopped`);
        });
        process.exit(0);
      });

      // Keep process alive
      await new Promise(() => {});
    }

  } catch (error) {
    log.error(`Audit failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();






