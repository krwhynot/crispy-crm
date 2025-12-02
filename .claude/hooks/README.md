# Claude Code Hooks Configuration

This directory contains project-specific hooks that execute automatically during Claude Code sessions.

## Active Hooks

### UserPromptSubmit Hooks
**File:** `skill-activation-prompt.sh`
**Purpose:** Activates project-specific skills for each prompt

### PostToolUse Hooks (File Modifications)
Triggered after Write, Edit, or MultiEdit operations:

1. **file-track.sh** - Tracks modified files
2. **checkpoint-trigger.sh** - Creates git checkpoints
3. **post-tool-use-tracker.sh** - Tracks tool usage for analytics
4. **memory-capture.sh** - Captures important changes for context

## Configuration Location

Hook configurations are in `.claude/settings.json`.

---

*Last updated: December 2, 2025*
