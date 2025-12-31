# Pattern Documentation

This directory contains pattern documentation organized by architectural tier.

Each pattern file provides code examples, anti-patterns, and checklists for consistent implementation.

---

## Tier 1: Foundations (Core Patterns)

Fundamental patterns that define how the system works.

| Pattern | Description | Source |
|---------|-------------|--------|
| [Data Provider](./tier-1-foundations/data-provider.md) | Handler factories, callbacks, wrappers, service delegation | `providers/supabase/` |

---

## Tier 2: Data Layer (Provider & Database)

Patterns for data access, validation, and database operations.

| Pattern | Description | Source |
|---------|-------------|--------|
| [Validation](./tier-2-data-layer/validation.md) | Zod schemas, strictObject, security patterns, transforms | `validation/` |
| [Migrations](./tier-2-data-layer/migrations.md) | RLS policies, soft delete, indexes, RPC functions | `supabase/migrations/` |
| [Edge Functions](./tier-2-data-layer/edge-functions.md) | Supabase Edge Function patterns | `supabase/functions/_shared/` |
| [Services](./tier-2-data-layer/services.md) | Business logic service patterns | `services/` |
| [Lib](./tier-2-data-layer/lib.md) | Library utility patterns | `lib/` |

---

## Tier 3: Frontend (UI Components & Patterns)

Component design, hooks, and user interaction patterns.

| Pattern | Description | Source |
|---------|-------------|--------|
| [Admin Components](./tier-3-frontend/admin-components.md) | React Admin wrapper components, select inputs | `components/admin/` |
| [UI Components](./tier-3-frontend/ui-components.md) | shadcn/ui patterns, accessibility | `components/ui/` |
| [Hooks](./tier-3-frontend/hooks.md) | Custom React hook patterns | `hooks/` |
| [Contexts](./tier-3-frontend/contexts.md) | React context patterns | `contexts/` |
| [Filters](./tier-3-frontend/filters.md) | List filter component patterns | `filters/` |
| [Dashboard](./tier-3-frontend/dashboard.md) | Dashboard v3 widget patterns | `dashboard/v3/` |
| [Utils](./tier-3-frontend/utils.md) | Frontend utility patterns | `utils/` |

---

## Tier 4: Infrastructure (DevOps & Tooling)

Build, test, monitoring, and deployment patterns.

| Pattern | Description | Source |
|---------|-------------|--------|
| [GitHub Workflows](./tier-4-infrastructure/github-workflows.md) | CI/CD pipelines, security scans, deployment | `.github/workflows/` |
| [Husky](./tier-4-infrastructure/husky.md) | Git hooks, pre-commit validation | `.husky/` |
| [Dev Scripts](./tier-4-infrastructure/dev-scripts.md) | Development tooling, seeding, utilities | `scripts/dev/` |
| [Discovery](./tier-4-infrastructure/discovery.md) | Code indexing, SCIP symbols, FTS5 | `scripts/discover/` |
| [Docker Scripts](./tier-4-infrastructure/docker-scripts.md) | Container orchestration, health checks | `scripts/docker/` |
| [MCP Server](./tier-4-infrastructure/mcp.md) | Code intelligence, hybrid search, RRF | `scripts/mcp/` |
| [Validation Scripts](./tier-4-infrastructure/validation-scripts.md) | Pre-migration validation, Go/No-Go | `scripts/validation/` |
| [Supabase Docker](./tier-4-infrastructure/supabase-docker.md) | Local Supabase stack, health checks | `supabase/docker/` |
| [E2E Testing](./tier-4-infrastructure/e2e-testing.md) | Integration tests, RLS validation | `tests/` |
| [Unit Testing](./tier-4-infrastructure/unit-testing.md) | Vitest patterns, mocks, test utils | `src/tests/` |

---

## Tier 5: Features (Domain-Specific)

Feature-specific patterns for CRM domain entities.

| Pattern | Description | Source |
|---------|-------------|--------|
| [Contacts](./tier-5-features/contacts.md) | Contact management patterns | `contacts/` |
| [Organizations](./tier-5-features/organizations.md) | Organization management patterns | `organizations/` |
| [Opportunities](./tier-5-features/opportunities.md) | Pipeline & deal patterns | `opportunities/` |
| [Activities](./tier-5-features/activities.md) | Activity logging patterns | `activities/` |
| [Tasks](./tier-5-features/tasks.md) | Personal task patterns | `tasks/` |
| [Notes](./tier-5-features/notes.md) | Entity note patterns | `notes/` |
| [Products](./tier-5-features/products.md) | Product catalog patterns | `products/` |
| [Product Distributors](./tier-5-features/product-distributors.md) | Product-distributor junction patterns | `productDistributors/` |
| [Tags](./tier-5-features/tags.md) | Tagging system patterns | `tags/` |
| [Sales](./tier-5-features/sales.md) | Sales rep/user patterns | `sales/` |
| [Activity Log](./tier-5-features/activity-log.md) | Activity aggregation patterns | `activity-log/` |

---

## Pattern File Structure

All pattern files follow a consistent structure:

- **Architecture Overview**: Visual diagram of the subsystem
- **Pattern Sections**: Labeled A, B, C, etc. with when-to-use guidance
- **Code Examples**: Production-ready TypeScript/SQL snippets
- **Anti-Patterns**: Common mistakes with fixes
- **Checklists**: Step-by-step guidance for new implementations

---

## Quick Reference

| Tier | Focus | Count |
|------|-------|-------|
| 1 | Foundations | 1 |
| 2 | Data Layer | 5 |
| 3 | Frontend | 7 |
| 4 | Infrastructure | 10 |
| 5 | Features | 11 |
| **Total** | | **34** |

---

## Source Files

These pattern files are copies from their original locations in the source tree:

- Original files remain in place for contextual discovery
- Updates should be made to source files, then re-copied here
- Run `just copy-patterns` to sync (when available)
