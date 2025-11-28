# Data Migration Plan

**Status:** TODO - Pending definition before launch
**Last Updated:** 2025-11-28
**Owner:** TBD

> This document is referenced by PRD v1.20 Section 1.3 (Launch Readiness Criteria). All sections must be completed before MVP launch.

---

## 1. Source Definition

**Primary Source:** Master Excel spreadsheet (location TBD)

| Question | Answer |
|----------|--------|
| File location | TODO |
| Sheet names | TODO |
| Last updated | TODO |
| Row count estimate | TODO |
| Current year filter criteria | TODO |

---

## 2. Field Mapping

### 2.1 Organizations

| Excel Column | CRM Field | Transform | Validation |
|--------------|-----------|-----------|------------|
| TODO | `name` | None | Required, non-empty |
| TODO | `type` | Map to enum | principal/distributor/customer |
| TODO | `segment` | Map to enum | See PRD Appendix D.3 |

### 2.2 Contacts

| Excel Column | CRM Field | Transform | Validation |
|--------------|-----------|-----------|------------|
| TODO | `first_name` | None | Required |
| TODO | `last_name` | None | Required |
| TODO | `email` | JSONB array | Email format |
| TODO | `organization_id` | Lookup by name | Must exist |

### 2.3 Opportunities

| Excel Column | CRM Field | Transform | Validation |
|--------------|-----------|-----------|------------|
| TODO | `principal_id` | Lookup | Must exist |
| TODO | `customer_id` | Lookup | Must exist |
| TODO | `stage` | Map to 7-stage enum | See Section 4 |
| TODO | `primary_account_manager_id` | Lookup by name | Must exist in sales table |

---

## 3. Dedupe Rules

### 3.1 Organizations
- **Exact match:** Same name (case-insensitive) + same type = skip/update
- **Fuzzy match:** Levenshtein distance <= 3 = flag for manual review

### 3.2 Contacts
- **Exact match:** Same email = skip/update existing
- **Fuzzy match:** Same name + same org = flag for manual review

### 3.3 Opportunities
- **Exact match:** Same principal + customer + product = skip
- **Handling:** Log duplicates to error report

---

## 4. Stage Migration (8 → 7 Stages)

The PRD specifies 7 pipeline stages. If source data uses different stages:

| Source Stage | Target Stage | Notes |
|--------------|--------------|-------|
| TODO | `new_lead` | |
| TODO | `initial_outreach` | |
| TODO | `sample_visit_offered` | |
| TODO | `feedback_logged` | |
| TODO | `demo_scheduled` | |
| TODO | `closed_won` | |
| TODO | `closed_lost` | |
| `awaiting_response` | `sample_visit_offered` | Consolidated per PRD v1.17 |

---

## 5. Owner Assignment Logic

| Scenario | Assignment Rule |
|----------|-----------------|
| Opportunity has rep name | Lookup `sales.display_name`, assign `sales.id` |
| Rep name not found | Assign to Admin user, log warning |
| No rep specified | Assign to Admin user |
| Contact/Org creation | `created_by` = import user (Admin) |

---

## 6. Validation Rules

### Pre-Import Validation
- [ ] All required columns present
- [ ] No empty required fields
- [ ] Email format valid
- [ ] Dates parseable
- [ ] Stage values mappable

### Post-Import Validation
- [ ] Record counts match (minus skipped)
- [ ] All foreign keys resolve
- [ ] No orphan contacts (all have org)
- [ ] Sample opportunities display correctly

---

## 7. Test/Rollback Strategy

### Test Run
1. Import to staging environment first
2. Verify record counts
3. Spot-check 10 random records per entity
4. Verify dashboard displays correctly
5. Test search/filter functionality

### Rollback Plan
```sql
-- If import fails, truncate imported data
-- Run BEFORE any manual data entry begins

TRUNCATE TABLE opportunities CASCADE;
TRUNCATE TABLE contacts CASCADE;
TRUNCATE TABLE organizations CASCADE;

-- Reset sequences
ALTER SEQUENCE opportunities_id_seq RESTART WITH 1;
ALTER SEQUENCE contacts_id_seq RESTART WITH 1;
ALTER SEQUENCE organizations_id_seq RESTART WITH 1;
```

### Point of No Return
Once users begin entering new data, rollback requires:
1. Export new data entered post-import
2. Run rollback
3. Re-import with fixes
4. Manually re-enter or re-import new data

---

## 8. Import Script Location

**Script:** `scripts/import/migrate_excel.ts` (TODO: create)

**Usage:**
```bash
# Dry run (validate only)
npm run migrate:dry-run -- --file=path/to/excel.xlsx

# Production run
npm run migrate -- --file=path/to/excel.xlsx
```

---

## 9. Error Report Format

Import generates `migration_errors_YYYYMMDD.csv`:

| Row | Entity | Field | Error | Original Value |
|-----|--------|-------|-------|----------------|
| 15 | Contact | email | Invalid format | "not-an-email" |
| 23 | Opportunity | stage | Unknown stage | "Pending" |

---

## Checklist Before Launch

- [ ] Source file location confirmed
- [ ] All field mappings defined
- [ ] Stage mapping validated with stakeholder
- [ ] Owner assignment rules approved
- [ ] Test import completed successfully
- [ ] Rollback script tested
- [ ] Error handling reviewed
- [ ] Stakeholder sign-off obtained
