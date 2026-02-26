# Rule Precedence

Defines deterministic conflict resolution across always-loaded `.claude/rules/*.md` files.

## Evaluation Order

1. `CORE_CONSTRAINTS.md`
2. `DATABASE_LAYER.md`
3. `PROVIDER_RULES.md`
4. `DOMAIN_INTEGRITY.md`
5. `UI_STANDARDS.md`
6. `MODULE_CHECKLIST.md`
7. `CODE_QUALITY.md`
8. `STALE_STATE_STRATEGY.md`
9. `RULE_COMMANDS.md`
10. `RULE_INDEX.md`

## Conflict Resolution

- `P1`: Core beats overlay for cross-cutting constraints.
- `P2`: Narrower domain beats broader overlay when both are in scope.
- `P3`: If two overlays conflict at equal scope, choose the lower-risk (more restrictive) rule and log follow-up to reconcile.
- `P4`: `RULE_INDEX.md` is traceability metadata; it does not override normative rule text.
- `P5`: Commands in `RULE_COMMANDS.md` are authoritative for command syntax.

## Authoring Rules

- Add new global constraints to `CORE_CONSTRAINTS.md`.
- Keep overlays delta-only; avoid copying core text.
- Every new overlay rule needs a stable family ID (`DB-*`, `DOM-*`, `MOD-*`, `PRV-*`, `STALE-*`, `UI-*`).
