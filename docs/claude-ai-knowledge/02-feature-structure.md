# Crispy CRM Feature Structure

> **Purpose:** Reference document for Claude.ai Project Knowledge. Shows standard file organization for features.

---

## Standard Feature Layout

Every feature in `src/atomic-crm/` follows this pattern:

```
src/atomic-crm/[feature]/
├── index.tsx              # Entry point + error boundaries
├── resource.tsx           # React Admin resource definition
├── [Feature]List.tsx      # List view (DataGrid)
├── [Feature]Create.tsx    # Create form (full page)
├── [Feature]Edit.tsx      # Edit form (full page)
├── [Feature]SlideOver.tsx # Side panel (40vw, URL: ?view=123)
├── [Feature]Inputs.tsx    # Shared form inputs
├── [Feature]Aside.tsx     # Optional: sidebar content
├── __tests__/             # Unit tests (Vitest)
│   └── *.test.tsx
└── [Supporting].tsx       # Feature-specific components
```

---

## Example: Contacts Feature

```
src/atomic-crm/contacts/
├── index.tsx                    # Exports ContactList, ContactCreate, ContactEdit
├── resource.tsx                 # <Resource name="contacts" ... />
├── ContactList.tsx              # Main list with DataGrid
├── ContactCreate.tsx            # Create form
├── ContactEdit.tsx              # Edit form
├── ContactSlideOver.tsx         # Side panel for quick view/edit
├── ContactInputs.tsx            # Reusable form fields
├── ContactAside.tsx             # Sidebar with related info
├── ContactListFilter.tsx        # Filter bar component
├── ContactDetailsTab.tsx        # Tab in SlideOver
├── ContactNotesTab.tsx          # Tab in SlideOver
├── ActivitiesTab.tsx            # Tab in SlideOver
├── OpportunitiesTab.tsx         # Tab in SlideOver
├── Avatar.tsx                   # Contact avatar component
├── TagsList.tsx                 # Tags display
├── TagsListEdit.tsx             # Tags editing
├── ContactBadges.tsx            # Status badges
├── ContactEmpty.tsx             # Empty state
├── ContactOption.tsx            # Autocomplete option
├── __tests__/
│   ├── ContactList.spec.tsx
│   ├── ContactSlideOver.test.tsx
│   └── ...
└── useContactImport.tsx         # Feature-specific hook
```

---

## Key File Patterns

### index.tsx (Entry Point)

```tsx
// src/atomic-crm/contacts/index.tsx
import { ContactList } from './ContactList';
import { ContactCreate } from './ContactCreate';
import { ContactEdit } from './ContactEdit';

export { ContactList, ContactCreate, ContactEdit };
```

### resource.tsx (React Admin Resource)

```tsx
// src/atomic-crm/contacts/resource.tsx
import { Resource } from 'react-admin';
import { ContactList, ContactCreate, ContactEdit } from './index';

export const contactResource = (
  <Resource
    name="contacts"
    list={ContactList}
    create={ContactCreate}
    edit={ContactEdit}
    options={{ label: 'Contacts' }}
  />
);
```

### [Feature]List.tsx (List View)

```tsx
// Pattern: Uses PremiumDatagrid from React Admin
import { List, DatagridConfigurable } from 'react-admin';
import { ContactListFilter } from './ContactListFilter';

export const ContactList = () => (
  <List
    filters={<ContactListFilter />}
    sort={{ field: 'created_at', order: 'DESC' }}
    perPage={25}
  >
    <DatagridConfigurable rowClick="edit">
      {/* Columns */}
    </DatagridConfigurable>
  </List>
);
```

### [Feature]SlideOver.tsx (Side Panel)

```tsx
// Pattern: 40vw width, URL-driven via ?view=123
// Tabs for different sections
import { Drawer, Tabs, Tab, TabPanel } from '@/components/ui';

export const ContactSlideOver = () => {
  const { view } = useSearchParams(); // ?view=123

  return (
    <Drawer open={!!view} width="40vw">
      <Tabs>
        <Tab label="Details" />
        <Tab label="Activities" />
        <Tab label="Opportunities" />
        <Tab label="Notes" />
      </Tabs>
      {/* Tab panels */}
    </Drawer>
  );
};
```

### [Feature]Inputs.tsx (Shared Form Fields)

```tsx
// Pattern: Reusable across Create and Edit forms
// NO validation here - validation is at API boundary only
import { TextInput, SelectInput, ReferenceInput } from 'react-admin';

export const ContactInfoInputs = () => (
  <>
    <TextInput source="first_name" label="First Name" />
    <TextInput source="last_name" label="Last Name" />
    <TextInput source="email" label="Email" type="email" />
    <TextInput source="phone" label="Phone" />
  </>
);

export const ContactOrganizationInputs = () => (
  <ReferenceInput
    source="organization_ids"
    reference="organizations"
    filter={{ type: 'distributor' }}
  >
    <SelectInput optionText="name" />
  </ReferenceInput>
);
```

---

## Validation Location

**CRITICAL:** Validation lives in `src/atomic-crm/validation/`, NOT in feature components.

```
src/atomic-crm/validation/
├── contacts.ts          # Contact Zod schemas
├── opportunities.ts     # Opportunity Zod schemas
├── activities.ts        # Activity Zod schemas
├── organizations.ts     # Organization Zod schemas
└── index.ts             # Exports all schemas
```

Forms do NOT validate — they just collect data. Validation happens at API boundary in `unifiedDataProvider.ts`.

---

## Data Flow

```
Form Component
      ↓ (raw form data)
unifiedDataProvider.ts
      ↓ (calls validation)
src/atomic-crm/validation/[resource].ts
      ↓ (Zod schema)
Supabase API
```

---

## SlideOver URL Pattern

SlideOvers use URL query params for state:

```
/contacts                    # List view
/contacts?view=123           # List + SlideOver for contact 123
/contacts/123/edit           # Full edit page
/contacts/create             # Full create page
```

This enables:
- Deep linking to specific records
- Browser back/forward navigation
- Shareable URLs

---

## Touch Target Requirements

All interactive elements must be at least 44x44px for iPad accessibility:

```tsx
// Correct: h-11 w-11 = 44px
<button className="h-11 w-11 rounded-full bg-primary">

// Wrong: Too small for touch
<button className="h-8 w-8">
```

---

## Test File Naming

```
ComponentName.test.tsx    # Unit test (Vitest)
ComponentName.spec.tsx    # Alternative unit test naming
ComponentName.e2e.ts      # E2E test (Playwright) - in tests/e2e/
```
