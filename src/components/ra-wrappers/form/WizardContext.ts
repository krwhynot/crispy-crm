/**
 * Wizard Context
 *
 * Context for the multi-step wizard system, separated to satisfy
 * react-refresh/only-export-components rule.
 */
import * as React from "react";
import type { WizardContextValue } from "./wizard-types";

export const WizardContext = React.createContext<WizardContextValue | null>(null);
