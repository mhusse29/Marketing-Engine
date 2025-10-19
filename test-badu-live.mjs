#!/usr/bin/env node

/**
 * Comprehensive Live Test for BADU Enhanced
 * Tests actual API responses and analyzes quality
 */

const API_BASE = 'http://localhost:8787';

// Test queries covering all scenarios
const testCases = [
  {
    id: 1,
    category: 'Content Panel - Basic',
    query: 'How do I use the Content panel?',
    expectedType: 'help',
    expectedInfo: ['brief', 'platforms', 'persona', 'tone', 'validate'],
  },
  {
    id: 2,
    category: 'Content Panel - Specific',
    query: 'What persona should I choose for B2B campaigns?',
    expectedType: 'help',
    expectedInfo: ['B2B DM', 'Professional', 'LinkedIn'],
  },
  {
    id: 3,
    category: 'Pictures - Provider Comparison',
    query: 'Compare FLUX and DALL-E for product photography',
    expectedType: 'comparison',
    expectedInfo: ['FLUX', 'DALL-E', 'photorealistic', 'commercial'],
  },
  {
    id: 4,
    category: 'Pictures - Provider Selection',
    query: 'Which image provider should I use for lifestyle photos with people?',
    expectedType: 'help',
    expectedInfo: ['FLUX', 'photorealistic', 'people'],
  },
  {
    id: 5,
    category: 'Pictures - Settings',
    query: 'What settings should I use for Instagram Stories images?',
    expectedType: 'settings_guide',
    expectedInfo: ['9:16', 'aspect', 'Instagram', 'Stories'],
  },
  {
    id: 6,
    category: 'Video - Provider Comparison',
    query: 'Runway vs Luma - which should I use for social media?',
    expectedType: 'comparison',
    expectedInfo: ['Runway', 'Luma', 'social media', 'fast'],
  },
  {
    id: 7,
    category: 'Video - Workflow',
    query: 'How do I create a video advertisement step by step?',
    expectedType: 'workflow',
    expectedInfo: ['step', 'video', 'provider', 'prompt'],
  },
  {
    id: 8,
    category: 'Video - Advanced Settings',
    query: 'What camera settings should I use for Luma Ray-2?',
    expectedType: 'help',
    expectedInfo: ['camera', 'movement', 'angle', 'Luma'],
  },
  {
    id: 9,
    category: 'Troubleshooting',
    query: 'Why can\'t I validate the Content panel?',
    expectedType: 'troubleshooting',
    expectedInfo: ['validate', 'brief', 'platform', 'solution'],
  },
  {
    id: 10,
    category: 'Complete Workflow',
    query: 'How do I create a complete marketing campaign from start to finish?',
    expectedType: 'workflow',
    expectedInfo: ['content', 'pictures', 'video', 'step'],
  },
];

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(colors[color], ...args, colors.reset);
}

// Check if gateway is running
async function checkGateway() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Call the enhanced endpoint
async function testQuery(query) {
  try {
    const response = await fetch(`${API_BASE}/v1/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query, history: [] }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

// Analyze response quality
function analyzeResponse(testCase, apiResponse) {
  const analysis = {
    testId: testCase.id,
    category: testCase.category,
    query: testCase.query,
    success: true,
    issues: [],
    scores: {},
  };

  // Check for API error
  if (apiResponse.error) {
    analysis.success = false;
    analysis.issues.push(`API Error: ${apiResponse.error}`);
    return analysis;
  }

  const { response, type, validated, sources_used } = apiResponse;

  // 1. Check schema type detection
  if (type !== testCase.expectedType) {
    analysis.issues.push(`Schema mismatch: expected '${testCase.expectedType}', got '${type}'`);
    analysis.scores.schemaDetection = 0;
  } else {
    analysis.scores.schemaDetection = 100;
  }

  // 2. Check validation status
  if (!validated) {
    analysis.issues.push('Response failed schema validation');
    analysis.scores.validation = 0;
  } else {
    analysis.scores.validation = 100;
  }

  // 3. Check source usage
  if (!sources_used || sources_used === 0) {
    analysis.issues.push('No sources used (hallucination risk)');
    analysis.scores.grounding = 0;
  } else {
    analysis.scores.grounding = 100;
  }

  // 4. Check response structure
  if (!response || typeof response !== 'object') {
    analysis.issues.push('Response is not a structured object');
    analysis.scores.structure = 0;
  } else {
    // Check required fields for the schema type
    const requiredFields = {
      help: ['title', 'brief', 'bullets', 'next_steps'],
      comparison: ['title', 'brief', 'comparisons', 'recommendation'],
      workflow: ['title', 'brief', 'steps', 'tips'],
      settings_guide: ['title', 'brief', 'panel', 'settings'],
      troubleshooting: ['title', 'problem', 'causes', 'solutions'],
    };

    const required = requiredFields[type] || [];
    const missing = required.filter(field => !(field in response));
    
    if (missing.length > 0) {
      analysis.issues.push(`Missing fields: ${missing.join(', ')}`);
      analysis.scores.structure = Math.max(0, 100 - (missing.length * 25));
    } else {
      analysis.scores.structure = 100;
    }
  }

  // 5. Check information completeness
  const responseText = JSON.stringify(response).toLowerCase();
  const foundInfo = testCase.expectedInfo.filter(info => 
    responseText.includes(info.toLowerCase())
  );
  const completeness = (foundInfo.length / testCase.expectedInfo.length) * 100;
  analysis.scores.completeness = completeness;
  
  if (completeness < 50) {
    analysis.issues.push(
      `Low information completeness (${completeness.toFixed(0)}%). Missing: ${
        testCase.expectedInfo.filter(info => !responseText.includes(info.toLowerCase())).join(', ')
      }`
    );
  }

  // 6. Check response length (not too short, not too long)
  const briefLength = response.brief?.length || 0;
  if (briefLength < 50) {
    analysis.issues.push('Brief is too short (< 50 chars)');
    analysis.scores.length = 50;
  } else if (briefLength > 500) {
    analysis.issues.push('Brief is too long (> 500 chars)');
    analysis.scores.length = 75;
  } else {
    analysis.scores.length = 100;
  }

  // Calculate overall score
  const scoreValues = Object.values(analysis.scores);
  analysis.overallScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;

  // Determine success
  analysis.success = analysis.overallScore >= 70 && analysis.issues.length < 3;

  return analysis;
}

// Main test execution
async function runTests() {
  log('cyan', '\n🧪 BADU Enhanced - Comprehensive Live Test\n');
  log('cyan', '='.repeat(70));

  // Check gateway
  log('blue', '\n📡 Checking Gateway Connection...');
  const gatewayRunning = await checkGateway();
  
  if (!gatewayRunning) {
    log('red', '❌ Gateway is not running!');
    log('yellow', '\nStart the gateway first:');
    log('yellow', '  cd server && node ai-gateway.mjs\n');
    process.exit(1);
  }
  log('green', '✓ Gateway is running\n');

  // Run all tests
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    log('blue', `\n[${i + 1}/${testCases.length}] Testing: ${testCase.category}`);
    log('cyan', `Query: "${testCase.query}"`);
    
    // Call API
    const startTime = Date.now();
    const apiResponse = await testQuery(testCase.query);
    const duration = Date.now() - startTime;
    
    // Analyze response
    const analysis = analyzeResponse(testCase, apiResponse);
    analysis.duration = duration;
    results.push(analysis);
    
    // Display results
    if (analysis.success) {
      log('green', `✓ PASS (${analysis.overallScore.toFixed(0)}% - ${duration}ms)`);
    } else {
      log('red', `✗ FAIL (${analysis.overallScore.toFixed(0)}% - ${duration}ms)`);
    }
    
    // Show issues
    if (analysis.issues.length > 0) {
      analysis.issues.forEach(issue => {
        log('yellow', `  ⚠ ${issue}`);
      });
    }
    
    // Show scores
    const scoreDisplay = Object.entries(analysis.scores)
      .map(([key, value]) => `${key}: ${value.toFixed(0)}%`)
      .join(', ');
    log('cyan', `  Scores: ${scoreDisplay}`);
    
    // Show actual response type and sources
    if (apiResponse.type) {
      log('magenta', `  Type: ${apiResponse.type}, Sources: ${apiResponse.sources_used || 0}`);
    }
  }

  // Summary
  log('cyan', '\n' + '='.repeat(70));
  log('cyan', '📊 Test Summary\n');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  log('bright', `Total Tests: ${results.length}`);
  log('green', `Passed: ${passed} (${(passed / results.length * 100).toFixed(0)}%)`);
  if (failed > 0) {
    log('red', `Failed: ${failed} (${(failed / results.length * 100).toFixed(0)}%)`);
  }
  log('bright', `Average Score: ${avgScore.toFixed(1)}%`);
  log('bright', `Average Duration: ${avgDuration.toFixed(0)}ms`);
  
  // Score breakdown
  log('cyan', '\n📈 Score Breakdown:\n');
  const scoreCategories = ['schemaDetection', 'validation', 'grounding', 'structure', 'completeness', 'length'];
  scoreCategories.forEach(category => {
    const scores = results.map(r => r.scores[category] || 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const bar = '█'.repeat(Math.round(avg / 5)) + '░'.repeat(20 - Math.round(avg / 5));
    log('cyan', `  ${category.padEnd(20)}: ${bar} ${avg.toFixed(0)}%`);
  });
  
  // Issues summary
  const allIssues = results.flatMap(r => r.issues);
  if (allIssues.length > 0) {
    log('yellow', '\n⚠️  Common Issues Found:\n');
    const issueCounts = {};
    allIssues.forEach(issue => {
      const key = issue.split(':')[0];
      issueCounts[key] = (issueCounts[key] || 0) + 1;
    });
    Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([issue, count]) => {
        log('yellow', `  • ${issue} (${count}x)`);
      });
  }
  
  // Recommendations
  log('cyan', '\n💡 Recommendations:\n');
  if (avgScore < 70) {
    log('red', '  ❌ System needs improvement - score below 70%');
  } else if (avgScore < 90) {
    log('yellow', '  ⚠️  System is functional but could be optimized');
  } else {
    log('green', '  ✅ System is performing excellently!');
  }
  
  if (avgDuration > 3000) {
    log('yellow', '  ⚠️  Response time is slow (>3s) - consider optimization');
  } else {
    log('green', '  ✅ Response time is good');
  }
  
  // Failed tests details
  if (failed > 0) {
    log('red', '\n❌ Failed Tests Details:\n');
    results.filter(r => !r.success).forEach(result => {
      log('red', `  Test ${result.testId}: ${result.category}`);
      log('yellow', `    Query: "${result.query}"`);
      log('yellow', `    Score: ${result.overallScore.toFixed(0)}%`);
      result.issues.forEach(issue => {
        log('yellow', `    - ${issue}`);
      });
    });
  }
  
  log('cyan', '\n' + '='.repeat(70));
  
  // Exit code
  if (avgScore >= 70 && failed <= 2) {
    log('green', '\n✅ BADU Enhanced is working well!\n');
    process.exit(0);
  } else {
    log('red', '\n❌ BADU Enhanced needs fixes!\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log('red', '\n💥 Test execution failed:');
  console.error(error);
  process.exit(1);
});


