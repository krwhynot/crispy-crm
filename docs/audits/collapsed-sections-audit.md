# Collapsed Sections Audit

> **Date:** 2025-12-15
> **Auditor:** Claude Code
> **Scope:** Full codebase scan for accordion/collapsible patterns

## Executive Summary

- **Total instances found:** 21
- **In form contexts:** 13 (HIGH PRIORITY for removal)
- **In non-form contexts:** 8 (evaluate case-by-case)
- **Recommended for removal:** 13
- **Recommended to keep:** 8

### Key Finding

The codebase uses **two patterns** for collapsible content:
1. **Accordion** (Radix) - Used for hierarchical data display and filter panels
2. **Collapsible/CollapsibleSection** (Radix + custom wrapper) - Used for form sections

Per UX research findings (`docs/architecture/form-ux-research-findings.md`), collapsed sections in forms add interaction cost without benefit for desktop-first apps with <15 fields. **Form contexts should be prioritized for removal.**

---

## Findings

### Category 1: Form Sections Using CollapsibleSection Component

These use the `CollapsibleSection` component from `@/components/admin/form` and are **HIGH PRIORITY for removal** per UX research.

---

### 1. OpportunityCompactForm - Three Collapsible Sections

**File:** `src/atomic-crm/opportunities/forms/OpportunityCompactForm.tsx`
**Lines:** 281-460

**Pattern detected:**
```typescript
<CollapsibleSection title="Contacts & Products" defaultOpen>
  {/* 2 complex fields: contact_ids, products_to_sync */}
</CollapsibleSection>

<CollapsibleSection title="Classification" data-tutorial="opp-section-classification">
  {/* 3 fields: lead_source, campaign, tags */}
</CollapsibleSection>

<CollapsibleSection title="Additional Details" data-tutorial="opp-section-details">
  {/* 6 fields: description, next_action, next_action_date, decision_criteria, related_opportunity_id, notes */}
</CollapsibleSection>
```

**Context:**
- Where it appears: Opportunity Create/Edit Form
- What it contains: Required contacts/products (always open), classification metadata, additional details
- Field count inside: 11 fields across 3 sections
- User interaction required: Click to expand collapsed sections

**Assessment:**
- [x] Form context (research says remove)
- [ ] Non-form context (may be appropriate)
- [x] Contains critical fields users might miss (Classification hidden by default)
- [x] Contains optional/advanced fields
- [ ] Has accessibility concerns

**Recommendation:** REMOVE
**Rationale:** Desktop-first app with <15 fields. User must click twice to see all optional fields. Replace with `FormSection` headers for visual grouping without hiding content.

---

### 2. ContactAdditionalDetails - Two Collapsible Sections

**File:** `src/atomic-crm/contacts/ContactAdditionalDetails.tsx`
**Lines:** 14-63

**Pattern detected:**
```typescript
<CollapsibleSection title="Additional Details">
  {/* 4 fields: title, department, linkedin_url, notes */}
</CollapsibleSection>

<CollapsibleSection title="Organization & Territory">
  {/* 3 fields: ContactManagerInput, district_code, territory_name */}
</CollapsibleSection>
```

**Context:**
- Where it appears: Contact Create/Edit Form
- What it contains: Job information, organization relationships
- Field count inside: 7 fields across 2 sections
- User interaction required: Click to expand each section

**Assessment:**
- [x] Form context (research says remove)
- [ ] Non-form context
- [x] Contains critical fields users might miss (territory_name important for sales)
- [x] Contains optional/advanced fields
- [ ] Has accessibility concerns

**Recommendation:** REMOVE
**Rationale:** Only 7 fields total. Hiding them adds unnecessary clicks. Replace with visual grouping via `FormSection` headers.

---

### 3. OrganizationCompactForm - Additional Details Section

**File:** `src/atomic-crm/organizations/OrganizationCompactForm.tsx`
**Lines:** 108-135

**Pattern detected:**
```typescript
<CollapsibleSection title="Additional Details">
  {/* 5 fields: website, phone, linkedin_url, description */}
</CollapsibleSection>
```

**Context:**
- Where it appears: Organization Create/Edit Form
- What it contains: Contact info and description
- Field count inside: 4 fields
- User interaction required: Click to expand

**Assessment:**
- [x] Form context (research says remove)
- [ ] Non-form context
- [ ] Contains critical fields users might miss
- [x] Contains optional/advanced fields
- [ ] Has accessibility concerns

**Recommendation:** REMOVE
**Rationale:** Only 4 optional fields. Form already has `FormSectionWithProgress` headers for visual organization. Keep consistency by removing collapse behavior.

---

### 4. OrganizationHierarchySection

**File:** `src/atomic-crm/organizations/OrganizationHierarchySection.tsx`
**Lines:** 9-40

**Pattern detected:**
```typescript
<CollapsibleSection title="Organization Hierarchy">
  {/* 3 fields: parent_organization_id, org_scope, is_operating_entity */}
</CollapsibleSection>
```

**Context:**
- Where it appears: Organization Edit Form (hierarchy settings)
- What it contains: Parent org, scope (national/regional), operating entity flag
- Field count inside: 3 fields
- User interaction required: Click to expand

**Assessment:**
- [x] Form context (research says remove)
- [ ] Non-form context
- [ ] Contains critical fields users might miss
- [x] Contains optional/advanced fields (advanced org structure)
- [ ] Has accessibility concerns

**Recommendation:** REMOVE
**Rationale:** 3 fields. Better as always-visible `FormSection` with header.

---

### 5. OrganizationAddressSection

**File:** `src/atomic-crm/organizations/OrganizationAddressSection.tsx`
**Lines:** 7-24

**Pattern detected:**
```typescript
<CollapsibleSection title="Address">
  {/* 4 fields: shipping_street, shipping_city, shipping_state, shipping_postal_code */}
</CollapsibleSection>
```

**Context:**
- Where it appears: Organization Edit Form
- What it contains: Shipping address fields
- Field count inside: 4 fields
- User interaction required: Click to expand

**Assessment:**
- [x] Form context (research says remove)
- [ ] Non-form context
- [ ] Contains critical fields users might miss
- [x] Contains optional fields
- [ ] Has accessibility concerns

**Recommendation:** REMOVE
**Rationale:** Standard address fields should be visible. 4 fields is not worth hiding.

---

### 6. OrganizationStatusSection

**File:** `src/atomic-crm/organizations/OrganizationStatusSection.tsx`
**Lines:** 9-47

**Pattern detected:**
```typescript
<CollapsibleSection title="Status & Payment">
  {/* 5 fields: status, status_reason, payment_terms, credit_limit, territory */}
</CollapsibleSection>
```

**Context:**
- Where it appears: Organization Edit Form
- What it contains: Account status and payment configuration
- Field count inside: 5 fields
- User interaction required: Click to expand

**Assessment:**
- [x] Form context (research says remove)
- [ ] Non-form context
- [x] Contains critical fields users might miss (credit_limit important for sales)
- [x] Contains optional/advanced fields
- [ ] Has accessibility concerns

**Recommendation:** REMOVE
**Rationale:** Note in code says "Status & Payment fields hidden per user feedback - defaults: status='active'" - but the section still exists. Either remove entirely or convert to `FormSection`.

---

### 7. ProductDistributionTab - Additional Settings

**File:** `src/atomic-crm/products/ProductDistributionTab.tsx`
**Lines:** 16-20

**Pattern detected:**
```typescript
<CollapsibleSection title="Additional Settings" defaultOpen={false}>
  <p className="text-sm text-muted-foreground">
    Additional distribution settings will appear here.
  </p>
</CollapsibleSection>
```

**Context:**
- Where it appears: Product Edit Form (Distribution tab)
- What it contains: Placeholder for future settings
- Field count inside: 0 fields (placeholder only)
- User interaction required: Click to expand

**Assessment:**
- [x] Form context (research says remove)
- [ ] Non-form context
- [ ] Contains critical fields
- [x] Contains optional/advanced fields
- [ ] Has accessibility concerns

**Recommendation:** REMOVE
**Rationale:** Empty placeholder. Either add real content with visible `FormSection` or remove entirely.

---

### 8. ActivitySinglePage - Follow-up & Outcome Sections

**File:** `src/atomic-crm/activities/ActivitySinglePage.tsx`
**Lines:** 116-193

**Pattern detected:**
```typescript
<Collapsible open={followUpOpen} onOpenChange={setFollowUpOpen}>
  <CollapsibleTrigger asChild>
    <button type="button" className="flex items-center gap-2 w-full border-b...">
      {/* Chevron icon */}
      <h3>Follow-up</h3>
    </button>
  </CollapsibleTrigger>
  <CollapsibleContent className="pt-6">
    {/* 3 fields: sentiment, follow_up_date, follow_up_notes */}
  </CollapsibleContent>
</Collapsible>

<Collapsible open={outcomeOpen} onOpenChange={setOutcomeOpen}>
  {/* 2 fields: location, outcome */}
</Collapsible>
```

**Context:**
- Where it appears: Activity Create/Edit Form
- What it contains: Follow-up tracking, outcome fields
- Field count inside: 5 fields across 2 sections
- User interaction required: Click to expand each section

**Assessment:**
- [x] Form context (research says remove)
- [ ] Non-form context
- [x] Contains critical fields users might miss (follow_up_date important!)
- [x] Contains optional fields
- [ ] Has accessibility concerns

**Recommendation:** REMOVE
**Rationale:** Follow-up date is critical for activity tracking. Hiding it defeats the purpose. Convert to `FormSection` with headers.

---

### 9. WorkflowManagementSection - Decision Criteria

**File:** `src/atomic-crm/opportunities/WorkflowManagementSection.tsx`
**Lines:** 211-240

**Pattern detected:**
```typescript
<Collapsible open={isDecisionCriteriaOpen} onOpenChange={setIsDecisionCriteriaOpen}>
  <CollapsibleTrigger asChild>
    <Button variant="ghost" className="w-full justify-between...">
      <div className="flex items-center gap-2 text-xs...">
        <FileText />
        <span>Decision Criteria</span>
      </div>
      {isDecisionCriteriaOpen ? <ChevronUp /> : <ChevronDown />}
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <Textarea value={decisionCriteria} ... />
  </CollapsibleContent>
</Collapsible>
```

**Context:**
- Where it appears: Opportunity SlideOver (show view)
- What it contains: Decision criteria textarea (inline edit)
- Field count inside: 1 field
- User interaction required: Click to expand

**Assessment:**
- [x] Form context (research says remove)
- [ ] Non-form context
- [ ] Contains critical fields users might miss
- [x] Contains optional/advanced fields
- [ ] Has accessibility concerns

**Recommendation:** REMOVE
**Rationale:** Single textarea field. Show it always with a label. Context shows it's in a Card with other always-visible workflow fields.

---

### 10. NamingConventionHelp - Help Text Collapsible

**File:** `src/atomic-crm/opportunities/forms/NamingConventionHelp.tsx`
**Lines:** 17-83

**Pattern detected:**
```typescript
<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <CollapsibleTrigger asChild>
    <Button type="button" variant="ghost" size="sm" className="...text-xs text-muted-foreground...">
      <Lightbulb className="w-3 h-3" />
      {isOpen ? "Hide naming tips" : "Show naming tips"}
      {isOpen ? <ChevronUp /> : <ChevronDown />}
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-2">
    <div className="rounded-lg border border-border bg-muted/50 p-4...">
      {/* Help content with naming convention examples */}
    </div>
  </CollapsibleContent>
</Collapsible>
```

**Context:**
- Where it appears: Opportunity Create/Edit Form (below name field)
- What it contains: Help text with naming convention tips
- Field count inside: 0 (informational only)
- User interaction required: Click to show help

**Assessment:**
- [ ] Form context (research says remove)
- [x] Non-form context (this is help text, not form fields)
- [ ] Contains critical fields users might miss
- [ ] Contains optional/advanced fields
- [ ] Has accessibility concerns

**Recommendation:** KEEP
**Rationale:** This is contextual help, not form fields. Collapsible help text is an appropriate pattern to avoid overwhelming users with information they may not need. Progressive disclosure is acceptable for help content.

---

### Category 2: Data Import Preview Sections

These are NOT form fields but preview/review content during CSV import. Different UX considerations apply.

---

### 11. OrganizationImportPreview - Multiple Collapsible Sections

**File:** `src/atomic-crm/organizations/OrganizationImportPreview.tsx`
**Lines:** 177-448

**Pattern detected:**
```typescript
const [expandedSections, setExpandedSections] = useState({
  mappings: preview.lowConfidenceMappings > 0, // Auto-expand if issues
  duplicates: (preview.duplicates?.length || 0) > 0, // Auto-expand if duplicates
  tags: false,
  sampleData: false,
});

<Collapsible open={expandedSections.mappings}>
  {/* Column Mappings table */}
</Collapsible>

<Collapsible open={expandedSections.duplicates}>
  {/* Duplicate organizations list */}
</Collapsible>

<Collapsible open={expandedSections.sampleData}>
  {/* Sample data preview table */}
</Collapsible>

<Collapsible open={expandedSections.tags}>
  {/* New tags list */}
</Collapsible>
```

**Context:**
- Where it appears: Organization CSV Import Dialog
- What it contains: Import preview data (mappings, duplicates, sample rows, tags)
- Field count inside: 0 (read-only preview)
- User interaction required: Click to expand each section

**Assessment:**
- [ ] Form context (research says remove)
- [x] Non-form context (import preview, not data entry)
- [ ] Contains critical fields users might miss
- [ ] Contains optional/advanced fields
- [ ] Has accessibility concerns

**Recommendation:** KEEP (with modifications)
**Rationale:** Import preview with potentially large data tables. Accordions help users focus on relevant sections. Smart auto-expansion (issues auto-expand) is good UX. Consider making "mappings" always visible since it requires user action.

---

### 12. ContactImportPreview - Multiple Collapsible Sections

**File:** `src/atomic-crm/contacts/ContactImportPreview.tsx`
**Lines:** 345-820

**Pattern detected:**
```typescript
// 8 collapsible sections:
// - Skipped Columns
// - Sample Data
// - Organizations
// - Tags
// - Errors (auto-expands if present)
// - Warnings (auto-expands if present)
// - Organizations Without Contacts
// - Contacts Without Contact Info
```

**Context:**
- Where it appears: Contact CSV Import Dialog
- What it contains: Import preview data with validation results
- Field count inside: 0 (read-only preview)
- User interaction required: Click to expand each section

**Assessment:**
- [ ] Form context (research says remove)
- [x] Non-form context (import preview)
- [x] Contains critical information users might miss (errors, warnings)
- [ ] Contains optional/advanced fields
- [ ] Has accessibility concerns

**Recommendation:** KEEP (with modifications)
**Rationale:** Large import preview with many sections. Errors and warnings auto-expand which is correct. Critical data quality sections should remain collapsible to manage information density.

---

### Category 3: Non-Form UI Patterns

---

### 13. CampaignGroupedList - Hierarchical Accordion

**File:** `src/atomic-crm/opportunities/CampaignGroupedList.tsx`
**Lines:** 118-283

**Pattern detected:**
```typescript
{/* 3-level nested accordion */}
<Accordion type="multiple" className="space-y-2">
  {/* Level 1: Campaigns */}
  {campaignNames.map((campaignName) => (
    <AccordionItem key={campaignName} value={campaignName}>
      <AccordionTrigger>Campaign: {campaignName}</AccordionTrigger>
      <AccordionContent>
        {/* Level 2: Principals */}
        <Accordion type="multiple">
          {principalNames.map((principalName) => (
            <AccordionItem key={principalName} value={principalName}>
              <AccordionTrigger>Principal: {principalName}</AccordionTrigger>
              <AccordionContent>
                {/* Level 3: Customers */}
                <Accordion type="multiple">
                  {customerNames.map((customerName) => (
                    <AccordionItem key={customerName} value={customerName}>
                      <AccordionTrigger>Customer: {customerName}</AccordionTrigger>
                      <AccordionContent>
                        {/* Opportunity items */}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

**Context:**
- Where it appears: Opportunity List View (Campaign view mode)
- What it contains: Hierarchical grouping: Campaign → Principal → Customer → Opportunities
- Field count inside: N/A (list view, not form)
- User interaction required: Click to expand each level

**Assessment:**
- [ ] Form context (research says remove)
- [x] Non-form context (hierarchical data navigation)
- [ ] Contains critical fields users might miss
- [ ] Contains optional/advanced fields
- [ ] Has accessibility concerns

**Recommendation:** KEEP
**Rationale:** This is a hierarchical data browser, not a form. Users scan campaign names and drill down. This is the appropriate pattern for tree-structured data navigation. UK GDS and NNG research support accordions for this use case.

---

### 14. FilterChipsPanel - Active Filters

**File:** `src/atomic-crm/filters/FilterChipsPanel.tsx`
**Lines:** 74-106

**Pattern detected:**
```typescript
<Accordion type="single" collapsible defaultValue="filters">
  <AccordionItem value="filters" className="border-b">
    <AccordionTrigger className="py-2 hover:no-underline">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Active Filters</span>
        <span className="text-xs text-muted-foreground">
          ({filterChips.length} filter{filterChips.length !== 1 ? "s" : ""})
        </span>
      </div>
    </AccordionTrigger>
    <AccordionContent className="pb-3">
      <div className="flex flex-wrap gap-2">
        {filterChips.map((chip) => <FilterChip ... />)}
      </div>
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**Context:**
- Where it appears: List views (above datagrid)
- What it contains: Active filter chips for removal
- Field count inside: N/A (filter display, not form)
- User interaction required: Click to show/hide active filters

**Assessment:**
- [ ] Form context (research says remove)
- [x] Non-form context (filter status display)
- [x] Contains critical info users might miss (active filters affect data shown)
- [ ] Contains optional/advanced fields
- [ ] Has accessibility concerns

**Recommendation:** REVIEW
**Rationale:** Active filters are important context. Consider always showing them (especially when filters are active) rather than requiring a click. Alternative: Show chips inline without accordion when ≤5 filters, accordion only for many filters.

---

### 15. Error Component - Dev-Only Stack Trace

**File:** `src/components/admin/error.tsx`
**Lines:** 34-43

**Pattern detected:**
```typescript
{process.env.NODE_ENV !== "production" && (
  <Accordion type="multiple" className="mt-1 p-2 bg-secondary w-150">
    <AccordionItem value="error">
      <AccordionTrigger className="py-2">
        <Translate i18nKey={error.message}>{error.message}</Translate>
      </AccordionTrigger>
      <AccordionContent className="whitespace-pre-wrap pt-1">
        <p>{errorInfo?.componentStack}</p>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)}
```

**Context:**
- Where it appears: Error boundary (development only)
- What it contains: Error stack trace
- Field count inside: N/A (debugging info)
- User interaction required: Click to see stack trace

**Assessment:**
- [ ] Form context (research says remove)
- [x] Non-form context (dev debugging)
- [ ] Contains critical fields users might miss
- [ ] Contains optional/advanced fields
- [ ] Has accessibility concerns

**Recommendation:** KEEP
**Rationale:** Development-only error display. Accordion is appropriate to show summary first, stack trace on demand. Not user-facing in production.

---

### 16. AuthorizationsTab - Product Exceptions

**File:** `src/atomic-crm/organizations/AuthorizationsTab.tsx`
**Lines:** 332-438

**Pattern detected:**
```typescript
<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
  <div className="border border-border rounded-lg hover:bg-muted/50...">
    <div className="flex gap-4 p-4">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-11 w-11 p-0..."
          aria-label={isExpanded ? "Collapse product exceptions" : "Expand product exceptions"}>
          {isExpanded ? <ChevronDown /> : <ChevronRight />}
        </Button>
      </CollapsibleTrigger>
      {/* Authorization card content */}
    </div>
    <CollapsibleContent>
      <ProductExceptionsSection ... />
    </CollapsibleContent>
  </div>
</Collapsible>
```

**Context:**
- Where it appears: Organization Edit → Authorizations Tab (per authorization card)
- What it contains: Product-level authorization exceptions
- Field count inside: Variable (depends on products)
- User interaction required: Click to see product exceptions

**Assessment:**
- [ ] Form context (research says remove)
- [x] Non-form context (master-detail view within list)
- [ ] Contains critical fields users might miss
- [x] Contains optional/advanced fields (product exceptions are edge case)
- [ ] Has accessibility concerns (good ARIA labels)

**Recommendation:** KEEP
**Rationale:** This is a master-detail pattern within a list of authorization cards. Product exceptions are rarely needed. Showing them always would create visual noise. Good touch target (44px) and ARIA labels.

---

### Category 4: Layout/Navigation Collapse (Not Accordion)

---

### 17. StandardListLayout - Filter Sidebar Collapse

**File:** `src/components/layouts/StandardListLayout.tsx`
**Lines:** 58-142

**Pattern detected:**
```typescript
const [isCollapsed, setIsCollapsed] = useState(() => {
  // Default: collapsed on tablet (< 1024px), expanded on desktop
  return window.innerWidth < 1024;
});

// Sidebar with aria-expanded, aria-hidden, aria-controls
<Button aria-label={isCollapsed ? "Show filters" : "Hide filters"}
        aria-expanded={!isCollapsed}
        aria-controls="filter-sidebar">
  {isCollapsed ? <PanelLeft /> : <PanelLeftClose />}
</Button>

<aside id="filter-sidebar" aria-hidden={isCollapsed} ...>
  {filterComponent}
</aside>
```

**Context:**
- Where it appears: All list views (sidebar layout)
- What it contains: Filter sidebar toggle
- Field count inside: N/A (layout, not form)
- User interaction required: Click to show/hide sidebar

**Assessment:**
- [ ] Form context (research says remove)
- [x] Non-form context (responsive layout)
- [ ] Contains critical fields users might miss
- [ ] Contains optional/advanced fields
- [x] Has accessibility concerns (proper ARIA implemented)

**Recommendation:** KEEP
**Rationale:** This is responsive layout, not form UX. Sidebar collapse is standard for responsive design. Good accessibility with `aria-expanded`, `aria-hidden`, `aria-controls`. localStorage persistence is user preference.

---

### 18. OpportunityColumn - Kanban Column Collapse

**File:** `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx`
**Lines:** 24-25, 91-92, 131-138

**Pattern detected:**
```typescript
interface OpportunityColumnProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// In component:
{onToggleCollapse && (
  <button onClick={onToggleCollapse}
    aria-label={isCollapsed ? "Expand column" : "Collapse column"}>
    {isCollapsed ? "▶" : "▼"}
  </button>
)}

{!isCollapsed && (
  <div className="space-y-3">
    {/* Opportunity cards */}
  </div>
)}
```

**Context:**
- Where it appears: Opportunity Kanban Board (column headers)
- What it contains: Stage column expand/collapse
- Field count inside: N/A (kanban layout)
- User interaction required: Click to collapse/expand column

**Assessment:**
- [ ] Form context (research says remove)
- [x] Non-form context (kanban UI)
- [ ] Contains critical fields users might miss
- [ ] Contains optional/advanced fields
- [ ] Has accessibility concerns (has ARIA labels)

**Recommendation:** KEEP
**Rationale:** Kanban column collapse is a standard pattern for board views. Users can hide columns for stages they don't need to see. Good accessibility with ARIA labels.

---

### 19. OpportunityCard - Card Expand/Collapse

**File:** `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`
**Lines:** 161-162

**Pattern detected:**
```typescript
<button aria-expanded={isExpanded}
        aria-label={isExpanded ? "Collapse card" : "Expand card"}>
```

**Context:**
- Where it appears: Opportunity Kanban Cards
- What it contains: Card detail expansion
- Field count inside: N/A (card UI)
- User interaction required: Click to expand card details

**Assessment:**
- [ ] Form context (research says remove)
- [x] Non-form context (kanban card)
- [ ] Contains critical fields users might miss
- [x] Contains optional/advanced fields (card details)
- [ ] Has accessibility concerns (has ARIA attributes)

**Recommendation:** KEEP
**Rationale:** Card expand/collapse is standard kanban UX. Keeps board scannable by default, details on demand. Good accessibility with `aria-expanded`.

---

## UI Component Library Check

### Shadcn/Radix Components

| Component | File Location | Used In | Recommendation |
|-----------|---------------|---------|----------------|
| Accordion | `src/components/ui/accordion.tsx` | error.tsx, CampaignGroupedList.tsx, FilterChipsPanel.tsx, accordion.stories.tsx | KEEP |
| Collapsible | `src/components/ui/collapsible.tsx` | CollapsibleSection.tsx, ActivitySinglePage.tsx, WorkflowManagementSection.tsx, NamingConventionHelp.tsx, AuthorizationsTab.tsx, OrganizationImportPreview.tsx, ContactImportPreview.tsx | KEEP (component needed for justified uses) |
| CollapsibleSection | `src/components/admin/form/CollapsibleSection.tsx` | 8 form locations | REMOVE wrapper, replace with FormSection |

### Dependencies

| Package | Version | Used For | Recommendation |
|---------|---------|----------|----------------|
| @radix-ui/react-accordion | ^1.2.12 | Accordion component (hierarchical data, filter chips) | KEEP |
| @radix-ui/react-collapsible | ^1.1.12 | Collapsible component (import previews, help text, auth cards) | KEEP |

---

## Tailwind Configuration

**Accordion animations found in `src/components/ui/accordion.tsx`:**
```typescript
className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
```

**Note:** No custom `tailwind.config.ts` found at project root. Tailwind CSS v4 in use with CSS-based configuration.

**Used in:** `src/components/ui/accordion.tsx` only
**Recommendation:** Keep animations if any accordions remain (CampaignGroupedList, FilterChipsPanel)

---

## Summary by Category

### Form Contexts (HIGH PRIORITY for Removal)

| Location | Fields Hidden | Impact | Action |
|----------|---------------|--------|--------|
| `OpportunityCompactForm.tsx` | 11 | High (Classification hidden) | REMOVE |
| `ContactAdditionalDetails.tsx` | 7 | Medium (territory hidden) | REMOVE |
| `OrganizationCompactForm.tsx` | 4 | Low | REMOVE |
| `OrganizationHierarchySection.tsx` | 3 | Low | REMOVE |
| `OrganizationAddressSection.tsx` | 4 | Low | REMOVE |
| `OrganizationStatusSection.tsx` | 5 | Medium (credit_limit hidden) | REMOVE |
| `ProductDistributionTab.tsx` | 0 | None (placeholder) | REMOVE |
| `ActivitySinglePage.tsx` | 5 | High (follow_up_date hidden!) | REMOVE |
| `WorkflowManagementSection.tsx` | 1 | Low | REMOVE |

### Non-Form Contexts (Evaluate Case-by-Case)

| Location | Purpose | Justified? | Action |
|----------|---------|------------|--------|
| `CampaignGroupedList.tsx` | Hierarchical data navigation | Yes | KEEP |
| `FilterChipsPanel.tsx` | Active filter display | Maybe | REVIEW |
| `error.tsx` | Dev-only stack trace | Yes | KEEP |
| `NamingConventionHelp.tsx` | Contextual help text | Yes | KEEP |
| `AuthorizationsTab.tsx` | Master-detail (product exceptions) | Yes | KEEP |
| `OrganizationImportPreview.tsx` | Import data review | Yes | KEEP |
| `ContactImportPreview.tsx` | Import data review | Yes | KEEP |
| `StandardListLayout.tsx` | Responsive sidebar | Yes | KEEP |
| `OpportunityColumn.tsx` | Kanban column | Yes | KEEP |
| `OpportunityCard.tsx` | Kanban card details | Yes | KEEP |

---

## Recommended Action Plan

### Phase 1: High Priority (Form Contexts) - Remove CollapsibleSection

**Goal:** Replace `CollapsibleSection` with `FormSection` or `FormSectionWithProgress` in all form files.

1. **OpportunityCompactForm.tsx** — Replace 3 `CollapsibleSection` with `FormSection` headers
2. **ContactAdditionalDetails.tsx** — Replace 2 `CollapsibleSection` with `FormSection` headers
3. **ActivitySinglePage.tsx** — Replace 2 raw `Collapsible` with `FormSection` headers
4. **OrganizationCompactForm.tsx** — Replace 1 `CollapsibleSection` with `FormSection`
5. **OrganizationHierarchySection.tsx** — Replace wrapper with `FormSection`
6. **OrganizationAddressSection.tsx** — Replace wrapper with `FormSection`
7. **OrganizationStatusSection.tsx** — Replace wrapper with `FormSection` (or remove if unused)
8. **WorkflowManagementSection.tsx** — Show decision_criteria textarea always
9. **ProductDistributionTab.tsx** — Remove empty placeholder section

### Phase 2: Evaluate (Non-Form Contexts)

1. **FilterChipsPanel.tsx** — Consider showing chips always when ≤5 filters active, only collapse for many filters

### Phase 3: Cleanup

1. **Remove CollapsibleSection component** if all form instances removed (`src/components/admin/form/CollapsibleSection.tsx`)
2. **Remove CollapsibleSection export** from `src/components/admin/form/index.ts`
3. **Update/remove tests** in `src/components/admin/form/__tests__/CollapsibleSection.test.tsx`
4. Keep `@radix-ui/react-collapsible` dependency (still used by justified cases)
5. Keep `@radix-ui/react-accordion` dependency (used by CampaignGroupedList, FilterChipsPanel)
6. Keep accordion animations (used by remaining accordions)

---

## Edge Cases & Exceptions

### Justified Accordion/Collapsible Usage

Accordions ARE appropriate for:
- **Hierarchical data navigation** (CampaignGroupedList) — UK GDS supports this
- **FAQ/Help content** (NamingConventionHelp) — Progressive disclosure for help
- **Large data preview** (Import Preview components) — Too much data to show at once
- **Master-detail within lists** (AuthorizationsTab) — Exception details are edge case
- **Responsive layout** (StandardListLayout sidebar) — Standard responsive pattern
- **Kanban board UI** (OpportunityColumn, OpportunityCard) — Standard board pattern
- **Dev-only debugging** (error.tsx) — Stack traces are verbose

### NOT Appropriate For (Per Research)

Accordions are NOT appropriate for:
- **Form fields with <15 total fields** — Adds interaction cost
- **Required or important fields** — Users may miss them
- **Desktop-first applications** — No space constraints
- **Single text fields** (WorkflowManagementSection decision_criteria)

### Found Edge Cases

| Location | Why It Might Be Justified |
|----------|---------------------------|
| `NamingConventionHelp.tsx` | Help text, not form fields - progressive disclosure OK |
| `AuthorizationsTab.tsx` | Product exceptions are edge case, rarely needed |
| `Import Preview files` | Large data tables need progressive disclosure |

---

## Accessibility Notes

For accordions/collapsibles that remain:

| Component | aria-expanded | aria-controls | Keyboard | Notes |
|-----------|---------------|---------------|----------|-------|
| Accordion (Radix) | Yes (built-in) | Yes (built-in) | Yes | Full ARIA support |
| Collapsible (Radix) | Yes (built-in) | Yes (built-in) | Yes | Full ARIA support |
| CollapsibleSection | Yes | Yes | Yes | Uses Radix under hood |
| StandardListLayout | Yes | Yes | Yes | Manual implementation, good |
| OpportunityColumn | N/A (custom) | N/A | Yes | Has aria-label |
| OpportunityCard | Yes | N/A | Yes | Has aria-expanded |
| AuthorizationsTab | Yes | N/A | Yes | Has aria-label |

All Radix-based components have proper ARIA support. Custom implementations vary but generally have good accessibility.

---

## References

- Research findings: `docs/architecture/form-ux-research-findings.md`
- Design spec: `docs/architecture/form-ux-design-spec.md`
- UK GDS guidance on accordions: Progressive disclosure for help content, FAQs
- Nielsen Norman Group: "Accordions Are Not Always the Answer for Complex Content on Desktops"
- Baymard Institute: Form field visibility increases completion rates

---

## Appendix: Files Modified by This Audit

**No files were modified.** This is a read-only audit document.

### Files Analyzed

1. `src/components/ui/accordion.tsx`
2. `src/components/ui/accordion.stories.tsx`
3. `src/components/ui/collapsible.tsx`
4. `src/components/admin/form/CollapsibleSection.tsx`
5. `src/components/admin/form/__tests__/CollapsibleSection.test.tsx`
6. `src/components/admin/error.tsx`
7. `src/components/layouts/StandardListLayout.tsx`
8. `src/atomic-crm/opportunities/CampaignGroupedList.tsx`
9. `src/atomic-crm/opportunities/forms/OpportunityCompactForm.tsx`
10. `src/atomic-crm/opportunities/forms/NamingConventionHelp.tsx`
11. `src/atomic-crm/opportunities/WorkflowManagementSection.tsx`
12. `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx`
13. `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`
14. `src/atomic-crm/contacts/ContactAdditionalDetails.tsx`
15. `src/atomic-crm/contacts/ContactImportPreview.tsx`
16. `src/atomic-crm/organizations/OrganizationCompactForm.tsx`
17. `src/atomic-crm/organizations/OrganizationHierarchySection.tsx`
18. `src/atomic-crm/organizations/OrganizationAddressSection.tsx`
19. `src/atomic-crm/organizations/OrganizationStatusSection.tsx`
20. `src/atomic-crm/organizations/AuthorizationsTab.tsx`
21. `src/atomic-crm/organizations/OrganizationImportPreview.tsx`
22. `src/atomic-crm/activities/ActivitySinglePage.tsx`
23. `src/atomic-crm/products/ProductDistributionTab.tsx`
24. `src/atomic-crm/filters/FilterChipsPanel.tsx`
25. `package.json`
