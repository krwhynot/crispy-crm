import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useListPaginationContext, Translate, useTranslate } from "ra-core";
import { ExportButton } from "@/components/admin/export-button";

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

  // Defensive defaults to prevent undefined values causing template placeholder issues
  const safeTotal = total ?? 0;
  const safePage = page ?? 1;
  const safePerPage = perPage ?? 10;

  // Handle empty results: show "0 of 0" instead of "1-0 of 0"
  const pageStart = safeTotal === 0 ? 0 : (safePage - 1) * safePerPage + 1;
  const pageEnd = safeTotal === 0 ? 0 : (hasNextPage ? safePage * safePerPage : safeTotal);

  const boundaryCount = 1;
  const siblingCount = 1;
  const count = safeTotal ? Math.ceil(safeTotal / safePerPage) : 1;

  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };

  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);

  const siblingsStart = Math.max(
    Math.min(
      // Natural start
      page - siblingCount,
      // Lower boundary when page is high
      count - boundaryCount - siblingCount * 2 - 1
    ),
    // Greater than startPages
    boundaryCount + 2
  );

  const siblingsEnd = Math.min(
    Math.max(
      // Natural end
      page + siblingCount,
      // Upper boundary when page is low
      boundaryCount + siblingCount * 2 + 2
    ),
    // Less than endPages
    count - boundaryCount - 1
  );

  const siblingPages = range(siblingsStart, siblingsEnd);

  const pageChangeHandler = (newPage: number) => {
    return (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setPage(newPage);
    };
  };

  return (
    <div className={`flex items-center justify-between w-full ${className}`}>
      <div className="hidden md:flex items-center">
        {showExport && <ExportButton />}
      </div>

      <div className="flex items-center space-x-2 gap-4">
        <div className="hidden md:flex items-center space-x-2">
          <p className="text-sm font-medium">
            <Translate i18nKey="ra.navigation.page_rows_per_page">Rows per page</Translate>
          </p>
          <Select
            value={perPage.toString()}
            onValueChange={(value) => {
              setPerPage(Number(value));
            }}
          >
            <SelectTrigger className="h-11 w-[70px]">
              <SelectValue placeholder={perPage} />
            </SelectTrigger>
            <SelectContent side="top">
              {rowsPerPageOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          <Translate
            i18nKey="ra.navigation.page_range_info"
            options={{
              offsetBegin: pageStart,
              offsetEnd: pageEnd,
              total: safeTotal === -1 ? pageEnd : safeTotal,
            }}
          >
            {`${pageStart}-${pageEnd} of ${safeTotal === -1 ? pageEnd : safeTotal}`}
          </Translate>
        </div>
        <Pagination className="-w-full -mx-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={pageChangeHandler(page - 1)}
                className={cn(
                  "gap-1 px-2.5 sm:pr-2.5",
                  !hasPreviousPage ? "opacity-50 cursor-not-allowed" : ""
                )}
                aria-label={translate("ra.navigation.previous", {
                  _: "Previous",
                })}
              >
                <ChevronLeftIcon />
              </PaginationLink>
            </PaginationItem>
            {startPages.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  onClick={pageChangeHandler(pageNumber)}
                  isActive={pageNumber === page}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
            {siblingsStart > boundaryCount + 2 ? (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            ) : boundaryCount + 1 < count - boundaryCount ? (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={pageChangeHandler(boundaryCount + 1)}
                  isActive={boundaryCount + 1 === page}
                >
                  {boundaryCount + 1}
                </PaginationLink>
              </PaginationItem>
            ) : null}
            {siblingPages.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  onClick={pageChangeHandler(pageNumber)}
                  isActive={pageNumber === page}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
            {siblingsEnd < count - boundaryCount - 1 ? (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            ) : count - boundaryCount > boundaryCount ? (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={pageChangeHandler(count - boundaryCount)}
                  isActive={count - boundaryCount === page}
                >
                  {count - boundaryCount}
                </PaginationLink>
              </PaginationItem>
            ) : null}
            {endPages.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  onClick={pageChangeHandler(pageNumber)}
                  isActive={pageNumber === page}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={pageChangeHandler(page + 1)}
                size="default"
                className={cn(
                  "gap-1 px-2.5 sm:pr-2.5",
                  !hasNextPage ? "opacity-50 cursor-not-allowed" : ""
                )}
                aria-label={translate("ra.navigation.next", { _: "Next" })}
              >
                <ChevronRightIcon />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
