# Crispy CRM Development Commands
# Run `just --list` to see all available commands

# Default recipe: show help
default:
    @just --list --unsorted

# ─────────────────────────────────────────────────────────────
# 🚀 Development
# ─────────────────────────────────────────────────────────────

# Start Vite dev server (requires Supabase running)
dev:
    npm run dev

# Full local dev: start Supabase + reset DB + Vite
dev-local:
    npm run dev:local

# Start local dev without DB reset
dev-local-quick:
    npm run dev:local:skip-reset

# Stop local Supabase
dev-stop:
    npm run dev:local:stop

# Check Supabase connection status
dev-check:
    npm run dev:check

# Start dev against cloud Supabase
dev-cloud:
    npm run dev:cloud

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

# Seed E2E test data
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

# Full quality check: typecheck + lint + colors
check: typecheck lint colors

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

# Start local Supabase
db-start:
    npm run db:local:start

# Stop local Supabase
db-stop:
    npm run db:local:stop

# Restart local Supabase
db-restart:
    npm run db:local:restart

# Reset local database (runs migrations + seed)
db-reset:
    npm run db:local:reset

# Check local Supabase status
db-status:
    npm run db:local:status

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

# ─────────────────────────────────────────────────────────────
# 🔍 Discovery (Codebase Analysis)
# ─────────────────────────────────────────────────────────────

# Run full codebase discovery (components, hooks, etc.)
discover:
    npx tsx scripts/discover/index.ts

# Run priority extractors only (components + hooks)
discover-priority:
    npx tsx scripts/discover/index.ts --only=components,hooks

# Check if discoveries are stale (for CI/pre-commit)
discover-check:
    npx tsx scripts/discover/index.ts --check

# Extract Zod schemas only
discover-schemas:
    npx tsx scripts/discover/index.ts --only=schemas

# Extract TypeScript types only
discover-types:
    npx tsx scripts/discover/index.ts --only=types

# Extract form components only
discover-forms:
    npx tsx scripts/discover/index.ts --only=forms

# Run all new extractors (schemas, types, forms)
discover-new:
    npx tsx scripts/discover/index.ts --only=schemas,types,forms

# ─────────────────────────────────────────────────────────────
# 📦 Composite Commands
# ─────────────────────────────────────────────────────────────

# Fresh start: reset DB + generate types + start dev
fresh:
    just db-reset && just db-types && just dev

# Pre-commit check: format, lint, typecheck, test
pre-commit:
    just fmt && just check && just test-ci

# CI pipeline: all checks + build
ci:
    just check && just test-ci && just build

# Quick validation before pushing
push-check:
    just typecheck && just lint && just test-ci
