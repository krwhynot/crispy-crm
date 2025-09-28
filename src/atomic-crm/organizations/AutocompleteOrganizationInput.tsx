import { useCreate, useGetIdentity, useNotify } from "ra-core";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";

export const AutocompleteOrganizationInput = () => {
  const [create] = useCreate();
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const handleCreateOrganization = async (name?: string) => {
    if (!name) return;
    try {
      const newOrganization = await create(
        "organizations",
        {
          data: {
            name,
            sales_id: identity?.id,
            created_at: new Date().toISOString(),
          },
        },
        { returnPromise: true },
      );
      return newOrganization;
    } catch {
      notify("An error occurred while creating the organization", {
        type: "error",
      });
    }
  };

  return (
    <AutocompleteInput
      optionText="name"
      helperText={false}
      onCreate={handleCreateOrganization}
      createItemLabel="Create %{item}"
    />
  );
};
