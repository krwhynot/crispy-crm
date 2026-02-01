# Supabase CI/CD Patterns

GitHub Actions workflows for migrations, testing, and deployment.

## Table of Contents

- [Overview](#overview)
- [Environment Setup](#environment-setup)
- [Migration Workflow](#migration-workflow)
- [Type Generation Workflow](#type-generation-workflow)
- [Edge Function Deployment](#edge-function-deployment)
- [Full CI/CD Pipeline](#full-cicd-pipeline)
- [Branch-Based Environments](#branch-based-environments)

---

## Overview

### Key Principles

1. **Never run migrations directly in production** - Use staging first
2. **Always dry-run before push** - `supabase db push --dry-run`
3. **Generate types in CI** - Catch schema/code mismatches early
4. **Use project-specific secrets** - Separate staging/production credentials

---

## Environment Setup

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `SUPABASE_ACCESS_TOKEN` | From `supabase login` |
| `SUPABASE_PROJECT_ID` | Production project ID |
| `SUPABASE_DB_PASSWORD` | Production DB password |
| `STAGING_PROJECT_ID` | Staging project ID |
| `STAGING_DB_PASSWORD` | Staging DB password |

### Get Access Token

```bash
supabase login
# Token saved to ~/.supabase/access-token
cat ~/.supabase/access-token
```

---

## Migration Workflow

### Push Migrations on Merge to Main

`.github/workflows/migrations.yml`:

```yaml
name: Database Migrations

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  migrate-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to Staging
        run: |
          supabase link --project-ref ${{ secrets.STAGING_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Dry Run Migrations
        run: supabase db push --dry-run
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Push Migrations to Staging
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  migrate-production:
    needs: migrate-staging
    runs-on: ubuntu-latest
    environment: production  # Requires approval
    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Link to Production
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Push Migrations to Production
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## Type Generation Workflow

### Validate Types on PR

`.github/workflows/types-check.yml`:

```yaml
name: Type Check

on:
  pull_request:
    paths:
      - 'supabase/migrations/**'
      - 'src/**/*.ts'
      - 'src/**/*.tsx'

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Start Supabase Local
        run: supabase start

      - name: Generate Types
        run: |
          supabase gen types typescript --local > src/types/supabase.ts

      - name: Check for Type Changes
        run: |
          git diff --exit-code src/types/supabase.ts || \
            echo "::warning::Types have changed. Please regenerate and commit."

      - name: TypeScript Check
        run: npx tsc --noEmit

      - name: Stop Supabase
        if: always()
        run: supabase stop
```

---

## Edge Function Deployment

### Deploy Functions on Merge

`.github/workflows/edge-functions.yml`:

```yaml
name: Edge Functions

on:
  push:
    branches: [main]
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Deploy to Staging
        run: |
          supabase link --project-ref ${{ secrets.STAGING_PROJECT_ID }}
          supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  deploy-production:
    needs: deploy
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Deploy to Production
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
          supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## Full CI/CD Pipeline

### Complete Workflow

`.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  # ============================================
  # LINT & TYPE CHECK
  # ============================================
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit

  # ============================================
  # TEST WITH LOCAL SUPABASE
  # ============================================
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - uses: supabase/setup-cli@v1

      - name: Start Supabase
        run: supabase start

      - name: Install & Test
        run: |
          npm ci
          npm test
        env:
          SUPABASE_URL: http://localhost:54321
          SUPABASE_ANON_KEY: ${{ steps.supabase.outputs.anon_key }}

      - name: Stop Supabase
        if: always()
        run: supabase stop

  # ============================================
  # BUILD
  # ============================================
  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/

  # ============================================
  # DEPLOY STAGING (on push to develop)
  # ============================================
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1

      - name: Deploy Migrations
        run: |
          supabase link --project-ref ${{ secrets.STAGING_PROJECT_ID }}
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Deploy Functions
        run: supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  # ============================================
  # DEPLOY PRODUCTION (on push to main)
  # ============================================
  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1

      - name: Deploy Migrations
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
          supabase db push --dry-run
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Deploy Functions
        run: supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## Branch-Based Environments

### Preview Branches with Supabase Branching

```yaml
name: Preview Branch

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  create-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1

      - name: Create Preview Branch
        id: branch
        run: |
          BRANCH_NAME="pr-${{ github.event.pull_request.number }}"
          supabase branches create $BRANCH_NAME --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
          echo "branch_name=$BRANCH_NAME" >> $GITHUB_OUTPUT
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Comment PR with Preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview branch created: `${{ steps.branch.outputs.branch_name }}`'
            })
```

---

## Package.json Scripts

Add these scripts for local development:

```json
{
  "scripts": {
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset",
    "db:types": "supabase gen types typescript --local > src/types/supabase.ts",
    "db:diff": "supabase db diff -f",
    "db:push": "supabase db push --dry-run && supabase db push",
    "db:pull": "supabase db pull",
    "functions:serve": "supabase functions serve",
    "functions:deploy": "supabase functions deploy",
    "migrate": "npm run db:reset && npm run db:types"
  }
}
```

---

**Line Count:** ~310
