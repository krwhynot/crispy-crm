# Cascading Soft Delete - Frontend Developer Guide

## Quick Start

When archiving or unarchiving opportunities, use the dedicated cascade functions to ensure all related records are handled consistently.

## API Functions

### archive_opportunity_with_relations(opportunityId: number)

Soft-deletes an opportunity and all related records.

**Parameters:**
- `opportunityId` (number/BIGINT): The ID of the opportunity to archive

**Returns:** void (no return value)

**Cascade Behavior:**
- Archives the opportunity itself
- Archives all activities linked to this opportunity
- Archives all notes linked to this opportunity
- Archives all tasks linked to this opportunity
- Archives all participants linked to this opportunity

**Example:**
```typescript
// Using react-admin DataProvider
const { data, isLoading, error } = useRpc('archive_opportunity_with_relations', {
  opp_id: 123
});

// Or directly with Supabase client
const { error } = await supabaseClient.rpc('archive_opportunity_with_relations', {
  opp_id: 123
});
```

### unarchive_opportunity_with_relations(opportunityId: number)

Restores a soft-deleted opportunity and all related records.

**Parameters:**
- `opportunityId` (number/BIGINT): The ID of the opportunity to unarchive

**Returns:** void (no return value)

**Cascade Behavior:**
- Unarchives the opportunity itself
- Unarchives all activities that were deleted with this opportunity
- Unarchives all notes that were deleted with this opportunity
- Unarchives all tasks that were deleted with this opportunity
- Unarchives all participants that were deleted with this opportunity

**Example:**
```typescript
// Using react-admin DataProvider
const { data, isLoading, error } = useRpc('unarchive_opportunity_with_relations', {
  opp_id: 123
});

// Or directly with Supabase client
const { error } = await supabaseClient.rpc('unarchive_opportunity_with_relations', {
  opp_id: 123
});
```

## React Component Example

### Archive Opportunity Button

```typescript
import { Button } from '@/components/ui/button';
import { useRpc } from '@/hooks/useRpc'; // Adjust path as needed

export function ArchiveOpportunityButton({ opportunityId, onSuccess }) {
  const { isLoading, error } = useRpc('archive_opportunity_with_relations', {
    opp_id: opportunityId
  });

  const handleArchive = async () => {
    try {
      // The RPC call is already triggered, just handle the response
      if (!error) {
        onSuccess?.();
        // Show success toast
        console.log('Opportunity archived with all related records');
      }
    } catch (err) {
      console.error('Failed to archive opportunity:', err);
      // Show error toast
    }
  };

  return (
    <Button
      onClick={handleArchive}
      disabled={isLoading}
      variant="destructive"
    >
      {isLoading ? 'Archiving...' : 'Archive Opportunity'}
    </Button>
  );
}
```

### Unarchive Opportunity Button

```typescript
import { Button } from '@/components/ui/button';
import { useRpc } from '@/hooks/useRpc'; // Adjust path as needed

export function UnarchiveOpportunityButton({ opportunityId, onSuccess }) {
  const { isLoading, error } = useRpc('unarchive_opportunity_with_relations', {
    opp_id: opportunityId
  });

  const handleUnarchive = async () => {
    try {
      if (!error) {
        onSuccess?.();
        // Show success toast
        console.log('Opportunity unarchived with all related records');
      }
    } catch (err) {
      console.error('Failed to unarchive opportunity:', err);
      // Show error toast
    }
  };

  return (
    <Button
      onClick={handleUnarchive}
      disabled={isLoading}
      variant="outline"
    >
      {isLoading ? 'Restoring...' : 'Restore Opportunity'}
    </Button>
  );
}
```

## React-Admin Integration

### Using with List Actions

```typescript
import { Button } from '@/components/ui/button';

export const OpportunitiesList = () => {
  return (
    <List>
      <Datagrid>
        {/* ... columns ... */}
        <ArchiveActions />
      </Datagrid>
    </List>
  );
};

// In bulk actions or row actions
const ArchiveActions = () => {
  const { mutate: archive } = useMutation({
    mutationFn: (opportunityId) =>
      supabaseClient.rpc('archive_opportunity_with_relations', {
        opp_id: opportunityId
      }),
    onSuccess: () => {
      // Refetch opportunities list
      queryClient.invalidateQueries(['opportunities']);
    }
  });

  return (
    <Button
      onClick={() => archive(opportunity.id)}
      size="sm"
      variant="ghost"
    >
      Archive
    </Button>
  );
};
```

### Using with Show Page

```typescript
import { useShowController } from 'react-admin';
import { useMutation } from '@tanstack/react-query';

export const OpportunityShow = () => {
  const { record } = useShowController();
  const { mutate: archiveOpp } = useMutation({
    mutationFn: () =>
      supabaseClient.rpc('archive_opportunity_with_relations', {
        opp_id: record.id
      }),
    onSuccess: () => {
      // Redirect or refresh
      window.location.reload();
    }
  });

  if (!record) return <Loading />;

  return (
    <Show>
      <SimpleShowLayout>
        {/* ... fields ... */}
        <ArrayField
          source="activities"
          label="Activities"
        >
          <Datagrid bulkActionButtons={false}>
            {/* Activities will be archived when opportunity is archived */}
          </Datagrid>
        </ArrayField>

        {record.deleted_at ? (
          <Button
            onClick={() => archiveOpp()}
            label="Restore Opportunity"
          />
        ) : (
          <Button
            onClick={() => archiveOpp()}
            label="Archive Opportunity"
          />
        )}
      </SimpleShowLayout>
    </Show>
  );
};
```

## Data Provider Integration

If using a custom data provider, ensure RPC methods are wired correctly:

```typescript
// In your data provider
const rpcs = {
  'archive_opportunity_with_relations': async (params) => {
    const { data, error } = await supabaseClient.rpc(
      'archive_opportunity_with_relations',
      { opp_id: params.opp_id }
    );
    if (error) throw error;
    return data;
  },
  'unarchive_opportunity_with_relations': async (params) => {
    const { data, error } = await supabaseClient.rpc(
      'unarchive_opportunity_with_relations',
      { opp_id: params.opp_id }
    );
    if (error) throw error;
    return data;
  }
};
```

## Error Handling

Both functions will raise an exception if the opportunity ID is null or missing:

```typescript
try {
  await supabaseClient.rpc('archive_opportunity_with_relations', {
    opp_id: null // Will throw "Opportunity ID cannot be null"
  });
} catch (error) {
  if (error.message.includes('Opportunity ID cannot be null')) {
    // Show validation error
    console.error('Invalid opportunity ID');
  } else {
    // Show generic error
    console.error('Failed to archive opportunity', error);
  }
}
```

## What Gets Archived/Unarchived

### Activities
- All records where `opportunity_id = {opportunityId}`
- Related interaction participants are NOT directly archived (reference only)

### Opportunity Notes
- All records where `opportunity_id = {opportunityId}`

### Tasks
- All records where `opportunity_id = {opportunityId}`
- Task-specific fields (due_date, completed, etc.) remain unchanged

### Opportunity Participants
- All records where `opportunity_id = {opportunityId}`

### NOT Affected
- Contacts linked to the opportunity (contact_ids array) are NOT archived
- Organizations are NOT archived
- Sales representatives are NOT archived

## Best Practices

1. **Always use cascade functions** - Don't manually update `deleted_at` fields on opportunity-related records

2. **Confirm before archiving** - Show a confirmation dialog listing what will be archived:
   ```typescript
   const counts = await supabaseClient
     .from('activities')
     .select('count')
     .eq('opportunity_id', opportunityId)
     .eq('deleted_at', null);

   // Show: "Archive this opportunity and [n] related activities?"
   ```

3. **Provide unarchive option** - Always provide a way to restore archived opportunities
   - Keep them visible in an "Archived" view
   - Show restore button in record details
   - Add bulk restore in lists

4. **Audit the timestamp** - The `deleted_at` timestamp is preserved for audit purposes
   ```typescript
   const archivedAt = record.deleted_at;
   console.log(`Archived at: ${new Date(archivedAt).toLocaleString()}`);
   ```

5. **Filter queries correctly** - Remember to filter soft-deleted records:
   ```typescript
   // Exclude archived opportunities
   const query = supabaseClient
     .from('opportunities')
     .select('*')
     .is('deleted_at', null);

   // Include only archived opportunities
   const archivedQuery = supabaseClient
     .from('opportunities')
     .select('*')
     .not('deleted_at', 'is', null);
   ```

## Testing

Test the cascade behavior with:

```typescript
// 1. Create opportunity with related records
// 2. Archive it
await supabaseClient.rpc('archive_opportunity_with_relations', {
  opp_id: testOpportunityId
});

// 3. Verify all related records are archived
const activities = await supabaseClient
  .from('activities')
  .select('*')
  .eq('opportunity_id', testOpportunityId);

// All should have deleted_at IS NOT NULL

// 4. Unarchive it
await supabaseClient.rpc('unarchive_opportunity_with_relations', {
  opp_id: testOpportunityId
});

// 5. Verify all related records are restored
// All should have deleted_at IS NULL
```

## Related Documentation

- [Soft Delete Cascade Guide](./SOFT_DELETE_CASCADE_GUIDE.md) - Technical details
- [Database Workflow](../supabase/WORKFLOW.md) - General database patterns
- [Supabase RPC Documentation](https://supabase.com/docs/guides/database/functions)
