---
description: Capture session knowledge to Crispy CRM Obsidian notes (merge or create)
---

Capture knowledge from this session to the Crispy CRM Obsidian vault. Use Obsidian MCP tools.

## Step 1: Identify What to Capture

Review the current session and identify:
- Key decisions, patterns, or learnings worth preserving
- Technical details that should be documented

Ask: "What from this session should I capture?" (or summarize if obvious)

## Step 2: Search for Related Notes

Use `obsidian_simple_search` with relevant keywords to find existing notes.
Scope search to: `01 - Projects/Coding Projects/Active/Crispy-CRM/`

If multiple matches, pick the most relevant OR ask user which note.

## Step 3: Merge or Create

### If Related Note Found:
Use `obsidian_get_file_contents` to read the note structure.
Identify the most relevant heading/section for the new content.
Use `obsidian_patch_content` with:
- `operation`: "append"
- `target_type`: "heading"
- `target`: The relevant heading path

Format additions with:
- Date stamp: `<!-- Added: YYYY-MM-DD -->`
- Bullet points for new info
- Preserve existing content structure

### If New Topic:
Determine the appropriate subfolder:
| Folder | Topic Type |
|--------|------------|
| `1-getting-started/` | Setup, environment, stack, glossary |
| `2-how-to-guides/` | Procedures, how-tos, troubleshooting |
| `3-reference/` | Rules, patterns, data model, specs |
| `4-deep-dives/` | Complex systems, advanced architecture |
| `5-project-status/` | Progress, milestones, roadmap |
| `6-audit-commands/` | Audit scripts, diagnostics |

Use `obsidian_append_content` to create at:
`01 - Projects/Coding Projects/Active/Crispy-CRM/{subfolder}/{Kebab-Title}.md`

Template:
```
---
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
tags:
  - crispy-crm
  - {subfolder-tag}
type: {guide|reference|status|deep-dive}
status: active
---

# {Title}

{Content organized with appropriate headings}
```

## Step 4: Confirm

Report: "✓ {Merged into | Created}: {filepath}"
Include link format: `[[{note-name}]]`