# Audit System

Tiered UX blocker audit system for Crispy CRM. Detects user-blocking issues — broken forms, stale data, navigation traps, and architectural fault lines — using 56 pattern-based checks across 6 categories. Runs inside Claude Code as slash commands.

## Directory Structure

```
.claude/commands/audit/
├── ux-blockers.md              # Main entry point (--quick / --deep / --category)
├── deep/                       # Category-specific deep dives
│   ├── actions.md
│   ├── data-flow.md
│   ├── fault-lines.md
│   ├── filters.md
│   ├── forms.md
│   └── navigation.md
├── data-integrity.md           # Engineering audit: soft deletes, views, Strangler Fig
├── error-handling.md           # Engineering audit: fail-fast, silent catches
├── forms.md                    # Engineering audit: form & validation health
├── stale-state.md              # Engineering audit: cache invalidation, refetch
├── workflow-gaps.md            # Engineering audit: business logic holes
├── lib/
│   ├── checks.json             # 56 check definitions (patterns, confidence, impact)
│   └── output-schema.json      # JSON Schema for audit output
├── reports/                    # Generated JSON reports (gitignored)
│   └── .gitignore
├── _archived/                  # Superseded commands (kept for reference)
│   ├── accessibility.md
│   ├── architecture.md
│   ├── code-quality.md
│   ├── db-hardening.md
│   ├── full.md
│   ├── performance.md
│   ├── security.md
│   └── typescript.md
└── README.md                   # This file
```

## Quick Start

```bash
# Quick scan — blockers only, fastest
/audit/ux-blockers --quick

# Standard scan — blockers + warnings (default)
/audit/ux-blockers

# Deep scan — standard + auto-dispatches deep dives for failing categories
/audit/ux-blockers --deep

# Single category only
/audit/ux-blockers --category=forms
```

## Command Reference

### UX Blockers (main entry point)

| Command | Description |
|---------|-------------|
| `/audit/ux-blockers` | Find user-blocking issues. Tiered scan (56 checks, 6 categories) |
| `--quick` | Blockers only (confidence >= 0.95), skip inventory cross-reference |
| `--deep` | Standard + auto-dispatch deep dives for categories with findings |
| `--category=X` | Scan single category: `forms`, `filters`, `actions`, `data`, `nav`, `arch` |

### Deep Dives (category-specific investigation)

| Command | Description |
|---------|-------------|
| `/audit/deep/forms` | Form submission, validation, and field binding issues |
| `/audit/deep/filters` | List filters, pagination, search, and empty state issues |
| `/audit/deep/actions` | Delete, create, update, and bulk operation issues |
| `/audit/deep/data-flow` | Stale data, loading states, cache invalidation, and error handling |
| `/audit/deep/navigation` | Routes, modals, slide-overs, and accessibility navigation issues |
| `/audit/deep/fault-lines` | Stack-specific architecture risks: RLS, views, soft-delete, deprecated fields |

### Engineering Audits (structural health)

| Command | Description |
|---------|-------------|
| `/audit/data-integrity` | Soft deletes, Strangler Fig migration, view/table duality |
| `/audit/error-handling` | Fail-fast violations, retry logic, silent catches |
| `/audit/forms` | Forms & validation architecture health |
| `/audit/stale-state` | Cache invalidation, refetch patterns, query key hygiene |
| `/audit/workflow-gaps` | Business logic holes, silent defaults |

### Justfile Aliases

| Alias | Maps to |
|-------|---------|
| `just audit` | `/audit/ux-blockers` |
| `just audit-deep` | `/audit/ux-blockers --deep` |
| `just audit-forms` | `/audit/deep/forms` |
| `just audit-filters` | `/audit/deep/filters` |
| `just audit-actions` | `/audit/deep/actions` |
| `just audit-data` | `/audit/deep/data-flow` |
| `just audit-nav` | `/audit/deep/navigation` |
| `just audit-faults` | `/audit/deep/fault-lines` |
| `just audit-list` | Print all audit commands |

## How It Works

The main `/audit/ux-blockers` command runs a 5-phase pipeline:

```
Phase 1: SETUP           Load checks.json + output-schema.json, parse arguments
Phase 2: QUICK SCAN      Run 56 rg patterns against codebase, calculate confidence
Phase 3: CROSS-REFERENCE Cross-check forms vs schemas, verify handler coverage
Phase 4: REPORT          Write JSON to reports/, markdown to docs/audits/
Phase 5: DEEP DIVES      (--deep only) Dispatch deep dives for failing categories
```

**Confidence thresholds:**
- **Blocker** (>= 0.95): High-confidence user-blocking issue
- **Warning** (0.80–0.94): Likely issue, needs manual verification
- **Info** (0.60–0.79): Possible issue, verify before acting

## Check Categories

56 checks total, distributed across 6 categories:

| Category | ID Prefix | Count | Scope |
|----------|-----------|-------|-------|
| Form Submission & Validation | `FORM-B0xx` | 10 | React Admin form submit, validation, field binding |
| List Filters & Pagination | `FILTER-B0xx` | 10 | Filter controls, search, pagination, empty states |
| CRUD Actions & Operations | `ACTION-B0xx` | 10 | Delete, create, update, mutations, error handling |
| Data Flow & Cache | `DATA-B0xx` | 10 | Stale data, cache invalidation, loading states |
| Navigation & Modals | `NAV-B0xx` | 8 | Routes, modals, slide-overs, a11y navigation |
| Architecture & Stack Risks | `ARCH-B0xx` | 8 | RLS, views, soft-delete, deprecated fields |

Each check has: `id`, `pattern` (ripgrep regex), `glob` (file scope), `user_impact`, `confidence_base`, and `stack_specific` flag. See `lib/checks.json` for full definitions.

## Output Locations

| Output | Location | Format |
|--------|----------|--------|
| JSON report | `.claude/commands/audit/reports/` | `output-schema.json` compliant |
| Markdown report | `docs/audits/` | Human-readable with delta tracking |
| Console summary | stdout | < 50 lines |

JSON reports in `reports/` are gitignored. Markdown reports in `docs/audits/` are tracked.

## Archived Commands

The `_archived/` directory contains 8 superseded audit commands from the pre-tiered system. These are kept for reference but are not part of the current workflow:

`accessibility`, `architecture`, `code-quality`, `db-hardening`, `full`, `performance`, `security`, `typescript`

Their functionality has been consolidated into the tiered UX blockers system and the 5 engineering audits.
