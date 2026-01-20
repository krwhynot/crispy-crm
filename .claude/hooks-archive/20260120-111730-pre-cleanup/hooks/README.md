# Claude Code Hooks Configuration

This directory contains project-specific hooks that execute automatically during Claude Code sessions.

## Active Hooks (14 total)

### UserPromptSubmit Hooks
Triggered when user submits a prompt, before Claude processes it.

| Hook | Purpose |
|------|---------|
| `skill-activation-prompt.sh` | Auto-activates skills based on prompt keywords |
| `mcp-choice-handler.sh` | Tracks user MCP enable/disable choices |
| `mcp-enablement-check.sh` | Warns if critical MCP servers are disabled |

### PreToolUse Hooks
Triggered before tool execution, can block operations.

| Matcher | Hook | Purpose |
|---------|------|---------|
| `mcp__` | `mcp-dependency-guard.sh` | Pauses MCP tools for confirmation |
| `Bash` | `verification-before-git.sh` | Blocks git commit/push without build/tsc |
| `Bash` | `supabase-cli-guard.ts` | Blocks invalid Supabase CLI commands |
| `Write\|Edit\|MultiEdit` | `file-protection.sh` | Blocks edits to .env, locks, credentials |
| `Write\|Edit\|MultiEdit` | `migration-guard.sh` | Warns when editing existing migrations |
| `BashOutput` | `bash-output-poll-guard.sh` | Detects stuck polling loops |

### PostToolUse Hooks
Triggered after tool execution completes.

| Matcher | Hook | Purpose |
|---------|------|---------|
| `Write\|Edit\|MultiEdit` | `file-track.sh` | Logs changes to ~/.claude/changes.log |
| `Write\|Edit\|MultiEdit` | `checkpoint-trigger.sh` | Triggers git checkpoints |
| `Write\|Edit\|MultiEdit` | `post-tool-use-tracker.sh` | Tracks files for TSC cache |
| `Write\|Edit\|MultiEdit` | `eslint-check.sh` | Runs ESLint (informational) |
| `BashOutput` | `bash-output-success-reset.sh` | Resets poll counter on output |

### SessionEnd Hooks
Triggered when Claude Code session ends.

| Hook | Purpose |
|------|---------|
| `cleanup-state.sh` | Deletes state files older than 7 days |

## State Directory

Hook state is stored in `.claude/hooks/state/`. Automatically cleaned on session end.

## Configuration

Hook configurations are in `.claude/settings.json`.

## Guard Hooks Summary

| Guard | Protects Against |
|-------|------------------|
| `file-protection.sh` | Editing .env, locks, credentials |
| `migration-guard.sh` | Editing existing migrations (advisory) |
| `verification-before-git.sh` | Git ops without build/tsc verification |
| `supabase-cli-guard.ts` | Invalid Supabase CLI commands |
| `mcp-dependency-guard.sh` | Unconfirmed MCP tool usage |
| `bash-output-poll-guard.sh` | Infinite polling loops |

---

*Last updated: December 27, 2025*
