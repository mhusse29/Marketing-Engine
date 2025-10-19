/**
 * Test different Runway model names to find the correct one
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server', '.env') });

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

const modelsToTest = [
  'gen3a_turbo',
  'gen4_turbo',
  'gen4_aleph',
  'veo3',
];

async function testModel(modelName) {
  const payload = {
    promptText: "Test video generation",
    model: modelName,
    duration: modelName === 'veo3' ? 8 : 5,
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
    
    const responseText = await response.text();
    const status = response.status;
    
    if (status === 200 || status === 201) {
      console.log(`✅ "${modelName}" - SUCCESS!`);
      console.log(`   Response:`, responseText.substring(0, 100));
      return modelName;
    } else if (status === 403) {
      const error = JSON.parse(responseText);
      console.log(`❌ "${modelName}" - Model not available (403) -> ${error.error}`);
    } else if (status === 400) {
      const error = JSON.parse(responseText);
      if (error.error && error.error.includes('Model variant')) {
        console.log(`❌ "${modelName}" - Invalid model name`);
      } else {
        console.log(`⚠️  "${modelName}" - ${status}: ${error.error || responseText.substring(0, 50)}`);
      }
    } else {
      console.log(`⚠️  "${modelName}" - Status ${status}`);
    }
  } catch (error) {
    console.log(`❌ "${modelName}" - Error: ${error.message}`);
  }
  
  return null;
}

console.log('🔍 Testing Runway Model Names...\n');
console.log('═══════════════════════════════════════════════════════════\n');

let successModel = null;

for (const model of modelsToTest) {
  const result = await testModel(model);
  if (result) {
    successModel = result;
    break;
  }
  // Small delay between requests
  await new Promise(resolve => setTimeout(resolve, 500));
}

console.log('\n═══════════════════════════════════════════════════════════');
if (successModel) {
  console.log(`\n✅ FOUND WORKING MODEL: "${successModel}"`);
  console.log(`\nUpdate your code to use: model: "${successModel}"`);
} else {
  console.log('\n❌ No working model name found!');
  console.log('\n💡 Suggestions:');
  console.log('   1. Check Runway dashboard for API video access');
  console.log('   2. Confirm text_to_video models are enabled for your tier');
  console.log('   3. Contact Runway support for model activation');
}
console.log('═══════════════════════════════════════════════════════════\n');
