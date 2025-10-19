/**
 * Test ALL models shown in your Tier 1 dashboard
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server', '.env') });

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

console.log('🎯 Testing ALL Tier 1 Dashboard Models\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Models from your dashboard + variations
const dashboardModels = [
  // Exact display names
  { name: 'Gen-3 Alpha Turbo', variations: ['Gen-3 Alpha Turbo', 'gen-3-alpha-turbo', 'gen3-alpha-turbo', 'gen3a-turbo', 'gen3a_turbo'] },
  { name: 'Gen-4 Turbo', variations: ['Gen-4 Turbo', 'gen-4-turbo', 'gen4-turbo', 'gen4_turbo'] },
  { name: 'Gen-4 Aleph', variations: ['Gen-4 Aleph', 'gen-4-aleph', 'gen4-aleph', 'gen4_aleph'] },
  { name: 'Act Two', variations: ['Act Two', 'act-two', 'act_two', 'acttwo'] },
  { name: 'Upscale', variations: ['Upscale', 'upscale'] },
  { name: 'Veo-3', variations: ['Veo-3', 'veo-3', 'veo3'] },
];

const workingModels = [];

async function testModel(modelName) {
  const payload = {
    promptText: "Mountain landscape at sunset",
    model: modelName,
    duration: 8, // Using 8 for all tests
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
    
    if (status === 200 || status === 201) {
      const result = await response.json();
      return { success: true, taskId: result.id };
    }
    
    return { success: false, status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runTests() {
  for (const modelGroup of dashboardModels) {
    console.log(`\n📋 ${modelGroup.name}`);
    console.log('─'.repeat(60));
    
    let foundWorking = false;
    
    for (const variation of modelGroup.variations) {
      process.stdout.write(`   Testing "${variation}"... `);
      
      const result = await testModel(variation);
      
      if (result.success) {
        console.log(`✅ SUCCESS!`);
        console.log(`      Task ID: ${result.taskId}`);
        workingModels.push({
          displayName: modelGroup.name,
          apiName: variation,
          taskId: result.taskId,
        });
        foundWorking = true;
        break; // Found working variation, move to next model
      } else if (result.status === 403) {
        console.log(`❌ Not available (403)`);
      } else if (result.status === 400) {
        console.log(`⚠️  Bad request (400)`);
      } else {
        console.log(`❌ ${result.status || result.error}`);
      }
      
      // Small delay between attempts
      await new Promise(r => setTimeout(r, 300));
    }
    
    if (!foundWorking) {
      console.log(`   ❌ No working variation found for ${modelGroup.name}`);
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (workingModels.length > 0) {
    console.log('✅ WORKING MODELS FOUND:\n');
    workingModels.forEach((model, index) => {
      console.log(`${index + 1}. ${model.displayName}`);
      console.log(`   API Name: "${model.apiName}"`);
      console.log(`   Task ID: ${model.taskId}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('💡 IMPLEMENTATION RECOMMENDATIONS:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (workingModels.length === 1) {
      console.log(`Use single model: "${workingModels[0].apiName}"`);
    } else {
      console.log('Update model options to:');
      workingModels.forEach(model => {
        console.log(`   • ${model.displayName}: "${model.apiName}"`);
      });
    }
    
    console.log('\n🎬 Ready for production!\n');
  } else {
    console.log('❌ NO WORKING MODELS FOUND\n');
    console.log('This means your API key does not have access to video');
    console.log('generation despite showing in the dashboard.\n');
    console.log('Action: Regenerate API key with video permissions enabled.\n');
  }
  
  console.log('═══════════════════════════════════════════════════════════\n');
}

runTests().catch(console.error);

