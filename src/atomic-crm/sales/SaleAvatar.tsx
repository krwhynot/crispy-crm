import { AvatarFallback, AvatarImage, Avatar as ShadcnAvatar } from "@/components/ui/avatar";
import { useRecordContext } from "ra-core";

import type { Sale } from "../types";
import { getInitials } from "@/atomic-crm/utils/formatters";

export const SaleAvatar = (props: { record?: Sale; size?: "sm" | "md" | "lg"; title?: string }) => {
  const record = useRecordContext<Sale>(props);

  if (!record?.first_name && !record?.last_name) {
    return null;
  }

  const sizeClass = props.size === "sm" ? "w-5 h-5" : props.size === "lg" ? "w-10 h-10" : "w-6 h-6"; // md default

  const textSizeClass =
    props.size === "sm" ? "text-[10px]" : props.size === "lg" ? "text-sm" : "text-xs";

  return (
    <ShadcnAvatar className={sizeClass} title={props.title}>
      <AvatarImage src={record.avatar?.src ?? undefined} />
      <AvatarFallback className={textSizeClass}>
        {getInitials(record.first_name, record.last_name)}
      </AvatarFallback>
    </ShadcnAvatar>
  );
};
