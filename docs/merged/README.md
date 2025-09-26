# Merged CRM System - MVP+1 Implementation

## Overview

This is the merged CRM system combining the best of Atomic CRM's simplicity with essential food brokerage features. The implementation follows an MVP+1 approach: complete Stage 1 foundation plus basic principal features.

## Architecture

```
merged/
├── migrations/
│   ├── stage1/           # MVP foundation (4 phases)
│   ├── stage1_5/         # +1 principal features
│   └── rollback/         # Rollback scripts
├── types/
│   └── database.types.ts # TypeScript definitions
└── docs/
    ├── MVP_PLUS_ONE_EXECUTION_GUIDE.md
    └── STAGE_2_MIGRATION_PLAN.md (future)
```

## What's Implemented

### 🎯 Core Business Logic (MVP)
1. **Contact-Centric Model** - Contacts can belong to multiple organizations
2. **Opportunities Not Deals** - Deals are just closed opportunities (stage-based)
3. **Multi-Principal Support** - Flexible participant model for complex deals
4. **Activity Classification** - Engagements (general) vs Interactions (opportunity-specific)

### ➕ Principal Features (+1)
1. **Simple Products** - Basic product catalog for principals
2. **Principal-Distributor Relationships** - Track who sells what for whom
3. **Basic Commission Tracking** - Flat rate commission percentages

## Quick Start

```bash
# 1. Backup existing database
pg_dump -h localhost -p 54322 -U postgres -d postgres > backup.sql

# 2. Run all migrations (20 minutes)
for file in merged/migrations/stage1/*.sql merged/migrations/stage1_5/*.sql; do
    psql "postgresql://postgres:postgres@localhost:54322/postgres" -f "$file"
done

# 3. Verify
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c \
  "SELECT phase_number, phase_name, status FROM migration_history ORDER BY phase_number"
```

See [MVP_PLUS_ONE_EXECUTION_GUIDE.md](docs/MVP_PLUS_ONE_EXECUTION_GUIDE.md) for detailed instructions.

## Key Changes from Original CRMs

### From Atomic CRM
- ✅ Kept: JSONB flexibility, bigint IDs, simple structure
- ➕ Added: Soft deletes, many-to-many contacts, product support
- 🔄 Changed: deals → opportunities (renamed)

### From Old CRM
- ✅ Kept: Principal-distributor concept, contact advocacy, multi-principal
- ❌ Removed: Complex territory management, advanced commission calculations
- 🔄 Simplified: Product catalog (basic version), relationships (no contracts)

## Database Schema Highlights

### New Tables
- `contact_organizations` - Many-to-many contact relationships
- `opportunity_participants` - Multi-principal opportunity support
- `activities` - Unified activity tracking
- `products` - Simple product catalog
- `principal_distributor_relationships` - Basic PD relationships

### Enhanced Tables
- `companies` - Added `is_principal`, `is_distributor` flags
- `opportunities` - Renamed from deals, added stages and participants
- `contacts` - Can now belong to multiple organizations

## Key Functions

```sql
-- Add contact to organization
SELECT add_contact_to_organization(contact_id, org_id, role);

-- Create multi-principal opportunity
SELECT create_opportunity_with_participants(data, participants);

-- Log activities
SELECT log_engagement(type, subject, contact_id);  -- No opportunity
SELECT log_interaction(opp_id, type, subject);      -- With opportunity

-- Principal features
SELECT add_product(principal_id, name, sku, price);
SELECT get_distributor_products(distributor_id);
```

## Testing

```sql
-- Test contact with multiple orgs
SELECT * FROM contact_organizations WHERE contact_id = 1;

-- Test multi-principal opportunity
SELECT * FROM opportunities_with_participants WHERE principal_count > 1;

-- Test activity tracking
SELECT * FROM activities WHERE activity_type = 'engagement' LIMIT 5;

-- Test principal products
SELECT * FROM principal_product_summary;
```

## TypeScript Support

Full TypeScript definitions are provided in [`types/database.types.ts`](types/database.types.ts):

```typescript
import { Database } from './types/database.types';

// Types available for all tables and functions
type Company = Database['public']['Tables']['companies']['Row'];
type Opportunity = Database['public']['Tables']['opportunities']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
```

## Migration Safety

### Rollback Options

```bash
# Full rollback
psql -f merged/migrations/rollback/rollback_stage1_complete.sql

# Rollback just Stage 1.5
psql -f merged/migrations/rollback/rollback_stage1_5.sql
```

### Data Preservation
- All migrations use soft deletes (`deleted_at`)
- Rollback scripts create backup tables
- Original data is preserved during transformation

## Performance Considerations

- Indexes on all foreign keys
- Full-text search indexes on searchable fields
- Partial indexes for soft-deleted records
- Optimized views for common queries

## Future Enhancements (Not Implemented)

When ready for more complexity, consider:
- Product pricing tiers and volume discounts
- Territory management and geographic assignments
- Advanced commission calculations
- Inventory tracking
- Seasonal product availability
- Contract management

See [STAGE_2_MIGRATION_PLAN.md](docs/STAGE_2_MIGRATION_PLAN.md) for the full advanced feature roadmap.

## Support

- **Migration Scripts**: `/merged/migrations/`
- **Rollback Scripts**: `/merged/migrations/rollback/`
- **Types**: `/merged/types/database.types.ts`
- **Guides**: `/merged/docs/`
- **Business Rules**: `/migration-business-rules.md`

## Success Metrics

✅ **Implemented**
- Contacts → Multiple Organizations
- Opportunities with Multi-Principal
- Activities: Engagements vs Interactions
- Basic Products for Principals
- Simple Principal-Distributor Relationships

🎯 **Goals**
- Simplify food brokerage CRM operations
- Enable contact relationship tracking
- Support multi-principal deals
- Provide basic product management
- Track principal-distributor relationships

---

**Version**: MVP+1
**Status**: Ready for Production
**Migration Time**: ~2 hours
**Risk Level**: Low