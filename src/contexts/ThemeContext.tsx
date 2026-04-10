import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ThemeConfig, ThemeColors, defaultThemeConfig, fontOptions } from '@/lib/themes';

interface ThemeContextType {
  themeConfig: ThemeConfig;
  applyTheme: (config: ThemeConfig) => void;
  saveTheme: (config: ThemeConfig) => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  themeConfig: defaultThemeConfig,
  applyTheme: () => {},
  saveTheme: async () => {},
  loading: true,
});

export const useTheme = () => useContext(ThemeContext);

function applyColorsToRoot(colors: ThemeColors) {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}

function loadGoogleFonts(fontDisplay: string, fontBody: string) {
  const id = 'dynamic-google-fonts';
  let link = document.getElementById(id) as HTMLLinkElement | null;
  
  const fontsToLoad: string[] = [];
  for (const font of [fontDisplay, fontBody]) {
    const opt = fontOptions.find(f => f.value === font);
    if (opt) fontsToLoad.push(opt.import);
  }

  if (fontsToLoad.length === 0) return;

  const href = `https://fonts.googleapis.com/css2?${fontsToLoad.map(f => `family=${f}`).join('&')}&display=swap`;

  if (link) {
    link.href = href;
  } else {
    link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}

function applyFonts(fontDisplay: string, fontBody: string) {
  const root = document.documentElement;
  root.style.setProperty('--font-display', `'${fontDisplay}', cursive`);
  root.style.setProperty('--font-body', `'${fontBody}', sans-serif`);
  loadGoogleFonts(fontDisplay, fontBody);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(defaultThemeConfig);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const applyTheme = useCallback((config: ThemeConfig) => {
    setThemeConfig(config);
    applyColorsToRoot(config.colors);
    applyFonts(config.fontDisplay, config.fontBody);
  }, []);

  const saveTheme = useCallback(async (config: ThemeConfig) => {
    const jsonStr = JSON.stringify(config);
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .eq('key', 'theme_config')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('site_settings')
        .update({ value: jsonStr, updated_at: new Date().toISOString() })
        .eq('key', 'theme_config');
    } else {
      await supabase
        .from('site_settings')
        .insert({ key: 'theme_config', value: jsonStr });
    }

    queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    applyTheme(config);
  }, [applyTheme, queryClient]);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'theme_config')
          .maybeSingle();

        if (data?.value) {
          const config = JSON.parse(data.value) as ThemeConfig;
          applyTheme(config);
        } else {
          applyTheme(defaultThemeConfig);
        }
      } catch {
        applyTheme(defaultThemeConfig);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ themeConfig, applyTheme, saveTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};
