import { useEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { US_CITIES } from "@/atomic-crm/opportunities/data/us-cities";

interface UseCityStateMappingOptions {
  cityField?: string;
  stateField?: string;
  onlyIfEmpty?: boolean;
}

export function useCityStateMapping({
  cityField = "city",
  stateField = "state",
  onlyIfEmpty = true,
}: UseCityStateMappingOptions = {}) {
  const { setValue, getValues } = useFormContext();
  const city = useWatch({ name: cityField });
  const lastCityRef = useRef<string | null>(null);

  useEffect(() => {
    if (!city || city === lastCityRef.current) return;
    lastCityRef.current = city;

    if (onlyIfEmpty) {
      const currentState = getValues(stateField);
      if (currentState) return;
    }

    const normalizedCity = city.trim().toLowerCase();
    const match = US_CITIES.find(
      (c) => c.city.toLowerCase() === normalizedCity
    );

    if (match) {
      setValue(stateField, match.state, { shouldValidate: true });
    }
  }, [city, stateField, setValue, getValues, onlyIfEmpty]);
}
