#!/bin/bash
# Restart Analytics Services Script
# Use this to cleanly restart gateway and analytics server

echo "🔄 Restarting Analytics Services..."
echo ""

# Stop existing processes
echo "📛 Stopping existing processes..."
pkill -f "analyticsGateway.mjs" 2>/dev/null
pkill -f "vite.*analytics.config" 2>/dev/null
sleep 2

echo "✅ Processes stopped"
echo ""

# Check if .env.analytics is sourced
if [ -z "$SUPABASE_URL" ]; then
  echo "⚠️  Warning: SUPABASE_URL not set"
  echo "   Run: source .env.analytics"
  echo ""
fi

# Start gateway in background
echo "🚀 Starting Analytics Gateway..."
cd "$(dirname "$0")"
node server/analyticsGateway.mjs > logs/gateway.log 2>&1 &
GATEWAY_PID=$!
echo "   PID: $GATEWAY_PID"
echo "   Port: 8788"
echo "   Logs: logs/gateway.log"
sleep 3

# Check gateway health
echo ""
echo "🏥 Checking gateway health..."
curl -s http://localhost:8788/health | python3 -m json.tool || echo "❌ Gateway not responding"

echo ""
echo "🚀 Starting Analytics Dev Server..."
npm run analytics:dev > logs/analytics-dev.log 2>&1 &
ANALYTICS_PID=$!
echo "   PID: $ANALYTICS_PID"
echo "   Port: 5174"
echo "   Logs: logs/analytics-dev.log"
sleep 5

echo ""
echo "✅ Services started!"
echo ""
echo "📊 URLs:"
echo "   Gateway:   http://localhost:8788"
echo "   Analytics: http://localhost:5174/analytics.html"
echo ""
echo "🧪 Run smoke tests:"
echo "   node scripts/smoke-test.mjs"
echo ""
echo "🛑 To stop:"
echo "   pkill -f analyticsGateway"
echo "   pkill -f 'vite.*analytics'"
