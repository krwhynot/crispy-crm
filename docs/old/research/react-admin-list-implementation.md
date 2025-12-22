# React Admin List Implementation Guide

> **Purpose:** Code patterns and implementation examples for Crispy CRM lists
> **Framework:** React Admin 5 + React 19 + TypeScript + Tailwind CSS v4

---

## Datagrid Configuration Patterns

### Basic Configurable Datagrid

Allow users to show/hide columns with persistence:

```tsx
// src/atomic-crm/contacts/ContactList.tsx
import {
  List,
  DatagridConfigurable,
  TextField,
  EmailField,
  DateField,
  ReferenceField,
  SelectColumnsButton,
  FilterButton,
  CreateButton,
  ExportButton,
  TopToolbar,
} from 'react-admin';

const ContactListActions = () => (
  <TopToolbar>
    <SelectColumnsButton />
    <FilterButton />
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

export const ContactList = () => (
  <List
    actions={<ContactListActions />}
    aside={<ContactFilterSidebar />}
  >
    <DatagridConfigurable
      rowClick="show"
      bulkActionButtons={<ContactBulkActions />}
    >
      <TextField source="name" />
      <ReferenceField source="organization_id" reference="organizations">
        <TextField source="name" />
      </ReferenceField>
      <TextField source="role" />
      <EmailField source="email" />
      <TextField source="phone" />
      <DateField source="last_activity_at" showTime={false} />
    </DatagridConfigurable>
  </List>
);
```

### Datagrid with Row Styling

Apply conditional styling based on record data:

```tsx
// src/atomic-crm/opportunities/OpportunityList.tsx
import { List, Datagrid, TextField, DateField } from 'react-admin';
import type { Identifier, RaRecord } from 'react-admin';

interface Opportunity extends RaRecord {
  id: Identifier;
  name: string;
  stage: string;
  next_task_due_at: string | null;
  is_overdue: boolean;
}

const opportunityRowSx = (record: Opportunity) => ({
  // Highlight overdue opportunities
  backgroundColor: record.is_overdue ? 'hsl(var(--destructive) / 0.1)' : undefined,
  // Left border for hot leads
  borderLeft: record.stage === 'new_lead' ? '4px solid hsl(var(--primary))' : undefined,
  // Muted styling for closed
  opacity: record.stage.startsWith('closed') ? 0.6 : 1,
});

export const OpportunityList = () => (
  <List>
    <Datagrid rowSx={opportunityRowSx} rowClick="show">
      <TextField source="name" />
      {/* ... other columns */}
    </Datagrid>
  </List>
);
```

### Datagrid Size Variants

Control row density:

```tsx
// Compact mode (default in React Admin)
<Datagrid size="small">
  {/* columns */}
</Datagrid>

// Comfortable mode (more padding)
<Datagrid size="medium">
  {/* columns */}
</Datagrid>
```

---

## Custom Column Components

### Truncated Text with Tooltip

```tsx
// src/components/admin/TruncatedTextField.tsx
import { useRecordContext } from 'react-admin';
import { Tooltip } from '@mui/material';
import { get } from 'lodash';

interface TruncatedTextFieldProps {
  source: string;
  maxWidth?: number;
  label?: string;
}

export const TruncatedTextField = ({
  source,
  maxWidth = 200,
  label
}: TruncatedTextFieldProps) => {
  const record = useRecordContext();
  if (!record) return null;

  const value = get(record, source);
  if (!value) return <span className="text-muted-foreground">—</span>;

  return (
    <Tooltip title={value} placement="top" arrow>
      <span
        style={{
          display: 'block',
          maxWidth,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </Tooltip>
  );
};

// Add label for column header
TruncatedTextField.defaultProps = { label: undefined };

// Usage:
<TruncatedTextField source="email" maxWidth={180} label="Email" />
```

### Status Badge Column

```tsx
// src/components/admin/StageBadgeField.tsx
import { useRecordContext } from 'react-admin';
import { cn } from '@/lib/utils';

const STAGE_CONFIG: Record<string, { label: string; className: string }> = {
  new_lead: {
    label: 'New Lead',
    className: 'bg-blue-100 text-blue-800'
  },
  initial_outreach: {
    label: 'Initial Outreach',
    className: 'bg-indigo-100 text-indigo-800'
  },
  sample_visit_offered: {
    label: 'Sample/Visit Offered',
    className: 'bg-purple-100 text-purple-800'
  },
  feedback_logged: {
    label: 'Feedback Logged',
    className: 'bg-yellow-100 text-yellow-800'
  },
  demo_scheduled: {
    label: 'Demo Scheduled',
    className: 'bg-orange-100 text-orange-800'
  },
  closed_won: {
    label: 'Closed Won',
    className: 'bg-green-100 text-green-800'
  },
  closed_lost: {
    label: 'Closed Lost',
    className: 'bg-gray-100 text-gray-500'
  },
};

interface StageBadgeFieldProps {
  source?: string;
  label?: string;
}

export const StageBadgeField = ({ source = 'stage' }: StageBadgeFieldProps) => {
  const record = useRecordContext();
  if (!record) return null;

  const stage = record[source] as string;
  const config = STAGE_CONFIG[stage] || { label: stage, className: 'bg-gray-100' };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  );
};

StageBadgeField.defaultProps = { label: 'Stage' };
```

### Next Task Column (Critical for Crispy CRM)

```tsx
// src/components/admin/NextTaskField.tsx
import { useRecordContext } from 'react-admin';
import { formatDistanceToNow, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface NextTaskFieldProps {
  source?: string;
  label?: string;
}

export const NextTaskField = ({ source = 'next_task' }: NextTaskFieldProps) => {
  const record = useRecordContext();
  if (!record) return null;

  const task = record[source] as { title: string; due_at: string } | null;

  if (!task) {
    return (
      <span className="text-muted-foreground text-sm italic">
        No tasks
      </span>
    );
  }

  const dueDate = new Date(task.due_at);
  const isOverdue = isPast(dueDate) && !isToday(dueDate);
  const isDueToday = isToday(dueDate);

  return (
    <div className="flex items-center gap-2">
      {isOverdue && <AlertCircle className="h-4 w-4 text-destructive" />}
      {isDueToday && <Clock className="h-4 w-4 text-warning" />}
      {!isOverdue && !isDueToday && <CheckCircle className="h-4 w-4 text-muted-foreground" />}

      <div className="flex flex-col">
        <span
          className={cn(
            'text-sm truncate max-w-[150px]',
            isOverdue && 'text-destructive font-medium',
            isDueToday && 'text-warning font-medium'
          )}
        >
          {task.title}
        </span>
        <span className="text-xs text-muted-foreground">
          {isOverdue
            ? `Overdue ${formatDistanceToNow(dueDate)}`
            : isDueToday
              ? 'Due today'
              : `Due ${formatDistanceToNow(dueDate, { addSuffix: true })}`
          }
        </span>
      </div>
    </div>
  );
};

NextTaskField.defaultProps = { label: 'Next Task' };
```

### Organization Type Badge

```tsx
// src/components/admin/OrgTypeBadgeField.tsx
import { useRecordContext } from 'react-admin';
import { cn } from '@/lib/utils';
import { Building2, Store, Factory } from 'lucide-react';

const ORG_TYPE_CONFIG = {
  distributor: {
    label: 'Distributor',
    className: 'bg-primary/10 text-primary',
    icon: Building2,
  },
  operator: {
    label: 'Operator',
    className: 'bg-secondary/10 text-secondary',
    icon: Store,
  },
  principal: {
    label: 'Principal',
    className: 'bg-accent/10 text-accent',
    icon: Factory,
  },
};

export const OrgTypeBadgeField = ({ source = 'type' }: { source?: string; label?: string }) => {
  const record = useRecordContext();
  if (!record) return null;

  const type = record[source] as keyof typeof ORG_TYPE_CONFIG;
  const config = ORG_TYPE_CONFIG[type];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
        config.className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

OrgTypeBadgeField.defaultProps = { label: 'Type' };
```

---

## Filter Component Patterns

### Filter Sidebar with SavedQueries

```tsx
// src/atomic-crm/opportunities/OpportunityFilterSidebar.tsx
import {
  FilterList,
  FilterListItem,
  FilterLiveSearch,
  SavedQueriesList,
  useGetList,
} from 'react-admin';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Target, User, Calendar } from 'lucide-react';

export const OpportunityFilterSidebar = () => {
  // Fetch principals for dynamic filter
  const { data: principals } = useGetList('organizations', {
    filter: { type: 'principal' },
    pagination: { page: 1, perPage: 100 },
  });

  return (
    <Card className="order-first mr-4 mt-16 w-52 h-fit shrink-0">
      <CardContent className="p-4 space-y-4">
        {/* Saved Views */}
        <SavedQueriesList />

        {/* Search */}
        <FilterLiveSearch source="q" placeholder="Search opportunities..." />

        {/* Principal Filter - Critical for Crispy CRM */}
        <FilterList label="Principal" icon={<Building2 className="h-4 w-4" />}>
          {principals?.map((principal) => (
            <FilterListItem
              key={principal.id}
              label={principal.name}
              value={{ principal_id: principal.id }}
            />
          ))}
        </FilterList>

        {/* Stage Filter */}
        <FilterList label="Stage" icon={<Target className="h-4 w-4" />}>
          <FilterListItem label="New Lead" value={{ stage: 'new_lead' }} />
          <FilterListItem label="Initial Outreach" value={{ stage: 'initial_outreach' }} />
          <FilterListItem label="Sample/Visit Offered" value={{ stage: 'sample_visit_offered' }} />
          <FilterListItem label="Feedback Logged" value={{ stage: 'feedback_logged' }} />
          <FilterListItem label="Demo Scheduled" value={{ stage: 'demo_scheduled' }} />
          <FilterListItem label="Closed Won" value={{ stage: 'closed_won' }} />
          <FilterListItem label="Closed Lost" value={{ stage: 'closed_lost' }} />
        </FilterList>

        {/* Owner Filter */}
        <FilterList label="Owner" icon={<User className="h-4 w-4" />}>
          <FilterListItem
            label="My Opportunities"
            value={{ owner_id: 'current_user' }} // Handle in data provider
          />
        </FilterList>

        {/* Activity Filter */}
        <FilterList label="Activity" icon={<Calendar className="h-4 w-4" />}>
          <FilterListItem
            label="Needs Attention"
            value={{ last_activity_days_ago_gte: 7 }}
          />
          <FilterListItem
            label="Active (7 days)"
            value={{ last_activity_days_ago_lte: 7 }}
          />
        </FilterList>
      </CardContent>
    </Card>
  );
};
```

### Cumulative Filter (Multi-select)

```tsx
// src/components/admin/CumulativeStageFilter.tsx
import { FilterList, FilterListItem } from 'react-admin';
import { Target } from 'lucide-react';

const STAGES = [
  { id: 'new_lead', name: 'New Lead' },
  { id: 'initial_outreach', name: 'Initial Outreach' },
  { id: 'sample_visit_offered', name: 'Sample/Visit Offered' },
  { id: 'feedback_logged', name: 'Feedback Logged' },
  { id: 'demo_scheduled', name: 'Demo Scheduled' },
];

export const CumulativeStageFilter = () => {
  const isSelected = (
    value: { stage: string },
    filters: { stages?: string[] }
  ) => {
    const stages = filters.stages || [];
    return stages.includes(value.stage);
  };

  const toggleFilter = (
    value: { stage: string },
    filters: { stages?: string[] }
  ) => {
    const stages = filters.stages || [];
    return {
      ...filters,
      stages: stages.includes(value.stage)
        ? stages.filter((v) => v !== value.stage)
        : [...stages, value.stage],
    };
  };

  return (
    <FilterList label="Stages" icon={<Target className="h-4 w-4" />}>
      {STAGES.map((stage) => (
        <FilterListItem
          key={stage.id}
          label={stage.name}
          value={{ stage: stage.id }}
          isSelected={isSelected}
          toggleFilter={toggleFilter}
        />
      ))}
    </FilterList>
  );
};
```

---

## Bulk Action Patterns

### Custom Bulk Actions

```tsx
// src/atomic-crm/opportunities/OpportunityBulkActions.tsx
import {
  BulkDeleteButton,
  BulkExportButton,
  BulkUpdateButton,
  useListContext,
  useNotify,
  useUpdateMany,
  useUnselectAll,
  Button,
} from 'react-admin';
import { CheckCircle, XCircle, Archive } from 'lucide-react';

export const OpportunityBulkActions = () => (
  <>
    <BulkUpdateButton
      label="Mark Won"
      data={{ stage: 'closed_won' }}
      icon={<CheckCircle className="h-4 w-4" />}
      mutationOptions={{
        meta: { undoable: true },
      }}
    />
    <BulkUpdateButton
      label="Mark Lost"
      data={{ stage: 'closed_lost' }}
      icon={<XCircle className="h-4 w-4" />}
    />
    <BulkExportButton />
    <BulkDeleteButton />
  </>
);

// Custom bulk action with confirmation
export const BulkArchiveButton = () => {
  const { selectedIds } = useListContext();
  const notify = useNotify();
  const unselectAll = useUnselectAll('opportunities');
  const [updateMany, { isPending }] = useUpdateMany();

  const handleClick = () => {
    updateMany(
      'opportunities',
      {
        ids: selectedIds,
        data: { deleted_at: new Date().toISOString() }
      },
      {
        onSuccess: () => {
          notify('Opportunities archived', { type: 'success', undoable: true });
          unselectAll();
        },
        onError: () => {
          notify('Error archiving opportunities', { type: 'error' });
        },
        mutationMode: 'undoable',
      }
    );
  };

  return (
    <Button
      label="Archive"
      onClick={handleClick}
      disabled={isPending}
    >
      <Archive className="h-4 w-4" />
    </Button>
  );
};
```

---

## Empty State Patterns

### Custom Empty Component

```tsx
// src/components/admin/ListEmpty.tsx
import { CreateButton, useResourceContext, useTranslate } from 'react-admin';
import { Inbox, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ListEmptyProps {
  title?: string;
  description?: string;
  showCreate?: boolean;
  icon?: React.ReactNode;
}

export const ListEmpty = ({
  title,
  description,
  showCreate = true,
  icon,
}: ListEmptyProps) => {
  const resource = useResourceContext();
  const translate = useTranslate();

  const defaultTitle = translate(`resources.${resource}.empty.title`, {
    _: `No ${resource} yet`,
  });

  const defaultDescription = translate(`resources.${resource}.empty.description`, {
    _: `Create your first ${resource} to get started.`,
  });

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-muted-foreground">
        {icon || <Inbox className="h-16 w-16" />}
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {title || defaultTitle}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {description || defaultDescription}
      </p>
      {showCreate && (
        <CreateButton
          variant="contained"
          label={`Add ${resource}`}
          icon={<Plus className="h-4 w-4" />}
        />
      )}
    </div>
  );
};

// Usage in List:
<List empty={<ListEmpty />}>
  {/* ... */}
</List>
```

### Filter Empty State

```tsx
// src/components/admin/FilterEmpty.tsx
import { useListContext } from 'react-admin';
import { SearchX, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const FilterEmpty = () => {
  const { filterValues, setFilters } = useListContext();
  const hasFilters = Object.keys(filterValues).length > 0;

  const clearFilters = () => {
    setFilters({}, []);
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-muted-foreground">
        {hasFilters ? (
          <FilterX className="h-16 w-16" />
        ) : (
          <SearchX className="h-16 w-16" />
        )}
      </div>
      <h3 className="text-lg font-semibold mb-2">
        No results found
      </h3>
      <p className="text-muted-foreground mb-6">
        {hasFilters
          ? "Try adjusting your filters or search terms."
          : "No items match your search."}
      </p>
      {hasFilters && (
        <Button variant="outline" onClick={clearFilters}>
          <FilterX className="h-4 w-4 mr-2" />
          Clear filters
        </Button>
      )}
    </div>
  );
};
```

---

## Responsive Strategies

### Hide Columns on Breakpoints

```tsx
// Using MUI sx prop for responsive visibility
<TextField
  source="created_at"
  sx={{
    display: {
      xs: 'none',     // Hidden on mobile
      sm: 'none',     // Hidden on small tablets
      md: 'table-cell' // Visible on desktop
    }
  }}
/>

// For iPad (1024px breakpoint)
<TextField
  source="secondary_info"
  sx={{
    display: {
      xs: 'none',
      lg: 'table-cell'
    }
  }}
/>
```

### Responsive List Component

```tsx
// src/atomic-crm/contacts/ContactList.tsx
import { useMediaQuery, Theme } from '@mui/material';
import { List, SimpleList, Datagrid } from 'react-admin';

export const ContactList = () => {
  const isSmall = useMediaQuery<Theme>((theme) =>
    theme.breakpoints.down('md')
  );

  return (
    <List>
      {isSmall ? (
        // Card-style list for mobile/tablet
        <SimpleList
          primaryText={(record) => record.name}
          secondaryText={(record) => record.organization?.name}
          tertiaryText={(record) => record.email}
          linkType="show"
        />
      ) : (
        // Full datagrid for desktop
        <Datagrid rowClick="show">
          <TextField source="name" />
          <TextField source="organization.name" />
          <EmailField source="email" />
          <TextField source="phone" />
          <DateField source="last_activity_at" />
        </Datagrid>
      )}
    </List>
  );
};
```

### Card View for Touch Devices

```tsx
// src/components/admin/CardList.tsx
import { useListContext, RecordContextProvider } from 'react-admin';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface CardListProps<T> {
  renderCard: (record: T) => React.ReactNode;
}

export function CardList<T extends { id: string | number }>({
  renderCard
}: CardListProps<T>) {
  const { data, isPending } = useListContext<T>();

  if (isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {data?.map((record) => (
        <RecordContextProvider key={record.id} value={record}>
          {renderCard(record)}
        </RecordContextProvider>
      ))}
    </div>
  );
}

// Usage:
<CardList
  renderCard={(contact) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader>
        <h3 className="font-semibold">{contact.name}</h3>
        <p className="text-sm text-muted-foreground">{contact.role}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{contact.email}</p>
        <p className="text-sm">{contact.phone}</p>
      </CardContent>
    </Card>
  )}
/>
```

---

## Performance Optimizations

### Debounced Search

```tsx
// src/components/admin/DebouncedSearch.tsx
import { useState, useEffect, useMemo } from 'react';
import { useListContext } from 'react-admin';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import debounce from 'lodash/debounce';

export const DebouncedSearch = ({
  source = 'q',
  placeholder = 'Search...',
  debounceMs = 300,
}) => {
  const { filterValues, setFilters } = useListContext();
  const [inputValue, setInputValue] = useState(filterValues[source] || '');

  const debouncedSetFilters = useMemo(
    () =>
      debounce((value: string) => {
        setFilters(
          { ...filterValues, [source]: value || undefined },
          undefined,
          false // Don't debounce again
        );
      }, debounceMs),
    [filterValues, setFilters, source, debounceMs]
  );

  useEffect(() => {
    return () => {
      debouncedSetFilters.cancel();
    };
  }, [debouncedSetFilters]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSetFilters(value);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
};
```

### Optimized Datagrid

```tsx
// Enable React Admin's row optimization
<Datagrid optimized>
  {/* columns */}
</Datagrid>
```

---

## Complete List Example

### Opportunities List (Full Implementation)

```tsx
// src/atomic-crm/opportunities/OpportunityList.tsx
import {
  List,
  DatagridConfigurable,
  TextField,
  DateField,
  ReferenceField,
  SelectColumnsButton,
  FilterButton,
  CreateButton,
  ExportButton,
  TopToolbar,
} from 'react-admin';
import { StageBadgeField } from '@/components/admin/StageBadgeField';
import { NextTaskField } from '@/components/admin/NextTaskField';
import { TruncatedTextField } from '@/components/admin/TruncatedTextField';
import { OpportunityFilterSidebar } from './OpportunityFilterSidebar';
import { OpportunityBulkActions } from './OpportunityBulkActions';
import { ListEmpty } from '@/components/admin/ListEmpty';
import { Target } from 'lucide-react';

const OpportunityListActions = () => (
  <TopToolbar>
    <SelectColumnsButton />
    <FilterButton />
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

const opportunityRowSx = (record: any) => ({
  backgroundColor: record.is_overdue
    ? 'hsl(var(--destructive) / 0.05)'
    : undefined,
  borderLeft: record.stage === 'new_lead'
    ? '3px solid hsl(var(--primary))'
    : 'none',
});

export const OpportunityList = () => (
  <List
    actions={<OpportunityListActions />}
    aside={<OpportunityFilterSidebar />}
    sort={{ field: 'next_task_due_at', order: 'ASC' }}
    empty={
      <ListEmpty
        title="No opportunities yet"
        description="Create your first opportunity to start tracking your sales pipeline."
        icon={<Target className="h-16 w-16" />}
      />
    }
  >
    <DatagridConfigurable
      rowClick="show"
      rowSx={opportunityRowSx}
      bulkActionButtons={<OpportunityBulkActions />}
      optimized
    >
      <TruncatedTextField source="name" maxWidth={200} label="Opportunity" />
      <ReferenceField source="principal_id" reference="organizations" label="Principal">
        <TextField source="name" />
      </ReferenceField>
      <StageBadgeField source="stage" label="Stage" />
      <ReferenceField source="distributor_id" reference="organizations" label="Distributor">
        <TextField source="name" />
      </ReferenceField>
      <NextTaskField source="next_task" label="Next Task" />
      <ReferenceField source="owner_id" reference="users" label="Owner">
        <TextField source="name" />
      </ReferenceField>
      <DateField source="last_activity_at" label="Last Activity" />
    </DatagridConfigurable>
  </List>
);

export default OpportunityList;
```

---

## Sources

| Component | Documentation |
|-----------|---------------|
| Datagrid | https://marmelab.com/react-admin/Datagrid.html |
| DatagridConfigurable | https://marmelab.com/react-admin/Datagrid.html#configurable |
| SelectColumnsButton | https://marmelab.com/react-admin/SelectColumnsButton.html |
| FilterList | https://marmelab.com/react-admin/FilterList.html |
| FilterLiveSearch | https://marmelab.com/react-admin/FilterLiveSearch.html |
| SavedQueriesList | https://marmelab.com/react-admin/SavedQueriesList.html |
| BulkActionButtons | https://marmelab.com/react-admin/Datagrid.html#bulkactionbuttons |
| SimpleList | https://marmelab.com/react-admin/SimpleList.html |

---

*Implementation guide based on React Admin 5 documentation and UX research for Crispy CRM*
