import { UnifiedTimeline } from "../timeline";

interface ActivitiesTabProps {
  organizationId: string | number;
}

export const ActivitiesTab = ({ organizationId }: ActivitiesTabProps) => {
  // Convert organizationId to number (handles both string and number)
  const numericOrganizationId =
    typeof organizationId === "string" ? parseInt(organizationId, 10) : organizationId;

  return <UnifiedTimeline organizationId={numericOrganizationId} />;
};

export default ActivitiesTab;
