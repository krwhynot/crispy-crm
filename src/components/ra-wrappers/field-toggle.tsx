import * as React from "react";
import { FieldTitle, useResourceContext } from "ra-core";
import { GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/**
 * UI to enable/disable a field
 */
export const FieldToggle = (props: FieldToggleProps) => {
  const { selected, label, onToggle, onMove, source, index } = props;
  const resource = useResourceContext();
  const dropIndex = React.useRef<number | null>(null);
  const x = React.useRef<number | null>(null);
  const y = React.useRef<number | null>(null);

  const handleDocumentDragOver = React.useCallback((event: DragEvent) => {
    x.current = event.clientX;
    y.current = event.clientY;
  }, []);

  const handleDragStart = () => {
    document.addEventListener("dragover", handleDocumentDragOver as EventListener);
  };

  const handleDrag = (event: React.DragEvent) => {
    // imperative DOM manipulations using the native Drag API
    const selectedItem = event.target as HTMLElement;
    selectedItem.dataset.dragActive = "true";
    // Find the scrollable container (parent div with overflow)
    const list = selectedItem.parentElement;
    if (x.current == null || y.current == null) {
      return;
    }
    const elementAtDragCoordinates = document.elementFromPoint(x.current, y.current);
    // Changed from "li" to "label" since we now use label elements
    let dropItem =
      elementAtDragCoordinates === null
        ? selectedItem
        : elementAtDragCoordinates.closest("label[data-index]");

    if (!dropItem) {
      return;
    }
    if (dropItem.classList.contains("dragIcon")) {
      const parent = dropItem.parentNode;
      if (parent instanceof HTMLElement) {
        dropItem = parent;
      }
    }
    if (dropItem === selectedItem) {
      return;
    }
    const dropItemParent = dropItem.parentNode;
    if (list && dropItemParent instanceof HTMLElement && list === dropItemParent) {
      const dataIndex = (dropItem as HTMLElement).dataset.index;
      if (dataIndex) {
        dropIndex.current = parseInt(dataIndex, 10);
      }
      if (dropItem === selectedItem.nextSibling) {
        dropItem = dropItem.nextSibling as HTMLElement;
      }
      list.insertBefore(selectedItem, dropItem);
    }
  };

  const handleDragEnd = (event: React.DragEvent) => {
    const selectedItem = event.target as HTMLElement;
    // Find the scrollable container (parent div)
    const list = selectedItem.parentElement;

    const elementFromPoint =
      x.current != null && y.current != null
        ? document.elementFromPoint(x.current, y.current)
        : null;

    // Changed from "li" to "label[data-index]"
    let dropItem =
      x.current == null || y.current == null || elementFromPoint === null
        ? selectedItem
        : elementFromPoint.closest("label[data-index]");

    if (y.current !== null && list && !dropItem) {
      if (y.current > list.getBoundingClientRect().bottom) {
        dropItem = list.lastChild as HTMLElement;
      } else {
        dropItem = list.firstChild as HTMLElement;
      }
    }

    if (dropItem && list && dropItem.parentElement === list) {
      if (onMove) {
        const dragIndex = selectedItem.dataset.index;
        const drop = dropIndex.current;
        if (dragIndex != null && drop != null) {
          onMove(dragIndex, drop);
        }
      }
    } else {
      event.preventDefault();
      event.stopPropagation();
    }
    selectedItem.dataset.dragActive = "false";
    document.removeEventListener("dragover", handleDocumentDragOver as EventListener);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  return (
    <label
      key={source}
      htmlFor={`checkbox_${index}`}
      draggable={onMove ? "true" : undefined}
      onDrag={onMove ? handleDrag : undefined}
      onDragStart={onMove ? handleDragStart : undefined}
      onDragEnd={onMove ? handleDragEnd : undefined}
      onDragOver={onMove ? handleDragOver : undefined}
      data-index={index}
      className={cn(
        "flex items-center gap-3 rounded-md px-2 py-2.5",
        "cursor-pointer",
        "min-h-[44px]", // Touch target
        "hover:bg-accent hover:text-accent-foreground",
        "transition-colors",
        "data-[drag-active=true]:bg-transparent data-[drag-active=true]:text-transparent data-[drag-active=true]:outline data-[drag-active=true]:outline-1 data-[drag-active=true]:outline-border"
      )}
    >
      <Checkbox
        id={`checkbox_${index}`}
        checked={selected}
        onCheckedChange={onToggle}
        name={`${index}`}
      />
      <span className="text-sm">
        <FieldTitle label={label} source={source} resource={resource} />
      </span>
      {onMove && (
        <GripVertical className="ml-auto h-4 w-4 cursor-move dragIcon text-muted-foreground" />
      )}
    </label>
  );
};

export interface FieldToggleProps {
  selected: boolean;
  label: React.ReactNode;
  onToggle?: (event: boolean) => void;
  onMove?: (dragIndex: string | number, dropIndex: string | number | null) => void;
  source: string;
  index: number | string;
}
