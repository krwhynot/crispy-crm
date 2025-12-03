---
name: root-cause-tracing
description: Systematic backward tracing through call chains to find where bugs originate. Triggers on debug, trace, root cause, call stack, error, exception, bug, investigate, find the source, test pollution, flaky test, bisect, why is this failing, where does this come from, track down. Integrates with mcp__zen__debug for hypothesis-driven investigation.
---

# Root Cause Tracing

## Purpose

Enforce the debugging principle: **"Trace backward through the call chain until you find the original trigger, then fix at the source."**

This skill BLOCKS symptom-fixing and enforces systematic root cause investigation before code changes.

## When This Skill Activates

**Guardrail triggers (BLOCKS edits):**
- Editing files where errors manifest without investigation
- Adding try/catch, null checks, or defensive guards without tracing
- Quick-fix patterns that treat symptoms
- Phrases like "the error is in X" followed by editing X

## Core Methodology

### The 5-Step Trace Process

```
1. OBSERVE     → Note where error appears (symptom location)
2. IMMEDIATE   → Identify direct code causing the symptom
3. TRACE UP    → Ask: "What called this? What passed these values?"
4. KEEP GOING  → Follow the chain - each level reveals context
5. FIND SOURCE → Locate where invalid data/state ORIGINATED
```

### Integration with mcp__zen__debug

Use the Zen debug tool for systematic investigation:

```typescript
// Example: Start investigation with hypothesis
mcp__zen__debug({
  step: "Error manifests in ContactForm.tsx:142 - null contact.name.
         Tracing backward: called by ContactEdit → loaded by dataProvider.getOne()",
  step_number: 1,
  total_steps: 3,
  next_step_required: true,
  findings: "Symptom location identified. Need to trace data flow.",
  hypothesis: "Data is valid at source, corruption during transform",
  confidence: "exploring",
  relevant_files: [
    "/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactForm.tsx",
    "/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/unifiedDataProvider.ts"
  ],
  model: "gemini-2.5-pro"
})
```

## Anti-Patterns (BLOCKED)

### 1. Symptom-Location Fix
```typescript
// BAD: Error appears in ContactForm, immediately editing ContactForm
// The null might originate from API, data provider, or transform
```

### 2. Defensive Guard Without Investigation
```typescript
// BAD: Adding null check without knowing WHY it's null
if (contact?.name) { ... }  // <-- Where did null come from?
```

### 3. Try-Catch Wrapper
```typescript
// BAD: Swallowing errors without understanding cause
try {
  processContact(contact);
} catch (e) {
  console.error("Contact failed"); // <-- WHY did it fail?
}
```

## Correct Process

### Step 1: Observe the Symptom
```
Error: Cannot read property 'name' of null
Location: ContactForm.tsx:142
```

### Step 2: Trace Immediate Cause
```typescript
// ContactForm.tsx:142
<TextField source="name" /> // contact is null here
// Who provides contact? → props from ContactEdit
```

### Step 3: Trace One Level Up
```typescript
// ContactEdit.tsx
const { data: contact } = useGetOne('contacts', { id });
// Where does useGetOne get data? → dataProvider.getOne()
```

### Step 4: Keep Tracing
```typescript
// unifiedDataProvider.ts - getOne()
const { data } = await supabase.from('contacts').select('*').eq('id', id).single();
// Check: Is data null from Supabase? Or is ID invalid?
```

### Step 5: Find Original Trigger
```typescript
// FOUND: The ID is undefined because route param wasn't parsed
// Root cause: Router/URL parsing, not ContactForm or dataProvider
```

### Step 6: Fix at Source
```typescript
// Fix WHERE the problem originates - router config
// NOT where symptoms appear
```

## Instrumentation When Tracing is Difficult

Add diagnostic logging BEFORE problematic operations:

```typescript
// Use console.error for visibility (not logger)
console.error('[DEBUG] Contact data at transform:', {
  contactId: id,
  rawData: data,
  transformedData: result,
  stack: new Error().stack
});
```

## Test Pollution Detection

For flaky tests or test pollution, use the find-polluter script:

```bash
# Find which test creates unwanted .git directory
./find-polluter.sh '.git' 'src/**/*.test.ts'

# Find which test leaves database state
./find-polluter.sh 'test.db' 'tests/**/*.spec.ts'
```

See: `.claude/skills/root-cause-tracing/find-polluter.sh`

## Required Before Editing

Before this skill unblocks edits, you must:

1. **Identify symptom location** - Where does error appear?
2. **Trace at least 2 levels up** - What called this? What called that?
3. **State hypothesis** - Where do you believe root cause is?
4. **Verify with mcp__zen__debug** - Use structured investigation

## Quick Reference

| Symptom | DON'T Fix Here | Trace To |
|---------|----------------|----------|
| Null in component | Component file | Data provider / API |
| Type error in form | Form component | Schema / validation |
| Test flaky | Test file | Shared state / isolation |
| API error 500 | Error handler | Request construction |
| Render loop | Component | State management |

## Related Skills

- `enforcing-principles` - Fail-fast, no defensive guards
- `data-integrity-guards` - Layered validation
- `technical-feedback` - When debugging feedback from reviews

---

**Philosophy:** Fixing where errors appear treats symptoms. Tracing to root cause eliminates bugs permanently.
