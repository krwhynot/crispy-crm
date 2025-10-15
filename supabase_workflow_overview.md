# Supabase Workflow Overview

A complete guide for setting up and managing Supabase in both local Docker and cloud environments, with migration workflows and best practices.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Docker Supabase Setup](#local-docker-supabase-setup)
3. [Cloud Supabase Setup](#cloud-supabase-setup)
4. [Migration Workflow: Local to Cloud](#migration-workflow-local-to-cloud)
5. [Environment Management](#environment-management)
6. [Best Practices](#best-practices)
7. [CI/CD Integration](#cicd-integration)
8. [Project Structure](#project-structure)

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