export type LabelShape =
  | 'round'
  | 'square'
  | 'rounded-square'
  | 'rectangle'
  | 'rounded-rectangle'
  | 'oval'
  | 'hexagon'
  | 'pentagon'
  | 'diamond'
  | 'custom';

export interface LabelFormat {
  id: string;
  shape: LabelShape;
  label: string;
  name?: string;
  widthMm: number;
  heightMm: number;
  widthPx?: number;
  heightPx?: number;
  cornerRadiusMm?: number;
  isCustom?: boolean;
  createdAt?: string;
}

// Convert mm to canvas pixels (at 96 DPI, 1mm ≈ 3.78px; we use a scale factor)
export const MM_TO_PX = 3.7795275591;
export const CANVAS_SCALE = 4;

export function mmToPx(mm: number): number {
  return mm * MM_TO_PX * CANVAS_SCALE;
}

export function pxToMm(px: number): number {
  return px / (MM_TO_PX * CANVAS_SCALE);
}

// Helper to create a LabelFormat from dimensions
function createFormat(
  shape: LabelShape,
  widthMm: number,
  heightMm: number,
  label: string,
  cornerRadiusMm?: number,
  isCustom = false,
): LabelFormat {
  return {
    id: `${shape}-${widthMm}x${heightMm}`,
    shape,
    label,
    name: label,
    widthMm,
    heightMm,
    widthPx: Math.round(mmToPx(widthMm)),
    heightPx: Math.round(mmToPx(heightMm)),
    cornerRadiusMm,
    isCustom,
  };
}

// ============================================================
// SHAPES
// ============================================================
export const LABEL_SHAPES: { id: string; label: string; icon: string }[] = [
  { id: 'round', label: 'Redonda', icon: '●' },
  { id: 'square', label: 'Quadrada', icon: '■' },
  { id: 'rounded-square', label: 'Quadrada arredondada', icon: '▢' },
  { id: 'rectangle', label: 'Retangular', icon: '▬' },
  { id: 'rounded-rectangle', label: 'Retangular arredondada', icon: '▭' },
  { id: 'oval', label: 'Oval', icon: '⬭' },
  { id: 'hexagon', label: 'Hexágono', icon: '⬡' },
  { id: 'pentagon', label: 'Pentágono', icon: '⬠' },
  { id: 'diamond', label: 'Diamante', icon: '◆' },
];

// ============================================================
// PRE-DEFINED FORMATS
// ============================================================
const roundSizes = [4, 5, 6, 7, 8];
const squareSizes = [4, 5, 6, 7, 8];
const rectSizes: [number, number][] = [[4, 2], [5, 3], [6, 4], [7, 4], [8, 5]];

export const ROUND_FORMATS: LabelFormat[] = roundSizes.map(s =>
  createFormat('round', s * 10, s * 10, `Redonda ${s}cm`)
);

export const SQUARE_FORMATS: LabelFormat[] = squareSizes.map(s =>
  createFormat('square', s * 10, s * 10, `Quadrada ${s}cm`)
);

export const ROUNDED_SQUARE_FORMATS: LabelFormat[] = squareSizes.map(s =>
  createFormat('rounded-square', s * 10, s * 10, `Q. Arredondada ${s}cm`, 5)
);

export const RECTANGLE_FORMATS: LabelFormat[] = rectSizes.map(([w, h]) =>
  createFormat('rectangle', w * 10, h * 10, `Retângulo ${w}×${h}cm`)
);

export const ROUNDED_RECTANGLE_FORMATS: LabelFormat[] = rectSizes.map(([w, h]) =>
  createFormat('rounded-rectangle', w * 10, h * 10, `Ret. Arredondado ${w}×${h}cm`, 5)
);

export const SPECIAL_FORMATS: LabelFormat[] = [
  createFormat('oval', 60, 40, 'Oval 6×4cm'),
  createFormat('oval', 80, 50, 'Oval 8×5cm'),
  createFormat('hexagon', 50, 50, 'Hexágono 5cm'),
  createFormat('hexagon', 60, 60, 'Hexágono 6cm'),
  createFormat('pentagon', 50, 50, 'Pentágono 5cm'),
  createFormat('diamond', 50, 60, 'Diamante 5×6cm'),
];

// Backward-compatible: original flat list
export const LABEL_FORMATS: LabelFormat[] = [
  ...ROUND_FORMATS,
  ...SQUARE_FORMATS,
  ...ROUNDED_SQUARE_FORMATS,
  ...RECTANGLE_FORMATS,
  ...ROUNDED_RECTANGLE_FORMATS,
];

// All formats including specials
export const ALL_FORMATS: LabelFormat[] = [
  ...LABEL_FORMATS,
  ...SPECIAL_FORMATS,
];

// Grouped by shape
export const FORMATS_BY_SHAPE: Record<string, LabelFormat[]> = {
  round: ROUND_FORMATS,
  square: SQUARE_FORMATS,
  'rounded-square': ROUNDED_SQUARE_FORMATS,
  rectangle: RECTANGLE_FORMATS,
  'rounded-rectangle': ROUNDED_RECTANGLE_FORMATS,
  oval: SPECIAL_FORMATS.filter(f => f.shape === 'oval'),
  hexagon: SPECIAL_FORMATS.filter(f => f.shape === 'hexagon'),
  pentagon: SPECIAL_FORMATS.filter(f => f.shape === 'pentagon'),
  diamond: SPECIAL_FORMATS.filter(f => f.shape === 'diamond'),
};

export function getFormatsForShape(shape: string): LabelFormat[] {
  return ALL_FORMATS.filter(f => f.shape === shape);
}
