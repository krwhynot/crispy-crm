# React Admin Architecture Patterns Research

Comprehensive analysis of React Admin patterns used in the Atomic CRM codebase, focusing on resource registration, data provider integration, form components, list components, and validation flow.

## Relevant Files

### Core Architecture
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx`: Main application entry point, resource registration
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Unified data provider with validation and transformations (870 lines)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/services/ValidationService.ts`: Centralized validation service (160 lines)

### Resource Registration
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/index.ts`: Opportunity resource config (lazy-loaded components)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/index.ts`: Contact resource config with recordRepresentation

### Create/Edit Components
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCreate.tsx`: Create pattern with index management and transform
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactCreate.tsx`: Simpler create pattern with transform
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityEdit.tsx`: Edit pattern with tabs and products RPC
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityInputs.tsx`: Shared form inputs across create/edit

### List Components
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`: Complex list with kanban, localStorage preferences, dynamic filters
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactList.tsx`: List with sidebar filters, custom exporter
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactListFilter.tsx`: Sidebar filter component with FilterLiveForm

### Admin Layer Components
- `/home/krwhynot/Projects/atomic/src/components/admin/text-input.tsx`: Base input with React Admin integration
- `/home/krwhynot/Projects/atomic/src/components/admin/simple-form.tsx`: Form wrapper with toolbar
- `/home/krwhynot/Projects/atomic/src/components/admin/form.tsx`: Form context, field components, SaveButton with validation error handling
- `/home/krwhynot/Projects/atomic/src/components/admin/list.tsx`: List wrapper with breadcrumb, filters, pagination

### Validation Layer
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`: Zod schemas for opportunities (218 lines)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/contacts.ts`: Zod schemas for contacts with multi-org validation (373 lines)

## Architectural Patterns

### 1. Resource Registration Pattern

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx` (lines 147-156)

Resources are registered using React Admin's `<Resource>` component within the `<Admin>` wrapper:

```tsx
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
>
  <Resource name="opportunities" {...opportunities} />
  <Resource name="contacts" {...contacts} />
  <Resource name="organizations" {...organizations} />
  <Resource name="products" {...products} />
  <Resource name="contactNotes" />
  <Resource name="opportunityNotes" />
  <Resource name="tasks" />
  <Resource name="sales" {...sales} />
  <Resource name="tags" />
</Admin>
```

**Pattern**: Resources are imported as objects containing lazy-loaded components:

```tsx
// src/atomic-crm/opportunities/index.ts
export default {
  list: OpportunityList,
  create: OpportunityCreate,
  edit: OpportunityEdit,
  show: OpportunityShow,
};
```

**Testing Implications**:
- Resource registration needs to be tested for correct component mounting
- Lazy loading behavior should be verified
- Custom `recordRepresentation` functions (e.g., contacts) need testing

### 2. Data Provider Implementation

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

**Architecture**: Single unified provider that consolidates 4+ previous layers into maximum 2 layers.

**Key Methods**:
- `getList()`: Supports search params, array filters, full-text search, soft delete filtering
- `getOne()`: Special handling for opportunities with products join
- `create()`: Validation → Transform → RPC (for opportunities with products)
- `update()`: Validation → Transform → RPC with product diffing
- `delete()`: Idempotent deletion support

**Critical Flow** (lines 166-183):
```tsx
async function processForDatabase<T>(
  resource: string,
  data: Partial<T>,
  operation: "create" | "update" = "create",
): Promise<Partial<T>> {
  // CRITICAL: Validate FIRST, Transform SECOND (Issue 0.4)
  // This allows validation of original field names (e.g., 'products')
  // before transformation renames them (e.g., 'products_to_sync')

  // Validate first (original field names)
  await validateData(resource, data, operation);

  // Then apply transformations (field renames, file uploads, timestamps, etc.)
  const processedData = await transformData(resource, data, operation);

  return processedData;
}
```

**Error Handling** (lines 189-238):
- Wraps all methods with `wrapMethod()` for consistent error logging
- Converts Zod errors to React Admin format: `{ message: string, errors: { field: string } }`
- Handles idempotent deletes when resource already deleted
- Extracts field names from Supabase errors for inline display

**Special Patterns**:
1. **Opportunities with Products**: Uses RPC `sync_opportunity_with_products` for atomic operations
2. **Contacts Summary View**: Uses `contacts_summary` view for list/references, base table for mutations
3. **Soft Deletes**: Filter `deleted_at@is: null` applied automatically

**Testing Implications**:
- Mock Supabase client for isolation
- Test validation-before-transform order
- Verify error format conversion for inline field errors
- Test RPC call patterns for opportunities
- Verify resource-specific transformations

### 3. Form Component Pattern

**Pattern**: `CreateBase` or `EditBase` → `Form` → Input Components → `FormToolbar`

**Example** (`OpportunityCreate.tsx`, lines 82-129):
```tsx
<CreateBase
  mutationOptions={{ onSuccess }}
  redirect={false}
  transform={(data) => {
    // Extract products to products_to_sync field for RPC processing
    const { products, ...opportunityData } = data;
    return {
      ...opportunityData,
      products_to_sync: products || [],
    };
  }}
  mutationMode="pessimistic"
>
  <Form
    defaultValues={{
      opportunity_owner_id: identity?.id,
      contact_ids: [],
      products: [],
      index: 0,
      probability: 50,
      // ... more defaults
    }}
  >
    <Card>
      <CardContent>
        <OpportunityInputs mode="create" />
        <FormToolbar>
          <div className="flex flex-row gap-2 justify-end">
            <CancelButton />
            <SaveButton label="Create Opportunity" />
          </div>
        </FormToolbar>
      </CardContent>
    </Card>
  </Form>
</CreateBase>
```

**Key Features**:
1. **Transform Function**: Runs before data provider to rename/reshape fields
2. **Default Values**: Prefill form fields with sensible defaults
3. **Mutation Options**: Custom `onSuccess` handlers for cache invalidation
4. **Mutation Mode**: `pessimistic` ensures server-side validation before UI update

**Edit Pattern** (`OpportunityEdit.tsx`, lines 18-45):
```tsx
<EditBase
  actions={false}
  redirect="show"
  mutationMode="pessimistic"
  transform={(data) => {
    const { products, ...opportunityData } = data;
    return {
      ...opportunityData,
      products_to_sync: products || [],
    };
  }}
  mutationOptions={{
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  }}
>
  <Form
    defaultValues={{ ...record, products: record.products || [] }}
    key={record.id} // Force remount when record changes
  >
    {/* Tabs for sections */}
  </Form>
</EditBase>
```

**Testing Implications**:
- Test transform functions with various data shapes
- Verify default values are applied
- Test onSuccess cache invalidation
- Verify pessimistic mode behavior (no optimistic UI updates)
- Test form remounting on record change (key prop)

### 4. Input Components Pattern

**Location**: `src/atomic-crm/opportunities/OpportunityInputs.tsx`

**Pattern**: Shared input component used by both Create and Edit, differentiated by `mode` prop.

**Structure**:
```tsx
export const OpportunityInputs = ({ mode }: { mode: "create" | "edit" }) => {
  return (
    <div className="flex flex-col gap-2 p-3">
      <OpportunityInfoInputs mode={mode} />
      <OpportunitySalesInputs />
      <OpportunityClassificationInputs />
      <OpportunityOrganizationInputs />
      <OpportunityContactsInput />

      {/* Conditional rendering based on mode */}
      {mode === "create" && <OpportunityProductsSection />}
    </div>
  );
};
```

**Admin Layer Integration** (`src/components/admin/text-input.tsx`, lines 24-71):
```tsx
export const TextInput = (props: TextInputProps) => {
  const resource = useResourceContext(props);
  const { id, field, isRequired } = useInput(props);

  return (
    <FormField id={id} className={cn(className, "w-full")} name={field.name}>
      {label !== false && (
        <FormLabel>
          <FieldTitle label={label} source={source} resource={resource} isRequired={isRequired} />
        </FormLabel>
      )}
      <FormControl>
        {multiline ? <Textarea {...field} /> : <Input {...field} />}
      </FormControl>
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  );
};
```

**Key Features**:
1. **useInput Hook**: Connects to React Hook Form, provides field state and validation
2. **FormField/FormControl**: Context providers for error display
3. **FormError**: Automatically displays inline validation errors
4. **FieldTitle**: Auto-generates labels with required indicator

**Testing Implications**:
- Test mode-based conditional rendering
- Verify useInput integration with form context
- Test error display through FormError component
- Verify required field indicators

### 5. List Component Pattern

**Pattern**: `List` → Filter Components → `useListContext()` → Layout/Content

**Complex Example** (`OpportunityList.tsx`, lines 70-178):
```tsx
const OpportunityList = () => {
  const { identity } = useGetIdentity();
  const dataProvider = useDataProvider();
  const [contextChoices, setContextChoices] = useState([]);

  // Fetch dynamic filter choices
  useEffect(() => {
    const fetchContexts = async () => {
      const { data } = await dataProvider.getList('opportunities', {
        pagination: { page: 1, perPage: 1000 },
        filter: { "deleted_at@is": null }
      });

      // Extract unique contexts
      const uniqueContexts = [...new Set(data.map(o => o.opportunity_context).filter(Boolean))];
      setContextChoices(uniqueContexts.map(c => ({ id: c, name: c })));
    };

    fetchContexts();
  }, [dataProvider, identity]);

  return (
    <List
      perPage={100}
      filter={{ "deleted_at@is": null }}
      sort={{ field: "index", order: "DESC" }}
      filters={opportunityFilters}
      actions={<OpportunityActions />}
      pagination={null}
    >
      <FilterChipsPanel />
      <OpportunityLayout />
    </List>
  );
};

const OpportunityLayout = () => {
  const { data, isPending, filterValues } = useListContext();

  // Monitor stage filter changes and update localStorage
  useEffect(() => {
    if (filterValues?.stage) {
      updateStagePreferences(filterValues.stage);
    }
  }, [filterValues?.stage]);

  if (isPending) return null;
  if (!data?.length && !hasFilters) return <OpportunityEmpty />;

  return <OpportunityListContent />;
};
```

**Filter Patterns**:

1. **Inline Filters** (array of input components):
```tsx
const opportunityFilters = [
  <SearchInput source="q" alwaysOn />,
  <ReferenceInput source="customer_organization_id" reference="organizations">
    <AutocompleteArrayInput />
  </ReferenceInput>,
  <MultiSelectInput source="stage" choices={OPPORTUNITY_STAGE_CHOICES} />,
];
```

2. **Sidebar Filter** (`ContactListFilter.tsx`, lines 19-182):
```tsx
<div className="w-52 min-w-52">
  <FilterLiveForm>
    <SearchInput source="q" placeholder="Search..." />
  </FilterLiveForm>

  <FilterCategory label="Last activity" icon={<Clock />}>
    <ToggleFilterButton
      label="Today"
      value={{ "last_seen@gte": endOfYesterday().toISOString() }}
    />
  </FilterCategory>
</div>
```

**Key Features**:
1. **useListContext**: Provides data, loading state, filter values, pagination
2. **Dynamic Filters**: Fetch choices from data provider
3. **localStorage Integration**: Persist user preferences
4. **Filter Operators**: PostgREST operators like `@gte`, `@lte`, `@is`
5. **Custom Empty States**: Different UIs for no data vs. no results

**Testing Implications**:
- Test useListContext data flow
- Verify filter application to queries
- Test localStorage persistence
- Verify empty state rendering
- Test pagination behavior

### 6. Validation Integration

**Flow**: Form Submit → SaveButton → DataProvider.create/update → ValidationService → Zod Schema → Error Format Conversion → FormField Error Display

**Validation Service** (`ValidationService.ts`, lines 64-160):
```tsx
export class ValidationService {
  private validationRegistry: Record<string, ValidationHandlers<unknown>> = {
    contacts: {
      create: async (data: unknown) => validateContactForm(data),
      update: async (data: unknown) => validateContactForm(data),
    },
    opportunities: {
      create: async (data: unknown) => validateOpportunityForm(data),
      update: async (data: unknown) => validateOpportunityForm(data),
    },
    // ... more resources
  };

  async validate<K extends keyof ResourceTypeMap>(
    resource: K | string,
    method: DataProviderMethod,
    data: Partial<ResourceTypeMap[K]>
  ): Promise<void> {
    const validator = this.validationRegistry[resource];

    if (!validator) return; // No validation for this resource

    if (method === "create" && validator.create) {
      await validator.create(data);
    } else if (method === "update" && validator.update) {
      await validator.update(data);
    }
  }
}
```

**Zod Schema Example** (`validation/opportunities.ts`, lines 58-129):
```tsx
export const opportunitySchema = z
  .object({
    name: z.string().min(1, "Opportunity name is required"),
    contact_ids: z
      .array(z.union([z.string(), z.number()]))
      .min(1, "At least one contact is required"),
    probability: z
      .number()
      .min(0, "Probability must be between 0 and 100")
      .max(100, "Probability must be between 0 and 100")
      .default(50),
    amount: z.number().min(0, "Amount must be positive").default(0),
    expected_closing_date: z.string().min(1, "Expected closing date is required"),
    // ... more fields
  })
  .refine((data) => {
    // Check for removed legacy fields
    if ("company_id" in data) {
      throw new Error("Field 'company_id' is no longer supported.");
    }
    return true;
  });
```

**Error Format Conversion** (`unifiedDataProvider.ts`, lines 117-150):
```tsx
async function validateData(resource: string, data: any, operation: "create" | "update"): Promise<void> {
  try {
    await validationService.validate(resource, operation, data);
  } catch (error: any) {
    if (error.errors && typeof error.errors === 'object') {
      throw error; // Already formatted
    }

    if (error instanceof Error) {
      throw {
        message: error.message || "Validation failed",
        errors: { _error: error.message },
      };
    }

    throw {
      message: "Validation failed",
      errors: { _error: String(error) },
    };
  }
}
```

**Zod Validation Function** (`validation/opportunities.ts`, lines 138-159):
```tsx
export async function validateOpportunityForm(data: any): Promise<void> {
  try {
    opportunitySchema.parse(data);
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

**FormError Display** (`components/admin/form.tsx`, lines 133-151):
```tsx
const FormError = ({ className, ...props }: React.ComponentProps<"p">) => {
  const { invalid, error, formMessageId } = useFormField();

  const err = error?.root?.message ?? error?.message;
  if (!invalid || !err) {
    return null;
  }

  return (
    <p
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      <ValidationError error={err} />
    </p>
  );
};
```

**Key Features**:
1. **Single-Point Validation**: Only at API boundary (Engineering Constitution #5)
2. **Zod Schemas**: Type-safe validation with TypeScript inference
3. **Error Format**: `{ message: string, errors: { fieldName: string } }`
4. **Inline Display**: Errors shown next to fields via FormError component
5. **Nested Paths**: Support for `"email.0.email"` field paths

**Testing Implications**:
- Test Zod schema validation rules
- Verify error format conversion
- Test inline error display in forms
- Verify validation timing (before transforms)
- Test multi-field validation (superRefine)

## 🆕 API Error State Testing (Critical Gap)

### Overview

**CRITICAL GAP IDENTIFIED**: Original plan focused only on success paths. Real applications must handle data provider rejections gracefully (500 errors, RLS violations, network failures).

### Error Scenarios to Test

1. **Server Errors (500)**:
   - Data provider rejects with generic error
   - UI must display error notification/toast
   - Form remains editable for retry

2. **RLS Policy Violations**:
   - Authenticated user tries operation outside their permissions
   - Error message should be user-friendly
   - Form shows appropriate error state

3. **Network Failures**:
   - Request timeout or connection error
   - UI should indicate retry possibility
   - Don't lose user's form data

4. **Validation Errors from Server**:
   - Server-side validation fails (different from client Zod)
   - Display field-specific errors when available
   - Fall back to general error for unknown fields

### Testing Pattern (Component Tests)

```typescript
describe('OpportunityCreate - Error States', () => {
  it('displays error notification on data provider failure', async () => {
    // 🆕 CRITICAL: Test the "sad path"
    const mockDataProvider = {
      create: vi.fn().mockRejectedValue(new Error('Server error: Database connection failed'))
    };

    render(
      <AdminContext dataProvider={mockDataProvider}>
        <OpportunityCreate />
      </AdminContext>
    );

    // Fill form with valid data
    await userEvent.type(screen.getByLabelText('Opportunity Name'), 'Test Opportunity');
    await userEvent.type(screen.getByLabelText('Amount'), '50000');

    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    // Assert error notification appears
    expect(await screen.findByText(/server error/i)).toBeInTheDocument();

    // Assert form remains editable (not disabled)
    expect(screen.getByLabelText('Opportunity Name')).not.toBeDisabled();
  });

  it('displays field-specific errors from RLS violations', async () => {
    // Mock RLS violation error with field details
    const mockDataProvider = {
      create: vi.fn().mockRejectedValue({
        message: 'RLS policy violation',
        errors: {
          customer_organization_id: 'You do not have permission to create opportunities for this organization'
        }
      })
    };

    render(
      <AdminContext dataProvider={mockDataProvider}>
        <OpportunityCreate />
      </AdminContext>
    );

    // Fill and submit form
    // ...

    // Assert field-specific error displays
    expect(await screen.findByText(/you do not have permission/i)).toBeInTheDocument();
  });

  it('handles network timeout gracefully', async () => {
    const mockDataProvider = {
      create: vi.fn().mockRejectedValue(new Error('Network timeout'))
    };

    // Test that timeout doesn't crash UI
    // Test that user can retry
  });
});
```

### E2E Testing Pattern

```typescript
test('form handles server error gracefully', async ({ page }) => {
  // Mock API to return 500 error
  await page.route('**/rest/v1/opportunities', route => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    });
  });

  await page.goto('/#/opportunities/create');

  // Fill form
  await page.getByLabel('Opportunity Name').fill('Test Opportunity');
  await page.getByLabel('Amount').fill('50000');

  // Submit
  await page.getByRole('button', { name: /save/i }).click();

  // Verify error notification appears
  await expect(page.getByText(/server error/i)).toBeVisible();

  // Verify form is still editable
  await expect(page.getByLabel('Opportunity Name')).toBeEditable();
});
```

### Implementation Files to Review

- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Error handling in CRUD methods
- `/home/krwhynot/Projects/atomic/src/components/admin/form.tsx`: FormError component for displaying errors
- React Admin's notification system for toast messages

### Testing Requirements

**MANDATORY**: Every form component test suite MUST include:
1. At least one test for data provider rejection
2. At least one test for RLS violation error
3. Verification that form remains functional after error
4. Verification that user can retry after fixing issue

## Edge Cases & Gotchas

### 1. Transform Order is Critical

**Location**: `unifiedDataProvider.ts`, lines 166-183

**Issue**: Fields must be validated with original names before transforms rename them.

**Example**: Opportunity `products` field is validated, then renamed to `products_to_sync` for RPC call.

**Solution**: Always validate first, transform second in `processForDatabase()`.

### 2. Edit Forms Need `previousData.products`

**Location**: `unifiedDataProvider.ts`, lines 504-511

**Issue**: Product diffing requires previousData to compare changes.

**Error**: "Cannot update products: previousData.products is missing"

**Solution**: Ensure Edit forms fetch complete records with products joined.

### 3. Idempotent Delete Handling

**Location**: `unifiedDataProvider.ts`, lines 202-206

**Issue**: React Admin's undoable mode can delete on UI, then API call fails with "Cannot coerce result to single object".

**Solution**: Catch this error and return success response with previousData.

### 4. JSONB Array Normalization

**Location**: `dataProviderUtils.ts`, `normalizeResponseData()`

**Issue**: Supabase returns JSONB arrays as strings or null, React Admin expects arrays.

**Solution**: Normalize JSONB fields to empty arrays if null/undefined.

**Affected Fields**: `contacts.email`, `contacts.phone`, `contacts.tags`, `opportunities.products`

### 5. Filter Operators with PostgREST

**Pattern**: Use `@` operators for PostgreSQL operations:
- `"deleted_at@is": null` → `deleted_at IS NULL`
- `"last_seen@gte": date` → `last_seen >= date`
- `"nb_tasks@gt": 0` → `nb_tasks > 0`

**Gotcha**: Standard filter syntax `{ field: value }` does equality only.

### 6. Resource Name vs Database Table

**Locations**: `resources.ts`, `dataProviderUtils.ts`

**Pattern**:
- List operations may use views (e.g., `contacts_summary`)
- Mutations always use base tables (e.g., `contacts`)
- RPC functions have custom names (e.g., `sync_opportunity_with_products`)

**Function**: `getDatabaseResource(resource, operation)` maps resource names to correct targets.

### 7. Form Remounting on Record Change

**Location**: `OpportunityEdit.tsx`, line 61

**Pattern**: `<Form key={record.id}>`

**Reason**: Forces form to reinitialize defaultValues when navigating between records without unmounting the Edit component.

**Gotcha**: Without this, form retains old record's data when switching records.

### 8. localStorage Filter Persistence

**Location**: `OpportunityList.tsx`, lines 31-68

**Issue**: Filters persist across sessions, but stale values can break UI.

**Example**: Removed `status` field still in localStorage causes errors.

**Solution**: Clean up invalid cached filters in `useEffect` (see `ContactList.tsx`, lines 23-41).

### 9. Validation Error Format

**React Admin expects**:
```typescript
{
  message: string,
  errors: {
    fieldName: string,
    "nested.0.field": string
  }
}
```

**Zod provides**:
```typescript
{
  issues: [
    { path: ["fieldName"], message: "error" }
  ]
}
```

**Conversion required**: Join path with `.` and build errors object.

### 10. Multi-Organization Contact Validation

**Location**: `validation/contacts.ts`, lines 171-234

**Complex Rules**:
1. At least one organization (can be skipped during creation)
2. Exactly one primary organization (enforced via `superRefine`)
3. Each organization needs `organization_id`
4. Email validation for array of email objects

**Gotcha**: `superRefine` allows custom validation logic across multiple fields.

## Testing Strategy Recommendations

### Unit Tests

1. **Validation Service**
   - Test each Zod schema with valid/invalid data
   - Verify error format conversion
   - Test legacy field rejection

2. **Data Provider Methods**
   - Mock Supabase client
   - Test validation-before-transform order
   - Verify RPC call patterns
   - Test error handling and format conversion

3. **Input Components**
   - Test useInput integration
   - Verify error display
   - Test required field indicators
   - Test conditional rendering (mode prop)

### Integration Tests

1. **Create Flow**
   - Submit valid form data
   - Verify validation errors display inline
   - Test transform function execution
   - Verify onSuccess cache invalidation

2. **Edit Flow**
   - Load existing record
   - Modify and submit
   - Verify previousData handling
   - Test form remounting on record change

3. **List Flow**
   - Test filter application
   - Verify pagination
   - Test empty states
   - Test localStorage persistence

### E2E Tests

1. **Full CRUD Cycle**
   - Create → List → Show → Edit → Delete
   - Verify data persistence
   - Test navigation between views

2. **Validation Flow**
   - Submit invalid form
   - Verify inline errors
   - Correct errors
   - Verify successful submission

3. **Filter Interactions**
   - Apply multiple filters
   - Verify query parameters
   - Test filter persistence
   - Clear filters

## Component Testing Patterns

### 1. Test CreateBase/EditBase Wrappers

Mock the data provider and verify transform/mutationOptions:

```tsx
const mockDataProvider = {
  create: vi.fn(),
  update: vi.fn(),
  // ... other methods
};

test('OpportunityCreate transforms products field', async () => {
  render(
    <AdminContext dataProvider={mockDataProvider}>
      <OpportunityCreate />
    </AdminContext>
  );

  // Fill form
  await userEvent.type(screen.getByLabelText(/opportunity name/i), 'Test Opp');
  await userEvent.click(screen.getByRole('button', { name: /create/i }));

  // Verify transform was applied
  expect(mockDataProvider.create).toHaveBeenCalledWith(
    'opportunities',
    expect.objectContaining({
      data: expect.objectContaining({
        products_to_sync: expect.any(Array)
      })
    })
  );
});
```

### 2. Test List Context Integration

Mock useListContext for isolated testing:

```tsx
vi.mock('ra-core', async () => {
  const actual = await vi.importActual('ra-core');
  return {
    ...actual,
    useListContext: () => ({
      data: [/* mock data */],
      isPending: false,
      filterValues: { stage: ['new_lead'] }
    })
  };
});

test('OpportunityLayout renders content with data', () => {
  render(<OpportunityLayout />);
  expect(screen.getByTestId('opportunity-list-content')).toBeInTheDocument();
});
```

### 3. Test Validation Error Display

Submit invalid form and verify FormError renders:

```tsx
test('TextInput displays validation error', async () => {
  const mockForm = {
    setError: vi.fn(),
    formState: { errors: { name: { message: 'Name is required' } } }
  };

  render(
    <FormProvider {...mockForm}>
      <TextInput source="name" />
    </FormProvider>
  );

  expect(screen.getByText('Name is required')).toBeInTheDocument();
  expect(screen.getByText('Name is required')).toHaveClass('text-destructive');
});
```

### 4. Test Filter Application

Verify filter values are passed to data provider:

```tsx
test('OpportunityList applies stage filter', () => {
  const mockGetList = vi.fn();
  const mockDataProvider = {
    getList: mockGetList,
    // ... other methods
  };

  render(
    <AdminContext dataProvider={mockDataProvider}>
      <OpportunityList />
    </AdminContext>
  );

  expect(mockGetList).toHaveBeenCalledWith(
    'opportunities',
    expect.objectContaining({
      filter: expect.objectContaining({
        'deleted_at@is': null,
        stage: expect.any(Array)
      })
    })
  );
});
```

## Key Testing Files to Create

1. **Validation Tests**
   - `src/atomic-crm/validation/__tests__/opportunities.test.ts`
   - `src/atomic-crm/validation/__tests__/contacts.test.ts`

2. **Data Provider Tests**
   - `src/atomic-crm/providers/supabase/__tests__/unifiedDataProvider.test.ts`
   - `src/atomic-crm/providers/supabase/__tests__/ValidationService.test.ts`

3. **Component Tests**
   - `src/atomic-crm/opportunities/__tests__/OpportunityCreate.test.tsx`
   - `src/atomic-crm/opportunities/__tests__/OpportunityEdit.test.tsx`
   - `src/atomic-crm/opportunities/__tests__/OpportunityList.test.tsx`
   - `src/components/admin/__tests__/text-input.test.tsx`
   - `src/components/admin/__tests__/form.test.tsx`

4. **E2E Tests**
   - `tests/e2e/opportunities.spec.ts`
   - `tests/e2e/contacts.spec.ts`

## Relevant Documentation

### Internal Documentation
- `/home/krwhynot/Projects/atomic/CLAUDE.md`: Engineering Constitution, build commands, validation rules
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/README.md`: Validation layer documentation (if exists)

### External Documentation
- [React Admin Documentation](https://marmelab.com/react-admin/): Core framework docs
- [React Hook Form](https://react-hook-form.com/): Form state management
- [Zod Documentation](https://zod.dev/): Validation schemas
- [Supabase PostgREST](https://postgrest.org/): Filter operators and query syntax
- [ra-supabase](https://github.com/marmelab/ra-supabase): Supabase data provider adapter

### Key React Admin Concepts
- [DataProvider](https://marmelab.com/react-admin/DataProviderIntroduction.html): Data fetching interface
- [useInput](https://marmelab.com/react-admin/useInput.html): Form field integration
- [useListContext](https://marmelab.com/react-admin/useListContext.html): List state access
- [Validation](https://marmelab.com/react-admin/Validation.html): Form validation patterns
- [Transform](https://marmelab.com/react-admin/CreateEdit.html#transform): Data transformation before submission
