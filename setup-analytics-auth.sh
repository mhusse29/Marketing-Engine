#!/bin/bash

# Analytics Authentication Setup Script
# Fixes 401 Unauthorized errors in admin dashboard

echo "🔧 Analytics Gateway Authentication Setup"
echo "=========================================="
echo ""

# Step 1: Generate gateway key
echo "📝 Step 1: Generating secure gateway key..."
GATEWAY_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ Generated key: $GATEWAY_KEY"
echo ""

# Step 2: Check if .env exists
if [ ! -f .env ]; then
    echo "📄 Step 2: Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "📄 Step 2: .env file already exists"
fi
echo ""

# Step 3: Add/update gateway keys in .env
echo "🔑 Step 3: Configuring gateway keys in .env..."

# Remove old keys if they exist
sed -i.bak '/VITE_ANALYTICS_GATEWAY_KEY=/d' .env
sed -i.bak '/ANALYTICS_GATEWAY_KEY=/d' .env

# Add new keys
echo "" >> .env
echo "# Analytics Gateway Key (auto-generated $(date +%Y-%m-%d))" >> .env
echo "VITE_ANALYTICS_GATEWAY_KEY=$GATEWAY_KEY" >> .env
echo "ANALYTICS_GATEWAY_KEY=$GATEWAY_KEY" >> .env

echo "✅ Updated .env with gateway keys"
echo ""

# Step 4: Show .env.analytics template
echo "📋 Step 4: Update your .env.analytics for the gateway server:"
echo "=============================================================="
echo ""
echo "Add this to .env.analytics:"
echo ""
echo "export ANALYTICS_GATEWAY_KEY=\"$GATEWAY_KEY\""
echo ""
echo "Or run before starting gateway:"
echo "export ANALYTICS_GATEWAY_KEY=\"$GATEWAY_KEY\""
echo ""

# Step 5: Instructions
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Update .env.analytics or export ANALYTICS_GATEWAY_KEY"
echo "2. Start gateway:  npm run gateway:start"
echo "3. Start admin:    npm run admin:dev"
echo "4. Visit:          http://localhost:5174/admin"
echo ""
echo "The admin dashboard will now authenticate using the gateway key."
echo ""
