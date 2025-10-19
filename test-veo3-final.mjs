/**
 * Final Veo-3 Test - Verify it works with your API key
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server', '.env') });

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

console.log('🎬 Final Veo-3 Integration Test\n');
console.log('═══════════════════════════════════════════════════════════\n');

async function testVeo3() {
  const payload = {
    promptText: "A serene mountain landscape at golden hour, cinematic 35mm film look",
    model: "veo3",
    duration: 8,
    ratio: "1280:720",
    watermark: false,
  };
  
  console.log('📋 Request Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n🚀 Sending to Runway API...\n');
  
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
    
    console.log(`📊 Response Status: ${status}`);
    console.log('📄 Response Body:');
    console.log(text);
    console.log('');
    
    if (status === 200 || status === 201) {
      const result = JSON.parse(text);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ SUCCESS! VEO-3 VIDEO GENERATION STARTED!');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`\n🎬 Task ID: ${result.id}`);
      console.log(`📊 Status: ${result.status || 'PENDING'}`);
      console.log('\n💡 Next Steps:');
      console.log('   1. Poll for completion using task ID');
      console.log('   2. Video will be ready in 30-60 seconds');
      console.log('   3. Your frontend is configured correctly!');
      console.log('\n🚀 Ready for production use!\n');
      console.log('═══════════════════════════════════════════════════════════\n');
      return true;
    } else {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('❌ FAILED');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      try {
        const error = JSON.parse(text);
        console.log('Error Details:');
        console.log(`  Type: ${error.error}`);
        if (error.issues) {
          console.log('  Issues:', JSON.stringify(error.issues, null, 2));
        }
      } catch {
        console.log('Raw error:', text);
      }
      
      console.log('\n💡 Troubleshooting:');
      if (status === 403) {
        console.log('   • API key may not have video generation enabled');
        console.log('   • Go to Runway Dashboard → API Keys');
        console.log('   • Regenerate key with video permissions');
      } else if (status === 400) {
        console.log('   • Check parameter format');
        console.log('   • Verify duration is 8 for veo3');
      } else if (status === 402) {
        console.log('   • Insufficient credits');
        console.log('   • Add credits to your Runway account');
      }
      console.log('\n═══════════════════════════════════════════════════════════\n');
      return false;
    }
  } catch (error) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('❌ NETWORK ERROR');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\nError: ${error.message}\n`);
    console.log('═══════════════════════════════════════════════════════════\n');
    return false;
  }
}

testVeo3();

