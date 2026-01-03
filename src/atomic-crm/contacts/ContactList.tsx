import { useGetIdentity, useListContext } from "ra-core";

import { ContactBulkActionsToolbar } from "./ContactBulkActionsToolbar";
import { List } from "@/components/admin/list";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { SortButton } from "@/components/admin/sort-button";
import { ExportButton } from "@/components/admin/export-button";
import { PremiumDatagrid } from "@/components/admin/PremiumDatagrid";
import { TextField } from "@/components/admin/text-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { DateField } from "@/components/admin/date-field";
import { FunctionField } from "react-admin";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { ContactListSkeleton } from "@/components/ui/list-skeleton";
import type { Contact } from "../types";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { ListSearchBar } from "@/components/admin/ListSearchBar";
import { ContactEmpty } from "./ContactEmpty";
import { ContactListFilter } from "./ContactListFilter";
import { ListNoResults } from "@/components/admin/ListNoResults";
import { ContactSlideOver } from "./ContactSlideOver";
import { TopToolbar } from "../layout/TopToolbar";
import { Avatar } from "./Avatar";
import { ContactStatusBadge } from "./ContactBadges";
import { ContactNameHeader, ContactStatusHeader } from "./ContactDatagridHeader";
import { formatFullName, formatRoleAndDept } from "./formatters";
import { contactExporter } from "./contactExporter";
import { CONTACT_FILTER_CONFIG } from "./contactFilterConfig";
import { PageTutorialTrigger } from "../tutorial";
import { FilterableBadge } from "@/components/admin/FilterableBadge";

export const ContactList = () => {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  // Clean up stale cached filters from localStorage
  // Generic hook validates all filters against filterRegistry.ts
  useFilterCleanup("contacts");

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
          actions={<ContactListActions />}
          perPage={25}
          sort={{ field: "last_seen", order: "DESC" }}
          exporter={contactExporter}
        >
          <ContactListLayout openSlideOver={openSlideOver} isSlideOverOpen={isOpen} />
          <FloatingCreateButton />
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

const ContactListLayout = ({
  openSlideOver,
  isSlideOverOpen,
}: {
  openSlideOver: (id: number, mode: "view" | "edit") => void;
  isSlideOverOpen: boolean;
}) => {
  const { data, isPending, filterValues } = useListContext();

  // Keyboard navigation for list rows
  // Disabled when slide-over is open to prevent conflicts
  const { focusedIndex } = useListKeyboardNavigation({
    onSelect: (id) => openSlideOver(Number(id), "view"),
    enabled: !isSlideOverOpen,
  });

  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  // Show skeleton during initial load (identity check happens in parent)
  if (isPending) {
    return (
      <StandardListLayout resource="contacts" filterComponent={<ContactListFilter />}>
        <ContactListSkeleton />
      </StandardListLayout>
    );
  }

  if (!data?.length && !hasFilters) {
    return <ContactEmpty />;
  }

  // Filtered empty state: filters are applied but no results match
  if (!data?.length && hasFilters) {
    return (
      <StandardListLayout resource="contacts" filterComponent={<ContactListFilter />}>
        <ListSearchBar placeholder="Search contacts..." filterConfig={CONTACT_FILTER_CONFIG} enableRecentSearches />
        <ListNoResults />
      </StandardListLayout>
    );
  }

  return (
    <>
      <StandardListLayout resource="contacts" filterComponent={<ContactListFilter />}>
        <ListSearchBar placeholder="Search contacts..." filterConfig={CONTACT_FILTER_CONFIG} enableRecentSearches />
        <PremiumDatagrid
          onRowClick={(id) => openSlideOver(Number(id), "view")}
          focusedIndex={focusedIndex}
        >
          {/* Column 1: Avatar - Visual identifier (non-sortable) - hidden on mobile */}
          <FunctionField
            label=""
            sortable={false}
            render={(record: Contact) => <Avatar record={record} width={40} height={40} />}
            cellClassName="hidden lg:table-cell"
            headerClassName="hidden lg:table-cell"
          />

          {/* Column 2: Name - Primary identifier (sortable by first_name) - always visible */}
          <FunctionField
            label={<ContactNameHeader />}
            sortBy="first_name"
            render={(record: Contact) => (
              <TruncatedText className="max-w-[200px]">
                {formatFullName(record.first_name, record.last_name)}
              </TruncatedText>
            )}
          />

          {/* Column 3: Role - Merged Title + Department (sortable by title) - hidden on tablet */}
          <FunctionField
            label="Role"
            sortBy="title"
            render={(record: Contact) => formatRoleAndDept(record.title, record.department)}
            cellClassName="hidden lg:table-cell"
            headerClassName="hidden lg:table-cell"
          />

          {/* Column 4: Organization - Relationship reference (sortable) - always visible */}
          <ReferenceField
            source="organization_id"
            reference="organizations"
            label="Organization"
            link={false}
            sortable
          >
            <TextField source="name" />
          </ReferenceField>

          {/* Column 5: Status - Badge-based indicator (filterable) - always visible */}
          <FunctionField
            label={<ContactStatusHeader />}
            sortable={false}
            render={(record: Contact) => (
              <FilterableBadge source="status" value={record.status}>
                <ContactStatusBadge status={record.status} />
              </FilterableBadge>
            )}
          />

          {/* Column 6: Notes - Activity count metric (non-sortable) - hidden on tablet */}
          <FunctionField
            label="Notes"
            sortable={false}
            render={(record: Contact) => record.nb_notes ?? 0}
            textAlign="center"
            cellClassName="hidden lg:table-cell"
            headerClassName="hidden lg:table-cell"
          />

          {/* Column 7: Last Activity - Recency metric (sortable) - hidden on mobile */}
          <DateField
            source="last_seen"
            label="Last Activity"
            sortable
            showTime={false}
            cellClassName="hidden lg:table-cell"
            headerClassName="hidden lg:table-cell"
          />
        </PremiumDatagrid>
      </StandardListLayout>
      <ContactBulkActionsToolbar />
    </>
  );
};

const ContactListActions = () => {
  const { selectedIds } = useListContext();
  return (
    <TopToolbar>
      <SortButton fields={["first_name", "title", "last_seen"]} dataTutorial="contact-sort-btn" />
      {!selectedIds?.length && <ExportButton dataTutorial="contact-export-btn" />}
    </TopToolbar>
  );
};

export default ContactList;
