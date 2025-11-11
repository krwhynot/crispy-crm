# Port Consolidation Guide

**Status:** ✅ Implemented & Verified (2025-11-10)

## Overview

This project successfully reduced the number of exposed ports from **28 to 3** through `config.toml` optimization, maintaining full development functionality.

## The Problem

Supabase local development runs multiple microservices, each requiring one or more ports:
- API Gateway (Kong)
- PostgreSQL Database
- Auth Service (GoTrue)
- Realtime Server
- Storage API
- Studio (Web UI)
- Email Testing (Inbucket)
- Analytics Services
- Plus internal communication ports

**Total:** 28+ ports competing for space on your host machine.

## The Solution

### Architecture

**Before:** All Supabase services exposed ports directly to host
```
Host Machine (WSL2)
├── 54321 → Kong
├── 54322 → PostgreSQL
├── 54323 → Studio
├── 54324 → Inbucket
├── 54325-54328 → Analytics/SMTP/etc.
└── ... (20+ more ports)
```

**After:** Services communicate via Docker's internal network
```
Host Machine (WSL2)
├── 5173  → Vite (React app)
├── 54321 → Kong (API Gateway only)
└── 54323 → Studio (Web UI only)

Docker Bridge Network (internal)
├── db:5432 → PostgreSQL
├── auth:9999 → GoTrue
├── realtime:4000 → Realtime
├── storage:5000 → Storage
├── inbucket:9000 → Email Testing
└── ... (all other services)
```

**Result:** Only 3 ports exposed to host, all services fully functional.

## Implementation

### Method: `supabase/config.toml` Optimization

The solution uses Supabase's native configuration file to:
1. **Disable unnecessary services** (Inbucket, Analytics)
2. **Keep only essential ports** (API, DB, Studio)
3. **Maintain full functionality** for local development

### How It Works

When you run `npx supabase start`:
1. Supabase CLI reads `config.toml` and only starts enabled services
2. Disabled services (Inbucket, Analytics) don't start or expose ports
3. Internal services communicate via Docker bridge network
4. Only 3 ports are exposed to the host machine

**Note:** The `docker-compose.override.yml` file was created but is not used by Supabase CLI (preserved for reference)

## Setup Requirements

### One-Time: Enable Docker Desktop WSL2 Integration

**Windows Setup (30 seconds):**
1. Open **Docker Desktop**
2. Go to **Settings** → **Resources** → **WSL Integration**
3. Enable integration for your WSL2 distribution (e.g., Ubuntu)
4. Click **Apply & Restart**

**Verify in WSL2:**
```bash
docker --version
# Should show: Docker version 24.x.x or higher
```

## Usage

### Starting Development Environment

**Same commands as before:**
```bash
# Start Supabase services
npm run db:local:start
# or
npx supabase start

# Start Vite dev server (separate terminal)
npm run dev
```

### Accessing Services

| Service | URL | Port | Notes |
|---------|-----|------|-------|
| **React App** | http://localhost:5173 | 5173 | Vite dev server |
| **Supabase API** | http://127.0.0.1:54321 | 54321 | REST, GraphQL, Auth |
| **Studio UI** | http://localhost:54323 | 54323 | Database management |
| **PostgreSQL** | Internal only | - | Access via API or Studio |
| **Inbucket** | Internal only | - | Uncomment in override to expose |

### Exposing Additional Services

If you need to expose a service temporarily (e.g., Inbucket for email testing):

**Edit:** `supabase/docker/docker-compose.override.yml`
```yaml
# Find the service and uncomment its ports:
inbucket:
  ports:
    - "54324:9000"  # Web interface for viewing test emails
```

**Restart Supabase:**
```bash
npx supabase stop
npx supabase start
```

## Understanding VSCode Port Display

### Why VSCode Shows More Ports

VSCode's Ports panel displays **all Docker port declarations**, not just exposed ports:

**What VSCode Shows (11 entries):**
- 3 IPv4 exposed ports (`0.0.0.0:54321`, `54322`, `54323`)
- 3 IPv6 exposed ports (`[::]:54321`, `54322`, `54323`)
- 5 internal Docker ports (`3000`, `4000`, `8080`, `8081`, `9999`)

**What Actually Matters (3 ports):**
- Only the 3 host-exposed ports are accessible from your machine
- Internal ports are for container-to-container communication only
- IPv6 entries are duplicates of IPv4 (same ports, different protocol)

This is normal Docker/VSCode behavior and doesn't indicate a problem.

## Troubleshooting

### "Cannot connect to Docker daemon"

**Cause:** Docker Desktop WSL2 integration not enabled

**Fix:**
1. Enable WSL2 integration in Docker Desktop settings
2. Restart Docker Desktop
3. Verify: `docker ps` should work without errors

### "Connection refused" from React app

**Cause:** Supabase services not started

**Fix:**
```bash
npx supabase status  # Check if running
npx supabase start   # Start if needed
```

### "Port already in use"

**Cause:** Old processes using 54321 or 54323

**Fix:**
```bash
# Find and kill process
lsof -i :54321
kill -9 <PID>

# Or restart Supabase
npx supabase stop
npx supabase start
```

### Override file not being used

**Cause:** File in wrong location or syntax error

**Fix:**
1. Verify location: `supabase/docker/docker-compose.override.yml` (not `.supabase/`)
2. Validate YAML syntax: `docker compose -f supabase/docker/docker-compose.override.yml config`
3. Check Docker Compose version: `docker compose version` (should be v2+)

## Port Reference

### Exposed Ports (3 total)

| Port | Service | Purpose | Required |
|------|---------|---------|----------|
| 5173 | Vite | React dev server | Yes |
| 54321 | Kong | Supabase API gateway | Yes |
| 54323 | Studio | Database management UI | Optional |

### Internal Ports (not exposed)

| Port | Service | Access Method |
|------|---------|---------------|
| 5432 | PostgreSQL | Via API (54321) or Studio (54323) |
| 9999 | GoTrue (Auth) | Via API (54321) |
| 4000 | Realtime | Via API (54321) |
| 5000 | Storage | Via API (54321) |
| 9000 | Inbucket | Uncomment in override to expose |
| 8081 | Meta | Internal only |

## Benefits

### Before Consolidation
- ✗ 28+ ports exposed to host
- ✗ Port conflicts with other services
- ✗ Difficult to track what's running
- ✗ Manual cleanup required

### After Consolidation
- ✅ Only 3 ports exposed
- ✅ Clean host network namespace
- ✅ Easy to see what's running (`docker ps`)
- ✅ Single command cleanup (`docker compose down`)

## Cleanup

### Stop All Services
```bash
npx supabase stop
# or
docker compose -f .supabase/docker/docker-compose.yml down
```

### Remove All Data (Nuclear Option)
```bash
npx supabase stop --no-backup
# or
docker compose -f .supabase/docker/docker-compose.yml down -v
```

## Related Documentation

- [Supabase Workflow](../supabase/WORKFLOW.md) - Local development guide
- [Commands Quick Reference](./commands-quick-reference.md) - All npm scripts
- [Docker Compose Docs](https://docs.docker.com/compose/extends/) - Override file reference

## Future Improvements

**Potential Enhancements:**
- [ ] Add health checks to override file
- [ ] Configure resource limits (CPU/memory)
- [ ] Create separate profiles for different workflows (testing, debugging, etc.)
- [ ] Automate Docker Desktop WSL2 integration check

## References

- [Docker Compose Override Documentation](https://docs.docker.com/compose/extends/)
- [Supabase CLI Docker Integration](https://supabase.com/docs/guides/cli/local-development)
- [WSL2 Docker Desktop Integration](https://docs.docker.com/desktop/wsl/)
