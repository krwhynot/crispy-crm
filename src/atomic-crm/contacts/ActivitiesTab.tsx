import { UnifiedTimeline } from "../timeline";

interface ActivitiesTabProps {
  contactId: string | number;
  organizationId?: string | number;
}

export const ActivitiesTab = ({ contactId, organizationId }: ActivitiesTabProps) => {
  // Convert contactId to number (handles both string and number)
  const numericContactId = typeof contactId === "string" ? parseInt(contactId, 10) : contactId;
  const numericOrganizationId = organizationId
    ? typeof organizationId === "string"
      ? parseInt(organizationId, 10)
      : organizationId
    : undefined;

  return <UnifiedTimeline contactId={numericContactId} organizationId={numericOrganizationId} />;
};

export default ActivitiesTab;
