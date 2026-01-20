import { useRecordContext } from "ra-core";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { EditButton } from "@/components/ra-wrappers/edit-button";
import { DeleteButton } from "@/components/ra-wrappers/delete-button";
import { SaveButton } from "@/components/ra-wrappers/form";
import { CancelButton } from "@/components/ra-wrappers/cancel-button";
import { OrganizationAvatar } from "../organizations/OrganizationAvatar";
import type { Opportunity } from "../types";

interface OpportunityHeaderProps {
  mode?: "show" | "edit";
  ArchiveButton?: React.ComponentType<{ record: Opportunity }>;
  UnarchiveButton?: React.ComponentType<{ record: Opportunity }>;
}

export const OpportunityHeader = ({
  mode = "show",
  ArchiveButton,
  UnarchiveButton,
}: OpportunityHeaderProps) => {
  const record = useRecordContext<Opportunity>();
  if (!record) return null;

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <ReferenceField source="customer_organization_id" reference="organizations" link="show">
          <OrganizationAvatar />
        </ReferenceField>
        <h2 className="text-2xl font-semibold">{record.name}</h2>
      </div>
      <div className="flex gap-2">
        {mode === "show" ? (
          <>
            {record.deleted_at ? (
              <>
                {UnarchiveButton && <UnarchiveButton record={record} />}
                <DeleteButton />
              </>
            ) : (
              <>
                {ArchiveButton && <ArchiveButton record={record} />}
                <EditButton />
              </>
            )}
          </>
        ) : (
          <>
            {ArchiveButton && <ArchiveButton record={record} />}
            <CancelButton />
            <SaveButton />
          </>
        )}
      </div>
    </div>
  );
};
