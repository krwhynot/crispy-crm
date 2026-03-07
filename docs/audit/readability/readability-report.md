# AI Readiness Report

**Codebase:** Crispy CRM (Atomic CRM)
**Scan ID:** scan-20260306-001
**Date:** 2026-03-06
**Stack:** TypeScript / React Admin / Supabase
**Scanner Version:** 0.3.0

---

## Composite Score

| Metric | Value |
|--------|-------|
| **Score** | **88.9 / 100** |
| **Grade** | **B+** |
| **Phase 2 Eligible** | Yes |
| **Critical Gates** | 8/8 pass |

### Delta from Previous Scan

| Metric | Previous (scan-20260305-004) | Current | Change |
|--------|-----|---------|--------|
| Score | 92.9 | 88.9 | **-4.0** |
| Grade | A- | B+ | Down 1 |
| Phase 2 | Eligible | Eligible | -- |

---

## Category Breakdown

| # | Category | Points | Max | Score | Grade | Weight | Weighted |
|---|----------|--------|-----|-------|-------|--------|----------|
| 1 | Manifest Detection | 9 | 9 | 100.0% | A+ | 14% | 14.00 |
| 2 | Context Files | 18 | 20 | 90.0% | A- | 18% | 16.20 |
| 3 | Structure | 13 | 16 | 81.3% | B- | 17% | 13.81 |
| 4 | Entry Points | 9 | 11 | 81.8% | B- | 9% | 7.36 |
| 5 | Conventions | 12 | 13 | 92.3% | A- | 11% | 10.15 |
| 6 | Feedback Loops | 10 | 11 | 90.9% | A- | 7% | 6.36 |
| B | Baseline | 4 | 5 | 80.0% | B- | 5% | 4.00 |
| 8 | Context Budget | 12 | 13 | 92.3% | A- | 11% | 10.15 |
| 9 | Database | 12 | 14 | 85.7% | B | 8% | 6.86 |
| | **Composite** | **99** | **112** | | **B+** | **100%** | **88.90** |

---

## What Changed (Delta Analysis)

### Improved (1 check)

| Check | Previous | Current | Impact |
|-------|----------|---------|--------|
| 5.3 Pattern consistency | partial (1/2) | pass (2/2) | Handler files confirmed identical structure across sampled files |

### Regressed (4 checks)

| Check | Previous | Current | Root Cause |
|-------|----------|---------|------------|
| 2.7 Build/run commands | pass (2/2) | partial (1/2) | `npm run build` and `npm run lint` not in CLAUDE.md body |
| 2.9 Key commands | pass (2/2) | partial (1/2) | Same root cause -- commands delegated to RULE_COMMANDS.md |
| 4.3 Configuration sources | pass (2/2) | fail (0/2) | 22 files scatter `import.meta.env` reads with no centralized config module |
| 8.6 Instruction budget | pass (2/2) | partial (1/2) | AGENT_ROUTING.md now always-loaded (no globs: frontmatter), pushing count from 65 to 95 |

---

## Critical Gates

All 8 critical gates pass. Phase 2 (Three Pillars Audit) is unblocked.

| Gate | Check | Status | Notes |
|------|-------|--------|-------|
| 1.1 | Primary manifest exists | PASS | package.json at root |
| 2.1 | Claude Code context file exists | PASS | CLAUDE.md + .claude/ directory |
| 2.5 | CLAUDE.md exists specifically | PASS | 109 lines at project root |
| 2.9 | CLAUDE.md contains key commands | PASS | Test command present; build/lint in rules (partial score, gate passes) |
| 3.6 | No monolith files | PASS | No hand-written files >5000 lines |
| 4.1 | Clear application entry point | PASS | src/main.tsx -> App.tsx -> CRM.tsx |
| 5.6 | Do-not-touch zones marked | PASS | 6 protected paths documented |
| 6.1 | Test files exist | PASS | 381 test files (23.6% ratio) |

---

## Detailed Findings by Category

### Category 1: Manifest Detection (9/9, A+)

All checks pass at maximum. Package.json is complete with 71 dependencies, 60+ scripts, and clear language/framework detection. README.md provides purpose description and 5-step Quick Start.

### Category 2: Context Files (18/20, A-)

Exceptionally mature Claude Code setup with 12 rules files, 16 agent definitions, 155 skill files, and 3 commands. Two partial scores share one root cause: CLAUDE.md delegates build/lint commands to RULE_COMMANDS.md rather than surfacing them directly.

**Fix:** Add a brief "Key Commands" section to CLAUDE.md:
```
## Key Commands
- Build: `npm run build`
- Dev: `npm run dev`
- Test: `npm test`
- Lint: `npm run lint`
- Type check: `npx tsc --noEmit`
```

### Category 3: Structure (13/16, B-)

Strong fundamentals (naming, co-location, separation, READMEs) but 7 directories exceed 50 files. The biggest offenders are `migrations-archive` (368 files, archival), `ra-wrappers` (98), and `ui` (84). One auto-generated monolith file (database.generated.ts) is correctly marked "Do Not Read."

### Category 4: Entry Points (9/11, B-)

Clear entry chain and centralized route definitions. Regressed on 4.3 because 22 source files access `import.meta.env` directly without a centralized config module. This is the only new regression since the previous scan.

**Fix:** Create `src/config/env.ts` that exports all `VITE_*` variables with TypeScript types. Replace 22 scattered reads.

### Category 5: Conventions (12/13, A-)

All 7 checks pass. Handler pattern consistency (5.3) improved from partial to pass -- sampled handler files confirmed identical JSDoc headers, import patterns, factory signatures, and wrapper composition. Strong linter/formatter config, strict TypeScript, actionable CLAUDE.md language, and well-marked protected zones.

### Category 6: Feedback Loops (10/11, A-)

381 test files at 23.6% ratio (partial on 6.1, needs 60% for full marks). Vitest runner, 3 GitHub Actions workflows, Husky pre-commit (188 lines), and Claude Code hooks (PreToolUse, PostToolUse, Stop) all configured. Test command cross-validation passes.

### Category 7: Baseline (4/5, B-)

7 fresh JSON baselines from 2026-03-04. Previous audit results available for delta comparison. Missing: audit progress file for scan resumption (B.3 fail, same as previous scan).

### Category 8: Context Budget (12/13, A-)

Clean architecture with lean CLAUDE.md (40 imperatives, 108 lines), 0 anti-patterns, 2 MCP servers, and active progressive disclosure. One gap: AGENT_ROUTING.md lacks `globs:` frontmatter, making its 30 imperatives always-loaded and pushing the total from 65 to 95 (over the 80 threshold).

**Fix:** Add YAML frontmatter to AGENT_ROUTING.md:
```yaml
---
description: Agent routing and subagent selection
globs: ["src/**", ".claude/**"]
---
```

### Category 9: Database (12/14, B)

Exemplary database readability: 6 declarative schema files (1,169 lines), 17 sequential migrations, centralized data access through composedDataProvider.ts, Supabase MCP with full permissions, comprehensive seed data, and thorough schema documentation. One gap: generated types are ~12 hours stale.

---

## Scanner Discrepancy Note

The context-budget scanner (checks 8.1, 8.6) misclassified `RULE_COMMANDS.md` and `RULE_PRECEDENCE.md` as unscoped, but both have `globs:` frontmatter. The orchestrator corrected this: always-loaded count is 95 imperatives (not 136) and ~8,533 tokens (not ~9,167). Checks 8.1 and 8.6 were adjusted accordingly. The raw scanner JSON in `context-budget-scan.json` reflects the uncorrected measurements.

---

## Generation Offers

Prioritized list of artifacts that can improve the score. Run `/three-pillars:readiness-generate` to create missing artifacts.

### HIGH Priority

| # | Artifact | Checks | Impact | Type |
|---|----------|--------|--------|------|
| 1 | Add key commands to CLAUDE.md | 2.7, 2.9 | +2 pts (+0.36w) | Generate |
| 2 | Add globs: to AGENT_ROUTING.md | 8.6 | +1 pt (+0.11w) + reduces cognitive load | Generate |

### MEDIUM Priority

| # | Artifact | Checks | Impact | Type |
|---|----------|--------|--------|------|
| 3 | Centralize import.meta.env | 4.3 | +2 pts (+0.18w) | Manual |
| 4 | Split oversized directories | 3.3 | +2 pts (+0.34w) | Manual |

### LOW Priority

| # | Artifact | Checks | Impact | Type |
|---|----------|--------|--------|------|
| 5 | Regenerate database types | 9.2 | +1 pt (+0.08w) | Manual |
| 6 | Create audit progress file | B.3 | +1 pt (+0.05w) | Generate |
| 7 | Increase test file ratio | 6.1 | +1 pt (+0.07w) | Manual |

### Path to A- (90+)

Current: 88.9 (B+). Need +1.1 points to reach A- (90).

1. **Quick wins (generatable):** Offers #1 and #2 add ~0.47 weighted points -> 89.4 (still B+)
2. **Plus one manual fix:** Offer #3 (centralize env) adds +0.18w -> 89.6, OR Offer #4 (split dirs) adds +0.34w -> 89.7
3. **To cross 90:** Need both quick wins + at least one medium manual fix

---

*Report generated by AI Readiness Scanner v0.3.0*
*Previous scan: scan-20260305-004 (92.9, A-)*
*9 scanner agents, 52 checks, database-inclusive weights*
