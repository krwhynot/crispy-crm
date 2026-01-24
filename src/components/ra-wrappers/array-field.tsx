import type { ReactNode } from "react";
import * as React from "react";
import type { RaRecord, UseListOptions, UseFieldValueOptions } from "ra-core";
import { ListContextProvider, useList, useFieldValue } from "ra-core";
import { logger } from "@/lib/logger";

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
      logger.error(
        `Expected array for source "${props.source}", but received non-array`,
        new Error("Invalid data type"),
        {
          feature: "ArrayField",
          source: props.source,
          receivedType: typeof rawData,
        }
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
