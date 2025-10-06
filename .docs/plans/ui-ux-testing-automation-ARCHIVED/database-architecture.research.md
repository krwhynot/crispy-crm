# Database Architecture Research - Atomic CRM

Research conducted for UI/UX testing automation implementation. This document provides detailed database schema insights, JSONB field structures, junction table patterns, and migration conventions needed for creating robust test data factories and testing strategies.

## Overview

Atomic CRM uses a PostgreSQL-based schema (via Supabase) with sophisticated JSONB fields, multi-organization contact relationships, and comprehensive RLS policies. The schema was consolidated in migration `20250127000000_consolidated_fresh_schema.sql` from 68 historical migrations. Key architectural features include:

- JSONB arrays for flexible contact information (emails/phones)
- Junction tables for many-to-many relationships with metadata
- Soft deletes via `deleted_at` timestamps
- Full-text search via `tsvector` columns
- Simple authenticated-only RLS policies
- Comprehensive enum types for domain constraints
- Denormalized views for React Admin integration

## Key Tables & Relationships

### Core Entity Tables

**contacts** - Person entities with JSONB contact information
- Primary Key: `id` (bigint, auto-increment)
- JSONB Fields: `email` (array of objects), `phone` (array of objects)
- Search: `search_tsv` tsvector for full-text search
- Arrays: `tags` (bigint array)
- Soft Delete: `deleted_at` timestamptz
- Foreign Keys: `sales_id` → sales(id), `created_by` → sales(id)

**organizations** - Company/organization entities (renamed from "companies")
- Primary Key: `id` (bigint, auto-increment)
- Type Flags: `is_principal`, `is_distributor`, `organization_type` enum
- Hierarchical: `parent_organization_id` → organizations(id)
- JSONB Fields: `context_links` (array of URLs)
- Search: `search_tsv` tsvector
- Priority: `priority` varchar(1) CHECK IN ('A','B','C','D')

**opportunities** - Sales pipeline (renamed from "deals")
- Primary Key: `id` (bigint, auto-increment)
- Multi-Org: `customer_organization_id`, `principal_organization_id`, `distributor_organization_id`
- Contacts: `contact_ids` (bigint array) - array of contact IDs
- Arrays: `tags` (text array)
- Enums: `stage` (opportunity_stage), `status` (opportunity_status), `priority` (priority_level)
- Kanban: `index` integer for drag-drop ordering
- Ownership: `opportunity_owner_id` (bigint), `account_manager_id` (uuid)
- Context: `opportunity_context` text field
- Lead Tracking: `lead_source` text field

**products** - Product catalog with principal relationships
- Primary Key: `id` (bigint, auto-increment)
- Required: `principal_id` (bigint), `name`, `sku`, `category` (product_category enum)
- JSONB Fields: `dimensions`, `specifications`, `nutritional_info`
- Arrays: `certifications`, `allergens`, `image_urls`, `features`, `benefits`
- Enums: `category` (product_category), `status` (product_status), `unit_of_measure`, `storage_temperature`
- Search: `search_tsv` tsvector

### Junction Tables (Many-to-Many Relationships)

**contact_organizations** - Multi-organization contact support with relationship metadata
- Composite: `contact_id` (bigint) + `organization_id` (bigint)
- Primary Flag: `is_primary` boolean - exactly one per contact required
- Influence Metrics: `purchase_influence` smallint (0-100), `decision_authority` smallint (0-100)
- Role: `role` contact_role enum
- Lifecycle: `relationship_start_date`, `relationship_end_date`
- Indexes:
  - `idx_contact_organizations_contact_id`
  - `idx_contact_organizations_organization_id`
  - `idx_contact_organizations_primary` (WHERE is_primary = true)

**opportunity_participants** - Organizations involved in opportunities
- Links: `opportunity_id` + `organization_id`
- Role: `role` varchar(20) CHECK IN ('customer', 'principal', 'distributor', 'partner', 'competitor')
- Primary Flag: `is_primary` boolean
- Business Data: `commission_rate` numeric (0-1), `territory` text

**interaction_participants** - Contacts/organizations in activities
- Links: `activity_id` + `contact_id` + `organization_id`
- Simple metadata: `role` varchar(20), `notes` text

**contact_preferred_principals** - Contact brand preferences
- Links: `contact_id` + `principal_organization_id`
- Advocacy: `advocacy_strength` smallint (0-100)
- Tracking: `last_interaction_date`

**opportunity_products** - Products in opportunities with pricing
- Links: `opportunity_id` + `product_id_reference`
- Pricing: `quantity`, `unit_price`, `discount_percent`
- Computed: `extended_price`, `final_price` (GENERATED ALWAYS AS stored columns)
- Tier Support: `price_tier_id` → product_pricing_tiers(id)

### Support Tables

**activities** - Engagements and interactions
- Types: `activity_type` (engagement/interaction), `type` (interaction_type enum)
- Links: `contact_id`, `organization_id`, `opportunity_id`
- Arrays: `attachments`, `attendees`, `tags`
- Follow-up: `follow_up_required`, `follow_up_date`, `follow_up_notes`

**tasks** - Action items with type classification
- Required: `title` (renamed from `name`), `contact_id`
- Type: `type` task_type enum (Call, Email, Meeting, Follow-up, Proposal, Discovery, Administrative, None)
- Links: `contact_id`, `opportunity_id`, `sales_id`
- Priority: `priority` priority_level enum
- Completion: `completed`, `completed_at`

**contactNotes** / **opportunityNotes** - Entity-specific notes
- Foreign Keys: `contact_id` / `opportunity_id`
- Content: `text` (required), `attachments` text array
- Ownership: `sales_id` → sales(id)

**tags** - Flexible tagging system
- Unique: `name` text UNIQUE
- UI: `color` text (semantic CSS variables only)
- Stats: `usage_count` integer

**sales** - User/sales rep table
- Auth: `user_id` uuid → auth.users(id)
- Profile: `first_name`, `last_name`, `email`, `phone`
- Admin: `is_admin` boolean
- Soft Delete: `deleted_at`, `disabled` boolean

## JSONB Field Structures

### contacts.email (JSONB Array)

**Current Structure (post-migration 20250928220851):**
```json
[
  { "email": "john@work.com", "type": "Work" },
  { "email": "john@home.com", "type": "Home" },
  { "email": "john@other.com", "type": "Other" }
]
```

**Zod Schema:** `emailAndTypeSchema`
```typescript
{
  email: z.string().email("Invalid email address"),
  type: z.enum(["Work", "Home", "Other"]).default("Work")
}
```

**Test Factory Requirements:**
- At least one email required for contact creation
- `type` defaults to "Work" if not specified
- Each email object must have valid email format
- Array can be empty `[]` but validation layer requires at least one for creation

### contacts.phone (JSONB Array)

**Current Structure (post-migration 20250928221145):**
```json
[
  { "number": "+1-555-123-4567", "type": "Work" },
  { "number": "+1-555-987-6543", "type": "Mobile" },
  { "number": "+1-555-456-7890", "type": "Home" }
]
```

**Zod Schema:** `phoneNumberAndTypeSchema`
```typescript
{
  number: z.string(),  // No strict format validation currently
  type: z.enum(["Work", "Home", "Other"]).default("Work")
}
```

**Gotcha:** Migration 20250928221145 changed field name from `phone` to `number` in objects.

**Test Factory Requirements:**
- Optional field (can be empty array)
- `type` defaults to "Work"
- No phone number format validation (flexible)

### organizations.context_links (JSONB Array)

**Structure:**
```json
["https://example.com/article", "https://competitor.com/product"]
```

**Validation:** Array of valid URLs matching regex `/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i`

### products.dimensions / specifications / nutritional_info (JSONB Objects)

**Flexible schemas** - No strict validation, application-defined structures.

**Example dimensions:**
```json
{
  "length": 10,
  "width": 5,
  "height": 3,
  "weight": 2.5,
  "unit": "inches"
}
```

## Database Views (Denormalized for React Admin)

### contacts_summary

**Purpose:** Provides denormalized contact data with primary organization name

**Key Fields:**
- All contact table columns
- `organization_ids` - array_agg of all linked organization IDs
- `company_name` - primary organization name (or earliest if no primary set)

**SQL Pattern:**
```sql
-- Subquery for company_name prioritizes is_primary, then earliest created
(SELECT o.name
 FROM contact_organizations co2
 JOIN organizations o ON o.id = co2.organization_id
 WHERE co2.contact_id = c.id AND o.deleted_at IS NULL
 ORDER BY co2.is_primary DESC, co2.created_at ASC
 LIMIT 1) AS company_name
```

**Index:** `idx_contact_orgs_lookup` on `(contact_id, is_primary DESC, created_at ASC)`

**Security:** `WITH (security_invoker = false)` - uses SECURITY DEFINER pattern

### opportunities_summary

**Purpose:** Denormalized opportunity data with organization/sales names and product totals

**Computed Fields:**
- `customer_name`, `principal_name`, `distributor_name` - organization names
- `sales_rep_name` - concatenated first + last name from sales table
- `item_count` - count of opportunity_products
- `total_amount` - sum of final prices from opportunity_products

**Joins:** organizations (3x for customer/principal/distributor), sales, opportunity_products

### organizations_summary

**Purpose:** Organization data with aggregate counts

**Computed Fields:**
- `opportunities_count` - count of linked opportunities (any role)
- `contacts_count` - count of contacts via contact_organizations
- `last_opportunity_activity` - max updated_at from opportunities

## Row Level Security (RLS) Patterns

### Simple Authenticated-Only Pattern

**All tables use standardized RLS:**
```sql
CREATE POLICY "authenticated_select_[table]" ON [table]
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_insert_[table]" ON [table]
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_update_[table]" ON [table]
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_delete_[table]" ON [table]
  FOR DELETE USING (auth.uid() IS NOT NULL);
```

**Key Insight:** No user-specific data isolation - all authenticated users can access all data. This is intentional for the current development environment.

**Applied to:** All 22 tables including contacts, organizations, opportunities, junction tables, products, etc.

**Migration:** Standardized in migration `20250927000000_standardize_all_rls_policies.sql`

### Testing Implications

For UI testing, authentication is required but no special permission checks needed. Test users can:
- View all records
- Create/update/delete any record
- Access all junction table relationships

## Database Enums

### Complete Enum Type Catalog

**activity_type:** `engagement`, `interaction`

**contact_role:** `decision_maker`, `influencer`, `buyer`, `end_user`, `gatekeeper`, `champion`, `technical`, `executive`

**interaction_type:** `call`, `email`, `meeting`, `demo`, `proposal`, `follow_up`, `trade_show`, `site_visit`, `contract_review`, `check_in`, `social`

**opportunity_stage:** `new_lead`, `initial_outreach`, `sample_visit_offered`, `awaiting_response`, `feedback_logged`, `demo_scheduled`, `closed_won`, `closed_lost`

**opportunity_status:** `active`, `on_hold`, `nurturing`, `stalled`, `expired`

**organization_type:** `customer`, `principal`, `distributor`, `prospect`, `vendor`, `partner`, `unknown`

**priority_level:** `low`, `medium`, `high`, `critical`

**product_category:** `beverages`, `dairy`, `frozen`, `fresh_produce`, `meat_poultry`, `seafood`, `dry_goods`, `snacks`, `condiments`, `baking_supplies`, `spices_seasonings`, `canned_goods`, `pasta_grains`, `oils_vinegars`, `sweeteners`, `cleaning_supplies`, `paper_products`, `equipment`, `other`

**product_status:** `active`, `discontinued`, `seasonal`, `coming_soon`, `out_of_stock`, `limited_availability`

**storage_temperature:** `frozen`, `refrigerated`, `cool`, `room_temp`, `no_requirement`

**unit_of_measure:** `each`, `case`, `pallet`, `pound`, `ounce`, `gallon`, `quart`, `pint`, `liter`, `kilogram`, `gram`, `dozen`, `gross`, `box`, `bag`, `container`

**pricing_model_type:** `fixed`, `tiered`, `volume`, `subscription`, `custom`

**task_type:** `Call`, `Email`, `Meeting`, `Follow-up`, `Proposal`, `Discovery`, `Administrative`, `None`

### Test Factory Enum Usage

All enum fields have defaults defined in schema:
- `opportunity_stage` → default: `'new_lead'`
- `opportunity_status` → default: `'active'`
- `priority_level` → default: `'medium'`
- `product_status` → default: `'active'`
- `organization_type` → default: `'customer'`
- `task_type` → default: `'None'`

## Migration Patterns & Conventions

### Naming Convention

**Format:** `YYYYMMDDHHMMSS_snake_case_description.sql`

**Examples:**
- `20250127000000_consolidated_fresh_schema.sql`
- `20250928220851_normalize_contact_email_phone_to_arrays.sql`
- `20251005221416_fix_security_warnings.sql`

**Pattern:** Timestamp + descriptive name, no revision numbers in filenames.

### Migration Structure

**Standard sections in consolidated schema:**
1. Extensions (uuid-ossp, pgcrypto, pg_trgm)
2. Custom Types/Enums
3. Tables (in dependency order)
4. Indexes
5. Foreign Keys (inline with tables)
6. RLS Policies
7. Views
8. Functions & Triggers
9. Initial Data
10. Migration History Update
11. Storage Buckets

### Key Migration Patterns

**Soft Delete Pattern:**
```sql
deleted_at timestamptz
```
Never hard delete records - always use `deleted_at` timestamp.

**Full-Text Search Pattern:**
```sql
search_tsv tsvector
```
With trigger function:
```sql
CREATE FUNCTION update_[table]_search() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_tsv := to_tsvector('english',
    COALESCE(NEW.field1, '') || ' ' ||
    COALESCE(NEW.field2, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Timestamp Triggers:**
```sql
CREATE TRIGGER update_[table]_updated_at
  BEFORE UPDATE ON [table]
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Computed Columns (PostgreSQL GENERATED):**
```sql
quantity_available integer GENERATED ALWAYS AS
  (quantity_on_hand - quantity_committed) STORED
```

### Historical Context

**Consolidated Migration:** `20250127000000_consolidated_fresh_schema.sql`
- Consolidates 68 historical migrations
- Fresh start, no backward compatibility for "deals" → "opportunities"
- All environment variables renamed from `DEAL_*` to `OPPORTUNITY_*`

**Recent Changes:**
- `20250928220851` - Normalized email/phone from objects to arrays
- `20250929002034` - Renamed task `name` → `title`, added `type` enum
- `20251001120000` - Added `account_manager_id` and `lead_source` to opportunities
- `20251005221416` - Fixed SECURITY DEFINER view search_path warnings

## Test Data Factory Requirements

### Contacts Factory

**Required Fields:**
- `first_name` (min 1 char)
- `last_name` (min 1 char)
- `email` (JSONB array, at least one email object)
- `sales_id` (foreign key to sales table)

**JSONB Structure:**
```typescript
{
  email: [
    { email: "faker.email()", type: "Work" }
  ],
  phone: [
    { number: "faker.phoneNumber()", type: "Work" }
  ]
}
```

**Multi-Organization Validation:**
- Requires at least one entry in `contact_organizations` junction table
- Exactly one must have `is_primary: true`
- Each junction entry needs `organization_id`

**Validation Schema:** `/src/atomic-crm/validation/contacts.ts`

### Organizations Factory

**Required Fields:**
- `name` (min 1 char)

**Optional Common Fields:**
- `organization_type` (defaults to 'customer')
- `priority` ('A','B','C','D', defaults to 'C')
- `industry`, `website`, `phone`, `address`, `city`, `state`, `postal_code`
- `is_principal`, `is_distributor` (boolean flags)
- `parent_organization_id` (for hierarchies)

**URL Validation:**
- `website` - must match URL regex
- `linkedin_url` - must be from linkedin.com domain

**Validation Schema:** `/src/atomic-crm/validation/organizations.ts`

### Opportunities Factory

**Required Fields:**
- `name` (min 1 char)
- `contact_ids` (bigint array, at least one contact)
- `expected_closing_date` (string date, renamed from `estimated_close_date` in some contexts)

**Default Values:**
- `stage: 'new_lead'`
- `priority: 'medium'`
- `amount: 0`
- `probability: 50`

**Multi-Org Support:**
- `customer_organization_id`, `principal_organization_id`, `distributor_organization_id`
- All optional but commonly populated

**Gotcha:** Field `company_id` removed - use organization IDs instead.

**Validation Schema:** `/src/atomic-crm/validation/opportunities.ts`

### Tasks Factory

**Required Fields:**
- `title` (renamed from `name`)
- `contact_id` (bigint)
- `type` (task_type enum, defaults to 'None')
- `due_date` (date string)
- `sales_id` (bigint)

**Optional Common:**
- `description`, `priority` (defaults to 'medium')
- `opportunity_id`, `reminder_date`
- `completed` (boolean), `completed_at` (timestamptz)

**Validation Schema:** `/src/atomic-crm/validation/tasks.ts`

### Junction Table Factories

**contact_organizations:**
```typescript
{
  contact_id: number,
  organization_id: number,
  is_primary: boolean,  // Exactly one true per contact
  role?: contact_role enum,
  purchase_influence?: 0-100,
  decision_authority?: 0-100
}
```

**opportunity_participants:**
```typescript
{
  opportunity_id: number,
  organization_id: number,
  role: 'customer' | 'principal' | 'distributor' | 'partner' | 'competitor',
  is_primary?: boolean
}
```

## Edge Cases & Gotchas

### Contact Email/Phone Array Migration

**Issue:** Data structure changed from object to array format.

**Before (legacy):**
```json
{ "primary": "email@example.com", "work": "work@example.com" }
```

**After (current):**
```json
[{ "email": "email@example.com", "type": "primary" }]
```

**Migration:** `20250928220851_normalize_contact_email_phone_to_arrays.sql` with verification block to ensure no objects remain.

**Testing Impact:** Test factories must use array format exclusively.

### Primary Organization Requirement

**Rule:** Each contact must have exactly one `is_primary: true` in `contact_organizations`.

**Validation:** Enforced in Zod schema `contactSchema.superRefine()`:
- Zero primary → error: "One organization must be designated as primary"
- Multiple primary → error: "Only one organization can be designated as primary"

**Function:** `set_primary_organization(contact_id, organization_id)` RPC handles atomic primary reassignment.

### Task Name → Title Migration

**Change:** `tasks.name` renamed to `tasks.title` in migration `20250929002034`.

**Validation:** Zod schema uses `title` field.

**Testing Impact:** Seed scripts and factories must use `title` not `name`.

### Opportunity Stage vs Status

**stage** - Pipeline position (new_lead → closed_won/lost)
**status** - Activity state (active, on_hold, nurturing, stalled, expired)

**Manual Flags:**
- `stage_manual` - prevents automatic stage updates
- `status_manual` - prevents automatic status updates

### Computed Columns in Views

**opportunities_summary.total_amount** - calculated from opportunity_products
**opportunity_products.final_price** - GENERATED ALWAYS AS stored column

**Testing Impact:** Cannot directly set computed values - must create related records.

### Legacy Field Removal

**Contacts:**
- `company_id` → use `contact_organizations` junction
- `role`, `department`, `purchase_influence`, `decision_authority` at contact level → moved to junction table

**Opportunities:**
- `company_id` → use `customer_organization_id`, `principal_organization_id`, `distributor_organization_id`
- `archived_at` → use `deleted_at` or stage transitions

**Validation:** Zod schemas throw descriptive errors when legacy fields detected.

### Search TSVector Auto-Update

**Trigger Pattern:** All tables with `search_tsv` have BEFORE INSERT/UPDATE triggers.

**Testing Impact:** Don't manually set `search_tsv` - it's auto-computed from content fields.

### Security Definer Views

**Pattern:** Views use `WITH (security_invoker = false)` for React Admin compatibility.

**Recent Fix:** Migration `20251005221416` added `SET search_path = public, pg_temp` to all SECURITY DEFINER functions/views to fix PostgreSQL warnings.

## Relevant Files

### Schema & Migrations
- `/home/krwhynot/Projects/atomic/supabase/migrations/20250127000000_consolidated_fresh_schema.sql` - Complete schema definition
- `/home/krwhynot/Projects/atomic/supabase/migrations/20250928220851_normalize_contact_email_phone_to_arrays.sql` - JSONB array migration
- `/home/krwhynot/Projects/atomic/supabase/migrations/20250929080000_add_company_name_to_contacts_summary.sql` - View enhancement
- `/home/krwhynot/Projects/atomic/supabase/migrations/20251005221416_fix_security_warnings.sql` - Latest security fixes

### Validation Schemas (Zod)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/contacts.ts` - Contact validation with JSONB array schemas
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts` - Opportunity validation
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/organizations.ts` - Organization validation
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/tasks.ts` - Task validation with type enum
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/index.ts` - Validation exports

### Existing Tests
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/contacts/validation.test.ts` - Contact validation tests
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/opportunities/validation.test.ts` - Opportunity tests
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/organizations/validation.test.ts` - Organization tests
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/tasks/validation.test.ts` - Task tests

### Seed Data
- `/home/krwhynot/Projects/atomic/scripts/seed-fake-data.ts` - Production seed script with faker.js

## Testing Strategy Recommendations

### Test Data Factories Priority

1. **Core Entities** (implement first):
   - `SalesFactory` - user/sales rep (required for most entities)
   - `OrganizationFactory` - companies
   - `ContactFactory` with JSONB email/phone arrays
   - `ContactOrganizationFactory` - junction with primary flag handling

2. **Opportunities & Pipeline**:
   - `OpportunityFactory` with multi-org support
   - `OpportunityParticipantsFactory` - junction
   - `ProductFactory` - catalog items
   - `OpportunityProductsFactory` - junction with pricing

3. **Activities & Tasks**:
   - `ActivityFactory` - with interaction_type enum
   - `TaskFactory` - with task_type enum
   - `ContactNotesFactory`, `OpportunityNotesFactory`

### JSONB Field Testing

**Strategy:** Create helper functions for JSONB array generation:

```typescript
// Example helper patterns
function createEmailArray(count = 1): Array<{email: string, type: string}> {
  return Array.from({length: count}, (_, i) => ({
    email: faker.internet.email(),
    type: i === 0 ? 'Work' : faker.helpers.arrayElement(['Home', 'Other'])
  }));
}

function createPhoneArray(count = 1): Array<{number: string, type: string}> {
  return Array.from({length: count}, () => ({
    number: faker.phone.number(),
    type: faker.helpers.arrayElement(['Work', 'Home', 'Mobile', 'Other'])
  }));
}
```

### Junction Table Testing

**Critical Rules to Enforce:**

1. **contact_organizations:**
   - Exactly one `is_primary: true` per contact_id
   - Create helper: `createPrimaryOrganizationLink(contactId, orgId)`
   - Create helper: `addSecondaryOrganization(contactId, orgId)`

2. **opportunity_participants:**
   - Test all role variants ('customer', 'principal', 'distributor', 'partner', 'competitor')
   - Validate commission_rate constraints (0-1 range)

### Migration Pattern Testing

**Validation Tests:**
- Soft delete behavior (deleted_at filters in views)
- Search tsvector auto-updates on INSERT/UPDATE
- Computed column generation (opportunity_products.final_price)
- RLS policy enforcement with authenticated users

### View Testing

**contacts_summary:**
- Test company_name selection with/without primary organization
- Test organization_ids aggregation

**opportunities_summary:**
- Test total_amount calculation with opportunity_products
- Test item_count aggregation

## Relevant Documentation

### Database Tools
- Supabase Lite MCP tools for database operations:
  - `mcp__supabase-lite__execute_sql` - SELECT/INSERT/UPDATE/DELETE queries
  - `mcp__supabase-lite__apply_migration` - DDL operations
  - `mcp__supabase-lite__list_tables` - Schema inspection
  - `mcp__supabase-lite__get_advisors` - Security/performance recommendations

### External References
- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [Zod Schema Validation](https://zod.dev/)
- [Faker.js for Test Data](https://fakerjs.dev/)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-06
**Research Scope:** Database architecture for UI/UX testing automation
