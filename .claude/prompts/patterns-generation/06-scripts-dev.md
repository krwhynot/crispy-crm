---
name: generate-patterns-scripts-dev
directory: scripts/dev/
complexity: MEDIUM
output: scripts/dev/PATTERNS.md
---

# Generate PATTERNS.md for Development Scripts

## Context

The `scripts/dev/` directory contains shell scripts and Node.js utilities for local development workflow. These scripts manage environment setup, test user creation, database synchronization between local and cloud, JWT generation, and system resource monitoring. They are essential for developer onboarding and maintaining parity between local Supabase and cloud environments.

**Primary concerns**: Environment verification, database seeding, cleanup/reset workflows, JWT utilities, resource management.

---

## Phase 1: Exploration

Read these files to understand the script patterns:

### Environment Verification
```
scripts/dev/verify-environment.sh
```
- Purpose: Compare local vs cloud database table counts
- Key patterns: Color output, .env loading, table iteration, exit codes

### Database Seeding
```
scripts/dev/create-test-users.sh
```
- Purpose: Create 3 test users with role-specific data volumes
- Key patterns: Prerequisite checks, deterministic UUIDs, Docker container detection, heredoc SQL

### Cleanup/Reset
```
scripts/dev/reset-environment.sh
```
- Purpose: Full environment reset (local + cloud) with confirmation
- Key patterns: Destructive operation confirmation, script composition, transaction-based cleanup

### JWT Utilities
```
scripts/dev/generate-jwt.mjs
scripts/dev/test-fetch.mjs
```
- Purpose: Generate local Supabase JWTs, test API endpoints
- Key patterns: HMAC signing, base64url encoding, fetch testing

### Sync Operations
```
scripts/dev/sync-local-to-cloud.sh
```
- Purpose: Push local data to cloud with backup
- Key patterns: pg_dump/psql, backup creation, auth user sync, verification

### Resource Management
```
scripts/dev/monitor-resources.sh
scripts/dev/optimize-memory.sh
```
- Purpose: Monitor Node/Docker resource usage, optimize memory settings
- Key patterns: Real-time monitoring loops, process management, environment variables

---

## Phase 2: Pattern Identification

Identify these patterns from the scripts:

### Pattern A: Environment Verification
- How scripts load .env files (multi-path fallback)
- Color-coded output formatting
- Database connectivity checks
- Table count comparison between environments
- Exit code conventions (0=success, 1=failure)

### Pattern B: Database Seeding
- Prerequisite checks (uuidgen, node, psql, Docker)
- Deterministic UUID generation with UUIDv5
- Docker container vs direct psql detection
- Heredoc SQL execution
- Role-specific data volume configuration

### Pattern C: Cleanup/Reset Workflow
- Destructive operation confirmation patterns
- Transaction-based truncation
- Script composition (calling other scripts)
- Fallback strategies for partial failures
- Fresh data regeneration after cleanup

### Pattern D: JWT/Auth Utilities
- Local Supabase JWT structure (HS256)
- base64url encoding implementation
- Service role vs anon token generation
- API testing with Bearer tokens

---

## Phase 3: Generate PATTERNS.md

Use this structure for the output:

```markdown
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

{Description of .env loading, color output, database checks}

**When to use**: Before sync operations, after environment changes, CI validation

### .env Multi-Path Loading

```bash
# scripts/dev/verify-environment.sh
{Show .env loading pattern with fallback paths}
```

### Color-Coded Output

```bash
{Show color code definitions and usage}
```

### Exit Code Convention

```bash
{Show success/failure exit patterns}
```

**Key points:**
- Always load .env before database operations
- Use color codes consistently across all scripts
- Exit 0 for success, 1 for any failure
- Trim whitespace from psql output with `tr -d ' '`

---

## Pattern B: Database Seeding

{Description of test user creation with role-based data}

**When to use**: Fresh environment setup, after reset, new developer onboarding

### Prerequisite Checks

```bash
# scripts/dev/create-test-users.sh
{Show command -v checks, Docker container detection}
```

### Deterministic UUID Generation

```bash
{Show uuidgen -s pattern for reproducible IDs}
```

### Heredoc SQL Execution

```bash
{Show $PSQL_CMD << EOF pattern}
```

**Key points:**
- Check prerequisites before operations
- Use deterministic UUIDs for test users
- Docker exec for local, psql for remote
- ON CONFLICT DO UPDATE for idempotent seeding

---

## Pattern C: Cleanup/Reset Workflow

{Description of destructive operation safety}

**When to use**: Start fresh, resolve data corruption, before major changes

### Confirmation Pattern

```bash
# scripts/dev/reset-environment.sh
{Show read -p confirmation requiring exact text}
```

### Transaction-Based Cleanup

```bash
{Show BEGIN/TRUNCATE CASCADE/COMMIT pattern}
```

### Script Composition

```bash
{Show calling create-test-users.sh and sync-local-to-cloud.sh}
```

**Key points:**
- ALWAYS require explicit confirmation for destructive operations
- Use TRUNCATE CASCADE in transactions for atomicity
- Compose scripts for complex workflows
- Include fallback for partial failures

---

## Pattern D: JWT/Auth Utilities

{Description of local Supabase JWT generation}

**When to use**: Custom JWT secret, testing auth flows, debugging API access

### JWT Structure

```javascript
// scripts/dev/generate-jwt.mjs
{Show header, payload, signature generation}
```

### base64url Encoding

```javascript
{Show base64url function}
```

**Key points:**
- Match jwt_secret from config.toml
- Use HS256 algorithm for local Supabase
- Set exp far in future for dev tokens (year 2032)
- Include both service_role and anon tokens

---

## Pattern Comparison Table

| Aspect | Verification | Seeding | Reset | JWT |
|--------|--------------|---------|-------|-----|
| **Purpose** | Compare envs | Create users | Full cleanup | Generate tokens |
| **Destructive** | No | No (upsert) | YES | No |
| **Requires confirm** | No | No | Yes | No |
| **Language** | Bash | Bash | Bash | Node.js |

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
```

---

## Phase 4: Write the File

Write the generated PATTERNS.md to:

```
/home/krwhynot/projects/crispy-crm/scripts/dev/PATTERNS.md
```

### Final Instructions

1. Read all files listed in Phase 1
2. Extract real code examples (not pseudo-code) for each pattern
3. Generate the PATTERNS.md following the template structure
4. Ensure all code blocks reference actual file paths
5. Verify ASCII diagram matches current directory structure
6. Include shell-specific anti-patterns (missing set -e, hardcoded secrets)
7. Write to the output path
