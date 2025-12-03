# Anthropic Best Practices for Plan Writing

## Core Philosophy

> "Writing plans IS Test-Driven Development applied to process documentation."

1. **RED**: Watch agents fail without the plan
2. **GREEN**: Write documentation that addresses those failures
3. **REFACTOR**: Close rationalization loopholes

---

## The 500-Line Rule

**SKILL.md files MUST stay under 500 lines.**

- Main file = overview, quick reference, structure
- Details go in `resources/` subdirectory
- Reference files can be longer (include TOC if 100+ lines)
- One level deep only (no nested references)

---

## Progressive Disclosure Pattern

```
SKILL.md (< 500 lines)
├── Purpose (what, when)
├── Quick reference (most common patterns)
├── Structure templates
└── Links to resources/

resources/
├── detailed-topic-1.md
├── detailed-topic-2.md
└── examples/
```

---

## Description Field Requirements

The `description` in YAML frontmatter is critical for discovery:

**Must include:**
- "Use when..." phrasing
- All trigger keywords/terms
- Symptoms, not just concepts
- Tool names and error messages if relevant

**Max length:** 1024 characters

**Example:**
```yaml
description: Use when creating implementation plans, execution plans, task plans,
  or agent plans. Applies TDD principles to planning. Integrates with engineering
  constitution. Trigger terms - plan, planning, implementation plan, execution plan,
  task breakdown, agent instructions, zero context, write plan.
```

---

## Content Guidelines

### DO:
- One excellent example over multiple mediocre ones
- Concrete patterns over abstract concepts
- Explicit triggers and conditions
- Measurable outcomes ("test passes" not "works well")
- Clear anti-patterns with fixes

### DON'T:
- Time-sensitive information (versions, dates)
- Inconsistent terminology
- Overly verbose explanations
- Narrative storytelling
- Multi-language dilution

---

## Testing Skills

### Before deploying:
1. Build 3+ evaluation scenarios
2. Test each scenario without the skill
3. Document failure modes
4. Test with skill active
5. Verify improvement

### Testing command:
```bash
echo '{"session_id":"test","prompt":"your test prompt"}' | \
  npx tsx .claude/hooks/skill-activation-prompt.ts
```

---

## Authority Language for Discipline

When enforcing critical practices:

| Soft (avoid) | Hard (use) |
|--------------|------------|
| Consider | YOU MUST |
| When feasible | Always |
| Generally | No exceptions |
| Might want to | Never |
| Could try | Required |

**Rationale:** Bright-line rules eliminate rationalization under pressure.

---

## Checklist-Based Workflows

For multi-step processes, always:

1. Use TodoWrite for tracking
2. Explicit completion criteria per step
3. Verification command after each step
4. No implicit dependencies

---

## Common Anti-Patterns

| Anti-Pattern | Fix |
|--------------|-----|
| "Do the obvious thing" | Spell out exactly what |
| "In the appropriate directory" | Exact path required |
| "Run the tests" | `npm test -- path/to/test.ts` |
| "Make sure it works" | Specific verification command |
| "Handle errors appropriately" | Show exact error handling pattern |
| "Follow best practices" | Link to specific practice doc |

---

## Model Compatibility

Skills should work across Claude models:
- Test with Haiku (fastest, least capable)
- Test with Sonnet (balanced)
- Test with Opus (most capable)

If skill only works with Opus, it's too implicit.

---

## Quick Validation Checklist

Before finalizing a plan skill:

- [ ] SKILL.md under 500 lines
- [ ] Description has trigger keywords
- [ ] Examples are concrete, not abstract
- [ ] Anti-patterns explicitly shown
- [ ] Verification commands exact
- [ ] File paths absolute, not relative
- [ ] Tested with 3+ scenarios
- [ ] Works without prior context
- [ ] Constitution compliance embedded
