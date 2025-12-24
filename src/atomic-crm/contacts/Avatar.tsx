import { AvatarFallback, AvatarImage, Avatar as ShadcnAvatar } from "@/components/ui/avatar";
import { useRecordContext } from "ra-core";

import type { Contact } from "../types";

export const Avatar = (props: {
  record?: Contact;
  width?: 20 | 25 | 40;
  height?: 20 | 25 | 40;
  title?: string;
}) => {
  const record = useRecordContext<Contact>(props);
  // If we come from company page, the record is defined (to pass the company as a prop),
  // but neither of those fields are and this lead to an error when creating contact.
  if (!record?.avatar && !record?.first_name && !record?.last_name) {
    return null;
  }

  const size = props.width || props.height;
  const sizeClass = props.width === 20 ? "w-5 h-5" : props.width === 25 ? "w-8 h-8" : "w-11 h-11";

  const fullName = [record.first_name, record.last_name].filter(Boolean).join(" ");
  const altText = fullName ? `${fullName} avatar` : "Contact avatar";

  return (
    <ShadcnAvatar className={sizeClass} title={props.title}>
      <AvatarImage src={record.avatar?.src ?? undefined} alt={altText} />
      <AvatarFallback className={size && size < 40 ? "text-xs" : "text-sm"}>
        {record.first_name ? Array.from(record.first_name)[0]?.toUpperCase() : null}
        {record.last_name ? Array.from(record.last_name)[0]?.toUpperCase() : null}
      </AvatarFallback>
    </ShadcnAvatar>
  );
};
