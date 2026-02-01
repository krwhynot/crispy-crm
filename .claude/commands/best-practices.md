---
description: Research-validate plan tasks to +85% confidence via web research
argument-hint: [plan-file-path]
allowed-tools: Read, WebSearch, WebFetch
model: sonnet
---

## Input Resolution

**If file path provided:** @$1
**If no argument:** Use the most recent plan from conversation context.

If neither exists, stop and ask user to provide a plan.

---

## Task: Research-Backed Plan Validation

For each task in the plan, achieve **≥85% confidence** through documentation research.

### Confidence Scoring Formula

Each task receives a composite score:

| Component | Weight | Criteria |
|-----------|--------|----------|
| **Certainty** | 40% | Approach correctness based on official docs |
| **Evidence** | 35% | Number and quality of supporting sources |
| **Risk** | 25% | Likelihood of implementation issues |

**Score thresholds:**
- 85-100%: ✅ High confidence - proceed as planned
- 70-84%: ⚠️ Medium confidence - minor adjustments needed
- <70%: 🔴 Low confidence - requires remediation

---

## Research Protocol (Adaptive Depth)

### Simple Tasks (estimated <30 min)
- 1-2 web searches
- Verify approach against official docs
- Confirm no obvious anti-patterns

### Complex Tasks (estimated 30+ min, architectural, or unfamiliar patterns)
- 3-5 web searches across related topics
- Read full documentation pages for critical APIs via WebFetch
- Cross-reference multiple doc sections
- Check for breaking changes, deprecations, edge cases

### Research Queries Should Target:
- React 18 patterns (if UI-related)
- TypeScript strict mode compatibility
- Supabase best practices (if data-related)
- Zod validation patterns (if schema-related)
- TanStack Query patterns (if server state)
- Your stack: Vite, shadcn/ui, Zustand, React Router v7

---

## Output Format

Return the **original plan** with inline annotations:
```
## Task 1: [Original task name]
**Confidence: 92%** ✅
- Certainty: 95% - Official React docs confirm this pattern
- Evidence: 3 sources (react.dev, TanStack Query docs, your codebase patterns)
- Risk: 15% - Well-established pattern, low complexity

**Research Findings:**
- [Key insight from docs with source]
- [Relevant API/pattern confirmed]

---

## Task 2: [Original task name]  
**Confidence: 68%** 🔴
- Certainty: 70% - Approach valid but edge cases unclear
- Evidence: 1 source (incomplete documentation)
- Risk: 40% - Potential migration compatibility issues

**Research Findings:**
- [What was found]
- [Gap identified]

**Remediation Required:**
1. Research [specific topic] further before implementation
2. Consider alternative: [suggested approach with rationale]
3. Add spike task: [investigation needed]

---
```

## Remediation Rules

For any task scoring <85%:

1. **Identify the gap** - What's missing or uncertain?
2. **Provide specific action** - Concrete step to raise confidence
3. **Suggest alternatives** - If research reveals better patterns
4. **Flag dependencies** - Note if other tasks are affected

---

## Engineering Constitution Compliance Check

Verify each task aligns with:
- [ ] NO OVER-ENGINEERING - No unnecessary abstractions
- [ ] SINGLE SOURCE OF TRUTH - Supabase + Zod at boundary
- [ ] Validation in `src/atomic-crm/validation/` only
- [ ] Forms use admin layer (`src/components/admin/`)
- [ ] Semantic colors only (no hex codes)

Flag any violations as automatic confidence reduction (-20%).

---

## Final Summary

After annotating all tasks, provide:
```
## Plan Confidence Summary
- Total tasks: X
- High confidence (≥85%): X tasks
- Medium confidence (70-84%): X tasks  
- Low confidence (<70%): X tasks requiring remediation

**Overall Plan Readiness: [READY | NEEDS WORK | BLOCKED]**

**Critical Remediations:**
1. [Most important fix]
2. [Second priority]
```