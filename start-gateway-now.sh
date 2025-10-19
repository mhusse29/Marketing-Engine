#!/bin/bash

echo "🚀 Starting Analytics Gateway"
echo ""
echo "⚠️  You need your Supabase Service Role Key"
echo ""
echo "Get it from: https://supabase.com/dashboard/project/wkhcakxjhmwapvqjrxld/settings/api"
echo "Copy the 'service_role' key (secret key)"
echo ""
read -p "Paste your service_role key here: " SERVICE_KEY
echo ""

if [ -z "$SERVICE_KEY" ]; then
  echo "❌ No key provided. Exiting."
  exit 1
fi

export SUPABASE_URL="https://wkhcakxjhmwapvqjrxld.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY"

echo "✅ Starting gateway on port 8788..."
npm run gateway:start
