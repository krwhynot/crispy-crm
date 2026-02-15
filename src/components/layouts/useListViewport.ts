import { useEffect, useState } from "react";

const LIST_DOCKED_QUERY = "(min-width: 1024px)";

function getDockedMatch(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return window.matchMedia(LIST_DOCKED_QUERY).matches;
}

export function useListHasDockedFilters(): boolean {
  const [isDocked, setIsDocked] = useState<boolean>(getDockedMatch);

  useEffect(() => {
    const mql = window.matchMedia(LIST_DOCKED_QUERY);
    const onChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsDocked(event.matches);
    };

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange as (event: MediaQueryListEvent) => void);
    } else {
      mql.addListener(onChange as (this: MediaQueryList, ev: MediaQueryListEvent) => unknown);
    }
    setIsDocked(mql.matches);

    return () => {
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", onChange as (event: MediaQueryListEvent) => void);
      } else {
        mql.removeListener(onChange as (this: MediaQueryList, ev: MediaQueryListEvent) => unknown);
      }
    };
  }, []);

  return isDocked;
}
