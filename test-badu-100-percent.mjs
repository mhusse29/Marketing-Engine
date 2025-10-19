#!/usr/bin/env node

/**
 * COMPREHENSIVE TEST: Verify 100% Settings Coverage for All Panels & Providers
 * Tests all 59 settings across Content, Pictures (4 providers), and Video (2 providers)
 */

console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
console.log('║       🎯 BADU 100% SETTINGS COVERAGE TEST                             ║');
console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

const API_BASE = 'http://localhost:8787';

// Test queries
const testCases = [
  // ========== CONTENT PANEL (11 settings) ==========
  {
    category: 'Content Panel',
    query: 'What are ALL the settings for Content panel?',
    expectedKeywords: [
      'Brief', 'Persona', 'Tone', 'CTA', 'Language', 'Copy Length', 
      'Platforms', 'Keywords', 'Hashtags', 'Avoid', 'Attachments'
    ],
    expectedCount: 11,
    panel: 'content',
  },
  {
    category: 'Content Panel',
    query: 'Tell me about B2B persona setting',
    expectedKeywords: ['B2B DM', 'Business Decision Maker', 'professional', 'LinkedIn'],
    expectedCount: 4,
    panel: 'content',
  },
  
  // ========== PICTURES: DALL-E 3 (4 settings) ==========
  {
    category: 'DALL-E 3',
    query: 'What are ALL the DALL-E 3 settings?',
    expectedKeywords: ['Quality', 'Style', 'vivid', 'natural', 'standard', 'hd', '1:1', '16:9'],
    expectedCount: 4,
    panel: 'pictures',
    provider: 'openai',
  },
  
  // ========== PICTURES: FLUX Pro (8 settings) ==========
  {
    category: 'FLUX Pro',
    query: 'What are ALL the FLUX Pro settings?',
    expectedKeywords: [
      'Mode', 'Guidance', 'Steps', 'Prompt Upsampling', 'RAW Mode', 
      'Output Format', 'ultra', 'standard', 'jpeg', 'png', 'webp'
    ],
    expectedCount: 8,
    panel: 'pictures',
    provider: 'flux',
  },
  
  // ========== PICTURES: Stability (7 settings) ==========
  {
    category: 'Stability SD 3.5',
    query: 'What are ALL the Stability SD 3.5 settings?',
    expectedKeywords: [
      'Model', 'CFG Scale', 'Steps', 'Style Preset', 'Negative Prompt',
      'large', 'turbo', 'medium', 'cinematic', 'photographic'
    ],
    expectedCount: 7,
    panel: 'pictures',
    provider: 'stability',
  },
  
  // ========== PICTURES: Ideogram (6 settings) ==========
  {
    category: 'Ideogram',
    query: 'What are ALL the Ideogram settings?',
    expectedKeywords: [
      'Model', 'Magic Prompt', 'Style Type', 'Negative Prompt',
      'v2', 'v1', 'turbo', 'REALISTIC', 'DESIGN'
    ],
    expectedCount: 6,
    panel: 'pictures',
    provider: 'ideogram',
  },
  
  // ========== VIDEO: Runway Veo-3 (4 settings) ==========
  {
    category: 'Runway Veo-3',
    query: 'What are ALL the Runway Veo-3 settings?',
    expectedKeywords: [
      'Aspect', 'Watermark', 'Seed', '9:16', '1:1', '16:9', '8 seconds'
    ],
    expectedCount: 4,
    panel: 'video',
    provider: 'runway',
  },
  
  // ========== VIDEO: Luma Ray-2 (19 settings) ==========
  {
    category: 'Luma Ray-2 - Basic',
    query: 'What are ALL the Luma Ray-2 basic settings?',
    expectedKeywords: ['Duration', 'Resolution', 'Loop', '5s', '9s', '720p', '1080p', 'seamless'],
    expectedCount: 4,
    panel: 'video',
    provider: 'luma',
  },
  {
    category: 'Luma Ray-2 - Camera',
    query: 'What are the Luma Ray-2 camera settings?',
    expectedKeywords: [
      'Camera Movement', 'Camera Angle', 'Camera Distance',
      'static', 'pan', 'zoom', 'orbit',
      'low', 'eye_level', 'high', 'bird',
      'close_up', 'medium', 'wide', 'extreme'
    ],
    expectedCount: 3,
    panel: 'video',
    provider: 'luma',
  },
  {
    category: 'Luma Ray-2 - Visual',
    query: 'What are the Luma Ray-2 visual settings?',
    expectedKeywords: [
      'Style', 'Lighting', 'Mood', 'Color Grading', 'Film Look',
      'cinematic', 'photorealistic', 'artistic',
      'natural', 'dramatic', 'golden_hour',
      'energetic', 'calm', 'epic',
      'warm', 'cool',
      '35mm', '16mm', 'vintage'
    ],
    expectedCount: 5,
    panel: 'video',
    provider: 'luma',
  },
  {
    category: 'Luma Ray-2 - Motion',
    query: 'What are the Luma Ray-2 motion settings?',
    expectedKeywords: [
      'Motion Intensity', 'Motion Speed', 'Subject Movement',
      'minimal', 'moderate', 'high', 'extreme',
      'slow_motion', 'normal', 'fast_motion',
      'static', 'subtle', 'active', 'dynamic'
    ],
    expectedCount: 3,
    panel: 'video',
    provider: 'luma',
  },
  {
    category: 'Luma Ray-2 - Technical',
    query: 'What are the Luma Ray-2 technical settings?',
    expectedKeywords: [
      'Quality', 'Seed', 'Guidance Scale', 'Negative Prompt',
      'standard', 'high', 'premium'
    ],
    expectedCount: 4,
    panel: 'video',
    provider: 'luma',
  },
  
  // ========== COMPREHENSIVE ==========
  {
    category: 'Complete Luma',
    query: 'Give me the complete list of ALL Luma Ray-2 settings with every option',
    expectedKeywords: [
      'Duration', 'Resolution', 'Loop',
      'Camera Movement', 'Camera Angle', 'Camera Distance',
      'Style', 'Lighting', 'Mood', 'Color Grading', 'Film Look',
      'Motion Intensity', 'Motion Speed', 'Subject Movement',
      'Quality', 'Guidance Scale', '19'
    ],
    expectedCount: 19,
    panel: 'video',
    provider: 'luma',
  },
];

// Track results
let totalTests = testCases.length;
let passedTests = 0;
let failedTests = [];
let partialTests = [];

console.log(`📋 Running ${totalTests} comprehensive tests...\n`);

// Run tests
for (const test of testCases) {
  process.stdout.write(`Testing: ${test.category.padEnd(30)}... `);
  
  try {
    const response = await fetch(`${API_BASE}/v1/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: test.query,
        history: [],
      }),
    });
    
    if (!response.ok) {
      console.log('❌ FAILED (HTTP error)');
      failedTests.push({ ...test, error: `HTTP ${response.status}` });
      continue;
    }
    
    const data = await response.json();
    const responseText = JSON.stringify(data.response).toLowerCase();
    
    // Count how many expected keywords are found
    const foundKeywords = test.expectedKeywords.filter(keyword => 
      responseText.includes(keyword.toLowerCase())
    );
    
    const coverage = (foundKeywords.length / test.expectedKeywords.length) * 100;
    
    if (coverage === 100) {
      console.log(`✅ PASS (${test.expectedKeywords.length}/${test.expectedKeywords.length})`);
      passedTests++;
    } else if (coverage >= 70) {
      console.log(`⚠️  PARTIAL (${foundKeywords.length}/${test.expectedKeywords.length} = ${Math.round(coverage)}%)`);
      partialTests.push({ 
        ...test, 
        coverage,
        found: foundKeywords.length,
        missing: test.expectedKeywords.filter(k => !foundKeywords.includes(k))
      });
    } else {
      console.log(`❌ FAILED (${foundKeywords.length}/${test.expectedKeywords.length} = ${Math.round(coverage)}%)`);
      failedTests.push({
        ...test,
        coverage,
        found: foundKeywords.length,
        missing: test.expectedKeywords.filter(k => !foundKeywords.includes(k))
      });
    }
    
  } catch (error) {
    console.log(`❌ FAILED (${error.message})`);
    failedTests.push({ ...test, error: error.message });
  }
}

// Print summary
console.log('\n\n╔════════════════════════════════════════════════════════════════════════╗');
console.log('║                        TEST RESULTS SUMMARY                            ║');
console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

console.log(`Total Tests:    ${totalTests}`);
console.log(`✅ Passed:      ${passedTests} (${Math.round((passedTests/totalTests)*100)}%)`);
console.log(`⚠️  Partial:    ${partialTests.length}`);
console.log(`❌ Failed:      ${failedTests.length}\n`);

if (partialTests.length > 0) {
  console.log('⚠️  PARTIAL TESTS (Need Review):');
  console.log('─'.repeat(75));
  partialTests.forEach(test => {
    console.log(`\n${test.category}: ${Math.round(test.coverage)}% coverage`);
    console.log(`Found: ${test.found}/${test.expectedKeywords.length}`);
    if (test.missing.length > 0 && test.missing.length <= 5) {
      console.log(`Missing: ${test.missing.join(', ')}`);
    }
  });
  console.log('');
}

if (failedTests.length > 0) {
  console.log('❌ FAILED TESTS:');
  console.log('─'.repeat(75));
  failedTests.forEach(test => {
    console.log(`\n${test.category}:`);
    if (test.error) {
      console.log(`Error: ${test.error}`);
    } else {
      console.log(`Coverage: ${Math.round(test.coverage)}%`);
      console.log(`Found: ${test.found}/${test.expectedKeywords.length}`);
      if (test.missing && test.missing.length <= 10) {
        console.log(`Missing: ${test.missing.join(', ')}`);
      }
    }
  });
  console.log('');
}

// Final grade
const grade = (passedTests/totalTests)*100;
let gradeLabel;
if (grade === 100) gradeLabel = 'A+ ✨ PERFECT';
else if (grade >= 90) gradeLabel = 'A ✅ EXCELLENT';
else if (grade >= 80) gradeLabel = 'B ⚠️  GOOD';
else if (grade >= 70) gradeLabel = 'C ⚠️  NEEDS WORK';
else gradeLabel = 'F ❌ CRITICAL';

console.log('╔════════════════════════════════════════════════════════════════════════╗');
console.log(`║  FINAL GRADE: ${gradeLabel.padEnd(60)}║`);
console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

// Exit code
process.exit(failedTests.length > 0 ? 1 : 0);


