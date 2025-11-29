import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { SegmentComboboxInput } from "@/components/admin/SegmentComboboxInput";

export const OrganizationDetailsTab = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <SegmentComboboxInput source="segment_id" label="Segment" />
      <SelectInput
        source="priority"
        choices={[
          { id: "A", name: "A - High Priority" },
          { id: "B", name: "B - Medium-High Priority" },
          { id: "C", name: "C - Medium Priority" },
          { id: "D", name: "D - Low Priority" },
        ]}
        helperText={false}
        emptyText="Select priority level"
      />
      <TextInput source="phone" helperText={false} label="Phone" />
      <TextInput source="email" helperText={false} label="Email" type="email" />
      <TextInput source="address" helperText={false} label="Address" />
      <TextInput source="city" helperText={false} label="City" />
      <TextInput source="postal_code" label="Postal Code" helperText={false} />
      <TextInput source="state" label="State" helperText={false} />
    </div>
  );
};
