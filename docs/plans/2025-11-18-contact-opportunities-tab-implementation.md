# Contact Opportunities Tab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a dedicated Opportunities tab to Contact view for linking/unlinking opportunities with stage/health visibility.

**Architecture:** Two-step data fetching (junction table → opportunities), client-side empty state suggestions, modal-based linking with confirmation dialogs. Uses `useShowContext()` for contact metadata, follows existing `OpportunityContactsTab` patterns.

**Tech Stack:** React Admin hooks (useGetList, useShowContext), shadcn/ui (Dialog, AlertDialog, Badge), React Admin Datagrid, TypeScript

**Design Reference:** `docs/plans/2025-11-18-contact-opportunities-tab-design.md`

---

## Task 1: Create StageBadgeWithHealth Component

**Files:**
- Create: `src/atomic-crm/contacts/StageBadgeWithHealth.tsx`
- Test: `src/atomic-crm/contacts/StageBadgeWithHealth.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/contacts/StageBadgeWithHealth.test.tsx
import { render, screen } from '@testing-library/react';
import { StageBadgeWithHealth } from './StageBadgeWithHealth';

describe('StageBadgeWithHealth', () => {
  it('renders stage name', () => {
    render(<StageBadgeWithHealth stage="qualified" health="active" />);
    expect(screen.getByText('qualified')).toBeInTheDocument();
  });

  it('applies success border for active health', () => {
    const { container } = render(<StageBadgeWithHealth stage="qualified" health="active" />);
    const badge = container.querySelector('.border-success');
    expect(badge).toBeInTheDocument();
  });

  it('applies warning border for cooling health', () => {
    const { container } = render(<StageBadgeWithHealth stage="qualified" health="cooling" />);
    const badge = container.querySelector('.border-warning');
    expect(badge).toBeInTheDocument();
  });

  it('applies destructive border for at_risk health', () => {
    const { container } = render(<StageBadgeWithHealth stage="qualified" health="at_risk" />);
    const badge = container.querySelector('.border-destructive');
    expect(badge).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- StageBadgeWithHealth.test.tsx`
Expected: FAIL with "Cannot find module './StageBadgeWithHealth'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/contacts/StageBadgeWithHealth.tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StageBadgeWithHealthProps {
  stage: string;
  health?: 'active' | 'cooling' | 'at_risk';
}

export function StageBadgeWithHealth({ stage, health }: StageBadgeWithHealthProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-2',
        health === 'active' && 'border-success',
        health === 'cooling' && 'border-warning',
        health === 'at_risk' && 'border-destructive'
      )}
    >
      {stage}
    </Badge>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- StageBadgeWithHealth.test.tsx`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/contacts/StageBadgeWithHealth.tsx src/atomic-crm/contacts/StageBadgeWithHealth.test.tsx
git commit -m "feat(contacts): add StageBadgeWithHealth component

- Displays opportunity stage with health indicator
- Border color indicates health status (success/warning/destructive)
- Full test coverage (4 tests)"
```

---

## Task 2: Create OpportunitiesTab Core Component

**Files:**
- Create: `src/atomic-crm/contacts/OpportunitiesTab.tsx`
- Test: `src/atomic-crm/contacts/OpportunitiesTab.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/contacts/OpportunitiesTab.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { ShowContextProvider } from 'ra-core';
import { OpportunitiesTab } from './OpportunitiesTab';

const mockContact = {
  id: 1,
  first_name: 'Jane',
  last_name: 'Doe',
  organization_id: 100,
  organization: { name: 'Acme Corp' }
};

const mockUseGetList = vi.fn();

vi.mock('react-admin', async () => {
  const actual = await vi.importActual('react-admin');
  return {
    ...actual,
    useGetList: () => mockUseGetList(),
  };
});

describe('OpportunitiesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching', () => {
    mockUseGetList.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(
      <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
        <OpportunitiesTab />
      </ShowContextProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when no opportunities linked', async () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
        <OpportunitiesTab />
      </ShowContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/no opportunities linked/i)).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- OpportunitiesTab.test.tsx`
Expected: FAIL with "Cannot find module './OpportunitiesTab'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/contacts/OpportunitiesTab.tsx
import { useShowContext, useGetList } from 'ra-core';
import type { Contact } from '../types';

export function OpportunitiesTab() {
  const { record: contact, isPending } = useShowContext<Contact>();

  // Step 1: Fetch junction records
  const { data: junctionRecords, isLoading: junctionLoading } = useGetList(
    'opportunity_contacts',
    {
      filter: { contact_id: contact?.id },
      pagination: { page: 1, perPage: 50 },
      sort: { field: 'created_at', order: 'DESC' }
    },
    { enabled: !!contact?.id }
  );

  // Step 2: Extract opportunity IDs
  const opportunityIds = junctionRecords?.map((jr: any) => jr.opportunity_id) || [];

  // Step 3: Fetch opportunity details
  const { data: opportunities, isLoading: oppsLoading } = useGetList(
    'opportunities',
    {
      filter: { id: opportunityIds },
      pagination: { page: 1, perPage: 50 }
    },
    { enabled: opportunityIds.length > 0 }
  );

  const isLoading = isPending || junctionLoading || oppsLoading;

  if (isPending || !contact) return null;

  if (isLoading) {
    return <div>Loading opportunities...</div>;
  }

  if (!junctionRecords || junctionRecords.length === 0) {
    return <div>No opportunities linked yet</div>;
  }

  // Merge junction data with opportunities
  const linkedOpportunities = junctionRecords.map((junction: any) => {
    const opp = opportunities?.find((o: any) => o.id === junction.opportunity_id);
    return opp ? { ...opp, junctionId: junction.id } : null;
  }).filter(Boolean);

  return (
    <div>
      <p>Found {linkedOpportunities.length} opportunities</p>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- OpportunitiesTab.test.tsx`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/contacts/OpportunitiesTab.tsx src/atomic-crm/contacts/OpportunitiesTab.test.tsx
git commit -m "feat(contacts): add OpportunitiesTab data fetching

- Two-step query: junction table → opportunities
- Merges junction IDs for unlinking
- Shows loading and empty states
- Uses useShowContext for contact metadata"
```

---

## Task 3: Add Opportunities Table to OpportunitiesTab

**Files:**
- Modify: `src/atomic-crm/contacts/OpportunitiesTab.tsx`
- Test: `src/atomic-crm/contacts/OpportunitiesTab.test.tsx`

**Step 1: Add table rendering test**

```typescript
// Add to OpportunitiesTab.test.tsx
it('renders opportunities table with linked opportunities', async () => {
  const mockJunctionRecords = [
    { id: 'j1', contact_id: 1, opportunity_id: 10, created_at: '2025-01-01' },
    { id: 'j2', contact_id: 1, opportunity_id: 11, created_at: '2025-01-02' }
  ];

  const mockOpportunities = [
    { id: 10, name: 'Deal A', customer_organization_id: 100, stage: 'qualified', health_status: 'active', amount: 50000 },
    { id: 11, name: 'Deal B', customer_organization_id: 100, stage: 'proposal', health_status: 'cooling', amount: 75000 }
  ];

  mockUseGetList
    .mockReturnValueOnce({ data: mockJunctionRecords, isLoading: false })
    .mockReturnValueOnce({ data: mockOpportunities, isLoading: false });

  render(
    <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
      <OpportunitiesTab />
    </ShowContextProvider>
  );

  await waitFor(() => {
    expect(screen.getByText('Deal A')).toBeInTheDocument();
    expect(screen.getByText('Deal B')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- OpportunitiesTab.test.tsx`
Expected: FAIL with "Unable to find element: Deal A"

**Step 3: Implement table rendering**

```typescript
// Modify OpportunitiesTab.tsx - replace return statement
import { Datagrid, FunctionField, ReferenceField, TextField, NumberField } from 'react-admin';
import { Link } from 'react-router-dom';
import { StageBadgeWithHealth } from './StageBadgeWithHealth';

// ... inside OpportunitiesTab after linkedOpportunities merge ...

return (
  <div className="space-y-4">
    <Datagrid
      data={linkedOpportunities}
      bulkActionButtons={false}
      rowClick={false}
      className="border rounded-lg"
    >
      <FunctionField
        label="Opportunity"
        render={(record: any) => (
          <Link
            to={`/opportunities/${record.id}`}
            className="font-medium text-primary hover:underline"
          >
            {record.name}
          </Link>
        )}
      />

      <ReferenceField
        source="customer_organization_id"
        reference="organizations"
        label="Customer"
      >
        <TextField source="name" />
      </ReferenceField>

      <FunctionField
        label="Stage"
        render={(record: any) => (
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
    </Datagrid>
  </div>
);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- OpportunitiesTab.test.tsx`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/contacts/OpportunitiesTab.tsx src/atomic-crm/contacts/OpportunitiesTab.test.tsx
git commit -m "feat(contacts): add opportunities table to OpportunitiesTab

- Displays linked opportunities in Datagrid
- Shows opportunity name (linked), customer, stage+health, amount
- Stage badge includes health indicator"
```

---

## Task 4: Create LinkOpportunityModal Component

**Files:**
- Create: `src/atomic-crm/contacts/LinkOpportunityModal.tsx`
- Test: `src/atomic-crm/contacts/LinkOpportunityModal.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/contacts/LinkOpportunityModal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LinkOpportunityModal } from './LinkOpportunityModal';
import { AdminContext } from 'react-admin';

const mockDataProvider = {
  create: vi.fn(),
};

describe('LinkOpportunityModal', () => {
  it('renders when open', () => {
    render(
      <AdminContext dataProvider={mockDataProvider}>
        <LinkOpportunityModal
          open={true}
          contactName="Jane Doe"
          contactId={1}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      </AdminContext>
    );

    expect(screen.getByText(/Link Opportunity to Jane Doe/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AdminContext dataProvider={mockDataProvider}>
        <LinkOpportunityModal
          open={false}
          contactName="Jane Doe"
          contactId={1}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      </AdminContext>
    );

    expect(screen.queryByText(/Link Opportunity to Jane Doe/i)).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- LinkOpportunityModal.test.tsx`
Expected: FAIL with "Cannot find module './LinkOpportunityModal'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/contacts/LinkOpportunityModal.tsx
import { useState } from 'react';
import { useCreate, useNotify, AutocompleteInput } from 'react-admin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LinkOpportunityModalProps {
  open: boolean;
  contactName: string;
  contactId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkOpportunityModal({
  open,
  contactName,
  contactId,
  onClose,
  onSuccess,
}: LinkOpportunityModalProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [create, { isLoading }] = useCreate();
  const notify = useNotify();

  const handleLink = async () => {
    if (!selectedOpportunity) return;

    try {
      await create(
        'opportunity_contacts',
        {
          data: {
            opportunity_id: selectedOpportunity.id,
            contact_id: contactId,
          },
        },
        {
          onSuccess: () => {
            notify(`Linked to ${selectedOpportunity.name}`, { type: 'success' });
            onSuccess();
            onClose();
          },
          onError: (error: any) => {
            notify(error?.message || 'Failed to link opportunity', { type: 'error' });
          },
        }
      );
    } catch (error: any) {
      notify('Failed to link opportunity. Please try again.', { type: 'error' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Link Opportunity to {contactName}</DialogTitle>
        </DialogHeader>

        <AutocompleteInput
          source="opportunity_id"
          reference="opportunities"
          filterToQuery={(searchText: string) => ({ name: searchText })}
          optionText={(opp: any) =>
            opp ? `${opp.name} - ${opp.customer?.name || ''} (${opp.stage})` : ''
          }
          suggestionLimit={10}
          label="Search opportunities"
          onChange={(value: any) => setSelectedOpportunity(value)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleLink} disabled={!selectedOpportunity || isLoading}>
            {isLoading ? 'Linking...' : 'Link Opportunity'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- LinkOpportunityModal.test.tsx`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/contacts/LinkOpportunityModal.tsx src/atomic-crm/contacts/LinkOpportunityModal.test.tsx
git commit -m "feat(contacts): add LinkOpportunityModal component

- Modal with autocomplete search for opportunities
- Creates junction record on link
- Shows success/error notifications
- Accessibility: focus trap, ESC to close"
```

---

## Task 5: Create UnlinkConfirmDialog Component

**Files:**
- Create: `src/atomic-crm/contacts/UnlinkConfirmDialog.tsx`
- Test: `src/atomic-crm/contacts/UnlinkConfirmDialog.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/contacts/UnlinkConfirmDialog.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UnlinkConfirmDialog } from './UnlinkConfirmDialog';
import { AdminContext } from 'react-admin';

const mockDataProvider = {
  delete: vi.fn(),
};

describe('UnlinkConfirmDialog', () => {
  const mockOpportunity = {
    id: 10,
    name: 'Deal A',
    junctionId: 'j1',
  };

  it('renders when opportunity is set', () => {
    render(
      <AdminContext dataProvider={mockDataProvider}>
        <UnlinkConfirmDialog
          opportunity={mockOpportunity}
          contactName="Jane Doe"
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      </AdminContext>
    );

    expect(screen.getByText(/Remove contact from opportunity/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Deal A/)).toBeInTheDocument();
  });

  it('does not render when opportunity is null', () => {
    render(
      <AdminContext dataProvider={mockDataProvider}>
        <UnlinkConfirmDialog
          opportunity={null}
          contactName="Jane Doe"
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      </AdminContext>
    );

    expect(screen.queryByText(/Remove contact from opportunity/i)).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- UnlinkConfirmDialog.test.tsx`
Expected: FAIL with "Cannot find module './UnlinkConfirmDialog'"

**Step 3: Write minimal implementation**

```typescript
// src/atomic-crm/contacts/UnlinkConfirmDialog.tsx
import { useDelete, useNotify } from 'react-admin';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface UnlinkConfirmDialogProps {
  opportunity: { id: number; name: string; junctionId: string } | null;
  contactName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function UnlinkConfirmDialog({
  opportunity,
  contactName,
  onClose,
  onSuccess,
}: UnlinkConfirmDialogProps) {
  const [deleteOne, { isLoading }] = useDelete();
  const notify = useNotify();

  const handleConfirm = async () => {
    if (!opportunity) return;

    try {
      await deleteOne(
        'opportunity_contacts',
        { id: opportunity.junctionId },
        {
          onSuccess: () => {
            notify(`Removed ${contactName} from ${opportunity.name}`, {
              type: 'success',
            });
            onSuccess();
            onClose();
          },
          onError: (error: any) => {
            notify(error?.message || 'Failed to unlink opportunity', { type: 'error' });
          },
        }
      );
    } catch (error: any) {
      notify('Failed to unlink opportunity. Please try again.', { type: 'error' });
    }
  };

  return (
    <AlertDialog open={!!opportunity} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove contact from opportunity?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove <strong>{contactName}</strong> from{' '}
            <strong>{opportunity?.name}</strong>? This won't delete either record,
            just removes the association.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Removing...' : 'Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- UnlinkConfirmDialog.test.tsx`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/contacts/UnlinkConfirmDialog.tsx src/atomic-crm/contacts/UnlinkConfirmDialog.test.tsx
git commit -m "feat(contacts): add UnlinkConfirmDialog component

- Confirmation dialog for removing contact from opportunity
- Deletes junction record using junctionId
- Shows success/error notifications
- Accessibility: focus trap, Cancel/Remove actions"
```

---

## Task 6: Integrate Link/Unlink Into OpportunitiesTab

**Files:**
- Modify: `src/atomic-crm/contacts/OpportunitiesTab.tsx`
- Test: `src/atomic-crm/contacts/OpportunitiesTab.test.tsx`

**Step 1: Add interaction tests**

```typescript
// Add to OpportunitiesTab.test.tsx
it('opens link modal when clicking Link Opportunity button', async () => {
  mockUseGetList.mockReturnValue({
    data: [],
    isLoading: false,
  });

  render(
    <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
      <OpportunitiesTab />
    </ShowContextProvider>
  );

  const linkButton = screen.getByText(/Link Opportunity/i);
  fireEvent.click(linkButton);

  await waitFor(() => {
    expect(screen.getByText(/Link Opportunity to Jane Doe/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- OpportunitiesTab.test.tsx`
Expected: FAIL with "Unable to find element: Link Opportunity"

**Step 3: Add link/unlink functionality**

```typescript
// Modify OpportunitiesTab.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { LinkOpportunityModal } from './LinkOpportunityModal';
import { UnlinkConfirmDialog } from './UnlinkConfirmDialog';

export function OpportunitiesTab() {
  const { record: contact, isPending } = useShowContext<Contact>();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [unlinkingOpportunity, setUnlinkingOpportunity] = useState<any>(null);

  // ... existing query logic ...

  const contactName = `${contact.first_name} ${contact.last_name}`;

  const handleLinkSuccess = () => {
    refetch();
    setShowLinkModal(false);
  };

  const handleUnlinkSuccess = () => {
    refetch();
    setUnlinkingOpportunity(null);
  };

  // ... existing loading/empty checks ...

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowLinkModal(true)}>
          Link Opportunity
        </Button>
      </div>

      <Datagrid
        data={linkedOpportunities}
        bulkActionButtons={false}
        rowClick={false}
        className="border rounded-lg"
      >
        {/* ... existing fields ... */}

        <FunctionField
          label=""
          render={(record: any) => (
            <button
              aria-label={`Unlink ${record.name} from ${contactName}`}
              className="h-11 w-11 inline-flex items-center justify-center rounded-md hover:bg-muted"
              onClick={() => setUnlinkingOpportunity(record)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        />
      </Datagrid>

      <LinkOpportunityModal
        open={showLinkModal}
        contactName={contactName}
        contactId={contact.id}
        onClose={() => setShowLinkModal(false)}
        onSuccess={handleLinkSuccess}
      />

      <UnlinkConfirmDialog
        opportunity={unlinkingOpportunity}
        contactName={contactName}
        onClose={() => setUnlinkingOpportunity(null)}
        onSuccess={handleUnlinkSuccess}
      />
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- OpportunitiesTab.test.tsx`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/contacts/OpportunitiesTab.tsx src/atomic-crm/contacts/OpportunitiesTab.test.tsx
git commit -m "feat(contacts): add link/unlink interactions to OpportunitiesTab

- Link Opportunity button opens modal
- Unlink icon (trash) on each row triggers confirmation
- Refetch data after successful link/unlink
- 44px touch targets for accessibility"
```

---

## Task 7: Add Empty State with Suggested Opportunities

**Files:**
- Create: `src/atomic-crm/contacts/SuggestedOpportunityCard.tsx`
- Modify: `src/atomic-crm/contacts/OpportunitiesTab.tsx`
- Test: `src/atomic-crm/contacts/OpportunitiesTab.test.tsx`

**Step 1: Create SuggestedOpportunityCard component**

```typescript
// src/atomic-crm/contacts/SuggestedOpportunityCard.tsx
import { Button } from '@/components/ui/button';
import { StageBadgeWithHealth } from './StageBadgeWithHealth';

interface SuggestedOpportunityCardProps {
  opportunity: {
    id: number;
    name: string;
    stage: string;
    health_status?: string;
    amount?: number;
  };
  onLink: () => void;
}

export function SuggestedOpportunityCard({
  opportunity,
  onLink,
}: SuggestedOpportunityCardProps) {
  return (
    <div className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="font-medium">{opportunity.name}</div>
        <div className="flex items-center gap-2 mt-1">
          <StageBadgeWithHealth
            stage={opportunity.stage}
            health={opportunity.health_status as any}
          />
          {opportunity.amount && (
            <span className="text-sm text-muted-foreground">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(opportunity.amount)}
            </span>
          )}
        </div>
      </div>
      <Button onClick={onLink} size="sm">
        Link
      </Button>
    </div>
  );
}
```

**Step 2: Add suggested opportunities to OpportunitiesTab**

```typescript
// Modify OpportunitiesTab.tsx - add after opportunities query
import { useMemo } from 'react';
import { SuggestedOpportunityCard } from './SuggestedOpportunityCard';

// Inside OpportunitiesTab, after opportunities query:
const { data: orgOpportunities } = useGetList(
  'opportunities',
  {
    filter: {
      customer_organization_id: contact?.organization_id,
    },
    pagination: { page: 1, perPage: 25 },
    sort: { field: 'updated_at', order: 'DESC' },
  },
  { enabled: !!contact?.organization_id && (!junctionRecords || junctionRecords.length === 0) }
);

const suggestedOpps = useMemo(() => {
  if (!orgOpportunities) return [];
  return orgOpportunities
    .filter((opp: any) => !['closed_won', 'closed_lost'].includes(opp.stage))
    .slice(0, 5);
}, [orgOpportunities]);

const handleQuickLink = async (opportunityId: number) => {
  try {
    await create(
      'opportunity_contacts',
      {
        data: {
          opportunity_id: opportunityId,
          contact_id: contact.id,
        },
      },
      {
        onSuccess: () => {
          notify('Opportunity linked', { type: 'success' });
          refetch();
        },
        onError: (error: any) => {
          notify(error?.message || 'Failed to link opportunity', { type: 'error' });
        },
      }
    );
  } catch (error) {
    notify('Failed to link opportunity', { type: 'error' });
  }
};

// Replace empty state return with:
if (!junctionRecords || junctionRecords.length === 0) {
  if (suggestedOpps.length > 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <h3 className="text-lg font-semibold">Suggested Opportunities</h3>
        <p className="text-sm text-muted-foreground">
          We found {suggestedOpps.length} active opportunities at{' '}
          {contact.organization?.name}
        </p>

        <div className="space-y-2 max-w-2xl mx-auto">
          {suggestedOpps.map((opp: any) => (
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
    );
  }

  return (
    <div className="text-center py-12 space-y-4">
      <div className="text-muted-foreground">
        <p className="text-lg">No opportunities linked yet</p>
        <p className="text-sm mt-2 max-w-md mx-auto">
          Link this contact to deals they're involved in to track their influence on
          your pipeline.
        </p>
      </div>

      <Button onClick={() => setShowLinkModal(true)}>Link Opportunity</Button>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/atomic-crm/contacts/SuggestedOpportunityCard.tsx src/atomic-crm/contacts/OpportunitiesTab.tsx
git commit -m "feat(contacts): add smart empty state with suggested opportunities

- Shows opportunities from contact's primary organization
- Filters out closed opportunities client-side
- Quick-link action for one-click linking
- Educational fallback when no suggestions available"
```

---

## Task 8: Integrate OpportunitiesTab Into ContactShow

**Files:**
- Modify: `src/atomic-crm/contacts/ContactShow.tsx`
- Test: `src/atomic-crm/contacts/ContactShow.test.tsx` (if exists)

**Step 1: Add Opportunities tab to ContactShow**

```typescript
// Modify ContactShow.tsx
import { OpportunitiesTab } from './OpportunitiesTab';

// Inside ContactShowContent component, modify Tabs section:
<Tabs defaultValue="details" className="mt-4">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="notes">Notes</TabsTrigger>
    <TabsTrigger value="activities">Activities</TabsTrigger>
    <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
  </TabsList>

  {/* ... existing Details, Notes, Activities tabs ... */}

  <TabsContent value="opportunities" className="pt-2">
    <OpportunitiesTab />
  </TabsContent>
</Tabs>
```

**Step 2: Test manually**

1. Run: `npm run dev`
2. Navigate to any contact view (e.g., `/contacts/1`)
3. Click "Opportunities" tab
4. Verify empty state or linked opportunities appear
5. Test linking/unlinking if data exists

**Step 3: Commit**

```bash
git add src/atomic-crm/contacts/ContactShow.tsx
git commit -m "feat(contacts): integrate Opportunities tab into ContactShow

- Add 4th tab to contact view (Details | Notes | Activities | Opportunities)
- Tab uses useShowContext() for contact data
- No prop drilling required"
```

---

## Task 9: Add Duplicate Link Prevention

**Files:**
- Modify: `src/atomic-crm/contacts/LinkOpportunityModal.tsx`
- Test: `src/atomic-crm/contacts/LinkOpportunityModal.test.tsx`

**Step 1: Add duplicate check prop**

```typescript
// Modify LinkOpportunityModal.tsx interface
interface LinkOpportunityModalProps {
  open: boolean;
  contactName: string;
  contactId: number;
  linkedOpportunityIds: number[]; // NEW
  onClose: () => void;
  onSuccess: () => void;
}

// Modify handleLink function
const handleLink = async () => {
  if (!selectedOpportunity) return;

  // Check for duplicate
  if (linkedOpportunityIds.includes(selectedOpportunity.id)) {
    notify('This contact is already linked to that opportunity', {
      type: 'warning',
    });
    return;
  }

  // ... rest of existing link logic ...
};
```

**Step 2: Update OpportunitiesTab to pass linked IDs**

```typescript
// Modify OpportunitiesTab.tsx
const linkedOpportunityIds = linkedOpportunities.map((opp: any) => opp.id);

<LinkOpportunityModal
  open={showLinkModal}
  contactName={contactName}
  contactId={contact.id}
  linkedOpportunityIds={linkedOpportunityIds}
  onClose={() => setShowLinkModal(false)}
  onSuccess={handleLinkSuccess}
/>
```

**Step 3: Add test for duplicate prevention**

```typescript
// Add to LinkOpportunityModal.test.tsx
it('prevents linking duplicate opportunities', async () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  render(
    <AdminContext dataProvider={mockDataProvider}>
      <LinkOpportunityModal
        open={true}
        contactName="Jane Doe"
        contactId={1}
        linkedOpportunityIds={[10, 11]}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </AdminContext>
  );

  // Simulate selecting opportunity 10 (already linked)
  // ... test interaction ...

  expect(mockDataProvider.create).not.toHaveBeenCalled();
  expect(onSuccess).not.toHaveBeenCalled();
});
```

**Step 4: Commit**

```bash
git add src/atomic-crm/contacts/LinkOpportunityModal.tsx src/atomic-crm/contacts/OpportunitiesTab.tsx src/atomic-crm/contacts/LinkOpportunityModal.test.tsx
git commit -m "feat(contacts): add duplicate link prevention

- Check if opportunity already linked before creating junction record
- Show warning notification for duplicates
- No extra database queries (uses in-memory data)"
```

---

## Task 10: Add E2E Tests

**Files:**
- Create: `tests/e2e/contacts/opportunities-tab.spec.ts`

**Step 1: Write E2E test scenarios**

```typescript
// tests/e2e/contacts/opportunities-tab.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Contact Opportunities Tab', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to a contact
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Navigate to first contact
    await page.goto('/contacts/1');
  });

  test('shows Opportunities tab', async ({ page }) => {
    const opportunitiesTab = page.locator('button:has-text("Opportunities")');
    await expect(opportunitiesTab).toBeVisible();
  });

  test('displays linked opportunities', async ({ page }) => {
    // Click Opportunities tab
    await page.click('button:has-text("Opportunities")');

    // Wait for content to load
    await page.waitForSelector('[role="grid"]', { timeout: 5000 });

    // Should show table or empty state
    const hasTable = await page.locator('[role="grid"]').count();
    const hasEmptyState = await page.locator('text=/No opportunities linked/i').count();

    expect(hasTable + hasEmptyState).toBeGreaterThan(0);
  });

  test('opens link modal on button click', async ({ page }) => {
    await page.click('button:has-text("Opportunities")');
    await page.click('button:has-text("Link Opportunity")');

    // Modal should appear
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=/Link Opportunity to/i')).toBeVisible();
  });

  test('closes modal on cancel', async ({ page }) => {
    await page.click('button:has-text("Opportunities")');
    await page.click('button:has-text("Link Opportunity")');

    // Click Cancel
    await page.click('button:has-text("Cancel")');

    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('all interactive elements meet 44px touch target', async ({ page }) => {
    await page.click('button:has-text("Opportunities")');

    // Check Link Opportunity button
    const linkButton = page.locator('button:has-text("Link Opportunity")');
    const linkButtonSize = await linkButton.boundingBox();
    expect(linkButtonSize?.height).toBeGreaterThanOrEqual(44);

    // Check unlink icons if present
    const unlinkButtons = page.locator('button[aria-label*="Unlink"]');
    const count = await unlinkButtons.count();

    for (let i = 0; i < count; i++) {
      const bbox = await unlinkButtons.nth(i).boundingBox();
      expect(bbox?.height).toBeGreaterThanOrEqual(44);
      expect(bbox?.width).toBeGreaterThanOrEqual(44);
    }
  });
});
```

**Step 2: Run E2E tests**

Run: `npm run test:e2e -- opportunities-tab.spec.ts`
Expected: PASS (5 tests) or adjust based on test environment

**Step 3: Commit**

```bash
git add tests/e2e/contacts/opportunities-tab.spec.ts
git commit -m "test(contacts): add E2E tests for Opportunities tab

- Tab visibility and navigation
- Linked opportunities display
- Link modal open/close interactions
- Touch target accessibility (44px minimum)
- 5 test scenarios covering critical workflows"
```

---

## Task 11: Update FilterRegistry (If Needed)

**Files:**
- Check: `src/atomic-crm/providers/supabase/filterRegistry.ts`

**Step 1: Verify opportunity_contacts is registered**

```bash
grep -n "opportunity_contacts" src/atomic-crm/providers/supabase/filterRegistry.ts
```

**Expected:** If no results, add entry. If exists, skip to Step 4.

**Step 2: Add opportunity_contacts to filterRegistry**

```typescript
// Add to filterRegistry.ts
export const filterableFields: Record<string, string[]> = {
  // ... existing entries ...

  // Opportunity Contacts Junction Table
  opportunity_contacts: [
    "id",
    "opportunity_id",
    "contact_id",
    "role",
    "is_primary",
    "notes",
    "created_at",
    "updated_at",
  ],
};
```

**Step 3: Commit if changes made**

```bash
git add src/atomic-crm/providers/supabase/filterRegistry.ts
git commit -m "chore(providers): add opportunity_contacts to filterRegistry

- Prevents 400 errors from stale filters
- Supports contact_id and opportunity_id queries"
```

**Step 4: Skip if already registered**

If `opportunity_contacts` already exists in filterRegistry, no changes needed.

---

## Task 12: Final Manual Testing & Documentation

**Files:**
- Update: `docs/architecture/erd-to-ui-mapping.md` (optional)
- Update: `CLAUDE.md` (optional - add feature to Recent Changes)

**Step 1: Manual testing checklist**

1. ✅ Navigate to contact view
2. ✅ Click Opportunities tab
3. ✅ Verify empty state shows (if no links)
4. ✅ Verify suggested opportunities appear (if org has opps)
5. ✅ Click "Link Opportunity" → modal opens
6. ✅ Search for opportunity → autocomplete works
7. ✅ Select and link → junction record created
8. ✅ Table shows linked opportunity
9. ✅ Click unlink icon → confirmation dialog appears
10. ✅ Confirm removal → junction record deleted
11. ✅ All touch targets ≥ 44px (use browser dev tools)
12. ✅ Tab navigation works (keyboard only)
13. ✅ Screen reader announces tab content

**Step 2: Update documentation (optional)**

If updating `docs/architecture/erd-to-ui-mapping.md`:

```markdown
## Contact ↔ Opportunities (opportunity_contacts.contact_id)

**ERD Source:** supabase/migrations/20251028213020_create_opportunity_contacts_junction_table.sql

**UI Coverage:**

| Operation | Create | Edit | View | Notes |
|-----------|--------|------|------|-------|
| Link opportunity | ❌ | ❌ | ✅ | Opportunities tab: modal with autocomplete |
| Unlink opportunity | ❌ | ❌ | ✅ | Opportunities tab: trash icon + confirmation |
| View linked opportunities | ❌ | ❌ | ✅ | Opportunities tab: table with stage/health/amount |
| Suggested opportunities | ❌ | ❌ | ✅ | Empty state: smart suggestions from primary org |

**Implementation:** `src/atomic-crm/contacts/OpportunitiesTab.tsx` (added 2025-11-18)
```

**Step 3: Final commit**

```bash
git add docs/architecture/erd-to-ui-mapping.md
git commit -m "docs: update ERD-to-UI mapping for Contact Opportunities

- Document new Opportunities tab UI coverage
- Mark relationship as fully exposed in contact view
- Reference implementation files"
```

---

## Completion Checklist

- [ ] All 12 tasks completed
- [ ] Unit tests passing (run `npm test`)
- [ ] E2E tests passing (run `npm run test:e2e`)
- [ ] Manual testing checklist complete
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] All commits pushed to branch

---

## Troubleshooting

**Tests failing with "Cannot find module":**
- Verify imports use correct paths (check `@/` alias)
- Run `npm run type-check` to catch import errors

**ReferenceField errors:**
- Ensure `customer_organization_id` exists in opportunities table
- Check filterRegistry includes required fields

**Empty state not showing suggestions:**
- Verify contact has `organization_id` set
- Check organization has active opportunities (not closed)
- Inspect client-side filter logic in browser console

**Touch targets under 44px:**
- Check button className includes `h-11 w-11` or equivalent
- Use browser dev tools to measure actual rendered size
- Apply padding if icon buttons are too small

---

## Next Steps After Implementation

1. **Code review:** Request review against design doc
2. **QA testing:** Full regression test on contact module
3. **Performance check:** Profile queries with 100+ linked opportunities
4. **Documentation:** Update user-facing docs if needed
5. **Deploy:** Merge to main after approval

---

**End of Implementation Plan**

Total estimated time: 3-4 hours (12 tasks × 15-20 min avg)
