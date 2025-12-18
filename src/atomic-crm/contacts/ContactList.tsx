import { useGetIdentity, useListContext } from "ra-core";

import { List } from "@/components/admin/list";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { DataTable } from "@/components/admin/data-table";
import { ColumnsButton } from "@/components/admin/columns-button";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { DateField } from "@/components/admin/date-field";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { ContactListSkeleton } from "@/components/ui/list-skeleton";
import type { Contact } from "../types";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { ListSearchBar } from "@/components/admin/ListSearchBar";
import { ContactEmpty } from "./ContactEmpty";
import { ContactListFilter } from "./ContactListFilter";
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
import {
  CONTACT_HIDDEN_COLUMNS,
  CONTACT_COLUMNS_STORE_KEY,
} from "./contactColumns";

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

  return (
    <StandardListLayout resource="contacts" filterComponent={<ContactListFilter />}>
      <ListSearchBar
        placeholder="Search contacts..."
        filterConfig={CONTACT_FILTER_CONFIG}
      />
      <DataTable<Contact>
        storeKey={CONTACT_COLUMNS_STORE_KEY}
        defaultHiddenColumns={CONTACT_HIDDEN_COLUMNS}
        rowClick={(id) => {
          openSlideOver(Number(id), "view");
          return false; // Prevent default navigation
        }}
      >
        {/* Column 1: Avatar - Visual identifier (non-sortable) - hidden on mobile */}
        <DataTable.Col<Contact>
          source="avatar"
          label=""
          disableSort
          render={(record) => <Avatar record={record} width={40} height={40} />}
          cellClassName="hidden lg:table-cell"
          headerClassName="hidden lg:table-cell"
        />

        {/* Column 2: Name - Primary identifier (sortable by first_name) - always visible */}
        <DataTable.Col<Contact>
          source="full_name"
          label={<ContactNameHeader />}
          render={(record) => formatFullName(record.first_name, record.last_name)}
        />

        {/* Column 3: Role - Merged Title + Department (sortable by title) - hidden on tablet */}
        <DataTable.Col<Contact>
          source="title"
          label="Role"
          render={(record) => formatRoleAndDept(record.title, record.department)}
          cellClassName="hidden lg:table-cell"
          headerClassName="hidden lg:table-cell"
        />

        {/* Column 4: Organization - Relationship reference (sortable) - always visible */}
        <DataTable.Col<Contact>
          source="organization_id"
          label="Organization"
        >
          <ReferenceField
            source="organization_id"
            reference="organizations"
            link={false}
          >
            <TextField source="name" />
          </ReferenceField>
        </DataTable.Col>

        {/* Column 5: Status - Badge-based indicator (filterable) - always visible */}
        <DataTable.Col<Contact>
          source="status"
          label={<ContactStatusHeader />}
          disableSort
          render={(record) => (
            <FilterableBadge source="status" value={record.status}>
              <ContactStatusBadge status={record.status} />
            </FilterableBadge>
          )}
        />

        {/* Column 6: Notes - Activity count metric (non-sortable) - hidden on tablet */}
        <DataTable.Col<Contact>
          source="nb_notes"
          label="Notes"
          disableSort
          render={(record) => record.nb_notes ?? 0}
          cellClassName="hidden lg:table-cell text-center"
          headerClassName="hidden lg:table-cell text-center"
        />

        {/* Column 7: Last Activity - Recency metric (sortable) - hidden on mobile */}
        <DataTable.Col<Contact>
          source="last_seen"
          label="Last Activity"
          field={DateField}
          cellClassName="hidden lg:table-cell"
          headerClassName="hidden lg:table-cell"
        />
      </DataTable>
    </StandardListLayout>
  );
};

const ContactListActions = () => (
  <TopToolbar>
    <ColumnsButton storeKey={CONTACT_COLUMNS_STORE_KEY} />
  </TopToolbar>
);

export default ContactList;
