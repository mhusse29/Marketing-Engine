#!/usr/bin/env node

/**
 * Test Badu's Response Quality and Accuracy
 * Verifies:
 * 1. No message cutoff (full responses)
 * 2. Accurate information (no hallucinated parameters)
 */

const API_BASE = 'http://localhost:8787';

const TEST_CASES = [
  {
    name: 'Full Luma Settings Request',
    question: "give me the full options settings of the luma model that we have here",
    shouldInclude: [
      'Duration', '5s', '9s',
      'Resolution', '720p', '1080p',
      'Camera Movement', 'Static', 'Pan', 'Zoom', 'Orbit',
      'Camera Angle', 'Low', 'Eye Level', 'High', 'Bird',
      'Style', 'Cinematic', 'Photorealistic',
      'Lighting', 'Natural', 'Dramatic',
      'Mood', 'Energetic', 'Calm',
      'Motion Intensity', 'Minimal', 'Moderate', 'High', 'Extreme',
      'Quality', 'Standard', 'Premium',
      'Color Grading', 'Natural', 'Warm', 'Cool',
      'Film Look', 'Digital', '35mm',
      'Seed', 'Guidance Scale', 'Negative Prompt'
    ],
    shouldNOTInclude: [
      'Subject Framing',
      'Depth of Field',
      'Time of Day',
      'Weather',
      'Medium Shot',
      'Dawn',
      'Morning',
      'Afternoon'
    ],
    minLength: 2000, // Should be comprehensive
  },
  {
    name: 'Check for Hallucination - Depth of Field',
    question: "Does Luma have depth of field control?",
    shouldInclude: ['not available', 'don\'t have', 'not currently'],
    shouldNOTInclude: ['Shallow', 'Deep', 'depth of field control'],
    minLength: 100,
  },
  {
    name: 'Check for Hallucination - Time of Day',
    question: "Can I set time of day in Luma?",
    shouldInclude: ['not available', 'don\'t have', 'not currently'],
    shouldNOTInclude: ['Dawn', 'Morning', 'Afternoon', 'time of day setting'],
    minLength: 100,
  },
];

async function testBaduResponse(testCase) {
  console.log(`\n🧪 Test: ${testCase.name}`);
  console.log('═'.repeat(80));
  console.log(`Question: "${testCase.question}"`);
  console.log('─'.repeat(80));

  try {
    const response = await fetch(`${API_BASE}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testCase.question,
        history: [],
      }),
    });

    if (!response.ok) {
      console.log(`❌ API Error: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const result = await response.json();
    const reply = result.reply || '';

    console.log(`\n📏 Response Length: ${reply.length} characters`);
    
    // Check minimum length (no cutoff)
    const lengthCheck = reply.length >= testCase.minLength;
    console.log(`✓ Length Check: ${lengthCheck ? '✅ PASS' : '❌ FAIL'} (${reply.length} >= ${testCase.minLength})`);

    // Check for required content
    const missingRequired = [];
    testCase.shouldInclude.forEach(term => {
      if (!reply.toLowerCase().includes(term.toLowerCase())) {
        missingRequired.push(term);
      }
    });

    if (missingRequired.length === 0) {
      console.log(`✓ Required Content: ✅ ALL FOUND (${testCase.shouldInclude.length} terms)`);
    } else {
      console.log(`✓ Required Content: ⚠️  MISSING ${missingRequired.length}/${testCase.shouldInclude.length}`);
      console.log(`  Missing: ${missingRequired.slice(0, 5).join(', ')}${missingRequired.length > 5 ? '...' : ''}`);
    }

    // Check for hallucinated content
    const foundHallucinations = [];
    testCase.shouldNOTInclude.forEach(term => {
      if (reply.toLowerCase().includes(term.toLowerCase())) {
        foundHallucinations.push(term);
      }
    });

    if (foundHallucinations.length === 0) {
      console.log(`✓ Accuracy Check: ✅ NO HALLUCINATIONS`);
    } else {
      console.log(`✓ Accuracy Check: ❌ FOUND ${foundHallucinations.length} HALLUCINATIONS`);
      console.log(`  Hallucinated: ${foundHallucinations.join(', ')}`);
    }

    // Overall result
    const success = lengthCheck && 
                   (missingRequired.length <= testCase.shouldInclude.length * 0.2) && // Allow 20% missing
                   foundHallucinations.length === 0;

    console.log(`\n${success ? '✅ PASS' : '❌ FAIL'}: ${testCase.name}`);

    // Show first 500 chars of response
    console.log(`\n💬 Response Preview:`);
    console.log(reply.substring(0, 500) + (reply.length > 500 ? '...' : ''));

    return {
      success,
      length: reply.length,
      missingRequired: missingRequired.length,
      hallucinations: foundHallucinations.length,
      lengthCheck,
    };

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAccuracyTests() {
  console.log('🔍 BADU ACCURACY & COMPLETENESS TEST');
  console.log('═'.repeat(80));
  console.log('Testing:');
  console.log('1. No message cutoff (full comprehensive answers)');
  console.log('2. Accurate information (no hallucinated parameters)');
  console.log('═'.repeat(80));

  const results = [];

  for (const testCase of TEST_CASES) {
    const result = await testBaduResponse(testCase);
    results.push(result);

    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('═'.repeat(80));

  const passed = results.filter(r => r.success).length;
  const total = TEST_CASES.length;
  const successRate = Math.round((passed / total) * 100);

  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${successRate}%`);

  const avgLength = Math.round(
    results.reduce((sum, r) => sum + (r.length || 0), 0) / total
  );
  console.log(`Average Response Length: ${avgLength} characters`);

  const totalHallucinations = results.reduce((sum, r) => sum + (r.hallucinations || 0), 0);
  console.log(`Total Hallucinations Found: ${totalHallucinations}`);

  if (successRate === 100 && totalHallucinations === 0) {
    console.log('\n🎉 PERFECT! Badu is accurate and provides complete answers');
    console.log('✅ No message cutoffs');
    console.log('✅ No hallucinated parameters');
    console.log('✅ Comprehensive responses');
  } else if (successRate >= 66) {
    console.log('\n✅ GOOD! Badu performance is acceptable');
    if (totalHallucinations > 0) {
      console.log(`⚠️  ${totalHallucinations} hallucination(s) detected - needs improvement`);
    }
  } else {
    console.log('\n❌ NEEDS IMPROVEMENT');
    console.log('⚠️  Badu needs better configuration');
  }

  console.log('\n📋 FIXES APPLIED:');
  console.log('1. ✅ Increased max_tokens: 800 (simple) / 2500 (complex)');
  console.log('2. ✅ Added accuracy rules to system prompt');
  console.log('3. ✅ Explicit "DO NOT hallucinate" instructions');
  console.log('4. ✅ Clear parameter boundaries defined');
}

// Run the tests
runAccuracyTests().catch(console.error);
