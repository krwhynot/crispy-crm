import { useEffect, useState } from "react";

export type Breakpoint =
  | "mobile"
  | "tablet-portrait"
  | "tablet-landscape"
  | "laptop"
  | "desktop";

const BREAKPOINT_QUERIES: Record<Breakpoint, string> = {
  mobile: "(max-width: 767px)",
  "tablet-portrait": "(min-width: 768px) and (max-width: 1023px)",
  "tablet-landscape": "(min-width: 1024px) and (max-width: 1279px)",
  laptop: "(min-width: 1280px) and (max-width: 1439px)",
  desktop: "(min-width: 1440px)",
};

const BREAKPOINT_ORDER: Breakpoint[] = [
  "desktop",
  "laptop",
  "tablet-landscape",
  "tablet-portrait",
  "mobile",
];

function getCurrentBreakpoint(): Breakpoint {
  for (const bp of BREAKPOINT_ORDER) {
    if (window.matchMedia(BREAKPOINT_QUERIES[bp]).matches) {
      return bp;
    }
  }
  return "mobile";
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
    typeof window !== "undefined" ? getCurrentBreakpoint() : "desktop"
  );

  useEffect(() => {
    const mediaQueries = Object.entries(BREAKPOINT_QUERIES).map(
      ([bp, query]) => ({
        breakpoint: bp as Breakpoint,
        mql: window.matchMedia(query),
      })
    );

    const handleChange = () => {
      setBreakpoint(getCurrentBreakpoint());
    };

    mediaQueries.forEach(({ mql }) => {
      mql.addEventListener("change", handleChange);
    });

    return () => {
      mediaQueries.forEach(({ mql }) => {
        mql.removeEventListener("change", handleChange);
      });
    };
  }, []);

  return breakpoint;
}

// Convenience hooks
export function useIsDesktop(): boolean {
  return useBreakpoint() === "desktop";
}

export function useIsLaptopOrLarger(): boolean {
  const bp = useBreakpoint();
  return bp === "desktop" || bp === "laptop";
}

export function useIsMobileOrTablet(): boolean {
  const bp = useBreakpoint();
  return bp === "mobile" || bp === "tablet-portrait" || bp === "tablet-landscape";
}
