# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) organized by architectural tier.

---

## Tier 1: Foundations (Core Decisions)

These define the fundamental architecture and cannot change without major refactoring.

| ADR | Decision | Status |
|-----|----------|--------|
| [001](./tier-1-foundations/ADR-001-unified-data-provider.md) | Unified Data Provider Entry Point | Accepted |
| [002](./tier-1-foundations/ADR-002-zod-api-boundary.md) | Zod Validation at API Boundary | Accepted |
| [003](./tier-1-foundations/ADR-003-react-admin-framework.md) | React Admin Framework | Accepted |
| [004](./tier-1-foundations/ADR-004-supabase-backend.md) | Supabase Backend Platform | Accepted |
| [008](./tier-1-foundations/ADR-008-rls-security.md) | Row Level Security | Accepted |
| [014](./tier-1-foundations/ADR-014-fail-fast-philosophy.md) | Fail-Fast Philosophy | Accepted |

---

## Tier 2: Data Layer (Provider & Database)

Patterns for data access, validation, and database operations.

| ADR | Decision | Status |
|-----|----------|--------|
| [007](./tier-2-data-layer/ADR-007-soft-delete-pattern.md) | Soft Delete Pattern | Accepted |
| [009](./tier-2-data-layer/ADR-009-composed-data-provider.md) | Composed Data Provider | Accepted |
| [015](./tier-2-data-layer/ADR-015-edge-functions.md) | Edge Functions | Accepted |
| [016](./tier-2-data-layer/ADR-016-rpc-functions.md) | RPC Functions | Accepted |
| [017](./tier-2-data-layer/ADR-017-dashboard-views.md) | Dashboard Views | Accepted |
| [019](./tier-2-data-layer/ADR-019-provider-migration-feature-flag.md) | Provider Migration Feature Flag | Accepted |
| [025](./tier-2-data-layer/ADR-025-error-logging-wrapper.md) | Error Logging Wrapper | Accepted |
| [026](./tier-2-data-layer/ADR-026-validation-wrapper.md) | Validation Wrapper | Accepted |
| [027](./tier-2-data-layer/ADR-027-query-key-factory.md) | Query Key Factory | Accepted |
| [031](./tier-2-data-layer/ADR-031-lru-cache-postgrest.md) | LRU Cache for PostgREST | Accepted |

---

## Tier 3: Frontend (UI Components & Patterns)

Component design, styling, and user interaction patterns.

| ADR | Decision | Status |
|-----|----------|--------|
| [005](./tier-3-frontend/ADR-005-dnd-kit-library.md) | @dnd-kit Library | Accepted |
| [006](./tier-3-frontend/ADR-006-tailwind-semantic-colors.md) | Tailwind Semantic Colors | Accepted |
| [010](./tier-3-frontend/ADR-010-slide-over-panels.md) | Slide-Over Panels | Accepted |
| [011](./tier-3-frontend/ADR-011-feature-directory-structure.md) | Feature Directory Structure | Accepted |
| [012](./tier-3-frontend/ADR-012-form-validation-mode.md) | Form Validation Mode | Accepted |
| [013](./tier-3-frontend/ADR-013-wcag-accessibility.md) | WCAG Accessibility | Accepted |
| [033](./tier-3-frontend/ADR-033-generic-memo-utility.md) | Generic Memo Utility | Accepted |
| [034](./tier-3-frontend/ADR-034-sonner-notifications.md) | Sonner Notifications | Accepted |

---

## Tier 4: Infrastructure (DevOps & Tooling)

Build, test, monitoring, and deployment configurations.

| ADR | Decision | Status |
|-----|----------|--------|
| [018](./tier-4-infrastructure/ADR-018-test-render-utility.md) | Test Render Utility | Accepted |
| [020](./tier-4-infrastructure/ADR-020-sentry-error-monitoring.md) | Sentry Error Monitoring | Accepted |
| [021](./tier-4-infrastructure/ADR-021-multi-environment-config.md) | Multi-Environment Config | Accepted |
| [022](./tier-4-infrastructure/ADR-022-csp-security-headers.md) | CSP Security Headers | Accepted |
| [023](./tier-4-infrastructure/ADR-023-build-code-splitting.md) | Build Code Splitting | Accepted |
| [024](./tier-4-infrastructure/ADR-024-structured-logging.md) | Structured Logging | Accepted |
| [030](./tier-4-infrastructure/ADR-030-vitest-esm-workaround.md) | Vitest ESM Workaround | Accepted |

---

## Tier 5: Features (Domain-Specific)

Feature-specific decisions that don't affect core architecture.

| ADR | Decision | Status |
|-----|----------|--------|
| [028](./tier-5-features/ADR-028-csv-upload-validation.md) | CSV Upload Validation | Accepted |
| [029](./tier-5-features/ADR-029-storage-service.md) | Storage Service | Accepted |
| [032](./tier-5-features/ADR-032-csv-import-architecture.md) | CSV Import Architecture | Accepted |

---

## ADR Format

All ADRs follow [Michael Nygard's format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions):

- **Status**: Proposed | Accepted | Deprecated | Superseded
- **Context**: Why this decision was needed
- **Decision**: What was decided
- **Consequences**: Trade-offs and implications

---

## Quick Reference

| Tier | Focus | Count |
|------|-------|-------|
| 1 | Foundations | 6 |
| 2 | Data Layer | 10 |
| 3 | Frontend | 8 |
| 4 | Infrastructure | 7 |
| 5 | Features | 3 |
| **Total** | | **34** |
