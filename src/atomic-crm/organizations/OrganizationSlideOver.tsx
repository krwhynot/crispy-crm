import { BuildingIcon, Users, Target } from 'lucide-react';
import type { TabConfig } from '@/components/layouts/ResourceSlideOver';
import { ResourceSlideOver } from '@/components/layouts/ResourceSlideOver';
import { OrganizationDetailsTab } from './slideOverTabs/OrganizationDetailsTab';
import { OrganizationContactsTab } from './slideOverTabs/OrganizationContactsTab';
import { OrganizationOpportunitiesTab } from './slideOverTabs/OrganizationOpportunitiesTab';

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
