"use client";

import { useCallback } from "react";
import { useListContext, type RaRecord } from "ra-core";
import { useRowPositions } from "./useRowPositions";
import { useSwipeActions } from "./SwipeActionsContext";
import { SwipeActionRow } from "./SwipeActionRow";
import type { SwipeActionsConfig } from "./types";

interface SwipeActionsOverlayProps<T extends RaRecord> {
  config: SwipeActionsConfig<T>;
}

export function SwipeActionsOverlay<T extends RaRecord>({
  config,
}: SwipeActionsOverlayProps<T>) {
  const { data } = useListContext<T>();
  const rowPositions = useRowPositions();
  const { closeRow } = useSwipeActions();

  const handleAction = useCallback(
    (actionId: string, record: T) => {
      config.onAction(actionId, record);
      closeRow();
    },
    [config, closeRow]
  );

  if (!data) return null;

  return (
    <div className="swipe-actions-overlay absolute inset-0 pointer-events-none overflow-hidden">
      {data.map((record) => {
        const position = rowPositions.get(record.id);
        if (!position) return null;

        const actions = config.getActions(record);
        if (actions.length === 0) return null;

        return (
          <SwipeActionRow
            key={record.id}
            recordId={record.id}
            top={position.top}
            height={position.height}
            actions={actions}
            onActionClick={(actionId) => handleAction(actionId, record)}
          />
        );
      })}
    </div>
  );
}
