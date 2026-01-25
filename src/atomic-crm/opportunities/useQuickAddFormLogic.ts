import { useState, useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { useGetList, useDataProvider } from "ra-core";
import { useQuery } from "@tanstack/react-query";
import { US_CITIES } from "./data/us-cities";

interface QuickAddFormValues {
  organization_id?: number;
  org_name?: string;
  principal_id: number;
  account_manager_id: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  campaign?: string;
  product_ids: number[];
  quick_note?: string;
}

interface UseQuickAddFormLogicProps {
  identity?: { id: string | number; fullName?: string; [key: string]: unknown };
  identityLoading: boolean;
}

/**
 * Custom hook that encapsulates all QuickAddForm business logic
 *
 * Responsibilities:
 * - Data fetching (principals, organizations, sales, products)
 * - Form handlers (city selection, organization change, validation)
 * - Computed values (options, previews)
 * - Identity synchronization
 */
export const useQuickAddFormLogic = ({ identity, identityLoading }: UseQuickAddFormLogicProps) => {
  const dataProvider = useDataProvider();
  const { setValue, setFocus } = useFormContext<QuickAddFormValues>();

  // Track whether user has interacted with Account Manager field
  const [shouldLoadSales, setShouldLoadSales] = useState(false);

  // PERFORMANCE: Server-side filtering - fetch only needed organization types
  const { data: principalsList, isLoading: principalsLoading } = useGetList("organizations", {
    filter: { organization_type: "principal" },
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  const { data: organizationsList, isLoading: organizationsLoading } = useGetList("organizations", {
    filter: { organization_type: ["customer", "prospect"] },
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  // Defer sales list until user interacts with Account Manager field
  const { data: salesListData, isLoading: salesLoading } = useQuery({
    queryKey: [
      "sales",
      "getList",
      { pagination: { page: 1, perPage: 100 }, sort: { field: "name", order: "ASC" } },
    ],
    queryFn: async () => {
      const result = await dataProvider.getList("sales", {
        pagination: { page: 1, perPage: 100 },
        sort: { field: "name", order: "ASC" },
      });
      return result;
    },
    enabled: shouldLoadSales,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const salesList = salesListData?.data;

  // Merge identity into sales choices for immediate display
  const accountManagerChoices = useMemo(() => {
    const choices =
      salesList?.map((sale) => ({
        id: sale.id,
        name: sale.name || sale.email || `Sales #${sale.id}`,
      })) ?? [];

    if (!salesList && identity?.id) {
      return [
        {
          id: Number(identity.id),
          name: (identity.fullName as string) || `User #${identity.id}`,
        },
      ];
    }

    return choices;
  }, [salesList, identity]);

  // Sync account_manager_id with identity when loaded
  useEffect(() => {
    if (identity?.id && !identityLoading) {
      setValue("account_manager_id", Number(identity.id));
    }
  }, [identity?.id, identityLoading, setValue]);

  // Handlers
  const handleCitySelect = (cityName: string) => {
    const selectedCity = US_CITIES.find((c) => c.city === cityName);
    if (selectedCity) {
      setValue("city", selectedCity.city);
      setValue("state", selectedCity.state);
    } else {
      setValue("city", cityName);
      setValue("state", "");
    }
  };

  const onValidationError = (errors: FieldErrors<QuickAddFormValues>) => {
    const firstErrorField = Object.keys(errors)[0] as keyof QuickAddFormValues;
    if (firstErrorField) {
      setFocus(firstErrorField);
    }
  };

  const handleOrganizationChange = (value: number | undefined, name?: string) => {
    setValue("organization_id", value);
    if (name) {
      setValue("org_name", name);
    }
  };

  // Transform data for UI components
  const organizationOptions =
    organizationsList?.map((org) => ({
      value: org.id.toString(),
      label: org.name,
    })) || [];

  const cityOptions = US_CITIES.map(({ city }) => ({
    value: city,
    label: city,
  }));

  return {
    // Data
    principalsList,
    principalsLoading,
    organizationsList,
    organizationsLoading,
    salesLoading,
    accountManagerChoices,
    organizationOptions,
    cityOptions,
    // State
    setShouldLoadSales,
    // Handlers
    handleCitySelect,
    onValidationError,
    handleOrganizationChange,
  };
};
