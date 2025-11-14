import { useRef, useCallback } from "react";
import { usePrefs } from "./usePrefs";
import { ColWidths, COLUMN_WIDTH_CONSTRAINTS } from "../types";

/**
 * Hook for managing resizable 3-column layout with mouse drag.
 *
 * Features:
 * - Mouse drag handlers for column separators (2 separators for 3 columns)
 * - Width constraints: min 15%, max 70% per column
 * - Automatic persistence via localStorage (usePrefs)
 * - Reset to default widths [40, 30, 30]
 *
 * @param initialWidths - Default column widths (must sum to 100)
 * @returns Object with containerRef, widths, drag handlers, and reset function
 *
 * @example
 * const { containerRef, widths, onMouseDown, resetWidths } = useResizableColumns();
 *
 * <div ref={containerRef} style={{ display: 'grid', gridTemplateColumns: `${widths[0]}% ${widths[1]}% ${widths[2]}%` }}>
 *   <div>Column 1</div>
 *   <div onMouseDown={onMouseDown(0)} style={{ cursor: 'col-resize' }}>Separator</div>
 *   <div>Column 2</div>
 *   <div onMouseDown={onMouseDown(1)} style={{ cursor: 'col-resize' }}>Separator</div>
 *   <div>Column 3</div>
 * </div>
 */
export function useResizableColumns(
  initialWidths: ColWidths = [40, 30, 30]
): {
  containerRef: React.RefObject<HTMLDivElement>;
  widths: ColWidths;
  onMouseDown: (separatorIndex: number) => (e: React.MouseEvent) => void;
  resetWidths: () => void;
} {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widths, setWidths] = usePrefs<ColWidths>("colWidths", initialWidths);

  // Track drag state in refs to avoid stale closures
  const dragStateRef = useRef<{
    separatorIndex: number;
    startX: number;
    startWidths: ColWidths;
  } | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStateRef.current || !containerRef.current) return;

      const { separatorIndex, startX, startWidths } = dragStateRef.current;
      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;

      // Calculate new widths
      const newWidths: ColWidths = [...startWidths];

      // Separator 0 adjusts columns 0 and 1
      // Separator 1 adjusts columns 1 and 2
      const leftColIndex = separatorIndex;
      const rightColIndex = separatorIndex + 1;

      let newLeftWidth = startWidths[leftColIndex] + deltaPercent;
      let newRightWidth = startWidths[rightColIndex] - deltaPercent;

      // Apply constraints to left column
      newLeftWidth = Math.max(
        COLUMN_WIDTH_CONSTRAINTS.MIN,
        Math.min(COLUMN_WIDTH_CONSTRAINTS.MAX, newLeftWidth)
      );

      // Apply constraints to right column
      newRightWidth = Math.max(
        COLUMN_WIDTH_CONSTRAINTS.MIN,
        Math.min(COLUMN_WIDTH_CONSTRAINTS.MAX, newRightWidth)
      );

      // Ensure sum equals 100
      const fixedSum = newLeftWidth + newRightWidth;
      const otherColIndex = 3 - leftColIndex - rightColIndex; // The unchanged column
      const otherColWidth = 100 - fixedSum;

      // Verify the unchanged column doesn't violate constraints
      if (
        otherColWidth < COLUMN_WIDTH_CONSTRAINTS.MIN ||
        otherColWidth > COLUMN_WIDTH_CONSTRAINTS.MAX
      ) {
        // If adjustment would violate constraints, don't update
        return;
      }

      newWidths[leftColIndex] = newLeftWidth;
      newWidths[rightColIndex] = newRightWidth;
      newWidths[otherColIndex] = otherColWidth;

      setWidths(newWidths);
    },
    [setWidths]
  );

  const handleMouseUp = useCallback(() => {
    if (!dragStateRef.current) return;

    dragStateRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // Re-enable text selection
    document.body.style.userSelect = "";
  }, [handleMouseMove]);

  const onMouseDown = useCallback(
    (separatorIndex: number) => (e: React.MouseEvent) => {
      e.preventDefault();

      // Disable text selection during drag
      document.body.style.userSelect = "none";

      dragStateRef.current = {
        separatorIndex,
        startX: e.clientX,
        startWidths: [...widths],
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [widths, handleMouseMove, handleMouseUp]
  );

  const resetWidths = useCallback(() => {
    setWidths([40, 30, 30]);
  }, [setWidths]);

  return {
    containerRef,
    widths,
    onMouseDown,
    resetWidths,
  };
}
