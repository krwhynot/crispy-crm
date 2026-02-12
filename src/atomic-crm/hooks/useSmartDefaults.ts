import { useEffect, useRef } from "react";
import { useGetIdentity, type Identifier } from "react-admin";
import { format } from "date-fns";
import type { FieldValues } from "react-hook-form";
interface UseSmartDefaultsOptions {
  reset?: (values: FieldValues, options?: { keepDirtyValues?: boolean }) => void;
}

interface SmartDefaults {
  sales_id: Identifier | null;
  activity_date: string;
}

export const useSmartDefaults = (
  options?: UseSmartDefaultsOptions
): {
  defaults: SmartDefaults;
  isLoading: boolean;
} => {
  const { data: identity, isLoading } = useGetIdentity();
  const hasResetRef = useRef(false);

  const defaults: SmartDefaults = {
    sales_id: identity?.id || null,
    activity_date: format(new Date(), "yyyy-MM-dd"),
  };

  useEffect(() => {
    if (options?.reset && identity && !isLoading && !hasResetRef.current) {
      hasResetRef.current = true;
      options.reset(defaults, { keepDirtyValues: true });
    }
    // Note: 'defaults' and 'options' are intentionally omitted from deps.
    // 'defaults' is computed fresh each render (not stable reference).
    // 'options' should only trigger reset when its .reset function changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, isLoading, options?.reset]);

  return { defaults, isLoading };
};
