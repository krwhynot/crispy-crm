# Supabase Commands Reference

Quick reference for all Supabase CLI commands, organized by category.

## Installation & Setup

### Install Supabase CLI

```bash
# NPM (recommended for projects)
npm install --save-dev supabase

# NPM Global
npm install -g supabase

# Yarn
NODE_OPTIONS=--no-experimental-fetch yarn add supabase --dev

# Homebrew (macOS/Linux)
brew install supabase/tap/supabase

# Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Project Initialization

```bash
# Initialize new Supabase project
supabase init

# Initialize with specific directory
supabase init --workdir ./custom-dir

# Bootstrap new project (interactive setup)
supabase bootstrap
```

## Local Development

### Start/Stop Services

```bash
# Start all services
supabase start

# Start excluding specific services
supabase start -x gotrue,storage-api,imgproxy

# Start ignoring health checks
supabase start --ignore-health-check

# Stop services
supabase stop

# Stop without backup
supabase stop --no-backup

# Check status
supabase status
```

### Database Management

```bash
# Reset database (reapply all migrations)
supabase db reset

# Reset to specific migration
supabase db reset --version 20240101000000

# Reset with debug output
supabase db reset --debug

# Start database only
supabase db start
```

## Migrations

### Create Migrations

```bash
# Create new migration file
supabase migration new <migration_name>

# Generate migration from schema diff
supabase db diff -f <migration_name>

# Generate migration with specific schemas
supabase db diff --schema public,auth -f <migration_name>
```

### Apply Migrations

```bash
# Apply pending migrations locally
supabase migration up

# Apply all migrations (reset)
supabase db reset

# Push migrations to remote
supabase db push

# Dry run (preview changes)
supabase db push --dry-run

# Include seed data
supabase db push --include-seed
```

### Migration Management

```bash
# List migrations
supabase migration list

# Repair migration history
supabase migration repair <timestamp> --status applied
supabase migration repair <timestamp> --status reverted

# Squash migrations
supabase migration squash
```

## Remote Project Management

### Authentication & Linking

```bash
# Login to Supabase
supabase login

# Logout
supabase logout

# Link to remote project
supabase link --project-ref <project-ref>

# Link with password
export SUPABASE_DB_PASSWORD='your-password'
supabase link --project-ref <project-ref>

# Unlink project
supabase unlink
```

### Schema Synchronization

```bash
# Pull remote schema
supabase db pull

# Pull specific schemas
supabase db pull --schema auth,storage

# Pull with custom DB URL
supabase db pull --db-url postgresql://user:pass@host:port/db

# Push local to remote
supabase db push

# Force push (dangerous!)
supabase db push --force
```

### Database Operations

```bash
# Dump remote database
supabase db dump

# Dump data only
supabase db dump --data-only

# Dump roles only
supabase db dump --role-only

# Dump to file
supabase db dump > backup.sql

# Dump with custom DB URL
supabase db dump --db-url postgresql://user:pass@host:port/db
```

## Edge Functions

### Function Management

```bash
# Create new function
supabase functions new <function-name>

# Serve functions locally
supabase functions serve

# Serve specific function
supabase functions serve <function-name>

# Serve without JWT verification
supabase functions serve --no-verify-jwt

# Serve with environment file
supabase functions serve --env-file ./supabase/.env.local
```

### Function Deployment

```bash
# Deploy single function
supabase functions deploy <function-name>

# Deploy all functions
supabase functions deploy

# Deploy without JWT verification
supabase functions deploy <function-name> --no-verify-jwt

# Deploy with import map
supabase functions deploy <function-name> --import-map ./import_map.json

# Deploy using API (no Docker required)
supabase functions deploy <function-name> --use-api
```

### Function Debugging

```bash
# Serve with inspector
supabase functions serve --inspect

# With break on start
supabase functions serve --inspect-mode brk

# With wait mode
supabase functions serve --inspect-mode wait

# Inspect main worker
supabase functions serve --inspect --inspect-main

# View function logs
supabase functions logs <function-name>
```

## Secrets & Environment Variables

```bash
# Set single secret
supabase secrets set KEY=value

# Set from environment file
supabase secrets set --env-file .env.production

# List secrets
supabase secrets list

# Delete secret
supabase secrets unset KEY
```

## Database Inspection

### Performance Analysis

```bash
# Show slow queries
supabase inspect db outliers

# Show long-running queries
supabase inspect db long-running-queries

# Show blocking queries
supabase inspect db blocking

# Show database locks
supabase inspect db locks

# Show cache hit rates
supabase inspect db cache-hit
```

### Table Analysis

```bash
# Show table sizes
supabase inspect db table-sizes

# Show total table sizes (with indexes)
supabase inspect db total-table-sizes

# Show table index sizes
supabase inspect db table-index-sizes

# Show estimated row counts
supabase inspect db table-record-counts

# Show sequential scans
supabase inspect db seq-scans

# Show table bloat
supabase inspect db bloat
```

### Index Analysis

```bash
# Show index usage
supabase inspect db index-usage

# Show unused indexes
supabase inspect db unused-indexes

# Show index sizes
supabase inspect db index-sizes

# Show duplicate indexes
supabase inspect db duplicate-indexes
```

### Connection Analysis

```bash
# Show role connections
supabase inspect db role-connections

# Show replication slots
supabase inspect db replication-slots

# Show vacuum statistics
supabase inspect db vacuum-stats
```

## Type Generation

```bash
# Generate TypeScript types from local database
supabase gen types typescript --local > types/database.ts

# Generate from remote database
supabase gen types typescript --project-id <project-id> > types/database.ts

# Generate with specific schemas
supabase gen types typescript --schema public,auth > types/database.ts
```

## Storage Management

```bash
# Seed storage buckets
supabase seed buckets

# Create bucket via API
curl -X POST 'http://localhost:54321/storage/v1/bucket' \
  -H 'Authorization: Bearer YOUR_SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"name": "avatars", "public": true}'
```

## CI/CD Commands

### GitHub Actions

```yaml
# Setup Supabase CLI
- uses: supabase/setup-cli@v1
  with:
    version: latest

# Common workflow commands
- run: supabase link --project-ref ${{ secrets.PROJECT_ID }}
- run: supabase db push
- run: supabase functions deploy
```

### Environment Variables for CI

```bash
# Required for remote operations
export SUPABASE_ACCESS_TOKEN="your-access-token"
export SUPABASE_DB_PASSWORD="your-db-password"
export SUPABASE_PROJECT_ID="your-project-id"

# Optional
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"
```

## Testing Commands

```bash
# Run tests with local Supabase
supabase test

# Generate test database
supabase test db

# Run specific test file
supabase test run tests/example.test.sql
```

## Configuration Commands

```bash
# Validate config
supabase config validate

# Push config to remote
supabase config push

# Generate config from remote
supabase config generate
```

## Branch Management (Preview Environments)

```bash
# Create branch
supabase branches create <branch-name>

# List branches
supabase branches list

# Switch branch
supabase branches switch <branch-name>

# Delete branch
supabase branches delete <branch-name>

# Merge branch
supabase branches merge <branch-name>

# Get branch details
supabase branches get <branch-name>
```

## Logs & Monitoring

```bash
# Get logs from remote project
supabase logs

# Get logs for specific service
supabase logs --service api
supabase logs --service postgres
supabase logs --service auth
supabase logs --service storage

# Follow logs (tail)
supabase logs --follow

# Get function logs
supabase functions logs <function-name>
```

## Advanced Database Commands

```bash
# Execute SQL directly
psql $DATABASE_URL -c "SELECT * FROM users;"

# Run SQL file
psql $DATABASE_URL -f migration.sql

# Interactive psql session
psql $DATABASE_URL

# Cancel backend process
psql $DATABASE_URL -c "SELECT pg_cancel_backend(PID);"

# Terminate backend process
psql $DATABASE_URL -c "SELECT pg_terminate_backend(PID);"

# Vacuum database
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Full vacuum (locks tables)
psql $DATABASE_URL -c "VACUUM FULL;"
```

## Docker Management

```bash
# View Supabase containers
docker ps --filter name=supabase

# View logs
docker logs supabase_db
docker logs supabase_api
docker logs supabase_auth

# Enter container
docker exec -it supabase_db bash

# Clean up Supabase volumes
docker volume rm $(docker volume ls -q --filter name=supabase)

# Complete cleanup
docker stop $(docker ps -q --filter name=supabase)
docker rm $(docker ps -aq --filter name=supabase)
docker volume rm $(docker volume ls -q --filter name=supabase)
```

## Common Command Combinations

### Fresh Local Setup
```bash
supabase stop --no-backup
docker system prune -a --volumes
supabase init
supabase start
```

### Sync with Production
```bash
supabase link --project-ref prod-ref
supabase db pull
supabase db reset
```

### Deploy Everything
```bash
supabase db push
supabase functions deploy
supabase secrets set --env-file .env.production
```

### Debug Migration Issues
```bash
supabase migration list
supabase db diff --linked
supabase migration repair --status reverted
supabase db reset
```

### Complete Backup
```bash
supabase db dump --data-only > data.sql
supabase db dump --role-only > roles.sql
supabase gen types typescript > types.ts
```

## Quick Tips

1. **Always use `npx`** when running as dev dependency
2. **Set `SUPABASE_DB_PASSWORD`** environment variable to avoid prompts
3. **Use `--debug`** flag for verbose output
4. **Check `supabase help <command>`** for detailed options
5. **Use `--project-ref` flag to work with multiple projects
6. **Add `--dry-run`** to preview dangerous operations
7. **Use `--local`** flag to work with local database only
8. **Check exit codes** in CI/CD scripts (`$?` in bash)

## Version Management

```bash
# Check CLI version
supabase --version

# Update CLI
npm update supabase
brew upgrade supabase
scoop update supabase

# Use specific version
npx supabase@1.142.0 <command>
```

## Environment-Specific Commands

### Development
```bash
supabase start
supabase db reset
supabase functions serve
```

### Staging
```bash
supabase link --project-ref staging-ref
supabase db push --dry-run
supabase db push
```

### Production
```bash
supabase link --project-ref prod-ref
supabase db dump > backup.sql
supabase db push --dry-run
# Review changes carefully!
supabase db push
```

Remember: Most commands support `--help` for detailed documentation:
```bash
supabase [command] --help
```