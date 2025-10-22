#!/bin/bash

# STOP SCRIPT - Stops all analytics services

echo "🛑 Stopping Analytics Services..."

# Kill by PID files
if [ -f .gateway.pid ]; then
    GATEWAY_PID=$(cat .gateway.pid)
    echo "   Stopping gateway (PID: $GATEWAY_PID)..."
    kill $GATEWAY_PID 2>/dev/null || true
    rm .gateway.pid
fi

if [ -f .analytics.pid ]; then
    ANALYTICS_PID=$(cat .analytics.pid)
    echo "   Stopping analytics (PID: $ANALYTICS_PID)..."
    kill $ANALYTICS_PID 2>/dev/null || true
    rm .analytics.pid
fi

# Force kill by process name
echo "   Cleaning up any remaining processes..."
pkill -9 -f "analyticsGateway.mjs" 2>/dev/null || true
pkill -9 -f "vite.*5176" 2>/dev/null || true

# Kill by port
lsof -ti:8788 | xargs kill -9 2>/dev/null || true
lsof -ti:5176 | xargs kill -9 2>/dev/null || true

sleep 1

echo ""
echo "✅ All services stopped"
echo ""
