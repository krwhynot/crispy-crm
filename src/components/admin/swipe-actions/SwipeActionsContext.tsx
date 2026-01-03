"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { SwipeActionsContextValue } from "./types";

const SwipeActionsContext = createContext<SwipeActionsContextValue | null>(null);

export function SwipeActionsProvider({ children }: { children: ReactNode }) {
  const [openRowId, setOpenRowId] = useState<number | string | null>(null);
  const [isGestureActive, setIsGestureActive] = useState(false);

  const openRow = useCallback((id: number | string) => {
    setOpenRowId(id);
  }, []);

  const closeRow = useCallback(() => {
    setOpenRowId(null);
  }, []);

  const setGestureActive = useCallback((active: boolean) => {
    setIsGestureActive(active);
  }, []);

  const value: SwipeActionsContextValue = {
    openRowId,
    isGestureActive,
    openRow,
    closeRow,
    setGestureActive,
  };

  return <SwipeActionsContext.Provider value={value}>{children}</SwipeActionsContext.Provider>;
}

export function useSwipeActions(): SwipeActionsContextValue {
  const context = useContext(SwipeActionsContext);

  if (context === null) {
    throw new Error("useSwipeActions must be used within SwipeActionsProvider");
  }

  return context;
}
