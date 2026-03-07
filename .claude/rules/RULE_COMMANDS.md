---
description: Shared verification and audit command definitions
globs: ["src/**", "supabase/**"]
---

# Rule Commands Appendix

Shared command catalog referenced by rule IDs. Keep command definitions here and reference by command ID from overlays.

## Command IDs

- [CMD-001] Production console scan
  - `grep -rn "console\.(log|warn|error|info|debug)(" src/ --include="*.ts" --include="*.tsx" --exclude-dir=tests --exclude="*.test.ts" --exclude="*.test.tsx" --exclude="logger.ts" --exclude="devLogger.ts" | wc -l`
- [CMD-002] Any/cast scan
  - `rg ": any|as any|any\[\]|Promise<any>" src/ --type ts | grep -v " \* \| \*/\|:\s*//" | wc -l`
- [CMD-003] Type check
  - `npx tsc --noEmit`
- [CMD-004] Resolver adapter violation scan
  - `grep -r "zodResolver" src/ --exclude="zodErrorFormatting.ts"`
- [CMD-005] Lint + format checks
  - `npm run lint`
- [CMD-006] Policy inventory audit
  - `rg "CREATE POLICY" supabase/migrations`
- [CMD-007] Raw Datagrid import audit
  - `grep -r "import.*Datagrid.*from.*react-admin" src/ --include="*.tsx" | grep -v PremiumDatagrid.tsx`
- [CMD-008] Rules coverage check
  - `node scripts/rules/check-rules-coverage.mjs`
- [CMD-009] Rules duplication check
  - `node scripts/rules/check-rules-duplication.mjs`
- [CMD-010] Rules token budget check
  - `node scripts/rules/check-rules-token-budget.mjs`

## Command Policy

- Rule files must reference command IDs instead of inlining duplicate command blocks.
- If a command changes, update only this file.
