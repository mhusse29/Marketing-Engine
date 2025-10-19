#!/bin/bash

echo "🚀 Starting Complete Admin Analytics Dashboard Setup"
echo "===================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we have all required env vars
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is not set!${NC}"
    echo ""
    echo "Please run:"
    echo -e "${BLUE}export SUPABASE_SERVICE_ROLE_KEY='your-key-here'${NC}"
    echo ""
    exit 1
fi

# Set environment variables
export SUPABASE_URL="https://wkhcakxjhmwapvqjrxld.supabase.co"
export ANALYTICS_GATEWAY_KEY="admin-analytics-2024"
export VITE_ANALYTICS_GATEWAY_KEY="admin-analytics-2024"

echo -e "${GREEN}✅ Environment Variables Set${NC}"
echo "   SUPABASE_URL: $SUPABASE_URL"
echo "   ANALYTICS_GATEWAY_KEY: $ANALYTICS_GATEWAY_KEY"
echo "   VITE_ANALYTICS_GATEWAY_KEY: $VITE_ANALYTICS_GATEWAY_KEY"
echo ""

# Kill existing processes
echo -e "${YELLOW}🔄 Stopping existing services...${NC}"
lsof -ti:8788 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null
sleep 2

# Start Analytics Gateway in background
echo -e "${BLUE}🚀 Starting Analytics Gateway (port 8788)...${NC}"
npm run gateway:start > logs/gateway.log 2>&1 &
GATEWAY_PID=$!
echo "   PID: $GATEWAY_PID"

# Wait for gateway to be ready
sleep 3

# Check if gateway is running
if lsof -Pi :8788 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${GREEN}✅ Gateway is running on port 8788${NC}"
else
    echo -e "${RED}❌ Gateway failed to start!${NC}"
    echo "Check logs/gateway.log for errors"
    exit 1
fi

echo ""

# Start Admin Dashboard in background
echo -e "${BLUE}🚀 Starting Admin Dashboard (port 5174)...${NC}"
npm run admin:dev > logs/admin.log 2>&1 &
ADMIN_PID=$!
echo "   PID: $ADMIN_PID"

# Wait for admin dashboard to be ready
sleep 3

# Check if admin dashboard is running
if lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${GREEN}✅ Admin Dashboard is running on port 5174${NC}"
else
    echo -e "${RED}❌ Admin Dashboard failed to start!${NC}"
    echo "Check logs/admin.log for errors"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All Services Started Successfully!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 Access Points:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "  ${GREEN}Admin Dashboard:${NC}  http://localhost:5174/admin.html"
echo -e "  ${GREEN}Password:${NC}         admin123"
echo ""
echo -e "  ${BLUE}Analytics Gateway:${NC} http://localhost:8788"
echo -e "  ${BLUE}Gateway Health:${NC}    http://localhost:8788/health"
echo ""
echo -e "  ${YELLOW}Marketing Engine:${NC}  http://localhost:5173"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}📝 View Logs:${NC}"
echo "  Gateway: tail -f logs/gateway.log"
echo "  Admin:   tail -f logs/admin.log"
echo ""
echo -e "${YELLOW}🛑 Stop Services:${NC}"
echo "  kill $GATEWAY_PID $ADMIN_PID"
echo ""
