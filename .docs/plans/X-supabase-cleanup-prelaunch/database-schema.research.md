# Database Schema Research - Atomic CRM

**Research Date:** October 15, 2025
**Migration Files Analyzed:**
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251013000000_cloud_schema_sync.sql` (3445 lines)
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251015014019_restore_auth_triggers.sql` (29 lines)

## Overview

The Atomic CRM database uses a PostgreSQL schema with comprehensive Row Level Security (RLS), full-text search indexing, and multi-stakeholder relationship tracking. The schema supports a food industry sales pipeline with products, distributors, principals, customers, contacts, opportunities, and activity tracking. Key architectural decisions include database views for denormalization, triggers for auth-to-sales synchronization, and extensive use of JSONB for flexible data structures.

## Relevant Files

### Migration Files
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251013000000_cloud_schema_sync.sql` - Complete schema definition with 22 tables, 17 functions, views, indexes, and RLS policies
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251015014019_restore_auth_triggers.sql` - Auth trigger restoration for user-sales sync
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/RECONCILIATION_SUMMARY.md` - Migration reconciliation notes

## Core Tables

### 1. Authentication & User Management

#### `auth.users` (Supabase managed)
- Core authentication table managed by Supabase Auth
- Synced to `public.sales` via triggers
- **Gotcha:** Cannot be directly queried or modified; requires Edge Functions for user management

#### `public.sales`
Primary sales user table that mirrors auth.users with CRM-specific fields.

**Key Columns:**
- `id` (bigint, PK) - Internal sales ID
- `user_id` (uuid, FK → auth.users.id, UNIQUE) - Links to Supabase auth user
- `first_name`, `last_name`, `email`, `phone` - User profile data
- `avatar_url` - Profile image
- `is_admin` (boolean) - Admin flag
- `disabled` (boolean) - Soft disable flag (users can be banned in Supabase, not deleted)
- `deleted_at` (timestamp) - Soft delete
- Standard audit: `created_at`, `updated_at`

**Foreign Key:** `user_id` → `auth.users(id)` ON DELETE CASCADE
**Unique Constraint:** `sales_user_id_key` on `user_id`
**Indexes:** None explicit beyond PK and unique constraint

**Migration Reference:** Lines 1933-1963

---

### 2. Contact Management

#### `public.contacts`
Core contact entity representing individuals.

**Key Columns:**
- `id` (bigint, PK)
- `name` (text, NOT NULL) - Full name
- `first_name`, `last_name` - Name components
- `email` (jsonb, default '[]') - Array of email addresses
- `phone` (jsonb, default '[]') - Array of phone numbers
- `title`, `department` - Job information
- `address`, `city`, `state`, `postal_code`, `country` - Location (default 'USA')
- `birthday` (date), `linkedin_url`, `twitter_handle` - Personal details
- `gender` (text) - Configurable gender field
- `notes` (text) - Freeform notes
- `organization_id` (bigint, FK → organizations.id) - **Primary organization** (replaces many-to-many)
- `sales_id` (bigint, FK → sales.id) - Assigned sales rep
- `created_by` (bigint, FK → sales.id) - Audit
- `tags` (bigint[]) - Array of tag IDs
- `search_tsv` (tsvector) - Full-text search index
- `first_seen`, `last_seen` (timestamp) - Tracking
- Standard audit: `created_at`, `updated_at`, `deleted_at`

**Foreign Keys:**
- `organization_id` → `organizations(id)` ON DELETE SET NULL
- `sales_id` → `sales(id)`
- `created_by` → `sales(id)`

**Indexes:**
- `idx_contacts_deleted_at` - Filtered on non-deleted
- `idx_contacts_organization_id` - FK lookup
- `idx_contacts_sales_id` - FK lookup
- `idx_contacts_search_tsv` - GIN index for full-text search

**Triggers:** `update_search_tsv` - Auto-updates search_tsv on insert/update

**Migration Reference:** Lines 1271-1326

**Gotcha:** `email` and `phone` are JSONB arrays, not simple text fields. This supports multiple contact methods per person.

---

#### `public.contact_organizations` (DEPRECATED)
Junction table for many-to-many contact-organization relationships.

**Key Columns:**
- `id` (bigint, PK)
- `contact_id` (bigint, FK → contacts.id)
- `organization_id` (bigint, FK → organizations.id)
- `is_primary` (boolean) - Primary organization flag
- `is_primary_decision_maker` (boolean) - Decision maker flag
- `relationship_start_date`, `relationship_end_date` (date) - Tenure tracking
- `notes` (text)
- Standard audit: `created_at`, `updated_at`, `created_by`, `deleted_at`

**Constraint:** `valid_relationship_dates` - End date must be after start date

**Foreign Keys:**
- `contact_id` → `contacts(id)` ON DELETE CASCADE
- `organization_id` → `organizations(id)` (implicit)
- `created_by` → `sales(id)`

**Indexes:**
- `idx_contact_organizations_contact` - FK lookup (filtered non-deleted)
- `idx_contact_organizations_organization` - FK lookup (filtered non-deleted)
- `idx_contact_organizations_primary` - Primary org lookup (filtered)
- `idx_contact_organizations_decision_makers` - Decision maker lookup (filtered)
- `idx_contact_orgs_lookup` - Composite (contact_id, is_primary DESC, created_at)
- `idx_contact_organizations_unique_contact` - UNIQUE on contact_id (filtered non-deleted)

**Migration Reference:** Lines 1199-1234

**Important:** Table is marked DEPRECATED in schema comments. New implementation uses `contacts.organization_id` directly. Kept for historical data only.

---

#### `public.contact_preferred_principals`
Tracks which principals (brands) a contact prefers or advocates for.

**Key Columns:**
- `id` (bigint, PK)
- `contact_id` (bigint, FK → contacts.id)
- `principal_organization_id` (bigint, FK → organizations.id where is_principal=true)
- `advocacy_strength` (smallint, 0-100, default 50) - Preference strength
- `last_interaction_date` (date)
- `notes` (text)
- Standard audit: `created_at`, `updated_at`, `created_by`, `deleted_at`

**Constraint:** `advocacy_strength` CHECK (0-100)
**Unique Constraint:** `unique_contact_principal_active` on (contact_id, principal_organization_id, deleted_at)

**Foreign Keys:**
- `contact_id` → `contacts(id)` ON DELETE CASCADE
- `created_by` → `sales(id)`

**Indexes:**
- `idx_contact_preferred_principals_contact` - FK lookup
- `idx_contact_preferred_principals_principal` - FK lookup
- `idx_contact_preferred_principals_strength` - Strength sorting

**Migration Reference:** Lines 1238-1267

---

#### `public.contactNotes`
Notes attached to contacts.

**Key Columns:**
- `id` (bigint, PK)
- `contact_id` (bigint, FK → contacts.id, NOT NULL)
- `text` (text, NOT NULL) - Note content
- `attachments` (text[]) - File references
- `sales_id` (bigint, FK → sales.id) - Author
- `date` (timestamp, NOT NULL, default now()) - **User-specified date** (separate from created_at)
- Standard audit: `created_at`, `updated_at`

**Foreign Keys:**
- `contact_id` → `contacts(id)` ON DELETE CASCADE
- `sales_id` → `sales(id)` ON DELETE CASCADE

**Indexes:**
- `idx_contact_notes_contact_id` - FK lookup

**Migration Reference:** Lines 1165-1195

**Gotcha:** `date` field is user-specified and distinct from `created_at`. This allows backdating or future-dating notes.

---

### 3. Organization Management

#### `public.organizations`
Companies, principals (brands), distributors, customers, prospects, and partners.

**Key Columns:**
- `id` (bigint, PK)
- `name` (text, NOT NULL)
- `organization_type` (enum: customer, principal, distributor, prospect, partner, unknown, default 'unknown')
- `is_principal` (boolean) - Brand/manufacturer flag
- `is_distributor` (boolean) - Distribution partner flag
- `parent_organization_id` (bigint, FK → organizations.id) - Hierarchical structure
- `priority` (varchar(1), A/B/C/D, default 'C') - Account priority
- `segment_id` (uuid, FK → segments.id) - Industry segment (nullable)
- Contact info: `website`, `address`, `city`, `state`, `postal_code`, `phone`, `email`
- `logo_url`, `linkedin_url` - Digital presence
- `annual_revenue` (numeric 15,2), `employee_count` (integer), `founded_year` (integer) - Company metrics
- `context_links` (jsonb) - Related URLs/references
- `description` (text), `tax_identifier` (text) - Details
- `notes` (text)
- `sales_id` (bigint, FK → sales.id) - Account owner
- `import_session_id` (uuid) - Batch import tracking
- `search_tsv` (tsvector) - Full-text search
- Standard audit: `created_at`, `updated_at`, `created_by`, `deleted_at`

**Constraint:** `priority` CHECK (A/B/C/D)

**Foreign Keys:**
- `parent_organization_id` → `organizations(id)` ON DELETE SET NULL
- `sales_id` → `sales(id)`
- `segment_id` → `segments(id)` (implicit FK)
- `created_by` → `sales(id)`

**Indexes:**
- `idx_companies_deleted_at` - Filtered non-deleted
- `idx_companies_is_distributor` - Filtered where is_distributor=true
- `idx_companies_is_principal` - Filtered where is_principal=true
- `idx_companies_organization_type` - Type filtering
- `idx_companies_parent_company_id` - Hierarchy navigation (filtered non-null)
- `idx_companies_priority` - Priority sorting
- `idx_companies_sales_id` - Account owner lookup
- `idx_companies_search_tsv` - GIN full-text search

**Triggers:** `update_organizations_search_tsv` - Auto-updates search_tsv

**Migration Reference:** Lines 1329-1362

**Schema Comment:** `segment_id` is nullable; UI defaults to "Unknown" for better UX.

---

#### `public.segments` (formerly industries)
Industry segments for organization categorization.

**Key Columns:**
- `id` (uuid, PK, default gen_random_uuid())
- `name` (text, NOT NULL)
- `created_at` (timestamp, NOT NULL)
- `created_by` (uuid, FK → auth.users.id)

**Unique Constraint:** `industries_name_unique` on `name`
**Unique Index:** `industries_name_case_insensitive_idx` on `lower(name)` - Case-insensitive uniqueness

**Foreign Key:** `created_by` → `auth.users(id)` (NOT sales table, unusual)

**Helper Function:** `get_or_create_segment(p_name text)` - Idempotent segment creation with case-insensitive lookup

**Migration Reference:** Lines 402-410, 413-427

**Gotcha:** Uses `uuid` PK instead of `bigint` like other tables. Also uses `auth.users` FK instead of `sales` table.

---

### 4. Opportunity/Pipeline Management

#### `public.opportunities`
Sales pipeline/deal tracking with multi-stakeholder support.

**Key Columns:**
- `id` (bigint, PK)
- `name` (text, NOT NULL)
- `description` (text)
- `stage` (enum: new_lead, initial_outreach, sample_visit_offered, awaiting_response, feedback_logged, demo_scheduled, closed_won, closed_lost, default 'new_lead')
- `status` (enum: active, on_hold, nurturing, stalled, expired, default 'active')
- `priority` (enum: low, medium, high, critical, default 'medium')
- `index` (integer) - Sort order in pipeline
- `estimated_close_date` (date, default CURRENT_DATE + 90 days)
- `actual_close_date` (date)
- **Multi-organization support:**
  - `customer_organization_id` (bigint) - Customer
  - `principal_organization_id` (bigint) - Principal/brand
  - `distributor_organization_id` (bigint) - Distributor
- `founding_interaction_id` (bigint) - First interaction that created this opportunity
- `stage_manual`, `status_manual` (boolean) - Override auto-progression flags
- `next_action` (text), `next_action_date` (date) - Follow-up planning
- `competition` (text), `decision_criteria` (text) - Competitive analysis
- `contact_ids` (bigint[]) - Array of contact IDs (deprecated pattern, see opportunity_participants)
- `opportunity_owner_id` (bigint, FK → sales.id) - Sales rep owner
- `account_manager_id` (bigint, FK → sales.id) - Account manager
- `lead_source` (text, CHECK constraint: referral, trade_show, website, cold_call, email_campaign, social_media, partner, existing_customer)
- `tags` (text[]) - Opportunity tags (e.g., urgent, big-deal, repeat-customer)
- `search_tsv` (tsvector) - Full-text search
- Standard audit: `created_at`, `updated_at`, `created_by`, `deleted_at`

**Foreign Keys:**
- `opportunity_owner_id` → `sales(id)` (aliased as sales_id_fkey)
- `account_manager_id` → `sales(id)` ON DELETE SET NULL
- `created_by` → `sales(id)`

**Indexes:**
- Standard indexes expected (not explicitly listed in grep output, likely in lines 2400+)

**Migration Reference:** Lines 1488-1542

**Schema Comments:** Multi-stakeholder sales pipeline support. `account_manager_id` is bigint FK to sales.id.

---

#### `public.opportunity_participants`
Junction table for opportunities with multiple organizations (customer, principal, distributor, partner, competitor).

**Key Columns:**
- `id` (bigint, PK)
- `opportunity_id` (bigint, FK → opportunities.id, NOT NULL)
- `organization_id` (bigint, FK → organizations.id, NOT NULL)
- `role` (varchar(20), CHECK: customer, principal, distributor, partner, competitor)
- `is_primary` (boolean) - Primary organization in this role
- `commission_rate` (numeric 5,4, 0-1) - Commission percentage (e.g., 0.0500 = 5%)
- `territory` (text) - Territory restriction
- `notes` (text)
- Standard audit: `created_at`, `updated_at`, `created_by`, `deleted_at`

**Constraints:**
- `opportunity_participants_role_check` - Valid roles
- `opportunity_participants_commission_rate_check` - 0-1 range

**Foreign Keys:**
- `opportunity_id` → `opportunities(id)` ON DELETE CASCADE
- `created_by` → `sales(id)`

**Indexes:** Expected (not shown in grep)

**Migration Reference:** Lines 1594-1626

**Helper Function:** `create_opportunity_with_participants(p_opportunity_data jsonb, p_participants jsonb[])` - Atomic opportunity creation with participants

---

#### `public.opportunityNotes`
Notes attached to opportunities.

**Key Columns:**
- `id` (bigint, PK)
- `opportunity_id` (bigint, FK → opportunities.id, NOT NULL)
- `text` (text, NOT NULL)
- `sales_id` (bigint, FK → sales.id)
- Standard audit: `created_at`, `updated_at`

**Foreign Keys:**
- `opportunity_id` → `opportunities(id)` ON DELETE CASCADE
- `sales_id` → `sales(id)` ON DELETE CASCADE

**Migration Reference:** Lines 1560-1592

---

### 5. Activity & Interaction Tracking

#### `public.activities`
Unified activity log for engagements (general contact interactions) and interactions (opportunity-specific).

**Key Columns:**
- `id` (bigint, PK)
- `activity_type` (enum: engagement, interaction) - **Engagement** = general activity, **Interaction** = opportunity-tied
- `type` (enum: call, email, meeting, demo, proposal, follow_up, trade_show, site_visit, contract_review, check_in, social)
- `subject` (text, NOT NULL)
- `description` (text)
- `activity_date` (timestamp, default now())
- `duration_minutes` (integer)
- `contact_id` (bigint, FK → contacts.id) - Associated contact (optional)
- `organization_id` (bigint) - Associated organization (optional)
- `opportunity_id` (bigint, FK → opportunities.id) - **Required if activity_type='interaction'**
- `follow_up_required` (boolean), `follow_up_date` (date), `follow_up_notes` (text) - Follow-up tracking
- `outcome` (text), `sentiment` (varchar(10), CHECK: positive, neutral, negative) - Results
- `attachments` (text[]), `location` (text), `attendees` (text[]), `tags` (text[]) - Metadata
- Standard audit: `created_at`, `updated_at`, `created_by`, `deleted_at`

**Constraints:**
- `check_has_contact_or_org` - Must have either contact_id or organization_id
- `check_interaction_has_opportunity` - If activity_type='interaction', must have opportunity_id
- `activities_sentiment_check` - Valid sentiments

**Foreign Keys:**
- `contact_id` → `contacts(id)`
- `opportunity_id` → `opportunities(id)`
- `created_by` → `sales(id)`

**Indexes:**
- `idx_activities_contact` - Contact lookup (filtered non-deleted)
- `idx_activities_date` - Date sorting DESC (filtered non-deleted)
- `idx_activities_follow_up` - Follow-up due (filtered follow_up_required=true, non-deleted)
- `idx_activities_opportunity` - Opportunity lookup (filtered non-null, non-deleted)
- `idx_activities_organization` - Organization lookup (filtered non-deleted)
- `idx_activities_type` - Type filtering (activity_type, type, filtered non-deleted)

**Trigger:** `validate_activity_consistency` - Enforces constraint logic

**Helper Functions:**
- `log_engagement(...)` - Creates engagement-type activities
- `log_interaction(...)` - Creates interaction-type activities with opportunity

**Migration Reference:** Lines 1117-1144

**Gotcha:** Two activity types with different requirements. "Engagements" are general, "Interactions" are opportunity-specific and require opportunity_id.

---

#### `public.interaction_participants`
Tracks which contacts/organizations participated in specific activities.

**Key Columns:**
- `id` (bigint, PK)
- `activity_id` (bigint, FK → activities.id, NOT NULL)
- `contact_id` (bigint, FK → contacts.id)
- `organization_id` (bigint)
- `role` (text) - Participant role
- `notes` (text)
- Standard audit: `created_at`, `updated_at`, `created_by`, `deleted_at`

**Foreign Keys:**
- `activity_id` → `activities(id)` ON DELETE CASCADE
- `contact_id` → `contacts(id)`
- `created_by` → `sales(id)`

**Indexes:**
- `idx_interaction_participants_activity` - Activity lookup
- `idx_interaction_participants_contact` - Contact lookup
- `idx_interaction_participants_organization` - Organization lookup

**Migration Reference:** Lines 1426-1454

---

### 6. Task Management

#### `public.tasks`
To-do items linked to contacts and opportunities.

**Key Columns:**
- `id` (bigint, PK)
- `title` (text, NOT NULL) - Brief task description
- `description` (text) - Optional detailed description
- `type` (enum: Call, Email, Meeting, Follow-up, Proposal, Discovery, Administrative, None, default 'None')
- `due_date` (date), `reminder_date` (date) - Scheduling
- `completed` (boolean, default false), `completed_at` (timestamp) - Completion tracking
- `priority` (enum: low, medium, high, critical, default 'medium')
- `contact_id` (bigint, FK → contacts.id)
- `opportunity_id` (bigint, FK → opportunities.id)
- `sales_id` (bigint, FK → sales.id) - Assignee
- Standard audit: `created_at`, `updated_at`

**Foreign Keys:**
- `contact_id` → `contacts(id)` ON DELETE CASCADE
- `opportunity_id` → `opportunities(id)`
- `sales_id` → `sales(id)`

**Migration Reference:** Lines 1996-2040

---

### 7. Product Management (Food Industry Focus)

#### `public.products`
Product catalog with food industry specifics.

**Key Columns:**
- `id` (bigint, PK)
- `principal_id` (bigint, NOT NULL) - Brand/manufacturer organization
- `name` (text, NOT NULL), `description` (text)
- `sku` (text, NOT NULL) - Stock keeping unit
- `manufacturer_part_number` (text) - Manufacturer's part number
- `category` (enum: beverages, dairy, frozen, fresh_produce, meat_poultry, seafood, dry_goods, snacks, condiments, baking_supplies, spices_seasonings, canned_goods, pasta_grains, oils_vinegars, sweeteners, cleaning_supplies, paper_products, equipment, other)
- `list_price` (numeric 12,2), `currency_code` (text, default 'USD', CHECK: 3-letter code)
- `unit_of_measure` (text, default 'each')
- `minimum_order_quantity` (integer, default 1, CHECK: > 0)
- `status` (enum: active, discontinued, seasonal, coming_soon, out_of_stock, limited_availability, default 'active')
- **Food-specific:**
  - `certifications` (text[]) - e.g., Organic, Kosher, Halal
  - `allergens` (text[]) - Allergen warnings
  - `ingredients` (text) - Ingredient list
  - `nutritional_info` (jsonb) - Structured nutrition data
- `marketing_description` (text) - Sales copy
- `search_tsv` (tsvector) - Full-text search
- Standard audit: `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`

**Constraints:**
- `check_currency_code` - 3-letter ISO currency
- `check_minimum_order_quantity` - Must be > 0

**Unique Constraint:** `unique_sku_per_principal` on (principal_id, sku, deleted_at) - SKU unique per brand

**Foreign Keys:**
- `created_by` → `sales(id)`
- `updated_by` → `sales(id)`

**Triggers:**
- `products_search_trigger` - Updates search_tsv
- `validate_principal_organization` - Ensures principal_id references an organization with is_principal=true

**Helper Function:** `update_products_search()` - Search index maintenance

**Migration Reference:** Lines 1878-1929

**Schema Comment:** MVP product schema focused on essential fields for food product sales.

---

#### `public.product_category_hierarchy`
Hierarchical product categories (beyond flat enum).

**Key Columns:**
- `id` (bigint, PK)
- `category_name` (text, NOT NULL, UNIQUE)
- `parent_category_id` (bigint, FK → self) - Self-referential hierarchy
- `description` (text)
- Standard audit: `created_at`, `updated_at`

**Unique Constraint:** `product_category_hierarchy_category_name_key` on `category_name`

**Foreign Key:** `parent_category_id` → `product_category_hierarchy(id)`

**Migration Reference:** Lines 1675-1706

---

#### `public.product_distributor_authorizations`
Tracks which distributors are authorized to sell which products.

**Key Columns:**
- `id` (bigint, PK)
- `product_id` (bigint, FK → products.id, NOT NULL)
- `distributor_id` (bigint, NOT NULL) - Organization ID (should be is_distributor=true)
- `is_authorized` (boolean, default true)
- `authorization_date` (date, default CURRENT_DATE), `expiration_date` (date)
- `special_pricing` (jsonb) - Custom pricing rules
- `territory_restrictions` (text[]) - Geographic limits
- `notes` (text)
- Standard audit: `created_at`, `updated_at`, `created_by`

**Unique Constraint:** `unique_product_distributor` on (product_id, distributor_id)

**Foreign Keys:**
- `product_id` → `products(id)` ON DELETE CASCADE
- `created_by` → `sales(id)`

**Migration Reference:** Lines 1708-1738

---

#### `public.product_features`
Key product features (e.g., "Gluten-Free", "Organic").

**Key Columns:**
- `id` (bigint, PK)
- `product_id` (bigint, FK → products.id, NOT NULL)
- `feature_name` (text, NOT NULL), `feature_value` (text)
- `display_order` (integer, default 0), `is_highlighted` (boolean, default false)
- `created_at` (timestamp)

**Foreign Key:** `product_id` → `products(id)` ON DELETE CASCADE

**Migration Reference:** Lines 1742-1767

---

#### `public.product_inventory`
Inventory tracking per product/warehouse.

**Key Columns:**
- `id` (bigint, PK)
- `product_id` (bigint, FK → products.id, NOT NULL)
- `warehouse_location` (text)
- `quantity_on_hand` (integer, default 0)
- `quantity_committed` (integer, default 0) - Reserved for orders
- `quantity_available` (integer, **GENERATED** as quantity_on_hand - quantity_committed) - Computed column
- `reorder_point`, `reorder_quantity` (integer) - Restocking triggers
- `last_restock_date`, `next_restock_date` (date)
- `lot_numbers` (jsonb) - Batch tracking
- `updated_at` (timestamp)

**Constraint:** `non_negative_inventory` - Both quantities must be >= 0

**Foreign Key:** `product_id` → `products(id)` ON DELETE CASCADE

**Helper Function:** `check_product_availability(p_product_id, p_quantity, p_needed_date)` - Checks if product can be fulfilled

**Migration Reference:** Lines 1771-1802

**Gotcha:** `quantity_available` is a GENERATED STORED column, automatically calculated.

---

#### `public.product_pricing_models`
Defines pricing models for products (fixed, tiered, volume, subscription, custom).

**Key Columns:**
- `id` (bigint, PK)
- `product_id` (bigint, FK → products.id, NOT NULL)
- `model_type` (enum: fixed, tiered, volume, subscription, custom, default 'fixed')
- `base_price`, `min_price`, `max_price` (numeric 12,2)
- `pricing_rules` (jsonb) - Flexible rules structure
- `is_active` (boolean, default true)
- Standard audit: `created_at`, `updated_at`, `created_by`

**Foreign Keys:**
- `product_id` → `products(id)` ON DELETE CASCADE
- `created_by` → `sales(id)`

**Trigger:** `validate_pricing_tiers` - Ensures pricing tier consistency

**Migration Reference:** Lines 1806-1835

---

#### `public.product_pricing_tiers`
Tiered pricing (e.g., 1-10 units @ $5, 11-50 @ $4.50).

**Key Columns:**
- `id` (bigint, PK)
- `product_id` (bigint, FK → products.id, NOT NULL)
- `tier_name` (text) - e.g., "Bulk Discount"
- `min_quantity`, `max_quantity` (integer)
- `unit_price` (numeric 12,2, NOT NULL)
- `discount_percent` (numeric 5,2), `discount_amount` (numeric 12,2) - Alternative discount methods
- `distributor_id` (bigint) - Distributor-specific pricing
- `is_active` (boolean, default true)
- Standard audit: `created_at`, `updated_at`, `created_by`

**Foreign Keys:**
- `product_id` → `products(id)` ON DELETE CASCADE
- `created_by` → `sales(id)`

**Helper Function:** `calculate_product_price(p_product_id, p_quantity, p_distributor_id)` - Calculates pricing with tier/discount logic

**Migration Reference:** Lines 1839-1875

---

### 8. Supporting Tables

#### `public.tags`
Reusable tags for contacts and opportunities.

**Key Columns:**
- `id` (bigint, PK)
- `name` (text, NOT NULL, UNIQUE)
- `color` (text, default 'blue-500')
- `description` (text)
- `usage_count` (integer, default 0) - Track tag popularity
- `created_at`, `updated_at` (timestamp)

**Unique Constraint:** `tags_name_key` on `name`

**Migration Reference:** Lines 1967-1994

---

#### `public.migration_history`
Tracks applied migrations (supplemental to Supabase's built-in tracking).

**Key Columns:**
- `id` (bigint, PK)
- `migration_name` (text, NOT NULL)
- `applied_at` (timestamp, default now())
- `checksum` (text)
- `description` (text)

**Migration Reference:** Lines 1456-1486

---

## Relationship Diagrams

### Auth & User Flow
```
auth.users (Supabase)
    ↓ (triggers: on_auth_user_created, on_auth_user_updated)
public.sales
    ↓ (FK: created_by, sales_id, etc.)
contacts, organizations, opportunities, tasks, activities
```

### Core Entity Relationships
```
sales (users)
    ├─→ contacts (created_by, sales_id)
    ├─→ organizations (created_by, sales_id)
    ├─→ opportunities (created_by, opportunity_owner_id, account_manager_id)
    ├─→ tasks (sales_id)
    └─→ activities (created_by)

organizations
    ├─→ contacts (organization_id) - PRIMARY organization
    ├─→ contact_organizations (DEPRECATED many-to-many)
    ├─→ opportunities (customer_org_id, principal_org_id, distributor_org_id)
    ├─→ opportunity_participants (junction, multi-role)
    └─→ products (principal_id) - Products belong to principals

contacts
    ├─→ contactNotes
    ├─→ contact_preferred_principals (advocacy tracking)
    ├─→ activities (contact_id)
    ├─→ tasks (contact_id)
    └─→ interaction_participants

opportunities
    ├─→ opportunityNotes
    ├─→ opportunity_participants (multi-org involvement)
    ├─→ activities (opportunity_id, for activity_type='interaction')
    └─→ tasks (opportunity_id)

products (principal_id → organizations)
    ├─→ product_features
    ├─→ product_inventory
    ├─→ product_pricing_models
    ├─→ product_pricing_tiers
    └─→ product_distributor_authorizations
```

### Activity Tracking Flow
```
activities (unified log)
    ├─→ activity_type = 'engagement' (general contact/org activity)
    │       ↓
    │   Must have: contact_id OR organization_id
    │   Optional: opportunity_id
    │
    └─→ activity_type = 'interaction' (opportunity-tied)
            ↓
        Must have: opportunity_id
        Optional: contact_id, organization_id

activities
    ├─→ interaction_participants (who attended)
    └─→ opportunities (founding_interaction_id) - Activities can spawn opportunities
```

## Indexes and Constraints

### Primary Keys
All tables use `bigint` SERIAL primary keys (id) **except**:
- `segments.id` - Uses `uuid` with `gen_random_uuid()`

### Foreign Keys - Cascade Behavior
**ON DELETE CASCADE** (child deleted when parent deleted):
- `contactNotes.contact_id` → contacts
- `contactNotes.sales_id` → sales
- `contact_organizations.contact_id` → contacts
- `contact_preferred_principals.contact_id` → contacts
- `tasks.contact_id` → contacts
- `opportunityNotes.opportunity_id` → opportunities
- `opportunityNotes.sales_id` → sales
- `opportunity_participants.opportunity_id` → opportunities
- `sales.user_id` → auth.users
- `interaction_participants.activity_id` → activities
- All product sub-tables → products

**ON DELETE SET NULL** (nullable FKs):
- `contacts.organization_id` → organizations
- `organizations.parent_organization_id` → organizations (self-reference)
- `opportunities.account_manager_id` → sales

**No explicit ON DELETE** (default RESTRICT):
- Most `created_by` fields
- Most `sales_id` assignment fields

### Unique Constraints
- `sales.user_id` - One sales record per auth user
- `tags.name` - Unique tag names
- `product_category_hierarchy.category_name` - Unique category names
- `segments.name` - Unique segment names (case-insensitive via index)
- `unique_sku_per_principal` - (principal_id, sku, deleted_at) - SKU unique per brand
- `unique_product_distributor` - (product_id, distributor_id)
- `unique_contact_principal_active` - (contact_id, principal_organization_id, deleted_at)
- `idx_contact_organizations_unique_contact` - One active contact_organizations record per contact (UNIQUE filtered)

### Check Constraints
- `organizations.priority` - Must be A/B/C/D
- `contact_organizations.valid_relationship_dates` - End > start
- `contact_preferred_principals.advocacy_strength` - 0-100
- `opportunities.lead_source` - Valid enum values
- `opportunity_participants.role` - Valid roles
- `opportunity_participants.commission_rate` - 0-1
- `activities.sentiment` - positive/neutral/negative
- `activities.check_has_contact_or_org` - Must have contact OR org
- `activities.check_interaction_has_opportunity` - Interactions need opportunity_id
- `product_inventory.non_negative_inventory` - Quantities >= 0
- `products.check_currency_code` - 3-letter ISO code
- `products.check_minimum_order_quantity` - > 0

### Performance Indexes

**Full-Text Search (GIN indexes):**
- `contacts.search_tsv`
- `organizations.search_tsv`
- `opportunities.search_tsv` (expected)
- `products.search_tsv`

**Filtered Indexes (Common Pattern: WHERE deleted_at IS NULL):**
- Most FK lookup indexes filter on non-deleted records
- Example: `idx_contacts_deleted_at` on contacts WHERE deleted_at IS NULL

**Composite Indexes:**
- `idx_contact_orgs_lookup` - (contact_id, is_primary DESC, created_at) - Optimizes primary org lookup
- `idx_contact_organizations_decision_makers` - (organization_id, is_primary_decision_maker) WHERE both conditions true
- `idx_activities_type` - (activity_type, type) - Multi-column filtering

**Special Indexes:**
- `industries_name_case_insensitive_idx` - `lower(name)` for case-insensitive uniqueness
- `idx_activities_follow_up` - Filtered WHERE follow_up_required=true
- `idx_companies_is_principal`, `idx_companies_is_distributor` - Filtered WHERE flag=true

### Generated Columns
- `product_inventory.quantity_available` - GENERATED ALWAYS AS (quantity_on_hand - quantity_committed) STORED

## Database Views

### `public.contacts_summary`
Denormalized contact list with organization name included.

**Definition:**
```sql
SELECT c.*, o.name AS company_name
FROM contacts c
LEFT JOIN organizations o ON o.id = c.organization_id AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL
```

**Purpose:** Simplifies UI queries by pre-joining primary organization name. Uses direct `contacts.organization_id` relationship (not deprecated junction table).

**Migration Reference:** Lines 1384-1422

---

### `public.organizations_summary`
Denormalized organization list with counts and activity tracking.

**Purpose:** Aggregates opportunity count, contact count, and last opportunity activity date per organization. Includes searchable fields (phone, website, address).

**Note:** Schema shows only column definitions without SELECT logic (placeholder view). Actual implementation likely in separate migration or managed by application.

**Migration Reference:** Lines 1645-1671

## RLS (Row Level Security) Implementation

### RLS Enablement
All 22 public tables have RLS enabled:
```sql
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;
```

**Tables with RLS:** activities, contactNotes, contact_organizations, contact_preferred_principals, contacts, interaction_participants, migration_history, opportunities, opportunityNotes, opportunity_participants, organizations, product_category_hierarchy, product_distributor_authorizations, product_features, product_inventory, product_pricing_models, product_pricing_tiers, products, sales, segments, tags, tasks

**Migration Reference:** Lines 2851, 3178-3238

### RLS Policy Patterns

The schema uses **simple authenticated-only policies** with a consistent naming convention:

#### Pattern 1: CRUD for Authenticated Users
```sql
CREATE POLICY "authenticated_select_{table}" ON public.{table}
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_insert_{table}" ON public.{table}
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_update_{table}" ON public.{table}
    FOR UPDATE TO authenticated
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_delete_{table}" ON public.{table}
    FOR DELETE TO authenticated
    USING (auth.uid() IS NOT NULL);
```

**Applied to:** All core tables (contacts, organizations, opportunities, tasks, activities, products, etc.)

**Security Model:** Any authenticated user can access all data. Fine-grained access control is **not implemented at database level**.

**Migration Reference:** Lines 2839-2930+ (sample policies shown)

#### Pattern 2: Read-Only Access
```sql
CREATE POLICY "Allow authenticated read access" ON public.segments
    FOR SELECT TO authenticated
    USING (true);
```

**Applied to:** Reference/lookup tables (segments)

#### Pattern 3: Special Cases
```sql
-- Migration history - Read-only for authenticated
CREATE POLICY "Enable read for authenticated users on migration_history"
    ON public.migration_history
    FOR SELECT TO authenticated
    USING (auth.role() = 'authenticated');
```

### RLS Gotchas

1. **No User Isolation:** Policies check `auth.uid() IS NOT NULL` (any authenticated user), not ownership-based filtering. All users can see/modify all data.

2. **Application-Level Security:** Access control must be enforced in application layer, not database. The `sales_id` and `created_by` columns track ownership but don't restrict access.

3. **Soft Deletes:** `deleted_at` filtering happens in application queries and views, not RLS policies.

4. **Admin Flag Not Used:** `sales.is_admin` column exists but isn't leveraged in RLS policies for elevated permissions.

## Key Functions

### Auth Sync Functions

#### `handle_new_user()`
**Trigger:** After INSERT on auth.users
**Purpose:** Auto-creates sales record when user signs up
**Logic:**
```sql
INSERT INTO public.sales (user_id, email)
VALUES (NEW.id, NEW.email);
```
**Migration Reference:** Lines 461-470, Trigger: Line 16-21 (restore_auth_triggers)

#### `handle_update_user()`
**Trigger:** After UPDATE on auth.users
**Purpose:** Syncs email changes from auth.users to sales table
**Logic:**
```sql
UPDATE public.sales
SET email = NEW.email, updated_at = NOW()
WHERE user_id = NEW.id;
```
**Migration Reference:** Lines 476-487, Trigger: Line 23-28 (restore_auth_triggers)

**Gotcha:** Only syncs `email`. Other fields (first_name, last_name) are not synced via triggers, must be updated directly in sales table.

---

### Search Functions

#### `update_search_tsv()`
**Trigger:** Before INSERT/UPDATE on contacts
**Purpose:** Updates `search_tsv` tsvector for full-text search
**Migration Reference:** Lines 912-958

#### `update_organizations_search_tsv()`
**Trigger:** Before INSERT/UPDATE on organizations
**Purpose:** Updates `search_tsv` tsvector for full-text search
**Migration Reference:** Lines 874-892

#### `update_products_search()`
**Trigger:** Before INSERT/UPDATE on products
**Purpose:** Updates `search_tsv` tsvector for full-text search
**Migration Reference:** Lines 894-910

---

### Business Logic Functions

#### `create_opportunity_with_participants(p_opportunity_data jsonb, p_participants jsonb[])`
**Purpose:** Atomically creates opportunity + participant records
**Returns:** opportunity_id (bigint)
**Migration Reference:** Lines 305-368

#### `log_engagement(...)` & `log_interaction(...)`
**Purpose:** Helper functions to insert activities with proper type/constraints
**Returns:** activity_id (bigint)
**Migration Reference:** Lines 493-634

#### `get_contact_organizations(p_contact_id bigint)`
**Purpose:** Returns all organizations for a contact (via deprecated junction table)
**Returns:** TABLE(organization_id, organization_name, is_primary, is_primary_decision_maker)
**Migration Reference:** Lines 370-411

#### `get_organization_contacts(p_organization_id bigint)`
**Purpose:** Returns all contacts for an organization
**Returns:** TABLE(contact_id, contact_name, role, is_primary_decision_maker, purchase_influence)
**Migration Reference:** Lines 437-459

#### `set_primary_organization(p_contact_id bigint, p_organization_id bigint)`
**Purpose:** Sets primary organization in contact_organizations junction table
**Migration Reference:** Lines 656-694

#### `sync_contact_organizations(p_contact_id bigint, p_organizations jsonb)`
**Purpose:** Bulk sync contact-organization relationships from JSONB payload
**Migration Reference:** Lines 724-776

#### `get_or_create_segment(p_name text)`
**Purpose:** Idempotent segment creation with case-insensitive lookup
**Returns:** SETOF segments
**Security:** SECURITY DEFINER
**Migration Reference:** Lines 413-427

---

### Product Functions

#### `calculate_product_price(p_product_id, p_quantity, p_distributor_id)`
**Purpose:** Calculates pricing with tier/discount logic
**Returns:** TABLE(unit_price, total_price, discount_applied, tier_name, special_pricing)
**Migration Reference:** Lines 201-253

#### `check_product_availability(p_product_id, p_quantity, p_needed_date)`
**Purpose:** Checks inventory availability
**Returns:** TABLE(is_available, quantity_available, can_fulfill_by, availability_notes)
**Migration Reference:** Lines 255-303

---

### Validation Functions (Triggers)

#### `validate_activity_consistency()`
**Trigger:** BEFORE INSERT/UPDATE on activities
**Purpose:** Enforces business rules (activity_type constraints)
**Migration Reference:** Lines 960-1009

#### `validate_opportunity_participants()`
**Trigger:** BEFORE INSERT/UPDATE on opportunity_participants
**Purpose:** Ensures participant roles are valid
**Migration Reference:** Lines 1011-1065

#### `validate_pricing_tiers()`
**Trigger:** BEFORE INSERT/UPDATE on product_pricing_tiers
**Purpose:** Ensures pricing tier consistency (no overlapping ranges, etc.)
**Migration Reference:** Lines 1067-1095

#### `validate_principal_organization()`
**Trigger:** BEFORE INSERT/UPDATE on products
**Purpose:** Ensures principal_id references an organization with is_principal=true
**Migration Reference:** Lines 1097-1115

## Architectural Patterns

### 1. Soft Deletes
**Pattern:** All main tables include `deleted_at` timestamp column.
**Implementation:**
- Nullable timestamp, NULL = active record
- Filtered in views (`WHERE deleted_at IS NULL`)
- Filtered in indexes (`WHERE deleted_at IS NULL`)
- Included in unique constraints (e.g., `unique_sku_per_principal` includes `deleted_at`)

**Gotcha:** RLS policies do NOT filter on `deleted_at`, so application queries must handle this.

---

### 2. Audit Trails
**Pattern:** Standard audit columns on all tables:
- `created_at` (timestamp, default now())
- `updated_at` (timestamp, default now(), updated by triggers or application)
- `created_by` (bigint FK → sales.id) - Who created the record

**Exceptions:**
- `segments.created_by` → `auth.users.id` (uuid) instead of sales.id
- Product tables include `updated_by` in addition to `created_by`

---

### 3. Full-Text Search
**Pattern:** tsvector columns + GIN indexes + update triggers
**Tables:** contacts, organizations, opportunities, products
**Trigger Function:** `update_search_tsv()`, `update_organizations_search_tsv()`, `update_products_search()`

**Configuration:** Default PostgreSQL text search (no custom dictionaries or languages specified in migration)

---

### 4. JSONB for Flexibility
**Usage:**
- `contacts.email`, `contacts.phone` - Arrays of contact methods
- `organizations.context_links` - Related URLs
- `products.nutritional_info` - Structured nutrition data
- `product_distributor_authorizations.special_pricing` - Custom pricing rules
- `product_pricing_models.pricing_rules` - Flexible pricing logic
- `product_inventory.lot_numbers` - Batch tracking

**Benefit:** Avoids schema changes for evolving data needs, especially in product management.

---

### 5. Enum Types for Controlled Values
**11 Custom ENUMs:**
- activity_type, contact_role, interaction_type
- opportunity_stage, opportunity_status
- organization_type
- pricing_model_type
- priority_level
- product_category, product_status
- task_type

**Benefit:** Database-level validation, clear API contracts.
**Gotcha:** Enum changes require migrations. Difficult to add/remove values in production without downtime or workarounds.

---

### 6. Multi-Stakeholder Patterns
**Opportunities:**
- Direct FKs: `customer_organization_id`, `principal_organization_id`, `distributor_organization_id`
- Junction table: `opportunity_participants` with `role` field (customer, principal, distributor, partner, competitor)

**Rationale:** Supports complex B2B sales with multiple participating organizations.

**Contacts:**
- Deprecated: `contact_organizations` junction table (many-to-many)
- Current: `contacts.organization_id` (single primary organization)
- Comment in schema: "Backward compatibility removed - use contact_organizations for relationships"

**Gotcha:** Mixed approach exists. New data should use `contacts.organization_id`, but old data in `contact_organizations` must be maintained.

---

### 7. Hierarchical Data
**Organizations:** Self-referential `parent_organization_id` for organization hierarchies (parent company → subsidiaries)
**Product Categories:** Self-referential `parent_category_id` in `product_category_hierarchy`

**Index:** `idx_companies_parent_company_id` on `parent_organization_id` (filtered WHERE NOT NULL)

---

### 8. Validation via Triggers & Functions
**Examples:**
- `validate_activity_consistency()` - Ensures activity_type='interaction' has opportunity_id
- `validate_opportunity_participants()` - Validates participant roles
- `validate_pricing_tiers()` - Prevents overlapping tier ranges
- `validate_principal_organization()` - Products must belong to principals

**Benefit:** Business rules enforced at database level, not just application.
**Gotcha:** Can make debugging harder; violations return cryptic error messages from triggers.

---

### 9. Helper Functions for Complex Operations
**Pattern:** SECURITY DEFINER functions for privileged operations
**Examples:**
- `get_or_create_segment()` - Idempotent creation
- `create_opportunity_with_participants()` - Atomic multi-table insert
- `log_engagement()`, `log_interaction()` - Simplified activity creation

**Security:** SECURITY DEFINER runs with owner privileges, bypassing RLS. Requires careful validation inside function.

---

### 10. Denormalized Views
**Pattern:** Pre-joined views for common queries
**Examples:**
- `contacts_summary` - Contacts with organization name
- `organizations_summary` - Organizations with counts and activity metrics

**Benefit:** Reduces N+1 queries, simplifies frontend data layer.
**Gotcha:** Views must be maintained when schema changes.

## Gotchas & Edge Cases

### 1. Auth Table Access Restrictions
**Issue:** `auth.users` table cannot be directly queried or modified via PostgREST API (Supabase restriction).
**Workaround:**
- Read users: Supabase Admin API or Auth APIs
- Create/update users: Edge Functions (`supabase/functions/users`) with service role key
- Sync to public: Triggers copy email to `public.sales` on insert/update

**Migration Reference:** 20251015014019_restore_auth_triggers.sql

---

### 2. Contact Email/Phone as JSONB Arrays
**Issue:** `contacts.email` and `contacts.phone` are JSONB arrays, not text fields.
**Format:**
```json
[
  {"type": "work", "value": "email@example.com", "primary": true},
  {"type": "personal", "value": "personal@example.com", "primary": false}
]
```
**Gotcha:** Queries must use JSONB operators. Simple string search won't work.
**Example Query:**
```sql
SELECT * FROM contacts WHERE email::text ILIKE '%example.com%';
```

---

### 3. Deprecated contact_organizations Junction Table
**Issue:** Schema comment marks `contact_organizations` as DEPRECATED, but table remains with full indexes and constraints.
**Current Approach:** New contacts use `contacts.organization_id` directly.
**Legacy Data:** Historical many-to-many relationships remain in `contact_organizations`.

**Impact:** Application must check both patterns when querying contact-organization relationships.

**Unique Index:** `idx_contact_organizations_unique_contact` enforces only one active `contact_organizations` record per contact, effectively making it one-to-one anyway.

---

### 4. Activity Type Dual Behavior
**Issue:** `activities` table has two modes:
- `activity_type='engagement'` - General contact/org activity, no opportunity required
- `activity_type='interaction'` - Opportunity-specific, opportunity_id REQUIRED

**Constraint:** `check_interaction_has_opportunity` enforces this at database level.
**Gotcha:** Application must set correct activity_type or inserts will fail.

---

### 5. RLS Policies Don't Isolate Users
**Issue:** All RLS policies check `auth.uid() IS NOT NULL`, meaning any authenticated user can access all data.
**No user isolation at database level.**

**Implication:**
- Multi-tenant scenarios not supported without application-level filtering
- `sales.is_admin` flag is not used in RLS policies
- `created_by` and `sales_id` track ownership but don't restrict access

**Recommendation:** If multi-tenant or user-scoped access is needed, RLS policies must be updated to check ownership (e.g., `created_by = get_current_sales_id()`).

---

### 6. Segment Table Uses UUID Primary Key
**Issue:** `segments.id` is `uuid`, while all other tables use `bigint` PKs.
**Impact:** Type mismatch in joins, may affect performance slightly.
**Foreign Key:** `organizations.segment_id` is `uuid` to match.

---

### 7. Enum Value Changes Require Migrations
**Issue:** Enums like `opportunity_stage`, `product_category`, etc. cannot be easily modified.
**Workaround:**
- Add new enum values: `ALTER TYPE enum_name ADD VALUE 'new_value';`
- Remove enum values: Requires recreating enum and updating all dependent tables (complex migration)

**Gotcha:** Enums are shared across the database. Adding a value is safe, but removing requires careful coordination.

---

### 8. Products Must Belong to Principals
**Constraint:** `validate_principal_organization()` trigger checks that `products.principal_id` references an organization with `is_principal=true`.
**Gotcha:** If you change an organization's `is_principal` flag to false and it has products, updates may fail or require cascade updates.

---

### 9. Opportunity Participant Roles Not Enforced by FK
**Issue:** `opportunity_participants.organization_id` is a plain FK to `organizations`, but `role` (customer, principal, distributor) suggests organizational type.
**No constraint:** An organization marked `is_distributor=false` can still have role='distributor' in `opportunity_participants`.

**Implication:** Data integrity depends on application logic, not database constraints.

---

### 10. Product SKU Uniqueness Per Principal
**Constraint:** `unique_sku_per_principal` on (principal_id, sku, deleted_at).
**Gotcha:**
- SKU is unique within a principal (brand), but multiple principals can have the same SKU.
- Includes `deleted_at` in constraint, so soft-deleting a product allows reusing the SKU.

---

### 11. Quantity Available is Computed Column
**Issue:** `product_inventory.quantity_available` is GENERATED ALWAYS AS (quantity_on_hand - quantity_committed) STORED.
**Gotcha:** Cannot directly INSERT/UPDATE this column. Modify `quantity_on_hand` or `quantity_committed` instead.

---

### 12. Migration History Table Not Used by Supabase
**Issue:** `public.migration_history` is a custom table, separate from Supabase's built-in `supabase_migrations.schema_migrations`.
**Purpose:** Application-level migration tracking or custom tooling.
**Gotcha:** Not automatically populated by `supabase db push` or `supabase migration up`. Must be manually maintained if used.

---

### 13. Triggers on auth.users Must Be Manually Restored
**Issue:** When dumping only `public` schema, triggers on `auth.users` are excluded.
**Solution:** Separate migration file (`20251015014019_restore_auth_triggers.sql`) recreates triggers.
**Gotcha:** If migrating from another environment, triggers may be missing until this migration is applied.

---

### 14. Full-Text Search Language Not Specified
**Issue:** `search_tsv` columns use default PostgreSQL text search configuration (likely 'english').
**Gotcha:** If CRM needs multilingual support, search configuration must be updated (e.g., tsvector with language parameter).

---

### 15. No Foreign Key for organization_id in activities
**Issue:** `activities.organization_id` is `bigint` but has no explicit FK constraint to `organizations.id`.
**Implication:** Orphaned organization_id values possible if organization is deleted without cascade handling.

---

### 16. Contact-Organization Relationship Confusion
**Schema Comment (contacts table):** "Backward compatibility removed - use contact_organizations for relationships"
**Schema Comment (contact_organizations table):** "DEPRECATED: Junction table for contact-organization relationships. New contacts should use contacts.organization_id directly."

**Gotcha:** Comments contradict each other. **Best Practice:** Use `contacts.organization_id` for primary org, ignore `contact_organizations` for new data. Maintain junction table only for legacy data.

---

### 17. Product Pricing Tiers Can Overlap if Not Validated
**Issue:** `product_pricing_tiers` has `min_quantity` and `max_quantity` but no built-in constraint to prevent overlaps.
**Mitigation:** `validate_pricing_tiers()` trigger should handle this, but logic details not visible in this migration file.

---

### 18. Segments Created by auth.users, Not sales
**Issue:** `segments.created_by` is `uuid` FK to `auth.users.id`, not `bigint` FK to `sales.id` like other tables.
**Gotcha:** Inconsistent audit trail pattern. Querying segment creators requires joining to `auth.users` instead of `sales`.

---

### 19. Tasks Have No Auto-Complete on Due Date
**Issue:** Tasks track `completed` and `completed_at`, but no trigger auto-marks tasks as overdue or incomplete.
**Implication:** Application must handle overdue task detection.

---

### 20. Opportunity Stage/Status Manual Overrides
**Columns:** `opportunities.stage_manual`, `opportunities.status_manual` (boolean flags)
**Purpose:** Indicates whether stage/status was manually set (prevents auto-progression).
**Gotcha:** Application logic must check these flags before auto-updating stage/status. No database-level automation.

## Relevant Documentation

### Internal Documentation
- `/home/krwhynot/projects/crispy-crm/CLAUDE.md` - Project overview, architecture decisions
- `/home/krwhynot/projects/crispy-crm/doc/developer/architecture-choices.md` - Why certain patterns exist
- `/home/krwhynot/projects/crispy-crm/doc/developer/customizing.md` - CRM customization guide
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/RECONCILIATION_SUMMARY.md` - Migration reconciliation notes

### External Documentation
- [Supabase Database Docs](https://supabase.com/docs/guides/database) - Supabase PostgreSQL features
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/) - PostgreSQL reference
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) - RLS guide
- [Supabase Triggers](https://supabase.com/docs/guides/database/functions#triggers) - Trigger patterns
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html) - tsvector/tsquery usage

### Data Provider Integration
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - React Admin data provider
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/filterRegistry.ts` - Filter logic for complex queries
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/authProvider.ts` - Authentication provider

## Summary

The Atomic CRM database schema is a comprehensive PostgreSQL design optimized for food industry B2B sales. Key strengths include full-text search, soft deletes, audit trails, and multi-stakeholder opportunity tracking. The schema uses modern PostgreSQL features (JSONB, tsvector, generated columns, custom ENUMs) and enforces business rules via triggers and functions.

Critical architectural decisions:
1. **Auth-Sales Sync via Triggers:** User data flows from `auth.users` → `public.sales`
2. **Simple RLS:** Authenticated-only policies, no user isolation
3. **Denormalized Views:** Pre-joined data for performance
4. **JSONB Flexibility:** Contact methods, pricing rules, and metadata in JSON
5. **Deprecated Patterns:** `contact_organizations` junction table replaced by direct FK, but not removed
6. **Activity Dual Mode:** Engagements vs. Interactions with different constraints

**Major Gotchas:**
- RLS doesn't isolate users (all authenticated users see all data)
- Contact email/phone are JSONB arrays, not text
- Mixed contact-organization relationship patterns (direct FK + deprecated junction)
- Enums are hard to modify
- Auth table access requires Edge Functions

This research provides a foundation for understanding data relationships, migration planning, and schema cleanup efforts before production launch.
