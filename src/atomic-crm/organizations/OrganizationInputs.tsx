import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { OrganizationGeneralTab } from "./OrganizationGeneralTab";
import { OrganizationDetailsTab } from "./OrganizationDetailsTab";
import { OrganizationOtherTab } from "./OrganizationOtherTab";

type TabKey = 'general' | 'details' | 'other';

export const OrganizationInputs = () => {
  const tabs = [
    {
      key: 'general' as TabKey,
      label: 'General',
      fields: ['name', 'logo', 'organization_type', 'parent_id', 'description', 'sales_id'],
      content: <OrganizationGeneralTab />,
    },
    {
      key: 'details' as TabKey,
      label: 'Details',
      fields: ['segment_id', 'priority', 'address', 'city', 'postal_code', 'state', 'phone'],
      content: <OrganizationDetailsTab />,
    },
    {
      key: 'other' as TabKey,
      label: 'Other',
      fields: ['website', 'linkedin_url', 'context_links'],
      content: <OrganizationOtherTab />,
    },
  ];

  return (
    <TabbedFormInputs tabs={tabs} defaultTab="general" />
  );
};
