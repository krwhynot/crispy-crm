# GitHub Workflows Patterns

CI/CD pipeline definitions for automated quality checks, security scanning, and Supabase deployments.

## Architecture Overview

```
Triggers                    Workflows                       Actions
───────────────────────────────────────────────────────────────────────
push:main ─────────────────→ ci.yml ──────────────────→ Lint
pull_request ──────────────→    │                        Type Check
                                │                        Discovery Check
                                │                        Build
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

Jobs are organized with descriptive names and explicit dependencies. Concurrency controls prevent conflicting parallel runs.

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
  name: Tests
  runs-on: ubuntu-latest
  continue-on-error: true
```

**Key points:**
- Use `cancel-in-progress: true` for CI to save resources on superseded runs
- Use `cancel-in-progress: false` for deployments to prevent corruption
- `continue-on-error` allows pipeline to pass while fixing flaky tests
- `needs:` creates sequential job chains (deploy waits for dry-run)

---

## Pattern B: Caching Strategies

Node.js dependencies are cached automatically via `actions/setup-node`.

```yaml
# All workflows using Node.js
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'

- run: npm ci
```

**Key points:**
- `cache: 'npm'` automatically caches `~/.npm` between runs
- `npm ci` uses lockfile for reproducible installs (not `npm install`)
- Cache key derived from `package-lock.json` hash automatically
- Node 22 is the project standard

---

## Pattern C: Environment and Secrets Management

Different handling for build-time placeholders vs runtime secrets.

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
- name: Link & Dry Run
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  run: |
    npx supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
    npx supabase db push --dry-run
```

**Protected Environments:**
```yaml
# .github/workflows/supabase-deploy.yml
deploy:
  environment: production
```

**Key points:**
- Build-time env vars can use placeholders (validated at runtime by the app)
- Runtime secrets must be real values from GitHub Settings > Secrets
- `environment: production` enables approval gates in GitHub
- Never log or echo secret values in workflow steps

---

## Pattern D: Conditional Execution

Different trigger types serve different purposes.

**Discovery Freshness Check:**

The project uses pre-computed discovery files (`.claude/state/`) for codebase inventory. When the codebase structure changes, these files become stale and should be refreshed before committing.

Currently, discovery freshness is verified manually via the `discovery-first` skill and verified in code reviews. Future workflow integration could automate this check during CI.

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
# .github/workflows/supabase-deploy.yml
deploy:
  if: github.event_name == 'workflow_dispatch'
```

**Key points:**
- `push` + `pull_request` covers all code changes
- `schedule` for periodic checks (security audits, stale data cleanup)
- `workflow_dispatch` for manual triggers (production deploys)
- `paths:` prevents unnecessary workflow runs when unrelated files change

---

## Pattern E: Safety Gates

Multiple layers protect production from accidental or broken deployments.

**Dry-Run Before Deploy:**
```yaml
# .github/workflows/supabase-deploy.yml
dry-run:
  name: Migration Dry Run
  steps:
    - name: Link & Dry Run
      run: |
        npx supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        npx supabase db push --dry-run

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
- Always dry-run migrations before applying to production
- Manual trigger (`workflow_dispatch`) required for production changes
- `--audit-level=high` ignores low/moderate vulnerabilities (reduces noise)
- `--production` excludes devDependencies from security audit

---

## Pattern Comparison Table

| Aspect | CI | Security | Supabase Deploy |
|--------|-----|----------|-----------------|
| **Trigger** | push, PR | push, PR, schedule | push + paths, manual |
| **Concurrency** | cancel-in-progress | none | no cancel (deploys) |
| **Secrets** | placeholders only | none | Supabase tokens |
| **Blocking** | Yes (except tests) | Yes | Manual gate |
| **Environment** | none | none | production |
| **CLI Setup** | actions/setup-node | actions/setup-node | supabase/setup-cli |

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
3. [ ] Add concurrency group if workflow can conflict with itself
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
