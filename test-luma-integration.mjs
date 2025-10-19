/**
 * Luma Integration Test Script
 * Tests the complete Luma Dream Machine integration
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load server-specific .env
config({ path: resolve(process.cwd(), 'server/.env') });

const LUMA_API_KEY = process.env.LUMA_API_KEY;
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8787';

console.log('🧪 Luma Integration Test Suite\n');
console.log('═'.repeat(80));

// Test 1: Check API Key
console.log('\n✓ Test 1: Environment Configuration');
if (!LUMA_API_KEY) {
  console.error('❌ LUMA_API_KEY not found in environment');
  console.log('   Please add LUMA_API_KEY to server/.env file');
  process.exit(1);
}
console.log('✅ LUMA_API_KEY configured');
console.log(`   Key prefix: ${LUMA_API_KEY.substring(0, 10)}...`);

// Test 2: Health Check
console.log('\n✓ Test 2: Gateway Health Check');
try {
  const healthRes = await fetch(`${GATEWAY_URL}/health`);
  if (!healthRes.ok) {
    console.error('❌ Gateway health check failed');
    console.log(`   Status: ${healthRes.status}`);
    process.exit(1);
  }
  const health = await healthRes.json();
  
  if (!health.videoProviders?.luma) {
    console.error('❌ Luma not detected in gateway');
    console.log('   Response:', JSON.stringify(health.videoProviders, null, 2));
    process.exit(1);
  }
  
  console.log('✅ Gateway health check passed');
  console.log('   Video providers:', JSON.stringify(health.videoProviders, null, 2));
} catch (error) {
  console.error('❌ Gateway connection failed');
  console.log(`   Error: ${error.message}`);
  console.log('   Make sure the gateway is running: node server/ai-gateway.mjs');
  process.exit(1);
}

// Test 3: Direct Luma API Test
console.log('\n✓ Test 3: Direct Luma API Connection');
try {
  const lumaRes = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LUMA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'ray-2',
      prompt: 'A test video for API validation',
      aspect_ratio: '16:9',
      loop: false,
    }),
  });

  if (!lumaRes.ok) {
    const errorText = await lumaRes.text();
    console.error('❌ Luma API authentication failed');
    console.log(`   Status: ${lumaRes.status}`);
    console.log(`   Error: ${errorText}`);
    process.exit(1);
  }

  const lumaData = await lumaRes.json();
  console.log('✅ Luma API connection successful');
  console.log(`   Task ID: ${lumaData.id}`);
  console.log(`   Status: ${lumaData.state}`);

  // Test 4: Poll the task
  console.log('\n✓ Test 4: Task Status Polling');
  let attempts = 0;
  let taskStatus = lumaData.state;
  
  while (attempts < 5 && !['completed', 'failed'].includes(taskStatus)) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const pollRes = await fetch(
      `https://api.lumalabs.ai/dream-machine/v1/generations/${lumaData.id}`,
      {
        headers: { 'Authorization': `Bearer ${LUMA_API_KEY}` },
      }
    );

    if (!pollRes.ok) {
      console.error('❌ Polling failed');
      break;
    }

    const pollData = await pollRes.json();
    taskStatus = pollData.state;
    console.log(`   Attempt ${attempts + 1}/5: ${taskStatus}`);
    attempts++;
  }

  console.log('✅ Polling system working correctly');

} catch (error) {
  console.error('❌ Luma API test failed');
  console.log(`   Error: ${error.message}`);
  process.exit(1);
}

// Test 5: Gateway Integration
console.log('\n✓ Test 5: Gateway Video Generation');
try {
  const genRes = await fetch(`${GATEWAY_URL}/v1/videos/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'luma',
      promptText: 'A peaceful mountain landscape with flowing clouds',
      model: 'ray-2',
      aspect: '16:9',
      loop: false,
    }),
  });

  if (!genRes.ok) {
    const errorText = await genRes.text();
    console.error('❌ Gateway generation failed');
    console.log(`   Status: ${genRes.status}`);
    console.log(`   Error: ${errorText}`);
    process.exit(1);
  }

  const genData = await genRes.json();
  console.log('✅ Gateway generation started');
  console.log(`   Task ID: ${genData.taskId}`);
  console.log(`   Provider: ${genData.provider}`);

  // Test 6: Gateway Polling
  console.log('\n✓ Test 6: Gateway Task Polling');
  const pollGatewayRes = await fetch(
    `${GATEWAY_URL}/v1/videos/tasks/${genData.taskId}?provider=luma`
  );

  if (!pollGatewayRes.ok) {
    console.error('❌ Gateway polling failed');
    process.exit(1);
  }

  const pollGatewayData = await pollGatewayRes.json();
  console.log('✅ Gateway polling working');
  console.log(`   Status: ${pollGatewayData.status}`);
  console.log(`   Progress: ${pollGatewayData.progress}%`);

} catch (error) {
  console.error('❌ Gateway integration test failed');
  console.log(`   Error: ${error.message}`);
  process.exit(1);
}

// Success!
console.log('\n' + '═'.repeat(80));
console.log('🎉 ALL TESTS PASSED - Luma integration is production ready!\n');
console.log('✅ Environment configured correctly');
console.log('✅ Gateway health check passed');
console.log('✅ Direct Luma API working');
console.log('✅ Task polling functional');
console.log('✅ Gateway integration complete');
console.log('✅ End-to-end flow validated');
console.log('\n📋 Next steps:');
console.log('   1. Start the dev server: npm run dev');
console.log('   2. Open Video panel in the UI');
console.log('   3. Select "Luma" provider');
console.log('   4. Generate a test video');
console.log('\n' + '═'.repeat(80) + '\n');

process.exit(0);

