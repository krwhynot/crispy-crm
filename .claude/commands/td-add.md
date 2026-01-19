---
name: td-add
description: Add new technical debt entry to docs/technical-debt.md
---

# /td add - Add Technical Debt Entry

Add a new entry to `docs/technical-debt.md` with auto-generated ID.

## Usage

```
/td add
```

## Workflow

When this skill is invoked, follow these steps:

### Step 1: Gather Information

Use AskUserQuestion to collect:

1. **Category** - Select from:
   - `UI` - User interface issues
   - `ASYNC` - Async/state management issues
   - `ERR` - Error handling issues
   - `IMP` - Import/module issues
   - `DEAD` - Dead code
   - `DB` - Database/schema issues
   - `FORM` - Form-related issues
   - `EC` - Edge cases/i18n issues

2. **Priority** - Select from:
   - `P0` - Critical (must fix before launch)
   - `P1` - High (fix this sprint)
   - `P2` - Medium (tech debt backlog)
   - `P3` - Low (improvements)

3. **Issue Description** - Brief description of the problem

4. **File Path(s)** - Path to affected file(s), e.g., `src/atomic-crm/contacts/ContactList.tsx:45`

5. **Related To** (optional) - Link to existing audit finding (e.g., SF-C09, WF-C04)

### Step 2: Generate ID

Run the td-generator script to get the next available ID:

```bash
.claude/hooks/td-generator.sh "<CATEGORY>" "<PRIORITY>" "<ISSUE>" "<FILE_PATH>" "manual" "id"
```

### Step 3: Find Insertion Point

Read `docs/technical-debt.md` and find the appropriate priority section:
- P0 items go under `## P0 - Critical`
- P1 items go under `## P1 - High Priority`
- P2 items go under `## P2 - Medium Priority`
- P3 items go under `## P3 - Low Priority`

### Step 4: Insert Entry

Add a new table row in the appropriate section:

```markdown
| <ID> | <CATEGORY> | <ISSUE> | `<FILE_PATH>` | Open |
```

### Step 5: Add Dependency Entry

At the end of the priority's Dependencies section, add:

```markdown
- **<ID>**: Blocks nothing | Blocked by: None | Related: <RELATED_TO or "Independent">
```

### Step 6: Update Summary Table

Increment the "Open Items" count for the appropriate priority in the Summary table.

### Step 7: Confirm

Output confirmation message:

```
✅ Added TD entry:
   ID: <FULL_ID>
   Priority: <PRIORITY>
   Issue: <ISSUE>
   File: <FILE_PATH>

📝 Entry added to docs/technical-debt.md under <PRIORITY_SECTION>
💡 Edit the file to add details or change dependencies.
```

## Example Session

```
User: /td add

Claude: I'll help you add a new technical debt entry.

[AskUserQuestion with category options]

User selects: ERR (Error handling)

[AskUserQuestion with priority options]

User selects: P1 (High)

[AskUserQuestion for issue description]

User enters: "Missing error boundary in OpportunityCard"

[AskUserQuestion for file path]

User enters: "src/atomic-crm/opportunities/OpportunityCard.tsx"

Claude:
✅ Added TD entry:
   ID: ERR-04
   Priority: P1
   Issue: Missing error boundary in OpportunityCard
   File: src/atomic-crm/opportunities/OpportunityCard.tsx

📝 Entry added to docs/technical-debt.md under P1 - High Priority
💡 Edit the file to add details or change dependencies.
```

## Quick Add Mode

If the user provides all information inline, skip the prompts:

```
/td add ERR P1 "Missing error boundary" src/atomic-crm/opportunities/OpportunityCard.tsx
```

Parse the arguments and proceed directly to Step 2.
