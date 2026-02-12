#!/bin/bash
set -e

echo "============================================"
echo " MultiversX OpenClaw Skills — Setup"
echo "============================================"

# Prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install v18+."; exit 1; }
NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
[ "$NODE_MAJOR" -ge 18 ] 2>/dev/null || echo "⚠ Node.js v18+ recommended (found $(node -v))"

echo "✓ node $(node -v), npm $(npm -v)"

# Install
echo "📦 Installing dependencies..."
npm install

# Build
echo "🔨 Building..."
npm run build

# Test
echo "🧪 Running tests..."
npm test

echo ""
echo "✅ Setup complete!"
echo "   This is a skill bundle — import it in your OpenClaw agent."
