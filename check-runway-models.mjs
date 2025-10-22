/**
 * Comprehensive Runway API model checker
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server', '.env') });

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

if (!RUNWAY_API_KEY) {
  console.error('❌ RUNWAY_API_KEY not found in server/.env');
  process.exit(1);
}

console.log('🔍 Checking Runway API Models & Account Status\n');
console.log('═══════════════════════════════════════════════════════════\n');

// All known Runway model variants
const allModels = [
  // Gen-3 variants
  'gen3a_turbo',
  'gen3_turbo',
  'gen3a',
  'gen3',
  
  // Gen-4 variants
  'gen4_turbo',
  'gen4_aleph',
  'gen4',
  
  // Other possibilities
  'veo3',
  'runway-gen3',
  'default',
];

async function checkModel(modelName) {
  const payload = {
    promptText: "Test",
    model: modelName,
    duration: 5,
    ratio: "1280:720",
    watermark: false,
  };
  
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
    const responseText = await response.text();
    
    let result = {
      model: modelName,
      status,
      available: false,
      message: '',
    };
    
    if (status === 200 || status === 201) {
      result.available = true;
      result.message = '✅ SUCCESS - Model works!';
    } else if (status === 403) {
      try {
        const error = JSON.parse(responseText);
        result.message = `❌ Not available: ${error.error || responseText.substring(0, 50)}`;
      } catch {
        result.message = `❌ Not available (403)`;
      }
    } else if (status === 400) {
      try {
        const error = JSON.parse(responseText);
        if (error.error && error.error.includes('credits')) {
          result.available = true; // Model exists, just needs credits
          result.message = `⚠️  Model available but needs credits: ${error.error}`;
        } else {
          result.message = `⚠️  ${error.error || responseText.substring(0, 50)}`;
        }
      } catch {
        result.message = `⚠️  Bad request (400)`;
      }
    } else {
      result.message = `❓ Status ${status}: ${responseText.substring(0, 50)}`;
    }
    
    return result;
  } catch (error) {
    return {
      model: modelName,
      status: 'error',
      available: false,
      message: `❌ Error: ${error.message}`,
    };
  }
}

// Check account info
async function checkAccount() {
  try {
    console.log('📊 Checking Account Information...\n');
    
    // Try to get account info (this endpoint may or may not exist)
    const response = await fetch('https://api.dev.runwayml.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Account Data:', JSON.stringify(data, null, 2));
    } else {
      console.log(`Account endpoint returned: ${response.status}`);
    }
  } catch (error) {
    console.log(`Account check skipped (${error.message})`);
  }
  
  console.log('\n');
}

await checkAccount();

console.log('🧪 Testing Model Variants...\n');

const results = [];
for (const model of allModels) {
  process.stdout.write(`Testing "${model}"... `);
  const result = await checkModel(model);
  console.log(result.message);
  results.push(result);
  
  // Small delay between requests
  await new Promise(resolve => setTimeout(resolve, 300));
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('\n📋 SUMMARY\n');

const available = results.filter(r => r.available);
const unavailable = results.filter(r => !r.available);

if (available.length > 0) {
  console.log('✅ Available Models (with your API key):');
  available.forEach(r => {
    console.log(`   • ${r.model}`);
    if (r.message.includes('credits')) {
      console.log(`     └─ Note: Requires credits in account`);
    }
  });
} else {
  console.log('❌ No available models found');
}

console.log('\n❌ Unavailable Models:');
unavailable.forEach(r => {
  console.log(`   • ${r.model} - ${r.message.replace(/[✅❌⚠️❓]/g, '').trim()}`);
});

console.log('\n═══════════════════════════════════════════════════════════\n');

if (available.length > 0) {
  console.log('💡 Recommended Action:');
  console.log(`   Use model: "${available[0].model}"`);
  if (available.some(r => r.message.includes('credits'))) {
    console.log('   ⚠️  Add credits to your Runway account to generate videos');
  }
} else {
  console.log('💡 Next Steps:');
  console.log('   1. Verify your Runway API key has video generation access');
  console.log('   2. Check your Runway dashboard subscription tier');
  console.log('   3. Contact Runway support for model activation');
}

console.log('\n');
