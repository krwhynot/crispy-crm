import { useRecordContext } from "ra-core";
import { Avatar } from "./Avatar";
import type { Contact } from "../types";
import { formatName } from "../utils/formatName";

// eslint-disable-next-line react-refresh/only-export-components
const ContactOptionRender = () => {
  const record = useRecordContext<Contact>();
  if (!record) return null;
  return (
    <div className="flex flex-row gap-4 items-center justify-start">
      <Avatar height={40} width={40} record={record} />
      <div className="flex flex-col items-start gap-1">
        <span>{formatName(record.first_name, record.last_name)}</span>
        <span className="text-xs text-muted-foreground">
          {record.title}
          {record.title && record.organization_name && " at "}
          {record.organization_name}
        </span>
      </div>
    </div>
  );
};
export const contactOptionText = <ContactOptionRender />;
