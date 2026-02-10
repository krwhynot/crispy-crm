# UI Component Mapping Summary

**Generated:** 2026-02-09  
**Generator:** `scripts/generate-ui-mapping.cjs`

## Overview

This directory contains a comprehensive mapping of the Crispy CRM database schema to React Admin resources and UI components.

## Key Statistics

| Metric | Count | Notes |
|--------|-------|-------|
| **Total Database Tables** | 28 | All tables in `supabase/migrations/` |
| **Total Foreign Keys** | 78 | Referential integrity constraints |
| **Resources with UI** | 13 | Resources with dedicated CRUD interfaces |
| **Handled Resources** | 21 | Resources with data provider handlers |
| **Total UI Components** | 75 | List, Create, Edit, Show, SlideOver components |
| **Unmapped Tables** | 20 | Junction tables, system tables, supporting tables |
| **Orphaned Records** | 1195 | Records with soft-deleted parents |

## Resources with Full UI Coverage

1. **contacts** - 9 components (List, Create, Edit, Show, SlideOver, Filters, QuickCreate, Tags)
2. **organizations** - 9 components (List, Create, Edit, Show, SlideOver, Filters, QuickCreate)
3. **opportunities** - 14 components (List variants, Create, Edit, Show, SlideOver, Kanban, Archived)
4. **activities** - 5 components (List, Edit, Show, SlideOver, Filters)
5. **products** - 7 components (List, Create, Edit, Show, SlideOver, Filters)
6. **tasks** - 6 components (List, Create, Edit, Show, SlideOver, Filters)
7. **sales** - 6 components (List, Create, Edit, Show, SlideOver, Filters)
8. **tags** - 5 components (List, Create, Edit, Modals)
9. **notes** - 2 components (Create, List) - Shared across contact/opportunity/organization notes
10. **notifications** - 1 component (List)
11. **timeline** - 1 component (Unified timeline view)
12. **product_distributors** - 4 components (List, Create, Edit, Show)
13. **contact_notes** - Uses shared notes components
14. **opportunity_notes** - Uses shared notes components
15. **organization_notes** - Uses shared notes components

## Unmapped Tables (by Category)

### Junction Tables (7)
- `opportunity_participants` - Managed via opportunities
- `opportunity_contacts` - Managed via opportunities
- `interaction_participants` - Managed via activities
- `distributor_principal_authorizations` - Managed via settings
- `organization_distributors` - Managed via organizations
- `contact_organizations` - Managed via contacts
- `opportunity_products` - Managed via opportunities

### System Tables (8)
- `audit_trail` - Logging infrastructure
- `migration_history` - Database version tracking
- `tutorial_progress` - User onboarding state
- `dashboard_snapshots` - Computed dashboard cache
- `task_id_mapping` - Migration tracking
- `test_user_metadata` - Test fixtures
- `contact_preferred_principals` - System preference table

### Supporting/Configuration Tables (5)
- `product_category_hierarchy` - Product taxonomy
- `product_features` - Product metadata
- `product_pricing_models` - Pricing structure
- `product_pricing_tiers` - Pricing tiers
- `segments` - Configuration resource (managed via settings)

## Component Features Used

| Feature | Count | Resources Using |
|---------|-------|-----------------|
| `PremiumDatagrid` | 8 | contacts, organizations, opportunities, activities, products, tasks, sales, product_distributors |
| `Filters` | 10 | All list views with filtering |
| `TabbedForm` | 5 | Complex edit forms (contacts, organizations, opportunities, products) |
| `SimpleForm` | 12 | Simple CRUD forms |
| `ReferenceManyField` | 25+ | Showing related records (tasks, notes, opportunities, etc.) |
| `ReferenceField` | 30+ | Foreign key displays |
| `BulkActions` | 8 | List views with bulk operations |

## View/Table Duality (Performance Pattern)

Resources using summary views for list queries:

- `contacts` → `contacts_summary`
- `organizations` → `organizations_summary`
- `opportunities` → `opportunities_summary`
- `activities` → `activities_summary`
- `products` → `products_summary`
- `tasks` → `tasks_summary`
- `product_distributors` → `product_distributors_summary`

**Pattern:** List/getMany reads use `_summary` views (pre-computed aggregates), writes target base tables.

## Relationship Graph

**Most Connected Resources:**

1. **opportunities** - References: principals, organizations, contacts, products, sales, activities
2. **contacts** - References: organizations, sales, tasks, tags, notes
3. **organizations** - References: sales, contacts, distributors, principals
4. **activities** - References: opportunities, contacts, organizations, sales, principals
5. **products** - References: principals, distributors, product_features

## Architecture Compliance

**Three-Tier Architecture:**
- ✅ All resources use composed handlers in `composedDataProvider.ts`
- ✅ UI components in feature directories (`src/atomic-crm/{feature}/`)
- ✅ No direct Supabase imports in components
- ✅ Zod schemas in `src/atomic-crm/validation/`
- ✅ View/table duality enforced via `getDatabaseResource()`

**Code Quality:**
- ✅ All list views use `PremiumDatagrid` (no raw `Datagrid` from react-admin)
- ✅ Relationship displays use wrapper components (`ReferenceField`, `ReferenceManyField`)
- ✅ Consistent component naming (`{Resource}List.tsx`, `{Resource}Create.tsx`, etc.)

## Next Steps

1. **Add missing components** - Some resources lack SlideOver or QuickCreate variants
2. **Enhance filtering** - Not all list views expose advanced filters
3. **Add bulk actions** - Some resources could benefit from bulk operations
4. **Document relationships** - Add JSDoc comments describing what each relationship represents
5. **Extract shared patterns** - Identify common component patterns for reuse

## Regeneration

```bash
# Update mapping after schema or UI changes
node scripts/generate-ui-mapping.cjs
```

## Related Documentation

- `docs/architecture/erd-artifacts/ui-mapping.json` - Full machine-readable mapping
- `docs/architecture/erd-artifacts/orphan-analysis.json` - Data integrity analysis
- `.claude/rules/PROVIDER_RULES.md` - Data provider architecture rules
- `.claude/rules/MODULE_CHECKLIST.md` - Feature module standards
- `.claude/rules/UI_STANDARDS.md` - Three-tier architecture standards
