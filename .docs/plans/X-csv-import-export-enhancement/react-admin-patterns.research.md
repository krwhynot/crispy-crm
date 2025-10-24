# React Admin Patterns Research

Comprehensive analysis of React Admin integration patterns used in Atomic CRM, focusing on data flow, list context management, export/import capabilities, and resource registration.

## Relevant Files

- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Unified data provider with validation and transformation layers
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/root/CRM.tsx`: Root component where resources are registered
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactList.tsx`: Complete list implementation with exporter
- `/home/krwhynot/projects/crispy-crm/src/components/admin/export-button.tsx`: Export button component
- `/home/krwhynot/projects/crispy-crm/src/components/admin/list.tsx`: List component wrapper
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/index.ts`: Resource module export pattern
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/dataProviderUtils.ts`: Filter transformation utilities
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/filterRegistry.ts`: Valid filter field definitions
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/services/ValidationService.ts`: Centralized validation service
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/contacts.ts`: Contact Zod schemas
- `/home/krwhynot/projects/crispy-crm/src/hooks/useBulkExport.tsx`: Bulk export hook for selected records

## Architectural Patterns

### 1. Data Provider Pattern

**Architecture Overview:**
The data provider is the single source of truth for all database operations. It follows a layered architecture with validation, transformation, and error handling.

**Core Implementation:**
```typescript
// unifiedDataProvider.ts
export const unifiedDataProvider: DataProvider = {
  async getList(resource: string, params: GetListParams): Promise<any> {
    return wrapMethod("getList", resource, params, async () => {
      // 1. Filter Validation - Clean stale cached filters
      if (processedParams.filter) {
        processedParams.filter = validationService.validateFilters(resource, processedParams.filter);
      }

      // 2. Search Parameter Application - Transform array filters
      const searchParams = applySearchParams(resource, processedParams);

      // 3. Database Resource Selection - Use summary views for optimized queries
      const dbResource = getDatabaseResource(resource, "list");

      // 4. Query Execution
      const result = await baseDataProvider.getList(dbResource, searchParams);

      // 5. Response Normalization - Ensure JSONB arrays are properly formatted
      return {
        ...result,
        data: normalizeResponseData(resource, result.data),
      };
    });
  },

  async create(resource: string, params: CreateParams): Promise<any> {
    return wrapMethod("create", resource, params, async () => {
      // 1. Validate FIRST (original field names)
      // 2. Transform SECOND (file uploads, field renames, timestamps)
      const processedData = await processForDatabase(resource, params.data, "create");

      // 3. Special handling for specific resources (opportunities, segments)
      if (resource === "opportunities" && processedData.products_to_sync) {
        // Use RPC for atomic operations
        const { data, error } = await supabase.rpc("sync_opportunity_with_products", {...});
        if (error) throw error;
        return { data };
      }

      // 4. Execute create
      return await baseDataProvider.create(dbResource, { ...params, data: processedData });
    });
  }
};
```

**Key Design Decisions:**

1. **wrapMethod Pattern**: All methods wrapped with error logging and validation error formatting
   - Logs errors with context (method, resource, params)
   - Transforms Zod validation errors to React Admin format: `{ message, errors: { field: message } }`
   - Handles idempotent deletes (React Admin's undoable mode)

2. **Filter Validation Flow**:
   ```typescript
   // Step 1: Validate filters BEFORE search params
   processedParams.filter = validationService.validateFilters(resource, processedParams.filter);

   // Step 2: Apply search parameters (uses cleaned filters)
   const searchParams = applySearchParams(resource, processedParams);
   ```

3. **Array Filter Transformation**:
   ```typescript
   // JSONB array fields (tags, email, phone) use @cs (contains)
   { tags: [1, 2, 3] } → { "tags@cs": "{1,2,3}" }

   // Regular enum/text fields use @in
   { status: ["active", "pending"] } → { "status@in": "(active,pending)" }
   ```

4. **Database Resource Selection**:
   - List/Show operations use summary views when available (`contacts_summary`, `organizations_summary`)
   - Create/Update/Delete use base tables
   - Views already handle soft delete filtering internally

5. **Validation Then Transformation** (Critical Pattern):
   ```typescript
   async function processForDatabase(resource, data, operation) {
     // VALIDATE FIRST (original field names like 'products')
     await validateData(resource, data, operation);

     // TRANSFORM SECOND (renames to 'products_to_sync', file uploads, timestamps)
     const processedData = await transformData(resource, data);

     return processedData;
   }
   ```

**Service Layer Decomposition:**
- `ValidationService`: Zod schema validation at API boundary
- `TransformService`: Field transformations (file uploads, renames, timestamps)
- `StorageService`: Supabase storage operations
- `SalesService`, `OpportunitiesService`, `ActivitiesService`, `JunctionsService`: Domain-specific logic

**Error Handling Gotchas:**
- Supabase errors need field extraction: `error.details` parsing for inline field errors
- Validation errors must include both `message` and `errors` object
- Idempotent deletes: Return `{ data: params.previousData }` for already-deleted resources

---

### 2. List Context Pattern

**useListContext Hook**:
React Admin's `useListContext` provides centralized state management for list operations. All list-related components access this shared context.

**Available Context Values:**
```typescript
const {
  data,              // Array of records from getList
  isPending,         // Loading state
  filterValues,      // Current filter values
  filter,            // Additional filters (merged with filterValues)
  sort,              // Current sort { field, order }
  total,             // Total count (for pagination)
  resource,          // Current resource name
  exporter,          // Exporter function from List component
  selectedIds,       // Selected record IDs (for bulk actions)
  onToggleItem,      // Toggle selection for a record
} = useListContext();
```

**Usage Pattern in ContactList**:
```typescript
// ContactList.tsx - List Setup
export const ContactList = () => {
  // Clean up stale cached filters on mount
  useFilterCleanup('contacts');

  return (
    <List
      title={false}
      actions={<ContactListActions />}
      perPage={25}
      sort={{ field: "last_seen", order: "DESC" }}
      exporter={exporter}  // Passed to context
    >
      <ContactListLayout />
    </List>
  );
};

// ContactListLayout - Conditional Rendering
const ContactListLayout = () => {
  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (!data?.length && !hasFilters) return <ContactEmpty />;

  return (
    <div className="flex flex-row gap-6">
      <ContactListFilter />
      <Card>
        <ContactListContent />
      </Card>
      <BulkActionsToolbar />
    </div>
  );
};

// ContactListContent - Record Iteration
const ContactListContent = () => {
  const { data: contacts, isPending, selectedIds, onToggleItem } = useListContext<Contact>();

  return (
    <div className="space-y-2">
      {contacts.map((contact) => (
        <RecordContextProvider key={contact.id} value={contact}>
          <Checkbox
            checked={selectedIds.includes(contact.id)}
            onCheckedChange={() => onToggleItem(contact.id)}
          />
          {/* Contact card UI */}
        </RecordContextProvider>
      ))}
    </div>
  );
};
```

**Filter Cleanup Pattern**:
The codebase uses a specialized hook to prevent stale cached filters:

```typescript
// useFilterCleanup.ts
export const useFilterCleanup = (resource: string) => {
  const [, storeApi] = useStore();

  useEffect(() => {
    // Key matches store name in CRM.tsx: localStorageStore(undefined, "CRM")
    const key = `RaStoreCRM.${resource}.listParams`;
    const storedParams = localStorage.getItem(key);

    // Validate each filter field against filterRegistry
    for (const filterKey in params.filter) {
      if (isValidFilterField(resource, filterKey)) {
        cleanedFilter[filterKey] = params.filter[filterKey];
      } else {
        console.warn(`Stale filter "${filterKey}" removed`);
        modified = true;
      }
    }

    // Update both localStorage and React Admin store
    if (modified) {
      localStorage.setItem(key, JSON.stringify(params));
      storeApi.setItem(key, params);
    }
  }, [resource, storeApi]);
};
```

**Integration with ExportButton**:
```typescript
// ExportButton.tsx
export const ExportButton = (props) => {
  const {
    filter, filterValues, resource, sort, exporter: exporterFromContext, total
  } = useListContext();

  const exporter = customExporter || exporterFromContext;

  const handleClick = useCallback(() => {
    dataProvider
      .getList(resource, {
        sort,
        filter: filter ? { ...filterValues, ...filter } : filterValues,
        pagination: { page: 1, perPage: maxResults },
      })
      .then(({ data }) =>
        exporter && exporter(data, fetchRelatedRecords(dataProvider), dataProvider, resource)
      );
  }, [dataProvider, exporter, filter, filterValues, resource, sort]);

  return <Button onClick={handleClick} disabled={total === 0}>Export</Button>;
};
```

**Key Gotchas:**
- `useListContext` must be used within `<ListBase>` or `<List>` component
- Filter values are cached in localStorage with key `RaStore{storeName}.{resource}.listParams`
- Summary views (e.g., `contacts_summary`) have pre-filtered results - don't add `deleted_at` filter
- `RecordContextProvider` required for nested components to access individual record data

---

### 3. Exporter Pattern

**Architecture Overview:**
Exporters are functions that transform list data into CSV format, fetching related records as needed. They integrate with React Admin's `fetchRelatedRecords` utility for efficient relationship loading.

**Type Signature:**
```typescript
type Exporter<RecordType extends RaRecord = RaRecord> = (
  data: RecordType[],
  fetchRelatedRecords: FetchRelatedRecords,
  dataProvider: DataProvider,
  resource?: string
) => void | Promise<void>;

type FetchRelatedRecords = <T extends RaRecord = RaRecord>(
  records: any[],
  field: string,
  resource: string
) => Promise<Record<Identifier, T>>;
```

**Complete ContactList Exporter Example**:
```typescript
// ContactList.tsx
const exporter: Exporter<Contact> = async (records, fetchRelatedRecords) => {
  // 1. Fetch related records (sales, tags, organizations)
  const sales = await fetchRelatedRecords<Sale>(records, "sales_id", "sales");
  const tags = await fetchRelatedRecords<Tag>(records, "tags", "tags");

  // 2. Collect organization IDs from all contacts' organizations arrays
  const organizationIds = Array.from(
    new Set(
      records.flatMap((contact) =>
        contact.organizations?.map((org) => org.organization_id) || []
      )
    )
  );

  // 3. Fetch organizations (if any exist)
  const organizations = organizationIds.length > 0
    ? await fetchRelatedRecords<Organization>(
        organizationIds.map((id) => ({ id, organization_id: id })),
        "organization_id",
        "organizations"
      )
    : {};

  // 4. Transform records for export
  const contacts = records.map((contact) => {
    const primaryOrganization = contact.organizations?.find((org) => org.is_primary);

    return {
      ...contact,
      // Flatten relationships
      company: primaryOrganization?.organization_id
        ? organizations[primaryOrganization.organization_id]?.name
        : undefined,
      sales: `${sales[contact.sales_id].first_name} ${sales[contact.sales_id].last_name}`,
      tags: contact.tags.map((tagId) => tags[tagId].name).join(", "),

      // Flatten JSONB arrays to multiple columns
      email_work: contact.email?.find((email) => email.type === "Work")?.email,
      email_home: contact.email?.find((email) => email.type === "Home")?.email,
      email_other: contact.email?.find((email) => email.type === "Other")?.email,
      email: JSON.stringify(contact.email),  // Full array as JSON

      phone_work: contact.phone?.find((phone) => phone.type === "Work")?.number,
      phone_home: contact.phone?.find((phone) => phone.type === "Home")?.number,
      phone_other: contact.phone?.find((phone) => phone.type === "Other")?.number,
      phone: JSON.stringify(contact.phone),  // Full array as JSON

      // Multi-organization fields
      organizations: JSON.stringify(contact.organizations),
      total_organizations: contact.organizations?.length || 0,

      // Clean up internal fields
      email_fts: undefined,
      phone_fts: undefined,
    };
  });

  // 5. Convert to CSV and download
  return jsonExport(contacts, {}, (_err: any, csv: string) => {
    downloadCSV(csv, "contacts");
  });
};
```

**fetchRelatedRecords Implementation Pattern**:
```typescript
// React Admin's fetchRelatedRecords creates a curried function
const fetchRelatedRecords = (dataProvider: DataProvider) =>
  async <T extends RaRecord>(records: any[], field: string, resource: string) => {
    // Extract IDs from the field
    const ids = records
      .map(record => record[field])
      .filter(Boolean)
      .flat();  // Handles both single values and arrays

    // Fetch related records
    const { data } = await dataProvider.getMany(resource, { ids });

    // Return as lookup object { id: record }
    return data.reduce((acc, record) => {
      acc[record.id] = record;
      return acc;
    }, {} as Record<Identifier, T>);
  };
```

**Bulk Export Pattern** (from useBulkExport.tsx):
```typescript
// Export selected records only
export function useBulkExport(props) {
  const { exporter: customExporter } = props;
  const { exporter: exporterFromContext, selectedIds } = useListContext();
  const exporter = customExporter || exporterFromContext;

  const bulkExport = useCallback(() => {
    if (exporter && resource) {
      dataProvider
        .getMany(resource, { ids: selectedIds })  // Fetch only selected
        .then(({ data }) =>
          exporter(data, fetchRelatedRecords(dataProvider), dataProvider, resource)
        );
    }
  }, [dataProvider, exporter, selectedIds]);

  return { bulkExport };
}
```

**Key Patterns:**

1. **Relationship Fetching**: Use `fetchRelatedRecords` for efficient bulk loading
   - Returns lookup object `{ id: record }` for O(1) access
   - Handles both single foreign keys and array relationships

2. **JSONB Array Flattening**:
   - Create separate columns for common types (Work, Home, Other)
   - Include full JSON array for complete data preservation
   - Remove full-text search fields (`email_fts`, `phone_fts`)

3. **Multi-Relationship Handling**:
   - Flatten arrays to find primary relationships
   - Store full relationship arrays as JSON strings
   - Include count fields for analysis

4. **CSV Generation**:
   - Use `jsonexport` library (imported as `jsonExport`)
   - Use `downloadCSV(csv, filename)` from `ra-core`

**Gotchas:**
- `fetchRelatedRecords` is a function that returns a function (curried)
- Array fields need `.flat()` when extracting IDs
- Summary views may include computed fields not present in base tables
- Empty arrays should default to `[]` to avoid undefined errors

---

### 4. Resource Registration Pattern

**CRM.tsx Root Component**:
```typescript
// CRM.tsx
export const CRM = ({
  dataProvider = supabaseDataProvider,
  authProvider = supabaseAuthProvider,
  title = defaultTitle,
  opportunityStages = defaultOpportunityStages,
  ...rest
}: CRMProps) => {
  return (
    <ConfigurationProvider
      title={title}
      opportunityStages={opportunityStages}
      // ... other config
    >
      <Admin
        dataProvider={dataProvider}
        authProvider={authProvider}
        store={localStorageStore(undefined, "CRM")}  // localStorage key prefix
        layout={Layout}
        loginPage={StartPage}
        dashboard={Dashboard}
      >
        {/* Resources registered with lazy-loaded modules */}
        <Resource name="opportunities" {...opportunities} />
        <Resource name="contacts" {...contacts} />
        <Resource name="organizations" {...organizations} />
        <Resource name="products" {...products} />

        {/* Resources without UI (used by ReferenceFields) */}
        <Resource name="contactNotes" />
        <Resource name="opportunityNotes" />
        <Resource name="tasks" />
        <Resource name="sales" {...sales} />
        <Resource name="tags" />
        <Resource name="segments" />
      </Admin>
    </ConfigurationProvider>
  );
};
```

**Resource Module Pattern** (contacts/index.ts):
```typescript
// contacts/index.ts
import * as React from "react";
import type { Contact } from "../types";

// Lazy load all resource components
const ContactList = React.lazy(() => import("./ContactList"));
const ContactShow = React.lazy(() => import("./ContactShow"));
const ContactEdit = React.lazy(() => import("./ContactEdit"));
const ContactCreate = React.lazy(() => import("./ContactCreate"));

// Export object matching React Admin's Resource props
export default {
  list: ContactList,
  show: ContactShow,
  edit: ContactEdit,
  create: ContactCreate,
  recordRepresentation: (record: Contact) =>
    record?.first_name + " " + record?.last_name,
};
```

**recordRepresentation Pattern**:
Used for displaying records in `ReferenceField` and autocomplete inputs:

```typescript
// contacts/index.ts
recordRepresentation: (record: Contact) =>
  record?.first_name + " " + record?.last_name

// organizations/index.ts (Note: No recordRepresentation in this file)
// Fallback: React Admin uses `name` field if no recordRepresentation

// opportunities/index.ts (No recordRepresentation)
// Fallback: React Admin uses `name` field
```

**Resource-less Registration**:
Resources without CRUD pages can still be registered for `ReferenceField` usage:

```typescript
<Resource name="contactNotes" />
<Resource name="tags" />
<Resource name="segments" />
```

**Configuration Context Pattern**:
Customization through props to `<CRM>`:

```typescript
// App.tsx
<CRM
  title="My Custom CRM"
  opportunityStages={[
    { value: 'lead', label: 'New Lead' },
    { value: 'qualified', label: 'Qualified' }
  ]}
  contactGender={[
    { value: 'male', label: 'He/Him' }
  ]}
/>

// Accessed in components via ConfigurationContext
const { opportunityStages, contactGender } = useConfiguration();
```

**Key Patterns:**

1. **Lazy Loading**: All resource components use `React.lazy()` for code splitting
2. **Module Exports**: Each resource exports an object with `{ list, show, edit, create, recordRepresentation }`
3. **Resource Naming**: Must match database table/view names (handled by `resources.ts` mapping)
4. **Store Configuration**: `localStorageStore(undefined, "CRM")` creates keys like `RaStoreCRM.{resource}.listParams`

**Gotchas:**
- `recordRepresentation` is optional - React Admin falls back to `record.name` then `record.id`
- Resource name in `<Resource name="...">` must match the key in `RESOURCE_MAPPING`
- Resources without UI still need registration if used in `ReferenceField`
- Configuration context values are NOT validated - components must handle undefined values

---

## Integration Patterns

### Validation Flow

**Single Source of Truth - Zod at API Boundary:**

```typescript
// Validation Service Pattern
export class ValidationService {
  private validationRegistry: Record<string, ValidationHandlers> = {
    contacts: {
      create: async (data) => validateContactForm(data),
      update: async (data) => validateUpdateContact(data),
    },
    // ... other resources
  };

  async validate(resource, method, data) {
    const validator = this.validationRegistry[resource];
    if (!validator) return;  // No validation configured

    if (method === "create" && validator.create) {
      await validator.create(data);
    } else if (method === "update" && validator.update) {
      await validator.update(data);
    }
  }
}

// Zod Schema Pattern (contacts.ts)
export const contactSchema = z.object({
  first_name: z.string().optional().nullable(),
  email: z.array(emailAndTypeSchema).default([]),
  // ... other fields
}).superRefine((data, ctx) => {
  // Custom validation logic
  if (!data.name && !data.first_name && !data.last_name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["name"],
      message: "Either name or first_name/last_name must be provided",
    });
  }
});

// Error Formatting for React Admin
export async function validateContactForm(data) {
  try {
    contactSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });

      throw {
        message: "Validation failed",
        errors: formattedErrors,  // React Admin expects this format
      };
    }
    throw error;
  }
}
```

**Filter Validation Pattern:**

```typescript
// filterRegistry.ts - Define valid filter fields per resource
export const filterableFields: Record<string, string[]> = {
  contacts: [
    "id", "first_name", "last_name", "email", "phone",
    "sales_id", "organization_id", "tags", "q"
  ],
  // ... other resources
};

export function isValidFilterField(resource: string, filterKey: string): boolean {
  const allowedFields = filterableFields[resource];

  // Handle PostgREST logical operators
  if (['@or', '@and', '@not'].includes(filterKey)) return true;

  // Extract base field (handles operators like @gte, @lte)
  const baseField = filterKey.split('@')[0];
  return allowedFields.includes(baseField) || allowedFields.includes(filterKey);
}

// ValidationService.validateFilters() - Called in unifiedDataProvider.getList()
validateFilters(resource: string, filters: Record<string, any>) {
  const cleanedFilters: Record<string, any> = {};

  for (const filterKey in filters) {
    if (isValidFilterField(resource, filterKey)) {
      cleanedFilters[filterKey] = filters[filterKey];
    } else {
      console.warn(`Invalid filter "${filterKey}" for resource "${resource}"`);
    }
  }

  return cleanedFilters;
}
```

### Common Hooks and Utilities

**React Admin Core Hooks:**

```typescript
// List management
import { useListContext, useListController } from 'ra-core';

// Record context
import { RecordContextProvider, useRecordContext } from 'ra-core';

// Data fetching
import { useDataProvider, useGetList, useGetOne, useGetMany } from 'ra-core';

// Reference fields
import { useReference, useReferenceArrayFieldController } from 'ra-core';

// Notifications
import { useNotify } from 'ra-core';

// Authentication
import { useGetIdentity } from 'ra-core';

// Store management
import { useStore } from 'ra-core';
```

**Export Utilities:**

```typescript
import { downloadCSV, fetchRelatedRecords } from 'ra-core';
import jsonExport from 'jsonexport/dist';

// Usage
jsonExport(data, {}, (_err, csv) => {
  downloadCSV(csv, 'filename');
});
```

**Custom Hooks:**

```typescript
// useFilterCleanup - Clean stale cached filters
import { useFilterCleanup } from '../hooks/useFilterCleanup';
useFilterCleanup('contacts');

// useBulkExport - Export selected records
import { useBulkExport } from '@/hooks/useBulkExport';
const { bulkExport } = useBulkExport({ exporter });
```

### Resource-Based Routing

React Admin automatically creates routes based on resource registration:

```typescript
// Resource registration creates these routes:
<Resource name="contacts" {...contacts} />

// Routes:
// /contacts              → ContactList
// /contacts/create       → ContactCreate
// /contacts/:id          → ContactEdit
// /contacts/:id/show     → ContactShow
```

**Link Pattern:**
```typescript
// Manual links using React Router
import { Link } from 'react-router-dom';

<Link to={`/contacts/${contact.id}/show`}>
  {contact.first_name} {contact.last_name}
</Link>

// Programmatic navigation
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate(`/contacts/${id}/show`);
```

---

## Gotchas & Edge Cases

### Data Provider Layer

1. **Validate Then Transform Order** (Critical):
   - Validation must run FIRST with original field names
   - Transformation runs SECOND (field renames, file uploads)
   - Reversing this order breaks validation (Issue 0.4)

2. **Filter Validation**:
   - Must happen BEFORE `applySearchParams()`
   - Stale cached filters can reference deleted columns
   - Summary views already filter soft-deleted records - don't add `deleted_at@is` filter

3. **Array Filter Transformation**:
   - JSONB arrays (tags, email, phone) use `@cs` operator
   - Regular fields use `@in` operator
   - Empty arrays should be skipped entirely

4. **Database Resource Selection**:
   - List/Show: Use summary views (`contacts_summary`)
   - Create/Update/Delete: Use base tables (`contacts`)
   - getManyReference: Uses base tables (pass `useView=false`)

5. **Idempotent Deletes**:
   - React Admin's undoable mode deletes UI records before API call
   - If resource already deleted, return `{ data: params.previousData }`
   - Don't throw error for "Cannot coerce the result to a single JSON object"

### List Context

1. **Filter Caching**:
   - Filters cached in localStorage with key `RaStore{storeName}.{resource}.listParams`
   - Schema changes can leave stale filters referencing deleted columns
   - Use `useFilterCleanup()` hook to clean on mount

2. **Context Scope**:
   - `useListContext` only works inside `<List>` or `<ListBase>`
   - Nested components need `RecordContextProvider` for individual records

3. **Summary Views**:
   - Pre-filtered for soft-deleted records
   - Computed fields may not exist in base tables
   - Don't add redundant filters

### Exporter Pattern

1. **fetchRelatedRecords is Curried**:
   ```typescript
   // Correct usage
   const fetch = fetchRelatedRecords(dataProvider);
   const sales = await fetch<Sale>(records, "sales_id", "sales");

   // Wrong - missing dataProvider curry
   const sales = await fetchRelatedRecords<Sale>(records, "sales_id", "sales");
   ```

2. **Array Relationships**:
   - Must flatten and dedupe IDs before fetching
   - Map records with array IDs to objects for fetchRelatedRecords
   ```typescript
   const organizationIds = Array.from(
     new Set(records.flatMap(contact =>
       contact.organizations?.map(org => org.organization_id) || []
     ))
   );
   const orgs = await fetchRelatedRecords(
     organizationIds.map(id => ({ id, organization_id: id })),
     "organization_id",
     "organizations"
   );
   ```

3. **JSONB Array Flattening**:
   - Create separate columns for common types
   - Include full JSON for data preservation
   - Remove full-text search fields

### Resource Registration

1. **Resource Name Mapping**:
   - `<Resource name="...">` must match `RESOURCE_MAPPING` key
   - Database table/view name may differ (handled by `getResourceName()`)

2. **recordRepresentation**:
   - Optional - falls back to `record.name` then `record.id`
   - Used in `ReferenceField` and autocomplete inputs
   - Must handle null/undefined values

3. **Lazy Loading**:
   - All resource components should use `React.lazy()`
   - Reduces initial bundle size
   - Suspense boundaries handled by React Admin

4. **Store Configuration**:
   - `localStorageStore(undefined, "CRM")` sets prefix
   - All localStorage keys use pattern `RaStoreCRM.{resource}.{key}`
   - Critical for `useFilterCleanup` to find correct keys

---

## Relevant Docs

### Internal Documentation
- [Engineering Constitution](/home/krwhynot/projects/crispy-crm/docs/claude/engineering-constitution.md) - Core principles including "Zod at API boundary only"
- [Architecture Essentials](/home/krwhynot/projects/crispy-crm/docs/claude/architecture-essentials.md) - System design patterns
- [Common Tasks](/home/krwhynot/projects/crispy-crm/docs/claude/common-tasks.md) - Adding new resources guide
- [Supabase Workflow](/home/krwhynot/projects/crispy-crm/docs/supabase/WORKFLOW.md) - Database operations

### External Documentation
- [React Admin DataProvider](https://marmelab.com/react-admin/DataProviders.html) - Official data provider guide
- [React Admin List View](https://marmelab.com/react-admin/List.html) - List component documentation
- [React Admin useListContext](https://marmelab.com/react-admin/useListContext.html) - List context hook API
- [Zod Documentation](https://zod.dev/) - Schema validation library
- [PostgREST API Reference](https://postgrest.org/en/stable/api.html) - Query operators and filtering
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction) - Database operations
