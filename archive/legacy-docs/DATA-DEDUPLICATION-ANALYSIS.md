# Data Deduplication Analysis Report

**Date:** November 23, 2025
**Database:** Supabase Cloud (Production)
**Analysis Method:** Browser-based contact dropdown inspection

---

## Executive Summary

Analysis of the contact database reveals **82 duplicate contact names** that are **true duplicates** (same name AND same organization). These represent redundant database entries that should be merged or removed to improve data quality.

**Key Finding:** 100% of duplicate names are at the SAME organization, meaning these are genuine data quality issues, not legitimate contacts with the same name at different companies.

---

## Statistics

| Metric | Value |
|--------|-------|
| Total Contacts Analyzed | 1,000+ |
| Unique Contact Names | 910 |
| Names with Duplicates | 82 |
| Contacts Appearing 3x | 8 |
| Contacts Appearing 2x | 74+ |
| Different-Org Duplicates | 0 |

---

## High-Priority Duplicates (3+ Entries)

These contacts have 3 or more duplicate entries and should be prioritized for cleanup:

| Contact Name | Company | Count |
|-------------|---------|-------|
| Abby Smith | BAY CLIFF HEALTH CAMP | 3 |
| Chris Mcleish | RIVERWALK GRILL | 3 |
| **Daniell Green** | **Yoders Country Market** | **3** |
| Danna.Coleman@Rhs.Care | MERRILLVILLE REGIONAL MENTAL HEALTH | 3 |
| Findfaklandia@Gmail.Com | Faklandia Brewing | 3 |
| Jesse Mullens | Troy Escape | 3 |
| John Beem | SAGINAW CLUB | 3 |
| Johnathon Thompson | HENRY FORD COLLEGE | 3 |

---

## Medium-Priority Duplicates (2 Entries)

First 30 of 74+ contacts with 2 duplicate entries:

| Contact Name | Company |
|-------------|---------|
| Adam Macmillan | EMBASSY BAR & GRILL |
| Alexander Ausley | CDS - Miracle Camp and Retreat Cent |
| Alonso@Matrixvenue.Com | The Matrix Room |
| Andrew Hubbell | Yancey's Gastropub and Brewery |
| Andrew Wright | BSA-COLE CANOE |
| Anthony.Lacroix@Warnerhospital.Org | DR JOHN WARNER HOSPITAL |
| Baldsilentbob70@Yahoo.Com | GOBLIN AND THE GROCER |
| Barry Brown | Gordon Food Service |
| Bev Stange | BENS SUPERCENTER |
| Bill Wilson | Daybreak Cafe |
| Brady Cohen | Planks Tavern on the Water |
| Brandi Sarver | Towneplace Suites Ann Arbor |
| Brent Overmyer | Double Down Desserts |
| Bret Klun | KEYS (THE) |
| Brian Paul | CAMP BLODGETT |
| Brian Perrone | SLOW'S TO GO 002 |
| Brian Smith | Treetops - Top Of Hill |
| Bryan Lewis | The Village at Pine Valley |
| Caden Fulkerson | CAMP CO-BE-AC |
| Caitlyn@Macandcheeseshop.Com | MACS |
| Carolyn Peruski | HOG'S BACK FOOD CO-OP |
| Chad Bruinslott | Gordon Food Service |

---

## Root Cause Analysis

### Likely Causes of Duplicates

1. **CSV Import Without Deduplication**
   - Multiple imports of the same data source
   - No duplicate checking during import process

2. **Manual Entry Without Search**
   - Users creating new contacts without searching existing records
   - Inconsistent data entry procedures

3. **Data Migration Issues**
   - Historical data merged without deduplication
   - Multiple source systems consolidated

4. **Email-Based Names**
   - Several duplicates use email addresses as names (e.g., `Danna.Coleman@Rhs.Care`)
   - Suggests automated import without name parsing

---

## Recommended Cleanup Strategy

### Phase 1: Automated Detection (Immediate)

Create a database view to identify duplicates:

```sql
-- Create view for duplicate detection
CREATE OR REPLACE VIEW contact_duplicates AS
WITH duplicate_groups AS (
  SELECT
    LOWER(TRIM(first_name)) || ' ' || LOWER(TRIM(last_name)) as full_name,
    organization_id,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY created_at ASC) as contact_ids,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
  FROM contacts
  GROUP BY
    LOWER(TRIM(first_name)) || ' ' || LOWER(TRIM(last_name)),
    organization_id
  HAVING COUNT(*) > 1
)
SELECT
  dg.*,
  o.name as organization_name,
  -- First ID is the "keeper", rest should be merged/deleted
  dg.contact_ids[1] as keeper_id,
  dg.contact_ids[2:] as merge_ids
FROM duplicate_groups dg
LEFT JOIN organizations o ON o.id = dg.organization_id
ORDER BY duplicate_count DESC, full_name;
```

### Phase 2: Safe Merge Script

```sql
-- Function to merge duplicate contacts
-- Keeps the oldest record, transfers relationships, deletes duplicates
CREATE OR REPLACE FUNCTION merge_duplicate_contacts(
  keeper_id BIGINT,
  duplicate_ids BIGINT[]
) RETURNS void AS $$
BEGIN
  -- Transfer interactions to keeper
  UPDATE interactions
  SET contact_id = keeper_id
  WHERE contact_id = ANY(duplicate_ids);

  -- Transfer tasks to keeper
  UPDATE tasks
  SET contact_id = keeper_id
  WHERE contact_id = ANY(duplicate_ids);

  -- Transfer opportunities to keeper (if contact-based)
  UPDATE opportunities
  SET contact_id = keeper_id
  WHERE contact_id = ANY(duplicate_ids);

  -- Delete duplicates
  DELETE FROM contacts WHERE id = ANY(duplicate_ids);
END;
$$ LANGUAGE plpgsql;
```

### Phase 3: Prevention (CSV Import Enhancement)

Add duplicate detection to CSV upload:

```typescript
// In csvUploadValidator.ts
export async function checkForDuplicates(
  contacts: ContactRow[],
  existingContacts: Contact[]
): DuplicateReport {
  const duplicates: DuplicateMatch[] = [];

  for (const newContact of contacts) {
    const normalizedName = `${newContact.first_name} ${newContact.last_name}`
      .toLowerCase().trim();

    const matches = existingContacts.filter(existing => {
      const existingName = `${existing.first_name} ${existing.last_name}`
        .toLowerCase().trim();
      return existingName === normalizedName
        && existing.organization_id === newContact.organization_id;
    });

    if (matches.length > 0) {
      duplicates.push({
        newContact,
        existingMatches: matches,
        action: 'skip' | 'merge' | 'create_anyway'
      });
    }
  }

  return { duplicates, cleanContacts: contacts.filter(/* ... */) };
}
```

---

## UI Improvements (Completed)

The following UI improvement has been implemented to help users identify duplicates:

**Contact Dropdown Enhancement** (`QuickLogForm.tsx`)
- Contact dropdown now shows company name below each contact name
- Makes duplicates visually obvious (e.g., "Daniell Green" at "Yoders Country Market" appears 3x)
- Helps users select the correct contact

---

## Recommended Actions

### Immediate (Admin)
1. [ ] Review the 8 high-priority duplicates (3+ entries each)
2. [ ] Decide merge strategy (keep oldest? most complete?)
3. [ ] Back up database before any cleanup

### Short-term (Development)
1. [ ] Create `contact_duplicates` view for ongoing monitoring
2. [ ] Add duplicate warning to CSV import flow
3. [ ] Consider adding "Merge Contacts" admin feature

### Long-term (Prevention)
1. [ ] Add unique constraint on (normalized_name, organization_id)?
2. [ ] Implement fuzzy matching for near-duplicates
3. [ ] Add duplicate detection to manual contact creation form

---

## Appendix: SQL Queries for Cleanup

### Find All Duplicates
```sql
SELECT
  CONCAT(first_name, ' ', last_name) as full_name,
  o.name as organization,
  COUNT(*) as count,
  array_agg(c.id ORDER BY c.created_at) as ids
FROM contacts c
LEFT JOIN organizations o ON o.id = c.organization_id
GROUP BY CONCAT(first_name, ' ', last_name), o.name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;
```

### Count Total Duplicate Records
```sql
SELECT
  SUM(cnt - 1) as total_duplicate_records,
  COUNT(*) as duplicate_groups
FROM (
  SELECT COUNT(*) as cnt
  FROM contacts
  GROUP BY
    LOWER(TRIM(first_name)) || ' ' || LOWER(TRIM(last_name)),
    organization_id
  HAVING COUNT(*) > 1
) sub;
```

### Safe Delete Preview (DRY RUN)
```sql
-- Shows which records WOULD be deleted (keeps oldest)
WITH duplicates AS (
  SELECT
    id,
    first_name,
    last_name,
    organization_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY
        LOWER(TRIM(first_name)) || ' ' || LOWER(TRIM(last_name)),
        organization_id
      ORDER BY created_at ASC
    ) as rn
  FROM contacts
)
SELECT id, first_name, last_name, organization_id, created_at
FROM duplicates
WHERE rn > 1
ORDER BY first_name, last_name;
```

---

*Report generated as part of Quick Logger data quality analysis*
