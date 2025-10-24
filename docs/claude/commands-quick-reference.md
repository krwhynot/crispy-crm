# Commands Quick Reference

Essential commands for Atomic CRM development, organized by category.

## Development Workflow

```bash
# Start development server
npm run dev              # Vite dev server at http://localhost:5173

# Build for production
npm run build            # TypeScript check + production build

# Preview production build
npm run preview          # Preview dist/ locally
```

## Database & Supabase

### Local Docker Supabase

```bash
# Start/stop local Supabase
npm run supabase:local:start    # Start all services (PostgreSQL, API, Studio, Email)
npm run supabase:local:stop     # Stop all services
npm run supabase:local:status   # Check service status

# Database reset (LOCAL ONLY - SAFE)
npx supabase db reset           # Reset local DB + run all migrations

# Access points
npm run db:studio               # Open Studio at http://localhost:54323
# - REST API: http://localhost:54321
# - Email testing: http://localhost:54324
```

### Cloud/Production Supabase ⚠️

```bash
# SAFE: Push migrations with confirmations
npm run db:cloud:push           # Shows diff + requires confirmation

# SAFE: Show pending changes (read-only)
npm run db:cloud:diff           # Compare local vs cloud

# SAFE: Check migration status
npm run db:cloud:status         # List applied migrations

# SAFE: Push migrations + deploy edge functions
npm run supabase:deploy         # Full deployment

# Create new migration
npx supabase migration new <name>  # Generates timestamped SQL file
```

**❌ NEVER RUN ON PRODUCTION:**
```bash
npx supabase db reset --linked  # DELETES ALL DATA INCLUDING USERS!
```

**Complete database workflows:** See [Supabase Workflow Overview](../supabase/supabase_workflow_overview.md) and [Production Warning Guide](../../scripts/db/PRODUCTION-WARNING.md)

## Testing

```bash
# Run tests
npm test                 # Watch mode (development)
npm run test:ci          # Run once (CI mode)
npm run test:coverage    # Generate coverage report
npm run test:ui          # Launch Vitest UI

# End-to-end tests
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode

# Performance tests
npm run test:performance # Run performance benchmarks
npm run test:load        # Run load tests
```

**Coverage requirement:** 70% minimum (statements, branches, functions, lines)

**Complete testing guide:** See [Testing Quick Reference](testing-quick-reference.md)

## Code Quality

```bash
# Linting
npm run lint             # Check linting + formatting
npm run lint:check       # ESLint only
npm run lint:apply       # Auto-fix ESLint issues

# Formatting
npm run prettier:check   # Check Prettier formatting
npm run prettier:apply   # Auto-fix Prettier formatting

# Color validation
npm run validate:colors  # Ensure semantic color usage
```

**Pre-commit workflow:**
```bash
npm run lint:apply && npm run prettier:apply
```

## Development Scripts

```bash
# Database operations
npm run db:local:reset         # Reset local DB and seed test data (supabase/seed.sql)

# Cache management
npm run cache:clear            # Clear application caches
npm run search:reindex         # Reindex search data
```

## Migration Management

```bash
# Create migrations
npx supabase migration new <name>  # Create new migration file

# Migration status
npx supabase migration list        # List all migrations
npx supabase migration list --linked  # List with cloud status

# Compare schemas
npx supabase db diff               # Show differences (local vs remote)
npx supabase db diff --linked | npx supabase migration new sync_schema  # Generate migration from diff

# Production migrations
npm run migrate:production     # Execute production migration
npm run migrate:dry-run        # Preview migration changes
npm run migrate:backup         # Backup before migration
npm run migrate:rollback       # Rollback if needed
npm run migrate:validate       # Validate migration success
npm run migrate:status         # Check migration status
```

## Build & Deployment

```bash
# Production build
npm run build            # Build to dist/

# Production deployment
npm run prod:start       # Build + deploy DB + serve locally
npm run prod:deploy      # Build + deploy DB + deploy to GitHub Pages
```

## Edge Functions

```bash
# Create new function
npx supabase functions new <name>

# Local development
npx supabase functions serve          # Serve locally

# Deploy to cloud
npx supabase functions deploy <name>  # Deploy specific function
npm run supabase:deploy               # Deploy all functions + migrations
```

## Environment Management

```bash
# Link to cloud project
npx supabase login
npx supabase link --project-ref <project-ref>

# Environment status
npx supabase status              # Show local status
npx supabase status --linked     # Show cloud status

# Pull remote schema
npx supabase db pull             # Pull cloud schema to local

# Set secrets (for edge functions)
npx supabase secrets set KEY=value
npx supabase secrets set --env-file .env.production
npx supabase secrets list
```

## Troubleshooting

```bash
# Check logs
npx supabase functions logs --project-ref <ref>

# Verify environment
npm run dev:check              # Quick status check
npm run dev:verify             # Verify environment setup

# Reset local environment
npm run supabase:local:stop
npm run supabase:local:start
npx supabase db reset

# Full clean start
npm run supabase:local:stop
docker system prune -a --volumes  # Remove all Docker data
npm run supabase:local:start
```

## Quick Workflows

### New Feature Development
```bash
npm run supabase:local:start   # 1. Start local Supabase
npm run dev                    # 2. Start dev server
npm test                       # 3. Run tests (in another terminal)
```

### Database Schema Change
```bash
npx supabase migration new add_feature  # 1. Create migration
# Edit: supabase/migrations/YYYYMMDDHHMMSS_add_feature.sql
npx supabase db reset                   # 2. Test locally
npm run dev                             # 3. Verify app works
npm run db:cloud:push                   # 4. Deploy to production
```

### Deploy to Production
```bash
npm run lint:apply            # 1. Fix linting
npm test                      # 2. Run tests
npm run build                 # 3. Build app
npm run db:cloud:push         # 4. Deploy migrations
npm run prod:deploy           # 5. Deploy app + edge functions
```

---

## Command Categories Summary

| Category | Key Commands |
|----------|--------------|
| **Dev Server** | `npm run dev` |
| **Local DB** | `npm run supabase:local:start`, `npx supabase db reset` |
| **Cloud DB** | `npm run db:cloud:push`, `npm run db:cloud:diff` |
| **Testing** | `npm test`, `npm run test:coverage`, `npm run test:e2e` |
| **Code Quality** | `npm run lint:apply`, `npm run prettier:apply` |
| **Migrations** | `npx supabase migration new`, `npm run migrate:production` |
| **Deployment** | `npm run build`, `npm run prod:deploy` |

**For comprehensive workflows, see:**
- [Supabase Workflow Overview](../supabase/supabase_workflow_overview.md) - Complete local + cloud guide
- [Production Warning Guide](../../scripts/db/PRODUCTION-WARNING.md) - Safety checklist
- [Migration Business Rules](../database/migration-business-rules.md) - Migration best practices
