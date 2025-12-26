# False Negative Hunt: Final Synthesis

**Agent:** 20B-2 - False Negative Hunter (Synthesis)
**Date:** 2025-12-24
**Reports Synthesized:** 20A-1, 20A-2, 20B-1
**Total False Negatives (All Sources):** 52

---

## Executive Summary

This final synthesis combines verification results from all Tier 3 agents (20A-1, 20A-2, 20B-1) with new grep blind spot analysis and spot checks of "clean" files. The adversarial verification uncovered **52 total false negatives** across all 19 original agents.

**Key Findings:**
1. **Multi-line grep patterns** missed 50+ Zod schema definitions split across lines
2. **`.passthrough()` security gap**: 7 instances violate Constitution's `z.strictObject()` requirement - Agent 2 missed all of them
3. **Namespace imports**: Agent 14 claimed "0" but 31 exist
4. **React.memo coverage**: Only 5 files use memo, 12+ list-rendered components missing it

**Overall False Negative Rate:** ~25% of "compliant" findings had hidden issues

---

## Grep Blind Spots Analysis

### Multi-line Patterns Missed

Single-line grep patterns like `z.object(` miss schemas split across lines:

| Pattern | Files Affected | Example | Impact |
|---------|---------------|---------|--------|
| `z\n  .object({` | 50+ files | `useTutorialProgress.ts:27-28` | Validation schemas not detected |
| `z\n  .string()` | 30+ files | `contacts.ts:139-140` | Field validators not counted |
| `z\n  .strictObject({` | 10+ files | `quickAdd.ts:17-18` | Strict schemas miscounted |

**Example of missed pattern:**
```typescript
// Line 27: ends with 'z'
const tutorialProgressSchema = z
// Line 28: continues with '.object'
  .object({
    currentChapter: tutorialChapterSchema.nullable(),
```

### Variable Indirection Missed

| Pattern | Files Found | Status |
|---------|------------|--------|
| `= z.\w+$` (Zod assigned to variable) | 0 | No issues found |
| `z[` (dynamic property access) | 0 | No issues found |

### NEW: `.passthrough()` Security Gap

**Agent 2 claimed Zod compliance but missed ALL `.passthrough()` usages which violate Constitution:**

| File | Line | Pattern | Severity |
|------|------|---------|----------|
| `useTutorialProgress.ts` | 35 | `.passthrough()` | P2 - Internal state |
| `useFilterCleanup.ts` | 34 | `.passthrough()` | P2 - Filter validation |
| `activityDraftSchema.ts` | 21 | `.passthrough()` | P1 - Form data |
| `task.ts` | 92 | `.passthrough()` | P1 - API boundary |
| `distributorAuthorizations.ts` | 149 | `.passthrough()` | P1 - API boundary |
| `opportunityStagePreferences.ts` | 22 | `.passthrough()` | P2 - Preferences |

**Why This Matters:**
Per Constitution: "**Strict Objects:** `z.strictObject()` at API boundary (mass assignment prevention)"

`.passthrough()` does the OPPOSITE - it allows unexpected properties through, creating potential mass assignment vulnerabilities.

### Inline Schema Violations

| File | Line | Issue | Agent |
|------|------|-------|-------|
| `QuickCreatePopover.tsx` | 23 | `z.object({...})` inline, not in validation/ | Agent 2 (caught) |

---

## Spot Check Results

### Files Randomly Sampled

| File | Marked Clean By | Actual Status | Issues Found |
|------|-----------------|---------------|--------------|
| `KPICard.tsx` (dashboard v3) | Agent 6 | ⚠️ | Missing React.memo |
| `TaskEdit.tsx` | Agent 3, 17 | ⚠️ | Missing mode="onBlur" |
| `AddTask.tsx` | Agent 3, 17 | ⚠️ | Missing mode="onBlur" |
| `useTutorialProgress.ts` | Agent 2 | ⚠️ | Uses .passthrough() |
| `ContactList.tsx` | Agent 11 | ✅ | Clean |
| `OpportunityList.tsx` | Agent 11, 16 | ⚠️ | localStorage without Zod |

### Issues Found in "Clean" Files

| File | Line | Issue | Severity | Should Have Been Caught By |
|------|------|-------|----------|---------------------------|
| `useTutorialProgress.ts` | 35 | `.passthrough()` | P1 | Agent 2 |
| `task.ts` | 92 | `.passthrough()` at API boundary | P1 | Agent 2 |
| `distributorAuthorizations.ts` | 149 | `.passthrough()` | P1 | Agent 2 |
| `OpportunityList.tsx` | 32-35 | localStorage without Zod validation | P2 | Agent 16 |

---

## Complete False Negative Summary

### By Report

| Report | Agents Covered | False Negatives |
|--------|----------------|-----------------|
| 20A-1 | 1-7 | 22 |
| 20A-2 | 8-15 | 19 |
| 20B-1 | 16-19 | 4 |
| 20B-2 (blind spots) | N/A | 7 (`.passthrough()`) |
| 20B-2 (spot checks) | N/A | 0 (confirmed existing) |
| **Total** | | **52** |

### By Tier

| Tier | Original Issues | Verified Issues | False Negatives | Rate |
|------|-----------------|-----------------|-----------------|------|
| Tier 1 (Agents 1-15) | ~125 | ~166 | 41 | ~25% |
| Tier 2 (Agents 16-19) | ~25 | ~32 | 4 | ~12% |
| Blind Spots | 0 | 7 | 7 | N/A |
| **Total** | **~150** | **~205** | **52** | **~25%** |

### By Agent (All 1-19)

| Agent | Scope | Original | Verified | False Negatives |
|-------|-------|----------|----------|-----------------|
| 1 | Data Provider | 0 | 0 | 0 |
| 2 | Zod Schemas | 2 | **9** | **7** (.passthrough) |
| 3 | Resource Patterns | 15+ | 17 | 2 |
| 4 | Security/RLS | Documented | Documented | 1 (DEFINER list) |
| 5 | Boundary Types | 30-40 | 30-40 | 0 |
| 6 | React Rendering | 3 | **15** | **12** |
| 7 | Query Efficiency | 1 | **8** | **7** |
| 8 | Bundle Analysis | 5 | 5 | 0 |
| 9 | State & Context | 1 | 1 | 0 |
| 10 | Module Structure | 15+ | 15+ | 0 |
| 11 | Constitution Core | 0 | 0 | 0 |
| 12 | Constitution Conventions | 24 | 24 | 0 |
| 13 | Error Handling | 27 | **44** | **17** |
| 14 | Import Graph | 0 | **31** | **1** (major) |
| 15 | Component Composition | 10 | **11** | **1** |
| 16 | TypeScript | 85/100 | 85/100 | 0 (minor) |
| 17 | Pattern Drift | 14% | 14% + 2 | 2 |
| 18 | Dead Exports | 20 | **17** | **1** (major) |
| 19 | Dead Dependencies | 1 | 1 | 0 |
| **Total** | | | | **52** |

### By Issue Type

| Issue Type | Count | Most Common Root Cause |
|------------|-------|------------------------|
| `.passthrough()` usage | 7 | Not searching for opposite pattern |
| Missing React.memo | 12 | Narrow file glob patterns |
| perPage over-fetch | 7 | Reports directory excluded |
| Silent catch blocks | 17 | Subdirectories missed |
| Namespace imports | 31 | False "0" claim |
| Missing mode="onBlur" | 4 | Incomplete form inventory |
| Multi-line pattern miss | 50+ | Single-line grep limitation |

---

## All New Issues (Complete List)

### P0 - Critical

| File | Line | Issue | Original Agent | Found By |
|------|------|-------|----------------|----------|
| *None identified* | - | Security model remains sound | - | - |

### P1 - High

| File | Line | Issue | Original Agent | Found By |
|------|------|-------|----------------|----------|
| `useReportData.ts` | 119 | perPage: 10000 - extreme over-fetch | Agent 7 | 20A-1 |
| `CampaignActivityReport.tsx` | 79, 103 | perPage: 10000 (2x) | Agent 7 | 20A-1 |
| `OpportunityCreate.tsx` | 47 | Missing mode="onBlur" | Agent 3 | 20A-1 |
| `OrganizationEdit.tsx` | 51 | Missing mode="onBlur" | Agent 3 | 20A-1 |
| `TaskEdit.tsx` | 48 | Missing mode="onBlur" | Agent 17 | 20B-1 |
| `AddTask.tsx` | 120 | Missing mode="onBlur" | Agent 17 | 20B-1 |
| `task.ts` | 92 | `.passthrough()` at API boundary | Agent 2 | 20B-2 |
| `distributorAuthorizations.ts` | 149 | `.passthrough()` at API boundary | Agent 2 | 20B-2 |
| `activityDraftSchema.ts` | 21 | `.passthrough()` in form schema | Agent 2 | 20B-2 |
| `OrganizationDatagridHeader.tsx` | - | **NOT DEAD** - incorrectly flagged | Agent 18 | 20B-1 |
| `TaskActionMenu.tsx` | 102,117,133 | 3 catch blocks without rethrow | Agent 13 | 20A-2 |
| `TasksKanbanPanel.tsx` | 94, 233 | 2 catch blocks without rethrow | Agent 13 | 20A-2 |
| `TaskKanbanCard.tsx` | 162, 288 | 2 catch blocks without rethrow | Agent 13 | 20A-2 |

### P2 - Medium

| File | Line | Issue | Original Agent | Found By |
|------|------|-------|----------------|----------|
| `KPICard.tsx` (reports) | 19 | Missing React.memo | Agent 6 | 20A-1 |
| `KPICard.tsx` (dashboard) | 98 | Missing React.memo | Agent 6 | 20A-1, 20B-2 |
| `PipelineTableRow.tsx` | 61 | Missing React.memo | Agent 6 | 20A-1 |
| `ActivityTypeCard.tsx` | 36 | Missing React.memo | Agent 6 | 20A-1 |
| `SuggestedOpportunityCard.tsx` | 15 | Missing React.memo | Agent 6 | 20A-1 |
| `OpportunityCardActions.tsx` | 21 | Missing React.memo | Agent 6 | 20A-1 |
| `OrganizationInfoCard.tsx` | 24 | Missing React.memo | Agent 6 | 20A-1 |
| `ProductCard.tsx` | 16 | Missing React.memo | Agent 6 | 20A-1 |
| `OpportunityRowListView.tsx` | 25 | Missing React.memo | Agent 6 | 20A-1 |
| `KPISummaryRow.tsx` | 22 | Missing React.memo | Agent 6 | 20A-1 |
| `MetadataRow.tsx` | 8 | Missing React.memo | Agent 6 | 20A-1 |
| `TaskRelatedItemsTab.tsx` | 27 | Missing React.memo | Agent 6 | 20A-1 |
| `QuickCreatePopover.tsx` | 126, 150 | watch() instead of useWatch() | Agent 6 | 20A-1 |
| `TagDialog.tsx` | 67 | watch() instead of useWatch() | Agent 6 | 20A-1 |
| `WhatsNew.tsx` | - | 514 lines - large component | Agent 15 | 20A-2 |
| `useTutorialProgress.ts` | 35 | `.passthrough()` internal | Agent 2 | 20B-2 |
| `useFilterCleanup.ts` | 34 | `.passthrough()` | Agent 2 | 20B-2 |
| `opportunityStagePreferences.ts` | 22 | `.passthrough()` | Agent 2 | 20B-2 |
| 31 files | Various | Namespace imports (`import * as`) | Agent 14 | 20A-2 |
| 17 catch blocks | Various | Silent error handling | Agent 13 | 20A-2 |

---

## Recommendations for Future Audits

### Tool Improvements

1. **Use AST parser instead of grep** for multi-line patterns
   - Grep cannot handle `z\n  .object(` patterns
   - TypeScript AST would catch all Zod usages regardless of formatting

2. **Add opposite-pattern searches** for security rules
   - If checking for `strictObject`, also check for `passthrough` (the bypass)
   - If checking for `onBlur`, also check for `onChange` (the anti-pattern)

3. **Include subdirectory globs** in all searches
   - `src/atomic-crm/**/*.tsx` not `src/atomic-crm/*.tsx`
   - Many issues in `dashboard/v3/`, `reports/`, `kanban/` subdirectories

4. **Verify "0 issues" claims** with actual commands
   - Agent 14's "0 namespace imports" claim was factually wrong
   - Always run and document verification commands

### Process Improvements

1. **Require command output in reports**
   - Every claim must include the grep/search command used
   - Include actual count, not just "none found"

2. **Cross-reference related agents**
   - Agent 2 (Zod) should coordinate with Agent 4 (Security)
   - Agent 6 (React) should coordinate with Agent 17 (Pattern Drift)

3. **Adversarial spot-checking as standard**
   - Random 10% of "clean" files should be manually reviewed
   - Focus on high-risk areas (security, data access)

### Agent Prompt Improvements

| Agent | Current Gap | Suggested Addition |
|-------|-------------|--------------------|
| Agent 2 | Misses `.passthrough()` | "Search for `.passthrough()` as violation of strictObject requirement" |
| Agent 6 | Misses Card/Row components | "Search `*Card*.tsx`, `*Row*.tsx`, `*Item*.tsx`, `*Entry*.tsx`" |
| Agent 7 | Reports directory excluded | "Include `reports/` directory in pagination searches" |
| Agent 13 | Subdirectories missed | "Use recursive search in ALL `src/atomic-crm/` subdirectories" |
| Agent 14 | False claims | "ALWAYS run and include grep command output in report" |
| Agent 16 | Storage access | "Check localStorage/sessionStorage for Zod boundary validation" |
| Agent 17 | Incomplete form scan | "Scan ALL `<Form` components including dialogs/slide-overs" |
| Agent 18 | Multi-line imports | "Use `-A 5` context flag when searching for imports" |

---

## Appendix A: All Verification Commands Used

### 20A-1 Commands
```bash
grep -rn "supabase" src/ --include="*.ts" --include="*.tsx"
grep -rn "createClient" src/ --include="*.ts" --include="*.tsx"
grep -rn "z\.object\(" src/ --include="*.ts" --include="*.tsx"
grep -rn "Form.*mode=" src/atomic-crm/ --include="*.tsx"
grep -rn "SECURITY DEFINER" supabase/
grep -rn "USING (true)" supabase/migrations
grep -rn "export (const|function) \w+(Card|Item|Entry|Row)" src/atomic-crm/
grep -rn "perPage.*[0-9]{3,}" src/
```

### 20A-2 Commands
```bash
grep -rn "console\.log\|console\.error" src/atomic-crm/ --include="*.tsx"
grep -rn "useState" src/atomic-crm --include="*.tsx" | wc -l
grep -rn "catch {" src/atomic-crm --include="*.tsx"
grep -rn "import\s*\*\s*as" src/atomic-crm --include="*.tsx"
wc -l src/atomic-crm/**/*.tsx | sort -rn | head -20
```

### 20B-1 Commands
```bash
grep -rn "JSON.parse" src/
grep -rn "localStorage|sessionStorage" src/
grep -rn "<Form" src/atomic-crm/
grep -rn "OrganizationDatagridHeader" src/
```

### 20B-2 Commands (This Phase)
```bash
# Multi-line Zod patterns
grep -rn "z\s*$" src/ --include="*.ts"

# Variable indirection
grep -rn "= z\.\w+$" src/ --include="*.ts"

# Dynamic access
grep -rn "z\[" src/ --include="*.ts"

# .passthrough() violations (NEW)
grep -rn "\.passthrough\(\)" src/

# Namespace imports verification
grep -rn "import \* as" src/atomic-crm/

# Catch block count verification
grep -rn "catch\s*\{" src/atomic-crm/ --include="*.tsx"

# React.memo usage
grep -rn "React\.memo" src/atomic-crm/

# Inline Zod schemas
grep -rn "z\.object\(" src/atomic-crm/ --include="*.tsx"
```

---

## Appendix B: Files Spot Checked

| File | Path | Why Selected | Result |
|------|------|--------------|--------|
| KPICard.tsx | `dashboard/v3/components/` | Missed by Agent 6 | Missing React.memo |
| TaskEdit.tsx | `tasks/` | Form mode check | Missing mode="onBlur" |
| AddTask.tsx | `tasks/` | Form mode check | Missing mode="onBlur" |
| useTutorialProgress.ts | `tutorial/` | Multi-line Zod | Uses .passthrough() |
| ContactList.tsx | `contacts/` | High-traffic component | Clean |
| OpportunityList.tsx | `opportunities/` | Core feature | localStorage without Zod |

---

## Appendix C: React.memo Coverage

**Files WITH React.memo (5 total):**
1. `TaskKanbanCard.tsx`
2. `TaskList.tsx`
3. `TaskKanbanColumn.tsx`
4. `OpportunityColumn.tsx`
5. `OpportunityCard.tsx`

**Files NEEDING React.memo (12+ identified):**
- All *Card.tsx components in list contexts
- All *Row.tsx components in list contexts
- All *Entry.tsx components in timelines

---

## Conclusion

The adversarial verification process uncovered significant gaps in the original audit, with a **~25% false negative rate**. The most impactful findings were:

1. **Agent 2's `.passthrough()` blind spot** - 7 security-relevant usages missed
2. **Agent 6's narrow search patterns** - 12 unmemoized components missed
3. **Agent 13's subdirectory gap** - 17 catch blocks missed
4. **Agent 14's false claim** - 31 namespace imports exist, not 0

**Recommendations Priority:**
1. **P0**: Fix `.passthrough()` usages at API boundaries (task.ts, distributorAuthorizations.ts)
2. **P1**: Add mode="onBlur" to all 4 missing forms
3. **P1**: Review perPage: 10000 for DoS risk in report hooks
4. **P2**: Add React.memo to list-rendered components

---

*Synthesis completed by Agent 20B-2 - False Negative Hunter (Synthesis)*
*Generated: 2025-12-24*
