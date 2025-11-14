import type { ReactNode } from 'react';
import React, { createContext, useContext, useState } from 'react';

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
  const [selectedPrincipalId, setSelectedPrincipal] = useState<number | null>(null);

  const value: PrincipalContextValue = {
    selectedPrincipalId,
    setSelectedPrincipal,
  };

  return <PrincipalContext.Provider value={value}>{children}</PrincipalContext.Provider>;
}
