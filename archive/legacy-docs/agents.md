# Codex Agent Guide

This document mirrors the context in `CLAUDE.md`, but is trimmed and reformatted so the Codex agent (or any new LLM) can quickly understand the Atomic CRM repo.

## Project Snapshot
- **Product:** Atomic CRM – React 19 + Vite + TypeScript + Supabase + React Admin + Tailwind 4, pre-launch.
- **Focus Areas (last 90 days):** Principal Dashboard V2 launch, cloud-only Supabase workflow, port consolidation, tasks module + weekly activity report, semantic spacing + color systems, security/testing remediation.
- **Live references:** `docs/dashboard-v2-migration.md`, `docs/archive/plans/2025-11-13-principal-dashboard-v2-PLANNING.md`, `docs/archive/plans/2025-11-09-tasks-module-weekly-activity-report.md`.

## Core Rules (from Engineering Constitution)
1. **No over-engineering** – prefer straightforward fixes.
2. **Single source of truth** – Supabase + Zod at API boundary.
3. **Boy Scout rule** – clean touched code, convert `type` → `interface` as encountered.
4. **Form defaults come from schemas** – `zodSchema.partial().parse({})`.
5. **Semantic colors only** – CSS vars like `--primary`, `--brand-700` (see `docs/internal-docs/color-theming-architecture.docs.md`).
6. **Create migrations via Supabase CLI** – `npx supabase migration new <name>`.
7. **Two-layer security** – every table needs GRANT + RLS.

Supplement: review `docs/claude/engineering-constitution.md` whenever behavior is unclear.

## Essential Commands
```bash
npm run dev                # Dev server against cloud DB
npm test                   # Vitest watch mode
npm run lint:apply         # ESLint auto-fix
npx supabase db reset      # Reset local shadow DB
npm run db:cloud:push      # Deploy migrations (PROD!)
npx supabase migration new <name>
```
Full reference: `docs/development/commands-quick-reference.md`.

## Architecture Cheat Sheet
- Entry: `src/main.tsx` → `src/App.tsx` → `src/atomic-crm/root/CRM.tsx`.
- Resource folders: `src/atomic-crm/<resource>/` (List/Show/Edit/Create patterns, exported via `index.ts`).
- Data layer: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`, `authProvider.ts`, Edge Functions/migrations under `supabase/`.
- Validation: `src/atomic-crm/validation/*.ts` (Zod schema per resource).
- Filter safety: `providers/supabase/filterRegistry.ts`.
- Config context: `src/atomic-crm/root/ConfigurationContext.tsx` + `<CRM>` props inside `App.tsx`.
- Path alias: `@/*` → `src/*` (configured in tsconfigs + Vite).

## Dashboard V2 Highlights
- Default landing view at `/`.
- Layout: 3 resizable columns (Opportunities | Tasks | Quick Logger) + slide-over panel.
- Keyboard shortcuts: `/` for search, `1/2/3` to jump columns, `H` to open slide-over on History, `Esc` to close.
- Code: `src/atomic-crm/dashboard/v2/` (components, hooks, utils).
- Dependent DB views: `principal_opportunities`, `priority_tasks`, `activities`.
- Testing: 30+ unit tests + 3 E2E suites covering logging, keyboard nav, and accessibility.

## UI Systems
- **Color tokens:** Enforced via Tailwind semantic utilities. Run `npm run validate:colors` if editing palette.
- **Spacing tokens:** Defined in `src/index.css` under `@theme` (`--spacing-*` variables). Never hardcode px when a token exists.
- **Tabbed forms:** Use `src/components/admin/tabbed-form/` across Create/Edit views.

## Database Workflow
- Single Supabase Cloud project (`aaqnanddcqvfiwhshndl`). No local Docker for day-to-day dev.
- Typical flow:
  1. `npx supabase migration new <name>`
  2. Apply + verify locally (`npx supabase db reset`, `npm run db:cloud:push:dry-run`)
  3. Deploy with `npm run db:cloud:push`
- See `docs/supabase/WORKFLOW.md` for policies (RLS, grants, dry-run requirements, rollback steps).

## Testing Expectations
- Vitest unit coverage around 70% for dashboard modules; new work should include targeted tests where practical.
- Playwright suites live in `tests/` + `playwright.config.ts`.
- Accessibility: maintain WCAG 2.1 AA; refer to `color-contrast-report.json` + `docs/accessibility/`.

## File Etiquette for Codex
- Respect existing formatting (Prettier/Tailwind). Run `npm run lint:apply` or `npm run format` before handing off when possible.
- Avoid destructive git commands; never reset user work.
- When editing TypeScript, prefer interfaces, keep imports sorted, and rely on existing hooks/components before creating new ones.
- Document notable behavior changes in `docs/` or update `README`s per `docs/README.md` guidance.

## More Context
- Full Claude brief: `CLAUDE.md`.
- AI-specific rules + constitution: `docs/claude/`.
- Historical plans + research: `docs/archive/`.
- Dashboards + status rollups: `docs/status/`, `docs/internal-docs/`.

Use this file as the quick-start reference for Codex-powered agents; default to `CLAUDE.md` for exhaustive history/details.
