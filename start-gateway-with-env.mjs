#!/usr/bin/env node

/**
 * Gateway Starter with Environment
 * Loads .env and starts analytics gateway with proper env vars
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
const envPath = join(__dirname, '.env');
let envContent;
try {
  envContent = readFileSync(envPath, 'utf-8');
} catch (error) {
  console.error('❌ Error: .env file not found');
  console.error('Run: ./setup-analytics-auth.sh first');
  process.exit(1);
}

// Parse .env
const envVars = {};
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    envVars[key.trim()] = value;
  }
});

// Required variables
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ANALYTICS_GATEWAY_KEY'];
const missing = required.filter(key => !envVars[key] || envVars[key].includes('your_'));

if (missing.length > 0) {
  console.error('❌ Missing or unconfigured environment variables:');
  missing.forEach(key => console.error(`   • ${key}`));
  console.error('\nUpdate your .env file with real values');
  process.exit(1);
}

console.log('🔧 Environment Configuration:');
console.log(`   ✓ SUPABASE_URL: ${envVars.SUPABASE_URL}`);
console.log(`   ✓ ANALYTICS_GATEWAY_KEY: ${envVars.ANALYTICS_GATEWAY_KEY.slice(0, 16)}...`);
console.log(`   ✓ SUPABASE_SERVICE_ROLE_KEY: [hidden]`);
console.log('');

// Merge with process.env and start gateway
const gatewayEnv = {
  ...process.env,
  ...envVars,
  ANALYTICS_GATEWAY_PORT: envVars.ANALYTICS_GATEWAY_PORT || '8788',
  ANALYTICS_ALLOWED_ORIGINS: envVars.ANALYTICS_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176'
};

console.log('🚀 Starting Analytics Gateway...');
console.log(`   Port: ${gatewayEnv.ANALYTICS_GATEWAY_PORT}`);
console.log('');

const gatewayProcess = spawn('node', ['server/analyticsGateway.mjs'], {
  env: gatewayEnv,
  stdio: 'inherit'
});

gatewayProcess.on('error', (error) => {
  console.error('❌ Failed to start gateway:', error);
  process.exit(1);
});

gatewayProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Gateway exited with code ${code}`);
    process.exit(code);
  }
});

// Handle termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping gateway...');
  gatewayProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  gatewayProcess.kill('SIGTERM');
  process.exit(0);
});
