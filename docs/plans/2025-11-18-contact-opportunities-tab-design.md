# Contact Opportunities Tab Design

**Status:** Design Complete
**Priority:** High (Top value from 6 proposed Contact enhancements)
**Target:** Phase 1 (MVP)
**Created:** 2025-11-18

## Overview

Add a dedicated "Opportunities" tab to the Contact view that allows sales reps to see, link, and unlink opportunities associated with a contact. This addresses the critical workflow gap where reps need to manage which deals a contact influences while viewing that contact's record.

## Problem Statement

From the ERD-to-UI mapping analysis, the `opportunity_contacts` junction table exists in the database but has zero UI exposure in the Contact module. When reps view a contact, they cannot:
- See which deals involve this contact
- Link the contact to new opportunities
- Remove the contact from stale deals
- Assess deal stage/health context

This forces reps to navigate to each opportunity individually to manage contact associations, breaking the natural workflow of "I'm talking to Jane - what deals is she involved in?"

## User Requirements

**Primary workflow:**
1. Rep views contact record
2. Clicks "Opportunities" tab
3. Sees all linked opportunities with stage/health indicators
4. Can link contact to existing opportunities (deliberate modal flow)
5. Can unlink contact from opportunities (confirmation required)
6. Can click through to full opportunity details

**Success criteria:**
- Active management (link/unlink) - Requirement C
- Stage/health visibility - Requirement D (close second)
- Quick access without leaving contact view
- Safety against accidental associations/removals

## Architecture

### Component Structure

```
ContactShow.tsx
├─ Tabs (4 tabs: Details | Notes | Activities | Opportunities)
│  └─ OpportunitiesTab
│     ├─ LinkOpportunityButton → LinkOpportunityModal
│     ├─ OpportunitiesTable (or EmptyState)
│     │  └─ Datagrid rows
│     │     ├─ Opportunity name (clickable link)
│     │     ├─ Customer/Org reference
│     │     ├─ StageBadgeWithHealth
│     │     ├─ Amount field
│     │     └─ UnlinkButton → UnlinkConfirmDialog
│     └─ EmptyState
│        ├─ SuggestedOpportunities (if org has opps)
│        └─ EducationalPrompt (fallback)
```

### Integration Point

In `ContactShow.tsx` (lines 73-130):
- Add 4th `<TabsTrigger value="opportunities">Opportunities</TabsTrigger>`
- Add corresponding `<TabsContent value="opportunities"><OpportunitiesTab /></TabsContent>`
- Tab component uses `useShowContext<Contact>()` internally to access full contact record

**Inside OpportunitiesTab.tsx:**
```typescript
import { useShowContext } from 'ra-core';
import type { Contact } from '../types';

export function OpportunitiesTab() {
  const { record: contact, isPending } = useShowContext<Contact>();

  if (isPending || !contact) return null;

  // Now have access to:
  // - contact.id (for queries)
  // - contact.first_name, contact.last_name (for ARIA labels)
  // - contact.organization_id (for suggested opportunities)
  // - contact.organization?.name (for empty state copy)
}
```

**Why use `useShowContext()`:**
- Follows React Admin patterns (same as `ActivitiesTab`, `ContactNotesTab`)
- Automatically re-renders when contact updates
- No prop drilling needed
- Access to full contact record for names, organization, etc.

### File Structure

New files:
```
src/atomic-crm/contacts/
├─ OpportunitiesTab.tsx           # Main tab component
├─ LinkOpportunityModal.tsx       # Modal for linking opportunities
├─ UnlinkConfirmDialog.tsx        # Confirmation for unlinking
├─ StageBadgeWithHealth.tsx       # Stage badge with health indicator
└─ SuggestedOpportunityCard.tsx   # Card for empty state suggestions
```

## Data Layer

### Primary Query

**Two-step pattern:** Query `opportunity_contacts` junction table first, then fetch opportunity details.

```typescript
// OpportunitiesTab.tsx

// Step 1: Fetch junction records (includes junction IDs for unlinking)
const { data: junctionRecords, isLoading: junctionLoading, refetch } = useGetList(
  'opportunity_contacts',
  {
    filter: { contact_id: contactId },
    pagination: { page: 1, perPage: 50 },
    sort: { field: 'created_at', order: 'DESC' }
  }
);

// Step 2: Extract opportunity IDs and fetch opportunity details
const opportunityIds = junctionRecords?.map((jr: any) => jr.opportunity_id) || [];

const { data: opportunities, isLoading: oppsLoading } = useGetList(
  'opportunities',
  {
    filter: { id: opportunityIds },
    pagination: { page: 1, perPage: 50 }
  },
  { enabled: opportunityIds.length > 0 } // Only run if we have IDs
);

// Step 3: Merge junction metadata with opportunity data
const linkedOpportunities = junctionRecords?.map((junction: any) => {
  const opp = opportunities?.find((o: any) => o.id === junction.opportunity_id);
  return opp ? { ...opp, junctionId: junction.id } : null;
}).filter(Boolean) || [];

const isLoading = junctionLoading || oppsLoading;
```

**Why this pattern:**
- Junction records include `id` field (needed for unlinking)
- Matches existing `OpportunityContactsTab` pattern (src/atomic-crm/opportunities/slideOverTabs/OpportunityContactsTab.tsx:25-44)
- Allows access to junction metadata (role, is_primary) if needed later
- Works with existing data provider (no custom logic required)

### Mutations

**Link opportunity:**
```typescript
await dataProvider.create('opportunity_contacts', {
  data: {
    opportunity_id: selectedOpportunity.id,
    contact_id: contactId
  }
});
refetch(); // Refresh table
```

**Unlink opportunity:**
```typescript
// Use junctionId from merged data (see Primary Query section)
// Each linkedOpportunity has: { ...opportunityFields, junctionId: junction.id }
await dataProvider.delete('opportunity_contacts', {
  id: opportunity.junctionId
});
refetch(); // Refresh table
```

**Note:**
- Using refetch after mutations (not optimistic updates) to maintain single source of truth (fail-fast principle)
- `junctionId` comes from merged data in Primary Query (step 3) - each opportunity includes the junction record ID needed for deletion

### Suggested Opportunities Query

For empty state smart suggestions (client-side filtering):

```typescript
// Fetch opportunities from contact's primary organization
const { data: orgOpportunities } = useGetList('opportunities', {
  filter: {
    customer_organization_id: contact.organization_id
  },
  pagination: { page: 1, perPage: 25 }, // Fetch more, filter client-side
  sort: { field: 'updated_at', order: 'DESC' }
}, {
  enabled: !!contact.organization_id && linkedOpportunities.length === 0
});

// Client-side filter to exclude closed opportunities
const suggestedOpps = useMemo(() => {
  if (!orgOpportunities) return [];
  return orgOpportunities
    .filter((opp: any) => !['closed_won', 'closed_lost'].includes(opp.stage))
    .slice(0, 5); // Show max 5 suggestions
}, [orgOpportunities]);
```

**Why client-side filtering:**
- PostgREST/filterRegistry doesn't support `stage_not_in` operator
- Could use array filtering: `stage@in: (active,qualified,proposal,...)` but requires listing all non-closed stages
- Simpler to fetch all org opportunities (usually < 25) and filter in JavaScript
- Only runs on empty state (performance acceptable)

## UI Components

### OpportunitiesTable

React Admin Datagrid with corrected field rendering (no double-fetching):

```typescript
<Datagrid
  bulkActionButtons={false}
  rowClick={false}
  className="border rounded-lg"
>
  <FunctionField
    label="Opportunity"
    render={(record) => (
      <Link
        to={`/opportunities/${record.id}`}
        className="font-medium text-primary hover:underline"
      >
        {record.name}
      </Link>
    )}
  />

  <ReferenceField
    source="customer_id"
    reference="organizations"
    label="Customer"
  >
    <TextField source="name" />
  </ReferenceField>

  <FunctionField
    label="Stage"
    render={(record) => (
      <StageBadgeWithHealth
        stage={record.stage}
        health={record.health_status}
      />
    )}
  />

  <NumberField
    source="amount"
    options={{ style: 'currency', currency: 'USD' }}
  />

  <FunctionField
    label=""
    render={(record) => (
      <UnlinkButton
        opportunity={record}
        onUnlink={() => setUnlinkingOpportunity(record)}
        className="h-11 w-11" // 44px touch target
      />
    )}
  />
</Datagrid>
```

**Key details:**
- No nested `<ReferenceField source="id">` for opportunity name - record is already full opportunity object
- Customer still uses ReferenceField (only has customer_id in opportunity record)
- Stage badge combines stage + health via custom component
- Unlink button meets 44px touch target requirement

### StageBadgeWithHealth

Custom component combining stage text with health-based border color:

```typescript
<Badge
  variant={getStageVariant(stage)} // Uses existing stage badge variants
  className={cn(
    "border-2",
    health === 'active' && "border-success",
    health === 'cooling' && "border-warning",
    health === 'at_risk' && "border-destructive"
  )}
>
  {stage}
</Badge>
```

**Design rationale:** Bakes health indicator into stage badge (colored border) rather than separate column to save horizontal space while maintaining visual signal.

### LinkOpportunityModal

Modal with autocomplete search (deliberate flow prevents accidental links):

```typescript
// Derive contactName from useShowContext (see Integration Point section)
const contactName = `${contact.first_name} ${contact.last_name}`;

<Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Link Opportunity to {contactName}</DialogTitle>
    </DialogHeader>

    <AutocompleteInput
      source="opportunity_id"
      reference="opportunities"
      filterToQuery={searchText => ({ name: searchText })}
      optionText={(opp) => `${opp.name} - ${opp.customer?.name} (${opp.stage})`}
      suggestionLimit={10}
      label="Search opportunities"
    />

    {/* Preview selected opportunity details here if needed */}

    <DialogFooter>
      <Button variant="outline" onClick={() => setShowLinkModal(false)}>
        Cancel
      </Button>
      <Button onClick={handleLink} disabled={!selectedOpportunity}>
        Link Opportunity
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Accessibility:** shadcn Dialog provides focus trap, ESC to close, aria-modal="true".

### UnlinkConfirmDialog

Confirmation dialog with explicit context (prevents accidental removals):

```typescript
// contactName derived from useShowContext (see Integration Point section)
const contactName = `${contact.first_name} ${contact.last_name}`;

<AlertDialog
  open={!!unlinkingOpportunity}
  onOpenChange={() => setUnlinkingOpportunity(null)}
>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Remove contact from opportunity?</AlertDialogTitle>
      <AlertDialogDescription>
        Remove <strong>{contactName}</strong> from{' '}
        <strong>{unlinkingOpportunity?.name}</strong>?
        This won't delete either record, just removes the association.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={confirmUnlink}>
        Remove
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**User flow:** Click trash icon → See confirmation with names → Confirm or cancel

## Empty State Experience

### Smart Suggestions (when contact has primary organization)

```typescript
// contact from useShowContext (includes organization if populated)
{suggestedOpps?.length > 0 ? (
  <div className="text-center py-8 space-y-4">
    <h3 className="text-lg font-semibold">Suggested Opportunities</h3>
    <p className="text-sm text-muted-foreground">
      We found {suggestedOpps.length} active opportunities at{' '}
      {contact.organization?.name}
    </p>

    <div className="space-y-2 max-w-2xl mx-auto">
      {suggestedOpps.map(opp => (
        <SuggestedOpportunityCard
          key={opp.id}
          opportunity={opp}
          onLink={() => handleQuickLink(opp.id)}
        />
      ))}
    </div>

    <Button variant="outline" onClick={() => setShowLinkModal(true)}>
      Or search all opportunities
    </Button>
  </div>
) : (
  <EducationalEmptyState />
)}
```

**Quick link flow:** Click suggested opportunity card → Skip modal, link immediately → Show toast: "Linked [Contact] to [Opportunity]" with undo option.

### Educational Fallback (no organization or no matching opportunities)

```typescript
<div className="text-center py-12 space-y-4">
  <div className="text-muted-foreground">
    <p className="text-lg">No opportunities linked yet</p>
    <p className="text-sm mt-2 max-w-md mx-auto">
      Link this contact to deals they're involved in to track their
      influence on your pipeline.
    </p>
  </div>

  <Button onClick={() => setShowLinkModal(true)}>
    Link Opportunity
  </Button>
</div>
```

**Design rationale:** Guides new users without overwhelming them. If we can suggest relevant opps, do so. Otherwise, clear CTA with educational context.

## Error Handling & Validation

### Preventing Duplicate Links

Before creating junction record, check for existing link:

```typescript
const handleLink = async (opportunityId: string) => {
  // Check for existing link
  const { data: existing } = await dataProvider.getList('opportunity_contacts', {
    filter: {
      opportunity_id: opportunityId,
      contact_id: contactId
    },
    pagination: { page: 1, perPage: 1 }
  });

  if (existing?.length > 0) {
    notify('This contact is already linked to that opportunity', {
      type: 'warning'
    });
    return;
  }

  // Proceed with link...
};
```

### Mutation Error Handling

```typescript
try {
  await dataProvider.create('opportunity_contacts', {
    data: { opportunity_id: selectedOpp.id, contact_id: contactId }
  });
  notify(`Linked to ${selectedOpp.name}`, { type: 'success' });
  refetch();
  setShowLinkModal(false);
} catch (error) {
  notify('Failed to link opportunity. Please try again.', {
    type: 'error'
  });
  console.error('Link error:', error);
}
```

**Pattern:** Try/catch around all mutations with user-friendly error messages and console logging for debugging.

## Accessibility Requirements

### Focus Management
- **Modal focus trap:** LinkOpportunityModal and UnlinkConfirmDialog use shadcn Dialog/AlertDialog (built-in focus trap)
- **Keyboard navigation:** Tab through table rows, Enter on opportunity name opens detail, Space/Enter on unlink triggers confirmation
- **ESC to close:** All dialogs close on ESC key

### ARIA Labels
```typescript
// contactName from useShowContext (see Integration Point section)
const contactName = `${contact.first_name} ${contact.last_name}`;

<Button
  aria-label={`Link opportunity to ${contactName}`}
  onClick={() => setShowLinkModal(true)}
>
  Link Opportunity
</Button>

<IconButton
  aria-label={`Unlink ${opportunity.name} from ${contactName}`}
  className="h-11 w-11"
  onClick={() => setUnlinkingOpportunity(opportunity)}
>
  <TrashIcon />
</IconButton>
```

### Touch Targets
All interactive elements meet 44px minimum:
- UnlinkButton: `className="h-11 w-11"` (44x44px)
- Link Opportunity button: Default button height (44px)
- Suggested opportunity cards: Minimum height 44px

### Screen Reader Support
- Dialog titles announce context
- AlertDialog descriptions provide clear action explanation
- Table uses semantic markup (Datagrid component provides this)

## Design System Compliance

### Colors
- Stage badges: Existing semantic badge variants
- Health borders: `border-success`, `border-warning`, `border-destructive`
- Links: `text-primary hover:underline`
- Muted text: `text-muted-foreground`

**No inline CSS variables or hex codes used.**

### Spacing
- Card padding: Design system default
- Empty state: `py-8` (suggestions), `py-12` (educational)
- Table: Default Datagrid spacing
- Gap between elements: `space-y-4`, `space-y-2`

### Components
- shadcn Dialog, AlertDialog, Button, Badge
- React Admin Datagrid, ReferenceField, NumberField, FunctionField
- Custom components follow established patterns

## Implementation Notes

### State Management
All state is local component state (no global state needed):
- `showLinkModal: boolean` - Modal visibility
- `unlinkingOpportunity: Opportunity | null` - Confirmation dialog state
- `selectedOpportunity: Opportunity | null` - Selected opp in modal

### Performance Considerations
- `useGetManyReference` automatically batches and caches queries
- Refetch only after successful mutations (not on every render)
- Suggested opportunities query only runs on empty state
- Pagination: 50 opportunities per page (covers 99% of contacts)

### Testing Strategy
**Unit tests:**
- Empty state rendering logic (suggestions vs educational)
- Duplicate link prevention
- Error handling for failed mutations

**E2E tests:**
- Link opportunity workflow (open modal → search → select → link)
- Unlink workflow (click trash → confirm → verify removed)
- Empty state suggestions (contact with org → sees suggestions)

**Accessibility tests:**
- Focus trap in modal
- Keyboard navigation through table
- ARIA labels present
- Touch target sizes

## Future Enhancements (Out of Scope)

1. **Bulk link/unlink** - Checkbox selection + batch actions
2. **Contact role on opportunity** - Store role (decision maker, influencer, champion) in junction table
3. **Opportunity activity timeline** - Show recent activities on linked opportunities
4. **Quick opportunity creation** - "Link to new opportunity" flow from this tab
5. **Filters** - Filter linked opportunities by stage, health, or close date

## Success Metrics

Post-implementation, we should see:
- **Reduced navigation:** Fewer clicks to manage contact-opportunity associations (from 5+ clicks to 2-3)
- **Faster deal updates:** Reps can link contacts mid-call without leaving contact view
- **Fewer orphaned associations:** Deliberate modal flow prevents accidental links
- **Better context:** Reps see deal stage/health at a glance when viewing contacts

## Related Work

- **ERD-to-UI Mapping Analysis:** `docs/architecture/erd-to-ui-mapping.md`
- **Opportunity Module:** `src/atomic-crm/opportunities/`
- **Unified Design System:** `docs/plans/2025-11-16-unified-design-system-rollout.md`
- **Engineering Constitution:** `docs/claude/engineering-constitution.md`

## Approvals

- [x] Design validated through brainstorming session (2025-11-18)
- [ ] Implementation plan created
- [ ] Code review completed
- [ ] QA testing passed
- [ ] Documentation updated

---

**Next Steps:**
1. Use `superpowers:using-git-worktrees` to create isolated workspace
2. Use `superpowers:writing-plans` to create detailed implementation plan
3. Implement OpportunitiesTab and supporting components
4. Write unit and E2E tests
5. Update Contact module documentation
