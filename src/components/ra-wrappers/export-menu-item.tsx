import { useCallback } from "react";
import { Download } from "lucide-react";
import type { Exporter } from "ra-core";
import { fetchRelatedRecords, useDataProvider, useNotify, useListContext } from "ra-core";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { logger } from "@/lib/logger";

interface ExportMenuItemProps {
  maxResults?: number;
  exporter?: Exporter;
  meta?: Record<string, unknown>;
}

export function ExportMenuItem({
  maxResults = 1000,
  exporter: customExporter,
  meta,
}: ExportMenuItemProps) {
  const {
    filter,
    filterValues,
    resource,
    sort,
    exporter: exporterFromContext,
    total,
  } = useListContext();
  const exporter = customExporter || exporterFromContext;
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const handleExport = useCallback(() => {
    dataProvider
      .getList(resource, {
        sort,
        filter: filter ? { ...filterValues, ...filter } : filterValues,
        pagination: { page: 1, perPage: maxResults },
        meta,
      })
      .then(
        ({ data }) =>
          exporter && exporter(data, fetchRelatedRecords(dataProvider), dataProvider, resource)
      )
      .catch((error: unknown) => {
        logger.error("Export failed", error, { feature: "ExportMenuItem", resource });
        notify("HTTP Error", { type: "error" });
      });
  }, [dataProvider, exporter, filter, filterValues, maxResults, notify, resource, sort, meta]);

  return (
    <DropdownMenuItem onSelect={handleExport} disabled={total === 0}>
      <Download className="size-4" />
      Export CSV
    </DropdownMenuItem>
  );
}
