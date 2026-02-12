#!/bin/bash
set -e

# Default settings
RUN_PULL=true
RUN_BUILD=true

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --only-pull) RUN_PULL=true; RUN_BUILD=false ;;
        --only-build) RUN_PULL=false; RUN_BUILD=true ;;
        --skip-pull) RUN_PULL=false; RUN_BUILD=true ;;
        --help) 
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --only-pull    Only pull updates from remote subtrees (requires clean git state)"
            echo "  --only-build   Only install, build, and restart services (ignores remote updates)"
            echo "  --skip-pull    Same as --only-build"
            echo "  --help         Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

BASE_DIR="/home/ubuntu/devnet-deployments"
cd "$BASE_DIR"

if [ "$RUN_PULL" = true ]; then
    bash ./pull_subtrees.sh
fi

if [ "$RUN_BUILD" = true ]; then
    bash ./build_and_restart.sh
fi

echo ""
echo "✨ Everything finished!"
