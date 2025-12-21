import type { ReactNode } from "react";
import * as React from "react";
import type { RaRecord, UseListOptions, UseFieldValueOptions } from "ra-core";
import { ListContextProvider, useList, useFieldValue } from "ra-core";

export const ArrayField = <RecordType extends RaRecord = RaRecord>(
  props: ArrayFieldProps<RecordType>
) => {
  const { children, resource, perPage, sort, filter } = props;
  const rawData = useFieldValue(props);

  // Defensive check: ensure data is always an array
  // This provides better debugging info if data normalization fails
  const data = React.useMemo(() => {
    if (!rawData) {
      return emptyArray;
    }
    if (!Array.isArray(rawData)) {
      console.error(
        `[ArrayField] Expected array for source "${props.source}", but received:`,
        rawData,
        "\nThis may indicate missing data normalization in the data provider."
      );
      // Attempt to recover by wrapping in array or returning empty
      return typeof rawData === "object" ? [rawData] : emptyArray;
    }
    return rawData;
  }, [rawData, props.source]);

  const listContext = useList({ data, resource, perPage, sort, filter });

  return <ListContextProvider value={listContext}>{children}</ListContextProvider>;
};
export type ArrayFieldProps<
  RecordType extends RaRecord = RaRecord,
  ErrorType = Error,
> = UseListOptions<RecordType, ErrorType> &
  UseFieldValueOptions<RecordType> & {
    children?: ReactNode;
  };

const emptyArray: RaRecord[] = [];
