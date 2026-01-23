import { useState, useCallback, useMemo } from "react";
import { useGetList, useCreate, useUpdate, useNotify, useGetIdentity } from "react-admin";
import { useQueryClient } from "@tanstack/react-query";
import { userFavoriteKeys } from "@/atomic-crm/queryKeys";
import type { Favorite, FavoriteEntityType } from "@/atomic-crm/validation/favorites";

const MAX_FAVORITES = 10;

export interface UseFavoritesReturn {
  favorites: Favorite[];
  isLoading: boolean;
  isFavorite: (entityType: FavoriteEntityType, entityId: number) => boolean;
  toggleFavorite: (
    entityType: FavoriteEntityType,
    entityId: number,
    displayName: string
  ) => Promise<void>;
  canAddMore: boolean;
  favoritesCount: number;
}

function createFavoriteKey(entityType: FavoriteEntityType, entityId: number): string {
  return `${entityType}:${entityId}`;
}

export function useFavorites(): UseFavoritesReturn {
  const { data: identity } = useGetIdentity();
  const notify = useNotify();
  const [create] = useCreate();
  const [update] = useUpdate();

  const [optimisticState, setOptimisticState] = useState<Map<string, boolean>>(new Map());

  const userId = identity?.user_id;

  const {
    data: favoritesData = [],
    isLoading,
    refetch,
  } = useGetList<Favorite>(
    "user_favorites",
    {
      pagination: { page: 1, perPage: MAX_FAVORITES },
      sort: { field: "created_at", order: "DESC" },
      filter: userId ? { user_id: userId, deleted_at: null } : {},
    },
    { enabled: !!userId }
  );

  const favorites = useMemo(() => favoritesData, [favoritesData]);

  const favoritesCount = favorites.length;
  const canAddMore = favoritesCount < MAX_FAVORITES;

  const isFavorite = useCallback(
    (entityType: FavoriteEntityType, entityId: number): boolean => {
      const key = createFavoriteKey(entityType, entityId);
      const optimisticValue = optimisticState.get(key);

      if (optimisticValue !== undefined) {
        return optimisticValue;
      }

      return favorites.some((fav) => fav.entity_type === entityType && fav.entity_id === entityId);
    },
    [favorites, optimisticState]
  );

  const toggleFavorite = useCallback(
    async (
      entityType: FavoriteEntityType,
      entityId: number,
      displayName: string
    ): Promise<void> => {
      if (!userId) {
        notify("You must be logged in to manage favorites", { type: "error" });
        return;
      }

      const key = createFavoriteKey(entityType, entityId);
      const currentlyFavorited = isFavorite(entityType, entityId);

      if (!currentlyFavorited && !canAddMore) {
        notify(`Maximum ${MAX_FAVORITES} favorites reached. Remove one to add another.`, {
          type: "warning",
        });
        return;
      }

      setOptimisticState((prev) => new Map(prev).set(key, !currentlyFavorited));

      try {
        if (currentlyFavorited) {
          const existingFavorite = favorites.find(
            (fav) => fav.entity_type === entityType && fav.entity_id === entityId
          );

          if (existingFavorite?.id) {
            await update(
              "user_favorites",
              {
                id: existingFavorite.id,
                data: { deleted_at: new Date().toISOString() },
                previousData: existingFavorite,
              },
              {
                onSuccess: () => {
                  setOptimisticState((prev) => {
                    const next = new Map(prev);
                    next.delete(key);
                    return next;
                  });
                  refetch();
                },
                onError: (error: unknown) => {
                  setOptimisticState((prev) => {
                    const next = new Map(prev);
                    next.delete(key);
                    return next;
                  });
                  const errorMessage =
                    error instanceof Error ? error.message : "Failed to remove favorite";
                  notify(errorMessage, { type: "error" });
                },
              }
            );
          }
        } else {
          await create(
            "user_favorites",
            {
              data: {
                user_id: userId,
                entity_type: entityType,
                entity_id: entityId,
                display_name: displayName,
              },
            },
            {
              onSuccess: () => {
                setOptimisticState((prev) => {
                  const next = new Map(prev);
                  next.delete(key);
                  return next;
                });
                refetch();
              },
              onError: (error: unknown) => {
                setOptimisticState((prev) => {
                  const next = new Map(prev);
                  next.delete(key);
                  return next;
                });
                const errorMessage =
                  error instanceof Error ? error.message : "Failed to add favorite";
                notify(errorMessage, { type: "error" });
              },
            }
          );
        }
      } catch {
        setOptimisticState((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
        notify("An unexpected error occurred", { type: "error" });
      }
    },
    [userId, isFavorite, canAddMore, favorites, create, update, notify, refetch]
  );

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    canAddMore,
    favoritesCount,
  };
}
