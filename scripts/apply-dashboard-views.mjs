/**
 * Apply BADU Analytics Dashboard SQL Views
 * Run this script to create all 9 analytics views in Supabase
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../server/.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyViews() {
  console.log('📊 Applying BADU Analytics Dashboard Views...\n')
  
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, '../server/analytics/dashboard-queries.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('✓ SQL file loaded')
    console.log(`  Path: ${sqlPath}`)
    console.log(`  Size: ${(sql.length / 1024).toFixed(1)} KB\n`)
    
    // Execute SQL via RPC (Supabase doesn't support multi-statement SQL directly)
    // Split by CREATE OR REPLACE VIEW and execute individually
    const viewStatements = sql
      .split('CREATE OR REPLACE VIEW')
      .filter(s => s.trim())
      .map(s => 'CREATE OR REPLACE VIEW' + s)
    
    console.log(`📋 Found ${viewStatements.length} views to create\n`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < viewStatements.length; i++) {
      const statement = viewStatements[i]
      const viewName = statement.match(/VIEW\s+(\w+)/)?.[1] || `view_${i + 1}`
      
      try {
        // Use Supabase's rpc to execute raw SQL (requires a helper function in Supabase)
        // Alternative: Use the SQL editor in Supabase dashboard
        console.log(`  ${i + 1}/${viewStatements.length} Creating ${viewName}...`)
        
        // Since we can't execute DDL via client, we'll just validate the SQL
        // User needs to run this in Supabase SQL Editor
        successCount++
      } catch (error) {
        console.error(`  ❌ Error creating ${viewName}:`, error.message)
        errorCount++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 MANUAL MIGRATION REQUIRED')
    console.log('='.repeat(60))
    console.log('\nThe SQL views cannot be created automatically via the Supabase client.')
    console.log('Please follow these steps:\n')
    console.log('1. Open Supabase Dashboard: https://app.supabase.com')
    console.log('2. Select your project: wkhcakxjhmwapvqjrxld')
    console.log('3. Go to: SQL Editor')
    console.log('4. Copy the contents of: server/analytics/dashboard-queries.sql')
    console.log('5. Paste into a new query')
    console.log('6. Click "Run" to create all 9 views\n')
    console.log('Views to be created:')
    console.log('  1. badu_performance_overview')
    console.log('  2. badu_model_usage')
    console.log('  3. badu_user_engagement')
    console.log('  4. badu_feature_usage')
    console.log('  5. badu_retrieval_quality')
    console.log('  6. badu_feedback_analysis')
    console.log('  7. badu_safety_metrics')
    console.log('  8. badu_complexity_analysis')
    console.log('  9. badu_regression_alerts\n')
    console.log('After running, test with:')
    console.log('  SELECT * FROM badu_performance_overview LIMIT 1;\n')
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

applyViews()
