import { Gradient, type FabricObject } from 'fabric';

export function applyGradient(
  obj: FabricObject,
  color1: string,
  color2: string,
  angle: number = 0,
) {
  const rad = (angle * Math.PI) / 180;
  const gradient = new Gradient({
    type: 'linear',
    gradientUnits: 'percentage',
    coords: {
      x1: Math.cos(rad) * -0.5 + 0.5,
      y1: Math.sin(rad) * -0.5 + 0.5,
      x2: Math.cos(rad) * 0.5 + 0.5,
      y2: Math.sin(rad) * 0.5 + 0.5,
    },
    colorStops: [
      { offset: 0, color: color1 },
      { offset: 1, color: color2 },
    ],
  });

  obj.set('fill', gradient);
  obj.canvas?.requestRenderAll();
}
