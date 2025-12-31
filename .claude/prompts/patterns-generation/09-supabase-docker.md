---
name: generate-patterns-supabase-docker
directory: supabase/docker/
complexity: MEDIUM
output: supabase/docker/PATTERNS.md
---

# Generate PATTERNS.md for Supabase Docker Configuration

## Context

The `supabase/docker/` directory contains local development configuration for the Supabase stack. This includes Docker Compose overrides for port consolidation (reducing 28+ exposed ports to 3) and PostgreSQL tuning optimized for a 2GB container. These configurations enable efficient local development while keeping resource usage reasonable on developer machines.

**Key concerns:**
- Port management (exposing only essential services)
- PostgreSQL memory tuning for constrained environments
- Docker network isolation for internal services
- Development-friendly logging and query analysis

## Phase 1: Exploration

Read these files to understand the configuration patterns:

### 1. Docker Compose Override
**File:** `supabase/docker/docker-compose.override.yml`
**Purpose:** Reduces exposed ports from 28+ to 3 by overriding the base Supabase configuration. Only Kong (API gateway) and Studio (web UI) are exposed to the host.

### 2. PostgreSQL Development Configuration
**File:** `supabase/docker/postgres-dev.conf`
**Purpose:** Tunes PostgreSQL for a 2GB container with memory settings (shared_buffers, work_mem), connection limits, WAL settings, and development-friendly logging.

## Phase 2: Pattern Identification

Identify and document these patterns:

### Pattern A: Port Consolidation
Reducing exposed ports for cleaner local development. Only essential services (Kong API gateway, Studio UI) are exposed to the host. All other services communicate via Docker's internal bridge network.

### Pattern B: PostgreSQL Memory Tuning
Memory allocation strategy for constrained containers: shared_buffers at 25% of container memory, effective_cache_size for query planner hints, work_mem calculated to prevent OOM with multiple connections.

### Pattern C: Development Logging
Comprehensive logging configuration for debugging: slow query logging (>1s), connection tracking, lock wait logging, and statement logging for DDL/data-modifying operations.

### Pattern D: Service Isolation
Docker network isolation pattern where internal services (PostgreSQL, Auth, PostgREST, Realtime, Storage) have no host exposure and are accessed only through the Kong API gateway.

## Phase 3: Generate PATTERNS.md

Use this structure for the output:

```markdown
# Supabase Docker Patterns

Local development configuration for Supabase stack, optimized for resource-constrained environments with minimal port exposure.

## Architecture Overview

```
Host Machine
│
├─ Exposed Ports (3)
│  ├─ :54321 → Kong (API Gateway)
│  │            └─ Routes to: auth, rest, realtime, storage, functions
│  ├─ :54323 → Studio (Web UI)
│  └─ :5173  → Vite (runs outside Docker)
│
└─ Docker Network (internal)
   ├─ db (PostgreSQL)        ← postgres-dev.conf tuning
   ├─ auth (GoTrue)
   ├─ rest (PostgREST)
   ├─ realtime
   ├─ storage
   ├─ functions (Edge Functions)
   ├─ imgproxy
   ├─ meta
   ├─ analytics
   ├─ inbucket (email testing)
   ├─ vector (logging)
   └─ logflare
```

---

## Pattern A: Port Consolidation

{Description of reducing 28+ ports to 3 essential ports}

**When to use**: Always for local development to avoid port conflicts and simplify firewall rules.

### Override Structure

```yaml
# supabase/docker/docker-compose.override.yml
services:
  # EXPOSED: Only essential services
  kong:
    ports:
      - "54321:8000"  # REST API, GraphQL, Auth endpoints

  studio:
    ports:
      - "54323:3000"  # Supabase Studio web interface

  # INTERNAL: Override base config with empty ports
  db:
    ports: []  # PostgreSQL - accessed via Kong API

  auth:
    ports: []  # GoTrue auth service
  # ... repeat for all internal services
```

**Key points:**
- Empty `ports: []` overrides base docker-compose.yml to remove host exposure
- Kong acts as single entry point for all API requests
- Internal services communicate via Docker DNS (service names)
- To temporarily expose a service (e.g., inbucket), uncomment the relevant section

**Example:** `supabase/docker/docker-compose.override.yml`

---

## Pattern B: PostgreSQL Memory Tuning

{Description of memory allocation strategy for 2GB containers}

**When to use**: When running Supabase locally with container memory limits.

### Memory Formula

```conf
# supabase/docker/postgres-dev.conf

# Container: 2GB total

# Shared Buffers: 25% of container memory (industry standard)
shared_buffers = 512MB

# Effective Cache Size: 75% (query planner hint, not allocation)
effective_cache_size = 1536MB

# Work Memory: (Total - shared_buffers) / (max_connections * 4)
# (2048 - 512) / (100 * 4) = 4MB
work_mem = 4MB

# Maintenance: For VACUUM, CREATE INDEX
maintenance_work_mem = 128MB

# Connections: 100 * ~10MB each = ~1GB max
max_connections = 100
```

**Key points:**
- `shared_buffers` at 25% is PostgreSQL best practice
- `effective_cache_size` helps query planner but allocates nothing
- `work_mem` is per-operation, not per-connection - keep low to prevent OOM
- JIT disabled (`jit = off`) to save memory on simple queries

**Example:** `supabase/docker/postgres-dev.conf`

---

## Pattern C: Development Logging

{Description of logging configuration for debugging}

**When to use**: Always enabled in local development for query analysis and debugging.

### Logging Configuration

```conf
# supabase/docker/postgres-dev.conf

# Slow query logging (queries > 1 second)
log_min_duration_statement = 1000

# Connection tracking
log_connections = on
log_disconnections = on

# Lock analysis
log_lock_waits = on
deadlock_timeout = 1s

# Temp file usage (indicates need for more work_mem)
log_temp_files = 0

# Statement logging: DDL and data-modifying statements
log_statement = 'mod'

# Performance analysis
track_io_timing = on
track_functions = all
```

**Key points:**
- `log_min_duration_statement = 1000` catches queries over 1 second
- `log_temp_files = 0` logs ALL temp file usage (helps identify queries needing more work_mem)
- `log_statement = 'mod'` logs INSERT/UPDATE/DELETE but not SELECT (reduces noise)
- Check settings with: `SHOW log_min_duration_statement;`

**Example:** `supabase/docker/postgres-dev.conf`

---

## Pattern D: Service Isolation

{Description of Docker network isolation strategy}

**When to use**: Standard pattern for Supabase local development security.

### Internal Service Access

```yaml
# supabase/docker/docker-compose.override.yml

# All internal services have ports removed
db:
  ports: []       # Access via Kong or docker exec

auth:
  ports: []       # Access via Kong at /auth/v1/

rest:
  ports: []       # Access via Kong at /rest/v1/

realtime:
  ports: []       # Access via Kong WebSocket

storage:
  ports: []       # Access via Kong at /storage/v1/

functions:
  ports: []       # Access via Kong at /functions/v1/
```

**Key points:**
- All services accessible via Kong gateway at port 54321
- Use `docker exec` for direct database access when needed
- Service-to-service communication uses Docker DNS names
- To expose inbucket for email testing, uncomment its port mapping

**Example:** `supabase/docker/docker-compose.override.yml`

---

## Pattern Comparison Table

| Aspect | Port Consolidation | Memory Tuning | Dev Logging | Service Isolation |
|--------|-------------------|---------------|-------------|-------------------|
| **Purpose** | Reduce host port exposure | Optimize for 2GB container | Debug queries | Security boundary |
| **When to use** | Always | Always | Development only | Always |
| **Key file** | docker-compose.override.yml | postgres-dev.conf | postgres-dev.conf | docker-compose.override.yml |
| **Complexity** | Low | Medium | Low | Low |

---

## Anti-Patterns to Avoid

### 1. Exposing All Ports

```yaml
# BAD: Exposes 28+ ports, creates conflicts and security risk
# (default Supabase docker-compose.yml behavior)
db:
  ports:
    - "54322:5432"
auth:
  ports:
    - "9999:9999"
# ... 20+ more services

# GOOD: Only expose what you need
db:
  ports: []  # Access through Kong gateway
```

### 2. Hardcoding Memory Without Container Limits

```conf
# BAD: Assumes unlimited memory
shared_buffers = 4GB
work_mem = 256MB

# GOOD: Calculate based on container limit (2GB)
shared_buffers = 512MB    # 25% of 2GB
work_mem = 4MB            # Prevents OOM
```

### 3. Disabling Development Logging

```conf
# BAD: No visibility into query performance
log_min_duration_statement = -1
log_statement = 'none'

# GOOD: Log slow queries and modifications
log_min_duration_statement = 1000
log_statement = 'mod'
```

---

## Docker Configuration Checklist

When modifying Supabase Docker configuration:

1. [ ] Port changes go in `docker-compose.override.yml`, not base file
2. [ ] Verify port doesn't conflict: `lsof -i :PORT`
3. [ ] PostgreSQL changes go in `postgres-dev.conf`
4. [ ] Memory settings calculated for container limit
5. [ ] Restart containers after config changes: `supabase stop && supabase start`
6. [ ] Verify settings applied: `docker exec supabase_db_crispy-crm psql -U postgres -c "SHOW shared_buffers;"`

---

## File Reference

| Pattern | Primary Files |
|---------|---------------|
| **A: Port Consolidation** | `docker-compose.override.yml` |
| **B: Memory Tuning** | `postgres-dev.conf` |
| **C: Dev Logging** | `postgres-dev.conf` |
| **D: Service Isolation** | `docker-compose.override.yml` |
```

## Phase 4: Write the File

Write the generated PATTERNS.md to:

```
/home/krwhynot/projects/crispy-crm/supabase/docker/PATTERNS.md
```

Ensure:
- All code examples use actual content from the configuration files
- ASCII diagram accurately reflects the 3 exposed ports and internal services
- Memory calculations match the actual formulas in postgres-dev.conf
- Anti-patterns are based on real issues that could occur
- Checklist includes verification commands
