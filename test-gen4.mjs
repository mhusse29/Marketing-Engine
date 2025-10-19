/**
 * Test Runway Gen-4 Models
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server', '.env') });

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

console.log('🧪 Testing Runway Gen-4 Models...\n');
console.log('═══════════════════════════════════════════════════════════\n');

const gen4Models = [
  'gen4_turbo',
  'gen4',
  'gen-4-turbo',
  'gen-4',
  'runway-gen4',
  'runway-gen4-turbo',
  'gen4a_turbo',
  'gen4a',
];

async function testModel(modelName) {
  const payload = {
    promptText: "A serene mountain landscape at golden hour, cinematic 35mm",
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
    
    const responseText = await response.text();
    const status = response.status;
    
    if (status === 200 || status === 201) {
      console.log(`✅ SUCCESS! Model "${modelName}" works!`);
      console.log(`   Response:`, JSON.parse(responseText));
      return { success: true, model: modelName, response: JSON.parse(responseText) };
    } else if (status === 403) {
      const error = JSON.parse(responseText);
      console.log(`❌ 403: ${error.error}`);
    } else if (status === 400) {
      const error = JSON.parse(responseText);
      console.log(`⚠️  400: ${error.error || 'Bad request'}`);
      if (error.issues) {
        console.log('   Issues:', JSON.stringify(error.issues, null, 2));
      }
    } else {
      console.log(`❌ Status ${status}:`, responseText.substring(0, 100));
    }
  } catch (error) {
    console.log(`❌ Error:`, error.message);
  }
  
  console.log('');
  return { success: false, model: modelName };
}

async function runTests() {
  const results = [];
  
  for (const model of gen4Models) {
    const result = await testModel(model);
    results.push(result);
    
    if (result.success) {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('🎉 FOUND WORKING MODEL!');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`\n✅ Working Model: "${result.model}"\n`);
      console.log('Task ID:', result.response.id);
      console.log('\n💡 Next Steps:');
      console.log(`   1. Update types to use: 'gen4_turbo' | 'gen4'`);
      console.log(`   2. Update UI labels for Gen-4`);
      console.log(`   3. Test video generation`);
      console.log('\n═══════════════════════════════════════════════════════════\n');
      break;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const success = results.find(r => r.success);
  
  if (!success) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('❌ NO GEN-4 MODELS AVAILABLE');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('⚠️  Your API key does not have access to Gen-4 models either.\n');
    console.log('📋 Recommendations:');
    console.log('   1. Check Runway dashboard for available models');
    console.log('   2. Verify account tier and permissions');
    console.log('   3. Contact Runway support for model access');
    console.log('   4. Consider implementing mock video generation\n');
    console.log('═══════════════════════════════════════════════════════════\n');
  }
}

runTests().catch(console.error);

