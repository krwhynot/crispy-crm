# Constants Module

Centralised shared constants for Crispy CRM. Owns all domain enums, pipeline stage definitions, UI timing values, list defaults, and notification message templates. This module is a pure leaf dependency (no imports from other `src/atomic-crm/` modules) and is consumed by 72 other modules — the third-highest fan-in in the codebase.

## Key Files

| File | Purpose |
|------|---------|
| `appConstants.ts` | Magic numbers for search debounce, cache stale times, pagination, toast durations, and activity thresholds |
| `stage-enums.ts` | `OpportunityStageValue` type, `STAGE` constants object, stage arrays (`ACTIVE_STAGES`, `CLOSED_STAGES`), `STAGE_ORDER` map, and stage predicate functions |
| `listDefaults.ts` | Stable-reference sort (`SORT_BY_CREATED_DESC`, `SORT_BY_UPDATED_DESC`) and filter (`FILTER_ACTIVE_RECORDS`) objects that prevent unnecessary React re-renders |
| `notificationMessages.ts` | Factory functions for user-facing toast strings (`created`, `updated`, `deleted`, `bulkDeleted`, etc.) |
| `index.ts` | Re-exports from `appConstants`, `listDefaults`, and `stage-enums` for single-import convenience |

## Architecture

- **Fan-in: 72, Fan-out: 0.** This module must never import from other `src/atomic-crm/` modules; doing so would create circular dependencies.
- **Stage enums live here, not in `validation/`.** `stage-enums.ts` was moved here to break a prior circular dependency between `opportunities` and `constants`. The `OpportunityStageValue` type and `opportunityStageSchema` in `validation/opportunities/opportunities-core.ts` enumerate the same 7 values — TypeScript catches drift between them.
- **`notificationMessages.ts` is not re-exported from `index.ts`** — import it directly: `import { notificationMessages } from '@/atomic-crm/constants/notificationMessages'`.

## Common Modification Patterns

To add a new magic number, add a named `const` to the appropriate section in `appConstants.ts` with a JSDoc comment explaining the value and its consumers. To add a new stage, update `OpportunityStageValue`, `STAGE`, `ACTIVE_STAGES` or `CLOSED_STAGES`, `STAGE_ORDER`, and the matching `z.enum` in `validation/opportunities/opportunities-core.ts` together — the `satisfies` constraint on `STAGE` and TypeScript's exhaustiveness will surface any mismatch at compile time. Never add string literals for stage values in feature components; always import from `STAGE`.

## Guardrails

- **`stage-enums.ts`** — changes here affect all 72 dependents and the opportunities validation schema simultaneously. Run `npx tsc --noEmit` after any edit.
- **`appConstants.ts` stale-time values** — `DEFAULT_STALE_TIME_MS` and `SHORT_STALE_TIME_MS` are consumed by React Query hooks across the codebase (STALE-005). Changing them affects cache behaviour globally; coordinate with the relevant feature owners.
- **No new imports from `src/atomic-crm/`** — this module must remain a pure leaf to avoid circular dependency regressions.
- Risk level is **Medium / Phase 2**. See `docs/audit/baseline/risk-assessment.json` for full risk factors.

## Related

- Audit report: `docs/audit/baseline/risk-assessment.json` (module: `constants`)
- Dependency consumers: `docs/audit/baseline/dependency-map.json`
- DOM-006: domain enums and status strings must be centralised here
- Opportunities validation sync target: `src/atomic-crm/validation/opportunities/opportunities-core.ts`
