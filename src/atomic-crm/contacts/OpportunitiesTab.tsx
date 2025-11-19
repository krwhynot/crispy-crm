import { useShowContext, useGetList, useGetMany } from 'ra-core';
import type { Contact } from '../types';

export function OpportunitiesTab() {
  const { record: contact, isPending } = useShowContext<Contact>();

  // Step 1: Fetch junction records
  const { data: junctionRecords, isLoading: junctionLoading } = useGetList(
    'opportunity_contacts',
    {
      filter: { contact_id: contact?.id },
      pagination: { page: 1, perPage: 50 },
      sort: { field: 'created_at', order: 'DESC' }
    },
    { enabled: !!contact?.id }
  );

  // Step 2: Extract opportunity IDs
  const opportunityIds = junctionRecords?.map((jr: any) => jr.opportunity_id) || [];

  // Step 3: Fetch opportunity details using getMany (batch fetch by IDs)
  const { data: opportunities, isLoading: oppsLoading } = useGetMany(
    'opportunities',
    { ids: opportunityIds },
    { enabled: opportunityIds.length > 0 }
  );

  const isLoading = isPending || junctionLoading || oppsLoading;

  if (isPending || !contact) return null;

  if (isLoading) {
    return <div>Loading opportunities...</div>;
  }

  if (!junctionRecords || junctionRecords.length === 0) {
    return <div>No opportunities linked yet</div>;
  }

  // Merge junction data with opportunities
  const linkedOpportunities = junctionRecords.map((junction: any) => {
    const opp = opportunities?.find((o: any) => o.id === junction.opportunity_id);
    return opp ? { ...opp, junctionId: junction.id } : null;
  }).filter(Boolean);

  return (
    <div>
      <p>Found {linkedOpportunities.length} opportunities</p>
    </div>
  );
}
