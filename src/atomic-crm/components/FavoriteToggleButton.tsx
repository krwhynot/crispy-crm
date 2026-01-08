import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useFavorites } from "@/hooks/useFavorites";
import type { FavoriteEntityType } from "@/atomic-crm/validation/favorites";
import { cn } from "@/lib/utils";

interface FavoriteToggleButtonProps {
  entityType: FavoriteEntityType;
  entityId: number;
  displayName: string;
}

export function FavoriteToggleButton({
  entityType,
  entityId,
  displayName,
}: FavoriteToggleButtonProps) {
  const { isFavorite, toggleFavorite, canAddMore, isLoading } = useFavorites();

  const favorited = isFavorite(entityType, entityId);
  const disabled = isLoading || (!canAddMore && !favorited);

  const getTooltipMessage = (): string => {
    if (favorited) {
      return "Remove from favorites";
    }
    if (!canAddMore) {
      return "Favorites limit reached (10 max)";
    }
    return "Add to favorites";
  };

  const handleClick = () => {
    toggleFavorite(entityType, entityId, displayName);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          disabled={disabled}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={favorited}
          className="h-11 w-11"
        >
          <Star
            className={cn(
              "size-5 transition-colors",
              favorited ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{getTooltipMessage()}</p>
      </TooltipContent>
    </Tooltip>
  );
}
