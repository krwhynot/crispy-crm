# Supabase CLI Workflows & Common Mistakes

Step-by-step guides and pitfall prevention.

## Table of Contents

- [Common Mistakes to AVOID](#common-mistakes-to-avoid)
- [Executing Raw SQL](#executing-raw-sql)
- [Local Development Workflow](#local-development-workflow)
- [Deployment Workflow](#deployment-workflow)
- [Migration Workflow](#migration-workflow)
- [Type Generation Workflow](#type-generation-workflow)
- [Docker Troubleshooting](#docker-troubleshooting)

---

## Common Mistakes to AVOID

### WRONG: `supabase db execute` (doesn't exist!)

```bash
# WRONG - This command doesn't exist!
supabase db execute --local "SELECT * FROM users;"
```

**The `supabase db` subcommands are:**
- `diff`, `dump`, `lint`, `pull`, `push`, `reset`, `start`

**NO `execute` command!** See [Executing Raw SQL](#executing-raw-sql) below.

---

### WRONG: Docker `-it` flags in non-TTY

```bash
# WRONG - Will fail with "the input device is not a TTY"
docker exec -it supabase_db_crispy-crm psql -U postgres -c "SELECT 1;"
```

```bash
# CORRECT - Remove -t flag for non-interactive
docker exec -i supabase_db_crispy-crm psql -U postgres -c "SELECT 1;"

# Or remove both flags entirely
docker exec supabase_db_crispy-crm psql -U postgres -c "SELECT 1;"
```

**Rule:** Use `-it` only in actual terminal. In scripts/Claude, use `-i` or no flags.

---

### WRONG: Wrong container name

```bash
# WRONG - Generic name
docker exec supabase_db psql ...

# CORRECT - Include project suffix
docker exec supabase_db_crispy-crm psql ...
```

**Find your container:** `docker ps --filter "name=supabase_db"`

---

### WRONG: Using `supabase` when Docker is needed

For direct SQL queries, use Docker + psql, NOT supabase CLI:

```bash
# WRONG
supabase db execute "SELECT * FROM users"

# CORRECT
docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c "SELECT * FROM users;"
```

---

## Executing Raw SQL

### Option 1: Docker + psql (Recommended for queries)

```bash
# Single query
docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c \
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';"

# Multiple queries from file
docker exec -i supabase_db_crispy-crm psql -U postgres -d postgres < my_script.sql

# Interactive psql session (only in real terminal)
docker exec -it supabase_db_crispy-crm psql -U postgres -d postgres
```

### Option 2: Supabase Studio SQL Editor

1. Go to `http://localhost:54323`
2. Navigate to SQL Editor
3. Write and execute queries

### Option 3: Direct psql (if installed locally)

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT 1;"
```

---

## Local Development Workflow

### Starting Fresh

```bash
# 1. Initialize (first time only)
supabase init

# 2. Start local stack
supabase start

# 3. Check status
supabase status
```

### Making Schema Changes

```bash
# Option A: Use Studio, then diff
# 1. Make changes in http://localhost:54323
# 2. Capture as migration
supabase db diff -f descriptive_name

# Option B: Write migration directly
supabase migration new descriptive_name
# Edit: supabase/migrations/<timestamp>_descriptive_name.sql
supabase db reset  # Apply and test
```

### Checking Database State

```bash
# List tables
docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c "\dt public.*"

# Describe table
docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c "\d+ users"

# Check columns
docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c \
  "SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'users';"
```

### Stopping Work

```bash
# Stop with backup (default)
supabase stop

# Stop without backup (clean slate next time)
supabase stop --no-backup
```

---

## Deployment Workflow

### First-Time Setup

```bash
# 1. Login to Supabase
supabase login

# 2. Link to remote project
supabase link --project-ref <project-id>

# 3. Pull existing remote schema (if any)
supabase db pull
```

### Deploying Changes

```bash
# 1. Verify migrations are ready
supabase migration list

# 2. Preview what will be pushed
supabase db push --dry-run

# 3. Push migrations
supabase db push

# 4. Deploy Edge Functions (if any)
supabase functions deploy
```

### Syncing Remote to Local

```bash
# Pull remote changes
supabase db pull

# Apply to local
supabase db reset
```

---

## Migration Workflow

### Creating a Migration

```bash
# Method 1: From Studio changes
supabase db diff -f add_users_table

# Method 2: Empty file to write SQL
supabase migration new add_users_table
```

### Testing a Migration

```bash
# Reset applies all migrations + seed
supabase db reset

# Check for errors in output
# If errors, fix migration and reset again
```

### Fixing a Bad Migration

**If not yet pushed to remote:**
```bash
# Edit the migration file directly
# Then reset to test
supabase db reset
```

**If already pushed to remote:**
```bash
# Create a new migration to fix
supabase migration new fix_previous_issue
# Add corrective SQL
supabase db push
```

### Squashing Migrations

```bash
# Combine multiple migrations into one
supabase migration squash --version 20230101000000

# Test the squashed migration
supabase db reset
```

---

## Type Generation Workflow

### After Schema Changes

```bash
# 1. Ensure local DB is current
supabase db reset

# 2. Generate types
supabase gen types typescript --local > src/types/supabase.ts

# 3. Verify no TypeScript errors
npx tsc --noEmit
```

### Automated Type Generation

Add to package.json:
```json
{
  "scripts": {
    "db:types": "supabase gen types typescript --local > src/types/supabase.ts"
  }
}
```

Then: `npm run db:types`

---

## Docker Troubleshooting

### Finding Container Names

```bash
# List Supabase containers
docker ps --filter "name=supabase"

# Get exact database container name
docker ps --filter "name=supabase_db" --format "{{.Names}}"
```

### Common Container Names

| Container | Name Pattern |
|-----------|--------------|
| Database | `supabase_db_<project>` |
| Studio | `supabase_studio_<project>` |
| API | `supabase_kong_<project>` |
| Auth | `supabase_auth_<project>` |

### Viewing Logs

```bash
# Database logs
docker logs supabase_db_crispy-crm

# Follow logs (live)
docker logs -f supabase_db_crispy-crm

# Last 50 lines
docker logs --tail 50 supabase_db_crispy-crm
```

### Restarting Services

```bash
# Full restart
supabase stop && supabase start

# Restart just database (not recommended)
docker restart supabase_db_crispy-crm
```

### Force Clean Start

```bash
supabase stop --no-backup
docker volume prune -f  # WARNING: Removes ALL unused volumes
supabase start
```

---

## Quick Reference: SQL Execution

| Method | Command | When to Use |
|--------|---------|-------------|
| **Docker psql** | `docker exec supabase_db_crispy-crm psql -U postgres -c "..."` | Quick queries |
| **Studio** | `http://localhost:54323` → SQL Editor | Complex queries, exploration |
| **Local psql** | `psql "postgresql://postgres:postgres@localhost:54322/postgres"` | If psql installed |
| **Migration** | `supabase migration new` | Schema changes |

**NEVER use:** `supabase db execute` (it doesn't exist!)

---

**Line Count:** ~280
