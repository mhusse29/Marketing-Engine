#!/bin/bash

echo "🚀 Starting Independent Analytics Admin Dashboard"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gateway is running
if lsof -Pi :8788 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${GREEN}✅ Analytics gateway is already running on port 8788${NC}"
else
    echo -e "${YELLOW}⚠️  Analytics gateway is NOT running${NC}"
    echo ""
    echo "Please start the gateway first:"
    echo ""
    echo -e "${BLUE}# Terminal 1:${NC}"
    echo "export SUPABASE_URL='https://wkhcakxjhmwapvqjrxld.supabase.co'"
    echo "export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
    echo "npm run gateway:start"
    echo ""
    echo -e "${YELLOW}Then run this script again.${NC}"
    exit 1
fi

echo ""

# Check if admin dashboard is already running
if lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Admin dashboard is already running on port 5174${NC}"
    echo ""
    echo -e "Access it at: ${GREEN}http://localhost:5174/admin${NC}"
    exit 0
fi

echo -e "${GREEN}✅ Starting admin dashboard on port 5174...${NC}"
echo ""

npm run admin:dev

