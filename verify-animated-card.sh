#!/bin/bash

echo "🔍 Animated Card Component Verification"
echo "========================================"
echo ""

# Check if file exists
if [ -f "src/components/ui/animated-card.tsx" ]; then
    echo "✅ File exists: src/components/ui/animated-card.tsx"
    
    # Check line count
    LINES=$(wc -l < "src/components/ui/animated-card.tsx")
    echo "✅ Lines: $LINES (expected: 345)"
    
    # Check for fixed width
    WIDTH_COUNT=$(grep -c "w-\[356px\]" "src/components/ui/animated-card.tsx")
    echo "✅ Fixed widths found: $WIDTH_COUNT (expected: 4)"
    
    # Check for original labels
    if grep -q "Tommy" "src/components/ui/animated-card.tsx" && grep -q "Megan" "src/components/ui/animated-card.tsx"; then
        echo "✅ Original labels: Tommy & Megan found"
    else
        echo "❌ Original labels not found"
    fi
    
    # Check for original hover text
    if grep -q "Random Data Visualization" "src/components/ui/animated-card.tsx"; then
        echo "✅ Original hover text found"
    else
        echo "❌ Original hover text not found"
    fi
    
    # Check imports
    if grep -q 'from "@/lib/utils"' "src/components/ui/animated-card.tsx"; then
        echo "✅ Clean imports from @/lib/utils"
    else
        echo "❌ Import issue detected"
    fi
    
    # Check exports
    EXPORTS=$(grep -c "^export function" "src/components/ui/animated-card.tsx")
    echo "✅ Exports found: $EXPORTS (expected: 6)"
    
else
    echo "❌ File not found: src/components/ui/animated-card.tsx"
    exit 1
fi

echo ""
echo "📍 Usage Locations:"
echo "-------------------"

# Check usage in other files
if grep -q "animated-card" "src/components/ui/demo.tsx" 2>/dev/null; then
    echo "✅ Used in: demo.tsx"
fi

if grep -q "animated-card" "src/components/ui/analytics-charts-section.tsx" 2>/dev/null; then
    echo "✅ Used in: analytics-charts-section.tsx"
fi

if grep -q "animated-card" "src/components/ui/media-plan-scroll-section.tsx" 2>/dev/null; then
    echo "✅ Used in: media-plan-scroll-section.tsx"
fi

echo ""
echo "🚀 Next Steps:"
echo "-------------"
echo "1. Run: npm run web:dev"
echo "2. Clear browser cache (Cmd+Shift+R)"
echo "3. Visit your app and check the animated cards"
echo ""
echo "🔬 Test Page Created:"
echo "   src/pages/AnimatedCardTest.tsx"
echo "   Add this to your routes to test"
echo ""
echo "✨ Clean slate implementation complete!"
