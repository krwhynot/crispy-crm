# Core Constraints

Canonical cross-cutting constraints for Crispy CRM. Overlay files in `.claude/rules/*.md` must reference these IDs instead of duplicating normative text.

## Canonical Rules

- [CORE-001] Data access boundary: do not import or call Supabase directly from feature components. Supabase access belongs in provider handlers/services, migrations, or edge functions.
- [CORE-002] Production logging boundary: no `console.log|info|warn|error|debug` in production code.
- [CORE-003] Type safety boundary: no `: any`, `as any`, `any[]`, `Promise<any>`, or unsafe double-casts without a runtime guard.
- [CORE-004] Schema source-of-truth: define canonical Zod schemas and derive TS types from `z.infer`.
- [CORE-005] Create boundary strictness: create payload schemas reject unknown keys.
- [CORE-006] Update boundary strictness: each update flow must explicitly choose either strict+coverage or passthrough+sanitize-before-write.
- [CORE-007] Provider validation boundary: writes must pass provider-layer schema validation (`ValidationService` + `withValidation`) before DB calls.
- [CORE-008] Read/write duality: list/getMany/getManyReference read from configured summary resources; writes target base tables.
- [CORE-009] Computed-field hygiene: strip view-only/computed fields before strict validation or base-table writes.
- [CORE-010] Soft-delete contract: deletes are `deleted_at` updates unless explicitly exempted; reads must hide soft-deleted rows.
- [CORE-011] Access-control baseline: RLS policies must enforce authenticated access and tenant/ownership boundaries; `USING (true)` is banned except approved service/public cases.
- [CORE-012] Error wrapper boundary: provider chains must keep centralized error handling (`withErrorLogging`) as the outer wrapper.
- [CORE-013] Async side-effect boundary: async side-effects must be awaited or explicitly `void` with `.catch`; silent catches are banned.
- [CORE-014] Accessibility baseline: invalid fields expose `aria-invalid`, `aria-describedby`, labels are associated, errors use `role="alert"`, and status updates use `aria-live` when needed.
- [CORE-015] Modal landmark baseline: `DialogContent`, `AlertDialogContent`, and drawer/dialog equivalents include a title element (visible or `sr-only`).
- [CORE-016] Datagrid baseline: use `PremiumDatagrid` wrapper instead of raw `react-admin` `Datagrid`.
- [CORE-017] Semantic UI baseline: use semantic tokens (no hardcoded hex colors) and minimum interactive target size of 44px.
- [CORE-018] React Admin resolver baseline: forms use `createFormResolver(...)`; direct `zodResolver(...)` in RA forms is disallowed.
- [CORE-019] Storage hygiene baseline: centralize bucket/type/size constraints, sanitize filenames, and handle explicit storage error branches.
- [CORE-020] Command registry baseline: shared verification/audit commands are defined once in `RULE_COMMANDS.md` and referenced by command IDs.
- [CORE-021] Pre-commit quality gate: run command IDs `CMD-001` through `CMD-005` before claiming rule-compliant completion.
- [CORE-022] Exception boundary: test files, logging infrastructure files, scripts/config/docs are the only allowed exception classes to `CORE-002` and `CORE-003`.

## Usage Contract

- Overlays should reference IDs with `Applies: CORE-xxx` instead of restating core constraints.
- New always-applicable constraints must be added here first.
- Rule IDs are stable and are mapped from legacy items in `RULE_INDEX.md`.
