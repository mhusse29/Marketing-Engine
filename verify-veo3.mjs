/**
 * Verify veo3 model with correct parameters
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server', '.env') });

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

console.log('🔍 Verifying veo3 Model Support\n');
console.log('═══════════════════════════════════════════════════════════\n');

async function testVeo3() {
  const payload = {
    promptText: "A beautiful sunset over mountains",
    model: "veo3",
    duration: 8, // veo3 requires duration of 8
    ratio: "1280:720",
    watermark: false,
  };
  
  console.log('📤 Sending request to Runway API with veo3...\n');
  console.log('Payload:', JSON.stringify(payload, null, 2), '\n');
  
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
    
    console.log(`📥 Response Status: ${status}\n`);
    
    if (status === 200 || status === 201) {
      const data = JSON.parse(responseText);
      console.log('✅ SUCCESS! veo3 model is FULLY SUPPORTED!\n');
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('\n✅ CONFIRMED: Your API key supports the "veo3" model');
      console.log('   Duration: Must be 8 seconds');
      console.log('   Status: Active and working');
    } else if (status === 400) {
      const error = JSON.parse(responseText);
      console.log('⚠️  veo3 Model Validation:\n');
      console.log(`Error: ${error.error}\n`);
      
      if (error.error.includes('credits')) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('\n✅ CONFIRMED: Your API key supports "veo3" model');
        console.log('   Status: Model is accessible');
        console.log('   Issue: Insufficient credits in account');
        console.log('\n💡 Action Required:');
        console.log('   Add credits to your Runway account to generate videos');
        console.log('   Visit: https://app.runwayml.com/');
      } else {
        console.log('Full Error:', JSON.stringify(error, null, 2));
      }
    } else if (status === 403) {
      const error = JSON.parse(responseText);
      console.log('❌ Model Not Available:\n');
      console.log(`Error: ${error.error}`);
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('\n❌ veo3 model is NOT accessible with your API key');
    } else {
      console.log('❓ Unexpected Response:\n');
      console.log(responseText);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

await testVeo3();

console.log('\n');
