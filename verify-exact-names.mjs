/**
 * Verify the exact model names you specified
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server', '.env') });

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

console.log('🎯 Testing EXACT Model Names You Specified\n');
console.log('═══════════════════════════════════════════════════════════\n');

const exactModels = ['gen4_turbo', 'gen4_aleph', 'gen3a_turbo'];

async function testWithFullDetails(modelName) {
  const payload = {
    promptText: "A mountain landscape at sunset",
    model: modelName,
    duration: 5,
    ratio: "1280:720",
    watermark: false,
  };
  
  console.log(`\n📋 Testing: "${modelName}"`);
  console.log('Request payload:', JSON.stringify(payload, null, 2));
  
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
    const text = await response.text();
    
    console.log(`Response status: ${status}`);
    console.log('Response body:', text);
    
    if (status === 200 || status === 201) {
      const result = JSON.parse(text);
      console.log(`\n✅ SUCCESS! Model "${modelName}" WORKS!`);
      console.log(`Task ID: ${result.id}\n`);
      return true;
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  
  return false;
}

async function run() {
  let anySuccess = false;
  
  for (const model of exactModels) {
    const success = await testWithFullDetails(model);
    if (success) {
      anySuccess = true;
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log(`🎉 CONFIRMED WORKING: "${model}"`);
      console.log('═══════════════════════════════════════════════════════════\n');
      break;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  
  if (!anySuccess) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('❌ ALL THREE MODELS RETURNED 403');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n💡 Possible reasons:');
    console.log('   1. API key was generated BEFORE video access was added');
    console.log('   2. Web UI access ≠ API access (need to enable separately)');
    console.log('   3. Billing verification required for API');
    console.log('   4. API endpoint changed (not using /v1/text_to_video anymore)');
    console.log('\n📋 Actions:');
    console.log('   → Go to Runway Dashboard → API Keys');
    console.log('   → Delete current key');
    console.log('   → Create NEW key with "Video Generation" checked');
    console.log('   → Update server/.env with new key');
    console.log('\n═══════════════════════════════════════════════════════════\n');
  }
}

run().catch(console.error);

