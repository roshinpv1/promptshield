#!/bin/bash

# PromptShield Frontend Startup Script

echo "🚀 Starting PromptShield Frontend..."

cd "$(dirname "$0")/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    # Try normal install first, fallback to legacy-peer-deps if needed
    npm install || npm install --legacy-peer-deps
fi

# Start development server
echo "✅ Starting React development server on http://localhost:3000"
echo ""
npm start

