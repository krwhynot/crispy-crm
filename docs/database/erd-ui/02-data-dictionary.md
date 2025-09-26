# Data Dictionary

## Overview
Complete data dictionary for the Atomic CRM database, documenting all tables, columns, types, constraints, meanings, and concrete examples.

## Table of Contents
1. [Core Entities](#core-entities)
2. [Junction Tables](#junction-tables)
3. [Product Tables](#product-tables)
4. [Activity & Notes](#activity--notes)
5. [Supporting Tables](#supporting-tables)
6. [Enum Types](#enum-types)

---

## Core Entities

### organizations (companies)
**Purpose**: Stores all business entities - customers, principals, distributors, partners

| Column | Type | Nullable | Default | Description | Example |
|--------|------|----------|---------|-------------|---------|
| id | bigint | NO | nextval | Primary key | 1001 |
| name | text | NO | - | Company name | "Acme Foods Inc" |
| organization_type | enum | YES | 'unknown' | Type of organization | 'customer' |
| is_principal | boolean | YES | false | Is manufacturer/supplier | true |
| is_distributor | boolean | YES | false | Is distributor | false |
| parent_company_id | bigint | YES | NULL | Parent company reference | 1000 |
| segment | text | YES | NULL | Market segment | "Enterprise" |
| priority | varchar(1) | YES | NULL | Priority level (A-D) | "B" |
| industry | text | YES | NULL | Industry category | "Food & Beverage" |
| website | text | YES | NULL | Company website | "https://acmefoods.com" |
| address | text | YES | NULL | Street address | "123 Main St, Suite 100" |
| city | text | YES | NULL | City | "San Francisco" |
| state | text | YES | NULL | State/Province | "CA" |
| postal_code | text | YES | NULL | ZIP/Postal code | "94105" |
| country | text | YES | 'USA' | Country | "USA" |
| phone | text | YES | NULL | Main phone number | "+1-415-555-0100" |
| email | text | YES | NULL | Main email | "info@acmefoods.com" |
| logo_url | text | YES | NULL | Company logo URL | "https://storage.supabase.co/..." |
| linkedin_url | text | YES | NULL | LinkedIn company page | "https://linkedin.com/company/acme-foods" |
| annual_revenue | numeric | YES | NULL | Annual revenue in dollars | 5000000.00 |
| employee_count | integer | YES | NULL | Number of employees | 250 |
| founded_year | integer | YES | NULL | Year company founded | 1995 |
| notes | text | YES | NULL | Internal notes | "Key account, renewal coming Q2" |
| tags | bigint[] | YES | {} | Array of tag IDs | {1,2,5} |
| sales_id | bigint | YES | NULL | Assigned salesperson | 1 |
| search_tsv | tsvector | YES | - | Full-text search vector | 'acm':1 'food':2 'inc':3 |
| created_at | timestamptz | NO | now() | Record creation time | 2025-01-25 10:30:00+00 |
| updated_at | timestamptz | YES | now() | Last update time | 2025-01-25 14:45:00+00 |
| deleted_at | timestamptz | YES | NULL | Soft delete timestamp | NULL |

### contacts
**Purpose**: Stores people with flexible JSONB email/phone arrays

| Column | Type | Nullable | Default | Description | Example |
|--------|------|----------|---------|-------------|---------|
| id | bigint | NO | nextval | Primary key | 2001 |
| name | text | NO | - | Full name | "John Smith" |
| first_name | text | YES | NULL | First name | "John" |
| last_name | text | YES | NULL | Last name | "Smith" |
| email | jsonb | YES | '[]' | Email array | See below |
| phone | jsonb | YES | '[]' | Phone array | See below |
| title | text | YES | NULL | Job title | "VP of Operations" |
| role | enum | YES | NULL | Contact role | 'decision_maker' |
| department | text | YES | NULL | Department | "Operations" |
| is_primary_contact | boolean | YES | false | Primary contact flag | true |
| purchase_influence | varchar | YES | NULL | Influence level | "High" |
| decision_authority | varchar | YES | NULL | Authority level | "Decision Maker" |
| company_id | bigint | YES | NULL | Primary company (deprecated) | 1001 |
| gender | text | YES | NULL | Gender | "Male" |
| tags | bigint[] | YES | {} | Array of tag IDs | {3,7} |
| search_tsv | tsvector | YES | - | Search vector | 'john':1 'smith':2 'vp':3 |
| created_at | timestamptz | NO | now() | Creation time | 2025-01-20 09:00:00+00 |
| updated_at | timestamptz | YES | now() | Update time | 2025-01-25 11:30:00+00 |
| deleted_at | timestamptz | YES | NULL | Soft delete | NULL |

**Email JSONB Example**:
```json
[
  {
    "type": "work",
    "value": "john.smith@acmefoods.com",
    "primary": true,
    "verified": true
  },
  {
    "type": "personal",
    "value": "jsmith@gmail.com",
    "primary": false
  }
]
```

**Phone JSONB Example**:
```json
[
  {
    "type": "mobile",
    "value": "+1-415-555-0101",
    "primary": true,
    "sms_enabled": true
  },
  {
    "type": "office",
    "value": "+1-415-555-0100",
    "extension": "123"
  }
]
```

### opportunities
**Purpose**: Sales pipeline opportunities (NOT deals) with multi-stakeholder support

| Column | Type | Nullable | Default | Description | Example |
|--------|------|----------|---------|-------------|---------|
| id | bigint | NO | nextval | Primary key | 3001 |
| name | text | NO | - | Opportunity name | "Q1 2025 Expansion - Acme Foods" |
| description | text | YES | NULL | Detailed description | "Expanding product line into 50 stores" |
| stage | enum | NO | 'new_lead' | Pipeline stage | 'demo_scheduled' |
| status | enum | YES | 'active' | Current status | 'active' |
| priority | enum | YES | 'medium' | Priority level | 'high' |
| probability | integer | YES | 0 | Win probability (0-100) | 75 |
| amount | numeric | YES | NULL | Deal value in dollars | 150000.00 |
| category | text | YES | NULL | Opportunity category | "New Business" |
| index | integer | YES | 0 | Kanban sort order | 1 |
| estimated_close_date | date | YES | NULL | Expected close date | 2025-03-31 |
| actual_close_date | date | YES | NULL | Actual close date | NULL |
| customer_organization_id | bigint | YES | NULL | Customer reference | 1001 |
| principal_organization_id | bigint | YES | NULL | Principal/manufacturer | 1002 |
| distributor_organization_id | bigint | YES | NULL | Distributor | 1003 |
| founding_interaction_id | bigint | YES | NULL | First interaction | 5001 |
| stage_manual | boolean | YES | false | Manual stage override | false |
| next_action | text | YES | NULL | Next required action | "Send proposal by Friday" |
| next_action_date | date | YES | NULL | Next action due date | 2025-01-28 |
| competition | text | YES | NULL | Competing companies | "CompetitorX, CompetitorY" |
| decision_criteria | text | YES | NULL | Decision factors | "Price, delivery time, quality" |
| contact_ids | bigint[] | YES | {} | Associated contacts | {2001,2002,2003} |
| search_tsv | tsvector | YES | - | Search vector | 'expans':1 'acm':2 'food':3 |
| created_at | timestamptz | NO | now() | Creation time | 2025-01-15 08:00:00+00 |
| updated_at | timestamptz | YES | now() | Update time | 2025-01-25 16:20:00+00 |
| deleted_at | timestamptz | YES | NULL | Soft delete | NULL |

### products
**Purpose**: Comprehensive product catalog with pricing and inventory

| Column | Type | Nullable | Default | Description | Example |
|--------|------|----------|---------|-------------|---------|
| id | bigint | NO | nextval | Primary key | 4001 |
| principal_id | bigint | YES | NULL | Manufacturer/principal | 1002 |
| name | text | NO | - | Product name | "Organic Honey 16oz" |
| description | text | YES | NULL | Product description | "Pure wildflower honey, USDA organic" |
| sku | text | YES | NULL | Stock keeping unit | "HON-ORG-16" |
| upc | text | YES | NULL | Universal product code | "123456789012" |
| category | enum | YES | NULL | Product category | 'condiments' |
| subcategory | text | YES | NULL | Subcategory | "Sweeteners" |
| brand | text | YES | NULL | Brand name | "Nature's Best" |
| unit_of_measure | enum | YES | 'each' | Unit type | 'case' |
| units_per_case | integer | YES | 1 | Units in case | 12 |
| cases_per_pallet | integer | YES | NULL | Cases per pallet | 100 |
| weight_per_unit | numeric | YES | NULL | Weight per unit (lbs) | 1.0 |
| dimensions | jsonb | YES | NULL | Product dimensions | {"length":4,"width":4,"height":6,"unit":"inches"} |
| cost_per_unit | numeric | YES | NULL | Unit cost | 8.50 |
| list_price | numeric | YES | NULL | List price | 12.99 |
| map_price | numeric | YES | NULL | Min advertised price | 10.99 |
| min_order_quantity | integer | YES | 1 | Minimum order | 1 |
| lead_time_days | integer | YES | NULL | Lead time in days | 7 |
| status | enum | YES | 'active' | Product status | 'active' |
| storage_temperature | enum | YES | NULL | Storage requirements | 'room_temp' |
| shelf_life_days | integer | YES | NULL | Shelf life | 365 |
| is_seasonal | boolean | YES | false | Seasonal product | false |
| certifications | text[] | YES | {} | Certifications | {"USDA Organic","Non-GMO","Kosher"} |
| allergens | text[] | YES | {} | Allergen info | {"None"} |
| nutritional_info | jsonb | YES | NULL | Nutrition facts | {"calories":60,"sugar":"17g","serving_size":"1 tbsp"} |
| search_tsv | tsvector | YES | - | Search vector | 'organ':1 'honey':2 '16oz':3 |
| created_at | timestamptz | NO | now() | Creation time | 2025-01-01 12:00:00+00 |
| deleted_at | timestamptz | YES | NULL | Soft delete | NULL |

---

## Junction Tables

### contact_organizations
**Purpose**: Many-to-many relationship between contacts and organizations

| Column | Type | Nullable | Default | Description | Example |
|--------|------|----------|---------|-------------|---------|
| contact_id | bigint | NO | - | Contact reference | 2001 |
| organization_id | bigint | NO | - | Organization reference | 1001 |
| is_primary | boolean | YES | false | Primary organization for contact | true |
| role | enum | YES | NULL | Role at organization | 'decision_maker' |
| purchase_influence | smallint | YES | NULL | Influence score (0-100) | 85 |
| decision_authority | smallint | YES | NULL | Authority score (0-100) | 90 |
| relationship_start_date | date | YES | NULL | When relationship began | 2024-06-01 |
| notes | text | YES | NULL | Relationship notes | "Key decision maker for IT purchases" |
| created_at | timestamptz | NO | now() | Creation time | 2025-01-20 10:00:00+00 |
| deleted_at | timestamptz | YES | NULL | Soft delete | NULL |

### opportunity_participants
**Purpose**: Multi-stakeholder participation in opportunities

| Column | Type | Nullable | Default | Description | Example |
|--------|------|----------|---------|-------------|---------|
| id | bigint | NO | nextval | Primary key | 6001 |
| opportunity_id | bigint | NO | - | Opportunity reference | 3001 |
| organization_id | bigint | NO | - | Organization reference | 1001 |
| role | varchar | NO | - | Participant role | 'customer' |
| is_primary | boolean | YES | false | Primary for this role | true |
| commission_rate | numeric | YES | NULL | Commission rate (0.00-1.00) | 0.15 |
| territory | text | YES | NULL | Territory/region | "West Coast" |
| notes | text | YES | NULL | Participation notes | "Leading the evaluation process" |
| created_at | timestamptz | NO | now() | Creation time | 2025-01-15 09:00:00+00 |

### opportunity_contacts
**Purpose**: Link contacts to opportunities

| Column | Type | Nullable | Default | Description | Example |
|--------|------|----------|---------|-------------|---------|
| opportunity_id | bigint | NO | - | Opportunity reference | 3001 |
| contact_id | bigint | NO | - | Contact reference | 2001 |
| role | text | YES | NULL | Role in opportunity | "Technical Evaluator" |
| is_primary | boolean | YES | false | Primary contact | true |
| created_at | timestamptz | NO | now() | Creation time | 2025-01-15 10:00:00+00 |

---

## Product Tables

### product_pricing_tiers
**Purpose**: Volume-based pricing tiers

| Column | Type | Nullable | Default | Description | Example |
|--------|------|----------|---------|-------------|---------|
| id | bigint | NO | nextval | Primary key | 7001 |
| product_id | bigint | NO | - | Product reference | 4001 |
| tier_name | text | NO | - | Tier name | "Volume Discount" |
| min_quantity | integer | NO | - | Minimum quantity | 100 |
| max_quantity | integer | YES | NULL | Maximum quantity (NULL=unlimited) | 499 |
| unit_price | numeric | NO | - | Price per unit | 7.50 |
| discount_percent | numeric | YES | NULL | Discount percentage | 15.00 |
| effective_date | date | YES | NULL | Start date | 2025-01-01 |
| expiration_date | date | YES | NULL | End date | 2025-12-31 |

### product_inventory
**Purpose**: Real-time inventory tracking

| Column | Type | Nullable | Default | Description | Example |
|--------|------|----------|---------|-------------|---------|
| id | bigint | NO | nextval | Primary key | 8001 |
| product_id | bigint | NO | - | Product reference | 4001 |
| warehouse_location | text | NO | - | Location | "Warehouse A - Bay 12" |
| quantity_on_hand | integer | NO | 0 | Current stock | 500 |
| quantity_committed | integer | NO | 0 | Committed stock | 150 |
| quantity_available | integer | - | - | Available (generated) | 350 |
| reorder_point | integer | YES | NULL | Reorder trigger | 100 |
| lot_numbers | jsonb | YES | NULL | Lot tracking | {"lots":["LOT2025A","LOT2025B"]} |
| last_inventory_date | date | YES | NULL | Last count date | 2025-01-20 |

---

## Activity & Notes

### activities
**Purpose**: Track all customer interactions and engagements

| Column | Type | Nullable | Default | Description | Example |
|--------|------|----------|---------|-------------|---------|
| id | bigint | NO | nextval | Primary key | 5001 |
| activity_type | enum | NO | - | Type category | 'interaction' |
| type | enum | NO | - | Specific type | 'meeting' |
| subject | text | NO | - | Subject/title | "Product demo with IT team" |
| description | text | YES | NULL | Detailed notes | "Demonstrated integration capabilities" |
| activity_date | timestamptz | NO | now() | When occurred | 2025-01-25 14:30:00+00 |
| duration_minutes | integer | YES | NULL | Duration | 60 |
| contact_id | bigint | YES | NULL | Primary contact | 2001 |
| organization_id | bigint | YES | NULL | Organization | 1001 |
| opportunity_id | bigint | YES | NULL | Related opportunity | 3001 |
| follow_up_required | boolean | YES | false | Needs follow-up | true |
| follow_up_date | date | YES | NULL | Follow-up due | 2025-01-30 |
| outcome | text | YES | NULL | Result/outcome | "Very positive, requested pricing" |
| sentiment | varchar | YES | NULL | Sentiment analysis | 'positive' |
| attachments | text[] | YES | {} | File attachments | {"demo-slides.pdf","notes.docx"} |
| location | text | YES | NULL | Meeting location | "Customer HQ - Conference Room A" |
| attendees | text[] | YES | {} | Attendees list | {"John Smith","Jane Doe","Bob Johnson"} |

### contactNotes
**Purpose**: Notes and communications about contacts

| Column | Type | Nullable | Default | Description | Example |
|--------|------|----------|---------|-------------|---------|
| id | bigint | NO | nextval | Primary key | 9001 |
| contact_id | bigint | NO | - | Contact reference | 2001 |
| company_id | bigint | YES | NULL | Company context | 1001 |
| text | text | NO | - | Note content | "Prefers morning meetings, coffee enthusiast" |
| created_by | bigint | YES | NULL | Author | 1 |
| created_at | timestamptz | NO | now() | Creation time | 2025-01-25 09:15:00+00 |

### opportunityNotes
**Purpose**: Notes and updates about opportunities

| Column | Type | Nullable | Default | Description | Example |
|--------|------|----------|---------|-------------|---------|
| id | bigint | NO | nextval | Primary key | 10001 |
| opportunity_id | bigint | NO | - | Opportunity reference | 3001 |
| contact_id | bigint | YES | NULL | Related contact | 2001 |
| text | text | NO | - | Note content | "Budget approved, moving to contract review" |
| created_by | bigint | YES | NULL | Author | 1 |
| created_at | timestamptz | NO | now() | Creation time | 2025-01-25 11:30:00+00 |

---

## Supporting Tables

### sales (Users)
**Purpose**: System users and salespeople

| Column | Type | Nullable | Default | Description | Example |
|--------|------|----------|---------|-------------|---------|
| id | bigint | NO | nextval | Primary key | 1 |
| user_id | uuid | NO | - | Auth user reference | 123e4567-e89b-12d3... |
| email | text | NO | - | Email address | "john@atomiccrm.com" |
| first_name | text | YES | NULL | First name | "John" |
| last_name | text | YES | NULL | Last name | "Doe" |
| full_name | text | - | - | Generated full name | "John Doe" |
| avatar_url | text | YES | NULL | Profile picture | "https://storage..." |
| is_admin | boolean | YES | false | Admin privileges | true |
| disabled | boolean | YES | false | Account disabled | false |
| created_at | timestamptz | NO | now() | Creation time | 2025-01-01 08:00:00+00 |

### tags
**Purpose**: Categorization tags for entities

| Column | Type | Nullable | Default | Description | Example |
|--------|------|----------|---------|-------------|---------|
| id | bigint | NO | nextval | Primary key | 1 |
| name | text | NO | - | Tag name | "High Value" |
| color | varchar | YES | NULL | Display color | "#FF5722" |
| created_at | timestamptz | NO | now() | Creation time | 2025-01-01 10:00:00+00 |

### tasks
**Purpose**: Task management and reminders

| Column | Type | Nullable | Default | Description | Example |
|--------|------|----------|---------|-------------|---------|
| id | bigint | NO | nextval | Primary key | 11001 |
| text | text | NO | - | Task description | "Follow up on proposal" |
| type | enum | YES | 'task' | Task type | 'reminder' |
| related_to | text | NO | - | Entity type | 'opportunities' |
| related_to_id | bigint | NO | - | Entity ID | 3001 |
| due_date | date | YES | NULL | Due date | 2025-01-30 |
| reminder_date | date | YES | NULL | Reminder date | 2025-01-29 |
| assigned_to | bigint | YES | NULL | Assigned user | 1 |
| completed | boolean | YES | false | Completion status | false |
| created_by | bigint | YES | NULL | Creator | 1 |
| created_at | timestamptz | NO | now() | Creation time | 2025-01-25 14:00:00+00 |

---

## Enum Types

### Contact & Organization Enums
```sql
contact_role:
  - decision_maker    -- Final purchase decision authority
  - influencer       -- Influences decision but doesn't decide
  - buyer            -- Handles procurement process
  - end_user         -- Will use the product/service
  - gatekeeper       -- Controls access to decision makers
  - champion         -- Internal advocate for your solution
  - technical        -- Technical evaluation
  - executive        -- C-level or VP

organization_type:
  - customer         -- Active customer
  - principal        -- Manufacturer/supplier
  - distributor      -- Distribution partner
  - prospect         -- Potential customer
  - vendor           -- Supplier to us
  - partner          -- Strategic partner
  - unknown          -- Type not determined
```

### Opportunity Enums
```sql
opportunity_stage:
  - new_lead              -- 10% probability
  - initial_outreach      -- 20% probability
  - sample_visit_offered  -- 40% probability
  - awaiting_response     -- 60% probability
  - feedback_logged       -- 70% probability
  - demo_scheduled        -- 85% probability
  - closed_won            -- 100% probability
  - closed_lost           -- 0% probability

opportunity_status:
  - active          -- Actively being worked
  - on_hold         -- Temporarily paused
  - nurturing       -- Long-term cultivation
  - stalled         -- No recent progress
  - expired         -- Past expected close date

priority_level:
  - low             -- Low priority
  - medium          -- Standard priority
  - high            -- High priority
  - critical        -- Urgent/critical
```

### Activity Enums
```sql
activity_type:
  - engagement      -- General activity
  - interaction     -- Opportunity-specific

interaction_type:
  - call            -- Phone call
  - email           -- Email exchange
  - meeting         -- In-person/virtual meeting
  - demo            -- Product demonstration
  - proposal        -- Proposal presentation
  - follow_up       -- Follow-up activity
  - trade_show      -- Trade show/event
  - site_visit      -- Customer site visit
  - contract_review -- Contract negotiation
  - check_in        -- Status check
  - social          -- Social media interaction
```

### Product Enums
```sql
product_category:
  - beverages       -- Drinks
  - dairy           -- Dairy products
  - frozen          -- Frozen foods
  - fresh_produce   -- Fresh fruits/vegetables
  - meat_poultry    -- Meat and poultry
  - seafood         -- Seafood products
  - dry_goods       -- Shelf-stable items
  - snacks          -- Snack foods
  - condiments      -- Sauces and condiments
  - bakery          -- Bakery items
  - deli            -- Deli products
  - health_beauty   -- Health and beauty
  - household       -- Household items
  - other           -- Other products

product_status:
  - active                -- Currently available
  - discontinued          -- No longer available
  - seasonal              -- Seasonal availability
  - coming_soon           -- Future product
  - out_of_stock          -- Temporarily unavailable
  - limited_availability  -- Limited quantity

storage_temperature:
  - frozen          -- Below 0°F
  - refrigerated    -- 32-40°F
  - cool            -- 50-60°F
  - room_temp       -- 68-77°F
  - no_requirement  -- No specific requirement
```

This data dictionary provides comprehensive documentation of every field in the Atomic CRM database, with concrete examples and clear descriptions to guide development and data entry.