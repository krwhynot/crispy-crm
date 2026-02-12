import { useEffect, useRef, useCallback } from "react";

/**
 * Adds/removes `.can-scroll-right` on a scroll container
 * based on whether more content exists to the right.
 * Use with the `.scroll-fade-right` CSS class.
 */
export function useScrollFadeRight<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const canScroll = el.scrollWidth > el.clientWidth;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1; // 1px tolerance
    el.classList.toggle("can-scroll-right", canScroll && !atEnd);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  return ref;
}
