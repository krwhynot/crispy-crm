import { useState, Children, useCallback, useMemo, type ComponentProps, type ReactNode } from "react";

import * as diacritic from "diacritic";
import {
  useDataTableStoreContext,
  useStore,
  useTranslate,
  useResourceContext,
  useDataTableColumnRankContext,
  useDataTableColumnFilterContext,
  useTranslateLabel,
  DataTableColumnRankContext,
  DataTableColumnFilterContext,
  type RaRecord,
  type Identifier,
  type SortPayload,
  type HintedString,
  type ExtractRecordPaths,
} from "ra-core";
import { Columns, Search, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldToggle } from "@/components/ra-wrappers/field-toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Renders a button that lets users show / hide columns in a DataTable
 *
 * @example
 * import { ColumnsButton, DataTable } from 'shadcn-admin-kit';
 *
 * const PostListActions = () => (
 *   <div className="flex items-center gap-2">
        <ColumnsButton />
        <FilterButton />
 *   </div>
 * );
 *
 * const PostList = () => (
 *   <List actions={<PostListActions />}>
 *     <DataTable>
 *       <DataTable.Col source="title" />
 *       <DataTable.Col source="author" />
         ...
 *     </DataTable>
 *   </List>
 * );
 */
export const ColumnsButton = (props: ColumnsButtonProps) => {
  const { className, storeKey: _, children, ...rest } = props;
  const resource = useResourceContext(props);
  const storeKey = props.storeKey || `${resource}.datatable`;

  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const translate = useTranslate();

  const title = translate("ra.action.select_columns", { _: "Columns" });

  return (
    <span className={cn("inline-flex", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {isMobile ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={title} {...rest}>
                  <Columns className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{title}</TooltipContent>
            </Tooltip>
          ) : (
            <Button variant="outline" className="cursor-pointer" {...rest}>
              <Columns />
              {title}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0 min-w-[200px] w-72">
          <ColumnsSelector storeKey={storeKey}>{children}</ColumnsSelector>
        </PopoverContent>
      </Popover>
    </span>
  );
};

export interface ColumnsButtonProps extends ComponentProps<typeof Button> {
  resource?: string;
  storeKey?: string;
  children?: ReactNode;
}

/**
 * Render DataTable.Col elements in the ColumnsButton selector.
 *
 * @see ColumnsButton
 */
export const ColumnsSelector = ({ children, storeKey: storeKeyProp }: ColumnsSelectorProps) => {
  const translate = useTranslate();
  const dataTableContext = useDataTableStoreContext();
  const storeKey = storeKeyProp ?? dataTableContext?.storeKey;
  const defaultHiddenColumns = dataTableContext?.defaultHiddenColumns ?? [];
  const [columnRanks, setColumnRanks] = useStore<number[] | undefined>(`${storeKey}_columnRanks`);
  const [_hiddenColumns, setHiddenColumns] = useStore<string[]>(
    storeKey ?? "",
    defaultHiddenColumns
  );

  const [columnFilter, setColumnFilter] = useState<string>("");

  const childrenArray = Children.toArray(children);
  const paddedColumnRanks = padRanks(columnRanks ?? [], childrenArray.length);
  const shouldDisplaySearchInput = childrenArray.length > 5;

  return (
    <ul className="max-h-[50vh] p-2 overflow-auto">
      {shouldDisplaySearchInput ? (
        <li className="pb-2" tabIndex={-1}>
          <div className="relative">
            <Input
              value={columnFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setColumnFilter(e.target.value);
              }}
              placeholder={translate("ra.action.search_columns", {
                _: "Search columns",
              })}
              aria-label={translate("ra.action.search_columns", {
                _: "Search columns",
              })}
              className="pr-8"
            />
            <Search className="absolute right-2 top-2 h-4 w-4 text-muted-foreground" />
            {columnFilter && (
              <button
                onClick={() => setColumnFilter("")}
                className="absolute right-8 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </li>
      ) : null}
      {paddedColumnRanks.map((position, index) => (
        <DataTableColumnRankContext.Provider value={position} key={index}>
          <DataTableColumnFilterContext.Provider value={columnFilter} key={index}>
            {childrenArray[position]}
          </DataTableColumnFilterContext.Provider>
        </DataTableColumnRankContext.Provider>
      ))}
      <li className="text-center mt-2 px-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setColumnRanks(undefined);
            setHiddenColumns(defaultHiddenColumns);
          }}
        >
          Reset
        </Button>
      </li>
    </ul>
  );
};

interface ColumnsSelectorProps {
  children?: React.ReactNode;
  storeKey?: string;
}

export const ColumnsSelectorItem = <
  RecordType extends RaRecord<Identifier> = RaRecord<Identifier>,
>({
  source,
  label,
}: ColumnsSelectorItemProps<RecordType>) => {
  const resource = useResourceContext();
  const { storeKey, defaultHiddenColumns } = useDataTableStoreContext();
  const [hiddenColumns, setHiddenColumns] = useStore<string[]>(storeKey, defaultHiddenColumns);
  const columnRank = useDataTableColumnRankContext();
  const [columnRanks, setColumnRanks] = useStore<number[]>(`${storeKey}_columnRanks`);
  const columnFilter = useDataTableColumnFilterContext();
  const translateLabel = useTranslateLabel();
  if (!source && !label) return null;
  const fieldLabel = translateLabel({
    label: typeof label === "string" ? label : undefined,
    resource,
    source,
  }) as string;
  const isColumnHidden = hiddenColumns.includes(source!);
  const isColumnFiltered = fieldLabelMatchesFilter(fieldLabel, columnFilter);

  const handleMove = (index1: number | string, index2: number | string | null) => {
    const colRanks = !columnRanks
      ? padRanks([], Math.max(Number(index1), Number(index2 || 0)) + 1)
      : Math.max(Number(index1), Number(index2 || 0)) > columnRanks.length - 1
        ? padRanks(columnRanks, Math.max(Number(index1), Number(index2 || 0)) + 1)
        : columnRanks;
    const index1Pos = colRanks.findIndex((index) => index == Number(index1));
    const index2Pos = colRanks.findIndex((index) => index == Number(index2));
    if (index1Pos === -1 || index2Pos === -1) {
      return;
    }
    let newColumnRanks;
    if (index1Pos > index2Pos) {
      newColumnRanks = [
        ...colRanks.slice(0, index2Pos),
        colRanks[index1Pos],
        ...colRanks.slice(index2Pos, index1Pos),
        ...colRanks.slice(index1Pos + 1),
      ];
    } else {
      newColumnRanks = [
        ...colRanks.slice(0, index1Pos),
        ...colRanks.slice(index1Pos + 1, index2Pos + 1),
        colRanks[index1Pos],
        ...colRanks.slice(index2Pos + 1),
      ];
    }
    setColumnRanks(newColumnRanks);
  };

  return isColumnFiltered ? (
    <FieldToggle
      key={columnRank}
      source={source!}
      label={fieldLabel}
      index={String(columnRank)}
      selected={!isColumnHidden}
      onToggle={() =>
        isColumnHidden
          ? setHiddenColumns(hiddenColumns.filter((column) => column !== source!))
          : setHiddenColumns([...hiddenColumns, source!])
      }
      onMove={handleMove}
    />
  ) : null;
};

// this is the same interface as DataTableColumnProps
// but we copied it here to avoid circular dependencies with data-table
export interface ColumnsSelectorItemProps<
  RecordType extends RaRecord<Identifier> = RaRecord<Identifier>,
> {
  className?: string;
  cellClassName?: string;
  headerClassName?: string;
  conditionalClassName?: (record: RecordType) => string | false | undefined;
  children?: ReactNode;
  render?: (record: RecordType) => React.ReactNode;
  field?: React.ElementType;
  source?: NoInfer<HintedString<ExtractRecordPaths<RecordType>>>;
  label?: React.ReactNode;
  disableSort?: boolean;
  sortByOrder?: SortPayload["order"];
}
// Function to help with column ranking
const padRanks = (ranks: number[], length: number) =>
  ranks.concat(Array.from({ length: length - ranks.length }, (_, i) => ranks.length + i));

const fieldLabelMatchesFilter = (fieldLabel: string, columnFilter?: string) =>
  columnFilter
    ? diacritic
        .clean(fieldLabel)
        .toLowerCase()
        .includes(diacritic.clean(columnFilter).toLowerCase())
    : true;
