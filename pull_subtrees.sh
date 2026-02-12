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

echo "📡 Pulling updates for all subtrees..."
echo "================================="
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

echo "✅ Pull complete."
