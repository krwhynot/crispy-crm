# PRODUCT REQUIREMENTS DOCUMENT
# Crispy-CRM: Food Distribution Sales Management Platform

**Version:** 1.0 MVP  
**Last Updated:** November 2, 2025  
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
  organization_id: string;           // UUID, PK
  
  // Core Information
  organization_name: string;         // UNIQUE, REQUIRED
  priority_level: PriorityLevel;     // ENUM: A+, A, B, C, D
  segment: OrganizationSegment;      // ENUM
  
  // Distribution Relationship
  distributor_id?: string;           // FK → Organizations (self-reference)
  distributor_rep_name?: string;
  
  // Account Management
  primary_account_manager_id?: string;    // FK → Users
  secondary_account_manager_id?: string;  // FK → Users
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
  created_by: string;                // FK → Users
  updated_by: string;                // FK → Users
}

type PriorityLevel = 'A+' | 'A' | 'B' | 'C' | 'D';

type OrganizationSegment = 
  | 'Fine Dining'
  | 'Casual'
  | 'Gastropub'
  | 'Ethnic'
  | 'Pizza'
  | 'Chain/Group'
  | 'Distributor'
  | 'Management Company'
  | 'Catering';

type State = 'IL' | 'IN' | 'OH' | 'MI' | 'KY' | 'NY' // ... etc.
```

#### Contacts Table
```typescript
interface Contact {
  // Primary Key
  contact_id: string;                // UUID, PK
  
  // Core Information
  full_name: string;                 // REQUIRED
  organization_id: string;           // FK → Organizations, REQUIRED
  position?: ContactPosition;        // ENUM
  
  // Contact Methods
  email?: string;
  phone?: string;
  linkedin_url?: string;
  
  // Management
  account_manager_id?: string;       // FK → Users
  
  // Address
  street_address?: string;
  city?: string;
  state?: State;
  zip_code?: string;
  
  // Additional
  notes?: string;
  
  // Audit Fields
  created_at: Date;
  updated_at: Date;
  created_by: string;                // FK → Users
  updated_by: string;                // FK → Users
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
  opportunity_id: string;            // UUID, PK
  
  // Core Information
  opportunity_name: string;          // REQUIRED
  organization_id: string;           // FK → Organizations, REQUIRED
  
  // Status & Stage
  status: OpportunityStatus;         // ENUM
  stage: OpportunityStage;           // ENUM
  
  // Timeline
  start_date: Date;                  // REQUIRED
  expected_sold_date?: Date;
  
  // Probability & Volume
  probability: number;               // DECIMAL 0-1 (0-100%)
  cases_per_week_volume?: number;    // INTEGER
  
  // Product Information
  principal?: string;                // Brand/product line
  product_id?: string;               // FK → Products
  
  // Ownership & Source
  deal_owner_id: string;             // FK → Users, REQUIRED
  source?: OpportunitySource;        // ENUM
  
  // Closure Information
  loss_reason?: LossReason;          // ENUM (required if Closed and not SOLD)
  
  // Additional
  notes?: string;
  
  // Audit Fields
  created_at: Date;
  updated_at: Date;
  created_by: string;                // FK → Users
  updated_by: string;                // FK → Users
}

type OpportunityStatus = 
  | 'Open'
  | 'Closed'
  | 'On Hold'
  | 'SOLD-7d'
  | 'open';  // Note: Lowercase variant from legacy data

type OpportunityStage = 
  | 'Lead-discovery-1'
  | 'Contacted-phone/email-2'
  | 'Sampled/Visited invite-3'
  | 'Follow-up-4'
  | 'Feedback-received-5'
  | 'demo-cookup-6'
  | 'SOLD-7'
  | 'order support-8'
  | 'Kaufholds'
  | 'Swap'
  | 'VAF BLITZ'
  | 'Phone'
  | 'Loss Business. Reason?';

type OpportunitySource = 
  | 'MFB'
  | 'Principal'
  | 'Distributor referral'
  | 'Already Known'
  | 'Appointment'
  | 'Customer referral'
  | 'Networking'
  | 'Email'
  | 'Walk-In';

type LossReason = 
  | 'Competitor'
  | 'Price'
  | 'Other';
```

#### Products Table
```typescript
interface Product {
  // Primary Key
  product_id: string;                // UUID, PK
  
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

#### Users Table
```typescript
interface User {
  // Primary Key
  user_id: string;                   // UUID, PK
  
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
  activity_id: string;               // UUID, PK
  
  // Entity Reference (Polymorphic)
  entity_type: EntityType;           // ENUM
  entity_id: string;                 // FK → respective table
  
  // Activity Details
  activity_type: ActivityType;       // ENUM
  activity_date: Date;               // REQUIRED
  user_id: string;                   // FK → Users, REQUIRED
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

| Role | Organizations | Contacts | Opportunities | Products | Users | Reports |
|------|--------------|----------|---------------|----------|-------|---------|
| **Admin** | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full CRUD | All access |
| **Sales Manager** | Full CRUD | Full CRUD | Full CRUD | Read | Read | All access |
| **Sales Rep** | Read All, Edit Assigned | Read All, Edit Assigned | Read All, Full CRUD on Owned | Read | Read Own | Own + Team |
| **Read-Only** | Read | Read | Read | Read | Read Own | Basic |

**Additional Permission Rules:**
- Sales Reps can only edit Organizations where they are Primary/Secondary Account Manager
- Sales Reps can view all Opportunities but only edit those where they are Deal Owner
- Activity Log entries visible based on entity access
- Bulk actions restricted to Sales Manager and Admin roles

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
  - **Priority** (multi-select checkboxes with color indicators)
  - **Segment** (multi-select dropdown)
  - **Account Manager** (searchable multi-select)
  - **State** (multi-select dropdown)
  - **Has Open Opportunities** (toggle: Yes/No/All)
  - **Weekly Priority** (toggle: Yes/No/All)
- Applied filters shown as removable chips above table
- "Clear all filters" button
- Filter presets: "My Accounts", "Priority A/A+", "Weekly Priority"

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
- Priority Level* (radio buttons with color indicators: A+, A, B, C, D)
- Segment* (dropdown: Fine Dining, Casual, Gastropub, etc.)

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
  - Phone (click to call on mobile: tel:)
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

### 3.4 Opportunities Module (Core CRM Feature)

#### Pipeline View (Kanban Board)

**Visual Design:**
- Horizontal swim lanes for each stage:
  1. **Lead-discovery-1** (Lightest blue)
  2. **Contacted-phone/email-2**
  3. **Sampled/Visited invite-3**
  4. **Follow-up-4**
  5. **Feedback-received-5**
  6. **demo-cookup-6**
  7. **SOLD-7** (Green)
  8. **order support-8** (Darkest green)

**Stage Columns:**
- Header: Stage name + number badge + total count + total volume
- Example: "Follow-up-4 [12] | 150 cases/week"
- Color-coded background (subtle gradient)
- Minimum width to prevent overcrowding

**Opportunity Cards:**
```
┌───────────────────────────────────────┐
│ [Priority Badge]  [Deal Owner Avatar] │
│                                        │
│ Organization Name                      │
│ Opportunity Name (secondary)           │
│                                        │
│ 🎯 Product Name                        │
│ 📦 150 cases/week                      │
│ 📅 Expected: Dec 15, 2025              │
└───────────────────────────────────────┘
```

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
- **Horizontal scroll** on tablet/mobile if stages overflow viewport

**Filtering:**
- Filter toolbar above board:
  - **Deal Owner** (multi-select with avatars)
  - **Priority** (multi-select with color badges)
  - **Product** (searchable multi-select)
  - **Status** (multi-select: Open, On Hold, Closed, SOLD-7d)
- Applied filters shown as chips
- "Clear all" button

**Sorting within Stage:**
- Sort dropdown per column:
  - By Date (start_date or expected_sold_date)
  - By Volume (cases_per_week_volume)
  - By Priority (A+ → D)
  - By Organization Name (A-Z)

#### List View (Table)

**Layout:**
- Comprehensive sortable/filterable table
- Columns (configurable visibility):
  - **Priority** (color badge, sortable)
  - **Organization Name** (linked)
  - **Opportunity Name** (linked, bold)
  - **Status** (colored badge: Open=Blue, SOLD-7d=Green, Closed=Gray, On Hold=Yellow)
  - **Stage** (numbered badge with color gradient)
  - **Product**
  - **Start Date** (sortable)
  - **Expected Sold Date** (sortable, highlight if past due)
  - **Probability** (%) (sortable)
  - **Cases/Week Volume** (sortable)
  - **Deal Owner** (avatar + name, sortable)
  - **Last Activity** (relative time, sortable)
- Row hover: Subtle elevation and action icons appear (View, Edit, Clone)

**Advanced Filtering:**
- Comprehensive filter panel (collapsible sidebar)
- Filters available:
  - **Status** (multi-select checkboxes)
  - **Stage** (multi-select with range option: "Stages 3-5")
  - **Priority** (multi-select)
  - **Product** (searchable multi-select)
  - **Deal Owner** (searchable multi-select)
  - **Organization** (searchable single/multi-select)
  - **Date Ranges**:
    - Start Date (date range picker)
    - Expected Sold Date (date range picker)
  - **Probability Range** (dual slider: min-max)
  - **Volume Range** (number inputs: min-max)
  - **Source** (multi-select)
- Filter logic: AND between filter types, OR within multi-select

**Saved Filter Views:**
- Preset views available to all users:
  - "My Open Opportunities"
  - "Closing This Month" (Expected Sold Date within 30 days)
  - "High Priority" (Priority A/A+)
  - "Stale Opportunities" (Stage 3+, no activity >30 days)
  - "Recent Wins" (SOLD-7d, last 30 days)
- User-created custom views (saved filter combinations)
- "Save current filters as view" button
- Rename/delete custom views

**Bulk Actions:**
- Select multiple opportunities via checkboxes
- Actions:
  - **Change Status** (bulk status update with confirmation)
  - **Assign Deal Owner** (reassign to another user)
  - **Export to CSV** (respects filters)
  - **Delete** (with confirmation, admin-only)
- Bulk action confirmation modal shows count and affected opportunities

#### Detail View

**Page Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumb: Opportunities > [Organization] > [Opp Name]     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Header Section                                      │    │
│  │  Organization Name (large, linked to org page)      │    │
│  │  Opportunity Name                                   │    │
│  │  [Status Badge] [Stage Badge] [Priority Badge]      │    │
│  │                                                      │    │
│  │  [Edit] [Delete] [Clone] [Convert to Order]         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Key Metrics Row (Cards)                             │    │
│  ├──────────┬──────────┬──────────┬──────────┬────────┤    │
│  │ Start    │ Expected │ Probab.  │ Volume   │ Deal   │    │
│  │ Date     │ Sold     │ 65%      │ 150/wk   │ Owner  │    │
│  │ +45 days │ Dec 15   │ [Gauge]  │ cases    │ [User] │    │
│  └──────────┴──────────┴──────────┴──────────┴────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Deal Details (Expandable Sections)                  │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ ▼ Deal Information                                  │    │
│  │   Product: [Product Name] (linked)                  │    │
│  │   Principal: [Brand]                                │    │
│  │   Source: [Source Type]                             │    │
│  │   Loss Reason: [If applicable]                      │    │
│  │   Notes: [Expandable text]                          │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ ▼ Organization Context                              │    │
│  │   [Org summary card with key info]                  │    │
│  │   Related Contacts: [List with quick actions]       │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ ▼ Activity Timeline                                 │    │
│  │   [Quick add activity form]                         │    │
│  │   ─────────────────────────────────────────────    │    │
│  │   [Reverse chronological activity feed]             │    │
│  │   • User avatar, type icon, timestamp, desc         │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ ▼ Related Opportunities                             │    │
│  │   [Mini table: Other opps for same organization]    │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ ▼ Documents & Files                                 │    │
│  │   [Upload area + list of attached files]            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [Right Sidebar: Change Log / Audit Trail]                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Header Actions:**
- **Edit**: Open edit modal or inline editing mode
- **Delete**: Confirmation modal → soft delete → redirect to list
- **Clone**: Duplicate opportunity with new name (preserves org, product, volume)
- **Convert to Order**: Change status to SOLD-7d, stage to SOLD-7, require volume input, create order record (future phase)

**Key Metrics Cards:**
- **Start Date**: Shows date + "X days in pipeline" badge
- **Expected Sold Date**: 
  - Countdown badge: "15 days until close" (green if >30 days, yellow if 7-30 days, red if <7 days)
  - "Overdue" badge if past expected date and not closed
- **Probability**: Visual gauge (0-100%) with color gradient (low=red, high=green)
- **Cases/Week Volume**: Number with "cases" label
- **Deal Owner**: Avatar + name + contact button (opens email or messaging)

**Activity Timeline:**
- **Quick Add Activity** (always at top):
  - Inline form: Activity Type dropdown + Description textarea + Date/Time picker
  - "Log Activity" button
  - Collapses after submission, success toast
- **Activity Feed**:
  - Reverse chronological
  - Each entry: User avatar, activity type icon, timestamp (relative), description, expand/collapse for long descriptions
  - Filter by activity type (dropdown)
  - "Load more" or infinite scroll for long histories

**Inline Editing:**
- Click-to-edit fields where feasible:
  - Opportunity Name (text input appears)
  - Expected Sold Date (date picker)
  - Probability (slider)
  - Volume (number input)
- Auto-save on blur or explicit "Save" button
- Undo option (toast: "Opportunity updated. [Undo]")

**Change Log (Sidebar or Tab):**
- Full audit trail of all changes
- Format:
  - Timestamp
  - User who made change
  - Field changed
  - Old value → New value
- Filter by user, field, date range
- Export change log to CSV

#### Create/Edit Forms

**Form Approach:**
- **Wizard** (multi-step) for complex creation (new users)
- **Single scrollable form** for experienced users (preference toggle in settings)
- **Quick Create Modal** for minimal fields (accessible from navbar, org page)

**Full Create Form (Wizard):**

**Step 1: Basic Info**
- Organization* (searchable dropdown with "Add New Organization" option)
  - Shows: Name, Priority badge, Segment
- Opportunity Name* (text input, placeholder: "e.g., Poke Supply Deal")
- Product (searchable dropdown of active products)
  - Shows: Product Name (Principal)
- Principal (text field, auto-populated from product if selected, else free text)

**Step 2: Timeline & Probability**
- Start Date* (date picker, default today, disable future dates)
- Expected Sold Date (date picker, validation: >= start_date)
- Status (dropdown, default "Open", options: Open, On Hold, Closed, SOLD-7d)
- Stage (dropdown, default "Lead-discovery-1", shows stage progression 1-8)
- Probability (slider 0-100% with stage-based suggestions tooltip)
  - Example: "Typical probability for Stage 3: 40-60%"

**Step 3: Volume & Ownership**
- Cases Per Week Volume (number input, positive integers only)
- Deal Owner* (user dropdown, default current user, shows avatar + name)
- Source (dropdown: MFB, Principal, Distributor referral, etc.)

**Step 4: Additional Details**
- Loss Reason (conditional: only shown if Status = Closed and Stage ≠ SOLD-7)
  - Radio buttons: Competitor, Price, Other
- Notes (rich text editor: bold, italic, lists, links)

**Wizard Navigation:**
- Progress indicator at top (1 of 4, 2 of 4, etc.)
- "Next" button (primary) advances to next step
- "Back" button (secondary) returns to previous step
- "Save Draft" button (text-only) saves and closes (auto-resume on return)
- "Cancel" button with confirmation if changes made
- Step validation: Cannot proceed to next step if current step has errors

**Single Form (Alternative):**
- All fields on one scrollable page
- Organized in sections matching wizard steps
- Same validation rules
- "Save" and "Cancel" buttons fixed at bottom or sticky

**Quick Create Modal:**
- Minimal fields for rapid entry:
  - Organization* (searchable dropdown)
  - Opportunity Name* (text input)
  - Product (searchable dropdown)
  - Deal Owner* (defaults to current user)
- "Create" button saves with defaults:
  - Status = Open
  - Stage = Lead-discovery-1
  - Start Date = Today
- After creation: Toast with options: "[View Details]" or "[Add Another]"

**Form Validation:**
- **Required Fields**: Organization, Opportunity Name, Start Date, Deal Owner
- **Conditional Required**: Loss Reason (if Closed and not SOLD)
- **Date Logic**: Expected Sold Date >= Start Date
- **Probability**: 0-100 range
- **Volume**: Positive integers only
- Real-time validation on blur (inline error messages)
- Form-level validation on submit (scroll to first error)

**Auto-Save Drafts:**
- Save form state to browser localStorage every 30 seconds
- Indicator: "Draft saved at HH:MM:SS"
- Resume draft on return: "You have an unsaved opportunity. [Resume Editing] [Discard]"

**Cancel Confirmation:**
- If unsaved changes: Modal "You have unsaved changes. Are you sure you want to discard them? [Discard] [Cancel]"

**Success Handling:**
- Toast notification: "Opportunity '[Opp Name]' created successfully. [View Opportunity]"
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

**Convert to Order:**
- Button available when Stage = SOLD-7 or manually
- Action:
  - Update Status → SOLD-7d
  - Update Stage → SOLD-7 (if not already)
  - Require Cases Per Week Volume (prompt if empty)
  - Create order record (future integration phase)
  - Activity log: "Converted to Order by [User]"
- Confirmation modal: "Convert '[Opp Name]' to order? Required volume: [Input] cases/week. [Cancel] [Convert]"

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

### 3.6 Reporting & Analytics Features

#### Dashboards (Role-Based)

**Sales Rep Dashboard:**

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ My Performance Dashboard                     [Customize ⚙️] │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │ Open     │ Expected │ Closing  │ Activities│            │
│  │ Opps     │ Volume   │ This Mo. │ This Week │            │
│  │ 23       │ 1,250/wk │ 5 opps   │ 18        │            │
│  └──────────┴──────────┴──────────┴──────────┘            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ My Pipeline (Mini Kanban)                           │    │
│  │ [Stage 1: 5] [Stage 2: 7] [Stage 3: 4] ... [8: 2] │    │
│  │ [Scrollable mini cards]                             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Upcoming Tasks & Alerts                             │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ 🔴 3 opportunities in Follow-up >7 days (need action)│    │
│  │ 🟡 5 opportunities closing in next 7 days           │    │
│  │ ⚪ 2 opportunities with no activity in 14+ days     │    │
│  │ [View All Tasks →]                                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Recent Activity Feed                                │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ [Last 10 activities across all user's opportunities]│    │
│  │ • [Avatar] User called Ballyhoo - 2 hours ago       │    │
│  │ • [Avatar] Stage changed to Follow-up - Yesterday   │    │
│  │ ... [View All Activity →]                           │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Widgets:**
1. **Metric Cards** (4 across top):
   - Open Opportunities (count)
   - Expected Volume This Quarter (sum cases/week weighted by probability)
   - Opportunities Closing This Month (Expected Sold Date within 30 days)
   - Activities This Week (activity count)

2. **My Pipeline** (Mini Kanban):
   - Condensed view of user's opportunities by stage
   - Draggable cards (same as full Kanban)
   - Click stage header → Navigate to full Kanban filtered to that stage
   - Click "Expand Pipeline" → Full-screen Kanban view

3. **Upcoming Tasks & Alerts**:
   - **High Priority** (red):
     - Opportunities in Follow-up stage >7 days without activity
     - Opportunities past Expected Sold Date and still Open
   - **Medium Priority** (yellow):
     - Opportunities with Expected Sold Date in next 7 days
     - Priority A/A+ organizations with no activity in 14+ days
   - **Low Priority** (gray):
     - Opportunities with no activity in 14+ days
   - Click alert → Navigate to filtered opportunity list

4. **Recent Activity Feed**:
   - Last 10 activities across all user's opportunities
   - Same format as detail page activity feed
   - Click activity → Navigate to related opportunity/org/contact

**Sales Manager Dashboard:**

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Team Performance Dashboard                   [Customize ⚙️] │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐ │
│  │ Total    │ Expected │ Conversion│ Avg Days │ Won/Lost │ │
│  │ Open     │ Volume   │ Rate      │ in Stage │ This Mo. │ │
│  │ 145      │ 8,750/wk │ 32%       │ 18.5     │ 12 / 3   │ │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Pipeline Overview (Stacked Bar Chart)               │    │
│  │ [Visual: Stacked bars by stage showing Open, On     │    │
│  │  Hold, and volume distribution]                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Team Performance Table                              │    │
│  ├───────┬────────┬────────┬────────┬────────┬────────┤    │
│  │ Sales │ Open   │ In     │ Expected│ Conv.  │ Avg    │    │
│  │ Rep   │ Opps   │ SOLD-7 │ Volume │ Rate % │ Days   │    │
│  ├───────┼────────┼────────┼────────┼────────┼────────┤    │
│  │ John  │ 23     │ 2      │ 1,250  │ 35%    │ 16.2   │    │
│  │ Sarah │ 31     │ 4      │ 1,800  │ 42%    │ 14.8   │    │
│  │ Mike  │ 18     │ 1      │ 900    │ 28%    │ 21.3   │    │
│  │ ...   │ ...    │ ...    │ ...    │ ...    │ ...    │    │
│  └───────┴────────┴────────┴────────┴────────┴────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Priority Accounts At Risk                           │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ Organizations with Priority A/A+ and no activity    │    │
│  │ >30 days                                            │    │
│  │ • Ballyhoo Hospitality (42 days) - [View]          │    │
│  │ • The Purple Pig (38 days) - [View]                │    │
│  │ ... [View All At-Risk Accounts →]                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Product Performance                                 │    │
│  ├──────────┬────────┬────────┬────────┬──────────────┤    │
│  │ Product  │ In     │ Win    │ Avg    │ Total Volume │    │
│  │          │ Pipeline│ Rate  │ Days   │              │    │
│  ├──────────┼────────┼────────┼────────┼──────────────┤    │
│  │ Poke     │ 12     │ 45%    │ 14.2   │ 850 cases/wk │    │
│  │ Fries    │ 8      │ 38%    │ 18.5   │ 620 cases/wk │    │
│  │ ...      │ ...    │ ...    │ ...    │ ...          │    │
│  └──────────┴────────┴────────┴────────┴──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Widgets:**
1. **Team Metric Cards** (5 across top):
   - Total Open Opportunities
   - Total Expected Volume (weighted by probability)
   - Conversion Rate by Stage (funnel view, average across team)
   - Average Days in Each Stage (weighted average)
   - Won/Lost This Month (count with trend)

2. **Pipeline Overview** (Chart):
   - Stacked bar chart showing opportunities by stage
   - Stacks: Open (blue), On Hold (yellow), Closed (gray)
   - Hover: Show count and volume
   - Click bar → Navigate to opportunity list filtered to that stage

3. **Team Performance Table**:
   - Sortable table showing each sales rep's metrics
   - Columns defined above
   - Click row → Navigate to rep's dashboard or filtered opportunity list
   - Export to CSV button

4. **Priority Accounts At Risk**:
   - List of high-priority organizations without recent activity
   - Click → Navigate to organization detail page
   - "Assign Task" action to delegate follow-up

5. **Product Performance**:
   - Table showing which products have highest success rates
   - Sortable by any column
   - Click product → Navigate to product detail page

#### Dashboard Customization (MVP: Limited)

**MVP Features:**
- User cannot add/remove widgets (fixed layout per role)
- User cannot rearrange widgets (future phase)
- User can collapse/expand sections within widgets
- Dashboard layout is responsive (stacks on tablet portrait)

**Future Phase:**
- Drag-and-drop widget rearrangement
- Add/remove widgets from library
- Resize widgets
- Save multiple dashboard layouts ("Sales View", "Forecast View")

#### Standard Reports (Basic)

**Report Access:**
- "Reports" link in top navigation
- Reports list page with categories:
  - **Pipeline Reports**
  - **Forecast Reports**
  - **Account Reports**
  - **Activity Reports**
  - **Performance Reports**

**Available Reports in MVP:**

**1. Opportunity Pipeline Report**
- **View**: Table grouped by Stage
- **Columns**: Stage, Count, Total Volume, Weighted Volume (volume × probability)
- **Filters**: Status, Priority, Product, Deal Owner, Date Range
- **Visualization**: Funnel chart (conversion rates between stages)
- **Export**: CSV, PDF

**2. Sales Forecast Report**
- **View**: Table grouped by time period (Week, Month, Quarter)
- **Columns**: Time Period, Expected Volume, Weighted Volume, Confidence Level
- **Confidence Levels**:
  - High (>70% probability): [Count] opportunities, [Volume] cases/week
  - Medium (40-70%): [Count] opportunities, [Volume] cases/week
  - Low (<40%): [Count] opportunities, [Volume] cases/week
- **Filters**: Date Range, Deal Owner, Product
- **Visualization**: Line chart (forecast over time)
- **Export**: CSV, Excel

**3. Account Health Report**
- **View**: Table of all organizations
- **Columns**: Organization, Priority, # Open Opportunities, Total Expected Volume, Last Activity Date, Days Since Last Activity, Account Manager
- **Flags**: At-risk accounts (no activity >30 days, Priority A/A+)
- **Filters**: Priority, Account Manager, Segment, Days Since Activity
- **Export**: CSV, Excel

**4. Activity Report**
- **View**: Table of all activities in date range
- **Group By**: User, Activity Type, Organization, Opportunity
- **Metrics**: Count by Type, Activities per Day/Week/Month
- **Filters**: Date Range, User, Activity Type, Entity Type
- **Visualization**: Bar chart (activity count by type or user)
- **Export**: CSV

**5. Won/Lost Analysis**
- **View**: Summary metrics + table
- **Metrics**:
  - Total Won (count + volume)
  - Total Lost (count)
  - Win Rate % (won / total closed)
  - Average Days to Close (won opportunities only)
  - Loss Reasons Breakdown (pie chart)
- **Filters**: Date Range, Product, Deal Owner
- **Table**: List of won/lost opportunities with details
- **Export**: PDF, Excel

**6. Product Performance Report**
- **View**: Table of all products with opportunity metrics
- **Columns**: Product, Principal, # Opportunities by Stage, Win Rate %, Total Volume in Pipeline, Avg Probability, Avg Days to Close
- **Sort By**: Any column
- **Filters**: Active Status, Principal, Category
- **Visualization**: Bar chart (win rate by product)
- **Export**: CSV, Excel

**Report Interaction:**
- Click any metric or chart element → Drill down to filtered opportunity list
- "Save Report" button → Save filter configuration for quick access (future)
- "Schedule Email" → Automated delivery (future)
- Print-friendly view (CSS media queries for @print)

### 3.7 Activity Tracking

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

#### Quick Log Activity

**Access Points:**
- Opportunity detail page (inline form at top of Activity Timeline)
- Organization detail page (Activity Feed tab)
- Contact detail page (Activity Feed section)
- Mobile app (floating action button)
- Keyboard shortcut: `Cmd/Ctrl + Shift + A` (global quick log)

**Form Fields:**
- **Activity Type*** (dropdown with icons)
  - Call, Email, Meeting, Sample Delivered, Demo, Note
- **Related To*** (auto-populated if opened from detail page, else searchable dropdown)
  - Type-ahead search: "Ballyhoo Poke Deal" → Shows Opportunity + Organization
- **Date/Time*** (datetime picker, default: now)
  - Quick presets: "Now", "1 hour ago", "Yesterday", "Custom"
- **Description*** (text area, 500 char limit)
  - Placeholder: "What happened? What's the next step?"
- **Participants** (optional, multi-select contacts)
  - Searchable dropdown: Shows contacts from related organization
- **Outcome** (optional, dropdown with presets)
  - "Interested - Follow-up needed"
  - "Need more information"
  - "Not interested"
  - "Ready to buy"
  - "Custom" (free text)

**Submit Options:**
- **Save & Close**: Log activity and close modal
- **Save & Log Another**: Log activity and clear form for rapid entry (keeps Related To pre-filled)

**Success Feedback:**
- Toast notification: "Activity logged successfully"
- Activity immediately appears at top of activity feed
- If probability or stage updated based on outcome, show additional toast: "Opportunity probability updated to 60%"

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

### 3.8 Search & Filtering

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
  - **Opportunities**: Opportunity Name, Organization Name, Product Name
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
   - Example: Start Date, Expected Sold Date, Last Activity Date
   - Presets: Today, This Week, This Month, This Quarter, Custom
   - Custom: Two date inputs (From / To)

5. **Number Range**
   - Example: Probability, Volume
   - Dual slider (min-max) or two number inputs

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
--color-priority-aplus: oklch(0.35 0.15 145);   /* Dark green */
--color-priority-a: oklch(0.50 0.15 145);       /* Green */
--color-priority-b: oklch(0.75 0.15 90);        /* Yellow/Gold */
--color-priority-c: oklch(0.65 0.15 45);        /* Orange */
--color-priority-d: oklch(0.55 0.15 20);        /* Red */
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
          'aplus': 'var(--color-priority-aplus)',
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
    <option value="A+">A+</option>
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
// A+ Priority
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-priority-aplus text-white">
  A+
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
  'sm': '640px',   // Mobile landscape, small tablets
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

#### Backend (Assumed Tech Stack for Integration)

**API:**
- **RESTful API** or **GraphQL**
- **Authentication**: JWT tokens with refresh token rotation
- **Authorization**: Role-based access control (RBAC)

**Database:**
- **PostgreSQL** (recommended for relational data, strong consistency)
- **Alternative**: MySQL, SQL Server

**ORM:**
- **Prisma** (if Node.js backend) or **Entity Framework** (if .NET)

**File Storage:**
- **AWS S3** or **Azure Blob Storage** for document uploads

**Real-time (Future):**
- **WebSockets** or **Server-Sent Events** for live updates
- **Pusher** or **Ably** as managed service alternative

### 5.2 Data Flow & API Design

#### API Endpoints (RESTful Example)

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
  priority?: string[];     // Multi-select: ["A+", "A", "B"]
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
- Create opportunity wizard
- Quick create modal
- Stage/Status update logic
- Opportunity actions (clone, convert)

### Phase 6: Activity Tracking (Weeks 13-14)

- Activity log component
- Quick log activity form
- Activity feed display (reverse chronological)
- Activity filtering and search
- Automated activity logging (stage changes, etc.)
- Activity API integration

### Phase 7: Dashboard & Reporting (Weeks 15-16)

- Sales Rep dashboard (metrics + mini Kanban + alerts)
- Sales Manager dashboard (team metrics + charts)
- Basic reports (Pipeline, Forecast, Account Health)
- Chart components (Recharts integration)
- Export report functionality

### Phase 8: Polish & Optimization (Weeks 17-18)

- Accessibility audit (WCAG 2.1 AA compliance)
- Performance optimization (code splitting, lazy loading)
- Responsive design refinement (iPad-first focus)
- Error handling improvements
- Loading states and skeletons
- User onboarding/tooltips

### Phase 9: Testing & Bug Fixes (Weeks 19-20)

- Unit tests for critical components
- Integration tests for key flows
- End-to-end tests (Cypress or Playwright)
- Cross-browser testing (Chrome, Safari, Firefox)
- User acceptance testing (UAT)
- Bug fixes and refinements

### Phase 10: Deployment & Training (Week 21)

- Production deployment
- User training materials
- Admin documentation
- Go-live support
- Post-launch monitoring

---

## 7. SUCCESS METRICS & KPIs

### User Adoption Metrics
- **Target**: 100% sales team migration within 60 days
- **Measure**: Active users / Total sales team * 100%
- **Tracking**: Daily active users, login frequency

### Data Quality Metrics
- **Target**: <5% error rate in opportunity data
- **Measure**: (Opportunities with validation errors / Total opportunities) * 100%
- **Tracking**: Required field completion rate, duplicate records

### Efficiency Metrics
- **Target**: 40% reduction in administrative tasks
- **Measure**: Time spent on data entry, reporting (before vs. after)
- **Tracking**: User surveys, time tracking

### Pipeline Velocity
- **Target**: Reduce average days in each stage by 15%
- **Measure**: Average days in stage (before vs. after implementation)
- **Tracking**: Stage duration analytics

### Forecast Accuracy
- **Target**: ±15% variance on quarterly volume projections
- **Measure**: (Actual volume - Forecast volume) / Forecast volume * 100%
- **Tracking**: Quarterly forecast vs. actuals comparison

### User Satisfaction
- **Target**: 4/5 rating in post-implementation survey
- **Measure**: NPS score, feature satisfaction ratings
- **Tracking**: In-app feedback, post-launch survey

### Technical Performance
- **Target**: Lighthouse Performance Score >90
- **Measure**: Core Web Vitals (FCP, LCP, CLS, TTI)
- **Tracking**: Continuous monitoring via Lighthouse CI

### Accessibility
- **Target**: WCAG 2.1 AA compliance (100%)
- **Measure**: Automated + manual accessibility testing
- **Tracking**: Axe DevTools, manual keyboard/screen reader testing

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

**Priority System:**
- **A+**: Top-tier accounts, highest volume potential
- **A**: High-value accounts
- **B**: Mid-tier accounts
- **C**: Lower-value accounts
- **D**: Lowest priority accounts
- **No Priority**: Not yet categorized

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

## DOCUMENT APPROVAL

**Prepared by**: Product Design & Engineering Team  
**Reviewed by**: [Stakeholder Names]  
**Approved by**: [Executive Sponsor]  
**Date**: November 2, 2025  
**Version**: 1.0 MVP

---

**END OF PRD**
