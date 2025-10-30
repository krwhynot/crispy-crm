# Development Setup Guide

Complete guide for local development with Supabase and React.

## Quick Start (5 Minutes)

```bash
# Start local development with fresh database
npm run dev:local

# Access services:
# - App: http://localhost:5173
# - Supabase Studio: http://localhost:54323
# - Database: postgresql://postgres:postgres@localhost:54322/postgres

# Login: admin@test.com / password123
```

---

## Environment Configuration

### Local Development (.env.local) ✅ Pre-configured

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Cloud Development (.env.cloud)

```bash
VITE_SUPABASE_URL=https://aaqnanddcqvfiwhshndl.supabase.co
VITE_SUPABASE_ANON_KEY=[cloud-anon-key]
```

**Switching Environments:**
- Local dev: `npm run dev:local` (automatic)
- Cloud dev: `npm run dev:cloud` (⚠️ affects production!)

---

## Available Commands

### Development Workflows

| Command | Description |
|---------|-------------|
| `npm run dev:local` | Local dev with fresh database + seed data |
| `npm run dev:local:skip-reset` | Local dev WITHOUT database reset (faster) |
| `npm run dev:cloud` | Connect to production cloud database |
| `npm run dev:check` | Verify Supabase is running |

### Local Supabase Management

```bash
npm run db:local:start       # Start local Supabase (Docker)
npm run db:local:stop        # Stop all containers
npm run db:local:reset       # Wipe database and re-apply migrations
npm run db:local:seed-orgs   # Seed organizations only
npm run db:local:status      # Show running services
```

### Cloud Database (Production)

```bash
npm run db:cloud:push        # Deploy migrations to production
npm run db:cloud:status      # Check migration status
npm run db:cloud:diff        # See pending schema changes
```

---

## One-Time Setup (First Time Only)

### 1. Authenticate with Supabase CLI

```bash
npx supabase login
```

This opens your browser for authentication.

### 2. Link to Production Project

```bash
npx supabase link --project-ref aaqnanddcqvfiwhshndl
```

### 3. Start Local Supabase

```bash
# First run downloads Docker images (takes a few minutes)
npm run db:local:start

# Verify everything is running
npx supabase status
```

### 4. Test the Setup

```bash
# This resets the database and seeds test data
npm run dev:local

# Login with: admin@test.com / password123
```

---

## Migration Management

### Creating New Migrations

```bash
# Make schema changes via Studio (http://localhost:54323)
# or write SQL directly in a migration file

# Generate migration from schema changes
npx supabase db diff --schema public -f migration_name

# Test locally
npm run db:local:reset

# Deploy to production
npm run db:cloud:push
```

### Migration Best Practices

- ✅ Always test migrations locally first (`db:local:reset`)
- ✅ Use `db diff` to generate migrations (avoids errors)
- ✅ Keep migrations small and focused
- ✅ Include both GRANT permissions AND RLS policies (see CLAUDE.md)
- ❌ Never run `db reset --linked` on production
- ❌ Don't create migrations with duplicate timestamps

### Two-Layer Security (Critical!)

Every new table requires BOTH:

```sql
-- Step 1: Create table
CREATE TABLE my_table (...);

-- Step 2: Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Step 3: GRANT permissions (Layer 1)
GRANT SELECT, INSERT, UPDATE, DELETE ON my_table TO authenticated;
GRANT USAGE ON SEQUENCE my_table_id_seq TO authenticated;

-- Step 4: Create RLS policies (Layer 2)
CREATE POLICY authenticated_select_my_table ON my_table
  FOR SELECT TO authenticated
  USING (true);  -- Adjust based on access pattern
```

See **CLAUDE.md** for complete security documentation.

---

## Database Access

### Via Supabase Studio (Recommended)

http://localhost:54323

### Via psql CLI

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres
```

### Via MCP Tools

Your MCP tools can connect using `DATABASE_URL` from `.env.local`.

---

## Troubleshooting

### "Port already in use"

```bash
# Stop Supabase
npm run db:local:stop

# Check what's using the ports
sudo lsof -i :54321
sudo lsof -i :54322
```

### "Docker is not running"

```bash
# Start Docker service (Ubuntu/WSL)
sudo service docker start

# Or start Docker Desktop (Windows/Mac)
```

### "Migration errors"

```bash
# Reset and re-apply all migrations
npm run db:local:reset

# Check migration history
npx supabase migration list
```

### "No data showing"

```bash
# Check which environment is active
cat .env | head -3

# Verify Supabase is running
npm run dev:check

# Re-seed data
npm run seed:data
```

### "Permission denied" errors

This usually means missing GRANT permissions. See the Two-Layer Security section above and **CLAUDE.md** for the fix.

---

## Architecture Notes

### Why Supabase CLI (not plain Docker)?

- ✅ Automatic migration application
- ✅ Includes Auth, Storage, Edge Functions
- ✅ Matches production exactly
- ✅ Studio UI for database inspection
- ✅ Built-in backup/restore

### Data Provider Architecture

```
Frontend → unifiedDataProvider.ts → @supabase/supabase-js → Supabase REST API → PostgreSQL
```

Environment variables control which Supabase instance you connect to:
- `.env.local` → localhost:54321 (local)
- `.env.cloud` → aaqnanddcqvfiwhshndl.supabase.co (production)

---

## Development Tips

- **Use `dev:local` by default** - faster and safer
- **Use `dev:cloud` sparingly** - only for production testing
- **Run `db:local:reset` frequently** - ensures clean state
- **Don't commit `.env`** - it's auto-generated
- **Test migrations locally before pushing** - prevents production issues

---

## Next Steps

1. Complete the one-time setup (Steps 1-4 above)
2. Run `npm run dev:local` to start developing
3. Create test data via Studio (http://localhost:54323)
4. Read **CLAUDE.md** for project conventions and security rules

---

## Further Reading

- [Testing Guide](./02-testing.md)
- [Database Migrations](./03-database-migrations.md)
- [Supabase Workflow](./05-supabase-workflow.md)
- [CLAUDE.md](/CLAUDE.md) - Project constitution and rules
