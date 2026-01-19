# Development Documentation

**Purpose:** Central hub for Crispy CRM development guides and references.

---

## Task Management

These guides explain how to track and complete work in Crispy CRM:

| Document | Description |
|----------|-------------|
| [Task Management Workflow](./TASK_MANAGEMENT.md) | How to use Finding IDs, priorities, and track work |
| [Finding ID Registry](./FINDING_IDS.md) | Complete reference of all Finding ID prefixes and meanings |

### Quick Start

1. Check session startup output for ready tasks (P0/P1)
2. Pick highest priority unblocked item
3. Update status: `Open` → working → `Resolved`
4. Commit with Finding ID: `fix(ui): resolve UI-04 portal focus [Confidence: 95%]`

---

## Key Tracking Files

| File | Purpose |
|------|---------|
| `docs/technical-debt.md` | Categorical tracker (UI, ASYNC, ERR, etc.) with 25 open items |
| `docs/TODOs.md` | Active execution plan for provider audit findings |
| `docs/PROVIDER_AUDIT_REPORT.md` | Source audit findings (reference) |

---

## Architecture & Patterns

- [PROVIDER_RULES.md](../../.claude/rules/PROVIDER_RULES.md) - Data Provider golden rules
- [CLAUDE.md](../../CLAUDE.md) - Project overview and engineering principles

---

## Related Documentation

| Category | Location |
|----------|----------|
| E2E Testing | `docs/tests/e2e/` |
| Feature Specs | `docs/features/` |
| Audit Archives | `docs/archive/audits/` |
| State Verification | `docs/_state/` |

---

*Last Updated: 2026-01-18*
