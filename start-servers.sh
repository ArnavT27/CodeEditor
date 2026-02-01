#!/bin/bash

# Start WebSocket Server and Next.js Development Server

echo "🚀 Starting CodeEditor Servers..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start WebSocket server in background
echo "🔌 Starting WebSocket Server on port 1234..."
node server.js &
WS_PID=$!
echo "   WebSocket Server PID: $WS_PID"
echo ""

# Wait a moment for WebSocket server to start
sleep 2

# Start Next.js development server
echo "⚡ Starting Next.js Development Server on port 3000..."
echo ""
npm run dev

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $WS_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Trap CTRL+C and cleanup
trap cleanup INT TERM

# Wait for Next.js to exit
wait
