import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../services/settings.service';
import type { Settings } from '../types/settings';

interface SettingsContextType {
  settings: Settings | null;
  isLoading: boolean;
  error: Error | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  return (
    <SettingsContext.Provider value={{ settings: settings || null, isLoading, error: error as Error | null }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
