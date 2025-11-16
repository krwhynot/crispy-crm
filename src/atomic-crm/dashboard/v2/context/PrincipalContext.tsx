import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import { useStore } from 'react-admin';

export interface PrincipalContextValue {
  selectedPrincipalId: number | null;
  setSelectedPrincipal: (id: number | null) => void;
}

const PrincipalContext = createContext<PrincipalContextValue | null>(null);

export function usePrincipalContext(): PrincipalContextValue {
  const context = useContext(PrincipalContext);
  if (!context) {
    throw new Error('usePrincipalContext must be used within PrincipalProvider');
  }
  return context;
}

export interface PrincipalProviderProps {
  children: ReactNode;
}

export function PrincipalProvider({ children }: PrincipalProviderProps) {
  // Persist to localStorage via React Admin's useStore
  const [selectedPrincipalId, setSelectedPrincipal] = useStore<number | null>(
    'pd.selectedPrincipalId',
    null
  );

  const value: PrincipalContextValue = {
    selectedPrincipalId,
    setSelectedPrincipal,
  };

  return <PrincipalContext.Provider value={value}>{children}</PrincipalContext.Provider>;
}
