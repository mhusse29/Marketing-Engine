#!/usr/bin/env node

/**
 * Test Badu's Knowledge of Luma Advanced Parameters
 * Verifies that Badu can help users with all 20+ Luma settings
 */

const API_BASE = 'http://localhost:8787';

const TEST_QUESTIONS = [
  {
    question: "What are the available video providers and when should I use each one?",
    expectedKeywords: ['runway', 'luma', 'veo-3', 'ray-2', 'cinematic', 'fast', 'creative'],
  },
  {
    question: "Tell me about all the Luma Ray-2 advanced parameters I can control",
    expectedKeywords: ['camera', 'movement', 'style', 'lighting', 'mood', 'motion', 'quality', 'seed', 'guidance'],
  },
  {
    question: "I want to create a product showcase video. What Luma settings should I use?",
    expectedKeywords: ['orbit', 'cinematic', 'dramatic', 'lighting', 'quality', 'premium'],
  },
  {
    question: "What's the difference between Luma's duration options (5s vs 9s)?",
    expectedKeywords: ['5s', '9s', 'quick', 'extended', 'detailed', 'cost'],
  },
  {
    question: "Explain Luma's camera control options - movement, angle, and distance",
    expectedKeywords: ['static', 'pan', 'zoom', 'orbit', 'low', 'eye level', 'high', 'close-up', 'wide'],
  },
  {
    question: "What visual styles can I use with Luma and when should I use each?",
    expectedKeywords: ['cinematic', 'photorealistic', 'artistic', 'animated', 'vintage', 'hollywood', 'creative'],
  },
  {
    question: "How does the guidance scale work in Luma? What values should I use?",
    expectedKeywords: ['guidance', 'scale', '1-20', 'creative', 'balanced', 'strong', 'prompt', 'following'],
  },
  {
    question: "What's a negative prompt and how should I use it with Luma?",
    expectedKeywords: ['negative', 'prompt', 'avoid', 'exclude', 'blurry', 'low quality', 'distorted'],
  },
  {
    question: "Explain Luma's motion control options - intensity, speed, and subject movement",
    expectedKeywords: ['motion', 'intensity', 'minimal', 'moderate', 'high', 'extreme', 'slow', 'fast', 'dynamic'],
  },
  {
    question: "What resolution and quality options does Luma offer?",
    expectedKeywords: ['720p', '1080p', 'standard', 'high', 'premium', 'HD', 'quality'],
  },
];

async function testBaduKnowledge(question, expectedKeywords) {
  console.log(`\n📝 Question: "${question}"`);
  console.log('─'.repeat(80));

  try {
    const response = await fetch(`${API_BASE}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: question,
        history: [],
      }),
    });

    if (!response.ok) {
      console.log(`❌ API Error: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const result = await response.json();
    const reply = result.reply || '';

    console.log(`\n💬 Badu's Response (${reply.length} chars):`);
    console.log(reply.substring(0, 500) + (reply.length > 500 ? '...' : ''));

    // Check if response contains expected keywords
    const foundKeywords = [];
    const missingKeywords = [];

    for (const keyword of expectedKeywords) {
      if (reply.toLowerCase().includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    }

    const coveragePercent = Math.round((foundKeywords.length / expectedKeywords.length) * 100);

    console.log(`\n🔍 Keyword Coverage: ${coveragePercent}% (${foundKeywords.length}/${expectedKeywords.length})`);
    console.log(`✅ Found: ${foundKeywords.join(', ')}`);
    
    if (missingKeywords.length > 0) {
      console.log(`⚠️  Missing: ${missingKeywords.join(', ')}`);
    }

    const success = coveragePercent >= 60; // At least 60% keyword coverage
    console.log(`\n${success ? '✅ PASS' : '❌ FAIL'}: ${coveragePercent >= 80 ? 'Excellent' : coveragePercent >= 60 ? 'Good' : 'Needs improvement'}`);

    return {
      success,
      coveragePercent,
      foundKeywords: foundKeywords.length,
      totalKeywords: expectedKeywords.length,
      replyLength: reply.length,
    };

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runBaduKnowledgeTest() {
  console.log('🤖 BADU LUMA KNOWLEDGE TEST');
  console.log('═'.repeat(80));
  console.log('Testing Badu\'s knowledge of all Luma Ray-2 advanced parameters');
  console.log('═'.repeat(80));

  const results = [];

  for (const test of TEST_QUESTIONS) {
    const result = await testBaduKnowledge(test.question, test.expectedKeywords);
    results.push(result);

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('═'.repeat(80));

  const successful = results.filter(r => r.success).length;
  const totalTests = TEST_QUESTIONS.length;
  const successRate = Math.round((successful / totalTests) * 100);

  const avgCoverage = Math.round(
    results.reduce((sum, r) => sum + (r.coveragePercent || 0), 0) / totalTests
  );

  console.log(`Total Questions: ${totalTests}`);
  console.log(`Passed: ${successful}`);
  console.log(`Failed: ${totalTests - successful}`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Average Keyword Coverage: ${avgCoverage}%`);

  if (successRate >= 80) {
    console.log('\n🎉 EXCELLENT! Badu has comprehensive Luma knowledge');
    console.log('✅ Badu can effectively guide users through all Luma parameters');
    console.log('✅ Ready to assist with Luma video generation');
  } else if (successRate >= 60) {
    console.log('\n✅ GOOD! Badu has solid Luma knowledge');
    console.log('⚠️  Some areas could be improved');
  } else {
    console.log('\n❌ NEEDS IMPROVEMENT');
    console.log('⚠️  Badu needs better training on Luma parameters');
  }

  console.log('\n📋 LUMA KNOWLEDGE AREAS TESTED:');
  console.log('1. ✅ Provider comparison (Runway vs Luma)');
  console.log('2. ✅ Advanced parameter overview');
  console.log('3. ✅ Use case recommendations');
  console.log('4. ✅ Duration options (5s vs 9s)');
  console.log('5. ✅ Camera controls (movement, angle, distance)');
  console.log('6. ✅ Visual styles and aesthetics');
  console.log('7. ✅ Guidance scale usage');
  console.log('8. ✅ Negative prompts');
  console.log('9. ✅ Motion controls');
  console.log('10. ✅ Resolution and quality options');

  console.log('\n🎯 BADU STATUS:');
  if (successRate >= 80) {
    console.log('✅ Fully trained on Luma Ray-2 parameters');
    console.log('✅ Can provide expert guidance to users');
    console.log('✅ Ready for production use');
  }
}

// Run the test
runBaduKnowledgeTest().catch(console.error);
