import { ReferenceArrayField } from "@/components/admin/reference-array-field";
import { SingleFieldList } from "@/components/admin/single-field-list";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRecordContext } from "ra-core";
import { getTagColorClass } from "../tags/tag-colors";

interface ColoredBadgeProps {
  source?: string;
  label?: string;
  sortable?: boolean;
  sortBy?: string;
  textAlign?: string;
  rowClassName?: string;
  cellClassName?: string;
  headerClassName?: string;
  resource?: string;
  className?: string;
}

const ColoredBadge = (props: ColoredBadgeProps) => {
  const record = useRecordContext();
  if (!record) return null;

  // Filter out React Admin props before spreading to Badge
  const {
    source: _source,
    label: _label,
    sortable: _sortable,
    sortBy: _sortBy,
    textAlign: _textAlign,
    rowClassName: _rowClassName,
    cellClassName: _cellClassName,
    headerClassName: _headerClassName,
    resource: _resource,
    ...badgeProps
  } = props;

  return (
    <Badge
      {...badgeProps}
      variant="outline"
      className={cn("font-normal border-0", getTagColorClass(record.color), props.className)}
    >
      {record.name}
    </Badge>
  );
};

export const TagsList = () => (
  <ReferenceArrayField className="inline-block" resource="contacts" source="tags" reference="tags">
    <SingleFieldList>
      <ColoredBadge source="name" />
    </SingleFieldList>
  </ReferenceArrayField>
);
