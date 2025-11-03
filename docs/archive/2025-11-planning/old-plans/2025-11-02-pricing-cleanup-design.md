# Pricing Reference Cleanup Design

**Date:** 2025-11-02
**Status:** Design Complete - Ready for Implementation
**Related Migration:** `supabase/migrations/20251028040008_remove_product_pricing_and_uom.sql`

## Overview

Clean up residual pricing references throughout the codebase following the October 2025 architectural decision to remove all pricing functionality from products and opportunities.

## Context & Constraints

- **Database migration completed:** October 2025 removed pricing columns from products and opportunity-products tables
- **Current state:** 33+ TypeScript files contain price-related terms
- **Scope:** Moderate cleanup - remove product/opportunity pricing references, preserve other legitimate uses
- **Approach:** Audit-first with phased execution

### What Was Removed (Database)

**Products table:**
- `list_price`
- `currency_code`
- `unit_of_measure`

**Opportunity-products junction:**
- `quantity`
- `unit_price`
- `discount_percent`

**Current data model:**
- Products: Catalog items with name, SKU, category, description, status
- Opportunity-products: Simple association tracking with optional notes

## Design

### Phase 1: Audit Strategy

**Objective:** Create comprehensive report of all pricing references categorized by type and priority.

**Search Patterns:**

1. **Direct pricing terms:**
   - `price|pricing`
   - `unit_price|list_price|discount_percent`
   - `currency|currency_code`

2. **Calculation terms:**
   - `quantity|unit_of_measure`
   - `total|subtotal|line.*total`

3. **Financial terms (requires careful filtering):**
   - `amount|cost` - May have legitimate non-pricing uses
   - `value` - Too broad, manual review only

**Categorization:**

Each reference will be categorized as:

1. **Test Data & Mocks** - Mock objects with old pricing fields
2. **UI Components** - Form fields, displays, labels for removed pricing
3. **Type Definitions** - Interfaces/types with pricing properties
4. **Comments & Documentation** - Outdated references in comments
5. **Variable Names** - Variables referencing removed concepts
6. **Legitimate Uses** - Non-pricing uses of terms like "amount" (KEEP)

**Audit Output:**

Report at `docs/plans/2025-11-02-pricing-cleanup-audit.md` containing:
- File path and line numbers
- Code snippet
- Recommended action (remove/update/keep)
- Priority (high/medium/low)
- Reasoning

**Special Cases:**

- **Opportunity "amount"**: If exists for tracking deal value (not product pricing), KEEP
- **Generic "cost" in comments**: Context-dependent analysis required
- **Test utilities**: Check all dependents before removing shared helpers

### Phase 2: Cleanup Execution

**Execution Order:** Priority-based phased approach

#### Phase 2.1: High Priority - Breaking Changes

Clean up items that could cause test failures or type errors:

- Test files with pricing assertions that will fail
- Type definitions imported by multiple files
- Data provider mock data not matching current schema
- Shared test utilities with pricing helpers

**Validation after Phase 2.1:**
```bash
npm run type-check
npm test
```

#### Phase 2.2: Medium Priority - Dead Code

Remove obsolete code no longer needed:

- Unused validation logic for removed fields
- UI components/inputs for non-existent pricing fields
- Utility functions for pricing calculations/formatting
- Comments in active code referencing removed features

**Validation after Phase 2.2:**
```bash
npm run type-check
npm test
npm run build
```

#### Phase 2.3: Low Priority - Cleanup

Polish and improve clarity:

- Rename variables that reference pricing (improve readability)
- Update comments in test files
- Clean up documentation snippets
- Update Storybook examples

**Validation after Phase 2.3:**
```bash
npm run type-check
npm test
npm run build
npm run lint
```

### Cleanup Principles

1. **Test preservation**: Update test data to match current schema rather than deleting tests
2. **Type safety**: Run `npm run type-check` after each phase
3. **Verify tests**: Run `npm test` after each phase to catch breakage
4. **Atomic commits**: One commit per phase with descriptive message
5. **Boy Scout Rule**: Fix any unrelated issues found in files we touch (per Engineering Constitution)

## Validation & Success Criteria

### Validation Steps

After each cleanup phase:

1. **Type Safety:**
   ```bash
   npm run type-check
   ```
   ✅ Zero TypeScript errors related to pricing fields

2. **Test Coverage:**
   ```bash
   npm test
   ```
   ✅ All tests pass with updated mock data

3. **Build Success:**
   ```bash
   npm run build
   ```
   ✅ Production build completes without errors

4. **Lint Compliance:**
   ```bash
   npm run lint
   ```
   ✅ No new linting errors introduced

### Success Criteria

The cleanup is complete when:

- ✅ **Zero pricing references** in product/opportunity code except legitimate uses (documented in audit)
- ✅ **All tests passing** with pricing-related test data updated to current schema
- ✅ **Type safety maintained** - no TypeScript errors
- ✅ **Documentation updated** - Any developer docs mentioning removed pricing features are updated
- ✅ **Clean git history** - Each phase has a clear, descriptive commit message

## Rollback Plan

If cleanup breaks something unexpected:

1. Each phase is an atomic commit
2. Git revert the problematic commit
3. Review audit findings for that category
4. Adjust cleanup approach and retry

## Implementation Notes

- Start with audit to avoid blind changes
- Moderate cleanup scope: focus on product/opportunity pricing only
- Preserve test coverage by updating rather than deleting tests
- Watch for opportunity "amount" fields that may track deal value (separate from product pricing)
- Validate continuously to catch issues early

## References

- Original migration: `supabase/migrations/20251028040008_remove_product_pricing_and_uom.sql`
- CLAUDE.md "Pricing Removal" section (lines 17-33)
- Engineering Constitution: Boy Scout Rule, Single Source of Truth
