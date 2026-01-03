"use client";

import { useEffect } from "react";
import { useDrag } from "@use-gesture/react";
import { useSpring, animated, config } from "@react-spring/web";
import { useSwipeActions } from "./SwipeActionsContext";
import { SwipeActionButton } from "./SwipeActionButton";
import type { SwipeActionRowProps } from "./types";

const SWIPE_THRESHOLD = 80;
const ACTION_PANEL_WIDTH = 160;

export function SwipeActionRow({
  recordId,
  top,
  height,
  actions,
  onActionClick,
}: SwipeActionRowProps) {
  const { openRowId, openRow, closeRow, setGestureActive } = useSwipeActions();
  const isOpen = openRowId === recordId;

  const [{ x }, api] = useSpring(() => ({
    x: 0,
    config: config.stiff,
  }));

  // Sync spring with external state
  useEffect(() => {
    api.start({ x: isOpen ? -ACTION_PANEL_WIDTH : 0 });
  }, [isOpen, api]);

  const bind = useDrag(
    ({ active, movement: [mx], velocity: [vx], cancel }) => {
      setGestureActive(active);

      // Only allow left swipe (negative x)
      if (mx > 0 && !isOpen) {
        cancel();
        return;
      }

      // During drag: follow finger (clamped)
      if (active) {
        const clampedX = Math.max(-ACTION_PANEL_WIDTH, Math.min(0, mx));
        api.start({ x: clampedX, immediate: true });
        return;
      }

      // On release: snap open or closed
      const shouldOpen = Math.abs(mx) > SWIPE_THRESHOLD || vx > 0.5;
      if (shouldOpen && mx < 0) {
        api.start({ x: -ACTION_PANEL_WIDTH });
        openRow(recordId);
      } else {
        api.start({ x: 0 });
        if (isOpen) closeRow();
      }
    },
    {
      axis: "x",
      filterTaps: true,
      threshold: 10,
    }
  );

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        height,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Action buttons (revealed on swipe) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: ACTION_PANEL_WIDTH,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        className="flex items-center justify-end gap-2 pr-2"
      >
        {actions.map((action) => (
          <SwipeActionButton
            key={action.id}
            icon={action.icon}
            label={action.label}
            onClick={() => onActionClick(action.id)}
          />
        ))}
      </div>

      {/* Gesture capture layer */}
      <animated.div
        {...bind()}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "100%",
          x,
          touchAction: "pan-y",
          pointerEvents: "auto",
        }}
      />
    </div>
  );
}
