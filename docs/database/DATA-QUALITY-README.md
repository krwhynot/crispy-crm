# Data Quality Analysis Guide

**Atomic CRM Database Gap Analysis**
**Generated:** 2025-10-31
**Purpose:** Analyze gaps between database structure and UI implementation

---

## 📋 Overview

This document explains how to use the `data-quality-analysis.sql` queries to understand:

1. **Which database fields are unused** (NULL analysis)
2. **Data completeness metrics** (how much data you have)
3. **UI-database alignment gaps** (features in DB but not exposed in UI)
4. **Data quality issues** (missing required fields, inconsistent data)

The queries are organized into **8 sections** covering different aspects of data quality.

---

## 🚀 Quick Start

### Run All Queries

```bash
# From project root:
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f docs/database/data-quality-analysis.sql
```

**Note:** Make sure your local Supabase instance is running (`npm run db:local:start`)

### Run Individual Sections

The SQL file uses `\echo` commands to output section headers. You can run specific sections by extracting them:

```bash
# Run only Section 1 (NULL field analysis):
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT 'address (NULL)' as metric, ...
FROM contacts WHERE deleted_at IS NULL;
"
```

---

## 📊 Section Breakdown

### Section 1: NULL Field Analysis

**Purpose:** Identifies which database columns are rarely or never used

**Key Queries:**
- `1.1 Contacts: NULL Field Distribution` - Shows which contact fields are empty
- `1.2 Organizations: Financial Data Gaps` - Highlights missing revenue/employee count
- `1.3 Opportunities: Unused Fields` - Fields in DB but not in UI forms
- `1.4 Products: Field Completeness` - Product data quality

**Sample Output:**
```
metric                        | count | percentage
------------------------------|-------|------------
Total Active Contacts         | 2013  | 100%
address (NULL)                | 1950  | 96.9%
birthday (NULL)               | 2013  | 100.0%
gender (NULL)                 | 2013  | 100.0%
```

**Interpretation:**
- **96.9%** of contacts are missing address → Consider adding AddressInputs to UI
- **100%** birthday/gender missing → Decide if these fields are needed

### Section 2: JSONB Usage Patterns

**Purpose:** Analyzes how JSONB fields (email, phone, context_links) are being used

**Key Queries:**
- `2.1 Contact Email/Phone Arrays` - How many contacts have emails/phones?
- `2.2 Organization Context Links` - Usage of context_links JSONB array
- `2.3 Product Nutritional Info` - Population rate of nutritional_info JSONB

**Sample Output:**
```
metric                          | count | percentage
-------------------------------|-------|------------
Contacts with emails           | 2000  | 99.4%
Contacts with NO emails        | 13    | 0.6%
Average emails per contact     | 1.2   | -
```

**Interpretation:**
- **99.4%** have email → Good! Email is well-populated
- **0.6%** missing email → Could be data quality issue or incomplete imports

### Section 3: Array Field Usage Analysis

**Purpose:** Examines PostgreSQL array columns (tags, certifications, allergens)

**Key Queries:**
- `3.1 Contact Tags` - How many contacts are tagged? Top 10 tags?
- `3.2 Opportunity Contact IDs` - Contact association statistics
- `3.3 Product Certifications/Allergens` - Food safety data completeness

**Sample Output:**
```
tag              | usage_count | percentage_of_contacts
-----------------|-------------|------------------------
vip              | 150         | 7.5%
cold_lead        | 89          | 4.4%
decision_maker   | 75          | 3.7%
```

**Interpretation:**
- Tags are being used for segmentation
- Most common tag: "vip" (7.5% of contacts)
- Consider exposing tag filtering in UI

### Section 4: Enum Type Distributions

**Purpose:** Shows distribution of enum values and identifies data quality issues

**Key Queries:**
- `4.1 Organization Types` - **⚠️ CRITICAL:** Shows 757 (41.8%) are "unknown"
- `4.2 Opportunity Pipeline` - Stage/status/priority distribution
- `4.3 Product Status` - Active vs. discontinued breakdown

**Sample Output:**
```
organization_type | count | percentage | status
------------------|-------|------------|-------------------------
unknown           | 757   | 41.8%      | ⚠️ NEEDS CLASSIFICATION
customer          | 631   | 34.9%      | ✓ Classified
distributor       | 287   | 15.9%      | ✓ Classified
```

**Interpretation:**
- **41.8%** of organizations need classification
- Export to CSV for manual review (Section 8.1)
- High-priority fix (see Section 7.2)

### Section 5: Relationship Integrity

**Purpose:** Verifies foreign key relationships and identifies orphaned records

**Key Queries:**
- `5.1 Contacts Without Organizations` - How many contacts lack org linkage?
- `5.2 Opportunities Organization Linkage` - 3-tier distribution chain coverage
- `5.3 Product-Principal Linkage` - Product-manufacturer relationships
- `5.4 Junction Table Consistency` - Verifies array ↔ junction sync

**Sample Output:**
```
metric                                | count | percentage
--------------------------------------|-------|------------
Contacts with organization            | 1800  | 89.4%
Contacts WITHOUT organization         | 213   | 10.6%
```

**Interpretation:**
- **10.6%** of contacts are not linked to organizations
- May be acceptable (individual contacts) or data quality issue

### Section 6: Full-Text Search Readiness

**Purpose:** Verifies that `search_tsv` columns are properly maintained for full-text search

**Key Queries:**
- `6.1 Search TSVector Population` - Checks if tsvector is NULL (should be 0%)
- Sample search_tsv content - Shows what's indexed

**Sample Output:**
```
table_name    | total_records | with_search_tsv | population_rate
--------------|---------------|-----------------|----------------
contacts      | 2013          | 2013            | 100%
organizations | 1809          | 1809            | 100%
```

**Interpretation:**
- ✅ **100%** population rate → Full-text search infrastructure is ready
- 🔴 **But not exposed in UI!** → Add `<SearchInput source="q" />` to filters

### Section 7: Data Quality Score Summary

**Purpose:** Generates overall quality scores and prioritized fix list

**Key Queries:**
- `7.1 Overall Completeness Score` - Graded data quality per entity
- `7.2 Prioritized Fix List` - **⭐ MOST IMPORTANT** - What to fix first

**Sample Output:**
```
priority | issue                                  | affected_records | impact_score | recommended_action
---------|---------------------------------------|------------------|--------------|-------------------
1        | 757 organizations classified as       | 757              | 95           | Classify organizations by
         | "unknown"                             |                  |              | reviewing websites/context
2        | Full-text search not exposed in UI    | 2013             | 85           | Add SearchInput to List
         |                                       |                  |              | filters (2 hour fix)
3        | No Activity CRUD interface            | (varies)         | 80           | Build ActivityList/Show/
         |                                       |                  |              | Edit/Create components
```

**Impact Score Explanation:**
- **90-100:** Critical - Fix immediately
- **70-89:** High - Fix soon
- **50-69:** Medium - Fix when convenient
- **< 50:** Low - Nice to have

### Section 8: Export-Ready Queries

**Purpose:** Pre-formatted queries for CSV export to facilitate bulk updates

**Key Queries:**
- `8.1 Organizations Needing Classification` - Top 50 unclassified orgs
- `8.2 Contacts Missing Address Data` - Export for bulk address update
- `8.3 Organizations Missing Financial Data` - Revenue/employee enrichment

**How to Export to CSV:**
```bash
# Export unclassified organizations
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT id, name, website, organization_type, 'UPDATE HERE' as suggested_type
FROM organizations
WHERE deleted_at IS NULL AND organization_type = 'unknown'
LIMIT 50;
" --csv > unclassified_orgs.csv

# Or using \copy within psql:
\copy (SELECT ... FROM organizations ...) TO 'unclassified_orgs.csv' CSV HEADER
```

**Workflow:**
1. Export CSV
2. Manually review and fill in `suggested_type` column
3. Import back with bulk UPDATE or import tool
4. Re-run Section 4.1 to verify improvement

---

## 📈 Recommended Workflow

### Initial Analysis

1. **Run full analysis** to understand current state:
   ```bash
   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
     -f docs/database/data-quality-analysis.sql > data_quality_report.txt
   ```

2. **Review prioritized fix list** (Section 7.2):
   - Focus on impact_score > 80 first
   - Quick wins: Full-text search UI exposure (2 hours)
   - High value: Classify 757 "unknown" organizations

3. **Export CSVs for manual work** (Section 8):
   - `unclassified_orgs.csv` - Top priority
   - `orgs_missing_financial.csv` - For enrichment
   - `contacts_missing_address.csv` - If needed

### Ongoing Monitoring

**Weekly:**
- Run Section 7.1 (Overall Completeness Score)
- Track data quality score trends
- Celebrate improvements!

**Monthly:**
- Run full analysis
- Update prioritized fix list
- Review new gaps as features are added

**Before Releases:**
- Run full analysis
- Fix critical issues (impact_score > 90)
- Document known gaps in release notes

---

## 🎯 Quick Wins (Low Effort, High Impact)

Based on the analysis, here are the quickest improvements:

### 1. Expose Full-Text Search (2 hours)

**Impact Score:** 85
**Effort:** 2 hours

```typescript
// Add to ContactListFilter.tsx, OrganizationListFilter.tsx:
<SearchInput
  source="q"
  alwaysOn
  placeholder="Search name, email, title, company..."
/>
```

### 2. Add Contact Address Fields (3 hours)

**Impact Score:** 50
**Effort:** 3 hours

```typescript
// Add to ContactEdit.tsx:
<AddressInputs>
  <TextInput source="address" fullWidth />
  <Grid container spacing={2}>
    <Grid item xs={6}><TextInput source="city" /></Grid>
    <Grid item xs={3}><TextInput source="state" /></Grid>
    <Grid item xs={3}><TextInput source="postal_code" /></Grid>
  </Grid>
  <TextInput source="country" fullWidth />
</AddressInputs>
```

### 3. Classify Unknown Organizations (4-8 hours)

**Impact Score:** 95
**Effort:** 4-8 hours (manual work)

```bash
# Export for manual review:
psql ... -c "SELECT ... FROM organizations WHERE organization_type = 'unknown' ..." > unclassified.csv

# Review manually, then bulk update:
UPDATE organizations SET organization_type = 'customer' WHERE id IN (...);
```

---

## 🔍 Interpreting Results

### Good Data Quality Indicators

✅ **Email coverage > 95%** - Core contact info is complete
✅ **search_tsv 100% populated** - Full-text search ready
✅ **No orphaned FKs** - Relationship integrity maintained
✅ **Enum fields classified** - Less than 10% "unknown" or NULL

### Warning Signs

⚠️ **> 40% NULL on required fields** - May need UI or import fixes
⚠️ **> 20% "unknown" enum values** - Classification workflow needed
⚠️ **Junction table mismatches** - Sync logic may be broken
⚠️ **search_tsv NULL** - Triggers not firing, search won't work

### Critical Issues

🔴 **100% NULL on UI fields** - Field may need removal or UI addition
🔴 **0 records in junction table** - Feature not being used
🔴 **FK integrity violations** - Data corruption possible

---

## 💡 Advanced Usage

### Combining with git

Track data quality improvements over time:

```bash
# Run analysis and commit results
psql ... -f data-quality-analysis.sql > data_quality_$(date +%Y%m%d).txt
git add data_quality_*.txt
git commit -m "chore: data quality snapshot $(date +%Y-%m-%d)"

# Compare improvements:
diff data_quality_20250101.txt data_quality_20250131.txt
```

### Custom Filters

Modify queries for specific analysis:

```sql
-- Contacts in California missing addresses
SELECT id, name, email, state
FROM contacts
WHERE deleted_at IS NULL
  AND state = 'CA'
  AND (address IS NULL OR address = '')
LIMIT 100;

-- High-value organizations missing financial data
SELECT id, name, organization_type
FROM organizations
WHERE deleted_at IS NULL
  AND organization_type = 'customer'
  AND annual_revenue IS NULL
ORDER BY (SELECT COUNT(*) FROM contacts WHERE organization_id = organizations.id) DESC
LIMIT 50;
```

### Integration with BI Tools

Export to CSV and import into:
- **Tableau/Power BI** - Dashboards for stakeholders
- **Google Sheets** - Collaborative manual reviews
- **Airtable** - Data enrichment workflows

---

## 🛠️ Troubleshooting

### "relation does not exist" error

**Problem:** Table name case sensitivity
**Solution:** All table names are lowercase (e.g., `contacts` not `Contacts`)

### "permission denied" error

**Problem:** Not connected to correct database
**Solution:** Verify connection string includes correct port (54322 for local)

### Zero opportunities shown

**Problem:** No opportunity data in local database
**Solution:** Expected if this is a fresh import. Check production database instead.

### JSONB queries slow

**Problem:** Large JSONB arrays without GIN indexes
**Solution:** Already have GIN indexes. If slow, check query EXPLAIN plan.

---

## 📚 Related Documentation

- [UI-Database Comparison Report](../UI-DATABASE-COMPARISON.md) - Full architectural analysis
- [Database Workflow Guide](supabase/WORKFLOW.md) - How to make schema changes
- [Engineering Constitution](claude/engineering-constitution.md) - Data validation principles

---

## ✅ Summary

This data quality analysis reveals:

1. **85% overall alignment** between UI and database
2. **757 organizations need classification** (highest priority)
3. **Full-text search ready** but not exposed in UI (quick win)
4. **Most JSONB/array fields working correctly**
5. **Several valuable fields unused** (address, financial data)

**Next Steps:**
1. Review Section 7.2 (Prioritized Fix List)
2. Implement quick wins (2-3 hours total)
3. Export CSVs for manual enrichment
4. Track improvements weekly

**Questions?** Review the comprehensive UI-Database comparison report for architectural context.
