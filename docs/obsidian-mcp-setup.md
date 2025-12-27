# Obsidian MCP Server Setup

This document describes how the Obsidian MCP server is configured for Claude Code in this project.

## Server Details

| Property | Value |
|----------|-------|
| **Package** | `obsidian-mcp-server` (cyanheads) |
| **Version** | 2.0.7 |
| **Repository** | https://github.com/cyanheads/obsidian-mcp-server |
| **Scope** | Local config (private to user in this project) |

## Prerequisites

1. **Obsidian** installed and running
2. **Local REST API plugin** enabled in Obsidian
   - Install from Obsidian Community Plugins
   - Plugin: [obsidian-local-rest-api](https://github.com/coddingtonbear/obsidian-local-rest-api)
3. **API Key** generated from the plugin settings

## Configuration

The server is configured via Claude Code's MCP system with these environment variables:

```json
{
  "command": "npx",
  "args": ["obsidian-mcp-server"],
  "env": {
    "OBSIDIAN_API_KEY": "<your-api-key>",
    "OBSIDIAN_BASE_URL": "https://127.0.0.1:27124",
    "OBSIDIAN_VERIFY_SSL": "false",
    "OBSIDIAN_ENABLE_CACHE": "true"
  }
}
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OBSIDIAN_API_KEY` | Yes | - | API key from Local REST API plugin settings |
| `OBSIDIAN_BASE_URL` | Yes | `http://127.0.0.1:27123` | Base URL of Obsidian's REST API |
| `OBSIDIAN_VERIFY_SSL` | No | `true` | Set `false` for self-signed certs (HTTPS) |
| `OBSIDIAN_ENABLE_CACHE` | No | `true` | Enable in-memory vault caching |
| `OBSIDIAN_CACHE_REFRESH_INTERVAL_MIN` | No | `10` | Cache refresh interval in minutes |

### Connection Options

**HTTPS (encrypted, recommended for security):**
```
OBSIDIAN_BASE_URL=https://127.0.0.1:27124
OBSIDIAN_VERIFY_SSL=false  # Required for self-signed cert
```

**HTTP (simpler, no SSL issues):**
```
OBSIDIAN_BASE_URL=http://127.0.0.1:27123
```

## Available Tools

The cyanheads server provides 8 specialized tools:

| Tool | Description |
|------|-------------|
| `obsidian_read_note` | Read note content and metadata |
| `obsidian_update_note` | Append, prepend, or overwrite note content |
| `obsidian_delete_note` | Permanently delete a note |
| `obsidian_search_replace` | Find and replace within a note |
| `obsidian_global_search` | Search entire vault (text or regex) |
| `obsidian_list_notes` | List notes and folders in a directory |
| `obsidian_manage_frontmatter` | Get/set/delete YAML frontmatter keys |
| `obsidian_manage_tags` | Add, remove, or list tags |

## Installation Commands

```bash
# Add the server to Claude Code
claude mcp add-json obsidian '{"command":"npx","args":["obsidian-mcp-server"],"env":{"OBSIDIAN_API_KEY":"YOUR_KEY","OBSIDIAN_BASE_URL":"https://127.0.0.1:27124","OBSIDIAN_VERIFY_SSL":"false","OBSIDIAN_ENABLE_CACHE":"true"}}' -s local

# Verify connection
claude mcp list | grep obsidian

# View configuration
claude mcp get obsidian

# Remove if needed
claude mcp remove obsidian -s local
```

## Troubleshooting

### Connection Failed

1. **Verify Obsidian is running** with the Local REST API plugin enabled
2. **Test the API directly:**
   ```bash
   curl -k https://127.0.0.1:27124
   # Should return: {"status": "OK", ...}
   ```
3. **Check environment variables** - use `OBSIDIAN_BASE_URL` not separate protocol/host/port

### SSL Certificate Issues

The Local REST API uses a self-signed certificate. Either:
- Set `OBSIDIAN_VERIFY_SSL=false` (current setup)
- Use HTTP endpoint: `OBSIDIAN_BASE_URL=http://127.0.0.1:27123`

### Slow Startup

The `npx` command downloads the package on first run. For faster startup:
```bash
npm install -g obsidian-mcp-server
```

## Features

- **Vault Caching**: In-memory cache improves search performance and provides fallback if API is slow
- **Case-insensitive paths**: File operations have path fallback for safety
- **Structured responses**: All tools return JSON with consistent error handling
- **Zod validation**: Input sanitization for security

---

*Last updated: 2025-12-26*
