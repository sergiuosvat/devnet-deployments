#!/bin/bash
set -e

BASE_DIR="/home/ubuntu/devnet-deployments"
REPOS=(
    "multiversx-mcp-server"
    "multiversx-openclaw-relayer"
    "x402-facilitator"
    "mx-agentic-commerce-tests"
    "mx-8004"
    "moltbot/multiversx-openclaw-skills"
    "moltbot/moltbot-starter-kit"
)

echo "🔄 Refreshing all subtrees..."
echo "================================="

# --- Phase 1: Git Updates ---
echo "📡 Phase 1: Fetching and pulling updates..."
cd "$BASE_DIR"

for repo in "${REPOS[@]}"; do
    if [ ! -d "$repo" ]; then
        echo "⚠️  Skipping update for $repo (directory not found)"
        continue
    fi

    # Determine remote and branch
    case "$repo" in
        "multiversx-mcp-server")          REMOTE="remote-mcp"; BRANCH="master" ;;
        "multiversx-openclaw-relayer")    REMOTE="remote-relayer"; BRANCH="main" ;;
        "x402-facilitator")               REMOTE="remote-facilitator"; BRANCH="main" ;;
        "mx-agentic-commerce-tests")      REMOTE="remote-tests"; BRANCH="master" ;;
        "mx-8004")                        REMOTE="remote-8004"; BRANCH="master" ;;
        "moltbot/multiversx-openclaw-skills") REMOTE="remote-skills"; BRANCH="master" ;;
        "moltbot/moltbot-starter-kit")    REMOTE="remote-starter"; BRANCH="master" ;;
        *) echo "❌ Unknown remote for $repo"; continue ;;
    esac

    echo "  ⬇️  Updating $repo from $REMOTE/$BRANCH..."
    git subtree pull --prefix="$repo" "$REMOTE" "$BRANCH" --squash -m "update subtree: $repo from $REMOTE/$BRANCH"
done

# --- Phase 2: Install and Build ---
echo ""
echo "🏗️  Phase 2: Installing dependencies and building..."

for repo in "${REPOS[@]}"; do
    REPO_PATH="$BASE_DIR/$repo"
    
    if [ ! -d "$REPO_PATH" ]; then
        continue
    fi
    
    echo ""
    echo "📦 Processing: $repo"
    echo "-----------------------------------"
    cd "$REPO_PATH"
    
    # Skip install and build for mx-8004 and mx-agentic-commerce-tests
    if [[ "$repo" == "mx-8004" || "$repo" == "mx-agentic-commerce-tests" ]]; then
        echo "  ⏭️  Skipping binary build for $repo"
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
        echo "  🧹 Cleaning and Building..."
        rm -rf dist build
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
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 delete ecosystem.config.js 2>/dev/null || true

# Start services
echo "  🚀 Starting services..."
pm2 start ecosystem.config.js --only mx-relayer,mx-mcp-server,x402-facilitator
echo "  ⏳ Waiting 5 seconds..."
sleep 5
pm2 start ecosystem.config.js --only moltbot

echo ""
echo "================================="
echo "📊 PM2 Status:"
echo "================================="
pm2 status

echo ""
echo "✅ All subtrees refreshed and services restarted!"
