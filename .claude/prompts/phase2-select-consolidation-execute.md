# Phase 2: SelectUI Consolidation - Execution Prompt

## Context
You are continuing Phase 2 of the SelectUI consolidation for Crispy CRM. Phase 1 is complete and created:
- `src/components/ui/select-ui.tsx` (258 lines) - Core SelectUI presentation component
- `src/components/admin/generic-select-input.tsx` (38 lines) - React Admin connector

**Branch**: `feature/select-ui-consolidation-phase1` (continue on this branch)

## Your Mission
Execute the approved plan to migrate 3 static wrapper components to use GenericSelectInput, making it polymorphic to support both React Admin forms AND standalone controlled components.

---

## STEP 1: Create Constants File

**Create**: `src/constants/choices.ts`

```typescript
/**
 * Centralized choice constants for select inputs
 * Single source of truth for static dropdown options
 */

export const US_TIMEZONES = [
  { id: "America/New_York", name: "Eastern Time (ET)" },
  { id: "America/Chicago", name: "Central Time (CT)" },
  { id: "America/Denver", name: "Mountain Time (MT)" },
  { id: "America/Los_Angeles", name: "Pacific Time (PT)" },
  { id: "America/Phoenix", name: "Arizona (no DST)" },
  { id: "America/Anchorage", name: "Alaska Time (AKT)" },
  { id: "Pacific/Honolulu", name: "Hawaii Time (HST)" },
  { id: "UTC", name: "UTC" },
] as const;

export type USTimezone = (typeof US_TIMEZONES)[number]["id"];

// Re-export from existing locations (maintain single source of truth)
export { US_STATES } from "@/atomic-crm/organizations/constants";
export { LEAD_SOURCE_CHOICES } from "@/atomic-crm/opportunities/constants/LeadSourceInput.constants";
```

---

## STEP 2: Make GenericSelectInput Polymorphic

**Modify**: `src/components/admin/generic-select-input.tsx`

The component must support TWO modes:
1. **Form Mode**: If `source` prop exists → use `useInput` (React Admin context)
2. **Controlled Mode**: If `value`/`onChange` exist (no source) → pass directly to SelectUI

**Implementation Pattern** (discriminated union + two internal components):

```typescript
import { useInput } from "ra-core";
import type { InputProps } from "ra-core";
import { SelectUI, type SelectUIProps, type SelectOption } from "@/components/ui/select-ui";

// =============================================================================
// SHARED BASE PROPS
// =============================================================================
interface GenericSelectInputBaseProps
  extends Omit<SelectUIProps, "value" | "onChange" | "hasError" | "options"> {
  choices: Array<Record<string, unknown>>;
  optionValue?: string;
  optionLabel?: string;
}

// =============================================================================
// FORM MODE (React Admin context)
// =============================================================================
interface GenericSelectInputFormProps
  extends GenericSelectInputBaseProps,
    Omit<InputProps, "source"> {
  source: string;
  value?: never;
  onChange?: never;
}

// =============================================================================
// CONTROLLED MODE (Standalone)
// =============================================================================
interface GenericSelectInputControlledProps extends GenericSelectInputBaseProps {
  source?: never;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  hasError?: boolean;
}

// =============================================================================
// DISCRIMINATED UNION
// =============================================================================
export type GenericSelectInputProps =
  | GenericSelectInputFormProps
  | GenericSelectInputControlledProps;

// =============================================================================
// INTERNAL: Form Mode Component
// =============================================================================
function GenericSelectInputForm({
  source,
  choices,
  optionValue = "id",
  optionLabel = "name",
  ...rest
}: GenericSelectInputFormProps) {
  const { field, fieldState } = useInput({ source });

  const options: SelectOption[] = choices.map((choice) => ({
    id: String(choice[optionValue] ?? choice.id),
    label: String(choice[optionLabel] ?? choice.name),
    ...choice,
  }));

  return (
    <SelectUI
      options={options}
      value={field.value}
      onChange={field.onChange}
      hasError={!!fieldState.error}
      {...rest}
    />
  );
}

// =============================================================================
// INTERNAL: Controlled Mode Component
// =============================================================================
function GenericSelectInputControlled({
  choices,
  optionValue = "id",
  optionLabel = "name",
  value,
  onChange,
  hasError = false,
  ...rest
}: GenericSelectInputControlledProps) {
  const options: SelectOption[] = choices.map((choice) => ({
    id: String(choice[optionValue] ?? choice.id),
    label: String(choice[optionLabel] ?? choice.name),
    ...choice,
  }));

  return (
    <SelectUI
      options={options}
      value={value}
      onChange={onChange}
      hasError={hasError}
      {...rest}
    />
  );
}

// =============================================================================
// PUBLIC: Polymorphic Switch
// =============================================================================
export function GenericSelectInput(props: GenericSelectInputProps) {
  if ("source" in props && props.source !== undefined) {
    return <GenericSelectInputForm {...props} />;
  }
  return <GenericSelectInputControlled {...props as GenericSelectInputControlledProps} />;
}

export type { GenericSelectInputFormProps, GenericSelectInputControlledProps };
```

**Run after**: `npx tsc --noEmit` to verify

---

## STEP 3: Migrate TimeZoneSelect (Controlled Mode)

**Rename**: `src/atomic-crm/settings/TimeZoneSelect.tsx` → `TimeZoneSelect.deprecated.tsx`

**Create NEW**: `src/atomic-crm/settings/TimeZoneSelect.tsx`

```typescript
import { GenericSelectInput } from "@/components/admin/generic-select-input";
import { US_TIMEZONES } from "@/constants/choices";

interface TimeZoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TimeZoneSelect({ value, onChange, disabled }: TimeZoneSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">Time Zone</label>
      <GenericSelectInput
        value={value}
        onChange={(v) => onChange(v as string)}
        choices={[...US_TIMEZONES]}
        isDisabled={disabled}
        searchable={false}
        placeholder="Select time zone"
      />
      <p className="text-sm text-muted-foreground">
        Times will be displayed in your selected timezone
      </p>
    </div>
  );
}
```

**Consumer** (no changes needed): `src/atomic-crm/settings/sections/PersonalSection.tsx`

---

## STEP 4: Migrate StateComboboxInput (Form Mode)

**Rename**: `src/components/admin/state-combobox-input.tsx` → `state-combobox-input.deprecated.tsx`

**Create NEW**: `src/components/admin/state-combobox-input.tsx`

```typescript
import { GenericSelectInput } from "@/components/admin/generic-select-input";
import { US_STATES } from "@/constants/choices";

interface StateComboboxInputProps {
  source: string;
  label?: string;
}

export function StateComboboxInput({ source, label = "State" }: StateComboboxInputProps) {
  return (
    <GenericSelectInput
      source={source}
      choices={[...US_STATES]}
      placeholder="Select state..."
      searchable={true}
    />
  );
}
```

**Consumers** (no changes needed):
- `src/atomic-crm/organizations/OrganizationCompactForm.tsx`
- `src/atomic-crm/organizations/OrganizationAddressSection.tsx`

---

## STEP 5: Migrate LeadSourceInput (Form Mode)

**Rename**: `src/atomic-crm/opportunities/LeadSourceInput.tsx` → `LeadSourceInput.deprecated.tsx`

**Create NEW**: `src/atomic-crm/opportunities/LeadSourceInput.tsx`

```typescript
import { GenericSelectInput } from "@/components/admin/generic-select-input";
import { LEAD_SOURCE_CHOICES } from "@/constants/choices";

export function LeadSourceInput() {
  return (
    <GenericSelectInput
      source="lead_source"
      choices={LEAD_SOURCE_CHOICES}
      placeholder="Select lead source..."
      searchable={false}
    />
  );
}
```

**Consumer** (no changes needed): `src/atomic-crm/opportunities/slideOverTabs/OpportunitySlideOverDetailsTab.tsx`

---

## STEP 6: Create PATTERNS.md

**Create**: `src/components/admin/PATTERNS.md`

```markdown
# Select Input Patterns

Standard patterns for dropdown/select inputs in Crispy CRM.

## Component Hierarchy

```
SelectUI (presentation only)
    ↑
GenericSelectInput (React Admin connector, polymorphic)
    ↑
[Domain wrappers: TimeZoneSelect, StateComboboxInput, LeadSourceInput]
    ↑
[Usage in forms with ReferenceInput when needed]
```

---

## Pattern A: Static Choices (Form Mode)

For fixed option lists inside React Admin forms.

```tsx
import { GenericSelectInput } from "@/components/admin/generic-select-input";
import { LEAD_SOURCE_CHOICES } from "@/constants/choices";

// Inside a React Admin form (<SimpleForm>, <TabbedForm>, etc.)
<GenericSelectInput
  source="lead_source"
  choices={LEAD_SOURCE_CHOICES}
  placeholder="Select lead source..."
/>
```

**When to use**: Static options, inside React Admin form context.

---

## Pattern B: Static Choices (Controlled Mode)

For fixed options outside React Admin forms (settings pages, standalone components).

```tsx
import { GenericSelectInput } from "@/components/admin/generic-select-input";
import { US_TIMEZONES } from "@/constants/choices";

const [timezone, setTimezone] = useState("America/Chicago");

<GenericSelectInput
  value={timezone}
  onChange={(v) => setTimezone(v as string)}
  choices={[...US_TIMEZONES]}
  placeholder="Select timezone..."
/>
```

**When to use**: Static options, outside React Admin form context.

---

## Pattern C: Reference Data

For API-fetched options (organizations, contacts, principals).

```tsx
import { ReferenceInput } from "react-admin";
import { GenericSelectInput } from "@/components/admin/generic-select-input";

<ReferenceInput reference="organizations" source="org_id">
  <GenericSelectInput optionText="name" />
</ReferenceInput>
```

**When to use**: Options from database, dynamic data.

---

## Pattern D: Cascading Filters

For dependent dropdowns (contacts filtered by organization).

```tsx
import { ReferenceInput, useWatch } from "react-admin";
import { GenericSelectInput } from "@/components/admin/generic-select-input";

function ContactPicker() {
  const orgId = useWatch({ name: "org_id" });

  return (
    <ReferenceInput
      reference="contacts"
      source="contact_id"
      filter={{ organization_id: orgId }}
    >
      <GenericSelectInput optionText="full_name" />
    </ReferenceInput>
  );
}
```

**When to use**: Selection in one field filters options in another.

---

## Searchable Threshold

| Item Count | Recommendation |
|------------|----------------|
| < 20 items | `searchable={false}` |
| ≥ 20 items | `searchable={true}` |
| > 100 items | Server-side filtering via ReferenceInput |

---

## Migration Checklist

When replacing an old select component:

1. [ ] Identify choice source (static array or reference)
2. [ ] Move static choices to `src/constants/choices.ts`
3. [ ] Determine mode: Form (has `source`) or Controlled (has `value`/`onChange`)
4. [ ] Replace with appropriate GenericSelectInput pattern
5. [ ] Update imports in consuming files
6. [ ] Verify TypeScript compiles: `npx tsc --noEmit`
7. [ ] Test in browser for visual parity
```

---

## STEP 7: Final Verification

Run these commands:

```bash
# TypeScript must pass
npx tsc --noEmit

# List backup files created
rg "\.deprecated" src/ -l

# Show git status
git status --short
```

Expected outcome:
- 0 TypeScript errors
- 3 `.deprecated.tsx` backup files
- ~9 files changed

---

## Success Criteria

- [ ] `src/constants/choices.ts` created with US_TIMEZONES and re-exports
- [ ] `GenericSelectInput` supports both Form and Controlled modes
- [ ] TimeZoneSelect uses GenericSelectInput (Controlled mode)
- [ ] StateComboboxInput uses GenericSelectInput (Form mode)
- [ ] LeadSourceInput uses GenericSelectInput (Form mode)
- [ ] All 3 original files preserved as `.deprecated.tsx`
- [ ] PATTERNS.md documents all usage patterns
- [ ] TypeScript compiles with 0 errors
- [ ] All consumers still work (no broken imports)

---

## Files Reference

| File | Action | Notes |
|------|--------|-------|
| `src/constants/choices.ts` | CREATE | Centralized constants |
| `src/components/admin/generic-select-input.tsx` | MODIFY | Polymorphic (38→~80 lines) |
| `src/atomic-crm/settings/TimeZoneSelect.tsx` | REPLACE | Controlled mode |
| `src/atomic-crm/settings/TimeZoneSelect.deprecated.tsx` | CREATE | Backup |
| `src/components/admin/state-combobox-input.tsx` | REPLACE | Form mode |
| `src/components/admin/state-combobox-input.deprecated.tsx` | CREATE | Backup |
| `src/atomic-crm/opportunities/LeadSourceInput.tsx` | REPLACE | Form mode |
| `src/atomic-crm/opportunities/LeadSourceInput.deprecated.tsx` | CREATE | Backup |
| `src/components/admin/PATTERNS.md` | CREATE | Documentation |
