/**
 * FormOptionsContext - Form field options and defaults
 *
 * This context holds options used by forms: note statuses, task types,
 * and contact gender options. These are used by form inputs to populate
 * select/radio choices.
 *
 * Part of P2-1 fix: ConfigurationContext split into focused contexts
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { NoteStatus, ContactGender } from "../types";
import {
  defaultNoteStatuses,
  defaultTaskTypes,
  defaultContactGender,
} from "../root/defaultConfiguration";

export interface FormOptions {
  /** Status options for notes (cold, warm, hot, in-contract) */
  noteStatuses: NoteStatus[];
  /** Task type options (Call, Email, Meeting, etc.) */
  taskTypes: string[];
  /** Gender/pronoun options for contacts */
  contactGender: ContactGender[];
}

const defaultFormOptions: FormOptions = {
  noteStatuses: defaultNoteStatuses,
  taskTypes: defaultTaskTypes,
  contactGender: defaultContactGender,
};

export const FormOptionsContext = createContext<FormOptions>(defaultFormOptions);

export interface FormOptionsProviderProps extends Partial<FormOptions> {
  children: ReactNode;
}

export const FormOptionsProvider = ({
  children,
  noteStatuses = defaultNoteStatuses,
  taskTypes = defaultTaskTypes,
  contactGender = defaultContactGender,
}: FormOptionsProviderProps) => {
  const value = useMemo(
    () => ({ noteStatuses, taskTypes, contactGender }),
    [noteStatuses, taskTypes, contactGender]
  );

  return (
    <FormOptionsContext.Provider value={value}>
      {children}
    </FormOptionsContext.Provider>
  );
};

/**
 * Hook to access form options (note statuses, task types, contact gender)
 *
 * Use this when you need form field options - prevents re-renders
 * when branding or pipeline config changes.
 */
export const useFormOptions = () => useContext(FormOptionsContext);
