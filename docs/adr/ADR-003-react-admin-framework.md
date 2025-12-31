# ADR-003: React Admin Framework Selection

## Status

**Accepted** - 2025-12-30

## Context

Crispy CRM required an admin framework to build a full-featured CRM application for MFB (Master Food Brokers). The system needed to support:

1. **Resource-based CRUD operations** for contacts, organizations, opportunities, products, and tasks
2. **Complex form handling** with validation, nested inputs, and reference relationships
3. **DataProvider abstraction** to integrate with Supabase as the backend
4. **Role-based access control** supporting admin, manager, and rep roles
5. **Customizable UI** without ejecting from the framework
6. **Small team scale** - 6 account managers, not enterprise-scale requirements

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **React Admin** | Enterprise-grade, DataProvider abstraction, react-hook-form integration, extensive ecosystem | Learning curve, opinionated structure |
| **Refine** | Modern API, headless approach, TypeScript-first | Less mature ecosystem, fewer pre-built components |
| **AdminJS** | Simple setup, auto-generates UI | Node.js focused, less React-native feel, limited customization |
| **Custom build** | Maximum flexibility, no framework constraints | 10x development time, maintenance burden, reinventing solved problems |

### Decision Drivers

1. **DataProvider abstraction** fits Supabase perfectly via `ra-supabase-core`
2. **Built-in form handling** with `react-hook-form` integration eliminates boilerplate
3. **Resource-based architecture** directly maps to CRM domain model (contacts, opportunities, organizations)
4. **Extensive customization** without ejecting - can replace any component
5. **Active community** with regular updates and support

## Decision

**Use React Admin v5.10+ as the application framework**, customized with:

1. **Custom UI layer** built on shadcn/ui instead of Material-UI
2. **Unified DataProvider** for all Supabase operations (see ADR-001)
3. **Zod validation at API boundary** only (see ADR-002)
4. **Lazy-loaded resources** with error boundaries for isolation

### Package Versions (Pinned)

```json
{
  "react-admin": "^5.10.0",
  "ra-core": "^5.10.0",
  "ra-supabase-core": "^3.5.1",
  "react": "^19.1.0",
  "react-hook-form": "^7.66.1",
  "zod": "^4.1.12"
}
```

### Implementation Patterns

#### 1. Resource Definition (Lazy-Loaded with Error Boundaries)

Each resource follows a consistent pattern with code splitting and isolated error handling:

```typescript
// src/atomic-crm/contacts/resource.tsx
import * as React from "react";
import type { Contact } from "../types";
import { formatName } from "../utils/formatName";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const ContactListLazy = React.lazy(() => import("./ContactList"));
const ContactEditLazy = React.lazy(() => import("./ContactEdit"));
const ContactCreateLazy = React.lazy(() => import("./ContactCreate"));

export const ContactListView = () => (
  <ResourceErrorBoundary resource="contacts" page="list">
    <ContactListLazy />
  </ResourceErrorBoundary>
);

export const ContactEditView = () => (
  <ResourceErrorBoundary resource="contacts" page="edit">
    <ContactEditLazy />
  </ResourceErrorBoundary>
);

export const ContactCreateView = () => (
  <ResourceErrorBoundary resource="contacts" page="create">
    <ContactCreateLazy />
  </ResourceErrorBoundary>
);

const contactRecordRepresentation = (record: Contact) =>
  formatName(record?.first_name, record?.last_name);

// React Admin resource config
export default {
  list: ContactListView,
  edit: ContactEditView,
  create: ContactCreateView,
  recordRepresentation: contactRecordRepresentation,
};
```

#### 2. Application Bootstrap

```typescript
// src/atomic-crm/root/CRM.tsx (simplified)
import { Admin } from "@/components/admin/admin";
import { Resource, localStorageStore, QueryClient } from "ra-core";
import { dataProvider, authProvider } from "../providers/supabase";
import contacts from "../contacts";
import opportunities from "../opportunities";
import organizations from "../organizations";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds - CRM data changes frequently
      refetchOnWindowFocus: true,
    },
  },
});

export const CRM = ({ dataProvider, authProvider, ...rest }) => (
  <Admin
    dataProvider={dataProvider}
    authProvider={authProvider}
    queryClient={queryClient}
    store={localStorageStore("2", "CRM")}
    layout={Layout}
    requireAuth
    {...rest}
  >
    <Resource name="opportunities" {...opportunities} />
    <Resource name="contacts" {...contacts} />
    <Resource name="organizations" {...organizations} />
    {/* ... more resources */}
  </Admin>
);
```

#### 3. Form Defaults from Zod Schema

Per Engineering Constitution: "Form state derived from Zod schema, NOT hardcoded defaults":

```typescript
// src/atomic-crm/opportunities/OpportunityCreate.tsx
import { CreateBase, Form, useGetIdentity } from "ra-core";
import { opportunitySchema } from "../validation/opportunities";

const OpportunityCreate = () => {
  const { data: identity } = useGetIdentity();

  // Generate defaults from schema, then merge with identity-specific values
  // Use .partial() to make all fields optional during default generation
  // This extracts fields with .default() (stage, priority, estimated_close_date)
  const formDefaults = {
    ...opportunitySchema.partial().parse({}),
    opportunity_owner_id: identity?.id,
    account_manager_id: identity?.id,
    contact_ids: [], // Explicitly initialize for ReferenceArrayInput
    products_to_sync: [], // Explicitly initialize for ArrayInput
  };

  return (
    <CreateBase redirect="show">
      <Form defaultValues={formDefaults}>
        <OpportunityFormContent />
      </Form>
    </CreateBase>
  );
};
```

#### 4. Custom Input Components (shadcn/ui)

React Admin inputs are wrapped with shadcn/ui components for consistent styling:

```typescript
// src/components/admin/text-input.tsx
import { type InputProps, useInput, useResourceContext, FieldTitle } from "ra-core";
import { FormControl, FormError, FormField, FormLabel } from "@/components/admin/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type TextInputProps = InputProps & {
  multiline?: boolean;
} & React.ComponentProps<"textarea"> & React.ComponentProps<"input">;

export const TextInput = (props: TextInputProps) => {
  const resource = useResourceContext(props);
  const { label, source, multiline, className, helperText, ...rest } = props;
  const { id, field, isRequired } = useInput(props);

  return (
    <FormField id={id} className={cn(className, "w-full")} name={field.name}>
      {label !== false && (
        <FormLabel>
          <FieldTitle label={label} source={source} resource={resource} isRequired={isRequired} />
        </FormLabel>
      )}
      <FormControl>
        {multiline ? (
          <Textarea {...sanitizedProps} {...field} value={value} />
        ) : (
          <Input {...sanitizedProps} {...field} value={value} />
        )}
      </FormControl>
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  );
};
```

#### 5. Unified DataProvider Integration

All React Admin data operations flow through the unified provider:

```typescript
// src/atomic-crm/providers/supabase/unifiedDataProvider.ts (excerpt)
import { supabaseDataProvider } from "ra-supabase-core";
import type { DataProvider, GetListParams, GetListResult } from "ra-core";

const baseDataProvider = supabaseDataProvider({
  instanceUrl: import.meta.env.VITE_SUPABASE_URL,
  apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseClient: supabase,
});

export const unifiedDataProvider: DataProvider = {
  async getList<RecordType extends RaRecord>(
    resource: string,
    params: GetListParams
  ): Promise<GetListResult<RecordType>> {
    return wrapMethod("getList", resource, params, async () => {
      // 1. Validate and clean filters
      processedParams.filter = validationService.validateFilters(resource, processedParams.filter);

      // 2. Apply search parameters and soft delete filtering
      const searchParams = applySearchParams(resource, processedParams);

      // 3. Route to appropriate database resource
      const dbResource = getDatabaseResource(resource, "list");

      // 4. Execute via base Supabase provider
      const result = await baseDataProvider.getList(dbResource, searchParams);

      // 5. Normalize response data
      return { ...result, data: normalizeResponseData(resource, result.data) };
    });
  },
  // ... create, update, delete follow same pattern
};
```

## Consequences

### Positive

1. **Rapid Development**: Resource definition is declarative; CRUD operations work immediately
2. **Form Handling**: react-hook-form integration eliminates 90% of form boilerplate
3. **Type Safety**: TypeScript types flow from Zod schemas through forms to API
4. **Customizable UI**: shadcn/ui components replace Material-UI without ejecting
5. **Code Splitting**: Lazy-loaded resources improve initial load time
6. **Error Isolation**: ResourceErrorBoundary prevents cascading failures
7. **State Management**: React Query integration provides caching and optimistic updates

### Negative

1. **Learning Curve**: React Admin has concepts (DataProvider, AuthProvider, Resource) that require understanding
2. **Version Lock-in**: Major React Admin upgrades may require significant migration effort
3. **Custom Component Maintenance**: shadcn/ui wrapper components must be updated when React Admin internals change
4. **Bundle Size**: Framework adds ~200KB gzipped (acceptable for admin app)

### Neutral

1. **Opinionated Structure**: Feature directories follow React Admin conventions
2. **Hook Dependencies**: Many custom components depend on React Admin hooks (`useInput`, `useResourceContext`)
3. **i18n Integration**: Uses `ra-i18n-polyglot` which may differ from other i18n solutions

## Anti-Patterns

### Direct Supabase Imports in Components

```typescript
// WRONG: Bypasses DataProvider validation and logging
import { supabase } from "@/providers/supabase/supabase";

function MyComponent() {
  const handleCreate = async (data) => {
    await supabase.from("contacts").insert(data); // NO!
  };
}
```

### Correct Pattern

```typescript
// RIGHT: Use React Admin hooks that go through DataProvider
import { useDataProvider, useCreate } from "react-admin";

function MyComponent() {
  const [create] = useCreate();

  const handleCreate = async (data) => {
    await create("contacts", { data }); // Validated, logged, secure
  };
}
```

### Form Validation in Components

```typescript
// WRONG: Validation belongs at API boundary only
<TextInput source="email" validate={email()} />
```

### Correct Pattern

```typescript
// RIGHT: No validate prop; Zod validates in DataProvider
<TextInput source="email" />

// Validation happens in unifiedDataProvider.create():
// await validateData(resource, data, "create");
```

### Hardcoded Form Defaults

```typescript
// WRONG: Defaults should come from Zod schema
const formDefaults = {
  stage: "new_lead",
  priority: "medium",
};
```

### Correct Pattern

```typescript
// RIGHT: Extract defaults from schema
const formDefaults = opportunitySchema.partial().parse({});
```

## Key Files

| File | Purpose |
|------|---------|
| `src/atomic-crm/root/CRM.tsx` | Application bootstrap, resource registration |
| `src/components/admin/admin.tsx` | Custom Admin component wrapping ra-core |
| `src/atomic-crm/*/resource.tsx` | Resource definitions (list, edit, create, show) |
| `src/components/admin/*.tsx` | shadcn/ui wrappers for React Admin inputs |
| `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` | Single DataProvider entry point |
| `src/components/ResourceErrorBoundary.tsx` | Error isolation for resources |

## Related ADRs

- **[ADR-001: Unified Data Provider](./ADR-001-unified-data-provider.md)** - How DataProvider integrates with Supabase
- **[ADR-002: Zod Validation at API Boundary](./ADR-002-zod-api-boundary.md)** - Why validation happens in DataProvider, not forms
- **[ADR-007: Soft Delete Pattern](./ADR-007-soft-delete-pattern.md)** - How soft deletes are handled in DataProvider

## References

- React Admin Documentation: https://marmelab.com/react-admin/
- ra-supabase-core: https://github.com/marmelab/ra-supabase
- shadcn/ui: https://ui.shadcn.com/
- Engineering Constitution: `CLAUDE.md`
