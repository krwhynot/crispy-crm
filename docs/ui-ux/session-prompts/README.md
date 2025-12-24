# UI/UX Remediation Session Prompts

**Purpose:** Fix all 60 remaining UI/UX audit violations across multiple Claude Code sessions without context rot.

---

## Quick Start

1. **Restart Claude Code** to activate shadcn MCP server
2. **Run `/mcp`** to verify `shadcn` is Connected
3. Copy the prompt from **prompt-1-critical-p0.md** into a new session
4. Complete that batch, then move to the next prompt

---

## Prompt Sequence

| Prompt | Priority | Issues | Time Est. | Score Impact |
|--------|----------|--------|-----------|--------------|
| [prompt-1-critical-p0.md](./prompt-1-critical-p0.md) | P0 Critical | 5 | 60-75 min | 8.2 → 8.6 |
| [prompt-2-high-p1.md](./prompt-2-high-p1.md) | P1 High | 17 | 90-120 min | 8.6 → 9.3 |
| [prompt-3-medium-p2.md](./prompt-3-medium-p2.md) | P2 Medium | 23 | 2-3 hours | 9.3 → 9.7 |
| [prompt-4-low-p3.md](./prompt-4-low-p3.md) | P3 Low | 15 | 2-3 hours | 9.7 → 10.0 |

**Total:** 60 issues, ~8-10 hours, 8.2 → 10.0 score

---

## Why Separate Prompts?

1. **Context Window Management** - Each prompt fits comfortably in Claude's context
2. **Natural Save Points** - Complete one priority level, take a break
3. **Progress Tracking** - Clear milestones with score improvements
4. **Error Isolation** - If something goes wrong, only one batch is affected

---

## Prerequisites

### shadcn MCP Server (Required)

Your `~/.mcp.json` should contain:
```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

### Fix Guide (Reference)
All issue details are in: `/docs/ui-ux/shadcn-mcp-fix-guide.md`

---

## Session Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  START NEW SESSION                                          │
├─────────────────────────────────────────────────────────────┤
│  1. Copy prompt N into Claude Code                          │
│  2. Run /mcp to verify shadcn connected                     │
│  3. Work through each issue/batch                           │
│  4. Update checkboxes in fix guide                          │
│  5. Verify success criteria                                 │
│  6. END SESSION - Move to prompt N+1                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Verification Commands

After each session, verify fixes:

```bash
# Touch target verification
grep -r "h-11\|min-h-11\|size-11" src/components/ui/

# Z-index verification (should see no z-[9999])
grep -r "z-\[" src/ --include="*.tsx"

# Focus ring patterns
grep -r "focus-visible:ring" src/components/ui/

# Gap violations (should see no gap-1)
grep -r "gap-1[^0-9]" src/ --include="*.tsx"
```

---

## Troubleshooting

### shadcn MCP shows "No tools"
```bash
npx clear-npx-cache
# Then restart Claude Code
```

### MCP guard blocks calls
Your `mcp-dependency-guard.sh` will prompt for confirmation - this is expected.

### Score not improving
Re-read the executive summary at `docs/ui-ux/audits/ui-ux-audit-executive-summary.md` to verify what's been fixed.

---

## Files in This Directory

```
session-prompts/
├── README.md                  # This file
├── prompt-1-critical-p0.md    # 5 critical issues
├── prompt-2-high-p1.md        # 17 high priority
├── prompt-3-medium-p2.md      # 23 medium priority
└── prompt-4-low-p3.md         # 15 low priority (polish)
```

---

*Generated 2025-12-24 from UI/UX audit reports*
