# Development Scripts Patterns

Development utilities for local environment setup, database seeding, and cloud synchronization.

## Architecture Overview

```
scripts/dev/
├── Environment Setup
│   ├── verify-environment.sh     → Compare local/cloud parity
│   ├── reset-environment.sh      → Full reset (destructive)
│   └── optimize-memory.sh        → Node.js memory tuning
│
├── Database Seeding
│   ├── create-test-users.sh      → 3 role-based test users
│   └── sync-local-to-cloud.sh    → Push local → cloud
│
├── JWT Utilities
│   ├── generate-jwt.mjs          → Generate service_role/anon tokens
│   └── test-fetch.mjs            → Test Auth API endpoints
│
└── Monitoring
    └── monitor-resources.sh      → Real-time resource usage
```

---

## Pattern A: Environment Verification

Verify environment parity between local Supabase and cloud database by comparing table row counts and checking test user presence.

**When to use**: Before sync operations, after environment changes, CI validation

### .env Multi-Path Loading

```bash
# scripts/dev/verify-environment.sh
if [ -f ".env.cloud" ]; then
  export $(grep -v '^#' .env.cloud | xargs)
elif [ -f "../.env.cloud" ]; then
  export $(grep -v '^#' ../.env.cloud | xargs)
elif [ -f "../../.env.cloud" ]; then
  export $(grep -v '^#' ../../.env.cloud | xargs)
else
  echo -e "${RED}❌ Error: .env.cloud file not found${NC}"
  echo "Please ensure CLOUD_DB is set in .env.cloud"
  exit 1
fi
```

### Color-Coded Output

```bash
# scripts/dev/verify-environment.sh
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Usage examples
echo -e "${GREEN}✅ $table: $LOCAL_COUNT (local) = $CLOUD_COUNT (cloud)${NC}"
echo -e "${RED}❌ $table: $LOCAL_COUNT (local) ≠ $CLOUD_COUNT (cloud)${NC}"
echo -e "${YELLOW}⚠️  Warning: Could not query test users${NC}"
echo -e "${BLUE}🔍 Verifying environment parity...${NC}"
```

### Exit Code Convention

```bash
# scripts/dev/verify-environment.sh
if [[ $MISMATCH -eq 0 ]]; then
  echo -e "${GREEN}✅ Environments are in sync!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Mismatches detected. Run sync again if needed.${NC}"
  exit 1
fi
```

**Key points:**
- Always load .env before database operations
- Use color codes consistently across all scripts
- Exit 0 for success, 1 for any failure
- Trim whitespace from psql output with `tr -d ' '`

---

## Pattern B: Database Seeding

Create test users with role-specific data volumes (Admin, Director, Manager) using deterministic UUIDs and idempotent SQL operations.

**When to use**: Fresh environment setup, after reset, new developer onboarding

### Prerequisite Checks

```bash
# scripts/dev/create-test-users.sh

# Check for uuidgen
if ! command -v uuidgen &> /dev/null; then
    error_exit "uuidgen is required but not installed. Install uuid-runtime package."
fi

# Check for node
if ! command -v node &> /dev/null; then
    error_exit "node is required but not installed. Please install Node.js."
fi
```

### Docker Container Detection

```bash
# scripts/dev/create-test-users.sh
CONTAINER_NAME="supabase_db_crispy-crm"

if [[ "$DB_URL" == *"localhost"* ]] || [[ "$DB_URL" == *"127.0.0.1"* ]]; then
    # Check if Docker container is running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        info_msg "Using Docker container: ${CONTAINER_NAME}"
        PSQL_CMD="docker exec -i ${CONTAINER_NAME} psql -U postgres -d postgres"
    else
        error_exit "Docker container ${CONTAINER_NAME} is not running."
    fi
else
    # For remote databases, use psql directly
    if ! command -v psql &> /dev/null; then
        error_exit "psql is required for remote database connections."
    fi
    PSQL_CMD="psql $DB_URL"
fi
```

### Deterministic UUID Generation

```bash
# scripts/dev/create-test-users.sh

# Generate UUIDs deterministically using UUIDv5 with DNS namespace
ADMIN_ID=$(uuidgen -s -n @dns -N "$ADMIN_EMAIL")
DIRECTOR_ID=$(uuidgen -s -n @dns -N "$DIRECTOR_EMAIL")
MANAGER_ID=$(uuidgen -s -n @dns -N "$MANAGER_EMAIL")
```

### Heredoc SQL Execution

```bash
# scripts/dev/create-test-users.sh
$PSQL_CMD << EOF
-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Admin user with UPSERT pattern
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role,
  aud
) VALUES (
  '$ADMIN_ID'::uuid,
  '00000000-0000-0000-0000-000000000000',
  '$ADMIN_EMAIL',
  crypt('$TEST_PASSWORD', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Admin User", "role": "admin"}'::jsonb,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = NOW();
EOF

if [ $? -eq 0 ]; then
    success_msg "Auth users created successfully"
else
    error_exit "Failed to create auth users"
fi
```

**Key points:**
- Check prerequisites before operations
- Use deterministic UUIDs for test users (reproducible across environments)
- Docker exec for local, psql for remote
- ON CONFLICT DO UPDATE for idempotent seeding
- Use bcrypt via `gen_salt('bf')` for password hashing

---

## Pattern C: Cleanup/Reset Workflow

Full environment reset with destructive operation safety, transaction-based cleanup, and script composition.

**When to use**: Start fresh, resolve data corruption, before major changes

### Confirmation Pattern

```bash
# scripts/dev/reset-environment.sh

echo -e "${RED}⚠️  ENVIRONMENT RESET${NC}"
echo "   This will DELETE all data in both local and cloud databases."
echo "   Schema structure will be preserved."
echo ""
read -p "Type 'RESET' to confirm: " CONFIRM

if [[ "$CONFIRM" != "RESET" ]]; then
  echo -e "${RED}❌ Cancelled${NC}"
  exit 1
fi
```

### Transaction-Based Cleanup

```bash
# scripts/dev/reset-environment.sh

psql "$CLOUD_DB" << 'EOF' 2>/dev/null
BEGIN;

-- Truncate all public tables with CASCADE
TRUNCATE TABLE
  public.activities,
  public."contactNotes",
  public.contacts,
  public."dealNotes",
  public.deals,
  public.opportunities,
  public.organizations,
  public.products,
  public.sales,
  public.segments,
  public.tags,
  public.tasks,
  public.test_user_metadata
CASCADE;

-- Delete test users from auth.users
DELETE FROM auth.users WHERE email LIKE '%@test.local';

COMMIT;
EOF
```

### Fallback PL/pgSQL

```bash
# scripts/dev/reset-environment.sh

# If primary truncation fails, use dynamic approach
psql "$CLOUD_DB" << 'EOF' 2>/dev/null
BEGIN;

DO $$
DECLARE
  tbl_name text;
BEGIN
  FOR tbl_name IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'activities', 'contactNotes', 'contacts', 'dealNotes',
      'deals', 'opportunities', 'organizations', 'products',
      'sales', 'segments', 'tags', 'tasks', 'test_user_metadata'
    )
  LOOP
    EXECUTE format('TRUNCATE TABLE public.%I CASCADE', tbl_name);
  END LOOP;
END $$;

DELETE FROM auth.users WHERE email LIKE '%@test.local';

COMMIT;
EOF
```

### Script Composition

```bash
# scripts/dev/reset-environment.sh

# Get script directory for relative paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Step 3: Create fresh test users
echo -e "${BLUE}👥 Creating fresh test users...${NC}"
if [ -f "$SCRIPT_DIR/create-test-users.sh" ]; then
  "$SCRIPT_DIR/create-test-users.sh" "$LOCAL_DB"
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to create test users${NC}"
    exit 1
  fi
fi

# Step 4: Sync to cloud
echo -e "${BLUE}🔄 Syncing to cloud...${NC}"
if [ -f "$SCRIPT_DIR/sync-local-to-cloud.sh" ]; then
  "$SCRIPT_DIR/sync-local-to-cloud.sh" --force
fi
```

**Key points:**
- ALWAYS require explicit confirmation for destructive operations
- Use TRUNCATE CASCADE in transactions for atomicity
- Compose scripts for complex workflows
- Include fallback for partial failures (dynamic PL/pgSQL)
- Use `SCRIPT_DIR` for reliable relative paths

---

## Pattern D: JWT/Auth Utilities

Generate local Supabase JWTs for testing using the custom jwt_secret from config.toml.

**When to use**: Custom JWT secret, testing auth flows, debugging API access

### JWT Structure

```javascript
// scripts/dev/generate-jwt.mjs
import { createHmac } from 'crypto';

// JWT secret from supabase/config.toml
const JWT_SECRET = 'sHbpum5xlg1QpejKLTKDfcsbaWF32fjX62+B9TPw/KiKZ1wcP7WkLuq2jorwNCTcRYbBK+hgE7A9q9oNkujZ4Q==';

// JWT Header
const header = {
  alg: 'HS256',
  typ: 'JWT'
};

// Function to generate JWT
function generateJWT(role) {
  const payload = {
    iss: 'http://127.0.0.1:54321/auth/v1',
    role: role,
    exp: 1983812996  // Year 2032 - far future for dev tokens
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signatureInput = `${headerB64}.${payloadB64}`;

  const signature = createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${signatureInput}.${signature}`;
}

// Generate both tokens
const serviceRoleJWT = generateJWT('service_role');
const anonJWT = generateJWT('anon');
```

### base64url Encoding

```javascript
// scripts/dev/generate-jwt.mjs

function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')   // + → -
    .replace(/\//g, '_')   // / → _
    .replace(/=/g, '');    // Remove padding
}
```

**Key points:**
- Match jwt_secret from config.toml exactly
- Use HS256 algorithm for local Supabase
- Set exp far in future for dev tokens (year 2032)
- Include both service_role and anon tokens
- base64url differs from base64 in character replacement

---

## Pattern Comparison Table

| Aspect | Verification | Seeding | Reset | JWT |
|--------|--------------|---------|-------|-----|
| **Purpose** | Compare envs | Create users | Full cleanup | Generate tokens |
| **Destructive** | No | No (upsert) | YES | No |
| **Requires confirm** | No | No | Yes | No |
| **Language** | Bash | Bash | Bash | Node.js |
| **Uses .env** | .env.cloud | Arguments | .env.production | Hardcoded |
| **Docker aware** | No | Yes | No | N/A |

---

## Anti-Patterns to Avoid

### 1. Missing Confirmation on Destructive Operations

```bash
# BAD: No confirmation before delete
psql "$DB" -c "TRUNCATE ALL CASCADE"

# GOOD: Require explicit confirmation
read -p "Type 'RESET' to confirm: " CONFIRM
if [[ "$CONFIRM" != "RESET" ]]; then
  echo "Cancelled"
  exit 1
fi
```

### 2. Hardcoded Credentials

```bash
# BAD: Credentials in script
CLOUD_DB="postgresql://user:password@host/db"

# GOOD: Load from .env file
source .env.production
CLOUD_DB="${DATABASE_URL_PRODUCTION}"
```

### 3. Silent Failures

```bash
# BAD: Ignore errors
psql "$DB" -c "SELECT 1" 2>/dev/null

# GOOD: Check exit codes
if ! psql "$DB" -c "SELECT 1" &>/dev/null; then
  error_exit "Failed to connect to database"
fi
```

### 4. Missing set -e

```bash
# BAD: Script continues after failures
#!/bin/bash
command_that_fails
next_command  # Still runs!

# GOOD: Exit on first failure
#!/bin/bash
set -e
command_that_fails
next_command  # Never reached if above fails
```

---

## Development Script Checklist

When creating new development scripts:

1. [ ] Add `set -e` at top of script
2. [ ] Define color codes for consistent output
3. [ ] Load .env with multi-path fallback
4. [ ] Check prerequisites with `command -v`
5. [ ] Add confirmation for destructive operations
6. [ ] Use proper exit codes (0=success, 1=failure)
7. [ ] Add `--force` flag for non-interactive execution
8. [ ] Include usage/help message
9. [ ] Verify: `shellcheck scripts/dev/your-script.sh`

---

## File Reference

| Pattern | Primary Files |
|---------|---------------|
| **A: Environment Verification** | `verify-environment.sh` |
| **B: Database Seeding** | `create-test-users.sh`, `sync-local-to-cloud.sh` |
| **C: Cleanup/Reset** | `reset-environment.sh` |
| **D: JWT/Auth Utilities** | `generate-jwt.mjs`, `test-fetch.mjs` |
| **Monitoring** | `monitor-resources.sh`, `optimize-memory.sh` |
