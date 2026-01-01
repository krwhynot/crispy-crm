/**
 * Hook to access form options (note statuses, task types, contact gender)
 *
 * Use this when you need form field options - prevents re-renders
 * when branding or pipeline config changes.
 */
import { useContext } from "react";
import { FormOptionsContext } from "./FormOptionsContext";

export const useFormOptions = () => useContext(FormOptionsContext);
