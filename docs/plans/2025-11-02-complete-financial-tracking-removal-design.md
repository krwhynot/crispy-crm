# Complete Financial Tracking Removal Design

**Date:** 2025-11-02
**Status:** Design Complete - Ready for Implementation
**Context:** Final phase of relationship-focused CRM transformation

## Overview

Remove all remaining financial tracking from Atomic CRM, including dashboard components, database fields, and supporting code. This completes the architectural shift from sales-focused to relationship-focused CRM.

## Current State

**Active Financial Tracking:**
1. **OpportunitiesChart.tsx** - Monthly revenue chart using `opportunity.amount`
2. **OpportunitiesPipeline.tsx** - Pipeline kanban with USD currency formatting
3. **Database fields:**
   - `opportunities.amount` (numeric, optional)
   - `organizations.annual_revenue` (numeric(15,2))
   - `opportunity_participants.commission_rate` (numeric)
   - `pricing_model_type` enum (orphaned, tables dropped)

**Previously Removed (Oct 2025):**
- Product pricing (`list_price`, `unit_price`, `discount_percent`)
- Dashboard metrics (Pipeline Revenue, Win Rate) - replaced with relationship metrics

## Target State

**Dashboard:**
- Single component: `MetricsCardGrid` with 3 relationship cards
  - Total Contacts
  - Total Organizations
  - Activities This Week
- No charts, no pipeline visualization, no financial data

**Database:**
- Zero financial columns in all tables
- Zero currency-related enums
- Clean schema focused on relationships and activities

**Code:**
- No currency formatting logic
- No revenue calculations
- No commission tracking
- TypeScript types reflect clean schema

## Scope

### In Scope

**UI Components to Delete:**
1. `src/atomic-crm/dashboard/OpportunitiesChart.tsx` (~120 lines)
2. `src/atomic-crm/dashboard/OpportunitiesPipeline.tsx` (~80 lines)

**Dashboard Updates:**
- Remove component imports from `Dashboard.tsx`
- Remove JSX rendering of chart/pipeline components
- Keep only `MetricsCardGrid`

**Database Migration:**
- Drop `opportunities.amount`
- Drop `organizations.annual_revenue`
- Drop `opportunity_participants.commission_rate`
- Drop `pricing_model_type` enum

**Supporting Code Cleanup:**
- Remove financial mock data generators in test utilities
- Remove validation schema comments referencing financial fields
- Update TypeScript types (auto-regenerated from schema)

### Out of Scope

- Opportunity stage tracking (keep as-is)
- Activity logging (keep as-is)
- Contact/Organization management (keep as-is)
- Historical data in database (columns dropped, but existing data preserved in backups)

## Architecture

### Execution Strategy: UI-First, Then Database

**Phase 1: Remove UI Components** (safe, reversible)
- Delete chart and pipeline component files
- Update dashboard imports and JSX
- Run tests to ensure no broken references
- Commit: "refactor(dashboard): remove financial chart and pipeline components"

**Phase 2: Database Migration** (requires local testing first)
- Create migration file with column drops
- Test on local database
- Regenerate TypeScript types
- Fix any compilation errors
- Run full test suite
- Commit: "refactor(db): drop financial tracking columns and orphaned enum"

**Phase 3: Supporting Code Cleanup** (polish)
- Update test utilities
- Remove obsolete validation comments
- Update documentation
- Commit: "chore: clean up financial tracking test utilities and comments"

### Rollback Plan

**Phase 1 Rollback:**
```bash
git revert <commit-hash>  # Restore deleted component files
```

**Phase 2 Rollback:**
```sql
-- Restore columns (will be empty, but schema restored)
ALTER TABLE opportunities ADD COLUMN amount NUMERIC;
ALTER TABLE organizations ADD COLUMN annual_revenue NUMERIC(15,2);
ALTER TABLE opportunity_participants ADD COLUMN commission_rate NUMERIC;

-- Restore enum
CREATE TYPE pricing_model_type AS ENUM ('fixed', 'tiered', 'volume', 'subscription', 'custom');
```
Then regenerate types and revert git commits.

## Technical Details

### UI Component Removal

**File: `src/atomic-crm/dashboard/Dashboard.tsx`**

Changes:
- Remove import: `import { OpportunitiesChart } from "./OpportunitiesChart"`
- Remove import: `import { OpportunitiesPipeline } from "./OpportunitiesPipeline"`
- Remove JSX: `<OpportunitiesChart />` component rendering
- Remove JSX: `<OpportunitiesPipeline />` component rendering
- Keep: `<MetricsCardGrid />` (already relationship-focused)

**Files to Delete:**
```
src/atomic-crm/dashboard/OpportunitiesChart.tsx
src/atomic-crm/dashboard/OpportunitiesPipeline.tsx
```

### Database Migration

**File: `supabase/migrations/YYYYMMDDHHMMSS_remove_financial_tracking.sql`**

```sql
-- Remove Financial Tracking: Complete Removal
--
-- Context: Final phase of relationship-focused CRM transformation
-- Previous: October 2025 removed product pricing (list_price, unit_price, etc.)
-- This migration: Remove opportunity/organization financial tracking
--
-- Drops:
-- - opportunities.amount (deal value tracking)
-- - organizations.annual_revenue (company revenue)
-- - opportunity_participants.commission_rate (sales compensation)
-- - pricing_model_type enum (orphaned from previous table removal)

-- Drop opportunity deal value tracking
ALTER TABLE opportunities
  DROP COLUMN IF EXISTS amount;

-- Drop organization revenue tracking
ALTER TABLE organizations
  DROP COLUMN IF EXISTS annual_revenue;

-- Drop sales commission tracking
ALTER TABLE opportunity_participants
  DROP COLUMN IF EXISTS commission_rate;

-- Drop orphaned enum (tables using it were dropped in 20251031132404)
DROP TYPE IF EXISTS pricing_model_type CASCADE;

-- Rationale: Atomic CRM is relationship-focused, not sales-focused
-- Financial data (if needed) is tracked externally in accounting systems
```

**Type Regeneration:**
```bash
npx supabase gen types typescript --local > src/types/database.generated.ts
```

Expected impact: Removes ~40 lines from generated types (field definitions + enum).

### Test Updates

**File: `src/tests/utils/mock-providers.ts`**

Remove from `createMockOpportunity`:
```typescript
// REMOVE THIS LINE:
amount: faker.number.int({ min: 1000, max: 1000000 }),
```

**File: `src/atomic-crm/opportunities/opportunityUtils.spec.ts`**

Delete entire file or remove financial utility functions:
- `validateOpportunityAmount()`
- `calculateWeightedPipelineValue()`

These functions test financial logic that no longer exists.

### Validation Schema Cleanup

**File: `src/atomic-crm/validation/opportunities.ts`**

Remove comment on line 83:
```typescript
// BEFORE:
// - amount, probability, tags

// AFTER:
// - probability, tags
```

Or remove entire comment if it becomes unclear.

## Success Criteria

### Verification Checklist

**UI Verification:**
- [ ] Dashboard displays only MetricsCardGrid (3 cards)
- [ ] No OpportunitiesChart component visible
- [ ] No OpportunitiesPipeline component visible
- [ ] No dollar signs ($) anywhere on dashboard
- [ ] No currency formatting in rendered output

**Database Verification:**
```sql
-- Should return no 'amount' column
\d opportunities

-- Should return no 'annual_revenue' column
\d organizations

-- Should return no 'commission_rate' column
\d opportunity_participants

-- Should return 0 rows
SELECT * FROM pg_type WHERE typname = 'pricing_model_type';
```

**Code Quality:**
- [ ] TypeScript compiles: `npm run typecheck` (0 errors)
- [ ] Tests pass: `npm test` (660+ passing)
- [ ] No active references to `amount`, `annual_revenue`, `commission_rate` in src/
- [ ] Generated types in `database.generated.ts` show clean schema

**Documentation:**
- [ ] Design doc committed to git
- [ ] Migration includes clear rationale comments
- [ ] CLAUDE.md updated with new architectural decision

### Testing Strategy

**After Phase 1 (UI Removal):**
```bash
npm run typecheck  # Should pass
npm test           # Should pass (660+ tests)
npm run dev        # Manual check: dashboard shows only 3 cards
```

**After Phase 2 (Database Migration):**
```bash
npx supabase db reset                          # Reset local DB
npx supabase gen types typescript --local > src/types/database.generated.ts
npm run typecheck                              # Fix any errors
npm test                                       # Should pass
psql -h localhost -p 54322 -U postgres         # Verify schema
```

**After Phase 3 (Cleanup):**
```bash
npm run typecheck  # Final verification
npm test           # Final verification
npm run build      # Ensure production build works
```

## Migration Notes

### Data Loss Warning

**⚠️ DROPPING COLUMNS = DATA LOSS**

This migration permanently deletes:
- All opportunity `amount` values
- All organization `annual_revenue` values
- All sales rep `commission_rate` values

**Before running in production:**
1. Backup database
2. Export financial data if needed for historical analysis
3. Confirm with stakeholders that data is no longer needed

**Pre-launch status:** System is pre-launch, so data loss is acceptable. No production users exist yet.

### Performance Impact

Minimal - dropping columns is a fast DDL operation (milliseconds for empty/small tables).

### Schema Compatibility

After this migration:
- Older code referencing these fields will fail
- API calls expecting `amount` field will receive `undefined`
- No backward compatibility - this is a breaking change

**Mitigation:** This is acceptable because:
1. System is pre-launch (no external API consumers)
2. All code changes happen in same deployment
3. No staged rollout needed

## Related Documentation

**Previous Work:**
- October 2025 Product Pricing Removal: `CLAUDE.md` lines 17-33
- Dashboard Metrics Replacement: `docs/plans/2025-11-02-remove-financial-tracking-design.md`
- Pricing Cleanup: `docs/plans/2025-11-02-pricing-cleanup-design.md`

**Database Migrations:**
- Product pricing removal: `supabase/migrations/20251028040008_remove_product_pricing_and_uom.sql`
- Unused tables cleanup: `supabase/migrations/20251031132404_remove_unused_tables.sql`

**Engineering Principles:**
- Engineering Constitution: Relationship tracking over sales metrics
- UI as Source of Truth: Remove database fields not exposed in UI
- YAGNI: Remove speculative future features
