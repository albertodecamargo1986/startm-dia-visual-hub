export interface LabelFormat {
  id: string;
  shape: 'round' | 'square' | 'rounded-square' | 'rectangle' | 'rounded-rectangle';
  label: string;
  widthMm: number;
  heightMm: number;
}

export const LABEL_SHAPES: { id: string; label: string; icon: string }[] = [
  { id: 'round', label: 'Redonda', icon: '●' },
  { id: 'square', label: 'Quadrada', icon: '■' },
  { id: 'rounded-square', label: 'Quadrada arredondada', icon: '▢' },
  { id: 'rectangle', label: 'Retangular', icon: '▬' },
  { id: 'rounded-rectangle', label: 'Retangular arredondada', icon: '▭' },
];

const roundSizes = [4, 5, 6, 7, 8];
const squareSizes = [4, 5, 6, 7, 8];
const rectSizes: [number, number][] = [[4, 2], [5, 3], [6, 4], [7, 4], [8, 5]];

export const LABEL_FORMATS: LabelFormat[] = [
  ...roundSizes.map(s => ({ id: `round-${s}x${s}`, shape: 'round' as const, label: `${s}×${s} cm`, widthMm: s * 10, heightMm: s * 10 })),
  ...squareSizes.map(s => ({ id: `square-${s}x${s}`, shape: 'square' as const, label: `${s}×${s} cm`, widthMm: s * 10, heightMm: s * 10 })),
  ...squareSizes.map(s => ({ id: `rounded-square-${s}x${s}`, shape: 'rounded-square' as const, label: `${s}×${s} cm`, widthMm: s * 10, heightMm: s * 10 })),
  ...rectSizes.map(([w, h]) => ({ id: `rectangle-${w}x${h}`, shape: 'rectangle' as const, label: `${w}×${h} cm`, widthMm: w * 10, heightMm: h * 10 })),
  ...rectSizes.map(([w, h]) => ({ id: `rounded-rectangle-${w}x${h}`, shape: 'rounded-rectangle' as const, label: `${w}×${h} cm`, widthMm: w * 10, heightMm: h * 10 })),
];

export function getFormatsForShape(shape: string): LabelFormat[] {
  return LABEL_FORMATS.filter(f => f.shape === shape);
}

// Convert mm to canvas pixels (at 96 DPI, 1mm ≈ 3.78px; we use a scale factor)
export const MM_TO_PX = 3.7795275591; // 1mm in px at 96dpi
export const CANVAS_SCALE = 4; // scale up for better resolution
export function mmToPx(mm: number): number {
  return mm * MM_TO_PX * CANVAS_SCALE;
}
export function pxToMm(px: number): number {
  return px / (MM_TO_PX * CANVAS_SCALE);
}
