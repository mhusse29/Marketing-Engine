#!/bin/bash
# Vercel Deployment Script
# Your Account: https://vercel.com/mohamed-3276s-project
# User ID: E5BQ6XPzaDnBzQLQQYXHSF1Q

echo "🚀 Deploying Analytics Dashboard to Vercel..."
echo ""

# Step 1: Build the frontend with proper env vars
echo "📦 Building frontend..."
VITE_SUPABASE_URL=https://wkhcakxjhmwapvqjrxld.supabase.co \
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraGNha3hqaG13YXB2cWpyeGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjA4MDcsImV4cCI6MjA3NjI5NjgwN30.EMrmcipkt-v-lp7JNf5Hv5yBpYAghmBf2gE7JR4jq0c \
VITE_ANALYTICS_GATEWAY_URL=/api \
npm run analytics:build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build complete!"
echo ""

# Step 2: Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo ""
echo "You'll be asked to:"
echo "  1. Login to Vercel (if not already)"
echo "  2. Link to your project"
echo ""

npx vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Go to https://vercel.com/mohamed-3276s-project"
echo "  2. Add environment variables:"
echo "     - SUPABASE_URL"
echo "     - SUPABASE_SERVICE_ROLE_KEY"
echo "     - ANALYTICS_GATEWAY_KEY"
echo "  3. Trigger a redeploy"
