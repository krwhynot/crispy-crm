import { useGetIdentity, useListContext } from "ra-core";

import { BulkActionsToolbar } from "@/components/admin/bulk-actions-toolbar";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SortButton } from "@/components/admin/sort-button";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { PremiumDatagrid } from "@/components/admin/PremiumDatagrid";
import { TextField } from "@/components/admin/text-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { DateField } from "@/components/admin/date-field";
import { FunctionField } from "react-admin";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { ContactListSkeleton } from "@/components/ui/list-skeleton";
import type { Contact } from "../types";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { FilterChipBar } from "../filters";
import { ContactEmpty } from "./ContactEmpty";
import { ContactImportButton } from "./ContactImportButton";
import { ContactExportTemplateButton } from "./ContactExportTemplateButton";
import { ContactListFilter } from "./ContactListFilter";
import { ContactSlideOver } from "./ContactSlideOver";
import { TopToolbar } from "../layout/TopToolbar";
import { Avatar } from "./Avatar";
import { ContactStatusBadge } from "./ContactBadges";
import { formatFullName, formatRoleAndDept } from "./formatters";
import { contactExporter } from "./contactExporter";
import { CONTACT_FILTER_CONFIG } from "./contactFilterConfig";

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
      <ContactSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        mode={mode}
        onClose={closeSlideOver}
        onModeToggle={toggleMode}
      />
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

  return (
    <>
      <StandardListLayout resource="contacts" filterComponent={<ContactListFilter />}>
        <FilterChipBar filterConfig={CONTACT_FILTER_CONFIG} />
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
            label="Name"
            sortBy="first_name"
            render={(record: Contact) => formatFullName(record.first_name, record.last_name)}
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

          {/* Column 5: Status - Badge-based indicator (non-sortable) - always visible */}
          <FunctionField
            label="Status"
            sortable={false}
            render={(record: Contact) => <ContactStatusBadge status={record.status} />}
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
      <BulkActionsToolbar />
    </>
  );
};

const ContactListActions = () => (
  <TopToolbar>
    <SortButton fields={["first_name", "last_name", "last_seen"]} />
    <ContactImportButton />
    <ContactExportTemplateButton />
    <ExportButton exporter={contactExporter} />
    <CreateButton />
  </TopToolbar>
);

export default ContactList;
