import { UnifiedTimeline } from "../timeline";

interface ActivitiesTabProps {
  contactId: string | number;
}

export const ActivitiesTab = ({ contactId }: ActivitiesTabProps) => {
  // Convert contactId to number (handles both string and number)
  const numericContactId = typeof contactId === "string" ? parseInt(contactId, 10) : contactId;

  return <UnifiedTimeline contactId={numericContactId} />;
};

export default ActivitiesTab;
