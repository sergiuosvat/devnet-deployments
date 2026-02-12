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

for repo in "${REPOS[@]}"; do
    REPO_PATH="$BASE_DIR/$repo"
    
    if [ ! -d "$REPO_PATH" ]; then
        echo "⚠️  Skipping $repo (directory not found)"
        continue
    fi
    
    echo ""
    echo "📦 Processing: $repo"
    echo "-----------------------------------"
    
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

    # Git operations (run from root)
    cd "$BASE_DIR"
    echo "  ⬇️  Updating subtree from $REMOTE/$BRANCH..."
    # Always pull with squash to keep history clean in the parent repo
    git subtree pull --prefix="$repo" "$REMOTE" "$BRANCH" --squash -m "update subtree: $repo from $REMOTE/$BRANCH"

    # Go into directory for dependencies and build
    cd "$REPO_PATH"
    
    # Skip install and build for mx-8004 and mx-agentic-commerce-tests (unless needed)
    if [[ "$repo" == "mx-8004" || "$repo" == "mx-agentic-commerce-tests" ]]; then
        echo "  ⏭️  Skipping install and build for $repo"
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
echo "✅ All subtrees refreshed and services restarted!"
