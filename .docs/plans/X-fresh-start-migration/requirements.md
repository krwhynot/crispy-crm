# Fresh Start Migration: Deals → Opportunities

## Executive Summary

This document defines the requirements for a complete fresh-start migration of the Atomic CRM from the legacy "deals" naming to "opportunities". Unlike traditional migrations that transform existing data, this approach leverages an empty database to create the correct schema from inception, eliminating complexity and following the engineering constitution's "fail fast" and "no over-engineering" principles.

## Context

The Atomic CRM codebase is currently in a dual-system state with both `deals` and `opportunities` implementations running simultaneously through a 377-line backward compatibility layer. The database still uses the original `deals` table structure while the UI has duplicate components for both systems. This migration will complete the abandoned transformation by starting fresh with the correct schema and removing all legacy code.

## Core Requirements

### 1. Database Migration (Fresh Schema Creation)

**Approach**: Create a single consolidated migration file with correct naming from the start.

**Deliverables**:
- Archive existing migrations to `/docs/deprecated-migrations/`
- Create new migration: `20250125000000_fresh_crm_schema.sql`
- Include ALL current system tables, views, functions, procedures
- Use `opportunities` and `opportunityNotes` naming (not `deals`)
- Add all performance indexes upfront
- Implement simplified RLS policies per Core Principles

**Key Tables to Create**:
```sql
-- Primary tables with correct names
- opportunities (not deals)
- opportunityNotes (not dealNotes)
- companies
- contacts
- tasks
- sales
- tags
- contactNotes
- contact_organizations
- opportunity_participants
- opportunity_products

-- Views
- companies_summary
- contacts_summary
- opportunities_summary (not deals_summary)
- init_state

-- All existing functions and procedures
```

### 2. Code Cleanup (Complete Removal of Legacy System)

**Approach**: Remove all deals-related code without backward compatibility.

**Deletions Required**:
- `/src/atomic-crm/deals/` - Entire folder (17 files)
- `/src/atomic-crm/providers/commons/backwardCompatibility.ts`
- `/src/atomic-crm/providers/commons/backwardCompatibility.spec.ts`
- `/src/atomic-crm/pages/MigrationStatusPage.tsx`
- `/src/atomic-crm/components/MigrationChecklist.tsx`
- `/src/atomic-crm/components/MigrationNotification.tsx`

**File Updates Required**:

1. **Root Configuration** (`/src/atomic-crm/root/CRM.tsx`):
   - Remove: `import deals from "../deals"`
   - Remove: `<Resource name="deals" {...deals} />`
   - Remove: `<Resource name="dealNotes" />`
   - Remove: `dealCategories`, `dealPipelineStatuses`, `dealStages` props
   - Remove: `handleDealUrlRedirect()` useEffect

2. **Dashboard Components**:
   - Rename: `DealsPipeline.tsx` → `OpportunitiesPipeline.tsx`
   - Rename: `DealsChart.tsx` → `OpportunitiesChart.tsx`
   - Update all imports from `"../deals/"` to `"../opportunities/"`
   - Update function names: `findDealLabel` → `findOpportunityLabel`

3. **Data Provider** (`/src/atomic-crm/providers/supabase/dataProvider.ts`):
   - Remove all `deals` and `dealNotes` handling
   - Remove transformation logic for deals↔opportunities
   - Clean up lifecycle callbacks

4. **Resource Mapping** (`/src/atomic-crm/providers/supabase/resources.ts`):
   - Already marked as REMOVED - verify no active references

5. **Company Components** (`/src/atomic-crm/companies/CompanyShow.tsx`):
   - Update import: `from "../opportunities/opportunity"`

### 3. Validation Implementation (Zod Schemas)

**Approach**: Implement single-point validation at API boundaries per Core Principle #3.

**Create Directory**: `/src/atomic-crm/validation/`

**Required Schema Files**:
```typescript
- opportunities.schema.ts
- companies.schema.ts
- contacts.schema.ts
- tasks.schema.ts
- tags.schema.ts
- notes.schema.ts (for both contact and opportunity notes)
```

**Integration Points**:
- Unified data provider's `validateMutation` function
- Edge functions in `/supabase/functions/`
- Remove all form-level validation (use admin layer only)

### 4. Testing Requirements

**Approach**: Basic tests to verify migration success without over-engineering.

**Test Coverage**:
1. **Migration Verification**:
   - `opportunities` table exists
   - `deals` table does NOT exist
   - All foreign keys reference `opportunity_id` (not `deal_id`)

2. **Code Verification**:
   - No imports from `/deals/` directory
   - No "deal" string literals in resource names
   - All routes use `/opportunities/*` paths

3. **Basic CRUD Operations**:
   - Create opportunity
   - List opportunities
   - Update opportunity
   - Delete opportunity

4. **Validation Tests**:
   - Zod schema validation at API boundary
   - Invalid data rejected with proper errors

### 5. Implementation Workflow

**Approach**: Automated scripts with git checkpoints per phase.

**Execution Plan**:

```bash
# Phase 1: Database Migration
1. Archive old migrations:
   mkdir -p docs/deprecated-migrations
   mv supabase/migrations/* docs/deprecated-migrations/
   git add -A && git commit -m "chore: archive old migrations for fresh start"

2. Create fresh schema:
   cat > supabase/migrations/20250125000000_fresh_crm_schema.sql
   # Apply via MCP: mcp__supabase__apply_migration
   git add -A && git commit -m "feat: create fresh opportunities schema"

# Phase 2: Code Cleanup
3. Remove legacy code:
   rm -rf src/atomic-crm/deals
   rm -f [list of backward compatibility files]
   git add -A && git commit -m "refactor: remove deals legacy code and backward compatibility"

# Phase 3: UI Updates
4. Update components:
   # Run automated rename script
   # Update imports
   git add -A && git commit -m "refactor: update UI components to use opportunities"

# Phase 4: Validation
5. Implement Zod schemas:
   # Create validation directory and schemas
   git add -A && git commit -m "feat: implement Zod validation schemas"

# Phase 5: Testing
6. Run verification:
   npm test
   npm run dev # Manual verification
   git add -A && git commit -m "test: add migration verification tests"
```

## Non-Functional Requirements

### Performance
- Migration execution: < 30 seconds
- No virtualization implementation unless performance issues detected
- All indexes created upfront in migration

### Security
- Simple RLS policies: authenticated users access all data
- No complex security monitoring (per engineering constitution)
- Basic auth failure logging only

### Maintainability
- Self-documenting code (minimal comments)
- TypeScript interfaces for objects, types for unions
- Follow existing code patterns (Boy Scout Rule)

## Success Criteria

1. **Database State**:
   - [ ] Fresh schema with `opportunities` table exists
   - [ ] No `deals` or `dealNotes` tables present
   - [ ] All foreign keys use `opportunity_id`
   - [ ] All views reference opportunities correctly

2. **Code State**:
   - [ ] `/deals/` folder deleted
   - [ ] No backward compatibility code remains
   - [ ] All imports use `/opportunities/` paths
   - [ ] Dashboard components renamed and updated

3. **Validation State**:
   - [ ] Zod schemas created for all resources
   - [ ] Validation working at API boundaries
   - [ ] Form validation uses admin layer

4. **Application State**:
   - [ ] Application starts without errors
   - [ ] CRUD operations work for opportunities
   - [ ] No console errors about missing deals
   - [ ] Routes work correctly (`/opportunities/*`)

## Rollback Strategy

Given the fresh database approach:

1. **Database**: Drop all tables and re-run migration
2. **Code**: Git revert to previous commits
3. **Time to rollback**: < 5 minutes

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Missing table/column in migration | Low | High | Review existing schema thoroughly |
| Broken imports after deletion | Medium | Medium | Run TypeScript compiler after each phase |
| Validation schema mismatch | Low | Low | Test with actual data before commit |
| Performance regression | Low | Low | Monitor, add virtualization if needed |

## Dependencies

- Access to Crispy database with deletion permissions
- MCP tools configured for database operations
- Node.js environment for running scripts
- Git for version control checkpoints

## Out of Scope

- Data migration (database is empty)
- Backward compatibility maintenance
- Complex security monitoring
- Performance optimization (unless issues detected)
- Virtualization implementation
- Circuit breakers or health monitoring

## Timeline

Estimated completion: 2-4 hours

1. Database migration: 30 minutes
2. Code cleanup: 45 minutes
3. UI updates: 30 minutes
4. Validation implementation: 45 minutes
5. Testing & verification: 30 minutes

## Appendix A: Complete File List

### Files to Delete (24 files)
```
/src/atomic-crm/deals/ (entire folder - 17 files)
/src/atomic-crm/providers/commons/backwardCompatibility.ts
/src/atomic-crm/providers/commons/backwardCompatibility.spec.ts
/src/atomic-crm/pages/MigrationStatusPage.tsx
/src/atomic-crm/components/MigrationChecklist.tsx
/src/atomic-crm/components/MigrationNotification.tsx
/src/atomic-crm/dashboard/DealsPipeline.tsx (rename, not delete)
/src/atomic-crm/dashboard/DealsChart.tsx (rename, not delete)
```

### Files to Modify (12+ files)
```
/src/atomic-crm/root/CRM.tsx
/src/atomic-crm/dashboard/OpportunitiesPipeline.tsx (renamed)
/src/atomic-crm/dashboard/OpportunitiesChart.tsx (renamed)
/src/atomic-crm/dashboard/Dashboard.tsx
/src/atomic-crm/dashboard/LatestNotes.tsx
/src/atomic-crm/companies/CompanyShow.tsx
/src/atomic-crm/providers/supabase/dataProvider.ts
/src/atomic-crm/providers/supabase/unifiedDataProvider.ts
/src/atomic-crm/providers/supabase/resources.ts
/src/atomic-crm/notes/NoteCreate.tsx
/src/atomic-crm/notes/NotesIterator.tsx
/src/atomic-crm/layout/Header.tsx
```

### Files to Create (6+ validation schemas)
```
/src/atomic-crm/validation/opportunities.schema.ts
/src/atomic-crm/validation/companies.schema.ts
/src/atomic-crm/validation/contacts.schema.ts
/src/atomic-crm/validation/tasks.schema.ts
/src/atomic-crm/validation/tags.schema.ts
/src/atomic-crm/validation/notes.schema.ts
```

## Appendix B: SQL Migration Template

```sql
-- 20250125000000_fresh_crm_schema.sql
-- Fresh start migration for Atomic CRM
-- Creates correct schema from inception (no deals legacy)

BEGIN;

-- Companies table
CREATE TABLE companies (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    sector TEXT,
    size SMALLINT,
    linkedin_url TEXT,
    website TEXT,
    phone_number TEXT,
    address TEXT,
    zipcode TEXT,
    city TEXT,
    stateAbbr TEXT,
    country TEXT,
    description TEXT,
    revenue TEXT,
    tax_identifier TEXT,
    logo JSONB,
    sales_id BIGINT,
    context_links JSON
);

-- Opportunities table (NOT deals)
CREATE TABLE opportunities (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    company_id BIGINT REFERENCES companies(id),
    contact_ids BIGINT[],
    category TEXT,
    stage TEXT NOT NULL,
    description TEXT,
    amount BIGINT,
    probability SMALLINT CHECK (probability >= 0 AND probability <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    archived_at TIMESTAMP WITH TIME ZONE,
    expected_closing_date TIMESTAMP WITH TIME ZONE,
    sales_id BIGINT,
    index SMALLINT
);

-- OpportunityNotes table (NOT dealNotes)
CREATE TABLE opportunityNotes (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    opportunity_id BIGINT NOT NULL REFERENCES opportunities(id),
    type TEXT,
    text TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sales_id BIGINT,
    attachments JSONB[]
);

-- Continue with all other tables...
-- (contacts, contactNotes, tasks, sales, tags, etc.)

-- Create all indexes
CREATE INDEX idx_opportunities_company_id ON opportunities(company_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunity_notes_opportunity_id ON opportunityNotes(opportunity_id);
-- Continue with all indexes...

-- Create views with correct references
CREATE VIEW companies_summary AS
SELECT
    c.*,
    COUNT(DISTINCT o.id) as opportunities_count,
    COUNT(DISTINCT ct.id) as contacts_count
FROM companies c
LEFT JOIN opportunities o ON o.company_id = c.id
LEFT JOIN contacts ct ON ct.company_id = c.id
GROUP BY c.id;

-- Simple RLS policies
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_access" ON opportunities
    FOR ALL USING (auth.role() = 'authenticated');

-- Continue for all tables...

COMMIT;
```

## Approval Sign-off

This requirements document represents a complete fresh-start migration approach that:
- Eliminates complexity by starting with correct schema
- Removes all backward compatibility code
- Implements proper validation at API boundaries
- Follows all engineering constitution principles
- Can be executed in under 4 hours

The approach prioritizes simplicity, speed, and maintainability while avoiding over-engineering.