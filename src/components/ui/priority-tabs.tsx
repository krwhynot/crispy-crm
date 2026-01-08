/**
 * PriorityTabsList - Responsive tab list with Priority+ overflow pattern
 *
 * Implements the Priority+ pattern where tabs that don't fit in available
 * width are moved to a "More" dropdown menu. Uses ResizeObserver to
 * dynamically calculate which tabs fit.
 *
 * Industry standard: Used by HubSpot, Atlassian, Google Material Design.
 *
 * @see https://css-tricks.com/container-adapting-tabs-with-more-button/
 */

import * as React from "react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RaRecord } from "react-admin";

/**
 * Tab configuration interface - matches ResourceSlideOver.TabConfig
 */
export interface TabConfig {
  key: string;
  label: string;
  component: React.ComponentType<unknown>;
  icon?: React.ComponentType<{ className?: string }>;
  countFromRecord?: (record: RaRecord) => number | undefined | null;
}

interface PriorityTabsListProps {
  tabs: TabConfig[];
  value: string;
  onValueChange: (value: string) => void;
  record?: RaRecord;
  className?: string;
}

/**
 * Estimate tab width based on label length and presence of icon/badge
 * More accurate than fixed widths, avoids DOM measurement complexity
 */
function estimateTabWidth(tab: TabConfig, count: number | null): number {
  const baseWidth = 32; // Padding (px-4 = 16px each side)
  const iconWidth = tab.icon ? 20 : 0; // h-4 w-4 + gap
  const badgeWidth = count && count > 0 ? 32 : 0; // Badge with number
  const charWidth = 8; // Average character width
  const labelWidth = tab.label.length * charWidth;

  return baseWidth + iconWidth + labelWidth + badgeWidth;
}

const MORE_BUTTON_WIDTH = 90; // "More (2)" button + chevron

export function PriorityTabsList({
  tabs,
  value,
  onValueChange,
  record,
  className,
}: PriorityTabsListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState<number>(0);

  // Observe container width changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width && width > 0) {
        setAvailableWidth(width);
      }
    });

    observer.observe(container);

    // Initial measurement
    setAvailableWidth(container.offsetWidth);

    return () => observer.disconnect();
  }, []);

  // Compute count badges for each tab
  const tabCounts = useMemo(() => {
    return tabs.map((tab) => {
      if (!record || !tab.countFromRecord) return null;
      const count = tab.countFromRecord(record);
      return count != null && count > 0 ? count : null;
    });
  }, [tabs, record]);

  // Calculate which tabs are visible vs overflow
  const { visibleTabs, overflowTabs } = useMemo(() => {
    if (availableWidth === 0) {
      // Before measurement, show all tabs (will re-render after)
      return { visibleTabs: tabs, overflowTabs: [] as TabConfig[] };
    }

    const visible: TabConfig[] = [];
    const overflow: TabConfig[] = [];
    let usedWidth = 0;

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const tabWidth = estimateTabWidth(tab, tabCounts[i]);

      // Reserve space for "More" button if we'll need overflow
      const remainingTabs = tabs.length - i - 1;
      const reserveMoreButton = remainingTabs > 0;
      const maxWidth = reserveMoreButton ? availableWidth - MORE_BUTTON_WIDTH : availableWidth;

      if (usedWidth + tabWidth <= maxWidth) {
        visible.push(tab);
        usedWidth += tabWidth;
      } else {
        // This and remaining tabs go to overflow
        overflow.push(...tabs.slice(i));
        break;
      }
    }

    return { visibleTabs: visible, overflowTabs: overflow };
  }, [tabs, tabCounts, availableWidth]);

  // Check if active tab is in overflow
  const activeInOverflow = overflowTabs.some((t) => t.key === value);

  // Handle overflow item click
  const handleOverflowClick = useCallback(
    (key: string) => {
      onValueChange(key);
    },
    [onValueChange]
  );

  return (
    <div ref={containerRef} className="w-full">
      <TabsList
        className={cn(
          "w-full justify-start rounded-none border-b border-border h-auto p-0 bg-transparent px-6",
          className
        )}
        aria-label="Resource tabs"
      >
        {/* Visible tabs */}
        {visibleTabs.map((tab, _index) => {
          const count = tabCounts[tabs.indexOf(tab)];
          const showBadge = count != null && count > 0;

          return (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-4 min-h-11 flex items-center gap-2"
              aria-label={showBadge ? `${tab.label} (${count})` : tab.label}
            >
              {tab.icon && <tab.icon className="h-4 w-4 shrink-0" />}
              <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
              {showBadge && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                  {count > 99 ? "99+" : count}
                </Badge>
              )}
            </TabsTrigger>
          );
        })}

        {/* Overflow dropdown */}
        {overflowTabs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "rounded-none border-b-2 py-3 px-4 min-h-11 flex items-center gap-1.5 text-sm font-medium",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeInOverflow
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              )}
              aria-label={`Show ${overflowTabs.length} more tabs`}
            >
              <span>More</span>
              <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-xs">
                {overflowTabs.length}
              </Badge>
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-[160px]">
              {overflowTabs.map((tab) => {
                const tabIndex = tabs.indexOf(tab);
                const count = tabCounts[tabIndex];
                const showBadge = count != null && count > 0;
                const isActive = tab.key === value;

                return (
                  <DropdownMenuItem
                    key={tab.key}
                    onClick={() => handleOverflowClick(tab.key)}
                    className={cn(
                      "flex items-center gap-2 min-h-11 cursor-pointer",
                      isActive && "bg-accent"
                    )}
                    aria-label={showBadge ? `${tab.label} (${count})` : tab.label}
                  >
                    {tab.icon && <tab.icon className="h-4 w-4 shrink-0" />}
                    <span className="flex-1">{tab.label}</span>
                    {showBadge && (
                      <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-xs">
                        {count > 99 ? "99+" : count}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TabsList>
    </div>
  );
}

export type { PriorityTabsListProps };
