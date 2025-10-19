/**
 * Test Stability.ai Video Generation API Access
 * Tests if the API key has access to video generation models
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), 'server/.env') });

const STABILITY_API_KEY = process.env.STABILITY_API_KEY || process.env.STABILITY_API_BASE;

console.log('🎬 Testing Stability.ai Video Generation Access...\n');

if (!STABILITY_API_KEY) {
  console.error('❌ STABILITY_API_KEY not found in server/.env');
  console.log('\nPlease add your Stability.ai API key to server/.env:');
  console.log('STABILITY_API_KEY=sk-...');
  process.exit(1);
}

console.log(`✅ API Key found: ${STABILITY_API_KEY.substring(0, 12)}...`);
console.log('');

// Test 1: Check account balance/credits
async function checkAccount() {
  console.log('📊 Test 1: Checking account balance...');
  try {
    const response = await fetch('https://api.stability.ai/v1/user/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Account Status:', response.status);
      console.log('   Credits:', data.credits || 'N/A');
      return true;
    } else {
      console.log('❌ Account Check Failed:', response.status);
      console.log('   Error:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking account:', error.message);
    return false;
  }
}

// Test 2: List available engines/models
async function listEngines() {
  console.log('\n🔧 Test 2: Listing available engines...');
  try {
    const response = await fetch('https://api.stability.ai/v1/engines/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Engines Retrieved:', response.status);
      console.log('\nAvailable Engines:');
      data.forEach(engine => {
        console.log(`   • ${engine.id} - ${engine.name || 'N/A'}`);
        if (engine.type) console.log(`     Type: ${engine.type}`);
      });
      
      // Check for video-specific engines
      const videoEngines = data.filter(e => 
        e.id.includes('video') || 
        e.id.includes('svd') || 
        e.name?.toLowerCase().includes('video')
      );
      
      if (videoEngines.length > 0) {
        console.log('\n🎥 Video Generation Engines Found:');
        videoEngines.forEach(engine => {
          console.log(`   ✓ ${engine.id}`);
        });
      } else {
        console.log('\n⚠️  No video-specific engines found in your plan.');
      }
      
      return data;
    } else {
      console.log('❌ Engine List Failed:', response.status);
      console.log('   Error:', JSON.stringify(data, null, 2));
      return [];
    }
  } catch (error) {
    console.error('❌ Error listing engines:', error.message);
    return [];
  }
}

// Test 3: Try to access Stable Video Diffusion endpoint
async function testVideoGeneration() {
  console.log('\n🎬 Test 3: Testing Stable Video Diffusion (SVD) access...');
  
  // Test with a minimal payload
  const testPayload = {
    image: 'https://platform.stability.ai/Cat_August_2010-4.jpg', // Stability's public test image
    seed: 0,
    cfg_scale: 1.8,
    motion_bucket_id: 127,
  };

  try {
    // Try image-to-video endpoint
    console.log('   Testing image-to-video endpoint...');
    const response = await fetch('https://api.stability.ai/v2alpha/generation/image-to-video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const contentType = response.headers.get('content-type');
    
    if (response.ok) {
      console.log('✅ Video Generation Access: GRANTED');
      console.log('   Status:', response.status);
      console.log('   Your account has access to Stable Video Diffusion!');
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Video Generation Access: DENIED');
      console.log('   Status:', response.status);
      
      try {
        const errorData = JSON.parse(errorText);
        console.log('   Error:', JSON.stringify(errorData, null, 2));
        
        // Check for specific error types
        if (response.status === 402 || errorText.includes('payment') || errorText.includes('credits')) {
          console.log('\n💰 Issue: Insufficient credits or plan upgrade needed');
        } else if (response.status === 403 || errorText.includes('permission') || errorText.includes('access')) {
          console.log('\n🔒 Issue: Video generation not available in your plan');
        } else if (response.status === 404) {
          console.log('\n❓ Issue: Video generation endpoint may not be available yet');
        }
      } catch {
        console.log('   Error:', errorText);
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing video generation:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           STABILITY.AI VIDEO GENERATION TEST SUITE            ');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const accountOk = await checkAccount();
  
  if (!accountOk) {
    console.log('\n⚠️  Account check failed. API key may be invalid.');
    console.log('\nPlease verify:');
    console.log('1. Your API key is correct');
    console.log('2. Your API key is active');
    console.log('3. You have credits in your account');
    process.exit(1);
  }
  
  const engines = await listEngines();
  const videoAccess = await testVideoGeneration();
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                        FINAL SUMMARY                           ');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('Account Access:', accountOk ? '✅ Valid' : '❌ Invalid');
  console.log('Engines Available:', engines.length > 0 ? `✅ ${engines.length} engines` : '❌ None');
  console.log('Video Generation:', videoAccess ? '✅ AVAILABLE' : '❌ NOT AVAILABLE');
  
  if (videoAccess) {
    console.log('\n🎉 SUCCESS! Your Stability.ai API key has video generation access!');
    console.log('\nAvailable Video Model:');
    console.log('   • Stable Video Diffusion (SVD) - image-to-video');
    console.log('\nYou can use this for:');
    console.log('   - Converting images to short video clips');
    console.log('   - Product animations');
    console.log('   - Motion graphics from static images');
  } else {
    console.log('\n⚠️  Video generation is NOT available with your current API key/plan.');
    console.log('\nPossible reasons:');
    console.log('   1. Video generation requires a paid plan upgrade');
    console.log('   2. Insufficient credits in your account');
    console.log('   3. Feature not available in your region/plan tier');
    console.log('\nWhat you CAN use:');
    console.log('   ✓ Stable Diffusion 3.5 (image generation) - Already configured');
    console.log('\nTo get video access:');
    console.log('   → Visit https://platform.stability.ai');
    console.log('   → Check your plan and upgrade if needed');
    console.log('   → Ensure you have sufficient credits');
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

runAllTests().catch(console.error);

