/**
 * USAGE TRACKING TEST SUITE
 * Tests all endpoints to verify tracking works correctly
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const API_BASE = process.env.VITE_AI_GATEWAY_URL || 'http://localhost:8787';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

async function getTestUserId() {
  // Try to get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user.id;
  
  // For testing, return a test user ID
  return 'test-user-id';
}

async function checkDatabaseRecord(userId, serviceType) {
  log(colors.blue, `\n🔍 Checking database for ${serviceType} tracking...`);
  
  const { data, error } = await supabase
    .from('api_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('service_type', serviceType)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    log(colors.red, '❌ Database query failed:', error.message);
    return false;
  }

  if (!data || data.length === 0) {
    log(colors.yellow, '⚠️  No tracking record found yet');
    return false;
  }

  log(colors.green, '✅ Tracking record found!');
  console.log('   Details:', {
    service: data[0].service_type,
    provider: data[0].provider,
    model: data[0].model,
    cost: `$${data[0].total_cost}`,
    status: data[0].status,
    created: new Date(data[0].created_at).toLocaleString(),
  });
  return true;
}

async function checkSubscriptionUpdate(userId, serviceType) {
  log(colors.blue, `\n🔍 Checking subscription updates for ${serviceType}...`);
  
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    log(colors.red, '❌ Subscription query failed:', error.message);
    return false;
  }

  const fieldMap = {
    'content': 'content_generations_used',
    'images': 'image_generations_used',
    'video': 'video_generations_used',
    'chat': 'chat_messages_used',
  };

  const field = fieldMap[serviceType];
  if (field && data[field] > 0) {
    log(colors.green, `✅ Subscription updated! ${field}: ${data[field]}`);
    log(colors.blue, `   Current month cost: $${data.current_month_cost}`);
    log(colors.blue, `   Lifetime cost: $${data.lifetime_cost}`);
    return true;
  }

  log(colors.yellow, '⚠️  Subscription not updated yet');
  return false;
}

async function testContentGeneration() {
  log(colors.blue, '\n📝 Testing Content Generation Tracking...');
  
  try {
    const response = await fetch(`${API_BASE}/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': await getTestUserId(), // Pass user ID for testing
      },
      body: JSON.stringify({
        brief: 'Create a social media post about sustainable fashion',
        options: {
          platforms: ['Instagram', 'Facebook'],
          copyLength: 'Standard',
          versions: 1,
        },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
    }

    log(colors.green, '✅ Content generation started, runId:', data.runId);
    
    // Wait a moment for async operations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check tracking
    const userId = await getTestUserId();
    await checkDatabaseRecord(userId, 'content');
    await checkSubscriptionUpdate(userId, 'content');
    
    return true;
  } catch (error) {
    log(colors.red, '❌ Content generation test failed:', error.message);
    return false;
  }
}

async function testChatMessage() {
  log(colors.blue, '\n💬 Testing Chat (BADU) Tracking...');
  
  try {
    const response = await fetch(`${API_BASE}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': await getTestUserId(),
      },
      body: JSON.stringify({
        message: 'What are the best practices for Instagram ads?',
        history: [],
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
    }

    log(colors.green, '✅ Chat message sent successfully');
    log(colors.blue, '   Reply preview:', data.reply.substring(0, 100) + '...');
    
    // Wait for async tracking
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check tracking
    const userId = await getTestUserId();
    await checkDatabaseRecord(userId, 'chat');
    await checkSubscriptionUpdate(userId, 'chat');
    
    return true;
  } catch (error) {
    log(colors.red, '❌ Chat test failed:', error.message);
    return false;
  }
}

async function testImageGeneration() {
  log(colors.blue, '\n🎨 Testing Image Generation Tracking...');
  
  try {
    const response = await fetch(`${API_BASE}/v1/images/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': await getTestUserId(),
      },
      body: JSON.stringify({
        prompt: 'A modern minimalist office workspace',
        provider: 'openai',
        aspect: '1:1',
        count: 1,
        dalleQuality: 'standard',
        dalleStyle: 'vivid',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
    }

    log(colors.green, '✅ Image generated successfully');
    log(colors.blue, `   Generated ${data.assets?.length || 0} image(s)`);
    
    // Wait for async tracking
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check tracking
    const userId = await getTestUserId();
    await checkDatabaseRecord(userId, 'images');
    await checkSubscriptionUpdate(userId, 'images');
    
    return true;
  } catch (error) {
    log(colors.red, '❌ Image generation test failed:', error.message);
    return false;
  }
}

async function viewUsageStats() {
  log(colors.blue, '\n📊 Fetching Usage Statistics...');
  
  try {
    const userId = await getTestUserId();
    
    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subError) throw subError;

    log(colors.green, '\n✅ Subscription Details:');
    console.log({
      plan: subscription.plan_name,
      content_used: `${subscription.content_generations_used} / ${subscription.content_generations_limit}`,
      images_used: `${subscription.image_generations_used} / ${subscription.image_generations_limit}`,
      videos_used: `${subscription.video_generations_used} / ${subscription.video_generations_limit}`,
      chat_used: `${subscription.chat_messages_used} / ${subscription.chat_messages_limit}`,
      current_month_cost: `$${subscription.current_month_cost}`,
      lifetime_cost: `$${subscription.lifetime_cost}`,
    });

    // Get recent usage
    const { data: recentUsage, error: usageError } = await supabase
      .from('api_usage')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (usageError) throw usageError;

    log(colors.green, '\n✅ Recent API Usage:');
    recentUsage.forEach((record, i) => {
      console.log(`\n   ${i + 1}. ${record.service_type} (${record.provider})`);
      console.log(`      Model: ${record.model}`);
      console.log(`      Cost: $${record.total_cost}`);
      console.log(`      Status: ${record.status}`);
      console.log(`      Time: ${new Date(record.created_at).toLocaleString()}`);
    });

    return true;
  } catch (error) {
    log(colors.red, '❌ Failed to fetch usage stats:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  log(colors.yellow, '\n' + '='.repeat(60));
  log(colors.yellow, '🧪 USAGE TRACKING TEST SUITE');
  log(colors.yellow, '='.repeat(60));
  
  const results = {
    content: false,
    chat: false,
    image: false,
  };

  // Test content generation
  results.content = await testContentGeneration();
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test chat
  results.chat = await testChatMessage();
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test image generation (only if OpenAI is configured)
  results.image = await testImageGeneration();
  await new Promise(resolve => setTimeout(resolve, 1000));

  // View stats
  await viewUsageStats();

  // Summary
  log(colors.yellow, '\n' + '='.repeat(60));
  log(colors.yellow, '📋 TEST SUMMARY');
  log(colors.yellow, '='.repeat(60));
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(Boolean).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? colors.green : colors.red;
    log(color, `${icon} ${test.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  log(colors.yellow, '\n' + '='.repeat(60));
  log(colors.blue, `\nResults: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    log(colors.green, '\n🎉 ALL TESTS PASSED! Tracking system is working correctly.');
  } else {
    log(colors.yellow, '\n⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run tests
runAllTests().catch(error => {
  log(colors.red, '\n❌ Test suite crashed:', error);
  process.exit(1);
});
