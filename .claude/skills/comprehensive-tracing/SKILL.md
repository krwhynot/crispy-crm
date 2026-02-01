---
name: comprehensive-tracing
description: Enforces thorough code analysis with all entry points, complete flow tracing, architectural reasoning, and consumption tracking
version: 1.0.0
triggers:
  keywords:
    - analyze
    - workflow
    - how does
    - trace
    - deep dive
    - explain
    - search_code
    - go_to_definition
    - find_references
  intent_patterns:
    - "understand how * works"
    - "find all * that"
    - "trace the * flow"
    - "search for *"
    - "find where * is defined"
    - "find all references to *"
  tool_triggers:
    - mcp__crispy-code-intel__search_code
    - mcp__crispy-code-intel__go_to_definition
    - mcp__crispy-code-intel__find_references
enforcement: suggest
---

# Comprehensive Tracing Standards

When using MCP tools (search_code, go_to_definition, find_references) or analyzing code workflows, ALWAYS follow these standards:

## Thoroughness Requirements

### 1. Multi-Path Discovery
- NEVER stop at the first entry point found
- Ask: "What OTHER places trigger this behavior?"
- Document ALL paths (UI triggers, API calls, events, scheduled tasks)

### 2. End-to-End Tracing
For each entry point, trace the complete data flow:
```
UI Component → Hook → Data Provider → Service → Database
```

### 3. Architectural Reasoning
Don't just describe WHAT - explain WHY:
- ❌ "Uses zodResolver for validation"
- ✅ "Uses zodResolver with mode: 'onBlur' for performance (prevents re-render on every keystroke)"

### 4. Consumption Over Definition
Show WHERE things are used, not just defined:
- ❌ "Schema defined at validation/opportunities.ts:413"
- ✅ "Schema defined at validation/opportunities.ts:413, consumed by CloseOpportunityModal (line 56) for form validation and opportunities.service.ts (line 145) for API boundary validation"

### 5. File:Line Citations
Every claim must include precise location:
- Component definition: `src/components/Modal.tsx:45-120`
- Hook usage: `src/hooks/useForm.ts:23`
- Schema application: `validation/contacts.ts:89`

## Output Format Requirements

### For Workflow Analysis
```
## [Feature] Workflow Analysis

### Entry Points (ALL of them)
1. [Entry 1] - file:line - How it's triggered
2. [Entry 2] - file:line - How it's triggered
3. [Entry 3] - file:line - How it's triggered

### Data Flow (for each entry point)
Flow A: [Entry 1]
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ Component   │ → │   Hook      │ → │  Provider   │
│ file:line   │   │ file:line   │   │ file:line   │
└─────────────┘   └─────────────┘   └─────────────┘

### Validation Points
| Schema | Location | Applied At | Why |
|--------|----------|------------|-----|
| ... | ... | ... | ... |

### Key Architectural Decisions
1. [Decision] - WHY this approach was chosen
2. [Decision] - WHY this pattern was used

### Summary Table
| Question | Answer | Location |
|----------|--------|----------|
| ... | ... | file:line |
```

### Actionable Conclusion
Always end with:
"Would you like me to dive deeper into [specific area]?"

## MCP Tool Usage (When Available)

When MCP tools are available, use this workflow:

```
1. search_code("feature keywords") → Find all entry points
2. For EACH result: find_references("component") → Trace consumers
3. go_to_definition("schema") → Jump to definitions
4. Read actual files → Understand implementation
5. Document ALL paths with file:line references
```

### MCP + Thoroughness Combo
```
MCP Tool Called → This Skill Activates → Thoroughness Enforced
     ↓                  ↓                    ↓
search_code()    →  Reminds:     → "Find ALL entry points"
go_to_definition →  Reminds:     → "Show consumption, not just definition"
find_references  →  Reminds:     → "Trace complete flow"
```

## Quality Checklist

Before completing analysis, verify:
- [ ] Found ALL entry points (not just first one)
- [ ] Traced complete data flow for each path
- [ ] Explained WHY patterns were chosen
- [ ] Showed consumption locations, not just definitions
- [ ] Included file:line references throughout
- [ ] Offered continuation/deeper dive

## Anti-Patterns to Avoid

### ❌ Stopping at First Discovery
```
"The feature is implemented in ComponentX.tsx"
```
Always ask: "Are there OTHER places that trigger this?"

### ❌ Definition Without Consumption
```
"closeOpportunitySchema is defined at line 413"
```
Always show: "...and consumed by A (line X) and B (line Y)"

### ❌ What Without Why
```
"Uses pessimistic mutation mode"
```
Always explain: "Uses pessimistic mode because [reason]"

### ❌ Single Flow Path
```
"User clicks button → API call → Database"
```
Always check: "Are there other UI triggers? Events? Scheduled tasks?"

## Integration with Other Skills

This skill works with:
- **enforcing-principles**: Architectural patterns to look for
- **data-integrity-guards**: Validation layer tracing
- **fail-fast-debugging**: When debugging, trace comprehensively

## Examples

### Good: Comprehensive Analysis
```
## Opportunity Close Workflow Analysis

### Entry Points (3 found)
1. Kanban Card Dropdown → OpportunityCardActions.tsx:47-50
2. Kanban Drag-Drop → OpportunityListContent.tsx:388-399
3. SlideOver Edit Form → OpportunitySlideOverDetailsTab.tsx:149-167

### Data Flow
All 3 paths converge at CloseOpportunityModal, which:
- Validates via closeOpportunitySchema (onBlur mode for performance)
- Calls useUpdate → unifiedDataProvider → OpportunitiesService
- Updates stage + win/loss reason atomically

### Why onBlur Mode?
Form uses mode: "onBlur" instead of "onChange" to prevent
re-render storms during reason selection.
```

### Bad: Incomplete Analysis
```
## Opportunity Close Workflow

The opportunity is closed via drag-drop on the Kanban board.
Uses CloseOpportunityModal for reason capture.
```
(Missing: Other entry points, consumption tracking, architectural reasoning)
