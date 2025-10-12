#!/bin/bash

# Test Supabase API endpoints with your application's credentials
# Run this after setting up .env.local

set -e

# Load environment variables
if [ -f .env.local ]; then
    export VITE_SUPABASE_URL=$(grep VITE_SUPABASE_URL .env.local | cut -d '=' -f2)
    export VITE_SUPABASE_ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env.local | cut -d '=' -f2)
else
    echo "Error: .env.local not found"
    exit 1
fi

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "======================================"
echo "Supabase API Endpoint Tests"
echo "======================================"
echo ""
echo "Testing with:"
echo "URL: $VITE_SUPABASE_URL"
echo "Key: ${VITE_SUPABASE_ANON_KEY:0:20}..."
echo ""

# Test 1: List all available tables
echo "${BLUE}Test 1: Listing Available Tables${NC}"
RESPONSE=$(curl -s "$VITE_SUPABASE_URL/rest/v1/" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY")

if echo "$RESPONSE" | grep -q "definitions"; then
    echo -e "${GREEN}✓${NC} API responding, tables available:"
    echo "$RESPONSE" | grep -o '"[^"]*":{"type":"object"' | cut -d'"' -f2 | head -10 | while read table; do
        echo "   - $table"
    done
else
    echo -e "${RED}✗${NC} Failed to list tables"
    echo "$RESPONSE"
fi
echo ""

# Test 2: Query contacts table
echo "${BLUE}Test 2: Querying Contacts Table${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$VITE_SUPABASE_URL/rest/v1/contacts?select=id,name&limit=5" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
    echo -e "${GREEN}✓${NC} Successfully queried contacts (found $COUNT records)"
else
    echo -e "${RED}✗${NC} Failed with HTTP $HTTP_CODE"
    echo "$BODY"
fi
echo ""

# Test 3: Query opportunities table
echo "${BLUE}Test 3: Querying Opportunities Table${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$VITE_SUPABASE_URL/rest/v1/opportunities?select=id,name,stage&limit=5" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
    echo -e "${GREEN}✓${NC} Successfully queried opportunities (found $COUNT records)"
else
    echo -e "${RED}✗${NC} Failed with HTTP $HTTP_CODE"
    echo "$BODY"
fi
echo ""

# Test 4: Query organizations table
echo "${BLUE}Test 4: Querying Organizations Table${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$VITE_SUPABASE_URL/rest/v1/organizations?select=id,name&limit=5" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
    echo -e "${GREEN}✓${NC} Successfully queried organizations (found $COUNT records)"
else
    echo -e "${RED}✗${NC} Failed with HTTP $HTTP_CODE"
    echo "$BODY"
fi
echo ""

# Test 5: Test Auth Endpoint
echo "${BLUE}Test 5: Testing Auth Health${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$VITE_SUPABASE_URL/auth/v1/health" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Auth system is healthy"
else
    echo -e "${YELLOW}⚠${NC} Auth returned HTTP $HTTP_CODE"
fi
echo ""

# Test 6: Test Storage Buckets
echo "${BLUE}Test 6: Testing Storage Buckets${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$VITE_SUPABASE_URL/storage/v1/bucket" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Storage system accessible"
    if echo "$BODY" | grep -q '"name"'; then
        echo "   Buckets found:"
        echo "$BODY" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | while read bucket; do
            echo "   - $bucket"
        done
    else
        echo "   No buckets created yet"
    fi
else
    echo -e "${YELLOW}⚠${NC} Storage returned HTTP $HTTP_CODE"
fi
echo ""

echo "======================================"
echo "Summary"
echo "======================================"
echo ""
echo "If all tests passed, your Supabase setup is ready!"
echo ""
echo "Try these next:"
echo "1. Start your dev server: npm run dev"
echo "2. Run app tests: npm test"
echo "3. Access Studio: http://localhost:54323"
echo ""
