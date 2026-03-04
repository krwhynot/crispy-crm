# Utils Module

Pure utility functions shared across all feature modules in Crispy CRM. This module has no business logic of its own — it provides formatting, calculation, avatar resolution, error mapping, CSV validation, and React Admin configuration helpers consumed by virtually every feature in the app.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | React 19 + React Admin 5 |
| Risk Level | Medium |
| Phase | 2 |
| Test Project | None |
| Dependents | 73 (activities, components, contacts, dashboard, organizations, productDistributors, products, reports, sales, tasks, timeline) |

## Key Components

| File | Purpose |
|------|---------|
| `stalenessCalculation.ts` | Per-stage stale thresholds and `isOpportunityStale` — powers dashboard KPIs |
| `errorMessages.ts` | Maps Postgres constraint errors to user-friendly strings; used by `withErrorLogging` |
| `formatters.ts` | `formatFullName`, `formatCurrency`, `getInitials`, `ucFirst`, `formatFieldLabel` |
| `formatName.ts` | `formatName` / `formatSingleName` — handles literal `"null"` strings from CSV imports |
| `avatar.utils.ts` | Gravatar, favicon, and fallback avatar resolution with SHA-256 hashing |
| `exportHelpers.ts` | `flattenEmailsForExport`, `flattenPhonesForExport` for CSV export columns |
| `csvUploadValidator.ts` | `validateCsvFile`, `getSecurePapaParseConfig`, `sanitizeCsvValue` |
| `secureStorage.ts` | Typed localStorage wrapper (`getStorageItem`, `setStorageItem`, `clearStorageByPrefix`) |
| `rateLimiter.ts` | `ClientRateLimiter` — shared limiters for contact/organization imports |
| `autocompleteDefaults.ts` | Debounce, min-chars, and prop factories for `ReferenceInput` autocompletes |
| `listPatterns.ts` | `COLUMN_VISIBILITY`, `SORT_FIELDS`, `DEFAULT_PER_PAGE` constants for list pages |
| `safeJsonParse.ts` | Zod-validated JSON parsing that never throws |
| `getActivityIcon.tsx` | Maps activity type string to Lucide icon component |
| `getRequiredFields.ts` | Introspects a Zod schema to extract required field names |
| `trendCalculation.ts` | Week-over-week trend math for dashboard widgets |
| `dateUtils.ts` | `getWeekRange` and related date boundary helpers |
| `formatRelativeTime.ts` | Human-readable relative timestamps (e.g., "3 days ago") |
| `levenshtein.ts` | `SimilarOpportunity` / `FindSimilarParams` types — similarity matching moved to PostgreSQL `pg_trgm`; only types remain |

## Dependencies

### Internal Modules
- `src/atomic-crm/constants` — stage enums (`STAGE`, `ACTIVE_STAGES`, `CLOSED_STAGES`)

### npm Packages
Utilities rely on packages already present in the app bundle:
- `zod` ^4.1.12 — `safeJsonParse`, `StageStaleThresholdsSchema`, `getRequiredFields`
- `date-fns` ^4.1.0 — date arithmetic in `dateUtils.ts` and `formatRelativeTime.ts`
- `diacritic` ^0.0.2 — accent-insensitive name matching

## Features in This Project

This module does not own a domain feature. It is infrastructure consumed by other features.

| Utility Group | Domain | Confidence |
|---------------|--------|-----------|
| Staleness Calculation | Opportunities / Dashboard | 95% |
| Error Message Mapping | All resources | 95% |
| Text Formatters | All list views | 95% |
| Avatar Resolution | Contacts / Organizations | 90% |
| CSV Validation | Contacts import | 95% |
| Autocomplete Defaults | All ReferenceInputs | 90% |

## Common Modification Patterns

Adding a new utility function: create a new file in `src/atomic-crm/utils/`, export the function from `index.ts`, and add a test in `__tests__/`. Do not place business logic here — handlers and services own that layer (PRV-006).

When updating `stalenessCalculation.ts`, remember that `ACTIVE_STAGES` and `CLOSED_STAGES` are sourced from `src/atomic-crm/constants` — do not duplicate them. The stage-enums circular dependency with `opportunities` was resolved by moving constants there; do not re-introduce an import from `opportunities`.

When adding error messages to `errorMessages.ts`, add the Postgres constraint name to `CONSTRAINT_MESSAGES` rather than adding new branching logic to `sanitizeMessage`. The function already handles the match and lookup automatically.

## Guardrails

- **Fan-in is 73** — the second-highest in the codebase. Any rename or signature change here requires verifying all 73 consumers. Run `npx tsc --noEmit` before committing.
- **Partial test coverage** — regressions in `stalenessCalculation.ts` or `formatters.ts` propagate silently to dashboard KPIs, export flows, and list pages. Add tests for any changed function.
- **No Supabase imports** — this module must stay data-provider-agnostic (CORE-001). All utilities are pure functions or browser-API-only (e.g., `crypto.subtle`, `localStorage`).
- **No circular imports** — `utils` may only import from `constants`. Importing from `opportunities`, `validation`, or any other feature module will reintroduce the previously resolved circular dependency.

See also: `docs/audit/baseline/risk-assessment.json` (utils entry, risk score 6, phase 2).
