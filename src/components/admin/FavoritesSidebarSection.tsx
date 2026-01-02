import { Star, Contact, Building2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar.utils";
import { useFavorites } from "@/hooks/useFavorites";
import type { FavoriteEntityType } from "@/atomic-crm/validation/favorites";
import { Skeleton } from "@/components/ui/skeleton";

const ENTITY_ICONS: Record<FavoriteEntityType, typeof Contact> = {
  contacts: Contact,
  organizations: Building2,
};

export function FavoritesSidebarSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openMobile, setOpenMobile } = useSidebar();
  const { favorites, isLoading } = useFavorites();

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          Favorites
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {[1, 2, 3].map((i) => (
              <SidebarMenuItem key={i}>
                <Skeleton className="h-11 w-full" />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (!favorites || favorites.length === 0) {
    return null;
  }

  const handleClick = (entityType: FavoriteEntityType, entityId: number) => {
    navigate(`/${entityType}?view=${entityId}`);
    if (openMobile) {
      setOpenMobile(false);
    }
  };

  const isActive = (entityType: FavoriteEntityType, entityId: number): boolean => {
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get("view");
    return location.pathname === `/${entityType}` && viewParam === String(entityId);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2">
        <Star className="h-4 w-4" />
        Favorites
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {favorites.map((favorite) => {
            const Icon = ENTITY_ICONS[favorite.entity_type];
            const active = isActive(favorite.entity_type, favorite.entity_id);

            return (
              <SidebarMenuItem key={`${favorite.entity_type}-${favorite.entity_id}`}>
                <SidebarMenuButton
                  isActive={active}
                  onClick={() => handleClick(favorite.entity_type, favorite.entity_id)}
                  tooltip={favorite.display_name}
                >
                  <Icon />
                  <span className="truncate">{favorite.display_name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
