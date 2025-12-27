---
name: discovery-first
description: Use pre-computed discovery files at .claude/state/ for codebase inventory questions. Triggers on component, hook, schema, form, type, inventory, what exists, list all, how many. Saves 90%+ tokens vs source scanning.
---

# Discovery-First Skill

## Purpose

ALWAYS read discovery files before scanning source code for inventory questions.

## When This Triggers

- "What components exist in contacts?"
- "List all hooks in the codebase"
- "What schemas are used for opportunities?"
- "How many forms exist?"
- "Which types are defined?"
- "What calls useContactData?"

## Discovery Files Location

| Question Type | Read This First |
|---------------|-----------------|
| Components | `.claude/state/component-inventory/{feature}.json` |
| Hooks | `.claude/state/hooks-inventory.json` |
| Schemas | `.claude/state/schemas-inventory/{feature}.json` |
| Forms | `.claude/state/forms-inventory.json` |
| Types | `.claude/state/types-inventory/{feature}.json` |
| Call Graph | `.claude/state/call-graph-inventory/{feature}.json` |

## Chunk Discovery Pattern

1. Read `manifest.json` in the inventory directory first
2. Find the chunk that contains the feature you need
3. Read only that chunk (e.g., `contacts.json`)

## Why This Matters

| Method | Token Cost | Speed |
|--------|------------|-------|
| Discovery JSON | ~30KB | < 2 sec |
| Source scanning | ~500KB | 5-15 sec |
| **Savings** | **94%** | **5x faster** |

## Required Behavior

1. **DO**: Read `.claude/state/` JSON files first
2. **DO**: Use manifest.json to find the right chunk
3. **DON'T**: Grep/Glob src/atomic-crm for inventory questions
4. **DON'T**: Use Task/Explore agent for basic component/hook listing
5. **DON'T**: Read individual source files when inventory answers the question

## Example: Correct Approach

**Question:** "What hooks does ContactList use?"

**Wrong approach:**
```
Grep("use.*=", "src/atomic-crm/contacts/ContactList.tsx")
Read("src/atomic-crm/contacts/ContactList.tsx")
```

**Correct approach:**
```
Read(".claude/state/component-inventory/contacts.json")
→ Find ContactList entry → Read hooks array
```

## Freshness

Discovery files are auto-regenerated on pre-commit via `.husky/pre-commit`.
If data seems stale, run: `just discover`
