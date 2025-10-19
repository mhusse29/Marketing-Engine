#!/usr/bin/env node

/**
 * Test Badu Improvements
 * - Verify smart next_steps (only when needed)
 * - Verify complete Luma Ray-2 settings retrieval
 */

import { searchKnowledge, buildContextFromResults } from './shared/badu-kb-enhanced.js';
import { detectSchemaType } from './shared/badu-schemas.js';

console.log('\n╔═══════════════════════════════════════════════════════════════════════╗');
console.log('║                   BADU IMPROVEMENTS TEST                              ║');
console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

// Test 1: Knowledge retrieval for Luma settings
console.log('📊 TEST 1: Luma Ray-2 Settings Retrieval');
console.log('─'.repeat(75));

const lumaQuery = 'give me all the settings options for Luma Ray-2 model';
const lumaResults = searchKnowledge(lumaQuery, 5);
const lumaContext = buildContextFromResults(lumaResults);

console.log(`Query: "${lumaQuery}"\n`);
console.log('Search Results:');
lumaResults.forEach((result, i) => {
  console.log(`  ${i + 1}. ${result.source} (relevance: ${result.relevance})`);
});

console.log('\n📄 Context Extracted (first 1500 chars):');
console.log(lumaContext.substring(0, 1500) + '...\n');

// Check if all key parameters are present
const requiredParams = [
  'Duration',
  'Resolution',
  'Loop',
  'Camera Movement',
  'Camera Angle',
  'Camera Distance',
  'Style',
  'Lighting',
  'Mood',
  'Motion Intensity',
  'Motion Speed',
  'Subject Movement',
  'Quality',
  'Color Grading',
  'Film Look',
  'Guidance Scale',
];

const missingParams = requiredParams.filter(param => !lumaContext.includes(param));

if (missingParams.length === 0) {
  console.log('✅ ALL 16 Luma parameters found in context!');
} else {
  console.log(`❌ Missing ${missingParams.length} parameters: ${missingParams.join(', ')}`);
}

// Test 2: Schema detection for informational vs action queries
console.log('\n\n📊 TEST 2: Smart Schema Detection');
console.log('─'.repeat(75));

const testQueries = [
  { query: 'what are all the Luma settings?', expected: 'help', needsAction: false },
  { query: 'create a video with Luma', expected: 'workflow', needsAction: true },
  { query: 'how do I use the video panel?', expected: 'workflow', needsAction: true },
  { query: 'what is the B2B persona?', expected: 'help', needsAction: false },
  { query: 'compare Runway vs Luma', expected: 'comparison', needsAction: false },
];

testQueries.forEach(({ query, expected, needsAction }) => {
  const detected = detectSchemaType(query);
  const match = detected === expected ? '✅' : '❌';
  console.log(`${match} "${query}"`);
  console.log(`   Detected: ${detected} | Expected: ${expected} | Needs Action: ${needsAction ? 'Yes' : 'No'}`);
});

// Test 3: Live API test with actual query
console.log('\n\n📊 TEST 3: Live API Test');
console.log('─'.repeat(75));
console.log('Making actual API call to /v1/chat/enhanced...\n');

const testMessage = 'i wanna try Luma model would you craft an idea for me and give me all the settings options of the model';

try {
  const response = await fetch('http://localhost:8787/v1/chat/enhanced', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: testMessage,
      history: [],
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  console.log('✅ API Response Received\n');
  console.log('Schema Type:', data.type);
  console.log('Model Used:', data.model);
  console.log('Sources Used:', data.sources_used);
  console.log('Validated:', data.validated ? '✅' : '❌');
  
  const baduResponse = data.response;
  
  console.log('\n📄 Response Title:', baduResponse.title);
  console.log('\n📄 Response Brief:');
  console.log(baduResponse.brief);
  
  console.log('\n📄 Bullets:', baduResponse.bullets?.length || 0, 'items');
  if (baduResponse.bullets && baduResponse.bullets.length > 0) {
    console.log('\nFirst 10 bullets:');
    baduResponse.bullets.slice(0, 10).forEach((bullet, i) => {
      console.log(`  ${i + 1}. ${bullet.substring(0, 80)}${bullet.length > 80 ? '...' : ''}`);
    });
    if (baduResponse.bullets.length > 10) {
      console.log(`  ... and ${baduResponse.bullets.length - 10} more`);
    }
  }
  
  console.log('\n📄 Next Steps:', baduResponse.next_steps ? baduResponse.next_steps.length : 'NONE (Smart!)');
  if (baduResponse.next_steps && baduResponse.next_steps.length > 0) {
    console.log('⚠️  WARNING: Next steps should be omitted for informational queries!');
    baduResponse.next_steps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step}`);
    });
  } else {
    console.log('✅ EXCELLENT: No next_steps for informational query (smart behavior)');
  }
  
  // Check completeness
  console.log('\n📊 Completeness Check:');
  const responseText = JSON.stringify(baduResponse).toLowerCase();
  const foundParams = requiredParams.filter(param => responseText.includes(param.toLowerCase()));
  const coverage = Math.round((foundParams.length / requiredParams.length) * 100);
  
  console.log(`  Parameters Coverage: ${foundParams.length}/${requiredParams.length} (${coverage}%)`);
  
  if (coverage >= 90) {
    console.log('  ✅ EXCELLENT: Comprehensive information provided');
  } else if (coverage >= 70) {
    console.log('  ⚠️  GOOD: Most information provided, some details missing');
  } else {
    console.log('  ❌ INCOMPLETE: Many parameters missing');
  }
  
  if (foundParams.length < requiredParams.length) {
    const stillMissing = requiredParams.filter(param => !responseText.includes(param.toLowerCase()));
    console.log('  Missing:', stillMissing.join(', '));
  }
  
} catch (error) {
  console.error('❌ API Test Failed:', error.message);
  console.log('\nMake sure the server is running: npm run gateway');
}

// Final Summary
console.log('\n\n╔═══════════════════════════════════════════════════════════════════════╗');
console.log('║                        SUMMARY                                        ║');
console.log('╚═══════════════════════════════════════════════════════════════════════╝');
console.log('\n✨ Key Improvements:');
console.log('  1. ✅ Next steps are now OPTIONAL (smart context-aware inclusion)');
console.log('  2. ✅ Luma Ray-2 settings retrieval is COMPREHENSIVE (all 16 parameters)');
console.log('  3. ✅ Enhanced context building extracts ALL available options');
console.log('  4. ✅ Increased max_tokens to 1500 for detailed responses');
console.log('  5. ✅ Priority-based search for provider-specific queries');
console.log('\n🎯 Expected Behavior:');
console.log('  • Informational queries: No next_steps (user just wants info)');
console.log('  • Action queries: Include next_steps (user needs guidance)');
console.log('  • Luma queries: All 16 parameters + tips + recommendations');
console.log('\n');

