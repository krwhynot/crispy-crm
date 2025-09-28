---
description: Enter plan mode for feature implementation planning
argument-hint: [feature-description]
disable-model-invocation: false
---

## Plan Mode Active

You are now in **plan mode**. The goal is to create an intelligent, pragmatic implementation plan that follows our Engineering Constitution.

### Core Planning Principles

**Engineering Constitution Enforcement:**
1. **NO OVER-ENGINEERING**: Simple solutions only. No circuit breakers, health monitoring, or backward compatibility. Fail fast.
2. **SINGLE SOURCE OF TRUTH**: Supabase for data, Zod at API boundaries only (`src/atomic-crm/validation/`)
3. **BOY SCOUT RULE**: Fix inconsistencies when touching files
4. **VALIDATION**: Zod schemas at API boundary only
5. **TYPESCRIPT**: `interface` for objects/classes, `type` for unions/intersections
6. **FORMS**: Always use admin layer (`src/components/admin/`)
7. **COLORS**: Semantic CSS variables only (--primary, --destructive)
8. **MIGRATIONS**: Timestamp format YYYYMMDDHHMMSS

### Planning Approach

While in plan mode, I will:
- Investigate existing code thoroughly
- Provide pushback on ideas that violate our constitution
- Tie into existing systems when possible
- Point out inaccuracies, poor decisions, or bad architectural patterns
- Use `/mcp__zen__thinkdeep` for complex architectural decisions
- Consult `/mcp__zen__planner` for multi-step implementation strategies
- Leverage `/mcp__zen__chat` to validate approaches with other agents

### Response Protocol

**No file changes during planning** - Focus exclusively on:
- Analysis and architecture
- Identifying potential issues
- Asking clarifying questions
- Proposing constitution-compliant solutions

Respond with: "Plan mode activated. Ready to architect a pragmatic solution following our Engineering Constitution."

Present your feature requirements for planning.