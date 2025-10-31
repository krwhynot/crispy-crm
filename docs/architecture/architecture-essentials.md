# Architecture Essentials

Core architectural patterns and structure for the Atomic CRM codebase. Focus on patterns needed for code generation and understanding data flow.

## Entry Points

**Application Bootstrap:**
```
src/main.tsx → src/App.tsx → src/atomic-crm/root/CRM.tsx
```

- **[main.tsx](../../src/main.tsx)**: React root mounting point
- **[App.tsx](../../src/App.tsx)**: Customization entry point (props to `<CRM>`)
- **[CRM.tsx](../../src/atomic-crm/root/CRM.tsx)**: Root component that configures entire application

**Key Insight:** All customization happens via props to `<CRM>` component in [App.tsx](../../src/App.tsx). Never edit [CRM.tsx](../../src/atomic-crm/root/CRM.tsx) directly.

## Module Organization

Location: [`src/atomic-crm/`](../../src/atomic-crm/)

```
src/atomic-crm/
├── contacts/              # Contact management (List/Show/Edit/Create)
├── organizations/         # Company/organization management
├── opportunities/         # Sales pipeline (formerly "deals")
├── products/             # Product catalog
├── sales/                # Sales rep management
├── tasks/                # Task tracking
├── dashboard/            # Analytics and charts
├── layout/               # App shell, navigation, sidebar
├── providers/supabase/   # Data layer (dataProvider, authProvider)
├── components/           # Shared UI components
├── hooks/                # Custom React hooks
├── validation/           # Zod schemas for forms
└── root/                 # CRM.tsx + ConfigurationContext
```

**Module Pattern:**
Each resource module (contacts, organizations, etc.) follows this structure:

```
contacts/
├── index.ts              # Lazy-loaded exports
├── ContactList.tsx       # List view (table/grid)
├── ContactShow.tsx       # Detail view
├── ContactEdit.tsx       # Edit form
├── ContactCreate.tsx     # Create form
└── components/           # Resource-specific components
```

**Export Pattern (index.ts):**
```typescript
// src/atomic-crm/contacts/index.ts
import { lazy } from 'react'

export const ContactList = lazy(() => import('./ContactList'))
export const ContactShow = lazy(() => import('./ContactShow'))
export const ContactEdit = lazy(() => import('./ContactEdit'))
export const ContactCreate = lazy(() => import('./ContactCreate'))

export const recordRepresentation = (record: any) =>
  `${record.first_name} ${record.last_name}`
```

## Key Patterns

### 1. React Admin Resource Pattern

All resources follow React Admin's List/Show/Edit/Create pattern:

```typescript
// In CRM.tsx
<Resource
  name="contacts"
  list={ContactList}
  show={ContactShow}
  edit={ContactEdit}
  create={ContactCreate}
  recordRepresentation={recordRepresentation}
/>
```

### 2. Lazy Loading

**Rule:** All resource components MUST be lazy-loaded to optimize bundle size.

**Pattern:**
```typescript
import { lazy } from 'react'

// ✅ Correct: Lazy-loaded
export const ContactList = lazy(() => import('./ContactList'))

// ❌ Wrong: Eager import
export { ContactList } from './ContactList'
```

**Rationale:** See chunk splitting configuration in [vite.config.ts:120-185](../../vite.config.ts#L120-L185).

### 3. Form Validation Pattern

All forms use React Hook Form + Zod validation:

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactCreateSchema } from '@/atomic-crm/validation/contacts'

// Extract defaults from schema
const schemaDefaults = contactCreateSchema.partial().parse({})

const form = useForm({
  resolver: zodResolver(contactCreateSchema),
  defaultValues: {
    ...schemaDefaults,
    // Merge with runtime values
    user_id: identity.id,
  },
})
```

**Validation Schemas Location:** [`src/atomic-crm/validation/`](../../src/atomic-crm/validation/)

### 4. UI Components

**Source:** [`@/components/ui`](../../src/components/ui) (shadcn-based)

**Usage:**
```typescript
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
```

**Admin Layer:** Always prefer React Admin components ([`src/components/admin/`](../../src/components/admin/)) for forms:
```typescript
import { TextInput, SelectInput } from 'react-admin'
```

## Data Layer (Supabase Integration)

### Data Provider

**Location:** [`src/atomic-crm/providers/supabase/unifiedDataProvider.ts`](../../src/atomic-crm/providers/supabase/unifiedDataProvider.ts)

**Purpose:**
- Custom React Admin data provider built on `ra-supabase-core`
- Handles filtering, pagination, sorting, relationships
- Maps React Admin queries to Supabase REST API

**Filter Registry:** [`filterRegistry.ts`](../../src/atomic-crm/providers/supabase/filterRegistry.ts)
- Defines complex query filters
- Used for search, date ranges, relationships

**Key Methods:**
```typescript
dataProvider.getList('contacts', { pagination, sort, filter })
dataProvider.getOne('contacts', { id })
dataProvider.create('contacts', { data })
dataProvider.update('contacts', { id, data, previousData })
dataProvider.delete('contacts', { id })
```

### Auth Provider

**Location:** [`src/atomic-crm/providers/supabase/authProvider.ts`](../../src/atomic-crm/providers/supabase/authProvider.ts)

**Supported Auth Methods:**
- Google
- Azure
- Keycloak
- Auth0

**Key Methods:**
```typescript
authProvider.login({ email, password })
authProvider.logout()
authProvider.checkAuth()
authProvider.checkError(error)
authProvider.getPermissions()
authProvider.getIdentity()
```

### Database Architecture

**Views:**
- Database views aggregate data (e.g., `contacts_summary` includes task counts)
- Reduce HTTP overhead by pre-joining related data
- Defined in migration files

**Triggers:**
- Auto-sync user data from `auth.users` to `sales` table
- Sync fields: `first_name`, `last_name`, `email`
- Ensures user profile consistency

**Edge Functions:**
- **Location:** [`supabase/functions/`](../../supabase/functions/)
- **Purpose:** User management, email webhooks
- **Reason:** Supabase lacks public user CRUD endpoints

**Migrations:**
- **Location:** [`supabase/migrations/`](../../supabase/migrations/)
- **Format:** `YYYYMMDDHHMMSS_description.sql`
- **Versioning:** Timestamp-based ordering

## Configuration System

**Location:** [`src/atomic-crm/root/ConfigurationContext.tsx`](../../src/atomic-crm/root/ConfigurationContext.tsx)

**Purpose:** Centralized app configuration via React Context

**Configurable Options:**
- Contact gender options
- Opportunity stages/categories
- Note statuses
- Task types
- Logos (light/dark mode)
- Theme settings

**Customization Pattern:**
```typescript
// In App.tsx
<CRM
  title="My Custom CRM"
  opportunityStages={[
    { value: 'lead', label: 'New Lead' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
  ]}
  opportunityCategories={['New Business', 'Existing Business', 'Renewal']}
  contactGender={[
    { value: 'male', label: 'He/Him' },
    { value: 'female', label: 'She/Her' },
    { value: 'other', label: 'They/Them' },
  ]}
  noteStatuses={[
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
  ]}
  taskTypes={['Call', 'Email', 'Meeting', 'Follow-up']}
  lightModeLogo="/logo-light.png"
  darkModeLogo="/logo-dark.png"
  disableTelemetry={true}
/>
```

**Advanced Overrides:**
```typescript
import { customDataProvider } from './providers/custom'
import { customAuthProvider } from './providers/auth'

<CRM
  dataProvider={customDataProvider}
  authProvider={customAuthProvider}
/>
```

## Important Architectural Decisions

### 1. Database Views Over Client-Side Joins

**Rationale:** Complex queries use PostgreSQL views (defined in migrations) to reduce HTTP overhead and simplify frontend code.

**Example:**
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_contacts_summary.sql
CREATE VIEW contacts_summary AS
SELECT
  c.*,
  COUNT(t.id) AS task_count,
  COUNT(n.id) AS note_count
FROM contacts c
LEFT JOIN tasks t ON t.contact_id = c.id
LEFT JOIN notes n ON n.contact_id = c.id
GROUP BY c.id;
```

**Frontend:**
```typescript
// Just query the view - no joins needed
dataProvider.getList('contacts_summary', { ... })
```

### 2. Lazy Loading

**Rationale:** All resource components are lazy-loaded to optimize initial bundle size.

**Implementation:** See chunk splitting in [vite.config.ts:120-185](../../vite.config.ts#L120-L185)

**Pattern:**
```typescript
// Manual chunk splitting for specific modules
manualChunks: {
  'contacts': [/src\/atomic-crm\/contacts/],
  'organizations': [/src\/atomic-crm\/organizations/],
  'opportunities': [/src\/atomic-crm\/opportunities/],
}
```

### 3. No User Deletion

**Rationale:** Users can only be disabled (via Supabase ban feature) to prevent data loss.

**Pattern:**
- Never expose "Delete User" UI
- Use Supabase Dashboard to ban/unban users
- RLS policies prevent banned users from accessing data

### 4. Edge Functions for User Management

**Rationale:** Supabase lacks public user CRUD endpoints, so [`supabase/functions/users`](../../supabase/functions/users/) handles user creation/updates with permission checks.

**Endpoints:**
```typescript
POST /functions/v1/users      // Create user
PUT /functions/v1/users/:id   // Update user
```

### 5. Triggers for Auth Sync

**Rationale:** Database trigger syncs `auth.users` → `sales` table for fields like `first_name`, `last_name`.

**Implementation:**
```sql
-- Auto-creates sales record when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE create_sales_from_user();

-- Auto-updates sales record when user profile changes
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE sync_sales_from_user();
```

### 6. Path Alias

**Alias:** `@/*` maps to `src/*`

**Configuration:**
- **TypeScript:** [tsconfig.json:12](../../tsconfig.json#L12)
- **Vite:** [vite.config.ts:216](../../vite.config.ts#L216)

**Usage:**
```typescript
import { Button } from '@/components/ui/button'
import { contactSchema } from '@/atomic-crm/validation/contacts'
```

## Migration Notes (v0.2.0)

### Deal → Opportunity Rename

**Background:** All `deals` entities renamed to `opportunities` for clearer sales terminology.

**Changes:**
- Database tables: `deals` → `opportunities`
- Environment variables: `DEAL_*` → `OPPORTUNITY_*`
- Props: `dealStages` → `opportunityStages`, `dealCategories` → `opportunityCategories`
- Components: `DealList` → `OpportunityList`, etc.

**Enhanced Schema:**
- Participants (many-to-many)
- Activity tracking
- Interaction history

**Many-to-Many Relationships:**
- Contacts ↔ Organizations (junction table: `contact_organizations`)
- Opportunities ↔ Contacts (junction table: `opportunity_contacts`)

**Backward Compatibility:** Legacy deal endpoints remain functional during transition period.

## Key File Locations

| File | Purpose | When to Edit |
|------|---------|--------------|
| [src/App.tsx](../../src/App.tsx) | Entry point - customize CRM | Configure stages, categories, branding |
| [src/atomic-crm/root/CRM.tsx](../../src/atomic-crm/root/CRM.tsx) | Root component - app setup | Add new resources, modify layout |
| [src/atomic-crm/providers/supabase/unifiedDataProvider.ts](../../src/atomic-crm/providers/supabase/unifiedDataProvider.ts) | Data layer logic | Add custom data fetching |
| [src/atomic-crm/providers/supabase/authProvider.ts](../../src/atomic-crm/providers/supabase/authProvider.ts) | Authentication logic | Add new auth providers |
| [src/atomic-crm/providers/supabase/filterRegistry.ts](../../src/atomic-crm/providers/supabase/filterRegistry.ts) | Filter definitions | Add complex query filters |
| [supabase/migrations/](../../supabase/migrations/) | Database schema versions | Schema changes, migrations |
| [supabase/functions/](../../supabase/functions/) | Edge functions | User mgmt, webhooks |
| [vite.config.ts](../../vite.config.ts) | Build config | Chunk splitting, aliases |
| [src/atomic-crm/validation/](../../src/atomic-crm/validation/) | Zod schemas | Form validation rules |

## Next Steps

**For detailed architecture decisions:** See [doc/developer/architecture-choices.md](../../doc/developer/architecture-choices.md)

**For customization examples:** See [doc/developer/customizing.md](../../doc/developer/customizing.md)

**For adding new resources:** See [Common Tasks Guide](common-tasks.md)
