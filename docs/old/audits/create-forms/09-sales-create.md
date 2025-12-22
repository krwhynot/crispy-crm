# SalesCreate Form Audit

**Audit Date:** 2025-12-15
**Form Location:** `src/atomic-crm/sales/SalesCreate.tsx`
**Schema Location:** `src/atomic-crm/validation/sales.ts`
**Purpose:** User invitation form (admin creates new user account with name/email/role)

---

## Form Structure Overview

| Property | Value |
|----------|-------|
| Form Type | SimpleForm (card-based) |
| Tabs | 2 (General, Permissions) |
| Total Fields | 4 |
| Required Fields | 3 (first_name, last_name, email) |
| Optional Fields | 1 (role with default) |
| Layout | Centered card (max-w-lg) with tabbed inputs |
| Submit Handler | Custom mutation with SalesService |
| Validation | Zod at API boundary via createSalesSchema |

---

## ASCII Wireframe

```
┌─────────────────────────────────────────────────┐
│  Card: "Create a new user"                      │
│  ┌───────────────────────────────────────────┐  │
│  │ [General]  [Permissions]                   │  │
│  │                                             │  │
│  │ Tab: General                                │  │
│  │ ┌─────────────────────────────────────┐    │  │
│  │ │ First Name *                        │    │  │
│  │ │ [text input]                        │    │  │
│  │ │ Helper: Required field              │    │  │
│  │ └─────────────────────────────────────┘    │  │
│  │                                             │  │
│  │ ┌─────────────────────────────────────┐    │  │
│  │ │ Last Name *                         │    │  │
│  │ │ [text input]                        │    │  │
│  │ │ Helper: Required field              │    │  │
│  │ └─────────────────────────────────────┘    │  │
│  │                                             │  │
│  │ ┌─────────────────────────────────────┐    │  │
│  │ │ Email *                             │    │  │
│  │ │ [text input]                        │    │  │
│  │ │ Helper: User will receive invite... │    │  │
│  │ └─────────────────────────────────────┘    │  │
│  │                                             │  │
│  │ Tab: Permissions                            │  │
│  │ ┌─────────────────────────────────────┐    │  │
│  │ │ Role                                │    │  │
│  │ │ [Select: Rep ▼]                     │    │  │
│  │ │ Helper: Rep: Edit own records...    │    │  │
│  │ └─────────────────────────────────────┘    │  │
│  │                                             │  │
│  │ [Cancel]  [Save]                            │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## Complete Field Inventory

| # | Field | Label | Input Type | Required | Default | Validation | Source Line |
|---|-------|-------|------------|----------|---------|------------|-------------|
| 1 | `first_name` | First Name * | TextInput | Yes | - | min(1), max(100) | SalesGeneralTab.tsx:12 |
| 2 | `last_name` | Last Name * | TextInput | Yes | - | min(1), max(100) | SalesGeneralTab.tsx:13 |
| 3 | `email` | Email * | TextInput | Yes | - | email(), max(254) | SalesGeneralTab.tsx:14-18 |
| 4 | `role` | Role | SelectInput | No | "rep" | enum(["admin", "manager", "rep"]) | SalesPermissionsInputs.tsx:13-19 |

### Field Details

#### Tab 1: General (SalesGeneralTab.tsx)

**first_name** (Line 12)
- Type: TextInput
- Label: "First Name *"
- Helper Text: "Required field"
- Validation: Required, 1-100 characters
- Schema: `z.string().min(1, "First name is required").max(100, "First name too long")`

**last_name** (Line 13)
- Type: TextInput
- Label: "Last Name *"
- Helper Text: "Required field"
- Validation: Required, 1-100 characters
- Schema: `z.string().min(1, "Last name is required").max(100, "Last name too long")`

**email** (Lines 14-18)
- Type: TextInput
- Label: "Email *"
- Helper Text: "User will receive an invitation email to set their password"
- Validation: Required, valid email format, max 254 characters
- Schema: `z.string().email("Must be a valid email address").max(VALIDATION_LIMITS.EMAIL_MAX, "Email too long")`
- Note: Communicates invite flow to admin

#### Tab 2: Permissions (SalesPermissionsInputs.tsx)

**role** (Lines 13-19)
- Type: SelectInput
- Label: "Role"
- Helper Text: "Rep: Edit own records. Manager: Edit all records. Admin: Full system access."
- Default: "rep"
- Choices: `ROLE_CHOICES` from validation/sales.ts
  - admin → "Admin"
  - manager → "Manager"
  - rep → "Rep"
- Validation: Must be one of enum values
- Schema: `z.enum(["admin", "manager", "rep"]).default("rep")`

---

## Input Types Used

| Input Type | Count | Fields |
|------------|-------|--------|
| TextInput | 3 | first_name, last_name, email |
| SelectInput | 1 | role |
| **Total** | **4** | |

---

## Dropdowns Detail

### role (SelectInput)

**Source:** `ROLE_CHOICES` constant from `src/atomic-crm/validation/sales.ts:25-29`

```typescript
export const ROLE_CHOICES = [
  { id: "admin", name: "Admin" },
  { id: "manager", name: "Manager" },
  { id: "rep", name: "Rep" },
] as const;
```

| Value | Display Label | Description |
|-------|---------------|-------------|
| admin | Admin | Full system access |
| manager | Manager | Edit all records |
| rep | Rep | Edit own records |

**Default Value:** "rep"
**Validation:** `z.enum(["admin", "manager", "rep"])`
**Helper Text:** Full permission descriptions shown inline

---

## Sections & Layout Breakdown

### Overall Layout (SalesCreate.tsx:44-55)

- **Container:** `max-w-lg w-full mx-auto mt-8` (centered, constrained width)
- **Card Structure:**
  - CardHeader with CardTitle: "Create a new user" (Line 47)
  - CardContent containing SimpleForm (Lines 49-52)

### Form Structure (SalesCreate.tsx:50)

- **Form Component:** SimpleForm from `@/components/admin/simple-form`
- **Default Values:** `createSalesSchema.partial().parse({})` (Line 21)
- **Submit Handler:** Custom mutation using SalesService.salesCreate (Lines 24-38)
- **Form Content:** SalesFormContent component with error summary and inputs (Lines 59-67)

### Tab Layout (SalesInputs.tsx:6-21)

**Tab 1: General** (Lines 7-12)
- Key: "general"
- Label: "General"
- Fields Tracked: ["first_name", "last_name", "email"]
- Content: `<SalesGeneralTab />`
- Layout: `space-y-2` (tight vertical spacing)

**Tab 2: Permissions** (Lines 13-18)
- Key: "permissions"
- Label: "Permissions"
- Fields Tracked: ["role"]
- Content: `<SalesPermissionsInputs />`
- Layout: `space-y-4` (standard vertical spacing)

### Tab Implementation

- **Component:** TabbedFormInputs (via index export)
- **Default Tab:** "general"
- **Error Tracking:** Tab triggers show error counts per tab
- **Error Summary:** FormErrorSummary shown when errors exist (Line 64)

---

## Styling & Design Tokens

### Color Tokens (Semantic)

| Element | Token | Usage |
|---------|-------|-------|
| Card Background | `bg-card` | Card container |
| Form Container | `bg-card` | Toolbar background |
| Muted Background | `bg-muted` | Tab list background |
| Border | `border` | Tab borders |
| Text | `text-muted-foreground` | Helper text |

### Sizing & Spacing

| Element | Class | Value |
|---------|-------|-------|
| Card Max Width | `max-w-lg` | 32rem (512px) |
| Top Margin | `mt-8` | 2rem |
| Form Gap | `gap-4` | 1rem (SimpleForm default) |
| General Tab Fields | `space-y-2` | 0.5rem vertical |
| Permissions Tab Fields | `space-y-4` | 1rem vertical |
| Input Height | `h-9` | 2.25rem (from Input component) |
| Touch Target | `h-11 w-11` | 2.75rem (buttons, per design system) |

### Layout Classes

- `max-w-lg` - Constrains form width to 32rem
- `w-full` - Full width within constraints
- `mx-auto` - Centers horizontally
- `mt-8` - Top margin spacing
- `space-y-2` / `space-y-4` - Vertical field spacing

### Responsive Behavior

- Form is centered with `mx-auto`
- No explicit mobile breakpoints in this form
- Card naturally constrains to `max-w-lg` on all screens
- Inherits responsive behavior from SimpleForm and Card components

---

## Accessibility Audit

### Labels

| Field | Has Label | Label Text | Explicit Required Indicator |
|-------|-----------|------------|----------------------------|
| first_name | Yes | "First Name *" | Yes (asterisk) |
| last_name | Yes | "Last Name *" | Yes (asterisk) |
| email | Yes | "Email *" | Yes (asterisk) |
| role | Yes | "Role" | No (has default) |

**Status:** All fields properly labeled with FieldTitle component (React Admin standard)

### ARIA Attributes

- **FormField Component:** Provides proper field-level ARIA via react-hook-form context
- **FormLabel:** Associated with input via id/htmlFor
- **FormError:** Error messages announced via `role="alert"` (inherited from FormError component)
- **aria-invalid:** Automatically set by react-hook-form when field has errors
- **aria-describedby:** Links input to helper text and error messages

**Status:** Full ARIA support through FormField/FormLabel/FormError component chain

### Helper Text

| Field | Has Helper Text | Content |
|-------|-----------------|---------|
| first_name | Yes | "Required field" |
| last_name | Yes | "Required field" |
| email | Yes | "User will receive an invitation email to set their password" |
| role | Yes | "Rep: Edit own records. Manager: Edit all records. Admin: Full system access." |

**Status:** All fields have contextual helper text explaining requirements or behavior

### Focus Management

- Default browser focus order (tab sequence)
- No custom focus trapping
- Cancel/Save buttons in logical order

### Keyboard Navigation

- Tab navigation through all form fields
- Enter submits form
- Escape cancels (via CancelButton behavior)
- SelectInput supports keyboard (Space/Enter to open, Arrow keys to navigate)

---

## Responsive Behavior Notes

### Desktop (1440px+)
- Card centered with `max-w-lg` (512px width)
- Full tab labels visible
- Standard spacing

### Tablet (iPad, 768-1024px)
- Card still centered and constrained
- No layout changes needed
- Touch targets meet 44x44px minimum

### Mobile (<768px)
- Card fills width (respecting `max-w-lg`)
- Tabs may wrap if labels are long (current labels fit)
- Form fields stack naturally
- No explicit mobile optimizations needed (simple layout)

**Note:** This form is admin-only functionality, primarily used on desktop. Mobile/tablet support is adequate but not optimized.

---

## Zod Schema Reference

### Full createSalesSchema (validation/sales.ts:111-128)

```typescript
export const createSalesSchema = salesSchema
  .omit({
    id: true,
    user_id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  })
  .extend({
    // Password optional - Edge Function uses Supabase inviteUserByEmail for password setup
    password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long").optional(),
  })
  .required({
    first_name: true,
    last_name: true,
    email: true,
    // Note: password removed from required - user sets via invite email
  });
```

### Base salesSchema Fields Used

```typescript
first_name: z.string().min(1, "First name is required").max(100, "First name too long"),
last_name: z.string().min(1, "Last name is required").max(100, "Last name too long"),
email: z.string().email("Must be a valid email address").max(VALIDATION_LIMITS.EMAIL_MAX, "Email too long"),
role: z.enum(["admin", "manager", "rep"]).default("rep"),
```

### Validation Constants (validation/constants.ts)

```typescript
EMAIL_MAX: 254,  // RFC 5321 maximum email address length
NAME_MAX: 100,   // Used for first_name, last_name
```

### Default Values (SalesCreate.tsx:20-22)

```typescript
const formDefaults = {
  ...createSalesSchema.partial().parse({}),
};
```

**Resolves to:**
```typescript
{
  role: "rep",  // Only default value in schema
}
```

---

## Component Tree

```
SalesCreate (src/atomic-crm/sales/SalesCreate.tsx)
├── Card
│   ├── CardHeader
│   │   └── CardTitle: "Create a new user"
│   └── CardContent
│       └── SimpleForm (@/components/admin/simple-form)
│           ├── SalesFormContent (internal component)
│           │   ├── FormErrorSummary (@/components/admin/FormErrorSummary)
│           │   └── SalesInputs (src/atomic-crm/sales/SalesInputs.tsx)
│           │       └── TabbedFormInputs (@/components/admin/tabbed-form)
│           │           ├── TabsList
│           │           │   ├── TabTriggerWithErrors: "General"
│           │           │   └── TabTriggerWithErrors: "Permissions"
│           │           ├── TabPanel: "General"
│           │           │   └── SalesGeneralTab (src/atomic-crm/sales/SalesGeneralTab.tsx)
│           │           │       ├── TextInput (first_name)
│           │           │       ├── TextInput (last_name)
│           │           │       └── TextInput (email)
│           │           └── TabPanel: "Permissions"
│           │               └── SalesPermissionsInputs (src/atomic-crm/sales/SalesPermissionsInputs.tsx)
│           │                   └── SelectInput (role)
│           └── FormToolbar (default)
│               ├── CancelButton
│               └── SaveButton
```

---

## Shared Components Used

### Form Infrastructure
- **SimpleForm** (`@/components/admin/simple-form`) - React Admin Form wrapper with toolbar
- **FormErrorSummary** (`@/components/admin/FormErrorSummary`) - Collapsible error banner
- **TabbedFormInputs** (`@/components/admin/tabbed-form`) - Tab container with error tracking
- **FormToolbar** - Sticky toolbar with Cancel/Save buttons

### Input Components
- **TextInput** (`@/components/admin/text-input`) - Text field with validation, helper text, error display
- **SelectInput** (`@/components/admin/select-input`) - Dropdown with choices, validation, helper text

### Tab Components
- **TabTriggerWithErrors** - Tab button with error count badge
- **TabPanel** - Tab content container

### UI Primitives
- **Card/CardHeader/CardTitle/CardContent** (`@/components/ui/card`)
- **Tabs/TabsList** (`@/components/ui/tabs`)
- **Input** (`@/components/ui/input`)
- **Select/SelectTrigger/SelectValue/SelectContent/SelectItem** (`@/components/ui/select`)

### Utilities
- **useInput** (ra-core) - React Admin input hook
- **useFormState** (react-hook-form) - Form state access
- **useMutation** (@tanstack/react-query) - Async mutation handling
- **SalesService** (`../services`) - API service layer

---

## Inconsistencies & Notes

### Strengths

1. **Industry-Standard Invite Flow:** Admin enters name/email/role only. User receives invite email and sets their own password. This is properly communicated via helper text (email field).

2. **Minimal Required Fields:** Only collects essential information (name, email) with sensible role default ("rep"). Reduces friction for admin.

3. **Clear Permission Model:** Role helper text explicitly explains each role's capabilities. No ambiguity.

4. **Validation at API Boundary:** Follows Engineering Constitution - validation happens in createSalesSchema and Edge Function, NOT in form components.

5. **Proper Error Handling:** FormErrorSummary shows validation errors. Mutation errors trigger toast notifications.

6. **Semantic Tokens:** Uses proper design system tokens (`bg-card`, `text-muted-foreground`, etc.) per Tailwind v4 guidelines.

7. **Accessibility:** Full ARIA support, helper text on all fields, proper label associations, keyboard navigation.

8. **Tab Error Tracking:** Tab triggers show error counts, helping users locate validation issues quickly.

### Inconsistencies

None identified. This form follows all project patterns correctly:
- Zod validation at API boundary only
- Semantic color tokens throughout
- Proper component composition (SimpleForm → TabbedFormInputs → Tab components)
- Helper text on all fields
- Default values via `createSalesSchema.partial().parse({})`
- Form state via react-hook-form (not React Admin legacy patterns)

### Notes

1. **Password Field Omitted:** The `createSalesSchema` includes an optional `password` field (Line 121), but it's NOT rendered in the form. This is intentional - the Edge Function uses Supabase `inviteUserByEmail` which sends an invite link. The password field exists in the schema for potential future use but is not part of the current invite flow.

2. **Simplified Create Form:** Unlike SalesEdit, this form only shows General and Permissions tabs. No Profile tab (phone, avatar, timezone) or Notifications tab (digest_opt_in). This keeps the invite flow focused on essentials. Users can update their own profile after activation.

3. **Service Layer:** Uses SalesService.salesCreate() which calls Edge Function `user-invite-or-update`. The service handles the Supabase invite flow and sales table creation.

4. **Mutation Key:** Uses generic "signup" key (Line 25). Should arguably be "sales-create" for clarity, but this is a minor naming issue.

5. **Success Notification:** Message says "User created. They will soon receive an email to set their password." (Line 30). Clear user feedback about what happens next.

6. **No Disabled Toggle:** The Permissions tab doesn't include a "disabled" toggle because it makes no sense to create a user as disabled. The toggle exists in SalesEdit for deactivating existing users.

7. **FormDefaults Pattern:** Properly uses `createSalesSchema.partial().parse({})` to derive defaults from schema (Line 21). Only `role: "rep"` has a default in the schema.

8. **Card-Based Layout:** Unlike most other Create forms which use full-page TabbedForm, this uses a centered Card. This is appropriate for the minimal field count (4 fields) and admin-focused use case.

---

## Schema-to-UI Mapping

| Schema Field | Rendered in UI | Tab | Notes |
|--------------|----------------|-----|-------|
| first_name | Yes | General | Required TextInput |
| last_name | Yes | General | Required TextInput |
| email | Yes | General | Required TextInput with invite flow helper text |
| role | Yes | Permissions | SelectInput with default "rep" |
| password | No | - | Optional in schema but not shown (invite flow) |
| phone | No | - | Not collected during invite |
| avatar_url | No | - | Not collected during invite |
| disabled | No | - | Not shown (doesn't make sense for new user) |
| digest_opt_in | No | - | Not collected (defaults to true in schema) |
| timezone | No | - | Not collected (defaults to America/Chicago) |
| id, user_id, timestamps | No | - | System fields, omitted from createSalesSchema |

**Coverage:** 4 of 4 user-enterable fields in createSalesSchema are rendered. All omitted fields are either system-generated, defaulted, or intentionally excluded from invite flow.

---

## Validation Error Messages

### Field-Level Errors

| Field | Error Condition | Message |
|-------|-----------------|---------|
| first_name | Empty | "First name is required" |
| first_name | >100 chars | "First name too long" |
| last_name | Empty | "Last name is required" |
| last_name | >100 chars | "Last name too long" |
| email | Empty | Implicit required error from Zod |
| email | Invalid format | "Must be a valid email address" |
| email | >254 chars | "Email too long" |
| role | Not in enum | Implicit enum error from Zod |

### Form-Level Errors

- **Validation Failed:** Shown in FormErrorSummary when multiple fields have errors
- **Mutation Error:** Toast notification with "An error occurred while creating the user." (Line 34)
- **Success:** Toast notification with "User created. They will soon receive an email to set their password." (Line 30)

---

## Performance Considerations

1. **Minimal Re-renders:** Uses TabbedFormInputs which memoizes error counts to avoid unnecessary re-renders
2. **No Watch:** Doesn't use `watch()` for subscriptions (no conditional field logic needed)
3. **Async Mutation:** Uses React Query's useMutation for proper loading/error states
4. **Form Mode:** Default onSubmit mode (no onChange validation storms)
5. **Lightweight:** Only 4 fields, no complex calculations or dependencies

---

## File References

### Main Files
- **Form:** `src/atomic-crm/sales/SalesCreate.tsx` (69 lines)
- **Inputs:** `src/atomic-crm/sales/SalesInputs.tsx` (23 lines)
- **General Tab:** `src/atomic-crm/sales/SalesGeneralTab.tsx` (22 lines)
- **Permissions Tab:** `src/atomic-crm/sales/SalesPermissionsInputs.tsx` (23 lines)

### Schema & Validation
- **Schema:** `src/atomic-crm/validation/sales.ts` (210 lines, createSalesSchema: 111-128)
- **Constants:** `src/atomic-crm/validation/constants.ts` (VALIDATION_LIMITS)

### Shared Components
- `src/components/admin/simple-form.tsx`
- `src/components/admin/tabbed-form/TabbedFormInputs.tsx`
- `src/components/admin/text-input.tsx`
- `src/components/admin/select-input.tsx`
- `src/components/admin/FormErrorSummary.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`

### Services
- `src/atomic-crm/services/SalesService.ts` (salesCreate method)
- Edge Function: `supabase/functions/user-invite-or-update`

---

## Test Coverage Recommendations

### Unit Tests (Vitest)

1. **Form Rendering:** Verify all 4 fields render in correct tabs
2. **Default Values:** Confirm role defaults to "rep"
3. **Validation:** Test required field validation (first_name, last_name, email)
4. **Email Validation:** Test invalid email format rejection
5. **Role Choices:** Verify ROLE_CHOICES render correctly in SelectInput
6. **Helper Text:** Confirm all helper text displays correctly
7. **Error Summary:** Test FormErrorSummary appears when validation fails
8. **Tab Errors:** Verify error counts show on tab triggers

### Integration Tests (Playwright)

1. **Happy Path:** Fill all required fields, submit, verify success notification
2. **Validation Errors:** Submit with empty fields, verify error messages
3. **Invalid Email:** Enter invalid email, verify error
4. **Role Selection:** Change role from default, verify selection persists
5. **Tab Navigation:** Switch between tabs, verify content changes
6. **Cancel:** Click cancel, verify navigation away from form
7. **Edge Function Integration:** Mock invite email send, verify user creation

---

## Summary

The SalesCreate form is a **minimal, focused user invite form** that follows industry-standard patterns for admin-initiated user creation. It collects only essential information (name, email, role) and relies on Supabase's invite email system for password setup.

**Key Characteristics:**
- 4 fields across 2 tabs (General, Permissions)
- Card-based layout (centered, max-w-lg)
- Zod validation at API boundary via createSalesSchema
- Proper accessibility with labels, ARIA, helper text
- Semantic design tokens throughout
- Clear communication of invite flow to admin
- Mutation-based submission with React Query
- Tab-level error tracking

**Compliance:**
- Follows Engineering Constitution (Zod at API boundary, semantic tokens, fail-fast)
- Matches design system (Tailwind v4, touch targets, spacing)
- Implements industry-standard invite flow (no password field)
- Uses project patterns (SimpleForm, TabbedFormInputs, shared input components)

This form is a good example of **appropriate minimalism** - it collects exactly what's needed for user invitation and defers profile details to post-activation setup.
