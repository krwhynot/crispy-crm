#!/bin/bash
# Memory Optimization Script for Local Development
# Reduces memory usage by killing unused processes and setting environment variables

set -e

echo "🧠 Atomic CRM Memory Optimization"
echo "=================================="

# Color codes for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check current memory usage
CURRENT_MEMORY=$(free -h | grep "^Mem:" | awk '{print $3 "/" $2}')
echo -e "${BLUE}Current Memory Usage:${NC} $CURRENT_MEMORY"

# Kill unused VS Code extensions that consume memory
echo -e "\n${YELLOW}Killing unused VS Code language servers...${NC}"
# JSON language server
pkill -f "jsonServerMain" 2>/dev/null && echo "✓ Killed JSON server" || echo "✗ JSON server not found"
# Markdown language server
pkill -f "serverWorkerMain" 2>/dev/null && echo "✓ Killed Markdown server" || echo "✗ Markdown server not found"

# Reduce Node.js memory usage
export NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=1024"
echo -e "${GREEN}✓ Set Node.js memory limit to 2GB${NC}"

# Set Vite-specific optimizations
export VITE_BUILD_MODE="development"
echo -e "${GREEN}✓ Set Vite to development mode${NC}"

# Disable source maps in dev to save memory
export VITE_SOURCEMAP="false"
echo -e "${GREEN}✓ Disabled Vite source maps${NC}"

# Show available memory after cleanup
NEW_MEMORY=$(free -h | grep "^Mem:" | awk '{print $3 "/" $2}')
echo -e "\n${BLUE}Memory After Optimization:${NC} $NEW_MEMORY"

echo -e "\n${GREEN}✓ Memory optimization complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Start Supabase: npm run db:local:start"
echo "  2. Start dev server: npm run dev"
echo ""
echo "💡 Tip: Keep this terminal open while developing to maintain optimizations"
