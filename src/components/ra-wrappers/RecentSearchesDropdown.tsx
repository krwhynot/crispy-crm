import { useNavigate } from "react-router-dom";
import { Building2, Users, Target, X, type LucideIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { SearchableEntityType, RecentSearchItem } from "@/atomic-crm/hooks/useRecentSearches";

const ENTITY_CONFIG: Record<
  SearchableEntityType,
  { icon: LucideIcon; label: string; route: string }
> = {
  organizations: { icon: Building2, label: "Organizations", route: "/organizations" },
  contacts: { icon: Users, label: "Contacts", route: "/contacts" },
  opportunities: { icon: Target, label: "Opportunities", route: "/opportunities" },
};

/**
 * Props for RecentSearchesContent
 * Note: onOpenChange is called when navigating or clearing to close the parent Popover
 */
export interface RecentSearchesContentProps {
  items: RecentSearchItem[];
  onClear: () => void;
  onOpenChange?: (open: boolean) => void;
}

function groupByEntityType(
  items: RecentSearchItem[]
): Partial<Record<SearchableEntityType, RecentSearchItem[]>> {
  const grouped: Partial<Record<SearchableEntityType, RecentSearchItem[]>> = {};

  for (const item of items) {
    if (!grouped[item.entityType]) {
      grouped[item.entityType] = [];
    }
    grouped[item.entityType]!.push(item);
  }

  return grouped;
}

/**
 * RecentSearchesContent - Command menu content for recent searches
 *
 * This component renders just the Command content (no Popover wrapper).
 * The parent component (ListSearchBar) handles the Popover positioning.
 *
 * Items are grouped by entity type with icons:
 * - Building2 for organizations
 * - Users for contacts
 * - Target for opportunities
 */
export function RecentSearchesContent({
  items,
  onClear,
  onOpenChange,
}: RecentSearchesContentProps) {
  const navigate = useNavigate();
  const groupedItems = groupByEntityType(items);

  const handleSelect = (item: RecentSearchItem) => {
    const config = ENTITY_CONFIG[item.entityType];
    navigate(`${config.route}?view=${item.id}`);
    onOpenChange?.(false);
  };

  const handleClear = () => {
    onClear();
    onOpenChange?.(false);
  };

  return (
    <Command shouldFilter={false}>
      <CommandList>
        {items.length === 0 ? (
          <CommandEmpty>No recent searches</CommandEmpty>
        ) : (
          <>
            {(Object.entries(groupedItems) as [SearchableEntityType, RecentSearchItem[]][]).map(
              ([entityType, entityItems]) => {
                const config = ENTITY_CONFIG[entityType];
                const Icon = config.icon;

                return (
                  <CommandGroup key={entityType} heading={config.label}>
                    {entityItems.map((item) => (
                      <CommandItem
                        key={`${item.entityType}-${item.id}`}
                        value={`${item.entityType}-${item.id}`}
                        onSelect={() => handleSelect(item)}
                        className="min-h-11"
                      >
                        <Icon className="size-4 text-muted-foreground" />
                        <span className="truncate">{item.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              }
            )}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={handleClear}
                className="min-h-11 justify-center text-muted-foreground"
              >
                <X className="size-4" />
                <span>Clear recent searches</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );
}
