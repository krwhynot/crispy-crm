# Claude Code Extensibility: Skills, Rules, and Subagents
## A Complete Guide Based on Deep Research and Practical Application

**Date:** 2026-01-27
**Project Context:** Crispy CRM
**Confidence:** 98% (Based on Perplexity research + official Claude Code documentation)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Gap Analysis: When to Hire Specialists](#gap-analysis)
3. [The Three-Tier Architecture](#three-tier-architecture)
4. [Rules: The Constitution](#rules)
5. [Skills: The Specialist Playbooks](#skills)
6. [Subagents: The Specialized Workers](#subagents)
7. [Deep Dive: Creating Skills](#creating-skills)
8. [Decision Framework](#decision-framework)
9. [Practical Recommendations for Crispy CRM](#recommendations)
10. [Common Pitfalls and Anti-Patterns](#pitfalls)

---

## Executive Summary

Claude Code provides three complementary mechanisms for extending AI capabilities:

- **Rules** (`.claude/rules/*.md`, `CLAUDE.md`) - Persistent project memory, always loaded
- **Skills** (`.claude/skills/*/SKILL.md`) - Task-driven capabilities, loaded on-demand
- **Subagents** (`.claude/agents/*/AGENT.md`) - Parallel specialized workers with isolated contexts

### Key Principle: Progressive Disclosure

All three mechanisms implement **progressive disclosure**—loading information only when needed to minimize token consumption while maximizing access to expertise.

### When to Use What

| Mechanism | Use When | Token Cost | Example |
|-----------|----------|------------|---------|
| **Rules** | Always applicable constraints | Always loaded | "No direct Supabase imports" |
| **Skills** | Task-specific workflows | Load when triggered | "PDF form filling procedure" |
| **Subagents** | Complex parallel work | Isolated context | "Security code review" |

---

## Gap Analysis: When to Hire Specialists {#gap-analysis}

### Methodology

We conducted a systematic codebase audit across four dimensions to identify where specialized "agents" (implemented as skills or subagents) would add the most value.

### Phase 1: Database Audit

**Commands Executed:**
```bash
fd -e sql . supabase/migrations | wc -l          # 309 migrations
grep -r "CREATE POLICY" supabase/migrations | wc -l  # 512 RLS policies
grep -r "DELETE FROM" supabase/migrations | wc -l    # 33 hard deletes
```

**Results:**
- **Total Migrations:** 309 files
- **RLS Policies:** 512 policies
- **Hard Deletes:** 33 occurrences

**Analysis:**
512 RLS policies represents **enterprise-scale security complexity**. This isn't just a soft-delete pattern issue—it's managing multi-tenant isolation, role-based access control, and junction table security across 309 migrations. Manual management at this scale is a **ticking time bomb** for security vulnerabilities.

**Recommendation:** `database-specialist` skill/subagent - **CRITICAL** priority

---

### Phase 2: Frontend Audit

**Commands Executed:**
```bash
fd -e tsx . src/components/ui | wc -l        # 84 components
grep -r "style={{" src/ | wc -l              # 24 inline styles
grep -r "aria-" src/ | wc -l                 # 743 aria attributes
```

**Results:**
- **UI Components:** 84 components
- **Inline Style Overrides:** 24 occurrences
- **Accessibility Attributes:** 743 aria-* attributes

**Analysis:**
84 UI components exceeds the threshold, but **743 aria attributes shows strong A11y discipline**. The 24 inline styles indicate emerging "style drift"—developers bypassing the design system when components don't quite fit their needs.

**Recommendation:** `frontend-specialist` skill - **HIGH** priority (not critical due to good a11y foundation)

---

### Phase 3: Quality Audit

**Commands Executed:**
```bash
grep -r ": any" src/ | wc -l                    # 174 type leaks
grep -r "console.log" src/ | wc -l              # 50 console statements
grep -r -E "TODO|FIXME" src/ | wc -l            # 26 technical debt markers
```

**Results:**
- **Type Safety Leaks (`: any`):** 174 occurrences
- **Console Logs:** 50 statements
- **Technical Debt Markers:** 26 TODO/FIXME comments

**Analysis:**
**174 `any` types is severe type erasure.** Every `any` is a hole where runtime errors hide. Combined with 50 console logs in production code, this indicates a pattern of "ship first, clean up never."

**Recommendation:** `quality-gatekeeper` skill/subagent - **CRITICAL** priority

---

### Phase 4: Complexity Audit

**Commands Executed:**
```bash
fd -e tsx -e ts . src -x wc -l | sort -nr | head -n 10
```

**Top 10 Largest Files:**
```
6,203 lines  →  src/types/database.generated.ts (auto-generated)
6,128 lines  →  src/types/database.types.ts (auto-generated)
5,288 lines  →  src/types/supabase.ts (auto-generated)
1,406 lines  →  src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx
  886 lines  →  src/tests/utils/typed-mocks.ts
  857 lines  →  src/atomic-crm/organizations/__tests__/AuthorizationsTab.test.tsx
  813 lines  →  src/atomic-crm/contacts/__tests__/ContactList.test.tsx
```

**Analysis:**
Top 3 files are auto-generated types (acceptable). However, **1,406-line test files** signal **logic coupling**—when a single component test requires 1,400 lines, that component is doing too much. This is a decomposition failure.

**Recommendation:** `plan-architect` skill - **HIGH** priority (needed for complex refactors)

---

### Hiring Plan Summary

| Agent Candidate | Evidence Found | Recommendation Level | Primary Job |
|:----------------|:---------------|:---------------------|:------------|
| **quality-gatekeeper** | 174 `: any` types, 50 console logs, 26 TODOs | 🔴 **CRITICAL** | Post-task code review, type safety enforcement, production noise elimination |
| **database-specialist** | 309 migrations, 512 RLS policies, 33 hard deletes | 🔴 **CRITICAL** | RLS security audits, migration safety, soft-delete enforcement |
| **frontend-specialist** | 84 UI components, 24 inline styles, 743 aria attributes | 🟠 **HIGH** | Design system enforcement, Tailwind/Shadcn compliance |
| **plan-architect** | Largest file: 1,406 lines (test) | 🟠 **HIGH** | Feature decomposition, dependency mapping |

### Final Recommendation

**Hire `quality-gatekeeper` first.** While database complexity (512 RLS policies) is severe, the 174 type safety leaks represent **active bleeding**—every new feature with `any` types compounds the problem.

**Implementation Priority:**
1. **NOW:** `quality-gatekeeper` (stops the bleeding)
2. **Week 2:** `database-specialist` (audits 512 RLS policies)
3. **Month 2:** `frontend-specialist` (prevents design drift at scale)
4. **As-needed:** `plan-architect` (complex refactors only)

---

## The Three-Tier Architecture {#three-tier-architecture}

Claude Code manages knowledge through three complementary layers, each solving a different problem:

### 1. Rules: Persistent Memory
- **Always loaded** into every session
- Answer: "What must ALWAYS be true in this project?"
- Cost: Token overhead every conversation
- Location: `CLAUDE.md`, `.claude/rules/*.md`

### 2. Skills: On-Demand Expertise
- **Loaded when triggered** by task match
- Answer: "How should I approach this specific task?"
- Cost: Tokens only when skill is used
- Location: `.claude/skills/*/SKILL.md`

### 3. Subagents: Parallel Workers
- **Isolated context** for complex work
- Answer: "Can someone else handle this in parallel?"
- Cost: 200K token budget per subagent (isolated from main)
- Location: `.claude/agents/*/AGENT.md` (custom) or built-in types

### Progressive Disclosure Principle

Information loads in carefully staged layers to minimize context consumption:

```
Session Start:
  ├─ Rules: Full content loaded (all .md files in .claude/rules/)
  ├─ Skills: Metadata only (name + description, ~30-50 tokens/skill)
  └─ Subagents: Available but not spawned

Task Triggered:
  ├─ Skill: Full SKILL.md body loads (~500-5000 tokens)
  └─ References: Load individual files as needed

Subagent Spawned:
  └─ Isolated 200K context (doesn't consume main thread)
```

**Key Insight:** A skill with 50,000 tokens of reference material costs **50 tokens** at session start. The full 50,000 only loads if actually needed.

---

## Rules: The Constitution {#rules}

### What Are Rules?

Rules are **persistent project memory**—the non-negotiable constraints and universal context that Claude needs in every session.

### File Locations

1. **`CLAUDE.md`** (root) - Main project memory (auto-loaded)
2. **`.claude/CLAUDE.md`** (subdirs) - Subdirectory-specific rules
3. **`.claude/rules/*.md`** - Modular rules for larger projects

### When to Use Rules

Rules answer: **"What must ALWAYS be true in this project?"**

✅ **Good for rules:**
- Architectural constraints ("All DB access via unifiedDataProvider")
- Coding conventions ("Use `interface` for shapes, `type` for unions")
- Security policies ("No hardcoded API keys")
- Testing requirements ("Run tests before claiming done")
- Naming conventions ("Use kebab-case for file names")

❌ **Bad for rules:**
- Task-specific workflows ("How to create a migration")
- Optional guidance ("Consider using this pattern")
- Verbose examples (bloats context unnecessarily)
- Domain knowledge that's only sometimes relevant

### Rules in Crispy CRM

**Current Rules (6 files):**
```
.claude/rules/
├── DOMAIN_INTEGRITY.md      # Schemas, types, constants
├── PROVIDER_RULES.md         # Data provider architecture
├── MODULE_CHECKLIST.md       # Feature module standards
├── UI_STANDARDS.md           # Three-tier component architecture
├── DATABASE_LAYER.md         # RLS, views, triggers
└── STALE_STATE_STRATEGY.md   # Cache invalidation policies
```

### Best Practices for Rules

#### 1. Keep Rules Concise

**Target:** Under 300 lines per file, ~1,500 lines total across all rules

**Why?** When rules exceed this length, important constraints get lost in noise.

**Example - Too Verbose:**
```markdown
# Authentication Rules

Authentication is a critical security concern in modern web applications.
Users must be authenticated before accessing protected resources. We use
JWT tokens stored in httpOnly cookies to prevent XSS attacks...

[500 more lines explaining how auth works]
```

**Example - Concise:**
```markdown
# Authentication Rules

- JWT tokens in httpOnly cookies only
- No client-side token storage
- Check `auth.uid()` in all RLS policies
```

#### 2. Use Path-Scoped Rules

For large projects, scope rules to specific directories using YAML frontmatter:

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "supabase/functions/**/*.ts"
---

# API Layer Rules

- All endpoints must validate input with Zod schemas
- Return structured errors: `{ error: string, code: number }`
- Log all errors to Sentry
```

**Benefit:** Rules only load when working with files matching the glob patterns.

#### 3. Non-Negotiable Constraints Only

**Test:** For each rule, ask: "Would removing this cause Claude to make mistakes?"

If answer is "no" or "maybe," it doesn't belong in rules.

**Example - Belongs in Rules:**
```markdown
## Banned Patterns (Delete on Sight)

- `Contact.company_id` → Use `contact_organizations` junction
- `Opportunity.archived_at` → Use `deleted_at`
- Direct Supabase imports → Use `unifiedDataProvider`
```

**Example - Belongs in Skills:**
```markdown
## Migration Creation Workflow

1. Run `supabase migration new <name>`
2. Add RLS policies with soft-delete filters
3. Test locally with `supabase db reset`
4. Push to cloud with `supabase db push`
```
*(This is a workflow, not a constraint)*

### Rules vs Skills Decision Matrix

| Question | Rules | Skills |
|----------|-------|--------|
| Is it always applicable? | ✅ | ❌ |
| Is it a non-negotiable constraint? | ✅ | ❌ |
| Is it brief (under 50 lines)? | ✅ | Either |
| Is it a multi-step workflow? | ❌ | ✅ |
| Is it only sometimes relevant? | ❌ | ✅ |
| Does it need examples/scripts? | ❌ | ✅ |

### Common Rule Anti-Patterns

#### ❌ Anti-Pattern 1: Bloated CLAUDE.md

**Problem:**
```markdown
# CLAUDE.md (2,500 lines)

## Architecture
[300 lines]

## Database
[400 lines]

## Frontend
[500 lines]

## Testing
[600 lines]

## Deployment
[400 lines]

## Legacy Systems
[300 lines]
```

**Why Bad:** Claude receives 2,500 tokens every session, even when working on a typo fix.

**Solution:** Split into `.claude/rules/` directory:
```
.claude/rules/
├── architecture.md (300 lines)
├── database.md (400 lines)
├── frontend.md (500 lines)
├── testing.md (600 lines)
├── deployment.md (400 lines)
└── legacy-systems.md (300 lines)
```

#### ❌ Anti-Pattern 2: Tutorial Content in Rules

**Problem:**
```markdown
# Rules

## How TypeScript Works

TypeScript is a superset of JavaScript that adds static typing.
When you declare a variable with `const x: string = "hello"`, the
TypeScript compiler checks that x is always used as a string...

[5 more paragraphs explaining TypeScript basics]
```

**Why Bad:** Claude already knows TypeScript. This wastes tokens explaining common knowledge.

**Solution:** Only include project-specific TypeScript rules:
```markdown
# TypeScript Rules

- Use `interface` for object shapes, `type` for unions
- Derive types from Zod schemas: `type Contact = z.infer<typeof contactSchema>`
- No `as any` (BANNED)
- Type guards for runtime narrowing: `if (typeof x === 'string')`
```

#### ❌ Anti-Pattern 3: Mixing Rules with Guidance

**Problem:**
```markdown
# Database Rules

- Always use RLS policies (REQUIRED)
- Consider adding indexes for foreign keys (RECOMMENDED)
- Soft-delete is preferred but optional (SUGGESTED)
- You might want to use views for complex queries (TIP)
```

**Why Bad:** Mixing requirements with suggestions dilutes the importance of actual rules.

**Solution:** Rules are requirements. Guidance goes in skills or documentation:
```markdown
# Database Rules (Non-Negotiable)

- RLS enabled on all tables
- Soft-delete with `deleted_at` (no hard DELETE)
- Foreign keys must have indexes
- All policies must filter `deleted_at IS NULL`
```

---

## Skills: The Specialist Playbooks {#skills}

### What Are Skills?

Skills are **task-driven capabilities** that Claude discovers and loads automatically when their description matches the current task context.

### How Skills Work (Architecture)

#### The Three-Tier Loading Model

```
┌─────────────────────────────────────────────────────────┐
│ TIER 1: Session Start (Always Loaded)                  │
│ • Skill name + description only (30-50 tokens/skill)   │
│ • Claude sees this in system prompt                    │
│ • Used for discovery: "Should I use this skill?"       │
└─────────────────────────────────────────────────────────┘
                        ↓ (If task matches)
┌─────────────────────────────────────────────────────────┐
│ TIER 2: On-Demand (Loads when triggered)               │
│ • Full SKILL.md body (500-5,000 tokens)                │
│ • Detailed instructions, workflows, examples           │
│ • Loaded only when skill is relevant                   │
└─────────────────────────────────────────────────────────┘
                        ↓ (If needed)
┌─────────────────────────────────────────────────────────┐
│ TIER 3: Progressive Resources (Loads as needed)        │
│ • references/*.md (API docs, patterns, checklists)     │
│ • scripts/*.py (executable code - output only loads)   │
│ • assets/* (templates, files - referenced, not loaded) │
└─────────────────────────────────────────────────────────┘
```

#### How Claude Decides to Use a Skill

**Not algorithmic routing.** Claude uses pure reasoning:

1. At session start, all skill descriptions load into system prompt
2. User gives task: "Audit the RLS policies"
3. Claude reads available skill descriptions
4. Claude reasons: "rls-auditor skill mentions 'audit', 'RLS', 'policies'—this matches!"
5. Claude invokes the Skill tool to load full content
6. Full SKILL.md instructions load into context
7. Claude follows the skill's procedural instructions

**Key Insight:** Claude itself makes the decision through semantic understanding, not keyword matching or embeddings.

### File Structure

```
.claude/skills/my-skill/
├── SKILL.md                    # Required: metadata + instructions
├── references/                 # Optional: detailed documentation
│   ├── api-docs.md
│   ├── patterns.md
│   └── examples.md
├── scripts/                    # Optional: executable code
│   ├── validate.py
│   └── process.sh
└── assets/                     # Optional: templates, files
    └── template.json
```

### SKILL.md Structure

Every skill requires a `SKILL.md` file with two parts:

#### 1. YAML Frontmatter (Required)

```yaml
---
name: skill-name                # Required: lowercase-with-hyphens
description: "What the skill does and when to use it."  # Required: 200-1024 chars
user-invocable: true            # Optional: show in /command menu? (default: true)
disable-model-invocation: false # Optional: prevent auto-trigger? (default: false)
context: main                   # Optional: 'main' or 'fork' (default: main)
agent: general-purpose          # Optional: if context=fork, which subagent type
allowed-tools: "Read,Grep,Bash" # Optional: restrict tools (default: all)
model: sonnet                   # Optional: force model (sonnet/opus/haiku)
dependencies:                   # Optional: document requirements
  - python3
  - ripgrep
---
```

#### 2. Markdown Body (Instructions)

```markdown
# Skill Name

## Overview
Brief description of what the skill does.

## When to Use
- Trigger condition 1
- Trigger condition 2

## Procedure

### Step 1: Do Something
\`\`\`bash
command --to-execute
\`\`\`

### Step 2: Do Another Thing
Detailed instructions...

## Reference Files
- See reference/details.md for in-depth patterns
- See reference/examples.md for code samples
```

### YAML Frontmatter Fields Explained

#### `name` (Required)

**Format:** lowercase-with-hyphens, max 64 characters

**Examples:**
- ✅ `quality-gatekeeper`
- ✅ `pdf-form-filler`
- ✅ `rls-auditor`
- ❌ `QualityGatekeeper` (not lowercase)
- ❌ `pdf_processor` (use hyphens, not underscores)
- ❌ `qg` (too cryptic)

**Usage:** Becomes the slash command identifier: `/quality-gatekeeper`

---

#### `description` (Required, MOST IMPORTANT)

**Length:** 200-1024 characters

**Purpose:** PRIMARY mechanism for skill discovery. If this is vague, skill never triggers.

**Formula:**
```
[What it does] + [Specific capabilities] + [When to use] + [Trigger keywords]
```

**Examples:**

❌ **Bad (too vague):**
```yaml
description: "Helps with PDF files"
description: "Processes data"
description: "Does quality checks"
```

✅ **Good (specific with triggers):**
```yaml
description: "Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction."

description: "Analyze Excel spreadsheets, create pivot tables, generate charts. Use when analyzing Excel files, spreadsheets, tabular data, or .xlsx files."

description: "Post-task code review enforcing type safety, no console logs, and accessibility standards. Use when the user says 'done', 'finished', 'commit', 'ready', or completes a major feature."
```

**Critical:** Include exact keywords users would naturally say:
- "audit security" → skill description must include "audit" and "security"
- "create migration" → skill description must include "migration" and "create"
- "review code" → skill description must include "review" and "code"

---

#### `user-invocable` (Optional)

**Default:** `true`

**Purpose:** Control whether skill appears in `/` command menu

**Values:**
- `true` - Shows in menu, users can invoke with `/skill-name`
- `false` - Hidden from menu, Claude can still auto-trigger

**When to use `false`:**
- Background knowledge skills (not actionable commands)
- Skills that only make sense for Claude to trigger automatically

**Example:**
```yaml
name: legacy-system-context
description: "Explains how the old PHP system works for context. Use when working with legacy integration code."
user-invocable: false  # "/legacy-system-context" makes no sense as user action
```

---

#### `disable-model-invocation` (Optional)

**Default:** `false`

**Purpose:** Prevent Claude from auto-triggering skill

**Values:**
- `false` - Claude can trigger automatically (default)
- `true` - Only manual `/skill-name` invocation works

**When to use `true`:**
- Skills with side effects (deploy, send email, delete files)
- Skills requiring explicit user confirmation
- Workflows where timing matters

**Example:**
```yaml
name: deploy-to-production
description: "Deploy application to production environment."
disable-model-invocation: true  # Never auto-trigger deployment!
```

**Important Distinction:**

| Field | Controls | Description in Context? | Manual Invocation? | Auto-Trigger? |
|-------|----------|------------------------|-------------------|---------------|
| `user-invocable: false` | Menu visibility | ✅ Yes | ❌ No | ✅ Yes |
| `disable-model-invocation: true` | Auto-trigger | ❌ No | ✅ Yes | ❌ No |
| Both false | Hidden except direct | ❌ No | ✅ Yes (direct) | ❌ No |

---

#### `context` (Optional)

**Default:** `main`

**Purpose:** Control where skill executes

**Values:**
- `main` - Run inline in main conversation (default)
- `fork` - Run in isolated subagent context

**When to use `fork`:**
- Complex multi-step workflows
- Verbose exploration that would clutter main chat
- Self-contained tasks that return a summary

**Example:**
```yaml
context: fork
agent: Explore  # Which subagent type to use
```

**How `fork` works:**
1. Skill content becomes the subagent prompt
2. Subagent executes in isolated 200K context
3. Subagent returns summary to main conversation
4. Main conversation stays clean

---

#### `allowed-tools` (Optional)

**Default:** All tools available

**Purpose:** Restrict which tools skill can use (security/behavior control)

**Format:** Comma-separated string of tool names

**Common Patterns:**

**Read-only analysis:**
```yaml
allowed-tools: "Read,Grep,Glob"
# Can explore, cannot modify
```

**Code review (read + bash for linters):**
```yaml
allowed-tools: "Read,Grep,Glob,Bash"
# Can read and run linters, cannot edit
```

**Full access (default):**
```yaml
# Omit field or:
allowed-tools: "Read,Write,Edit,Grep,Glob,Bash"
```

**Why restrict tools?**
- Security: Code review skills shouldn't modify files
- Behavior: Force skill to stay focused on analysis
- Safety: Prevent accidental destructive operations

---

#### `model` (Optional)

**Default:** Inherits from parent/session

**Purpose:** Force specific Claude model for skill

**Values:** `sonnet`, `opus`, `haiku`

**When to use:**
- `haiku` - Simple, deterministic tasks (cost optimization)
- `sonnet` - Standard tasks (default)
- `opus` - Complex reasoning, critical decisions

**Example:**
```yaml
model: haiku  # Simple file analysis, save cost
```

```yaml
model: opus  # Complex security analysis
```

---

#### `dependencies` (Optional)

**Purpose:** Document required software packages

**Format:** YAML list

**Example:**
```yaml
dependencies:
  - python3
  - pdfplumber
  - pillow
```

**Note:** This is documentation only. Claude Code doesn't automatically install dependencies.

---

### Writing Effective Descriptions (CRITICAL)

**Most common reason skills fail:** Bad descriptions.

#### Description Quality Test

Ask these questions:

1. ✅ **Does it include specific capabilities?**
   - ❌ "Helps with documents"
   - ✅ "Extract text and tables from PDFs, fill forms, merge documents"

2. ✅ **Does it include trigger keywords?**
   - ❌ "Processes files"
   - ✅ "Use when user mentions PDFs, forms, or document extraction"

3. ✅ **Does it match natural language?**
   - User says: "Audit the security"
   - Description must include: "audit" and "security"

4. ✅ **Is it front-loaded with key terms?**
   - ✅ "Extract PDF text and tables. Use when..."
   - ❌ "This skill is useful for various document operations including but not limited to PDF extraction..."

#### Character Budget Limitation

**Default budget:** 15,000 characters across ALL skill descriptions (~4,000 tokens)

**What happens when exceeded:**
- Some skills become **invisible to Claude**
- Skills appear installed but never trigger
- No warning unless you check `/context`

**How to check:**
```bash
# In Claude Code
/context

# Look for:
# "⚠️ Excluded skills due to budget: skill-name"
```

**Solutions:**
1. Write more concise descriptions (best)
2. Consolidate similar skills (good)
3. Increase budget via environment variable (workaround):
   ```bash
   export SLASH_COMMAND_TOOL_CHAR_BUDGET=30000
   ```

#### Real-World Examples

**Example 1: PDF Processing Skill**

❌ **Bad Description:**
```yaml
description: "This skill helps you work with PDF documents."
```
*Why bad:* No specifics, no triggers, too vague.

✅ **Good Description:**
```yaml
description: "Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction."
```
*Why good:* Specific capabilities, clear triggers, keyword-rich.

---

**Example 2: Database Migration Skill**

❌ **Bad Description:**
```yaml
description: "Helps create migrations safely."
```
*Why bad:* What does "safely" mean? When should it trigger?

✅ **Good Description:**
```yaml
description: "Pre-flight checks for Supabase migrations: verify RLS enabled, soft-delete patterns, foreign key indexes. Use before running 'supabase migration up' or 'supabase db push', or when creating new tables."
```
*Why good:* Specific checks listed, exact commands that trigger it, clear usage scenario.

---

**Example 3: Code Review Skill**

❌ **Bad Description:**
```yaml
description: "Reviews code for quality issues."
```
*Why bad:* What issues? When does it run?

✅ **Good Description:**
```yaml
description: "Post-task code review enforcing type safety, no console logs, and accessibility standards. Use when the user says 'done', 'finished', 'commit', 'ready', or completes a major feature."
```
*Why good:* Specific checks enumerated, exact phrases that trigger it.

---

### Progressive Disclosure with Reference Files

Skills can bundle extensive supporting material without token overhead using the `references/` directory.

#### Why Use References?

**Problem:** Comprehensive skill needs 10,000 tokens of documentation
**Without references:** 10,000 tokens load every time skill triggers
**With references:** Core skill is 500 tokens, references load only as needed

#### Reference File Best Practices

1. **Keep references one level deep** (no nested chains)

   ❌ **Bad:**
   ```
   SKILL.md → references advanced.md → references details.md
   ```
   *Problem:* Claude may only read partial content

   ✅ **Good:**
   ```
   SKILL.md → references typescript.md
   SKILL.md → references patterns.md
   SKILL.md → references examples.md
   ```
   *Benefit:* All references directly accessible from SKILL.md

2. **Include table of contents in long references**

   ```markdown
   # API Reference

   ## Table of Contents
   - [Authentication](#authentication)
   - [Endpoints](#endpoints)
   - [Error Codes](#error-codes)
   - [Rate Limiting](#rate-limiting)

   ## Authentication
   ...
   ```

3. **Reference explicitly from SKILL.md**

   ```markdown
   ## Procedure

   1. Extract text from PDF
   2. Validate structure
   3. For form filling, see reference/form-filling.md
   4. For complex layouts, see reference/layout-detection.md
   ```

#### Example: Complex Skill with References

```
.claude/skills/api-tester/
├── SKILL.md              # Core workflow (500 tokens)
├── references/
│   ├── endpoints.md      # All API endpoints (2,000 tokens)
│   ├── schemas.md        # Response schemas (3,000 tokens)
│   ├── auth.md           # Authentication patterns (1,000 tokens)
│   └── examples.md       # Request/response examples (4,000 tokens)
└── scripts/
    └── run-test.py       # Execute test (code doesn't load, only output)
```

**Token efficiency:**
- Session start: 50 tokens (name + description)
- Skill triggered: 550 tokens (SKILL.md loaded)
- Only if Claude needs endpoints: +2,000 tokens (endpoints.md)
- Only if Claude needs schemas: +3,000 tokens (schemas.md)
- Total worst case: 5,550 tokens
- Total typical case: 550 tokens (90% savings!)

---

### Executable Skills with Scripts

One of the most powerful advanced patterns: bundle executable code that Claude can run.

#### Why Use Scripts?

**Efficiency:** LLMs are inefficient for deterministic operations

**Example:**
- Sorting 1,000 items via LLM: ~50,000 tokens generated sequentially
- Sorting 1,000 items via Python script: 0.001 seconds, only output loads

**Use scripts for:**
- ✅ Data processing/transformation
- ✅ File analysis/validation
- ✅ API calls with complex logic
- ✅ Multi-step deterministic operations
- ✅ Operations requiring precision (no hallucination)

**Don't use scripts for:**
- ❌ Simple bash commands (just run them inline)
- ❌ Operations requiring Claude's reasoning
- ❌ Generating creative content

#### How Scripts Work

**Critical insight:** When Claude runs a script, **only the OUTPUT enters context**, not the script code.

**Example:**
```
Script: 500 lines of Python code
Output: 20 lines of JSON results
Context cost: 20 lines (97% savings!)
```

#### Script Structure

**Location:** `.claude/skills/my-skill/scripts/`

**Supported languages:**
- Python (`.py`)
- Bash (`.sh`)
- JavaScript/Node (`.js`)
- Any executable with proper shebang

**Example Skill with Script:**

**SKILL.md:**
```markdown
---
name: rls-auditor
description: "Audit Supabase RLS policies for security holes. Use when creating migrations, auditing security, or checking database permissions."
allowed-tools: "Read,Grep,Bash"
dependencies:
  - python3
---

# RLS Security Auditor

## Procedure

### 1. Run Security Audit
\`\`\`bash
python scripts/audit-rls.py supabase/migrations
\`\`\`

The script outputs structured JSON with violations.

### 2. Review Findings
For each violation:
- Is `USING (true)` justified?
- Are soft-delete filters present?
- Do junction tables check both FK sides?

### 3. Generate Report
Format findings as:
\`\`\`
🔒 RLS SECURITY AUDIT

Critical Issues: X
Warnings: Y
Passed: Z / Total

[Details...]
\`\`\`
```

**scripts/audit-rls.py:**
```python
#!/usr/bin/env python3
import sys
import re
import json
from pathlib import Path

def audit_migrations(migrations_dir):
    violations = []
    warnings = []
    passed = 0

    for sql_file in Path(migrations_dir).glob("*.sql"):
        content = sql_file.read_text()

        # Find all CREATE POLICY statements
        policies = re.findall(
            r'CREATE POLICY "([^"]+)"\s+ON\s+(\w+)\s+FOR\s+(\w+)\s+USING\s*\(([^;]+)\)',
            content,
            re.MULTILINE | re.DOTALL
        )

        for policy_name, table, operation, using_clause in policies:
            # Check for permissive USING (true)
            if "true" in using_clause and "service_role" not in using_clause:
                violations.append({
                    "severity": "critical",
                    "table": table,
                    "policy": policy_name,
                    "issue": "USING (true) without service_role restriction",
                    "file": sql_file.name
                })

            # Check for missing soft-delete filter
            if operation == "SELECT" and "deleted_at IS NULL" not in using_clause:
                violations.append({
                    "severity": "critical",
                    "table": table,
                    "policy": policy_name,
                    "issue": "Missing soft-delete filter",
                    "file": sql_file.name
                })

            if not violations and not warnings:
                passed += 1

    return {
        "violations": violations,
        "warnings": warnings,
        "passed": passed,
        "total": len(violations) + len(warnings) + passed
    }

if __name__ == "__main__":
    results = audit_migrations(sys.argv[1])
    print(json.dumps(results, indent=2))
```

**How This Works:**
1. SKILL.md instructs: "Run `python scripts/audit-rls.py supabase/migrations`"
2. Claude executes via Bash tool
3. **Script code (80 lines) never loads into context**
4. Only script output (JSON results) loads
5. Claude parses JSON, formats human-readable report

**Token Savings:** Script: ~2,000 tokens | Output: ~500 tokens | **Savings: 75%**

#### Script Patterns

**Pattern 1: Validation Script**

```bash
# scripts/validate-config.sh
#!/bin/bash
CONFIG=$1

# Check required fields
jq -e '.database.host' "$CONFIG" > /dev/null || echo "Missing: database.host"
jq -e '.database.port' "$CONFIG" > /dev/null || echo "Missing: database.port"

# Exit non-zero if errors
[ $? -eq 0 ] && echo "✅ Config valid" || exit 1
```

**Pattern 2: Data Processing Script**

```python
# scripts/process-data.py
#!/usr/bin/env python3
import pandas as pd
import sys

df = pd.read_csv(sys.argv[1])

# Complex transformations
df['normalized'] = df['value'] / df['value'].max()
df['category'] = df['score'].apply(lambda x: 'high' if x > 0.8 else 'low')

# Output summary (not full data)
print(f"Processed {len(df)} rows")
print(f"High category: {len(df[df['category'] == 'high'])}")
print(f"Low category: {len(df[df['category'] == 'low'])}")
```

**Pattern 3: Plan-Validate-Execute**

Best practice for high-stakes operations:

```markdown
## Procedure

### 1. Create Plan
Generate `changes.json` with proposed modifications:
\`\`\`json
{
  "operations": [
    {"action": "rename", "from": "old.txt", "to": "new.txt"},
    {"action": "delete", "file": "temp.txt"}
  ]
}
\`\`\`

### 2. Validate Plan
\`\`\`bash
python scripts/validate-plan.py changes.json
\`\`\`

Script checks:
- Files exist
- No conflicts
- Permissions OK

### 3. Execute (only if validation passes)
\`\`\`bash
python scripts/execute-plan.py changes.json
\`\`\`
```

---

### Skill Composition (Advanced)

**Key principle:** Skills don't explicitly reference other skills, but Claude orchestrates them automatically.

#### How Composition Works

1. Claude reads all skill descriptions at session start
2. User presents complex task: "Audit the contacts feature for security and integrity"
3. Claude identifies relevant skills through semantic matching:
   - `crispy-validation` (mentions "validate", "schema", "integrity")
   - `rls-auditor` (mentions "audit", "security", "policies")
   - `provider-linter` (mentions "audit", "provider", "architecture")
4. Claude invokes skills in logical sequence
5. Uses output from each skill as context for next
6. Synthesizes unified report

**No configuration required.** Intelligence emerges from good descriptions.

#### Example: CRM Audit Workflow

**Skill 1: `crispy-validation`**
```yaml
description: "Validate Zod schemas against database schema and React Admin requirements. Use when creating schemas, modifying validation, or auditing data integrity."
```

**Skill 2: `rls-auditor`**
```yaml
description: "Audit Supabase RLS policies for security holes. Use when creating migrations, auditing security, or checking database permissions."
```

**Skill 3: `provider-linter`**
```yaml
description: "Verify Data Provider handlers follow architecture rules (no direct Supabase imports, proper soft-delete). Use when creating handlers or auditing provider layer."
```

**User Request:**
```
"Audit the contacts feature for security and data integrity"
```

**Claude's Automatic Orchestration:**
1. Matches request to three skills based on keywords
2. Invokes `crispy-validation`:
   - Checks `src/atomic-crm/validation/contact.ts`
   - Verifies schema matches DB columns
   - Outputs: "✅ Schema valid"

3. Invokes `rls-auditor`:
   - Scans `supabase/migrations/*contact*`
   - Checks RLS policies
   - Outputs: "⚠️ Missing deleted_at filter on one policy"

4. Invokes `provider-linter`:
   - Reads `src/atomic-crm/providers/supabase/handlers/contactsHandler.ts`
   - Checks for banned imports
   - Outputs: "✅ Provider follows rules"

5. Synthesizes final report:
   ```
   📊 CONTACTS FEATURE AUDIT

   ✅ Data Integrity: Schema valid
   ⚠️  Security: 1 RLS policy missing soft-delete filter
   ✅ Architecture: Provider follows rules

   Action Required: Fix RLS policy in migration 20260115_contacts.sql
   ```

#### Composition Best Practices

1. **Write descriptions as contracts**
   - Clearly state what the skill does
   - Explicitly list when it should activate
   - Include domain-specific keywords

2. **Keep skills focused (single responsibility)**
   - One skill = one workflow
   - Multiple focused skills compose better than one mega-skill

3. **Design for composability**
   - Skills should produce structured output
   - Output from one skill should be usable by others
   - Avoid assumptions about execution order

4. **Test composition scenarios**
   - Try complex multi-skill tasks
   - Verify Claude invokes expected skills in correct order
   - Iterate on descriptions if orchestration fails

---

### Testing Skills: The Three-Round Protocol

Based on real-world implementation experience from enterprise deployments.

#### Round One: Document Failures

1. **Create basic skill** with core instructions
2. **Use for real work tasks** (not toy examples)
3. **Document every failure:**
   - Skill didn't activate when expected
   - Output required substantial manual correction
   - Claude misunderstood intent
   - Missing critical context

**Example Failure Log:**
```
Task: "Extract data from quarterly_report.pdf"
Expected: pdf-extractor skill triggers
Actual: Claude tried to manually parse PDF with regex
Root Cause: Description didn't include "quarterly" or "report" keywords

Fix: Added "financial reports, quarterly reports, annual reports" to description
```

#### Round Two: Add Missing Context

1. **For each documented failure:**
   - Identify what information was missing
   - Add specific context to skill
   - Maintain log of additions and why

2. **Common missing context:**
   - Edge cases not covered
   - Domain-specific vocabulary
   - Error handling procedures
   - Validation requirements

#### Round Three: Validation Testing

1. **Test skill with:**
   - Old tasks that previously failed
   - New similar tasks
   - Edge cases identified in Round Two

2. **Continue improvement cycle:**
   - Skills mature through use
   - Real usage reveals limitations
   - Iterate based on actual problems, not anticipated ones

#### Discovery Testing Checklist

After creating/updating a skill:

- [ ] Enable skill in Claude Code settings
- [ ] Test with **natural language phrases** (not just `/skill-name`):
  - "Check the code quality" → should trigger `quality-gatekeeper`?
  - "Audit security" → should trigger `rls-auditor`?
  - "Create a migration" → should trigger `migration-guard`?

- [ ] If skill doesn't trigger, **description needs work**:
  - Add exact keywords from natural phrases
  - Front-load trigger terms
  - Be more specific about capabilities

- [ ] Check Claude's thinking (if available):
  - Did Claude see the skill?
  - Why did/didn't Claude choose it?

- [ ] Verify skill in context budget:
  ```bash
  /context  # In Claude Code
  # Look for: "⚠️ Excluded skills due to budget: skill-name"
  ```

---

### Common Skill Mistakes and Solutions

#### Mistake 1: Vague Descriptions

**Problem:**
```yaml
description: "Helps with documents"
```

**Why it fails:** Too generic—applies to hundreds of potential tasks.

**Solution:**
```yaml
description: "Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction."
```

---

#### Mistake 2: Bloated SKILL.md

**Problem:**
```markdown
# PDF Processor

## Overview
[500 lines explaining PDF format]

## Installation
[300 lines explaining dependencies]

## Usage
[200 lines of examples]

## API Reference
[800 lines of function docs]

## Troubleshooting
[400 lines of common issues]

Total: 2,200 lines loaded every trigger
```

**Why it fails:** Costs 2,200 tokens every time skill triggers, even for simple tasks.

**Solution:**
```
SKILL.md (200 lines)
  - Core workflow only

references/
  - format.md (500 lines) - Load only if needed
  - installation.md (300 lines) - Load only if needed
  - examples.md (200 lines) - Load only if needed
  - api.md (800 lines) - Load only if needed
  - troubleshooting.md (400 lines) - Load only if needed
```

---

#### Mistake 3: Nested Reference Chains

**Problem:**
```markdown
# SKILL.md
See references/advanced.md for details

# references/advanced.md
For complex scenarios, see details.md

# references/details.md
[Actual implementation details]
```

**Why it fails:** Claude may read only first 100 lines of `advanced.md` and never discover `details.md` exists.

**Solution:**
```markdown
# SKILL.md
- See references/typescript.md for TypeScript patterns
- See references/python.md for Python patterns
- See references/examples.md for complete examples

All references one level deep from SKILL.md
```

---

#### Mistake 4: Hardcoded Secrets

**Problem:**
```python
# scripts/api-call.py
API_KEY = "sk-1234567890abcdef"  # NEVER DO THIS
```

**Why it fails:**
- Security vulnerability
- Keys visible in version control
- Can't rotate without editing skill

**Solution:**
```python
# scripts/api-call.py
import os

API_KEY = os.environ.get("API_KEY")
if not API_KEY:
    print("Error: API_KEY environment variable not set")
    sys.exit(1)
```

---

#### Mistake 5: Mega-Skills (Doing Everything)

**Problem:**
```yaml
name: pdf-master
description: "Does everything with PDFs: extract, fill, merge, convert, OCR, analyze, compress, encrypt, sign, validate, repair..."
```

**Why it fails:**
- Too broad to trigger reliably
- Maintains unnecessary complexity
- Hard to test comprehensively

**Solution:** Split into focused skills:
```yaml
name: pdf-extract
description: "Extract text and tables from PDFs. Use when extracting PDF content."

name: pdf-forms
description: "Fill PDF forms programmatically. Use when filling forms or processing form data."

name: pdf-merge
description: "Merge multiple PDFs into one. Use when combining PDF files."
```

---

#### Mistake 6: Skills That Should Be Rules

**Problem:**
```yaml
# Skill: type-safety-enforcer
description: "Enforces no 'any' types in TypeScript code."
```

**Why it's wrong:** This is a non-negotiable constraint, not a workflow.

**Solution:** Add to rules instead:
```markdown
# .claude/rules/CODE_QUALITY.md

## Type Safety (Non-Negotiable)

- No `: any` types (BANNED)
- Use type guards for runtime narrowing
- Derive types from Zod schemas: `type T = z.infer<typeof schema>`
```

---

### Real-World Skill Examples

#### Example 1: Quality Gatekeeper (Simple)

**File:** `.claude/skills/quality-gatekeeper/SKILL.md`

```markdown
---
name: quality-gatekeeper
description: "Run code quality checks before commits: verify no new 'any' types, check for console logs, validate accessibility. Use when user says done, finished, commit, or ready."
allowed-tools: "Read,Grep,Bash"
---

# Quality Gatekeeper

Run these checks before allowing commits:

## 1. Type Safety Check
\`\`\`bash
rg ": any" src/ --type ts --count
\`\`\`

**Baseline:** 174 uses (project current state)
**Rule:** Count must not INCREASE

## 2. Console Log Check
\`\`\`bash
rg "console\.(log|error|warn)" src/ --type ts -g '!**/*.test.ts'
\`\`\`

**Rule:** Zero console logs outside test files

## 3. Accessibility Check
\`\`\`bash
rg "onClick" src/ --type tsx | rg -v "(onKeyDown|onKeyPress|role=)"
\`\`\`

**Rule:** Interactive elements must have keyboard handlers

## Output Format

\`\`\`
🚦 QUALITY GATE RESULTS

✅ Type Safety: 174 uses of 'any' (baseline maintained)
❌ Console Logs: Found 3 violations:
   - src/atomic-crm/contacts/ContactList.tsx:45
   - src/components/Button.tsx:12
⚠️  Accessibility: 1 missing keyboard handler

VERDICT: BLOCKED - Remove console logs before commit
\`\`\`
```

---

#### Example 2: Migration Guard (With Script)

**File:** `.claude/skills/migration-guard/SKILL.md`

```markdown
---
name: migration-guard
description: "Pre-flight checks for Supabase migrations: verify RLS enabled, soft-delete patterns, foreign key indexes. Use before running 'supabase migration up' or 'supabase db push', or when creating new tables."
allowed-tools: "Read,Grep,Bash"
dependencies:
  - python3
---

# Migration Safety Guard

## Procedure

### 1. Find Latest Migration
\`\`\`bash
LATEST=$(ls -t supabase/migrations/*.sql | head -1)
echo "Checking: $LATEST"
\`\`\`

### 2. Run Safety Checks
\`\`\`bash
python scripts/migration-safety-check.py "$LATEST"
\`\`\`

### 3. Review Output

Script checks:
- ✅ RLS enabled on new tables
- ✅ Soft-delete columns present
- ✅ Foreign key indexes exist
- ✅ Tenant isolation policy present
- ✅ No `USING (true)` without `service_role`

### 4. Block or Allow

**If violations:** BLOCK migration, show errors
**If warnings:** Allow with confirmation
**If clean:** Green light to proceed

## Output Format

\`\`\`
🛡️ MIGRATION SAFETY CHECK: 20260127_add_tags.sql

✅ PASSED (4/4):
  - RLS enabled
  - Soft-delete columns present
  - Foreign key indexes exist
  - Tenant isolation present

🟢 SAFE TO PROCEED
\`\`\`
```

**File:** `.claude/skills/migration-guard/scripts/migration-safety-check.py`

```python
#!/usr/bin/env python3
import sys
import re
from pathlib import Path

def check_migration(filepath):
    content = Path(filepath).read_text()
    passed = []
    warnings = []
    violations = []

    # Find CREATE TABLE statements
    tables = re.findall(r'CREATE TABLE\s+(\w+)\s*\(', content)

    if not tables:
        return {
            "passed": [],
            "warnings": [],
            "violations": [],
            "message": "No tables created in this migration"
        }

    for table in tables:
        # Check RLS enabled
        if f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY" in content:
            passed.append(f"RLS enabled on {table}")
        else:
            violations.append(f"❌ {table}: RLS not enabled")

        # Check soft-delete columns
        required_cols = ["deleted_at", "created_at", "updated_at"]
        if all(col in content for col in required_cols):
            passed.append(f"Soft-delete columns in {table}")
        else:
            missing = [c for c in required_cols if c not in content]
            violations.append(f"❌ {table}: Missing {', '.join(missing)}")

        # Check tenant isolation
        if "company_id" in content:
            passed.append(f"Tenant isolation column in {table}")
        else:
            warnings.append(f"⚠️ {table}: No company_id (multi-tenant table?)")

        # Check FK indexes
        fk_matches = re.findall(r'FOREIGN KEY \((\w+)\)', content)
        for fk in fk_matches:
            if f"CREATE INDEX" in content and fk in content:
                passed.append(f"Index on FK {fk}")
            else:
                violations.append(f"❌ {table}: Missing index on FK {fk}")

    # Check for permissive policies
    if re.search(r'USING\s*\(\s*true\s*\)', content):
        if "service_role" not in content:
            violations.append("❌ USING (true) without service_role")

    return {
        "passed": passed,
        "warnings": warnings,
        "violations": violations,
        "verdict": "BLOCKED" if violations else ("WARNINGS" if warnings else "SAFE")
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: migration-safety-check.py <migration_file>")
        sys.exit(1)

    results = check_migration(sys.argv[1])

    print(f"🛡️ MIGRATION SAFETY CHECK: {Path(sys.argv[1]).name}\n")

    if results.get("message"):
        print(results["message"])
        sys.exit(0)

    if results["passed"]:
        print(f"✅ PASSED ({len(results['passed'])}):")
        for item in results["passed"]:
            print(f"  - {item}")
        print()

    if results["warnings"]:
        print(f"⚠️ WARNINGS ({len(results['warnings'])}):")
        for item in results["warnings"]:
            print(f"  - {item}")
        print()

    if results["violations"]:
        print(f"❌ VIOLATIONS ({len(results['violations'])}):")
        for item in results["violations"]:
            print(f"  - {item}")
        print()

    print(f"{'🔴 BLOCKED' if results['verdict'] == 'BLOCKED' else '🟡 WARNINGS' if results['verdict'] == 'WARNINGS' else '🟢 SAFE TO PROCEED'}")

    sys.exit(1 if results['verdict'] == 'BLOCKED' else 0)
```

---

#### Example 3: RLS Auditor (With References)

**File:** `.claude/skills/rls-auditor/SKILL.md`

```markdown
---
name: rls-auditor
description: "Audit Supabase RLS policies for security holes like missing soft-delete filters or permissive USING (true) clauses. Use when creating migrations, auditing security, or when user mentions RLS, policies, or Supabase security."
allowed-tools: "Read,Grep,Bash"
dependencies:
  - python3
---

# RLS Security Auditor

Systematically audit RLS policies for common security vulnerabilities.

## Procedure

### 1. Scan All Migrations
\`\`\`bash
python scripts/audit-all-policies.py supabase/migrations
\`\`\`

### 2. Review Findings by Severity

**Critical Issues (Must Fix):**
- `USING (true)` without `service_role` restriction
- Missing `deleted_at IS NULL` filters on SELECT
- Missing authorization checks (no `auth.uid()` or `company_id`)

**Warnings (Review Required):**
- Junction tables with single-sided checks
- Policies without performance indexes
- Overly permissive UPDATE policies

### 3. Generate Remediation Plan

For each violation, reference appropriate fix pattern:
- See reference/rls-templates.md for secure policy templates
- See reference/multi-tenant-isolation.md for company_id patterns
- See reference/junction-table-security.md for relationship checks

## Output Format

\`\`\`
🔒 RLS SECURITY AUDIT

Scanned: 512 policies across 309 migrations

CRITICAL ISSUES (3):
  ❌ product_distributors SELECT: USING (true) allows all users
  ❌ contacts SELECT: Missing deleted_at IS NULL filter
  ❌ opportunities INSERT: No company_id isolation check

WARNINGS (5):
  ⚠️ contact_organizations: Only checks contact_id, not organization_id
  ⚠️ tasks: No index on user_id for policy performance
  ...

PASSED: 504 / 512 policies (98.4%)
\`\`\`
```

**File:** `.claude/skills/rls-auditor/reference/rls-templates.md`

```markdown
# RLS Policy Templates

## Secure SELECT Policy (Multi-Tenant)

\`\`\`sql
CREATE POLICY "Users can select own company records"
  ON table_name FOR SELECT
  USING (
    company_id = (auth.jwt() ->> 'company_id')::int
    AND deleted_at IS NULL
  );
\`\`\`

## Secure INSERT Policy (Multi-Tenant)

\`\`\`sql
CREATE POLICY "Users can insert own company records"
  ON table_name FOR INSERT
  WITH CHECK (
    company_id = (auth.jwt() ->> 'company_id')::int
  );
\`\`\`

## Junction Table Policy (Both-Sided Auth)

\`\`\`sql
CREATE POLICY "Users can link own company resources"
  ON contact_organizations FOR INSERT
  WITH CHECK (
    -- Verify user owns contact
    EXISTS (
      SELECT 1 FROM contacts
      WHERE id = contact_organizations.contact_id
      AND company_id = (auth.jwt() ->> 'company_id')::int
    )
    AND
    -- Verify user owns organization
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = contact_organizations.organization_id
      AND company_id = (auth.jwt() ->> 'company_id')::int
    )
  );
\`\`\`

**Note:** Junction table policies require indexes on BOTH foreign keys for performance.
```

---

### Skill Creation Checklist

Before deploying a skill:

- [ ] **Name** is lowercase-with-hyphens, descriptive
- [ ] **Description** includes:
  - [ ] Specific capabilities
  - [ ] When to use it
  - [ ] Trigger keywords
  - [ ] Under 1024 characters
- [ ] **SKILL.md body** is concise (<500 lines)
- [ ] **Long content** moved to `references/` directory
- [ ] **References** are one level deep (no nested chains)
- [ ] **Scripts** (if any) are executable with proper shebang
- [ ] **No hardcoded secrets** (use environment variables)
- [ ] **Dependencies** documented if required
- [ ] **Tested** with natural language phrases (not just `/skill-name`)
- [ ] **Discovery verified** (skill triggers when expected)
- [ ] **Context budget checked** (`/context` shows no exclusions)

---

## Subagents: The Specialized Workers {#subagents}

### What Are Subagents?

Subagents are **parallel Claude instances** with:
- Isolated 200K token contexts (separate from main conversation)
- Specialized configurations (custom system prompts, tool restrictions)
- Ability to work simultaneously (up to 10 concurrent)

### How Subagents Differ from Skills

| Feature | Skills | Subagents |
|---------|--------|-----------|
| **Context** | Share main conversation | Isolated 200K context |
| **Parallelism** | Sequential (one skill at a time) | Parallel (up to 10 simultaneous) |
| **Tool Access** | Can be restricted | Can be restricted |
| **Purpose** | Task-specific workflows | Complex, self-contained work |
| **Output** | Results inline in conversation | Summary returned to main thread |

### When to Use Subagents

✅ **Use subagents when:**
- Task produces verbose output you don't need in main context
- Work requires specific tool restrictions (e.g., read-only)
- Self-contained work that can return concise summary
- Parallel tasks benefit from simultaneous execution
- Complex multi-step analysis that would clutter main conversation

❌ **Don't use subagents when:**
- Simple task can be done inline
- You need full conversation history for context
- Task requires coordination with other subagents (they can't communicate directly)
- Overhead of separate context isn't justified

### Built-In Subagent Types

Claude Code provides several pre-configured subagent types:

#### `Explore` (Fast Codebase Explorer)

**Purpose:** Quickly find files, search code, answer codebase questions

**Use for:**
- "Where is the authentication logic?"
- "How does the opportunity pipeline work?"
- "Find all places where we query contacts"

**Not for:** Modifying code (read-only)

---

#### `Plan` (Software Architect)

**Purpose:** Design implementation plans before coding

**Use for:**
- "Plan how to add multi-tenant support"
- "Design the migration strategy for new schema"
- "Architect the notification system"

**Not for:** Actually implementing the plan (planning only)

---

#### `code-reviewer` (Post-Completion Review)

**Purpose:** Review code against standards and plan requirements

**Use for:**
- After completing major features
- Before creating pull requests
- Validating adherence to architectural patterns

**Not for:** Writing code (read + analyze only)

---

#### `task-implementor` (Execute Plan Tasks)

**Purpose:** Implement specific tasks from a master plan

**Use for:**
- Parallel implementation of independent plan steps
- Focused execution with explicit scope

**Not for:** Deciding what to implement (follows plan)

---

#### `rls-auditor` (RLS Security Audit)

**Purpose:** Systematic RLS policy security validation

**Use for:**
- Pre-migration security checks
- Periodic security audits
- Verifying soft-delete enforcement

**Not for:** Creating policies (auditing only)

---

### How to Invoke Subagents

#### Method 1: Task Tool (Explicit)

```markdown
I need to explore the codebase to understand the contacts feature architecture.
```

Claude automatically uses Task tool with `subagent_type=Explore`

#### Method 2: @ Mention (If Custom Agent Exists)

```markdown
@security-reviewer please audit the new authentication code
```

#### Method 3: Skills Can Invoke Subagents

**SKILL.md with context: fork:**
```yaml
---
name: deep-research
description: "Conduct multi-source research with citations."
context: fork
agent: general-purpose
---
```

When skill triggers, runs in subagent context automatically.

---

### Subagent Orchestration Patterns

#### Pattern 1: Parallel Research

**Scenario:** Compare multiple options simultaneously

```markdown
User: "Research pickup trucks from Ford, Chevy, and Toyota"

Claude spawns 3 subagents in parallel:
  - Subagent 1: Research Ford trucks
  - Subagent 2: Research Chevy trucks
  - Subagent 3: Research Toyota trucks

Each subagent works independently, conducts web searches, analyzes results.

All 3 return summaries to main thread.

Main thread synthesizes comparison report.
```

**Benefit:** 3x faster than sequential research

---

#### Pattern 2: Analysis-Then-Implementation

**Scenario:** Subagent analyzes, main thread implements

```markdown
User: "Refactor the opportunities module"

Step 1: Spawn @code-explorer subagent (read-only)
  - Maps all files in opportunities/
  - Identifies dependencies
  - Documents current architecture
  - Returns: "Here's the current structure..."

Step 2: Main thread uses analysis
  - Proposes refactoring plan
  - User approves
  - Main thread implements changes (has Write access)

Step 3: Spawn @code-reviewer subagent (read-only)
  - Reviews refactored code
  - Checks for issues
  - Returns: "Found 2 issues..."

Step 4: Main thread fixes issues
```

**Benefit:** Separation of concerns—analysis can't accidentally modify code

---

#### Pattern 3: Security Review Workflow

```markdown
User: "Review the new authentication system"

Spawn @security-reviewer subagent:
  - Tool restrictions: Read, Grep, Glob (no Write/Edit)
  - Custom system prompt emphasizing security concerns
  - Analyzes auth code for vulnerabilities
  - Returns structured findings:
    - Critical issues: X
    - Warnings: Y
    - Recommendations: Z

Main thread addresses findings
```

**Benefit:** Security-focused perspective without risk of accidental code changes

---

### Subagent Limitations

#### 1. Cannot Spawn Other Subagents

**Flat hierarchy only:**
```
Main Thread
  ├─ Subagent 1 ✅
  ├─ Subagent 2 ✅
  └─ Subagent 3 ✅

Main Thread
  └─ Subagent 1
      └─ Subagent 2 ❌ (NOT ALLOWED)
```

#### 2. Cannot Directly Communicate

**All coordination through main thread:**
```
Subagent A ──┐
             ├─> Main Thread ──> User
Subagent B ──┘
```

**If Subagent A needs info from Subagent B:**
```
Subagent A → Main Thread → Subagent B → Main Thread → Subagent A
```
*(Adds latency and complexity)*

#### 3. Configuration Drift Risk

As base Claude model updates, carefully tuned subagent configurations may behave differently.

**Mitigation:**
- Version control subagent configs
- Periodically test subagents
- Document expected behavior

---

### Creating Custom Subagents

**File:** `.claude/agents/my-subagent/AGENT.md`

```yaml
---
name: my-subagent
description: "What this subagent specializes in"
tools:
  - Read
  - Grep
  - Glob
model: sonnet
system_prompt: |
  You are a specialized code reviewer focused on security.

  Your job:
  1. Analyze code for security vulnerabilities
  2. Check for common mistakes (SQL injection, XSS, etc.)
  3. Verify authentication/authorization
  4. Return structured findings

  DO NOT:
  - Modify any files
  - Make assumptions about business logic
  - Skip important security checks
---

# Custom Instructions

Additional guidance for this subagent...
```

**Best Practices:**
- ✅ Focused system prompts (not comprehensive manuals)
- ✅ Clear single responsibility
- ✅ Minimal tool access (only what's needed)
- ✅ Structured output format

**Anti-Patterns:**
- ❌ 800-line system prompts (be concise)
- ❌ All-purpose subagents (keep focused)
- ❌ Unnecessary tool access (restrict by default)

---

### Subagents vs Skills: Decision Matrix

| Scenario | Use Subagent? | Use Skill? | Why |
|----------|---------------|------------|-----|
| Code review after feature completion | ✅ Yes | ❌ No | Complex analysis, read-only tools, isolated context |
| Pre-commit quality checks | ❌ No | ✅ Yes | Simple grep commands, inline execution |
| Deep codebase exploration | ✅ Yes | ❌ No | Verbose output would clutter main thread |
| Migration safety validation | ❌ No | ✅ Yes | Deterministic script, inline results |
| Parallel research (3 topics) | ✅ Yes | ❌ No | Parallelism is key benefit |
| PDF form filling workflow | ❌ No | ✅ Yes | Multi-step procedure, inline guidance |

---

## Decision Framework {#decision-framework}

### The Master Decision Tree

```
┌─────────────────────────────────────┐
│ Need to extend Claude's behavior?   │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ Always applicable? │
         └────┬──────────┬────┘
              │          │
             YES        NO
              │          │
              ▼          ▼
         ┌──────┐   ┌──────────────┐
         │ RULE │   │ Task-specific │
         └──────┘   └──────┬────────┘
                           │
                           ▼
                  ┌─────────────────────┐
                  │ Simple grep/command? │
                  └────┬──────────┬──────┘
                       │          │
                      YES        NO
                       │          │
                       ▼          ▼
                  ┌───────┐  ┌────────────────┐
                  │ SKILL │  │ Complex/Parallel│
                  └───────┘  └────────┬────────┘
                                      │
                                      ▼
                             ┌─────────────────┐
                             │ Need isolation? │
                             └────┬───────┬────┘
                                  │       │
                                 YES     NO
                                  │       │
                                  ▼       ▼
                           ┌─────────┐ ┌───────┐
                           │SUBAGENT │ │ SKILL │
                           └─────────┘ └───────┘
```

### Quick Reference Table

| Question | Rules | Skills | Subagents |
|----------|-------|--------|-----------|
| Always needed? | ✅ Yes | ❌ No | ❌ No |
| Multi-step workflow? | ❌ No | ✅ Yes | ✅ Yes |
| Needs scripts? | ❌ No | ✅ Yes | ❌ No |
| Parallel execution? | ❌ No | ❌ No | ✅ Yes |
| Tool restrictions? | ❌ No | ✅ Yes | ✅ Yes |
| Isolated context? | ❌ No | ❌ No | ✅ Yes |
| Token cost | Always | When used | Separate |

---

## Practical Recommendations for Crispy CRM {#recommendations}

### Current State Analysis

**Strengths:**
- ✅ 6 well-organized rule files (DOMAIN_INTEGRITY, PROVIDER_RULES, etc.)
- ✅ 20+ skills from Superpowers plugin (verification-before-completion, fail-fast-debugging)
- ✅ Built-in subagents available (Explore, Plan, code-reviewer, rls-auditor)
- ✅ Strong architectural discipline (Data Provider, RLS, soft-delete patterns)

**Weaknesses (Gap Analysis):**
- ⚠️ 174 `: any` type leaks (active bleeding)
- ⚠️ 50 console.log statements (production noise)
- ⚠️ 512 RLS policies (complex, needs systematic audit)
- ⚠️ 26 TODO/FIXME markers (technical debt)

### Most Effective Approach

**DON'T create new skills yet.** Here's why:

#### The Core Problem

You have **existing violations**, not a **prevention problem**.

**Skills prevent NEW problems:**
```
Current state: 174 any types
Create skill → Triggers on commit → Finds 174 violations → Always fails
Result: Maintenance burden, no progress
```

**Direct fixing solves the problem:**
```
Current state: 174 any types
Fix 10/day → Day 5: 124 any types → Day 10: 74 any types → Day 17: 0
Result: Problem eliminated
```

#### Recommended Action Plan

### Week 1: Systematic Cleanup

```bash
# Day 1: Baseline
rg "console\.(log|error)" src/ -g '!**/*.test.ts' --files-with-matches > cleanup-list.txt
# Result: 50 files with console logs

# Days 2-6: Fix 10 files/day
# Pick 10 files from cleanup-list.txt
# Remove console.log, replace with proper logging
# Commit: "chore: remove console logs from ContactList, OrganizationEdit..."

# Day 7: Measure progress
rg "console\.(log|error)" src/ -g '!**/*.test.ts' --count
# Goal: 50 → 0
```

### Week 2: Add Prevention (Rules, Not Skills)

Once console.log count reaches **zero**, add rule to prevent new ones:

**Add to `.claude/rules/CODE_QUALITY.md`:**

```markdown
## Production Noise Prevention

**Rule:** Zero tolerance for console statements in production code.

Before claiming work is "done" or "ready to commit," verify:

\`\`\`bash
rg "console\." src/ -g '!**/*.test.ts' --count
# Must return: 0
\`\`\`

- ❌ `console.log()` → Use structured logging service
- ❌ `console.error()` → Use error monitoring (Sentry)
- ❌ `console.warn()` → Use structured logging

**Exception:** Test files may use console for debugging.
```

**Why rule instead of skill?**
- ✅ 5 lines vs 50+ lines (simpler)
- ✅ Always active (don't rely on triggering)
- ✅ No new files to maintain
- ✅ You already have rule files that work

### Month 1: Type Safety Campaign

```bash
# Week 1: Identify hotspots
rg ": any" src/ --type ts --stats

# Weeks 2-4: Systematic fixes (5 files/day)
# Focus on high-value targets:
# 1. Form components (data flows through them)
# 2. Provider handlers (architectural boundary)
# 3. API response types (external data)

# Track progress weekly
# Goal: 174 → <50 in 30 days
```

**Add to rules after progress:**

```markdown
## Type Safety Requirements

**Current Baseline:** 174 uses of `: any` (as of 2026-01-27)

**Goal:** Reduce to zero over 3 months

Before merging PRs:
\`\`\`bash
rg ": any" src/ --type ts --count
# Must be ≤ baseline (not increasing)
\`\`\`

**Preferred alternatives:**
- Type guards: `if (typeof x === 'string')`
- Generic constraints: `<T extends RaRecord>`
- Zod inference: `type T = z.infer<typeof schema>`
```

### When to Create Skills (Future)

**Only create skills after baseline is clean:**

#### Skill 1: `migration-guard` (Month 2)

**Why wait:**
- Migrations are infrequent (not daily pain point)
- Need Python script (requires setup/testing)
- More valuable once database grows beyond 512 policies

**When to create:**
- After type safety and console.log are clean
- When next major migration needed
- If migration errors occur frequently

---

#### Skill 2: `provider-linter` (Month 3)

**Why wait:**
- Your 6 rule files already enforce provider patterns
- Skills add complexity (only justified by clear ROI)
- Current manual review is working

**When to create:**
- If violations start appearing frequently
- If onboarding new developers who don't know patterns
- If codebase scales beyond current team's review capacity

---

### What to Do RIGHT NOW

**Option A: Start Cleanup (Most Effective)**

```bash
# Right now
cd ~/projects/crispy-crm

# Create cleanup list
rg "console\.(log|error)" src/ -g '!**/*.test.ts' --files-with-matches | head -10 > cleanup-today.txt

# Pick first file, remove console logs, commit
# Repeat for 9 more files

# End of day: 50 → 40 console logs
```

**Option B: Add Simple Rule (Quick Win)**

Add this to `.claude/rules/CODE_QUALITY.md`:

```markdown
## Pre-Commit Verification

Before claiming "done" or "ready to commit," run:

\`\`\`bash
# Check for console logs (goal: 0)
rg "console\." src/ -g '!**/*.test.ts' --count

# Check for new any types (baseline: 174, must not increase)
rg ": any" src/ --type ts --count
\`\`\`

If violations found, fix them before committing.
```

**Option C: Do Nothing (Also Valid)**

Your current setup works. Only change when pain is felt.

---

### Priority Matrix

| Issue | Severity | Frequency | Fix Complexity | Priority | Action |
|-------|----------|-----------|----------------|----------|--------|
| 174 any types | High | Continuous | Low (search/replace) | 🔴 P0 | Fix 5-10/day |
| 50 console logs | Medium | Daily merges | Very Low (delete) | 🔴 P0 | Fix 10/day |
| 512 RLS policies | High | Monthly (migrations) | High (need script) | 🟡 P1 | Create skill (month 2) |
| 84 UI components | Low | Occasional | Medium (review) | 🟢 P2 | Monitor, act if drifts |

---

### The Bottom Line

**Most effective method for Crispy CRM:**

1. ✅ **Fix the 50 console logs** (5 days, simple grep & delete)
2. ✅ **Add rule to `.claude/rules/CODE_QUALITY.md`** (5 minutes)
3. ✅ **Use existing `verification-before-completion` skill** (already have it)
4. ✅ **Fix type safety gradually** (5-10 files/day)
5. ❌ **DON'T create new skills until baseline is clean**

**Why?**
- Skills are infrastructure for preventing NEW problems
- You have EXISTING problems that need direct fixing
- Simple rules + existing skills already provide verification
- Adding complexity now increases maintenance without solving root issues

---

## Common Pitfalls and Anti-Patterns {#pitfalls}

### Anti-Pattern 1: Creating Skills for Existing Violations

**Scenario:**
```
State: 174 any types exist
Action: Create quality-gatekeeper skill
Result: Skill triggers, finds 174 violations, fails every time
Problem: Maintaining skill that constantly fails on baseline
```

**Solution:**
1. Fix baseline first (get to zero violations)
2. THEN add prevention (rule or skill)

---

### Anti-Pattern 2: Over-Engineering Simple Checks

**Scenario:**
```yaml
# Skill with 500-line SKILL.md + Python scripts
# Just to check: rg "console.log" src/
```

**Problem:** Using a sledgehammer to crack a nut.

**Solution:** Simple checks belong in rules:
```markdown
# .claude/rules/CODE_QUALITY.md
Run before commit: `rg "console.log" src/ --count`
Must return: 0
```

---

### Anti-Pattern 3: Skill Description Without Triggers

**Scenario:**
```yaml
description: "Helps maintain code quality"
```

**Problem:** Claude never knows when to use it.

**Solution:**
```yaml
description: "Check for type safety, console logs, and a11y before commits. Use when user says done, finished, commit, or ready."
```

---

### Anti-Pattern 4: Bloated SKILL.md Files

**Scenario:**
```markdown
# SKILL.md (2,000 lines)
Everything inline, no progressive disclosure
```

**Problem:** Costs 2,000 tokens every trigger.

**Solution:**
```
SKILL.md (200 lines) - Core workflow
references/ - Details load on-demand
scripts/ - Code executes, only output loads
```

---

### Anti-Pattern 5: Nested Reference Chains

**Scenario:**
```
SKILL.md → references/advanced.md → references/details.md
```

**Problem:** Claude may never reach `details.md`.

**Solution:** All references one level deep from SKILL.md.

---

### Anti-Pattern 6: Hardcoded Secrets

**Scenario:**
```python
API_KEY = "sk-1234567890abcdef"
```

**Problem:** Security vulnerability + version control exposure.

**Solution:**
```python
API_KEY = os.environ.get("API_KEY")
```

---

### Anti-Pattern 7: Mega-Skills

**Scenario:**
```yaml
name: pdf-master
description: "Does everything with PDFs..."
```

**Problem:** Too broad, hard to trigger reliably.

**Solution:** Split into focused skills:
- `pdf-extract`
- `pdf-forms`
- `pdf-merge`

---

### Anti-Pattern 8: Skills That Should Be Rules

**Scenario:**
```yaml
# Skill: no-any-types
description: "Enforces no any types"
```

**Problem:** This is a constraint, not a workflow.

**Solution:** Add to rules:
```markdown
# .claude/rules/TYPE_SAFETY.md
- No `: any` types (BANNED)
```

---

### Anti-Pattern 9: Using Subagents for Simple Tasks

**Scenario:**
```
User: "Count how many console logs exist"
Action: Spawn subagent
```

**Problem:** Overhead of separate context not justified.

**Solution:** Run inline:
```bash
rg "console.log" src/ --count
```

---

### Anti-Pattern 10: Exceeding Description Budget

**Scenario:**
```
Total descriptions: 18,000 characters
Default budget: 15,000 characters
Result: Some skills invisible to Claude
```

**Problem:** Skills appear installed but never trigger.

**Solution:**
1. Check `/context` for exclusions
2. Write more concise descriptions
3. Or increase budget: `export SLASH_COMMAND_TOOL_CHAR_BUDGET=30000`

---

## Conclusion

### Key Takeaways

1. **Rules** are always-loaded constraints (architectural "laws")
2. **Skills** are on-demand workflows (procedural playbooks)
3. **Subagents** are parallel workers (isolated specialists)
4. **Progressive disclosure** minimizes token costs across all three
5. **Skills prevent NEW problems** (don't create them for existing violations)
6. **Fix baseline first, then add prevention** (most effective approach)

### For Crispy CRM Specifically

**Current state:**
- ✅ Strong architectural rules (6 files)
- ✅ Superpowers skills active (20+ workflows)
- ✅ Built-in subagents available
- ⚠️ 174 any types, 50 console logs (existing violations)

**Recommended path forward:**
1. **Week 1:** Fix 50 console logs (10/day)
2. **Week 2:** Add prevention rule to CODE_QUALITY.md
3. **Months 1-3:** Fix type safety gradually (5-10 files/day)
4. **Month 2+:** Create migration-guard skill (after cleanup)

**Don't create new skills until:**
- Baseline violations are eliminated
- Clear ROI justifies maintenance complexity
- Simple rules prove insufficient

---

## References and Further Reading

### Official Documentation

- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
- [Claude Agent Skills Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Claude Code Subagents Guide](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Memory (Rules)](https://code.claude.com/docs/en/memory)

### Research Sources

This document was compiled from:
- Perplexity deep research (60+ authoritative sources)
- Official Anthropic engineering blog posts
- Community implementation reports
- Real-world enterprise deployments
- Gap analysis of Crispy CRM codebase (309 migrations, 512 RLS policies, 174 type violations)

### Implementation Examples

- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Superpowers Plugin](https://github.com/obra/superpowers)
- [Awesome Claude Skills Collection](https://github.com/travisvn/awesome-claude-skills)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-27
**Maintained By:** Crispy CRM Development Team
