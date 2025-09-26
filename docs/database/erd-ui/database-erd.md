# Atomic CRM Database Entity Relationship Diagram

## Visual ERD Diagram

```
┌─────────────────────────┐
│        sales            │ (Users/Sales Representatives)
├─────────────────────────┤
│ PK id (bigint)          │
│ FK user_id (uuid)       │←─── Links to auth.users
│    first_name           │
│    last_name            │
│    email                │
│    ...                  │
└─────────────────────────┘
     │
     │ Creates/Manages (1:M)
     ├────────────────────────────┬──────────────────┬────────────────┬───────────────┐
     ↓                            ↓                  ↓                ↓               ↓
┌─────────────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌──────────┐
│    organizations        │ │  contacts   │ │opportunities│ │    tasks     │ │   tags   │
├─────────────────────────┤ ├─────────────┤ ├─────────────┤ ├──────────────┤ ├──────────┤
│ PK id (bigint)          │ │ PK id       │ │ PK id       │ │ PK id        │ │ PK id    │
│ FK parent_company_id    │←┐│ FK company_id│ │ FK company_id│ │ FK contact_id│ │   name   │
│    name                 │ ││    name     │←─┤ stage       │ │ FK company_id│ │   color  │
│    organization_type    │ ││    email[]  │ │ status      │←─┤ FK opportunity_id│   ...    │
│    is_principal         │ ││    phone[]  │ │ amount      │ │ FK sales_id  │ └──────────┘
│    is_distributor       │ ││    ...      │ │ ...         │ │    ...       │
│    ...                  │ │└─────────────┘ └─────────────┘ └──────────────┘
└─────────────────────────┘ │       │              │
     │ Self-ref (hierarchical)      │              │
     └──────────────────────────────┘              │
     │                              │              │
     │ Referenced by (1:M)          │              │
     ├──────────────────────────────┼──────────────┤
     │                              │              │
     ↓                              ↓              ↓
┌──────────────────────────┐ ┌────────────────────────────┐ ┌────────────────────────────┐
│ contact_organizations    │ │  opportunity_participants  │ │      activities            │
├──────────────────────────┤ ├────────────────────────────┤ ├────────────────────────────┤
│ PK id                    │ │ PK id                      │ │ PK id                      │
│ FK contact_id            │→│ FK opportunity_id          │→│    activity_type           │
│ FK organization_id       │→│ FK organization_id         │→│    type                    │
│    is_primary            │ │    role (customer/principal/│ │ FK contact_id              │→
│    role                  │ │         distributor/etc)   │ │ FK organization_id         │→
│    purchase_influence    │ │    is_primary              │ │ FK opportunity_id          │→
│    ...                   │ │    commission_rate         │ │    ...                     │
└──────────────────────────┘ │    ...                     │ └────────────────────────────┘
                              └────────────────────────────┘         │
                                           │                         ↓
                                           │              ┌─────────────────────────┐
                                           │              │ interaction_participants│
                                           │              ├─────────────────────────┤
                                           │              │ PK id                   │
                                           │              │ FK activity_id          │→
                                           │              │ FK contact_id           │→
                                           │              │ FK organization_id      │→
                                           │              │    ...                  │
                                           │              └─────────────────────────┘
                                           │
┌──────────────────────────┐              │              ┌─────────────────────────┐
│   contact_preferred_     │              │              │  opportunity_products   │
│      principals          │              │              ├─────────────────────────┤
├──────────────────────────┤              │              │ PK id                   │
│ PK id                    │              └─────────────→│ FK opportunity_id       │
│ FK contact_id            │→                            │ FK product_id_reference │→
│ FK principal_org_id      │→                            │ FK price_tier_id        │→
│    advocacy_strength     │                             │    product_name         │
│    ...                   │                             │    quantity             │
└──────────────────────────┘                             │    unit_price           │
                                                          │    ...                  │
┌──────────────────────────┐                             └─────────────────────────┘
│       products           │←───────────────────────────────────┘
├──────────────────────────┤
│ PK id                    │
│ FK principal_id          │→ (to organizations where is_principal = true)
│    name                  │
│    sku                   │
│    category              │
│    status                │
│    ...                   │
└──────────────────────────┘
            │
            │ Referenced by (1:M)
            ├────────────────┬────────────────┬──────────────────┬─────────────────┐
            ↓                ↓                ↓                  ↓                 ↓
┌────────────────────┐ ┌──────────────┐ ┌─────────────────┐ ┌──────────────┐ ┌─────────────┐
│ product_pricing_   │ │  product_    │ │    product_     │ │  product_    │ │  product_   │
│      tiers         │ │  inventory   │ │  distributor_   │ │  features    │ │  pricing_   │
├────────────────────┤ ├──────────────┤ │ authorizations  │ ├──────────────┤ │   models    │
│ PK id              │ │ PK id        │ ├─────────────────┤ │ PK id        │ ├─────────────┤
│ FK product_id      │ │ FK product_id│ │ PK id           │ │ FK product_id│ │ PK id       │
│    min_quantity    │ │ quantity_    │ │ FK product_id   │ │ feature_name │ │ FK product_id│
│    max_quantity    │ │   on_hand    │ │ FK distributor_id│→│ feature_value│ │ model_type  │
│    unit_price      │ │ quantity_    │ │ is_authorized   │ │    ...       │ │ base_price  │
│    ...             │ │   available  │ │    ...          │ └──────────────┘ │    ...      │
└────────────────────┘ └──────────────┘ └─────────────────┘                  └─────────────┘

┌──────────────────────────┐              ┌──────────────────────────┐
│      contactNotes        │              │    opportunityNotes      │
├──────────────────────────┤              ├──────────────────────────┤
│ PK id                    │              │ PK id                    │
│ FK contact_id            │→             │ FK opportunity_id        │→
│ FK sales_id              │→             │ FK sales_id              │→
│    text                  │              │    text                  │
│    attachments[]         │              │    attachments[]         │
│    ...                   │              │    ...                   │
└──────────────────────────┘              └──────────────────────────┘

┌──────────────────────────┐              ┌──────────────────────────┐
│ product_category_        │              │   migration_history      │
│      hierarchy           │              ├──────────────────────────┤
├──────────────────────────┤              │ PK id                    │
│ PK id                    │              │    phase_number          │
│ FK parent_category_id    │←┐(self-ref)  │    phase_name            │
│    category_name         │ │            │    status                │
│    level                 │ │            │    ...                   │
│    ...                   │ │            └──────────────────────────┘
└──────────────────────────┘ │
     └────────────────────────┘
```

## Relationship Key
- `→` : Foreign Key relationship (Many-to-One)
- `←` : Referenced by Foreign Key (One-to-Many)
- `PK` : Primary Key
- `FK` : Foreign Key
- `1:M` : One-to-Many relationship
- `M:M` : Many-to-Many relationship (via junction table)

## Core Entity Relationships

### Primary Entities
1. **sales** - Central user/salesperson entity linking to auth.users
2. **organizations** - Companies/businesses (renamed from companies)
3. **contacts** - Individual people associated with organizations
4. **opportunities** - Sales pipeline opportunities (8-stage food service workflow)
5. **products** - Product catalog managed by principal organizations

### Junction Tables (Many-to-Many Relationships)
1. **contact_organizations** - Links contacts to multiple organizations with roles
2. **opportunity_participants** - Links opportunities to multiple organizations (customer, principal, distributor roles)
3. **opportunity_products** - Line items linking products to opportunities
4. **contact_preferred_principals** - Tracks contact preferences for principal organizations
5. **interaction_participants** - Links activities to multiple participants

### Activity & Notes System
1. **activities** - Tracks both engagements (general) and interactions (opportunity-specific)
2. **contactNotes** - Notes associated with contacts
3. **opportunityNotes** - Notes associated with opportunities
4. **tasks** - Action items linked to contacts, organizations, or opportunities

### Product Catalog System
1. **products** - Main product catalog
2. **product_pricing_tiers** - Volume-based pricing tiers
3. **product_inventory** - Stock tracking
4. **product_distributor_authorizations** - Which distributors can sell which products
5. **product_features** - Additional product features
6. **product_pricing_models** - Pricing strategies
7. **product_category_hierarchy** - Hierarchical product categories

---

## Complete Data Fields Documentation

### TABLE: sales
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique identifier for each sales user
- **user_id** (UUID, UNIQUE, FOREIGN KEY → auth.users) - Link to Supabase authentication system
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Record creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp
- **first_name** (TEXT, NULLABLE) - User's first name
- **last_name** (TEXT, NULLABLE) - User's last name
- **email** (TEXT, NULLABLE) - User's email address
- **phone** (TEXT, NULLABLE) - User's phone number
- **avatar_url** (TEXT, NULLABLE) - URL to user's avatar image
- **is_admin** (BOOLEAN, DEFAULT false) - Administrator flag
- **deleted_at** (TIMESTAMPTZ, NULLABLE) - Soft delete timestamp
- **disabled** (BOOLEAN, NULLABLE) - Account disabled flag

### TABLE: organizations (formerly companies)
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique organization identifier
- **name** (TEXT, NOT NULL) - Organization name
- **organization_type** (ENUM: customer/principal/distributor/prospect/vendor/partner/unknown) - Type classification
- **is_principal** (BOOLEAN, DEFAULT false) - Flag for principal (manufacturer) organizations
- **is_distributor** (BOOLEAN, DEFAULT false) - Flag for distributor organizations
- **parent_company_id** (BIGINT, FOREIGN KEY → organizations, NULLABLE) - Parent organization for hierarchical structures
- **segment** (TEXT, DEFAULT 'Standard') - Market segment classification
- **priority** (VARCHAR(1), CHECK: A/B/C/D) - Priority classification
- **industry** (TEXT, NULLABLE) - Industry vertical
- **website** (TEXT, NULLABLE) - Organization website URL
- **address** (TEXT, NULLABLE) - Street address
- **city** (TEXT, NULLABLE) - City
- **state** (TEXT, NULLABLE) - State/Province
- **postal_code** (TEXT, NULLABLE) - ZIP/Postal code
- **country** (TEXT, DEFAULT 'USA') - Country
- **phone** (TEXT, NULLABLE) - Main phone number
- **email** (TEXT, NULLABLE) - Main email address
- **logo_url** (TEXT, NULLABLE) - Organization logo URL
- **linkedin_url** (TEXT, NULLABLE) - LinkedIn company page URL
- **annual_revenue** (NUMERIC(15,2), NULLABLE) - Annual revenue in currency
- **employee_count** (INTEGER, NULLABLE) - Number of employees
- **founded_year** (INTEGER, NULLABLE) - Year established
- **notes** (TEXT, NULLABLE) - General notes
- **sales_id** (BIGINT, FOREIGN KEY → sales, NULLABLE) - Assigned sales representative
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp
- **created_by** (BIGINT, FOREIGN KEY → sales, NULLABLE) - User who created the record
- **deleted_at** (TIMESTAMPTZ, NULLABLE) - Soft delete timestamp
- **import_session_id** (UUID, NULLABLE) - Batch import tracking
- **search_tsv** (TSVECTOR, NULLABLE) - Full-text search vector

### TABLE: contacts
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique contact identifier
- **name** (TEXT, NOT NULL) - Full name
- **first_name** (TEXT, NULLABLE) - First name
- **last_name** (TEXT, NULLABLE) - Last name
- **email** (JSONB, DEFAULT '[]') - Array of email addresses with metadata
- **phone** (JSONB, DEFAULT '[]') - Array of phone numbers with metadata
- **title** (TEXT, NULLABLE) - Job title
- **role** (ENUM: decision_maker/influencer/buyer/end_user/gatekeeper/champion/technical/executive) - Contact role
- **department** (TEXT, NULLABLE) - Department
- **is_primary_contact** (BOOLEAN, DEFAULT false) - Primary contact flag
- **purchase_influence** (VARCHAR(10), CHECK: High/Medium/Low/Unknown) - Purchasing influence level
- **decision_authority** (VARCHAR(20), CHECK: Decision Maker/Influencer/End User/Gatekeeper) - Decision authority
- **address** (TEXT, NULLABLE) - Street address
- **city** (TEXT, NULLABLE) - City
- **state** (TEXT, NULLABLE) - State/Province
- **postal_code** (TEXT, NULLABLE) - ZIP/Postal code
- **country** (TEXT, DEFAULT 'USA') - Country
- **birthday** (DATE, NULLABLE) - Birth date
- **linkedin_url** (TEXT, NULLABLE) - LinkedIn profile URL
- **twitter_handle** (TEXT, NULLABLE) - Twitter/X handle
- **notes** (TEXT, NULLABLE) - General notes
- **company_id** (BIGINT, FOREIGN KEY → organizations, NULLABLE) - Primary organization
- **sales_id** (BIGINT, FOREIGN KEY → sales, NULLABLE) - Assigned sales representative
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp
- **created_by** (BIGINT, FOREIGN KEY → sales, NULLABLE) - User who created the record
- **deleted_at** (TIMESTAMPTZ, NULLABLE) - Soft delete timestamp
- **search_tsv** (TSVECTOR, NULLABLE) - Full-text search vector
- **first_seen** (TIMESTAMPTZ, NULLABLE) - First contact date
- **last_seen** (TIMESTAMPTZ, NULLABLE) - Last contact date
- **gender** (TEXT, NULLABLE) - Gender
- **tags** (TEXT[], NULLABLE) - Array of tags

### TABLE: opportunities
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique opportunity identifier
- **name** (TEXT, NOT NULL) - Opportunity name/title
- **description** (TEXT, NULLABLE) - Detailed description
- **stage** (ENUM: new_lead/initial_outreach/sample_visit_offered/awaiting_response/feedback_logged/demo_scheduled/closed_won/closed_lost) - Pipeline stage
- **status** (ENUM: active/on_hold/nurturing/stalled/expired) - Current status
- **priority** (ENUM: low/medium/high/critical) - Priority level
- **probability** (INTEGER, CHECK: 0-100) - Win probability percentage
- **amount** (NUMERIC(12,2), NULLABLE) - Deal value
- **category** (TEXT, NULLABLE) - Opportunity category
- **index** (INTEGER, NULLABLE) - Sort order for kanban boards
- **estimated_close_date** (DATE, NULLABLE) - Expected close date
- **actual_close_date** (DATE, NULLABLE) - Actual close date
- **customer_organization_id** (BIGINT, FOREIGN KEY → organizations, NULLABLE) - Primary customer
- **principal_organization_id** (BIGINT, FOREIGN KEY → organizations, NULLABLE) - Primary principal
- **distributor_organization_id** (BIGINT, FOREIGN KEY → organizations, NULLABLE) - Primary distributor
- **founding_interaction_id** (BIGINT, NULLABLE) - First interaction that created opportunity
- **stage_manual** (BOOLEAN, DEFAULT false) - Manual stage override flag
- **status_manual** (BOOLEAN, DEFAULT false) - Manual status override flag
- **next_action** (TEXT, NULLABLE) - Next step description
- **next_action_date** (DATE, NULLABLE) - Next action due date
- **competition** (TEXT, NULLABLE) - Competitive information
- **decision_criteria** (TEXT, NULLABLE) - Customer decision criteria
- **contact_ids** (BIGINT[], DEFAULT '{}') - Array of related contact IDs
- **company_id** (BIGINT, FOREIGN KEY → organizations, NULLABLE) - Primary organization (legacy)
- **sales_id** (BIGINT, FOREIGN KEY → sales, NULLABLE) - Assigned sales representative
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp
- **created_by** (BIGINT, FOREIGN KEY → sales, NULLABLE) - User who created the record
- **deleted_at** (TIMESTAMPTZ, NULLABLE) - Soft delete timestamp
- **search_tsv** (TSVECTOR, NULLABLE) - Full-text search vector

### TABLE: tags
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique tag identifier
- **name** (TEXT, NOT NULL, UNIQUE) - Tag name
- **color** (TEXT, DEFAULT 'blue-500') - Semantic color value
- **description** (TEXT, NULLABLE) - Tag description
- **usage_count** (INTEGER, DEFAULT 0) - Number of times used
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp

### TABLE: tasks
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique task identifier
- **name** (TEXT, NOT NULL) - Task title
- **description** (TEXT, NULLABLE) - Task details
- **due_date** (DATE, NULLABLE) - Due date
- **reminder_date** (DATE, NULLABLE) - Reminder date
- **completed** (BOOLEAN, DEFAULT false) - Completion status
- **completed_at** (TIMESTAMPTZ, NULLABLE) - Completion timestamp
- **priority** (ENUM: low/medium/high/critical) - Priority level
- **contact_id** (BIGINT, FOREIGN KEY → contacts, NULLABLE) - Related contact
- **company_id** (BIGINT, FOREIGN KEY → organizations, NULLABLE) - Related organization
- **opportunity_id** (BIGINT, FOREIGN KEY → opportunities, NULLABLE) - Related opportunity
- **sales_id** (BIGINT, FOREIGN KEY → sales, NULLABLE) - Assigned user
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp
- **archived_at** (TIMESTAMPTZ, NULLABLE) - Archive timestamp

### TABLE: activities
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique activity identifier
- **activity_type** (ENUM: engagement/interaction, NOT NULL) - Activity classification
- **type** (ENUM: call/email/meeting/demo/proposal/follow_up/trade_show/site_visit/contract_review/check_in/social, NOT NULL) - Specific activity type
- **subject** (TEXT, NOT NULL) - Activity subject/title
- **description** (TEXT, NULLABLE) - Activity details
- **activity_date** (TIMESTAMPTZ, DEFAULT NOW()) - Activity date/time
- **duration_minutes** (INTEGER, NULLABLE) - Duration in minutes
- **contact_id** (BIGINT, FOREIGN KEY → contacts, NULLABLE) - Primary contact
- **organization_id** (BIGINT, FOREIGN KEY → organizations, NULLABLE) - Primary organization
- **opportunity_id** (BIGINT, FOREIGN KEY → opportunities, NULLABLE) - Related opportunity (required for interactions)
- **follow_up_required** (BOOLEAN, DEFAULT false) - Follow-up needed flag
- **follow_up_date** (DATE, NULLABLE) - Follow-up due date
- **follow_up_notes** (TEXT, NULLABLE) - Follow-up details
- **outcome** (TEXT, NULLABLE) - Activity outcome
- **sentiment** (VARCHAR(10), CHECK: positive/neutral/negative) - Sentiment assessment
- **attachments** (TEXT[], NULLABLE) - Array of attachment URLs
- **location** (TEXT, NULLABLE) - Activity location
- **attendees** (TEXT[], NULLABLE) - Array of attendee names
- **tags** (TEXT[], NULLABLE) - Array of tags
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp
- **created_by** (BIGINT, FOREIGN KEY → sales, NULLABLE) - User who created the record
- **deleted_at** (TIMESTAMPTZ, NULLABLE) - Soft delete timestamp

### TABLE: products
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique product identifier
- **principal_id** (BIGINT, FOREIGN KEY → organizations, NOT NULL) - Manufacturing organization
- **name** (TEXT, NOT NULL) - Product name
- **description** (TEXT, NULLABLE) - Product description
- **sku** (TEXT, NOT NULL) - Stock Keeping Unit
- **upc** (TEXT, NULLABLE) - Universal Product Code
- **category** (ENUM: beverages/dairy/frozen/fresh_produce/meat_poultry/seafood/dry_goods/snacks/condiments/baking_supplies/spices_seasonings/canned_goods/pasta_grains/oils_vinegars/sweeteners/cleaning_supplies/paper_products/equipment/other, NOT NULL) - Product category
- **subcategory** (TEXT, NULLABLE) - Product subcategory
- **brand** (TEXT, NULLABLE) - Brand name
- **unit_of_measure** (ENUM: each/case/pallet/pound/ounce/gallon/quart/pint/liter/kilogram/gram/dozen/gross/box/bag/container) - Base unit
- **units_per_case** (INTEGER, NULLABLE) - Units in a case
- **cases_per_pallet** (INTEGER, NULLABLE) - Cases on a pallet
- **weight_per_unit** (NUMERIC(10,3), NULLABLE) - Weight per unit
- **dimensions** (JSONB, NULLABLE) - Product dimensions (length, width, height)
- **cost_per_unit** (NUMERIC(12,2), NULLABLE) - Cost per unit
- **list_price** (NUMERIC(12,2), NULLABLE) - List price per unit
- **map_price** (NUMERIC(12,2), NULLABLE) - Minimum advertised price
- **min_order_quantity** (INTEGER, DEFAULT 1) - Minimum order quantity
- **max_order_quantity** (INTEGER, NULLABLE) - Maximum order quantity
- **lead_time_days** (INTEGER, NULLABLE) - Lead time in days
- **status** (ENUM: active/discontinued/seasonal/coming_soon/out_of_stock/limited_availability) - Product status
- **storage_temperature** (ENUM: frozen/refrigerated/cool/room_temp/no_requirement) - Storage requirements
- **shelf_life_days** (INTEGER, NULLABLE) - Shelf life in days
- **expiration_date_required** (BOOLEAN, DEFAULT false) - Expiration date tracking flag
- **lot_tracking_required** (BOOLEAN, DEFAULT false) - Lot number tracking flag
- **is_seasonal** (BOOLEAN, DEFAULT false) - Seasonal product flag
- **season_start_month** (INTEGER, CHECK: 1-12, NULLABLE) - Season start month
- **season_end_month** (INTEGER, CHECK: 1-12, NULLABLE) - Season end month
- **specifications** (JSONB, NULLABLE) - Technical specifications
- **certifications** (TEXT[], NULLABLE) - Array of certifications
- **allergens** (TEXT[], NULLABLE) - Array of allergens
- **ingredients** (TEXT, NULLABLE) - Ingredient list
- **nutritional_info** (JSONB, NULLABLE) - Nutritional information
- **image_urls** (TEXT[], NULLABLE) - Array of product image URLs
- **marketing_description** (TEXT, NULLABLE) - Marketing copy
- **features** (TEXT[], NULLABLE) - Array of features
- **benefits** (TEXT[], NULLABLE) - Array of benefits
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp
- **created_by** (BIGINT, FOREIGN KEY → sales, NULLABLE) - User who created the record
- **updated_by** (BIGINT, FOREIGN KEY → sales, NULLABLE) - User who last updated the record
- **deleted_at** (TIMESTAMPTZ, NULLABLE) - Soft delete timestamp
- **search_tsv** (TSVECTOR, NULLABLE) - Full-text search vector

### TABLE: contact_organizations (Junction Table)
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique relationship identifier
- **contact_id** (BIGINT, FOREIGN KEY → contacts, NOT NULL) - Contact reference
- **organization_id** (BIGINT, FOREIGN KEY → organizations, NOT NULL) - Organization reference
- **is_primary** (BOOLEAN, DEFAULT false) - Primary organization flag
- **is_primary_decision_maker** (BOOLEAN, DEFAULT false) - Primary decision maker flag
- **is_primary_contact** (BOOLEAN, DEFAULT false) - Primary contact for organization flag
- **role** (ENUM: decision_maker/influencer/buyer/end_user/gatekeeper/champion/technical/executive) - Role in organization
- **purchase_influence** (SMALLINT, CHECK: 0-100, NULLABLE) - Purchase influence percentage
- **decision_authority** (SMALLINT, CHECK: 0-100, NULLABLE) - Decision authority percentage
- **relationship_start_date** (DATE, DEFAULT CURRENT_DATE) - Relationship start
- **relationship_end_date** (DATE, NULLABLE) - Relationship end
- **notes** (TEXT, NULLABLE) - Relationship notes
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp
- **created_by** (BIGINT, FOREIGN KEY → sales, NULLABLE) - User who created the record
- **deleted_at** (TIMESTAMPTZ, NULLABLE) - Soft delete timestamp

### TABLE: opportunity_participants (Junction Table)
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique participant identifier
- **opportunity_id** (BIGINT, FOREIGN KEY → opportunities, NOT NULL) - Opportunity reference
- **organization_id** (BIGINT, FOREIGN KEY → organizations, NOT NULL) - Organization reference
- **role** (VARCHAR(20), CHECK: customer/principal/distributor/partner/competitor, NOT NULL) - Participant role
- **is_primary** (BOOLEAN, DEFAULT false) - Primary participant for role flag
- **commission_rate** (NUMERIC(5,4), CHECK: 0-1, NULLABLE) - Commission rate (0.0000 to 1.0000)
- **territory** (TEXT, NULLABLE) - Territory assignment
- **notes** (TEXT, NULLABLE) - Participant notes
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp
- **created_by** (BIGINT, FOREIGN KEY → sales, NULLABLE) - User who created the record
- **deleted_at** (TIMESTAMPTZ, NULLABLE) - Soft delete timestamp

### TABLE: opportunity_products (Line Items)
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique line item identifier
- **opportunity_id** (BIGINT, FOREIGN KEY → opportunities, NOT NULL) - Opportunity reference
- **product_id** (BIGINT, NULLABLE) - Legacy product ID
- **product_id_reference** (BIGINT, FOREIGN KEY → products, NULLABLE) - Product reference
- **product_name** (TEXT, NOT NULL) - Product name (denormalized for history)
- **product_category** (TEXT, NULLABLE) - Product category
- **quantity** (INTEGER, DEFAULT 1) - Quantity ordered
- **unit_price** (NUMERIC(12,2), NULLABLE) - Price per unit
- **extended_price** (NUMERIC(12,2), GENERATED: quantity * unit_price) - Total before discount
- **discount_percent** (NUMERIC(5,2), DEFAULT 0, CHECK: 0-100) - Discount percentage
- **final_price** (NUMERIC(12,2), GENERATED: quantity * unit_price * (1 - discount_percent/100)) - Final price
- **price_tier_id** (BIGINT, FOREIGN KEY → product_pricing_tiers, NULLABLE) - Applied pricing tier
- **cost_per_unit** (NUMERIC(12,2), NULLABLE) - Cost per unit
- **margin_percent** (NUMERIC(5,2), NULLABLE) - Margin percentage
- **total_weight** (NUMERIC(12,3), NULLABLE) - Total weight
- **special_pricing_applied** (BOOLEAN, DEFAULT false) - Special pricing flag
- **pricing_notes** (TEXT, NULLABLE) - Pricing notes
- **notes** (TEXT, NULLABLE) - Line item notes
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp
- **created_by** (BIGINT, FOREIGN KEY → sales, NULLABLE) - User who created the record

### TABLE: contactNotes
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique note identifier
- **contact_id** (BIGINT, FOREIGN KEY → contacts, NOT NULL) - Contact reference
- **text** (TEXT, NOT NULL) - Note content
- **attachments** (TEXT[], NULLABLE) - Array of attachment URLs
- **sales_id** (BIGINT, FOREIGN KEY → sales, NULLABLE) - Author
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp

### TABLE: opportunityNotes
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique note identifier
- **opportunity_id** (BIGINT, FOREIGN KEY → opportunities, NOT NULL) - Opportunity reference
- **text** (TEXT, NOT NULL) - Note content
- **attachments** (TEXT[], NULLABLE) - Array of attachment URLs
- **sales_id** (BIGINT, FOREIGN KEY → sales, NULLABLE) - Author
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp

### TABLE: contact_preferred_principals
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique preference identifier
- **contact_id** (BIGINT, FOREIGN KEY → contacts, NOT NULL) - Contact reference
- **principal_organization_id** (BIGINT, FOREIGN KEY → organizations, NOT NULL) - Principal organization reference
- **advocacy_strength** (SMALLINT, DEFAULT 50, CHECK: 0-100) - Advocacy strength percentage
- **last_interaction_date** (DATE, NULLABLE) - Last interaction date
- **notes** (TEXT, NULLABLE) - Preference notes
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp
- **created_by** (BIGINT, FOREIGN KEY → sales, NULLABLE) - User who created the record
- **deleted_at** (TIMESTAMPTZ, NULLABLE) - Soft delete timestamp

### TABLE: interaction_participants
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique participant identifier
- **activity_id** (BIGINT, FOREIGN KEY → activities, NOT NULL) - Activity reference
- **contact_id** (BIGINT, FOREIGN KEY → contacts, NULLABLE) - Contact participant
- **organization_id** (BIGINT, FOREIGN KEY → organizations, NULLABLE) - Organization participant
- **role** (VARCHAR(20), DEFAULT 'participant') - Participant role
- **notes** (TEXT, NULLABLE) - Participant notes
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp

### TABLE: product_pricing_tiers
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique pricing tier identifier
- **product_id** (BIGINT, FOREIGN KEY → products, NOT NULL) - Product reference
- **tier_name** (TEXT, NULLABLE) - Tier name
- **min_quantity** (INTEGER, NOT NULL) - Minimum quantity for tier
- **max_quantity** (INTEGER, NULLABLE) - Maximum quantity for tier
- **unit_price** (NUMERIC(12,2), NOT NULL) - Price per unit at this tier
- **discount_percent** (NUMERIC(5,2), NULLABLE) - Discount percentage
- **discount_amount** (NUMERIC(12,2), NULLABLE) - Discount amount
- **effective_date** (DATE, DEFAULT CURRENT_DATE) - Tier effective date
- **expiration_date** (DATE, NULLABLE) - Tier expiration date
- **notes** (TEXT, NULLABLE) - Tier notes
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp
- **created_by** (BIGINT, FOREIGN KEY → sales, NULLABLE) - User who created the record

### TABLE: product_distributor_authorizations
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique authorization identifier
- **product_id** (BIGINT, FOREIGN KEY → products, NOT NULL) - Product reference
- **distributor_id** (BIGINT, FOREIGN KEY → organizations, NOT NULL) - Distributor organization
- **is_authorized** (BOOLEAN, DEFAULT true) - Authorization status
- **authorization_date** (DATE, DEFAULT CURRENT_DATE) - Authorization date
- **expiration_date** (DATE, NULLABLE) - Authorization expiration
- **special_pricing** (JSONB, NULLABLE) - Special pricing rules
- **territory_restrictions** (TEXT[], NULLABLE) - Territory restrictions
- **notes** (TEXT, NULLABLE) - Authorization notes
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp
- **created_by** (BIGINT, FOREIGN KEY → sales, NULLABLE) - User who created the record

### TABLE: product_inventory
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique inventory identifier
- **product_id** (BIGINT, FOREIGN KEY → products, NOT NULL) - Product reference
- **warehouse_location** (TEXT, NULLABLE) - Warehouse location
- **quantity_on_hand** (INTEGER, DEFAULT 0) - Current stock
- **quantity_committed** (INTEGER, DEFAULT 0) - Committed stock
- **quantity_available** (INTEGER, GENERATED: quantity_on_hand - quantity_committed) - Available stock
- **reorder_point** (INTEGER, NULLABLE) - Reorder trigger point
- **reorder_quantity** (INTEGER, NULLABLE) - Reorder quantity
- **last_restock_date** (DATE, NULLABLE) - Last restock date
- **next_restock_date** (DATE, NULLABLE) - Next expected restock
- **lot_numbers** (JSONB, NULLABLE) - Lot number tracking
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp

### TABLE: product_pricing_models
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique pricing model identifier
- **product_id** (BIGINT, FOREIGN KEY → products, NOT NULL) - Product reference
- **model_type** (ENUM: fixed/tiered/volume/subscription/custom) - Pricing model type
- **base_price** (NUMERIC(12,2), NULLABLE) - Base price
- **min_price** (NUMERIC(12,2), NULLABLE) - Minimum price
- **max_price** (NUMERIC(12,2), NULLABLE) - Maximum price
- **pricing_rules** (JSONB, NULLABLE) - Complex pricing rules
- **is_active** (BOOLEAN, DEFAULT true) - Active status
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp
- **created_by** (BIGINT, FOREIGN KEY → sales, NULLABLE) - User who created the record

### TABLE: product_features
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique feature identifier
- **product_id** (BIGINT, FOREIGN KEY → products, NOT NULL) - Product reference
- **feature_name** (TEXT, NOT NULL) - Feature name
- **feature_value** (TEXT, NULLABLE) - Feature value
- **display_order** (INTEGER, DEFAULT 0) - Display order
- **is_highlighted** (BOOLEAN, DEFAULT false) - Highlight flag
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp

### TABLE: product_category_hierarchy
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique category identifier
- **category_name** (TEXT, NOT NULL, UNIQUE) - Category name
- **parent_category_id** (BIGINT, FOREIGN KEY → product_category_hierarchy, NULLABLE) - Parent category
- **category_path** (TEXT, NULLABLE) - Full category path
- **level** (INTEGER, NOT NULL, DEFAULT 0) - Hierarchy level
- **display_order** (INTEGER, DEFAULT 0) - Display order
- **icon** (TEXT, NULLABLE) - Category icon
- **description** (TEXT, NULLABLE) - Category description
- **attributes** (JSONB, NULLABLE) - Category-specific attributes
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp
- **updated_at** (TIMESTAMPTZ, DEFAULT NOW()) - Last update timestamp

### TABLE: migration_history
- **id** (BIGINT, PRIMARY KEY, AUTO_INCREMENT) - Unique migration identifier
- **phase_number** (TEXT, NOT NULL) - Migration phase number
- **phase_name** (TEXT, NOT NULL) - Migration phase name
- **status** (TEXT, NOT NULL, DEFAULT 'pending') - Migration status
- **started_at** (TIMESTAMPTZ, NULLABLE) - Start timestamp
- **completed_at** (TIMESTAMPTZ, NULLABLE) - Completion timestamp
- **error_message** (TEXT, NULLABLE) - Error details if failed
- **rollback_sql** (TEXT, NULLABLE) - Rollback SQL script
- **rows_affected** (BIGINT, NULLABLE) - Number of rows affected
- **created_at** (TIMESTAMPTZ, DEFAULT NOW()) - Creation timestamp

---

## Key Design Patterns

### 1. Soft Deletes
Most tables include a `deleted_at` timestamp for soft deletion, allowing data recovery and audit trails.

### 2. Full-Text Search
Core entities (organizations, contacts, opportunities, products) include `search_tsv` columns for PostgreSQL full-text search capabilities.

### 3. Hierarchical Relationships
- Organizations can have parent organizations for corporate hierarchies
- Product categories support nested hierarchies
- Both use self-referential foreign keys

### 4. Flexible Contact Information
Contacts use JSONB columns for email and phone, allowing multiple values with metadata (type, primary flag, etc.)

### 5. Multi-Participant Opportunities
Opportunities support multiple participants through the opportunity_participants junction table, enabling complex B2B scenarios with customers, principals, and distributors.

### 6. Activity Distinction
Activities are classified as either:
- **Engagements**: General activities not tied to specific opportunities
- **Interactions**: Activities specifically related to opportunities

### 7. Comprehensive Audit Trail
Most tables include:
- `created_at` / `updated_at` timestamps
- `created_by` references to track who created records
- `deleted_at` for soft deletes

### 8. Row Level Security (RLS)
All tables have RLS enabled with policies allowing authenticated users to access data based on their roles.

---

## Database Views

The system includes several analytical views that aggregate data:

1. **organizations_summary** - Organization metrics with contact and opportunity counts
2. **contacts_summary** - Contact details with related organization and task counts
3. **opportunities_summary** - Opportunity pipeline with participant counts
4. **opportunities_with_participants** - Opportunities with full participant details in JSON
5. **contact_influence_profile** - Contact influence metrics across organizations
6. **principal_advocacy_dashboard** - Principal organization advocacy metrics
7. **engagement_analytics** - Monthly engagement activity analytics
8. **interaction_analytics** - Opportunity interaction metrics
9. **contact_engagement_summary** - Per-contact activity summary
10. **product_catalog** - Complete product catalog with pricing and availability
11. **product_performance** - Product sales performance metrics

---

## Notes on Recent Migration

The database recently underwent a major migration (2025-01-26) that:
1. Renamed `companies` table to `organizations`
2. Updated the opportunity_stage enum to an 8-stage food service workflow:
   - new_lead
   - initial_outreach
   - sample_visit_offered
   - awaiting_response
   - feedback_logged
   - demo_scheduled
   - closed_won
   - closed_lost
3. Updated all foreign key constraints and views to reference the new table name
4. Maintained backward compatibility through view aliases