# Crispy CRM Development Commands
# Run `just --list` to see all available commands

# Windows: use PowerShell as the shell (Unix uses sh by default)
set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

# Default recipe: show help
default:
    @just --list --unsorted

# ─────────────────────────────────────────────────────────────
# 🚀 Development
# ─────────────────────────────────────────────────────────────

# Start Vite dev server (requires Supabase running)
dev:
    npm run dev

# Check Supabase connection status
dev-check:
    npm run dev:check

# ─────────────────────────────────────────────────────────────
# 🧪 Testing
# ─────────────────────────────────────────────────────────────

# Run Vitest in watch mode (default)
test:
    npm test

# Run tests once (CI mode)
test-ci:
    npm run test:ci

# Run tests with coverage
test-cov:
    npm run test:coverage

# Run Vitest UI
test-ui:
    npm run test:ui

# Run quick smoke test
test-smoke:
    npm run test:smoke

# Phase 5: Reporting audit regression tests — nightly (all 3 suites)
test-audit-nightly:
    npx vitest run src/atomic-crm/reports/__tests__/closed-stages-alignment.test.ts src/atomic-crm/utils/__tests__/getWeekBoundaries.test.ts src/atomic-crm/dashboard/__tests__/kpi-metric-snapshot.test.ts

# Phase 5: Reporting audit regression tests — PR-required (stable suites only)
test-audit-pr:
    npx vitest run src/atomic-crm/reports/__tests__/closed-stages-alignment.test.ts src/atomic-crm/dashboard/__tests__/kpi-metric-snapshot.test.ts

# Seed E2E test data (dashboard-v3 fixtures: opportunities, activities, etc.)
# NOTE: Organization hierarchy data (parent/child companies) is in seed.sql
# and applied automatically by `just db-reset`. No separate step needed.
seed-e2e:
    npm run seed:e2e:dashboard-v3

# ─────────────────────────────────────────────────────────────
# 🔍 Code Quality
# ─────────────────────────────────────────────────────────────

# Run all linting checks
lint:
    npm run lint

# Run TypeScript type checking
typecheck:
    npm run typecheck

# Fix lint issues
lint-fix:
    npm run lint:apply

# Fix formatting issues
fmt:
    npm run prettier:apply

# Validate semantic colors in codebase
colors:
    npm run validate:semantic-colors

# Code health check (enforced in CI/CD)
[unix]
health-check:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "=== Code Health Check (CI/CD Enforced) ==="
    echo "Checking for high-churn files (14 days, threshold: 16 edits)..."
    HIGH_CHURN=$(git log --name-only --since="14 days ago" --pretty=format: -- 'src/**/*.ts' 'src/**/*.tsx' \
      | grep -v '^$' | sort | uniq -c | sort -rn \
      | awk '$1 >= 16 {print $1, $2}')
    if [ -n "$HIGH_CHURN" ]; then
      echo "❌ CHURN THRESHOLD EXCEEDED:"
      echo "$HIGH_CHURN"
      echo ""
      echo "Action Required: Files with 16+ edits in 14 days need architectural review."
      echo "See CLAUDE.md Code Health Monitoring section."
      exit 1
    else
      echo "✅ All files below churn threshold"
    fi

# Code health check (enforced in CI/CD)
[windows]
health-check:
    echo "=== Code Health Check (CI/CD Enforced) ==="; echo "Checking for high-churn files (14 days, threshold: 16 edits)..."; $files = git log --name-only --since="14 days ago" --pretty=format: -- 'src/**/*.ts' 'src/**/*.tsx'; $grouped = $files | Where-Object { $_ -ne '' } | Group-Object | Where-Object { $_.Count -ge 16 } | Sort-Object Count -Descending; if ($grouped) { echo "CHURN THRESHOLD EXCEEDED:"; $grouped | ForEach-Object { echo "$($_.Count) $($_.Name)" }; echo ""; echo "Action Required: Files with 16+ edits in 14 days need architectural review."; echo "See CLAUDE.md Code Health Monitoring section."; exit 1 } else { echo "All files below churn threshold" }

# Full quality check: typecheck + lint + colors + health-check
check: typecheck lint colors health-check
    @echo "All quality checks passed"

# ─────────────────────────────────────────────────────────────
# 🏗️ Build
# ─────────────────────────────────────────────────────────────

# Build for production (includes typecheck)
build:
    npm run build

# Preview production build
preview:
    npm run preview

# ─────────────────────────────────────────────────────────────
# 🗄️ Database
# ─────────────────────────────────────────────────────────────

# Create new migration file
db-migrate name:
    npx supabase migration new {{name}}

# Generate TypeScript types from database
db-types:
    npm run gen:types

# Force regenerate types
db-types-force:
    npm run gen:types:force

# Link to remote Supabase project
db-link:
    npm run db:link

# Check for migration drift between local and cloud
db-drift:
    bash ./scripts/check-migration-drift.sh

# Quick drift check (pass/fail only)
db-drift-quick:
    bash ./scripts/check-migration-drift.sh --quick

# Show migration repair commands
db-drift-repair:
    bash ./scripts/check-migration-drift.sh --repair

# ─────────────────────────────────────────────────────────────
# 🧹 Maintenance
# ─────────────────────────────────────────────────────────────

# Clear application cache
cache-clear:
    npm run cache:clear

# Reindex search
search-reindex:
    npm run search:reindex

# Run pre-migration validation
validate-migration:
    npm run validate:pre-migration

# Audit storage for orphaned files (report only)
storage-audit:
    npx tsx scripts/storage-hygiene.ts

# Clean up orphaned storage files
storage-clean:
    npx tsx scripts/storage-hygiene.ts --delete

# Storage audit with JSON output (for CI/CD)
storage-audit-json:
    npx tsx scripts/storage-hygiene.ts --json

# ─────────────────────────────────────────────────────────────
# 📦 Composite Commands
# ─────────────────────────────────────────────────────────────

# Pre-commit check: format, lint, typecheck, test
pre-commit: fmt check test-ci

# CI pipeline: all checks + build
ci: check test-ci build

# Quick validation before pushing
push-check: typecheck lint test-ci

# ─────────────────────────────────────────────────────────────
# 🔍 Audits (Claude Code Commands)
# ─────────────────────────────────────────────────────────────

# Run full Three Pillars codebase audit
audit:
    @echo "Run /audit in Claude Code"

# List audit commands
audit-list:
    @echo "Full audit:   /audit in Claude Code"
