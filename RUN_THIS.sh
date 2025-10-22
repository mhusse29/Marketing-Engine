#!/bin/bash

# COMPLETE STARTUP SCRIPT - RUN THIS!
# This starts both gateway and analytics frontend

set -e

echo "🚀 Starting Analytics Dashboard"
echo "================================"
echo ""

# Kill any existing processes
echo "🧹 Cleaning up..."
pkill -9 -f "analyticsGateway.mjs" 2>/dev/null || true
pkill -9 -f "vite.*5176" 2>/dev/null || true
sleep 2

# Create logs directory
mkdir -p logs

# Start Gateway
echo "🌐 Starting Analytics Gateway on port 8788..."
export SUPABASE_URL="https://wkhcakxjhmwapvqjrxld.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraGNha3hqaG13YXB2cWpyeGxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDcyMDgwNywiZXhwIjoyMDc2Mjk2ODA3fQ.jb0oagXh_FS36VIVG-wourLnpd-21sN01QElFT0HhHI"
export ANALYTICS_GATEWAY_KEY="d0f615cb40ed30ff1798b2697a5dbe5599937aa1bb2098e43f3d325dddac00ae"

node server/analyticsGateway.mjs > logs/gateway.log 2>&1 &
GATEWAY_PID=$!
echo "   Gateway PID: $GATEWAY_PID"

# Wait for gateway
echo "   Waiting for gateway to start..."
for i in {1..20}; do
    if curl -s http://localhost:8788/health > /dev/null 2>&1; then
        echo "   ✅ Gateway is healthy!"
        break
    fi
    if [ $i -eq 20 ]; then
        echo "   ❌ Gateway failed to start"
        echo "   Check logs/gateway.log for errors"
        cat logs/gateway.log
        exit 1
    fi
    sleep 1
done

# Test authentication
echo ""
echo "🔐 Testing gateway authentication..."
HTTP_CODE=$(curl -s -w "%{http_code}" -H "x-analytics-key: $ANALYTICS_GATEWAY_KEY" http://localhost:8788/api/v1/metrics/executive -o /dev/null)

if [ "$HTTP_CODE" == "200" ]; then
    echo "   ✅ Authentication working!"
elif [ "$HTTP_CODE" == "401" ]; then
    echo "   ❌ Authentication FAILED (401)"
    echo "   Gateway key mismatch!"
    exit 1
else
    echo "   ⚠️  Unexpected response: $HTTP_CODE"
fi

# Start Analytics Frontend
echo ""
echo "🎨 Starting Analytics Frontend on port 5176..."
npm run analytics:dev > logs/analytics.log 2>&1 &
ANALYTICS_PID=$!
echo "   Analytics PID: $ANALYTICS_PID"

# Wait for frontend
echo "   Waiting for frontend to start..."
for i in {1..20}; do
    if curl -s http://localhost:5176 > /dev/null 2>&1; then
        echo "   ✅ Frontend is ready!"
        break
    fi
    if [ $i -eq 20 ]; then
        echo "   ❌ Frontend failed to start"
        echo "   Check logs/analytics.log for errors"
        exit 1
    fi
    sleep 1
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ANALYTICS DASHBOARD READY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 URLs:"
echo "   Analytics: http://localhost:5176/analytics"
echo "   Gateway:   http://localhost:8788/health"
echo ""
echo "🔑 Authentication:"
echo "   Method: Gateway Key"
echo "   Status: ✅ Configured"
echo ""
echo "📊 Processes:"
echo "   Gateway PID: $GATEWAY_PID"
echo "   Frontend PID: $ANALYTICS_PID"
echo ""
echo "📝 Logs:"
echo "   tail -f logs/gateway.log"
echo "   tail -f logs/analytics.log"
echo ""
echo "🛑 To Stop:"
echo "   kill $GATEWAY_PID $ANALYTICS_PID"
echo ""
echo "Ready! Open http://localhost:5176/analytics"
echo ""

# Save PIDs
echo "$GATEWAY_PID" > .gateway.pid
echo "$ANALYTICS_PID" > .analytics.pid

# Keep running
echo "Press Ctrl+C to stop all services..."
trap "echo ''; echo 'Stopping...'; kill $GATEWAY_PID $ANALYTICS_PID 2>/dev/null; rm -f .gateway.pid .analytics.pid; exit" INT TERM

wait
