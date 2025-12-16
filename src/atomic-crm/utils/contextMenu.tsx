/* eslint-disable react-refresh/only-export-components */
// Component + hook pattern: ContextMenu component paired with useContextMenu hook

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  action?: () => void;
  submenu?: ContextMenuItem[];
  divider?: boolean;
  disabled?: boolean;
  shortcut?: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Adjust position to keep menu on screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      // Prevent overflow on right
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 8;
      }

      // Prevent overflow on bottom
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 8;
      }

      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);

  // Close on escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 bg-card border border-border rounded-md shadow-lg py-1 min-w-[200px]"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      role="menu"
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={index} className="border-t border-border my-1" />;
        }

        return (
          <div
            key={index}
            className={cn(
              "relative px-3 py-3 flex items-center justify-between text-sm",
              item.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-accent cursor-pointer"
            )}
            tabIndex={item.disabled ? -1 : 0}
            onClick={() => {
              if (!item.disabled && item.action) {
                item.action();
                onClose();
              }
            }}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !item.disabled && item.action) {
                e.preventDefault();
                item.action();
                onClose();
              }
            }}
            onMouseEnter={() => item.submenu && setActiveSubmenu(item.label)}
            onMouseLeave={() => setActiveSubmenu(null)}
            role="menuitem"
          >
            <div className="flex items-center gap-2">
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              <span>{item.label}</span>
            </div>

            <div className="flex items-center gap-2">
              {item.shortcut && (
                <span className="text-xs text-muted-foreground">{item.shortcut}</span>
              )}
              {item.submenu && <ChevronRight className="w-3 h-3" />}
            </div>

            {/* Submenu */}
            {item.submenu && activeSubmenu === item.label && (
              <div
                className="absolute left-full top-0 ml-1 bg-card border border-border rounded-md shadow-lg py-1 min-w-[180px]"
                role="menu"
              >
                {item.submenu.map((subItem, subIndex) => (
                  <div
                    key={subIndex}
                    className={cn(
                      "px-3 py-1.5 min-h-11 text-sm",
                      subItem.disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-accent cursor-pointer"
                    )}
                    tabIndex={subItem.disabled ? -1 : 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!subItem.disabled && subItem.action) {
                        subItem.action();
                        onClose();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (
                        (e.key === "Enter" || e.key === " ") &&
                        !subItem.disabled &&
                        subItem.action
                      ) {
                        e.preventDefault();
                        e.stopPropagation();
                        subItem.action();
                        onClose();
                      }
                    }}
                    role="menuitem"
                  >
                    {subItem.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>,
    document.body
  );
};

// Hook for easy usage
export const useContextMenu = () => {
  const [menuState, setMenuState] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  const showContextMenu = useCallback((e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuState({ x: e.clientX, y: e.clientY, items });
  }, []);

  const closeContextMenu = useCallback(() => {
    setMenuState(null);
  }, []);

  const contextMenuComponent = menuState && (
    <ContextMenu
      x={menuState.x}
      y={menuState.y}
      items={menuState.items}
      onClose={closeContextMenu}
    />
  );

  return {
    showContextMenu,
    closeContextMenu,
    contextMenuComponent,
  };
};
