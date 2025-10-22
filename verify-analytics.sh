#!/bin/bash

# Analytics Dashboard Verification Script
# Runs comprehensive checks on the updated dashboard

set -e

echo "🔍 Analytics Dashboard Verification"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local command="$2"
    
    echo -n "Testing: $test_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

# TypeScript Check
run_test "TypeScript compilation" "npx tsc --noEmit"

# ESLint Check
run_test "ESLint check" "npm run lint"

# Gateway Health
run_test "Gateway health" "curl -sf http://localhost:8788/health"

# Gateway Authentication
run_test "Gateway authentication" "curl -sf -H 'x-analytics-key: d0f615cb40ed30ff1798b2697a5dbe5599937aa1bb2098e43f3d325dddac00ae' http://localhost:8788/api/v1/metrics/executive"

# Frontend Accessibility
run_test "Frontend accessible" "curl -sf http://localhost:5176/analytics"

# Check modified files exist
run_test "ExecutiveOverview exists" "test -f src/components/Analytics/ExecutiveOverview.tsx"
run_test "UserIntelligence exists" "test -f src/components/Analytics/UserIntelligence.tsx"
run_test "FinancialAnalytics exists" "test -f src/components/Analytics/FinancialAnalytics.tsx"
run_test "ModelUsage exists" "test -f src/components/Analytics/ModelUsage.tsx"

# Check for old color codes (should not exist)
echo ""
echo "🎨 Checking for old color codes..."
OLD_COLORS_FOUND=false

if grep -r "#4deeea" src/components/Analytics/{ExecutiveOverview,UserIntelligence,ModelUsage}.tsx 2>/dev/null | grep -v "FeedbackAnalytics"; then
    echo -e "${RED}✗ Found old cyan color #4deeea${NC}"
    OLD_COLORS_FOUND=true
    ((FAILED++))
else
    echo -e "${GREEN}✓ No old cyan colors found${NC}"
    ((PASSED++))
fi

if grep -r "rgba(77,238,234" src/components/Analytics/ExecutiveOverview.tsx 2>/dev/null; then
    echo -e "${RED}✗ Found old rgba(77,238,234) cyan${NC}"
    OLD_COLORS_FOUND=true
    ((FAILED++))
else
    echo -e "${GREEN}✓ No old rgba cyan found${NC}"
    ((PASSED++))
fi

# Check for new green colors (should exist)
echo ""
echo "✅ Checking for new green theme..."

if grep -q "#33ff33" src/components/Analytics/ExecutiveOverview.tsx; then
    echo -e "${GREEN}✓ ExecutiveOverview uses #33ff33${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ ExecutiveOverview missing #33ff33${NC}"
    ((FAILED++))
fi

if grep -q "rgba(51,255,51" src/components/Analytics/ExecutiveOverview.tsx; then
    echo -e "${GREEN}✓ ExecutiveOverview uses rgba(51,255,51) grids${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ ExecutiveOverview missing rgba(51,255,51)${NC}"
    ((FAILED++))
fi

# Summary
echo ""
echo "=================================="
echo "📊 Verification Summary"
echo "=================================="
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo "Analytics dashboard is ready for use."
    echo ""
    echo "Access at: http://localhost:5176/analytics"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo "Please review the errors above."
    exit 1
fi
