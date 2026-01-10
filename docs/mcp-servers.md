# MCP Server Configuration Reference

**Last Updated:** 2026-01-09
**Purpose:** Documents all MCP servers used by Crispy CRM and their configuration sources.

---

## Overview

MCP (Model Context Protocol) servers extend Claude Code with specialized capabilities. This project uses multiple MCP servers configured at different levels:

| Level | File | Scope |
|-------|------|-------|
| **Project** | `.mcp.json` | Shared with team via git |
| **Project Settings** | `.claude/settings.local.json` | Local overrides |
| **User Global** | `~/.claude/settings.json` | User-wide servers |

---

## Project-Level Servers (`.mcp.json`)

These servers are defined in the project and available to all team members:

### crispy-code-intel

**Purpose:** Semantic code search and symbol lookup for Crispy CRM codebase.

```json
{
  "mcpServers": {
    "crispy-code-intel": {
      "command": "npx",
      "args": ["tsx", "scripts/mcp/server.ts"],
      "cwd": "/home/krwhynot/projects/crispy-crm"
    }
  }
}
```

**Tools Available:**
| Tool | Purpose |
|------|---------|
| `search_code` | Semantic + FTS hybrid search ("find form validation") |
| `go_to_definition` | Jump to symbol definition |
| `find_references` | Find all usages of a symbol |

**Requirements:**
- Docker (for semantic search via Ollama)
- Degrades to FTS-only if Docker unavailable

**Setup:** Run `just discover` to build search indexes.

---

## User-Level Servers (Global Config)

These servers are configured in user settings (`~/.claude/settings.json` or `~/.claude/mcp.json`) and must be set up individually by each developer.

### zen

**Purpose:** Advanced reasoning and debugging assistance.

**Tools Available:**
| Tool | Permission Pattern | Purpose |
|------|-------------------|---------|
| `mcp__zen__chat` | Allowed | Conversational reasoning |
| `mcp__zen__thinkdeep` | Allowed | Deep analysis mode |
| `mcp__zen__planner` | Allowed | Multi-step planning |
| `mcp__zen__debug` | Allowed | Structured debugging |

**Setup Required:** Install zen MCP server per Anthropic documentation.

---

### supabase

**Purpose:** Direct Supabase database operations and documentation.

**Tools Available:**
| Tool | Permission Pattern | Purpose |
|------|-------------------|---------|
| `mcp__supabase__execute_sql` | Allowed | Run SQL queries |
| `mcp__supabase__list_tables` | Allowed | List database tables |
| `mcp__supabase__get_advisors` | Allowed | Get Supabase advisors |
| `mcp__supabase__search_docs` | Allowed | Search Supabase docs |
| `mcp__supabase__apply_migration` | Allowed | Apply migrations |

**Setup Required:** Configure with Supabase project credentials.

---

### supabase-lite

**Purpose:** Lightweight Supabase operations (subset of full supabase server).

**Tools Available:**
| Tool | Permission Pattern | Purpose |
|------|-------------------|---------|
| `mcp__supabase-lite__list_tables` | Allowed | List database tables |
| `mcp__supabase-lite__execute_sql` | Allowed | Run SQL queries |

**Note:** Use this for quick queries; use full `supabase` server for migrations.

---

### perplexity-ask

**Purpose:** Web search and research via Perplexity AI.

**Tools Available:**
| Tool | Permission Pattern | Purpose |
|------|-------------------|---------|
| `mcp__perplexity-ask__perplexity_ask` | Allowed | Quick web search |
| `mcp__perplexity-ask__perplexity_reason` | Allowed | Reasoned web search |

**Setup Required:** Perplexity API key.

---

### sequential-thinking

**Purpose:** Step-by-step reasoning for complex problems.

**Tools Available:**
| Tool | Permission Pattern | Purpose |
|------|-------------------|---------|
| `mcp__sequential-thinking__sequentialthinking` | Allowed | Chain-of-thought reasoning |

---

### context7

**Purpose:** Library documentation lookup.

**Tools Available:**
| Tool | Permission Pattern | Purpose |
|------|-------------------|---------|
| `mcp__context7__resolve-library-id` | Allowed | Resolve library identifier |
| `mcp__context7__get-library-docs` | Allowed | Fetch library documentation |

**Use Case:** Quick lookup of React Admin, Supabase, Tailwind docs.

---

### serena

**Purpose:** Project onboarding and activation assistant.

**Tools Available:**
| Tool | Permission Pattern | Purpose |
|------|-------------------|---------|
| `mcp__serena__initial_instructions` | Allowed | Get initial instructions |
| `mcp__serena__check_onboarding_performed` | Allowed | Check onboarding status |
| `mcp__serena__activate_project` | Allowed | Activate project context |

---

### Ref

**Purpose:** Documentation search and URL reading.

**Tools Available:**
| Tool | Purpose |
|------|---------|
| `ref_search_documentation` | Search docs by query |
| `ref_read_url` | Read URL content as markdown |

**Note:** Built into Claude Code, not a separate MCP server.

---

## Enabled in Project Settings

The following servers are explicitly enabled in `.claude/settings.local.json`:

```json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["shadcn", "crispy-code-intel"]
}
```

### shadcn

**Purpose:** Shadcn/UI component documentation and patterns.

**Note:** Requires separate MCP server installation.

---

## Permission Patterns

MCP tool permissions follow this format in settings files:

```json
{
  "permissions": {
    "allow": [
      "mcp__server-name__tool-name",
      "mcp__crispy-code-intel__*"  // Wildcard for all tools
    ]
  }
}
```

---

## Troubleshooting

### Server Not Available

1. Check if server is installed: `claude mcp list`
2. Verify configuration in appropriate settings file
3. Check server logs for startup errors

### Permission Denied

1. Add permission to appropriate settings file
2. For project-wide: `.claude/settings.json`
3. For personal use: `~/.claude/settings.json` or `.claude/settings.local.json`

### Tool Not Working

1. Verify server is running: Check Claude Code status bar
2. Test with simple command first
3. Check hook guards aren't blocking (see `.claude/hooks/mcp-dependency-guard.sh`)

---

## Adding New MCP Servers

### For Team (Project-Level)

1. Add to `.mcp.json`:
   ```json
   {
     "mcpServers": {
       "new-server": {
         "command": "...",
         "args": ["..."]
       }
     }
   }
   ```

2. Add permissions to `.claude/settings.json`:
   ```json
   {
     "permissions": {
       "allow": ["mcp__new-server__*"]
     }
   }
   ```

3. Document in this file

### For Personal Use

1. Add to `~/.claude/settings.json` or `~/.claude/mcp.json`
2. Add permissions to `~/.claude/settings.json`

---

## Related Documentation

- [Claude Code MCP Documentation](https://docs.anthropic.com/claude-code/mcp)
- [Supabase MCP Setup](https://supabase.com/docs/guides/ai/mcp)
- Project hooks: `.claude/hooks/mcp-dependency-guard.sh`
