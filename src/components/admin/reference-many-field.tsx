import type { ReactNode } from "react";
import type {
  RaRecord,
  UseReferenceManyFieldControllerParams,
  ListControllerResult,
} from "ra-core";
import { ReferenceManyFieldBase, useListContext } from "ra-core";

export const ReferenceManyField = <
  RecordType extends RaRecord = RaRecord,
  ReferenceRecordType extends RaRecord = RaRecord,
>(
  props: ReferenceManyFieldProps<RecordType, ReferenceRecordType>
) => {
  const {
    children,
    empty,
    error,
    loading,
    pagination,
    render,
    // Filter out React Admin-specific props that shouldn't be passed to child components
    label: _label,
    sortable: _sortable,
    sortBy: _sortBy,
    textAlign: _textAlign,
    rowClassName: _rowClassName,
    cellClassName: _cellClassName,
    headerClassName: _headerClassName,
    ...rest
  } = props;

  return (
    <ReferenceManyFieldBase {...rest}>
      <ReferenceManyFieldView<ReferenceRecordType>
        empty={empty}
        error={error}
        loading={loading}
        pagination={pagination}
        render={render}
      >
        {children}
      </ReferenceManyFieldView>
    </ReferenceManyFieldBase>
  );
};

export interface ReferenceManyFieldProps<
  RecordType extends RaRecord = RaRecord,
  ReferenceRecordType extends RaRecord = RaRecord,
>
  extends
    UseReferenceManyFieldControllerParams<RecordType, ReferenceRecordType>,
    ReferenceManyFieldViewProps<ReferenceRecordType> {}

const ReferenceManyFieldView = <ReferenceRecordType extends RaRecord = RaRecord>(
  props: ReferenceManyFieldViewProps<ReferenceRecordType>
) => {
  const { children, empty, error: errorElement, loading, pagination, render } = props;
  const listContext = useListContext();
  const { isPending, error, total, hasPreviousPage, hasNextPage, data, filterValues } = listContext;

  if (isPending && loading !== false) {
    return loading;
  }
  if (error && errorElement !== false) {
    return errorElement;
  }
  if (
    (total === 0 ||
      (total == null &&
        hasPreviousPage === false &&
        hasNextPage === false &&
        (data?.length ?? 0) === 0 &&
        !Object.keys(filterValues).length)) &&
    empty !== false
  ) {
    return empty;
  }

  return (
    <>
      {render && render(listContext)}
      {children}
      {pagination}
    </>
  );
};

export interface ReferenceManyFieldViewProps<ReferenceRecordType extends RaRecord = RaRecord> {
  children?: ReactNode;
  empty?: ReactNode;
  error?: ReactNode;
  loading?: ReactNode;
  pagination?: ReactNode;
  render?: (props: ListControllerResult<ReferenceRecordType>) => ReactNode;
}
