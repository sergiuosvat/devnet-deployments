#!/bin/bash
set -e

BASE_DIR="/home/ubuntu/devnet-deployments"
REPOS=(
    "multiversx-mcp-server"
    "multiversx-openclaw-relayer"
    "x402-facilitator"
    "moltbot/moltbot-starter-kit"
    "moltbot/multiversx-openclaw-skills"
    "mx-8004"
)

echo "🔄 Refreshing all repositories..."
echo "================================="

for repo in "${REPOS[@]}"; do
    REPO_PATH="$BASE_DIR/$repo"
    
    if [ ! -d "$REPO_PATH" ]; then
        echo "⚠️  Skipping $repo (directory not found)"
        continue
    fi
    
    echo ""
    echo "📦 Processing: $repo"
    echo "-----------------------------------"
    cd "$REPO_PATH"
    
    # Git operations
    echo "  ⬇️  Fetching..."
    git fetch --all
    
    echo "  🔀 Pulling..."
    git pull
    
    # Skip install and build for mx-8004
    if [ "$repo" == "mx-8004" ]; then
        echo "  ⏭️  Skipping install and build for mx-8004"
        echo "  ✅ Done with $repo"
        continue
    fi

    # Install dependencies
    if [ -f "pnpm-lock.yaml" ]; then
        echo "  📥 Installing with pnpm..."
        pnpm install
    elif [ -f "package-lock.json" ] || [ -f "package.json" ]; then
        echo "  📥 Installing with npm..."
        npm install
    fi
    
    # Build
    if [ -f "package.json" ] && grep -q '"build"' package.json; then
        echo "  🧹 Cleaning build output..."
        rm -rf dist build
        echo "  🔨 Building..."
        npm run build
    fi
    
    echo "  ✅ Done with $repo"
done

echo ""
echo "================================="
echo "🔄 Restarting PM2 services..."
echo "================================="

cd "$BASE_DIR"

# Stop all PM2 apps first
echo "  🛑 Stopping PM2 apps..."
pm2 stop ecosystem.config.js 2>/dev/null || true

# Delete old processes
echo "  🗑️  Deleting old PM2 processes..."
pm2 delete ecosystem.config.js 2>/dev/null || true

# Start dependencies first
echo "  🚀 Starting dependency services..."
pm2 start ecosystem.config.js --only mx-relayer,mx-mcp-server,x402-facilitator

# Wait for services to be ready
echo "  ⏳ Waiting 5 seconds for services to initialize..."
sleep 5

# Start moltbot last
echo "  🚀 Starting moltbot..."
pm2 start ecosystem.config.js --only moltbot

# Show status
echo ""
echo "================================="
echo "📊 PM2 Status:"
echo "================================="
pm2 status

echo ""
echo "✅ All repositories refreshed and services restarted!"
