import { useState } from "react";
import { useInput } from "ra-core";
import type { InputProps } from "ra-core";
import { useGetList } from "react-admin";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
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
      parent_organization_id: item.parent_organization_id ? String(item.parent_organization_id) : null,
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
  const [searchQuery, setSearchQuery] = useState("");

  const effectiveFilter = {
    ...filter,
    deleted_at: null,
  };

  const {
    data = [],
    isLoading,
    error,
    total = 0,
  } = useGetList<{ id: number; name: string; parent_organization_id: number | null }>(resource, {
    pagination: { page: 1, perPage: 1000 },
    filter: effectiveFilter,
  });

  const excludeIdsSet = new Set(excludeIds.filter((id): id is number => id !== undefined).map(String));

  const { rootNodes, orphanedNodes } = buildTree(data, excludeIdsSet);

  const flatNodes = flattenTree(rootNodes);

  const filteredNodes = searchQuery
    ? flatNodes.filter((node) => node.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : flatNodes;

  const filteredOrphans = searchQuery
    ? orphanedNodes.filter((node) => node.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : orphanedNodes;

  const selectedNode = flatNodes
    .concat(orphanedNodes)
    .find((node) => String(node.id) === String(field.value));

  const displayValue = field.value ? selectedNode?.name || "Unknown" : "No parent organization";

  const handleSelect = (nodeId: string) => {
    const newValue = nodeId === NONE_SENTINEL ? null : Number(nodeId);
    field.onChange(newValue);
    setOpen(false);
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

      {total >= 500 && (
        <Alert>
          <AlertTitle>Large dataset</AlertTitle>
          <AlertDescription>
            Showing {data.length} organizations. Consider using additional filters for better
            performance.
          </AlertDescription>
        </Alert>
      )}

      <Popover open={open} onOpenChange={setOpen}>
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
          <Command>
            <CommandInput
              placeholder="Search organizations..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No organizations found.</CommandEmpty>

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

              {filteredOrphans.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Orphaned (parent deleted)">
                    {filteredOrphans.map((node) => (
                      <CommandItem key={node.id} value={node.id} onSelect={handleSelect}>
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            String(field.value) === String(node.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="text-muted-foreground">{node.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
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
