# Config Module

Runtime feature flag configuration for Crispy CRM. This module provides environment-driven toggles that allow gradual feature rollout and emergency rollback without a code deploy. It is consumed directly via named exports wherever a conditional behaviour is needed.

## Key Components

| File | Purpose |
|------|---------|
| `featureFlags.ts` | Runtime feature flags driven by environment variables |

## Architecture

- **1 file, loosely coupled** — zero imports from other `atomic-crm` modules and zero modules import from `config` (fan-in: 0, fan-out: 0)
- **Environment-driven** — flags read `process.env.*` at module load time; no React context or Supabase dependency
- **Named boolean exports** — consumers import a flag constant directly: `import { UNIFIED_TIMELINE_ENABLED } from '@/atomic-crm/config/featureFlags'`

## Current Flags

| Flag | Env Variable | Default | Status |
|------|-------------|---------|--------|
| `UNIFIED_TIMELINE_ENABLED` | `UNIFIED_TIMELINE` | `true` | Always enabled; legacy `ActivityLog` removed |

## Common Modification Patterns

To add a new flag, export a new boolean constant from `featureFlags.ts` that reads its controlling environment variable via `process.env`. Follow the existing doc-comment pattern: describe the current status, what is enabled/disabled in each state, and reference any related decision document. After adding a flag, import it at the call site rather than passing it through props or context.

## Guardrails

- No direct Supabase imports are permitted in this module (CORE-001).
- Flag values are resolved once at import time; do not wrap them in reactive state.
- Emergency rollback for `UNIFIED_TIMELINE_ENABLED` requires restoring the deleted `ActivityLog` component from git history before setting `UNIFIED_TIMELINE=false`. See `docs/decisions/timeline-remediation.md`.

## Related

- Full audit baseline: `docs/audit/baseline/`
- Timeline module that consumes `UNIFIED_TIMELINE_ENABLED`: `src/atomic-crm/timeline/`
