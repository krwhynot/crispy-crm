import { ReferenceArrayField, SingleFieldList } from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRecordContext } from "ra-core";
import { getTagColorClass } from "../tags/tag-colors";

const ColoredBadge = (props: any) => {
  const record = useRecordContext();
  if (!record) return null;
  return (
    <Badge
      {...props}
      variant="outline"
      className={cn(
        "font-normal border-0",
        getTagColorClass(record.color),
        props.className
      )}
    >
      {record.name}
    </Badge>
  );
};

export const TagsList = () => (
  <ReferenceArrayField
    className="inline-block"
    resource="contacts"
    source="tags"
    reference="tags"
  >
    <SingleFieldList>
      <ColoredBadge source="name" />
    </SingleFieldList>
  </ReferenceArrayField>
);
