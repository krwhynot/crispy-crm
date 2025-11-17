import { useGetIdentity } from 'ra-core';
import { TextField, ReferenceField, FunctionField } from 'react-admin';
import { List } from '@/components/admin/list';
import { StandardListLayout } from '@/components/layouts/StandardListLayout';
import { PremiumDatagrid } from '@/components/admin/PremiumDatagrid';
import { useSlideOverState } from '@/hooks/useSlideOverState';
import { OrganizationListFilter } from './OrganizationListFilter';
import { OrganizationSlideOver } from './OrganizationSlideOver';
import { Badge } from '@/components/ui/badge';

export const OrganizationList = () => {
  const { identity } = useGetIdentity();
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } = useSlideOverState();

  if (!identity) return null;

  return (
    <List
      title={false}
      perPage={25}
      sort={{ field: 'name', order: 'ASC' }}
      actions={false}
    >
      <StandardListLayout
        resource="organizations"
        filterComponent={<OrganizationListFilter />}
      >
        <PremiumDatagrid onRowClick={(id) => openSlideOver(Number(id), 'view')}>
          <TextField source="name" label="Organization Name" />

          <FunctionField
            label="Type"
            render={(record: any) => <OrganizationTypeBadge type={record.organization_type} />}
          />

          <FunctionField
            label="Priority"
            render={(record: any) => <PriorityBadge priority={record.priority} />}
          />

          <ReferenceField
            source="parent_organization_id"
            reference="organizations"
            label="Parent"
            link={false}
            emptyText="-"
          >
            <TextField source="name" />
          </ReferenceField>

          <FunctionField
            label="Contacts"
            render={(record: any) => record.nb_contacts || 0}
            textAlign="center"
          />

          <FunctionField
            label="Opportunities"
            render={(record: any) => record.nb_opportunities || 0}
            textAlign="center"
          />
        </PremiumDatagrid>
      </StandardListLayout>

      <OrganizationSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        mode={mode}
        onClose={closeSlideOver}
        onModeToggle={toggleMode}
      />
    </List>
  );
};

function OrganizationTypeBadge({ type }: { type: string }) {
  const colorClass = {
    customer: 'tag-warm',
    prospect: 'tag-sage',
    principal: 'tag-purple',
    distributor: 'tag-teal',
    unknown: 'tag-gray',
  }[type] || 'tag-gray';

  return (
    <Badge className={`text-xs px-2 py-1 ${colorClass}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';

  switch (priority) {
    case 'A':
      variant = 'destructive';
      break;
    case 'B':
      variant = 'default';
      break;
    case 'C':
      variant = 'secondary';
      break;
    case 'D':
      variant = 'outline';
      break;
  }

  const label = {
    A: 'A - High',
    B: 'B - Medium-High',
    C: 'C - Medium',
    D: 'D - Low',
  }[priority] || priority;

  return (
    <Badge variant={variant} className="text-xs px-2 py-1">
      {label}
    </Badge>
  );
}

export default OrganizationList;
