#!/bin/bash

# Analytics Gateway Startup Script
# Project: SINAIQ (wkhcakxjhmwapvqjrxld)

echo "🚀 Starting Analytics Gateway"
echo "=============================="
echo ""

# Supabase Configuration
export SUPABASE_URL="https://wkhcakxjhmwapvqjrxld.supabase.co"

# Analytics Gateway Key (for admin dashboard to bypass Supabase auth)
export ANALYTICS_GATEWAY_KEY="admin-analytics-2024"

# Check if service role key is set
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is not set!"
  echo ""
  echo "📝 To get your service role key:"
  echo "   1. Go to: https://supabase.com/dashboard/project/wkhcakxjhmwapvqjrxld/settings/api"
  echo "   2. Copy the 'service_role' key (under 'Project API keys')"
  echo "   3. Run: export SUPABASE_SERVICE_ROLE_KEY='your-key-here'"
  echo "   4. Then run this script again"
  echo ""
  exit 1
fi

# Optional: Enable file logging
export ANALYTICS_LOG_FILE="logs/analytics-gateway.log"

# Create logs directory if it doesn't exist
mkdir -p logs

echo "✅ Configuration loaded"
echo "   Supabase URL: $SUPABASE_URL"
echo "   Log file: $ANALYTICS_LOG_FILE"
echo ""

# Start the gateway
echo "🚀 Starting gateway on port 8788..."
npm run gateway:start
