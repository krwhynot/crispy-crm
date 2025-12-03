---
name: technical-feedback
description: Use when receiving or giving code review feedback, implementing review suggestions, addressing PR comments, or evaluating technical suggestions. Covers both directions - receiving feedback (verify before implementing, push back on principle violations) and giving feedback (prioritize project principles, actionable critique). Triggers on review, feedback, suggestions, PR comments, implement this, fix this, address comments.
---

# Technical Feedback Protocol

## Purpose

Bidirectional code review discipline that maintains technical rigor while respecting project principles. Applies to ALL feedback sources: you (the developer), AI tools (Zen MCP, Copilot), and human team members.

## Core Principle

**Verify before implementing. Push back on principle violations. Actions over words.**

---

## Part 1: Receiving Feedback

### The Response Pattern

When receiving feedback from ANY source:

1. **READ**: Complete feedback without reacting
2. **UNDERSTAND**: Restate the requirement (or ask for clarification)
3. **VERIFY**: Check against actual codebase - implement with confidence but note discrepancies
4. **EVALUATE**: Does this align with project principles?
5. **RESPOND**: Technical acknowledgment or reasoned pushback
6. **IMPLEMENT**: One item at a time, test each

### Principle Violations = Automatic Pushback

**ALWAYS refuse** suggestions that violate these Crispy CRM principles:

| Principle | Violation Examples | Pushback Response |
|-----------|-------------------|-------------------|
| **Fail-Fast** | Add retry logic, circuit breakers, exponential backoff | "This violates fail-fast. Pre-launch we want errors to surface immediately, not be masked by resilience patterns." |
| **Single Data Provider** | Import Supabase directly in components | "All DB access must go through `unifiedDataProvider`. Direct imports create multiple sources of truth." |
| **Zod at API Boundary** | Add form-level validation, inline validators | "Validation belongs at the API boundary in the data provider, not in forms. Forms use `zodSchema.partial().parse({})` for defaults." |
| **Design System** | Use hardcoded colors (`bg-gray-500`) | "Use semantic colors only (`bg-muted`, `text-primary`). Hardcoded values break theming." |
| **Deprecated Patterns** | Use `Contact.company_id`, `archived_at` | "This is deprecated. Use `contact_organizations` junction table / `deleted_at` instead." |

### Source-Specific Handling

**From Your Human Partner (krwhynot):**
- Implement after understanding
- Still ask if scope is unclear
- Push back with reasoning if it violates principles
- No performative agreement needed

**From External AI Tools (Zen MCP, Copilot, etc.):**
- Verify technical correctness against codebase
- Check if suggestion breaks existing functionality
- Confirm AI understands full project context
- Push back if suggestion contradicts architecture

**From Human Team Members (PR reviews):**
- Same verification as AI tools
- May lack context on project principles
- Educate with reasoning, not dismissal
- Involve your partner if architectural conflict

### Handling Unclear Feedback

Stop implementation if ANYTHING is unclear:
- Don't implement partial understanding
- Items may be related - clarify all before proceeding
- Ask specific questions, not "can you clarify?"

### When To Push Back

Push back with technical reasoning when suggestions:
- Break existing functionality
- Violate project principles (see table above)
- Contradict architectural decisions
- Ignore domain requirements (MFB food broker context)
- Add complexity without clear benefit (YAGNI)

---

## Part 2: Giving Feedback

### Review Priorities (Crispy CRM Specific)

When reviewing code, check in this order:

1. **Principle Compliance** (Critical)
   - No retry logic, circuit breakers, or resilience patterns
   - All DB access through `unifiedDataProvider`
   - Zod validation at API boundary only
   - Form defaults from `zodSchema.partial().parse({})`
   - Semantic colors only (no hardcoded hex/Tailwind colors)

2. **Architectural Alignment** (High)
   - Feature structure follows pattern (`index.tsx`, `*List.tsx`, `*Create.tsx`, etc.)
   - Components in correct directories
   - No deprecated patterns (`company_id`, `archived_at`)

3. **Domain Correctness** (High)
   - Correct terminology (Principal, Distributor, Operator)
   - Pipeline stages match defined 7-stage flow
   - User role permissions respected

4. **Implementation Quality** (Medium)
   - Logic errors, edge cases
   - Security issues (RLS policies, input handling)
   - Performance concerns (N+1 queries, unnecessary re-renders)

### Feedback Format

**Be specific and actionable:**

```
// BAD
"This doesn't look right"

// GOOD
"Line 45: Direct Supabase import violates single-source principle.
Use `useGetOne` from data provider instead of `supabase.from('contacts').select()`"
```

**Include the fix or path forward:**

```
// BAD
"Don't use hardcoded colors"

// GOOD
"Replace `bg-gray-100` with `bg-muted` (line 23).
See: src/components/ui theme for semantic color reference."
```

---

## Part 3: Communication Style

### Keep Focus on Technical Content

Some warmth is acceptable, but prioritize substance:

```
// GOOD
"Understood. I'll implement the pagination changes. One note: the current
approach uses offset pagination, but keyset pagination would be more
efficient for large datasets. Want me to use keyset instead?"

// AVOID (too effusive)
"Great point! You're absolutely right that we need pagination!
I love this suggestion and will implement it right away!"
```

### Self-Correction Pattern

When your pushback was wrong:

```
"I verified [X] and you're correct. My understanding was wrong because
[specific reason]. Fixing now."
```

Skip long apologies and over-explanations. Actions demonstrate learning.

### Acknowledging Correct Feedback

State what changed factually:

```
// GOOD
"Updated the form to use semantic colors. Also caught two other
hardcoded values in the same file."

// AVOID
"Thanks so much for catching that! You're so right!"
```

---

## Quick Reference

### Receiving Feedback Checklist
- [ ] Read complete feedback before reacting
- [ ] Verify suggestion against actual codebase
- [ ] Check against project principles (fail-fast, single provider, Zod boundary, design system)
- [ ] Push back with reasoning if violation detected
- [ ] Implement one item at a time
- [ ] Note any discrepancies found during implementation

### Giving Feedback Checklist
- [ ] Check principle compliance first
- [ ] Verify architectural alignment
- [ ] Confirm domain correctness
- [ ] Be specific with line numbers
- [ ] Include fix or path forward
- [ ] Focus on blocking issues over nitpicks

---

## Related Resources

- `CLAUDE.md` - Project principles and architecture
- `enforcing-principles` skill - Detailed principle enforcement
- `ui-ux-design-principles` skill - Design system rules
- `supabase-crm` skill - Database patterns

---

**Skill Status**: ACTIVE
**Line Count**: ~200 (well under 500-line limit)
