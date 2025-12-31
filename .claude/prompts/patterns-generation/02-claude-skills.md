---
name: generate-patterns-claude-skills
directory: .claude/skills/
complexity: HIGH
output: .claude/skills/PATTERNS.md
---

# Generate PATTERNS.md for Claude Code Skills

## Context

The `.claude/skills/` directory contains the Claude Code skill auto-activation system. Skills are modular knowledge packages that automatically activate based on user prompts, file paths, or code content. This system follows Anthropic best practices including the 500-line rule and progressive disclosure pattern.

**Why this matters:** Skills enforce engineering principles, prevent common mistakes, and provide context-aware guidance without requiring users to remember what to invoke. The system includes guardrail skills (block anti-patterns) and domain skills (suggest best practices).

---

## Phase 1: Exploration

Read these files in order:

### 1. Master Configuration
```
/home/krwhynot/projects/crispy-crm/.claude/skills/skill-rules.json
```
**Purpose:** Understand all skill definitions, trigger types, enforcement levels, and the overall structure. This is the central registry for all skills.

### 2. Meta-Skill (Skill Developer)
```
/home/krwhynot/projects/crispy-crm/.claude/skills/skill-developer/SKILL.md
/home/krwhynot/projects/crispy-crm/.claude/skills/skill-developer/TRIGGER_TYPES.md
/home/krwhynot/projects/crispy-crm/.claude/skills/skill-developer/SKILL_RULES_REFERENCE.md
```
**Purpose:** Understand how to create skills, trigger pattern design, YAML frontmatter structure, and the 500-line rule. This is the authoritative guide for skill development.

### 3. Critical Guardrail Skills
```
/home/krwhynot/projects/crispy-crm/.claude/skills/verification-before-completion/SKILL.md
/home/krwhynot/projects/crispy-crm/.claude/skills/fail-fast-debugging/SKILL.md
/home/krwhynot/projects/crispy-crm/.claude/skills/root-cause-tracing/SKILL.md
```
**Purpose:** Understand blocking guardrails that enforce discipline. Note enforcement: "block" vs "suggest", and how they integrate with tools like TodoWrite and MCP.

### 4. Domain Skills with Resources
```
/home/krwhynot/projects/crispy-crm/.claude/skills/enforcing-principles/SKILL.md
/home/krwhynot/projects/crispy-crm/.claude/skills/supabase-cli/SKILL.md
/home/krwhynot/projects/crispy-crm/.claude/skills/ui-ux-design-principles/SKILL.md
```
**Purpose:** Understand skills with extensive resource files. Note the progressive disclosure pattern (main SKILL.md links to resources/).

### 5. Hook Mechanisms
```
/home/krwhynot/projects/crispy-crm/.claude/skills/skill-developer/HOOK_MECHANISMS.md
```
**Purpose:** Understand UserPromptSubmit vs PreToolUse hooks, exit code behavior, and session state management.

---

## Phase 2: Pattern Identification

Identify and document these 5 patterns:

### Pattern A: Skill File Structure
- YAML frontmatter requirements (name, description)
- The 500-line rule and when to create reference files
- Progressive disclosure: SKILL.md -> resources/ hierarchy
- Table of contents for files >100 lines

### Pattern B: Trigger Pattern Design
- Four trigger types: keywords, intentPatterns, pathPatterns, contentPatterns
- Regex best practices (non-greedy `.*?`, escaping)
- Keyword selection (specific vs generic, variations)
- Testing triggers with hook scripts

### Pattern C: Enforcement Levels
- `block` vs `suggest` vs `warn` vs `contextual`
- When to use each enforcement level
- blockPatterns vs promptTriggers distinction
- Priority levels (critical, high, medium)

### Pattern D: Resource Loading & Progressive Disclosure
- Main SKILL.md as entry point
- resources/ subdirectory organization
- Cross-referencing between resource files
- Keeping each file focused on one topic

### Pattern E: Hook Integration & Session Tracking
- UserPromptSubmit (proactive suggestions)
- PreToolUse (blocking guards)
- PostToolUse (reset/cleanup)
- Session state management (.claude/hooks/state/)
- Skip conditions (file markers, env vars)

---

## Phase 3: Generate PATTERNS.md

Use this exact structure:

```markdown
# Claude Skills Patterns

{Brief description of the skill system architecture}

## Architecture Overview

```
{ASCII diagram showing:
- skill-rules.json at center
- SKILL.md files in subdirectories
- resources/ hierarchies
- Hook integration (UserPromptSubmit, PreToolUse)
- Session state flow}
```

---

## Pattern A: Skill File Structure

{Description of SKILL.md anatomy}

**When to use**: {Decision criteria for skill creation}

### YAML Frontmatter

```yaml
# .claude/skills/{skill-name}/SKILL.md
{Show required frontmatter fields}
```

### Progressive Disclosure Structure

```
{Show directory tree for skills with resources/}
```

**Key points:**
- 500-line rule: Split large skills into resources/
- Frontmatter description must include trigger keywords
- Table of contents required for files >100 lines
- One concept per resource file

**Example:** `.claude/skills/enforcing-principles/`

---

## Pattern B: Trigger Pattern Design

{Description of the four trigger types}

**When to use**: {Choosing the right trigger type}

### Keywords vs Intent Patterns

```json
{Show promptTriggers example}
```

### File and Content Triggers

```json
{Show fileTriggers example}
```

**Key points:**
- Keywords: Explicit topic mentions (case-insensitive)
- Intent: Action detection via regex
- File paths: Domain-based activation (glob)
- Content: Technology detection (regex in files)

**Example:** `.claude/skills/skill-rules.json` (any skill definition)

---

## Pattern C: Enforcement Levels

{Description of block/suggest/contextual enforcement}

**When to use**: {Decision matrix for enforcement}

### Block Enforcement

```json
{Show blockPatterns example}
```

### Contextual Enforcement

```json
{Show contextualEnforcement example}
```

**Key points:**
- block: Critical mistakes, data integrity, security
- suggest: Domain guidance, best practices
- contextual: Different enforcement per file type
- Always pair block with clear error message

**Example:** `verification-before-completion`, `fail-fast-debugging`

---

## Pattern D: Resource Organization

{Description of progressive disclosure with resources/}

**When to use**: {When to split vs keep inline}

### Resource Directory Structure

```
{Show example resource tree}
```

### Cross-Referencing Pattern

```markdown
{Show how to link from SKILL.md to resources/}
```

**Key points:**
- Main SKILL.md: Overview + quick reference
- resources/: Deep dives on specific topics
- One level deep only (no resources/sub-resources/)
- Prefix with topic (database-, form-, security-)

**Example:** `.claude/skills/enforcing-principles/resources/`

---

## Pattern E: Hook Integration

{Description of hook system}

**When to use**: {Choosing UserPromptSubmit vs PreToolUse}

### UserPromptSubmit Hook

```typescript
{Show hook configuration}
```

### PreToolUse Guard

```typescript
{Show guard configuration}
```

**Key points:**
- UserPromptSubmit: Inject context before Claude sees prompt
- PreToolUse: Block tool execution (exit code 2)
- Session tracking prevents repeated nags
- Test hooks with stdin piping

**Example:** `.claude/hooks/skill-activation-prompt.ts`

---

## Pattern Comparison Table

| Aspect | Block Guardrail | Suggest Domain | Contextual |
|--------|-----------------|----------------|------------|
| **Purpose** | | | |
| **Enforcement** | | | |
| **Hook Type** | | | |
| **Priority** | | | |
| **Skip Conditions** | | | |

---

## Anti-Patterns to Avoid

### 1. Overly Broad Triggers

```json
// BAD: Triggers on everything
{Show overly generic keywords}

// GOOD: Specific, targeted triggers
{Show focused keywords}
```

### 2. Monolithic SKILL.md

```markdown
// BAD: 1000+ line single file
{Show symptoms}

// GOOD: Progressive disclosure
{Show split structure}
```

### 3. Missing Frontmatter Keywords

```yaml
// BAD: Description doesn't include trigger terms
{Show missing keywords}

// GOOD: Description mirrors promptTriggers
{Show aligned keywords}
```

### 4. Greedy Regex Patterns

```regex
// BAD: Greedy matching causes over-triggering
{Show .* pattern}

// GOOD: Non-greedy with bounds
{Show .*? pattern}
```

---

## Skill Creation Checklist

When adding a new skill:

1. [ ] Create `.claude/skills/{name}/SKILL.md` with frontmatter
2. [ ] Add entry to `.claude/skills/skill-rules.json`
3. [ ] Test triggers: `echo '{"prompt":"..."}' | npx tsx .claude/hooks/skill-activation-prompt.ts`
4. [ ] Verify frontmatter description includes all keywords
5. [ ] Check line count: `wc -l SKILL.md` (must be <500)
6. [ ] If >500 lines, split into resources/
7. [ ] Validate JSON: `jq . skill-rules.json`
8. [ ] Test with 3+ real prompts

---

## File Reference

| Pattern | Primary Files |
|---------|---------------|
| **A: Structure** | `SKILL.md`, frontmatter |
| **B: Triggers** | `skill-rules.json`, `TRIGGER_TYPES.md` |
| **C: Enforcement** | `skill-rules.json` (enforcement, blockPatterns) |
| **D: Resources** | `resources/*.md`, `SKILL.md` links |
| **E: Hooks** | `.claude/hooks/*.ts`, `HOOK_MECHANISMS.md` |
```

---

## Phase 4: Write the File

Write the generated PATTERNS.md to:

```
/home/krwhynot/projects/crispy-crm/.claude/skills/PATTERNS.md
```

**Verification:**
- Confirm all referenced files exist
- Verify code examples are from actual skill files
- Check ASCII diagram reflects current architecture
- Ensure anti-patterns are based on real issues from skill-developer docs
