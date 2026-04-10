import * as fabric from 'fabric';

export type GradientType = 'linear' | 'radial';

export type GradientDirection =
  | 'to-right'
  | 'to-left'
  | 'to-bottom'
  | 'to-top'
  | 'to-bottom-right'
  | 'to-bottom-left'
  | 'to-top-right'
  | 'to-top-left';

export interface GradientStop {
  offset: number; // 0 to 1
  color: string;  // hex or rgba
}

export interface GradientPreset {
  id: string;
  name: string;
  type: GradientType;
  direction: GradientDirection;
  stops: GradientStop[];
  category: GradientCategory;
}

export type GradientCategory =
  | 'populares'
  | 'sunset'
  | 'ocean'
  | 'natureza'
  | 'neon'
  | 'pastel'
  | 'dark'
  | 'metalico'
  | 'personalizado';

// ── Convert direction to Fabric.js coordinates ──
export function directionToCoords(
  direction: GradientDirection,
  width: number,
  height: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const cx = width / 2;
  const cy = height / 2;
  const map: Record<GradientDirection, { x1: number; y1: number; x2: number; y2: number }> = {
    'to-right':        { x1: 0,     y1: cy,     x2: width,  y2: cy     },
    'to-left':         { x1: width, y1: cy,     x2: 0,      y2: cy     },
    'to-bottom':       { x1: cx,    y1: 0,      x2: cx,     y2: height },
    'to-top':          { x1: cx,    y1: height, x2: cx,     y2: 0      },
    'to-bottom-right': { x1: 0,     y1: 0,      x2: width,  y2: height },
    'to-bottom-left':  { x1: width, y1: 0,      x2: 0,      y2: height },
    'to-top-right':    { x1: 0,     y1: height, x2: width,  y2: 0      },
    'to-top-left':     { x1: width, y1: height, x2: 0,      y2: 0      },
  };
  return map[direction];
}

// ── Build Fabric.Gradient from preset data ──
export function buildFabricGradient(
  preset: GradientPreset,
  objWidth: number,
  objHeight: number,
): InstanceType<typeof fabric.Gradient> {
  const colorStops = preset.stops.map((s) => ({
    offset: s.offset,
    color: s.color,
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

  const coords = directionToCoords(preset.direction, objWidth, objHeight);
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
  preset: GradientPreset,
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
  preset: GradientPreset,
): void {
  const w = canvas.width ?? 500;
  const h = canvas.height ?? 500;
  const gradient = buildFabricGradient(preset, w, h);
  canvas.set('backgroundColor', gradient as any);
  canvas.requestRenderAll();
}

// ── Generate CSS preview string (for UI) ──
export function gradientToCSS(preset: GradientPreset): string {
  const stops = preset.stops
    .map((s) => `${s.color} ${s.offset * 100}%`)
    .join(', ');

  if (preset.type === 'radial') {
    return `radial-gradient(circle, ${stops})`;
  }

  const dirMap: Record<GradientDirection, string> = {
    'to-right':        'to right',
    'to-left':         'to left',
    'to-bottom':       'to bottom',
    'to-top':          'to top',
    'to-bottom-right': 'to bottom right',
    'to-bottom-left':  'to bottom left',
    'to-top-right':    'to top right',
    'to-top-left':     'to top left',
  };

  return `linear-gradient(${dirMap[preset.direction]}, ${stops})`;
}
