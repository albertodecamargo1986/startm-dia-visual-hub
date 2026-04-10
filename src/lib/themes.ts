export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  muted: string;
  'muted-foreground': string;
  accent: string;
  'accent-foreground': string;
  destructive: string;
  'destructive-foreground': string;
  border: string;
  input: string;
  ring: string;
  'sidebar-background': string;
  'sidebar-foreground': string;
  'sidebar-primary': string;
  'sidebar-primary-foreground': string;
  'sidebar-accent': string;
  'sidebar-accent-foreground': string;
  'sidebar-border': string;
  'sidebar-ring': string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
}

export interface ThemeConfig {
  presetId: string;
  mode: 'light' | 'dark' | 'auto';
  colors: ThemeColors;
  fontDisplay: string;
  fontBody: string;
}

export const fontOptions = [
  { label: 'Bebas Neue', value: 'Bebas Neue', import: 'Bebas+Neue' },
  { label: 'Poppins', value: 'Poppins', import: 'Poppins:wght@300;400;500;600;700' },
  { label: 'Montserrat', value: 'Montserrat', import: 'Montserrat:wght@300;400;500;600;700;800;900' },
  { label: 'Oswald', value: 'Oswald', import: 'Oswald:wght@300;400;500;600;700' },
  { label: 'Playfair Display', value: 'Playfair Display', import: 'Playfair+Display:wght@400;500;600;700;800;900' },
  { label: 'Raleway', value: 'Raleway', import: 'Raleway:wght@300;400;500;600;700;800' },
  { label: 'Roboto Condensed', value: 'Roboto Condensed', import: 'Roboto+Condensed:wght@300;400;500;600;700' },
  { label: 'Inter', value: 'Inter', import: 'Inter:wght@300;400;500;600;700' },
  { label: 'Open Sans', value: 'Open Sans', import: 'Open+Sans:wght@300;400;500;600;700' },
  { label: 'Lato', value: 'Lato', import: 'Lato:wght@300;400;700;900' },
];

export const themePresets: ThemePreset[] = [
  {
    id: 'azul-startmidia',
    name: 'Azul StartMídia',
    description: 'Tons de azul da marca com fundo claro',
    mode: 'light',
    colors: {
      background: '210 40% 96%',
      foreground: '215 25% 15%',
      card: '0 0% 100%',
      'card-foreground': '215 25% 15%',
      popover: '0 0% 100%',
      'popover-foreground': '215 25% 15%',
      primary: '213 80% 50%',
      'primary-foreground': '0 0% 100%',
      secondary: '213 30% 90%',
      'secondary-foreground': '213 80% 35%',
      muted: '210 25% 92%',
      'muted-foreground': '215 15% 50%',
      accent: '29 88% 55%',
      'accent-foreground': '0 0% 100%',
      destructive: '0 84% 60%',
      'destructive-foreground': '0 0% 100%',
      border: '210 20% 88%',
      input: '210 20% 88%',
      ring: '213 80% 50%',
      'sidebar-background': '213 60% 20%',
      'sidebar-foreground': '210 30% 95%',
      'sidebar-primary': '213 80% 55%',
      'sidebar-primary-foreground': '0 0% 100%',
      'sidebar-accent': '213 50% 28%',
      'sidebar-accent-foreground': '210 30% 95%',
      'sidebar-border': '213 40% 30%',
      'sidebar-ring': '213 80% 55%',
    },
  },
  {
    id: 'azul-escuro',
    name: 'Azul Escuro',
    description: 'Azul da marca com fundo escuro',
    mode: 'dark',
    colors: {
      background: '215 30% 10%',
      foreground: '210 30% 95%',
      card: '215 30% 14%',
      'card-foreground': '210 30% 95%',
      popover: '215 30% 14%',
      'popover-foreground': '210 30% 95%',
      primary: '213 80% 55%',
      'primary-foreground': '0 0% 100%',
      secondary: '213 40% 22%',
      'secondary-foreground': '0 0% 100%',
      muted: '215 25% 20%',
      'muted-foreground': '215 15% 60%',
      accent: '29 88% 60%',
      'accent-foreground': '215 30% 10%',
      destructive: '0 84% 60%',
      'destructive-foreground': '0 0% 100%',
      border: '215 25% 22%',
      input: '215 25% 22%',
      ring: '213 80% 55%',
      'sidebar-background': '215 35% 12%',
      'sidebar-foreground': '210 30% 95%',
      'sidebar-primary': '213 80% 55%',
      'sidebar-primary-foreground': '0 0% 100%',
      'sidebar-accent': '215 30% 18%',
      'sidebar-accent-foreground': '210 30% 95%',
      'sidebar-border': '215 25% 22%',
      'sidebar-ring': '213 80% 55%',
    },
  },
  {
    id: 'minimalista-claro',
    name: 'Minimalista Claro',
    description: 'Branco e cinza suave, clean e moderno',
    mode: 'light',
    colors: {
      background: '0 0% 98%',
      foreground: '0 0% 12%',
      card: '0 0% 100%',
      'card-foreground': '0 0% 12%',
      popover: '0 0% 100%',
      'popover-foreground': '0 0% 12%',
      primary: '0 0% 15%',
      'primary-foreground': '0 0% 100%',
      secondary: '0 0% 94%',
      'secondary-foreground': '0 0% 20%',
      muted: '0 0% 94%',
      'muted-foreground': '0 0% 50%',
      accent: '0 0% 90%',
      'accent-foreground': '0 0% 12%',
      destructive: '0 84% 60%',
      'destructive-foreground': '0 0% 100%',
      border: '0 0% 90%',
      input: '0 0% 90%',
      ring: '0 0% 15%',
      'sidebar-background': '0 0% 97%',
      'sidebar-foreground': '0 0% 12%',
      'sidebar-primary': '0 0% 15%',
      'sidebar-primary-foreground': '0 0% 100%',
      'sidebar-accent': '0 0% 92%',
      'sidebar-accent-foreground': '0 0% 12%',
      'sidebar-border': '0 0% 90%',
      'sidebar-ring': '0 0% 15%',
    },
  },
  {
    id: 'dark-premium',
    name: 'Dark Premium',
    description: 'Tema escuro atual refinado',
    mode: 'dark',
    colors: {
      background: '220 20% 7%',
      foreground: '140 33% 96%',
      card: '222 24% 14%',
      'card-foreground': '140 33% 96%',
      popover: '222 24% 14%',
      'popover-foreground': '140 33% 96%',
      primary: '355 82% 56%',
      'primary-foreground': '0 0% 100%',
      secondary: '213 49% 23%',
      'secondary-foreground': '0 0% 100%',
      muted: '220 22% 23%',
      'muted-foreground': '215 20% 65%',
      accent: '29 88% 67%',
      'accent-foreground': '220 20% 7%',
      destructive: '0 84% 60%',
      'destructive-foreground': '0 0% 100%',
      border: '220 22% 23%',
      input: '220 22% 23%',
      ring: '355 82% 56%',
      'sidebar-background': '222 24% 10%',
      'sidebar-foreground': '140 33% 96%',
      'sidebar-primary': '355 82% 56%',
      'sidebar-primary-foreground': '0 0% 100%',
      'sidebar-accent': '220 22% 20%',
      'sidebar-accent-foreground': '140 33% 96%',
      'sidebar-border': '220 22% 23%',
      'sidebar-ring': '355 82% 56%',
    },
  },
  {
    id: 'energia-laranja',
    name: 'Energia Laranja',
    description: 'Vibrante com destaque laranja',
    mode: 'light',
    colors: {
      background: '30 30% 97%',
      foreground: '20 15% 15%',
      card: '0 0% 100%',
      'card-foreground': '20 15% 15%',
      popover: '0 0% 100%',
      'popover-foreground': '20 15% 15%',
      primary: '24 95% 53%',
      'primary-foreground': '0 0% 100%',
      secondary: '30 30% 92%',
      'secondary-foreground': '24 80% 35%',
      muted: '30 20% 93%',
      'muted-foreground': '20 10% 50%',
      accent: '213 70% 50%',
      'accent-foreground': '0 0% 100%',
      destructive: '0 84% 60%',
      'destructive-foreground': '0 0% 100%',
      border: '30 15% 88%',
      input: '30 15% 88%',
      ring: '24 95% 53%',
      'sidebar-background': '24 60% 18%',
      'sidebar-foreground': '30 30% 95%',
      'sidebar-primary': '24 95% 55%',
      'sidebar-primary-foreground': '0 0% 100%',
      'sidebar-accent': '24 50% 25%',
      'sidebar-accent-foreground': '30 30% 95%',
      'sidebar-border': '24 40% 28%',
      'sidebar-ring': '24 95% 55%',
    },
  },
  {
    id: 'profissional-cinza',
    name: 'Profissional Cinza',
    description: 'Neutro e corporativo',
    mode: 'light',
    colors: {
      background: '220 14% 96%',
      foreground: '220 15% 15%',
      card: '0 0% 100%',
      'card-foreground': '220 15% 15%',
      popover: '0 0% 100%',
      'popover-foreground': '220 15% 15%',
      primary: '220 60% 45%',
      'primary-foreground': '0 0% 100%',
      secondary: '220 14% 90%',
      'secondary-foreground': '220 40% 30%',
      muted: '220 10% 93%',
      'muted-foreground': '220 10% 50%',
      accent: '170 55% 42%',
      'accent-foreground': '0 0% 100%',
      destructive: '0 84% 60%',
      'destructive-foreground': '0 0% 100%',
      border: '220 13% 88%',
      input: '220 13% 88%',
      ring: '220 60% 45%',
      'sidebar-background': '220 20% 18%',
      'sidebar-foreground': '220 14% 95%',
      'sidebar-primary': '220 60% 50%',
      'sidebar-primary-foreground': '0 0% 100%',
      'sidebar-accent': '220 18% 25%',
      'sidebar-accent-foreground': '220 14% 95%',
      'sidebar-border': '220 16% 28%',
      'sidebar-ring': '220 60% 50%',
    },
  },
  {
    id: 'vermelho-elegante',
    name: 'Vermelho Elegante',
    description: 'Vermelho sofisticado com fundo claro',
    mode: 'light',
    colors: {
      background: '0 10% 97%',
      foreground: '0 5% 15%',
      card: '0 0% 100%',
      'card-foreground': '0 5% 15%',
      popover: '0 0% 100%',
      'popover-foreground': '0 5% 15%',
      primary: '355 82% 50%',
      'primary-foreground': '0 0% 100%',
      secondary: '355 20% 92%',
      'secondary-foreground': '355 60% 35%',
      muted: '0 8% 93%',
      'muted-foreground': '0 5% 50%',
      accent: '213 60% 50%',
      'accent-foreground': '0 0% 100%',
      destructive: '0 84% 60%',
      'destructive-foreground': '0 0% 100%',
      border: '0 8% 88%',
      input: '0 8% 88%',
      ring: '355 82% 50%',
      'sidebar-background': '355 40% 15%',
      'sidebar-foreground': '0 10% 95%',
      'sidebar-primary': '355 82% 55%',
      'sidebar-primary-foreground': '0 0% 100%',
      'sidebar-accent': '355 35% 22%',
      'sidebar-accent-foreground': '0 10% 95%',
      'sidebar-border': '355 30% 25%',
      'sidebar-ring': '355 82% 55%',
    },
  },
  {
    id: 'verde-natureza',
    name: 'Verde Natureza',
    description: 'Verde fresco e natural',
    mode: 'light',
    colors: {
      background: '140 20% 97%',
      foreground: '140 15% 12%',
      card: '0 0% 100%',
      'card-foreground': '140 15% 12%',
      popover: '0 0% 100%',
      'popover-foreground': '140 15% 12%',
      primary: '152 60% 40%',
      'primary-foreground': '0 0% 100%',
      secondary: '140 20% 92%',
      'secondary-foreground': '152 50% 28%',
      muted: '140 15% 93%',
      'muted-foreground': '140 10% 48%',
      accent: '35 80% 50%',
      'accent-foreground': '0 0% 100%',
      destructive: '0 84% 60%',
      'destructive-foreground': '0 0% 100%',
      border: '140 12% 88%',
      input: '140 12% 88%',
      ring: '152 60% 40%',
      'sidebar-background': '152 40% 16%',
      'sidebar-foreground': '140 20% 95%',
      'sidebar-primary': '152 60% 45%',
      'sidebar-primary-foreground': '0 0% 100%',
      'sidebar-accent': '152 35% 22%',
      'sidebar-accent-foreground': '140 20% 95%',
      'sidebar-border': '152 30% 25%',
      'sidebar-ring': '152 60% 45%',
    },
  },
];

export const defaultThemeConfig: ThemeConfig = {
  presetId: 'azul-startmidia',
  mode: 'light',
  colors: themePresets[0].colors,
  fontDisplay: 'Bebas Neue',
  fontBody: 'Inter',
};

export const colorLabels: Record<string, string> = {
  background: 'Fundo',
  foreground: 'Texto',
  card: 'Cartão',
  'card-foreground': 'Texto do Cartão',
  primary: 'Primária',
  'primary-foreground': 'Texto Primária',
  secondary: 'Secundária',
  'secondary-foreground': 'Texto Secundária',
  muted: 'Suave',
  'muted-foreground': 'Texto Suave',
  accent: 'Destaque',
  'accent-foreground': 'Texto Destaque',
  border: 'Borda',
  input: 'Input',
  ring: 'Anel de Foco',
};
