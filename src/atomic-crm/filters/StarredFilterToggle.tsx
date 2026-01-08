import { useMemo, useEffect } from "react";
import { Star } from "lucide-react";
import { useListContext } from "ra-core";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import type { FavoriteEntityType } from "@/atomic-crm/validation/favorites";

interface StarredFilterToggleProps {
  entityType: FavoriteEntityType;
  className?: string;
}

/**
 * StarredFilterToggle - Quick filter to show only favorited items
 *
 * Uses client-side filtering by setting the `id` filter to the array
 * of favorite entity IDs. Works with React Admin's existing filter system.
 *
 * States:
 * - Default: Ghost button with star outline
 * - Active: Secondary button with filled star
 * - No favorites: Disabled with tooltip
 */
export function StarredFilterToggle({ entityType, className }: StarredFilterToggleProps) {
  const { filterValues, setFilters } = useListContext();
  const { favorites, isLoading } = useFavorites();

  // Get favorite IDs for this entity type
  const favoriteIds = useMemo(() => {
    return favorites.filter((fav) => fav.entity_type === entityType).map((fav) => fav.entity_id);
  }, [favorites, entityType]);

  const hasFavorites = favoriteIds.length > 0;

  // Check if filter is currently active by comparing current filter IDs with favorite IDs
  const isActive = useMemo(() => {
    const currentIdFilter = filterValues?.id;
    if (!currentIdFilter || !Array.isArray(currentIdFilter)) return false;
    // Active if the id filter matches our favorite IDs
    return (
      currentIdFilter.length > 0 && currentIdFilter.every((id: number) => favoriteIds.includes(id))
    );
  }, [filterValues?.id, favoriteIds]);

  // Auto-clear filter if all favorites are removed while filter is active
  useEffect(() => {
    if (isActive && favoriteIds.length === 0) {
      const { id: _, ...restFilters } = filterValues || {};
      setFilters(restFilters);
    }
  }, [isActive, favoriteIds.length, filterValues, setFilters]);

  // Auto-update filter if favorites change while filter is active
  useEffect(() => {
    if (isActive && favoriteIds.length > 0) {
      const currentIdFilter = filterValues?.id;
      if (
        Array.isArray(currentIdFilter) &&
        JSON.stringify([...currentIdFilter].sort()) !== JSON.stringify([...favoriteIds].sort())
      ) {
        setFilters({ ...filterValues, id: favoriteIds });
      }
    }
  }, [isActive, favoriteIds, filterValues, setFilters]);

  const handleClick = () => {
    if (!hasFavorites) return;

    if (isActive) {
      // Deactivate: remove id filter
      const { id: _, ...restFilters } = filterValues || {};
      setFilters(restFilters);
    } else {
      // Activate: set id filter to favorite IDs
      setFilters({ ...filterValues, id: favoriteIds });
    }
  };

  const button = (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      size="sm"
      onClick={handleClick}
      disabled={!hasFavorites || isLoading}
      aria-pressed={isActive}
      className={cn(
        "h-11 w-full justify-start gap-2 px-3",
        !hasFavorites && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Star
        className={cn("h-4 w-4", isActive ? "fill-primary text-primary" : "text-muted-foreground")}
      />
      <span>Starred</span>
      {hasFavorites && (
        <span className="ml-auto text-xs text-muted-foreground">{favoriteIds.length}</span>
      )}
    </Button>
  );

  // Wrap in tooltip when disabled to explain how to use
  if (!hasFavorites && !isLoading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right">
            <p>Star items to use this filter</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
