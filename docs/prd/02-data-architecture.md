---
**Part of:** Atomic CRM Product Requirements Document
**Document:** Data Architecture
**Category:** Foundation

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 📋 [Executive Summary](./01-executive-summary.md) - Project overview
- 🗂️ [Organizations Module](./03-organizations.md) - Organization entity details
- 🗂️ [Contacts Module](./04-contacts.md) - Contact entity details
- 🗂️ [Opportunities Module](./05-opportunities.md) - Opportunity entity details
- 🗂️ [Products Module](./06-products.md) - Product entity details
- 🗂️ [Tasks Module](./07-tasks.md) - Task entity details
- 🔧 [Database Design](./19-database-design.md) - Implementation patterns

**Navigation:**
- ⬅️ Previous: [Executive Summary](./01-executive-summary.md)
- ➡️ Next: [Organizations Module](./03-organizations.md)
---

## 2. DATA ARCHITECTURE

### 2.1 Core Entities

#### Organizations Table
```typescript
interface Organization {
  // Primary Key
  organization_id: number;           // BIGINT, PK (auto-increment, industry standard for CRM)

  // Core Information
  organization_name: string;         // UNIQUE, REQUIRED
  priority_level: PriorityLevel;     // ENUM: A, B, C, D (4 levels, no A+)
  segment: OrganizationSegment;      // TEXT (flexible, with suggested defaults)

  // Distribution Relationship
  distributor_id?: number;           // FK → Organizations (self-reference)
  distributor_rep_name?: string;

  // Account Management
  primary_account_manager_id?: number;    // FK → Sales (Users)
  secondary_account_manager_id?: number;  // FK → Sales (Users)
  weekly_priority: boolean;               // Default: false

  // Contact Information
  linkedin_url?: string;
  phone?: string;
  street_address?: string;
  city?: string;
  state?: State;                     // ENUM: IL, IN, OH, MI, KY, NY, etc.
  zip_code?: string;

  // Additional
  notes?: string;                    // TEXT

  // Audit Fields
  created_at: Date;
  updated_at: Date;
  created_by: number;                // FK → Sales (Users)
  updated_by: number;                // FK → Sales (Users)
}

type PriorityLevel = 'A' | 'B' | 'C' | 'D';  // 4 levels only (no A+)

type OrganizationSegment = string;  // Flexible text field with suggested defaults:
// Default suggestions: 'Fine Dining', 'Casual', 'Gastropub', 'Ethnic', 'Pizza',
// 'Chain/Group', 'Distributor', 'Management Company', 'Catering'
// Users can create custom segments not in the default list

type State = 'IL' | 'IN' | 'OH' | 'MI' | 'KY' | 'NY' // ... etc.
```

#### Contacts Table
```typescript
interface Contact {
  // Primary Key
  contact_id: number;                // BIGINT, PK (auto-increment)

  // Core Information (Minimal implementation per Q1)
  name: string;                      // REQUIRED (computed from first_name + last_name)
  first_name?: string;
  last_name?: string;
  organization_id?: number;          // FK → Organizations

  // Contact Methods (JSONB Arrays - rarely used but available)
  // Note: <10% of contacts have multiple emails/phones (Q2: Rarely)
  email: EmailEntry[];               // Array: [{ email: "john@example.com", type: "Work" }]
  phone: PhoneEntry[];               // Array: [{ number: "555-1234", type: "Mobile" }]
  linkedin_url?: string;

  // Professional Information
  title?: string;                    // Job title (e.g., "Chef", "Manager")
  department?: string;

  // Management
  sales_id?: number;                 // FK → Sales (Users), account manager for this contact

  // Additional
  notes?: string;

  // Note: The following fields exist in database but NOT in UI (per code review):
  // - address, city, state, postal_code, country (not validated/shown)
  // - birthday, gender (personal info not collected)
  // - twitter_handle (social media minimal)
  // - tags (not implemented in UI)

  // Audit Fields
  created_at: Date;
  updated_at: Date;
  created_by?: number;               // FK → Sales (Users)
  updated_by?: number;               // FK → Sales (Users)
  deleted_at?: Date;                 // Soft delete timestamp (30-day retention)
}

// JSONB array entry types
interface EmailEntry {
  email: string;                     // Email address
  type: 'Work' | 'Home' | 'Other';   // Email type, DEFAULT: 'Work'
}

interface PhoneEntry {
  number: string;                    // Phone number
  type: 'Work' | 'Home' | 'Mobile' | 'Other';  // Phone type, DEFAULT: 'Work'
}

type ContactPosition =
  | 'Owner'
  | 'Manager'
  | 'Chef'
  | 'Distributor Rep'
  | 'Buyer'
  | 'GM'
  | 'VP'
  | 'President';
```

#### Opportunities Table
```typescript
interface Opportunity {
  // Primary Key
  opportunity_id: number;            // BIGINT, PK (auto-increment)

  // Core Information
  opportunity_name: string;          // REQUIRED
  description?: string;              // TEXT

  // Multi-Organization Tracking (Critical Feature)
  customer_organization_id: number;      // FK → Organizations, REQUIRED (the customer/restaurant)
  principal_organization_id: number;     // FK → Organizations, REQUIRED (the brand/manufacturer) ⭐ MOST IMPORTANT
  distributor_organization_id?: number;  // FK → Organizations (optional distributor)

  // Status & Stage
  status: OpportunityStatus;         // ENUM, DEFAULT: 'active'
  stage: OpportunityStage;           // ENUM, DEFAULT: 'new_lead'
  priority: PriorityLevel;           // ENUM: low, medium, high, critical, DEFAULT: 'medium'

  // Timeline
  estimated_close_date: Date;        // REQUIRED, DEFAULT: now() + 90 days
  actual_close_date?: Date;          // Populated when deal closes

  // NOTE: product_id removed - use opportunity_products junction table (M:N relationship)
  // Each opportunity can have multiple products, but only ONE principal

  // Workflow Management
  tags?: string[];                   // Array of tags for categorization (e.g., 'urgent', 'big-deal')
  next_action?: string;              // What to do next (e.g., "Follow up call")
  next_action_date?: Date;           // When to do next action
  decision_criteria?: string;        // What matters to the customer in their decision

  // Ownership & Source
  opportunity_owner_id?: number;     // FK → Sales (Users), who owns this deal
  account_manager_id?: number;       // FK → Sales (Users), account manager
  lead_source?: string;              // Where lead came from (e.g., 'referral', 'trade_show')

  // System Fields
  index?: number;                    // Sort order
  founding_interaction_id?: number;  // FK → Activities (what created this opportunity)
  stage_manual: boolean;             // Whether stage was manually set (vs. auto-updated)
  status_manual: boolean;            // Whether status was manually set

  // Additional
  notes?: string;                    // TEXT

  // Audit Fields
  created_at: Date;
  updated_at: Date;
  created_by?: number;               // FK → Sales (Users)
  updated_by?: number;               // FK → Sales (Users)
  deleted_at?: Date;                 // Soft delete timestamp
}

type OpportunityStatus =
  | 'active'                         // Currently working on deal (DEFAULT)
  | 'open'                           // Legacy variant, treated as 'active'
  | 'closed'                         // Deal closed (won or lost)
  | 'on_hold';                       // Deal paused

type OpportunityStage =
  | 'new_lead'                       // Initial lead discovery (DEFAULT)
  | 'initial_outreach'               // First contact attempt
  | 'sample_visit_offered'           // Offered product sample/visit
  | 'awaiting_response'              // Waiting for customer response
  | 'feedback_logged'                // Customer feedback received
  | 'demo_scheduled'                 // Demo/cookup scheduled
  | 'closed_won'                     // Deal won (SOLD)
  | 'closed_lost';                   // Deal lost

type PriorityLevel =
  | 'low'
  | 'medium'                         // DEFAULT
  | 'high'
  | 'critical';

type LeadSource =
  | 'referral'
  | 'trade_show'
  | 'website'
  | 'cold_call'
  | 'email_campaign'
  | 'social_media'
  | 'partner'
  | 'existing_customer';
```

#### Products Table
```typescript
interface Product {
  // Primary Key
  product_id: number;                // BIGINT, PK (auto-increment)

  // Core Information
  product_name: string;              // UNIQUE, REQUIRED
  principal?: string;                // Brand name
  category?: string;
  description?: string;

  // Status
  active: boolean;                   // DEFAULT: true

  // Audit Fields
  created_at: Date;
  updated_at: Date;
}
```

#### Users Table (Implemented as "Sales" table)
```typescript
interface User {
  // Primary Key
  user_id: number;                   // BIGINT, PK (auto-increment)
  auth_user_id: string;              // UUID, FK → auth.users(id), UNIQUE

  // Authentication
  username: string;                  // UNIQUE, REQUIRED
  email: string;                     // UNIQUE, REQUIRED
  password_hash: string;

  // Profile
  full_name: string;                 // REQUIRED
  role: UserRole;                    // ENUM
  active: boolean;                   // DEFAULT: true

  // Session
  last_login?: Date;

  // Audit Fields
  created_at: Date;
  updated_at: Date;
}

type UserRole =
  | 'Admin'
  | 'Sales Manager'
  | 'Sales Rep'
  | 'Read-Only';
```

#### Activity Log Table
```typescript
interface Activity {
  // Primary Key
  activity_id: number;               // BIGINT, PK (auto-increment)

  // Entity Reference (Polymorphic)
  entity_type: EntityType;           // ENUM
  entity_id: number;                 // FK → respective table (BIGINT)

  // Activity Details
  activity_type: ActivityType;       // ENUM
  activity_date: Date;               // REQUIRED
  user_id: number;                   // FK → Sales (Users), REQUIRED
  description?: string;

  // Audit
  created_at: Date;
}

type EntityType =
  | 'Opportunity'
  | 'Organization'
  | 'Contact';

type ActivityType =
  | 'Call'
  | 'Email'
  | 'Meeting'
  | 'Sample Delivered'
  | 'Demo'
  | 'Note'
  | 'Status Change'
  | 'Stage Change';
```

#### Tasks Table
```typescript
interface Task {
  // Primary Key
  task_id: number;                   // BIGINT, PK (auto-increment)

  // Task Details
  title: string;                     // REQUIRED, max 255 chars
  description?: string;              // TEXT, optional (max 500 chars in UI)

  // Scheduling
  due_date: Date;                    // REQUIRED
  priority: TaskPriority;            // ENUM, DEFAULT: 'medium'

  // Assignment
  sales_id: number;                  // FK → Sales (Users), task owner

  // Status
  completed: boolean;                // DEFAULT: false
  completed_at?: Date;               // Auto-set when completed = true

  // Related Entities (HubSpot Pattern - separate FKs for each entity type)
  // Task can be related to one of these entities (or none for standalone tasks)
  contact_id?: number;               // FK → Contacts (optional)
  opportunity_id?: number;           // FK → Opportunities (optional)
  organization_id?: number;          // FK → Organizations (optional)

  // Audit Fields
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;                 // Soft delete
}

type TaskPriority = 'low' | 'medium' | 'high';  // 3 levels

// Note: 'overdue' is computed in UI when completed = false AND due_date < today
// Implementation follows HubSpot/Pipedrive pattern for referential integrity
```

### 2.2 Entity Relationships

**Primary Relationships:**

```
Organizations 1:N Opportunities
Organizations 1:N Contacts
Organizations N:1 Organizations (distributor self-reference)
Organizations N:1 Users (Primary Account Manager)
Organizations N:1 Users (Secondary Account Manager)

Opportunities N:1 Organizations
Opportunities N:1 Products
Opportunities N:1 Users (Deal Owner)

Contacts N:1 Organizations
Contacts N:1 Users (Account Manager)

Activity Log N:1 Users
Activity Log N:1 [Opportunity|Organization|Contact] (Polymorphic)

Tasks N:1 Users (Assigned To)
Tasks N:1 Users (Created By)
Tasks N:1 [Opportunity|Organization|Contact] (Polymorphic, Optional)
```

**Calculated/Derived Fields:**

- `Opportunity.priority` → Inherited from `Organization.priority_level`
- `Opportunity.start_of_week` → Calculated from `start_date` (Monday of that week)
- `Organization.opportunity_count` → COUNT of related opportunities
- `Organization.latest_activity_date` → MAX `activity_date` from Activity Log

### 2.3 Data Validation Rules

#### Business Rules

**1. Opportunity Status Transitions:**
- Can move forward through stages sequentially (1→2→3...→8)
- Can change status independently (Open ↔ On Hold ↔ Closed)
- Setting status to `SOLD-7d` automatically sets stage to `SOLD-7`
- Closed opportunities must have `loss_reason` if stage ≠ `SOLD-7`

**2. Priority Inheritance:**
- Opportunity automatically inherits priority from Organization
- Cannot manually override opportunity priority
- System warns if creating opportunity for organization with no priority set

**3. Date Logic:**
- `expected_sold_date` must be >= `start_date`
- `start_of_week` auto-calculated as Monday of `start_date` week
- Warn if opportunity in stage 3+ and `start_date` > 90 days ago (stale opportunity)

**4. Volume & Probability:**
- `probability` must be between 0-1 (displayed as 0-100% in UI)
- `cases_per_week_volume` must be positive integer
- Validate that probability generally increases with stage progression

**5. Required Fields by Context:**

| Stage | Required Fields |
|-------|----------------|
| **Lead-discovery-1** | `organization_id`, `opportunity_name`, `start_date` |
| **SOLD-7** | Above + `product_id`, `cases_per_week_volume`, `expected_sold_date` |
| **Closed** | Above + `loss_reason` (if not SOLD) |

### 2.4 Data Flow Diagrams

#### New Opportunity Creation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ User Input                                                       │
│ (Organization, Opportunity Name, Product)                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Validate Organization │
          │ exists in database   │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Auto-populate Priority│
          │ from Organization    │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Set Default Values:  │
          │ - Status = "Open"    │
          │ - Stage = "Lead-1"   │
          │ - Deal Owner = User  │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Calculate            │
          │ start_of_week        │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Create Activity Log  │
          │ (type: "Created")    │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Save to Database     │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Send notification to │
          │ Deal Owner           │
          └──────────────────────┘
```

#### Opportunity Stage Progression

```
┌─────────────────────────────────────────────────────────────────┐
│ User updates Stage field                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Validate stage is    │
          │ valid next stage     │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Update stage +       │
          │ timestamp            │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Create Activity Log  │
          │ (type: "Stage Change"│
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ If stage = SOLD-7:   │
          │ Update status,       │
          │ require volume       │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Recalculate          │
          │ probability (if auto)│
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Trigger email to     │
          │ Account Manager      │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Update dashboard     │
          │ metrics              │
          └──────────────────────┘
```

---
