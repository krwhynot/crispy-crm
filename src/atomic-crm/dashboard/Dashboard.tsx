import { useGetList } from "ra-core";
import type { Contact, ContactNote } from "../types";
import { DashboardActivityLog } from "./DashboardActivityLog";
import { OpportunitiesChart } from "./OpportunitiesChart";
import { HotContacts } from "./HotContacts";
import { TasksList } from "./TasksList";
import { MiniPipeline } from "./MiniPipeline";
import { QuickAdd } from "./QuickAdd";

export const Dashboard = () => {
  const {
    data: _dataContact,
    total: _totalContact,
    isPending: isPendingContact,
  } = useGetList<Contact>("contacts", {
    pagination: { page: 1, perPage: 1 },
  });

  const { total: _totalContactNotes, isPending: isPendingContactNotes } =
    useGetList<ContactNote>("contactNotes", {
      pagination: { page: 1, perPage: 1 },
    });

  const { total: totalOpportunities, isPending: isPendingOpportunities } =
    useGetList<Contact>("opportunities", {
      pagination: { page: 1, perPage: 1 },
    });

  const isPending =
    isPendingContact || isPendingContactNotes || isPendingOpportunities;

  if (isPending) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-1">
      {/* Left column - Action zone (2/3 width) */}
      <div className="md:col-span-2 lg:col-span-2 space-y-6">
        <TasksList />
        <DashboardActivityLog />
      </div>

      {/* Right column - Context zone (1/3 width) */}
      <div className="md:col-span-2 lg:col-span-1 space-y-6">
        <HotContacts />
        <MiniPipeline />
        {totalOpportunities ? <OpportunitiesChart /> : null}
      </div>

      {/* Full-width quick actions */}
      <div className="md:col-span-2 lg:col-span-3">
        <QuickAdd />
      </div>
    </div>
  );
};

export default Dashboard;
