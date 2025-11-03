# PRODUCT REQUIREMENTS DOCUMENT
# Crispy-CRM: Food Distribution Sales Management Platform

**Version:** 1.1 MVP (Implementation-Aligned)
**Last Updated:** November 3, 2025
**Change:** Updated to reflect actual implementation decisions and architectural patterns  
**Document Owner:** Product Design & Engineering Team

---

## 1. EXECUTIVE SUMMARY

### Overview
Crispy-CRM is a modern web-based CRM system designed to replace Excel-based sales pipeline management for food distribution sales organizations. The platform tracks opportunities (deals/potential sales), organizations (restaurants, distributors, accounts), contacts (decision-makers), and manages a multi-stage sales pipeline from lead discovery through order fulfillment.

### Core Design Philosophy
Crispy-CRM prioritizes **clean, accessible, unified design** with a focus on:
- **Clarity**: Information is immediately understandable
- **Consistency**: Patterns are predictable and learnable through tokenized design systems
- **Hierarchy**: Visual importance matches information priority using elevation and contrast
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation and screen reader support
- **Performance**: Optimized for iPad-first, then desktop usage patterns

### Key Objectives
1. **Centralize Sales Data**: Unified platform for opportunities, accounts, and contacts
2. **Automate Workflows**: Reduce manual data entry and formula dependencies
3. **Improve Pipeline Visibility**: Real-time dashboards and reporting
4. **Enable Collaboration**: Multi-user access with role-based permissions
5. **Enhance Forecasting**: Volume and probability-based sales projections
6. **Tablet Accessibility**: Optimized for field sales rep access via iPad

### Success Metrics
- **User Adoption**: 100% sales team migration within 60 days
- **Data Accuracy**: <5% error rate in opportunity data
- **Time Savings**: 40% reduction in administrative tasks
- **Pipeline Velocity**: Track average days in each stage
- **Forecast Accuracy**: ±15% variance on quarterly volume projections
- **User Satisfaction**: 4/5 rating in post-implementation survey
- **Accessibility Score**: WCAG 2.1 AA compliance (minimum)
- **Performance**: <2s initial page load, <500ms interaction response

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

## 3. CORE FEATURES & FUNCTIONALITY (MVP)

### 3.1 User Management & Authentication

#### User Registration & Login

**Features:**
- Email-based authentication with password
- OAuth integration (Google, Microsoft) for SSO
- Password reset via email link
- Session management (30-day "remember me" option)
- Two-factor authentication (optional, admin-configurable)

**UI Requirements:**
- Clean, centered login form on brand background
- Clear error messages for failed authentication
- Password visibility toggle
- "Forgot password" link prominent
- OAuth buttons visually distinct from form submission

#### User Roles & Permissions

**Access Model: Shared Team Collaboration**

This CRM is designed for a **small collaborative team (2-10 people)** working together on a shared customer base. All authenticated users can view and edit all shared resources to enable teamwork and flexibility.

| Role | Organizations | Contacts | Opportunities | Products | Activities | Tasks |
|------|--------------|----------|---------------|----------|------------|-------|
| **Admin** | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full CRUD (all users) |
| **Sales Manager** | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full CRUD (all users) |
| **Sales Rep** | Full CRUD | Full CRUD | Full CRUD | Read | Full CRUD | Own tasks only |
| **Read-Only** | Read | Read | Read | Read | Read | Own tasks only |

**Access Control Rules:**

**Shared Resources** (Collaborative team access):
- **Organizations**: All authenticated users can view, create, edit, and delete
- **Contacts**: All authenticated users can view, create, edit, and delete
- **Opportunities**: All authenticated users can view, create, edit, and delete
- **Activities**: All authenticated users can view, create, edit, and delete
- **Products**: All authenticated users can view (Admins/Managers can edit)

**Personal Resources** (Creator-only access):
- **Tasks**: Users can only view, edit, and delete their own tasks
- Designed for individual task management within shared CRM environment

**Why Shared Access?**
- Enables team members to help each other (cover vacations, handle urgent requests)
- Allows managers to step in on any account when needed
- Simplifies training and reduces permission-related support issues
- Trust-based model suitable for small, collaborative sales teams

**Future Multi-Tenant Note:** If expanding to multiple companies/tenants, add `company_id` to isolate data between organizations.

### 3.2 Organizations Module

#### List View Features

**Layout:**
- Responsive table/card view (table on desktop/iPad landscape, cards on iPad portrait)
- Columns:
  - Organization Name (primary, bold, linked)
  - Priority (color-coded badge with semantic colors)
  - Segment
  - Primary Account Manager (avatar + name)
  - City, State
  - # Open Opportunities (linked, filtered view)
  - Last Activity Date (relative time: "2 days ago")

**Interactions:**
- Click row → Navigate to detail page
- Hover row → Highlight with subtle elevation change
- Sort by any column (click header)
- Multi-column sort (Shift+Click)

**Filtering:**
- Filter panel (collapsible sidebar on desktop, slide-over on tablet)
- Filters available:
  - **Priority** (multi-select checkboxes with color indicators: A, B, C, D)
  - **Segment** (multi-select dropdown with all segments in database - includes both default + custom)
  - **Account Manager** (searchable multi-select)
  - **State** (multi-select dropdown)
  - **Has Open Opportunities** (toggle: Yes/No/All)
  - **Weekly Priority** (toggle: Yes/No/All)
- Applied filters shown as removable chips above table
- "Clear all filters" button
- Filter presets: "My Accounts", "Priority A", "Weekly Priority"

**Search:**
- Search box above table (within module, not global)
- Searches: Organization Name, City
- Real-time filtering as user types
- Clear button (X) in search field

**Bulk Actions:**
- Select multiple rows via checkboxes
- Actions available:
  - Export to CSV
  - Assign Account Manager
  - Update Priority Level
  - Add to Weekly Priority
- Confirmation modal before applying bulk changes

**Quick Actions (per row):**
- View (eye icon) → Navigate to detail page
- Edit (pencil icon) → Open edit modal/slide-over
- Add Opportunity (plus icon) → Quick create opportunity modal
- Add Contact (user-plus icon) → Quick create contact modal

#### Detail View

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumb: Organizations > [Organization Name]             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Organization Summary Card                            │   │
│  │  [Priority Badge] Organization Name                  │   │
│  │  Segment Badge                                       │   │
│  │  ────────────────────────────────────────────────   │   │
│  │  📞 Phone  🔗 LinkedIn                               │   │
│  │  📍 Address (City, State ZIP)                        │   │
│  │  👤 Primary Manager    👤 Secondary Manager          │   │
│  │  ────────────────────────────────────────────────   │   │
│  │  📝 Notes (expandable)                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Opportunities] [Contacts] [Activity Feed] [Details] │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                       │   │
│  │  [Tab Content Area]                                  │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Edit Organization Button] [Action Menu ▼]                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Opportunities Tab:**
- Sortable table showing all opportunities for this organization
- Columns: Status Badge, Stage Badge, Opportunity Name (linked), Product, Volume, Deal Owner
- Filter by Status/Stage (within tab)
- "Create New Opportunity" button (prominent, primary action)
- Empty state: "No opportunities yet. Create your first opportunity to start tracking sales."

**Contacts Tab:**
- Card grid or list of all contacts
- Each contact card shows: Name, Position, Email (mailto), Phone (tel)
- Quick add contact (inline form or modal)
- Empty state: "No contacts yet. Add your first contact to connect with this organization."

**Activity Feed Tab:**
- Reverse chronological list of all activities related to this organization
- Each activity entry:
  - User avatar and name
  - Activity type icon (phone, email, meeting, etc.)
  - Timestamp (relative: "3 hours ago")
  - Description
  - Linked entities (opportunities, contacts mentioned)
- Filter by activity type (dropdown)
- Date range picker
- Pagination or infinite scroll

**Details Tab:**
- Full organization data in organized sections:
  - **Basic Information**: Name, Priority, Segment
  - **Distribution**: Distributor (if applicable), Distributor Rep Name
  - **Account Management**: Primary/Secondary Account Managers, Weekly Priority
  - **Contact Information**: Phone, LinkedIn, Full Address
  - **Notes**: Rich text field
  - **System Information** (read-only): Created by/date, Updated by/date
- Inline editing where applicable (click field to edit)
- Save/Cancel buttons appear when editing

#### Create/Edit Forms

**Form Structure:**
- Modal (on desktop) or slide-over panel (on tablet) for create/edit
- Sections with clear headers and visual separation:

**1. Basic Information**
- Organization Name* (text input, auto-trim whitespace)
- Priority Level* (radio buttons with color indicators: A, B, C, D)
- Segment* (flexible combo box: dropdown with suggestions + ability to type custom value)
  - **Suggested defaults:** Fine Dining, Casual, Gastropub, Ethnic, Pizza, Chain/Group, Distributor, Management Company, Catering
  - **Custom values allowed:** Users can type any segment name not in the default list
  - **Industry pattern:** Follows Salesforce/HubSpot standard for flexible classification fields

**2. Distribution** (collapsible section)
- Distributor (searchable dropdown of Organizations with Segment="Distributor")
- Distributor Rep Name (text input)

**3. Account Management**
- Primary Account Manager (searchable dropdown of Users with role Sales Rep/Manager)
- Secondary Account Manager (same as above)
- Weekly Priority (checkbox)

**4. Contact Information**
- Phone (text input with format validation: (XXX) XXX-XXXX or XXX-XXX-XXXX)
- LinkedIn URL (URL input with validation)
- Street Address (text input)
- City (text input)
- State (dropdown: IL, IN, OH, MI, KY, NY, etc.)
- ZIP Code (text input, 5-digit validation)

**5. Notes**
- Multi-line text area (auto-expanding)
- Character count indicator (if limit exists)

**Form Behavior:**
- Required fields marked with red asterisk (*)
- Real-time validation on blur (green checkmark or red error message)
- Unique name validation: "An organization with this name already exists. [View Organization]"
- Auto-save drafts every 30 seconds (indicator: "Draft saved at HH:MM")
- Confirm on cancel if unsaved changes: "You have unsaved changes. Discard changes?"
- Submit button disabled until all required fields valid
- Success toast: "Organization created successfully" with link to view
- Error handling: Display specific error messages near relevant fields

#### Import/Export

**CSV Import:**
- Import button in list view toolbar
- Upload CSV file (drag-and-drop or file picker)
- Column mapping interface:
  - Show preview of CSV (first 5 rows)
  - Map CSV columns to Organization fields via dropdowns
  - Detect headers automatically or allow "First row is header" toggle
- Validation report before commit:
  - Show errors (missing required fields, format errors, duplicates)
  - Show warnings (similar names, empty optional fields)
  - Allow user to fix errors or skip rows
- Import progress indicator
- Success summary: "Imported 45 of 50 organizations. 5 skipped due to errors. [View Error Report]"

**CSV Export:**
- Export button in list view toolbar
- Export respects current filters (option to export all or filtered)
- Filename format: `organizations_export_YYYY-MM-DD.csv`
- Columns: All Organization fields in logical order
- Download link or automatic download (browser-dependent)

**Template Download:**
- "Download CSV Template" link
- Provides empty CSV with correct column headers
- Includes sample row with example data and format notes

### 3.3 Contacts Module

#### List View Features

**Layout:**
- Responsive table (desktop/iPad landscape) or cards (iPad portrait)
- Columns:
  - Full Name (primary, bold, linked)
  - Organization (linked)
  - Position
  - Email (click to compose: mailto:)
  - Phone (tel: link for calling)
  - Account Manager

**Search:**
- Combined search field (within module)
- Searches: Name, Organization, Position, Email
- Real-time filtering

**Filtering:**
- Filter panel (collapsible sidebar or slide-over)
- Filters:
  - **Organization** (searchable multi-select)
  - **Position** (multi-select checkboxes)
  - **Account Manager** (searchable multi-select)
  - **Has Email** (toggle: Yes/No/All)
  - **Organization Priority** (inherit from org, multi-select)
- Applied filters as removable chips
- Filter presets: "My Contacts", "High Priority Orgs", "Missing Email"

**Sorting:**
- Sort by any column
- Default sort: Name (A-Z)

**Bulk Actions:**
- Select multiple contacts
- Actions:
  - Export to CSV
  - Export to vCard (for phone import)
  - Assign Account Manager
  - Send Bulk Email (future phase)

#### Detail View

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumb: Contacts > [Contact Name]                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Contact Card                                         │   │
│  │  Full Name                                           │   │
│  │  Position at [Organization] (linked) [Priority]      │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  ✉️ Email (mailto:)  📞 Phone (tel:)  🔗 LinkedIn   │   │
│  │  📍 Address                                          │   │
│  │  👤 Account Manager                                  │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  📝 Notes (expandable)                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Related Opportunities                                │   │
│  │  (Opportunities for this contact's organization)     │   │
│  │  [Mini table with Status, Stage, Product, Owner]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Activity Feed                                        │   │
│  │  (Activities tagged to this contact)                 │   │
│  │  [Reverse chronological list]                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Edit Contact Button] [Action Menu ▼]                      │
└─────────────────────────────────────────────────────────────┘
```

#### Create/Edit Forms

**Form Structure:**
- Modal or slide-over panel
- Sections:

**1. Basic Information**
- Full Name* (text input)
- Organization* (searchable dropdown with "Add New Organization" link)
- Position (dropdown with common values: Owner, Manager, Chef, etc. + "Other" with free text)

**2. Contact Methods**
- Email (email input with validation)
- Phone (text input with format validation)
- LinkedIn URL (URL input with validation)

**3. Address**
- Street Address (text input)
- City (text input)
- State (dropdown)
- ZIP Code (5-digit validation)

**4. Management**
- Account Manager (searchable dropdown of Users, defaults to organization's primary manager)

**5. Notes**
- Multi-line text area

**Form Behavior:**
- Required fields: Full Name, Organization
- Real-time validation
- Success toast: "Contact created successfully"
- Option to "Add Another Contact" after creation

### 3.4 Opportunities Module ⭐ PRINCIPAL TRACKING (MOST IMPORTANT FEATURE)

**Critical Business Need:** Track which Principal (brand/manufacturer) each opportunity is for. This is the #1 most important feature for reporting and pipeline management.

#### Pipeline View (Kanban Board)

**Visual Design:**
- Horizontal swim lanes for each stage (8 stages):
  1. **New Lead** (Lightest blue) - Initial lead discovery
  2. **Initial Outreach** - First contact attempt
  3. **Sample/Visit Offered** - Offered product sample or site visit
  4. **Awaiting Response** - Waiting for customer feedback
  5. **Feedback Logged** - Customer response received
  6. **Demo Scheduled** - Demo/cookup scheduled
  7. **Closed Won** (Green) - Deal won!
  8. **Closed Lost** (Red) - Deal lost

**Stage Columns:**
- Header: Stage name + count badge
- Example: "New Lead [12]"
- Color-coded background (subtle gradient)
- Scrollable horizontally on smaller screens

**Opportunity Cards:**
```
┌───────────────────────────────────────┐
│ [Priority Badge]  [Owner Avatar]      │
│                                        │
│ Customer Organization Name (primary)   │
│ 🏢 Principal: Brand Name ⭐ KEY       │
│ Opportunity Name                       │
│                                        │
│ 📅 Expected Close: Dec 15, 2025       │
│ 🏷️  Tags: urgent, big-deal            │
└───────────────────────────────────────┘
```

**Key Card Elements:**
- **Priority Badge**: Color-coded (low/medium/high/critical)
- **Principal Name**: ⭐ PROMINENT - this is what we track
- **Customer Organization**: Who the deal is with
- **Tags**: Quick visual categorization

**Interactions:**
- **Drag-and-drop** between stages:
  - Pick up card (click and hold or touch)
  - Visual feedback: Card lifts with shadow, column highlights when hovering
  - Drop in new column
  - Confirmation modal: "Move [Opp Name] from [Old Stage] to [New Stage]?"
    - Optional note field: "Add a note about this stage change"
    - [Cancel] [Confirm] buttons
  - Auto-creates activity log entry on confirm
- **Click card** → Navigate to opportunity detail page
- **Horizontal scroll** on iPad if stages overflow viewport

**Filtering (Critical for Principal Tracking):**
- Filter toolbar above board:
  - **Principal** ⭐ KEY FILTER (searchable multi-select) - Group deals by brand
  - **Status** (multi-select: active, closed, on_hold)
  - **Stage** (multi-select checkboxes)
  - **Priority** (multi-select with color badges: low, medium, high, critical)
  - **Opportunity Owner** (multi-select with avatars)
  - **Customer Organization** (searchable multi-select)
  - **Tags** (multi-select)
- Applied filters shown as chips
- "Clear all" button

**Sorting within Stage:**
- Sort dropdown per column:
  - By Expected Close Date (default)
  - By Priority (critical → low)
  - By Customer Organization Name (A-Z)
  - By Principal Name (A-Z) ⭐

#### List View (Table)

**Layout:**
- Comprehensive sortable/filterable table
- Columns:
  - **Priority** (color badge, sortable)
  - **Customer Organization** (linked)
  - **Principal** ⭐ (linked, bold) - MOST IMPORTANT COLUMN
  - **Opportunity Name** (linked)
  - **Status** (colored badge: active=Blue, closed=Gray, on_hold=Yellow)
  - **Stage** (badge with color gradient)
  - **Expected Close Date** (sortable, highlight if past due in red)
  - **Tags** (chips, clickable to filter)
  - **Next Action** (text snippet)
  - **Next Action Date** (sortable, highlight if overdue)
  - **Opportunity Owner** (avatar + name, sortable)
  - **Last Activity** (relative time: "2 days ago", sortable)
- Row hover: Subtle elevation and action icons appear (View, Edit)
- Click row → Navigate to detail page

**Advanced Filtering:**
- Comprehensive filter panel (collapsible sidebar)
- Filters available:
  - **Principal** ⭐ (searchable multi-select) - Filter by brand/manufacturer
  - **Status** (multi-select: active, closed, on_hold)
  - **Stage** (multi-select checkboxes for all 8 stages)
  - **Priority** (multi-select: low, medium, high, critical)
  - **Tags** (multi-select with type-ahead search)
  - **Opportunity Owner** (searchable multi-select)
  - **Customer Organization** (searchable multi-select)
  - **Lead Source** (multi-select: referral, trade_show, website, etc.)
  - **Date Ranges**:
    - Expected Close Date (date range picker)
    - Next Action Date (date range picker)
  - **Has Next Action** (toggle: Yes/No/All)
- Filter logic: AND between filter types, OR within multi-select
- Module-level search: Searches opportunity name, customer org name, principal name

**Saved Filter Views:**
- Preset views available to all users:
  - **"By Principal"** ⭐ (Group by principal, show all opportunities per brand)
  - "My Opportunities" (Current user is owner)
  - "Closing This Month" (Expected close within 30 days)
  - "High Priority" (Priority = high or critical)
  - "Needs Action" (Next action date overdue or today)
  - "Recent Wins" (Stage = closed_won, last 30 days)
- Admin can create system-wide views
- "Save current filters as view" button (future phase)

**Bulk Actions:**
- Select multiple opportunities via checkboxes
- Actions:
  - **Change Status** (bulk status update: active/on_hold/closed with confirmation)
  - **Change Stage** (bulk stage update with confirmation)
  - **Assign Owner** (reassign to another user)
  - **Add Tags** (add tags to selected opportunities)
  - **Export to CSV** (respects current filters, includes Principal column ⭐)
- Bulk action confirmation modal shows count and list of affected opportunities

#### Detail View

**Header Section:**
- **Breadcrumb**: Opportunities > [Customer Org] > [Opp Name]
- **Opportunity Name** (large, editable inline)
- **Badges**: [Status Badge] [Stage Badge] [Priority Badge]
- **Actions**: [Edit Button - Opens Modal] [Delete Button]

**Key Information Cards (3-Organization Tracking):**
```
┌──────────────────────────────────────────────────────┐
│ 🏢 Customer Organization: [Restaurant Name] (linked) │
│ ⭐ Principal: [Brand Name] (linked) MOST IMPORTANT   │
│ 📦 Distributor: [Distributor Name] (linked)          │
│ 👤 Opportunity Owner: [User Name] (avatar)           │
│ 📅 Expected Close: Dec 15, 2025 (30 days away)       │
│ 📊 Created: Nov 1, 2025 by Jane Doe                  │
└──────────────────────────────────────────────────────┘
```

**Workflow Management Section:**
- **Tags**: [urgent] [big-deal] [repeat-customer] (chips, clickable)
- **Next Action**: "Follow up call to discuss pricing" (editable inline)
- **Next Action Date**: Nov 10, 2025 (editable, highlights if overdue)
- **Decision Criteria**: "Price and delivery timeline are key factors" (expandable text area)

**Products Section:**
- Table of associated products (M:N relationship via junction table)
- Columns: Product Name, Principal, Notes
- "Add Product" button opens modal to associate more products

**Related Contacts:**
- Card grid of contacts from customer organization
- Quick actions: View, Call, Email (mailto:)

**Activity Timeline:**
- **Quick Add Activity** form at top:
  - Activity Type dropdown (Call, Email, Meeting, Note)
  - Date picker (defaults to today)
  - Description textarea
  - "Log Activity" button
- **Activity Feed** (reverse chronological):
  - User avatar, type icon, timestamp, description
  - "Load more" button if >20 activities

**Change Log Tab (Field-Level Audit Trail) ⭐ CRITICAL:**
- Shows complete history of ALL field changes (old value → new value)
- Format:
  ```
  Nov 3, 2025 2:30 PM - John Smith
    Priority: medium → high
    Stage: new_lead → initial_outreach

  Nov 1, 2025 10:15 AM - Jane Doe
    Created opportunity
  ```
- Filter by: Field name, User, Date range
- Export to CSV
- **Note:** This requires audit_trail table implementation (see ADR-0006)

#### Create/Edit Forms

**Form Approach: Modal Popup**
- Opens as centered modal overlay (per user preference for all forms)
- Single scrollable form (no wizard)
- Sections organized with clear headers

**Form Sections:**

**1. Organizations (3-org tracking) ⭐**
- **Customer Organization*** (searchable dropdown)
  - Who the deal is with (the restaurant/customer)
- **Principal Organization*** (searchable dropdown)
  - ⭐ MOST IMPORTANT: Which brand/manufacturer (Fishpeople, Ocean Hugger, etc.)
- **Distributor Organization** (searchable dropdown, optional)
  - Which distributor (if applicable)

**2. Opportunity Details**
- **Opportunity Name*** (text input, e.g., "Poke Supply Deal")
- **Description** (textarea, 3-4 rows)
- **Status** (dropdown: active [default], closed, on_hold)
- **Stage** (dropdown: new_lead [default], initial_outreach, sample_visit_offered, awaiting_response, feedback_logged, demo_scheduled, closed_won, closed_lost)
- **Priority** (radio buttons: low, medium [default], high, critical)

**3. Timeline**
- **Expected Close Date*** (date picker, defaults to today + 90 days)
- **Next Action Date** (date picker, optional)

**4. Workflow Management**
- **Tags** (multi-select with type-ahead, e.g., "urgent", "big-deal")
- **Next Action** (text input, e.g., "Follow up call to discuss pricing")
- **Decision Criteria** (textarea, 2-3 rows, e.g., "Price and delivery timeline")

**5. Ownership & Source**
- **Opportunity Owner*** (user dropdown, defaults to current user)
- **Account Manager** (user dropdown, optional)
- **Lead Source** (dropdown: referral, trade_show, website, cold_call, email_campaign, social_media, partner, existing_customer)

**6. Notes**
- **Notes** (textarea, 4-5 rows, rich text optional for MVP)

**Form Validation:**
- **Required Fields** (marked with *):
  - Customer Organization
  - Principal Organization ⭐
  - Opportunity Name
  - Expected Close Date
  - Opportunity Owner
- **Real-time validation** on blur (inline red error messages)
- **Form-level validation** on submit (scroll to first error)

**Form Actions:**
- **Save** button (primary, bottom right)
- **Cancel** button (secondary, bottom left)
- If unsaved changes on cancel: "Discard changes?" confirmation

**Success Handling:**
- Modal closes
- Toast notification: "Opportunity '[Name]' created successfully"
- Redirects to opportunity detail page OR returns to list (user preference)
- Option to remain on form for rapid entry: "Add another opportunity" button
- Default behavior: Redirect to opportunity detail page

#### Opportunity Actions

**Clone Opportunity:**
- Button in detail view action bar
- Opens create form pre-filled with:
  - Same organization, product, principal, source, deal owner
  - New opportunity name: "[Original Name] - Copy"
  - Reset: Start Date = Today, Status = Open, Stage = Lead-discovery-1
- Use case: Repeat business, similar deals with same customer

**Merge Opportunities:**
- Admin-only feature
- Use case: Duplicate opportunities detected
- Select 2+ opportunities → "Merge" action
- Merge modal:
  - Choose primary opportunity (keeps ID)
  - Select fields to keep from each opportunity
  - Combine notes and activities from all
  - Delete merged opportunities
- Confirmation: "This action cannot be undone. [Cancel] [Merge Opportunities]"

**Archive Opportunity:**
- Soft delete (sets deleted_at timestamp, active=false)
- Available in Action Menu (ellipsis icon)
- Confirmation: "Archive '[Opp Name]'? You can restore it later from archived opportunities. [Cancel] [Archive]"
- Archived opportunities visible in "Archived" filter view
- Restore action available for admins

### 3.5 Products Module

#### Product List View

**Layout:**
- Simple responsive table
- Columns:
  - **Product Name** (primary, linked to detail)
  - **Principal** (brand)
  - **Category**
  - **Active** (toggle switch, updates immediately)
  - **# Active Opportunities** (count, linked to filtered opportunity list)
- Sort by any column, default: Product Name (A-Z)

**Search:**
- Search box above table (within module)
- Searches: Product Name, Principal, Category
- Real-time filtering

**Filtering:**
- Filter toolbar:
  - **Active Status** (toggle: Active/Inactive/All)
  - **Principal** (multi-select dropdown)
  - **Category** (multi-select dropdown)
- Applied filters as chips

**Actions:**
- "Add Product" button (primary, top-right)
- Per-row actions (hover): Edit (pencil icon), View Usage (chart icon)

#### Product Detail View

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumb: Products > [Product Name]                       │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐    │
│  │ Product Information Card                            │    │
│  │  Product Name                                       │    │
│  │  Principal: [Brand Name]                            │    │
│  │  Category: [Category]                               │    │
│  │  Status: [Active/Inactive Toggle]                   │    │
│  │  ─────────────────────────────────────────────────│    │
│  │  Description:                                       │    │
│  │  [Product description text]                         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Related Opportunities                                │    │
│  │  [Table: All opportunities using this product]      │    │
│  │  Columns: Organization, Opp Name, Status, Stage,    │    │
│  │           Volume, Deal Owner                         │    │
│  │  Filter by: Status, Stage                            │    │
│  │  Sort by: Any column                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [Edit Product Button] [Action Menu ▼]                      │
└─────────────────────────────────────────────────────────────┘
```

**Actions:**
- **Edit Product**: Opens edit modal/form
- **Deactivate** (vs. Delete): Preserves historical data in opportunities
  - Confirmation: "Deactivate '[Product Name]'? It will no longer be available for new opportunities but existing opportunities will be preserved. [Cancel] [Deactivate]"
- **View Usage Report**: Shows metrics (future feature):
  - Total opportunities using this product
  - Win rate (SOLD-7 / Total)
  - Average volume
  - Average days to close

#### Create/Edit Form

**Form Structure:**
- Modal or slide-over panel
- Fields:

**1. Basic Information**
- Product Name* (text input, unique validation)
- Principal (Brand) (dropdown with common brands + "Other" for free text)
- Category (dropdown: Proteins, Fries, Condiments, Prepared Foods, Beverages, Equipment, Other)

**2. Description**
- Description (multi-line text area, optional)

**3. Status**
- Active (checkbox, default checked)

**Form Validation:**
- Required: Product Name
- Unique: Product Name (case-insensitive)
- Success toast: "Product '[Product Name]' created successfully"

#### Import/Export

**CSV Import:**
- "Import Products" button in list view toolbar
- Upload CSV with columns: Product Name, Principal, Category, Description
- Column mapping interface
- Validation: Check for duplicates, required fields
- Bulk import with error report

**CSV Export:**
- "Export Products" button
- Exports all products or filtered subset
- Filename: `products_export_YYYY-MM-DD.csv`

**Template Download:**
- "Download Template" link provides empty CSV with correct headers

#### Product Management

**Deactivate vs. Delete:**
- **Deactivate** (preferred): Sets active=false
  - Product no longer appears in opportunity product dropdown
  - Existing opportunities retain the product reference
  - Can be reactivated later
  - Use case: Seasonal products, discontinued items
- **Delete** (admin-only, discouraged): Permanently removes product
  - Only allowed if no opportunities reference this product
  - Confirmation: "Delete '[Product Name]'? This action cannot be undone. [Cancel] [Delete]"

**Bulk Operations:**
- Select multiple products → "Activate" or "Deactivate" (bulk toggle)

### 3.6 Tasks Widget (Dashboard Component)

**Purpose:** Lightweight task tracking for follow-ups and reminders, integrated into the main dashboard for quick access.

**Implementation Approach:** Dashboard-only widget following minimal design pattern. No standalone module or dedicated pages.

#### Dashboard Tasks Widget

**Location:** Main Dashboard page (not a separate module)

**Widget Layout:**
```
┌─────────────────────────────────────────────┐
│ My Tasks                              [Add] │
├─────────────────────────────────────────────┤
│ □ Call Restaurant ABC           Due Today   │
│ □ Follow up on quote           Due Tomorrow │
│ ☑ Send pricing sheet              Complete  │
│ □ Schedule demo               Due Next Week │
├─────────────────────────────────────────────┤
│              View All Tasks (5)             │
└─────────────────────────────────────────────┘
```

**Features:**
- Shows user's incomplete tasks sorted by due date
- Quick checkbox to mark tasks complete
- Inline editing on click
- "Add Task" button opens modal
- Shows max 5 tasks, with "View All" expanding inline

#### Quick Add Task Modal

**Form Fields (Simplified):**
- **Title*** (text input, required)
- **Due Date*** (date picker, defaults to +3 days)
- **Priority** (select: High/Medium/Low, default Medium)
- **Related To** (optional):
  - Contact (searchable dropdown)
  - Opportunity (searchable dropdown)
  - Organization (searchable dropdown)
- **Description** (textarea, optional)

**Note:** Tasks are automatically assigned to current user. No complex assignment or delegation features.

#### Implementation Notes

**Dashboard Integration:**
- Tasks widget is part of main Dashboard component
- No separate Tasks module or resource registration
- Simple CRUD operations through dashboard interface
- No email notifications (decision: users check tasks when logged in)
- Uses HubSpot pattern with separate FKs for database integrity

### 3.7 Reports (MVP - Basic Only)

**Note:** Analytics dashboards and advanced reporting are NOT in MVP scope. Focus is on data entry and basic list exports.

#### Reports Included in MVP

**1. Opportunities by Principal Report ⭐ MOST IMPORTANT**

**Purpose:** See all opportunities grouped by which brand/manufacturer (Principal) they're for.

**Access:** Reports > Opportunities by Principal

**Features:**
- Grouped list view: Principal as header, opportunities nested underneath
- Show per Principal:
  - Count of opportunities (active vs closed)
  - List of opportunities with: Customer Org, Stage, Status, Expected Close Date, Owner
- Filters:
  - Status (active, closed, on_hold)
  - Stage (all 8 stages)
  - Date range (Expected Close Date)
  - Owner
- Sort options:
  - By Principal name (A-Z)
  - By opportunity count (most to least)
  - By expected close date (soonest first)
- Export: CSV with columns [Principal, Customer Org, Opportunity Name, Stage, Status, Expected Close, Owner]

**Example Output:**
```
Principal: Fishpeople Seafood (5 opportunities)
  - Restaurant A | Sample Visit Offered | Active | Dec 1, 2025 | John
  - Restaurant B | New Lead | Active | Dec 15, 2025 | Jane
  ...

Principal: Ocean Hugger Foods (3 opportunities)
  - Restaurant C | Demo Scheduled | Active | Nov 20, 2025 | John
  ...
```

---

**2. Weekly Activity Summary Report**

**Purpose:** See what each user did this week (calls, meetings, emails logged).

**Access:** Reports > Weekly Activity Summary

**Features:**
- Grouped by user (sales rep), shows activities for selected week
- Show per user:
  - Activity count breakdown (# calls, # emails, # meetings, # notes)
  - List of activities with: Type, Date, Description (truncated), Related Entity
- Filters:
  - Date range picker (defaults to current week: Mon-Sun)
  - User multi-select (default: all users)
  - Activity type (call, email, meeting, note)
- Sort: By date (newest first) within each user
- Export: CSV with columns [User, Date, Activity Type, Description, Related Entity]

**Example Output:**
```
John Smith (18 activities this week)
  Calls: 8 | Emails: 5 | Meetings: 3 | Notes: 2

  Nov 3 - Call - Spoke with chef at Restaurant A about pricing
  Nov 3 - Email - Sent follow-up to Restaurant B
  Nov 2 - Meeting - Demo at Restaurant C
  ...

Jane Doe (15 activities this week)
  Calls: 6 | Emails: 7 | Meetings: 2 | Notes: 0
  ...
```

---

**3. Filtered List Exports (All Modules)**

**Purpose:** Export any filtered/searched list to CSV for offline analysis.

**Access:** Any list view (Organizations, Contacts, Opportunities, Products) has "Export to CSV" button

**Features:**
- Button in list view toolbar (top right)
- Respects current filters and search
- Exports visible columns only
- File format: `{module}_export_{date}.csv`

**Examples:**
- Organizations filtered by "Priority A" → `organizations_export_2025-11-03.csv`
- Opportunities filtered by "Principal = Fishpeople" → `opportunities_export_2025-11-03.csv`

---

**Future Phase (Not MVP):**
- Analytics dashboard with charts
- Forecasting based on probability/volume
- Saved report configurations
- Scheduled email delivery of reports
- Custom report builder

---

### 3.8 Activity Tracking

#### Activity Types & Icons

| Activity Type | Icon | Color | Auto-Generated |
|--------------|------|-------|----------------|
| **Call** | 📞 Phone | Blue | No (Manual) |
| **Email** | ✉️ Envelope | Teal | No (Manual) |
| **Meeting** | 📅 Calendar | Purple | No (Manual) |
| **Sample Delivered** | 📦 Box | Orange | No (Manual) |
| **Demo/Cookup** | 👨‍🍳 Chef Hat | Red | No (Manual) |
| **Note** | 📝 Note | Gray | No (Manual) |
| **Status Change** | ➡️ Arrow | Green | Yes (Auto) |
| **Stage Change** | 📶 Ladder | Yellow | Yes (Auto) |

#### Quick Log Activity (Basic Structured Logging)

**Access Points:**
- Opportunity detail page (inline form at top of Activity Timeline)
- Organization detail page (Activity Feed tab)
- Contact detail page (Activity Feed section)

**Form Fields (Simple):**
- **Activity Type*** (dropdown with icons)
  - Call, Email, Meeting, Note
- **Date*** (date picker, default: today)
- **Description*** (textarea, 500 char limit)
  - Placeholder: "What happened? (e.g., 'Called chef about pricing, will follow up next week')"

**Note:** Activity is automatically linked to the entity (opportunity/organization/contact) where the form is opened.

**Submit:**
- **Log Activity** button (primary)
- Form clears after submission, ready for next entry

**Success Feedback:**
- Toast notification: "Activity logged"
- Activity immediately appears at top of activity feed (reverse chronological)

#### Activity Feed Display

**Layout:**
- Reverse chronological list (newest first)
- Each activity entry:

```
┌────────────────────────────────────────────────────┐
│ [Avatar] John Doe  📞 Call                         │
│ 2 hours ago                                        │
│ ──────────────────────────────────────────────────│
│ Called Ballyhoo - spoke with Chef Mike. Discussed │
│ poke pricing. He's interested but needs to check  │
│ with owner. Follow-up scheduled for Friday.        │
│ ──────────────────────────────────────────────────│
│ Related: Ballyhoo Poke Deal (Opportunity)          │
│ Participants: Mike Johnson (Chef)                  │
│ Outcome: Interested - Follow-up needed             │
│                                         [Edit] [⋯] │
└────────────────────────────────────────────────────┘
```

**Interaction:**
- **Click activity** → Expand for full description (if truncated)
- **Hover** → Show edit/delete actions (if user created activity)
- **Click related entity link** → Navigate to that entity's detail page
- **Click participant** → Navigate to contact detail page

**Filtering:**
- Filter dropdown above feed:
  - **Activity Type** (multi-select with icons: Call, Email, Meeting, etc.)
  - **User** (multi-select: All, Me, Specific users)
  - **Date Range** (presets: Today, This Week, This Month, Custom)
- Applied filters shown as chips
- "Clear filters" button

**Search within Activities:**
- Search box above feed
- Searches: Description, Participant names, Related entity names
- Real-time filtering

**Pagination:**
- **Option 1**: "Load More" button (loads next 20 activities)
- **Option 2**: Infinite scroll (auto-loads on scroll to bottom)
- Performance: Lazy load, virtualize long lists (react-window or similar)

**Export:**
- "Export Activity Feed" button
- Exports to CSV with columns: Date, Time, User, Type, Description, Related Entity, Outcome
- Respects current filters

#### Automated Activity Logging

**System Automatically Creates Activities For:**

1. **Opportunity Stage Changes**
   - Type: "Stage Change"
   - Description: "Stage changed from [Old Stage] to [New Stage] by [User]"
   - Optional user note appended if provided during drag-and-drop

2. **Opportunity Status Changes**
   - Type: "Status Change"
   - Description: "Status changed from [Old Status] to [New Status] by [User]"

3. **Organization Priority Changes**
   - Type: "Note" (system-generated)
   - Description: "Priority updated from [Old] to [New] by [User]"

4. **Assignment Changes**
   - Type: "Note"
   - Description: "Deal Owner changed from [Old User] to [New User] by [Admin]"
   - Description: "Account Manager changed from [Old User] to [New User]"

5. **Opportunity Conversion**
   - Type: "Note"
   - Description: "Opportunity converted to Order by [User]. Volume: [X] cases/week"

**Automated Activity Appearance:**
- Different styling: Lighter background, system icon (gear/cog)
- Cannot be edited or deleted
- Labeled: "System Activity" badge

---

### 3.9 Search & Filtering

#### Search Strategy (MVP)

**Module-Level Search (Not Global):**
- Each module (Organizations, Contacts, Opportunities, Products) has its own search
- Search box located in module toolbar (above list view)
- Searches only within current module

**Search Behavior:**
- **Real-time filtering** as user types (debounced 300ms)
- **Minimum 2 characters** before search activates
- **Searchable fields** per module:
  - **Organizations**: Name, City
  - **Contacts**: Full Name, Organization Name, Position, Email
  - **Opportunities**: Opportunity Name, Customer Organization Name, Principal ⭐ (MOST IMPORTANT), Product Name
  - **Products**: Product Name, Principal, Category
- **Case-insensitive** search
- **Partial matching** (substring search)
- **Clear button** (X icon) to reset search

**Search Results:**
- Table/card list filters in real-time
- Results count displayed: "23 results for 'Ballyhoo'"
- No results state: "No [entities] found matching 'XYZ'. Try different keywords or [Clear Search]"

#### Advanced Filtering

**Filter Panel:**
- **Location**: Collapsible sidebar (desktop/iPad landscape) or slide-over drawer (iPad portrait)
- **Toggle**: "Filters" button with badge showing active filter count
- **Structure**: Grouped by filter category with headers

**Filter Types:**

1. **Multi-Select (Checkboxes)**
   - Example: Priority, Segment, Status, Stage
   - Show count of available options: "Priority (5)"
   - Select All / Deselect All options
   - Search within filter (if >10 options)

2. **Single-Select (Radio Buttons)**
   - Example: Has Email (Yes/No/All)
   - Typically 2-5 mutually exclusive options

3. **Searchable Multi-Select (Dropdown)**
   - Example: Organization, Account Manager, Product
   - Type-ahead search within dropdown
   - Show selected count: "3 organizations selected"
   - Selected items shown as chips in dropdown header

4. **Date Range Picker**
   - Example: Expected Close Date, Next Action Date, Last Activity Date
   - Presets: Today, This Week, This Month, This Quarter, Custom
   - Custom: Two date inputs (From / To)

**Filter Application:**
- Filters apply immediately (no "Apply" button needed)
- Real-time list updates as filters change
- Applied filters shown as chips above list
- Each chip has X button to remove individual filter
- "Clear all filters" button removes all at once

**Filter Presets (Saved Views):**
- Pre-configured filter combinations
- System presets (available to all):
  - "My Open Opportunities"
  - "High Priority Accounts"
  - "Closing This Month"
  - "Weekly Priority"
  - "Recent Wins"
- User-created presets (MVP: Admin can create, all can use)
- Preset dropdown in toolbar
- "Save current filters as preset" button (admin-only in MVP)

---

## 4. USER INTERFACE REQUIREMENTS

### 4.1 Design System Foundation

#### Technology Stack

**Framework & Styling:**
- **React 18+** with TypeScript
- **Tailwind CSS** with semantic CSS variables
- **OKLCH color model** for light/dark theme support
- **Tokenized design system**: All spacing, shadows, borders, and radii defined as reusable tokens

**Key Design Principles:**
1. **Clarity**: Information is immediately understandable
2. **Consistency**: Patterns are predictable through tokenized systems
3. **Hierarchy**: Visual importance matches information priority using elevation and contrast
4. **Accessibility**: WCAG 2.1 AA compliance minimum
5. **Performance**: Optimized for iPad-first, then desktop

#### Color System (OKLCH-Based)

**Semantic Color Variables:**

```css
/* Primary Brand Colors */
--color-primary-50: oklch(0.95 0.02 210);   /* Lightest teal */
--color-primary-100: oklch(0.90 0.04 210);
--color-primary-200: oklch(0.80 0.08 210);
--color-primary-300: oklch(0.70 0.12 210);
--color-primary-400: oklch(0.60 0.16 210);
--color-primary-500: oklch(0.45 0.18 210);  /* Base: Dark teal (#215967) */
--color-primary-600: oklch(0.35 0.16 210);
--color-primary-700: oklch(0.25 0.14 210);
--color-primary-800: oklch(0.15 0.12 210);
--color-primary-900: oklch(0.10 0.10 210);  /* Darkest teal */

/* Neutral Colors (UI backgrounds, borders, text) */
--color-neutral-50: oklch(0.98 0 0);        /* Almost white */
--color-neutral-100: oklch(0.95 0 0);       /* Light gray */
--color-neutral-200: oklch(0.90 0 0);
--color-neutral-300: oklch(0.80 0 0);
--color-neutral-400: oklch(0.65 0 0);
--color-neutral-500: oklch(0.50 0 0);       /* Mid gray */
--color-neutral-600: oklch(0.40 0 0);
--color-neutral-700: oklch(0.30 0 0);
--color-neutral-800: oklch(0.20 0 0);
--color-neutral-900: oklch(0.10 0 0);       /* Near black */

/* Priority Colors (Organizations & Opportunities) */
/* Note: System uses 4 priority levels (A, B, C, D). No A+ level. */
--color-priority-aplus: oklch(0.35 0.15 145);   /* Dark green (deprecated, not used) */
--color-priority-a: oklch(0.50 0.15 145);       /* Green - Highest priority */
--color-priority-b: oklch(0.75 0.15 90);        /* Yellow/Gold */
--color-priority-c: oklch(0.65 0.15 45);        /* Orange */
--color-priority-d: oklch(0.55 0.15 20);        /* Red - Lowest priority */
--color-priority-none: oklch(0.60 0 0);         /* Gray */

/* Status Colors */
--color-status-open: oklch(0.60 0.15 240);      /* Blue */
--color-status-sold: oklch(0.50 0.15 145);      /* Green */
--color-status-closed: oklch(0.60 0 0);         /* Gray */
--color-status-hold: oklch(0.75 0.15 90);       /* Yellow */

/* Semantic Colors */
--color-success: oklch(0.50 0.15 145);          /* Green */
--color-error: oklch(0.55 0.18 20);             /* Red */
--color-warning: oklch(0.70 0.15 75);           /* Amber */
--color-info: oklch(0.60 0.15 240);             /* Blue */

/* Surface Colors (Elevation System) */
--color-surface-base: oklch(0.98 0 0);          /* Page background */
--color-surface-raised: oklch(1.0 0 0);         /* Card/panel background */
--color-surface-overlay: oklch(1.0 0 0);        /* Modal/dropdown background */
```

**Tailwind Configuration:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          // ... 200-900
        },
        neutral: {
          50: 'var(--color-neutral-50)',
          // ... 100-900
        },
        priority: {
          'aplus': 'var(--color-priority-aplus)',  // Deprecated: not used in 4-level system (A,B,C,D)
          'a': 'var(--color-priority-a)',
          'b': 'var(--color-priority-b)',
          'c': 'var(--color-priority-c)',
          'd': 'var(--color-priority-d)',
          'none': 'var(--color-priority-none)',
        },
        status: {
          open: 'var(--color-status-open)',
          sold: 'var(--color-status-sold)',
          closed: 'var(--color-status-closed)',
          hold: 'var(--color-status-hold)',
        }
      }
    }
  }
}
```

**Usage in React:**
```tsx
// Priority badge component
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-priority-a text-white">
  A
</span>

// Status badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-open text-white">
  Open
</span>
```

#### Typography Scale

**Font Family:**
- Primary: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`
- Monospace (for data): `'JetBrains Mono', 'SF Mono', Consolas, monospace`

**Type Scale (Tailwind):**
```javascript
fontSize: {
  'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
  'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
  'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px (body)
  'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
  'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px (H3)
  '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px (H2)
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px (H1)
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
}
```

**Font Weights:**
- Normal: 400 (body text)
- Medium: 500 (emphasized text, labels)
- Semibold: 600 (headings, buttons)
- Bold: 700 (primary headings)

**Usage Guidelines:**
- **Body text**: `text-base font-normal text-neutral-700`
- **Headings**: `text-2xl font-semibold text-neutral-900`
- **Labels**: `text-sm font-medium text-neutral-600`
- **Data fields**: `text-base font-mono text-neutral-800`

#### Spacing Scale (4px Base Unit)

```javascript
spacing: {
  '0': '0',
  'px': '1px',
  '0.5': '0.125rem',  // 2px
  '1': '0.25rem',     // 4px
  '2': '0.5rem',      // 8px
  '3': '0.75rem',     // 12px
  '4': '1rem',        // 16px
  '5': '1.25rem',     // 20px
  '6': '1.5rem',      // 24px
  '8': '2rem',        // 32px
  '10': '2.5rem',     // 40px
  '12': '3rem',       // 48px
  '16': '4rem',       // 64px
  '20': '5rem',       // 80px
  '24': '6rem',       // 96px
}
```

**Spacing Guidelines:**
- Component internal padding: `p-4` (16px)
- Card padding: `p-6` (24px)
- Section margins: `mb-6` or `mb-8`
- Button padding: `px-4 py-2` (16px horizontal, 8px vertical)
- Input padding: `px-3 py-2` (12px horizontal, 8px vertical)

#### Elevation System (Layered Shadows)

**Shadow Tokens:**
```css
/* Tailwind shadow configuration */
boxShadow: {
  'none': 'none',
  'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'DEFAULT': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'md': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  'lg': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  'xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
}
```

**Elevation Hierarchy:**
- **Level 0** (Base): Page background, no shadow
- **Level 1** (Surface): Cards, panels (`shadow-sm`)
- **Level 2** (Raised): Hover states, selected items (`shadow-md`)
- **Level 3** (Overlay): Modals, dropdowns, tooltips (`shadow-lg`)
- **Level 4** (Highest): Toasts, notifications (`shadow-xl`)

**Usage:**
```tsx
// Card
<div className="bg-surface-raised shadow-sm rounded-lg p-6">
  {/* Card content */}
</div>

// Hover state
<div className="bg-surface-raised shadow-sm hover:shadow-md transition-shadow duration-200">
  {/* Interactive card */}
</div>

// Modal
<div className="bg-surface-overlay shadow-lg rounded-lg p-8">
  {/* Modal content */}
</div>
```

#### Border Radius System

```javascript
borderRadius: {
  'none': '0',
  'sm': '0.125rem',   // 2px (tight elements)
  'DEFAULT': '0.25rem', // 4px (most UI elements)
  'md': '0.375rem',   // 6px (cards)
  'lg': '0.5rem',     // 8px (large cards, modals)
  'xl': '0.75rem',    // 12px (feature elements)
  '2xl': '1rem',      // 16px (hero elements)
  'full': '9999px',   // Full circle (avatars, badges)
}
```

**Usage Guidelines:**
- Buttons: `rounded` (4px)
- Inputs: `rounded` (4px)
- Cards: `rounded-lg` (8px)
- Modals: `rounded-lg` (8px)
- Badges: `rounded-full` (full circle)
- Avatars: `rounded-full`

#### Motion & Transitions

**Transition Tokens:**
```javascript
transitionDuration: {
  '75': '75ms',
  '100': '100ms',
  '150': '150ms',
  '200': '200ms',   // Default for most UI
  '300': '300ms',
  '500': '500ms',
  '700': '700ms',
  '1000': '1000ms',
}

transitionTimingFunction: {
  'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',  // Default
}
```

**Animation Guidelines:**
- **NEVER use `transition-all`**: Specify exact properties
- **Hover states**: `transition-shadow duration-200` or `transition-colors duration-200`
- **Modal enter/exit**: `transition-opacity duration-300`
- **Drawer slide**: `transition-transform duration-300`
- **Subtle interactions**: 150-200ms
- **Panel animations**: 300ms
- **Large movements**: 500ms (max)

**Usage:**
```tsx
// Button hover
<button className="bg-primary-500 hover:bg-primary-600 transition-colors duration-200">
  Save
</button>

// Card hover elevation
<div className="shadow-sm hover:shadow-md transition-shadow duration-200">
  {/* Card content */}
</div>

// Modal fade-in
<div className="opacity-0 transition-opacity duration-300 data-[enter]:opacity-100">
  {/* Modal content */}
</div>
```

### 4.2 Component Library Specifications

#### Buttons

**Variants:**

```tsx
// Primary button (main actions)
<button className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200">
  Create Opportunity
</button>

// Secondary button (alternative actions)
<button className="inline-flex items-center justify-center px-4 py-2 border border-neutral-300 rounded text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200">
  Cancel
</button>

// Destructive button (delete, remove actions)
<button className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded text-sm font-medium text-white bg-error hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error transition-colors duration-200">
  Delete
</button>

// Ghost button (tertiary, minimal)
<button className="inline-flex items-center justify-center px-4 py-2 rounded text-sm font-medium text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200">
  View Details
</button>
```

**Sizes:**
- Small: `px-3 py-1.5 text-xs`
- Medium (default): `px-4 py-2 text-sm`
- Large: `px-6 py-3 text-base`

**States:**
- Disabled: `opacity-50 cursor-not-allowed pointer-events-none`
- Loading: Show spinner icon, disable interactions

#### Form Inputs

**Text Input:**
```tsx
<div className="space-y-1">
  <label htmlFor="org-name" className="block text-sm font-medium text-neutral-700">
    Organization Name <span className="text-error">*</span>
  </label>
  <input
    type="text"
    id="org-name"
    className="block w-full px-3 py-2 border border-neutral-300 rounded text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow duration-200"
    placeholder="Enter organization name"
  />
  <p className="text-xs text-neutral-500">Helper text goes here</p>
</div>

// Error state
<input
  type="text"
  className="block w-full px-3 py-2 border border-error rounded text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent"
/>
<p className="text-xs text-error mt-1">This field is required</p>

// Success state
<input
  type="text"
  className="block w-full px-3 py-2 border border-success rounded text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-success focus:border-transparent"
/>
<p className="text-xs text-success mt-1">✓ Looks good</p>
```

**Dropdown/Select:**
```tsx
<div className="space-y-1">
  <label htmlFor="priority" className="block text-sm font-medium text-neutral-700">
    Priority
  </label>
  <select
    id="priority"
    className="block w-full px-3 py-2 border border-neutral-300 rounded text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow duration-200"
  >
    <option value="">Select priority...</option>
    <option value="A">A</option>
    <option value="B">B</option>
    <option value="C">C</option>
    <option value="D">D</option>
  </select>
</div>
```

**Searchable Dropdown (Combobox):**
- Use library: Headless UI Combobox or Radix UI Select
- Styling matches input above
- Type-ahead filtering
- Keyboard navigation (arrow keys, Enter to select)

**Checkbox:**
```tsx
<div className="flex items-center">
  <input
    type="checkbox"
    id="weekly-priority"
    className="h-4 w-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500 transition-colors duration-200"
  />
  <label htmlFor="weekly-priority" className="ml-2 text-sm text-neutral-700">
    Weekly Priority
  </label>
</div>
```

**Radio Buttons:**
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-neutral-700">Priority</label>
  <div className="space-y-1">
    <div className="flex items-center">
      <input type="radio" id="priority-a" name="priority" value="A" className="h-4 w-4 text-primary-500 border-neutral-300 focus:ring-primary-500" />
      <label htmlFor="priority-a" className="ml-2 text-sm text-neutral-700">A</label>
    </div>
    <div className="flex items-center">
      <input type="radio" id="priority-b" name="priority" value="B" className="h-4 w-4 text-primary-500 border-neutral-300 focus:ring-primary-500" />
      <label htmlFor="priority-b" className="ml-2 text-sm text-neutral-700">B</label>
    </div>
  </div>
</div>
```

**Textarea:**
```tsx
<div className="space-y-1">
  <label htmlFor="notes" className="block text-sm font-medium text-neutral-700">
    Notes
  </label>
  <textarea
    id="notes"
    rows={4}
    className="block w-full px-3 py-2 border border-neutral-300 rounded text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow duration-200"
    placeholder="Add any additional notes..."
  />
  <p className="text-xs text-neutral-500">500 characters remaining</p>
</div>
```

#### Badges

**Priority Badges:**
```tsx
// A Priority (Highest)
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-priority-a text-white">
  A
</span>

// Status badges
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-open text-white">
  Open
</span>

<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-sold text-white">
  SOLD
</span>
```

**Stage Badges:**
```tsx
<span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-700">
  Stage 3
</span>
```

#### Cards

```tsx
// Standard card
<div className="bg-surface-raised shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Card Title</h3>
  <p className="text-sm text-neutral-600">Card content goes here...</p>
</div>

// Interactive card (clickable)
<div className="bg-surface-raised shadow-sm rounded-lg p-6 cursor-pointer hover:shadow-md hover:border-primary-300 transition-all duration-200 border border-transparent">
  {/* Card content */}
</div>
```

#### Modals

```tsx
// Modal overlay (using Headless UI Dialog)
<Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300" />

// Modal panel
<Dialog.Panel className="fixed inset-y-0 right-0 w-full max-w-md bg-surface-overlay shadow-xl transition-transform duration-300">
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="px-6 py-4 border-b border-neutral-200">
      <Dialog.Title className="text-xl font-semibold text-neutral-900">
        Create Organization
      </Dialog.Title>
    </div>
    
    {/* Body (scrollable) */}
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {/* Form content */}
    </div>
    
    {/* Footer */}
    <div className="px-6 py-4 border-t border-neutral-200 flex justify-end space-x-3">
      <button className="secondary-button">Cancel</button>
      <button className="primary-button">Create</button>
    </div>
  </div>
</Dialog.Panel>
```

#### Tables

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-neutral-200">
    <thead className="bg-neutral-50">
      <tr>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Organization
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Priority
        </th>
        {/* More headers */}
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-neutral-200">
      <tr className="hover:bg-neutral-50 transition-colors duration-150">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
          Ballyhoo Hospitality
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="badge badge-priority-a">A</span>
        </td>
        {/* More cells */}
      </tr>
    </tbody>
  </table>
</div>
```

### 4.3 Layout & Navigation Structure

#### Page Layout Template

```tsx
<div className="flex h-screen overflow-hidden">
  {/* Sidebar (collapsible on tablet) */}
  <aside className="w-64 bg-surface-raised border-r border-neutral-200">
    {/* Sidebar content */}
  </aside>
  
  {/* Main content area */}
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Top navigation bar */}
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
      {/* Nav content */}
    </header>
    
    {/* Page content (scrollable) */}
    <main className="flex-1 overflow-y-auto bg-surface-base">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-neutral-500">
            <li><a href="#" className="hover:text-primary-600">Organizations</a></li>
            <li>/</li>
            <li className="text-neutral-900">Ballyhoo Hospitality</li>
          </ol>
        </nav>
        
        {/* Page title & actions */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-neutral-900">Ballyhoo Hospitality</h1>
          <div className="flex space-x-3">
            <button className="secondary-button">Edit</button>
            <button className="primary-button">Add Opportunity</button>
          </div>
        </div>
        
        {/* Page content */}
        <div>
          {/* Content goes here */}
        </div>
      </div>
    </main>
  </div>
</div>
```

### 4.4 Responsive Design (iPad-First, Then Desktop)

#### Breakpoints

```javascript
screens: {
  'sm': '640px',   // Small tablets
  'md': '768px',   // iPad portrait (PRIMARY TARGET)
  'lg': '1024px',  // iPad landscape, small laptops
  'xl': '1280px',  // Desktop
  '2xl': '1536px', // Large desktop
}
```

#### iPad-First Approach

**Core Strategy:**
1. Design base styles for iPad portrait (768px-1023px)
2. Adapt down for smaller screens (640px-767px) if needed
3. Enhance up for desktop (1024px+)

**Layout Adaptations:**

```tsx
// Sidebar: Hidden on iPad portrait, visible on landscape/desktop
<aside className="hidden lg:block w-64">
  {/* Sidebar */}
</aside>

// Hamburger menu: Visible on iPad portrait, hidden on desktop
<button className="lg:hidden">
  <MenuIcon />
</button>

// Table to cards: Table on desktop, cards on iPad portrait
<div className="hidden lg:block">
  <Table /> {/* Desktop: Full table */}
</div>
<div className="lg:hidden">
  <CardGrid /> {/* iPad portrait: Card grid */}
</div>

// Grid columns: Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* Cards */}
</div>
```

**Touch Targets (iPad):**
- Minimum touch target: 44x44px (Apple HIG)
- Buttons: `min-h-[44px] min-w-[44px]`
- Interactive elements: Adequate spacing to prevent accidental taps

**Gestures:**
- Swipe to delete: Use library (react-swipeable)
- Pull to refresh: Use library (react-pull-to-refresh)
- Pinch to zoom: For charts/images (react-pinch-zoom-pan)

**Typography Scaling:**
```tsx
// Headings scale down slightly on tablet
<h1 className="text-2xl md:text-3xl font-bold">Page Title</h1>
<h2 className="text-xl md:text-2xl font-semibold">Section Title</h2>
```

#### Kanban Board Responsiveness

```tsx
// Desktop: Full horizontal board
<div className="hidden lg:flex space-x-4 overflow-x-auto">
  {stages.map(stage => (
    <div key={stage.id} className="flex-shrink-0 w-80">
      {/* Stage column */}
    </div>
  ))}
</div>

// iPad: Scrollable horizontal board with smaller cards
<div className="lg:hidden flex space-x-3 overflow-x-auto pb-4">
  {stages.map(stage => (
    <div key={stage.id} className="flex-shrink-0 w-64">
      {/* Smaller stage column */}
    </div>
  ))}
</div>
```

### 4.5 Accessibility Requirements (WCAG 2.1 AA)

#### Color Contrast

**Minimum Ratios:**
- Normal text (16px): 4.5:1
- Large text (24px or 18px bold): 3:1
- UI components and graphics: 3:1

**Verification:**
- Use OKLCH color picker to ensure sufficient lightness contrast
- Test all text/background combinations
- Provide alternative indicators beyond color (icons, labels)

#### Keyboard Navigation

**Focus Management:**
```tsx
// Visible focus indicator
<button className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  Click Me
</button>

// Skip to main content link
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white">
  Skip to main content
</a>
```

**Keyboard Shortcuts:**
- Tab: Navigate forward through interactive elements
- Shift+Tab: Navigate backward
- Enter/Space: Activate buttons and links
- Escape: Close modals, dropdowns, cancel actions
- Arrow keys: Navigate within lists, tables, dropdowns

**Focus Trapping:**
- Modal/drawer open: Focus trap within modal
- Modal close: Return focus to trigger element

#### Screen Reader Support

**ARIA Labels:**
```tsx
// Button with icon only
<button aria-label="Edit organization">
  <PencilIcon className="w-5 h-5" />
</button>

// Form input
<label htmlFor="email" className="sr-only">Email</label>
<input
  id="email"
  type="email"
  aria-describedby="email-helper"
  aria-invalid={hasError}
  aria-required={true}
/>
<p id="email-helper" className="text-xs text-neutral-500">
  We'll never share your email
</p>

// Dynamic content updates
<div role="status" aria-live="polite" aria-atomic="true">
  {/* Success/error messages appear here */}
</div>

// Loading state
<div role="status" aria-live="polite">
  <span className="sr-only">Loading opportunities...</span>
  <SpinnerIcon />
</div>
```

**Semantic HTML:**
- Use `<button>` for buttons, not `<div onclick>`
- Use `<a>` for links with `href`
- Use `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>` landmarks
- Use `<table>` for tabular data with proper `<thead>`, `<tbody>`, `<th>`

#### Form Accessibility

```tsx
<form>
  {/* Fieldset for grouped inputs */}
  <fieldset className="space-y-4">
    <legend className="text-lg font-semibold text-neutral-900">Contact Information</legend>
    
    <div>
      <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
        Full Name <span aria-label="required">*</span>
      </label>
      <input
        type="text"
        id="name"
        aria-required="true"
        aria-invalid={errors.name ? "true" : "false"}
        aria-describedby={errors.name ? "name-error" : undefined}
      />
      {errors.name && (
        <p id="name-error" role="alert" className="text-xs text-error mt-1">
          {errors.name}
        </p>
      )}
    </div>
  </fieldset>
  
  <button type="submit" aria-label="Create contact">Create Contact</button>
</form>
```

#### Testing Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible and meet contrast ratios
- [ ] Screen reader announces all content correctly
- [ ] Form errors announced to screen readers
- [ ] Color is not the only indicator of meaning
- [ ] Images have alt text (or aria-label)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Zoom to 200% without loss of functionality
- [ ] Text can be resized without breaking layout

---

## 5. TECHNICAL SPECIFICATIONS

### 5.1 Technology Stack (Updated for Crispy-CRM)

#### Frontend

**Framework:**
- **React 18+** with TypeScript
- **Rationale**: Component reusability, type safety, large ecosystem, excellent tooling

**State Management:**
- **Zustand** (preferred) or Redux Toolkit
- **Rationale**: Simpler than Redux, less boilerplate, great TypeScript support, sufficient for CRM complexity

**Styling:**
- **Tailwind CSS** with custom configuration
- **OKLCH color model** via CSS variables
- **PostCSS** for processing
- **Rationale**: Utility-first approach aligns with design system, highly performant, excellent responsive design support

**Component Libraries:**
- **Headless UI** (by Tailwind Labs) for accessible unstyled components
- **Radix UI** for complex components (Combobox, Dialog, Dropdown)
- **Rationale**: Unstyled primitives allow full design control while ensuring accessibility

**Data Fetching:**
- **TanStack Query (React Query)** for server state management
- **Rationale**: Automatic caching, background refetching, optimistic updates, pagination support

**Form Management:**
- **React Hook Form** with **Zod** for validation
- **Rationale**: Minimal re-renders, great TypeScript support, declarative validation schemas

**Date/Time:**
- **date-fns** for date manipulation (lightweight alternative to Moment.js)
- **React DatePicker** or **Radix UI DatePicker** for UI

**Drag & Drop:**
- **dnd-kit** for Kanban board
- **Rationale**: Modern, accessible, performant, touch-friendly

**Charts/Visualizations:**
- **Recharts** or **Chart.js** with React wrapper
- **Rationale**: Declarative API, responsive, good default styling

**Icons:**
- **Heroicons** (by Tailwind Labs) or **Lucide React**
- **Rationale**: Consistent style, tree-shakeable, optimized SVGs

**Build Tool:**
- **Vite** (preferred) or Create React App
- **Rationale**: Faster dev server, optimized builds, better HMR

#### Backend & Infrastructure

**Backend Platform:**
- **Supabase** (PostgreSQL + Auto-generated REST APIs + Built-in Auth)
- **Rationale**: Eliminates need for custom backend, provides instant REST/GraphQL APIs from database schema, includes Row-Level Security (RLS) for multi-tenant access control

**Database:**
- **PostgreSQL** (via Supabase)
- Field-level audit trail using database triggers (see ADR-0006)
- Soft delete pattern (deleted_at column) for all core entities

**Authentication:**
- **Supabase Auth (GoTrue)** with JWT tokens
- Refresh token rotation for security
- Email/password authentication (MVP)
- Auth triggers sync to internal sales table

**Authorization:**
- **Row Level Security (RLS)** policies in PostgreSQL
- Shared team collaboration model (all authenticated users can access shared resources)
- See PRD Section 3.1 for access control details

**File Storage:**
- **Supabase Storage** for document uploads (built-in)
- Alternative: AWS S3 or Cloudflare R2 if needed

**Deployment:**
- **Frontend**: Vercel or Netlify (static hosting with SSR support)
- **Backend**: Supabase Cloud (managed PostgreSQL + APIs)
- **Rationale**: Serverless architecture, automatic scaling, minimal ops overhead

### 5.2 Data Flow & API Design

**Note:** With Supabase, REST APIs are **auto-generated** from the database schema. The endpoints below are for documentation/reference - they are automatically available without manual implementation once the database tables are created.

#### API Endpoints (Supabase Auto-Generated)

**Authentication:**
```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
```

**Organizations:**
```
GET    /api/v1/organizations          (List with filters, pagination)
POST   /api/v1/organizations          (Create)
GET    /api/v1/organizations/:id      (Get single)
PUT    /api/v1/organizations/:id      (Update)
DELETE /api/v1/organizations/:id      (Soft delete)
POST   /api/v1/organizations/import   (CSV import)
GET    /api/v1/organizations/export   (CSV export)
```

**Contacts:**
```
GET    /api/v1/contacts
POST   /api/v1/contacts
GET    /api/v1/contacts/:id
PUT    /api/v1/contacts/:id
DELETE /api/v1/contacts/:id
GET    /api/v1/organizations/:id/contacts  (Contacts for org)
```

**Opportunities:**
```
GET    /api/v1/opportunities
POST   /api/v1/opportunities
GET    /api/v1/opportunities/:id
PUT    /api/v1/opportunities/:id
PATCH  /api/v1/opportunities/:id/stage     (Update stage only)
PATCH  /api/v1/opportunities/:id/status    (Update status only)
DELETE /api/v1/opportunities/:id
POST   /api/v1/opportunities/:id/clone
GET    /api/v1/organizations/:id/opportunities
```

**Products:**
```
GET    /api/v1/products
POST   /api/v1/products
GET    /api/v1/products/:id
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id
```

**Activities:**
```
GET    /api/v1/activities               (All activities, filterable)
POST   /api/v1/activities               (Log activity)
GET    /api/v1/activities/:id
PUT    /api/v1/activities/:id           (Edit activity, user-created only)
DELETE /api/v1/activities/:id           (Delete activity, user-created only)
GET    /api/v1/opportunities/:id/activities
GET    /api/v1/organizations/:id/activities
GET    /api/v1/contacts/:id/activities
```

**Users:**
```
GET    /api/v1/users                    (List, admin-only)
POST   /api/v1/users                    (Create, admin-only)
GET    /api/v1/users/:id
PUT    /api/v1/users/:id                (Update, self or admin)
DELETE /api/v1/users/:id                (Deactivate, admin-only)
GET    /api/v1/users/me                 (Current user profile)
PUT    /api/v1/users/me                 (Update own profile)
```

**Reports/Analytics:**
```
GET    /api/v1/reports/dashboard/sales-rep      (Sales Rep metrics)
GET    /api/v1/reports/dashboard/sales-manager  (Manager metrics)
GET    /api/v1/reports/pipeline                 (Pipeline report data)
GET    /api/v1/reports/forecast                 (Forecast report data)
GET    /api/v1/reports/account-health           (Account health data)
GET    /api/v1/reports/activity                 (Activity report data)
GET    /api/v1/reports/won-lost                 (Won/Lost analysis)
GET    /api/v1/reports/product-performance      (Product metrics)
```

#### Query Parameters (Filtering, Sorting, Pagination)

**Example: GET /api/v1/opportunities**

```typescript
interface OpportunityQueryParams {
  // Pagination
  page?: number;          // Page number (1-indexed)
  limit?: number;         // Results per page (default: 20, max: 100)
  
  // Sorting
  sort_by?: string;       // Field to sort by (e.g., "start_date", "priority")
  sort_order?: 'asc' | 'desc'; // Sort direction
  
  // Filtering
  status?: string[];       // Multi-select: ["Open", "On Hold"]
  stage?: string[];        // Multi-select: ["Lead-discovery-1", "Contacted-phone/email-2"]
  priority?: string[];     // Multi-select: ["A", "B", "C", "D"]  (4 levels only)
  product_id?: string[];   // Multi-select product IDs
  deal_owner_id?: string[]; // Multi-select user IDs
  organization_id?: string; // Single org ID
  
  // Date ranges
  start_date_from?: string;   // ISO date: "2025-01-01"
  start_date_to?: string;
  expected_sold_date_from?: string;
  expected_sold_date_to?: string;
  
  // Number ranges
  probability_min?: number;  // 0-100
  probability_max?: number;
  volume_min?: number;
  volume_max?: number;
  
  // Search
  search?: string;         // Full-text search across name, org name, product
  
  // Includes
  include?: string[];      // Relationships to include: ["organization", "product", "deal_owner"]
}
```

**Example Request:**
```
GET /api/v1/opportunities?status=Open&priority=A+,A&sort_by=expected_sold_date&sort_order=asc&page=1&limit=20&include=organization,product
```

**Example Response:**
```json
{
  "data": [
    {
      "opportunity_id": "uuid-123",
      "opportunity_name": "Poke Supply Deal",
      "organization": {
        "organization_id": "uuid-456",
        "organization_name": "Ballyhoo Hospitality",
        "priority_level": "A"
      },
      "product": {
        "product_id": "uuid-789",
        "product_name": "Poke Bowl Mix",
        "principal": "Seafood Co"
      },
      "status": "Open",
      "stage": "Follow-up-4",
      "start_date": "2025-10-15",
      "expected_sold_date": "2025-12-01",
      "probability": 0.65,
      "cases_per_week_volume": 150,
      "deal_owner_id": "uuid-user-1",
      "created_at": "2025-10-15T08:30:00Z",
      "updated_at": "2025-10-20T14:22:00Z"
    }
    // ... more opportunities
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_pages": 5,
    "total_results": 92
  },
  "meta": {
    "request_time": "2025-11-02T10:30:00Z",
    "api_version": "v1"
  }
}
```

#### Error Handling

**Standard Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "organization_name",
        "message": "Organization name is required"
      },
      {
        "field": "priority_level",
        "message": "Priority must be one of: A+, A, B, C, D"
      }
    ]
  },
  "meta": {
    "request_id": "req-uuid-123",
    "timestamp": "2025-11-02T10:30:00Z"
  }
}
```

**HTTP Status Codes:**
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate name)
- `422 Unprocessable Entity`: Semantic error (e.g., invalid state transition)
- `500 Internal Server Error`: Server error

### 5.3 Performance Requirements

**Target Metrics:**
- Initial page load (FCP): <2 seconds
- Time to Interactive (TTI): <3 seconds
- Interaction response time: <500ms
- API response time: <200ms (p95)
- Lighthouse Performance Score: >90

**Optimization Strategies:**
- Code splitting by route
- Lazy loading for modals, large components
- Virtual scrolling for long lists (react-window)
- Image optimization and lazy loading
- API response caching (TanStack Query)
- Debounced search inputs (300ms)
- Optimistic UI updates for mutations

### 5.4 Security Requirements

**Authentication:**
- JWT tokens with 15-minute expiration
- Refresh tokens with 30-day expiration (HTTP-only cookie)
- Token rotation on refresh

**Authorization:**
- Role-based access control (RBAC) enforced server-side
- Permission checks on all API endpoints
- Frontend hides UI elements based on role (defense in depth)

**Data Protection:**
- HTTPS required for all requests
- API rate limiting (100 requests/minute per user)
- Input validation and sanitization (SQL injection prevention)
- XSS prevention (React escapes by default, careful with dangerouslySetInnerHTML)
- CSRF protection (CSRF tokens for state-changing requests)

**Password Security:**
- Minimum 8 characters
- Bcrypt hashing (cost factor 12)
- Password reset tokens expire in 1 hour

---

## 6. IMPLEMENTATION ROADMAP (MVP)

### Phase 1: Foundation (Weeks 1-3)

**Infrastructure:**
- Set up React + TypeScript + Vite project
- Configure Tailwind CSS with OKLCH color system
- Establish design token system (spacing, colors, shadows, radius)
- Set up routing (React Router)
- Configure state management (Zustand)
- Set up TanStack Query for data fetching

**Authentication:**
- Implement login/logout flow
- JWT token handling and refresh logic
- Protected route wrapper component
- User context/provider

**Core Layout:**
- Top navigation bar component
- Sidebar component (collapsible)
- Page layout template
- Breadcrumb navigation component
- Responsive breakpoints

### Phase 2: Organizations Module (Weeks 4-5)

- Organizations list view (table with sorting, filtering)
- Organization detail view (tabbed interface)
- Create/Edit organization forms
- Organization API integration
- Search within organizations
- CSV export functionality

### Phase 3: Contacts Module (Weeks 6-7)

- Contacts list view
- Contact detail view
- Create/Edit contact forms
- Contact-Organization relationships
- Contact API integration
- Search within contacts

### Phase 4: Products Module (Week 8)

- Products list view
- Product detail view
- Create/Edit product forms
- Product API integration
- Active/Inactive toggle

### Phase 5: Opportunities Module (Weeks 9-12)

**Week 9-10: List & Detail Views**
- Opportunities list view (table with advanced filtering)
- Opportunity detail view (comprehensive layout)
- Related opportunities display
- Activity timeline on detail page

**Week 11-12: Kanban & Creation**
- Kanban pipeline board (drag-and-drop)
- Create/Edit opportunity modal (single form with 6 sections)
- Principal Organization field ⭐ (MOST IMPORTANT - required field)
- Stage/Status update logic
- Opportunity actions

### Phase 6: Tasks & Activity Tracking (Weeks 13-15)

**Tasks Module ⚠️ CRITICAL:**
- Tasks list view (sortable/filterable table)
- Task creation modal (quick add from any entity detail page)
- Task editing and completion (inline checkbox + detail modal)
- Overdue task indicators (red highlighting, badge count)
- Daily email reminders (8 AM configurable)
- Task API integration
- RLS policies (admin/manager/rep access levels)

**Activity Tracking:**
- Activity log component
- Quick log activity form
- Activity feed display (reverse chronological)
- Activity filtering and search
- Automated activity logging (stage changes, etc.)
- Activity API integration

### Phase 7: Basic Reporting (Weeks 16-17)

- **Opportunities by Principal Report** ⭐ (MOST IMPORTANT)
  - Grouped list view (Principal → Opportunities)
  - CSV export with proper columns
- **Weekly Activity Summary Report**
  - Per-user activity breakdown
  - CSV export
- **Filtered List Exports**
  - CSV export button on all list views
  - Respects current filters/search
- Note: Analytics dashboards NOT in MVP scope

### Phase 8: Polish & Optimization (Weeks 18-19)

- Accessibility audit (WCAG 2.1 AA compliance)
- Performance optimization (code splitting, lazy loading)
- Responsive design refinement (iPad-first focus)
- Error handling improvements
- Loading states and skeletons
- User onboarding/tooltips

### Phase 9: Testing & Bug Fixes (Weeks 20-21)

- Unit tests for critical components
- Integration tests for key flows
- End-to-end tests (Cypress or Playwright)
- Cross-browser testing (Chrome, Safari, Firefox)
- User acceptance testing (UAT)
- Bug fixes and refinements

### Phase 10: Deployment & Training (Week 22)

- Production deployment
- User training materials
- Admin documentation
- Go-live support
- Post-launch monitoring

---

## 7. SUCCESS METRICS & KPIs

**Primary Goal:** Replace Excel spreadsheets with a faster, searchable CRM system.

### 1. Excel Replacement (MOST IMPORTANT)
- **Target**: Old Excel sheets abandoned within 30 days
- **Measure**: Are team members still opening Excel files for CRM data?
- **Success Signal**: All opportunity tracking happens in CRM, Excel is archive-only

### 2. Data Entry Speed
- **Target**: Data entry is faster than Excel
- **Measure**: Time to create new opportunity (before: Excel, after: CRM)
- **Success Signal**: Users voluntarily choose CRM over Excel for new data

### 3. Search & Findability
- **Target**: Can find information quickly
- **Measure**: Time to find a contact/organization/opportunity
- **Success Signal**: Users stop asking "Where's that info?" in team chat

### 4. User Adoption
- **Target**: 100% team uses CRM daily within 60 days
- **Measure**: Daily active users / Total team size
- **Success Signal**: All team members log at least one activity per week

### 5. Principal Tracking (Key Feature)
- **Target**: All opportunities have Principal assigned
- **Measure**: % of opportunities with valid Principal organization
- **Success Signal**: "Opportunities by Principal" report is used weekly

### 6. Technical Performance
- **Target**: Fast enough that users don't complain
- **Measure**: Page load <3 seconds, interactions <500ms
- **Success Signal**: No "app is slow" feedback in first month

### 7. Data Quality
- **Target**: Clean, usable data
- **Measure**: % of opportunities with required fields complete
- **Success Signal**: Reports don't show "Unknown" or missing data

**Post-Launch Evaluation (30 Days After):**
- Survey team: "Is the CRM better than Excel?" (Yes/No + why)
- Observe: Are people still using Excel? (If yes, understand why)
- Measure: Search time, data entry time (informal timing tests)

---

## 8. APPENDIX

### 8.1 Glossary

- **Organization**: A customer account (restaurant, distributor, management company)
- **Contact**: A person (decision-maker) at an organization
- **Opportunity**: A potential sale or deal in the pipeline
- **Stage**: A step in the sales pipeline (1-8, from Lead discovery to Order support)
- **Status**: The current state of an opportunity (Open, Closed, On Hold, SOLD-7d)
- **Priority**: Importance level of an organization (A+, A, B, C, D)
- **Volume**: Cases per week expected from a deal
- **Probability**: Likelihood (0-100%) that an opportunity will close
- **Deal Owner**: Sales rep responsible for an opportunity
- **Account Manager**: Sales rep responsible for an organization relationship
- **Principal**: Brand or product line manufacturer
- **Activity**: A logged interaction (call, email, meeting, etc.)

### 8.2 Business Rules Reference

**Opportunity Lifecycle:**
1. Lead discovery: Identify potential customer
2. Contacted: Initial outreach made
3. Sampled/Visited: Product demonstration/tasting
4. Follow-up: Ongoing nurturing
5. Feedback received: Customer response evaluation
6. Demo/Cookup: In-depth product demonstration
7. SOLD: Deal closed successfully
8. Order support: Post-sale support and fulfillment

**Priority System (4 Levels):**
- **A**: Top-tier accounts, high-value (highest priority)
- **B**: Mid-tier accounts
- **C**: Lower-value accounts
- **D**: Lowest priority accounts

**Stage Progression Rules:**
- Must move forward sequentially (cannot skip stages)
- Can move backward if deal regresses
- Status can change independently of stage
- SOLD-7d status automatically sets stage to SOLD-7

### 8.3 Future Enhancements (Post-MVP)

**Phase 2 Features:**
- Email integration (Gmail, Outlook add-ins)
- Calendar integration (sync meetings)
- Custom report builder
- Scheduled report email delivery
- Advanced search (global, cross-entity)
- Duplicate detection and merging tools
- Bulk email campaigns
- Quote generation
- Convert to Order workflow (opportunity → order record creation)

**Phase 3 Features:**
- Mobile native app (iOS, Android)
- Offline mode with sync
- Advanced analytics (predictive forecasting)
- Territory management
- Commission tracking
- Inventory management integration
- Order management system
- Customer portal (for distributors/customers)

**Long-term Vision:**
- AI-powered lead scoring
- Automated activity capture (email parsing, call transcription)
- Real-time collaboration (see who's viewing/editing)
- Workflow automation (if-then rules)
- Custom fields and entities (no-code customization)
- API marketplace (integrations with ERP, accounting, etc.)

---

## 8. IMPLEMENTATION DEVIATIONS & ARCHITECTURAL DECISIONS

### Pragmatic Implementation Choices

This section documents where the actual implementation differs from the original specification, following a "code wins" philosophy with pragmatic adjustments.

#### Database Schema Patterns

**Primary Keys:**
- **Specified:** entity_name_id (e.g., organization_id, contact_id)
- **Implemented:** id (PostgreSQL standard convention)
- **Decision:** Keep current implementation - follows database best practices

**Task Relationships (HubSpot Pattern):**
- **Original:** Polymorphic pattern with related_to_type and related_to_id
- **Implemented:** Separate foreign keys (contact_id, opportunity_id, organization_id)
- **Rationale:** Maintains referential integrity at database level, simpler queries, follows HubSpot/Pipedrive industry standard

**Organization Segments:**
- **Specified:** Reference to segments table with segment_id
- **Implemented:** Flexible text field allowing custom values
- **Decision:** Switch to flexible text field per PRD for user flexibility

#### Module Implementations

**Tasks Module:**
- **Specified:** Full module with List/Show/Edit/Create views
- **Implemented:** Dashboard widget only with quick add/edit modals
- **Decision:** Keep minimal - users manage tasks through dashboard
- **Note:** No email notifications (users check tasks when logged in)

**Reports Module:**
- **Status:** To be implemented
- **Scope:** Three basic reports as specified (no advanced analytics)
  1. Opportunities by Principal (critical for business)
  2. Weekly Activity Summary
  3. Filtered List Exports (CSV)

**Activity Tracking:**
- **Specified:** Standalone module
- **Implemented:** Embedded in Opportunities/Contacts + Dashboard timeline
- **Decision:** Keep contextual approach - more intuitive for users

#### Features Removed/Simplified

**Product Pricing:**
- **Removed:** list_price, currency_code, unit_of_measure columns
- **Rationale:** Pricing is dynamic per customer/distributor
- **Impact:** Simplified data model, products are catalog items only

**Email Notifications:**
- **Status:** Not implemented
- **Decision:** Skip for MVP - reduces infrastructure complexity

**Forecasting Features:**
- **Status:** Removed from MVP
- **Timeline:** Moved to Phase 3

**Mobile App:**
- **Status:** Not in MVP
- **Timeline:** Phase 3 consideration

#### Technical Stack Decisions

**Authentication:** Supabase Auth (GoTrue)
**Database:** PostgreSQL with RLS policies
**Frontend:** React 19 + TypeScript + Vite
**UI Framework:** React Admin + shadcn/ui components
**State Management:** TanStack Query (server) + Zustand (client)
**Deployment:** Vercel + Supabase Cloud

### User Experience Patterns

#### Data Import
- **CSV Import:** Nice-to-have feature (Q3: Occasionally useful)
- **Supported Entities:** Organizations and Contacts
- **Use Cases:** Initial migration from Excel, periodic bulk updates
- **Validation:** Preview with error highlighting before import
- **Mapping:** Auto-detect columns with manual override option

#### Form Validation
- **Approach:** Real-time validation as user types (Q4: Real-time)
- **Implementation:** Zod schemas with immediate feedback
- **Error Display:** Inline below fields, red text with icons
- **Success Indicators:** Green checkmarks for valid fields
- **Performance:** Debounced validation (300ms) to avoid lag

#### Navigation Pattern
- **Layout:** Top bar with horizontal tabs (current implementation)
- **Sections:** Dashboard | Contacts | Organizations | Opportunities | Products
- **Mobile:** Responsive tabs collapse to hamburger menu on small screens
- **Active State:** Border-bottom highlight on current section

#### Dashboard Content Priority
**Primary Focus:** Tasks & Activities (Q6: Priority A)
1. **My Tasks Widget** - Shows overdue and upcoming tasks
2. **Personal Pipeline** - User's opportunities by stage
3. **Recent Activity** - Latest records and changes
4. **Quick Actions** - Add buttons for common tasks

#### Data Management

**Data Retention Policy (30-Day Soft Delete):**
- **Phase 1:** Soft delete with `deleted_at` timestamp
- **Phase 2:** After 30 days, move to archive tables
- **Phase 3:** Hard delete from archive after 90 days total
- **Audit Trail:** Permanent retention of who deleted what and when

**Duplicate Detection (Prevent Creation):**
- **Organizations:** Check name + city combination
- **Contacts:** Check email or (first_name + last_name + organization)
- **Behavior:** Block creation with error message and link to existing record
- **Admin Override:** Admins can force create with reason

**Activity Logging (Comprehensive):**
- **Logged Actions:** Every create, read, update, delete operation
- **Stored Data:** User, timestamp, action, entity, changes (old/new values)
- **Performance:** Async logging to avoid UI blocking
- **Retention:** 90 days in main table, then archive

#### Smart Defaults (Rule-Based, Not ML)

Following industry best practices from Salesforce/HubSpot research:

**Context-Aware Defaults:**
- **Due Date:** Tasks default to +3 days from today
- **Priority:** Medium for all new items
- **Owner:** Current user for new records
- **Stage:** "New Lead" for opportunities
- **Organization Segment:** Last-used value per user session

**Auto-Population Rules:**
- **Contact Organization:** Pre-fill when creating from org page
- **Opportunity Customer:** Pre-fill when creating from org context
- **Task Related Entity:** Auto-link when created from entity page

**Not Implemented (Avoiding Over-Engineering):**
- ❌ Machine learning predictions
- ❌ Complex multi-field dependencies
- ❌ Behavioral pattern learning
- ✅ Simple, predictable, fast

#### Mobile Responsiveness
- **Priority:** Important for occasional mobile use (Q12)
- **Target Devices:** iPad (primary), iPhone (secondary), Android tablets
- **Breakpoints:** Desktop (1024px+), Tablet (768-1023px), Mobile (<768px)
- **Touch Targets:** Minimum 44x44px for all interactive elements
- **Responsive Tables:** Card view on mobile, table view on desktop/tablet

#### Opportunity-Contact Relationships
- **Primary Pattern:** Single primary contact per opportunity (Q13)
- **Junction Table:** Supports multiple contacts when needed
- **Use Cases:** Primary decision maker + influencers
- **UI Display:** Show primary contact prominently, others as "Additional Contacts"

#### Search Functionality
- **Scope:** Module-level search only (Q7: Confirmed)
- **No Global Search:** Each module has its own search box
- **Search Fields:**
  - Organizations: Name, City
  - Contacts: Name, Email
  - Opportunities: Name, Customer, Principal
  - Products: Name, SKU, Category
- **Performance:** Real-time filtering with 200ms debounce

#### Performance Optimization (Speed First)

**Target Metrics (Q14: Speed First):**
- **Initial Load:** <2 seconds
- **List Views:** <500ms with 1000 records
- **Form Submit:** <300ms response
- **Search Results:** <200ms as-you-type

**Optimization Strategies:**
- Virtual scrolling for long lists
- Lazy loading for tabs and modals
- Optimistic UI updates
- Aggressive caching with React Query
- Database indexes on all foreign keys

## 9. BUSINESS PROCESS RULES

### Opportunity Management

#### Stage Transitions
- **Flexibility:** Can move to any stage at any time (Q1: Flexible)
- **Requirement:** Must complete interaction form with description when changing stage
- **Validation:** Stage change triggers activity log entry with mandatory notes field
- **No Restrictions:** Can move backwards or skip stages as needed

#### Ownership & Assignment
- **Territory Management:** Manual assignment with self-service (Q2)
- **Default Behavior:** New opportunities unassigned until claimed
- **Self-Assignment:** Sales reps can claim unassigned opportunities
- **Manager Override:** Managers can reassign any opportunity
- **Orphaned Records:** When user deactivated, opportunities remain with them until manually reassigned (Q4)

### Product Catalog
- **Edit Permissions:** All authenticated users can add/edit products (Q3)
- **No Approval Workflow:** Changes are immediate
- **Audit Trail:** All product changes logged with user and timestamp
- **No Currency/Pricing:** Products are catalog items only (Q7)

### User & Role Management
- **Fixed Roles:** 4 predefined roles, no customization (Q10)
  - Admin
  - Sales Manager
  - Sales Rep
  - Read-Only
- **No Team Hierarchy:** Flat structure, no territory or team concepts
- **Onboarding:** Guided tour in-app (last priority feature) (Q9)

---

## 10. OPERATIONAL REQUIREMENTS

### Infrastructure & Deployment

#### Environment Strategy (Q12)
- **Two Environments:** Local Development + Production
- **Local Dev:** Supabase CLI with Docker
- **Production:** Supabase Cloud + Vercel
- **No Staging:** Direct promotion from dev to production

#### Change Management (Q13 - Single Developer)
**Recommended Workflow for Solo Developer:**
1. All configuration in version control (git)
2. Test locally with `npm run db:local:reset`
3. Create migrations with `npx supabase migration new`
4. Review changes with `npx supabase db diff`
5. Deploy with `npm run db:cloud:push`
6. Tag releases in git for rollback ability

**Best Practices:**
- Keep migration files small and focused
- Always include rollback scripts
- Test migrations on fresh database before deploying
- Use feature branches even as solo developer

#### Deployment Strategy (Q15)
- **Big Bang Releases:** Deploy all features together
- **No Feature Flags:** Features are either deployed or not
- **Release Schedule:** Deploy during low-usage windows
- **Rollback Plan:** Git tags for version rollback

### Data Management

#### Backup Strategy (Q6)
- **Primary:** Rely on Supabase automatic daily backups
- **Point-in-time Recovery:** Available through Supabase (7-30 days based on plan)
- **No Additional Backups:** Trust platform reliability
- **User Exports:** Users can export their data via CSV for local backup

#### Data Privacy (Q11)
- **Basic Compliance:** Soft delete + audit trail
- **No GDPR Features:** US-only focus, no EU requirements
- **Data Retention:** 30-day soft delete, then archive
- **User Data Access:** Users can export their own data

### Monitoring & Support

#### Performance Monitoring (Q14)
**Free Monitoring Stack:**
- **Supabase Dashboard:** Built-in metrics for database and API
- **Vercel Analytics:** Free tier for web vitals (if using Vercel)
- **Sentry Free Tier:** Error tracking (up to 5K events/month)
- **Uptime Robot:** Free uptime monitoring (50 monitors)

**Key Metrics to Track:**
- Database response time
- API error rate
- Page load speed
- JavaScript errors
- Uptime percentage

#### Notification System (Q8)
- **No Notifications:** Users check system when logged in
- **No Email Alerts:** Even for critical events
- **No Push Notifications:** Desktop or mobile
- **Manual Checking:** Users responsible for checking tasks and updates

### Integration Strategy

#### API Access (Q5)
- **No Public API:** Web UI only access
- **Supabase REST API:** Available but not documented for external use
- **No Webhooks:** No event streaming to external systems
- **Manual Integration:** Export/import via CSV only

#### Third-Party Integrations
- **None Planned:** Standalone system
- **Future Consideration:** Email/calendar in Phase 2
- **Import/Export:** CSV files for data exchange

### Security & Compliance

#### Access Control
- **Authentication:** Supabase Auth (email/password)
- **Authorization:** RLS policies per role
- **Session Management:** JWT with refresh tokens
- **Password Policy:** Minimum 6 characters (Supabase default)

#### Compliance Requirements
- **Industry:** Food distribution (no special requirements)
- **Geography:** US-only
- **Data Residency:** US-East (Supabase default)
- **Certifications:** None required

---

## DOCUMENT APPROVAL

**Prepared by**: Product Design & Engineering Team
**Reviewed by**: Implementation Team
**Approved by**: Technical Lead
**Date**: November 3, 2025
**Version**: 1.1 MVP (Implementation-Aligned)
**Note**: This version has been updated to reflect actual implementation patterns and pragmatic architectural decisions

---

**END OF PRD**
