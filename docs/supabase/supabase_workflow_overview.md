# Supabase Workflow Overview

A complete guide for setting up and managing Supabase in both local Docker and cloud environments, with migration workflows and best practices.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Docker Supabase Setup](#local-docker-supabase-setup)
3. [Pre-Launch Development Workflow (Current Implementation)](#pre-launch-development-workflow-current-implementation)
4. [Cloud Supabase Setup](#cloud-supabase-setup)
5. [Migration Workflow: Local to Cloud](#migration-workflow-local-to-cloud)
6. [Environment Management](#environment-management)
7. [Best Practices](#best-practices)
8. [CI/CD Integration](#cicd-integration)
9. [Project Structure](#project-structure)

## Prerequisites

### Required Software

- **Docker Desktop** (v20.10+ recommended) or compatible container runtime
- **Node.js** (v18+ recommended) and npm/yarn/pnpm
- **Git** for version control
- **Supabase CLI** (latest version)

### Installation Steps

```bash
# Install Supabase CLI globally
npm install -g supabase

# Or as a dev dependency (recommended)
npm install --save-dev supabase

# Verify installation
npx supabase --version
```

### System Requirements

- Minimum 4GB RAM available for Docker
- 10GB free disk space for Docker images and volumes
- Ports 54320-54329 available (default Supabase ports)

## Local Docker Supabase Setup

### Step 1: Initialize Project

```bash
# In your project root directory
npx supabase init
```

This creates the following structure:
```
supabase/
├── config.toml          # Local configuration
├── migrations/          # Database migration files
├── functions/          # Edge functions (optional)
└── seed.sql           # Seed data (optional)
```

### Step 2: Configure Local Environment

Edit `supabase/config.toml` for your needs:

```toml
# supabase/config.toml
[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]

[db]
port = 54322
pool_size = 25

[studio]
enabled = true
port = 54323

[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/**"]

[auth.email]
enable_signup = true
enable_confirmations = true

[storage]
file_size_limit = "50MiB"
```

### Step 3: Start Local Stack

```bash
# Start all Supabase services
npx supabase start
```

This starts:
- **PostgreSQL Database** - `postgresql://postgres:postgres@localhost:54322/postgres`
- **API Gateway** - `http://localhost:54321`
- **Studio Dashboard** - `http://localhost:54323`
- **Inbucket (Email Testing)** - `http://localhost:54324`
- **Edge Functions** - `http://localhost:54321/functions/v1/`

**Rationale**: Running locally with Docker provides complete control, offline development capability, and cost-free testing.

### Step 4: Create Initial Migration

```bash
# Generate a new migration file
npx supabase migration new create_initial_schema

# Edit the generated file in supabase/migrations/
```

Example migration:
```sql
-- supabase/migrations/20240101000000_create_initial_schema.sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Step 5: Apply Migrations

```bash
# Apply all pending migrations
npx supabase db reset

# Or apply specific migrations
npx supabase migration up
```

## Pre-Launch Development Workflow (Current Implementation)

This section outlines the streamlined workflow for development during the pre-launch phase, optimizing for rapid iteration and testing.

### Quick Start

Follow these steps to get up and running with a fully configured development environment:

1. **Start Local Supabase**
   ```bash
   npm run supabase:local:start
   ```

2. **Create Test Users**
   ```bash
   # Reset database and apply all migrations
   npm run supabase:local:db:reset

   # Test users are automatically created via seed data
   ```

3. **Push to Cloud** (optional)
   ```bash
   npm run supabase:deploy
   ```

### Test User Credentials

The following test users are automatically created with sample data for testing different user scenarios:

| Email | Password | Role | Contacts | Organizations | Opportunities |
|-------|----------|------|----------|---------------|---------------|
| admin@test.local | Test123! | Admin | 100 | 50 | 75 |
| director@test.local | Test123! | Director | 60 | 30 | 40 |
| manager@test.local | Test123! | Manager | 40 | 20 | 25 |
| sales@test.local | Test123! | Sales Rep | 20 | 10 | 15 |
| viewer@test.local | Test123! | Read-only | 10 | 5 | 5 |

**Note**: All test users use the same password for convenience during development. These accounts should only be used in local/staging environments.

### Sync Operations

Manage synchronization between local and cloud environments:

#### When to Sync
- **After local schema changes**: Push migrations to cloud
- **After team member changes**: Pull remote changes to local
- **Before major features**: Ensure environments are aligned

#### How to Verify Sync Status
```bash
# Check current migration status
npx supabase migration list

# Compare local and remote schemas
npx supabase db diff

# Verify environment status
npm run supabase:local:status
```

#### Rollback from Backup
```bash
# Create backup before risky operations
npx supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup if needed
psql postgresql://postgres:postgres@localhost:54322/postgres < backup_20240101_120000.sql

# Reset to clean state
npm run supabase:local:db:reset
```

### Environment Reset

Reset your local environment when you need a fresh start:

#### When to Reset
- Testing from a clean state
- After failed migration attempts
- When switching between feature branches
- Resolving data inconsistencies

#### Reset Process
```bash
# Full reset (drops and recreates database)
npm run supabase:local:db:reset

# Confirmation: This command will prompt for confirmation
# Time estimate: ~30-60 seconds depending on seed data volume
```

**Warning**: Reset will delete all local data. Export any important test data before resetting.

### Storage Service Status

**Current Status**: The storage service is enabled in local Docker environment but may have limitations.

#### Known Limitations
- File uploads work locally but may not sync to cloud
- Maximum file size: 50MB (configurable in config.toml)
- Supported buckets: avatars (public), documents (private)

#### Workaround if Storage is Disabled
If you encounter storage issues locally:
1. Test file uploads directly in cloud environment
2. Use cloud project for storage-intensive testing
3. Mock storage calls in unit tests

For investigation notes and updates, see: `supabase/config.toml` storage configuration section.

### Script Reference

#### Essential NPM Scripts
```bash
# Local Development
npm run supabase:local:start    # Start Docker containers
npm run supabase:local:stop     # Stop Docker containers
npm run supabase:local:status   # Check service status
npm run supabase:local:db:reset # Reset database

# Studio Access
npm run db:studio              # Open Studio in browser (http://localhost:54323)
npm run supabase:local:studio   # Shows Studio URL

# Deployment
npm run supabase:deploy         # Push to cloud (migrations + functions)

# Development Shortcuts
npm run dev:local              # Reset DB + start Vite dev server
npm run dev:check              # Quick status check

# Development Sync Scripts
npm run dev:sync:push          # Sync local changes to cloud
npm run dev:users:create       # Create test users
npm run dev:reset              # Reset environment
npm run dev:verify             # Verify environment setup

# Migration Scripts
npm run migrate:deploy         # Deploy migrations safely
npm run migrate:backup         # Backup database before migration
npm run migrate:status         # Check migration status
npm run migrate:verify         # Verify migration success
```

#### Direct Supabase CLI Commands
```bash
# Migration Management
npx supabase migration new <name>  # Create new migration
npx supabase migration list        # List all migrations
npx supabase db diff              # Compare local vs remote

# Environment Management
npx supabase link --project-ref <ref>  # Link to cloud project
npx supabase db pull                   # Pull remote schema
npx supabase db push                   # Push local changes
```

For additional scripts and detailed documentation, refer to the project's package.json scripts section.

## Cloud Supabase Setup

### Step 1: Create Cloud Project

1. Visit [app.supabase.com](https://app.supabase.com)
2. Create new project
3. Save your project credentials:
   - Project URL
   - Anon Key
   - Service Role Key (keep secure!)
   - Database Password

### Step 2: Link Local to Cloud

```bash
# Login to Supabase
npx supabase login

# Link to your project (get project-ref from dashboard URL)
npx supabase link --project-ref your-project-ref

# Verify link
npx supabase status
```

### Step 3: Pull Remote Schema

```bash
# Pull any existing remote schema
npx supabase db pull

# This creates migration files for existing remote schema
```

**Rationale**: Pulling remote schema ensures local development matches production state, preventing conflicts.

## Migration Workflow: Local to Cloud

### Development Flow

```
Local Changes → Test Locally → Create Migration → Push to Staging → Test → Push to Production
```

### Step 1: Develop Locally

```bash
# Make schema changes in local Studio or via SQL
# Then capture changes as migration
npx supabase db diff -f descriptive_migration_name
```

### Step 2: Test Migration Locally

```bash
# Reset local database and apply all migrations
npx supabase db reset

# Verify changes
npx supabase migration list
```

### Step 3: Push to Staging

```bash
# Switch to staging project
npx supabase link --project-ref staging-project-ref

# Dry run first
npx supabase db push --dry-run

# Apply migrations
npx supabase db push
```

### Step 4: Push to Production

```bash
# Switch to production project
npx supabase link --project-ref prod-project-ref

# Always backup first!
npx supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql

# Apply migrations
npx supabase db push
```

### Handling Conflicts

When schemas diverge between local and remote:

```bash
# Pull remote changes
npx supabase db pull

# Review the generated migration
# Manually resolve conflicts in migration files
# Test locally
npx supabase db reset

# Push resolved version
npx supabase db push
```

## Environment Management

### File Structure

```
.env                 # Local development (gitignored)
.env.staging        # Staging environment (gitignored)
.env.production     # Production environment (gitignored)
.env.example        # Template for team (committed)
```

### Environment Variables

```bash
# .env.example
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_PASSWORD=your_db_password
SUPABASE_ACCESS_TOKEN=your_access_token
SUPABASE_PROJECT_ID=your_project_id
```

### Secrets Management

```bash
# Set secrets for Edge Functions
npx supabase secrets set KEY=value

# Set from file
npx supabase secrets set --env-file .env.production

# List secrets
npx supabase secrets list
```

**Rationale**: Separating environments prevents accidental production changes and allows safe testing.

## Best Practices

### 1. Migration Management

- **One Change Per Migration**: Keep migrations atomic and reversible
- **Timestamp Ordering**: Never rename or reorder existing migrations
- **Test Before Production**: Always test migrations in staging first
- **Version Control**: Commit all migrations to Git

### 2. Schema Development

- **Local-First**: Make all changes locally, then push to cloud
- **Pull Regular**: Regularly pull remote changes to avoid drift
- **Document Changes**: Add comments in migration files
- **Use Transactions**: Wrap related changes in transactions

### 3. Data Safety

- **Backup Before Migrations**: Always backup production before changes
- **Seed Data Separately**: Keep test data in seed.sql, not migrations
- **RLS by Default**: Enable Row Level Security on all tables
- **Test Policies**: Verify RLS policies work as expected

### 4. Team Collaboration

- **Branch Protection**: Use Git branches for schema changes
- **Migration Reviews**: Review migrations in pull requests
- **Shared Environments**: Document which environments are shared
- **Communication**: Coordinate major schema changes

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Deploy Supabase

on:
  push:
    branches: [main, develop]
  pull_request:
    types: [opened, synchronize]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start Supabase
        run: supabase start

      - name: Run Tests
        run: npm test

      - name: Stop Supabase
        run: supabase stop

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: test
    runs-on: ubuntu-latest
    env:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      SUPABASE_DB_PASSWORD: ${{ secrets.STAGING_DB_PASSWORD }}
      SUPABASE_PROJECT_ID: ${{ secrets.STAGING_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1

      - name: Deploy to Staging
        run: |
          supabase link --project-ref $SUPABASE_PROJECT_ID
          supabase db push

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    env:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      SUPABASE_DB_PASSWORD: ${{ secrets.PRODUCTION_DB_PASSWORD }}
      SUPABASE_PROJECT_ID: ${{ secrets.PRODUCTION_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1

      - name: Deploy to Production
        run: |
          supabase link --project-ref $SUPABASE_PROJECT_ID
          supabase db push
```

**Rationale**: Automated deployment ensures consistency and reduces human error in production deployments.

## Project Structure

### Recommended Directory Layout

```
your-project/
├── supabase/
│   ├── config.toml              # Local configuration
│   ├── migrations/              # Database migrations
│   │   ├── 20240101000000_initial_schema.sql
│   │   ├── 20240102000000_add_profiles.sql
│   │   └── 20240103000000_add_policies.sql
│   ├── functions/              # Edge Functions
│   │   ├── hello-world/
│   │   │   └── index.ts
│   │   └── _shared/           # Shared function code
│   ├── seed.sql               # Development seed data
│   └── tests/                  # Database tests
├── src/                        # Application code
├── .env.example               # Environment template
├── .gitignore                 # Include .env files
├── docker-compose.yml         # Optional custom Docker config
└── README.md                  # Project documentation
```

### Storage Configuration

```toml
# supabase/config.toml
[storage.buckets.avatars]
public = true
file_size_limit = "5MB"
allowed_mime_types = ["image/png", "image/jpeg"]
objects_path = "./seed/avatars"

[storage.buckets.documents]
public = false
file_size_limit = "10MB"
allowed_mime_types = ["application/pdf", "text/plain"]
```

## Advanced Topics

### Multi-Environment Strategy

```bash
# Development
supabase start  # Local Docker

# Staging
supabase link --project-ref staging-ref
supabase db push

# Production
supabase link --project-ref prod-ref
supabase db push --dry-run  # Always dry-run first
supabase db push
```

### Edge Functions Deployment

```bash
# Create new function
npx supabase functions new my-function

# Serve locally
npx supabase functions serve

# Deploy to cloud
npx supabase functions deploy my-function

# Deploy with secrets
npx supabase functions deploy my-function --no-verify-jwt
```

### Database Branching (Preview Environments)

```bash
# Create preview branch
npx supabase branches create feat/new-feature

# Switch to branch
npx supabase branches switch feat/new-feature

# Merge branch
npx supabase branches merge feat/new-feature
```

## Summary

This workflow provides a robust foundation for Supabase development:

1. **Local-first development** ensures safe experimentation
2. **Migration versioning** maintains schema consistency
3. **Environment separation** prevents accidental production changes
4. **CI/CD automation** reduces deployment errors
5. **Best practices** ensure maintainable, scalable systems

The key is maintaining discipline: always develop locally, test thoroughly, and deploy systematically. This approach minimizes risk while maximizing development velocity.