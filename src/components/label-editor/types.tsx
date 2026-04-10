import { FabricObject } from 'fabric';
import type { LabelFormat } from '@/lib/label-formats';
import type { LabelProject } from '@/hooks/use-label-projects';
import type { Canvas as FabricCanvas } from 'fabric';

export interface LayerItem {
  id: number;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  obj: FabricObject;
}

export type SvgElement = { id: string; name: string; path: string; viewBox?: string };
export type SvgCategory = { id: string; label: string; icon: React.ReactNode; elements: SvgElement[] };

export const GOOGLE_FONTS = [
  'Arial', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald',
  'Playfair Display', 'Poppins', 'Raleway', 'Dancing Script',
  'Pacifico', 'Great Vibes', 'Lobster', 'Sacramento', 'Caveat',
];

export const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl+Z', action: 'Desfazer' },
  { keys: 'Ctrl+Y', action: 'Refazer' },
  { keys: 'Ctrl+S', action: 'Salvar' },
  { keys: 'Ctrl+D', action: 'Duplicar objeto' },
  { keys: 'Delete', action: 'Excluir seleção' },
  { keys: 'Ctrl+G', action: 'Alternar grid' },
];

export const FINISHING_OPTIONS = [
  { id: 'glossy', label: 'Brilhante (Verniz)', price: 0 },
  { id: 'matte', label: 'Fosco', price: 0.02 },
  { id: 'transparent', label: 'Transparente', price: 0.05 },
  { id: 'kraft', label: 'Kraft (papel pardo)', price: 0.03 },
];

export const ONBOARDING_KEY = 'label_editor_onboarding_done';

export const loadedFonts = new Set<string>();
export function loadGoogleFont(fontName: string) {
  if (loadedFonts.has(fontName) || ['Arial'].includes(fontName)) return;
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  loadedFonts.add(fontName);
}

// Preload common fonts
['Roboto', 'Montserrat', 'Playfair Display', 'Dancing Script'].forEach(loadGoogleFont);

// Shape visual data for wizard cards
export const SHAPE_VISUALS: Record<string, { svg: React.ReactNode; color: string }> = {
  round: {
    svg: <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3" />,
    color: 'from-blue-500/10 to-blue-600/10',
  },
  square: {
    svg: <rect x="8" y="8" width="84" height="84" fill="none" stroke="currentColor" strokeWidth="3" />,
    color: 'from-emerald-500/10 to-emerald-600/10',
  },
  'rounded-square': {
    svg: <rect x="8" y="8" width="84" height="84" rx="14" fill="none" stroke="currentColor" strokeWidth="3" />,
    color: 'from-purple-500/10 to-purple-600/10',
  },
  rectangle: {
    svg: <rect x="5" y="20" width="90" height="60" fill="none" stroke="currentColor" strokeWidth="3" />,
    color: 'from-amber-500/10 to-amber-600/10',
  },
  'rounded-rectangle': {
    svg: <rect x="5" y="20" width="90" height="60" rx="12" fill="none" stroke="currentColor" strokeWidth="3" />,
    color: 'from-rose-500/10 to-rose-600/10',
  },
};
