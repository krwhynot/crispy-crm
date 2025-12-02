#!/bin/bash
# Test script for CRM MCP Server
# Usage: ./scripts/test-mcp-server.sh

set -e

# Configuration
SUPABASE_URL="https://aaqnanddcqvfiwhshndl.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcW5hbmRkY3F2Zml3aHNobmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODIxODUsImV4cCI6MjA3NDE1ODE4NX0.wJi2sGLrvrI5OQUujTByVWjdyCT7Prjlpsx9LC_CUzU"
MCP_ENDPOINT="${SUPABASE_URL}/functions/v1/crm-mcp"

# Test credentials (from seed.sql)
EMAIL="${TEST_EMAIL:-admin@test.com}"
PASSWORD="${TEST_PASSWORD:-password123}"

echo "=========================================="
echo "CRM MCP Server Test Suite"
echo "=========================================="
echo ""

# Step 1: Authenticate
echo "Step 1: Authenticating as ${EMAIL}..."
AUTH_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${EMAIL}\", \"password\": \"${PASSWORD}\"}")

ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "ERROR: Failed to authenticate. Response:"
  echo "$AUTH_RESPONSE" | head -c 500
  exit 1
fi

echo "SUCCESS: Got access token (${#ACCESS_TOKEN} chars)"
echo ""

# Helper function for MCP calls
call_mcp() {
  local method="$1"
  local params="$2"
  local id="${3:-1}"

  local payload
  if [ -z "$params" ]; then
    payload="{\"jsonrpc\": \"2.0\", \"id\": ${id}, \"method\": \"${method}\"}"
  else
    payload="{\"jsonrpc\": \"2.0\", \"id\": ${id}, \"method\": \"${method}\", \"params\": ${params}}"
  fi

  curl -s -X POST "${MCP_ENDPOINT}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload"
}

# Test 2: Initialize
echo "Step 2: Testing 'initialize' method..."
INIT_RESPONSE=$(call_mcp "initialize" '{"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test-client", "version": "1.0.0"}}')
echo "$INIT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$INIT_RESPONSE"
echo ""

# Test 3: List tools
echo "Step 3: Testing 'tools/list' method..."
TOOLS_RESPONSE=$(call_mcp "tools/list")
echo "$TOOLS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TOOLS_RESPONSE"
echo ""

# Test 4: Call crm_pipeline_summary
echo "Step 4: Testing 'crm_pipeline_summary' tool..."
PIPELINE_RESPONSE=$(call_mcp "tools/call" '{"name": "crm_pipeline_summary", "arguments": {}}')
echo "$PIPELINE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PIPELINE_RESPONSE"
echo ""

# Test 5: Call crm_stale_opportunities
echo "Step 5: Testing 'crm_stale_opportunities' tool..."
STALE_RESPONSE=$(call_mcp "tools/call" '{"name": "crm_stale_opportunities", "arguments": {"limit": 5}}')
echo "$STALE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STALE_RESPONSE"
echo ""

echo "=========================================="
echo "All tests complete!"
echo "=========================================="
