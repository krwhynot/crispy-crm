# Setup & Deployment Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** - Version 22 LTS (specified in `.nvmrc`)
  - Check version: `node --version` (should output `v22.x.x`)
  - Install from: https://nodejs.org/ or use nvm: `nvm install 22 && nvm use 22`

- **npm** - Version 10+ (comes with Node.js 22)
  - Check version: `npm --version`

- **Docker Desktop** - Required for local Supabase instance
  - Download from: https://www.docker.com/products/docker-desktop
  - **Linux/WSL:** Also install Docker Compose

- **Git** - For cloning the repository
  - Check version: `git --version`

---

## Local Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/crispy-crm.git
cd crispy-crm

# Install dependencies
npm install
```

**This installs:**
- Frontend dependencies (React, TypeScript, Vite, React Admin, etc.)
- Supabase CLI (for database management)
- Development tools (Vitest, Playwright, ESLint, Prettier)

---

### 2. Environment Variables

The project requires Supabase credentials. Two pre-configured templates are provided:

**Option A: Local Docker Supabase (Recommended for Development)**

```bash
# Copy local environment template
cp .env.local .env
```

**Contents of `.env.local` (auto-configured for Docker):**
```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key-from-supabase-start>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Option B: Supabase Cloud (For Cloud Development)**

```bash
# Copy cloud environment template
cp .env.cloud .env

# Edit .env and add your credentials:
# 1. Go to https://app.supabase.com/project/<your-project>/settings/api
# 2. Copy Project URL → VITE_SUPABASE_URL
# 3. Copy anon/public key → VITE_SUPABASE_ANON_KEY
# 4. Copy Database connection string → DATABASE_URL
# 5. Copy service_role key → SUPABASE_SERVICE_ROLE_KEY (NEVER expose this in client code!)
```

**Environment Variable Reference:**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_SUPABASE_URL` | **Yes** | Supabase project URL | `http://127.0.0.1:54321` (local) or `https://xxx.supabase.co` (cloud) |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | Public anonymous key (safe to expose) | Long JWT token string |
| `DATABASE_URL` | No | Direct database connection (for seeds/migrations) | `postgresql://postgres:postgres@...` |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Service role key (server-side only, NEVER expose) | Long JWT token string |
| `APP_NAME` | No | Application branding | `Atomic CRM` |
| `APP_VERSION` | No | Application version | `0.1.0` |

---

### 3. Start Local Supabase (Docker)

**First Time Setup:**

```bash
# Start Supabase services (Docker containers)
npm run db:local:start
# or manually: npx supabase start

# This will:
# 1. Pull Supabase Docker images (~2GB)
# 2. Start PostgreSQL (port 54322)
# 3. Start REST API (port 54321)
# 4. Start Studio GUI (port 54323)
# 5. Output local credentials to terminal
```

**Expected Output:**
```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: <secret-key>
        anon key: <anon-key>
service_role key: <service-role-key>
```

**Copy the `anon key` to your `.env` file if not already set.**

---

### 4. Initialize Database

**Seed with Test Data:**

```bash
# Reset database and apply all migrations + seed data
npm run db:local:reset

# This will:
# 1. Drop all existing data
# 2. Apply migrations from supabase/migrations/
# 3. Run seed script from supabase/seed.sql
```

**Seed Data Includes:**
- Test user: `admin@test.com` / `password123`
- 16 organizations
- ~50 contacts
- ~30 opportunities
- Sample tasks, activities, products

**Verify Database:**

```bash
# Open Supabase Studio (GUI) in browser
open http://localhost:54323

# Or check database directly
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) FROM contacts;"
```

---

### 5. Start Development Server

```bash
# Start Vite dev server
npm run dev

# Server starts at: http://localhost:5173
```

**Verify Setup:**
1. Open http://localhost:5173 in browser
2. Login with: `admin@test.com` / `password123`
3. You should see the dashboard with test data

**Development Server Features:**
- Hot Module Replacement (HMR) - Changes reflect instantly
- TypeScript type checking
- Fast refresh for React components
- Source maps for debugging

---

## Quick Start (All-in-One)

**For convenience, use the combined script:**

```bash
# Fresh start: Reset DB + Seed + Dev Server
npm run dev:local

# This runs sequentially:
# 1. cp .env.local .env
# 2. npx supabase start
# 3. npx supabase db reset
# 4. vite --force
```

**Use this when:**
- Starting work each day
- Switching between branches with schema changes
- Database got into bad state and needs reset

---

## Testing

### Run Unit Tests

```bash
# Run tests in watch mode (recommended during development)
npm test

# Run tests once with coverage report
npm run test:coverage

# Run tests in UI mode (visual test runner)
npm run test:ui
```

**Coverage Requirements:**
- Minimum: 70% code coverage
- Target: 80%+
- Current: 72% (as of README.md)

**Test Files Location:**
- Co-located with source: `src/**/*.test.tsx` or `src/**/*.test.ts`
- Integration tests: `src/tests/integration/`
- Fixtures: `src/tests/fixtures/`

---

### Run E2E Tests

```bash
# Run Playwright end-to-end tests (headless)
npm run test:e2e

# Run with visible browser (headed mode)
npm run test:e2e:headed

# Run with interactive UI
npm run test:e2e:ui
```

**Before Running E2E Tests:**
1. Ensure development server is running (`npm run dev`)
2. Ensure local Supabase is running (`npm run db:local:start`)
3. Database should have seed data (`npm run db:local:reset`)

**E2E Test Files Location:**
- `tests/e2e/*.spec.ts`
- `tests/fixtures/` (test data fixtures)

---

## Database Management

### Create New Migration

```bash
# Create a new migration file
npx supabase migration new add_custom_field_to_contacts

# This creates: supabase/migrations/YYYYMMDDHHMMSS_add_custom_field_to_contacts.sql
```

**Edit the generated file with your SQL:**
```sql
-- Add column
ALTER TABLE contacts ADD COLUMN company_size TEXT;

-- Create index if needed
CREATE INDEX idx_contacts_company_size ON contacts(company_size);

-- Update RLS policies if needed
-- ...
```

---

### Apply Migrations (Local)

```bash
# Apply all pending migrations to local database
npx supabase db reset

# Or just push new migrations without reset:
# (This preserves existing data)
npx supabase db push --local
```

---

### Link to Cloud Project

```bash
# One-time setup: Link local CLI to Supabase Cloud project
npm run db:link
# or manually: npx supabase link --project-ref aaqnanddcqvfiwhshndl

# This creates .supabase/ folder with project config
```

---

### Cloud Database Operations

⚠️ **CAUTION:** These commands modify the production database!

```bash
# Validate migrations against cloud schema (dry run)
npm run db:cloud:push:dry-run

# View current migration status
npm run db:cloud:status

# Show differences between local and cloud schema
npm run db:cloud:diff

# Push migrations to cloud (PRODUCTION)
npm run db:cloud:push

# ⚠️ DESTRUCTIVE: Never run `npx supabase db reset --linked` (this deletes all cloud data!)
```

**Best Practice:**
1. Always run dry-run first
2. Review migration SQL carefully
3. Backup production data before major schema changes
4. Test migrations on local database first

---

## Code Quality

### Linting & Formatting

```bash
# Check for linting errors
npm run lint:check

# Auto-fix linting errors
npm run lint:apply

# Check formatting
npm run prettier:check

# Auto-fix formatting
npm run prettier:apply

# Run both linting and formatting checks
npm run lint
```

**Pre-commit Hook:**
Husky automatically runs linting before each commit. Commits are blocked if linting fails.

---

### Type Checking

```bash
# Run TypeScript compiler (no output, just errors)
npm run typecheck
# or manually: npx tsc --noEmit
```

**Build Process:**
The build command includes type checking:
```bash
npm run build
# Runs: tsc --noEmit && vite build
```

---

### Color Validation

```bash
# Validate semantic color usage (no inline CSS variables)
npm run validate:colors
```

This script scans the codebase for violations like:
- `text-[color:var(--text-subtle)]` (should be `text-muted-foreground`)
- Direct hex codes in Tailwind classes

---

## Building for Production

### Build Static Assets

```bash
# Create production build
npm run build

# Output: dist/ folder
# - index.html
# - assets/*.js (code-split chunks)
# - assets/*.css (purged Tailwind)
```

**Build Output:**
- Main bundle: ~90KB gzipped
- Lazy-loaded chunks: 20-30KB each
- All assets have content-hash filenames for cache busting

---

### Preview Production Build Locally

```bash
# Build and serve production build locally
npm run preview

# Server starts at: http://localhost:4173
```

**Use this to:**
- Test production build before deployment
- Verify code splitting works correctly
- Check bundle sizes

---

## Deployment

### Production Environment Variables

**Required for Production:**

```bash
# Supabase Cloud Project (get from https://app.supabase.com)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-from-supabase-dashboard>

# Database (for server-side operations only)
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres

# Service Role (NEVER expose in client, server-side only)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

**Security Notes:**
- `VITE_SUPABASE_ANON_KEY` is safe to expose (starts with `eyJ...`)
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER be in client code (bypasses RLS)
- All `VITE_*` variables are bundled into the client JavaScript

---

### Deploy to Vercel

**One-Click Deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/crispy-crm)

**Manual Deploy:**

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel`
4. Configure environment variables in Vercel dashboard
5. Production deploy: `vercel --prod`

**Vercel Configuration:**
- Build command: `npm run build`
- Output directory: `dist`
- Framework: Vite
- Node version: 22 (set in Vercel dashboard)

---

### Deploy to Netlify

**One-Click Deploy:**

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-org/crispy-crm)

**Manual Deploy:**

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Login: `netlify login`
3. Initialize: `netlify init`
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Deploy: `netlify deploy --prod`

---

### Deploy Supabase Edge Functions

**If using Edge Functions:**

```bash
# Deploy all Edge Functions to Supabase Cloud
npx supabase functions deploy

# Deploy specific function
npx supabase functions deploy users
npx supabase functions deploy updatePassword
```

**Edge Functions Locations:**
- `supabase/functions/users/index.ts` - Create sales user
- `supabase/functions/updatePassword/index.ts` - Update user password
- `supabase/functions/check-overdue-tasks/index.ts` - Background task checker

---

### Continuous Deployment (GitHub Actions)

**Included Workflows:**

1. **CI Workflow** (`.github/workflows/ci.yml`)
   - Runs on: Every push and pull request
   - Steps: Lint → Type Check → Unit Tests → Build
   - Requires: 70% test coverage minimum

2. **Security Workflow** (`.github/workflows/security.yml`)
   - Runs on: Weekly schedule (Monday 9 AM UTC) + every push
   - Steps: Secret scanning (Gitleaks) + Dependency audit (npm audit)

3. **Supabase Deploy Workflow** (`.github/workflows/supabase-deploy.yml`)
   - Runs on: Manual trigger only (`workflow_dispatch`)
   - Steps: Validate → Dry Run → Deploy (with approval)

**Setup GitHub Actions:**
1. Go to GitHub repository → Settings → Secrets
2. Add secrets:
   - `SUPABASE_ACCESS_TOKEN` (get from https://app.supabase.com/account/tokens)
   - `SUPABASE_DB_PASSWORD` (from Supabase dashboard)
   - `SUPABASE_PROJECT_ID` (your project ref, e.g., `aaqnanddcqvfiwhshndl`)

---

## Rollback Procedures

### Rollback Frontend Deployment

**Vercel:**
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

**Netlify:**
```bash
# List deployments
netlify deploy:list

# Restore previous deployment
netlify deploy:restore <deploy-id>
```

---

### Rollback Database Migration

⚠️ **CAUTION:** Database rollbacks are manual and risky!

**Option 1: Restore from Backup**
1. Go to Supabase Dashboard → Database → Backups
2. Restore from backup (this replaces entire database)

**Option 2: Write Reverse Migration**
```bash
# Create migration to undo changes
npx supabase migration new revert_add_custom_field_to_contacts

# Edit migration with DROP/ALTER statements:
# ALTER TABLE contacts DROP COLUMN company_size;

# Apply migration
npm run db:cloud:push
```

**Best Practice:** Always test migrations on local database before production.

---

## Troubleshooting

### Problem: Supabase won't start (Docker issues)

**Solution:**
```bash
# Stop all containers
npm run db:local:stop
# or: npx supabase stop

# Clean up Docker resources
npm run db:local:cleanup

# Restart Docker Desktop

# Start Supabase again
npm run db:local:start
```

### Problem: Port already in use (5173, 54321, etc.)

**Solution:**
```bash
# Find process using port 5173
lsof -i :5173

# Kill process
kill -9 <PID>

# Or use different port for Vite:
vite --port 5174
```

### Problem: Database connection refused

**Check Supabase status:**
```bash
npm run db:local:status
# or: npx supabase status
```

**Expected output:**
```
supabase local development setup is running.
         API URL: http://127.0.0.1:54321
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://localhost:54323
```

If not running: `npm run db:local:start`

### Problem: RLS policy denies access (403 errors)

**Debug RLS policies:**
```sql
-- Connect to database
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

-- Test as authenticated user
SET ROLE authenticated;
SELECT * FROM contacts WHERE deleted_at IS NULL;

-- If query fails, check RLS policies:
SELECT * FROM pg_policies WHERE tablename = 'contacts';
```

**Common fixes:**
- Missing GRANT: `GRANT SELECT ON contacts TO authenticated;`
- Incorrect policy: Review `USING` clause logic
- Missing auth user: Ensure JWT token is valid

### Problem: Migrations out of sync

**Solution:**
```bash
# View current migration status
npm run db:cloud:status

# Pull remote migrations to local
npx supabase db pull

# Reset local database to match remote
npm run db:local:reset
```

### Problem: TypeScript errors after npm install

**Solution:**
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Regenerate TypeScript types
npm run gen:types
```

---

## Development Workflow Summary

**Daily Workflow:**
1. Start Supabase: `npm run db:local:start`
2. Start dev server: `npm run dev`
3. Make changes
4. Run tests: `npm test` (in separate terminal)
5. Commit changes (pre-commit hook runs linting automatically)

**Before Committing:**
```bash
npm run lint        # Check linting + formatting
npm run typecheck   # Check TypeScript
npm test            # Run unit tests
```

**Before Pushing:**
```bash
npm run test:e2e    # Run E2E tests
npm run build       # Ensure production build works
```

---

## Additional Resources

- **Full Project Documentation:** `docs/` folder
- **CLAUDE.md:** AI agent guidelines and project constitution
- **README.md:** Quick start and feature overview
- **Supabase Docs:** https://supabase.com/docs
- **React Admin Docs:** https://marmelab.com/react-admin/
- **Vite Docs:** https://vite.dev/

---

## Support & Contributing

**Issues:** Report bugs at https://github.com/your-org/crispy-crm/issues

**Contributing:** See `CONTRIBUTING.md` (if exists)

**License:** MIT (see `LICENSE.md`)
