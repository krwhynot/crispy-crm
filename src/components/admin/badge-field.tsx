import * as React from "react";
import type { RaRecord } from "ra-core";
import { useFieldValue, useTranslate } from "ra-core";
import { Badge } from "@/components/ui/badge";
import type { FieldProps } from "@/lib/field.type";

type BadgeProps = React.ComponentProps<typeof Badge>;

export const BadgeField = <RecordType extends RaRecord = RaRecord>({
  defaultValue,
  source,
  record,
  empty,
  variant = "outline",
  // Filter out React Admin-specific props that shouldn't be passed to DOM elements
  label: _label,
  sortable: _sortable,
  sortBy: _sortBy,
  textAlign: _textAlign,
  rowClassName: _rowClassName,
  cellClassName: _cellClassName,
  headerClassName: _headerClassName,
  resource: _resource,
  ...rest
}: BadgeFieldProps<RecordType>) => {
  const value = useFieldValue({ defaultValue, source, record });
  const translate = useTranslate();

  if (value == null) {
    return empty && typeof empty === "string" ? translate(empty, { _: empty }) : empty;
  }

  return (
    <Badge variant={variant} {...rest}>
      {typeof value !== "string" ? value.toString() : value}
    </Badge>
  );
};

export interface BadgeFieldProps<RecordType extends RaRecord = RaRecord>
  extends FieldProps<RecordType>, BadgeProps {
  variant?: "default" | "outline" | "secondary" | "destructive";
}
