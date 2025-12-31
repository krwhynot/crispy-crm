---
name: generate-patterns-github-workflows
directory: .github/workflows/
complexity: HIGH
output: .github/workflows/PATTERNS.md
---

# Generate PATTERNS.md for GitHub Actions Workflows

## Context

The `.github/workflows/` directory contains CI/CD pipeline definitions for Crispy CRM. These workflows automate code quality checks, security scanning, and Supabase deployments. Understanding these patterns is critical for maintaining reliable, secure automation.

**Key characteristics:**
- Three specialized workflows: CI, Security, and Supabase Deploy
- Concurrency management to prevent race conditions
- Environment-based deployment gates
- Secret management for Supabase credentials

## Phase 1: Exploration

Read these files in order:

1. `/home/krwhynot/projects/crispy-crm/.github/workflows/ci.yml`
   - **Purpose**: Main CI pipeline - lint, type check, build, and tests
   - **Key patterns**: Concurrency groups, npm caching, placeholder env vars for build

2. `/home/krwhynot/projects/crispy-crm/.github/workflows/security.yml`
   - **Purpose**: Dependency vulnerability scanning
   - **Key patterns**: Scheduled runs (weekly), production-only audit

3. `/home/krwhynot/projects/crispy-crm/.github/workflows/supabase-deploy.yml`
   - **Purpose**: Database migration and Edge Function deployment
   - **Key patterns**: Path filtering, dry-run safety, manual deployment gate, job dependencies

## Phase 2: Pattern Identification

Identify these patterns from the workflow files:

### Pattern A: Job Structure and Concurrency
- How jobs are named and organized
- Concurrency groups with `cancel-in-progress`
- Job dependencies with `needs:`
- `continue-on-error` for non-blocking jobs

### Pattern B: Caching Strategies
- Node.js setup with npm caching
- How `actions/setup-node@v4` handles cache
- When caching provides value vs overhead

### Pattern C: Environment and Secrets Management
- How secrets are referenced: `${{ secrets.NAME }}`
- Environment protection rules (`environment: production`)
- Placeholder values for build-time env vars
- Supabase CLI authentication pattern

### Pattern D: Conditional Execution
- Trigger conditions: `push`, `pull_request`, `schedule`, `workflow_dispatch`
- Path filtering: `paths: ['supabase/**']`
- Conditional jobs: `if: github.event_name == 'workflow_dispatch'`
- When to use each trigger type

### Pattern E: Safety Gates
- Dry-run before deploy pattern
- Manual trigger for production deployments
- `cancel-in-progress: false` for deploy workflows
- Audit level thresholds for security checks

## Phase 3: Generate PATTERNS.md

Use this structure for the output:

```markdown
# GitHub Workflows Patterns

CI/CD pipeline definitions for automated quality checks, security scanning, and Supabase deployments.

## Architecture Overview

```
Triggers                    Workflows                       Actions
───────────────────────────────────────────────────────────────────────
push:main ─────────────────→ ci.yml ──────────────────→ Lint
                               │                         Type Check
                               │                         Discovery Check
                               │                         Build
                               └─────────────────────→ test (non-blocking)

push:main ─────────────────→ security.yml ────────────→ npm audit
pull_request ──────────────→
schedule (weekly) ─────────→

push:main + supabase/** ───→ supabase-deploy.yml ─────→ Dry Run
workflow_dispatch ─────────→        │
                                    └─ (manual only) ─→ Deploy Migrations
                                                       Deploy Functions
```

---

## Pattern A: Job Structure and Concurrency

{Document how jobs are structured with names, dependencies, and concurrency}

**Concurrency Groups:**
```yaml
# .github/workflows/ci.yml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

**Job Dependencies:**
```yaml
# .github/workflows/supabase-deploy.yml
deploy:
  needs: dry-run
  if: github.event_name == 'workflow_dispatch'
```

**Non-blocking Jobs:**
```yaml
# .github/workflows/ci.yml
test:
  continue-on-error: true
```

**Key points:**
- Use `cancel-in-progress: true` for CI to save resources
- Use `cancel-in-progress: false` for deployments to prevent corruption
- `continue-on-error` allows pipeline to pass while fixing flaky tests
- `needs:` creates sequential job chains

---

## Pattern B: Caching Strategies

{Document npm caching via actions/setup-node}

```yaml
# All workflows
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'

- run: npm ci
```

**Key points:**
- `cache: 'npm'` automatically caches `~/.npm` between runs
- `npm ci` uses lockfile for reproducible installs
- Cache key derived from `package-lock.json` hash
- Node 22 is the project standard

---

## Pattern C: Environment and Secrets Management

{Document secrets and environment handling}

**Build-time Placeholders:**
```yaml
# .github/workflows/ci.yml
- name: Build
  run: npm run build
  env:
    VITE_SUPABASE_URL: https://placeholder.supabase.co
    VITE_SUPABASE_ANON_KEY: placeholder-key
```

**Runtime Secrets:**
```yaml
# .github/workflows/supabase-deploy.yml
- name: Deploy Migrations
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  run: |
    npx supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
    npx supabase db push
```

**Protected Environments:**
```yaml
deploy:
  environment: production
```

**Key points:**
- Build-time env vars can use placeholders (validated at runtime)
- Runtime secrets must be real values from GitHub Secrets
- `environment: production` enables approval gates
- Never log or echo secret values

---

## Pattern D: Conditional Execution

{Document trigger types and conditions}

**Multi-trigger Workflow:**
```yaml
# .github/workflows/security.yml
on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 9 * * 1'  # Weekly Monday 9 AM UTC
```

**Path Filtering:**
```yaml
# .github/workflows/supabase-deploy.yml
on:
  push:
    branches: [main]
    paths:
      - 'supabase/**'
```

**Conditional Jobs:**
```yaml
deploy:
  if: github.event_name == 'workflow_dispatch'
```

**Key points:**
- `push` + `pull_request` covers all code changes
- `schedule` for periodic checks (security, stale data)
- `workflow_dispatch` for manual triggers (production deploys)
- `paths:` prevents unnecessary runs

---

## Pattern E: Safety Gates

{Document safety mechanisms for deployments}

**Dry-Run Before Deploy:**
```yaml
# .github/workflows/supabase-deploy.yml
dry-run:
  steps:
    - run: npx supabase db push --dry-run

deploy:
  needs: dry-run
  if: github.event_name == 'workflow_dispatch'
```

**Security Thresholds:**
```yaml
# .github/workflows/security.yml
- name: npm audit
  run: npm audit --audit-level=high --production
```

**Key points:**
- Always dry-run migrations before applying
- Manual trigger (`workflow_dispatch`) for production changes
- `--audit-level=high` ignores low/moderate vulnerabilities
- `--production` excludes devDependencies from audit

---

## Pattern Comparison Table

| Aspect | CI | Security | Supabase Deploy |
|--------|-----|----------|-----------------|
| **Trigger** | push, PR | push, PR, schedule | push + paths, manual |
| **Concurrency** | cancel-in-progress | none | no cancel (deploys) |
| **Secrets** | placeholders only | none | Supabase tokens |
| **Blocking** | Yes (except tests) | Yes | Manual gate |
| **Environment** | none | none | production |

---

## Anti-Patterns to Avoid

### 1. Hardcoded Secrets

```yaml
# BAD: Secrets in workflow file
env:
  SUPABASE_ACCESS_TOKEN: sbp_abc123...

# GOOD: Use GitHub Secrets
env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### 2. Missing Concurrency Controls

```yaml
# BAD: No concurrency group (parallel runs can conflict)
on:
  push:
    branches: [main]

# GOOD: Explicit concurrency management
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

### 3. Auto-deploying to Production

```yaml
# BAD: Automatic production deploy on push
deploy:
  needs: dry-run
  # No conditional - deploys on every push!

# GOOD: Manual trigger required
deploy:
  needs: dry-run
  if: github.event_name == 'workflow_dispatch'
  environment: production
```

### 4. Ignoring Dry-Run Results

```yaml
# BAD: Deploy without checking dry-run
- run: npx supabase db push --dry-run || true
- run: npx supabase db push  # Proceeds even if dry-run failed

# GOOD: Dry-run as separate blocking job
dry-run:
  steps:
    - run: npx supabase db push --dry-run

deploy:
  needs: dry-run  # Only runs if dry-run succeeds
```

---

## New Workflow Checklist

When adding a new workflow:

1. [ ] Name the file descriptively: `{purpose}.yml`
2. [ ] Set appropriate triggers (`on:` section)
3. [ ] Add concurrency group if needed
4. [ ] Use `actions/checkout@v4` as first step
5. [ ] Cache dependencies with `actions/setup-node@v4` cache option
6. [ ] Use `npm ci` (not `npm install`) for reproducibility
7. [ ] Reference secrets via `${{ secrets.NAME }}`
8. [ ] Add dry-run step before destructive operations
9. [ ] Use `environment:` for production deployments
10. [ ] Verify: Push to a feature branch and check Actions tab

---

## File Reference

| Pattern | Primary Files |
|---------|---------------|
| **A: Job Structure** | All workflow files |
| **B: Caching** | `ci.yml`, `security.yml` |
| **C: Secrets** | `supabase-deploy.yml` |
| **D: Conditional** | `security.yml` (schedule), `supabase-deploy.yml` (paths) |
| **E: Safety Gates** | `supabase-deploy.yml` (dry-run + manual) |
```

## Phase 4: Write the File

Write the generated PATTERNS.md to:
`/home/krwhynot/projects/crispy-crm/.github/workflows/PATTERNS.md`

After writing, verify:
1. All referenced files exist in `.github/workflows/`
2. YAML examples match actual workflow syntax
3. ASCII diagram reflects current workflow structure
