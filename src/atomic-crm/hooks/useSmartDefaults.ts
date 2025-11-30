import { useEffect, useRef } from "react";
import { useGetIdentity } from "react-admin";
import { format } from "date-fns";
import type { UserIdentity } from "@/hooks/useUserRole";

interface UseSmartDefaultsOptions {
  reset?: (values: Record<string, any>, options?: { keepDirtyValues?: boolean }) => void;
}

interface SmartDefaults {
  sales_id: string | null;
  activity_date: string;
}

export const useSmartDefaults = (options?: UseSmartDefaultsOptions): {
  defaults: SmartDefaults;
  isLoading: boolean;
} => {
  const { data: identity, isLoading } = useGetIdentity<UserIdentity>();
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
  }, [identity, isLoading, options?.reset]);

  return { defaults, isLoading };
};
