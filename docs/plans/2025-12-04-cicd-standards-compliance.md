# CI/CD Standards Compliance Plan

**Date:** 2025-12-04
**Source:** `docs/reviews/2025-12-04-cicd-deployment-review.md`
**Scope:** All 20 issues (CRITICAL → LOW) across 4 phases
**Granularity:** Atomic (2-5 min tasks)
**Execution:** Hybrid - Phase 1 sequential, Phases 2-4 parallel where safe

---

## Plan Summary

| Metric | Value |
|--------|-------|
| Total Issues | 20 |
| Total Tasks | 38 |
| Parallelizable | 24 (63%) |
| Sequential (Phase 1) | 8 |
| Estimated Agents | 6-8 parallel |

---

## Constitution Compliance Checklist

Every task must verify:
- [ ] **Fail-Fast:** No retry logic, circuit breakers, or `continue-on-error`
- [ ] **Single Source of Truth:** Environment vars only in GitHub Secrets / Vercel
- [ ] **Security:** No credentials in code, all secrets via `${{ secrets.* }}`
- [ ] **Permissions:** Minimal required (principle of least privilege)

---

## Phase 1: Emergency Security (SEQUENTIAL - Do First)

> ⚠️ **CRITICAL:** These tasks MUST be done sequentially using the "make-before-break" pattern:
> 1. Create NEW credentials first
> 2. Update deployment targets (Vercel, GitHub Secrets) with NEW credentials
> 3. Verify application works with NEW credentials
> 4. THEN remove old credentials from git tracking
> 5. THEN revoke OLD credentials
>
> This ensures zero downtime and closes the vulnerability window safely.

### Task 1.1: Assess Current Exposure

**File:** None (investigation only)
**Time:** 2 min
**Dependencies:** None

```bash
# Check which .env files are tracked in git
git ls-files | grep -E "^\.env"

# Expected output (these are the problem files):
# .env
# .env.cloud
# .env.local
# .env.memory-optimized
```

**Verification:**
```bash
# Count tracked .env files
git ls-files | grep -E "^\.env" | wc -l
# Expected: 5 or more (problem confirmed)
```

---

### Task 1.2: Create Secure .gitignore

**File:** `.gitignore`
**Time:** 3 min
**Dependencies:** Task 1.1

**Current State (lines 27-38):**
```gitignore
# Environment files - Phase 1 Security Remediation
# Keep these files (committed):
# .env.example - Template showing structure
# .env.local - Local development config (safe Docker keys)

# Ignore these:
.env                        # Active configuration (copied from .env.local or .env.cloud)
.env.*                      # Catch-all: .env.production, .env.staging, .env.development, .env.test, etc.
.env.cloud                  # Cloud config with API keys (not committed)
!.env.example               # Exception: Keep .env.example (template)
!.env.local                 # Exception: Keep .env.local (safe Docker keys)
.env-archive/               # Archived old env files
```

**Problem:** `!.env.local` exception allows credentials to be committed.

**Replace with:**
```gitignore
# Environment files - SECURITY CRITICAL
# ONLY .env.example and .env.test.example are allowed in git
.env
.env.*
!.env.example
!.env.test.example
.env-archive/
```

**Edit command:**
```bash
# In .gitignore, replace lines 27-38 with the secure version above
```

**Verification:**
```bash
grep -n "!.env.local" .gitignore
# Expected: No output (exception removed)
```

---

### Task 1.3: Remove Credentials from Git Tracking

**File:** Git index
**Time:** 3 min
**Dependencies:** Task 1.2

```bash
# Remove sensitive files from git tracking (keeps local copies)
git rm --cached .env .env.cloud .env.local .env.memory-optimized 2>/dev/null || true

# Stage the .gitignore changes
git add .gitignore

# Commit the removal
git commit -m "security: remove committed environment files with credentials

BREAKING: .env files are no longer tracked in git.
- Removed .env, .env.cloud, .env.local, .env.memory-optimized from tracking
- Updated .gitignore to prevent future commits
- Only .env.example and .env.test.example remain tracked

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Verification:**
```bash
git ls-files | grep -E "^\.env" | grep -v example
# Expected: Empty output (no .env files tracked except examples)
```

---

### Task 1.4: Backup Current Credentials

**File:** Local backup (not committed)
**Time:** 2 min
**Dependencies:** Task 1.3

```bash
# Create local backup before rotation
mkdir -p ~/.crispy-crm-backup
cp .env.cloud ~/.crispy-crm-backup/.env.cloud.backup.$(date +%Y%m%d)
cp .env.local ~/.crispy-crm-backup/.env.local.backup.$(date +%Y%m%d)

echo "Credentials backed up to ~/.crispy-crm-backup/"
ls -la ~/.crispy-crm-backup/
```

**Verification:**
```bash
ls ~/.crispy-crm-backup/*.backup.* | wc -l
# Expected: 2 or more backup files
```

---

### Task 1.5: Document Credential Rotation Steps

**File:** `docs/runbooks/credential-rotation.md` (CREATE)
**Time:** 5 min
**Dependencies:** Task 1.4

```markdown
# Credential Rotation Runbook

## When to Use
- After credential exposure (git commit, logs, etc.)
- Scheduled rotation (every 90 days)
- Employee offboarding

## Supabase Credentials

### Step 1: Generate New Keys (Supabase Dashboard)
1. Go to: https://supabase.com/dashboard/project/_/settings/api-keys
2. Note: You CANNOT regenerate anon/service_role keys
3. For a compromised anon key: Create new Supabase project (nuclear option)
4. For service_role: Same as above

### Step 2: Update GitHub Secrets
1. Go to: Repository Settings → Secrets and variables → Actions
2. Update these secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_PROJECT_REF`
   - `SUPABASE_ACCESS_TOKEN`

### Step 3: Update Vercel Environment Variables
1. Go to: Vercel Dashboard → Project → Settings → Environment Variables
2. Update the same variables for Production, Preview, and Development

### Step 4: Update Local Development
1. Copy new credentials to `.env.local`
2. Restart development server

### Step 5: Verify
```bash
# Test Supabase connection
npx supabase db ping
# Expected: "Connection successful"
```

## Verification Checklist
- [ ] Old credentials no longer work
- [ ] New credentials work in CI/CD
- [ ] New credentials work in Vercel
- [ ] New credentials work locally
- [ ] All team members notified to update local .env
```

**Verification:**
```bash
test -f docs/runbooks/credential-rotation.md && echo "PASS" || echo "FAIL"
# Expected: PASS
```

---

### Task 1.6: Enable GitHub Secret Scanning

**File:** GitHub Repository Settings (manual)
**Time:** 2 min
**Dependencies:** Task 1.3

**Manual Steps:**
1. Go to: Repository → Settings → Code security and analysis
2. Enable: "Secret scanning"
3. Enable: "Push protection" (blocks future secret commits)

**Verification:**
```bash
# Check via GitHub API (requires gh CLI authenticated)
gh api repos/{owner}/{repo} --jq '.security_and_analysis.secret_scanning.status'
# Expected: "enabled"
```

---

### Task 1.7: Push Changes to Remote

**File:** Git remote
**Time:** 2 min
**Dependencies:** Task 1.3, Task 1.6

```bash
git push origin main
```

**Verification:**
```bash
git status
# Expected: "Your branch is up to date with 'origin/main'"
```

---

### Task 1.8: Create Pre-Commit Hook for .env Files

**File:** `.husky/pre-commit` (if using Husky) or `.git/hooks/pre-commit`
**Time:** 3 min
**Dependencies:** Task 1.7

```bash
# Check if .env files are staged (except examples)
if git diff --cached --name-only | grep -E '^\.env' | grep -v 'example'; then
    echo "❌ ERROR: Attempting to commit .env file(s)!"
    echo "These files contain credentials and must not be committed."
    echo ""
    echo "To unstage these files, run:"
    echo "  git reset HEAD <file>"
    exit 1
fi
```

**Verification:**
```bash
# Try to stage a fake .env file
echo "test" > .env.test-hook
git add .env.test-hook
# Pre-commit hook should block this
# Clean up: git reset HEAD .env.test-hook && rm .env.test-hook
```

---

## Phase 2: CI/CD Hardening (PARALLEL GROUP A)

> These tasks can run in parallel as they modify different files.

### Task 2.1: Enable CSP Enforcement

**File:** `vercel.json`
**Line:** 19
**Time:** 2 min
**Dependencies:** Phase 1 complete
**Parallel Group:** A

**Current:**
```json
"key": "Content-Security-Policy-Report-Only",
```

**Replace with:**
```json
"key": "Content-Security-Policy",
```

**Verification:**
```bash
grep -n "Content-Security-Policy" vercel.json | head -1
# Expected: Line 19 showing "Content-Security-Policy" (not Report-Only)
```

---

### Task 2.2: Remove Test continue-on-error

**File:** `.github/workflows/ci.yml`
**Line:** 41
**Time:** 2 min
**Dependencies:** Phase 1 complete
**Parallel Group:** A

**Current:**
```yaml
  test:
    name: Tests
    runs-on: ubuntu-latest
    continue-on-error: true  # DELETE THIS LINE
```

**Replace with:**
```yaml
  test:
    name: Tests
    runs-on: ubuntu-latest
```

**Verification:**
```bash
grep -n "continue-on-error" .github/workflows/ci.yml
# Expected: No output (line removed)
```

---

### Task 2.3: Remove Edge Functions Error Suppression

**File:** `.github/workflows/supabase-deploy.yml`
**Line:** 55
**Time:** 2 min
**Dependencies:** Phase 1 complete
**Parallel Group:** A

**Current:**
```yaml
        run: npx supabase functions deploy || true
```

**Replace with:**
```yaml
        run: npx supabase functions deploy
```

**Verification:**
```bash
grep -n "|| true" .github/workflows/supabase-deploy.yml
# Expected: No output (suppression removed)
```

---

### Task 2.4: Add CI Workflow Permissions

**File:** `.github/workflows/ci.yml`
**Time:** 3 min
**Dependencies:** Phase 1 complete
**Parallel Group:** A

**Add after line 10 (after concurrency block):**
```yaml
permissions:
  contents: read
```

**Full context:**
```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
```

**Verification:**
```bash
grep -A1 "permissions:" .github/workflows/ci.yml | head -2
# Expected: "permissions:" followed by "contents: read"
```

---

### Task 2.5: Add Security Workflow Concurrency

**File:** `.github/workflows/security.yml`
**Time:** 2 min
**Dependencies:** Phase 1 complete
**Parallel Group:** A

**Add after line 8 (after schedule block):**
```yaml
concurrency:
  group: security-${{ github.ref }}
  cancel-in-progress: true
```

**Verification:**
```bash
grep -n "concurrency:" .github/workflows/security.yml
# Expected: Line number showing concurrency block exists
```

---

### Task 2.6: Add Supabase Deploy Permissions

**File:** `.github/workflows/supabase-deploy.yml`
**Time:** 2 min
**Dependencies:** Phase 1 complete
**Parallel Group:** A

**Add after line 12 (after concurrency block):**
```yaml
permissions:
  contents: read
```

**Verification:**
```bash
grep -A1 "permissions:" .github/workflows/supabase-deploy.yml | head -2
# Expected: "permissions:" followed by "contents: read"
```

---

## Phase 2: CI/CD Hardening (PARALLEL GROUP B)

### Task 2.7: Restore Gitleaks from Backup Security Workflow

**File:** `.github/workflows/security.yml`
**Time:** 5 min
**Dependencies:** Task 2.5 complete
**Parallel Group:** B

**Replace entire file with merged content from backup:**
```yaml
name: Security

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 9 * * 1'  # Weekly Monday 9 AM UTC

concurrency:
  group: security-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read
  security-events: write

jobs:
  gitleaks:
    name: Secret Scanning (Gitleaks)
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          args: --verbose --redact

      - name: Upload Gitleaks results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: gitleaks-report
          path: gitleaks-report.json
          retention-days: 30

  audit:
    name: Dependency Audit
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci

      - name: npm audit
        run: npm audit --audit-level=high --production

  summary:
    name: Security Summary
    runs-on: ubuntu-latest
    needs: [gitleaks, audit]
    if: always()
    timeout-minutes: 2
    steps:
      - name: Check Results
        run: |
          if [ "${{ needs.gitleaks.result }}" = "success" ] && [ "${{ needs.audit.result }}" = "success" ]; then
            echo "✅ All security checks passed"
          else
            echo "❌ Security checks failed"
            exit 1
          fi
```

**Verification:**
```bash
grep -c "gitleaks" .github/workflows/security.yml
# Expected: 4 or more (gitleaks job and references)
```

---

### Task 2.8: Add Artifact Attestations to CI

**File:** `.github/workflows/ci.yml`
**Time:** 5 min
**Dependencies:** Task 2.4 complete
**Parallel Group:** B

**Update permissions block:**
```yaml
permissions:
  contents: read
  id-token: write
  attestations: write
```

**Add step after build in check job:**
```yaml
      - name: Generate artifact attestation
        uses: actions/attest-build-provenance@v2
        with:
          subject-path: 'dist/**/*'
```

**Verification:**
```bash
grep -n "attest-build-provenance" .github/workflows/ci.yml
# Expected: Line number showing attestation step exists
```

---

### Task 2.9: Restore Coverage Reporting from Backup CI

**File:** `.github/workflows/ci.yml`
**Time:** 5 min
**Dependencies:** Task 2.2 complete
**Parallel Group:** B

**Replace test job with:**
```yaml
  test:
    name: Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci

      - name: Run Tests with Coverage
        run: npm run test:coverage

      - name: Check Coverage Threshold
        run: |
          COVERAGE=$(npm run test:coverage 2>&1 | grep -oP 'All files.*\|\s+\K[0-9]+(?=\.[0-9]+)' | head -1 || echo "0")
          echo "Coverage: $COVERAGE%"
          if [ "$COVERAGE" -lt 70 ]; then
            echo "❌ Coverage $COVERAGE% is below minimum threshold of 70%"
            exit 1
          fi
          echo "✅ Coverage $COVERAGE% meets minimum threshold"

      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        if: always()
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: false
          token: ${{ secrets.CODECOV_TOKEN }}
```

**Verification:**
```bash
grep -n "test:coverage" .github/workflows/ci.yml
# Expected: Line number showing coverage command
```

---

## Phase 3: Production Readiness (PARALLEL GROUP C)

### Task 3.1: Add E2E Tests to CI

**File:** `.github/workflows/ci.yml`
**Time:** 5 min
**Dependencies:** Phase 2 complete
**Parallel Group:** C

**Add new job after test job:**
```yaml
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

**Verification:**
```bash
grep -n "E2E Tests" .github/workflows/ci.yml
# Expected: Line number showing E2E job name
```

---

### Task 3.2: Create CODEOWNERS File

**File:** `.github/CODEOWNERS` (CREATE)
**Time:** 3 min
**Dependencies:** Phase 2 complete
**Parallel Group:** C

```
# Security-sensitive files require review
/.github/workflows/ @krwhynot
/supabase/migrations/ @krwhynot
/.env* @krwhynot
/src/atomic-crm/providers/ @krwhynot
/vercel.json @krwhynot

# Core CRM features
/src/atomic-crm/ @krwhynot
```

**Verification:**
```bash
test -f .github/CODEOWNERS && echo "PASS" || echo "FAIL"
# Expected: PASS
```

---

### Task 3.3: Create Dependabot Configuration

**File:** `.github/dependabot.yml` (CREATE)
**Time:** 3 min
**Dependencies:** Phase 2 complete
**Parallel Group:** C

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    groups:
      production-dependencies:
        dependency-type: "production"
      development-dependencies:
        dependency-type: "development"
    ignore:
      # Ignore major version updates for React (manual upgrade)
      - dependency-name: "react"
        update-types: ["version-update:semver-major"]
      - dependency-name: "react-dom"
        update-types: ["version-update:semver-major"]

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
```

**Verification:**
```bash
test -f .github/dependabot.yml && echo "PASS" || echo "FAIL"
# Expected: PASS
```

---

### Task 3.4: Enable Vercel Speed Insights

**File:** `vercel.json`
**Time:** 2 min
**Dependencies:** Phase 2 complete
**Parallel Group:** C

**Add before closing brace:**
```json
  "analytics": { "enabled": true },
  "speedInsights": { "enabled": true }
```

**Full context (end of file):**
```json
  "regions": ["iad1"],
  "analytics": { "enabled": true },
  "speedInsights": { "enabled": true }
}
```

**Verification:**
```bash
grep -n "speedInsights" vercel.json
# Expected: Line number showing speedInsights config
```

---

### Task 3.5: Create Production Launch Checklist

**File:** `docs/checklists/production-launch.md` (CREATE)
**Time:** 5 min
**Dependencies:** Phase 2 complete
**Parallel Group:** C

```markdown
# Production Launch Checklist

## Pre-Launch (1 week before)

### Security
- [ ] All credentials rotated (not from git history)
- [ ] GitHub Secret Scanning enabled
- [ ] Push protection enabled
- [ ] Gitleaks passing in CI
- [ ] npm audit shows no high/critical vulnerabilities
- [ ] CSP enforcing (not Report-Only)
- [ ] RLS policies verified on all tables

### CI/CD
- [ ] All tests passing (unit + E2E)
- [ ] Coverage threshold met (70%+)
- [ ] Build succeeds without warnings
- [ ] Type check passes
- [ ] Lint passes

### Infrastructure
- [ ] Vercel production environment configured
- [ ] Supabase production project ready
- [ ] Edge Functions deployed and tested
- [ ] Database migrations applied
- [ ] Backups configured

### Monitoring
- [ ] Sentry configured for error tracking
- [ ] Vercel Analytics enabled
- [ ] Speed Insights enabled

## Launch Day

### Deployment
- [ ] Final migration dry-run successful
- [ ] Deploy to production via workflow_dispatch
- [ ] Verify Edge Functions running
- [ ] Smoke test critical paths

### Verification
- [ ] Login flow works
- [ ] Data loads correctly
- [ ] Forms submit successfully
- [ ] Error boundaries not triggered

## Post-Launch (24 hours)

- [ ] Monitor error rates in Sentry
- [ ] Check Vercel Analytics for performance
- [ ] Verify no 500 errors in logs
- [ ] Confirm backups running
```

**Verification:**
```bash
test -f docs/checklists/production-launch.md && echo "PASS" || echo "FAIL"
# Expected: PASS
```

---

### Task 3.6: Create Database Rollback Runbook

**File:** `docs/runbooks/database-rollback.md` (CREATE)
**Time:** 5 min
**Dependencies:** Phase 2 complete
**Parallel Group:** C

```markdown
# Database Rollback Runbook

## When to Use
- Migration causes data corruption
- Breaking schema change deployed
- Need to revert to previous state

## Before You Start

⚠️ **WARNING:** Rollbacks can cause data loss. Always verify backups first.

## Step 1: Identify the Problem

```bash
# Check recent migrations
npx supabase migration list

# Check Supabase logs
# Go to: https://supabase.com/dashboard/project/_/logs
```

## Step 2: Point-in-Time Recovery (Preferred)

Supabase Pro plans support PITR:

1. Go to: Supabase Dashboard → Database → Backups
2. Select point-in-time before the bad migration
3. Click "Restore"

## Step 3: Manual Rollback (If No PITR)

### Option A: Revert Migration SQL

Create a new migration that undoes the changes:

```bash
npx supabase migration new rollback_<migration_name>
```

### Option B: Reset to Backup

```bash
# Download latest backup from Supabase Dashboard
# Restore using pg_restore
pg_restore -d postgres://[connection-string] backup.dump
```

## Step 4: Deploy Rollback

```bash
# Dry run first
npx supabase db push --dry-run

# If safe, deploy
npx supabase db push
```

## Step 5: Verify

- [ ] Application connects successfully
- [ ] Data integrity verified
- [ ] No console errors
- [ ] Critical flows working

## Contact

For emergencies, contact the database owner via the team Slack channel.
```

**Verification:**
```bash
test -f docs/runbooks/database-rollback.md && echo "PASS" || echo "FAIL"
# Expected: PASS
```

---

### Task 3.7: Add Node Engine to package.json

**File:** `package.json`
**Time:** 2 min
**Dependencies:** Phase 2 complete
**Parallel Group:** C

**Add to package.json (top level):**
```json
"engines": {
  "node": ">=22.0.0",
  "npm": ">=10.0.0"
}
```

**Verification:**
```bash
grep -A2 '"engines"' package.json
# Expected: "node": ">=22.0.0"
```

---

### Task 3.8: Update .env.example with CAPTCHA Vars

**File:** `.env.example`
**Time:** 2 min
**Dependencies:** Phase 2 complete
**Parallel Group:** C

**Add to .env.example:**
```env
# CAPTCHA (optional - for bot protection)
# VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
# TURNSTILE_SECRET_KEY=your-turnstile-secret-key
```

**Verification:**
```bash
grep -n "CAPTCHA" .env.example
# Expected: Line number showing CAPTCHA section
```

---

### Task 3.9: Update .env.example with SMTP Vars

**File:** `.env.example`
**Time:** 2 min
**Dependencies:** Task 3.8 complete
**Parallel Group:** C

**Add to .env.example:**
```env
# SMTP (optional - for custom email provider)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your-smtp-user
# SMTP_PASS=your-smtp-password
# SMTP_FROM=noreply@yourdomain.com
```

**Verification:**
```bash
grep -n "SMTP" .env.example
# Expected: Line number showing SMTP section
```

---

### Task 3.10: Use Secrets with Fallback for CI Build

**File:** `.github/workflows/ci.yml`
**Time:** 3 min
**Dependencies:** Task 2.8 complete
**Parallel Group:** C

**Update build step env vars:**
```yaml
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL || 'https://placeholder.supabase.co' }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY || 'placeholder-key' }}
```

**Verification:**
```bash
grep -A3 "Build" .github/workflows/ci.yml | grep "secrets.VITE"
# Expected: Line showing secrets with fallback
```

---

## Phase 4: Git History Cleanup (SEQUENTIAL - Team Coordination Required)

> ⚠️ **CRITICAL:** This phase rewrites git history. All team members must re-clone after completion.

### Task 4.1: Notify Team of Upcoming History Rewrite

**File:** None (communication)
**Time:** 2 min
**Dependencies:** Phases 1-3 complete

**Action:**
1. Post in team Slack/channel:
   ```
   ⚠️ GIT HISTORY REWRITE SCHEDULED

   We're purging exposed credentials from git history.
   After completion, everyone must:
   1. Backup any local changes
   2. Delete your local clone
   3. Re-clone the repository

   ETA: [provide time]
   ```

**Verification:** Team acknowledgment received

---

### Task 4.2: Create Fresh Mirror Clone

**File:** New directory
**Time:** 3 min
**Dependencies:** Task 4.1

```bash
# Clone outside the main repo
cd /tmp
git clone --mirror git@github.com:krwhynot/crispy-crm.git crispy-crm-cleanup
cd crispy-crm-cleanup
```

**Verification:**
```bash
pwd
# Expected: /tmp/crispy-crm-cleanup
```

---

### Task 4.3: Install git-filter-repo

**File:** System package
**Time:** 2 min
**Dependencies:** Task 4.2

```bash
pip install git-filter-repo
# OR on Ubuntu:
# sudo apt install git-filter-repo
```

**Verification:**
```bash
git-filter-repo --version
# Expected: Version number displayed
```

---

### Task 4.4: Remove Sensitive Files from History

**File:** Git history
**Time:** 5 min
**Dependencies:** Task 4.3

```bash
cd /tmp/crispy-crm-cleanup

# Remove all .env files except examples
git filter-repo \
  --path .env \
  --path .env.cloud \
  --path .env.local \
  --path .env.memory-optimized \
  --invert-paths
```

**Verification:**
```bash
# Verify files no longer in history
git log --all --full-history -- .env.cloud
# Expected: No commits (empty output)
```

---

### Task 4.5: Force Push Cleaned History

**File:** Git remote
**Time:** 3 min
**Dependencies:** Task 4.4

```bash
cd /tmp/crispy-crm-cleanup

# Force push all branches
git push origin --force --all

# Force push all tags
git push origin --force --tags
```

**Verification:**
```bash
# Check remote is updated
git ls-remote origin | head -5
# Expected: New commit hashes
```

---

### Task 4.6: Re-clone and Verify

**File:** Fresh clone
**Time:** 3 min
**Dependencies:** Task 4.5

```bash
cd ~/projects
rm -rf crispy-crm
git clone git@github.com:krwhynot/crispy-crm.git
cd crispy-crm

# Verify no .env files in history
git log --all --full-history -- .env.cloud
```

**Verification:**
```bash
git log --all --full-history -- .env.cloud | wc -l
# Expected: 0 (no commits found)
```

---

### Task 4.7: Notify Team History Rewrite Complete

**File:** None (communication)
**Time:** 2 min
**Dependencies:** Task 4.6

**Action:**
1. Post in team Slack/channel:
   ```
   ✅ GIT HISTORY REWRITE COMPLETE

   The repository has been cleaned. Please:
   1. Delete your local clone: rm -rf crispy-crm
   2. Re-clone: git clone git@github.com:krwhynot/crispy-crm.git
   3. Copy your .env files back (they were not pushed to remote)

   Old clones will have orphaned commits and should not be used.
   ```

**Verification:** Team acknowledgment received

---

### Task 4.8: Clean Up Temporary Files

**File:** Temporary directories
**Time:** 2 min
**Dependencies:** Task 4.7

```bash
rm -rf /tmp/crispy-crm-cleanup
rm -rf ~/.crispy-crm-backup  # Optional: keep for 30 days
```

**Verification:**
```bash
test -d /tmp/crispy-crm-cleanup && echo "FAIL: cleanup dir exists" || echo "PASS"
# Expected: PASS
```

---

## Execution Dependencies Graph

```
Phase 1 (Sequential):
1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7 → 1.8

Phase 2 (Parallel Group A):      Phase 2 (Parallel Group B):
┌──────────────────────────┐     ┌──────────────────────────┐
│ 2.1 CSP Enforcement      │     │ 2.7 Restore Gitleaks     │
│ 2.2 Remove continue-err  │ ──► │ 2.8 Artifact Attestations│
│ 2.3 Remove || true       │     │ 2.9 Coverage Reporting   │
│ 2.4 CI Permissions       │     └──────────────────────────┘
│ 2.5 Security Concurrency │
│ 2.6 Deploy Permissions   │
└──────────────────────────┘

Phase 3 (Parallel Group C):
┌─────────────────────────────────────────────────────────────┐
│ 3.1 E2E Tests    │ 3.4 Speed Insights │ 3.7 Node Engine    │
│ 3.2 CODEOWNERS   │ 3.5 Launch Checklist│ 3.8 CAPTCHA Vars  │
│ 3.3 Dependabot   │ 3.6 Rollback Runbook│ 3.9 SMTP Vars     │
│                  │                     │ 3.10 Build Secrets │
└─────────────────────────────────────────────────────────────┘

Phase 4 (Sequential - Team Coordination):
4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7 → 4.8
```

---

## Agent Dispatch Plan

| Agent # | Tasks | Estimated Time |
|---------|-------|----------------|
| Agent 1 | 1.1-1.8 (Phase 1 - Sequential) | 25 min |
| Agent 2 | 2.1, 2.2, 2.3 | 6 min |
| Agent 3 | 2.4, 2.5, 2.6 | 6 min |
| Agent 4 | 2.7, 2.8, 2.9 | 15 min |
| Agent 5 | 3.1, 3.2, 3.3 | 11 min |
| Agent 6 | 3.4, 3.5, 3.6 | 12 min |
| Agent 7 | 3.7, 3.8, 3.9, 3.10 | 9 min |
| Agent 8 | 4.1-4.8 (Phase 4 - Sequential) | 22 min |

**Parallel Execution Strategy:**
- Phase 1: Single agent (security-critical, must be sequential)
- Phase 2: Agents 2-4 run in parallel
- Phase 3: Agents 5-7 run in parallel
- Phase 4: Single agent (history rewrite, must be sequential)

---

## Post-Execution Verification

Run this script after all tasks complete:

```bash
#!/bin/bash
echo "═══════════════════════════════════════════════════════════"
echo "CI/CD Standards Compliance - Final Verification"
echo "═══════════════════════════════════════════════════════════"

PASS=0
FAIL=0

check() {
    if eval "$2"; then
        echo "✅ $1"
        ((PASS++))
    else
        echo "❌ $1"
        ((FAIL++))
    fi
}

# Phase 1 Checks
check "No .env files tracked (except examples)" \
    '[ $(git ls-files | grep -E "^\.env" | grep -v example | wc -l) -eq 0 ]'

check ".gitignore blocks .env.local" \
    '! grep -q "!.env.local" .gitignore'

check "Pre-commit hook exists" \
    '[ -f .husky/pre-commit ] || [ -f .git/hooks/pre-commit ]'

check "Credential rotation runbook exists" \
    '[ -f docs/runbooks/credential-rotation.md ]'

# Phase 2 Checks
check "CSP enforcing (not Report-Only)" \
    'grep -q "\"Content-Security-Policy\"" vercel.json && ! grep -q "Report-Only" vercel.json'

check "No continue-on-error in CI" \
    '! grep -q "continue-on-error" .github/workflows/ci.yml'

check "No || true in supabase-deploy" \
    '! grep -q "|| true" .github/workflows/supabase-deploy.yml'

check "CI has permissions block" \
    'grep -q "permissions:" .github/workflows/ci.yml'

check "Security has concurrency" \
    'grep -q "concurrency:" .github/workflows/security.yml'

check "Gitleaks in security workflow" \
    'grep -q "gitleaks" .github/workflows/security.yml'

check "Artifact attestations in CI" \
    'grep -q "attest-build-provenance" .github/workflows/ci.yml'

check "Coverage reporting in CI" \
    'grep -q "test:coverage" .github/workflows/ci.yml'

# Phase 3 Checks
check "E2E tests in CI" \
    'grep -q "E2E" .github/workflows/ci.yml'

check "CODEOWNERS exists" \
    '[ -f .github/CODEOWNERS ]'

check "Dependabot configured" \
    '[ -f .github/dependabot.yml ]'

check "Speed Insights enabled" \
    'grep -q "speedInsights" vercel.json'

check "Production launch checklist exists" \
    '[ -f docs/checklists/production-launch.md ]'

check "Database rollback runbook exists" \
    '[ -f docs/runbooks/database-rollback.md ]'

check "Node engine in package.json" \
    'grep -q "engines" package.json'

check "CAPTCHA vars in .env.example" \
    'grep -q "CAPTCHA" .env.example'

check "SMTP vars in .env.example" \
    'grep -q "SMTP" .env.example'

check "Secrets with fallback in CI build" \
    'grep -q "secrets.VITE_SUPABASE" .github/workflows/ci.yml'

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════════════════════"

if [ $FAIL -eq 0 ]; then
    echo "🎉 All checks passed! CI/CD is compliant."
    exit 0
else
    echo "⚠️  $FAIL checks failed. Review and fix before proceeding."
    exit 1
fi
```

---

## Rollback Plan

If any phase causes issues:

### Phase 1 Rollback
```bash
# Re-add .env files to tracking if needed
git add .env .env.cloud .env.local
git commit -m "revert: re-add .env files temporarily"
```

### Phase 2-3 Rollback
```bash
# Restore workflow from backup
cp .github/workflows/backup/ci.yml .github/workflows/ci.yml
git add .github/workflows/ci.yml
git commit -m "revert: restore backup CI workflow"
```

### Phase 4 Rollback
Cannot be rolled back. Ensure team coordination before starting.

---

## Success Criteria

| Metric | Before | Target | Method |
|--------|--------|--------|--------|
| Critical Issues | 2 | 0 | All .env files untracked |
| High Issues | 8 | 0 | All fail-fast violations fixed |
| Medium Issues | 7 | 0 | All configs added |
| Low Issues | 3 | 0 | All nice-to-haves done |
| Production Readiness | ~55% | 95%+ | Checklist complete |

---

*Plan generated: 2025-12-04*
*Source review: docs/reviews/2025-12-04-cicd-deployment-review.md*
