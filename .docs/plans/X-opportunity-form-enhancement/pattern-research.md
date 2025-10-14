# Pattern Research: Opportunity Form Layout Enhancement

**Research Date:** 2025-09-30
**Focus:** Understanding layout differences between Show and Edit modes to align form structure
**Reference Screenshot:** `/home/krwhynot/Projects/atomic/docs/2025-09/chrome_7GDH1cVVqI.png`

## Executive Summary

The current opportunity forms have a **significant structural mismatch** between Show and Edit modes:
- **Show mode**: Single-column card with horizontal field groups using flex layout
- **Edit mode**: Simple vertical form with sequential inputs
- **Goal**: Align Edit mode layout to match Show mode's visual structure (as shown in screenshot)

**Key Pattern Found:** Contacts and Organizations both use **Aside components** for side-by-side layouts, but opportunities currently do not. The screenshot shows a clean show view without an aside, suggesting we should focus on improving the main content area layout rather than adding an aside.

---

## Current Layout Analysis

### OpportunityShow.tsx Structure

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityShow.tsx`

**Layout Pattern:**
```tsx
<Card>
  <CardContent className="pt-6">
    {/* Header section */}
    <div className="flex justify-between items-start mb-8">
      <div className="flex items-center gap-4">
        <OrganizationAvatar />
        <h2>{record.name}</h2>
      </div>
      <div className="flex gap-2">
        <ArchiveButton /> <EditButton />
      </div>
    </div>

    {/* First row of fields - horizontal flex */}
    <div className="flex gap-8 m-4">
      <div className="flex flex-col mr-10">
        <span className="text-xs text-muted-foreground tracking-wide">
          Expected closing date
        </span>
        <span className="text-sm">{formattedDate}</span>
      </div>
      <div className="flex flex-col mr-10">
        <span className="text-xs text-muted-foreground tracking-wide">Budget</span>
        <span className="text-sm">{formattedAmount}</span>
      </div>
      <div className="flex flex-col mr-10">
        <span className="text-xs text-muted-foreground tracking-wide">Probability</span>
        <span className="text-sm">{record.probability}%</span>
      </div>
      {/* More fields... */}
    </div>

    {/* Second row - organization details */}
    <div className="flex gap-8 m-4">
      <div className="flex flex-col mr-10">
        <span className="text-xs text-muted-foreground tracking-wide">
          Customer Organization
        </span>
        <ReferenceField>{/* ... */}</ReferenceField>
      </div>
      {/* More org fields... */}
    </div>

    {/* Contacts section */}
    {!!record.contact_ids?.length && (
      <div className="m-4">
        <span className="text-xs text-muted-foreground tracking-wide">Contacts</span>
        <ReferenceArrayField>{/* ... */}</ReferenceArrayField>
      </div>
    )}

    {/* Description */}
    {record.description && (
      <div className="m-4 whitespace-pre-line">
        <span className="text-xs text-muted-foreground tracking-wide">Description</span>
        <p className="text-sm leading-6">{record.description}</p>
      </div>
    )}

    {/* Products table */}
    {record.products && record.products.length > 0 && (
      <div className="m-4">
        <span className="text-xs text-muted-foreground tracking-wide">
          Product Line Items
        </span>
        <ArrayField source="products">
          <DataTable>{/* columns... */}</DataTable>
        </ArrayField>
      </div>
    )}

    {/* Notes section */}
    <div className="m-4">
      <Separator className="mb-4" />
      <ReferenceManyField>{/* notes... */}</ReferenceManyField>
    </div>
  </CardContent>
</Card>
```

**Key Visual Elements from Screenshot:**
1. Header with avatar circle (organization logo), opportunity name, Archive/Edit buttons
2. Horizontal field groups with small gray labels and larger values
3. Fields organized in logical rows:
   - Row 1: Expected closing date, Budget, Probability, Opportunity Context, Stage, Priority
   - Row 2: Customer Organization, Principal Organization (if present), Distributor Organization (if present)
   - Row 3: Contacts (chip/badge style display)
4. Description as full-width text block
5. Product Line Items table with 5 columns: Product, Quantity, Unit Price, Extended Price, Notes
6. Notes section at bottom with separator

**Layout Classes:**
- `flex gap-8 m-4` - Horizontal field groups
- `flex flex-col mr-10` - Individual field containers (label + value)
- `text-xs text-muted-foreground tracking-wide` - Consistent label styling
- `text-sm` - Value text sizing

---

### OpportunityEdit.tsx Structure

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityEdit.tsx`

**Current Layout:**
```tsx
<EditBase>
  <div className="mt-2">
    <EditHeader /> {/* Avatar + Name */}
    <div className="flex gap-8">
      <Form className="flex flex-1 flex-col gap-4 pb-2">
        <Card>
          <CardContent>
            <OpportunityInputs mode="edit" />
            <FormToolbar>
              <DeleteButton />
              <CancelButton />
              <SaveButton />
            </FormToolbar>
          </CardContent>
        </Card>
      </Form>
    </div>
  </div>
</EditBase>
```

**Issues:**
1. Single-column vertical layout (no matching horizontal field groups)
2. No visual grouping to match Show mode sections
3. Different spacing/margin system
4. Missing the header structure that Show mode has
5. No clear separation between logical field groups

---

### OpportunityInputs.tsx Structure

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityInputs.tsx`

**Current Pattern:**
```tsx
export const OpportunityInputs = ({ mode }: { mode: "create" | "edit" }) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-8">
      <OpportunityInfoInputs mode={mode} />

      <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
        <OpportunityLinkedToInputs />
        <Separator orientation={isMobile ? "horizontal" : "vertical"} />
        <OpportunityMiscInputs />
      </div>

      <Separator />
      <OpportunityProductsInput />

      {/* Stage-specific fields if needed */}
    </div>
  );
};
```

**Component Breakdown:**

1. **OpportunityInfoInputs** (lines 60-89):
   - Name with auto-regenerate button (edit mode only)
   - Description textarea

2. **OpportunityLinkedToInputs** (lines 91-125):
   - Title: "Linked to"
   - Customer Organization (AutocompleteOrganizationInput)
   - Principal Organization (optional)
   - Distributor Organization (optional)
   - Contacts (AutocompleteArrayInput)

3. **OpportunityMiscInputs** (lines 127-180):
   - Title: "Misc"
   - Opportunity Context (SelectInput)
   - Stage (SelectInput)
   - Priority (SelectInput)
   - Amount (NumberInput)
   - Probability (NumberInput)
   - Expected Closing Date (TextInput type="date")

4. **OpportunityProductsInput** (custom component):
   - Dynamic array with useFieldArray
   - Product selection, quantity, pricing

**Existing Responsive Pattern:**
- Uses `useIsMobile()` hook
- Desktop: side-by-side with vertical separator (`flex-row`)
- Mobile: stacked (`flex-col`)
- This pattern works but doesn't match Show mode's horizontal field grouping

---

## Similar Feature Patterns

### Pattern 1: Contact Show/Edit Alignment

**Files:**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactShow.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactEdit.tsx`

**Layout Strategy:**
```tsx
// ContactShow.tsx
<div className="mt-2 mb-2 flex gap-8">
  <div className="flex-1">
    <Card>{/* main content */}</Card>
  </div>
  <ContactAside /> {/* 256px fixed width aside */}
</div>

// ContactEdit.tsx
<div className="mt-2 flex gap-8">
  <Form className="flex flex-1 flex-col gap-4">
    <Card>{/* form inputs */}</Card>
  </Form>
  <ContactAside link="show" /> {/* same aside component */}
</div>
```

**Key Insight:** Contacts achieve alignment by:
1. Using identical outer container structure (`flex gap-8`)
2. Sharing the same `ContactAside` component between show/edit
3. Main content area (`flex-1`) fills remaining space

**Aside Component Pattern:**
- Fixed width: `w-64 min-w-64` (256px)
- Responsive: `hidden sm:block` (hidden on mobile)
- Sections use `AsideSection` component for consistency
- Contains metadata, tasks, tags, personal info

---

### Pattern 2: Organization Show/Edit Alignment

**Files:**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationShow.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationEdit.tsx`

**Layout Strategy:**
```tsx
// OrganizationShow.tsx
<div className="mt-2 flex pb-2 gap-8">
  <div className="flex-1">
    <Card>{/* main content with tabs */}</Card>
  </div>
  <OrganizationAside />
</div>

// OrganizationEdit.tsx
<div className="mt-2 flex gap-8">
  <Form className="flex flex-1 flex-col gap-4 pb-2">
    <Card>{/* form inputs */}</Card>
  </Form>
  <OrganizationAside link="show" />
</div>
```

**Same pattern:** Aside component + flex layout for alignment

**Aside Width:** `w-[250px] min-w-[250px]` (250px fixed)

---

### Pattern 3: AsideSection Reusable Component

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/misc/AsideSection.tsx`

**Implementation:**
```tsx
export type AsideSectionProps = {
  title: string;
  children?: ReactNode;
  noGap?: boolean;
};

export function AsideSection({ title, children, noGap }: AsideSectionProps) {
  return (
    <div className="mb-6 text-sm">
      <h3 className="font-medium pb-1">{title}</h3>
      <Separator />
      <div className={cn("pt-2 flex flex-col", { "gap-1": !noGap })}>
        {children}
      </div>
    </div>
  );
}
```

**Usage Pattern:**
```tsx
<AsideSection title="Personal info">
  <ArrayField source="email">
    <SingleFieldList>{/* email display */}</SingleFieldList>
  </ArrayField>
  {/* more fields... */}
</AsideSection>
```

**Benefits:**
- Consistent section styling across all entities
- Separator automatically included
- Optional gap control via `noGap` prop

---

## Field Organization Patterns

### Show Mode Field Display Pattern

From `OpportunityShow.tsx` and screenshot analysis:

```tsx
// Horizontal field group pattern
<div className="flex gap-8 m-4">
  <div className="flex flex-col mr-10">
    <span className="text-xs text-muted-foreground tracking-wide">
      {labelText}
    </span>
    <span className="text-sm">{valueText}</span>
  </div>
  {/* Repeat for more fields */}
</div>
```

**Key Styling:**
- Outer container: `flex gap-8 m-4`
- Field container: `flex flex-col mr-10`
- Label: `text-xs text-muted-foreground tracking-wide`
- Value: `text-sm`
- Spacing: `gap-8` between fields, `mr-10` on each field for right margin

**Grouping Logic:**
1. Financial/Metrics row: closing date, budget, probability
2. Classification row: context, stage, priority
3. Organizations row: customer, principal, distributor
4. Contacts section: full width with array display
5. Products table: full width DataTable

---

### Form Mode Input Patterns

Current patterns from `OpportunityInputs.tsx`:

```tsx
// Two-column responsive layout with separator
<div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
  <div className="flex flex-col gap-4 flex-1">
    <h3 className="text-base font-medium">Section Title</h3>
    {/* inputs... */}
  </div>

  <Separator orientation={isMobile ? "horizontal" : "vertical"} />

  <div className="flex flex-col gap-4 flex-1">
    <h3 className="text-base font-medium">Section Title</h3>
    {/* inputs... */}
  </div>
</div>
```

**Input Field Pattern:**
```tsx
<TextInput
  source="field_name"
  label="Field Label"
  helperText="Helper text or false"
/>
```

---

## Reusable Components

### 1. FormToolbar Component

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/layout/FormToolbar.tsx`

```tsx
export const FormToolbar = () => (
  <KitFormToolbar className="flex md:flex flex-row justify-between gap-2">
    <DeleteButton />
    <div className="flex flex-row gap-2 justify-end">
      <CancelButton />
      <SaveButton />
    </div>
  </KitFormToolbar>
);
```

**Usage:** Already used in `OpportunityEdit.tsx` - no changes needed

### 2. OrganizationAvatar Component

**Used in both Show and Edit headers:**
```tsx
<ReferenceField
  source="customer_organization_id"
  reference="organizations"
  link={false}
>
  <OrganizationAvatar />
</ReferenceField>
```

### 3. Separator Component

**From shadcn/ui:**
```tsx
import { Separator } from "@/components/ui/separator";

// Usage
<Separator className="mb-4" />
<Separator orientation="vertical" />
```

### 4. Card Component Structure

**Standard pattern across all entities:**
```tsx
<Card>
  <CardContent className="pt-6"> {/* or default padding */}
    {/* content */}
  </CardContent>
</Card>
```

---

## New Components Analysis

### OpportunityProductsInput Component

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityProductsInput.tsx` (already created)

**Pattern Used:**
- `useFieldArray` from react-hook-form for dynamic array
- `useWatch` to monitor principal_organization_id for filtering
- Product selection via ReferenceInput with dynamic filter
- Grid layout for product fields: `grid grid-cols-2 gap-3`
- Border + rounded styling: `border rounded-lg p-4`

**Key Features:**
1. Disabled until principal selected
2. Auto-clears products when principal changes (useEffect)
3. Each product row has remove button
4. Add Product button at section header
5. Calculated extended_price field (disabled input)

**Layout Structure:**
```tsx
<div className="flex flex-col gap-4 flex-1">
  <div className="flex justify-between items-center">
    <h3>Product Line Items</h3>
    <Button onClick={handleAddProduct}>Add Product</Button>
  </div>

  <div className="space-y-4">
    {fields.map((field, index) => (
      <div key={field.id} className="border rounded-lg p-4 space-y-3">
        {/* Grid of inputs */}
      </div>
    ))}
  </div>
</div>
```

---

### OpportunityContextInput Component

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityContextInput.tsx` (already created)

**Implementation - SIMPLIFIED (7 values only):**
```tsx
export const OPPORTUNITY_CONTEXT_CHOICES = [
  { id: "Site Visit", name: "Site Visit" },
  { id: "Food Show", name: "Food Show" },
  { id: "New Product Interest", name: "New Product Interest" },
  { id: "Follow-up", name: "Follow-up" },
  { id: "Demo Request", name: "Demo Request" },
  { id: "Sampling", name: "Sampling" },
  { id: "Custom", name: "Custom" },
];

export const OpportunityContextInput = () => {
  return (
    <SelectInput
      source="opportunity_context"
      label="Opportunity Context"
      choices={OPPORTUNITY_CONTEXT_CHOICES}
      helperText={false}
    />
  );
};
```

**Key Point:** Clean 7-value dropdown, no legacy support needed per SIMPLIFIED-PLAN-SUMMARY.md

---

## Layout Alignment Strategy

Based on the screenshot and patterns found, here are **two possible approaches**:

### Approach A: Add OpportunityAside Component (Matches Contacts/Organizations Pattern)

**Pros:**
- Consistent with existing Contact/Organization patterns
- Clean separation of metadata vs. form fields
- Aside can show calculated fields, related data, tasks

**Cons:**
- Screenshot doesn't show an aside panel
- More complex refactoring
- May not match user's visual goal

**Implementation:**
1. Create `OpportunityAside.tsx` component
2. Move metadata fields to aside (owner, dates, priority)
3. Update both Show and Edit to use aside layout
4. Main area focuses on core opportunity fields + products

---

### Approach B: Improve Main Content Area Layout (Recommended based on screenshot)

**Pros:**
- Matches the visual goal shown in screenshot
- Simpler implementation
- Focuses on horizontal field grouping
- No aside needed

**Cons:**
- Different pattern from Contacts/Organizations
- Requires custom responsive layout logic

**Implementation Strategy:**

1. **Keep existing OpportunityShow.tsx layout** - it already matches the screenshot

2. **Update OpportunityEdit.tsx** to mirror Show mode structure:
   ```tsx
   <Card>
     <CardContent className="pt-6">
       {/* Header with avatar + name (read-only display) */}
       <div className="flex justify-between items-start mb-8">
         <div className="flex items-center gap-4">
           <OrganizationAvatar />
           <h2>{record.name}</h2>
         </div>
       </div>

       {/* Form fields organized in horizontal groups */}
       <Form>
         {/* Row 1: Core metrics */}
         <div className="flex gap-8 m-4 flex-wrap">
           <div className="flex flex-col" style={{minWidth: '200px'}}>
             <TextInput source="expected_closing_date" label="Expected Closing Date" />
           </div>
           <div className="flex flex-col" style={{minWidth: '150px'}}>
             <NumberInput source="amount" label="Budget" />
           </div>
           <div className="flex flex-col" style={{minWidth: '100px'}}>
             <NumberInput source="probability" label="Probability (%)" />
           </div>
         </div>

         {/* Row 2: Classification */}
         <div className="flex gap-8 m-4 flex-wrap">
           <div className="flex flex-col" style={{minWidth: '200px'}}>
             <OpportunityContextInput />
           </div>
           <div className="flex flex-col" style={{minWidth: '150px'}}>
             <SelectInput source="stage" label="Stage" />
           </div>
           <div className="flex flex-col" style={{minWidth: '150px'}}>
             <SelectInput source="priority" label="Priority" />
           </div>
         </div>

         {/* Row 3: Organizations */}
         <div className="flex gap-8 m-4 flex-wrap">
           <div className="flex flex-col flex-1" style={{minWidth: '250px'}}>
             <ReferenceInput source="customer_organization_id">
               <AutocompleteOrganizationInput />
             </ReferenceInput>
           </div>
           {/* Principal, Distributor... */}
         </div>

         {/* Row 4: Contacts */}
         <div className="m-4">
           <ReferenceArrayInput source="contact_ids">
             <AutocompleteArrayInput />
           </ReferenceArrayInput>
         </div>

         {/* Description */}
         <div className="m-4">
           <TextInput source="description" multiline rows={3} />
         </div>

         {/* Products */}
         <div className="m-4">
           <Separator className="mb-4" />
           <OpportunityProductsInput />
         </div>

         <FormToolbar />
       </Form>
     </CardContent>
   </Card>
   ```

3. **Key Layout Classes:**
   - Horizontal groups: `flex gap-8 m-4 flex-wrap`
   - Individual field containers: `flex flex-col` with `minWidth` for responsive behavior
   - Full-width sections: `m-4` only (no flex)
   - Separators: `<Separator className="mb-4" />` between major sections

4. **Responsive Behavior:**
   - Use `flex-wrap` instead of media queries
   - Set `minWidth` on field containers to force wrapping on small screens
   - Mobile: fields stack naturally due to wrapping
   - Desktop: fields align horizontally when space available

---

## Recommendations

### Primary Recommendation: Approach B (Improve Main Content Layout)

**Rationale:**
1. Screenshot shows no aside panel - goal is clean horizontal field grouping
2. Opportunities have more fields than Contacts/Organizations - aside would be cramped
3. Simpler implementation path
4. Better matches the visual design goal

**Implementation Steps:**

1. **Phase 1: Update OpportunityEdit header**
   - Add read-only header section matching Show mode
   - Display avatar + name (not editable at top)
   - Keep name field in form for actual editing

2. **Phase 2: Restructure form layout**
   - Replace current vertical stacking with horizontal flex groups
   - Group related fields logically (metrics, classification, organizations)
   - Use consistent spacing: `gap-8 m-4`
   - Add `flex-wrap` for responsive behavior

3. **Phase 3: Add separators**
   - Use `<Separator />` between major sections
   - Match Show mode separator placement
   - Improves visual hierarchy

4. **Phase 4: Test responsive behavior**
   - Verify field wrapping on mobile (< 640px)
   - Ensure inputs remain usable at all breakpoints
   - Maintain consistent spacing

5. **Phase 5: Validate consistency**
   - Compare Edit mode layout side-by-side with Show mode
   - Ensure field order matches
   - Verify labels are consistent

---

### Secondary Recommendation: Field Label Consistency

From screenshot analysis, ensure these label updates:
- "Opportunity Name" (not just "Name")
- "Opportunity Context" (not "Category")
- "Opportunity Owner" (not "Sales Rep" or "Deal Owner")
- "Expected Closing Date" (consistent capitalization)
- "Product Line Items" (section header)

These are already planned in Task 5.1 of parallel-plan.md.

---

## Code Patterns to Follow

### 1. Horizontal Field Groups

```tsx
// Pattern: Flex container with gap and margin
<div className="flex gap-8 m-4 flex-wrap">
  <div className="flex flex-col" style={{minWidth: '200px'}}>
    <TextInput source="field1" label="Field 1" />
  </div>
  <div className="flex flex-col" style={{minWidth: '150px'}}>
    <NumberInput source="field2" label="Field 2" />
  </div>
</div>
```

### 2. Full-Width Sections

```tsx
// Pattern: Margin only, no flex
<div className="m-4">
  <span className="text-xs text-muted-foreground tracking-wide">
    Section Title
  </span>
  <ArrayField source="items">
    {/* content */}
  </ArrayField>
</div>
```

### 3. Section Separators

```tsx
// Pattern: Separator between major sections
<div className="m-4">
  <Separator className="mb-4" />
  <OpportunityProductsInput />
</div>
```

### 4. Responsive Min-Widths

```tsx
// Pattern: Inline styles for min-width (flex-wrap compatibility)
<div className="flex flex-col" style={{minWidth: '200px'}}>
  {/* input */}
</div>

// Alternative: Use Tailwind's min-w utilities
<div className="flex flex-col min-w-[200px]">
  {/* input */}
</div>
```

---

## Anti-Patterns to Avoid

### 1. Don't Use Grid for Form Layouts

**Issue:** Grid requires exact breakpoint management and doesn't wrap naturally

**Bad:**
```tsx
<div className="grid grid-cols-3 gap-4">
  {/* fields */}
</div>
```

**Good:**
```tsx
<div className="flex gap-8 flex-wrap">
  {/* fields with min-width */}
</div>
```

### 2. Don't Mix Layout Approaches

**Issue:** Inconsistent spacing and alignment

**Bad:**
```tsx
<div className="flex gap-8">
  <div className="flex-1">{/* input */}</div>
</div>
<div className="grid grid-cols-2">
  <div>{/* input */}</div>
</div>
```

**Good:**
```tsx
<div className="flex gap-8 m-4 flex-wrap">
  {/* all fields using same pattern */}
</div>
```

### 3. Don't Hardcode Widths for Main Content

**Issue:** Breaks responsive behavior

**Bad:**
```tsx
<div className="w-[800px]">{/* content */}</div>
```

**Good:**
```tsx
<div className="flex-1">{/* content */}</div>
```

### 4. Don't Skip Separators

**Issue:** Loses visual hierarchy from Show mode

**Bad:**
```tsx
<OpportunityMiscInputs />
<OpportunityProductsInput />
```

**Good:**
```tsx
<OpportunityMiscInputs />
<Separator className="mb-4" />
<OpportunityProductsInput />
```

---

## Testing Checklist

After implementing layout changes:

### Visual Consistency Tests
- [ ] Edit mode header matches Show mode header structure
- [ ] Field groups align horizontally on desktop (>= 768px)
- [ ] Field groups stack vertically on mobile (< 768px)
- [ ] Spacing between field groups is consistent (`gap-8`)
- [ ] Section margins match Show mode (`m-4`)
- [ ] Separators appear in same locations as Show mode
- [ ] Product table displays with same columns in both modes

### Functional Tests
- [ ] All inputs remain fully functional
- [ ] Tab order is logical (left-to-right, top-to-bottom)
- [ ] Helper text displays correctly
- [ ] Validation errors show properly
- [ ] Form submission works without layout issues
- [ ] Product array add/remove buttons work
- [ ] Auto-name regenerate button works (edit mode)

### Responsive Tests
- [ ] Fields wrap naturally at 768px breakpoint
- [ ] Mobile layout (< 640px) is fully usable
- [ ] Tablet layout (640-1024px) fields don't overlap
- [ ] Desktop layout (>= 1024px) matches screenshot
- [ ] No horizontal scroll at any breakpoint

### Cross-Browser Tests
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Files Requiring Updates

Based on this research, the following files need layout updates:

### Primary Files
1. `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityEdit.tsx`
   - Restructure outer layout to match Show mode
   - Update header section with read-only display

2. `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityInputs.tsx`
   - Replace two-column separator pattern with horizontal field groups
   - Add flex-wrap for responsive behavior
   - Add inline min-width styles for field containers
   - Group fields to match Show mode sections

### Supporting Files (No Changes Needed)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityShow.tsx` - Already matches goal
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityProductsInput.tsx` - Already created
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityContextInput.tsx` - Already created
- `/home/krwhynot/Projects/atomic/src/atomic-crm/layout/FormToolbar.tsx` - Reusable, no changes needed

---

## Related Documentation

For implementation, refer to:
- **Form patterns:** `.docs/plans/opportunity-form-enhancement/form-patterns.docs.md`
- **Existing architecture:** `.docs/plans/opportunity-form-enhancement/opportunities-architecture.docs.md`
- **Requirements:** `.docs/plans/opportunity-form-enhancement/requirements.md`
- **Parallel plan:** `.docs/plans/opportunity-form-enhancement/parallel-plan.md` (Task 4.3)

---

## Next Steps

1. Review this pattern research with stakeholders
2. Confirm Approach B (main content layout improvement) is preferred
3. Implement layout changes in OpportunityEdit.tsx and OpportunityInputs.tsx
4. Test responsive behavior across breakpoints
5. Validate visual consistency with Show mode
6. Update any related components (OpportunityCreate.tsx may need similar updates)

---

**Research Complete:** 2025-09-30
