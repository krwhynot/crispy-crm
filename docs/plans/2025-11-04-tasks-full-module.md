# Tasks Full Module Elevation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Elevate Tasks from dashboard widget (65%) to full resource module with List/Show/Create pages

**Architecture:** Create standard React Admin resource structure. Widget stays for quick access.

**Tech Stack:** React Admin Resource pattern, existing tasks table
**Effort:** 5-7 days | **Priority:** MEDIUM | **Status:** Widget works, full module missing

---

## Task 1: Create Tasks List Page (2 days)

**File:** `src/atomic-crm/tasks/TaskList.tsx`

```typescript
import {
  List,
  Datagrid,
  TextField,
  DateField,
  BooleanField,
  ReferenceField,
  Filter,
  TextInput,
  SelectInput,
} from 'react-admin'

const taskFilters = [
  <TextInput label="Search" source="q" alwaysOn />,
  <SelectInput
    label="Status"
    source="completed"
    choices={[
      { id: false, name: 'Incomplete' },
      { id: true, name: 'Complete' },
    ]}
  />,
  <SelectInput
    label="Priority"
    source="priority"
    choices={[
      { id: 'high', name: 'High' },
      { id: 'medium', name: 'Medium' },
      { id: 'low', name: 'Low' },
    ]}
  />,
]

export const TaskList = () => (
  <List filters={taskFilters} sort={{ field: 'due_date', order: 'ASC' }}>
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <BooleanField source="completed" label="Done" />
      <TextField source="title" />
      <TextField source="priority" />
      <DateField source="due_date" />
      <ReferenceField source="contact_id" reference="contacts" link="show">
        <TextField source="name" />
      </ReferenceField>
    </Datagrid>
  </List>
)
```

---

## Task 2: Create Task Show Page (1 day)

**File:** `src/atomic-crm/tasks/TaskShow.tsx`

```typescript
import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  BooleanField,
  ReferenceField,
} from 'react-admin'

export const TaskShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="title" />
      <TextField source="description" />
      <BooleanField source="completed" />
      <TextField source="priority" />
      <DateField source="due_date" />
      <ReferenceField source="contact_id" reference="contacts" link="show">
        <TextField source="name" />
      </ReferenceField>
      <ReferenceField source="opportunity_id" reference="opportunities" link="show">
        <TextField source="name" />
      </ReferenceField>
      <DateField source="created_at" />
    </SimpleShowLayout>
  </Show>
)
```

---

## Task 3: Create Task Create/Edit (1 day)

**File:** `src/atomic-crm/tasks/TaskEdit.tsx`

```typescript
import {
  Edit,
  SimpleForm,
  TextInput,
  BooleanInput,
  DateInput,
  SelectInput,
  ReferenceInput,
  AutocompleteInput,
} from 'react-admin'

export const TaskEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" fullWidth required />
      <TextInput source="description" multiline rows={3} fullWidth />
      <BooleanInput source="completed" />
      <SelectInput
        source="priority"
        choices={[
          { id: 'high', name: 'High' },
          { id: 'medium', name: 'Medium' },
          { id: 'low', name: 'Low' },
        ]}
      />
      <DateInput source="due_date" />
      <ReferenceInput source="contact_id" reference="contacts">
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
      <ReferenceInput source="opportunity_id" reference="opportunities">
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
    </SimpleForm>
  </Edit>
)

export const TaskCreate = () => (
  <Create>
    {/* Same form as Edit */}
  </Create>
)
```

---

## Task 4: Create Module Index & Register (30 min)

**File:** `src/atomic-crm/tasks/index.ts`

```typescript
import * as React from 'react'

const TaskList = React.lazy(() => import('./TaskList'))
const TaskShow = React.lazy(() => import('./TaskShow'))
const TaskEdit = React.lazy(() => import('./TaskEdit'))
const TaskCreate = React.lazy(() => import('./TaskCreate'))

export default {
  list: TaskList,
  show: TaskShow,
  edit: TaskEdit,
  create: TaskCreate,
  recordRepresentation: (record) => record.title,
}
```

**File:** `src/atomic-crm/root/CRM.tsx`

```typescript
import tasksModule from '../tasks'

<Resource name="tasks" {...tasksModule} />
```

---

## Task 5: Test & Commit (1-2 days)

```bash
npm run dev
# Navigate to /tasks
# Test List view
# Test Show view
# Test Create/Edit
# Verify widget still works

npm test -- tasks/

git add src/atomic-crm/tasks/
git commit -m "feat: elevate Tasks to full resource module

- Create TaskList with filtering
- Create TaskShow detail page
- Create TaskEdit/TaskCreate forms
- Add index.ts with lazy loading
- Register as Resource in CRM.tsx

Tasks: 65% → 100% (dashboard widget remains for quick access)

🤖 Generated with Claude Code"
```

---

**Plan Status:** ✅ Ready | **Time:** 5-7 days | **Impact:** MEDIUM (Architecture polish)
