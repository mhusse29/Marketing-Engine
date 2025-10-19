/**
 * Final comprehensive test with all possible naming patterns
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server', '.env') });

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

console.log('🎯 Final Model Test - Based on Dashboard Access\n');
console.log('You have access to: Gen-3 Alpha Turbo, Gen-4 Turbo, Gen-4 Aleph\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Try every possible variation based on dashboard names
const finalTest = [
  // Lowercase with underscores
  'gen_3_alpha_turbo',
  'gen_4_turbo',
  'gen_4_aleph',
  // Camel case
  'gen3AlphaTurbo',
  'gen4Turbo',
  'gen4Aleph',
  // Pascal case
  'Gen3AlphaTurbo',
  'Gen4Turbo',
  'Gen4Aleph',
  // Kebab case
  'gen-3-alpha-turbo',
  'gen-4-turbo',
  'gen-4-aleph',
  // No separators
  'gen3alphaturbo',
  'gen4turbo',
  'gen4aleph',
  // Just the version
  'turbo',
  'aleph',
];

async function testModel(modelName) {
  const payload = {
    promptText: "Mountain landscape at sunset",
    model: modelName,
    duration: 5,
    ratio: "1280:720",
    watermark: false,
  };
  
  process.stdout.write(`"${modelName}"... `);
  
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
      console.log(`✅ SUCCESS!\n`);
      return { success: true, model: modelName, taskId: result.id };
    } else {
      console.log(`❌ ${status}`);
    }
  } catch (error) {
    console.log(`❌ ${error.message}`);
  }
  
  return { success: false };
}

async function run() {
  for (const model of finalTest) {
    const result = await testModel(model);
    if (result.success) {
      console.log('\n🎉═══════════════════════════════════════════════════════════');
      console.log(`   WORKING MODEL: "${result.model}"`);
      console.log(`   Task ID: ${result.taskId}`);
      console.log('═══════════════════════════════════════════════════════════\n');
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }
}

run().catch(console.error);

