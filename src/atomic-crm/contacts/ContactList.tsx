import React from "react";
import { useGetIdentity } from "ra-core";
import { Link } from "react-router-dom";
import { differenceInDays, formatDistanceToNow } from "date-fns";

import { ContactBulkButtons } from "./ContactBulkActionsToolbar";
import { List } from "@/components/ra-wrappers/list";
import { CreateButton } from "@/components/ra-wrappers/create-button";
import { UnifiedListPageLayout } from "@/components/layouts/UnifiedListPageLayout";
import { ExportMenuItem } from "@/components/ra-wrappers/export-menu-item";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";
import { FunctionField } from "react-admin";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { ContactListSkeleton } from "@/components/ui/list-skeleton";
import type { Contact } from "../types";
import { ContactEmpty } from "./ContactEmpty";
import { ContactListFilter } from "./ContactListFilter";
import { ContactSlideOver } from "./ContactSlideOver";
import { Avatar } from "./Avatar";
import { ContactStatusBadge } from "./ContactBadges";
import { ContactNameHeader, ContactStatusHeader } from "./ContactDatagridHeader";
import { formatFullName } from "../utils/formatters";
import { contactExporter } from "./contactExporter";
import { CONTACT_FILTER_CONFIG } from "./contactFilterConfig";
import { PageTutorialTrigger } from "../tutorial";
import { FilterableBadge } from "@/components/ra-wrappers/FilterableBadge";
import { TagsList } from "./TagsList";

/**
 * Memoized cell components for ContactList datagrid.
 * "Directory" layout: Identity, Context, Tags, Status, Last Seen.
 */

const ContactIdentityCell = React.memo(function ContactIdentityCell({
  record,
}: {
  record: Contact;
}) {
  const emails = record?.email as Array<{ value: string; type: string }> | undefined;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar record={record} width={32} height={32} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-medium text-sm truncate">
          {formatFullName(record.first_name, record.last_name)}
        </span>
        <span className="text-xs text-muted-foreground truncate">{emails?.[0]?.value || "—"}</span>
      </div>
    </div>
  );
});

const ContactContextCell = React.memo(function ContactContextCell({ record }: { record: Contact }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-sm truncate">{record.title || "—"}</span>
      {record.organization_id && record.company_name ? (
        <Link
          to={`/organizations/${record.organization_id}`}
          className="text-xs text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {record.company_name}
        </Link>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </div>
  );
});

const ContactTagsCell = React.memo(function ContactTagsCell({ record }: { record: Contact }) {
  const tags = record?.tags as string[] | undefined;
  if (!tags?.length) return <span className="text-muted-foreground">—</span>;
  return <TagsList />;
});

function getLastSeenColor(date: Date): string {
  const days = differenceInDays(new Date(), date);
  if (days < 7) return "text-green-600 dark:text-green-400";
  if (days < 30) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

const ContactLastSeenCell = React.memo(function ContactLastSeenCell({
  record,
}: {
  record: Contact;
}) {
  if (!record.last_seen) {
    return <span className="text-muted-foreground">Never</span>;
  }
  const date = new Date(record.last_seen as string);
  const relative = formatDistanceToNow(date, { addSuffix: true });
  const absolute = date.toLocaleDateString();
  return (
    <span className={getLastSeenColor(date)} title={absolute}>
      {relative}
    </span>
  );
});

const ContactStatusCell = React.memo(function ContactStatusCell({ record }: { record: Contact }) {
  return (
    <FilterableBadge source="status" value={record.status}>
      <ContactStatusBadge status={record.status} />
    </FilterableBadge>
  );
});

/**
 * ContactList - Standard list page for Contact records
 *
 * Uses UnifiedListPageLayout for centralized empty-state branching,
 * loading states, filter cleanup, and bulk actions.
 */
export const ContactList = () => {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  if (isIdentityPending) {
    return <ContactListSkeleton />;
  }
  if (!identity) {
    return null;
  }

  return (
    <>
      <div data-tutorial="contacts-list">
        <List
          title={false}
          actions={false}
          perPage={25}
          sort={{ field: "last_seen", order: "DESC" }}
          exporter={contactExporter}
        >
          <UnifiedListPageLayout
            resource="contacts"
            filterComponent={<ContactListFilter />}
            filterConfig={CONTACT_FILTER_CONFIG}
            sortFields={["first_name", "title", "last_seen"]}
            searchPlaceholder="Search contacts..."
            enableRecentSearches
            overflowActions={<ExportMenuItem />}
            primaryAction={<CreateButton />}
            emptyState={<ContactEmpty />}
            loadingSkeleton={<ContactListSkeleton />}
            bulkActions={<ContactBulkButtons />}
          >
            <ContactDatagrid openSlideOver={openSlideOver} isSlideOverOpen={isOpen} />
          </UnifiedListPageLayout>
        </List>
      </div>
      <ContactSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        mode={mode}
        onClose={closeSlideOver}
        onModeToggle={toggleMode}
      />
      <PageTutorialTrigger chapter="contacts" position="bottom-left" />
    </>
  );
};

/**
 * ContactDatagrid - Keyboard-navigable datagrid with slide-over integration
 */
const ContactDatagrid = ({
  openSlideOver,
  isSlideOverOpen,
}: {
  openSlideOver: (id: number, mode: "view" | "edit") => void;
  isSlideOverOpen: boolean;
}) => {
  const { focusedIndex } = useListKeyboardNavigation({
    onSelect: (id) => openSlideOver(Number(id), "view"),
    enabled: !isSlideOverOpen,
  });

  return (
    <PremiumDatagrid
      onRowClick={(id) => openSlideOver(Number(id), "view")}
      focusedIndex={focusedIndex}
    >
      {/* Col 1: Identity -- Avatar + Name + Email */}
      <FunctionField
        label={<ContactNameHeader />}
        sortBy="first_name"
        cellClassName="max-w-[240px]"
        render={(record: Contact) => <ContactIdentityCell record={record} />}
      />

      {/* Col 2: Context -- Title + Organization */}
      <FunctionField
        label="Role"
        sortBy="title"
        cellClassName="max-w-[160px]"
        render={(record: Contact) => <ContactContextCell record={record} />}
      />

      {/* Col 3: Tags -- Colored chips (hidden on mobile) */}
      <FunctionField
        label="Tags"
        sortable={false}
        render={(record: Contact) => <ContactTagsCell record={record} />}
        cellClassName="hidden md:table-cell max-w-[200px]"
        headerClassName="hidden md:table-cell"
      />

      {/* Col 4: Status -- Badge (filterable) */}
      <FunctionField
        label={<ContactStatusHeader />}
        sortable={false}
        render={(record: Contact) => <ContactStatusCell record={record} />}
      />

      {/* Col 5: Last Seen -- Relative date with color */}
      <FunctionField
        label="Last Seen"
        sortBy="last_seen"
        render={(record: Contact) => <ContactLastSeenCell record={record} />}
      />
    </PremiumDatagrid>
  );
};

export default ContactList;
