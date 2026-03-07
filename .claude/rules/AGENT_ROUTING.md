---
description: Agent routing and delegation rules for subagent selection
globs: ["src/**", "supabase/**", ".claude/agents/**"]
---

# Agent Routing Overlay

Scope: subagent selection, write concurrency, multi-domain decomposition, spawn limits, and verification protocol.

## Applies

- `CORE-020`

## Agent Rules

<delegation>
Before selecting a subagent, classify the task:
- SQL/migration/RLS/query/index/view/trigger/schema -> db-specialist
- Scaffolding/boilerplate/conversion/generation/CRUD template -> quick-gen
- Architecture decision/tradeoff/blast radius/performance strategy -> architect
- Dead code/simplify/cleanup/reduce complexity (NO behavior change) -> simplifier
- Find/search/explore/trace/where is/how does -> explorer
- None of the above -> implementor (fallback only)

Overlap tiebreakers:
- RLS security AUDIT (read-only analysis) -> architect
- RLS policy CREATION (writing SQL) -> db-specialist
- Bug fix that changes behavior -> implementor (NOT simplifier)
- Scaffold that needs custom logic -> implementor (NOT quick-gen)
- "Explain this code" (no file search needed) -> direct (NO subagent)
</delegation>

<single_writer_rule>
At most ONE write-capable subagent may be active at a time.
Write-capable agents: db-specialist, quick-gen, simplifier, implementor.
Read-only agents: explorer, architect (can run in parallel with a writer).

If a task requires multiple write agents (e.g., DB migration + UI change),
run them SEQUENTIALLY, not in parallel. The first agent must complete and
return its handoff before the next agent starts.

File ownership: Each subagent owns the files it creates/modifies during
its execution. No other subagent may touch those files until the handoff
is returned to the main agent.
</single_writer_rule>

<multi_domain_split>
When a task spans multiple domains (DB + provider + UI + tests),
decompose in this order:

1. db-specialist — migrations, views, RLS policies
2. implementor — provider handlers, validation schemas, service layer
3. implementor — UI components, forms, styling
4. implementor — run verification (tsc, lint, tests)

Each step receives the previous step's handoff as context.
Do NOT parallelize cross-domain write steps.
Read-only agents (explorer, architect) may run in parallel at any point.
</multi_domain_split>

<spawn_caps>
Subagent spawn limits per task:
- Simple task (single file, <50 lines changed): 0 subagents. Work directly.
- Standard task (2-5 files, single domain): max 1 subagent.
- Complex task (5+ files or multi-domain): max 2 subagents sequentially.
- Justify in thinking before spawning >2 subagents for any task.

</spawn_caps>

<verification_protocol>
Before claiming any task is complete, the main agent (not a subagent) must:
1. Run `npx tsc --noEmit` — zero TypeScript errors
2. Run `npm run lint` — zero lint errors
3. Run relevant tests if they exist
4. Verify zero `any` types added: `rg ": any|as any" src/ --type ts | grep -v " \* \| \*/"`
5. Verify zero console statements added in production code

Subagents do NOT run final verification. They return their handoff,
and the main agent runs verification after all subagent work is integrated.
Exception: db-specialist should verify SQL syntax with a dry-run if possible.
</verification_protocol>

## Checklist IDs

- `AGT-001` (delegation)
- `AGT-002` (single writer rule)
- `AGT-003` (multi-domain split)
- `AGT-004` (spawn caps)
- `AGT-005` (verification protocol)
