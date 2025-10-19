/**
 * Test exact model names from Runway dashboard
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server', '.env') });

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

console.log('🔍 Testing Dashboard Model Names...\n');

// Based on the screenshot, let's try these exact formats
const modelsFromDashboard = [
  'Gen-3 Alpha Turbo',
  'Gen-4 Turbo',
  'Gen-4 Aleph',
  'gen-3-alpha-turbo',
  'gen-4-turbo',
  'gen-4-aleph',
];

async function testModel(modelName) {
  const payload = {
    promptText: "A serene mountain landscape at golden hour",
    model: modelName,
    duration: 5,
    ratio: "1280:720",
    watermark: false,
  };
  
  console.log(`Testing: "${modelName}"`);
  
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
    
    if (status === 200 || status === 201) {
      const result = JSON.parse(text);
      console.log(`✅ SUCCESS! Task ID: ${result.id}\n`);
      return { success: true, model: modelName, result };
    } else {
      try {
        const error = JSON.parse(text);
        console.log(`❌ ${status}: ${error.error || error.message || 'Failed'}\n`);
      } catch {
        console.log(`❌ ${status}: ${text.substring(0, 100)}\n`);
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  
  return { success: false, model: modelName };
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════\n');
  
  for (const model of modelsFromDashboard) {
    const result = await testModel(model);
    if (result.success) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🎉 FOUND WORKING MODEL!');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`\n✅ Working Model: "${result.model}"`);
      console.log(`   Task ID: ${result.result.id}\n`);
      console.log('🔧 Update code to use this exact model name!\n');
      console.log('═══════════════════════════════════════════════════════════\n');
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Still no working model found.');
  console.log('The API may use internal identifiers different from display names.');
  console.log('═══════════════════════════════════════════════════════════\n');
}

runTests().catch(console.error);

