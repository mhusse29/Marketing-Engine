/**
 * TRACKING SETUP VERIFICATION
 * Verifies database tables and tracking infrastructure is ready
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Please set:');
  console.log('  - VITE_SUPABASE_URL');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

async function checkTable(tableName, expectedColumns) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      log(colors.red, `  ❌ ${tableName}: Not accessible (${error.message})`);
      return false;
    }

    log(colors.green, `  ✅ ${tableName}: Exists (${count || 0} rows)`);
    return true;
  } catch (error) {
    log(colors.red, `  ❌ ${tableName}: Error (${error.message})`);
    return false;
  }
}

async function checkDemoSubscription() {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('plan_type', 'demo')
      .limit(1);

    if (error) {
      log(colors.yellow, '  ⚠️  Could not query subscriptions');
      return false;
    }

    if (data && data.length > 0) {
      log(colors.green, '  ✅ Demo subscription exists');
      log(colors.cyan, `     Plan: ${data[0].plan_name}`);
      log(colors.cyan, `     Content limit: ${data[0].content_generations_limit}`);
      log(colors.cyan, `     Image limit: ${data[0].image_generations_limit}`);
      log(colors.cyan, `     Video limit: ${data[0].video_generations_limit}`);
      return true;
    } else {
      log(colors.yellow, '  ⚠️  No demo subscriptions found yet');
      return false;
    }
  } catch (error) {
    log(colors.red, `  ❌ Error checking demo subscription: ${error.message}`);
    return false;
  }
}

async function checkDatabaseFunctions() {
  try {
    // Try to call the function (it will fail if it doesn't exist)
    const { error } = await supabase.rpc('check_usage_limit', {
      p_user_id: 'test-id',
      p_service_type: 'content'
    });

    // Function exists if we get a result or a normal error (not "function not found")
    if (!error || !error.message?.includes('does not exist')) {
      log(colors.green, '  ✅ check_usage_limit(): Function exists');
      return true;
    } else {
      log(colors.red, '  ❌ check_usage_limit(): Function not found');
      return false;
    }
  } catch (error) {
    log(colors.yellow, '  ⚠️  Could not verify functions');
    return false;
  }
}

async function verifyAll() {
  log(colors.cyan, '\n' + '='.repeat(60));
  log(colors.cyan, '🔍 TRACKING SETUP VERIFICATION');
  log(colors.cyan, '='.repeat(60));

  // Check tables
  log(colors.blue, '\n📊 Checking Database Tables...');
  const tables = [
    'api_usage',
    'user_subscriptions',
    'usage_alerts',
    'api_rate_limits',
    'usage_aggregations',
    'campaigns',
  ];

  const tableResults = [];
  for (const table of tables) {
    const result = await checkTable(table);
    tableResults.push(result);
  }

  // Check demo subscription
  log(colors.blue, '\n🎫 Checking Demo Subscription...');
  const demoExists = await checkDemoSubscription();

  // Check database functions
  log(colors.blue, '\n⚙️  Checking Database Functions...');
  const functionsExist = await checkDatabaseFunctions();

  // Check tracking files
  log(colors.blue, '\n📁 Checking Tracking Files...');
  const fs = await import('fs');
  const files = [
    'server/authMiddleware.mjs',
    'server/usageTracker.mjs',
    'src/components/UsagePanel.tsx',
  ];

  const fileResults = [];
  for (const file of files) {
    const exists = fs.existsSync(file);
    if (exists) {
      log(colors.green, `  ✅ ${file}`);
      fileResults.push(true);
    } else {
      log(colors.red, `  ❌ ${file}: Missing`);
      fileResults.push(false);
    }
  }

  // Summary
  log(colors.cyan, '\n' + '='.repeat(60));
  log(colors.cyan, '📋 VERIFICATION SUMMARY');
  log(colors.cyan, '='.repeat(60));

  const allTablesOk = tableResults.every(r => r);
  const allFilesOk = fileResults.every(r => r);

  log(allTablesOk ? colors.green : colors.red, 
    `${allTablesOk ? '✅' : '❌'} Database Tables: ${tableResults.filter(Boolean).length}/${tables.length} OK`);
  
  log(demoExists ? colors.green : colors.yellow,
    `${demoExists ? '✅' : '⚠️ '} Demo Subscription: ${demoExists ? 'Ready' : 'Will be created on first user signup'}`);
  
  log(functionsExist ? colors.green : colors.red,
    `${functionsExist ? '✅' : '❌'} Database Functions: ${functionsExist ? 'Ready' : 'Not found'}`);
  
  log(allFilesOk ? colors.green : colors.red,
    `${allFilesOk ? '✅' : '❌'} Tracking Files: ${fileResults.filter(Boolean).length}/${files.length} OK`);

  const allOk = allTablesOk && functionsExist && allFilesOk;

  log(colors.cyan, '\n' + '='.repeat(60));
  
  if (allOk) {
    log(colors.green, '\n🎉 ALL CHECKS PASSED! Tracking system is ready!');
    log(colors.blue, '\nNext steps:');
    log(colors.cyan, '  1. Start your AI gateway: npm run dev');
    log(colors.cyan, '  2. Use any feature (generate content, chat, etc.)');
    log(colors.cyan, '  3. Check Settings → Usage & Costs to see tracking data');
  } else {
    log(colors.yellow, '\n⚠️  Some checks failed. Review the issues above.');
    if (!allTablesOk || !functionsExist) {
      log(colors.yellow, '\nTo fix database issues:');
      log(colors.cyan, '  1. Go to Supabase dashboard');
      log(colors.cyan, '  2. Run the migration in supabase/migrations/');
      log(colors.cyan, '  3. Or use Supabase MCP to apply it');
    }
  }

  log(colors.cyan, '\n' + '='.repeat(60) + '\n');
}

verifyAll().catch(error => {
  log(colors.red, '\n❌ Verification failed:', error.message);
  process.exit(1);
});
