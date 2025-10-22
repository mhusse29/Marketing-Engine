#!/bin/bash

# Complete Analytics Startup Script
# Fixes 401 errors permanently

set -e  # Exit on error

echo "🚀 Starting Analytics Dashboard - Complete Fix"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Run: ./setup-analytics-auth.sh first"
    exit 1
fi

# Load .env
export $(grep -v '^#' .env | xargs)

# Verify gateway key is set
if [ -z "$VITE_ANALYTICS_GATEWAY_KEY" ]; then
    echo -e "${RED}❌ VITE_ANALYTICS_GATEWAY_KEY not set in .env${NC}"
    echo "Run: ./setup-analytics-auth.sh first"
    exit 1
fi

if [ -z "$ANALYTICS_GATEWAY_KEY" ]; then
    echo -e "${RED}❌ ANALYTICS_GATEWAY_KEY not set in .env${NC}"
    echo "Run: ./setup-analytics-auth.sh first"
    exit 1
fi

echo -e "${GREEN}✓${NC} Gateway keys loaded from .env"
echo ""

# Check if Supabase keys are set
if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" == "your_supabase_url_here" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_URL not configured${NC}"
    echo "Add your Supabase URL to .env"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ "$SUPABASE_SERVICE_ROLE_KEY" == "your_service_role_key_here" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_SERVICE_ROLE_KEY not configured${NC}"
    echo "Add your Supabase service role key to .env"
fi
echo ""

# Kill existing processes
echo "🔄 Cleaning up existing processes..."
pkill -f "analyticsGateway.mjs" 2>/dev/null || true
pkill -f "vite.*5176" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓${NC} Cleanup complete"
echo ""

# Start analytics gateway in background
echo "🌐 Starting Analytics Gateway..."
echo "   Port: 8788"
echo "   Auth: Gateway Key (${ANALYTICS_GATEWAY_KEY:0:16}...)"

# Export keys for gateway
export SUPABASE_URL="${SUPABASE_URL}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
export ANALYTICS_GATEWAY_KEY="${ANALYTICS_GATEWAY_KEY}"
export ANALYTICS_GATEWAY_PORT="8788"
export ANALYTICS_ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176"

# Start gateway
npm run gateway:start > logs/gateway.log 2>&1 &
GATEWAY_PID=$!
echo -e "${GREEN}✓${NC} Gateway started (PID: $GATEWAY_PID)"

# Wait for gateway to be ready
echo "   Waiting for gateway..."
for i in {1..30}; do
    if curl -s http://localhost:8788/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Gateway is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Gateway failed to start${NC}"
        echo "Check logs/gateway.log for errors"
        kill $GATEWAY_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done
echo ""

# Test gateway authentication
echo "🔐 Testing gateway authentication..."
RESPONSE=$(curl -s -w "\n%{http_code}" -H "x-analytics-key: ${ANALYTICS_GATEWAY_KEY}" http://localhost:8788/api/v1/metrics/executive 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓${NC} Gateway authentication working!"
elif [ "$HTTP_CODE" == "401" ]; then
    echo -e "${RED}❌ Gateway authentication FAILED (401)${NC}"
    echo "Gateway key mismatch!"
    echo "Check that ANALYTICS_GATEWAY_KEY matches in .env"
    kill $GATEWAY_PID 2>/dev/null || true
    exit 1
else
    echo -e "${YELLOW}⚠️  Unexpected response: $HTTP_CODE${NC}"
    echo "Gateway may need Supabase configuration"
fi
echo ""

# Start analytics frontend
echo "🎨 Starting Analytics Frontend..."
echo "   Port: 5176"
echo "   URL: http://localhost:5176/analytics"

npm run analytics:dev > logs/analytics.log 2>&1 &
ANALYTICS_PID=$!
echo -e "${GREEN}✓${NC} Frontend started (PID: $ANALYTICS_PID)"
echo ""

# Wait for frontend
echo "   Waiting for frontend..."
for i in {1..30}; do
    if curl -s http://localhost:5176 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Frontend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Frontend failed to start${NC}"
        echo "Check logs/analytics.log for errors"
        kill $GATEWAY_PID $ANALYTICS_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done
echo ""

# Success summary
echo "═══════════════════════════════════════════════"
echo -e "${GREEN}✅ Analytics Dashboard Ready!${NC}"
echo "═══════════════════════════════════════════════"
echo ""
echo "📍 Access Points:"
echo "   • Analytics: http://localhost:5176/analytics"
echo "   • Gateway:   http://localhost:8788"
echo ""
echo "🔑 Authentication:"
echo "   • Method: Gateway Key"
echo "   • Status: ✓ Configured"
echo ""
echo "📊 Gateway Status:"
GATEWAY_STATUS=$(curl -s http://localhost:8788/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
echo "   • Health: $GATEWAY_STATUS"
echo "   • PID: $GATEWAY_PID"
echo ""
echo "🖥️  Frontend:"
echo "   • PID: $ANALYTICS_PID"
echo "   • Logs: logs/analytics.log"
echo ""
echo "📝 Logs:"
echo "   • Gateway: logs/gateway.log"
echo "   • Frontend: logs/analytics.log"
echo ""
echo "🛑 To stop:"
echo "   kill $GATEWAY_PID $ANALYTICS_PID"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Save PIDs for cleanup
echo "$GATEWAY_PID" > .analytics_gateway.pid
echo "$ANALYTICS_PID" > .analytics_frontend.pid

# Keep script running and tail logs
trap "echo ''; echo 'Stopping services...'; kill $GATEWAY_PID $ANALYTICS_PID 2>/dev/null; rm -f .analytics_gateway.pid .analytics_frontend.pid; exit" INT TERM

# Show live logs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Live Logs (Ctrl+C to stop):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -f logs/gateway.log logs/analytics.log 2>/dev/null || wait
