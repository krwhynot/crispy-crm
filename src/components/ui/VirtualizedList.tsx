import React from "react";
import * as ReactWindow from "react-window";
import { cn } from "@/lib/utils";

const { FixedSizeList, VariableSizeList } = ReactWindow;

// Basic props for virtualized list items
export interface VirtualizedListItemData<T = unknown> {
  items: T[];
  ItemComponent: React.ComponentType<{
    item: T;
    index: number;
    style: React.CSSProperties;
  }>;
  className?: string;
}

// Fixed height list item renderer
const FixedSizeListItem = React.memo<
  ReactWindow.ListChildComponentProps<VirtualizedListItemData>
>(({ index, style, data }) => {
  const { items, ItemComponent, className } = data;
  const item = items[index];

  if (!item) return null;

  return (
    <div style={style} className={cn("flex", className)}>
      <ItemComponent item={item} index={index} style={style} />
    </div>
  );
});

FixedSizeListItem.displayName = "FixedSizeListItem";

// Variable height list item renderer
const VariableSizeListItem = React.memo<
  ReactWindow.ListChildComponentProps<VirtualizedListItemData>
>(({ index, style, data }) => {
  const { items, ItemComponent, className } = data;
  const item = items[index];

  if (!item) return null;

  return (
    <div style={style} className={cn("flex", className)}>
      <ItemComponent item={item} index={index} style={style} />
    </div>
  );
});

VariableSizeListItem.displayName = "VariableSizeListItem";

// Props for the main VirtualizedList component
export interface VirtualizedListProps<T = unknown> {
  items: T[];
  height: number;
  itemSize: number | ((index: number) => number);
  ItemComponent: React.ComponentType<{
    item: T;
    index: number;
    style: React.CSSProperties;
  }>;
  className?: string;
  containerClassName?: string;
  overscanCount?: number;
  width?: number | string;
}

// Main VirtualizedList component
export const VirtualizedList = <T,>({
  items,
  height,
  itemSize,
  ItemComponent,
  className,
  containerClassName,
  overscanCount = 5,
  width = "100%",
}: VirtualizedListProps<T>) => {
  const itemData: VirtualizedListItemData<T> = {
    items,
    ItemComponent,
    className,
  };

  // Use FixedSizeList for consistent item heights, VariableSizeList for variable heights
  const isFixedSize = typeof itemSize === "number";

  if (isFixedSize) {
    return (
      <div className={cn("w-full", containerClassName)}>
        <FixedSizeList
          height={height}
          itemCount={items.length}
          itemSize={itemSize as number}
          itemData={itemData}
          overscanCount={overscanCount}
          width={width}
        >
          {FixedSizeListItem}
        </FixedSizeList>
      </div>
    );
  }

  return (
    <div className={cn("w-full", containerClassName)}>
      <VariableSizeList
        height={height}
        itemCount={items.length}
        itemSize={itemSize as (index: number) => number}
        itemData={itemData}
        overscanCount={overscanCount}
        width={width}
      >
        {VariableSizeListItem}
      </VariableSizeList>
    </div>
  );
};

// Hook for calculating dynamic container height based on viewport
export const useVirtualizedListHeight = (
  maxHeight?: number,
  minHeight?: number,
  offsetFromBottom = 100,
) => {
  const [height, setHeight] = React.useState(maxHeight || 400);

  React.useEffect(() => {
    const calculateHeight = () => {
      const viewportHeight = window.innerHeight;
      const availableHeight = viewportHeight - offsetFromBottom;

      let newHeight = availableHeight;

      if (maxHeight && newHeight > maxHeight) {
        newHeight = maxHeight;
      }

      if (minHeight && newHeight < minHeight) {
        newHeight = minHeight;
      }

      setHeight(newHeight);
    };

    calculateHeight();
    window.addEventListener("resize", calculateHeight);

    return () => window.removeEventListener("resize", calculateHeight);
  }, [maxHeight, minHeight, offsetFromBottom]);

  return height;
};

export default VirtualizedList;
