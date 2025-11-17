import { BuildingIcon, Network, Users, Target } from 'lucide-react';
import { ResourceSlideOver, TabConfig } from '@/components/layouts/ResourceSlideOver';
import { OrganizationDetailsTab } from './OrganizationDetailsTab';
import { OrganizationHierarchyTab } from './OrganizationHierarchyTab';
import { OrganizationContactsTab } from './OrganizationContactsTab';
import { OrganizationOpportunitiesTab } from './OrganizationOpportunitiesTab';

interface OrganizationSlideOverProps {
  recordId: number | null;
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'edit';
  onModeToggle: () => void;
}

export function OrganizationSlideOver({
  recordId,
  isOpen,
  onClose,
  mode,
  onModeToggle,
}: OrganizationSlideOverProps) {
  const tabs: TabConfig[] = [
    {
      key: 'details',
      label: 'Details',
      component: OrganizationDetailsTab,
      icon: BuildingIcon,
    },
    {
      key: 'hierarchy',
      label: 'Hierarchy',
      component: OrganizationHierarchyTab,
      icon: Network,
    },
    {
      key: 'contacts',
      label: 'Contacts',
      component: OrganizationContactsTab,
      icon: Users,
    },
    {
      key: 'opportunities',
      label: 'Opportunities',
      component: OrganizationOpportunitiesTab,
      icon: Target,
    },
  ];

  const recordRepresentation = (record: any) => {
    return record.name || `Organization #${record.id}`;
  };

  return (
    <ResourceSlideOver
      resource="organizations"
      recordId={recordId}
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      onModeToggle={onModeToggle}
      tabs={tabs}
      recordRepresentation={recordRepresentation}
    />
  );
}
