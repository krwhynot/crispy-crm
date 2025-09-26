# MVP+1 Migration Execution Guide

## Overview

This streamlined guide implements the MVP (Stage 1) plus one essential principal feature (Stage 1.5). Total migration time: ~2 hours.

## What You Get

### MVP (Stage 1) Features ✅
- **Contacts belong to multiple organizations** (many-to-many)
- **Opportunities not Deals** (deals are just closed opportunities)
- **Multi-principal opportunities** (flexible participant model)
- **Activities system** (Engagements vs Interactions)

### +1 Feature (Stage 1.5) ✅
- **Simple products table** for principals
- **Basic principal-distributor relationships**
- **Automatic commission tracking** (flat rate)

## Quick Start Checklist

```bash
# 1. Backup your database (5 minutes)
pg_dump -h localhost -p 54322 -U postgres -d postgres > backup_$(date +%Y%m%d).sql

# 2. Run all migrations in order (20 minutes total)
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f merged/migrations/stage1/001_phase_1_1_foundation_setup.sql
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f merged/migrations/stage1/002_phase_1_2_contact_organization_relationships.sql
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f merged/migrations/stage1/003_phase_1_3_opportunity_enhancements.sql
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f merged/migrations/stage1/004_phase_1_4_activities_system.sql
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f merged/migrations/stage1_5/005_phase_1_5_basic_principal_features.sql

# 3. Verify success (2 minutes)
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
SELECT phase_number, phase_name, status
FROM migration_history
ORDER BY phase_number;"
```

## Step-by-Step Execution

### Step 1: Pre-Flight Check (5 minutes)

```sql
-- Connect to database
psql "postgresql://postgres:postgres@localhost:54322/postgres"

-- Check current state
SELECT COUNT(*) AS deal_count FROM deals;
SELECT COUNT(*) AS contact_count FROM contacts;
SELECT COUNT(*) AS company_count FROM companies;

-- Exit psql
\q
```

### Step 2: Run MVP Migrations (15 minutes)

```bash
# Phase 1.1 - Foundation (3 minutes)
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -f merged/migrations/stage1/001_phase_1_1_foundation_setup.sql

# Phase 1.2 - Contact-Organizations (3 minutes)
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -f merged/migrations/stage1/002_phase_1_2_contact_organization_relationships.sql

# Phase 1.3 - Multi-Principal Opportunities (3 minutes)
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -f merged/migrations/stage1/003_phase_1_3_opportunity_enhancements.sql

# Phase 1.4 - Activities System (3 minutes)
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -f merged/migrations/stage1/004_phase_1_4_activities_system.sql
```

### Step 3: Run +1 Feature Migration (5 minutes)

```bash
# Phase 1.5 - Basic Principal Features
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -f merged/migrations/stage1_5/005_phase_1_5_basic_principal_features.sql
```

### Step 4: Quick Validation (5 minutes)

```sql
-- Connect and run validation
psql "postgresql://postgres:postgres@localhost:54322/postgres"

-- Check all phases completed
SELECT phase_number, phase_name, status,
       EXTRACT(EPOCH FROM (completed_at - started_at)) AS seconds_taken
FROM migration_history
ORDER BY phase_number;

-- Verify key tables exist
\dt opportunities
\dt contact_organizations
\dt opportunity_participants
\dt activities
\dt products
\dt principal_distributor_relationships

-- Check data migration
SELECT
    (SELECT COUNT(*) FROM opportunities) AS opportunities,
    (SELECT COUNT(*) FROM contact_organizations) AS contact_orgs,
    (SELECT COUNT(*) FROM opportunity_participants) AS participants,
    (SELECT COUNT(*) FROM activities) AS activities,
    (SELECT COUNT(*) FROM principal_distributor_relationships) AS pd_relationships;

-- Test a key function
SELECT * FROM contact_influence_profile LIMIT 1;

\q
```

## Testing the New Features

### Test 1: Contact with Multiple Organizations

```sql
-- Add a contact to multiple organizations
SELECT add_contact_to_organization(
    p_contact_id := 1,
    p_organization_id := 2,
    p_role := 'influencer'::contact_role,
    p_purchase_influence := 'High'
);

-- View contact's organizations
SELECT * FROM get_contact_organizations(1);
```

### Test 2: Multi-Principal Opportunity

```sql
-- Create opportunity with multiple principals
SELECT create_opportunity_with_participants(
    '{"name": "Q1 Food Service Deal", "stage": "qualified"}'::jsonb,
    ARRAY[
        '{"organization_id": 1, "role": "customer", "is_primary": true}'::jsonb,
        '{"organization_id": 2, "role": "principal", "is_primary": true}'::jsonb,
        '{"organization_id": 3, "role": "principal", "is_primary": false}'::jsonb
    ]
);
```

### Test 3: Log Activities

```sql
-- Log an engagement (no opportunity)
SELECT log_engagement(
    'call'::interaction_type,
    'Quarterly check-in',
    p_contact_id := 1,
    p_duration_minutes := 30
);

-- Log an interaction (with opportunity)
SELECT log_interaction(
    p_opportunity_id := 1,
    p_type := 'meeting'::interaction_type,
    p_subject := 'Product demo',
    p_duration_minutes := 60,
    p_sentiment := 'positive'
);
```

### Test 4: Principal Products

```sql
-- Add a product for a principal
SELECT add_product(
    p_principal_id := 2,  -- Must be marked as principal
    p_name := 'Organic Whole Milk',
    p_sku := 'MILK-001',
    p_category := 'Dairy',
    p_unit_price := 4.99
);

-- View distributor's available products
SELECT * FROM get_distributor_products(3);  -- Must be marked as distributor
```

## Common Issues & Fixes

### Issue: "type already exists"
```sql
-- Drop and retry
DROP TYPE IF EXISTS organization_type CASCADE;
```

### Issue: "deals table not found"
```sql
-- Already renamed to opportunities, use:
SELECT * FROM opportunities;
```

### Issue: "company not marked as principal"
```sql
-- Mark company as principal
UPDATE companies SET is_principal = true WHERE id = ?;
```

### Issue: Migration fails partway
```bash
# Run rollback
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -f merged/migrations/rollback/rollback_stage1_complete.sql

# Or just rollback Stage 1.5
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -f merged/migrations/rollback/rollback_stage1_5.sql
```

## Next Steps

After successful migration:

1. **Immediate (Day 1)**
   - [ ] Mark companies as principals/distributors where appropriate
   - [ ] Add some test products
   - [ ] Create a few principal-distributor relationships
   - [ ] Test the activity logging

2. **Week 1**
   - [ ] Train users on contact-organization relationships
   - [ ] Show how to create multi-principal opportunities
   - [ ] Demonstrate engagement vs interaction logging
   - [ ] Gather feedback on the simple product system

3. **Future Considerations**
   - Add product categories and pricing tiers (when needed)
   - Implement territory management (if required)
   - Add commission calculations (when ready)
   - Build custom dashboards (based on usage patterns)

## Success Metrics

✅ **Technical Success**
- All 5 phases show "completed" status
- No data lost (counts match or exceed pre-migration)
- All test queries execute successfully
- No critical errors in logs

✅ **Business Success**
- Users can add contacts to multiple organizations
- Multi-principal opportunities work correctly
- Activities track properly (engagement vs interaction)
- Principals can manage basic products
- Distributor relationships are visible

## Quick Reference

### Key New Tables
- `contact_organizations` - Links contacts to multiple orgs
- `opportunity_participants` - Multi-principal support
- `activities` - Unified activity tracking
- `products` - Simple product catalog
- `principal_distributor_relationships` - Basic relationships

### Key New Functions
- `add_contact_to_organization()` - Link contact to org
- `log_engagement()` - Log general activity
- `log_interaction()` - Log opportunity activity
- `add_product()` - Add principal product
- `get_distributor_products()` - View available products

### Changed Tables
- `deals` → `opportunities` (renamed)
- `dealNotes` → `opportunityNotes` (renamed)
- Companies now have `is_principal` and `is_distributor` flags
- Contacts can belong to multiple organizations

---

**Migration Version**: MVP+1
**Total Time**: ~2 hours including validation
**Risk Level**: Low (simple changes, full rollback available)
**Support**: Check `/merged/migrations/` for all scripts