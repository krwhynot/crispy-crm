# MCP Docker Gateway Setup

**Last Updated:** 2026-01-10
**Status:** Production Ready
**Tools Available:** 105+ via Gateway

---

## Architecture Overview

Crispy CRM uses a hybrid MCP architecture combining Docker MCP Gateway for centralized server management with direct HTTP endpoints and local servers for specific use cases.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Claude Code Session                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────┐ │
│  │ Docker MCP       │   │ HTTP Endpoints   │   │ Local Servers│ │
│  │ Gateway (7)      │   │ (4)              │   │ (4)          │ │
│  │                  │   │                  │   │              │ │
│  │ • context7       │   │ • Ref            │   │ • sequential │ │
│  │ • playwright     │   │ • supabase       │   │   -thinking  │ │
│  │ • perplexity-ask │   │ • vercel         │   │ • chrome-    │ │
│  │ • obsidian       │   │ • smithery-maps  │   │   devtools   │ │
│  │ • zen            │   │                  │   │ • serena     │ │
│  │ • exa            │   │                  │   │ • crispy-    │ │
│  │ • github-official│   │                  │   │   code-intel │ │
│  └────────┬─────────┘   └────────┬─────────┘   └──────┬───────┘ │
│           │                      │                     │         │
│           ▼                      ▼                     ▼         │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────┐ │
│  │ Docker Desktop   │   │ Remote APIs      │   │ npx/uvx      │ │
│  │ (Windows Host)   │   │                  │   │ (WSL2)       │ │
│  └──────────────────┘   └──────────────────┘   └──────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Docker MCP Gateway (Primary)

The Docker MCP Gateway manages 7 servers, providing 105+ tools through a single stdio connection.

### Gateway Configuration

Located in `~/.claude.json`:

```json
{
  "mcpServers": {
    "MCP_DOCKER": {
      "type": "stdio",
      "command": "docker",
      "args": ["mcp", "gateway", "run"]
    }
  }
}
```

### Enabled Servers

| Server | Status | Secret Status | Tools | Primary Use |
|--------|--------|---------------|-------|-------------|
| **context7** | ✅ Enabled | None required | 2 | Library documentation lookup |
| **playwright** | ✅ Enabled | None required | 20+ | Browser automation & testing |
| **perplexity-ask** | ✅ Enabled | ✓ Configured | 4 | Web search & research |
| **obsidian** | ✅ Enabled | ✓ Configured | 12+ | Notes & knowledge base |
| **zen** | ✅ Enabled | ◐ Partial | 15+ | Advanced reasoning & debugging |
| **exa** | ✅ Enabled | ✓ Configured | 1 | Web search (Exa AI) |
| **github-official** | ✅ Enabled | ✓ Configured | 30+ | GitHub operations |

### Server Details

#### context7
**Purpose:** Up-to-date library documentation retrieval

| Tool | Description |
|------|-------------|
| `resolve-library-id` | Resolve package name to Context7 library ID |
| `get-library-docs` | Fetch documentation for a library |

**Use Cases:**
- React Admin component docs
- Supabase SDK reference
- Tailwind CSS class lookup

---

#### playwright
**Purpose:** Browser automation and web page interaction

| Tool | Description |
|------|-------------|
| `browser_navigate` | Navigate to URL |
| `browser_snapshot` | Capture accessibility snapshot (preferred over screenshot) |
| `browser_click` | Click elements |
| `browser_type` | Type text into fields |
| `browser_fill_form` | Fill multiple form fields |
| `browser_take_screenshot` | Capture visual screenshot |
| `browser_evaluate` | Execute JavaScript |
| `browser_tabs` | Manage browser tabs |

**Notes:**
- Long-lived browser session across calls
- Use `browser_snapshot` for AI-readable page state
- Supports form automation for E2E testing

---

#### perplexity-ask
**Purpose:** AI-powered web search and research

| Tool | Description |
|------|-------------|
| `perplexity_ask` | Conversational web search |
| `perplexity_reason` | Reasoned analysis with web data |
| `perplexity_research` | Deep research with citations |
| `perplexity_search` | Direct search results |

**Secret Required:** `perplexity-ask.api_key`

---

#### obsidian
**Purpose:** Obsidian vault operations for knowledge management

| Tool | Description |
|------|-------------|
| `obsidian_read_note` | Read note content |
| `obsidian_update_note` | Create/update notes |
| `obsidian_list_notes` | List vault contents |
| `obsidian_global_search` | Search across vault |
| `obsidian_manage_frontmatter` | YAML frontmatter operations |
| `obsidian_manage_tags` | Tag management |
| `obsidian_get_periodic_note` | Get daily/weekly notes |

**Requirements:**
- Obsidian desktop with REST API plugin (Local API)
- Secret: `obsidian.api_key`

**Local API Endpoint:** `https://127.0.0.1:27124`

---

#### zen
**Purpose:** Advanced AI reasoning, debugging, and code analysis

| Tool | Description |
|------|-------------|
| `thinkdeep` | Multi-stage deep reasoning |
| `debug` | Structured debugging workflow |
| `codereview` | Systematic code review |
| `analyze` | Comprehensive code analysis |
| `planner` | Multi-step planning |
| `consensus` | Multi-model decision making |
| `precommit` | Pre-commit validation |
| `testgen` | Test generation |
| `refactor` | Refactoring analysis |
| `secaudit` | Security auditing |
| `tracer` | Code flow tracing |
| `chat` | Collaborative thinking |

**Secrets Configured:**
- ✅ `zen.openai_api_key`
- ✅ `zen.gemini_api_key`
- ❌ `zen.openrouter_api_key` (optional)
- ❌ `zen.xai_api_key` (optional)

**Note:** Functions with OpenAI + Gemini. Additional providers optional.

---

#### exa
**Purpose:** Exa AI web search

| Tool | Description |
|------|-------------|
| `web_search_exa` | Search with configurable results |

**Secret Required:** `exa.api_key`

---

#### github-official
**Purpose:** Full GitHub API operations

| Tool | Description |
|------|-------------|
| `create_repository` | Create repos |
| `create_pull_request` | Create PRs |
| `list_issues` / `issue_read` | Issue management |
| `search_code` | Code search across GitHub |
| `get_file_contents` | Read repo files |
| `push_files` | Push file changes |
| `list_commits` | Commit history |
| `merge_pull_request` | Merge PRs |

**Secret Required:** `github-official.token` (GitHub PAT)

---

## HTTP Endpoints (Direct)

These servers use HTTP protocol and don't need Docker containerization:

| Server | URL | Auth | Use |
|--------|-----|------|-----|
| **Ref** | `https://api.ref.tools/mcp` | API Key header | Doc search |
| **supabase** | `https://mcp.supabase.com/mcp?project_ref=...` | OAuth | DB operations |
| **vercel** | `https://mcp.vercel.com` | OAuth | Deployments |
| **smithery-ai-google-maps** | `https://server.smithery.ai/...` | None | Maps API |

### Configuration Location

`~/.claude.json` → `projects["/home/krwhynot/projects/crispy-crm"].mcpServers`

---

## Local Servers (npx/uvx)

These remain as local processes due to host system requirements:

### sequential-thinking
**Type:** npx
**Purpose:** Step-by-step reasoning chains
**Reason:** Not in Docker catalog

### chrome-devtools
**Type:** npx
**Purpose:** Chrome DevTools Protocol access
**Reason:** Requires host network (127.0.0.1:9222)

### serena
**Type:** uvx (GitHub)
**Purpose:** IDE assistant / project onboarding
**Reason:** Custom GitHub source, not in catalog

### crispy-code-intel
**Type:** Local TypeScript (project-specific)
**Purpose:** Semantic code search for Crispy CRM
**Config:** `.mcp.json`

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

---

## Secret Management

Docker MCP uses secure secret storage. Secrets are set once and persist.

### Setting Secrets (WSL2)

```bash
# Via PowerShell bridge (required for WSL2 + Docker Desktop)
powershell.exe -NoProfile -Command "docker mcp secret set perplexity-ask.api_key=YOUR_KEY"

# List configured secrets
powershell.exe -NoProfile -Command "docker mcp secret ls"
```

### Current Secret Status

```
Server              Secret                    Status
──────────────────────────────────────────────────────
perplexity-ask      api_key                   ✓ Set
obsidian            api_key                   ✓ Set
zen                 openai_api_key            ✓ Set
zen                 gemini_api_key            ✓ Set
zen                 openrouter_api_key        ○ Not set (optional)
zen                 xai_api_key               ○ Not set (optional)
exa                 api_key                   ✓ Set
github-official     token                     ✓ Set
```

---

## Management Commands

All Docker MCP commands must go through PowerShell in WSL2:

```bash
# List enabled servers
powershell.exe -NoProfile -Command "docker mcp server ls"

# Enable a new server
powershell.exe -NoProfile -Command "docker mcp server enable <name>"

# Disable a server
powershell.exe -NoProfile -Command "docker mcp server disable <name>"

# Search catalog
powershell.exe -NoProfile -Command "docker mcp catalog search <query>"

# Set a secret
powershell.exe -NoProfile -Command "docker mcp secret set <server>.<key>=<value>"

# View server details
powershell.exe -NoProfile -Command "docker mcp server inspect <name>"
```

---

## Token Efficiency

The Docker Gateway architecture provides significant context window savings:

| Before | After |
|--------|-------|
| 14+ individual MCP entries | 1 gateway + minimal HTTP entries |
| All tools loaded at startup | Tools loaded on-demand |
| ~40% context consumed | ~15% context consumed |

**Key Benefit:** Tools are available but don't consume tokens until invoked.

---

## Troubleshooting

### Gateway Not Responding

1. **Check Docker Desktop is running:**
   ```bash
   powershell.exe -NoProfile -Command "docker info"
   ```

2. **Restart the gateway:**
   ```bash
   powershell.exe -NoProfile -Command "docker mcp gateway restart"
   ```

### Server Not Available

1. **Verify it's enabled:**
   ```bash
   powershell.exe -NoProfile -Command "docker mcp server ls"
   ```

2. **Check for missing secrets:**
   ```bash
   powershell.exe -NoProfile -Command "docker mcp server inspect <name>"
   ```

### WSL2 Can't Reach Docker

This is expected - all `docker mcp` commands must use the PowerShell bridge:
```bash
# Wrong (won't work in WSL2)
docker mcp server ls

# Correct
powershell.exe -NoProfile -Command "docker mcp server ls"
```

---

## Migration History

**Date:** 2026-01-10
**From:** 14 individual MCP servers across multiple config files
**To:** 7 Docker-managed + 4 HTTP + 4 local

### What Changed
- Consolidated 7 servers under Docker Gateway
- Migrated API keys to Docker secret storage
- HTTP endpoints kept as-is (already optimal)
- Local servers kept for host-dependent functionality

### Fallback
Original configurations retained in `~/.claude.json` under `disabledMcpServers` for rollback if needed.

---

## Related Documentation

- [MCP Servers Overview](./mcp-servers.md) - General MCP configuration
- [Docker MCP CLI Documentation](https://docs.docker.com/mcp/)
- [Plan File](../.claude/plans/cozy-crafting-tower.md) - Original migration assessment

---

## Quick Reference Card

```
┌────────────────────────────────────────────────────────────────┐
│                    MCP QUICK REFERENCE                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DOCKER GATEWAY (7 servers, 105+ tools)                         │
│  ├── context7        → Library docs                             │
│  ├── playwright      → Browser automation                       │
│  ├── perplexity-ask  → Web search/research                      │
│  ├── obsidian        → Notes & knowledge                        │
│  ├── zen             → Advanced reasoning                       │
│  ├── exa             → Exa web search                           │
│  └── github-official → GitHub API                               │
│                                                                 │
│  HTTP ENDPOINTS (4)                                             │
│  ├── Ref             → Documentation search                     │
│  ├── supabase        → Database operations                      │
│  ├── vercel          → Deployments                              │
│  └── smithery-maps   → Google Maps                              │
│                                                                 │
│  LOCAL (4)                                                      │
│  ├── sequential-thinking → Chain reasoning                      │
│  ├── chrome-devtools     → DevTools protocol                    │
│  ├── serena              → IDE assistant                        │
│  └── crispy-code-intel   → Project code search                  │
│                                                                 │
│  COMMANDS (via PowerShell in WSL2):                             │
│  powershell.exe -NoProfile -Command "docker mcp server ls"      │
│  powershell.exe -NoProfile -Command "docker mcp secret set X=Y" │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```
