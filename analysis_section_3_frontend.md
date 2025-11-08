# Frontend Architecture & Components

## Overview

Atomic CRM's frontend is built on a modern React architecture using React Admin as the foundation, enhanced with a comprehensive design system built on shadcn/ui components and Radix UI primitives. The application follows strict architectural patterns for lazy loading, state management, and component composition, all orchestrated through a centralized configuration system.

**Technology Stack:**
- **React 19**: Modern React with concurrent features
- **React Admin**: Enterprise-grade admin framework providing data provider patterns, routing, and CRUD operations
- **Radix UI**: Accessible, unstyled component primitives
- **shadcn/ui**: Pre-built components built on Radix UI
- **Tailwind CSS 4**: Utility-first styling with semantic color system
- **React Hook Form + Zod**: Type-safe form validation
- **Vite**: Fast build tooling with optimized chunk splitting
- **TypeScript**: End-to-end type safety

**Scale:** 191+ React components organized into 28 feature modules within `/src/atomic-crm/`

## Application Entry Points

### Bootstrap Flow

The application follows a three-stage initialization flow:

```
main.tsx → App.tsx → CRM.tsx → <Admin> → React Router → Resources
```

#### 1. main.tsx - React Root

The entry point mounts the React application with strict mode enabled:

```typescript
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**Responsibilities:**
- Mount React application to DOM
- Enable React StrictMode for development warnings
- Load global CSS (Tailwind, theme variables)

#### 2. App.tsx - Customization Entry Point

`App.tsx` serves as the **single customization point** for the entire CRM:

```typescript
// src/App.tsx
import { CRM } from "@/atomic-crm/root/CRM";

const App = () => (
  <CRM
    lightModeLogo="/logos/mfb-logo.webp"
    darkModeLogo="/logos/mfb-logo.webp"
    title="MFB Master Food Brokers"
  />
);

export default App;
```

**Available Props:**
- `title` - Application title
- `lightModeLogo` / `darkModeLogo` - Branding assets
- `contactGender` - Gender options for contacts
- `opportunityStages` - Pipeline stages configuration
- `opportunityCategories` - Opportunity categorization
- `noteStatuses` - Note workflow states
- `taskTypes` - Task categorization
- `dataProvider` - Custom data layer (optional)
- `authProvider` - Custom authentication (optional)
- `disableTelemetry` - Opt-out of usage tracking

**Design Principle:** All customization happens through props—never edit CRM.tsx directly.

#### 3. CRM.tsx - Application Root

The CRM component orchestrates the entire application:

```typescript
// src/atomic-crm/root/CRM.tsx (simplified)
export const CRM = ({
  contactGender = defaultContactGender,
  opportunityCategories = defaultOpportunityCategories,
  opportunityStages = defaultOpportunityStages,
  darkModeLogo = defaultDarkModeLogo,
  lightModeLogo = defaultLightModeLogo,
  noteStatuses = defaultNoteStatuses,
  taskTypes = defaultTaskTypes,
  title = defaultTitle,
  dataProvider = supabaseDataProvider,
  authProvider = supabaseAuthProvider,
  disableTelemetry,
  ...rest
}: CRMProps) => {
  return (
    <ConfigurationProvider
      contactGender={contactGender}
      opportunityCategories={opportunityCategories}
      opportunityStages={opportunityStages}
      darkModeLogo={darkModeLogo}
      lightModeLogo={lightModeLogo}
      noteStatuses={noteStatuses}
      taskTypes={taskTypes}
      title={title}
    >
      <Admin
        dataProvider={dataProvider}
        authProvider={authProvider}
        store={localStorageStore(undefined, "CRM")}
        layout={Layout}
        loginPage={StartPage}
        i18nProvider={i18nProvider}
        dashboard={Dashboard}
        requireAuth
        disableTelemetry
        {...rest}
      >
        <CustomRoutes noLayout>
          <Route path={SetPasswordPage.path} element={<SetPasswordPage />} />
          <Route path={ForgotPasswordPage.path} element={<ForgotPasswordPage />} />
        </CustomRoutes>

        <CustomRoutes>
          <Route path={SettingsPage.path} element={<SettingsPage />} />
        </CustomRoutes>

        <Resource name="opportunities" {...opportunities} />
        <Resource name="contacts" {...contacts} />
        <Resource name="organizations" {...organizations} />
        <Resource name="products" {...products} />
        <Resource name="contactNotes" />
        <Resource name="opportunityNotes" />
        <Resource name="tasks" />
        <Resource name="sales" {...sales} />
        <Resource name="tags" />
        <Resource name="segments" />
        <Resource name="notifications" {...notifications} />
      </Admin>
    </ConfigurationProvider>
  );
};
```

**Responsibilities:**
1. **Configuration Management**: Wraps app in `ConfigurationProvider` for global config access
2. **React Admin Setup**: Configures `<Admin>` with providers, layout, authentication
3. **Resource Registration**: Declares all CRM resources (contacts, organizations, etc.)
4. **Custom Routing**: Defines auth-related and settings routes
5. **State Persistence**: Uses `localStorageStore` for filter/sort preferences

## React Admin Integration

### Core Concepts

React Admin provides the architectural foundation through these patterns:

#### Data Provider Pattern

The `dataProvider` is the **single point of contact** between the UI and backend:

```typescript
// Interface (React Admin standard)
interface DataProvider {
  getList:    (resource, params) => Promise<{ data, total }>
  getOne:     (resource, params) => Promise<{ data }>
  getMany:    (resource, params) => Promise<{ data }>
  getManyReference: (resource, params) => Promise<{ data, total }>
  create:     (resource, params) => Promise<{ data }>
  update:     (resource, params) => Promise<{ data }>
  updateMany: (resource, params) => Promise<{ data }>
  delete:     (resource, params) => Promise<{ data }>
  deleteMany: (resource, params) => Promise<{ data }>
}
```

**Atomic CRM Implementation:**

The unified data provider consolidates all data operations:

```typescript
// src/atomic-crm/providers/supabase/unifiedDataProvider.ts
const baseDataProvider = supabaseDataProvider({
  instanceUrl: import.meta.env.VITE_SUPABASE_URL,
  apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseClient: supabase,
  sortOrder: "asc,desc.nullslast",
});

// Augmented with:
// - Validation layer (Zod schemas)
// - Transform layer (file uploads, JSONB arrays)
// - Service layer (complex business logic)
// - Error logging
```

**Key Features:**
- **Automatic Pagination**: `getList` handles pagination params automatically
- **Automatic Sorting**: Sort params map to Supabase `order` clauses
- **Automatic Filtering**: Filter params map to Supabase query conditions
- **Relationships**: Built-in support for foreign keys and many-to-many joins

#### Resource Pattern

Each resource follows a strict pattern:

```typescript
// src/atomic-crm/contacts/index.ts
const ContactList = React.lazy(() => import("./ContactList"));
const ContactShow = React.lazy(() => import("./ContactShow"));
const ContactEdit = React.lazy(() => import("./ContactEdit"));
const ContactCreate = React.lazy(() => import("./ContactCreate"));

export default {
  list: ContactList,
  show: ContactShow,
  edit: ContactEdit,
  create: ContactCreate,
  recordRepresentation: (record: Contact) =>
    formatName(record?.first_name, record?.last_name),
};
```

**Registration in CRM.tsx:**

```typescript
<Resource name="contacts" {...contacts} />
```

React Admin automatically:
- Maps `/contacts` → `ContactList`
- Maps `/contacts/:id` → `ContactShow`
- Maps `/contacts/:id/edit` → `ContactEdit`
- Maps `/contacts/create` → `ContactCreate`

#### Layout Pattern

The `Layout` component wraps all authenticated pages:

```typescript
// src/atomic-crm/layout/Layout.tsx
export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <KeyboardShortcutsProvider>
      <Header />
      <main className="max-w-screen-xl mx-auto pt-4 px-4 pb-16">
        <ErrorBoundary FallbackComponent={Error}>
          <Suspense fallback={<Skeleton />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer>{/* ... */}</footer>
      <KeyboardShortcutsModal />
      <Notification />
    </KeyboardShortcutsProvider>
  );
};
```

**Features:**
- Global navigation header
- Error boundaries for graceful failure
- Suspense boundaries for lazy-loaded components
- Toast notifications
- Keyboard shortcuts
- Responsive max-width container

### React Admin Components

Atomic CRM uses enhanced React Admin components from `/src/components/admin/`:

**List Components:**
```typescript
<List>           // Wrapper for list views
<DataTable>      // Enhanced data table with sorting, filtering
<BulkActionsToolbar>  // Bulk operations (delete, export)
<FilterForm>     // Advanced filtering UI
<Pagination>     // Table pagination
```

**Show/Edit Components:**
```typescript
<Show>           // Detail view wrapper
<Edit>           // Edit form wrapper
<Create>         // Create form wrapper
<SimpleForm>     // Form container with validation
<SimpleShowLayout>  // Layout for show pages
```

**Input Components:**
```typescript
<TextInput>      // Text fields with validation
<SelectInput>    // Dropdown selects
<ReferenceInput> // Foreign key selects with autocomplete
<ArrayInput>     // JSONB array inputs
<AutocompleteInput>  // Searchable selects
<BooleanInput>   // Checkboxes/switches
<NumberInput>    // Numeric inputs
<FileInput>      // File uploads
```

**Field Components:**
```typescript
<TextField>      // Display text
<DateField>      // Format dates
<ReferenceField> // Display foreign key relationships
<EmailField>     // Mailto links
<UrlField>       // External links
<BadgeField>     // Status badges
<ArrayField>     // Display JSONB arrays
```

## Resource Module Pattern

### Module Structure

Each resource follows this standardized structure:

```
contacts/
├── index.ts                    # Lazy-loaded exports
├── ContactList.tsx            # List view (table)
├── ContactShow.tsx            # Detail view
├── ContactEdit.tsx            # Edit form
├── ContactCreate.tsx          # Create form
├── ContactInputs.tsx          # Shared form inputs
├── ContactAside.tsx           # Sidebar component
├── ContactEmpty.tsx           # Empty state
├── components/                # Resource-specific components
│   ├── Avatar.tsx
│   ├── ContactListFilter.tsx
│   └── ContactListContent.tsx
└── __tests__/                 # Unit tests
```

### Lazy Loading Pattern

**Critical Pattern**: All resource components MUST be lazy-loaded:

```typescript
// ✅ CORRECT
const ContactList = React.lazy(() => import("./ContactList"));

// ❌ WRONG - Eager loading increases bundle size
export { ContactList } from './ContactList';
```

**Rationale:**
- Reduces initial bundle size
- Faster time-to-interactive
- Automatic code-splitting by Vite

**Vite Configuration:**

```javascript
// vite.config.ts - Manual chunk splitting
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'contacts': [/src\/atomic-crm\/contacts/],
        'organizations': [/src\/atomic-crm\/organizations/],
        'opportunities': [/src\/atomic-crm\/opportunities/],
        'products': [/src\/atomic-crm\/products/],
      }
    }
  }
}
```

### Example: Contacts Module

#### ContactList.tsx - List View

```typescript
// src/atomic-crm/contacts/ContactList.tsx
export const ContactList = () => {
  const { identity } = useGetIdentity();

  // Clean up stale filters from localStorage
  useFilterCleanup('contacts');

  if (!identity) return null;

  return (
    <List
      title={false}
      actions={<ContactListActions />}
      perPage={25}
      sort={{ field: "last_seen", order: "DESC" }}
      exporter={exporter}
    >
      <ContactListLayout />
      <FloatingCreateButton />
    </List>
  );
};

const ContactListLayout = () => {
  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (!data?.length && !hasFilters) return <ContactEmpty />;

  return (
    <div className="flex flex-row gap-6">
      <aside role="complementary">
        <ContactListFilter />
      </aside>
      <main role="main" className="flex-1">
        <Card>
          <ContactListContent />
        </Card>
      </main>
      <BulkActionsToolbar />
    </div>
  );
};
```

**Features:**
- Filter persistence with cleanup
- Empty state handling
- Sidebar filters + main content layout
- Bulk actions toolbar
- Floating create button
- CSV export

#### ContactEdit.tsx - Edit Form

```typescript
// src/atomic-crm/contacts/ContactEdit.tsx
export const ContactEdit = () => (
  <EditBase redirect="show">
    <ContactEditContent />
  </EditBase>
);

const ContactEditContent = () => {
  const { isPending, record } = useEditContext<Contact>();
  if (isPending || !record) return null;

  return (
    <ResponsiveGrid variant="dashboard">
      <main>
        <Form>
          <Card>
            <CardContent>
              <ContactInputs />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </main>
      <aside>
        <ContactAside link="show" />
      </aside>
    </ResponsiveGrid>
  );
};
```

**Pattern:**
- `<EditBase>` provides edit context (record, saving state)
- `<Form>` wraps React Hook Form
- Shared `<ContactInputs>` component used in both Edit and Create
- Responsive 70/30 grid (main content + sidebar)
- `<FormToolbar>` provides Save/Cancel buttons

#### ContactInputs.tsx - Form Fields

```typescript
// src/atomic-crm/contacts/ContactInputs.tsx
export const ContactInputs = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-6 p-6">
      <Avatar />
      <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
        <div className="flex flex-col gap-6 flex-1">
          <ContactIdentityInputs />
          <ContactPositionInputs />
        </div>
        <Separator orientation={isMobile ? "horizontal" : "vertical"} />
        <div className="flex flex-col gap-6 flex-1">
          <ContactPersonalInformationInputs />
          <ContactMiscInputs />
        </div>
      </div>
    </div>
  );
};

const ContactIdentityInputs = () => (
  <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-secondary)] p-4 space-y-4">
    <h3 className="text-base font-semibold">Contact Name</h3>
    <TextInput source="first_name" label="First Name *" />
    <TextInput source="last_name" label="Last Name *" />
  </div>
);

const ContactPersonalInformationInputs = () => (
  <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-secondary)] p-4 space-y-4">
    <h3 className="text-base font-semibold">Contact Information</h3>

    {/* JSONB Array Pattern */}
    <ArrayInput source="email">
      <SimpleFormIterator inline>
        <TextInput source="email" type="email" />
        <SelectInput source="type" choices={[
          { id: "Work", name: "Work" },
          { id: "Home", name: "Home" },
          { id: "Other", name: "Other" },
        ]} />
      </SimpleFormIterator>
    </ArrayInput>

    <ArrayInput source="phone">
      <SimpleFormIterator inline>
        <TextInput source="number" />
        <SelectInput source="type" choices={[
          { id: "Work", name: "Work" },
          { id: "Home", name: "Home" },
          { id: "Mobile", name: "Mobile" },
        ]} />
      </SimpleFormIterator>
    </ArrayInput>
  </div>
);
```

**Key Patterns:**
- **Grouped Inputs**: Logical sections with visual cards
- **Responsive Layout**: Side-by-side on desktop, stacked on mobile
- **JSONB Arrays**: `<ArrayInput>` + `<SimpleFormIterator>` for dynamic arrays
- **No Inline Validation**: All validation at API boundary (Engineering Constitution)

## Component Architecture

### UI Component Library

Atomic CRM uses a three-tier component architecture:

#### Tier 1: Radix UI Primitives (56+ primitives)

Unstyled, accessible components from `@radix-ui/react-*`:

```typescript
// Examples from package.json
@radix-ui/react-accordion
@radix-ui/react-alert-dialog
@radix-ui/react-avatar
@radix-ui/react-checkbox
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-label
@radix-ui/react-popover
@radix-ui/react-select
@radix-ui/react-tabs
@radix-ui/react-tooltip
// ... 45+ more
```

**Benefits:**
- WAI-ARIA compliant
- Keyboard navigation built-in
- Focus management
- Screen reader support

#### Tier 2: shadcn/ui Components (/src/components/ui/)

Pre-styled Radix components with Tailwind (50+ components):

```typescript
// src/components/ui/
button.tsx           // Variant-based button system
input.tsx            // Form inputs with validation states
select.tsx           // Styled select dropdowns
card.tsx             // Container component with elevation
dialog.tsx           // Modal dialogs
dropdown-menu.tsx    // Contextual menus
tabs.tsx             // Tab navigation
table.tsx            // Data tables
badge.tsx            // Status badges
avatar.tsx           // User avatars
skeleton.tsx         // Loading states
// ... 40+ more
```

**Example - Button Component:**

```typescript
// src/components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

**Usage:**
```typescript
<Button variant="default">Save</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="destructive">Delete</Button>
```

#### Tier 3: React Admin Wrappers (/src/components/admin/)

Enhanced React Admin components with Atomic CRM styling (60+ components):

```typescript
// src/components/admin/
admin.tsx                  // Main Admin component wrapper
data-table.tsx            // Enhanced table with sorting/filtering
form.tsx                  // Form wrapper with validation
text-input.tsx            // Styled text input
select-input.tsx          // Styled select with search
autocomplete-input.tsx    // Async autocomplete
reference-input.tsx       // Foreign key inputs
array-input.tsx           // JSONB array inputs
simple-form-iterator.tsx  // Dynamic array field iterator
create-in-dialog-button.tsx  // Inline create dialogs
filter-form.tsx           // Advanced filtering UI
bulk-actions-toolbar.tsx  // Bulk operations
// ... 48+ more
```

**Example - Enhanced AutocompleteInput:**

```typescript
// src/components/admin/autocomplete-input.tsx
export const AutocompleteInput = ({
  source,
  choices,
  optionText = "name",
  optionValue = "id",
  ...props
}: AutocompleteInputProps) => {
  return (
    <Controller
      name={source}
      render={({ field, fieldState: { error } }) => (
        <Combobox
          value={field.value}
          onValueChange={field.onChange}
          options={choices}
          optionLabel={optionText}
          optionValue={optionValue}
          error={error?.message}
          {...props}
        />
      )}
    />
  );
};
```

### Design System Components

#### ResponsiveGrid

Standardized grid layouts for common patterns:

```typescript
// src/components/design-system/ResponsiveGrid.tsx
type GridVariant = 'dashboard' | 'cards';

const gridVariants: Record<GridVariant, string> = {
  // Dashboard: Main content (70%) + Sidebar (30%)
  dashboard: 'grid grid-cols-1 lg:grid-cols-[7fr_3fr]',

  // Cards: Auto-fit responsive card grid
  cards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

export const ResponsiveGrid = ({ variant, gap = 'gap-6', children }) => (
  <div className={cn(gridVariants[variant], gap)}>
    {children}
  </div>
);
```

**Usage:**
```typescript
// Dashboard layout
<ResponsiveGrid variant="dashboard">
  <main>{/* 70% main content */}</main>
  <aside>{/* 30% sidebar */}</aside>
</ResponsiveGrid>

// Card grid
<ResponsiveGrid variant="cards">
  {contacts.map(c => <ContactCard key={c.id} {...c} />)}
</ResponsiveGrid>
```

**Breakpoint Strategy (iPad-first):**
- Mobile (< 768px): Single column
- Tablet Portrait (768-1023px): `md:` prefix
- Tablet Landscape+ (1024px+): `lg:` prefix

### Custom Components

#### CreateInDialogButton

Inline creation without navigation:

```typescript
// src/components/admin/create-in-dialog-button.tsx
<CreateInDialogButton
  resource="organizations"
  label="New Organization"
  defaultValues={{
    organization_type: "customer",
    sales_id: identity?.id,
  }}
  onSave={(newOrg) => {
    setValue("organization_id", newOrg.id);
  }}
  title="Create New Organization"
>
  <OrganizationInputs />
</CreateInDialogButton>
```

**Features:**
- Creates related records inline
- Auto-selects created record
- No page navigation
- Full validation support

#### FloatingCreateButton

Persistent create button:

```typescript
// src/components/admin/FloatingCreateButton.tsx
<FloatingCreateButton />
```

- Fixed position bottom-right
- Appears on list views
- Keyboard shortcut support (Ctrl/Cmd + K)
- Touch-optimized for iPad (56px touch target)

## Design System

### Tailwind CSS 4 Integration

Atomic CRM uses Tailwind CSS 4 with semantic color tokens:

#### Color System (OKLCH)

```css
/* src/index.css */
:root {
  /* Core Neutrals - Paper Cream */
  --background: oklch(97.5% 0.010 92);  /* Warm cream */
  --foreground: oklch(20% 0.012 85);    /* Dark text */
  --card: oklch(100% 0 0);              /* Pure white */

  /* Brand - Forest Green (hue 142°) */
  --brand-500: oklch(38% 0.085 142);    /* #336600 */
  --brand-700: oklch(32% 0.080 142);    /* Darker */

  /* Accent - Clay/Terracotta (hue 72°) */
  --accent-clay-500: oklch(63% 0.095 72);

  /* Semantic Tokens */
  --primary: var(--brand-500);
  --primary-foreground: oklch(100% 0 0);
  --destructive: oklch(55% 0.20 25);
  --muted: oklch(95.5% 0.010 92);
  --border: oklch(90% 0.005 92);
}
```

**Philosophy:**
- **Paper Cream Background**: `oklch(97.5% 0.010 92)` creates warm, low-strain base
- **Pure White Cards**: `oklch(100% 0 0)` provides clear elevation
- **2.5-point Delta**: Clear visual separation between surfaces
- **Warm-tinted Shadows**: Prevents "soot" appearance on cream background
- **Semantic Tokens**: Never use hex codes directly

#### Text Hierarchy

```css
/* Warm-tinted text tokens */
--text-title: oklch(22% 0.01 92);      /* Headings */
--text-metric: oklch(18% 0.01 92);     /* Numbers/emphasis */
--text-body: oklch(29% 0.008 92);      /* Warm brown body text */
--text-subtle: oklch(41% 0.006 92);    /* Warm gray metadata */
```

#### Elevation System

```css
/* E1 - Cards on background */
box-shadow:
  0 1px 2px oklch(30% 0.010 92 / 0.06),
  0 1px 3px oklch(30% 0.010 92 / 0.08);

/* E2 - Dropdowns */
box-shadow:
  0 2px 4px oklch(30% 0.010 92 / 0.08),
  0 4px 8px oklch(30% 0.010 92 / 0.10);

/* E3 - Modals */
box-shadow:
  0 8px 16px oklch(30% 0.010 92 / 0.12),
  0 12px 24px oklch(30% 0.010 92 / 0.14);
```

#### Responsive Design (iPad-First)

```typescript
// Breakpoints
sm:   640px   // Large phones
md:   768px   // iPad Portrait (primary target)
lg:   1024px  // iPad Landscape
xl:   1280px  // Desktop
2xl:  1536px  // Large desktop
```

**Touch Targets:**
- Minimum 44px for touch elements
- Floating buttons: 56px (Material Design standard)
- Icon buttons: 48px minimum

**Example:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {/* Single column mobile, 2 columns iPad portrait, 3 columns landscape */}
</div>
```

### Semantic Color Usage

**Rules (Engineering Constitution):**

✅ **CORRECT:**
```typescript
className="bg-primary text-primary-foreground"
className="bg-[color:var(--brand-700)]"
className="border-border"
```

❌ **WRONG:**
```typescript
className="bg-[#336600]"  // Never use hex
className="bg-green-700"  // Never use Tailwind color names
```

**Validation:**
```bash
npm run validate:colors  # Checks for violations
```

## State Management

### Configuration Context

Global configuration via React Context:

```typescript
// src/atomic-crm/root/ConfigurationContext.tsx
export interface ConfigurationContextValue {
  dealCategories: string[];
  opportunityCategories: string[];
  opportunityStages: { value: string; label: string }[];
  noteStatuses: NoteStatus[];
  taskTypes: string[];
  title: string;
  darkModeLogo: string;
  lightModeLogo: string;
  contactGender: ContactGender[];
}

export const useConfigurationContext = () => useContext(ConfigurationContext);
```

**Usage:**
```typescript
const { opportunityStages, title } = useConfigurationContext();

<SelectInput
  source="stage"
  choices={opportunityStages.map(s => ({ id: s.value, name: s.label }))}
/>
```

### Form State from Zod Schemas

**Engineering Constitution Pattern:**

Forms derive default values from Zod schemas, ensuring single source of truth:

```typescript
// src/atomic-crm/validation/contacts.ts
export const contactSchema = z.object({
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),
  title: z.string().optional().nullable(),
  sales_id: z.union([z.string(), z.number()]).optional().nullable(),
});

// Extract defaults
const schemaDefaults = contactSchema.partial().parse({});
// => { email: [], phone: [] }
```

**Form Initialization:**
```typescript
const form = useForm({
  resolver: zodResolver(contactSchema),
  defaultValues: {
    ...schemaDefaults,               // Schema defaults
    sales_id: identity.id,           // Runtime values
  },
});
```

**Benefits:**
- No duplicate default definitions
- Type-safe defaults
- Validation and defaults stay in sync
- Enforces "single source of truth" principle

### React Admin State

React Admin manages state through hooks:

```typescript
// List state
const { data, total, isPending, error } = useListContext();

// Edit state
const { record, isPending, save, saving } = useEditContext();

// Show state
const { record, isPending } = useShowContext();

// Form state (React Hook Form)
const { setValue, getValues, formState } = useFormContext();

// Global state
const { identity } = useGetIdentity();
const refresh = useRefresh();
const notify = useNotify();
```

### Local Storage Persistence

React Admin automatically persists:
- Filter values
- Sort preferences
- Page size
- Column visibility (DataTable)

```typescript
// Configured in CRM.tsx
<Admin store={localStorageStore(undefined, "CRM")}>
```

Storage keys:
- `CRM.contacts.listParams` - Contact list preferences
- `CRM.opportunities.listParams` - Opportunity list preferences
- `opportunity.view.preference` - Kanban vs List view

## Routing

### React Router Integration

React Admin uses React Router v6:

```typescript
// Auto-generated routes
/                          → Dashboard
/contacts                  → ContactList
/contacts/create           → ContactCreate
/contacts/:id              → ContactShow
/contacts/:id/edit         → ContactEdit
/organizations             → OrganizationList
/organizations/:id         → OrganizationShow
/opportunities             → OpportunityList
```

### Custom Routes

```typescript
// In CRM.tsx
<CustomRoutes noLayout>
  <Route path="/set-password" element={<SetPasswordPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
</CustomRoutes>

<CustomRoutes>
  <Route path="/settings" element={<SettingsPage />} />
</CustomRoutes>
```

**noLayout Routes:**
- Authentication pages
- Full-screen workflows

**Layout Routes:**
- Settings pages
- Custom dashboards
- Report pages

### Navigation

Programmatic navigation:

```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to record
navigate(`/contacts/${contactId}`);

// Navigate to edit
navigate(`/contacts/${contactId}/edit`);

// Navigate back
navigate(-1);
```

Link components:

```typescript
import { Link } from 'react-router-dom';

<Link to="/contacts">View Contacts</Link>
```

React Admin buttons:

```typescript
<ShowButton />   // Navigates to show page
<EditButton />   // Navigates to edit page
<CreateButton /> // Navigates to create page
```

## Form Patterns

### JSONB Array Pattern

The standard pattern for email/phone/address arrays stored as JSONB:

**1. Database:**
```sql
CREATE TABLE contacts (
  email JSONB DEFAULT '[]'::jsonb,
  phone JSONB DEFAULT '[]'::jsonb
);
```

**2. Zod Sub-Schema:**
```typescript
export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: z.enum(["Work", "Home", "Other"]).default("Work"),
});

const contactSchema = z.object({
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),
});
```

**3. Form (NO defaultValue):**
```typescript
<ArrayInput source="email">
  <SimpleFormIterator inline>
    <TextInput source="email" type="email" />
    <SelectInput source="type" choices={[
      { id: "Work", name: "Work" },
      { id: "Home", name: "Home" },
    ]} />
  </SimpleFormIterator>
</ArrayInput>
```

**Key:**
- Sub-schemas define structure
- `.default()` in Zod (NOT in form components)
- `zodSchema.partial().parse({})` extracts defaults

### Validation Pattern

**Engineering Constitution: Single-Point Validation**

All validation happens at the API boundary only:

```typescript
// ❌ WRONG - Frontend validation
<TextInput
  source="email"
  validate={required()}  // DON'T DO THIS
/>

// ✅ CORRECT - API boundary validation
// src/atomic-crm/providers/supabase/unifiedDataProvider.ts
export const dataProvider = {
  create: async (resource, params) => {
    // Validate at API boundary
    if (resource === 'contacts') {
      await validateCreateContact(params.data);
    }
    return baseDataProvider.create(resource, params);
  },
};
```

**Validation Functions:**
```typescript
// src/atomic-crm/validation/contacts.ts
export async function validateCreateContact(data: any): Promise<void> {
  try {
    createContactSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });
      throw {
        message: "Validation failed",
        errors: formattedErrors,
      };
    }
    throw error;
  }
}
```

### Reference Inputs

Foreign key relationships:

```typescript
<ReferenceInput source="organization_id" reference="organizations">
  <AutocompleteInput optionText="name" />
</ReferenceInput>
```

**How it works:**
1. `ReferenceInput` fetches organizations via `dataProvider.getList`
2. `AutocompleteInput` displays searchable dropdown
3. Saves selected ID to `organization_id` field

**With inline creation:**
```typescript
<ReferenceInput source="organization_id" reference="organizations">
  <AutocompleteOrganizationInput />
</ReferenceInput>

<CreateInDialogButton
  resource="organizations"
  onSave={(newOrg) => setValue("organization_id", newOrg.id)}
>
  <OrganizationInputs />
</CreateInDialogButton>
```

## Performance Optimizations

### Code Splitting

**Lazy Loading (Required):**
```typescript
// All resource components
const ContactList = React.lazy(() => import("./ContactList"));
const ContactShow = React.lazy(() => import("./ContactShow"));
```

**Manual Chunks (Vite):**
```javascript
// vite.config.ts
manualChunks: {
  'contacts': [/src\/atomic-crm\/contacts/],
  'organizations': [/src\/atomic-crm\/organizations/],
  'opportunities': [/src\/atomic-crm\/opportunities/],
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'admin-vendor': ['ra-core', 'ra-supabase-core'],
}
```

**Result:**
- Initial bundle: ~200KB (gzipped)
- Route chunks: ~50-100KB each (loaded on-demand)
- Total reduction: ~60% vs eager loading

### Memoization

React Admin components use memoization internally:

```typescript
// Custom components should memoize expensive operations
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() =>
    expensiveOperation(data),
    [data]
  );

  return <div>{processedData}</div>;
});
```

### Database Views

Complex queries use PostgreSQL views instead of client-side joins:

```sql
-- Migration: contacts_summary view
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
dataProvider.getList('contacts_summary', { ... });
```

**Benefits:**
- Single HTTP request instead of N+1 queries
- Reduced payload size
- Query optimization at database level

## Testing Strategy

### Component Testing (Vitest + React Testing Library)

```typescript
// src/atomic-crm/contacts/__tests__/ContactList.test.tsx
import { render, screen } from '@testing-library/react';
import { ContactList } from '../ContactList';

describe('ContactList', () => {
  it('renders contact list with data', () => {
    render(<ContactList />, { wrapper: TestWrapper });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows empty state when no contacts', () => {
    render(<ContactList />, { wrapper: EmptyWrapper });
    expect(screen.getByText('No contacts yet')).toBeInTheDocument();
  });
});
```

### E2E Testing (Playwright)

```typescript
// tests/e2e/contacts.spec.ts
test('create new contact', async ({ page }) => {
  await page.goto('/contacts');
  await page.click('[aria-label="Create"]');
  await page.fill('[name="first_name"]', 'Jane');
  await page.fill('[name="last_name"]', 'Smith');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/contacts\/\d+/);
});
```

## Key Architectural Decisions

### 1. React Admin as Foundation

**Rationale:**
- Enterprise-proven data provider pattern
- Built-in CRUD operations
- Excellent TypeScript support
- Active community and ecosystem

**Trade-offs:**
- Learning curve for React Admin concepts
- Some customization requires understanding internals
- Performance optimization requires care with large datasets

### 2. Lazy Loading Everywhere

**Rationale:**
- Fast initial load critical for CRM usage patterns
- Users typically work in 1-2 modules per session
- Reduces bandwidth for mobile/remote users

**Implementation:**
- All resource modules lazy-loaded
- Manual chunk splitting in Vite
- Suspense boundaries with loading states

### 3. Zod at API Boundary

**Rationale:**
- Single source of truth (Engineering Constitution)
- Type safety from schema to runtime
- No duplicate validation logic
- Form defaults derived from schemas

**Trade-offs:**
- Validation errors appear after submission
- Requires careful error message design
- Initial learning curve for team

### 4. JSONB Arrays for Multi-Value Fields

**Rationale:**
- PostgreSQL native support
- No junction tables for simple arrays
- Simpler queries and migrations
- Direct indexing support

**Pattern:**
```typescript
email: [
  { email: "work@example.com", type: "Work" },
  { email: "home@example.com", type: "Home" }
]
```

### 5. Database Views Over Client Joins

**Rationale:**
- Single HTTP request vs N+1
- Database-optimized joins
- Reduced payload size
- Easier to maintain complex queries

**Example:**
- `contacts_summary` includes task_count, note_count
- `opportunities_with_participants` includes contact names
- `organizations_with_metrics` includes relationship counts

## Summary

Atomic CRM's frontend architecture balances enterprise requirements with modern React best practices:

**Strengths:**
- ✅ Type-safe end-to-end (TypeScript + Zod)
- ✅ Accessible by default (Radix UI)
- ✅ Performant (lazy loading, code splitting)
- ✅ Maintainable (clear patterns, single source of truth)
- ✅ Customizable (configuration context, theme system)
- ✅ Tested (70%+ coverage target)

**Architecture Highlights:**
- 191+ React components in 28 modules
- Three-tier component system (Radix → shadcn → React Admin)
- Lazy loading reduces initial bundle by ~60%
- Semantic color system with OKLCH for accessibility
- iPad-first responsive design
- Single-point validation at API boundary

**Next Steps for Developers:**

1. **Adding Resources**: Follow the standard module pattern in `/src/atomic-crm/`
2. **Custom Components**: Build on shadcn/ui base components
3. **Forms**: Use JSONB array pattern + Zod validation
4. **Styling**: Always use semantic color tokens
5. **Performance**: Lazy load all route components

The architecture prioritizes developer experience while maintaining the engineering principles documented in the Engineering Constitution.
