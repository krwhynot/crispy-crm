---
name: supabase-cli
description: Comprehensive Supabase CLI reference for local development, migrations, Edge Functions, type generation, and deployment. Triggers on supabase, npx supabase, migrations, db push, db pull, db reset, edge functions, supabase start, supabase stop, supabase link, gen types, supabase deploy, local development stack, database branching, secrets management.
---

# Supabase CLI Cheat Sheet

## Purpose

Quick reference for all Supabase CLI commands used in local development, database migrations, Edge Functions, and deployment workflows.

## When to Use

Activate this skill when:
- Running Supabase CLI commands
- Managing database migrations
- Working with Edge Functions
- Generating TypeScript types
- Deploying to production
- Troubleshooting local development stack

---

## Installation & Authentication

```bash
# Install via npm
npm install -g supabase

# Or via Homebrew (macOS/Linux)
brew install supabase/tap/supabase

# Authenticate (opens browser)
supabase login

# Logout
supabase logout
```

---

## Project Setup

| Command | Description |
|---------|-------------|
| `supabase init` | Initialize project (creates `supabase/config.toml`) |
| `supabase init --with-vscode-settings` | Init with Deno settings for VS Code |
| `supabase link --project-ref <id>` | Link to remote project |

**Get project-id from:** `https://supabase.com/dashboard/project/<project-id>`

---

## Local Development Stack

| Command | Description |
|---------|-------------|
| `supabase start` | Start all local containers (~7GB RAM) |
| `supabase stop` | Stop containers (with backup) |
| `supabase stop --no-backup` | Stop without backup |
| `supabase status` | Show status and URLs |

### Selective Start

```bash
# Exclude services you don't need
supabase start -x studio,imgproxy

# Available: gotrue, realtime, storage-api, imgproxy, kong,
#            mailpit, postgrest, postgres-meta, studio,
#            edge-runtime, logflare, vector, supavisor
```

### Default Local URLs

| Service | URL |
|---------|-----|
| API (PostgREST) | `http://localhost:54321` |
| Studio Dashboard | `http://localhost:54323` |
| Database | `postgresql://postgres:postgres@localhost:54322/postgres` |
| Mailpit (Email) | `http://localhost:54324` |

---

## Database Migrations

### Create Migrations

```bash
# Create empty migration
supabase migration new <name>

# Diff local changes → migration file
supabase db diff -f <name>

# Diff against remote
supabase db diff --linked -f <name>

# Diff specific schema
supabase db diff --schema public -f <name>
```

### Apply Migrations

| Command | Description |
|---------|-------------|
| `supabase db reset` | Reset + apply all + seed |
| `supabase db reset --no-seed` | Reset without seed.sql |
| `supabase migration up` | Apply pending (local) |
| `supabase migration up --linked` | Apply pending (remote) |

### Sync with Remote

```bash
# Pull from remote → create migration
supabase db pull

# Pull specific schemas
supabase db pull --schema auth,storage

# Push to remote
supabase db push

# Preview push (dry run)
supabase db push --dry-run
```

### Migration Management

| Command | Description |
|---------|-------------|
| `supabase migration list` | List all migrations |
| `supabase migration repair` | Fix history table |
| `supabase migration squash` | Combine migrations |

---

## Type Generation

```bash
# From local database
supabase gen types typescript --local > src/types/supabase.ts

# From linked remote
supabase gen types typescript --linked > src/types/supabase.ts

# Specific schemas
supabase gen types typescript --local --schema public,auth
```

---

## Edge Functions

### Create & Manage

```bash
supabase functions new <name>     # Create function
supabase functions list           # List all
supabase functions delete <name>  # Delete
```

### Local Development

```bash
supabase functions serve                    # Serve all
supabase functions serve <name>             # Serve one
supabase functions serve --env-file .env    # With env
```

### Deploy

```bash
supabase functions deploy <name>            # Deploy one
supabase functions deploy                   # Deploy all
supabase functions deploy --no-verify-jwt   # No JWT check
```

---

## Secrets Management

```bash
supabase secrets set KEY=value          # Set secret
supabase secrets set --env-file .env    # From file
supabase secrets list                   # List all
supabase secrets unset KEY              # Remove
```

---

## Database Inspection

```bash
supabase inspect db db-stats            # Database stats
supabase inspect db table-stats         # Table sizes
supabase inspect db index-stats         # Index usage
supabase inspect db bloat               # Find bloat
supabase inspect db long-running-queries # Slow queries
supabase inspect db locks               # Lock info
```

---

## Storage

```bash
supabase storage ls ss:///bucket/path       # List files
supabase storage cp ./file ss:///bucket/    # Upload
supabase storage cp ss:///bucket/file ./    # Download
supabase storage rm ss:///bucket/file       # Delete
```

---

## Common Workflows

### Fresh Local Start

```bash
supabase init
supabase start
# Make changes in Studio (localhost:54323)
supabase db diff -f my_changes
supabase db reset  # Verify migrations
```

### Deploy to Production

```bash
supabase link --project-ref <id>
supabase db push              # Push migrations
supabase functions deploy     # Deploy functions
```

### Regenerate Types After Schema Change

```bash
supabase db reset
supabase gen types typescript --local > src/types/supabase.ts
```

---

## Troubleshooting

```bash
supabase status                      # Check health
supabase stop --no-backup && supabase start  # Full reset
supabase start --ignore-health-check # Force start
```

---

## Reference Files

For detailed information, see:
- [COMMANDS_REFERENCE.md](resources/COMMANDS_REFERENCE.md) - Complete command documentation
- [CONFIG_REFERENCE.md](resources/CONFIG_REFERENCE.md) - config.toml configuration
- [WORKFLOWS.md](resources/WORKFLOWS.md) - Step-by-step workflow guides

---

**Line Count:** ~200 (well under 500-line limit)
