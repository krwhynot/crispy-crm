# Relationship & Flow Diagrams

## Entity Relationship Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    sales    │────▷│  companies  │────▷│   deals     │
│             │     │             │     │             │
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ user_id     │     │ sales_id(FK)│     │ company_id  │
│ first_name  │     │ name        │     │ sales_id(FK)│
│ last_name   │     │ sector      │     │ stage       │
│ email       │     │ size        │     │ amount      │
│ admin       │     │ ...         │     │ ...         │
└─────────────┘     └─────────────┘     └─────────────┘
       │                     │                   │
       │                     ▼                   │
       │            ┌─────────────┐              │
       │            │  contacts   │              │
       │            │             │              │
       │            │ id (PK)     │              │
       │            │ company_id  │              │
       │            │ sales_id(FK)│              │
       │            │ tags[]      │              │
       │            │ email_jsonb │              │
       │            │ phone_jsonb │              │
       │            └─────────────┘              │
       │                     │                   │
       │                     ▼                   │
       │            ┌─────────────┐              │
       │            │   tasks     │              │
       │            │             │              │
       │            │ id (PK)     │              │
       │            │ contact_id  │              │
       │            │ sales_id(FK)│              │
       │            │ due_date    │              │
       │            │ done_date   │              │
       │            └─────────────┘              │
       │                                         │
       ▼                                         ▼
┌─────────────┐                         ┌─────────────┐
│contactNotes │                         │ dealNotes   │
│             │                         │             │
│ id (PK)     │                         │ id (PK)     │
│ contact_id  │                         │ deal_id     │
│ sales_id(FK)│                         │ sales_id(FK)│
│ text        │                         │ text        │
│ attachments │                         │ attachments │
└─────────────┘                         └─────────────┘

                    ┌─────────────┐
                    │    tags     │
                    │             │
                    │ id (PK)     │
                    │ name        │
                    │ color       │
                    └─────────────┘
                           ▲
                           │ (many-to-many via array)
                    ┌─────────────┐
                    │  contacts   │
                    │ tags[]      │
                    └─────────────┘
```

## CRUD Flow Mapping

### Create Operations

#### Company Creation Flow
```
Frontend Form → DataProvider → Supabase Insert → companies table
                                    │
                                    ▼
                               Auto-update companies_summary view
```

#### Contact Creation Flow
```
Frontend Form → DataProvider → Supabase Insert → contacts table
                                    │
                                    ▼
                               Auto-update contacts_summary view
                                    │
                                    ▼ (if tags selected)
                           Update tags array reference
```

#### User Registration Flow
```
Auth Signup → Supabase Auth → auth.users table
                    │
                    ▼ (trigger: on_auth_user_created)
            handle_new_user() function
                    │
                    ▼
              Insert into sales table
              (first user gets admin=true)
```

### Read Operations

#### Data Fetching Patterns
```
React Admin List/Show → DataProvider → PostgREST API → Database Views
                                             │
                                             ▼
                                    Filter by RLS policies
                                             │
                                             ▼
                                    Return filtered results
```

#### Key Views Usage
- `companies_summary`: List view with deal/contact counts
- `contacts_summary`: List view with company names and task counts
- `init_state`: Check if system has been initialized

### Update Operations

#### Contact Updates with JSONB
```
Frontend Edit Form → DataProvider → PATCH request → PostgREST
                                           │
                                           ▼
                                  Merge JSONB fields
                                  (email_jsonb, phone_jsonb)
                                           │
                                           ▼
                                    Update contacts table
                                           │
                                           ▼
                               Refresh contacts_summary view
```

#### User Profile Updates
```
Auth Profile Update → auth.users table
            │
            ▼ (trigger: on_auth_user_updated)
    handle_update_user() function
            │
            ▼
    Sync data to sales table
    (first_name, last_name, email)
```

### Delete Operations

#### Cascade Delete Patterns
```
Delete Company → CASCADE → Delete related contacts
                              │
                              ▼ CASCADE
                         Delete contact notes
                         Delete tasks
                              │
                              ▼
                    Deal contacts[] updated
                    (contact_ids array modified)
```

#### Soft Delete (Archive)
```
Deal Archive → Update deals.archived_at = NOW()
                    │
                    ▼
            Hide from default queries
            (WHERE archived_at IS NULL)
```

## Database Triggers and Functions

### Authentication Integration

#### `handle_new_user()` Trigger
```sql
TRIGGER: after insert on auth.users
FUNCTION: handle_new_user()
PURPOSE: Auto-create sales record for new users

LOGIC:
1. Count existing sales records
2. If count = 0, set administrator = TRUE (first user)
3. Insert sales record with metadata from auth.users
4. Link via user_id foreign key
```

#### `handle_update_user()` Trigger
```sql
TRIGGER: after update on auth.users
FUNCTION: handle_update_user()
PURPOSE: Sync auth changes to sales table

LOGIC:
1. Update sales.first_name from raw_user_meta_data
2. Update sales.last_name from raw_user_meta_data
3. Update sales.email from auth.users.email
4. Match by user_id
```

## API Endpoint Mapping

### React Admin Resource Patterns
```
Resource: companies
├── GET /companies → List companies with counts
├── GET /companies/{id} → Show company details
├── POST /companies → Create company
├── PUT /companies/{id} → Update company
└── DELETE /companies/{id} → Delete company (cascade)

Resource: contacts
├── GET /contacts_summary → List with company names
├── GET /contacts/{id} → Show contact details
├── POST /contacts → Create contact with JSONB
├── PUT /contacts/{id} → Update contact (merge JSONB)
└── DELETE /contacts/{id} → Delete contact (cascade)

Resource: deals
├── GET /deals → List deals with filters
├── GET /deals/{id} → Show deal details
├── POST /deals → Create deal
├── PUT /deals/{id} → Update deal (including stage)
└── DELETE /deals/{id} → Soft delete (archive)
```

### File Upload Flow
```
File Upload → React Admin → POST /storage/v1/object/attachments
                                    │
                                    ▼
                              Supabase Storage
                                    │
                                    ▼ (return public URL)
                              Save URL in JSONB
                              (note.attachments[])
```

## Data Synchronization Patterns

### Real-time Updates
```
Database Change → PostgREST → WebSocket → React Admin
                                    │
                                    ▼
                          Update local store
                          Refresh UI components
```

### Batch Operations
```
Multiple Contacts → DataProvider.createMany() → Batch INSERT
Tag Updates → contacts.tags[] → Array operations
Deal Stages → Bulk UPDATE → Pipeline reordering
```

## Cross-Table Dependencies

### Contact Management Flow
```
1. Create Company → companies table
2. Create Contact → contacts table (company_id FK)
3. Add Tags → Update contacts.tags[] array
4. Create Tasks → tasks table (contact_id FK)
5. Add Notes → contactNotes table (contact_id FK)
6. Track Activity → Aggregated in views
```

### Deal Management Flow
```
1. Select Company → companies table
2. Create Deal → deals table (company_id FK)
3. Associate Contacts → Update deals.contact_ids[]
4. Progress Stages → Update deals.stage
5. Add Notes → dealNotes table (deal_id FK)
6. Track Revenue → Aggregate by stage/sales_id
```

### User Permission Flow
```
1. User Login → auth.users authentication
2. Get Sales Profile → sales table (user_id FK)
3. Check Admin Status → sales.administrator
4. Apply RLS Policies → Filter data access
5. Return Authorized Data → Based on policies
```

## Performance Optimization Points

### Index Usage Patterns
- Primary key lookups: Direct index access
- Foreign key joins: Use FK indexes
- Array operations: GIN indexes on array columns
- JSONB queries: GIN indexes on JSONB columns
- Text search: Full-text search on aggregated fields

### View Performance
- `companies_summary`: Materialized for large datasets
- `contacts_summary`: Optimized with selective joins
- Real-time vs cached data trade-offs