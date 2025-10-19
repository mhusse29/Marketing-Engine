/**
 * Test ALL possible Runway model names
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server', '.env') });

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

console.log('🔍 Testing ALL Possible Runway Models...\n');

const allModels = [
  // Gen-2
  'gen2',
  'gen-2',
  'runway-gen2',
  // Gen-1
  'gen1',
  'gen-1',
  // Standard names
  'standard',
  'turbo',
  'fast',
  'basic',
  // Specific versions
  'v1',
  'v2',
  'v3',
  'v4',
  // Empty/null
  '',
];

async function testModel(modelName) {
  const displayName = modelName === '' ? '(empty string)' : modelName;
  const payload = {
    promptText: "Test",
    duration: 5,
    ratio: "1280:720",
    watermark: false,
  };
  
  if (modelName !== '') {
    payload.model = modelName;
  }
  
  process.stdout.write(`Testing "${displayName}"... `);
  
  try {
    const response = await fetch('https://api.dev.runwayml.com/v1/text_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify(payload),
    });
    
    const status = response.status;
    
    if (status === 200 || status === 201) {
      const result = await response.json();
      console.log(`✅ SUCCESS!`);
      return { success: true, model: modelName, taskId: result.id };
    } else {
      const text = await response.text();
      try {
        const error = JSON.parse(text);
        if (status === 403) {
          console.log(`❌ 403 (not available)`);
        } else if (status === 400) {
          if (error.issues && error.issues[0]?.path?.includes('model')) {
            console.log(`⚠️  400 (${error.issues[0].message})`);
          } else {
            console.log(`⚠️  400 (${error.error || 'bad request'})`);
          }
        } else {
          console.log(`❌ ${status}`);
        }
      } catch {
        console.log(`❌ ${status}`);
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  return { success: false, model: modelName };
}

async function checkAPIKeyValidity() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('First, let\'s verify the API key is valid...\n');
  
  try {
    // Try a simple request to see if we get authentication error vs model error
    const response = await fetch('https://api.dev.runwayml.com/v1/text_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        promptText: "Test",
        model: "test-model",
        duration: 5,
        ratio: "1280:720",
      }),
    });
    
    const status = response.status;
    
    if (status === 401) {
      console.log('❌ API Key is INVALID or EXPIRED\n');
      return false;
    } else if (status === 403 || status === 400) {
      console.log('✅ API Key is valid (authenticated successfully)\n');
      return true;
    } else {
      console.log(`⚠️  Unexpected status: ${status}\n`);
      return true; // Assume valid if we get other errors
    }
  } catch (error) {
    console.log(`❌ Network error: ${error.message}\n`);
    return false;
  }
}

async function runTests() {
  const isValid = await checkAPIKeyValidity();
  
  if (!isValid) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Cannot continue - API key issue detected');
    console.log('═══════════════════════════════════════════════════════════\n');
    return;
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Now testing all possible model names...\n');
  
  for (const model of allModels) {
    const result = await testModel(model);
    if (result.success) {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('🎉 FOUND WORKING MODEL!');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`\nModel: "${result.model || '(empty)'}"`);
      console.log(`Task ID: ${result.taskId}\n`);
      console.log('═══════════════════════════════════════════════════════════\n');
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 TEST COMPLETE - NO WORKING MODELS FOUND');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🔍 Analysis:');
  console.log('   ✅ API key is valid (authenticated)');
  console.log('   ❌ No models are accessible with this key\n');
  console.log('💡 This means:');
  console.log('   • Your Runway account may not have video generation access');
  console.log('   • Or video generation requires a different API endpoint');
  console.log('   • Or the account needs to be upgraded/activated\n');
  console.log('📋 Next Steps:');
  console.log('   1. Log into https://app.runwayml.com/');
  console.log('   2. Check "API" or "Settings" section');
  console.log('   3. Verify video generation is enabled');
  console.log('   4. Check if you need to upgrade your plan');
  console.log('   5. Or use the web interface to generate a test video\n');
  console.log('═══════════════════════════════════════════════════════════\n');
}

runTests().catch(console.error);

