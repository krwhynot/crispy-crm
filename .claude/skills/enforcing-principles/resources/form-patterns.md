# Form: Patterns & Submission

## Purpose

Document tabbed forms, submission with transformation, and error display patterns.

## Pattern: Tabbed Forms

**From `src/atomic-crm/contacts/ContactInputs.tsx:7`:**

```typescript
import { TabbedFormInputs } from "@/components/admin/tabbed-form";

export const ContactInputs = () => {
  const tabs = [
    {
      key: "identity",
      label: "Identity",
      fields: ["first_name", "last_name"], // For error tracking
      content: <ContactIdentityTab />,
    },
    {
      key: "position",
      label: "Position",
      fields: ["title", "department", "organization_id"],
      content: <ContactPositionTab />,
    },
    {
      key: "contact_info",
      label: "Contact Info",
      fields: ["email", "phone", "linkedin_url"],
      content: <ContactInfoTab />,
    },
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="identity" />;
};
```

**Tab Component Example:**

```typescript
export const ContactIdentityTab = () => {
  return (
    <div className="space-y-4">
      <TextInput source="first_name" label="First Name" required />
      <TextInput source="last_name" label="Last Name" required />
    </div>
  );
};
```

**TabbedFormInputs with Error Badges:**

```typescript
export const TabbedFormInputs = ({ tabs, defaultTab }) => {
  const { formState } = useFormContext();

  // Count errors per tab
  const tabErrors = useMemo(() => {
    const errors: Record<string, number> = {};
    tabs.forEach(tab => {
      errors[tab.key] = tab.fields.filter(field => formState.errors[field]).length;
    });
    return errors;
  }, [tabs, formState.errors]);

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        {tabs.map(tab => (
          <TabTrigger key={tab.key} value={tab.key}>
            {tab.label}
            {tabErrors[tab.key] > 0 && (
              <Badge variant="destructive" className="ml-2">
                {tabErrors[tab.key]}
              </Badge>
            )}
          </TabTrigger>
        ))}
      </TabsList>
      {tabs.map(tab => (
        <TabContent key={tab.key} value={tab.key}>
          {tab.content}
        </TabContent>
      ))}
    </Tabs>
  );
};
```

## Pattern: Form Submission with Transformation

**From `src/atomic-crm/contacts/ContactCreate.tsx:11`:**

```typescript
const ContactCreate = () => {
  const { identity } = useGetIdentity();

  // Transform data before submission
  const transformData = (data: Contact) => ({
    ...data,
    first_seen: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    tags: [],
  });

  return (
    <CreateBase redirect="show" transform={transformData}>
      <Form defaultValues={{ sales_id: identity?.id }}>
        <Card>
          <CardContent>
            <ContactInputs />
            <FormToolbar />
          </CardContent>
        </Card>
      </Form>
    </CreateBase>
  );
};
```

**When to Use Transform:**
- Add server-side timestamps
- Initialize fields not in form
- Compute derived fields
- Convert form data to API format

## Pattern: Error Display

**React Admin automatically displays Zod validation errors:**

```typescript
// Zod validation error format
{
  message: "Validation failed",
  errors: {
    "first_name": "First name is required",
    "email.0.email": "Invalid email address"
  }
}

// React Admin displays inline:
<TextInput source="first_name" />
// Shows: "First name is required" in red below input

<ArrayInput source="email">
  <SimpleFormIterator>
    <TextInput source="email" />
  </SimpleFormIterator>
</ArrayInput>
// Shows: "email.0.email: Invalid email address"
```

## Pattern: Conditional Fields

```typescript
import { useWatch } from 'react-hook-form';

export const OpportunityDetailsTab = () => {
  const stage = useWatch({ name: 'stage' });

  return (
    <div className="space-y-4">
      <SelectInput source="stage" choices={stageChoices} />

      {/* Show close date only for closed stages */}
      {(stage === 'closed_won' || stage === 'closed_lost') && (
        <DateInput source="actual_close_date" label="Actual Close Date" />
      )}

      {/* Show loss reason only for closed_lost */}
      {stage === 'closed_lost' && (
        <TextInput source="loss_reason" label="Loss Reason" multiline />
      )}
    </div>
  );
};
```

## Quick Reference

| Situation | DO | DON'T |
|-----------|-----|-------|
| Transform | `transform` prop on CreateBase | Transform in component |
| Error display | Let React Admin handle | Manual error display |
| Conditional fields | `useWatch` hook | useState for field values |
| Tab errors | Track with `fields` array | Ignore tab-level errors |

## Related Resources

- [form-defaults.md](form-defaults.md) - Core form defaults
- [form-arrays.md](form-arrays.md) - JSONB array inputs
- [form-advanced.md](form-advanced.md) - Reset, debugging

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
