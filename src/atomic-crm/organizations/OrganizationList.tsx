import { useGetIdentity } from "ra-core";
import { TextField, ReferenceField, FunctionField } from "react-admin";
import { List } from "@/components/admin/list";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { PremiumDatagrid } from "@/components/admin/PremiumDatagrid";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { OrganizationListFilter } from "./OrganizationListFilter";
import { OrganizationSlideOver } from "./OrganizationSlideOver";
import { OrganizationTypeBadge, PriorityBadge } from "./OrganizationBadges";

export const OrganizationList = () => {
  const { identity } = useGetIdentity();
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  if (!identity) return null;

  return (
    <List title={false} perPage={25} sort={{ field: "name", order: "ASC" }} actions={false}>
      <StandardListLayout resource="organizations" filterComponent={<OrganizationListFilter />}>
        <PremiumDatagrid onRowClick={(id) => openSlideOver(Number(id), "view")}>
          <TextField source="name" label="Organization Name" />

          <FunctionField
            label="Type"
            render={(record: any) => <OrganizationTypeBadge type={record.organization_type} />}
          />

          <FunctionField
            label="Priority"
            render={(record: any) => <PriorityBadge priority={record.priority} />}
          />

          <ReferenceField
            source="parent_organization_id"
            reference="organizations"
            label="Parent"
            link={false}
            emptyText="-"
          >
            <TextField source="name" />
          </ReferenceField>

          <FunctionField
            label="Contacts"
            render={(record: any) => record.nb_contacts || 0}
            textAlign="center"
          />

          <FunctionField
            label="Opportunities"
            render={(record: any) => record.nb_opportunities || 0}
            textAlign="center"
          />
        </PremiumDatagrid>
      </StandardListLayout>

      <OrganizationSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        mode={mode}
        onClose={closeSlideOver}
        onModeToggle={toggleMode}
      />
    </List>
  );
};

export default OrganizationList;
