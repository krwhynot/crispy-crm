import { useState } from 'react';
import { Form, useUpdate, useNotify, ReferenceInput, useGetOne } from 'react-admin';
import { Link } from 'react-router-dom';
import { AutocompleteInput } from '@/components/admin/autocomplete-input';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

interface OpportunityOrganizationsTabProps {
  record: any;
  mode: 'view' | 'edit';
  onModeToggle?: () => void;
}

export function OpportunityOrganizationsTab({
  record,
  mode,
  onModeToggle,
}: OpportunityOrganizationsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      await update(
        'opportunities',
        {
          id: record.id,
          data: {
            customer_organization_id: data.customer_organization_id,
            principal_organization_id: data.principal_organization_id,
            distributor_organization_id: data.distributor_organization_id || null,
          },
          previousData: record,
        },
        {
          onSuccess: () => {
            notify('Organizations updated successfully', { type: 'success' });
            if (onModeToggle) {
              onModeToggle();
            }
          },
          onError: (error: any) => {
            notify(error?.message || 'Failed to update organizations', { type: 'error' });
          },
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onModeToggle) {
      onModeToggle();
    }
  };

  if (mode === 'edit') {
    return (
      <Form
        defaultValues={{
          customer_organization_id: record.customer_organization_id,
          principal_organization_id: record.principal_organization_id,
          distributor_organization_id: record.distributor_organization_id,
        }}
        onSubmit={handleSave}
        className="space-y-4"
      >
        <ReferenceInput source="customer_organization_id" reference="organizations">
          <AutocompleteInput
            label="Customer Organization *"
            optionText="name"
            filterToQuery={(searchText: string) => ({ q: searchText })}
            helperText="The customer organization for this opportunity"
            fullWidth
          />
        </ReferenceInput>

        <ReferenceInput source="principal_organization_id" reference="organizations">
          <AutocompleteInput
            label="Principal Organization *"
            optionText="name"
            filterToQuery={(searchText: string) => ({ q: searchText })}
            helperText="The principal/manufacturer organization"
            fullWidth
          />
        </ReferenceInput>

        <ReferenceInput source="distributor_organization_id" reference="organizations">
          <AutocompleteInput
            label="Distributor Organization"
            optionText="name"
            filterToQuery={(searchText: string) => ({ q: searchText })}
            helperText="Optional distributor organization"
            fullWidth
          />
        </ReferenceInput>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isSaving} className="flex-1">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      </Form>
    );
  }

  // View mode
  const OrganizationCard = ({
    organizationId,
    label,
    required = false,
  }: {
    organizationId: number | null;
    label: string;
    required?: boolean;
  }) => {
    const { data: org, isLoading } = useGetOne(
      'organizations',
      { id: organizationId! },
      { enabled: !!organizationId }
    );

    if (!organizationId && !required) {
      return null;
    }

    if (isLoading) {
      return (
        <div className="border border-border rounded-lg p-4">
          <label className="text-sm font-medium text-muted-foreground block mb-2">
            {label}
          </label>
          <div className="h-6 bg-muted animate-pulse rounded" />
        </div>
      );
    }

    if (!org) {
      return (
        <div className="border border-border rounded-lg p-4">
          <label className="text-sm font-medium text-muted-foreground block mb-2">
            {label}
          </label>
          <p className="text-muted-foreground">Not set</p>
        </div>
      );
    }

    return (
      <div className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
        <label className="text-sm font-medium text-muted-foreground block mb-2">
          {label}
        </label>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/organizations?view=${org.id}`}
              className="text-base font-medium hover:underline block truncate"
            >
              {org.name}
            </Link>
            {org.type && (
              <p className="text-sm text-muted-foreground capitalize">
                {org.type.replace(/_/g, ' ')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <OrganizationCard
        organizationId={record.customer_organization_id}
        label="Customer Organization"
        required
      />
      <OrganizationCard
        organizationId={record.principal_organization_id}
        label="Principal Organization"
        required
      />
      <OrganizationCard
        organizationId={record.distributor_organization_id}
        label="Distributor Organization"
      />
    </div>
  );
}
