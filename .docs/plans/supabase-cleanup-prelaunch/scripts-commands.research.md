# Script Structure and NPM Commands Research

This document provides comprehensive research on the current script organization, npm commands, and tooling infrastructure in the Atomic CRM project to inform the development of new Supabase cleanup scripts.

## Overview

The Atomic CRM project has a mature scripting infrastructure with 40+ utility scripts organized for database migrations, data seeding, validation, and deployment. The scripts heavily leverage Supabase CLI commands and use Node.js with ESM modules. There are notable gaps in production-ready database management tooling that the new cleanup scripts will address.

## Current Script Directory Structure

### `/home/krwhynot/projects/crispy-crm/scripts/` (40+ files)

**Organization Pattern**: Flat structure with functional naming conventions

#### Migration Scripts (12 files)
- `/home/krwhynot/projects/crispy-crm/scripts/migrate-production.js` - Production migration orchestrator with phase management
- `/home/krwhynot/projects/crispy-crm/scripts/migration-validate.sh` - Shell-based validation wrapper
- `/home/krwhynot/projects/crispy-crm/scripts/post-migration-validation.js` - Post-migration integrity checks
- `/home/krwhynot/projects/crispy-crm/scripts/production-safety-wrapper.js` - Production safety checks
- `/home/krwhynot/projects/crispy-crm/scripts/mcp-migrate.js` - MCP-based migration executor
- `/home/krwhynot/projects/crispy-crm/scripts/mcp-migrate-create.js` - Migration file generator
- `/home/krwhynot/projects/crispy-crm/scripts/mcp-migrate-status.js` - Migration status checker
- `/home/krwhynot/projects/crispy-crm/scripts/mcp-deploy-validate.js` - Deployment validation
- `/home/krwhynot/projects/crispy-crm/scripts/apply-migration.mjs` - Generic migration applicator
- `/home/krwhynot/projects/crispy-crm/scripts/migration-production-safe.sql` - Production-safe SQL template
- `/home/krwhynot/projects/crispy-crm/scripts/final-verification.js` - Final post-deployment verification
- `/home/krwhynot/projects/crispy-crm/scripts/apply-rls-fix.js` - RLS policy fix script

#### Validation Scripts (8 files in `/scripts/validation/`)
- `/home/krwhynot/projects/crispy-crm/scripts/validation/run-pre-validation.js` - **Main validation orchestrator** (426 lines)
- `/home/krwhynot/projects/crispy-crm/scripts/validation/pre-migration-validation.sql` - SQL validation queries
- `/home/krwhynot/projects/crispy-crm/scripts/validation/capture-current-state.sql` - State capture queries (20KB)
- `/home/krwhynot/projects/crispy-crm/scripts/validation/data-quality.js` - Data quality checks (27KB)
- `/home/krwhynot/projects/crispy-crm/scripts/validation/referential-integrity.js` - FK integrity validation (13KB)
- `/home/krwhynot/projects/crispy-crm/scripts/validation/required-fields.js` - Required field validation (20KB)
- `/home/krwhynot/projects/crispy-crm/scripts/validation/unique-constraints.js` - Unique constraint validation (15KB)
- `/home/krwhynot/projects/crispy-crm/scripts/validation/go-no-go.js` - Go/no-go decision logic (18KB)

#### Data Management Scripts (6 files)
- `/home/krwhynot/projects/crispy-crm/scripts/seed-data.js` - **Comprehensive seed data generator** (900 lines, F&B focused)
- `/home/krwhynot/projects/crispy-crm/scripts/seed-products.js` - Product-specific seeding
- `/home/krwhynot/projects/crispy-crm/scripts/seed-products.mjs` - Alternative product seeding
- `/home/krwhynot/projects/crispy-crm/scripts/add-more-test-data.js` - Additional test data (15KB)
- `/home/krwhynot/projects/crispy-crm/scripts/create-test-user.sql` - Test user creation SQL
- `/home/krwhynot/projects/crispy-crm/scripts/cache-invalidation.js` - **Cache clearing utility** (368 lines)

#### Utility & Testing Scripts (8 files)
- `/home/krwhynot/projects/crispy-crm/scripts/search-reindex.js` - Search index rebuilding (19KB)
- `/home/krwhynot/projects/crispy-crm/scripts/validate-colors.js` - Tailwind color validation (13KB)
- `/home/krwhynot/projects/crispy-crm/scripts/load-test.js` - Performance load testing (16KB)
- `/home/krwhynot/projects/crispy-crm/scripts/analyze-dependencies.js` - Dependency analysis
- `/home/krwhynot/projects/crispy-crm/scripts/validate-provider-consolidation.ts` - Provider validation
- `/home/krwhynot/projects/crispy-crm/scripts/type-safety-progress.js` - TypeScript migration tracking
- `/home/krwhynot/projects/crispy-crm/scripts/phase-lint-check.sh` - Phase-based linting
- `/home/krwhynot/projects/crispy-crm/scripts/add-eslint-a11y.sh` - Accessibility linting setup

#### Deployment & Build Scripts (3 files)
- `/home/krwhynot/projects/crispy-crm/scripts/ghpages-deploy.mjs` - **GitHub Pages deployment** (15 lines, simple)
- `/home/krwhynot/projects/crispy-crm/scripts/supabase-remote-init.mjs` - **Remote Supabase initialization** (228 lines)
- `/home/krwhynot/projects/crispy-crm/scripts/generate-types-mcp.cjs` - TypeScript type generation

#### Test Helper Scripts (6 files)
- `/home/krwhynot/projects/crispy-crm/scripts/test-filter-format.mjs` - Filter format testing
- `/home/krwhynot/projects/crispy-crm/scripts/test-escaping-fix.mjs` - String escaping tests
- `/home/krwhynot/projects/crispy-crm/scripts/test-string-escaping.mjs` - String escaping validation
- `/home/krwhynot/projects/crispy-crm/scripts/test-validation-directly.mjs` - Direct validation testing
- `/home/krwhynot/projects/crispy-crm/scripts/test-array-filter-conversion.mjs` - Array filter tests (17KB)
- `/home/krwhynot/projects/crispy-crm/scripts/postgrest-correct-escaping.mjs` - PostgREST escaping validation

## NPM Scripts Analysis (67 scripts in package.json)

### Test Scripts (8 scripts)
```json
"test": "vitest",                          // Run tests in watch mode
"test:coverage": "vitest run --coverage",  // Generate coverage report (70% required)
"test:ui": "vitest --ui",                  // Launch Vitest UI
"test:watch": "vitest",                    // Watch mode (alias)
"test:unit": "vitest run src/**/*.test.{ts,tsx}",  // Unit tests only
"test:smoke": "bash tests/simple-smoke-test.sh",   // Quick smoke test
"test:performance": "vitest run tests/performance/", // Performance benchmarks
"test:load": "node ./scripts/load-test.js", // Load testing
"test:ci": "vitest run --reporter=verbose"  // CI test execution
```

### Development Scripts (4 scripts)
```json
"dev": "vite --force",                     // Start dev server (http://localhost:5173)
"dev:local": "npx supabase db reset && vite --force", // Reset DB + start dev
"dev:check": "npx supabase status",        // Check Supabase status
"preview": "vite preview"                  // Preview production build
```

### Build Scripts (2 scripts)
```json
"build": "./node_modules/.bin/tsc --noEmit && vite build",  // TypeScript check + build
"prod:start": "npm run build && npm run supabase:deploy && npx serve -l tcp://127.0.0.1:3000 dist",
"prod:deploy": "npm run build && npm run supabase:deploy && npm run ghpages:deploy"
```

### Lint & Format Scripts (5 scripts)
```json
"lint": "npm run lint:check && npm run prettier:check",     // Combined linting
"lint:apply": "eslint **/*.{mjs,ts,tsx} --fix",            // Auto-fix linting
"lint:check": "eslint **/*.{mjs,ts,tsx}",                  // Check linting
"prettier:apply": "prettier --config ./.prettierrc.mjs --write --list-different \"**/*.{js,json,ts,tsx,css,md,html}\"",
"prettier:check": "prettier --config ./.prettierrc.mjs --check \"**/*.{js,json,ts,tsx,css,md,html}\""
```

### Supabase Local Scripts (6 scripts)
```json
"supabase:local:start": "npx supabase start",      // Start local Supabase (Docker)
"supabase:local:stop": "npx supabase stop",        // Stop local Supabase
"supabase:local:restart": "npx supabase stop && npx supabase start",  // Restart
"supabase:local:status": "npx supabase status",    // Check status
"supabase:local:db:reset": "npx supabase db reset", // Reset DB + migrations
"supabase:local:studio": "echo 'Supabase Studio: http://localhost:54323'"
```

### Supabase Remote Scripts (3 scripts)
```json
"supabase:remote:init": "node ./scripts/supabase-remote-init.mjs",  // Initialize remote project
"supabase:deploy": "npx supabase db push && npx supabase functions deploy",  // Deploy all
"db:migrate": "npx supabase db reset",             // Alias for db reset
"db:studio": "echo 'Supabase Studio: http://localhost:54323' && open http://localhost:54323 || xdg-open http://localhost:54323 || echo 'Please visit http://localhost:54323'"
```

### Migration Scripts (11 scripts)
```json
"migrate:production": "node ./scripts/migrate-production.js",      // Production migration
"migrate:execute": "node ./scripts/migration-execute.js",          // Execute migration
"migrate:dry-run": "node ./scripts/migration-dry-run.js",          // Dry run
"migrate:backup": "node ./scripts/migration-backup.js",            // Create backup
"migrate:rollback": "node ./scripts/migration-rollback.js",        // Rollback migration
"migrate:cleanup": "node ./scripts/migration-cleanup.js",          // Cleanup old data
"migrate:validate": "node ./scripts/post-migration-validation.js", // Post-migration validation
"migrate:verify": "node ./scripts/migration-verify.js",            // Verify migration
"migrate:report": "node ./scripts/migration-report.js",            // Generate report
"migrate:status": "node ./scripts/migration-status.js",            // Check status
"migrate:monitor": "node ./scripts/migration-monitor.js",          // Monitor migration
"migrate:transform": "node ./scripts/migration-transform.js"       // Transform data
```

### Validation Scripts (2 scripts)
```json
"validate:colors": "node ./scripts/validate-colors.js",            // Validate Tailwind colors
"validate:pre-migration": "node ./scripts/validation/run-pre-validation.js",
"validate:pre-migration:dry-run": "node ./scripts/validation/run-pre-validation.js --dry-run"
```

### Data Management Scripts (7 scripts)
```json
"seed:data": "node ./scripts/seed-data.js",                 // Generate & insert test data
"seed:data:dry-run": "node ./scripts/seed-data.js --dry-run",  // Preview data
"seed:data:clean": "node ./scripts/seed-data.js --clean",   // Clean + regenerate
"seed:products": "node ./scripts/seed-products.js",         // Seed products
"seed:products:dry-run": "node ./scripts/seed-products.js --dry-run",
"cache:clear": "node ./scripts/cache-invalidation.js",      // Clear all caches
"cache:clear:dry-run": "node ./scripts/cache-invalidation.js --dry-run",
"search:reindex": "node ./scripts/search-reindex.js",       // Rebuild search indexes
"search:reindex:dry-run": "node ./scripts/search-reindex.js --dry-run"
```

### Deployment Scripts (2 scripts)
```json
"ghpages:deploy": "node ./scripts/ghpages-deploy.mjs",     // Deploy to GitHub Pages
"chromatic": "chromatic --exit-zero-on-changes",           // Chromatic visual testing
"chromatic:ci": "chromatic --only-changed --exit-once-uploaded"
```

### Storybook Scripts (3 scripts)
```json
"storybook": "storybook dev -p 6006",                      // Start Storybook dev server
"build-storybook": "storybook build",                      // Build Storybook
"prepare": "node -e \"if (process.env.CI !== 'true') { try { require('child_process').execSync('husky', {stdio: 'inherit'}) } catch (e) { } }\""
```

## Environment Configuration

### Environment Files (5 files)
1. `/home/krwhynot/projects/crispy-crm/.env.example` - **Template for all environments**
2. `/home/krwhynot/projects/crispy-crm/.env.local` - Local development (gitignored)
3. `/home/krwhynot/projects/crispy-crm/.env.production.example` - Production template
4. `/home/krwhynot/projects/crispy-crm/.env.migration` - Migration-specific config
5. `/home/krwhynot/projects/crispy-crm/supabase/.env` - Supabase CLI config

### Key Environment Variables

#### Required for Development
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Local anon key
```

#### Required for Production
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>
```

#### Optional but Recommended
```bash
# For MCP tools and admin operations
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# For migrations (alternative to Supabase URL)
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres

# For migration scripts
SUPABASE_DB_PASSWORD=postgres
```

#### Application Configuration
```bash
# Opportunity (formerly deal) configuration
OPPORTUNITY_DEFAULT_CATEGORY=new_business
OPPORTUNITY_DEFAULT_STAGE=new_lead
OPPORTUNITY_PIPELINE_STAGES=new_lead,initial_outreach,sample_visit_offered,awaiting_response,feedback_logged,demo_scheduled,closed_won,closed_lost
OPPORTUNITY_MAX_AMOUNT=1000000
OPPORTUNITY_DEFAULT_PROBABILITY=50

# App metadata
APP_NAME=Atomic CRM
APP_VERSION=0.1.0

# Skip CRA preflight check
SKIP_PREFLIGHT_CHECK=true
```

#### Seed Data Configuration
```bash
# Used by seed-data.js
SEED_ORGANIZATION_COUNT=50
SEED_CONTACT_COUNT=100
SEED_OPPORTUNITY_COUNT=75
SEED_ACTIVITY_COUNT=200
SEED_NOTE_COUNT=150
SEED_TAG_COUNT=20
```

### Environment Variable Usage Patterns

**Pattern 1: Dual Configuration (Local vs Remote)**
```javascript
// From scripts/seed-data.js
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                           process.env.VITE_SUPABASE_ANON_KEY;
```

**Pattern 2: Database URL Construction**
```javascript
// From scripts/validation/run-pre-validation.js
getConnectionString() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || "postgres";
  return `postgresql://postgres.${projectId}:${dbPassword}@db.${projectId}.supabase.co:5432/postgres`;
}
```

**Pattern 3: Feature Flag Configuration**
```javascript
// From scripts/seed-data.js
const CONFIG = {
  ORGANIZATION_COUNT: parseInt(process.env.SEED_ORGANIZATION_COUNT || "50"),
  DEFAULT_STAGE: process.env.OPPORTUNITY_DEFAULT_STAGE || "new_lead",
  DRY_RUN: process.argv.includes("--dry-run"),
  CLEAN: process.argv.includes("--clean"),
};
```

## Supabase Configuration

### `/home/krwhynot/projects/crispy-crm/supabase/config.toml`

**Key Configuration Settings:**
- Project ID: `crispy-crm`
- API Port: 54321 (PostgREST)
- DB Port: 54322 (PostgreSQL)
- Studio Port: 54323 (Supabase Studio)
- Inbucket Port: 54324 (Email testing)
- DB Version: PostgreSQL 15
- Storage: **Disabled** (CLI/Storage API version mismatch noted)
- Realtime: Enabled
- Auth: Enabled with JWT expiry 3600s
- Max Rows: 1000 per API request

### Supabase Directory Structure
```
/home/krwhynot/projects/crispy-crm/supabase/
├── config.toml           # Supabase CLI configuration
├── .env                  # Local Supabase environment
├── seed.sql              # Seed data SQL
├── migrations/           # Database migrations
├── functions/            # Edge Functions
│   ├── _shared/          # Shared function utilities
│   ├── users/            # User management endpoint
│   └── updatePassword/   # Password update endpoint
├── templates/            # Email templates (invite, recovery)
└── .branches/            # Git-style branch management
```

## Existing Supabase CLI Usage Patterns

### From package.json Scripts
```bash
# Local development
npx supabase start                    # Docker-based local stack
npx supabase stop
npx supabase status
npx supabase db reset                 # Reset + run migrations

# Remote operations
npx supabase login                    # Authenticate
npx supabase projects create          # Create new project
npx supabase projects list            # List projects
npx supabase projects api-keys        # Get API keys
npx supabase link                     # Link to remote project
npx supabase db push                  # Push migrations
npx supabase functions deploy         # Deploy edge functions
npx supabase migration new <name>     # Create migration file
```

### From Scripts
```javascript
// supabase-remote-init.mjs - Project initialization
await execa('npx', ['supabase', 'login'], { stdio: 'inherit' });
await execa('npx', ['supabase', 'projects', 'create', '--interactive']);
await execa('npx', ['supabase', 'link', '--project-ref', projectRef]);
await execa('npx', ['supabase', 'db', 'push', '--linked', '--include-roles']);
```

## Key Script Patterns & Conventions

### 1. Logging & Output
```javascript
// Using chalk + ora for rich console output
import chalk from "chalk";
import ora from "ora";

const spinner = ora();
spinner.start("Processing...");
spinner.succeed("Completed");

console.log(chalk.blue("ℹ Info message"));
console.log(chalk.green("✔ Success"));
console.log(chalk.yellow("⚠ Warning"));
console.log(chalk.red("✖ Error"));
```

### 2. Dry Run Support
```javascript
// Standard dry-run pattern across all scripts
const isDryRun = process.argv.includes("--dry-run");

if (isDryRun) {
  console.log("[DRY RUN] Would execute action");
  return;
}
// Execute actual operation
```

### 3. Supabase Client Initialization
```javascript
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

### 4. Database Connection (Direct PostgreSQL)
```javascript
const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("supabase.co")
    ? { rejectUnauthorized: false }
    : false,
});

await client.connect();
// Execute queries
await client.end();
```

### 5. Error Handling & Exit Codes
```javascript
try {
  // Main operation
  process.exit(0);  // Success
} catch (error) {
  console.error(`Failed: ${error.message}`);
  if (isVerbose) {
    console.error(error.stack);
  }
  process.exit(1);  // Failure
}
```

### 6. File Organization
- **Module Type**: ESM (`"type": "module"` in package.json)
- **Extensions**: `.js` for ESM, `.mjs` for explicit ESM, `.cjs` for CommonJS
- **Shebang**: `#!/usr/bin/env node` for executable scripts
- **Imports**: ESM imports preferred, dotenv for environment variables

## Gaps in Current Tooling

### Critical Gaps (New Scripts Will Address)

1. **No Centralized Cleanup Tool**
   - Current: Manual `DELETE` operations in seed-data.js
   - Need: Comprehensive cleanup script with selective table targeting
   - Missing: Safety checks, backup verification, RLS-aware deletion

2. **No Automated Backup Management**
   - Current: `migration-backup.js` referenced but doesn't exist
   - Need: Automated pg_dump with retention policies
   - Missing: Backup verification, restore testing, S3/cloud upload

3. **No Database Reset for Production**
   - Current: Only `npx supabase db reset` for local (runs migrations)
   - Need: Production-safe reset with multiple confirmation prompts
   - Missing: Data preservation options, selective reset

4. **No Centralized Migration Management**
   - Current: Multiple migration scripts with overlapping functionality
   - Need: Single migration orchestrator with rollback capabilities
   - Missing: Migration dependency tracking, version control

5. **No Orphan Detection**
   - Current: Validation scripts check FK integrity at migration time only
   - Need: On-demand orphan record detection and cleanup
   - Missing: Automated orphan resolution, relationship rebuilding

6. **No Supabase Project Deletion**
   - Current: Manual deletion through dashboard only
   - Need: CLI-based project deletion for CI/CD
   - Missing: Data export before deletion, confirmation safeguards

7. **No Automated Table Truncation**
   - Current: Manual `DELETE FROM table` in various scripts
   - Need: Batch truncation with cascade handling
   - Missing: Order-aware truncation, FK constraint handling

### Moderate Gaps

8. **Limited State Management**
   - Current: `migration-state.json` in migrate-production.js
   - Need: Persistent state across all operations
   - Missing: Operation history, rollback points

9. **No Unified Logging**
   - Current: Each script manages its own logs
   - Need: Centralized logging with structured output
   - Missing: Log aggregation, searchable logs

10. **No Interactive Mode**
    - Current: Command-line flags only
    - Need: Interactive prompts for complex operations
    - Missing: User guidance, confirmation flows

## Recommendations for New Scripts

### Architecture Principles

1. **Consistency with Existing Patterns**
   - Use chalk + ora for console output
   - Support `--dry-run` flag universally
   - Follow ESM module conventions
   - Use dotenv for configuration

2. **Safety-First Design**
   - Multiple confirmation prompts for destructive operations
   - Mandatory backup before cleanup/reset
   - RLS-aware operations (use service role key)
   - Rollback capabilities

3. **Observability**
   - Structured JSON logs in `/logs/` directory
   - Progress indicators for long operations
   - Clear error messages with recovery suggestions

4. **Flexibility**
   - Support both local and remote Supabase
   - Allow selective operations (by table, by date range)
   - Enable batch operations with rate limiting

### Naming Conventions

- **Cleanup**: `supabase-cleanup-<scope>.js` (e.g., `supabase-cleanup-data.js`)
- **Backup**: `supabase-backup-<action>.js` (e.g., `supabase-backup-create.js`)
- **Reset**: `supabase-reset-<scope>.js` (e.g., `supabase-reset-database.js`)
- **Migration**: `supabase-migrate-<action>.js` (e.g., `supabase-migrate-orchestrator.js`)

### NPM Script Naming

- **Cleanup**: `supabase:cleanup:<scope>` (e.g., `supabase:cleanup:data`)
- **Backup**: `supabase:backup:<action>` (e.g., `supabase:backup:create`)
- **Reset**: `supabase:reset:<scope>` (e.g., `supabase:reset:local`)
- **Manage**: `supabase:manage:<action>` (e.g., `supabase:manage:orphans`)

## Key Files for Reference

### Production-Quality Scripts to Emulate
1. `/home/krwhynot/projects/crispy-crm/scripts/seed-data.js` - Comprehensive data generation with cleanup
2. `/home/krwhynot/projects/crispy-crm/scripts/validation/run-pre-validation.js` - Well-structured orchestrator
3. `/home/krwhynot/projects/crispy-crm/scripts/cache-invalidation.js` - Multi-layer cache management
4. `/home/krwhynot/projects/crispy-crm/scripts/migrate-production.js` - Phase-based migration with state management

### Configuration Files
1. `/home/krwhynot/projects/crispy-crm/.env.example` - Environment variable reference
2. `/home/krwhynot/projects/crispy-crm/supabase/config.toml` - Supabase configuration
3. `/home/krwhynot/projects/crispy-crm/package.json` - NPM scripts reference

### Documentation
1. `/home/krwhynot/projects/crispy-crm/CLAUDE.md` - Project architecture and conventions
2. `/home/krwhynot/projects/crispy-crm/.docs/testing/TESTING.md` - Testing patterns

## Summary

The Atomic CRM project has a mature scripting infrastructure with clear conventions and patterns. The new Supabase cleanup scripts should:

1. **Follow established patterns**: chalk/ora for output, dry-run support, ESM modules
2. **Fill critical gaps**: Automated backups, production-safe resets, orphan cleanup, project deletion
3. **Integrate seamlessly**: Use existing environment variables, follow naming conventions
4. **Prioritize safety**: Multiple confirmations, mandatory backups, RLS-aware operations
5. **Enable automation**: Support CI/CD workflows, batch operations, scheduled maintenance

The existing scripts provide excellent templates for structure, error handling, and user experience that the new scripts should emulate and extend.
