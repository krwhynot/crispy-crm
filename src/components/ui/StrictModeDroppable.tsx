import { useEffect, useState } from "react";
import { Droppable, type DroppableProps } from "@hello-pangea/dnd";

/**
 * StrictModeDroppable - Wrapper for @hello-pangea/dnd Droppable that works with React 18 StrictMode
 *
 * React 18's StrictMode double-mounts components (mount → unmount → mount) to detect side effects.
 * This breaks @hello-pangea/dnd's internal DOM ref tracking, causing droppable zones to not register.
 *
 * Fix: Delay rendering the Droppable until after the initial animation frame,
 * ensuring the component is stable before the library initializes its refs.
 *
 * @see https://github.com/atlassian/react-beautiful-dnd/issues/2350
 * @see https://github.com/hello-pangea/dnd/issues/293
 */
export function StrictModeDroppable({ children, ...props }: DroppableProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Use requestAnimationFrame to delay enabling until after the initial render cycle
    // This ensures StrictMode's double-mount has completed before we render the Droppable
    const animation = requestAnimationFrame(() => setEnabled(true));

    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    // Return a placeholder with same structure to maintain layout during initialization
    return null;
  }

  return <Droppable {...props}>{children}</Droppable>;
}
