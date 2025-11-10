# Campaign Grouping UI Design Spike

**Date:** November 3, 2024
**Spike ID:** P3-E3-S0-T1
**Confidence Before:** 55%
**Confidence After:** 80%
**Time Spent:** 3 hours

## Executive Summary

After researching UI patterns and analyzing project constraints, we recommend implementing a **Grouped Datagrid with Collapsible Sections** using React Admin's existing components. This balances the trade show quick-entry needs with bulk operations while leveraging existing project infrastructure.

## Use Case Requirements

### Trade Show Workflow
1. **Quick Entry:** Salespeople add 20-50 booth visitors as opportunities
2. **Shared Campaign:** All share same campaign (e.g., "NRA Show 2025")
3. **Different Details:** Each has different principal/product
4. **Bulk Operations:** Update stage, assign owner for multiple opportunities
5. **iPad First:** Must work well on iPad for booth usage

### Viewing Requirements
- View all opportunities from a campaign together
- Support 10+ campaigns with 20+ opportunities each
- Compare opportunities across campaigns
- Export grouped data to CSV

## UI Pattern Analysis

### Option 1: Accordion/Collapsible Sections ✅ (Recommended)
**Pros:**
- Clear visual grouping by campaign
- Space-efficient when collapsed
- Works well on iPad (vertical stacking)
- Natural fit for React Admin's List component

**Cons:**
- Bulk operations across campaigns need all sections open
- Long scroll with 20+ opportunities per campaign

**Verdict:** Best balance for our needs with proper implementation

### Option 2: Tab Interface ❌
**Pros:**
- Clear separation between campaigns
- Simple navigation

**Cons:**
- Doesn't scale beyond 5-6 campaigns
- No cross-campaign comparison
- Poor iPad experience with many tabs

**Verdict:** Rejected due to scalability issues

### Option 3: Nested List
**Pros:**
- Similar to accordions but simpler

**Cons:**
- Less visual distinction than accordions
- Same bulk operation limitations

**Verdict:** Accordion is superior with better visual design

### Option 4: Card Groups
**Pros:**
- Visually appealing
- Good mobile experience

**Cons:**
- Not dense enough for 20+ items
- Poor for bulk operations

**Verdict:** Better for summary views, not detail work

### Option 5: Table with Grouping Rows ✅ (Alternative)
**Pros:**
- Excellent for bulk operations
- High data density
- Natural checkbox selection

**Cons:**
- Requires careful mobile design
- Can appear overwhelming initially

**Verdict:** Strong alternative if bulk operations become primary

## Recommended Implementation

### Primary Pattern: Grouped Datagrid with Campaign Sections

Using React Admin's existing components with custom grouping logic:

```typescript
// src/atomic-crm/opportunities/CampaignGroupedList.tsx
import { List, Datagrid, TextField, BooleanField, SelectField, useListContext } from 'react-admin';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@radix-ui/react-accordion';
import { useState, useMemo } from 'react';

interface GroupedOpportunities {
  campaign: string;
  opportunities: Opportunity[];
  count: number;
  totalValue: number;
}

export const CampaignGroupedList = () => {
  const [expandedCampaigns, setExpandedCampaigns] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  return (
    <List
      filters={<CampaignFilters />}
      actions={<BulkActions selectedIds={selectedIds} />}
    >
      <CampaignGroupedDatagrid
        expandedCampaigns={expandedCampaigns}
        onToggle={setExpandedCampaigns}
        selectedIds={selectedIds}
        onSelect={setSelectedIds}
      />
    </List>
  );
};

const CampaignGroupedDatagrid = ({ expandedCampaigns, onToggle, selectedIds, onSelect }) => {
  const { data, isLoading } = useListContext();

  // Group opportunities by campaign
  const grouped = useMemo(() => {
    if (!data) return [];

    const groups = data.reduce((acc, opp) => {
      const campaign = opp.campaign || 'No Campaign';
      if (!acc[campaign]) {
        acc[campaign] = {
          campaign,
          opportunities: [],
          count: 0,
          totalValue: 0
        };
      }
      acc[campaign].opportunities.push(opp);
      acc[campaign].count++;
      acc[campaign].totalValue += opp.expected_value || 0;
      return acc;
    }, {} as Record<string, GroupedOpportunities>);

    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [data]);

  return (
    <Accordion
      type="multiple"
      value={expandedCampaigns}
      onValueChange={onToggle}
    >
      {grouped.map(group => (
        <AccordionItem key={group.campaign} value={group.campaign}>
          <AccordionTrigger className="campaign-header">
            <div className="flex justify-between w-full">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={group.opportunities.every(o => selectedIds.has(o.id))}
                  onChange={(e) => {
                    const ids = group.opportunities.map(o => o.id);
                    if (e.target.checked) {
                      onSelect(new Set([...selectedIds, ...ids]));
                    } else {
                      onSelect(new Set([...selectedIds].filter(id => !ids.includes(id))));
                    }
                  }}
                  onClick={e => e.stopPropagation()}
                />
                <span className="font-semibold">{group.campaign}</span>
                <span className="badge">{group.count} opportunities</span>
                <span className="text-sm text-gray-500">
                  Total: ${group.totalValue.toLocaleString()}
                </span>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent>
            <Datagrid
              data={group.opportunities}
              bulkActionButtons={false}
              rowClick="show"
            >
              <BooleanField
                source="selected"
                render={record => (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(record.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedIds);
                      if (e.target.checked) {
                        newSelected.add(record.id);
                      } else {
                        newSelected.delete(record.id);
                      }
                      onSelect(newSelected);
                    }}
                  />
                )}
              />
              <TextField source="name" />
              <TextField source="organization.name" label="Customer" />
              <TextField source="principal" />
              <SelectField source="stage" choices={stageChoices} />
              <TextField source="expected_value" />
              <TextField source="owner.name" label="Owner" />
            </Datagrid>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
```

### Mobile/iPad Optimization

For iPad and mobile devices, transform to a card-based layout:

```typescript
const MobileCampaignList = () => {
  const { data } = useListContext();
  const grouped = useGroupedData(data);

  return (
    <div className="mobile-campaign-list">
      {grouped.map(group => (
        <div key={group.campaign} className="campaign-group">
          <div className="campaign-header p-4 bg-gray-50">
            <h3>{group.campaign}</h3>
            <p>{group.count} opportunities • ${group.totalValue}</p>
          </div>

          <div className="opportunities-list">
            {group.opportunities.map(opp => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onSelect={handleSelect}
                selected={selectedIds.has(opp.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Responsive wrapper
export const ResponsiveCampaignList = () => {
  const isTablet = useMediaQuery('(max-width: 768px)');

  return isTablet ? <MobileCampaignList /> : <CampaignGroupedList />;
};
```

### Quick Entry for Trade Shows

Separate optimized form for rapid booth entry:

```typescript
const TradeShowQuickEntry = ({ campaign }: { campaign: string }) => {
  const [create] = useCreate();
  const notify = useNotify();

  const onSubmit = async (data: OpportunityInput) => {
    // Pre-fill campaign
    const opportunity = {
      ...data,
      campaign,
      stage: 'new_lead',
      source: 'trade_show',
      created_at: new Date()
    };

    await create('opportunities', { data: opportunity });
    notify('Opportunity added!', { type: 'success' });

    // Reset form but keep campaign
    reset({ campaign });
    firstFieldRef.current?.focus();
  };

  return (
    <SimpleForm onSubmit={onSubmit}>
      <TextInput source="company_name" autoFocus ref={firstFieldRef} />
      <TextInput source="contact_name" />
      <SelectInput source="principal" choices={principals} />
      <SelectInput source="product_interest" choices={products} />
      <TextInput source="notes" multiline />

      <div className="flex gap-2">
        <SaveButton label="Add & Continue" />
        <SaveAndShowButton />
      </div>
    </SimpleForm>
  );
};
```

### Bulk Operations Implementation

```typescript
const BulkActions = ({ selectedIds }: { selectedIds: Set<string> }) => {
  const [updateMany] = useUpdateMany();
  const notify = useNotify();

  const handleBulkStageUpdate = async (newStage: string) => {
    await updateMany('opportunities', {
      ids: Array.from(selectedIds),
      data: { stage: newStage }
    });
    notify(`Updated ${selectedIds.size} opportunities`);
  };

  if (selectedIds.size === 0) return null;

  return (
    <div className="bulk-actions-bar">
      <span>{selectedIds.size} selected</span>

      <Select onValueChange={handleBulkStageUpdate}>
        <SelectTrigger>Update Stage</SelectTrigger>
        <SelectContent>
          {stages.map(stage => (
            <SelectItem key={stage} value={stage}>
              {stage}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={handleBulkAssign}>Assign Owner</Button>
      <Button onClick={handleBulkExport}>Export Selected</Button>
      <Button variant="destructive" onClick={handleBulkDelete}>Delete</Button>
    </div>
  );
};
```

## Performance Considerations

### Virtualization for Large Lists
With 10+ campaigns and 20+ opportunities each (200+ total rows), implement virtualization:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualizedOpportunityList = ({ opportunities }) => {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: opportunities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Row height
    overscan: 5
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            <OpportunityRow opportunity={opportunities[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Migration Path

### Phase 1: Basic Grouping (2 days)
1. Add campaign field to opportunities table
2. Implement grouped view with accordions
3. Basic expand/collapse functionality

### Phase 2: Bulk Operations (1 day)
1. Add checkbox selection
2. Implement bulk stage update
3. Add bulk assign owner

### Phase 3: Trade Show Optimization (1 day)
1. Create quick entry form
2. Add campaign context preservation
3. Optimize for iPad usage

### Phase 4: Polish (1 day)
1. Add virtualization for performance
2. Implement CSV export with grouping
3. Add campaign statistics

## Testing Requirements

```typescript
describe('CampaignGroupedList', () => {
  it('groups opportunities by campaign', async () => {
    const { getByText } = render(<CampaignGroupedList />);
    expect(getByText('NRA Show 2025 (15 opportunities)')).toBeInTheDocument();
  });

  it('expands/collapses campaign sections', async () => {
    const { getByRole } = render(<CampaignGroupedList />);
    const trigger = getByRole('button', { name: /NRA Show 2025/ });

    fireEvent.click(trigger);
    expect(getByText('Fishpeople Foods')).toBeVisible();

    fireEvent.click(trigger);
    expect(queryByText('Fishpeople Foods')).not.toBeVisible();
  });

  it('selects all opportunities in campaign', async () => {
    const { getByTestId } = render(<CampaignGroupedList />);
    const campaignCheckbox = getByTestId('select-all-nra-2025');

    fireEvent.click(campaignCheckbox);
    expect(getAllByRole('checkbox', { checked: true })).toHaveLength(16);
  });

  it('performs bulk stage update', async () => {
    // Select opportunities
    // Click bulk update
    // Verify API calls
  });
});
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Performance with 200+ rows | Implement virtualization |
| Complex state management | Use React Admin's ListContext |
| Mobile responsiveness | Separate mobile layout |
| Bulk operation complexity | Start with simple operations |

## Recommendations

1. **Start with Accordion Pattern** - Clearest visual grouping for campaigns
2. **Use React Admin Components** - Leverage existing Datagrid and List
3. **Separate Mobile View** - Card-based layout for iPad
4. **Add Virtualization Early** - Prevent performance issues
5. **Test with Real Data** - Use 10 campaigns × 25 opportunities

## Conclusion

The Grouped Datagrid with Collapsible Campaign Sections provides the best balance of:
- ✅ Clear visual grouping
- ✅ Bulk operation support
- ✅ iPad/mobile optimization
- ✅ Leverages existing React Admin components
- ✅ Scalable to 200+ opportunities

Confidence increases from 55% to 80% because:
- Clear implementation pattern defined
- Uses existing project infrastructure
- Tested UI patterns from successful CRMs
- Performance strategy included
- Mobile-first approach for trade shows