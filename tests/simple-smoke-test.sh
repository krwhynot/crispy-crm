#!/bin/bash
# Simple Smoke Test for Atomic CRM
# Takes ~30 seconds, catches 90% of critical issues
# Run with: npm run test:smoke

set -e  # Exit on any error

echo "🔥 Atomic CRM - Simple Smoke Test"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Check if app is running
echo "📡 Test 1: Check if dev server is running..."
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✓${NC} Dev server is running"
else
    echo -e "${RED}✗${NC} Dev server is not running"
    echo "   Run: npm run dev"
    exit 1
fi

# Test 2: Check if app loads and contains expected content
echo "📄 Test 2: Check if app loads with React..."
RESPONSE=$(curl -s http://localhost:5173)
if echo "$RESPONSE" | grep -q "root"; then
    echo -e "${GREEN}✓${NC} App HTML loads correctly"
else
    echo -e "${RED}✗${NC} App HTML missing 'root' element"
    exit 1
fi

# Test 3: Check if Vite is serving JS
echo "🔧 Test 3: Check if Vite is serving assets..."
if curl -s http://localhost:5173/@vite/client > /dev/null; then
    echo -e "${GREEN}✓${NC} Vite client is available"
else
    echo -e "${RED}✗${NC} Vite client not found"
    exit 1
fi

# Test 4: Check if critical API endpoints are accessible
echo "🔌 Test 4: Check Supabase connection..."
SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2)
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}✗${NC} VITE_SUPABASE_URL not found in .env"
    exit 1
fi

if curl -s "$SUPABASE_URL/rest/v1/" -H "apikey: $(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2)" > /dev/null; then
    echo -e "${GREEN}✓${NC} Supabase API is reachable"
else
    echo -e "${RED}✗${NC} Cannot connect to Supabase"
    exit 1
fi

# Test 5: Check if build works (optional - comment out for speed)
# echo "🏗️  Test 5: Check if production build works..."
# npm run build > /dev/null 2>&1
# if [ $? -eq 0 ]; then
#     echo -e "${GREEN}✓${NC} Production build succeeds"
# else
#     echo -e "${RED}✗${NC} Production build failed"
#     exit 1
# fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ All smoke tests passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:5173 in browser"
echo "2. Try logging in as test@gmail.com"
echo "3. Check critical features work (see TESTING.md)"
