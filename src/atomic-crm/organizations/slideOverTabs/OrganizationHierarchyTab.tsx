import { useState } from 'react';
import { useUpdate, useNotify, RecordContextProvider, useNavigate } from 'ra-core';
import { Form } from 'react-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AsideSection } from '../../misc/AsideSection';
import { ParentOrganizationInput } from '../ParentOrganizationInput';
import { BranchLocationsSection } from '../BranchLocationsSection';
import { canBeParent, canHaveParent } from '@/atomic-crm/validation/organizations';
import type { OrganizationWithHierarchy } from '../../types';

interface OrganizationHierarchyTabProps {
  record: OrganizationWithHierarchy;
  mode: 'view' | 'edit';
  onModeToggle?: () => void;
}

export function OrganizationHierarchyTab({ record, mode, onModeToggle }: OrganizationHierarchyTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: Partial<OrganizationWithHierarchy>) => {
    setIsSaving(true);
    try {
      await update('organizations', {
        id: record.id,
        data,
        previousData: record,
      });
      notify('Organization hierarchy updated successfully', { type: 'success' });
      onModeToggle?.();
    } catch (error) {
      notify('Error updating organization hierarchy', { type: 'error' });
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === 'edit') {
    const hasExistingBranches = record.child_branch_count && record.child_branch_count > 0;
    const showWarning = hasExistingBranches && record.parent_organization_id;

    return (
      <RecordContextProvider value={record}>
        <Form onSubmit={handleSave} record={record}>
          <div className="space-y-6">
            <div className="space-y-4">
              <ParentOrganizationInput />

              {showWarning && (
                <Card className="bg-destructive/10 border-destructive">
                  <CardContent className="p-4">
                    <p className="text-sm text-destructive">
                      Warning: This organization has {record.child_branch_count} branch location(s).
                      Changing the parent will affect the hierarchy structure.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Hierarchy Rules:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Only distributor, customer, and principal organizations can be parents</li>
                  <li>Maximum 2-level depth (no grandchildren)</li>
                  <li>Organizations with a parent cannot be parents themselves</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={isSaving}
                className="h-11 px-4"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Form>
      </RecordContextProvider>
    );
  }

  const orgCanBeParent = canBeParent(record);
  const orgCanHaveParent = canHaveParent(record);

  return (
    <RecordContextProvider value={record}>
      <div className="space-y-6">
        {record.parent_organization_id && (
          <AsideSection title="Parent Organization">
            <Card>
              <CardContent className="p-4">
                <a
                  href={`/organizations?view=${record.parent_organization_id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `/organizations?view=${record.parent_organization_id}`;
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {record.parent_organization_name || `Organization #${record.parent_organization_id}`}
                </a>
              </CardContent>
            </Card>
          </AsideSection>
        )}

        {record.child_branch_count && record.child_branch_count > 0 && (
          <AsideSection title="Branch Locations">
            <BranchLocationsSection org={record} />
          </AsideSection>
        )}

        {!record.parent_organization_id && (!record.child_branch_count || record.child_branch_count === 0) && (
          <AsideSection title="Hierarchy Status">
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  This organization is standalone (no parent or branches).
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Can be parent:</span>
                    <Badge variant={orgCanBeParent ? 'default' : 'outline'}>
                      {orgCanBeParent ? 'Yes' : 'No'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Can have parent:</span>
                    <Badge variant={orgCanHaveParent ? 'default' : 'outline'}>
                      {orgCanHaveParent ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>

                {!orgCanBeParent && !orgCanHaveParent && (
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                    Only distributor, customer, and principal organizations can participate in hierarchies.
                  </p>
                )}
              </CardContent>
            </Card>
          </AsideSection>
        )}
      </div>
    </RecordContextProvider>
  );
}
