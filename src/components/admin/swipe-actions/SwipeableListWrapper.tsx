"use client";

import type { ReactNode } from "react";
import type { RaRecord } from "ra-core";
import { SwipeActionsProvider } from "./SwipeActionsContext";
import { SwipeActionsOverlay } from "./SwipeActionsOverlay";
import { useTouchDevice } from "./useTouchDevice";
import type { SwipeActionsConfig } from "./types";

interface SwipeableListWrapperProps<T extends RaRecord> {
  children: ReactNode;
  config: SwipeActionsConfig<T>;
}

export function SwipeableListWrapper<T extends RaRecord>({
  children,
  config,
}: SwipeableListWrapperProps<T>) {
  const isTouch = useTouchDevice();

  return (
    <SwipeActionsProvider>
      <div className="relative">
        {children}
        {isTouch && <SwipeActionsOverlay config={config} />}
      </div>
    </SwipeActionsProvider>
  );
}
