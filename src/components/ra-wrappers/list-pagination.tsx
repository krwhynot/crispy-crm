import { useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useListContext, useListPaginationContext, useTranslate } from "ra-core";
import { ExportButton } from "@/components/ra-wrappers/export-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ListPagination = ({
  rowsPerPageOptions = [5, 10, 25, 50],
  className,
  showExport = true,
}: {
  rowsPerPageOptions?: number[];
  className?: string;
  showExport?: boolean;
}) => {
  const translate = useTranslate();
  const { hasPreviousPage, hasNextPage, page, perPage, setPerPage, total, setPage } =
    useListPaginationContext();
  const { selectedIds, isPending, data } = useListContext();
  const isInitialLoading = isPending && (!data || data.length === 0);

  const safeTotal = total ?? 0;
  const safePage = page ?? 1;
  const safePerPage = perPage ?? rowsPerPageOptions[0] ?? 10;
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePerPage));
  const clampedPage = Math.min(Math.max(safePage, 1), totalPages);

  const pageStart = safeTotal === 0 ? 0 : (clampedPage - 1) * safePerPage + 1;
  const pageEnd = safeTotal === 0 ? 0 : Math.min(clampedPage * safePerPage, safeTotal);
  const effectiveOptions = useMemo(
    () =>
      rowsPerPageOptions.includes(safePerPage)
        ? rowsPerPageOptions
        : [...rowsPerPageOptions, safePerPage].toSorted((a, b) => a - b),
    [rowsPerPageOptions, safePerPage]
  );

  const [pageInput, setPageInput] = useState(String(clampedPage));

  useEffect(() => {
    setPageInput(String(clampedPage));
  }, [clampedPage]);

  const commitPageInput = () => {
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(clampedPage));
      return;
    }

    const nextPage = Math.min(Math.max(Math.trunc(parsed), 1), totalPages);
    setPage(nextPage);
    setPageInput(String(nextPage));
  };

  return (
    <div
      className={`flex w-full items-center justify-between gap-4 ${className ?? ""} ${isInitialLoading ? "pointer-events-none opacity-50" : ""}`}
      aria-busy={isInitialLoading || undefined}
      aria-disabled={isInitialLoading || undefined}
    >
      <div className="hidden items-center md:flex">
        {showExport && !selectedIds?.length && <ExportButton />}
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
        <div className="hidden items-center gap-2.5 md:flex">
          <span className="text-sm font-medium">
            {translate("ra.navigation.page_rows_per_page", { _: "Rows per page" })}
          </span>
          <Select
            value={String(safePerPage)}
            onValueChange={(value) => {
              const next = Number(value);
              setPerPage(next);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[84px]">
              <SelectValue placeholder={safePerPage} />
            </SelectTrigger>
            <SelectContent side="top">
              {effectiveOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="min-w-[110px] text-xs text-muted-foreground">
          {`${pageStart}-${pageEnd} of ${safeTotal}`}
        </span>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 border [border-color:var(--paper-divider-soft)] text-muted-foreground hover:bg-[color:var(--paper-row-hover-bg)] hover:text-foreground"
            disabled={!hasPreviousPage}
            onClick={() => setPage(Math.max(clampedPage - 1, 1))}
            aria-label={translate("ra.navigation.previous", { _: "Previous" })}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Prev
          </Button>

          <div className="flex items-center gap-2 rounded-md border bg-[color:var(--surface-paper-inner)] px-2 py-1 [border-color:var(--paper-divider-soft)]">
            <span className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Page</span>
            <Input
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
              onBlur={commitPageInput}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitPageInput();
                }
              }}
              inputMode="numeric"
              aria-label="Page number"
              className="h-8 w-14 border-[color:var(--paper-divider-soft)] text-center text-foreground"
            />
            <span className="text-sm font-medium text-foreground">of {totalPages}</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 border [border-color:var(--paper-divider-soft)] text-muted-foreground hover:bg-[color:var(--paper-row-hover-bg)] hover:text-foreground"
            disabled={!hasNextPage}
            onClick={() => setPage(Math.min(clampedPage + 1, totalPages))}
            aria-label={translate("ra.navigation.next", { _: "Next" })}
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
