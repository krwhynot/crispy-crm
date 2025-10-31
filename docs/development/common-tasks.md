# Common Development Tasks

Step-by-step guides for frequent development tasks in Atomic CRM.

## Adding a New Resource

Follow this pattern when adding entities like "Projects", "Invoices", "Tickets", etc.

### Step 1: Create Module Directory

```bash
mkdir -p src/atomic-crm/<resource-name>
cd src/atomic-crm/<resource-name>
```

**Example:**
```bash
mkdir -p src/atomic-crm/projects
```

### Step 2: Create Resource Components

Create the four standard React Admin views:

```
projects/
├── index.ts              # Lazy-loaded exports
├── ProjectList.tsx       # List view (table/grid)
├── ProjectShow.tsx       # Detail view
├── ProjectEdit.tsx       # Edit form
├── ProjectCreate.tsx     # Create form
└── components/           # Optional: Resource-specific components
```

**Example ProjectList.tsx:**
```typescript
import { List, Datagrid, TextField, DateField } from 'react-admin'

export const ProjectList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="name" />
      <TextField source="status" />
      <DateField source="created_at" />
    </Datagrid>
  </List>
)

export default ProjectList
```

**Example ProjectCreate.tsx:**
```typescript
import { Create, SimpleForm, TextInput, required } from 'react-admin'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectCreateSchema } from '@/atomic-crm/validation/projects'

export const ProjectCreate = () => {
  // Extract defaults from Zod schema
  const schemaDefaults = projectCreateSchema.partial().parse({})

  const form = useForm({
    resolver: zodResolver(projectCreateSchema),
    defaultValues: {
      ...schemaDefaults,
      // Add runtime values if needed
    },
  })

  return (
    <Create>
      <SimpleForm resolver={zodResolver(projectCreateSchema)}>
        <TextInput source="name" validate={required()} />
        <TextInput source="description" multiline />
      </SimpleForm>
    </Create>
  )
}

export default ProjectCreate
```

### Step 3: Create Lazy-Loaded Exports

**src/atomic-crm/projects/index.ts:**
```typescript
import { lazy } from 'react'

// Lazy-load all components for code splitting
export const ProjectList = lazy(() => import('./ProjectList'))
export const ProjectShow = lazy(() => import('./ProjectShow'))
export const ProjectEdit = lazy(() => import('./ProjectEdit'))
export const ProjectCreate = lazy(() => import('./ProjectCreate'))

// Record representation for display
export const recordRepresentation = (record: any) => record.name
```

**Why lazy loading?** Optimizes bundle size. See [Architecture Essentials](architecture-essentials.md#2-lazy-loading).

### Step 4: Create Validation Schema

**src/atomic-crm/validation/projects.ts:**
```typescript
import { z } from 'zod'

export const projectCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export const projectEditSchema = projectCreateSchema.partial()

export type ProjectCreate = z.infer<typeof projectCreateSchema>
export type ProjectEdit = z.infer<typeof projectEditSchema>
```

**Key Pattern:** Use `.default()` for fields with business logic defaults. Forms extract these via `.partial().parse({})`.

### Step 5: Register Resource in CRM.tsx

**src/atomic-crm/root/CRM.tsx:**
```typescript
import * as projects from '@/atomic-crm/projects'

// Inside <Admin> component:
<Resource
  name="projects"
  list={projects.ProjectList}
  show={projects.ProjectShow}
  edit={projects.ProjectEdit}
  create={projects.ProjectCreate}
  recordRepresentation={projects.recordRepresentation}
  icon={FolderIcon}  // Optional: Add icon
/>
```

### Step 6: Create Database Migration

```bash
# Create migration file
npx supabase migration new add_projects_table

# Edit: supabase/migrations/YYYYMMDDHHMMSS_add_projects_table.sql
```

**Example Migration:**
```sql
-- supabase/migrations/20250126143000_add_projects_table.sql

-- Create table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Updated_at trigger
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 7: Test Migration Locally

```bash
# Apply migration locally
npx supabase db reset

# Verify in Studio
npm run db:studio  # http://localhost:54323
```

### Step 8: Update Data Provider Filters (Optional)

If you need custom filtering logic, add to filter registry:

**src/atomic-crm/providers/supabase/filterRegistry.ts:**
```typescript
export const filterRegistry = {
  // ... existing filters
  projects: {
    status: (value: string) => ({
      column: 'status',
      operator: 'eq',
      value,
    }),
    search: (value: string) => ({
      column: 'name',
      operator: 'ilike',
      value: `%${value}%`,
    }),
  },
}
```

### Step 9: Add Navigation (Optional)

**src/atomic-crm/layout/Menu.tsx:**
```typescript
import FolderIcon from '@mui/icons-material/Folder'

<Menu.Item to="/projects" primaryText="Projects" leftIcon={<FolderIcon />} />
```

### Step 10: Deploy to Cloud

```bash
# Deploy migration + verify app works
npm run db:cloud:push
npm run dev  # Test locally first
```

## Customizing the CRM

All customization happens via props to the `<CRM>` component in [src/App.tsx](../../src/App.tsx).

### Available Props

| Prop | Type | Description |
|------|------|-------------|
| `contactGender` | `ContactGender[]` | Gender options for contacts |
| `opportunityStages` | `OpportunityStage[]` | Sales pipeline stages |
| `opportunityCategories` | `string[]` | Opportunity categories |
| `noteStatuses` | `NoteStatus[]` | Note status options |
| `taskTypes` | `string[]` | Task type options |
| `title` | `string` | Application title |
| `lightModeLogo` | `string` | Logo for light mode |
| `darkModeLogo` | `string` | Logo for dark mode |
| `disableTelemetry` | `boolean` | Disable analytics |
| `dataProvider` | `DataProvider` | Custom data provider |
| `authProvider` | `AuthProvider` | Custom auth provider |

### Example: Customize Opportunity Stages

**src/App.tsx:**
```typescript
<CRM
  title="My Sales CRM"
  opportunityStages={[
    { value: 'lead', label: 'New Lead', color: 'blue' },
    { value: 'qualified', label: 'Qualified', color: 'green' },
    { value: 'proposal', label: 'Proposal Sent', color: 'yellow' },
    { value: 'negotiation', label: 'Negotiation', color: 'orange' },
    { value: 'won', label: 'Won', color: 'green' },
    { value: 'lost', label: 'Lost', color: 'red' },
  ]}
  opportunityCategories={[
    'New Business',
    'Existing Business',
    'Renewal',
    'Upsell',
  ]}
/>
```

### Example: Customize Contact Gender Options

**src/App.tsx:**
```typescript
<CRM
  contactGender={[
    { value: 'male', label: 'He/Him' },
    { value: 'female', label: 'She/Her' },
    { value: 'non_binary', label: 'They/Them' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ]}
/>
```

### Example: Custom Branding

**src/App.tsx:**
```typescript
<CRM
  title="Acme CRM"
  lightModeLogo="/assets/acme-logo-light.svg"
  darkModeLogo="/assets/acme-logo-dark.svg"
/>
```

### Example: Override Data Provider

For advanced customization (e.g., using a different backend):

**src/providers/customDataProvider.ts:**
```typescript
import { DataProvider } from 'react-admin'

export const customDataProvider: DataProvider = {
  getList: async (resource, params) => {
    // Custom implementation
  },
  getOne: async (resource, params) => {
    // Custom implementation
  },
  // ... implement all required methods
}
```

**src/App.tsx:**
```typescript
import { customDataProvider } from './providers/customDataProvider'

<CRM
  dataProvider={customDataProvider}
/>
```

**Complete customization guide:** See [doc/developer/customizing.md](../../doc/developer/customizing.md)

## Updating Contact/Organization Schema

If you modify the `contacts` or `organizations` tables, you MUST update CSV import logic.

### Step 1: Update Database Schema

```bash
npx supabase migration new update_contacts_schema
```

**Example: Add phone field:**
```sql
ALTER TABLE contacts ADD COLUMN phone TEXT;
```

### Step 2: Update CSV Import Logic

**src/atomic-crm/contacts/useContactImport.tsx:**

Update the CSV parser to handle new fields:
```typescript
const parseCSV = (data: string[][]) => {
  return data.map(row => ({
    first_name: row[0],
    last_name: row[1],
    email: row[2],
    phone: row[3],  // Add new field
    // ...
  }))
}
```

### Step 3: Update Sample CSV Files

**public/samples/contacts-sample.csv:**
```csv
first_name,last_name,email,phone
John,Doe,john@example.com,555-1234
Jane,Smith,jane@example.com,555-5678
```

### Step 4: Test Import

```bash
npm run dev
# Navigate to Contacts → Import
# Upload sample CSV
# Verify new field imports correctly
```

## Adding Custom Fields to Resources

Want to add custom fields without modifying core tables? Use JSONB columns.

### Step 1: Add JSONB Column

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_custom_fields.sql
ALTER TABLE contacts ADD COLUMN custom_fields JSONB DEFAULT '{}';

-- Index for performance
CREATE INDEX idx_contacts_custom_fields ON contacts USING GIN (custom_fields);
```

### Step 2: Update Form Component

**src/atomic-crm/contacts/ContactEdit.tsx:**
```typescript
import { JsonInput } from 'react-admin'

<JsonInput source="custom_fields" />
```

### Step 3: Query Custom Fields

```typescript
// Data provider automatically handles JSONB
dataProvider.getList('contacts', {
  filter: {
    'custom_fields->department': 'Sales',  // Query nested JSON
  },
})
```

## Environment-Specific Configuration

Use environment variables for settings that differ between local/staging/production.

### Step 1: Define Environment Variables

**.env.example:**
```bash
# Opportunity Settings
VITE_OPPORTUNITY_DEFAULT_STAGE=new_lead
VITE_OPPORTUNITY_PIPELINE_STAGES=new_lead,qualified,proposal,won,lost

# Feature Flags
VITE_FEATURE_EMAIL_INTEGRATION=true
VITE_FEATURE_AI_INSIGHTS=false
```

### Step 2: Use in Configuration

**src/App.tsx:**
```typescript
const defaultStage = import.meta.env.VITE_OPPORTUNITY_DEFAULT_STAGE || 'new_lead'
const pipelineStages = (import.meta.env.VITE_OPPORTUNITY_PIPELINE_STAGES || '')
  .split(',')
  .map(stage => ({ value: stage, label: stage }))

<CRM
  opportunityStages={pipelineStages}
  // ...
/>
```

## Troubleshooting Common Issues

### Issue: Migration Not Applied

**Symptoms:** Table doesn't exist, queries fail

**Solution:**
```bash
# Check migration status
npx supabase migration list

# Reset local database
npx supabase db reset

# If cloud:
npm run db:cloud:push
```

### Issue: Lazy Loading Not Working

**Symptoms:** Components load eagerly, large bundle size

**Checklist:**
1. ✅ Using `lazy()` in index.ts?
2. ✅ Using dynamic import: `import('./Component')`?
3. ✅ Exporting default from component file?

**Correct Pattern:**
```typescript
// index.ts
export const MyComponent = lazy(() => import('./MyComponent'))

// MyComponent.tsx
export default MyComponent  // Must export default!
```

### Issue: Form Defaults Not Working

**Symptoms:** Form fields empty on load, defaults missing

**Solution:** Ensure defaults defined in Zod schema:
```typescript
// ❌ Wrong: No defaults in schema
const schema = z.object({
  status: z.string(),  // No default!
})

// ✅ Correct: Default in schema
const schema = z.object({
  status: z.string().default('active'),
})

// Extract defaults
const defaults = schema.partial().parse({})
// { status: 'active' }
```

### Issue: RLS Policy Blocking Access

**Symptoms:** "permission denied" errors, empty data

**Solution:**
1. Check RLS policies in migration
2. Verify `auth.uid()` matches `user_id` in table
3. Test in Studio with SQL:
```sql
-- Run as specific user
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM projects;
```

## Next Steps

**For architecture details:** See [Architecture Essentials](architecture-essentials.md)

**For database workflows:** See [Supabase Workflow Overview](../supabase/supabase_workflow_overview.md)

**For deployment guide:** See [doc/developer/deploy.md](../../doc/developer/deploy.md)
