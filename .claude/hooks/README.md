# Claude Code Hooks Configuration

This directory contains project-specific hooks that execute automatically during Claude Code sessions.

## Active Hooks

### 🚀 SessionStart Hooks (2 components)

#### 1. Superpowers Confirmation Message
**File:** `.claude/hooks/init-superpowers.sh`
**Type:** Command script
**Purpose:** Displays "YOU HAVE SUPERPOWERS NOW!" confirmation message

#### 2. Superpowers System Initialization
**File:** Configured in `.claude/settings.json`
**Type:** Prompt execution
**Command:** Sends prompt to execute `superpowers:using-superpowers`
**Purpose:** Activates the superpowers workflow enforcement system

**What happens at session start:**
1. Beautiful ASCII banner displays "YOU HAVE SUPERPOWERS NOW!"
2. Shows system status (ACTIVE/ENABLED/MANDATORY)
3. Lists enforced protocols
4. Loads the superpowers skill for workflow enforcement
5. All subsequent tasks check for relevant skills automatically

### 📝 PostToolUse Hooks (File Modifications)
Triggered after Write, Edit, or MultiEdit operations:

1. **file-track.sh** - Tracks modified files
2. **checkpoint-trigger.sh** - Creates git checkpoints
3. **memory-capture.sh** - Captures important changes for context

## How SessionStart Works

When you start Claude Code in this project:

1. Claude reads `.claude/settings.json`
2. Finds the SessionStart hook configuration
3. Automatically executes `superpowers:using-superpowers` skill
4. The superpowers system is now active for the entire session

## Benefits

✅ **Consistent Workflow** - Superpowers always active, no manual initialization needed
✅ **Enforces Best Practices** - Skills are checked and used for relevant tasks
✅ **Prevents Shortcuts** - Common rationalizations are blocked
✅ **Quality Assurance** - Proven workflows followed automatically

## Testing the Hook

To verify the SessionStart hook is working:
1. Start a new Claude Code session in this project
2. You should see the superpowers system initialization message
3. The system will enforce skill usage for all subsequent tasks

## Configuration Location

The hook configuration is in `.claude/settings.json`:

```json
"SessionStart": [
  {
    "matcher": "startup",
    "hooks": [
      {
        "type": "command",
        "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/init-superpowers.sh"
      },
      {
        "type": "prompt",
        "prompt": "Execute the skill: superpowers:using-superpowers..."
      }
    ]
  }
]
```

### Matcher Types

SessionStart hooks support different matchers:
- **`startup`** - Runs when Claude Code starts fresh (what we use)
- **`resume`** - Runs when resuming a session
- **`clear`** - Runs after `/clear` command
- **`compact`** - Runs during auto/manual compact

## Troubleshooting

If the superpowers system doesn't initialize:
1. Check `.claude/settings.json` syntax is valid JSON
2. Verify the skill name is correct: `superpowers:using-superpowers`
3. Ensure Claude Code has the superpowers plugin installed
4. Check Claude Code logs for any error messages

---

*Last updated: November 3, 2025*