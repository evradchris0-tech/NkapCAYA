'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useFiscalYears } from '@lib/hooks/useFiscalYear';
import type { FiscalYear } from '@/types/api.types';

interface FiscalYearContextValue {
  selectedFyId: string;
  selectedFy: FiscalYear | undefined;
  setSelectedFyId: (id: string) => void;
  fiscalYears: FiscalYear[] | undefined;
  isLoading: boolean;
}

const FiscalYearContext = createContext<FiscalYearContextValue>({
  selectedFyId: '',
  selectedFy: undefined,
  setSelectedFyId: () => {},
  fiscalYears: undefined,
  isLoading: false,
});

export function FiscalYearProvider({ children }: { children: ReactNode }) {
  const { data: fiscalYears, isLoading } = useFiscalYears();
  const [selectedFyId, setSelectedFyId] = useState('');

  // Auto-select ACTIVE > CASSATION > first on load
  useEffect(() => {
    if (!selectedFyId && fiscalYears && fiscalYears.length > 0) {
      const pick =
        fiscalYears.find((fy) => fy.status === 'ACTIVE') ??
        fiscalYears.find((fy) => fy.status === 'CASSATION') ??
        fiscalYears[0];
      setSelectedFyId(pick.id);
    }
  }, [fiscalYears, selectedFyId]);

  const selectedFy = fiscalYears?.find((fy) => fy.id === selectedFyId);

  return (
    <FiscalYearContext.Provider value={{ selectedFyId, selectedFy, setSelectedFyId, fiscalYears, isLoading }}>
      {children}
    </FiscalYearContext.Provider>
  );
}

export function useFiscalYearContext() {
  return useContext(FiscalYearContext);
}
