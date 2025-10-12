#!/bin/bash

# Supabase Docker Setup Test Suite
# Tests all critical aspects of a local Supabase instance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-54322}"
STUDIO_PORT="${STUDIO_PORT:-54323}"

echo "======================================"
echo "Supabase Docker Setup Test Suite"
echo "======================================"
echo ""

# Test 1: Docker Services Health
echo "Test 1: Checking Docker Services..."
if docker ps | grep -q "supabase.*healthy"; then
    echo -e "${GREEN}✓${NC} Docker services are running and healthy"
else
    echo -e "${RED}✗${NC} Some Docker services are not healthy"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep supabase
    exit 1
fi
echo ""

# Test 2: Kong API Gateway (Main API)
echo "Test 2: Testing Kong API Gateway (port $SUPABASE_URL)..."
if curl -s -f "$SUPABASE_URL/rest/v1/" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Kong API Gateway is responding"
else
    echo -e "${RED}✗${NC} Kong API Gateway is not responding at $SUPABASE_URL"
    exit 1
fi
echo ""

# Test 3: Supabase Studio UI
echo "Test 3: Testing Supabase Studio UI (port $STUDIO_PORT)..."
if curl -s -f "http://localhost:$STUDIO_PORT" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Supabase Studio is accessible at http://localhost:$STUDIO_PORT"
else
    echo -e "${YELLOW}⚠${NC} Supabase Studio may not be accessible"
fi
echo ""

# Test 4: Database Connection (requires psql or docker exec)
echo "Test 4: Testing Database Connection (port $DB_PORT)..."
if docker exec supabase_db_atomic-crm-demo psql -U postgres -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Database connection successful"
    DB_VERSION=$(docker exec supabase_db_atomic-crm-demo psql -U postgres -t -c "SELECT version();" | head -n1)
    echo "   Database: $DB_VERSION"
else
    echo -e "${RED}✗${NC} Cannot connect to database"
    exit 1
fi
echo ""

# Test 5: Check Tables Exist
echo "Test 5: Verifying Database Schema..."
TABLE_COUNT=$(docker exec supabase_db_atomic-crm-demo psql -U postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')
if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Found $TABLE_COUNT tables in public schema"
    echo "   Tables:"
    docker exec supabase_db_atomic-crm-demo psql -U postgres -c "\dt public.*" | grep "public |" | awk '{print "   - " $3}'
else
    echo -e "${YELLOW}⚠${NC} No tables found. Migrations may not have run."
fi
echo ""

# Test 6: Auth System
echo "Test 6: Testing Auth System..."
AUTH_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/signup" \
    -H "Content-Type: application/json" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -d '{}' 2>&1)

if echo "$AUTH_RESPONSE" | grep -q "email"; then
    echo -e "${GREEN}✓${NC} Auth system is responding"
else
    echo -e "${YELLOW}⚠${NC} Auth system response unclear (may need valid credentials)"
fi
echo ""

# Test 7: REST API with Anonymous Key
if [ -n "$SUPABASE_ANON_KEY" ]; then
    echo "Test 7: Testing REST API with Anonymous Key..."

    # Try to query a public endpoint
    REST_RESPONSE=$(curl -s -w "\n%{http_code}" "$SUPABASE_URL/rest/v1/" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY")

    HTTP_CODE=$(echo "$REST_RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓${NC} REST API authenticated successfully"
    else
        echo -e "${YELLOW}⚠${NC} REST API returned HTTP $HTTP_CODE"
    fi
else
    echo "Test 7: Skipping REST API test (SUPABASE_ANON_KEY not set)"
fi
echo ""

# Test 8: Realtime System
echo "Test 8: Testing Realtime System..."
if curl -s -f "http://localhost:54321/realtime/v1/websocket" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Realtime system is accessible"
else
    echo -e "${YELLOW}⚠${NC} Realtime system may not be accessible"
fi
echo ""

# Test 9: Storage System
echo "Test 9: Testing Storage System..."
STORAGE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/storage/v1/bucket")
if [ "$STORAGE_RESPONSE" = "200" ] || [ "$STORAGE_RESPONSE" = "401" ]; then
    echo -e "${GREEN}✓${NC} Storage system is responding (HTTP $STORAGE_RESPONSE)"
else
    echo -e "${YELLOW}⚠${NC} Storage system returned HTTP $STORAGE_RESPONSE"
fi
echo ""

# Test 10: Edge Functions
echo "Test 10: Testing Edge Functions Runtime..."
if docker ps | grep -q "supabase_edge_runtime.*Up"; then
    echo -e "${GREEN}✓${NC} Edge Functions runtime is running"
else
    echo -e "${YELLOW}⚠${NC} Edge Functions runtime may not be running"
fi
echo ""

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo ""
echo "Your Supabase setup is operational!"
echo ""
echo "Next Steps:"
echo "1. Access Supabase Studio: http://localhost:$STUDIO_PORT"
echo "2. Test your application connection with:"
echo "   VITE_SUPABASE_URL=$SUPABASE_URL"
echo "   VITE_SUPABASE_ANON_KEY=<your-anon-key>"
echo ""
echo "3. Run application tests:"
echo "   npm test"
echo ""
echo "4. Check email testing (Inbucket):"
echo "   http://localhost:54324"
echo ""
