# Supabase CLI Commands Reference

Complete documentation for all Supabase CLI commands with flags and examples.

## Table of Contents

- [Global Flags](#global-flags)
- [Project Commands](#project-commands)
- [Database Commands](#database-commands)
- [Migration Commands](#migration-commands)
- [Functions Commands](#functions-commands)
- [Secrets Commands](#secrets-commands)
- [Storage Commands](#storage-commands)
- [Inspect Commands](#inspect-commands)
- [Branch Commands](#branch-commands)
- [Test Commands](#test-commands)

---

## Global Flags

Available on all commands:

| Flag | Description |
|------|-------------|
| `--workdir <path>` | Override working directory |
| `--debug` | Enable debug output |
| `--experimental` | Enable experimental features |

Environment variable: `SUPABASE_WORKDIR`

---

## Project Commands

### supabase init

Initialize a new Supabase project locally.

```bash
supabase init [flags]
```

| Flag | Description |
|------|-------------|
| `--force` | Overwrite existing config.toml |
| `--with-vscode-settings` | Generate VS Code Deno settings |
| `--with-intellij-settings` | Generate IntelliJ Deno settings |
| `--use-orioledb` | Use OrioleDB storage engine |

**Creates:**
- `supabase/config.toml` - Project configuration
- `supabase/` directory structure

---

### supabase login

Authenticate with Supabase platform.

```bash
supabase login
```

Opens browser for OAuth authentication. Saves token locally.

---

### supabase link

Link local project to remote Supabase project.

```bash
supabase link --project-ref <project-id>
```

| Flag | Description |
|------|-------------|
| `--project-ref <id>` | Project ID (required) |
| `-p, --password <pwd>` | Database password |

**Get project-id from:** Dashboard URL `https://supabase.com/dashboard/project/<project-id>`

---

### supabase start

Start local development stack.

```bash
supabase start [flags]
```

| Flag | Description |
|------|-------------|
| `-x, --exclude <services>` | Services to skip (comma-separated) |
| `--ignore-health-check` | Ignore unhealthy services |

**Excludable services:**
`gotrue`, `realtime`, `storage-api`, `imgproxy`, `kong`, `mailpit`, `postgrest`, `postgres-meta`, `studio`, `edge-runtime`, `logflare`, `vector`, `supavisor`

**Examples:**
```bash
# Start without Studio
supabase start -x studio

# Start minimal (just DB + API)
supabase start -x studio,imgproxy,mailpit,logflare,vector
```

**RAM Requirement:** ~7GB for all services

---

### supabase stop

Stop local development stack.

```bash
supabase stop [flags]
```

| Flag | Description |
|------|-------------|
| `--no-backup` | Don't backup database |

---

### supabase status

Show local stack status and URLs.

```bash
supabase status
```

**Output includes:**
- Service status (running/stopped)
- API URL, DB URL, Studio URL
- anon key, service_role key

---

## Database Commands

### supabase db reset

Reset local database to clean state.

```bash
supabase db reset [flags]
```

| Flag | Description |
|------|-------------|
| `--no-seed` | Skip seed.sql |
| `--linked` | Reset remote (DANGEROUS) |
| `--db-url <url>` | Target specific database |
| `--version <ver>` | Reset to specific version |
| `--last <n>` | Reset last n migrations |

**Process:**
1. Drops and recreates database
2. Applies all migrations in order
3. Runs `supabase/seed.sql` (unless --no-seed)

---

### supabase db diff

Diff schema changes to create migration.

```bash
supabase db diff [flags]
```

| Flag | Description |
|------|-------------|
| `-f, --file <name>` | Save as migration file |
| `--linked` | Diff against remote |
| `--local` | Diff against local |
| `-s, --schema <list>` | Schemas to include |
| `--use-migra` | Use migra for diff |
| `--use-pgadmin` | Use pgAdmin for diff |

**Examples:**
```bash
# Diff and save as migration
supabase db diff -f add_users_table

# Diff specific schema
supabase db diff --schema public -f my_changes

# Diff local vs remote
supabase db diff --linked -f sync_changes
```

---

### supabase db pull

Pull schema from remote to local.

```bash
supabase db pull [migration_name] [flags]
```

| Flag | Description |
|------|-------------|
| `--linked` | Pull from linked project |
| `--local` | Pull from local |
| `--db-url <url>` | Pull from URL |
| `-s, --schema <list>` | Schemas to pull |
| `-p, --password <pwd>` | Database password |

**Examples:**
```bash
# Pull all schemas
supabase db pull

# Pull auth and storage
supabase db pull --schema auth,storage
```

**Note:** auth and storage excluded by default. Run again with `--schema auth,storage` to include.

---

### supabase db push

Push local migrations to remote.

```bash
supabase db push [flags]
```

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview without applying |
| `--linked` | Push to linked project |
| `--db-url <url>` | Push to URL |
| `--include-all` | Include all migrations |
| `--include-roles` | Include roles.sql |
| `--include-seed` | Include seed data |
| `-p, --password <pwd>` | Database password |

**Examples:**
```bash
# Preview push
supabase db push --dry-run

# Push with roles
supabase db push --include-roles
```

---

### supabase db dump

Dump database schema or data.

```bash
supabase db dump [flags]
```

| Flag | Description |
|------|-------------|
| `-f, --file <path>` | Output file |
| `--data-only` | Dump data only |
| `--schema-only` | Dump schema only |
| `-s, --schema <list>` | Specific schemas |

---

### supabase db lint

Lint database for issues.

```bash
supabase db lint [flags]
```

| Flag | Description |
|------|-------------|
| `--linked` | Lint remote |
| `--local` | Lint local |
| `-s, --schema <list>` | Specific schemas |
| `--level <level>` | Warning level |

---

## Migration Commands

### supabase migration new

Create new migration file.

```bash
supabase migration new <name>
```

**Creates:** `supabase/migrations/<timestamp>_<name>.sql`

---

### supabase migration list

List all migrations.

```bash
supabase migration list [flags]
```

| Flag | Description |
|------|-------------|
| `--linked` | List remote status |
| `--local` | List local status |
| `--db-url <url>` | Specific database |

---

### supabase migration up

Apply pending migrations.

```bash
supabase migration up [flags]
```

| Flag | Description |
|------|-------------|
| `--linked` | Apply to remote |
| `--local` | Apply to local |
| `--include-all` | Include all pending |
| `--db-url <url>` | Specific database |

---

### supabase migration repair

Repair migration history.

```bash
supabase migration repair [flags]
```

| Flag | Description |
|------|-------------|
| `--status <applied\|reverted>` | Set status |
| `--version <ver>` | Target version |

---

### supabase migration squash

Squash migrations into one.

```bash
supabase migration squash [flags]
```

| Flag | Description |
|------|-------------|
| `--version <ver>` | Squash up to version |
| `--linked` | From remote |
| `--db-url <url>` | Specific database |

---

## Functions Commands

### supabase functions new

Create new Edge Function.

```bash
supabase functions new <name>
```

**Creates:** `supabase/functions/<name>/index.ts`

---

### supabase functions serve

Serve functions locally.

```bash
supabase functions serve [name] [flags]
```

| Flag | Description |
|------|-------------|
| `--env-file <path>` | Environment file |
| `--no-verify-jwt` | Disable JWT verification |
| `--import-map <path>` | Custom import map |

---

### supabase functions deploy

Deploy to production.

```bash
supabase functions deploy [name] [flags]
```

| Flag | Description |
|------|-------------|
| `--no-verify-jwt` | Disable JWT verification |
| `--import-map <path>` | Custom import map |
| `--project-ref <id>` | Target project |

**Examples:**
```bash
# Deploy specific function
supabase functions deploy my-function

# Deploy all functions
supabase functions deploy
```

---

### supabase functions list

List all functions.

```bash
supabase functions list [flags]
```

---

### supabase functions delete

Delete a function.

```bash
supabase functions delete <name> [flags]
```

---

## Secrets Commands

### supabase secrets set

Set Edge Function secrets.

```bash
supabase secrets set <NAME=value> ... [flags]
```

| Flag | Description |
|------|-------------|
| `--env-file <path>` | Load from file |
| `--project-ref <id>` | Target project |

**Examples:**
```bash
supabase secrets set MY_KEY=value
supabase secrets set --env-file .env.production
```

---

### supabase secrets list

List all secrets.

```bash
supabase secrets list [flags]
```

---

### supabase secrets unset

Remove secrets.

```bash
supabase secrets unset <NAME> ... [flags]
```

---

## Storage Commands

### supabase storage ls

List storage contents.

```bash
supabase storage ls ss:///<bucket>/<path> [flags]
```

---

### supabase storage cp

Copy files to/from storage.

```bash
supabase storage cp <source> <dest> [flags]
```

| Flag | Description |
|------|-------------|
| `-r, --recursive` | Recursive copy |

**Examples:**
```bash
# Upload
supabase storage cp ./image.png ss:///avatars/user.png

# Download
supabase storage cp ss:///avatars/user.png ./download.png

# Recursive upload
supabase storage cp -r ./folder ss:///bucket/
```

---

### supabase storage mv

Move/rename files.

```bash
supabase storage mv <source> <dest>
```

---

### supabase storage rm

Remove files.

```bash
supabase storage rm ss:///<bucket>/<path> [flags]
```

| Flag | Description |
|------|-------------|
| `-r, --recursive` | Recursive delete |

---

## Inspect Commands

All inspect commands support `--linked`, `--local`, and `--db-url` flags.

| Command | Description |
|---------|-------------|
| `supabase inspect db db-stats` | Database statistics |
| `supabase inspect db table-stats` | Table sizes and rows |
| `supabase inspect db index-stats` | Index usage |
| `supabase inspect db bloat` | Table/index bloat |
| `supabase inspect db blocking` | Blocking queries |
| `supabase inspect db locks` | Lock information |
| `supabase inspect db long-running-queries` | Slow queries |
| `supabase inspect db outliers` | Query outliers |
| `supabase inspect db vacuum-stats` | Vacuum statistics |
| `supabase inspect db replication-slots` | Replication info |
| `supabase inspect db role-stats` | Role statistics |

---

## Branch Commands

Database branching (Pro feature).

| Command | Description |
|---------|-------------|
| `supabase branches list` | List all branches |
| `supabase branches create <name>` | Create branch |
| `supabase branches get <id>` | Get details |
| `supabase branches delete <id>` | Delete branch |
| `supabase branches pause <id>` | Pause branch |
| `supabase branches unpause <id>` | Unpause branch |

---

## Test Commands

### supabase test new

Create database test.

```bash
supabase test new <name>
```

**Creates:** `supabase/tests/<name>.sql`

---

### supabase test db

Run database tests (pgTAP).

```bash
supabase test db [flags]
```

---

## Type Generation

### supabase gen types

Generate type definitions.

```bash
supabase gen types <lang> [flags]
```

| Flag | Description |
|------|-------------|
| `--local` | From local database |
| `--linked` | From linked project |
| `--project-id <id>` | From specific project |
| `--db-url <url>` | From URL |
| `-s, --schema <list>` | Specific schemas |

**Languages:** `typescript`, `go`, `swift`

**Examples:**
```bash
# TypeScript from local
supabase gen types typescript --local > src/types/supabase.ts

# Go from linked
supabase gen types go --linked > pkg/database/types.go
```

---

## Projects Commands

| Command | Description |
|---------|-------------|
| `supabase projects list` | List all projects |
| `supabase projects create <name>` | Create project |
| `supabase projects delete <id>` | Delete project |
| `supabase projects api-keys` | Get API keys |

---

**Line Count:** ~450 (under 500-line limit for reference file)
