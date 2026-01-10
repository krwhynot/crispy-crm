# Claude Code Configuration Matrix - Crispy CRM

> **Generated:** 2026-01-10
> **Project:** Crispy CRM (Atomic CRM)
> **Total Size:** ~590 MB across 500+ files

---

## Table of Contents

1. [Component Inventory Summary](#1-component-inventory-summary)
2. [Directory Structure](#2-directory-structure)
3. [Configuration Files](#3-configuration-files)
4. [Skills (19 Total)](#4-skills-19-total)
5. [Commands (26 Total)](#5-commands-26-total)
6. [Agents (8 Total)](#6-agents-8-total)
7. [Hooks (18 Total)](#7-hooks-18-total)
8. [MCP Servers & Plugins](#8-mcp-servers--plugins)
9. [State & Discovery Files](#9-state--discovery-files)
10. [Dependency Graph](#10-dependency-graph)
11. [Trigger Flow Diagram](#11-trigger-flow-diagram)
12. [Coverage Matrix](#12-coverage-matrix)
13. [Gap Analysis](#13-gap-analysis)

---

## 1. Component Inventory Summary

| Layer | Count | Location |
|-------|-------|----------|
| **Settings** | 3 files | Root + `~/.claude/` |
| **CLAUDE.md** | 2 files | Root + `~/.claude/` |
| **Skills** | 19 | `.claude/skills/` |
| **Commands** | 26 | `.claude/commands/` |
| **Agents** | 8 | `.claude/agents/` |
| **Hooks** | 18 scripts | `.claude/hooks/` |
| **MCP Servers** | 7+ | `.mcp.json` + settings |
| **Plugins** | 3 | Settings: typescript-lsp, ralph-wiggum, ralph-loop |
| **State Files** | 112 JSON + 3 DBs | `.claude/state/` |
| **TSC Cache** | 540+ sessions | `.claude/tsc-cache/` |

---

## 2. Directory Structure

```
.claude/                                 [~590 MB Total]
├── agents/                              [44 KB] Agent definitions
│   ├── code-finder.md
│   ├── color-fixer.md
│   ├── form-builder.md
│   ├── migration-validator.md
│   ├── rls-auditor.md
│   ├── schema-auditor.md
│   ├── task-implementor.md
│   └── test-fixer.md
│
├── commands/                            [316 KB] CLI slash commands
│   ├── brainstorm.md
│   ├── code-review.md
│   ├── commit.md
│   ├── crispy-note.md
│   ├── db-migrate.md
│   ├── discover-refresh.md
│   ├── execute-plan.md
│   ├── fix-lint.md
│   ├── pr.md
│   ├── quick-test.md
│   ├── rls-table.md
│   ├── sync-patterns.md
│   ├── troubleshooting.md
│   ├── write-plan.md
│   └── audit/                           [12 files]
│       ├── accessibility.md
│       ├── architecture.md
│       ├── code-quality.md
│       ├── data-integrity.md
│       ├── db-hardening.md
│       ├── error-handling.md
│       ├── full.md
│       ├── performance.md
│       ├── security.md
│       ├── stale-state.md
│       ├── typescript.md
│       └── workflow-gaps.md
│
├── docs/                                [24 KB] Configuration docs
│   ├── configuration-matrix.md          (this file)
│   ├── lsp-wildcard-setup.md
│   └── workflow-commands-guide.md
│
├── hooks/                               [1.1 MB] Lifecycle hooks
│   ├── bash-output-poll-guard.sh
│   ├── bash-output-success-reset.sh
│   ├── checkpoint-trigger.sh
│   ├── cleanup-state.sh
│   ├── eslint-check.sh
│   ├── file-protection.sh
│   ├── file-track.sh
│   ├── mcp-choice-handler.sh
│   ├── mcp-dependency-guard.sh
│   ├── mcp-enablement-check.sh
│   ├── migration-guard.sh
│   ├── post-tool-use-tracker.sh
│   ├── prefer-cli-tools.sh
│   ├── skill-activation-prompt.sh
│   ├── skill-activation-prompt.ts
│   ├── supabase-cli-guard.ts
│   ├── verification-before-git.sh
│   └── state/                           [106K+ files]
│       ├── build-{SESSION_ID}.verified
│       ├── types-{SESSION_ID}.verified
│       ├── mcp-choices-{session_id}.json
│       └── bash-polls-{shell_id}.count
│
├── ollama/                              [262 MB] Local LLM models
│   └── models/
│       ├── blobs/
│       └── manifests/
│
├── prompts/                             [160 KB] Generation templates
│   └── patterns-generation/
│
├── qdrant/                              [20 KB] Vector DB collections
│   ├── aliases/
│   └── collections/
│
├── rules/                               [8 KB] Engineering principles
│   └── PROVIDER_RULES.md
│
├── skills/                              [1.1 MB] 19 skill definitions
│   ├── skill-rules.json                  (57 KB - Master registry)
│   ├── comprehensive-tracing/
│   ├── crispy-data-provider/
│   ├── data-integrity-guards/
│   ├── deep-audit/
│   ├── discovery-first/
│   ├── enforcing-principles/            (22 resource files)
│   ├── executing-plans/
│   ├── fail-fast-debugging/
│   ├── root-cause-tracing/
│   ├── skill-developer/
│   ├── stuck-process-detection/
│   ├── supabase-cli/
│   ├── supabase-crm/
│   ├── technical-feedback/
│   ├── testing-patterns/
│   ├── troubleshooting/
│   ├── ui-ux-design-principles/
│   ├── verification-before-completion/
│   └── writing-plans/
│
├── state/                               [116 MB] Discovery caches
│   ├── manifest.json                     (67 KB)
│   ├── search.db                         (80 MB - FTS5)
│   ├── index.scip                        (27 MB - SCIP index)
│   ├── vectors.lance/                    (Lance vector DB)
│   ├── usage.log
│   ├── component-inventory/              (27 JSON files)
│   ├── hooks-inventory/                  (16 JSON files)
│   ├── schemas-inventory/                (25 JSON files)
│   ├── types-inventory/                  (10 JSON files)
│   ├── validation-services-inventory/    (31 JSON files)
│   ├── call-graph-inventory/             (30 JSON files)
│   ├── business-logic-discovery.json
│   ├── data-provider-discovery.json
│   ├── forms-inventory.json
│   ├── schema-discovery.json
│   └── test-discovery.json
│
├── tests/                               [12 KB] Testing utilities
├── troubleshooting/                     [52 KB] Debug guides
├── tsc-cache/                           [6.2 MB] TS compilation
│   └── {session-id}/
│       ├── affected-repos.txt
│       └── edited-files.log
│
├── settings.json                         (4 KB - Project hooks)
├── settings.local.json                   (1 KB - Local overrides)
├── checkpoint-state                      (64 B - Git checkpoint)
├── NOTES.md
└── PROGRESS.md
```

---

## 3. Configuration Files

### 3.1 Settings Hierarchy (Merged: Global → Project → Local)

| File | Scope | Primary Purpose |
|------|-------|-----------------|
| `~/.claude/settings.json` | Global | User permissions, global hooks, plugins |
| `.claude/settings.json` | Project | Project hooks, descriptions |
| `.claude/settings.local.json` | Local | MCP enablement, output style, extra permissions |

### 3.2 Global Settings (`~/.claude/settings.json`)

**Permissions (87 allow rules):**
- MCP tools: `mcp__zen__*`, `mcp__supabase__*`, `mcp__perplexity-ask__*`, `mcp__context7__*`
- Bash wildcards: `git`, `npm`, `npx`, `docker`, `rg`, `fd`, `bat`, `just`
- Skills: `Skill(crispy-design-system)`

**Hooks:**
| Event | Hook | Purpose |
|-------|------|---------|
| PreCompact | `compaction-tracker.sh` | Log compaction events |
| PostToolUse[TodoWrite] | `parallel_todo_spawner.py` | Suggest parallel agents |
| Stop | `church-bell.sh` | Audio notification |

**Plugins:**
- `typescript-lsp@claude-plugins-official`
- `ralph-wiggum@claude-plugins-official`
- `ralph-loop@claude-plugins-official`

### 3.3 Project Settings (`.claude/settings.json`)

**Hooks by Event:**

| Event | Matcher | Hook Script | Purpose |
|-------|---------|-------------|---------|
| **UserPromptSubmit** | `*` | `skill-activation-prompt.sh` | Auto-activate skills |
| | | `mcp-choice-handler.sh` | Track MCP preferences |
| | | `mcp-enablement-check.sh` | Warn if MCPs disabled |
| **PreToolUse** | `mcp__` | `mcp-dependency-guard.sh` | Confirm MCP usage |
| | `Bash` | `verification-before-git.sh` | Require build before git |
| | | `supabase-cli-guard.ts` | Validate Supabase commands |
| | | `prefer-cli-tools.sh` | Suggest rg/fd over grep/find |
| | `Write\|Edit\|MultiEdit` | `file-protection.sh` | Block .env, credentials |
| | | `migration-guard.sh` | Warn on existing migrations |
| | `BashOutput` | `bash-output-poll-guard.sh` | Detect infinite loops |
| **PostToolUse** | `Write\|Edit\|MultiEdit` | `file-track.sh` | Log changes |
| | | `checkpoint-trigger.sh` | Git checkpoints |
| | | `post-tool-use-tracker.sh` | TSC cache updates |
| | | `eslint-check.sh` | Lint feedback |
| | | `prettier` | Auto-format |
| | | `tsc --noEmit` | Type check |
| | `BashOutput` | `bash-output-success-reset.sh` | Reset poll counter |
| **SessionEnd** | `*` | `cleanup-state.sh` | Delete old state files |

### 3.4 Local Settings (`.claude/settings.local.json`)

```json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["shadcn", "crispy-code-intel"],
  "outputStyle": "Explanatory"
}
```

**Additional Permissions:**
- `mcp__crispy-code-intel__*` (all 3 tools)
- `mcp__serena__*` (project activation)
- `mcp__supabase__*` (migrations, advisors, search)
- `Bash(just:*)` (72 Justfile recipes)
- `Bash(npx vitest:*)`, `Bash(pnpm test:*)`

---

## 4. Skills (19 Total)

### 4.1 Core Enforcement Skills

| Skill | Triggers | Tools Used | References |
|-------|----------|------------|------------|
| **enforcing-principles** | implementing features, validation, forms, migrations | Zod, React Admin | (core - referenced by 6 skills) |
| **verification-before-completion** | done, complete, ship it, ready, commit, PR | Bash (build, tsc) | - |
| **fail-fast-debugging** | bug, error, debug, crash, exception, stack trace | mcp__zen__debug, TodoWrite | root-cause-tracing, verification |
| **data-integrity-guards** | validation, Zod, RLS, form defaults, security | ValidationService | enforcing-principles |
| **technical-feedback** | review, feedback, PR comments | - | engineering-constitution |

### 4.2 Architecture & Data Skills

| Skill | Triggers | Tools Used | References |
|-------|----------|------------|------------|
| **crispy-data-provider** | data handlers, unifiedDataProvider, CRUD | ValidationService, HttpError | - |
| **supabase-crm** | RLS policies, Edge Functions, migrations | PostgreSQL 17, Deno, pgTAP | supabase-cli, data-integrity |
| **supabase-cli** | supabase, migrations, db push/pull, gen types | Docker, psql, Deno | - |

### 4.3 Testing & UI Skills

| Skill | Triggers | Tools Used | References |
|-------|----------|------------|------------|
| **testing-patterns** | writing tests, TDD, test failures | Vitest, RTL, Playwright | verification, fail-fast |
| **ui-ux-design-principles** | designing UI, colors, accessibility, forms | - | enforcing-principles |

### 4.4 Discovery & Analysis Skills

| Skill | Triggers | Tools Used | References |
|-------|----------|------------|------------|
| **discovery-first** | component, hook, schema, inventory, list all | state/*.json | - |
| **comprehensive-tracing** | analyze, workflow, trace, deep dive | mcp__crispy-code-intel__* | enforcing, data-integrity |
| **root-cause-tracing** | debug, trace, call stack, bisect | mcp__zen__debug | enforcing, fail-fast |
| **stuck-process-detection** | background, poll, monitoring, long-running | KillShell | fail-fast, verification |

### 4.5 Process & Audit Skills

| Skill | Triggers | Tools Used | References |
|-------|----------|------------|------------|
| **writing-plans** | write-plan, implementation plan | mcp__zen__consensus, TodoWrite | enforcing, verification |
| **executing-plans** | execute-plan, run plan, implement | TodoWrite, mcp__zen__debug | verification, fail-fast |
| **deep-audit** | audit, codebase review, quality check | TodoWrite | enforcing, ui-ux |
| **troubleshooting** | build errors, performance, deployment | Vite, TypeScript, Docker | fail-fast, root-cause |
| **skill-developer** | creating skills, triggers, hooks | - | - |

### 4.6 Skill Dependency Network

```
                    enforcing-principles (CORE)
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
data-integrity     ui-ux-design      comprehensive-tracing
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
              supabase-crm, deep-audit, troubleshooting

              verification-before-completion
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
fail-fast-debugging  stuck-process   testing-patterns
        │            detection              │
        ▼                                   ▼
root-cause-tracing                  executing-plans
```

---

## 5. Commands (26 Total)

### 5.1 Core Workflow Commands

| Command | Description | Agents Spawned | Skills Used |
|---------|-------------|----------------|-------------|
| `/write-plan` | Create implementation plans | 7 specialists | writing-plans, enforcing |
| `/execute-plan` | Execute with checkpoints | 8 agents | executing-plans, verification |
| `/code-review` | Parallel review agents | 3 (Security, Arch, UI/UX) | data-integrity, ui-ux, enforcing |
| `/commit` | Stage, commit, push | - | verification |
| `/pr` | Create PR with test plan | - | - |

### 5.2 Development Commands

| Command | Description | Tools |
|---------|-------------|-------|
| `/quick-test [pattern]` | Run tests, auto-fix | Bash, Edit |
| `/fix-lint` | ESLint + Prettier + colors | Bash (just lint-fix) |
| `/db-migrate <name>` | Create + validate migration | Bash, Write |
| `/discover-refresh` | Refresh stale caches | Bash |
| `/troubleshooting` | RAPID debugging | mcp__zen__debug, mcp__supabase__* |

### 5.3 Utility Commands

| Command | Description |
|---------|-------------|
| `/brainstorm` | Socratic method refinement |
| `/crispy-note` | Save to Obsidian |
| `/sync-patterns` | Sync PATTERNS.md with code |
| `/rls-table` | RLS permissions matrix |

### 5.4 Audit Commands (12 Total)

| Command | Focus Area | MCP Tools |
|---------|------------|-----------|
| `/audit/full` | Orchestrates all 11 | All |
| `/audit/security` | RLS, validation, auth | mcp__supabase__* |
| `/audit/data-integrity` | Soft deletes, Strangler Fig | mcp__supabase__* |
| `/audit/error-handling` | Fail-fast violations | - |
| `/audit/accessibility` | ARIA, touch targets, colors | - |
| `/audit/typescript` | any types, strict mode | Bash (tsc) |
| `/audit/code-quality` | DRY, complexity, cohesion | - |
| `/audit/db-hardening` | Indexes, constraints | mcp__supabase__* |
| `/audit/stale-state` | Cache invalidation | - |
| `/audit/workflow-gaps` | Business logic holes | mcp__supabase__* |
| `/audit/architecture` | Feature structure, imports | - |
| `/audit/performance` | Re-renders, queries, bundle | mcp__supabase__get_advisors |

---

## 6. Agents (8 Total)

### 6.1 Agent Specifications

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| **code-finder** | Haiku | Read, Glob, Grep (read-only) | Fast code search |
| **task-implementor** | Haiku | All + mcp__ide__getDiagnostics | Execute plan tasks |
| **color-fixer** | Haiku | Read, Edit, Grep, Glob | Semantic color enforcement |
| **test-fixer** | Haiku | Read, Edit, Bash, Grep | Fix Vitest failures |
| **form-builder** | Sonnet | Read, Write, Glob, Grep | Scaffold CRUD forms |
| **migration-validator** | Sonnet | Read, Bash, Grep (read-only) | Validate migrations |
| **schema-auditor** | Sonnet | Read, Grep, Glob, Bash (read-only) | Schema consistency |
| **rls-auditor** | Sonnet | Read, Grep, Glob, Bash (read-only) | RLS security audit |

### 6.2 Agent Categories

```
┌─────────────────────────────────────────────────────┐
│              DATABASE SAFETY TRIAD                  │
│  (Read-Only - Audit/Report Only)                    │
├─────────────────────────────────────────────────────┤
│  migration-validator   schema-auditor   rls-auditor │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              DESIGN ENFORCEMENT                      │
│  (Write-Capable)                                    │
├─────────────────────────────────────────────────────┤
│     color-fixer            form-builder             │
│  (Tailwind v4 semantic)   (crispy-design-system)   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              CODE QUALITY                            │
├─────────────────────────────────────────────────────┤
│     code-finder           test-fixer                │
│  (Fast search, Haiku)   (Vitest patterns)          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              ORCHESTRATION                           │
├─────────────────────────────────────────────────────┤
│              task-implementor                        │
│  (Executes plan tasks with MCP diagnostics)        │
└─────────────────────────────────────────────────────┘
```

---

## 7. Hooks (18 Total)

### 7.1 Hook Inventory by Event

#### UserPromptSubmit (3 hooks)

| Hook | Script | Purpose | Can Block |
|------|--------|---------|-----------|
| Skill Activation | `skill-activation-prompt.sh` → `.ts` | Suggest relevant skills | No |
| MCP Choices | `mcp-choice-handler.sh` | Track enable/disable | No |
| MCP Check | `mcp-enablement-check.sh` | Warn if critical MCPs off | No |

#### PreToolUse (7 hooks)

| Matcher | Script | Purpose | Can Block |
|---------|--------|---------|-----------|
| `mcp__` | `mcp-dependency-guard.sh` | Confirm first MCP use | **Yes** |
| `Bash` | `verification-before-git.sh` | Require build/tsc before git | **Yes** |
| `Bash` | `supabase-cli-guard.ts` | Validate Supabase commands | **Yes** |
| `Bash` | `prefer-cli-tools.sh` | Suggest rg/fd over grep/find | Suggests |
| `Write\|Edit` | `file-protection.sh` | Block .env, credentials | **Yes** |
| `Write\|Edit` | `migration-guard.sh` | Warn on existing migrations | Advisory |
| `BashOutput` | `bash-output-poll-guard.sh` | Detect infinite loops | **Yes** |

#### PostToolUse (7 hooks)

| Matcher | Script | Purpose |
|---------|--------|---------|
| `Write\|Edit` | `file-track.sh` | Log to ~/.claude/changes.log |
| `Write\|Edit` | `checkpoint-trigger.sh` | Git auto-commit |
| `Write\|Edit` | `post-tool-use-tracker.sh` | TSC cache updates |
| `Write\|Edit` | `eslint-check.sh` | Lint feedback |
| `Edit\|Write` | `prettier` | Auto-format |
| `Edit\|Write` | `tsc --noEmit` | Type check feedback |
| `BashOutput` | `bash-output-success-reset.sh` | Reset poll counter |

#### SessionEnd (1 hook)

| Script | Purpose |
|--------|---------|
| `cleanup-state.sh` | Delete state files >7 days old |

### 7.2 Hook State Files

| Pattern | Created By | Consumed By | Purpose |
|---------|-----------|-------------|---------|
| `build-{SESSION_ID}.verified` | verification-before-git | verification-before-git | Build completed |
| `types-{SESSION_ID}.verified` | verification-before-git | verification-before-git | TSC completed |
| `mcp-choices-{session_id}.json` | mcp-choice-handler | mcp-dependency-guard | MCP preferences |
| `mcp-checked-{SESSION_ID}.done` | mcp-enablement-check | mcp-enablement-check | Warn once |
| `bash-polls-{shell_id}.count` | bash-output-poll-guard | bash-output-success-reset | Loop detection |

### 7.3 Hook Dependency Chain

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP GUARD CHAIN                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User prompt → mcp-choice-handler.sh                            │
│                      │                                          │
│                      ▼                                          │
│              mcp-choices-{session}.json  (STATE)                │
│                      │                                          │
│                      ▼                                          │
│  MCP tool call → mcp-dependency-guard.sh                        │
│                      │                                          │
│           ┌──────────┴──────────┐                               │
│           ▼                     ▼                               │
│     First time?            Already confirmed?                   │
│         │                       │                               │
│         ▼                       ▼                               │
│     BLOCK (ask)              ALLOW                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  GIT VERIFICATION CHAIN                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  npm run build → verification-before-git.sh                     │
│                      │                                          │
│                      ▼                                          │
│              build-{SESSION}.verified  (STATE)                  │
│                                                                 │
│  npx tsc --noEmit → verification-before-git.sh                  │
│                      │                                          │
│                      ▼                                          │
│              types-{SESSION}.verified  (STATE)                  │
│                                                                 │
│  git commit → verification-before-git.sh                        │
│                      │                                          │
│           ┌──────────┴──────────┐                               │
│           ▼                     ▼                               │
│     Both verified?        Missing markers?                      │
│         │                       │                               │
│         ▼                       ▼                               │
│       ALLOW               BLOCK (run build first)               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  POLLING GUARD CHAIN                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BashOutput (empty) → bash-output-poll-guard.sh                 │
│                      │                                          │
│                      ▼                                          │
│         Increment bash-polls-{shell}.count                      │
│                      │                                          │
│           ┌──────────┴──────────┐                               │
│           ▼                     ▼                               │
│     < 5 polls?            >= 5 polls?                           │
│         │                       │                               │
│         ▼                       ▼                               │
│       ALLOW            BLOCK (suggest KillShell)                │
│                                                                 │
│  BashOutput (content) → bash-output-success-reset.sh            │
│                      │                                          │
│                      ▼                                          │
│         DELETE bash-polls-{shell}.count                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. MCP Servers & Plugins

### 8.1 MCP Servers

| Server | Tools | Purpose |
|--------|-------|---------|
| **crispy-code-intel** | `search_code`, `go_to_definition`, `find_references` | Code intelligence (local) |
| **zen** | `debug`, `thinkdeep`, `planner`, `chat`, `consensus` | Structured reasoning |
| **supabase** | `execute_sql`, `list_tables`, `get_advisors`, `search_docs`, `apply_migration` | Database operations |
| **perplexity-ask** | `perplexity_ask`, `perplexity_reason` | Web research |
| **serena** | `initial_instructions`, `activate_project`, `find_symbol`, `search_for_pattern` | Project management |
| **context7** | `resolve-library-id`, `get-library-docs` | Documentation lookup |
| **sequential-thinking** | `sequentialthinking` | Step-by-step reasoning |
| **shadcn** | (UI component generation) | Component scaffolding |

### 8.2 Plugins

| Plugin | Purpose |
|--------|---------|
| `typescript-lsp@claude-plugins-official` | Language Server integration |
| `ralph-wiggum@claude-plugins-official` | (Ralph personality) |
| `ralph-loop@claude-plugins-official` | (Ralph loop mode) |

---

## 9. State & Discovery Files

### 9.1 Discovery Databases

| File | Size | Purpose | Updated By |
|------|------|---------|------------|
| `search.db` | 80 MB | FTS5 full-text search | `just discover` |
| `index.scip` | 27 MB | SCIP semantic index | TypeScript LSP |
| `vectors.lance/` | Variable | Semantic embeddings | `just discover` |
| `manifest.json` | 67 KB | File hashes for staleness | `just discover` |

### 9.2 Inventory JSON Files (112 Total)

| Category | Count | Key Files |
|----------|-------|-----------|
| **component-inventory/** | 27 | `contacts.json` (40KB), `opportunities.json` (69KB) |
| **hooks-inventory/** | 16 | React hooks catalog |
| **schemas-inventory/** | 25 | Zod schemas with field definitions |
| **types-inventory/** | 10 | TypeScript interfaces |
| **validation-services-inventory/** | 31 | Validation method signatures |
| **call-graph-inventory/** | 30 | Function/component dependencies |

### 9.3 Analysis Files

| File | Purpose |
|------|---------|
| `business-logic-discovery.json` | RPC functions, Edge Functions |
| `data-provider-discovery.json` | Supabase handlers, CRUD patterns |
| `forms-inventory.json` | React form metadata |
| `schema-discovery.json` | Database schema snapshot |
| `test-discovery.json` | Test file inventory |

### 9.4 TSC Cache Structure

```
tsc-cache/
└── {session-id}/
    ├── affected-repos.txt      # Which repos modified
    └── edited-files.log        # Timestamp:filepath:repo
```

**Purpose:** Track file changes for incremental TypeScript checking

---

## 10. Dependency Graph

### 10.1 Command → Agent → Skill → MCP Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMMAND DEPENDENCIES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  /write-plan ─────────────────┬── Skills: writing-plans, enforcing-principles│
│       │                       │                                             │
│       └──► Agents: schema-agent, component-agent, provider-agent,           │
│            test-agent, migration-agent, style-agent, general-agent          │
│       └──► MCP: mcp__zen__consensus, mcp__zen__thinkdeep, mcp__zen__chat    │
│                                                                             │
│  /execute-plan ───────────────┬── Skills: executing-plans, verification     │
│       │                       │                                             │
│       └──► Agents: test-fixer, form-builder, migration-validator,           │
│            rls-auditor, schema-auditor, color-fixer, code-finder,           │
│            task-implementor                                                 │
│       └──► MCP: mcp__zen__debug, mcp__zen__thinkdeep                        │
│                                                                             │
│  /code-review ────────────────┬── Skills: data-integrity-guards,            │
│       │                       │   ui-ux-design-principles, enforcing        │
│       └──► Agents: Security Agent, Architecture Agent, UI/UX Agent          │
│       └──► MCP: mcp__zen__debug, mcp__zen__thinkdeep, mcp__serena__*        │
│                                                                             │
│  /troubleshooting ────────────┬── Skills: fail-fast-debugging               │
│       │                       │                                             │
│       └──► MCP: mcp__zen__debug, mcp__supabase__*, mcp__serena__*           │
│                                                                             │
│  /audit/full ─────────────────┬── Runs 11 audit commands in parallel        │
│       │                       │                                             │
│       └──► Spawns: /audit/{security,data-integrity,error-handling,         │
│            db-hardening,stale-state,workflow-gaps,architecture,             │
│            typescript,accessibility,performance,code-quality}               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Hook → Script → State Flow

```
settings.json (master config)
├── UserPromptSubmit hooks
│   ├── skill-activation-prompt.sh → skill-activation-prompt.ts
│   │                                  └─► skill-rules.json
│   ├── mcp-choice-handler.sh ────────► mcp-choices-{session}.json
│   └── mcp-enablement-check.sh ──────► mcp-checked-{SESSION}.done
│
├── PreToolUse hooks
│   ├── verification-before-git.sh ──► build-*.verified, types-*.verified
│   ├── supabase-cli-guard.ts ───────► supabase/config.toml
│   ├── file-protection.sh ──────────► (patterns only)
│   ├── migration-guard.sh ──────────► (patterns only)
│   ├── mcp-dependency-guard.sh ─────► mcp-choices-{session}.json
│   └── bash-output-poll-guard.sh ───► bash-polls-{shell}.count
│
├── PostToolUse hooks
│   ├── file-track.sh ───────────────► ~/.claude/changes.log
│   ├── checkpoint-trigger.sh ───────► ~/.claude/checkpoint-manager.sh
│   ├── post-tool-use-tracker.sh ────► tsc-cache/{session}/
│   └── bash-output-success-reset.sh ► bash-polls-{shell}.count (delete)
│
└── SessionEnd hooks
    └── cleanup-state.sh ────────────► state/* (delete >7 days)
```

---

## 11. Trigger Flow Diagram

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          LIFECYCLE EVENT FLOW                                  ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  SESSION START                                                                ║
║       │                                                                       ║
║       ▼                                                                       ║
║  ┌─────────────────────────────────────────────────────────────────────┐     ║
║  │ • typescript-lsp, ralph-wiggum, ralph-loop plugins activate         │     ║
║  │ • MCP servers start (crispy-code-intel, supabase, zen, etc.)        │     ║
║  │ • CLAUDE.md files load (global + project)                           │     ║
║  │ • Settings merge (global → project → local)                         │     ║
║  └─────────────────────────────────────────────────────────────────────┘     ║
║       │                                                                       ║
║       ▼                                                                       ║
║  USER PROMPT SUBMITTED                                                        ║
║       │                                                                       ║
║       ▼                                                                       ║
║  ┌─────────────────────────────────────────────────────────────────────┐     ║
║  │ UserPromptSubmit Hooks:                                             │     ║
║  │  1. skill-activation-prompt.sh    → Suggest relevant skills         │     ║
║  │  2. mcp-choice-handler.sh         → Track MCP preferences           │     ║
║  │  3. mcp-enablement-check.sh       → Warn if critical MCPs off       │     ║
║  └─────────────────────────────────────────────────────────────────────┘     ║
║       │                                                                       ║
║       ▼                                                                       ║
║  TOOL CALL (e.g., Write, Bash, mcp__)                                         ║
║       │                                                                       ║
║       ▼                                                                       ║
║  ┌─────────────────────────────────────────────────────────────────────┐     ║
║  │ PreToolUse Hooks (CAN BLOCK):                                       │     ║
║  │                                                                     │     ║
║  │  [mcp__*] ────► mcp-dependency-guard.sh                             │     ║
║  │                 Validates MCP dependencies before calls             │     ║
║  │                                                                     │     ║
║  │  [Bash] ──────► verification-before-git.sh                          │     ║
║  │                 Blocks git commit/push without test verification    │     ║
║  │           ────► supabase-cli-guard.ts                               │     ║
║  │                 Validates Supabase CLI commands                     │     ║
║  │           ────► prefer-cli-tools.sh                                 │     ║
║  │                 Suggests fd/rg/bat over find/grep/cat               │     ║
║  │                                                                     │     ║
║  │  [Write|Edit|MultiEdit] ──► file-protection.sh                      │     ║
║  │                              Protects critical files                │     ║
║  │                         ──► migration-guard.sh                      │     ║
║  │                              Warns on migration changes             │     ║
║  │                                                                     │     ║
║  │  [BashOutput] ──► bash-output-poll-guard.sh                         │     ║
║  │                   Prevents infinite polling loops                   │     ║
║  └─────────────────────────────────────────────────────────────────────┘     ║
║       │                                                                       ║
║       ▼                                                                       ║
║  [TOOL EXECUTES]                                                              ║
║       │                                                                       ║
║       ▼                                                                       ║
║  ┌─────────────────────────────────────────────────────────────────────┐     ║
║  │ PostToolUse Hooks (FEEDBACK ONLY):                                  │     ║
║  │                                                                     │     ║
║  │  [Write|Edit|MultiEdit] ──► file-track.sh                           │     ║
║  │                              Tracks modified files                  │     ║
║  │                         ──► checkpoint-trigger.sh                   │     ║
║  │                              Creates git checkpoints                │     ║
║  │                         ──► post-tool-use-tracker.sh                │     ║
║  │                              Updates TSC cache                      │     ║
║  │                         ──► eslint-check.sh                         │     ║
║  │                              Reports lint issues                    │     ║
║  │                         ──► prettier (format)                       │     ║
║  │                         ──► tsc --noEmit (type check)               │     ║
║  │                                                                     │     ║
║  │  [BashOutput] ──► bash-output-success-reset.sh                      │     ║
║  │                   Resets poll counter on success                    │     ║
║  │                                                                     │     ║
║  │  [TodoWrite] ──► parallel_todo_spawner.py (GLOBAL)                  │     ║
║  │                  Suggests parallel agent execution                  │     ║
║  └─────────────────────────────────────────────────────────────────────┘     ║
║       │                                                                       ║
║       ▼                                                                       ║
║  PRE-COMPACT (before context compaction)                                      ║
║       │                                                                       ║
║       ▼                                                                       ║
║  ┌─────────────────────────────────────────────────────────────────────┐     ║
║  │  compaction-tracker.sh (GLOBAL)                                     │     ║
║  │  Logs compaction events for analytics                               │     ║
║  └─────────────────────────────────────────────────────────────────────┘     ║
║       │                                                                       ║
║       ▼                                                                       ║
║  STOP (agent finishes)                                                        ║
║       │                                                                       ║
║       ▼                                                                       ║
║  ┌─────────────────────────────────────────────────────────────────────┐     ║
║  │  church-bell.sh (GLOBAL)                                            │     ║
║  │  Audio notification on completion                                   │     ║
║  └─────────────────────────────────────────────────────────────────────┘     ║
║       │                                                                       ║
║       ▼                                                                       ║
║  SESSION END                                                                  ║
║       │                                                                       ║
║       ▼                                                                       ║
║  ┌─────────────────────────────────────────────────────────────────────┐     ║
║  │  cleanup-state.sh                                                   │     ║
║  │  Cleans up temporary state files (>7 days)                          │     ║
║  └─────────────────────────────────────────────────────────────────────┘     ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 12. Coverage Matrix

### 12.1 Workflow Automation Coverage

| Workflow | Command | Agent | Skill | Hook | Status |
|----------|---------|-------|-------|------|--------|
| **File Changes → Lint** | /fix-lint | - | - | eslint-check.sh | Auto |
| **File Changes → Format** | - | - | - | prettier | Auto |
| **File Changes → Type Check** | - | - | - | tsc --noEmit | Auto |
| **File Changes → Checkpoint** | - | - | - | checkpoint-trigger.sh | Auto |
| **Code Review** | /code-review | 3 parallel | 4 skills | - | Manual |
| **Test Failures → Fix** | /quick-test | test-fixer | testing-patterns | - | Manual |
| **Migration Validation** | /db-migrate | migration-validator | supabase-cli | migration-guard | Guarded |
| **RLS Audit** | /rls-table | rls-auditor | supabase-crm | - | Manual |
| **Schema Consistency** | - | schema-auditor | - | - | Partial |
| **Semantic Colors** | /fix-lint | color-fixer | crispy-design-system | - | Manual |
| **Form Scaffolding** | - | form-builder | crispy-data-provider | - | Manual |
| **Planning** | /write-plan | 7 specialists | writing-plans | - | Manual |
| **Plan Execution** | /execute-plan | 8 agents | executing-plans | - | Manual |
| **Git Commit** | /commit | - | verification | verification-before-git | Guarded |
| **PR Creation** | /pr | - | - | - | Manual |
| **Full Audit** | /audit/full | 11 parallel | deep-audit | - | Manual |

### 12.2 Tool Event Coverage

| Tool | PreToolUse Hook | PostToolUse Hook | Gap |
|------|-----------------|------------------|-----|
| **Write** | file-protection, migration-guard | 5 hooks | None |
| **Edit** | file-protection, migration-guard | 5 hooks | None |
| **MultiEdit** | file-protection, migration-guard | 4 hooks | None |
| **Bash** | verification-before-git, supabase-cli-guard, prefer-cli-tools | - | No post-validation |
| **BashOutput** | bash-output-poll-guard | bash-output-success-reset | None |
| **mcp__*** | mcp-dependency-guard | - | No post-tracking |
| **Read** | - | - | By design |
| **Glob/Grep** | - | - | By design |
| **TodoWrite** | - | parallel_todo_spawner (global) | None |
| **Task** | - | - | No subagent tracking |

### 12.3 Quality Gate Coverage

| Gate | Enforcement Point | Can Block | Status |
|------|-------------------|-----------|--------|
| **File Protection** | PreToolUse[Write\|Edit] | Yes | Active |
| **Migration Safety** | PreToolUse[Write\|Edit] | Advisory | Active |
| **Git Verification** | PreToolUse[Bash] | Yes | Active |
| **Supabase CLI** | PreToolUse[Bash] | Yes | Active |
| **CLI Tool Preference** | PreToolUse[Bash] | Suggests | Active |
| **MCP Dependencies** | PreToolUse[mcp__] | Yes | Active |
| **Poll Loop Prevention** | PreToolUse[BashOutput] | Yes | Active |
| **Skill Activation** | UserPromptSubmit | Suggests | Active |

---

## 13. Gap Analysis

### 13.1 Critical Gaps

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| **No SubagentStop hook** | Subagent work isn't validated | Add hook to verify subagent outputs |
| **No Bash PostToolUse** | Command failures not tracked | Add error logging hook |
| **No mcp__ PostToolUse** | MCP call results not tracked | Add success/failure tracking |

### 13.2 Improvement Opportunities

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| **schema-auditor lacks command** | Must invoke via agent | Create /schema-audit command |
| **No SessionStart hooks** | Context not pre-loaded | Add hook to warm up discovery cache |
| **Task tool has no hooks** | Subagent spawning untracked | Add pre/post hooks for analytics |
| **Some skills lack command mappings** | root-cause-tracing, stuck-process-detection | Create convenience commands |

### 13.3 Strengths

| Strength | Components |
|----------|------------|
| **Comprehensive file change automation** | 5 PostToolUse hooks for Write/Edit |
| **Strong database safety** | 3 specialized agents + migration-guard hook |
| **Parallel execution support** | parallel_todo_spawner + /audit/full batching |
| **Deep skill interconnection** | enforcing-principles referenced by 6 skills |
| **MCP tool richness** | zen, supabase, crispy-code-intel, serena |

---

## Verification Checklist

- [x] All referenced components exist (verified via Glob)
- [x] Hook scripts exist in `.claude/hooks/` (verified via settings.json paths)
- [x] No circular dependencies (skills reference each other safely)
- [x] No conflicting matchers on same event (each matcher is distinct)
- [x] MCP tool names match configured servers
- [x] State files are cleaned up via SessionEnd hook

---

## Quick Reference

### Most Used Commands
```bash
/quick-test [pattern]     # Run tests + auto-fix
/commit [-p]              # Conventional commit
/fix-lint                 # ESLint + Prettier + colors
/audit/full               # Run all 11 audits
/write-plan               # Create implementation plan
```

### Most Connected Skill
`enforcing-principles` (6 dependents)

### Most Comprehensive Hooks
`Write|Edit` (5 PostToolUse + 2 PreToolUse)

### Total Configuration Size
~590 MB across 500+ files

---

*Last updated: 2026-01-10*
