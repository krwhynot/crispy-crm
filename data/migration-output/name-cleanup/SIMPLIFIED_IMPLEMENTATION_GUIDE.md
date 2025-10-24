# Simplified Contact Name Cleanup - Implementation Guide

## Decision: 85% Confidence Threshold

**Strategy**: Only fix names we're 85%+ confident about. Everything else moves to organization notes.

---

## Results Summary

| Category | Count | Action |
|----------|-------|--------|
| **Total Questionable** | 153 | - |
| **Keep & Correct** (85%+) | 55 (35.9%) | Apply corrections |
| **Move to Notes** (<85%) | 98 (64.1%) | Add to org notes |
| ├─ WITH email/phone | 24 | ⚠️ Preserve data carefully |
| └─ WITHOUT data | 74 | Safe to delete after noting |

---

## Implementation Steps

### Step 1: Apply High-Confidence Corrections (55 contacts)

**File**: `contacts_to_keep_corrected.csv`

**Confidence Breakdown**:
- 95-100%: 37 entries (Very high certainty)
- 90-94%: 16 entries (High certainty)
- 85-89%: 2 entries (Good certainty)

**Examples of corrections**:
```
"Chef Saul Ramos" → first="Saul", last="Ramos", title="Chef"
"Jay-GM" → first=NULL, last="Jay", title="GM"
"General Manager Jensen" → first=NULL, last="Jensen", title="General Manager"
```

**Action**: Update these 55 contacts with the corrected first_name, last_name, and title values.

---

### Step 2: Move Low-Confidence Entries to Organization Notes (98 entries)

**File**: `contacts_to_move_to_notes.csv`

This file identifies 98 entries where we're <85% confident about the parsing.

#### 2A: Entries WITH Email/Phone Data (24 entries) ⚠️ CRITICAL

**These MUST be handled carefully to avoid data loss!**

**Examples**:
- "President" at Angie's (has email: osroc44@yahoo.com)
- "Michael campenil - Greco" at Arlington Tap House (has phone)
- "David Tsirekas Craig Richardson" at Batter & Berries

**Action for each of the 24**:
1. Extract email and phone from the "Email" and "Phone" columns in the file
2. Create note text: `"Contact: [Original Name] | Email: [email] | Phone: [phone]"`
3. Append to organization's `notes` field
4. **Option A**: Keep minimal contact record with email/phone intact but clear name/title
5. **Option B**: Transfer email/phone to organization fields if schema supports it
6. DO NOT delete these 24 contacts without preserving their data

**Suggested Note Format**:
```
Contact: President | Email: osroc44@yahoo.com
Contact: David Tsirekas Craig Richardson | (ambiguous - multiple people?)
```

#### 2B: Entries WITHOUT Email/Phone Data (74 entries)

**These can be safely removed after adding to notes**

**Examples**:
- "Chef Manager Tinaglia" at Arami
- "VP Community Engagement" at Bally's Casino
- "Seth Minton chef de cuisine" at Bob Chinn's Crabhouse

**Action for each of the 74**:
1. Create simple note: `"Contact: [Original Name]"`
2. Append to organization's `notes` field
3. Delete the contact record (no data loss - it's preserved in org notes)

---

## Why This Approach?

### Advantages

✅ **No guesswork**: Only fix what we're confident about
✅ **Zero data loss**: Everything preserved in searchable org notes
✅ **No manual review**: Fully automated decision-making
✅ **Reversible**: Data in notes can be re-parsed later if needed
✅ **Clean contact records**: Only keep well-formed names
✅ **Context preserved**: Organization relationship maintained

### Better Than Alternatives

❌ **Guessing names**: "Seth Minton chef de cuisine" → last="cuisine"? BAD
✅ **Move to notes**: "Seth Minton chef de cuisine" stored at Bob Chinn's → GOOD

❌ **Keeping bad data**: Breaks search, looks unprofessional
✅ **Notes field**: Searchable, doesn't break UI, maintains context

---

## Database Implementation

### SQL Pseudo-Code

```sql
-- Step 1: Update 55 high-confidence contacts
UPDATE contacts c
SET
    first_name = k.first_name,
    last_name = k.last_name,
    title = k.title
FROM contacts_to_keep_corrected k
WHERE c.name = k.original_name
  AND c.organization_name = k.organization
  AND k.confidence >= 85;

-- Step 2A: Add notes for 24 entries WITH data (preserve contacts)
UPDATE organizations o
SET notes = CONCAT(
    COALESCE(o.notes || '\n', ''),
    'Contact: ', n.original_name,
    CASE
        WHEN n.email != '' THEN ' | Email: ' || n.email
        ELSE ''
    END,
    CASE
        WHEN n.phone != '' THEN ' | Phone: ' || n.phone
        ELSE ''
    END
)
FROM contacts_to_move_to_notes n
WHERE o.name = n.organization
  AND n.has_email_phone = 'YES';

-- For these 24, optionally clear name fields but keep email/phone
UPDATE contacts c
SET
    first_name = NULL,
    last_name = NULL,
    name = 'See organization notes',
    title = NULL
FROM contacts_to_move_to_notes n
WHERE c.name = n.original_name
  AND c.organization_name = n.organization
  AND n.has_email_phone = 'YES';

-- Step 2B: Add notes for 74 entries WITHOUT data, then delete
UPDATE organizations o
SET notes = CONCAT(
    COALESCE(o.notes || '\n', ''),
    'Contact: ', n.original_name
)
FROM contacts_to_move_to_notes n
WHERE o.name = n.organization
  AND n.has_email_phone = 'NO';

-- Delete the 74 contacts without data (safe - data now in org notes)
DELETE FROM contacts c
USING contacts_to_move_to_notes n
WHERE c.name = n.original_name
  AND c.organization_name = n.organization
  AND n.has_email_phone = 'NO';
```

---

## Validation Checklist

Before applying changes:

- [ ] Backup `contacts_cleaned.csv` and `organizations_cleaned.csv`
- [ ] Verify 55 corrections in `contacts_to_keep_corrected.csv` look reasonable
- [ ] Confirm 24 entries with data are being preserved (not deleted)
- [ ] Test SQL on staging table first
- [ ] Verify organization notes field can accommodate new text
- [ ] Check that concatenating notes won't exceed field limits

After applying changes:

- [ ] Verify 55 contacts have updated names/titles
- [ ] Verify 98 organizations have new notes entries
- [ ] Verify 24 contacts with email/phone still have that data
- [ ] Verify 74 contacts without data have been removed
- [ ] Spot-check organization notes are searchable
- [ ] Confirm total contact count: (original) - 74 = (new count)

---

## Files Reference

**Input**:
- `questionable_names.csv` - Original 153 problematic entries
- `contacts_cleaned.csv` - Main contacts file

**Output**:
- `contacts_to_keep_corrected.csv` - 55 corrections to apply
- `contacts_to_move_to_notes.csv` - 98 entries to move to org notes
- `simplified_cleanup_summary.csv` - Statistics

**Scripts**:
- `simplified_cleanup_script.py` - Reusable automation

---

## Quality Metrics

### Confidence Distribution (Keep Entries)
- **95-100%**: 37/55 = 67.3% (Very high certainty)
- **90-94%**: 16/55 = 29.1% (High certainty)
- **85-89%**: 2/55 = 3.6% (Good certainty)

### Data Preservation (Notes Entries)
- **WITH data**: 24/98 = 24.5% (Must preserve carefully)
- **WITHOUT data**: 74/98 = 75.5% (Safe to remove)

### Overall Impact
- ✅ 55 contacts improved with corrections
- ✅ 98 organizations gain context notes
- ✅ 74 bad contact records removed
- ✅ 24 contact data items preserved
- ✅ **0 data loss**

---

## Example Transformations

### High Confidence (Fix)

| Original | Current Parsing | Corrected | Confidence |
|----------|-----------------|-----------|------------|
| Chef Saul Ramos | first="Saul", last="Ramos" | title="Chef" added | 95% |
| Jay-GM | Treated as name | last="Jay", title="GM" | 95% |
| General Manager Jensen | All as title | last="Jensen", title="General Manager" | 90% |

### Low Confidence (Move to Notes)

| Original | Issue | Organization | Action |
|----------|-------|--------------|--------|
| David Tsirekas Craig Richardson | 2+ people? | Batter & Berries | Add to notes |
| Seth Minton chef de cuisine | Title suffix unclear | Bob Chinn's | Add to notes |
| President | Just title, has email | Angie's | Add to notes, preserve email |

---

## Support & Troubleshooting

**Q: What if I want to manually fix some of the 98 "notes" entries later?**
A: The data is preserved in organization notes. You can create new contact records later by parsing the notes field.

**Q: Can I be even more conservative (higher threshold)?**
A: Yes! Edit `simplified_cleanup_script.py` and change `if confidence >= 85:` to `if confidence >= 90:` or `>= 95:`

**Q: What about the 24 entries with email/phone data?**
A: These are the most critical. The file `contacts_to_move_to_notes.csv` flags them with "IMPORTANT" in the Action column. Review each one individually.

**Q: Is this reversible?**
A: Yes - all original data is preserved either in corrected contacts or in organization notes. You can roll back or re-parse later.

---

Generated: 2025-10-22
Strategy: 85% Confidence Threshold
Tool: simplified_cleanup_script.py
Total Processed: 153 questionable entries
