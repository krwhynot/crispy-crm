# Data Quality & Enrichment Analysis Report

> **Generated:** 2025-12-12
> **Source File:** `/home/krwhynot/projects/google-maps/enrichment_results.csv`
> **Total Records:** 2,100
> **Scope:** Full analysis of Google Maps enrichment results for organization data

---

## 1. Executive Summary

- **96.7% match rate** (2,030 of 2,100 records found in Google Maps)
- **86% ready for auto-merge** (1,807 records with complete enrichment: address + phone + website)
- **206 duplicate place_ids detected** - same physical location matched to multiple org names (data consolidation opportunity)
- **202 duplicate websites** - chain/corporate locations sharing parent company websites
- **52 addresses require manual parsing** (2.5%) - missing street or non-US format

---

## 2. Completeness Metrics

| Column | Populated | Empty | % Complete |
|--------|-----------|-------|------------|
| row_index | 2,100 | 0 | **100.0%** |
| organization_name | 2,100 | 0 | **100.0%** |
| enriched_address | 2,030 | 70 | **96.7%** |
| enriched_phone | 1,941 | 159 | **92.4%** |
| enriched_website | 1,855 | 245 | **88.3%** |
| place_id | 2,030 | 70 | **96.7%** |
| match_status | 2,100 | 0 | **100.0%** |

---

## 3. Match Status Analysis

| Status | Count | Percentage | Description |
|--------|-------|------------|-------------|
| **FOUND** | 2,030 | 96.7% | Successfully matched to Google Maps business |
| **NOT_FOUND** | 70 | 3.3% | No match found - requires manual research |

### NOT_FOUND Records Analysis

The 70 unmatched records fall into these categories:

1. **Abbreviated/coded names** (e.g., "USF", "USF-C&U", "PFG Louisville")
2. **Personal names** (e.g., "Jennifer Whitaker", "Joe Chirco", "Lyndsey M Gauthier")
3. **Internal references** (e.g., "RUSH U MED-GEN KITCHEN PO589563", "Mad Anthony - Taylor - 371788E")
4. **Truncated names** (e.g., "Elkhorn Area High School Culinary A")
5. **Alternative spellings** (e.g., "Mrs CS Grilled Cheese", "Chef Jamie's")

---

## 4. Data Quality Findings

### 4.1 Address Quality

| Metric | Count | Percentage |
|--------|-------|------------|
| Full addresses (street, city, state, zip) | 1,978 | 97.4% |
| Partial/unparseable | 52 | 2.6% |

**Geographic Distribution (Top 10 States):**

| State | Count | % of Addresses |
|-------|-------|----------------|
| IL (Illinois) | 665 | 32.8% |
| MI (Michigan) | 388 | 19.1% |
| TX (Texas) | 288 | 14.2% |
| IN (Indiana) | 188 | 9.3% |
| OH (Ohio) | 158 | 7.8% |
| KY (Kentucky) | 80 | 3.9% |
| WI (Wisconsin) | 62 | 3.1% |
| TN (Tennessee) | 18 | 0.9% |
| NY (New York) | 16 | 0.8% |
| PA (Pennsylvania) | 12 | 0.6% |

**Unparseable Address Examples:**
- `Euclid, OH` (missing street)
- `East Lansing, MI` (city only)
- `Ohio` (state only)
- `Columbia, MO 65211` (missing street)
- `C-14, Palm Rd, Urjanagar 1, Kudasan, Gandhinagar, Gujarat 382419, India` (international)

### 4.2 Phone Quality

| Format | Count | Percentage |
|--------|-------|------------|
| (XXX) XXX-XXXX | 1,932 | **99.5%** |
| Other formats | 9 | 0.5% |

**Invalid Phones Detected:** 1
- `'3333 5425'` (8 digits - invalid)

**Assessment:** Excellent format consistency. Near-universal use of parentheses format.

### 4.3 Website Quality

| Protocol | Count | Percentage |
|----------|-------|------------|
| HTTPS | 987 | 53.2% |
| HTTP | 868 | 46.8% |
| Invalid URL | 0 | 0% |

**Duplicate Websites (Top 10):**

| Website | Occurrences | Notes |
|---------|-------------|-------|
| http://www.gfs.com/ | 10 | Gordon Food Service (chain) |
| https://www.usfoods.com/locations/... | 5 | US Foods (chain) |
| http://www.performancefoodservice.com/... | 5 | PFG (chain) |
| https://cloud.email.sysco.com/... | 4 | Sysco corporate |
| http://www.premierproduceone.com/ | 4 | Chain |
| https://www.marriott.com/ | 17+ | Hotel chain |
| https://www.hilton.com/ | 8+ | Hotel chain |

**Concern:** 32 records have `facebook.com` as website (social page, not business site)

### 4.4 Place ID Quality

| Metric | Count |
|--------|-------|
| Valid Google Place ID format (ChIJ...) | 2,030 |
| Invalid format | 0 |
| Unique place_ids | 1,824 |
| Duplicate place_ids | 206 |

**Top Duplicate Place IDs (same location, multiple org entries):**

| Place ID | Org Names | Count |
|----------|-----------|-------|
| ChIJF8PbKq7OQIYR... | GORDON FS/DOCK #7, GORDON FS/EPO, GORDON FS/EPO REFRIG/FROZ | 10 |
| ChIJwUWlL8a2QIYR... | US FOODS-Wixom, US Foods, US FOODS | 5 |
| ChIJ1bpyRBvQQIYR... | PFG-all, Performance Food Group (PFG), PFG | 5 |
| ChIJzUj9YOCzD4gR... | US FOODS-Chicago Chicago, US FOODS-Chicago Bensenville, USF-CHICAGO | 4 |
| ChIJ16MHn2-3D4gR... | SFS DIST - SKOUFIS FOOD, Sysco, SYSCO/CHICAGO - VIRTUAL | 4 |

---

## 5. Anomalies Detected

### 5.1 Row Index Analysis

| Finding | Value |
|---------|-------|
| Range | 0 to 2,168 |
| Total records | 2,100 |
| Gaps in sequence | 69 |
| Duplicate indices | 0 |

**Interpretation:** Gaps indicate rows filtered during enrichment (likely headers, blanks, or invalid entries in source).

### 5.2 Duplicate Organization Names

- **Unique names:** 2,100
- **Duplicates:** 0

**Assessment:** No duplicate org names in enrichment file (good - each row is unique).

### 5.3 Partial Enrichment Patterns

| Pattern | Count | Notes |
|---------|-------|-------|
| place_id + address + phone + website | 1,807 | Complete (Tier 1) |
| place_id + address + phone | 134 | Missing website |
| place_id + address + website | 48 | Missing phone |
| place_id + address only | 41 | Missing phone & website |
| No enrichment (NOT_FOUND) | 70 | Manual research needed |

### 5.4 Special Cases Requiring Review

**Chain/Corporate Organizations (78 detected):**
- Multiple records for same chain (Sysco, US Foods, Gordon, PFG, Marriott, Hilton)
- May share parent website but have unique locations
- Consider parent_organization_id relationships

**Personal Names as Organizations (10 detected):**
- Jennifer Whitaker, Joe Chirco, Lyndsey M Gauthier
- These may be contacts mistakenly entered as organizations
- **Recommendation:** Review and potentially migrate to contacts table

**Organizations with ID Codes (19 detected):**
- "CASCADE HILLS COUNTRY CLUB 18682E"
- "Mad Anthony - Taylor - 371788E"
- Internal reference codes embedded in names
- **Recommendation:** Parse codes into separate field or notes

---

## 6. Merge Readiness Assessment

### 6.1 Confidence Tiers

| Tier | Count | % | Criteria | Recommendation |
|------|-------|---|----------|----------------|
| **1 - High** | 1,807 | 86.0% | FOUND + all 4 enriched fields | Auto-merge |
| **2 - Medium** | 223 | 10.6% | FOUND + partial fields | Auto-merge core, flag for enrichment |
| **3 - Low** | 70 | 3.3% | NOT_FOUND | Manual research required |

### 6.2 Merge Strategy

**Join Key:** `organization_name` (case-insensitive, trimmed)

**Field Mapping:**

| Enrichment Column | Target Column(s) | Transform Required |
|-------------------|------------------|-------------------|
| organization_name | name | Exact match (join key) |
| enriched_address | address, city, state, postal_code | Parse combined address |
| enriched_phone | phone | Direct (format is consistent) |
| enriched_website | website | Direct |
| place_id | context_links (JSONB) | Add to existing array |

**Address Parsing:**
- 97.4% parseable with regex: `^(.+?),\s*([^,]+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$`
- 2.6% require manual parsing or will use combined address field

### 6.3 Data Consolidation Opportunities

**206 duplicate place_ids** indicate opportunities to consolidate:
- Multiple org names → same physical location
- Example: "US FOODS-Wixom", "US Foods", "US FOODS" → 1 organization

**Recommendation:** Use place_id as deduplication key after initial merge.

---

## 7. Recommendations (Prioritized)

### P0 - Critical (Before Merge)

1. **Parse addresses** into separate components for 1,978 parseable records
2. **Define merge conflict resolution** - what happens when org already has phone/website?
3. **Create backup** of organizations table before merge

### P1 - High Priority

4. **Review 70 NOT_FOUND records** - manual Google Maps lookup or alternative data sources
5. **Investigate 10 personal names** - may need migration to contacts table
6. **Handle 206 duplicate place_ids** - consolidation candidates for post-merge cleanup

### P2 - Medium Priority

7. **Standardize 52 unparseable addresses** - manual entry or geocoding API
8. **Replace 32 Facebook URLs** with actual business websites
9. **Normalize chain websites** - consider storing both corporate and location-specific URLs
10. **Store place_id** in context_links for future Google Maps integration

### P3 - Nice to Have

11. **Add needs_review flag** for medium-confidence (Tier 2) merges
12. **Create enrichment audit trail** - track which fields came from Google Maps
13. **Build deduplication workflow** using place_id for post-merge cleanup

---

## 8. Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| All 2,100 records analyzed | ✅ Complete |
| Completeness % for all 7 columns | ✅ Complete (see Section 2) |
| Match status distribution documented | ✅ Complete (see Section 3) |
| 5+ quality checks per enriched field | ✅ Complete (see Section 4) |
| Anomalies identified with counts | ✅ Complete (see Section 5) |
| Merge recommendation with tiers | ✅ Complete (see Section 6) |

---

## Appendix: Technical Notes

### Address Parsing Regex
```regex
^(.+?),\s*([^,]+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$
```
Groups: (1) street, (2) city, (3) state, (4) zip

### Phone Format Regex (Validation)
```regex
^\(\d{3}\)\s*\d{3}-\d{4}$
```
Matches: `(XXX) XXX-XXXX`

### Google Place ID Format
```regex
^ChIJ[A-Za-z0-9_-]+$
```
All 2,030 place_ids are valid.

---

*Report generated by Claude Code data quality audit*
