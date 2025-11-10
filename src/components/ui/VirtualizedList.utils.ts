/**
 * Utility hook for VirtualizedList
 * Extracted from VirtualizedList.tsx to support Fast Refresh
 */

import React from "react";

/**
 * Hook for calculating dynamic container height based on viewport
 */
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
