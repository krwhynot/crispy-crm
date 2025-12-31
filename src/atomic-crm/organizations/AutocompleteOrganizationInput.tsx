import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { QuickCreateOrganizationRA } from "./QuickCreatePopover";

export const AutocompleteOrganizationInput = ({
  label,
  organizationType,
  helperText,
  source,
}: {
  label?: string;
  organizationType?: string;
  helperText?: string | false;
  source?: string;
}) => {
  return (
    <AutocompleteInput
      source={source}
      optionText="name"
      helperText={helperText}
      create={
        <QuickCreateOrganizationRA
          organizationType={(organizationType as "customer" | "prospect" | "principal" | "distributor") || "customer"}
        />
      }
      createItemLabel="Create %{item}"
      label={label}
      filterToQuery={(searchText) => ({ q: searchText })}
    />
  );
};
