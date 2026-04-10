import * as fabric from 'fabric';

// ── Tipos ────────────────────────────────────────────────────

export type GradientType = 'linear' | 'radial' | 'conic';

export type GradientDirection =
  | 'to-right'
  | 'to-left'
  | 'to-bottom'
  | 'to-top'
  | 'to-bottom-right'
  | 'to-bottom-left'
  | 'to-top-right'
  | 'to-top-left'
  | 'custom-angle';

export interface GradientStop {
  offset: number;   // 0 a 1
  color:  string;   // hex ou rgba
  opacity?: number; // 0 a 1
}

export interface LabelGradientPreset {
  id:        string;
  name:      string;
  category:  GradientPresetCategory;
  type:      GradientType;
  direction: GradientDirection;
  angle?:    number;        // graus, quando direction = 'custom-angle'
  stops:     GradientStop[];
}

/** @deprecated Use LabelGradientPreset instead */
export type GradientPreset = LabelGradientPreset;

export type GradientPresetCategory =
  | 'populares'
  | 'pastel'
  | 'neon'
  | 'natureza'
  | 'luxo'
  | 'sunset'
  | 'ocean'
  | 'escuro'
  | 'personalizado';

/** @deprecated Use GradientPresetCategory instead */
export type GradientCategory = GradientPresetCategory;

// ── Direções com ângulos ─────────────────────────────────────

export const DIRECTION_ANGLES: Record<GradientDirection, number> = {
  'to-right':        0,
  'to-bottom-right': 45,
  'to-bottom':       90,
  'to-bottom-left':  135,
  'to-left':         180,
  'to-top-left':     225,
  'to-top':          270,
  'to-top-right':    315,
  'custom-angle':    0,
};

// ── Categorias para exibição ─────────────────────────────────
export const GRADIENT_CATEGORIES: {
  id: GradientPresetCategory;
  label: string;
  emoji: string;
}[] = [
  { id: 'populares',     label: 'Populares', emoji: '⭐' },
  { id: 'pastel',        label: 'Pastel',    emoji: '🌸' },
  { id: 'neon',          label: 'Neon',      emoji: '⚡' },
  { id: 'natureza',      label: 'Natureza',  emoji: '🌿' },
  { id: 'luxo',          label: 'Luxo',      emoji: '💎' },
  { id: 'sunset',        label: 'Sunset',    emoji: '🌅' },
  { id: 'ocean',         label: 'Ocean',     emoji: '🌊' },
  { id: 'escuro',        label: 'Escuro',    emoji: '🌑' },
  { id: 'personalizado', label: 'Meus',      emoji: '🎨' },
];

// ── Presets de Degradê ───────────────────────────────────────
export const GRADIENT_PRESETS: LabelGradientPreset[] = [
  // POPULARES
  { id: 'sunset-warm', name: 'Pôr do Sol', category: 'populares', type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#FF6B6B' }, { offset: 0.5, color: '#FF8E53' }, { offset: 1, color: '#FFC837' }] },
  { id: 'ocean-blue', name: 'Oceano', category: 'populares', type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#2193B0' }, { offset: 1, color: '#6DD5FA' }] },
  { id: 'purple-dream', name: 'Sonho Roxo', category: 'populares', type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#667EEA' }, { offset: 1, color: '#764BA2' }] },
  { id: 'mint-fresh', name: 'Menta', category: 'populares', type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#00B09B' }, { offset: 1, color: '#96C93D' }] },
  { id: 'rose-gold', name: 'Rose Gold', category: 'populares', type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#F7797D' }, { offset: 0.5, color: '#FBD786' }, { offset: 1, color: '#C6FFDD' }] },
  { id: 'night-sky', name: 'Céu Noturno', category: 'populares', type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#0F0C29' }, { offset: 0.5, color: '#302B63' }, { offset: 1, color: '#24243E' }] },
  // PASTEL
  { id: 'pastel-pink', name: 'Rosa Pastel', category: 'pastel', type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#FFDEE9' }, { offset: 1, color: '#B5FFFC' }] },
  { id: 'pastel-peach', name: 'Pêssego Pastel', category: 'pastel', type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#FFE0B2' }, { offset: 1, color: '#FFCCBC' }] },
  { id: 'pastel-lavender', name: 'Lavanda Pastel', category: 'pastel', type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#E8D5F5' }, { offset: 1, color: '#D4E8FF' }] },
  { id: 'pastel-mint', name: 'Menta Pastel', category: 'pastel', type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#C8F6C8' }, { offset: 1, color: '#C8EEF6' }] },
  { id: 'pastel-rainbow', name: 'Arco-íris Pastel', category: 'pastel', type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#FFB3BA' }, { offset: 0.25, color: '#FFDFBA' }, { offset: 0.5, color: '#FFFFBA' }, { offset: 0.75, color: '#BAFFC9' }, { offset: 1, color: '#BAE1FF' }] },
  // NEON
  { id: 'neon-pink', name: 'Neon Rosa', category: 'neon', type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#FF00CC' }, { offset: 1, color: '#333399' }] },
  { id: 'neon-green', name: 'Neon Verde', category: 'neon', type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#00FF87' }, { offset: 1, color: '#60EFFF' }] },
  { id: 'neon-cyber', name: 'Cyber', category: 'neon', type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#F7FF00' }, { offset: 1, color: '#DB36A4' }] },
  { id: 'neon-aurora', name: 'Aurora Neon', category: 'neon', type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#00C9FF' }, { offset: 0.5, color: '#92FE9D' }, { offset: 1, color: '#FF61D2' }] },
  // NATUREZA
  { id: 'nature-forest', name: 'Floresta', category: 'natureza', type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#134E5E' }, { offset: 1, color: '#71B280' }] },
  { id: 'nature-earth', name: 'Terra', category: 'natureza', type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#8B5E3C' }, { offset: 1, color: '#D4A96A' }] },
  { id: 'nature-spring', name: 'Primavera', category: 'natureza', type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#56AB2F' }, { offset: 1, color: '#A8E063' }] },
  // LUXO
  { id: 'luxury-gold', name: 'Ouro', category: 'luxo', type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#B8860B' }, { offset: 0.3, color: '#FFD700' }, { offset: 0.6, color: '#DAA520' }, { offset: 1, color: '#B8860B' }] },
  { id: 'luxury-silver', name: 'Prata', category: 'luxo', type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#BDC3C7' }, { offset: 0.5, color: '#FFFFFF' }, { offset: 1, color: '#BDC3C7' }] },
  { id: 'luxury-black-gold', name: 'Preto & Ouro', category: 'luxo', type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#1A1A1A' }, { offset: 0.5, color: '#C9A84C' }, { offset: 1, color: '#1A1A1A' }] },
  { id: 'luxury-rose-gold', name: 'Ouro Rosé', category: 'luxo', type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#B76E79' }, { offset: 0.5, color: '#EFCFBF' }, { offset: 1, color: '#B76E79' }] },
  // SUNSET
  { id: 'sunset-magenta', name: 'Magenta Sunset', category: 'sunset', type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#FF512F' }, { offset: 1, color: '#DD2476' }] },
  { id: 'sunset-tropical', name: 'Tropical', category: 'sunset', type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#F7971E' }, { offset: 1, color: '#FFD200' }] },
  { id: 'sunset-dusk', name: 'Entardecer', category: 'sunset', type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#2C3E50' }, { offset: 0.5, color: '#FD746C' }, { offset: 1, color: '#FF9068' }] },
  // OCEAN
  { id: 'ocean-deep', name: 'Mar Profundo', category: 'ocean', type: 'radial', direction: 'to-right',
    stops: [{ offset: 0, color: '#00D2FF' }, { offset: 1, color: '#001A6E' }] },
  { id: 'ocean-turquoise', name: 'Turquesa', category: 'ocean', type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#43C6AC' }, { offset: 1, color: '#191654' }] },
  { id: 'ocean-aqua', name: 'Aqua', category: 'ocean', type: 'linear', direction: 'to-right',
    stops: [{ offset: 0, color: '#7EC8E3' }, { offset: 1, color: '#0057B7' }] },
  // ESCURO
  { id: 'dark-space', name: 'Espaço', category: 'escuro', type: 'radial', direction: 'to-right',
    stops: [{ offset: 0, color: '#1A1A2E' }, { offset: 0.5, color: '#16213E' }, { offset: 1, color: '#0F3460' }] },
  { id: 'dark-carbon', name: 'Carbon', category: 'escuro', type: 'linear', direction: 'to-bottom-right',
    stops: [{ offset: 0, color: '#1C1C1C' }, { offset: 1, color: '#2D2D2D' }] },
  { id: 'dark-noir', name: 'Noir', category: 'escuro', type: 'linear', direction: 'to-bottom',
    stops: [{ offset: 0, color: '#000000' }, { offset: 0.5, color: '#434343' }, { offset: 1, color: '#000000' }] },
];


export function directionToCoords(
  direction: GradientDirection,
  width: number,
  height: number,
  customAngle?: number,
): { x1: number; y1: number; x2: number; y2: number } {
  if (direction === 'custom-angle' && customAngle !== undefined) {
    const rad = (customAngle * Math.PI) / 180;
    const cx = width / 2;
    const cy = height / 2;
    const len = Math.max(width, height) / 2;
    return {
      x1: cx - Math.cos(rad) * len,
      y1: cy - Math.sin(rad) * len,
      x2: cx + Math.cos(rad) * len,
      y2: cy + Math.sin(rad) * len,
    };
  }

  const cx = width / 2;
  const cy = height / 2;
  const map: Record<Exclude<GradientDirection, 'custom-angle'>, { x1: number; y1: number; x2: number; y2: number }> = {
    'to-right':        { x1: 0,     y1: cy,     x2: width,  y2: cy     },
    'to-left':         { x1: width, y1: cy,     x2: 0,      y2: cy     },
    'to-bottom':       { x1: cx,    y1: 0,      x2: cx,     y2: height },
    'to-top':          { x1: cx,    y1: height, x2: cx,     y2: 0      },
    'to-bottom-right': { x1: 0,     y1: 0,      x2: width,  y2: height },
    'to-bottom-left':  { x1: width, y1: 0,      x2: 0,      y2: height },
    'to-top-right':    { x1: 0,     y1: height, x2: width,  y2: 0      },
    'to-top-left':     { x1: width, y1: height, x2: 0,      y2: 0      },
  };
  return map[direction as Exclude<GradientDirection, 'custom-angle'>] ?? map['to-right'];
}

// ── Build Fabric.Gradient from preset data ──
export function buildFabricGradient(
  preset: LabelGradientPreset,
  objWidth: number,
  objHeight: number,
): InstanceType<typeof fabric.Gradient> {
  const colorStops = preset.stops.map((s) => ({
    offset: s.offset,
    color: s.opacity !== undefined && s.opacity < 1
      ? hexToRgba(s.color, s.opacity)
      : s.color,
  }));

  if (preset.type === 'radial') {
    return new fabric.Gradient({
      type: 'radial',
      gradientUnits: 'pixels',
      coords: {
        x1: objWidth / 2,
        y1: objHeight / 2,
        r1: 0,
        x2: objWidth / 2,
        y2: objHeight / 2,
        r2: Math.max(objWidth, objHeight) / 2,
      },
      colorStops,
    });
  }

  // conic falls back to linear in Fabric.js (no native conic support)
  const coords = directionToCoords(preset.direction, objWidth, objHeight, preset.angle);
  return new fabric.Gradient({
    type: 'linear',
    gradientUnits: 'pixels',
    coords,
    colorStops,
  });
}

// ── Apply gradient to a Fabric object ──
export function applyGradientToObject(
  obj: fabric.FabricObject,
  preset: LabelGradientPreset,
): void {
  const w = (obj.width ?? 100) * (obj.scaleX ?? 1);
  const h = (obj.height ?? 100) * (obj.scaleY ?? 1);
  const gradient = buildFabricGradient(preset, w, h);
  obj.set('fill', gradient);
  obj.canvas?.requestRenderAll();
}

// ── Apply gradient to canvas background ──
export function applyGradientToBackground(
  canvas: fabric.Canvas,
  preset: LabelGradientPreset,
): void {
  const w = canvas.width ?? 500;
  const h = canvas.height ?? 500;
  const gradient = buildFabricGradient(preset, w, h);
  canvas.set('backgroundColor', gradient as any);
  canvas.requestRenderAll();
}

// ── Generate CSS preview string (for UI) ──
export function gradientToCSS(preset: LabelGradientPreset): string {
  const stops = preset.stops
    .map((s) => {
      const color = s.opacity !== undefined && s.opacity < 1
        ? hexToRgba(s.color, s.opacity)
        : s.color;
      return `${color} ${s.offset * 100}%`;
    })
    .join(', ');

  if (preset.type === 'radial') {
    return `radial-gradient(circle, ${stops})`;
  }

  if (preset.type === 'conic') {
    return `conic-gradient(from ${preset.angle ?? 0}deg, ${stops})`;
  }

  if (preset.direction === 'custom-angle') {
    return `linear-gradient(${preset.angle ?? 0}deg, ${stops})`;
  }

  const dirMap: Record<Exclude<GradientDirection, 'custom-angle'>, string> = {
    'to-right':        'to right',
    'to-left':         'to left',
    'to-bottom':       'to bottom',
    'to-top':          'to top',
    'to-bottom-right': 'to bottom right',
    'to-bottom-left':  'to bottom left',
    'to-top-right':    'to top right',
    'to-top-left':     'to top left',
  };

  return `linear-gradient(${dirMap[preset.direction as Exclude<GradientDirection, 'custom-angle'>] ?? 'to right'}, ${stops})`;
}

// ── Utility: hex to rgba string ──
function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
