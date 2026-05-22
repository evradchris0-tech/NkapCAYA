'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useFiscalYears } from '@lib/hooks/useFiscalYear';
import type { FiscalYear } from '@/types/api.types';

export const SELECTED_FY_STORAGE_KEY = 'caya_selected_fy';

interface FiscalYearContextValue {
  selectedFyId: string;
  selectedFy: FiscalYear | undefined;
  /** L'exercice ACTIVE en cours (indépendant de la sélection) */
  activeFy: FiscalYear | undefined;
  setSelectedFyId: (id: string) => void;
  fiscalYears: FiscalYear[] | undefined;
  isLoading: boolean;
  /** true si l'exercice sélectionné n'est pas ACTIVE → toutes les pages sont en lecture seule */
  isReadOnly: boolean;
}

const FiscalYearContext = createContext<FiscalYearContextValue>({
  selectedFyId: '',
  selectedFy: undefined,
  activeFy: undefined,
  setSelectedFyId: () => {},
  fiscalYears: undefined,
  isLoading: false,
  isReadOnly: false,
});

export function FiscalYearProvider({ children }: { children: ReactNode }) {
  const { data: fiscalYears, isLoading } = useFiscalYears();

  const [selectedFyId, setSelectedFyIdState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SELECTED_FY_STORAGE_KEY) ?? '';
    }
    return '';
  });

  const setSelectedFyId = useCallback((id: string) => {
    setSelectedFyIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SELECTED_FY_STORAGE_KEY, id);
    }
  }, []);

  // Nettoyer un ID de FY obsolète (exercice supprimé entre deux sessions)
  useEffect(() => {
    if (!fiscalYears || !selectedFyId) return;
    if (!fiscalYears.find((fy) => fy.id === selectedFyId)) {
      setSelectedFyId(''); // ID invalide → reset silencieux
    }
  }, [fiscalYears, selectedFyId, setSelectedFyId]);

  // Auto-select ACTIVE > CASSATION > premier — uniquement si aucune valeur stockée
  useEffect(() => {
    if (!selectedFyId && fiscalYears && fiscalYears.length > 0) {
      const pick =
        fiscalYears.find((fy) => fy.status === 'ACTIVE') ??
        fiscalYears.find((fy) => fy.status === 'CASSATION') ??
        fiscalYears[0];
      setSelectedFyId(pick.id);
    }
  }, [fiscalYears, selectedFyId, setSelectedFyId]);

  const selectedFy = fiscalYears?.find((fy) => fy.id === selectedFyId);
  const activeFy = fiscalYears?.find((fy) => fy.status === 'ACTIVE');
  // CASSATION : encore modifiable (remboursements de fin d'exercice possibles)
  const isReadOnly = !selectedFy || !['ACTIVE', 'CASSATION'].includes(selectedFy.status);

  return (
    <FiscalYearContext.Provider
      value={{ selectedFyId, selectedFy, activeFy, setSelectedFyId, fiscalYears, isLoading, isReadOnly }}
    >
      {children}
    </FiscalYearContext.Provider>
  );
}

export function useFiscalYearContext() {
  return useContext(FiscalYearContext);
}
