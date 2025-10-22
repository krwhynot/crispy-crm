# Duplicate Organizations Analysis Report

**Generated:** 2025-10-22
**Environment:** Local Supabase Database
**Total Organizations Imported:** 2,025

---

## Executive Summary

The migration revealed significant data quality issues in the source CSV file: **182 unique organization names** appear multiple times, creating **404 duplicate records** in the database.

### Impact on Contact Count

- **Expected contacts:** 1,572 (from source CSV)
- **Actual contacts imported:** 1,797
- **Extra contacts:** 225 (caused by JOIN duplication with multiple org copies)

When contacts are linked to organizations during import, the LEFT JOIN creates a row for each duplicate copy of the organization. For example:
- "Michigan State University" appears 3 times → Each contact at MSU gets linked to all 3 copies → 3x the expected contacts

---

## Duplicate Statistics

| Metric | Count |
|--------|-------|
| **Unique organization names with duplicates** | 182 |
| **Total duplicate organization records** | 404 |
| **Organizations duplicated 5 times** | 1 |
| **Organizations duplicated 4 times** | 4 |
| **Organizations duplicated 3 times** | 29 |
| **Organizations duplicated 2 times** | 148 |

---

## Top 25 Most Duplicated Organizations

| Rank | Organization Name | Copies | Different Cities | Total Contacts |
|------|-------------------|--------|------------------|----------------|
| 1 | **MERRILLVILLE REGIONAL MENTAL HEALTH** | 5 | MERRILLVILLE, South Beloit | 20 |
| 2 | **Faklandia Brewing** | 4 | Chicago, St Francis | 12 |
| 3 | **GOBLIN AND THE GROCER** | 4 | BEVERLY SHORES | 12 |
| 4 | **IVY TECH-E CHICAGO** | 4 | EAST CHICAGO | 16 |
| 5 | **Sassy Mac Boys** | 4 | Durand | 12 |
| 6 | BAY CLIFF HEALTH CAMP | 3 | (empty) | 9 |
| 7 | Double Down Desserts | 3 | (empty) | 9 |
| 8 | DR JOHN WARNER HOSPITAL | 3 | CLINTON | 6 |
| 9 | Golf VX | 3 | Arlington Heights | 6 |
| 10 | HENRY FORD COLLEGE | 3 | (empty) | 9 |
| 11 | Jelka Leedle | 3 | (empty) | 6 |
| 12 | KNIGHTS OF COLUMBUS #1282 | 3 | Dwight, South holland | 6 |
| 13 | LINCOLN LAKE BAPTIST YOUTH CAMP | 3 | (empty) | 9 |
| 14 | LOUHELEN BAHA'I SCHOOL | 3 | (empty) | 9 |
| 15 | Lutherdale | 3 | Elkhorn, Ludington | 9 |
| 16 | MACS | 3 | Elkhorn | 6 |
| 17 | Maple Tree Inn | 3 | Homewood | 9 |
| 18 | MDINING- TEST KITCHEN 689175 | 3 | (empty) | 12 |
| 19 | MICHIGAN STATE POLICE TRAINING DIVI | 3 | (empty) | 12 |
| 20 | **Michigan State University** | 3 | (empty) | 21 |
| 21 | NIVRAM BALMORAL NURSING | 3 | CHICAGO | 6 |
| 22 | Notre Dame-110 South Dining Hall | 3 | (empty) | 6 |
| 23 | PARAMOUNT THEATRE | 3 | (empty) | 6 |
| 24 | RIVERWALK GRILL | 3 | (empty) | 9 |
| 25 | SAGINAW CLUB | 3 | (empty) | 9 |

---

## Root Cause Analysis

### Why Duplicates Exist

The source CSV file (`organizations_cleaned.csv`) contains the same organization name imported multiple times. Common causes:

1. **Different Locations** - Same organization, different cities
   - Example: "MERRILLVILLE REGIONAL MENTAL HEALTH" in both Merrillville and South Beloit
   - Example: "Lutherdale" in both Elkhorn and Ludington

2. **Missing Location Data** - Multiple blank entries for same organization
   - Example: "BAY CLIFF HEALTH CAMP" appears 3 times with no city/address
   - Cannot distinguish which is the "correct" record

3. **Data Entry Errors** - Repeated imports or copy-paste errors
   - Example: "Sassy Mac Boys" appears 4 times (3 with no city, 1 in Durand)

4. **Organizational Structure** - Different departments/locations of same entity
   - Example: "Michigan State University" may represent different departments

---

## Impact on Database

### Storage Impact
- **Extra records:** 404 duplicate organization records
- **Extra contacts:** 225 duplicate contact links
- **Disk space:** Minimal (< 1 MB)

### Data Integrity Impact
- ✅ No data loss - all source data preserved
- ⚠️ Contact relationships ambiguous (linked to multiple org copies)
- ⚠️ Reporting accuracy - counts inflated by duplicates
- ⚠️ Search results - same organization appears multiple times

### User Experience Impact
- Organization dropdown lists show duplicates
- Contact counts per organization are distributed across copies
- Search for "Michigan State University" returns 3 results

---

## Deduplication Strategy Recommendations

### Option 1: Manual Review & Merge (Recommended for High-Value Orgs)

**Best for:** Top 25 duplicates with highest contact counts

**Process:**
1. Review each duplicate set manually
2. Identify the "canonical" record (most complete data)
3. Reassign all contacts to canonical record
4. Delete duplicate org records

**SQL Example:**
```sql
-- For Michigan State University (3 copies: IDs 719, 1779, 1846)
-- Keep ID 719 (priority A, customer type), merge others

-- Reassign contacts
UPDATE contacts SET organization_id = 719
WHERE organization_id IN (1779, 1846);

-- Delete duplicates
DELETE FROM organizations WHERE id IN (1779, 1846);
```

### Option 2: Automated Merge by Priority

**Best for:** Remaining duplicates after manual review

**Logic:**
1. For each duplicate set, identify "best" record:
   - Highest priority (A > B > C > D)
   - Customer type > Unknown > Distributor
   - Most complete data (city, state, address filled)
2. Reassign all contacts to "best" record
3. Delete other copies

**SQL Example:**
```sql
WITH best_orgs AS (
  SELECT DISTINCT ON (name)
    id,
    name
  FROM organizations
  WHERE id > 5
  ORDER BY
    name,
    CASE priority WHEN 'A' THEN 1 WHEN 'B' THEN 2 WHEN 'C' THEN 3 WHEN 'D' THEN 4 ELSE 5 END,
    CASE organization_type WHEN 'customer' THEN 1 WHEN 'distributor' THEN 2 ELSE 3 END,
    CASE WHEN city IS NOT NULL AND city != '' THEN 0 ELSE 1 END,
    id
),
duplicates AS (
  SELECT o.id, o.name, b.id as keep_id
  FROM organizations o
  JOIN best_orgs b ON o.name = b.name
  WHERE o.id > 5 AND o.id != b.id
)
-- Reassign contacts to best org
UPDATE contacts c
SET organization_id = d.keep_id
FROM duplicates d
WHERE c.organization_id = d.id;

-- Then delete duplicate orgs
DELETE FROM organizations o
USING duplicates d
WHERE o.id = d.id;
```

### Option 3: Location-Based Split (For Multi-Location Orgs)

**Best for:** Legitimate multi-location organizations

**Process:**
1. Keep duplicates with different cities
2. Rename to include location: "Michigan State University - East Lansing"
3. Merge duplicates with same city

**Example:**
- "Lutherdale - Elkhorn" (2 copies merged)
- "Lutherdale - Ludington" (separate location, keep)

---

## Detailed Duplicate List

A complete CSV export of all 404 duplicate organization records is available at:

**File:** `data/migration-output/DUPLICATE_ORGANIZATIONS_REPORT.csv`

**Columns:**
- `organization_name` - The duplicate organization name
- `total_copies` - How many times this org appears
- `id` - Database ID for this copy
- `organization_type` - customer/distributor/unknown
- `priority` - A/B/C/D
- `city` - City (if provided)
- `state` - State (if provided)
- `address` - Address (if provided)
- `contact_count` - Number of contacts linked to this copy

---

## Immediate Actions Required

### Short-term (Before Going Live)

1. **Review Top 10 Duplicates**
   - Manually inspect MERRILLVILLE REGIONAL MENTAL HEALTH (5 copies, 20 contacts)
   - Manually inspect Michigan State University (3 copies, 21 contacts)
   - Manually inspect IVY TECH-E CHICAGO (4 copies, 16 contacts)

2. **Create Deduplication Plan**
   - Decide which organizations are truly multi-location vs. data errors
   - Identify canonical records for each duplicate set

3. **Test Deduplication**
   - Run automated merge on 5-10 low-impact duplicates
   - Verify contact reassignment works correctly
   - Check UI behavior after merge

### Long-term (After Launch)

1. **Implement Duplicate Prevention**
   - Add unique constraint on organization name (case-insensitive)
   - Create UI warning when adding similar org names
   - Add deduplication tool in admin panel

2. **Regular Audits**
   - Monthly check for new duplicates
   - Review data import procedures
   - Train users on proper organization entry

---

## SQL Queries for Analysis

### Find All Contacts for a Duplicate Org

```sql
-- All contacts for "Michigan State University"
SELECT c.id, c.name, c.email, c.organization_id
FROM contacts c
JOIN organizations o ON c.organization_id = o.id
WHERE o.name = 'Michigan State University'
ORDER BY c.organization_id, c.name;
```

### Count Contacts per Duplicate Copy

```sql
-- Contact distribution across MSU copies
SELECT
  o.id,
  o.name,
  o.priority,
  o.city,
  COUNT(c.id) as contact_count
FROM organizations o
LEFT JOIN contacts c ON c.organization_id = o.id
WHERE o.name = 'Michigan State University'
GROUP BY o.id, o.name, o.priority, o.city
ORDER BY contact_count DESC;
```

### Preview Merge Impact

```sql
-- What would happen if we merged to org ID 719?
SELECT
  'Before merge' as status,
  COUNT(DISTINCT organization_id) as org_copies,
  COUNT(*) as total_contacts
FROM contacts c
JOIN organizations o ON c.organization_id = o.id
WHERE o.name = 'Michigan State University';

-- After merge (hypothetical)
-- All contacts would have organization_id = 719
-- Would show: org_copies = 1, total_contacts = 21
```

---

## Next Steps

1. **Review this report** and decide on deduplication strategy
2. **Prioritize duplicates** for manual review (start with top 10)
3. **Test merge process** on low-impact duplicates
4. **Create backup** before running bulk deduplication
5. **Execute merge** in stages (10-20 orgs at a time)
6. **Verify results** after each batch

---

## Support Files

- `DUPLICATE_ORGANIZATIONS_REPORT.csv` - Complete list of all 404 duplicate records
- `DATABASE_MIGRATION_COMPLETE.md` - Full migration documentation
- This file - Analysis and recommendations

---

*Generated: 2025-10-22*
*Database: Local Supabase (postgresql://127.0.0.1:54322)*
*Duplicates: 182 unique names, 404 total records*
