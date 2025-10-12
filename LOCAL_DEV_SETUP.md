# Local Development Setup with Docker Postgres

This guide walks you through setting up local Supabase (Docker-based PostgreSQL) for development while keeping your production Supabase instance intact.

## Quick Start

```bash
# 1. Start local Supabase (first time will download Docker images)
npm run supabase:local:start

# 2. Start development server with local database
npm run dev:local

# 3. Access services:
# - App: http://localhost:5173
# - Supabase Studio: http://localhost:54323
# - Database: postgresql://postgres:postgres@localhost:54322/postgres
```

## Environment Configuration

### Local Development (.env.local) ✅ ALREADY CREATED
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGci... (local dev key)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

### Production (.env.development)
```bash
VITE_SUPABASE_URL=https://aaqnanddcqvfiwhshndl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci... (production key)
```

**Switching Environments:**
- Local dev: Use `.env.local` (Vite loads this automatically)
- Production: Use `.env.development` (rename `.env.local` temporarily)

---

## Migration Squashing Strategy (RECOMMENDED)

**Problem:** You have 30+ incremental migrations that slow down local setup and can cause conflicts.

**Solution:** Squash all migrations into a single "initial schema" file.

### Step 1: Authenticate with Supabase CLI

```bash
npx supabase login
```

This opens your browser for authentication. Once logged in, return to the terminal.

### Step 2: Link to Production Project

```bash
npx supabase link --project-ref aaqnanddcqvfiwhshndl
```

### Step 3: Generate Initial Schema from Production

```bash
# Pull latest schema changes from production
npx supabase db pull

# Generate a single schema file (using today's date)
npx supabase db dump -f supabase/migrations/20251012000000_initial_schema.sql --schema-only
```

### Step 4: Archive Old Migrations

```bash
# Create archive directory
mkdir -p supabase/migrations/_archived/pre-squash

# Move ALL existing migrations to archive
mv supabase/migrations/202*.sql supabase/migrations/_archived/pre-squash/

# Verify only the new initial schema remains
ls -la supabase/migrations/
# Should only show: 20251012000000_initial_schema.sql
```

### Step 5: Test Local Setup

```bash
# Reset local database with the new squashed migration
npx supabase db reset

# Should complete in seconds with no errors
# Check Studio: http://localhost:54323
```

### Step 6: Align Production Migration History ⚠️ CRITICAL

**BEFORE RUNNING THIS:** Take a full backup of your production database via Supabase Dashboard!

Navigate to the SQL Editor in your Supabase Dashboard (production project) and run:

```sql
-- Manually insert the squashed migration version
-- This tells Supabase: "This migration is already applied"
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('20251012000000');
```

**Why this matters:**
- Production already has the schema
- Without this insert, Supabase CLI would try to re-apply it (causing errors)
- This aligns both environments to the same baseline
- Future migrations will apply cleanly to both local and production

### Step 7: Commit Changes

```bash
git add .
git commit -m "feat: squash migrations into initial schema for faster local dev"
git push
```

---

## Available Commands

### Local Supabase Control
```bash
npm run supabase:local:start      # Start local Supabase (idempotent)
npm run supabase:local:stop       # Stop all containers
npm run supabase:local:restart    # Stop and start fresh
npm run supabase:local:status     # Show running services and URLs
npm run supabase:local:db:reset   # Wipe database and re-apply migrations
npm run supabase:local:studio     # Show Studio URL
```

### Development
```bash
npm run dev                # Development with remote Supabase (production)
npm run dev:local          # Development with local Supabase (db reset + vite)
```

### Deployment
```bash
npm run supabase:deploy    # Deploy migrations and functions to production
npm run prod:start         # Build + deploy + serve locally
npm run prod:deploy        # Build + deploy + publish to GitHub Pages
```

---

## Troubleshooting

### "ERROR: relation already exists"
This happens when migrations try to create objects that already exist.
- **Solution:** Follow the migration squashing steps above

### "Port already in use"
Another service is using ports 54321-54328.
```bash
# Check what's using the ports
sudo lsof -i :54321
sudo lsof -i :54322

# Stop Supabase
npm run supabase:local:stop
```

### "Docker is not running"
Supabase CLI requires Docker.
```bash
# Start Docker service (Ubuntu/WSL)
sudo service docker start

# Or install Docker Desktop (Windows/Mac)
```

### "migrations out of sync"
If you add new migrations after squashing, they should apply cleanly.
If not:
```bash
# Reset local database
npm run supabase:local:db:reset

# Check migration history
npx supabase migration list
```

---

## Database Access

### Via Supabase Studio (Recommended)
http://localhost:54323

### Via psql CLI
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres
```

### Via Code (MCP Tools)
Your MCP tools can connect using `DATABASE_URL` from `.env.local`:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

---

## Migration Workflow After Squashing

### Creating New Migrations
```bash
# 1. Make schema changes via Studio or manually
# 2. Generate migration
npx supabase db diff --schema public -f migration_name

# 3. Test locally
npm run supabase:local:db:reset

# 4. Deploy to production
npm run supabase:deploy
```

### Best Practices
- ✅ Test all migrations locally first
- ✅ Use `db diff` to generate migrations (avoids manual errors)
- ✅ Run `db reset` frequently to ensure clean state
- ✅ Keep migrations small and focused
- ❌ Never edit squashed initial schema
- ❌ Don't create migrations with duplicate timestamps

---

## Architecture Notes

### Why Supabase CLI (not plain Docker)?
- ✅ Automatic migration application
- ✅ Includes Auth, Storage, Edge Functions
- ✅ Matches production exactly
- ✅ Studio UI for database inspection
- ✅ Built-in backup/restore

### Why Migration Squashing?
- ✅ Faster local setup (1 migration vs 30+)
- ✅ Eliminates historical conflicts
- ✅ Cleaner git history
- ✅ Industry-standard practice
- ✅ Supabase CLI's `db diff` works correctly

### Data Provider Architecture
Your app uses the Supabase JS client exclusively:
```
Frontend → unifiedDataProvider.ts → @supabase/supabase-js → Supabase REST API → PostgreSQL
```

Environment variables control which Supabase instance you connect to:
- `.env.local` → localhost:54321 (local)
- `.env.development` → aaqnanddcqvfiwhshndl.supabase.co (production)

---

## Next Steps

1. **Complete migration squashing** (Steps 1-7 above)
2. **Test local development:**
   ```bash
   npm run dev:local
   # Create a test contact, opportunity, etc.
   ```
3. **Verify production unaffected:**
   ```bash
   # Temporarily rename .env.local
   mv .env.local .env.local.backup
   npm run dev
   # Check that production data appears
   mv .env.local.backup .env.local
   ```
4. **Share setup with team:**
   - Commit `.env.example` with local setup instructions
   - Document migration squashing in team wiki
   - Update CI/CD to use local Supabase for tests

---

## Questions?

- Supabase CLI docs: https://supabase.com/docs/guides/cli
- Local development: https://supabase.com/docs/guides/cli/local-development
- Database migrations: https://supabase.com/docs/guides/cli/migrations
