# Supabase Troubleshooting Guide

Practical solutions for common Supabase issues, organized by problem category.

## Table of Contents

1. [Docker Issues](#docker-issues)
2. [Migration Errors](#migration-errors)
3. [Schema Syncing Issues](#schema-syncing-issues)
4. [Database Performance Problems](#database-performance-problems)
5. [Authentication & Permission Issues](#authentication--permission-issues)
6. [Connection Problems](#connection-problems)
7. [CLI Errors](#cli-errors)
8. [Edge Functions Issues](#edge-functions-issues)

## Docker Issues

### Port Conflicts

**Problem**: Error "bind: address already in use" when starting Supabase

**Symptoms**:
- `Error: bind: address already in use :54321`
- Cannot start local Supabase stack
- Docker containers fail to start

**Solution**:

```bash
# Check what's using the ports
lsof -i :54321
lsof -i :54322
lsof -i :54323

# Or on Windows
netstat -ano | findstr :54321

# Stop conflicting services
docker stop $(docker ps -q)

# Or change Supabase ports in config.toml
[api]
port = 64321  # Changed from 54321

[db]
port = 64322  # Changed from 54322

[studio]
port = 64323  # Changed from 54323
```

**Prevention**:
- Always run `supabase stop` before closing terminal
- Use unique ports in config.toml for multiple projects
- Check for zombie Docker containers: `docker ps -a`

### Container Startup Failures

**Problem**: Supabase containers won't start or crash immediately

**Symptoms**:
- `supabase start` hangs indefinitely
- Containers restart repeatedly
- "Unhealthy" status in Docker Desktop

**Solution**:

```bash
# Clean Docker environment
supabase stop --no-backup
docker system prune -a --volumes

# Remove Supabase containers and volumes
docker rm -f $(docker ps -a -q --filter name=supabase)
docker volume rm $(docker volume ls -q --filter name=supabase)

# Restart Docker daemon
# On Mac/Windows: Restart Docker Desktop
# On Linux:
sudo systemctl restart docker

# Try starting with health check disabled
supabase start --ignore-health-check

# If still failing, check Docker resources
docker system df
# Ensure at least 4GB RAM allocated in Docker settings
```

### Docker Resource Exhaustion

**Problem**: "No space left on device" or excessive memory usage

**Symptoms**:
- Docker using all available disk space
- System becomes unresponsive
- Build failures

**Solution**:

```bash
# Check Docker disk usage
docker system df

# Clean up everything
docker system prune -a --volumes

# Remove specific Supabase volumes
docker volume ls --filter name=supabase
docker volume rm supabase_db_data
docker volume rm supabase_storage_data

# Limit container resources in docker-compose.yml
services:
  postgres:
    mem_limit: 2g
    cpus: '1.0'
```

## Migration Errors

### Migration History Mismatch

**Problem**: Local and remote migration histories don't match

**Symptoms**:
```
Error: migration history mismatch
LOCAL      │     REMOTE
20240101   │
           │     20240102
```

**Solution**:

```bash
# View current state
supabase migration list

# Option 1: Pull remote and reconcile
supabase db pull
# Review generated migration
# Commit the new migration file

# Option 2: Repair remote history
supabase migration repair 20240102 --status reverted

# Option 3: Force push (DANGEROUS - only for development)
supabase db push --force
```

### Failed Migration Application

**Problem**: Migration fails with SQL error

**Symptoms**:
- `Error: syntax error at or near...`
- `Error: relation already exists`
- `Error: column does not exist`

**Solution**:

```bash
# Test migration locally first
supabase db reset --debug

# Common fixes:
# 1. Check for typos in SQL
# 2. Ensure proper transaction wrapping
BEGIN;
-- Your migration SQL here
COMMIT;

# 3. Handle existing objects
DROP TABLE IF EXISTS my_table CASCADE;
CREATE TABLE my_table (...);

# 4. Use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS my_table (...);
ALTER TABLE my_table
  ADD COLUMN IF NOT EXISTS new_column TEXT;

# 5. Check dependencies
-- Ensure referenced tables exist
-- Check foreign key constraints
```

### Migration Order Problems

**Problem**: Migrations running out of order

**Symptoms**:
- Dependencies not found
- Foreign key violations
- Tables referenced before creation

**Solution**:

```bash
# Never rename migration files!
# If you must reorder:

# 1. Backup everything
supabase db dump > backup.sql

# 2. Reset to specific migration
supabase db reset --version 20240101000000

# 3. Create new migration with fixes
supabase migration new fix_dependencies

# 4. Combine problematic migrations
cat migrations/20240102*.sql migrations/20240103*.sql > migrations/new_timestamp.sql

# 5. Test thoroughly
supabase db reset
```

## Schema Syncing Issues

### Pull/Push Conflicts

**Problem**: Schema differences between local and remote

**Symptoms**:
- `supabase db push` shows unexpected changes
- Pull creates duplicate migrations
- Schema drift between environments

**Solution**:

```bash
# Diagnose differences
supabase db diff --linked

# Safe sync process:
# 1. Backup remote
supabase db dump > remote_backup.sql

# 2. Pull remote schema
supabase db pull

# 3. Review generated migration
cat supabase/migrations/*_remote_schema.sql

# 4. Test locally
supabase db reset

# 5. If conflicts exist:
# - Manually edit migration files
# - Ensure idempotent operations
# - Test again

# 6. Push with dry run
supabase db push --dry-run

# 7. Apply if safe
supabase db push
```

### Missing Schemas or Extensions

**Problem**: Required schemas or extensions not available

**Symptoms**:
- `Error: schema "auth" does not exist`
- `Error: extension "uuid-ossp" not found`
- Missing system tables

**Solution**:

```bash
# Include system schemas in pull
supabase db pull --schema auth,storage,extensions

# Enable extensions in migration
-- migrations/enable_extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

# For auth schema issues
supabase db pull --schema auth
# This creates auth schema migration

# Ensure config includes schemas
# config.toml
[api]
schemas = ["public", "storage", "auth", "extensions"]
```

## Database Performance Problems

### Slow Queries

**Problem**: Database queries running slowly

**Symptoms**:
- API timeouts
- Slow page loads
- High database CPU usage

**Solution**:

```bash
# Identify slow queries
supabase inspect db outliers

# Check for missing indexes
supabase inspect db index-usage

# Analyze specific table
supabase inspect db seq-scans

# Add indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

# Check cache hit rate
supabase inspect db cache-hit
# Should be > 99% for good performance

# If cache hit rate is low:
# 1. Add more RAM (upgrade plan)
# 2. Optimize queries
# 3. Add appropriate indexes
```

### Database Bloat

**Problem**: Tables consuming excessive space

**Symptoms**:
- Disk space warnings
- Slow sequential scans
- Poor query performance

**Solution**:

```bash
# Check table bloat
supabase inspect db bloat

# Check vacuum stats
supabase inspect db vacuum-stats

# Manual vacuum
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Aggressive vacuum for heavily bloated tables
psql $DATABASE_URL -c "VACUUM FULL table_name;"

# Configure autovacuum
ALTER TABLE my_table SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);
```

### Connection Pool Exhaustion

**Problem**: "Too many connections" errors

**Symptoms**:
- `FATAL: remaining connection slots are reserved`
- `Error: timeout acquiring database connection`
- Intermittent connection failures

**Solution**:

```bash
# Check active connections
supabase inspect db role-connections

# Kill long-running queries
supabase inspect db long-running-queries

# Terminate specific connection
psql $DATABASE_URL -c "SELECT pg_terminate_backend(PID);"

# Configure pool settings
# config.toml for local
[db]
pool_size = 25
max_connections = 100

# For production, use connection pooling:
# - Use pooler endpoint for serverless
# - Implement connection retry logic
# - Close connections properly
```

## Authentication & Permission Issues

### RLS Policy Failures

**Problem**: Row Level Security blocking legitimate access

**Symptoms**:
- Empty results when data exists
- "Permission denied" errors
- Inconsistent data visibility

**Solution**:

```sql
-- Debug RLS policies
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user-uuid"}';
SELECT * FROM my_table;  -- Test as user

-- Common RLS fixes:

-- 1. Allow users to see their own data
CREATE POLICY "Users can view own records"
ON my_table FOR SELECT
USING (auth.uid() = user_id);

-- 2. Public read access
CREATE POLICY "Public read access"
ON my_table FOR SELECT
USING (true);

-- 3. Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 4. Temporarily disable for debugging (CAREFUL!)
ALTER TABLE my_table DISABLE ROW LEVEL SECURITY;
-- Debug your queries
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- 5. Use security definer functions for complex logic
CREATE FUNCTION get_user_data(user_uuid UUID)
RETURNS SETOF my_table
SECURITY DEFINER
AS $$
  SELECT * FROM my_table WHERE user_id = user_uuid;
$$ LANGUAGE sql;
```

### JWT Token Issues

**Problem**: Authentication tokens not working

**Symptoms**:
- 401 Unauthorized errors
- "Invalid token" messages
- Token expiration issues

**Solution**:

```bash
# Verify JWT secret matches
# Local: Check .env and config.toml
# Cloud: Check dashboard settings

# Test with curl
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "apikey: YOUR_ANON_KEY" \
     https://project.supabase.co/rest/v1/table

# Common fixes:

# 1. Regenerate keys (local)
supabase stop
supabase start

# 2. Check token expiration
# Decode JWT at jwt.io to check 'exp' claim

# 3. Ensure proper token flow
// Client-side
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token

# 4. For Edge Functions, disable JWT check in dev
supabase functions serve --no-verify-jwt
```

## Connection Problems

### Cannot Connect to Local Database

**Problem**: Unable to connect to local Supabase database

**Symptoms**:
- `Connection refused` errors
- `ECONNREFUSED 127.0.0.1:54322`
- psql connection failures

**Solution**:

```bash
# Verify Supabase is running
supabase status

# Check Docker containers
docker ps | grep supabase

# Test direct connection
psql postgresql://postgres:postgres@localhost:54322/postgres

# Common fixes:

# 1. Restart services
supabase stop
supabase start

# 2. Check firewall/antivirus
# Temporarily disable to test

# 3. Use Docker internal network
# Instead of localhost, use:
postgresql://postgres:postgres@db:5432/postgres

# 4. Check credentials in config
cat supabase/.temp/partial/config.json
```

### SSL Connection Errors

**Problem**: SSL/TLS connection issues with remote database

**Symptoms**:
- `SSL connection required`
- Certificate verification failures
- `no pg_hba.conf entry` errors

**Solution**:

```bash
# For cloud connections, always use SSL
psql "postgresql://user:pass@host/db?sslmode=require"

# Node.js connection
const { Pool } = require('pg')
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // For development only
  }
})

# For production, use proper certificates
ssl: {
  ca: fs.readFileSync('server-ca.pem'),
  key: fs.readFileSync('client-key.pem'),
  cert: fs.readFileSync('client-cert.pem')
}
```

## CLI Errors

### "Project not linked" Error

**Problem**: CLI commands fail with "project not linked"

**Symptoms**:
- Cannot run `supabase db push`
- Status shows no linked project
- Remote commands fail

**Solution**:

```bash
# Link to project
supabase link --project-ref your-project-ref

# If link fails:

# 1. Re-authenticate
supabase logout
supabase login

# 2. Check access token
echo $SUPABASE_ACCESS_TOKEN

# 3. Set token manually
export SUPABASE_ACCESS_TOKEN="your-token"

# 4. Verify project exists
# Check dashboard for correct project-ref

# 5. Clear cached credentials
rm -rf ~/.supabase/credentials
supabase login
```

### CLI Version Conflicts

**Problem**: Features not available or commands fail

**Symptoms**:
- `Unknown command` errors
- Missing flags or options
- Unexpected behavior

**Solution**:

```bash
# Check version
supabase --version

# Update to latest
npm update supabase

# Or reinstall
npm uninstall supabase
npm install supabase@latest

# For global install
npm update -g supabase

# If using multiple versions
npx supabase@latest [command]

# Clear npm cache if issues persist
npm cache clean --force
```

## Edge Functions Issues

### Function Not Deploying

**Problem**: Edge Functions fail to deploy

**Symptoms**:
- Deploy hangs or times out
- "Function not found" errors
- Build failures

**Solution**:

```bash
# Check function structure
ls supabase/functions/my-function/
# Should have index.ts

# Verify Deno syntax
deno check supabase/functions/my-function/index.ts

# Deploy with verbose output
supabase functions deploy my-function --debug

# Common fixes:

# 1. Check import map
// supabase/functions/import_map.json
{
  "imports": {
    "@supabase/functions-js": "https://esm.sh/@supabase/functions-js@2.1.0"
  }
}

# 2. Use correct response format
return new Response(
  JSON.stringify({ message: "Hello" }),
  {
    headers: { "Content-Type": "application/json" },
    status: 200
  }
)

# 3. For CORS issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey'
}
```

### Function Runtime Errors

**Problem**: Functions fail at runtime

**Symptoms**:
- 500 Internal Server Error
- Function timeouts
- Memory limit exceeded

**Solution**:

```bash
# Check function logs
supabase functions logs my-function

# Local debugging
supabase functions serve my-function --debug

# Common fixes:

# 1. Increase timeout (max 150s)
// In function code
export const config = {
  runtime: 'edge',
  timeout: 150
}

# 2. Handle errors properly
try {
  // Your code
} catch (error) {
  console.error('Error:', error)
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 500 }
  )
}

# 3. Check memory usage
# Edge Functions have 150MB memory limit
# Optimize large operations

# 4. Verify environment variables
supabase secrets list
supabase secrets set MY_VAR=value
```

## Quick Diagnostics Checklist

When encountering any issue, run through this checklist:

1. **Check Status**
   ```bash
   supabase status
   docker ps
   ```

2. **Review Logs**
   ```bash
   docker logs supabase_db
   docker logs supabase_api
   ```

3. **Verify Configuration**
   ```bash
   cat supabase/config.toml
   cat .env
   ```

4. **Test Connectivity**
   ```bash
   curl http://localhost:54321/rest/v1/
   psql $DATABASE_URL -c "SELECT 1"
   ```

5. **Clear and Restart**
   ```bash
   supabase stop --no-backup
   docker system prune
   supabase start
   ```

Remember: Most issues can be resolved by ensuring Docker has enough resources, keeping the CLI updated, and maintaining consistent migration practices.