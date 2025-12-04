---
description: Deep dive code review using parallel agents for Security, Architecture, UI/UX, and External Validation
allowed-tools: Read, Grep, Glob, Edit, Write, Task, Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(npm run build:*), Bash(npx tsc --noEmit:*), mcp__ide__getDiagnostics, mcp__zen__debug, mcp__zen__thinkdeep, mcp__serena__find_symbol, mcp__serena__search_for_pattern, mcp__serena__get_symbols_overview, mcp__serena__find_referencing_symbols, TodoWrite, AskUserQuestion, Skill
---

# Deep Code Review (Parallel Agents)

You are performing a comprehensive code review for Crispy CRM using **parallel agents** for maximum efficiency. Each focus area runs concurrently, then findings are consolidated.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PARALLEL CODE REVIEW PIPELINE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Phase 0: SCOPE SELECTION (Interactive)                            │
│            └── AskUserQuestion → files/directory/git/PR             │
│                                                                     │
│   Phase 1: CONTEXT GATHERING (Sequential)                           │
│            └── File list, IDE diagnostics, TypeScript check         │
│                                                                     │
│   Phase 2: PARALLEL AGENT DISPATCH (4 agents concurrently)          │
│            ┌──────────────────────────────────────────────────┐     │
│            │  AGENT 1         AGENT 2         AGENT 3         │     │
│            │  Security &      Architecture    UI/UX           │     │
│            │  Data Integrity  & Code Quality  Compliance      │     │
│            │       │               │               │          │     │
│            │       ▼               ▼               ▼          │     │
│            │   Findings 1     Findings 2     Findings 3       │     │
│            └──────────────────────────────────────────────────┘     │
│                               │                                     │
│   Phase 3: EXTERNAL VALIDATION (mcp__zen__thinkdeep)               │
│            └── Second opinion on consolidated findings              │
│                                                                     │
│   Phase 4: OUTPUT GENERATION                                        │
│            ├── Inline comments (immediate)                          │
│            ├── Markdown report (docs/reviews/)                      │
│            └── TodoWrite tasks (actionable)                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Scope Selection (Interactive)

**IMMEDIATELY ask the user what to review:**

Use `AskUserQuestion` with these options:

### Question 1: Review Scope
- **Single file** - Review a specific file (ask for path)
- **Directory/feature** - Review all files in a feature area
- **Git changes** - Review staged/unstaged changes or recent commits
- **PR diff** - Review changes in current branch vs main

### Question 2: Focus Priority (if user wants to narrow scope)
- **Full review** - All focus areas via parallel agents
- **Security focus** - Run only Security agent
- **Architecture focus** - Run only Architecture agent
- **UI/UX focus** - Run only UI/UX agent

---

## Phase 1: Context Gathering (Sequential)

**Gather this context BEFORE dispatching agents:**

### 1.1 Build File List

**For Single File:**
```
files_in_scope = [<user-provided-path>]
```

**For Directory/Feature:**
```bash
Glob: <directory>/**/*.{ts,tsx}
files_in_scope = [all matching files]
```

**For Git Changes:**
```bash
git status --porcelain
git diff --name-only HEAD
files_in_scope = [changed files]
```

**For PR Diff:**
```bash
git diff --name-only main...HEAD
files_in_scope = [changed files in PR]
```

### 1.2 Collect Diagnostics
```bash
# IDE diagnostics for files in scope
mcp__ide__getDiagnostics

# TypeScript check
npx tsc --noEmit 2>&1 | head -50
```

### 1.3 Prepare Shared Context

Create a context block for all agents:
```markdown
## Shared Context for Agents

**Files in scope:**
- [file1.tsx]
- [file2.ts]
- ...

**IDE Diagnostics:**
[X errors, Y warnings - summary]

**TypeScript Errors:**
[Summary of tsc output]

**Project Context:**
- React Admin 5.x + Supabase
- Tailwind v4 with semantic tokens
- Zod validation at API boundary only
- Fail-fast principle (no retry logic)
```

---

## Phase 2: Parallel Agent Dispatch (CRITICAL)

**DISPATCH ALL 3 REVIEW AGENTS IN A SINGLE MESSAGE using the Task tool:**

Each agent runs concurrently. Include the shared context in each prompt.

### Agent Dispatch Template

```
In a SINGLE message, invoke 3 Task tool calls with subagent_type="general-purpose":

Task 1: Security & Data Integrity Agent
Task 2: Architecture & Code Quality Agent
Task 3: UI/UX Compliance Agent
```

---

### AGENT 1: Security & Data Integrity

```markdown
TASK: Security & Data Integrity Code Review
SCOPE: [files_in_scope]
GOAL: Find all security vulnerabilities and data integrity violations

## Shared Context
[Insert shared context from Phase 1]

## Checklist (from data-integrity-guards skill)

### Critical (MUST report)
| Check | Pattern to Find | Severity |
|-------|-----------------|----------|
| Direct Supabase import | `import.*@supabase/supabase-js` | Critical |
| SQL injection | Raw SQL with string interpolation | Critical |
| XSS | `dangerouslySetInnerHTML` | Critical |
| Missing RLS | Tables without policies | Critical |
| Hardcoded secrets | API keys, tokens in code | Critical |
| Form validation | `validate=` prop on forms (should be API boundary) | Critical |

### High
| Check | Pattern to Find | Severity |
|-------|-----------------|----------|
| Deprecated patterns | `company_id` on contacts, `archived_at` | High |
| Missing soft delete | Hard DELETE statements | High |
| Auth checks | Components without auth verification | High |

## Search Commands
```bash
Grep: "createClient.*supabase"
Grep: "dangerouslySetInnerHTML"
Grep: "eval\\("
Grep: "validate="
Grep: "company_id"
Grep: "archived_at"
Grep: "DELETE FROM"
```

## Output Format
Return findings as JSON:
```json
{
  "agent": "security",
  "findings": [
    {
      "severity": "Critical|High|Medium|Low",
      "category": "Security|Data Integrity",
      "issue": "Description",
      "location": "file:line",
      "evidence": "code snippet",
      "fix": "Suggested fix"
    }
  ],
  "summary": "X critical, Y high, Z medium issues found"
}
```
```

---

### AGENT 2: Architecture & Code Quality

```markdown
TASK: Architecture & Code Quality Code Review
SCOPE: [files_in_scope]
GOAL: Find architecture violations and code quality issues

## Shared Context
[Insert shared context from Phase 1]

## Checklist (from enforcing-principles skill)

### Critical (MUST report)
| Check | Pattern to Find | Severity |
|-------|-----------------|----------|
| Retry logic | `MAX_RETRIES`, `exponentialBackoff`, retry loops | Critical |
| Circuit breakers | `CircuitBreaker` class, state machines | Critical |
| Graceful fallbacks | Silent catch with cached/default returns | Critical |

### High
| Check | Pattern to Find | Severity |
|-------|-----------------|----------|
| Hardcoded form defaults | `defaultValues={{ ... }}` without schema | High |
| Wrong type keyword | `type` for objects (should be `interface`) | Medium |

### Medium
| Check | Pattern to Find | Severity |
|-------|-----------------|----------|
| Feature structure | Missing index.tsx, SlideOver, List, Create, Edit | Medium |
| DRY violations | Duplicated logic across components | Medium |
| Dead code | Unused imports, functions, variables | Low |

## Search Commands
```bash
Grep: "CircuitBreaker"
Grep: "MAX_RETRIES|maxRetries"
Grep: "exponentialBackoff"
Grep: "catch.*return.*cache|catch.*return.*default"
Grep: "defaultValues.*{"
Grep: "type.*=.*{" (in .ts files, check if should be interface)
```

## Output Format
Return findings as JSON:
```json
{
  "agent": "architecture",
  "findings": [
    {
      "severity": "Critical|High|Medium|Low",
      "category": "Fail-Fast|Code Quality|TypeScript|Structure",
      "issue": "Description",
      "location": "file:line",
      "evidence": "code snippet",
      "fix": "Suggested fix"
    }
  ],
  "summary": "X critical, Y high, Z medium issues found"
}
```
```

---

### AGENT 3: UI/UX Compliance

```markdown
TASK: UI/UX Compliance Code Review
SCOPE: [files_in_scope]
GOAL: Find design system violations and accessibility issues

## Shared Context
[Insert shared context from Phase 1]

## Checklist (from ui-ux-design-principles skill)

### Critical (MUST report)
| Check | Pattern to Find | Severity |
|-------|-----------------|----------|
| Hardcoded hex colors | `#[0-9a-fA-F]{3,6}` | High |
| Hardcoded Tailwind colors | `bg-green-600`, `text-gray-500` patterns | High |
| Small touch targets | `h-[1-9]`, `h-10`, `w-[1-9]`, `w-10` (under 44px) | High |
| Missing ARIA | Interactive elements without labels | High |

### Medium
| Check | Pattern to Find | Severity |
|-------|-----------------|----------|
| Pure black/white | `#000`, `#fff`, `#000000`, `#ffffff` | Medium |
| Raw OKLCH values | `oklch(...)` not in CSS variable | Medium |
| Missing focus states | Interactive without `:focus-visible` | Medium |

### Correct Patterns to Verify
```tsx
// CORRECT semantic tokens
bg-primary, bg-background, bg-card, bg-muted
text-primary, text-muted-foreground, text-destructive
border-border, border-input

// CORRECT touch targets
h-11 w-11, min-h-[44px], min-w-[44px]
```

## Search Commands
```bash
Grep: "#[0-9a-fA-F]{3,6}"
Grep: "bg-\\w+-\\d{3}"
Grep: "text-\\w+-\\d{3}"
Grep: "h-[1-9]\\s|h-10\\s"
Grep: "w-[1-9]\\s|w-10\\s"
Grep: "oklch\\("
```

## Output Format
Return findings as JSON:
```json
{
  "agent": "ui-ux",
  "findings": [
    {
      "severity": "Critical|High|Medium|Low",
      "category": "Colors|Touch Targets|Accessibility|Design System",
      "issue": "Description",
      "location": "file:line",
      "evidence": "code snippet",
      "fix": "Suggested fix"
    }
  ],
  "summary": "X critical, Y high, Z medium issues found"
}
```
```

---

## Phase 3: External Validation

**After collecting all agent findings, validate with external AI:**

```
Use mcp__zen__thinkdeep with:
- model: "gemini-2.5-pro"
- thinking_mode: "high"
- step: "Validate these code review findings. Identify any issues we may have missed. Check severity assessments."
- findings: [Consolidated findings from all 3 agents]
- relevant_files: [files_in_scope]
- focus_areas: ["security", "architecture", "code-quality", "ui-ux"]
```

**Purpose:**
- Catch blind spots all agents missed
- Validate severity assessments
- Identify any interconnected issues

---

## Phase 4: Output Generation

### 4.1 Consolidate Findings

Merge all agent findings into unified list, sorted by severity:
1. Critical (from all agents)
2. High (from all agents)
3. Medium (from all agents)
4. Low (from all agents)

### 4.2 Inline Comments (Show Immediately)

Present findings inline with file:line references:

```markdown
## Code Review Results

### Critical Issues (BLOCKS MERGE)

**`src/atomic-crm/contacts/ContactCreate.tsx:45`** [Security]
```tsx
// WRONG: Validation in form component
<SimpleForm validate={validateContact}>
```
**Fix:** Remove validate prop, rely on Zod in unifiedDataProvider.

---

**`src/lib/api.ts:23`** [Fail-Fast Violation]
```tsx
// WRONG: Retry logic
for (let i = 0; i < MAX_RETRIES; i++) { ... }
```
**Fix:** Remove retry logic. Let errors throw and fail fast.

### High Issues (Fix Before Merge)
[...]

### Medium Issues (Fix When Convenient)
[...]
```

### 4.3 Markdown Report

**Save to:** `docs/reviews/YYYY-MM-DD-HH-mm-review.md`

```markdown
# Parallel Code Review Report

**Date:** YYYY-MM-DD HH:mm
**Scope:** [files/directories reviewed]
**Method:** 3 parallel agents + external validation

## Executive Summary
[2-3 sentences]

## Agent Results

### Security & Data Integrity Agent
**Issues Found:** X critical, Y high, Z medium
[Agent 1 summary]

### Architecture & Code Quality Agent
**Issues Found:** X critical, Y high, Z medium
[Agent 2 summary]

### UI/UX Compliance Agent
**Issues Found:** X critical, Y high, Z medium
[Agent 3 summary]

### External Validation (gemini-2.5-pro)
**Additional Issues:** [any new findings]
**Severity Adjustments:** [any changes]

## Consolidated Findings by Severity

### Critical (Blocks Merge)
| # | Issue | Location | Agent | Fix |
|---|-------|----------|-------|-----|

### High (Should Fix)
| # | Issue | Location | Agent | Fix |
|---|-------|----------|-------|-----|

### Medium (When Convenient)
| # | Issue | Location | Agent | Fix |
|---|-------|----------|-------|-----|

### Low (Optional)
| # | Issue | Location | Agent | Fix |
|---|-------|----------|-------|-----|

## Recommendations
1. [Prioritized action]
2. [Prioritized action]
```

### 4.4 TodoWrite Tasks

**Create todos for ALL actionable findings:**

```typescript
// Group by severity, then by agent
[
  { content: "[Critical] Fix direct Supabase import in api.ts", status: "pending", activeForm: "Fixing direct Supabase import" },
  { content: "[Critical] Remove retry logic in dataProvider", status: "pending", activeForm: "Removing retry logic" },
  { content: "[High] Update Button touch targets to 44px", status: "pending", activeForm: "Updating touch targets" },
  { content: "[High] Replace hardcoded colors in Dashboard", status: "pending", activeForm: "Replacing hardcoded colors" },
  // ... all actionable findings
]
```

---

## Severity Definitions

| Level | Definition | Merge Policy | Agent Sources |
|-------|------------|--------------|---------------|
| **Critical** | Security, data integrity, fail-fast violations | BLOCKS merge | Security, Architecture |
| **High** | UX problems, accessibility, significant quality | Should fix first | UI/UX, Architecture |
| **Medium** | Code quality, patterns, optimization | Fix when convenient | All |
| **Low** | Polish, docs, preferences | Optional | All |

---

## Output Checklist

- [ ] Scope confirmed with user (Phase 0)
- [ ] Context gathered - file list, diagnostics (Phase 1)
- [ ] **3 agents dispatched in parallel** (Phase 2)
- [ ] All agent findings collected
- [ ] External validation completed (Phase 3)
- [ ] Inline comments presented (Phase 4)
- [ ] Markdown report saved to docs/reviews/
- [ ] TodoWrite tasks created
- [ ] Critical issues prominently highlighted

---

## Related Skills

- `dispatching-parallel-agents` - Pattern for concurrent agent work
- `deep-audit` - Full codebase audit (broader scope)
- `enforcing-principles` - Architecture checklist source
- `ui-ux-design-principles` - UI/UX checklist source
- `data-integrity-guards` - Security checklist source
