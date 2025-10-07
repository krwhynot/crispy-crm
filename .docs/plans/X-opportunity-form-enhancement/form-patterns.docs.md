# Form Patterns Research

## React Hook Form Usage

### useFieldArray Implementation
- **Location**: `/home/krwhynot/Projects/atomic/src/components/admin/array-input.tsx`
- **Pattern**: Custom `ArrayInput` wrapper component that uses `useFieldArray` from react-hook-form
- **Key Features**:
  - Wraps react-hook-form's `useFieldArray` with validation support
  - Provides context via `ArrayInputContext.Provider` to share field array methods
  - Integrates with React Admin's validation system
  - Handles default values automatically via `useApplyInputDefaultValues`
  - Manages nested source paths via `SourceContext`

**Example Usage in Codebase**:
```tsx
// From ContactInputs.tsx (lines 108-134)
<ArrayInput source="email" label="Email addresses" helperText={false}>
  <SimpleFormIterator inline disableReordering disableClear>
    <TextInput source="email" />
    <SelectInput source="type" choices={personalInfoTypes} defaultValue="Work" />
  </SimpleFormIterator>
</ArrayInput>
```

**Implementation Details**:
- Uses `useFieldArray({ name: finalSource, rules: { validate: ... } })`
- Returns `{ append, fields, move, remove, replace }` via context
- Validation runs async and integrates with React Admin's error system
- Automatically registers/unregisters fields with form groups

### useWatch Patterns
- **Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityInputs.tsx` (line 22)
- **Usage**: Reactive field watching to show/hide conditional fields based on stage value
- **Pattern**:
  ```tsx
  const stage = useWatch({ name: "stage" }) as OpportunityStageValue;
  const stageConfig = getStageFieldsConfig(stage);
  // Then conditionally render fields based on stageConfig
  ```

**Example from OpportunityInputs**:
```tsx
const OpportunityInputs = () => {
  const stage = useWatch({ name: "stage" }) as OpportunityStageValue;
  const stageConfig = getStageFieldsConfig(stage);

  return (
    <div>
      {/* Always visible fields */}
      <OpportunityInfoInputs />

      {/* Conditionally visible based on stage */}
      {stageConfig.showSampleFields && <SampleFields />}
      {stageConfig.showDemoFields && <DemoFields />}
    </div>
  );
};
```

### useFormContext Usage
- **Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactInputs.tsx` (line 78)
- **Pattern**: Access form context to get/set values programmatically
- **Use Cases**:
  - Auto-populate fields based on other field values
  - Custom validation logic
  - Field transformations on blur/paste events

**Example from ContactInputs**:
```tsx
const { getValues, setValue } = useFormContext();

const handleEmailChange = (email: string) => {
  const { first_name, last_name } = getValues();
  if (first_name || last_name || !email) return;
  const [first, last] = email.split("@")[0].split(".");
  setValue("first_name", first.charAt(0).toUpperCase() + first.slice(1));
  setValue("last_name", last ? last.charAt(0).toUpperCase() + last.slice(1) : "");
};
```

**Multi-Organization Input Example**:
- **Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/MultiOrganizationInput.tsx` (line 40-68)
- Uses `useWatch` to monitor array changes and enforce business rules
- Uses `setValue` to auto-correct invalid states (ensures exactly one primary org)
```tsx
const { setValue } = useFormContext();
const organizations = useWatch({ name: "organizations" }) || [];

React.useEffect(() => {
  const primaryCount = organizations.filter(org => org.is_primary).length;
  if (primaryCount === 0 && organizations.length > 0) {
    // Auto-set first as primary
    setValue("organizations", /* updated array */);
  }
}, [organizations, setValue]);
```

## React Admin Input Patterns

### ReferenceInput with Filtering
- **Component**: `/home/krwhynot/Projects/atomic/src/components/admin/reference-input.tsx`
- **Pattern**: Thin wrapper around React Admin's `ReferenceInputBase`
- **Default Child**: `AutocompleteInput`
- **Key Feature**: Validation must be on child component, not ReferenceInput itself

**Usage Examples**:
```tsx
// Simple reference without filtering (OpportunityInputs.tsx:69-74)
<ReferenceInput source="customer_organization_id" reference="organizations">
  <AutocompleteOrganizationInput label="Customer Organization" />
</ReferenceInput>

// With server-side filtering (ContactInputs.tsx:181-194)
<ReferenceInput
  reference="sales"
  source="sales_id"
  sort={{ field: "last_name", order: "ASC" }}
  filter={{ "disabled@neq": true }}
>
  <SelectInput
    label="Account manager *"
    optionText={saleOptionRenderer}
  />
</ReferenceInput>
```

### AutocompleteInput Patterns
- **Component**: `/home/krwhynot/Projects/atomic/src/components/admin/autocomplete-input.tsx`
- **Key Features**:
  - Server-side filtering via `filterToQuery` prop
  - Create suggestion support via `onCreate` or `create` props
  - Custom display text via `inputText` prop
  - Searchable dropdown with keyboard navigation
  - Integration with ChoicesContext from ReferenceInput

**Server-Side Filtering**:
```tsx
// Default implementation (line 257)
const DefaultFilterToQuery = (searchText: string) => ({ q: searchText });

// When user types, it calls:
setFilters(filterToQuery(filter)); // Triggers new API call with filter
```

**Create Suggestion Pattern**:
- **Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/AutocompleteOrganizationInput.tsx`
```tsx
const handleCreateOrganization = async (name?: string) => {
  if (!name) return;
  const newOrganization = await create("organizations", {
    data: { name, sales_id: identity?.id }
  }, { returnPromise: true });
  return newOrganization;
};

return (
  <AutocompleteInput
    optionText="name"
    onCreate={handleCreateOrganization}
    createItemLabel="Create %{item}"
  />
);
```

### ReferenceArrayInput Pattern
- **Component**: `/home/krwhynot/Projects/atomic/src/components/admin/reference-array-input.tsx`
- **Purpose**: For hasMany relationships (array of IDs)
- **Default Child**: `AutocompleteArrayInput`
- **Features**:
  - Fetches current values with `dataProvider.getMany()`
  - Fetches possible choices with `dataProvider.getList()`
  - Supports filtering, sorting, pagination via props

**Usage Example**:
```tsx
// From OpportunityInputs.tsx (lines 90-96)
<ReferenceArrayInput source="contact_ids" reference="contacts_summary">
  <AutocompleteArrayInput
    label="Contacts *"
    optionText={contactOptionText}
    helperText="At least one contact is required"
  />
</ReferenceArrayInput>
```

### AutocompleteArrayInput Pattern
- **Component**: `/home/krwhynot/Projects/atomic/src/components/admin/autocomplete-array-input.tsx`
- **Features**:
  - Multi-select with badge display for selected items
  - Server-side filtering when used with ReferenceArrayInput
  - Remove items by clicking X on badges
  - Backspace to remove last item when input empty
  - Filters out already-selected choices from dropdown

**Key Implementation Details**:
```tsx
// Lines 90-95: Filter available vs selected
const availableChoices = allChoices.filter(
  (choice) => !field.value.includes(getChoiceValue(choice))
);
const selectedChoices = allChoices.filter((choice) =>
  field.value.includes(getChoiceValue(choice))
);

// Server-side filtering (lines 163-169)
onValueChange={(filter) => {
  setFilterValue(filter);
  if (isFromReference) {
    setFilters(filterToQuery(filter), undefined, true);
  }
}}
```

## Custom Hooks

### useSupportCreateSuggestion
- **Location**: `/home/krwhynot/Projects/atomic/src/hooks/useSupportCreateSuggestion.tsx`
- **Purpose**: Add "Create new X" option to autocomplete inputs
- **Used By**: `AutocompleteInput` and `AutocompleteArrayInput`
- **Features**:
  - Displays create option in dropdown
  - Supports both inline creation (`onCreate` callback) and modal creation (`create` ReactElement)
  - Filters create option based on search text
  - Can show hint when no filter entered

**API**:
```tsx
const {
  getCreateItem,        // Returns the "Create X" choice object
  handleChange,         // Wrapper around field.onChange that intercepts create
  createElement,        // Renders the create modal (if provided)
  getOptionDisabled,    // Disables hint option
} = useSupportCreateSuggestion({
  create,              // Optional React element for create dialog
  createLabel,         // Label when no filter (default: "ra.action.create")
  createItemLabel,     // Template for filtered create (e.g., "Create %{item}")
  createValue,         // Internal ID for create option (default: "@@ra-create")
  onCreate,            // Callback for inline creation
  handleChange,        // Original field onChange
  filter,              // Current filter value
  optionText,          // How to display options
});
```

### ArrayInput Context Hook
- **Location**: `/home/krwhynot/Projects/atomic/src/hooks/array-input-context.tsx`
- **Purpose**: Share useFieldArray methods with SimpleFormIterator
- **Exported**: `useArrayInput()` hook
- **Provides**: `{ append, fields, move, remove, replace }`

### SimpleFormIterator Hooks
- **Location**: `/home/krwhynot/Projects/atomic/src/hooks/simple-form-iterator-context.tsx`
- **Hooks**:
  - `useSimpleFormIterator()` - Get `{ total, add, remove, reOrder, source }`
  - `useSimpleFormIteratorItem()` - Get `{ index, total, reOrder, remove }` for current item
- **Used In**: Custom add/remove buttons, reorder buttons

## Default Values

### Form defaultValues in Create
**Pattern**: Pass `defaultValues` object to `<Form>` component

**Examples**:
```tsx
// OpportunityCreate.tsx (lines 86-93)
<Form
  defaultValues={{
    sales_id: identity?.id,
    contact_ids: [],
    index: 0,
    priority: "medium",
    probability: 50,
    stage: "new_lead",
  }}
>

// ProductCreate.tsx (lines 34-37)
<Form defaultValues={{
  status: "active",
  category: "equipment",
  created_by: identity?.id
}}>

// ContactCreate.tsx (line 22)
<Form defaultValues={{ sales_id: identity?.id }}>
```

**Input-Level Defaults**:
```tsx
// Individual inputs can also set defaults
<NumberInput source="probability" defaultValue={50} />
<SelectInput source="priority" defaultValue="medium" />
```

### Transform Pattern in CreateBase
- **Purpose**: Transform form data before sending to API
- **Location**: `transform` prop on `<CreateBase>`

**Examples**:
```tsx
// ContactCreate.tsx (lines 11-16)
const transformData = (data: Contact) => ({
  ...data,
  first_seen: new Date().toISOString(),
  last_seen: new Date().toISOString(),
  tags: [],
});
<CreateBase redirect="show" transform={transformData}>

// ProductCreate.tsx (lines 14-30)
<CreateBase
  transform={(values) => {
    if (!values.status) values.status = "active";
    if (values.list_price) values.list_price = parseFloat(values.list_price);
    return values;
  }}
>
```

### Record Data in Edit Forms
**Pattern**: Edit forms receive `record` from `useEditContext()` or `useRecordContext()`
- Form automatically populates with record data
- No explicit defaultValues needed - React Admin handles it
- `record` prop flows through RecordContext to all child inputs

**Example**:
```tsx
// OpportunityEdit.tsx - No defaultValues needed
<EditBase redirect="show">
  <Form>  {/* Automatically populated from record */}
    <OpportunityInputs />
  </Form>
</EditBase>

// ContactEdit.tsx (lines 15-17)
const ContactEditContent = () => {
  const { isPending, record } = useEditContext<Contact>();
  if (isPending || !record) return null;
  return <Form>...</Form>; // Form auto-populated from record
};
```

## Patterns to Replicate

### 1. ArrayInput + SimpleFormIterator Pattern
**When**: Managing array fields (emails, phones, products, etc.)
**Example**: `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactInputs.tsx` (lines 108-134)

```tsx
<ArrayInput source="fieldName" label="Label" helperText={false}>
  <SimpleFormIterator inline disableReordering disableClear>
    <TextInput source="value" label={false} />
    <SelectInput source="type" choices={types} defaultValue="default" />
  </SimpleFormIterator>
</ArrayInput>
```

**Best Practices**:
- Use `inline` prop for horizontal layout of array items
- Set `disableReordering` if order doesn't matter
- Set `disableClear` to prevent accidental deletion of all items
- Use `label={false}` on child inputs to avoid repetitive labels
- Provide `defaultValue` on inputs to ensure new items have sensible defaults

### 2. ReferenceArrayInput for Multi-Select
**When**: Selecting multiple related entities (contacts, tags, products)
**Example**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityInputs.tsx` (lines 90-96)

```tsx
<ReferenceArrayInput source="related_ids" reference="resource_name">
  <AutocompleteArrayInput
    label="Select Items *"
    optionText={(record) => `${record.name}`}
    helperText="Helper text here"
  />
</ReferenceArrayInput>
```

### 3. Conditional Fields with useWatch
**When**: Show/hide fields based on another field's value
**Example**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityInputs.tsx` (lines 22-48)

```tsx
const OpportunityInputs = () => {
  const stage = useWatch({ name: "stage" });
  const config = getFieldsConfigForStage(stage);

  return (
    <div>
      <SelectInput source="stage" choices={stageChoices} />
      {config.showSpecialFields && <SpecialFields />}
    </div>
  );
};
```

### 4. Auto-population with useFormContext
**When**: Auto-fill fields based on user input
**Example**: `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactInputs.tsx` (lines 78-103)

```tsx
const { getValues, setValue } = useFormContext();

const handleFieldChange = (value: string) => {
  const currentValues = getValues();
  if (!currentValues.dependent_field) {
    setValue("dependent_field", derivedValue);
  }
};

<TextInput onBlur={(e) => handleFieldChange(e.target.value)} />
```

### 5. Create Suggestion Pattern
**When**: Allow creating new related records inline
**Example**: `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/AutocompleteOrganizationInput.tsx`

```tsx
const CustomAutocompleteInput = () => {
  const [create] = useCreate();
  const { identity } = useGetIdentity();

  const handleCreate = async (name?: string) => {
    if (!name) return;
    const newRecord = await create("resource", {
      data: { name, created_by: identity?.id }
    }, { returnPromise: true });
    return newRecord;
  };

  return (
    <AutocompleteInput
      onCreate={handleCreate}
      createItemLabel="Create %{item}"
    />
  );
};
```

### 6. Nested SourceContext for Array Items
**When**: Building complex nested structures
**Pattern**: Source paths automatically compose within ArrayInput
- `<ArrayInput source="items">` creates context for "items"
- `<TextInput source="name">` inside becomes "items.0.name", "items.1.name", etc.
- SimpleFormIterator handles index management automatically

### 7. Custom Validation in useFieldArray
**When**: Validating array-level constraints (at least one item, max items, etc.)
**Location**: `/home/krwhynot/Projects/atomic/src/components/admin/array-input.tsx` (lines 53-64)

```tsx
const fieldProps = useFieldArray({
  name: finalSource,
  rules: {
    validate: async (value) => {
      if (!sanitizedValidate) return true;
      const error = await sanitizedValidate(value, getValues(), props);
      if (!error) return true;
      return getValidationErrorMessage(error);
    },
  },
});
```

### 8. Form Structure Best Practices
**Observed Pattern**: Separate input components by section
- Main `*Inputs.tsx` file orchestrates layout
- Sub-components for logical sections (Identity, Position, Misc, etc.)
- Use Separator components between sections
- Responsive layouts with `useIsMobile()` hook
- Consistent gap spacing (gap-4 for inputs, gap-6/gap-8 for sections)

**Example Structure**:
```tsx
export const EntityInputs = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-8">
      <InfoSection />
      <div className={`flex gap-6 ${isMobile ? 'flex-col' : 'flex-row'}`}>
        <LeftSection />
        <Separator orientation={isMobile ? 'horizontal' : 'vertical'} />
        <RightSection />
      </div>
    </div>
  );
};

const InfoSection = () => (
  <div className="flex flex-col gap-4">
    <h3 className="text-base font-medium">Section Title</h3>
    <TextInput source="field1" />
    <TextInput source="field2" />
  </div>
);
```

### 9. Server-Side Filtering in ReferenceInput
**Default**: `filterToQuery` converts search text to `{ q: searchText }`
**Custom**: Override for different API formats

```tsx
<ReferenceInput
  source="field_id"
  reference="resource"
  filter={{ permanent: "filter" }}  // Always applied
  sort={{ field: "name", order: "ASC" }}
>
  <AutocompleteInput
    filterToQuery={(search) => ({ name: search })}  // Custom filter format
  />
</ReferenceInput>
```

### 10. DefaultValues Priority
**Order of precedence** (highest to lowest):
1. Existing record data (in Edit forms)
2. Input-level `defaultValue` prop
3. Form-level `defaultValues` object
4. Backend defaults (via validation layer)

**Recommendation**: Set defaults at Form level for clarity, unless input-specific default is needed

## Summary

**Key Takeaways**:
1. **useFieldArray**: Used via ArrayInput wrapper, provides `append`, `fields`, `remove`, `move` via context
2. **useWatch**: Monitor field values for conditional rendering (reactive forms)
3. **useFormContext**: Get/set values programmatically for auto-population and custom logic
4. **ReferenceInput**: Fetches related data, delegates to child component (AutocompleteInput by default)
5. **Server-side filtering**: Via `filterToQuery` prop and `setFilters` from ChoicesContext
6. **Create suggestions**: Use `onCreate` callback or `create` element with `useSupportCreateSuggestion`
7. **Default values**: Set at Form level in Create, automatic in Edit from record
8. **Array inputs**: Combine ArrayInput + SimpleFormIterator for dynamic arrays
9. **Nested sources**: Automatically handled by SourceContext composition
10. **Section structure**: Separate logical sections, use h3/h6 headings, consistent spacing
