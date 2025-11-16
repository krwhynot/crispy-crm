import { BooleanInput } from "@/components/admin/boolean-input";
import { SelectInput } from "@/components/admin/select-input";
import { useGetIdentity, useRecordContext } from "ra-core";
import type { Sale } from "../types";

export function SalesPermissionsTab() {
  const { identity } = useGetIdentity();
  const record = useRecordContext<Sale>();

  return (
    <div className="space-y-content">
      <SelectInput
        source="role"
        label="Role"
        choices={[
          { id: 'rep', name: 'Rep' },
          { id: 'manager', name: 'Manager' },
          { id: 'admin', name: 'Admin' },
        ]}
        disabled={record?.id === identity?.id}
        helperText="Rep: Edit own records. Manager: Edit all records. Admin: Full system access."
      />
      <BooleanInput
        source="disabled"
        label="Disabled"
        disabled={record?.id === identity?.id}
        helperText="Disabled users cannot log in"
      />
    </div>
  );
}
