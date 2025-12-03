# Supabase CLI Troubleshooting Guide

Common errors and their solutions.

## Table of Contents

- [Invalid Command Errors](#invalid-command-errors)
- [Docker/Container Issues](#dockercontainer-issues)
- [Port Conflicts](#port-conflicts)
- [Migration Errors](#migration-errors)
- [Edge Function Issues](#edge-function-issues)
- [Type Generation Problems](#type-generation-problems)
- [Authentication Issues](#authentication-issues)

---

## Invalid Command Errors

### "Unknown command" or "Available Commands" list shown

**Symptom:**
```
Error: Exit code 1
Usage:
  supabase db [command]

Available Commands:
  diff, dump, lint, pull, push, reset, start
```

**Cause:** You tried a command that doesn't exist.

**Common Non-Existent Commands:**
| Wrong Command | Correct Alternative |
|--------------|---------------------|
| `supabase db execute` | Use Docker + psql (see below) |
| `supabase run` | Use `supabase functions serve` |
| `supabase sql` | Use Docker + psql |
| `supabase query` | Use Docker + psql |

**Solution - Run SQL via Docker:**
```bash
# Get your project ID from config.toml
grep "^id" supabase/config.toml

# Run SQL (replace crispy-crm with your project ID)
docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c "YOUR SQL HERE"
```

---

## Docker/Container Issues

### "the input device is not a TTY"

**Symptom:**
```
the input device is not a TTY
```

**Cause:** Using `-it` flags in a non-interactive environment (scripts, Claude Code, CI/CD).

**Solution:**
```bash
# WRONG
docker exec -it supabase_db_crispy-crm psql -c "SELECT 1;"

# CORRECT - remove -t (or both -i and -t)
docker exec supabase_db_crispy-crm psql -U postgres -c "SELECT 1;"
```

---

### "No such container" or "Container not found"

**Symptom:**
```
Error: No such container: supabase_db
```

**Cause:** Wrong container name (missing project suffix).

**Solution:**
```bash
# Find correct container name
docker ps --filter "name=supabase_db" --format "{{.Names}}"

# Use the full name (includes project ID)
docker exec supabase_db_crispy-crm psql -U postgres -c "SELECT 1;"
```

**Auto-detect from config.toml:**
```bash
PROJECT_ID=$(grep "^id" supabase/config.toml | cut -d'"' -f2)
docker exec "supabase_db_${PROJECT_ID}" psql -U postgres -c "SELECT 1;"
```

---

### "Cannot connect to Docker daemon"

**Symptom:**
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solutions:**

1. **Start Docker Desktop** (macOS/Windows)
2. **Start Docker service** (Linux):
   ```bash
   sudo systemctl start docker
   ```
3. **Check Docker is running:**
   ```bash
   docker info
   ```

---

### Container keeps restarting

**Symptom:** `supabase status` shows services restarting.

**Solutions:**

1. **Check logs:**
   ```bash
   docker logs supabase_db_crispy-crm --tail 50
   ```

2. **Full reset:**
   ```bash
   supabase stop --no-backup
   docker system prune -f
   supabase start
   ```

3. **Check available memory** (need ~7GB):
   ```bash
   free -h  # Linux
   ```

---

## Port Conflicts

### "Port already in use"

**Symptom:**
```
Error: listen tcp 0.0.0.0:54321: bind: address already in use
```

**Solutions:**

1. **Find what's using the port:**
   ```bash
   lsof -i :54321
   # or
   netstat -tlnp | grep 54321
   ```

2. **Kill the process:**
   ```bash
   kill -9 <PID>
   ```

3. **Stop all Supabase containers:**
   ```bash
   supabase stop
   docker ps -q --filter "name=supabase" | xargs docker stop
   ```

4. **Change ports in config.toml:**
   ```toml
   [api]
   port = 54421  # Changed from 54321

   [db]
   port = 54422  # Changed from 54322

   [studio]
   port = 54423  # Changed from 54323
   ```

---

## Migration Errors

### "Migration failed to apply"

**Symptom:**
```
Error: migration 20231201_xyz.sql failed
```

**Solutions:**

1. **Check the SQL syntax:**
   ```bash
   # Test in local psql
   docker exec supabase_db_crispy-crm psql -U postgres -f supabase/migrations/20231201_xyz.sql
   ```

2. **Check for dependency issues:**
   - Does the migration reference a table that doesn't exist yet?
   - Is there a foreign key to a non-existent column?

3. **Reset and try again:**
   ```bash
   supabase db reset
   ```

---

### "Relation already exists"

**Symptom:**
```
ERROR: relation "users" already exists
```

**Cause:** Migration tried to CREATE something that exists.

**Solutions:**

1. **Use IF NOT EXISTS:**
   ```sql
   CREATE TABLE IF NOT EXISTS users (...);
   CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
   ```

2. **Full reset:**
   ```bash
   supabase db reset
   ```

---

### "Migration history mismatch"

**Symptom:**
```
Error: migration version mismatch
```

**Solution:**
```bash
# Repair migration history
supabase migration repair --status applied --version 20231201000000

# Or reset everything
supabase db reset
```

---

## Edge Function Issues

### "Function not found" on deploy

**Symptom:**
```
Error: function "my-function" not found
```

**Cause:** Function directory doesn't exist or wrong name.

**Check:**
```bash
ls supabase/functions/
# Should show: my-function/index.ts
```

**Solution:**
```bash
# Create function properly
supabase functions new my-function
```

---

### "Deno error" or import issues

**Symptom:**
```
error: Module not found
```

**Solutions:**

1. **Check import map:**
   ```bash
   cat supabase/functions/import_map.json
   ```

2. **Use correct import syntax:**
   ```typescript
   // Use URL imports for Deno
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

   // Or from import map
   import { createClient } from "supabase";
   ```

3. **Restart serve:**
   ```bash
   # Stop and restart
   supabase functions serve
   ```

---

### Function timeout

**Symptom:** Function returns 504 or times out.

**Solutions:**

1. **Check for infinite loops**
2. **Add timeout to fetch calls:**
   ```typescript
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 5000);

   const response = await fetch(url, { signal: controller.signal });
   clearTimeout(timeout);
   ```

3. **Check Edge Function logs:**
   ```bash
   supabase functions logs my-function
   ```

---

## Type Generation Problems

### "No tables found" or empty types

**Symptom:** Generated types file is empty or minimal.

**Cause:** Database not running or no tables exist.

**Solution:**
```bash
# Ensure local stack is running
supabase status

# Reset and apply migrations
supabase db reset

# Then generate types
supabase gen types typescript --local > src/types/supabase.ts
```

---

### Types don't match actual schema

**Cause:** Types were generated before latest migration.

**Solution:**
```bash
# Apply latest migrations
supabase db reset

# Regenerate
supabase gen types typescript --local > src/types/supabase.ts
```

---

## Authentication Issues

### "Invalid API key" or "JWT expired"

**Symptom:**
```
{"message":"Invalid API key"}
```

**Solution:**
```bash
# Get fresh keys
supabase status

# Use the anon key for client-side
# Use service_role key for server-side (admin operations)
```

---

### "supabase link" fails

**Symptom:**
```
Error: failed to link project
```

**Solutions:**

1. **Re-authenticate:**
   ```bash
   supabase logout
   supabase login
   ```

2. **Check project-ref:**
   ```bash
   # Get from dashboard URL
   # https://supabase.com/dashboard/project/abcdef123
   supabase link --project-ref abcdef123
   ```

3. **Check network/firewall**

---

## Quick Diagnostic Commands

```bash
# Check everything at once
supabase status

# View container health
docker ps --filter "name=supabase"

# Check database connectivity
docker exec supabase_db_crispy-crm psql -U postgres -c "SELECT 1;"

# View recent logs
docker logs supabase_db_crispy-crm --tail 20

# Check disk space
df -h

# Check memory
free -h
```

---

**Line Count:** ~320
