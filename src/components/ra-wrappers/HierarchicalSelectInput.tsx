import { useState, useMemo, useEffect } from "react";
import { useInput } from "ra-core";
import type { InputProps } from "ra-core";
import { useGetList, useGetOne } from "react-admin";
import { Check, ChevronsUpDown } from "lucide-react";

import {
  AUTOCOMPLETE_MIN_CHARS,
  SEARCH_DEBOUNCE_MS,
  DEFAULT_STALE_TIME_MS,
} from "@/atomic-crm/constants";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TreeNode {
  id: string;
  name: string;
  parent_organization_id: string | null;
  children: TreeNode[];
  level: number;
  isOrphaned: boolean;
}

interface HierarchicalSelectInputProps extends Omit<InputProps, "source"> {
  source: string;
  label?: string;
  helperText?: string;
  resource: string;
  filter?: Record<string, unknown>;
  excludeIds?: (number | undefined)[];
}

const NONE_SENTINEL = "__none__";

function buildTree(
  data: Array<{ id: number; name: string; parent_organization_id: number | null }>,
  excludeIdsSet: Set<string>
): { rootNodes: TreeNode[]; orphanedNodes: TreeNode[] } {
  const nodeMap = new Map<string, TreeNode>();
  const allNodes: TreeNode[] = [];

  data.forEach((item) => {
    const id = String(item.id);
    if (excludeIdsSet.has(id)) return;

    const node: TreeNode = {
      id,
      name: item.name,
      parent_organization_id: item.parent_organization_id
        ? String(item.parent_organization_id)
        : null,
      children: [],
      level: 0,
      isOrphaned: false,
    };
    nodeMap.set(id, node);
    allNodes.push(node);
  });

  const rootNodes: TreeNode[] = [];

  allNodes.forEach((node) => {
    if (node.parent_organization_id === null) {
      rootNodes.push(node);
    } else {
      const parent = nodeMap.get(node.parent_organization_id);
      if (parent) {
        parent.children.push(node);
      } else {
        node.isOrphaned = true;
      }
    }
  });

  function assignLevels(node: TreeNode, level: number) {
    node.level = level;
    node.children.forEach((child) => assignLevels(child, level + 1));
  }

  rootNodes.forEach((root) => assignLevels(root, 0));

  const orphanedNodes = allNodes.filter((node) => node.isOrphaned);

  return { rootNodes, orphanedNodes };
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  function traverse(node: TreeNode) {
    result.push(node);
    node.children.forEach(traverse);
  }
  nodes.forEach(traverse);
  return result;
}

export function HierarchicalSelectInput({
  source,
  label = "Parent Organization",
  helperText,
  resource,
  filter = {},
  excludeIds = [],
}: HierarchicalSelectInputProps) {
  const { field, fieldState } = useInput({ source });
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input — trim to avoid whitespace-only searches
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const isSearching = debouncedSearch.length >= AUTOCOMPLETE_MIN_CHARS;

  const effectiveFilter = {
    ...filter,
    deleted_at: null,
    ...(isSearching && { q: debouncedSearch }),
  };

  interface OrgRecord {
    id: number;
    name: string;
    parent_organization_id: number | null;
  }

  const {
    data = [],
    isLoading,
    isFetching,
    error,
  } = useGetList<OrgRecord>(
    resource,
    {
      pagination: { page: 1, perPage: isSearching ? 50 : 10 },
      sort: isSearching ? { field: "name", order: "ASC" } : { field: "updated_at", order: "DESC" },
      filter: effectiveFilter,
    },
    {
      enabled: open || !!field.value,
      staleTime: DEFAULT_STALE_TIME_MS,
      placeholderData: (prev) => prev,
    }
  );

  const clearSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
  };

  const excludeIdsSet = useMemo(
    () => new Set(excludeIds.filter((id): id is number => id !== undefined).map(String)),
    [excludeIds]
  );

  // Memoize tree building - only rebuild when data or excludeIds change
  const { rootNodes, orphanedNodes } = useMemo(
    () => buildTree(data, excludeIdsSet),
    [data, excludeIdsSet]
  );

  // Memoize tree flattening - only flatten when rootNodes change
  const flatNodes = useMemo(() => flattenTree(rootNodes), [rootNodes]);

  // All nodes visible: tree nodes (indented) + orphaned nodes (parent not in current page).
  // With partial data (10 recents or 50 search results), most nodes' parents won't be
  // in the dataset. These appear as flat (level 0) items — not hidden.
  const filteredNodes = useMemo(() => [...flatNodes, ...orphanedNodes], [flatNodes, orphanedNodes]);

  // Selected value hydration: when the selected parent isn't in the current page
  // (e.g., "Zebra Corp" when sorted A-Z and only first 50 loaded), fetch it separately.
  const selectedId = field.value ? Number(field.value) : undefined;
  const isSelectedInData = selectedId != null ? data.some((item) => item.id === selectedId) : true;

  const { data: selectedRecord } = useGetOne<{
    id: number;
    name: string;
    parent_organization_id: number | null;
  }>(resource, { id: selectedId! }, { enabled: !!selectedId && !isSelectedInData });

  // Resolve display name: check tree nodes, then raw data, then useGetOne fallback
  const selectedNode = flatNodes
    .concat(orphanedNodes)
    .find((node) => String(node.id) === String(field.value));

  const selectedName =
    selectedNode?.name ??
    data.find((item) => String(item.id) === String(field.value))?.name ??
    selectedRecord?.name;

  const displayValue = field.value
    ? selectedName || `Organization #${field.value} (restricted)`
    : "No parent organization";

  const handleSelect = (nodeId: string) => {
    const newValue = nodeId === NONE_SENTINEL ? null : Number(nodeId);
    field.onChange(newValue);
    setOpen(false);
    clearSearch();
  };

  if (error) {
    return (
      <div className="space-y-2">
        {label && <span className="text-sm font-medium text-foreground">{label}</span>}
        <Alert variant="destructive">
          <AlertTitle>Error loading organizations</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to fetch organizations"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}

      <Popover
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) clearSearch();
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={!!fieldState.error}
            className={cn(
              "w-full justify-between",
              !field.value && "text-muted-foreground",
              fieldState.error && "border-destructive"
            )}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : displayValue}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search organizations..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              {/* Search status — shown inline above results */}
              {searchTerm.trim().length > 0 &&
                searchTerm.trim().length < AUTOCOMPLETE_MIN_CHARS && (
                  <div className="py-2 px-3 text-xs text-muted-foreground">
                    Type {AUTOCOMPLETE_MIN_CHARS - searchTerm.trim().length} more character(s) to
                    search
                  </div>
                )}

              {/* "Searching..." when debounce pending OR fetch in flight */}
              {isSearching && (searchTerm !== debouncedSearch || isFetching) && (
                <div className="py-2 px-3 text-xs text-muted-foreground">Searching...</div>
              )}

              {/* Empty state — only when list is truly empty after search completes */}
              {filteredNodes.length === 0 && !isFetching && isSearching && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No organizations found{debouncedSearch ? ` matching "${debouncedSearch}"` : ""}.
                </div>
              )}

              {/* Sentinel item - only show when NOT searching */}
              {!searchTerm && (
                <CommandGroup>
                  <CommandItem value={NONE_SENTINEL} onSelect={handleSelect}>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        field.value === null ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="italic text-muted-foreground">No parent organization</span>
                  </CommandItem>
                </CommandGroup>
              )}

              {/* Organizations group */}
              {filteredNodes.length > 0 && (
                <CommandGroup heading="Organizations">
                  {filteredNodes.map((node) => (
                    <CommandItem key={node.id} value={node.id} onSelect={handleSelect}>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          String(field.value) === String(node.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span style={{ paddingLeft: `${node.level * 16}px` }}>{node.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}

      {fieldState.error && (
        <p className="text-sm text-destructive" role="alert">
          {fieldState.error.message}
        </p>
      )}
    </div>
  );
}
