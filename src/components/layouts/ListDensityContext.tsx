import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ListDensity = "comfortable" | "compact";

interface ListDensityContextValue {
  density: ListDensity;
  setDensity: (density: ListDensity) => void;
  toggleDensity: () => void;
}

const LIST_DENSITY_STORAGE_KEY = "crm-list-density";

const ListDensityContext = createContext<ListDensityContextValue | null>(null);

function getInitialDensity(): ListDensity {
  if (typeof window === "undefined") {
    return "comfortable";
  }

  const stored = window.localStorage.getItem(LIST_DENSITY_STORAGE_KEY);
  return stored === "compact" ? "compact" : "comfortable";
}

export function ListDensityProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<ListDensity>(getInitialDensity);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LIST_DENSITY_STORAGE_KEY, density);
    }
  }, [density]);

  const value = useMemo<ListDensityContextValue>(
    () => ({
      density,
      setDensity: setDensityState,
      toggleDensity: () =>
        setDensityState((prev) => (prev === "comfortable" ? "compact" : "comfortable")),
    }),
    [density]
  );

  return <ListDensityContext.Provider value={value}>{children}</ListDensityContext.Provider>;
}

export function useListDensityContext(): ListDensityContextValue {
  const context = useContext(ListDensityContext);
  if (!context) {
    throw new Error("useListDensityContext must be used within a ListDensityProvider");
  }
  return context;
}
