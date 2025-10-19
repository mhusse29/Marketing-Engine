#!/usr/bin/env node
/**
 * Smart Formatting Test
 * Tests the new schema types: comparison_table, categorized_settings, decision_tree
 */

import { detectSchemaType, validateResponse, RESPONSE_SCHEMAS } from './shared/badu-schemas.js';

console.log(`
╔════════════════════════════════════════════════════════════════════════╗
║        🎨 BADU SMART FORMATTING TEST                                  ║
╚════════════════════════════════════════════════════════════════════════╝

Testing new formatting schemas and query detection...
`);

const tests = [
  // Test 1: Decision Tree Detection
  {
    name: 'Decision Tree Detection',
    query: 'Which video provider should I choose?',
    expectedSchema: 'decision_tree',
  },
  {
    name: 'Decision Tree Detection (alternative)',
    query: 'Help me decide between Runway and Luma',
    expectedSchema: 'decision_tree',
  },
  
  // Test 2: Comparison Table Detection
  {
    name: 'Comparison Table Detection',
    query: 'Compare Runway vs Luma features',
    expectedSchema: 'comparison_table',
  },
  {
    name: 'Comparison Table Detection (specs)',
    query: 'What are the differences between DALL-E and FLUX settings?',
    expectedSchema: 'comparison_table',
  },
  
  // Test 3: Categorized Settings Detection
  {
    name: 'Categorized Settings Detection',
    query: 'Show me all Luma settings',
    expectedSchema: 'categorized_settings',
  },
  {
    name: 'Categorized Settings Detection (parameters)',
    query: 'What are all the parameters for Runway?',
    expectedSchema: 'categorized_settings',
  },
  
  // Test 4: Existing schemas still work
  {
    name: 'Help Schema (informational)',
    query: 'What is Luma Ray-2?',
    expectedSchema: 'help',
  },
  {
    name: 'Comparison Schema (pros/cons)',
    query: 'Compare Runway vs Luma',
    expectedSchema: 'comparison',
  },
  {
    name: 'Workflow Schema',
    query: 'How do I create a video campaign?',
    expectedSchema: 'workflow',
  },
  {
    name: 'Settings Guide Schema',
    query: 'What settings should I use for Instagram?',
    expectedSchema: 'settings_guide',
  },
];

// Schema Detection Tests
console.log('📋 SCHEMA DETECTION TESTS\n');
console.log('─'.repeat(76));

let detectionPassed = 0;
let detectionFailed = 0;

tests.forEach((test, index) => {
  const detected = detectSchemaType(test.query);
  const passed = detected === test.expectedSchema;
  
  if (passed) {
    console.log(`✅ Test ${index + 1}: ${test.name}`);
    console.log(`   Query: "${test.query}"`);
    console.log(`   Detected: ${detected} ✓\n`);
    detectionPassed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${test.name}`);
    console.log(`   Query: "${test.query}"`);
    console.log(`   Expected: ${test.expectedSchema}`);
    console.log(`   Got: ${detected} ✗\n`);
    detectionFailed++;
  }
});

console.log('─'.repeat(76));
console.log(`Schema Detection: ${detectionPassed}/${tests.length} passed (${Math.round(detectionPassed / tests.length * 100)}%)\n`);

// Schema Validation Tests
console.log('\n🔧 SCHEMA VALIDATION TESTS\n');
console.log('─'.repeat(76));

const validationTests = [
  {
    name: 'Comparison Table Schema',
    schema: 'comparison_table',
    data: {
      title: 'Test Comparison',
      brief: 'Testing comparison table',
      table: {
        headers: ['Feature', 'Option A', 'Option B'],
        rows: [
          { feature: 'Speed', values: ['Fast', 'Slow'] },
        ],
      },
      recommendation: 'Use Option A',
      sources: ['Test'],
    },
  },
  {
    name: 'Categorized Settings Schema',
    schema: 'categorized_settings',
    data: {
      title: 'Test Settings',
      brief: 'Testing categorized settings',
      categories: [
        {
          category_name: 'Basic',
          icon: '🎬',
          settings: [
            { name: 'Duration', options: '5s, 9s' },
          ],
        },
      ],
      sources: ['Test'],
    },
  },
  {
    name: 'Decision Tree Schema',
    schema: 'decision_tree',
    data: {
      title: 'Test Decision',
      brief: 'Testing decision tree',
      decision_question: 'Which should I choose?',
      branches: [
        {
          condition: 'Need speed',
          recommendation: 'Option A',
          reason: 'It is faster',
        },
      ],
      sources: ['Test'],
    },
  },
  {
    name: 'Comparison with Callout',
    schema: 'comparison',
    data: {
      title: 'Test Comparison',
      brief: 'Testing comparison with callout',
      comparisons: [
        {
          name: 'Option A',
          pros: ['Fast'],
          cons: ['Expensive'],
          best_for: ['Speed'],
        },
      ],
      recommendation: 'Use Option A',
      callout: {
        type: 'tip',
        message: 'This is a pro tip',
      },
      sources: ['Test'],
    },
  },
];

let validationPassed = 0;
let validationFailed = 0;

validationTests.forEach((test, index) => {
  const result = validateResponse(test.data, test.schema);
  
  if (result.valid) {
    console.log(`✅ Test ${index + 1}: ${test.name}`);
    console.log(`   Schema: ${test.schema}`);
    console.log(`   Status: Valid ✓\n`);
    validationPassed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${test.name}`);
    console.log(`   Schema: ${test.schema}`);
    console.log(`   Errors: ${result.errors.join(', ')}\n`);
    validationFailed++;
  }
});

console.log('─'.repeat(76));
console.log(`Schema Validation: ${validationPassed}/${validationTests.length} passed (${Math.round(validationPassed / validationTests.length * 100)}%)\n`);

// Final Summary
console.log(`
╔════════════════════════════════════════════════════════════════════════╗
║                        📊 FINAL RESULTS                               ║
╚════════════════════════════════════════════════════════════════════════╝

Schema Detection Tests:    ${detectionPassed}/${tests.length} passed (${Math.round(detectionPassed / tests.length * 100)}%)
Schema Validation Tests:   ${validationPassed}/${validationTests.length} passed (${Math.round(validationPassed / validationTests.length * 100)}%)

Overall Status:            ${detectionPassed === tests.length && validationPassed === validationTests.length ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}

╔════════════════════════════════════════════════════════════════════════╗
║  🎨 NEW FORMATTING STYLES AVAILABLE                                   ║
╚════════════════════════════════════════════════════════════════════════╝

1. 📊 Comparison Tables    - Side-by-side feature comparisons
2. 📑 Categorized Settings - Settings organized by category with icons
3. 🌳 Decision Trees       - "Which should I choose" with branches
4. 💡 Callout Boxes        - Tips, warnings, info, success boxes

Trigger Patterns:
─────────────────────────────────────────────────────────────────────────
Comparison Table:     "Compare X vs Y features/settings/specs"
Categorized Settings: "Show me all [provider] settings"
Decision Tree:        "Which should I choose", "Help me decide"
Callout Boxes:        Automatically added by LLM based on context

`);

process.exit(detectionPassed === tests.length && validationPassed === validationTests.length ? 0 : 1);


