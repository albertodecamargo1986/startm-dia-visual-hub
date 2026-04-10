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

// ── Convert direction to Fabric.js coordinates ──
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
