import { useWatch } from "react-hook-form";
import { useGetList } from "react-admin";
import { ReferenceArrayInput } from "@/components/ra-wrappers/reference-array-input";
import { AutocompleteArrayInput } from "@/components/ra-wrappers/autocomplete-array-input";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { DEFAULT_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";

/**
 * Multi-distributor selection with per-distributor DOT# inputs.
 *
 * User workflow:
 * 1. Select multiple distributors via AutocompleteArrayInput
 * 2. For each selected distributor, a DOT# input appears below
 *
 * Data flow:
 * - Input: User selects distributors and enters vendor_item_number (DOT#)
 * - Output: Form submits product_distributors array with { distributor_id, vendor_item_number, status, valid_from }
 */
export function ProductDistributorInput() {
  const selectedIds = useWatch({ name: "distributor_ids" }) || [];

  const { data: distributors } = useGetList(
    "organizations",
    {
      filter: { id: selectedIds, organization_type: "distributor" },
      pagination: { page: 1, perPage: DEFAULT_PAGE_SIZE },
    },
    { enabled: selectedIds.length > 0 }
  );

  return (
    <div className="space-y-4">
      <ReferenceArrayInput
        source="distributor_ids"
        reference="organizations"
        filter={{ organization_type: "distributor" }}
      >
        <AutocompleteArrayInput
          optionText="name"
          label="Distributors"
          placeholder="Select distributors..."
          filterToQuery={(q) => ({
            "name@ilike": `%${q}%`,
            organization_type: "distributor",
          })}
        />
      </ReferenceArrayInput>

      {selectedIds.length > 0 && distributors && (
        <div className="space-y-3 pl-4 border-l-2 border-muted">
          <p className="text-sm text-muted-foreground">Enter DOT numbers for each distributor:</p>
          {distributors
            .filter((d) => selectedIds.includes(d.id))
            .map((distributor) => (
              <div key={distributor.id} className="flex items-center gap-4">
                <span className="text-sm font-medium min-w-[150px] truncate">
                  {distributor.name}
                </span>
                <TextInput
                  source={`product_distributors.${distributor.id}.vendor_item_number`}
                  label=""
                  placeholder="e.g., USF# 4587291"
                  className="flex-1"
                  helperText={false}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
