---
description: Define a new feature with structured requirements gathering
argument-hint: [feature-description]
---

I want to define a new feature, eventually resulting in a `.docs/plans/[feature-name]/requirements.md` file. Your job is to ask me a series of questions to help clarify the requirements and implementation details. The feature is medium in scope (roughly 3-7 days of work), so we don't need exhaustive planning or edge-case coverage — just a solid, actionable requirements document.

At a high level, the feature is:

$ARGUMENTS

## Initial Context Gathering

Start by checking memory for similar features we've implemented before, then familiarize yourself with the feature. Use 1-3 agents in parallel to investigate:
- Agent 1: Check existing similar features and patterns in the codebase
- Agent 2: Review relevant database schemas and API endpoints  
- Agent 3 (if needed): Examine frontend components and user flows

## Focus Areas

Focus on:
- **User flow**: What the user sees, does, and expects at each step.
- **Technical implementation**: How we'll build it — including frontend, backend, data, and APIs as needed.
- **Assumptions and constraints**: Any important limits or context we should account for.

Keep in mind our Engineering Constitution:
- NO OVER-ENGINEERING - Keep it simple, fail fast
- SINGLE SOURCE OF TRUTH - Supabase for data
- VALIDATION - Zod schemas at API boundary only
- Follow our established patterns for forms, colors, and TypeScript conventions

## Question Process

Before diving into detailed questions, first confirm:
- Does this align with existing patterns in our codebase?
- Are there any similar features I should reference?
- What's the primary user problem we're solving?

Then, ask me questions to frame the goal, then go deeper into UX and technical details. When discussing implementation, I'll reference specific files and patterns from our codebase (like our admin layer at `src/components/admin/` for forms).

When it feels like we've covered enough to write a good requirements document, summarize what we have, and ask me if we're ready to write it.

## Important Rules

- Don't assume things I haven't told you — ask instead.
- Backwards compatibility is not a concern — breaking changes are okay
- Be efficient — don't over-plan.
- If I seem stuck, help me clarify by offering examples or tradeoffs.
- Be thorough in your research. It's okay to pause the questions to perform more research with an agent — it's better to be slow and informed than fast and wrong.

## Final Requirements Document Structure

The final requirements document should include:
1. **Feature Summary** (2-3 sentences)
2. **User Stories** (As a..., I want..., So that...)
3. **Technical Approach**
   - Frontend components needed
   - API endpoints (with Zod schemas)
   - Database changes (migration format: YYYYMMDDHHMMSS)
   - Data flow diagram (if helpful)
4. **UI/UX Flow** (step-by-step)
5. **Success Metrics** (how we'll know it works)
6. **Out of Scope** (what we're NOT doing)