import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SettingsContextType {
  settings: Record<string, string>;
  loading: boolean;
  getSetting: (key: string, fallback?: string) => string;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: {}, loading: true, getSetting: () => '',
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('key, value');
      const map: Record<string, string> = {};
      data?.forEach(s => { map[s.key] = s.value ?? ''; });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const getSetting = (key: string, fallback = '') => data?.[key] ?? fallback;

  return (
    <SettingsContext.Provider value={{ settings: data ?? {}, loading: isLoading, getSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};
