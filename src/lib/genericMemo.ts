import type { ComponentType, MemoExoticComponent } from "react";
import { memo } from "react";

interface ComponentWithDisplayName {
  displayName?: string;
}

/**
 * A version of React.memo that preserves the original component type allowing it to accept generics.
 * See {@link https://stackoverflow.com/a/70890101}
 * @deprecated Use genericMemo from "ra-core" when available.
 */
export function genericMemo<P extends object>(
  component: ComponentType<P>
): MemoExoticComponent<ComponentType<P>> {
  const result = memo(component);

  // Preserve displayName for DevTools
  result.displayName = (component as ComponentWithDisplayName).displayName?.replace("Impl", "");

  return result;
}
