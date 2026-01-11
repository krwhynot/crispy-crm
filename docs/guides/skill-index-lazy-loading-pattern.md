---
created: 2026-01-10
updated: 2026-01-10
tags:
  - claude-code
  - optimization
  - hooks
  - lazy-loading
type: guide
status: active
---

# Skill Index Lazy Loading Pattern

> **Purpose:** Reduce token bloat when loading large configuration files in Claude Code hooks by splitting into a lightweight index + domain-specific files.

## Problem Statement

Large JSON configuration files loaded on every prompt waste tokens. In Crispy CRM, `skill-rules.json` (57KB) was loaded on every user prompt, but the hook only used ~30% of the fields for matching.

**Symptoms:**
- Large config file loaded frequently
- Most fields unused by the consuming code
- Token cost scales with config size, not usage

## Solution Architecture

Inspired by **VSCode activation events** and **lazy.nvim** patterns:

```
BEFORE:
┌─────────────────────────────────────────────────┐
│  User Prompt  ──▶  Hook loads FULL config       │
│                    (57KB every time)            │
└─────────────────────────────────────────────────┘

AFTER:
┌─────────────────────────────────────────────────┐
│  User Prompt  ──▶  Hook loads INDEX only        │
│                    (~30KB - matching fields)    │
│                                                 │
│  ─────────── LATER (on-demand) ───────────      │
│                                                 │
│  Skill Invoked ──▶  Load domain file            │
│                     (full config, only if used) │
└─────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Analyze What Fields Are Actually Used

Read the consuming code (hook/script) and identify which fields are accessed:

```typescript
// Example: skill-activation-prompt.ts only used:
config.priority           // for grouping output
config.promptTriggers.keywords      // for matching
config.promptTriggers.intentPatterns // for matching

// These were loaded but NEVER used:
// - description, type, enforcement
// - fileTriggers, blockPatterns, warnPatterns
// - verificationCommands, integrations
```

### Step 2: Create Directory Structure

```
.claude/skills/
├── skill-index.json          # Lightweight (~30KB) - loaded always
├── skill-rules.json          # Original full file (preserved as backup)
└── skill-rules/              # Domain-specific full configs
    ├── enforcement.json      # 4 skills
    ├── debugging.json        # 3 skills
    ├── database.json         # 2 skills
    ├── discovery.json        # 2 skills
    ├── process.json          # 6 skills
    └── ui-meta.json          # 5 skills
```

### Step 3: Create Lightweight Index

Extract ONLY the fields needed for matching:

```json
{
  "version": "1.0",
  "description": "Lightweight index for skill matching - full definitions in skill-rules/*.json",
  "skills": {
    "verification-before-completion": {
      "priority": "critical",
      "keywords": ["done", "complete", "fixed", "passes", "works"],
      "intentPatterns": ["claim.*(complete|done|fixed)"]
    },
    "fail-fast-debugging": {
      "priority": "critical",
      "keywords": ["bug", "error", "failing", "broken", "fix"],
      "intentPatterns": ["(fix|debug|investigate).*bug"]
    }
    // ... remaining skills with only matching fields
  },
  "skillToDomain": {
    "verification-before-completion": "enforcement",
    "fail-fast-debugging": "debugging"
    // ... maps skill to domain file for future lazy-loading
  }
}
```

### Step 4: Create Domain Files

Group skills by functional domain. Each file contains FULL definitions:

```json
// .claude/skills/skill-rules/debugging.json
{
  "skills": {
    "fail-fast-debugging": {
      "type": "guardrail",
      "priority": "critical",
      "enforcement": "required",
      "description": "Full description here...",
      "promptTriggers": { /* full config */ },
      "fileTriggers": { /* full config */ },
      "blockPatterns": [ /* full config */ ]
      // ... all original fields
    }
  }
}
```

**Domain Grouping Strategy:**
| Domain | Skills | Rationale |
|--------|--------|-----------|
| `enforcement` | Guardrails that BLOCK actions | verification, principles |
| `debugging` | Bug investigation | fail-fast, root-cause |
| `database` | DB/Supabase patterns | migrations, RLS |
| `discovery` | Codebase exploration | tracing, discovery |
| `process` | Workflows | plans, audits |
| `ui-meta` | UI/Testing/Meta | design, testing |

### Step 5: Update Consuming Code

Change the hook to load the index instead of full config:

```typescript
// BEFORE
const rulesPath = join(projectDir, ".claude", "skills", "skill-rules.json");
const rules: SkillRules = JSON.parse(readFileSync(rulesPath, "utf-8"));

// Access via nested structure
const keywords = config.promptTriggers.keywords;

// AFTER
const indexPath = join(projectDir, ".claude", "skills", "skill-index.json");
const index: SkillIndex = JSON.parse(readFileSync(indexPath, "utf-8"));

// Access flattened structure directly
const keywords = config.keywords;
```

### Step 6: Create Verification Test Suite

Create a test file that proves functional equivalence:

```typescript
// test-skill-index.ts
const TEST_PROMPTS = [
  { prompt: "fix the bug", expectedSkills: ["fail-fast-debugging"] },
  { prompt: "hello world", expectedSkills: [] }, // edge case
];

function runTests() {
  // 1. Structural Integrity - count matches
  // 2. Functional Equivalence - same output for same input
  // 3. Coverage - all skills triggerable
  // 4. Performance - no regression
  // 5. Size Reduction - verify savings
}
```

## Results Template

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Index Size | [X]KB | [Y]KB | [Z]% reduction |
| Skills Count | [N] | [N] | No loss |
| Matching Speed | Baseline | +X% | Faster/Same |

## Best Practices

### DO:
- **Analyze first** - Read consuming code to understand actual field usage
- **Preserve original** - Keep full config as backup/reference
- **Test equivalence** - Prove new system produces identical results
- **Flatten for hooks** - Remove unnecessary nesting in index

### DON'T:
- **Don't auto-discover** - Explicitly define domain files (lazy.nvim lesson)
- **Don't split too granularly** - 6-8 domain files is manageable
- **Don't break consumers** - Full configs must remain available for tools that need them

## References

- **VSCode Activation Events:** Fine-grained triggers instead of `*` (load everything)
- **lazy.nvim:** Spec separation ("what to load" vs "how to configure")
- **typescript-eslint:** Monorepo pattern with targeted loading

## Checklist for New Projects

- [ ] Identify large config files loaded frequently
- [ ] Profile which fields are actually used by consuming code
- [ ] Calculate potential savings (unused fields size)
- [ ] Design index structure with only required fields
- [ ] Group full configs into logical domains
- [ ] Update consuming code to use index
- [ ] Create verification test suite
- [ ] Measure actual savings

---

*Pattern developed for Crispy CRM, January 2026*
