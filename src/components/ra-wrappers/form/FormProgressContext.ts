/**
 * Form Progress Context
 *
 * Context for the form progress system, separated to satisfy
 * react-refresh/only-export-components rule.
 */
import * as React from "react";
import type { FormProgressContextValue } from "./formProgressTypes";

export const FormProgressContext = React.createContext<FormProgressContextValue | null>(null);
