# Database Research

## Current Schema

### opportunities table structure
Key fields relevant to this feature:
- `id` (bigint, PK) - Auto-incrementing primary key
- `name` (text, NOT NULL) - Opportunity name
- `description` (text)
- `stage` (opportunity_stage enum) - Default: 'new_lead'
- `status` (opportunity_status enum) - Default: 'active'
- `amount` (numeric) - Total opportunity value
- `customer_organization_id` (bigint) - Primary customer
- `principal_organization_id` (bigint) - Principal/manufacturer
- `distributor_organization_id` (bigint) - Distributor
- `contact_ids` (bigint[]) - Array of related contacts
- `sales_id` (bigint) - Owner reference
- `created_at`, `updated_at`, `deleted_at` (timestamptz) - Audit fields
- `search_tsv` (tsvector) - Full-text search
- `tags` (text[]) - Tag array

### opportunity_products table structure
Junction table linking opportunities to products with pricing:
- `id` (bigint, PK) - Auto-incrementing primary key
- `opportunity_id` (bigint, NOT NULL, FK → opportunities.id) - **Required parent**
- `product_id` (bigint, nullable) - Legacy field (being phased out)
- `product_id_reference` (bigint, FK → products.id) - **Proper FK to products table**
- `product_name` (text, NOT NULL) - Product name (denormalized for flexibility)
- `product_category` (text) - Product category (denormalized)
- `quantity` (integer) - Default: 1
- `unit_price` (numeric) - Price per unit
- `extended_price` (numeric, GENERATED) - Computed: `quantity * unit_price`
- `discount_percent` (numeric, CHECK 0-100) - Default: 0
- `final_price` (numeric, GENERATED) - Computed: `extended_price * (1 - discount_percent/100)`
- `price_tier_id` (bigint, FK → product_pricing_tiers.id) - Optional pricing tier reference
- `cost_per_unit` (numeric) - Cost basis
- `margin_percent` (numeric) - Profit margin
- `total_weight` (numeric) - Shipping weight
- `special_pricing_applied` (boolean) - Default: false
- `pricing_notes` (text) - Special pricing notes
- `notes` (text) - General notes
- `created_at`, `updated_at` (timestamptz) - Audit fields
- `created_by` (bigint, FK → sales.id) - Creator reference

**Note**: Table supports both catalog products (via `product_id_reference`) and custom/ad-hoc products (name-only entries).

### products table structure
Master product catalog:
- `id` (bigint, PK) - Auto-incrementing primary key
- `principal_id` (bigint, NOT NULL) - Parent principal/manufacturer organization
- `name` (text, NOT NULL) - Product name
- `description` (text) - Detailed description
- `sku` (text, NOT NULL) - Stock keeping unit (unique per principal)
- `category` (product_category enum, NOT NULL) - Product category
- `subcategory` (text) - Subcategory
- `brand` (text) - Brand name
- `cost_per_unit` (numeric) - Base cost
- `list_price` (numeric) - Standard list price
- `status` (product_status enum) - Default: 'active' (active, discontinued, seasonal, etc.)
- `unit_of_measure` (text) - Default: 'each'
- `minimum_order_quantity` (integer) - Default: 1
- `manufacturer_part_number` (text) - MPN
- `certifications` (text[]) - Certifications array
- `allergens` (text[]) - Allergen information
- `ingredients` (text) - Ingredient list
- `nutritional_info` (jsonb) - Structured nutrition data
- `marketing_description` (text) - Marketing copy
- `currency_code` (text) - Default: 'USD'
- `created_at`, `updated_at`, `deleted_at` (timestamptz) - Audit fields
- `created_by`, `updated_by` (bigint) - Creator/updater references
- `search_tsv` (tsvector) - Full-text search

### Relevant Foreign Keys and Indexes

**opportunity_products foreign keys:**
- `opportunity_products_opportunity_id_fkey` → opportunities(id)
- `opportunity_products_product_id_reference_fkey` → products(id)
- `opportunity_products_price_tier_id_fkey` → product_pricing_tiers(id)
- `opportunity_products_created_by_fkey` → sales(id)

**opportunity_products indexes:**
- `opportunity_products_pkey` - Primary key on id
- `idx_opportunity_products_opp_id` - Btree on opportunity_id (for joins)
- `idx_opportunity_products_product_id` - Btree on product_id WHERE NOT NULL
- `idx_opportunity_products_product_ref` - Btree on product_id_reference WHERE NOT NULL

**products indexes:**
- `products_pkey` - Primary key on id
- `idx_products_principal_id` - Btree on principal_id WHERE deleted_at IS NULL
- `idx_products_category` - Btree on category WHERE deleted_at IS NULL
- `idx_products_status` - Btree on status WHERE deleted_at IS NULL
- `idx_products_sku` - Btree on sku WHERE deleted_at IS NULL
- `idx_products_search_tsv` - GIN index for full-text search
- `unique_sku_per_principal` - UNIQUE (principal_id, sku, deleted_at)

## Existing RPC Functions

### Product Pricing Function
**`calculate_product_price(p_product_id, p_quantity, p_distributor_id)`**
- Returns: unit_price, total_price, discount_applied, tier_name, special_pricing
- Purpose: Calculates tiered pricing with distributor-specific pricing support
- Logic: Checks special pricing → pricing tiers → base list_price
- Use case: Can be called before inserting opportunity_products to get accurate pricing

### Product Availability Function
**`check_product_availability(p_product_id, p_quantity, p_needed_date)`**
- Returns: is_available, quantity_available, can_fulfill_by, availability_notes
- Purpose: Validates inventory and seasonality before adding to opportunity
- Checks: Inventory levels, seasonal availability, product status, lead times
- Use case: Pre-validation before adding products to opportunities

### Opportunity Management Functions
**`create_opportunity_with_participants(p_opportunity_data, p_participants)`**
- Creates opportunity with multi-organization participants atomically
- Validates at least one customer participant required
- Returns: opportunity_id
- Pattern: Atomic transaction for complex multi-table inserts

**`calculate_opportunity_probability()` (trigger function)**
- Auto-calculates probability based on stage changes
- Respects `stage_manual` flag to preserve manual overrides
- Pattern: Business logic enforced at database level

### Validation Functions (Triggers)
**`validate_opportunity_participants()`**
- Ensures organization type matches participant role
- Enforces single primary per role type
- Pattern: Data integrity enforced via triggers

**`validate_pricing_tiers()`**
- Prevents overlapping quantity ranges in pricing tiers
- Pattern: Complex constraint validation

### Contact/Organization Functions
**`set_primary_organization(p_contact_id, p_organization_id)`**
- Sets primary organization for a contact (ensures only one primary)
- Pattern: Business rule enforcement via RPC with SECURITY DEFINER

### Activity Logging Functions
**`log_interaction(p_opportunity_id, ...)`**
- Creates interaction activity linked to opportunity
- Auto-links to customer organization
- Updates opportunity updated_at timestamp
- Pattern: Complex insert with side effects

**`log_engagement(p_type, ...)`**
- Creates standalone engagement activity
- Pattern: Similar to log_interaction but for non-opportunity activities

## Migration Patterns

### Naming Convention
Format: `YYYYMMDDHHMMSS_descriptive_name.sql`

Examples from recent migrations:
- `20250127000000_consolidated_fresh_schema.sql` - Major schema consolidation
- `20250929002034_rename_task_name_to_title_and_add_type_enum.sql` - Column rename + enum addition
- `20250930032707_add_missing_organization_fields.sql` - Add missing columns
- `20250930131316_add_date_to_notes.sql` - Simple column addition

**Pattern**: Timestamp uses full datetime (YYYYMMDDhhmmss) with 24-hour time format.

### How Migrations Handle Column Renames

From `20250929002034_rename_task_name_to_title_and_add_type_enum.sql`:

```sql
BEGIN;

-- Step 1: Rename column
ALTER TABLE tasks RENAME COLUMN name TO title;

-- Step 2: Add new enum type
CREATE TYPE task_type AS ENUM ('Call', 'Email', 'Meeting', ...);

-- Step 3: Add column using the enum with default
ALTER TABLE tasks
ADD COLUMN type task_type DEFAULT 'None'::task_type;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN tasks.title IS 'Brief title describing the task';
COMMENT ON COLUMN tasks.type IS 'Category of task activity';

COMMIT;
```

**Pattern**:
- Wrap in transaction (BEGIN/COMMIT)
- Use `ALTER TABLE ... RENAME COLUMN`
- Add documentation via `COMMENT ON COLUMN`
- Include clear migration purpose comment at top

### How Constraints Are Added

From `20250930032707_add_missing_organization_fields.sql`:

```sql
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS context_links jsonb,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS tax_identifier text;

COMMENT ON COLUMN organizations.context_links IS 'Array of related URLs...';
```

From consolidated schema (line 264):
```sql
probability integer CHECK (probability >= 0 AND probability <= 100) DEFAULT 0,
```

**Patterns**:
- Use `ADD COLUMN IF NOT EXISTS` for idempotency
- Inline CHECK constraints during column definition
- Add comments for documentation
- Use JSONB for flexible structured data
- Define defaults inline

### Index Creation Patterns

From consolidated schema:
```sql
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_deleted_at ON opportunities(deleted_at)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_search ON opportunities USING gin(search_tsv);
```

**Patterns**:
- Use `CREATE INDEX IF NOT EXISTS` for idempotency
- Name indexes: `idx_{table}_{column(s)}`
- Partial indexes for soft deletes: `WHERE deleted_at IS NULL`
- GIN indexes for full-text search (tsvector)
- GIN indexes for array columns (tags, contact_ids)
- Btree indexes for foreign keys and frequently filtered columns

### Trigger Patterns

From consolidated schema:
```sql
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_opportunities_search_trigger
    BEFORE INSERT OR UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_opportunities_search();
```

**Patterns**:
- `update_updated_at()` - Standard trigger for all tables with updated_at
- Search vector triggers - Auto-update tsvector on INSERT/UPDATE
- Validation triggers - Enforce business rules at database level
- BEFORE triggers modify NEW record before write
- Naming: `{action}_{table}_{purpose}_trigger` or `{action}_{table}_{field}`

## Relevant Tables for This Feature

### Primary Tables
1. **opportunities** - Parent entity we're enhancing
2. **opportunity_products** - Junction table for products in opportunities (main work area)
3. **products** - Product catalog for lookup/selection

### Supporting Tables
4. **product_pricing_tiers** - Tiered pricing rules (optional reference)
5. **organizations** - For principal/distributor context in product pricing
6. **sales** - User/creator references

### Junction Table Pattern
The `opportunity_products` table follows a flexible junction pattern:
- **Catalog mode**: Links via `product_id_reference` FK to products table
- **Ad-hoc mode**: Stores only `product_name` without FK (custom products)
- **Computed fields**: Uses GENERATED ALWAYS columns for price calculations
- **Audit trail**: Includes created_at, updated_at, created_by
- **No soft delete**: No deleted_at field (relies on parent opportunity soft delete)

### Key Observations
1. **No RLS policies needed** - Simple authenticated access via consolidated schema pattern
2. **Generated columns** - Database calculates extended_price and final_price automatically
3. **Dual FK pattern** - Both `product_id` (legacy) and `product_id_reference` (current) exist
4. **Denormalized data** - product_name and product_category stored for historical accuracy
5. **No updated_at trigger** - opportunity_products has updated_at field but no trigger defined
6. **Pricing flexibility** - Supports manual pricing, tier pricing, and special pricing flags
