# Organizations Deduplication Report

**Generated:** 2025-10-24 12:18:03

## Summary

- **Total records after deduplication:** 1752
- **Duplicate records removed:** 5
- **Duplicate groups resolved:** 5

## Deduplication Decisions

For each duplicate group, the record with the highest completeness score was kept.

### Bobcat Bonnies

**Decision:** ✅ KEPT Row 204 (score: 8)

- **Type:** unknown
- **Priority:** A
- **Phone:** (none)
- **Location:** ?, MI
- **Notes:** (none)...

**Removed:**

- ❌ Row 206 (score: 8)
  - Type: unknown, Priority: A
  - Location: ?, MI

### Girl in the Goat2

**Decision:** ✅ KEPT Row 201 (score: 53)

- **Type:** customer
- **Priority:** A
- **Phone:** +1-312-492-6262
- **Location:** Chicago, IL
- **Address:** 2429 N Lincoln Ave Chicago, Il
- **Notes:** Type: Fine Dining...

**Removed:**

- ❌ Row 216 (score: 53)
  - Type: customer, Priority: A
  - Location: Chicago, IL

### Gordon Food Service

**Decision:** ✅ KEPT Row 637 (score: 28)

- **Type:** distributor
- **Priority:** A
- **Phone:** (none)
- **Location:** ?, MI
- **Notes:** Type: Distributor...

**Removed:**

- ❌ Row 199 (score: 23)
  - Type: distributor, Priority: A
  - Location: ?, ?

### Sysco

**Decision:** ✅ KEPT Row 24 (score: 33)

- **Type:** customer
- **Priority:** A
- **Phone:** (none)
- **Location:** 39 S Arlington Heights Rd, Elk Grove Village, Il 60007, IL
- **Notes:** Type: Casual...

**Removed:**

- ❌ Row 1631 (score: 8)
  - Type: unknown, Priority: A
  - Location: ?, ?

### Sysco - Chicago DC

**Decision:** ✅ KEPT Row 223 (score: 28)

- **Type:** distributor
- **Priority:** A
- **Phone:** (none)
- **Location:** ?, IL
- **Notes:** Type: Distributor...

**Removed:**

- ❌ Row 1221 (score: 28)
  - Type: distributor, Priority: A
  - Location: ?, IL

## Completeness Scoring Methodology

Records were scored based on data completeness:

- **High-value fields (10 points each):** phone, email, address, website, linkedin_url
- **Medium-value fields (5 points each):** city, state, postal_code, notes
- **Bonus (15 points):** Known organization_type (not 'unknown')
- **Bonus (3 points):** Priority A or B
- **Low-value fields (1 point each):** annual_revenue, employee_count, founded_year, logo_url

The record with the highest score was kept. In case of ties, the first occurrence was kept.

## Next Steps

1. **Review decisions above** to ensure correct records were kept
2. **Proceed with database migration** using `organizations_final.csv`
3. **Run seed script:** `scripts/db/seed_organizations.sql`

**Final CSV location:** `data/csv-files/organizations_final.csv`
