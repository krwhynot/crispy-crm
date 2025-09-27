# Claude Code Hooks Setup Guide (CORRECTED)

This guide provides the **correct** setup for file tracking and git checkpoint hooks in Claude Code.

## Critical Corrections from Previous Version

The previous guide had several fundamental errors:
1. **Wrong JSON schema** - Used array format instead of event-keyed object format
2. **Incorrect payload handling** - Didn't read stdin JSON properly
3. **Path mismatches** - Mixed project-local and user-global paths incorrectly
4. **Bad matcher syntax** - Used unsupported object format

## Overview

This hook system provides:
- **File tracking**: Logs all file operations to `~/.claude/changes.log`
- **Automatic git checkpoints**: Creates git savepoints after batches of changes
- **Project-local state**: Maintains checkpoint state within each project

## Complete Setup Instructions

### Step 1: Create Project Hook Scripts

Create the hook scripts directory in your project:

```bash
mkdir -p .claude/hooks
```

#### Create `.claude/hooks/file-track.sh`:

```bash
cat > .claude/hooks/file-track.sh << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

# Read JSON payload from stdin
payload="$(cat)"

# Parse files from payload using jq
if command -v jq >/dev/null 2>&1; then
  # Extract file_path or file_paths from tool_input
  mapfile -t files < <(echo "$payload" | jq -r '
    [
      .tool_input.file_path // empty,
      (.tool_input.file_paths // [])[]
    ] | .[]
  ' 2>/dev/null || true)
else
  # Fallback: try basic grep if jq not available
  files=()
  if file=$(echo "$payload" | grep -oP '"file_path"\s*:\s*"[^"]+' | cut -d'"' -f4); then
    files+=("$file")
  fi
fi

# Log configuration
log="${HOME}/.claude/changes.log"
mkdir -p "${HOME}/.claude"

# Log each file operation
ts="$(date '+%Y-%m-%d %H:%M:%S')"
host="$(hostname -s 2>/dev/null || echo 'host')"
user="${USER:-user}"
tool="${CLAUDE_TOOL_NAME:-unknown}"

for f in "${files[@]}"; do
  if [ -n "$f" ]; then
    # Determine file size
    full_path="$f"
    if [ ! -e "$full_path" ] && [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
      full_path="${CLAUDE_PROJECT_DIR}/$f"
    fi

    if [ -e "$full_path" ]; then
      size="$(stat -c '%s' "$full_path" 2>/dev/null || stat -f '%z' "$full_path" 2>/dev/null || echo '0')"
      action="MODIFY"
    else
      size="new"
      action="CREATE"
    fi

    echo "[$ts] [$user@$host] [$action:$tool] $f (${size} bytes)" >> "$log"
  fi
done
EOF

chmod +x .claude/hooks/file-track.sh
```

#### Create `.claude/hooks/checkpoint-trigger.sh`:

```bash
cat > .claude/hooks/checkpoint-trigger.sh << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

# Read JSON payload from stdin
payload="$(cat)"

# Parse files from payload
if command -v jq >/dev/null 2>&1; then
  mapfile -t files < <(echo "$payload" | jq -r '
    [
      .tool_input.file_path // empty,
      (.tool_input.file_paths // [])[]
    ] | .[]
  ' 2>/dev/null || true)
else
  files=("dummy")  # Ensure at least one trigger if jq unavailable
fi

# Ensure checkpoint manager exists
if [ ! -x "${HOME}/.claude/checkpoint-manager.sh" ]; then
  exit 0
fi

# Trigger checkpoint for each file (runs in project directory)
proj="${CLAUDE_PROJECT_DIR:-$(pwd)}"
for _ in "${files[@]}"; do
  (
    cd "$proj" 2>/dev/null || exit 0
    "${HOME}/.claude/checkpoint-manager.sh" trigger >/dev/null 2>&1
  ) &
done
wait 2>/dev/null || true
EOF

chmod +x .claude/hooks/checkpoint-trigger.sh
```

#### Create `.claude/hooks/test-hook.sh` (for verification):

```bash
cat > .claude/hooks/test-hook.sh << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

# Simple test hook to verify hooks are working
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Hook triggered: ${CLAUDE_HOOK_EVENT:-unknown}" >> "${CLAUDE_PROJECT_DIR}/.claude/hooks.log"

# Log the payload for debugging
if [ "${DEBUG_HOOKS:-0}" = "1" ]; then
  payload="$(cat)"
  echo "Payload: $payload" >> "${CLAUDE_PROJECT_DIR}/.claude/hooks.log"
fi
EOF

chmod +x .claude/hooks/test-hook.sh
```

### Step 2: Create Project Settings File

Create `.claude/settings.json` with the **correct schema**:

```bash
cat > .claude/settings.json << 'EOF'
{
  "description": "Project hooks for file tracking and git checkpoints",
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/file-track.sh",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/checkpoint-trigger.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/test-hook.sh",
            "timeout": 2
          }
        ]
      }
    ]
  }
}
EOF
```

### Step 3: Install Global Checkpoint Manager

Create the checkpoint manager in your home directory:

```bash
# Create directory
mkdir -p ~/.claude

# Create the checkpoint manager script
cat > ~/.claude/checkpoint-manager.sh << 'EOF'
#!/bin/bash
# Git Checkpoint Manager for Claude Code
# Creates git savepoints without polluting commit history

# Configuration (can be overridden by environment variables)
CHECKPOINT_DIR="${CHECKPOINT_DIR:-.claude/checkpoints}"
STATE_FILE="${STATE_FILE:-.claude/checkpoint-state}"
CHECKPOINT_PREFIX="${CHECKPOINT_PREFIX:-checkpoint}"
BATCH_FILE_COUNT="${BATCH_FILE_COUNT:-5}"
BATCH_TIME_SECONDS="${BATCH_TIME_SECONDS:-300}"
CLEANUP_DAYS="${CLEANUP_DAYS:-7}"
CHECKPOINT_STRATEGY="${CHECKPOINT_STRATEGY:-refs}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Initialize state file if it doesn't exist (project-local)
init_state() {
    if [ ! -f "$STATE_FILE" ]; then
        mkdir -p "$(dirname "$STATE_FILE")"
        echo "last_checkpoint=$(date +%s)" > "$STATE_FILE"
        echo "file_count=0" >> "$STATE_FILE"
        echo "last_trigger=$(date +%s)" >> "$STATE_FILE"
    fi
    mkdir -p "$CHECKPOINT_DIR"
}

# Load state from project-local file
load_state() {
    if [ -f "$STATE_FILE" ]; then
        source "$STATE_FILE" 2>/dev/null || true
    fi
    last_checkpoint=${last_checkpoint:-$(date +%s)}
    file_count=${file_count:-0}
    last_trigger=${last_trigger:-$(date +%s)}
}

# Save state to project-local file
save_state() {
    cat > "$STATE_FILE" << EOSTATE
last_checkpoint=$last_checkpoint
file_count=$file_count
last_trigger=$last_trigger
EOSTATE
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        exit 0  # Silently exit if not in git repo
    fi

    # Skip if git operation in progress
    if [ -f "$(git rev-parse --git-dir)/MERGE_HEAD" ] || \
       [ -d "$(git rev-parse --git-dir)/rebase-merge" ] || \
       [ -d "$(git rev-parse --git-dir)/rebase-apply" ]; then
        exit 0
    fi
}

# Check for uncommitted changes
has_changes() {
    ! git diff --quiet || ! git diff --cached --quiet || \
    [ -n "$(git ls-files --others --exclude-standard)" ]
}

# Create checkpoint using refs (default)
checkpoint_refs() {
    local checkpoint_name="$1"
    local message="$2"

    # Stage all changes temporarily
    git add -A 2>/dev/null || true

    # Create tree object
    local tree=$(git write-tree)

    # Get parent commit
    local parent=$(git rev-parse HEAD 2>/dev/null || echo "")

    # Create commit object
    if [ -n "$parent" ]; then
        local commit=$(echo "$message" | git commit-tree $tree -p $parent)
    else
        local commit=$(echo "$message" | git commit-tree $tree)
    fi

    # Store as ref
    git update-ref "refs/checkpoints/$checkpoint_name" $commit

    # Unstage changes
    git reset 2>/dev/null || true

    echo -e "${GREEN}✓ Checkpoint: refs/checkpoints/$checkpoint_name${NC}" >&2
}

# Create a checkpoint
create_checkpoint() {
    check_git_repo

    if ! has_changes; then
        return 0
    fi

    local checkpoint_name="${CHECKPOINT_PREFIX}-$(date +%Y%m%d-%H%M%S)"
    local file_count=$(git status --porcelain | wc -l)
    local message="Checkpoint: $file_count files changed"

    case "$CHECKPOINT_STRATEGY" in
        refs|*)
            checkpoint_refs "$checkpoint_name" "$message"
            ;;
    esac

    # Reset state
    last_checkpoint=$(date +%s)
    file_count=0
    save_state
}

# Trigger checkpoint (called by hook)
trigger_checkpoint() {
    init_state
    load_state

    # Increment counter
    local current_time=$(date +%s)
    file_count=$((file_count + 1))
    last_trigger=$current_time
    save_state

    # Check thresholds
    local time_elapsed=$((current_time - last_checkpoint))

    if [ $file_count -ge $BATCH_FILE_COUNT ] || [ $time_elapsed -ge $BATCH_TIME_SECONDS ]; then
        create_checkpoint
    fi
}

# List checkpoints
list_checkpoints() {
    check_git_repo
    echo -e "${BLUE}=== Checkpoints ===${NC}"
    git for-each-ref refs/checkpoints --format='%(refname:short) - %(committerdate:relative) - %(subject)' | head -20
}

# Show status
show_status() {
    init_state
    load_state

    echo -e "${BLUE}=== Checkpoint Status ===${NC}"
    echo "Strategy: $CHECKPOINT_STRATEGY"
    echo "Threshold: $BATCH_FILE_COUNT files or $BATCH_TIME_SECONDS seconds"
    echo ""

    local current_time=$(date +%s)
    local time_since=$((current_time - last_checkpoint))

    echo "Last checkpoint: ${time_since}s ago"
    echo "Files since: $file_count"

    if has_changes; then
        echo -e "${YELLOW}Uncommitted changes present${NC}"
    fi
}

# Main dispatcher
case "${1:-}" in
    trigger)
        trigger_checkpoint
        ;;
    create|force)
        create_checkpoint
        ;;
    list|ls)
        list_checkpoints
        ;;
    status|info)
        show_status
        ;;
    help|--help|-h|*)
        echo "Checkpoint Manager for Claude Code"
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  trigger  - Called by hooks"
        echo "  create   - Force checkpoint"
        echo "  list     - Show checkpoints"
        echo "  status   - Show status"
        ;;
esac
EOF

chmod +x ~/.claude/checkpoint-manager.sh
```

### Step 4: Configure Git to Ignore Local State

Add to your project's `.gitignore`:

```bash
echo ".claude/checkpoint-state" >> .gitignore
echo ".claude/checkpoints/" >> .gitignore
echo ".claude/hooks.log" >> .gitignore
```

### Step 5: Activate and Test

1. **Reload hooks in Claude Code**:
   - Type `/hooks` in the Claude Code chat
   - Click "Apply" to reload the configuration

2. **Verify hooks are loaded**:
   ```bash
   # Check the test hook by sending any message
   # This should create .claude/hooks.log
   cat .claude/hooks.log
   ```

3. **Test file operations**:
   - Ask Claude to create or edit files using Write/Edit tools
   - Check the changes log: `tail -5 ~/.claude/changes.log`
   - Check checkpoint status: `~/.claude/checkpoint-manager.sh status`

4. **Test checkpoint triggering**:
   - Create multiple files in one request to Claude
   - After 5 file changes, a checkpoint should be created
   - List checkpoints: `~/.claude/checkpoint-manager.sh list`

## Key Differences from Previous Version

### Correct Schema Structure
```json
// WRONG (previous):
{
  "hooks": [
    {
      "event": "PostToolUse",
      "matcher": { "tool": "Write" },
      "command": "inline-command"
    }
  ]
}

// CORRECT (this version):
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "script.sh"
          }
        ]
      }
    ]
  }
}
```

### Proper Payload Handling
- Hooks receive JSON via **stdin**, not command arguments
- Must parse `tool_input.file_path` or `tool_input.file_paths`
- Tool name is in `tool_name` field

### Consistent Path Management
- State file is **project-local**: `.claude/checkpoint-state`
- Scripts are **project-local**: `.claude/hooks/*.sh`
- Logs are **user-global**: `~/.claude/changes.log`
- Manager is **user-global**: `~/.claude/checkpoint-manager.sh`

## Troubleshooting

### Hooks Not Firing
1. Ensure you've run `/hooks` and clicked "Apply"
2. Check `Stop` hook fires: look for entries in `.claude/hooks.log`
3. Verify scripts are executable: `ls -l .claude/hooks/`
4. Enable debug mode: `export DEBUG_HOOKS=1`

### No Checkpoints Created
1. Verify you're in a git repository
2. Check state file exists: `cat .claude/checkpoint-state`
3. Ensure threshold is reached (5 files or 5 minutes)
4. Check for git conflicts: `git status`

### Testing Tips
- Use Claude's Write/Edit tools, not shell commands
- Create multiple files in **one Claude request** to hit threshold
- Lower thresholds for testing: `export BATCH_FILE_COUNT=2`

## Environment Variables

You can customize behavior with these environment variables:

```bash
export BATCH_FILE_COUNT=3        # Checkpoint after 3 files
export BATCH_TIME_SECONDS=60     # Checkpoint after 1 minute
export CHECKPOINT_STRATEGY=refs  # Use git refs (default)
export DEBUG_HOOKS=1              # Enable debug logging
```

## Manual Commands Reference

```bash
# Force checkpoint now
~/.claude/checkpoint-manager.sh create

# List all checkpoints
~/.claude/checkpoint-manager.sh list

# Check status
~/.claude/checkpoint-manager.sh status

# View changes log
tail -20 ~/.claude/changes.log

# Restore from checkpoint
git checkout refs/checkpoints/checkpoint-20250127-123456
```

## Summary

This corrected implementation:
1. Uses the proper Claude Code hooks schema
2. Correctly parses JSON payloads from stdin
3. Maintains consistent project-local state
4. Actually triggers on Claude tool operations
5. Provides clear debugging and verification steps