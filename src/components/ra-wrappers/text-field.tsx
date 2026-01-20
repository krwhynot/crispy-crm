import type { HTMLAttributes } from "react";
import { useFieldValue, useTranslate } from "ra-core";
import type { FieldProps } from "@/lib/field.type";

export const TextField = <RecordType extends Record<string, any> = Record<string, any>>({
  defaultValue,
  source,
  record,
  empty,
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
}: TextFieldProps<RecordType>) => {
  const value = useFieldValue({ defaultValue, source, record });
  const translate = useTranslate();

  if (value == null) {
    if (!empty) {
      return null;
    }

    return (
      <span {...rest}>{typeof empty === "string" ? translate(empty, { _: empty }) : empty}</span>
    );
  }

  return <span {...rest}>{typeof value !== "string" ? value.toString() : value}</span>;
};

export interface TextFieldProps<RecordType extends Record<string, any> = Record<string, any>>
  extends FieldProps<RecordType>, HTMLAttributes<HTMLSpanElement> {}
