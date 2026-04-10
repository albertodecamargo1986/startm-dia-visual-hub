import { type GradientPreset, type GradientCategory } from './label-gradients';

export const GRADIENT_PRESETS: GradientPreset[] = [
  // ── POPULARES ──
  {
    id: 'sunset-classic', name: 'Sunset', category: 'populares',
    type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#FF6B6B' }, { offset: 0.5, color: '#FE8C00' }, { offset: 1, color: '#F83600' }],
  },
  {
    id: 'ocean-blue', name: 'Oceano', category: 'populares',
    type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#2193B0' }, { offset: 1, color: '#6DD5FA' }],
  },
  {
    id: 'purple-dream', name: 'Roxo Dream', category: 'populares',
    type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#DA22FF' }, { offset: 1, color: '#9733EE' }],
  },
  {
    id: 'emerald', name: 'Esmeralda', category: 'populares',
    type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#11998E' }, { offset: 1, color: '#38EF7D' }],
  },
  {
    id: 'golden-hour', name: 'Hora Dourada', category: 'populares',
    type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#F7971E' }, { offset: 1, color: '#FFD200' }],
  },
  {
    id: 'rose-gold', name: 'Rose Gold', category: 'populares',
    type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#B76E79' }, { offset: 0.5, color: '#E8A598' }, { offset: 1, color: '#D4AF8C' }],
  },

  // ── SUNSET ──
  {
    id: 'sunset-warm', name: 'Pôr do Sol', category: 'sunset',
    type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#FF512F' }, { offset: 1, color: '#DD2476' }],
  },
  {
    id: 'sunset-tropical', name: 'Tropical', category: 'sunset',
    type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#FF6B6B' }, { offset: 0.4, color: '#FF8E53' }, { offset: 0.7, color: '#FFA751' }, { offset: 1, color: '#FFD600' }],
  },
  {
    id: 'sunset-dusk', name: 'Crepúsculo', category: 'sunset',
    type: 'linear', direction: 'to-top',
    stops: [{ offset: 0, color: '#0F0C29' }, { offset: 0.5, color: '#302B63' }, { offset: 1, color: '#24243E' }],
  },
  {
    id: 'sunset-candy', name: 'Candy', category: 'sunset',
    type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#D4145A' }, { offset: 1, color: '#FBB03B' }],
  },

  // ── OCEAN ──
  {
    id: 'ocean-deep', name: 'Mar Profundo', category: 'ocean',
    type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#1A237E' }, { offset: 1, color: '#006064' }],
  },
  {
    id: 'ocean-wave', name: 'Onda', category: 'ocean',
    type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#43CEA2' }, { offset: 1, color: '#185A9D' }],
  },
  {
    id: 'ocean-fresh', name: 'Água Fresca', category: 'ocean',
    type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#00C9FF' }, { offset: 1, color: '#92FE9D' }],
  },
  {
    id: 'ocean-midnight', name: 'Meia-Noite', category: 'ocean',
    type: 'radial', direction: 'to-right',
    stops: [{ offset: 0, color: '#00D2FF' }, { offset: 1, color: '#0A1628' }],
  },

  // ── NATUREZA ──
  {
    id: 'nature-forest', name: 'Floresta', category: 'natureza',
    type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#134E5E' }, { offset: 1, color: '#71B280' }],
  },
  {
    id: 'nature-spring', name: 'Primavera', category: 'natureza',
    type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#56AB2F' }, { offset: 1, color: '#A8E063' }],
  },
  {
    id: 'nature-earth', name: 'Terra', category: 'natureza',
    type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#8B4513' }, { offset: 0.5, color: '#D2691E' }, { offset: 1, color: '#F4A460' }],
  },
  {
    id: 'nature-lavender', name: 'Lavanda', category: 'natureza',
    type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#E0C3FC' }, { offset: 1, color: '#8EC5FC' }],
  },

  // ── NEON ──
  {
    id: 'neon-pink', name: 'Neon Rosa', category: 'neon',
    type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#FF00CC' }, { offset: 1, color: '#333399' }],
  },
  {
    id: 'neon-green', name: 'Neon Verde', category: 'neon',
    type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#00FF87' }, { offset: 1, color: '#60EFFF' }],
  },
  {
    id: 'neon-cyber', name: 'Cyber', category: 'neon',
    type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#00D2FF' }, { offset: 0.5, color: '#7B2FF7' }, { offset: 1, color: '#FF00CC' }],
  },
  {
    id: 'neon-orange', name: 'Neon Laranja', category: 'neon',
    type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#FF6000' }, { offset: 1, color: '#FFD700' }],
  },

  // ── PASTEL ──
  {
    id: 'pastel-pink', name: 'Rosa Bebê', category: 'pastel',
    type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#FFDDE1' }, { offset: 1, color: '#EE9CA7' }],
  },
  {
    id: 'pastel-blue', name: 'Azul Suave', category: 'pastel',
    type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#E0F7FA' }, { offset: 1, color: '#B2EBF2' }],
  },
  {
    id: 'pastel-lilac', name: 'Lilás', category: 'pastel',
    type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#E8D5F5' }, { offset: 1, color: '#C3B1E1' }],
  },
  {
    id: 'pastel-peach', name: 'Pêssego', category: 'pastel',
    type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#FFE0B2' }, { offset: 1, color: '#FFCCBC' }],
  },
  {
    id: 'pastel-mint', name: 'Menta', category: 'pastel',
    type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#E0F2F1' }, { offset: 1, color: '#B2DFDB' }],
  },

  // ── DARK ──
  {
    id: 'dark-night', name: 'Noite', category: 'dark',
    type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#0F0C29' }, { offset: 0.5, color: '#302B63' }, { offset: 1, color: '#24243E' }],
  },
  {
    id: 'dark-coal', name: 'Carvão', category: 'dark',
    type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#1C1C1C' }, { offset: 1, color: '#383838' }],
  },
  {
    id: 'dark-galaxy', name: 'Galáxia', category: 'dark',
    type: 'radial', direction: 'to-right',
    stops: [{ offset: 0, color: '#2C3E7A' }, { offset: 0.5, color: '#1A1A2E' }, { offset: 1, color: '#0D0D0D' }],
  },
  {
    id: 'dark-wine', name: 'Vinho', category: 'dark',
    type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#4A0000' }, { offset: 1, color: '#8B0000' }],
  },

  // ── METÁLICO ──
  {
    id: 'metalico-ouro', name: 'Ouro', category: 'metalico',
    type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#BF953F' }, { offset: 0.25, color: '#FCF6BA' }, { offset: 0.5, color: '#B38728' }, { offset: 0.75, color: '#FBF5B7' }, { offset: 1, color: '#AA771C' }],
  },
  {
    id: 'metalico-prata', name: 'Prata', category: 'metalico',
    type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#BDBDBD' }, { offset: 0.25, color: '#F5F5F5' }, { offset: 0.5, color: '#9E9E9E' }, { offset: 0.75, color: '#EEEEEE' }, { offset: 1, color: '#757575' }],
  },
  {
    id: 'metalico-rose-gold', name: 'Rose Gold Met.', category: 'metalico',
    type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#B76E79' }, { offset: 0.3, color: '#E8C4BB' }, { offset: 0.6, color: '#C9977A' }, { offset: 1, color: '#8B5E52' }],
  },
  {
    id: 'metalico-bronze', name: 'Bronze', category: 'metalico',
    type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#A0522D' }, { offset: 0.5, color: '#CD853F' }, { offset: 1, color: '#8B4513' }],
  },
];

// Grouped by category
export const GRADIENTS_BY_CATEGORY = GRADIENT_PRESETS.reduce<Record<string, GradientPreset[]>>(
  (acc, g) => {
    if (!acc[g.category]) acc[g.category] = [];
    acc[g.category].push(g);
    return acc;
  },
  {},
);

export const GRADIENT_CATEGORIES: { id: GradientCategory; label: string; emoji: string }[] = [
  { id: 'populares', label: 'Populares', emoji: '⭐' },
  { id: 'sunset',    label: 'Sunset',    emoji: '🌅' },
  { id: 'ocean',     label: 'Oceano',    emoji: '🌊' },
  { id: 'natureza',  label: 'Natureza',  emoji: '🌿' },
  { id: 'neon',      label: 'Neon',      emoji: '💡' },
  { id: 'pastel',    label: 'Pastel',    emoji: '🎀' },
  { id: 'dark',      label: 'Dark',      emoji: '🌑' },
  { id: 'metalico',  label: 'Metálico',  emoji: '✨' },
];
