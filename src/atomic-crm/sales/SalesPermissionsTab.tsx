import { BooleanInput } from "@/components/admin/boolean-input";
import { useRecordContext } from "ra-core";
import { useGetIdentity } from "ra-core";
import type { Sale } from "../types";

export const SalesPermissionsTab = () => {
  const { identity } = useGetIdentity();
  const record = useRecordContext<Sale>();

  return (
    <div className="space-y-4">
      <BooleanInput
        source="administrator"
        readOnly={record?.id === identity?.id}
        helperText={false}
      />
      <BooleanInput
        source="disabled"
        readOnly={record?.id === identity?.id}
        helperText={false}
      />
    </div>
  );
};
