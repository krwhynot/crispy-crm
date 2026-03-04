# Admin Module

Admin-only pages for Crispy CRM. Currently hosts the Health Dashboard, which gives platform administrators a real-time view of application error rates, request counts, and API latency. The module is intentionally thin — routing and layout are owned by `CRM.tsx`, and this module only contributes the pages rendered behind admin-guarded routes.

## Key Components

| File | Purpose |
|------|---------|
| `HealthDashboard.tsx` | Real-time health metrics: error rate, request count, avg latency, recent metric log |
| `index.tsx` | Barrel comment — `HealthDashboard` is lazy-loaded directly from `CRM.tsx` |

## Architecture

- **2 files, admin-only** — no provider handler, no DB tables, no Zod schema
- **Metrics source**: reads from `logger.getMetrics()` (`src/lib/logger.ts`); no Supabase calls
- **Auto-refresh**: polls on `NOTIFICATION_POLL_INTERVAL_MS` (defined in `src/atomic-crm/constants`)
- **Visual feedback delay**: uses `UI_FEEDBACK_DELAY_MS` for the manual refresh button spin
- **Sentry link**: alert banner at >1% error rate links out to `sentry.io`
- **Lazy loading**: `HealthDashboard` is imported via `React.lazy()` in `CRM.tsx`, not re-exported from `index.tsx`

## Status Thresholds

| Status | Error Rate | Indicator Color |
|--------|-----------|----------------|
| Healthy | < 0.5% | `bg-success` (green) |
| Degraded | 0.5% – 1.0% | `bg-warning` (yellow) |
| Critical | > 1.0% | `bg-destructive` (red) — alert banner shown |

## Common Modification Patterns

To add a new admin page, create the component file in this directory and add a lazy import + route in `CRM.tsx` directly (do not re-export through `index.tsx`). `HealthDashboard.tsx` uses local sub-components (`StatusIndicator`, `MetricCard`) defined in the same file — follow this pattern for self-contained admin pages rather than adding shared components. If you need to surface a new metric, add it to `src/lib/logger.ts` and read it via `logger.getMetrics()` in `HealthDashboard`.

## Guardrails

- No direct Supabase imports — this module reads from the logger only (CORE-001)
- Styling uses semantic tokens (`bg-success`, `bg-warning`, `bg-destructive`, `text-muted-foreground`) — no hardcoded colors (CORE-017)
- No test coverage exists for this module (`test_coverage: none` per audit baseline); any logic additions should include a Vitest test
- Route access control is enforced at the `CRM.tsx` routing layer, not inside this module

## Related

- Full audit: `docs/audit/baseline/feature-inventory.json` (feat-adm-001)
- Logger / metrics source: `src/lib/logger.ts`
- Route registration: `CRM.tsx` (lazy import of `HealthDashboard`)
- Constants used: `src/atomic-crm/constants/` (`NOTIFICATION_POLL_INTERVAL_MS`, `UI_FEEDBACK_DELAY_MS`)
