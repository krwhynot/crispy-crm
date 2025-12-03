---
name: brainstorming
description: Use when creating or developing features, before writing code or implementation plans. Refines rough ideas into fully-formed designs through collaborative multiple-choice questioning, alternative exploration (3-5 options), and incremental validation. Integrates with MFB CRM domain (principals, distributors, operators, opportunities) and enforces engineering principles. Hands off to /write-plan for implementation. Trigger terms - brainstorm, ideate, design, thinking about, want to build, new feature, explore options, how should we.
---

# Brainstorming Skill

## Purpose

Transform rough ideas into validated, principle-compliant designs through structured collaborative questioning before any code is written.

## When to Use

- Starting a new feature or enhancement
- Exploring how to solve a problem
- When you say "I'm thinking about...", "I want to build...", "how should we..."
- Before diving into implementation details
- When multiple approaches seem viable

## Workflow Phases

### Phase 1: Understanding (Questions)

**Goal:** Fully grasp purpose, constraints, and success metrics.

**Rules:**
- Ask ONE question per message
- ALWAYS use multiple-choice format with 2-4 options
- Lead with your **recommended option** and explain why
- Include an "Other" escape hatch when appropriate

**Question Format:**
```
I'd like to understand [aspect]. Here are the options I see:

**Recommended: [Option A]** - [Why this is best for MFB's use case]

1. **[Option A]** - [Description]
2. **[Option B]** - [Description]
3. **[Option C]** - [Description]
4. Other (please describe)

Which approach fits your needs?
```

**Topics to Clarify:**
- Core problem being solved
- Who benefits (Account Managers? Admins? Principals?)
- Success metrics (what does "done" look like?)
- Constraints (timeline, technical, domain)
- Integration points with existing features

### Phase 2: Exploration (Alternatives)

**Goal:** Present 3-5 different approaches with trade-offs.

**Rules:**
- Always explore **minimum 3 options**, up to 5
- Lead with recommended approach and reasoning
- Highlight trade-offs: complexity, domain fit, principle compliance
- Apply YAGNI ruthlessly - reject over-engineering
- Consider MFB domain patterns

**Format:**
```
Based on your requirements, here are the approaches I've identified:

**RECOMMENDED: Approach A - [Name]**
[Why this fits MFB's needs and your constraints best]

---

**Approach A: [Name]**
- How it works: [Description]
- Pros: [Benefits]
- Cons: [Drawbacks]
- Complexity: [Low/Medium/High]
- Principle compliance: [Fail-fast? Single source of truth?]

**Approach B: [Name]**
[Same structure]

**Approach C: [Name]**
[Same structure]

[Optional: Approaches D, E if genuinely distinct]

---

Which direction resonates with you?
```

### Phase 3: Design Presentation (Incremental)

**Goal:** Present detailed design in digestible chunks for validation.

**Rules:**
- Break into sections of **200-300 words max**
- Ask for confirmation after EACH section
- Cover: architecture, components, data flow, validation, error handling
- Reference engineering principles where relevant

**Sections to Cover:**
1. **Architecture Overview** - Where does this fit in the CRM?
2. **Data Model** - Tables, relationships, Zod schemas
3. **Component Structure** - React components, React Admin integration
4. **Data Flow** - How data moves through unifiedDataProvider
5. **Validation Strategy** - Zod at API boundary (NOT in forms)
6. **Error Handling** - Fail-fast patterns (NO retry logic)
7. **Testing Approach** - Vitest units, Playwright E2E

**Confirmation Format:**
```
Does this [section] align with your vision?

1. **Yes, continue** - Move to next section
2. **Adjust [specific part]** - I'll revise
3. **Let's reconsider** - Go back to alternatives
```

### Phase 4: Documentation

**Goal:** Capture validated design for reference.

**Output Location:** `docs/designs/YYYY-MM-DD-<topic>-design.md`

**Template:**
```markdown
# [Feature Name] Design

**Date:** YYYY-MM-DD
**Status:** Validated

## Problem Statement
[What we're solving]

## Decision
[Chosen approach with rationale]

## Alternatives Considered
[Brief summary of rejected options]

## Design Details
[Architecture, data model, components]

## Engineering Principles Applied
- [ ] Fail-fast (no retry logic)
- [ ] Single source of truth (unifiedDataProvider)
- [ ] Zod at API boundary only
- [ ] interface for objects, type for unions

## Open Questions
[Any remaining unknowns]
```

**Note:** User manages git commits manually.

### Phase 5: Handoff to Implementation

**Goal:** Transition to /write-plan for detailed implementation planning.

**Prompt:**
```
Your design is validated and documented at:
`docs/designs/YYYY-MM-DD-<topic>-design.md`

Ready to create an implementation plan?

1. **Yes, run /write-plan** - I'll invoke the planning command
2. **Not yet** - Let's refine the design further
3. **I'll handle it** - You'll create the plan yourself
```

If they choose option 1, invoke: `/write-plan`

---

## MFB Domain Context

When brainstorming CRM features, consider these domain concepts:

| Term | Definition |
|------|------------|
| **Principal** | Food manufacturer MFB represents (9 total) |
| **Distributor** | Buys from principals, sells to operators (50+) |
| **Operator** | Restaurant/foodservice end customer |
| **Opportunity** | Deal in pipeline (one principal each) |
| **Authorization** | Distributor agrees to carry principal's products |

**User Personas:**
- **Account Managers** (6) - Primary users, need quick principal views
- **Manager** - Oversees all reps, needs reports
- **Admin** - Full access, user management

**Key Question:** "What is the ONE thing I have to do this week for each principal?" (answer in <2 seconds)

---

## Engineering Principles Checklist

Validate designs against these principles from `enforcing-principles`:

| Principle | Check |
|-----------|-------|
| **Fail-Fast** | No retry logic, circuit breakers, or graceful fallbacks |
| **Single Source of Truth** | All data through `unifiedDataProvider` |
| **Zod at Boundary** | Validation at API boundary only, not in forms |
| **Form Defaults** | Use `zodSchema.partial().parse({})` |
| **TypeScript** | `interface` for objects, `type` for unions |

**Red Flags to Challenge:**
- "What if the API is down?" → Let it fail, don't add resilience
- "Should we cache this?" → Only if explicitly required
- "Add retry logic" → No. Fail fast.

---

## Example Session

**User:** I'm thinking about adding a quick-log feature for activities

**Claude (Understanding):**
> Great idea! Quick activity logging is critical for the 10+ activities/week goal. Let me understand the scope:
>
> **Recommended: Option 1** - This matches the "under 30 seconds" MVP requirement
>
> 1. **Minimal fields** - Just type, principal, notes (fastest entry)
> 2. **Full form** - All activity fields in a modal
> 3. **Contextual** - Different forms based on where you are
> 4. Other
>
> Which approach fits best?

**User:** Option 1

**Claude (Exploration):**
> For minimal quick-log, here are 3-5 implementation approaches:
>
> **RECOMMENDED: Floating Action Button (FAB)**
> Best for "anywhere in the app" access that field reps need on tablets...
>
> [Presents 3-5 options with trade-offs]

---

## Related Skills

- **writing-plans** - Creates implementation plans (handoff destination)
- **enforcing-principles** - Engineering constitution for validation
- **ui-ux-design-principles** - Design system compliance
- **crispy-design-system** - Tailwind v4, iPad-first patterns
