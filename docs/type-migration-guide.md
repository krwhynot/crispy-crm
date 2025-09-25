# Type Migration Guide: Legacy to Generated Types

## Overview

This document provides a comprehensive compatibility analysis between the legacy manual type definitions (`src/types/supabase.ts`) and the auto-generated database types (`src/types/database.generated.ts`). This analysis is critical for the safe removal of the legacy file during the MCP workflow transition.

## Executive Summary

- **Legacy imports**: Only 2 files actively import from `src/types/supabase.ts`
- **Schema divergence**: Significant structural differences due to database migration (v0.2.0)
- **ID type changes**: Legacy uses `number` IDs, generated uses `string` IDs
- **Migration required**: All imports need updating before legacy removal
- **Compatibility status**: ❌ **NOT COMPATIBLE** - requires migration

## Current Import Analysis

### Files Importing from `src/types/supabase.ts`

1. **`/src/atomic-crm/transformers/tags.ts` (line 8)**
   - Primary usage: Database type definitions for tag transformers
   - Impact: HIGH - Core transformer functionality

2. **`/src/atomic-crm/transformers/__tests__/tags.test.ts` (line 28)**
   - Primary usage: Type definitions for test cases
   - Impact: MEDIUM - Test coverage

### Documentation References Only
- `.docs/plans/mcp-workflow/type-generation-research.docs.md` - Example usage only

## Major Schema Changes

### 1. Table Structure Differences

#### Tables Removed from Generated Types
- ❌ `activities` - Activity tracking removed in favor of `interactions`
- ❌ `companies` - Renamed to `organizations`
- ❌ `company_notes` - Renamed to organization-based notes
- ❌ `company_tags` - Updated tag relationships
- ❌ `contact_organizations` - Restructured contact relationships
- ❌ `feature_flags` - Removed from generated types
- ❌ `migration_history` - Replaced with `migration_control`
- ❌ `contact_tags` - Updated tag relationships
- ❌ `opportunity_tags` - Updated tag relationships
- ❌ `opportunity_notes` - Renamed to `opportunityNotes`
- ❌ `contact_notes` - Renamed to `contactNotes`

#### Tables Added in Generated Types
- ✅ `organizations` - Replaces `companies` with enhanced schema
- ✅ `interactions` - New interaction tracking system
- ✅ `interaction_type_lu` - Lookup table for interaction types
- ✅ `contact_organization` - Simplified contact-org relationships
- ✅ `contact_preferred_principals` - New relationship tracking
- ✅ `opportunity_participants` - Multi-party opportunity management
- ✅ `opportunity_products` - Product line items
- ✅ `products` - Product catalog
- ✅ `principal_distributor_relationships` - Business relationships
- ✅ `organization_roles` - Role management
- ✅ `layout_templates` - UI customization
- ✅ `template_*` - Template management system
- ✅ `user_preferences` - User settings
- ✅ `*_lu` tables - Various lookup tables

### 2. ID Type Changes

#### Legacy Types (supabase.ts)
```typescript
// All IDs are numbers
id: number
company_id: number | null
contact_id: number | null
```

#### Generated Types (database.generated.ts)
```typescript
// All IDs are strings (UUIDs)
id: string
organization_id: string
contact_id: string | null
```

**Migration Impact**: Every ID field requires string conversion in transformers.

### 3. Schema Field Changes

#### Tags Table Comparison

**Legacy (`supabase.ts`)**:
```typescript
tags: {
  Row: {
    color: string | null
    created_at: string | null
    description: string | null
    id: number              // ⚠️ Number ID
    name: string
  }
}
```

**Generated (`database.generated.ts`)**:
```typescript
tags: {
  Row: {
    color: string | null
    created_at: string | null
    id: string              // ⚠️ String ID (UUID)
    name: string
    updated_at: string | null  // ✅ Added field
  }
}
```

**Changes:**
- ✅ Added `updated_at` field
- ⚠️ ID type changed from `number` to `string`

#### Contacts Table Comparison

**Legacy**: Basic contact structure with company relationship
**Generated**: Enhanced with organization relationships, search, audit fields

**Key Additions in Generated:**
- Multiple organization relationships (`organization_id`, `company_id`)
- Decision authority and purchase influence fields
- Enhanced search capabilities (`search_tsv`)
- Comprehensive audit trail (`created_by`, `updated_by`, `deleted_at`)
- JSONB arrays for flexible email/phone storage

#### Opportunities Table Comparison

**Legacy**: Referenced `companies` table
**Generated**: References `organizations` with enhanced pipeline management

**Key Changes:**
- Table relationships updated to `organizations`
- Enhanced stage/status management with enums
- Multiple participant support (`contact_ids` array)
- Principal/distributor organization tracking

### 4. Enum Changes

#### Contact Roles

**Legacy (`supabase.ts`)**:
```typescript
contact_role:
  | "Owner" | "CEO" | "CFO" | "CTO" | "COO"
  | "VP Sales" | "VP Marketing" | "VP Engineering"
  | "Director" | "Manager" | "Lead" | "Senior"
  | "Staff" | "Junior" | "Intern" | "Consultant" | "Other"
```

**Generated (`database.generated.ts`)**:
```typescript
contact_role:
  | "decision_maker" | "influencer" | "buyer"
  | "end_user" | "gatekeeper" | "champion"
```

**Migration Impact**: Complete enum restructure from job titles to decision-making roles.

#### New Enums in Generated Types
- `interaction_type` - Call, email, meeting, demo, proposal, etc.
- `opportunity_stage` - Pipeline stages including legacy and new values
- `opportunity_status` - Active, on hold, nurturing, closed states
- `organization_type` - Customer, principal, distributor, prospect
- `priority_level` - Low, medium, high, critical
- `product_category` - Food service product categories

### 5. Removed Legacy Structures

#### Activity System (Legacy)
```typescript
activities: {
  Row: {
    type: Database["public"]["Enums"]["activity_type"]
    subject_id: number
    subject_type: string
    metadata: Json | null
  }
}

activity_type:
  | "call" | "email" | "meeting" | "note" | "task"
  | "opportunity_created" | "opportunity_updated"
  | "company_created" | "company_updated"
```

**Replaced by**: `interactions` table with structured interaction tracking

## Migration Strategy

### Phase 1: Update Type Imports

**Current:**
```typescript
import type { Database } from '@/types/supabase';
```

**Target:**
```typescript
import type { Database } from '@/types/database.generated';
```

### Phase 2: Update Table References

**Tags Transformer Example:**

**Before:**
```typescript
type DbTag = Database['public']['Tables']['tags']['Row'];
type DbCompanyTag = Database['public']['Tables']['company_tags']['Row'];
```

**After:**
```typescript
type DbTag = Database['public']['Tables']['tags']['Row']; // ✅ Still exists
// company_tags no longer exists - need alternative approach
```

### Phase 3: Handle Missing Table Types

For tables that no longer exist, transformers need alternative strategies:

1. **Tag Relationships**: Update to use new relationship patterns
2. **Company References**: Update to `organizations`
3. **Activity Tracking**: Migrate to `interactions` system

### Phase 4: ID Type Migration

**Transformer Updates Required:**
```typescript
// Legacy approach (number IDs)
id: String(dbTag.id)          // Convert number to string

// Generated approach (string IDs)
id: dbTag.id                  // Already string, direct use
```

## Risk Assessment

### Critical Risks ❌
1. **Breaking Changes**: ID type changes break all transformers
2. **Missing Tables**: Some legacy table types don't exist in generated schema
3. **Enum Incompatibility**: Contact role enums completely changed
4. **Relationship Changes**: Foreign key references updated

### Mitigation Required ⚠️
1. Update all transformers before removing legacy types
2. Create compatibility adapters for enum changes
3. Implement migration utilities for ID conversions
4. Update test data to match new schema

### Low Risk Items ✅
1. Basic table structures (tags, contacts, opportunities) are compatible
2. Core field types remain consistent
3. JSONB usage patterns maintained
4. Timestamp handling unchanged

## Implementation Checklist

### Prerequisites
- [ ] Verify `database.generated.ts` contains all required tables
- [ ] Confirm enum mappings for breaking changes
- [ ] Create ID conversion utilities

### Migration Steps
1. [ ] Update `src/atomic-crm/transformers/tags.ts` import
2. [ ] Update type definitions for ID changes (number → string)
3. [ ] Handle missing table types (company_tags, etc.)
4. [ ] Update `src/atomic-crm/transformers/__tests__/tags.test.ts`
5. [ ] Test all transformer functions
6. [ ] Verify no compilation errors
7. [ ] Remove `src/types/supabase.ts`

### Validation
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Transformer functionality preserved
- [ ] Tag operations work correctly

## Current Usage Analysis in tags.ts

The `tags.ts` transformer currently uses these legacy types:

```typescript
type DbTag = Database['public']['Tables']['tags']['Row'];           // ✅ Compatible
type DbTagInsert = Database['public']['Tables']['tags']['Insert'];   // ✅ Compatible
type DbTagUpdate = Database['public']['Tables']['tags']['Update'];   // ✅ Compatible

type DbCompanyTag = Database['public']['Tables']['company_tags']['Row'];     // ❌ Missing
type DbContactTag = Database['public']['Tables']['contact_tags']['Row'];     // ❌ Missing
type DbOpportunityTag = Database['public']['Tables']['opportunity_tags']['Row']; // ❌ Missing
```

**Status**: Tags table is compatible but tag assignment tables need alternative approach.

## Recommendations

### Immediate Actions
1. **Complete this migration analysis** ✅
2. **Do NOT remove legacy types yet** - would break compilation
3. **Implement migration utilities** for ID conversion
4. **Create compatibility layer** for missing table types

### Migration Approach
1. **Conservative**: Keep legacy types until full compatibility achieved
2. **Gradual**: Update imports file-by-file with compatibility testing
3. **Big Bang**: Complete migration in single effort with extensive testing

**Recommended**: Conservative approach due to schema complexity.

### Success Criteria
- Zero compilation errors after legacy removal
- All transformer tests pass
- Tag functionality preserved
- Performance maintained

## Conclusion

The migration from `supabase.ts` to `database.generated.ts` involves significant schema changes that require careful handling. The main compatibility issues are:

1. **ID Type Changes** - All number IDs become string UUIDs
2. **Missing Table Types** - Tag assignment tables removed
3. **Enum Changes** - Contact roles completely restructured
4. **Table Reorganization** - Companies → Organizations migration

The **tags.ts** transformer can be migrated with moderate effort, but requires updating tag assignment handling for the missing table types. This analysis provides the roadmap for safe migration while preserving functionality.

---

*Generated: 2025-01-21 - Task 3.0: Type Compatibility Analysis*
*Next: Task 3.1 will use this analysis to safely remove legacy types*