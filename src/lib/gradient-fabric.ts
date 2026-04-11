// Re-exports from the canonical source for backward compatibility
export {
  buildFabricGradient,
  applyGradientToObject,
  applyGradientToBackground,
  gradientToCSS,
  directionToCoords,
} from './label-gradients';

import * as fabric from 'fabric';
import {
  type LabelGradientPreset,
  type GradientStop,
  type GradientType,
  buildFabricGradient,
} from './label-gradients';

/** Remove gradient and set solid color */
export function removeGradientFromObject(
  obj: fabric.FabricObject,
  solidColor = '#FFFFFF',
): void {
  obj.set('fill', solidColor);
  obj.canvas?.requestRenderAll();
}

/** Build a custom gradient from manual stops */
export function buildCustomGradient(
  obj: fabric.FabricObject,
  stops: GradientStop[],
  type: GradientType = 'linear',
  angleDeg = 90,
): InstanceType<typeof fabric.Gradient> {
  const fakePreset: LabelGradientPreset = {
    id: 'custom',
    name: 'Personalizado',
    category: 'personalizado',
    type,
    direction: 'custom-angle',
    angle: angleDeg,
    stops,
  };
  const w = (obj.width ?? 100) * (obj.scaleX ?? 1);
  const h = (obj.height ?? 100) * (obj.scaleY ?? 1);
  return buildFabricGradient(fakePreset, w, h);
}
