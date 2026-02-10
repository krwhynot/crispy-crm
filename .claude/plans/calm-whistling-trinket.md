# Plan: Fix Note Validation + Complete ERD Documentation Package

**Confidence: 90%** - Clear root causes, straightforward fixes.

---

## Part A: Fix Organization Note Validation Errors

### Problem

Users see validation errors when creating a note for an organization:
- "Date: Please select a valid date."
- "Sales: Invalid value provided."

### Root Cause

**File:** `src/atomic-crm/notes/NoteCreate.tsx`

1. Form uses `resolver={createFormResolver(baseNoteSchema)}` (line 51)
2. Form defaults are `baseNoteSchema.partial().parse({})` which excludes required fields
3. `baseNoteSchema` requires `date` and `sales_id` but neither has a schema default
4. Validation runs BEFORE the transform that would add these values

### Solution

Create a `noteFormSchema` that makes `sales_id` optional and gives `date` a default.

### Task A1: Add `noteFormSchema` to notes.ts

**File:** `src/atomic-crm/validation/notes.ts`

Add after `baseNoteSchema`:

```typescript
/**
 * Form-level schema for note input (used by form resolver)
 * - sales_id optional (transform adds from identity)
 * - date defaults to current datetime
 */
export const noteFormSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Note text is required")
    .max(10000, "Note text too long")
    .transform((val) => sanitizeHtml(val)),
  date: z.coerce.date({ message: "Please select a valid date." }).default(() => new Date()),
  sales_id: z.union([z.string(), z.number()]).optional(),
  attachments: z.array(attachmentSchema).max(20).optional(),
  id: z.union([z.string(), z.number()]).optional(),
});
```

### Task A2: Update NoteCreate.tsx

**File:** `src/atomic-crm/notes/NoteCreate.tsx`

1. Import `noteFormSchema` instead of `baseNoteSchema`
2. Use it for resolver and defaults

---

## Part B: Complete ERD Documentation Package

### Task B1: Update SUMMARY.md

**File:** `docs/architecture/erd-artifacts/SUMMARY.md`

Update counts to match regenerated artifacts:
- Total Tables: 28 (not 34)
- Resources with UI: 13 (not 14)
- Foreign Keys: 78

### Task B2: Update README.md

**File:** `docs/architecture/erd-artifacts/README.md`

Update orphan-analysis documentation:
- Remove migration regex method
- Document pg client catalog discovery
- Remove knownTables hardcoded list

### Task B3: Update GENERATION_LOG.md

**File:** `docs/architecture/erd-artifacts/GENERATION_LOG.md`

Update to reflect current run:
- Orphaned Records: 1195 (not 0)
- Correct timestamps and metrics

---

## Files Modified

**Part A:**
- `src/atomic-crm/validation/notes.ts`
- `src/atomic-crm/notes/NoteCreate.tsx`

**Part B:**
- `docs/architecture/erd-artifacts/SUMMARY.md`
- `docs/architecture/erd-artifacts/README.md`
- `docs/architecture/erd-artifacts/GENERATION_LOG.md`

---

## Verification

**Part A:** Create a note on an organization without expanding date options - should succeed.

**Part B:** Run `node scripts/generate-erd-doc.js` and verify no stale claims in SUMMARY/README/LOG.
