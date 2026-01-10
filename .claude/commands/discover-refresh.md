---
description: Refresh stale discovery caches
allowed-tools: Bash
---

# Discovery Refresh Command

Check and refresh the code intelligence discovery caches.

## What is Discovery?

Discovery generates JSON inventories and search indexes for:
- Components and their roles
- Hooks and their dependencies
- Zod schemas and validation rules
- Type definitions
- Form configurations
- Call graphs

## Process

1. **Check staleness:**
   ```bash
   just discover-staleness
   ```

2. **If stale, choose refresh strategy:**
   - Minor changes → Incremental: `just discover-incr`
   - Major refactor → Full rebuild: `just discover`

3. **Verify MCP tools work:**
   ```bash
   just mcp-test
   ```

## Discovery Outputs

| Output | Location | Purpose |
|--------|----------|---------|
| JSON Inventories | `.claude/state/*.json` | Component metadata |
| SQLite FTS | `.claude/state/search.db` | Text search |
| LanceDB Vectors | `.claude/state/vectors.lance/` | Semantic search |

## When to Refresh

- After adding new components/hooks
- After major refactoring
- If MCP `search_code` returns stale results
- Pre-commit hook will auto-refresh if needed

## Rules

- Discovery is auto-staged by pre-commit hook
- Incremental is faster but may miss renames
- Full rebuild takes ~30 seconds
