import { useState, useEffect, useCallback, useRef } from "react";
import { useListContext } from "ra-core";
import type { RowPosition } from "./types";

/**
 * Track DOM positions of table rows for overlay positioning.
 * Updates positions on mount, data changes, scroll, and resize.
 *
 * @returns Map of recordId to {top, height} position data
 */
export function useRowPositions(): Map<number | string, RowPosition> {
  const { data } = useListContext();
  const [positions, setPositions] = useState<Map<number | string, RowPosition>>(
    new Map()
  );
  const rafRef = useRef<number | null>(null);

  const updatePositions = useCallback(() => {
    if (!data) return;

    const tableBody = document.querySelector(".RaDatagrid-tableWrapper tbody");
    if (!tableBody) return;

    const container = tableBody.closest(".relative");
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const rows = tableBody.querySelectorAll("tr");
    const newPositions = new Map<number | string, RowPosition>();

    rows.forEach((row, index) => {
      if (data[index]) {
        const rowRect = row.getBoundingClientRect();
        newPositions.set(data[index].id, {
          top: rowRect.top - containerRect.top,
          height: rowRect.height,
        });
      }
    });

    setPositions(newPositions);
  }, [data]);

  const scheduleUpdate = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      updatePositions();
      rafRef.current = null;
    });
  }, [updatePositions]);

  useEffect(() => {
    updatePositions();
  }, [updatePositions]);

  useEffect(() => {
    const tableWrapper = document.querySelector(".RaDatagrid-tableWrapper");
    if (!tableWrapper) return;

    tableWrapper.addEventListener("scroll", scheduleUpdate, { passive: true });
    return () => tableWrapper.removeEventListener("scroll", scheduleUpdate);
  }, [scheduleUpdate]);

  useEffect(() => {
    const tableWrapper = document.querySelector(".RaDatagrid-tableWrapper");
    if (!tableWrapper) return;

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(tableWrapper);
    return () => resizeObserver.disconnect();
  }, [scheduleUpdate]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return positions;
}
