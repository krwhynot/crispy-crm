import { useCallback } from "react";
import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { useRecordContext, useDataProvider } from "ra-core";
import { ImageEditorField } from "@/components/ui";
import { ParentOrganizationInput } from "./ParentOrganizationInput";
import type { Company, Sale } from "../types";
import { formatName } from "../utils/formatName";

/**
 * Async validator to check for duplicate organization names
 * Case-insensitive comparison, excludes current record (for edits)
 */
const useDuplicateNameValidator = (currentId?: number | string) => {
  const dataProvider = useDataProvider();

  return useCallback(
    async (value: string) => {
      if (!value || value.trim().length === 0) {
        return undefined; // Let required validation handle empty values
      }

      try {
        // Search for organizations with the same name (case-insensitive via ilike)
        const { data } = await dataProvider.getList("organizations", {
          filter: {
            "name@ilike": value.trim(),
            "deleted_at@is": null,
          },
          pagination: { page: 1, perPage: 10 },
          sort: { field: "id", order: "ASC" },
        });

        // Filter out current record (for edit mode)
        const duplicates = data.filter(
          (org: Company) => String(org.id) !== String(currentId)
        );

        if (duplicates.length > 0) {
          return `An organization named "${duplicates[0].name}" already exists`;
        }

        return undefined;
      } catch (error) {
        console.error("Failed to check for duplicate organization:", error);
        return undefined; // Don't block on validation errors
      }
    },
    [dataProvider, currentId]
  );
};

export const OrganizationGeneralTab = () => {
  const record = useRecordContext<Company>();
  const validateDuplicateName = useDuplicateNameValidator(record?.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <div className="lg:col-span-2">
        <div className="flex gap-4 flex-1 flex-row">
          <ImageEditorField
            source="logo"
            type="avatar"
            width={60}
            height={60}
            emptyText={record?.name.charAt(0)}
            linkPosition="bottom"
          />
          <TextInput
            source="name"
            className="w-full h-fit"
            helperText="Required field"
            placeholder="Organization name"
            label="Name *"
            validate={validateDuplicateName}
          />
        </div>
      </div>
      <div className="lg:col-span-2">
        <SelectInput
          source="organization_type"
          label="Organization Type *"
          choices={[
            { id: "customer", name: "Customer" },
            { id: "prospect", name: "Prospect" },
            { id: "principal", name: "Principal" },
            { id: "distributor", name: "Distributor" },
            { id: "unknown", name: "Unknown" },
          ]}
          helperText="Required field"
          emptyText="Select organization type"
        />
      </div>
      <div className="lg:col-span-2">
        <ParentOrganizationInput />
      </div>
      <div className="lg:col-span-2">
        <TextInput source="description" multiline helperText={false} label="Description" />
      </div>
      <ReferenceInput
        source="sales_id"
        reference="sales"
        filter={{
          "disabled@neq": true,
          "user_id@not.is": null,
        }}
      >
        <SelectInput label="Account manager" helperText={false} optionText={saleOptionRenderer} />
      </ReferenceInput>
    </div>
  );
};

const saleOptionRenderer = (choice: Sale) => formatName(choice.first_name, choice.last_name);
