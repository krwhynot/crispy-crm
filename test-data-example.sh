#!/bin/bash

# Quick script to add test data and verify it works
# Demonstrates creating records via Supabase REST API

set -e

# Load credentials
export VITE_SUPABASE_URL=$(grep VITE_SUPABASE_URL .env.local | cut -d '=' -f2)
export VITE_SUPABASE_ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env.local | cut -d '=' -f2)

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "======================================"
echo "Creating Test Data in Supabase"
echo "======================================"
echo ""

# Create a test organization
echo -e "${BLUE}Creating test organization...${NC}"
ORG_RESPONSE=$(curl -s "$VITE_SUPABASE_URL/rest/v1/organizations" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -X POST \
    -d '{
        "name": "Acme Corporation",
        "website": "https://acme.example.com",
        "description": "Leading provider of innovative solutions"
    }')

if echo "$ORG_RESPONSE" | grep -q '"id"'; then
    ORG_ID=$(echo "$ORG_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo -e "${GREEN}✓${NC} Organization created (ID: $ORG_ID)"
else
    echo "Failed to create organization"
    echo "$ORG_RESPONSE"
    exit 1
fi
echo ""

# Create a test contact
echo -e "${BLUE}Creating test contact...${NC}"
CONTACT_RESPONSE=$(curl -s "$VITE_SUPABASE_URL/rest/v1/contacts" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -X POST \
    -d '{
        "name": "John Doe",
        "title": "VP of Sales",
        "emails": [{"email": "john.doe@acme.example.com"}],
        "phones": [{"phone": "+1-555-0123"}]
    }')

if echo "$CONTACT_RESPONSE" | grep -q '"id"'; then
    CONTACT_ID=$(echo "$CONTACT_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo -e "${GREEN}✓${NC} Contact created (ID: $CONTACT_ID)"
else
    echo "Failed to create contact"
    echo "$CONTACT_RESPONSE"
    exit 1
fi
echo ""

# Link contact to organization
echo -e "${BLUE}Linking contact to organization...${NC}"
LINK_RESPONSE=$(curl -s "$VITE_SUPABASE_URL/rest/v1/contact_organizations" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -X POST \
    -d "{
        \"contact_id\": $CONTACT_ID,
        \"organization_id\": $ORG_ID,
        \"is_primary\": true
    }")

if echo "$LINK_RESPONSE" | grep -q '"contact_id"'; then
    echo -e "${GREEN}✓${NC} Contact linked to organization"
else
    echo "Warning: Failed to link contact (may be optional)"
fi
echo ""

# Create an opportunity
echo -e "${BLUE}Creating test opportunity...${NC}"
OPP_RESPONSE=$(curl -s "$VITE_SUPABASE_URL/rest/v1/opportunities" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -X POST \
    -d "{
        \"name\": \"Q1 Software License Deal\",
        \"description\": \"Annual software license renewal\",
        \"stage\": \"new_lead\",
        \"amount\": 50000,
        \"probability\": 50,
        \"customer_organization_id\": $ORG_ID,
        \"contact_ids\": [$CONTACT_ID]
    }")

if echo "$OPP_RESPONSE" | grep -q '"id"'; then
    OPP_ID=$(echo "$OPP_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo -e "${GREEN}✓${NC} Opportunity created (ID: $OPP_ID)"
else
    echo "Failed to create opportunity"
    echo "$OPP_RESPONSE"
    exit 1
fi
echo ""

# Verify data
echo "======================================"
echo "Verifying Test Data"
echo "======================================"
echo ""

echo -e "${BLUE}Organizations:${NC}"
curl -s "$VITE_SUPABASE_URL/rest/v1/organizations?select=id,name" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" | python3 -m json.tool 2>/dev/null || echo "Install python3 for pretty JSON"
echo ""

echo -e "${BLUE}Contacts:${NC}"
curl -s "$VITE_SUPABASE_URL/rest/v1/contacts?select=id,name,title" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" | python3 -m json.tool 2>/dev/null || echo "Install python3 for pretty JSON"
echo ""

echo -e "${BLUE}Opportunities:${NC}"
curl -s "$VITE_SUPABASE_URL/rest/v1/opportunities?select=id,name,stage,amount" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" | python3 -m json.tool 2>/dev/null || echo "Install python3 for pretty JSON"
echo ""

echo "======================================"
echo "Success!"
echo "======================================"
echo ""
echo "Test data created successfully!"
echo ""
echo "Next steps:"
echo "1. View in Studio: http://localhost:54323"
echo "2. Start your app: npm run dev"
echo "3. You should see the test records in your CRM"
echo ""
