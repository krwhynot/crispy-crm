# Fix vCard Export Documentation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Correct PRD documentation inconsistency where vCard export is marked complete but missing from codebase

**Architecture:** This is a documentation-only task (Option A - Recommended) OR full implementation task (Option B - See separate plan). The PRD currently claims vCard export is complete in 3 locations, but codebase analysis found zero implementation.

**Tech Stack:**
- Documentation: `docs/prd/05-contacts-module.md`
- Git: version control for documentation changes

**Effort:** 5 minutes (Option A - Remove claims) OR 2 days (Option B - Implement feature)
**Priority:** CRITICAL (Documentation accuracy)
**Current Status:** PRD claims complete (❌ FALSE), Implementation is 0%

---

## Decision Point: Choose Your Approach

### Option A: Remove vCard Export Claims (RECOMMENDED) ⚡

**Time:** 5 minutes
**Reason:** Feature was never implemented, PRD should reflect reality
**Follow:** Steps 1-6 below

### Option B: Implement vCard Export Feature

**Time:** 2 days
**Reason:** Keep PRD claim, implement missing feature
**Follow:** Separate plan at `docs/plans/2025-11-04-vcard-export-implementation.md`

**This plan covers Option A only (documentation fix)**

---

## Task 1: Remove vCard Export Claims from PRD

**Files:**
- Modify: `docs/prd/05-contacts-module.md:27` (remove claim from export features)
- Modify: `docs/prd/05-contacts-module.md:33` (remove claim from completed requirements)
- Modify: `docs/prd/05-contacts-module.md:39` (update implementation status)

---

### Step 1: Read current PRD documentation

**Action:** Identify exact locations of vCard export claims

```bash
grep -n "vCard\|VCard\|vcf" docs/prd/05-contacts-module.md
```

**Expected output:** Shows line numbers where vCard is mentioned

---

### Step 2: Backup original PRD file

**Action:** Create safety backup before modification

```bash
cp docs/prd/05-contacts-module.md docs/prd/05-contacts-module.md.backup
```

---

### Step 3: Read context around vCard claims

**Action:** View the sections that need updating

```bash
sed -n '20,45p' docs/prd/05-contacts-module.md
```

**Look for sections like:**
- "Export Features" or "Completed Requirements"
- Checkbox items: "✅ vCard export"
- Implementation status mentions

---

### Step 4: Remove vCard export from completed features list

**File:** `docs/prd/05-contacts-module.md`

**Find section (around line 27):**
```markdown
**Export Features:**
- ✅ CSV export for contacts
- ✅ vCard export (.vcf) for phone import  <-- REMOVE THIS LINE
- ✅ Batch export selected contacts
```

**Update to:**
```markdown
**Export Features:**
- ✅ CSV export for contacts
- ✅ Batch export selected contacts
```

---

### Step 5: Update completed requirements section

**File:** `docs/prd/05-contacts-module.md`

**Find section (around line 33):**
```markdown
**Completed Requirements:**
- ✅ CSV import/export with validation
- ✅ vCard export for contact sharing  <-- REMOVE THIS LINE
- ✅ Multi-organization contact management
```

**Update to:**
```markdown
**Completed Requirements:**
- ✅ CSV import/export with validation
- ✅ Multi-organization contact management
```

---

### Step 6: Add vCard to missing requirements (if not already there)

**File:** `docs/prd/05-contacts-module.md`

**Find "Missing Requirements" table (around line 85):**

```markdown
| Task | Status | Confidence | Estimate |
|------|--------|-----------|----------|
| Polish multi-org UI edge cases | 🚧 Partial | 🟢 HIGH | 1 day |
| CSV import edge case testing | ❌ Missing | 🟡 MEDIUM | 1 day |
```

**Add vCard entry if not present:**

```markdown
| Task | Status | Confidence | Estimate |
|------|--------|-----------|----------|
| Polish multi-org UI edge cases | 🚧 Partial | 🟢 HIGH | 1 day |
| CSV import edge case testing | ❌ Missing | 🟡 MEDIUM | 1 day |
| vCard export (.vcf format) | ❌ Missing | 🟢 HIGH | 2 days |
```

---

### Step 7: Update implementation status note

**File:** `docs/prd/05-contacts-module.md`

**Find implementation status details section:**

**Add note about vCard:**

```markdown
**Details:**
- **vCard Export Gap:** PRD previously claimed complete, but no implementation found in codebase analysis (November 2025). Moved to missing requirements. Can be implemented if needed (2 days effort using vcard-creator library).
```

---

### Step 8: Verify documentation consistency

**Action:** Check that all vCard references are updated

```bash
# Should show only "Missing Requirements" section now
grep -n "vCard" docs/prd/05-contacts-module.md
```

**Expected:** Only appears in "Missing Requirements" table and details note

---

### Step 9: Preview changes with git diff

**Action:** Review all modifications

```bash
git diff docs/prd/05-contacts-module.md
```

**Verify:**
- ✅ Removed from completed features (2 locations)
- ✅ Added to missing requirements (1 location)
- ✅ Added explanatory note in details section

---

### Step 10: Commit documentation fix

**Action:** Commit with clear explanation

```bash
git add docs/prd/05-contacts-module.md
git commit -m "docs: correct vCard export status in contacts PRD

- Remove vCard export from completed features list
- Remove vCard export from completed requirements
- Add vCard export to missing requirements (2 days estimate)
- Add explanatory note about PRD vs reality discrepancy

BREAKING: This corrects a documentation error where vCard export
was marked complete but analysis found 0% implementation.

Analysis date: November 2025
Confidence: HIGH (codebase search found no .vcf, no vCard libraries)

If vCard export is needed, see implementation plan:
docs/plans/2025-11-04-vcard-export-implementation.md

🤖 Generated with Claude Code"
```

---

### Step 11: Remove backup file

**Action:** Clean up backup after successful commit

```bash
rm docs/prd/05-contacts-module.md.backup
```

---

### Step 12: Update PRD rollup document (optional but recommended)

**File:** `docs/PRD_IMPLEMENTATION_STATUS_ROLLUP.md`

**Find contacts module section (around line 37):**

```markdown
**Minor Gaps:**
- Contacts: Multi-org UI polish (1 day)
```

**Update to:**

```markdown
**Minor Gaps:**
- Contacts: Multi-org UI polish (1 day), vCard export (2 days)
```

**Commit rollup update:**

```bash
git add docs/PRD_IMPLEMENTATION_STATUS_ROLLUP.md
git commit -m "docs: update rollup with vCard export status

🤖 Generated with Claude Code"
```

---

## Verification Checklist

After completing all steps:

- ✅ vCard removed from completed features (2 locations)
- ✅ vCard added to missing requirements with estimate
- ✅ Explanatory note added about discrepancy
- ✅ Git diff reviewed before commit
- ✅ Documentation commit created
- ✅ Backup file removed
- ✅ (Optional) Rollup document updated

---

## Testing

**Documentation Consistency Check:**

```bash
# Should find vCard only in "Missing Requirements" section
grep -B 2 -A 2 "vCard" docs/prd/05-contacts-module.md
```

**Expected output:**
```
| vCard export (.vcf format) | ❌ Missing | 🟢 HIGH | 2 days |
...
**Details:**
- **vCard Export Gap:** PRD previously claimed complete...
```

**No automated tests required** - This is documentation only

---

## Rollback Procedure

If you need to undo:

```bash
# Restore from backup (if you didn't delete it)
cp docs/prd/05-contacts-module.md.backup docs/prd/05-contacts-module.md

# Or revert the commit
git revert HEAD
```

---

## Alternative: Implement vCard Export Instead

If after fixing docs you decide vCard export is needed:

**See:** `docs/plans/2025-11-04-vcard-export-implementation.md` (Low Priority)

**That plan includes:**
- vcard-creator library integration
- Contact data formatting to vCard 3.0/4.0
- Download functionality
- Export button in contacts UI
- Tests

**Effort:** 2 days
**Priority:** LOW (nice-to-have feature)

---

## Communication

**Inform stakeholders:**

After fixing documentation, communicate to team:

> "📋 Documentation Update: vCard export feature was marked complete in PRD but was never implemented. I've corrected the PRD to reflect reality. If vCard export is needed, there's a 2-day implementation plan available."

---

## Related Files

- **Primary:** `docs/prd/05-contacts-module.md`
- **Rollup:** `docs/PRD_IMPLEMENTATION_STATUS_ROLLUP.md`
- **Analysis:** Codebase search found zero implementation:
  - No .vcf file generation
  - No vcard-creator or similar libraries in package.json
  - No vCard-related components in src/atomic-crm/contacts/

---

**Plan Status:** ✅ Ready for execution
**Estimated Time:** 5 minutes
**Risk:** Very Low (documentation-only change)
**Impact:** HIGH (restores documentation accuracy and stakeholder trust)
