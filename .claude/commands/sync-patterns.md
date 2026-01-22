---
name: sync-patterns
description: Sync PATTERNS.md files with actual code - finds drift and updates documentation. Compares documented patterns against current implementation and reports discrepancies.
allowed-tools: Read, Glob, Grep, Edit, Write, Task, AskUserQuestion, TodoWrite, Bash(fd:*), Bash(rg:*)
argument-hint: [directory path or "all"]
---

# Sync PATTERNS.md Files

Synchronize PATTERNS.md documentation files with actual codebase implementation. This command finds all PATTERNS.md files, analyzes them for drift against current code, and reports findings.

> **SKILL ACTIVATION:** Using `sync-patterns` command for documentation synchronization.

---

## Phase 0: Scope Selection

**IMMEDIATELY ask the user using AskUserQuestion:**

### Question 1: Sync Scope
```
Header: "Scope"
Options:
- "All patterns (Recommended)" - Sync all PATTERNS.md files found
- "Specific directory" - Sync one directory (you'll provide the path)
- "Changed files only" - Sync PATTERNS.md in directories with recent git changes
- "Quick check" - Fast scan without deep analysis
```

### Question 2: Drift Handling
```
Header: "Mode"
Options:
- "Report only (Recommended)" - Show drift without making changes
- "Interactive" - Ask before each update
- "Generate missing prompts" - Also create patterns-generation prompts for directories that lack them
```

---

## Phase 1: Discovery

### Step 1.1: Find All PATTERNS.md Files

```bash
Glob: **/PATTERNS.md
```

**Expected locations (33 files):**
```
Core Features:
  src/atomic-crm/contacts/PATTERNS.md
  src/atomic-crm/organizations/PATTERNS.md
  src/atomic-crm/opportunities/PATTERNS.md
  src/atomic-crm/activities/PATTERNS.md
  src/atomic-crm/tasks/PATTERNS.md
  src/atomic-crm/products/PATTERNS.md
  src/atomic-crm/tags/PATTERNS.md
  src/atomic-crm/notes/PATTERNS.md
  src/atomic-crm/sales/PATTERNS.md

Infrastructure:
  src/atomic-crm/providers/supabase/PATTERNS.md
  src/atomic-crm/validation/PATTERNS.md
  src/atomic-crm/hooks/PATTERNS.md
  src/atomic-crm/filters/PATTERNS.md
  src/atomic-crm/contexts/PATTERNS.md
  src/atomic-crm/utils/PATTERNS.md
  src/atomic-crm/services/PATTERNS.md
  src/atomic-crm/dashboard/PATTERNS.md
  src/atomic-crm/productDistributors/PATTERNS.md

UI Components:
  src/components/admin/PATTERNS.md
  src/components/ui/PATTERNS.md

Database & Edge Functions:
  supabase/migrations/PATTERNS.md
  supabase/functions/_shared/PATTERNS.md
  supabase/docker/PATTERNS.md

Build & DevOps:
  scripts/discover/PATTERNS.md
  scripts/docker/PATTERNS.md
  scripts/dev/PATTERNS.md
  scripts/validation/PATTERNS.md
  scripts/mcp/PATTERNS.md
  .github/workflows/PATTERNS.md
  .husky/PATTERNS.md
  src/lib/PATTERNS.md
  src/tests/PATTERNS.md
  tests/PATTERNS.md
```

### Step 1.2: Check for Generation Prompts

Cross-reference with existing prompts at `.claude/prompts/patterns-generation/`:

| Directory | Has Generation Prompt |
|-----------|----------------------|
| scripts/discover/ | `.claude/prompts/patterns-generation/03-scripts-discover.md` |
| .github/workflows/ | `.claude/prompts/patterns-generation/04-github-workflows.md` |
| .husky/ | `.claude/prompts/patterns-generation/05-husky.md` |
| scripts/dev/ | `.claude/prompts/patterns-generation/06-scripts-dev.md` |
| scripts/mcp/ | `.claude/prompts/patterns-generation/07-scripts-mcp.md` |
| scripts/validation/ | `.claude/prompts/patterns-generation/08-scripts-validation.md` |
| supabase/docker/ | `.claude/prompts/patterns-generation/09-supabase-docker.md` |
| tests/ | `.claude/prompts/patterns-generation/10-tests-e2e.md` |
| scripts/docker/ | `.claude/prompts/patterns-generation/11-scripts-docker.md` |
| src/tests/ | `.claude/prompts/patterns-generation/01-src-tests.md` |
| .claude/skills/ | `.claude/prompts/patterns-generation/02-claude-skills.md` |

---

## Phase 2: Drift Analysis (Parallel Agents)

**Dispatch agents in batches of 3-5** using the Task tool with subagent_type="Explore" to analyze PATTERNS.md files concurrently.

### Agent Prompt Template

For each PATTERNS.md, use this analysis prompt:

```markdown
TASK: Analyze PATTERNS.md Drift
TARGET: {directory}/PATTERNS.md
GOAL: Detect documentation drift from actual code

## Step 1: Read the PATTERNS.md
Read {directory}/PATTERNS.md and extract:
- List of documented patterns (A, B, C, etc.) with their names
- All file paths referenced in code examples
- Architecture diagram structure (if present)
- Anti-patterns listed
- File Reference table entries

## Step 2: Read Current Code
Use Glob to find: {directory}/**/*.{ts,tsx,sql,md}
Read the key files mentioned in PATTERNS.md examples.

## Step 3: Drift Detection

### 3a. File Reference Drift
For each file path in PATTERNS.md:
- Does the file still exist?
- Are line numbers approximately correct (within 20 lines)?
- Do code snippets match current implementation?

### 3b. Pattern Drift
- Are documented patterns still implemented in the code?
- Are there major new patterns not documented?
- Are anti-patterns still relevant?

### 3c. Architecture Drift
- Does directory structure match any diagram?
- Are component/file relationships accurate?

## Step 4: Report

Return a structured report:

**Directory:** {directory}
**Drift Detected:** Yes/No
**Drift Level:** none | minor | moderate | major

**Findings:**

| Type | Issue | Documented | Current |
|------|-------|------------|---------|
| file_reference | {description} | {what PATTERNS.md says} | {what code shows} |
| pattern | {description} | {documented pattern} | {actual pattern} |
| architecture | {description} | {diagram shows} | {actual structure} |

**Recommendation:** no_change | update | regenerate

**Details:**
- [List specific issues found]
```

### Batch Dispatch Example

```
In a SINGLE message, dispatch 3-5 Task calls with subagent_type="Explore":

Task 1: Analyze src/atomic-crm/contacts/PATTERNS.md
Task 2: Analyze src/atomic-crm/organizations/PATTERNS.md
Task 3: Analyze src/atomic-crm/validation/PATTERNS.md
```

---

## Phase 3: Drift Report

**After all agents complete, consolidate findings:**

```markdown
## PATTERNS.md Drift Report

**Scan Date:** {timestamp}
**Total Files Analyzed:** {count}

### Summary
| Status | Count |
|--------|-------|
| No drift | {n} |
| Minor drift | {n} |
| Moderate drift | {n} |
| Major drift | {n} |

### Files Needing Attention

#### Major Drift (Regenerate Recommended)
| Directory | Issues | Key Problems |
|-----------|--------|--------------|
| {dir} | {count} | {summary} |

#### Minor Drift (Update Recommended)
| Directory | Issues | Key Problems |
|-----------|--------|--------------|

### Detailed Findings

#### {directory}/PATTERNS.md
**Drift Level:** {level}
**Recommendation:** {action}

**Issues:**
1. {issue description}
2. {issue description}

---
```

---

## Phase 4: Synchronization (User Approved)

**ONLY proceed with changes after user approval.**

### For Minor Drift (Incremental Update)

Use Edit tool to:
- Fix stale file paths
- Update line number references
- Add small missing patterns
- Update File Reference table

**Preserve:**
- Custom sections user may have added
- Project-specific anti-patterns
- Migration checklists
- Existing structure and formatting

### For Major Drift (Full Regeneration)

1. **Check for generation prompt:**
   ```bash
   ls .claude/prompts/patterns-generation/*{directory-name}*.md
   ```

2. **If prompt exists:**
   - Follow the generation prompt's phases exactly
   - Reference: `.claude/prompts/patterns-generation/_template.md`

3. **If no prompt exists AND user selected "Generate missing prompts":**
   - Create new prompt at `.claude/prompts/patterns-generation/XX-{directory-name}.md`
   - Use template structure from `_template.md`
   - Then generate PATTERNS.md

---

## Phase 5: Output

### Show Summary
```markdown
## Sync Complete

**Analyzed:** {n} PATTERNS.md files
**No changes needed:** {n}
**Updated:** {n}
**Regenerated:** {n}
**Skipped (user declined):** {n}

### Changes Made
- {directory}/PATTERNS.md - Updated file references
- {directory}/PATTERNS.md - Regenerated (major drift)

### Manual Review Needed
- {directory}/PATTERNS.md - Has custom sections that may need review
```

### Create Todos (if any failures or manual reviews needed)
```typescript
TodoWrite([
  { content: "Review {dir}/PATTERNS.md - has custom sections", status: "pending", activeForm: "Reviewing PATTERNS.md" },
  { content: "Manually verify {dir}/PATTERNS.md regeneration", status: "pending", activeForm: "Verifying regeneration" }
])
```

### Offer Git Commit
```markdown
Would you like to commit these PATTERNS.md updates?

Suggested commit message:
docs: sync PATTERNS.md files with current codebase

- Updated {n} files with minor fixes
- Regenerated {n} files with major changes
- Fixed stale file references and line numbers
```

---

## Drift Level Definitions

| Level | Criteria | Action |
|-------|----------|--------|
| **None** | All references valid, patterns match code | No change needed |
| **Minor** | 1-3 stale file refs OR outdated line numbers | Incremental update |
| **Moderate** | Several stale refs AND minor pattern changes | Update with review |
| **Major** | Missing patterns, wrong architecture, >50% refs stale | Full regeneration |

---

## Quick Reference

### Run Full Sync
```
/sync-patterns all
```

### Sync Specific Directory
```
/sync-patterns src/atomic-crm/contacts/
```

### Check What Would Change (Dry Run)
Select "Report only" mode when prompted.

---

## Related Resources

- **Template:** `.claude/prompts/patterns-generation/_template.md`
- **Existing prompts:** `.claude/prompts/patterns-generation/*.md`
- **Example PATTERNS.md:** `src/atomic-crm/validation/PATTERNS.md` (comprehensive)
