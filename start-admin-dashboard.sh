#!/bin/bash

# 🚀 Admin Dashboard Startup Script
# Handles both analytics gateway and admin dashboard with proper credentials

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       🎯 SINAIQ Admin Dashboard Startup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Known values from Supabase project
SUPABASE_URL="https://wkhcakxjhmwapvqjrxld.supabase.co"
ANALYTICS_GATEWAY_KEY="admin-analytics-2024"

# Check if service role key is already set
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY is not set!${NC}"
    echo ""
    echo -e "${YELLOW}📝 To get your service role key:${NC}"
    echo "   1. Go to: https://supabase.com/dashboard/project/wkhcakxjhmwapvqjrxld/settings/api"
    echo "   2. Look for 'Project API keys' section"
    echo "   3. Copy the 'service_role' key (NOT the anon key)"
    echo ""
    echo -e "${BLUE}Then run:${NC}"
    echo "   export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key-here'"
    echo "   ./start-admin-dashboard.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Service role key detected${NC}"
echo ""

# Check if ports are available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 1
    fi
    return 0
}

# Check gateway port (8788)
if ! check_port 8788; then
    echo -e "${YELLOW}⚠️  Port 8788 is already in use${NC}"
    echo "   Analytics gateway might already be running"
    echo ""
    read -p "   Kill existing process? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:8788 | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}   ✅ Cleared port 8788${NC}"
        echo ""
    fi
fi

# Check admin dashboard port (5174)
if ! check_port 5174; then
    echo -e "${YELLOW}⚠️  Port 5174 is already in use${NC}"
    echo "   Admin dashboard might already be running"
    echo ""
    read -p "   Kill existing process? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:5174 | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}   ✅ Cleared port 5174${NC}"
        echo ""
    fi
fi

# Create log directory
mkdir -p logs

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       Starting Services...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Start analytics gateway in background
echo -e "${YELLOW}🚀 Starting Analytics Gateway (port 8788)...${NC}"
SUPABASE_URL="$SUPABASE_URL" \
SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
ANALYTICS_GATEWAY_KEY="$ANALYTICS_GATEWAY_KEY" \
node server/analyticsGateway.mjs > logs/gateway.log 2>&1 &
GATEWAY_PID=$!

# Wait for gateway to start
echo "   Waiting for gateway to initialize..."
sleep 3

# Check if gateway is running
if ! kill -0 $GATEWAY_PID 2>/dev/null; then
    echo -e "${RED}❌ Gateway failed to start!${NC}"
    echo ""
    echo "Last 20 lines from gateway log:"
    tail -n 20 logs/gateway.log
    exit 1
fi

# Verify gateway health
if curl -s http://localhost:8788/health > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Gateway is healthy${NC}"
else
    echo -e "${RED}   ⚠️  Gateway health check failed${NC}"
    echo "   Check logs/gateway.log for details"
fi
echo ""

# Start admin dashboard in foreground
echo -e "${YELLOW}🚀 Starting Admin Dashboard (port 5174)...${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Services Started Successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Access the admin dashboard at:${NC}"
echo -e "${GREEN}   👉 http://localhost:5174/admin.html${NC}"
echo ""
echo -e "${BLUE}Default credentials:${NC}"
echo "   Password: ${GREEN}admin123${NC}"
echo ""
echo -e "${BLUE}Gateway logs:${NC} logs/gateway.log"
echo -e "${BLUE}Gateway PID:${NC} $GATEWAY_PID"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}"
echo ""

# Trap to clean up on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    kill $GATEWAY_PID 2>/dev/null || true
    kill $ADMIN_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start admin dashboard (foreground)
VITE_ANALYTICS_GATEWAY_KEY="$ANALYTICS_GATEWAY_KEY" \
VITE_ANALYTICS_GATEWAY_URL="http://localhost:8788" \
npm run admin:dev &
ADMIN_PID=$!

# Wait for admin dashboard
wait $ADMIN_PID
