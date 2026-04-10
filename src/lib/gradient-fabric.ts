import * as fabric from 'fabric';
import {
  type LabelGradientPreset,
  type GradientStop,
  type GradientType,
  DIRECTION_ANGLES,
} from './label-gradients';

// Converte ângulo em coordenadas do gradiente linear (0..1)
function angleToCoords(angleDeg: number): {
  x1: number; y1: number; x2: number; y2: number;
} {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x1: 0.5 - Math.cos(rad) * 0.5,
    y1: 0.5 - Math.sin(rad) * 0.5,
    x2: 0.5 + Math.cos(rad) * 0.5,
    y2: 0.5 + Math.sin(rad) * 0.5,
  };
}

// Cria fabric.Gradient a partir de um preset
export function buildFabricGradient(
  preset: LabelGradientPreset,
  obj: fabric.FabricObject,
  customAngle?: number,
): InstanceType<typeof fabric.Gradient> {
  const w = obj.width || 100;
  const h = obj.height || 100;

  const angle =
    preset.direction === 'custom-angle'
      ? (customAngle ?? 0)
      : DIRECTION_ANGLES[preset.direction];

  const colorStops = preset.stops.map((s) => ({
    offset: s.offset,
    color: s.color,
    opacity: s.opacity ?? 1,
  }));

  if (preset.type === 'radial') {
    return new fabric.Gradient({
      type: 'radial',
      gradientUnits: 'pixels',
      coords: {
        x1: w / 2,
        y1: h / 2,
        r1: 0,
        x2: w / 2,
        y2: h / 2,
        r2: Math.max(w, h) / 2,
      },
      colorStops,
    });
  }

  // Linear (conic falls back to linear in Fabric.js)
  const coords = angleToCoords(angle);
  return new fabric.Gradient({
    type: 'linear',
    gradientUnits: 'percentage',
    coords: {
      x1: coords.x1,
      y1: coords.y1,
      x2: coords.x2,
      y2: coords.y2,
    },
    colorStops,
  });
}

// Aplica gradiente em qualquer fabric.Object
export function applyGradientToObject(
  obj: fabric.FabricObject,
  preset: LabelGradientPreset,
  customAngle?: number,
): void {
  const gradient = buildFabricGradient(preset, obj, customAngle);
  obj.set('fill', gradient);
  obj.canvas?.requestRenderAll();
}

// Aplica gradiente no fundo do canvas (rect de fundo)
export function applyGradientToBackground(
  canvas: fabric.Canvas,
  preset: LabelGradientPreset,
  widthPx: number,
  heightPx: number,
  customAngle?: number,
): void {
  const bgObj = canvas.getObjects().find(
    (o: any) => o.data?.isBackground,
  );

  if (!bgObj) {
    const rect = new fabric.Rect({
      left: 0,
      top: 0,
      width: widthPx,
      height: heightPx,
      selectable: false,
      evented: false,
      data: { isBackground: true },
    } as any);
    canvas.add(rect);
    canvas.sendObjectToBack(rect);
    applyGradientToObject(rect, preset, customAngle);
  } else {
    applyGradientToObject(bgObj, preset, customAngle);
  }
}

// Remove gradiente e volta para cor sólida
export function removeGradientFromObject(
  obj: fabric.FabricObject,
  solidColor = '#FFFFFF',
): void {
  obj.set('fill', solidColor);
  obj.canvas?.requestRenderAll();
}

// Constrói degradê customizado a partir de stops manuais
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
  return buildFabricGradient(fakePreset, obj, angleDeg);
}

// Serializa gradiente para salvar no canvas_json
export function serializeGradient(
  preset: LabelGradientPreset,
  customAngle?: number,
): object {
  return {
    gradientPresetId: preset.id,
    gradientType: preset.type,
    gradientAngle: customAngle ?? DIRECTION_ANGLES[preset.direction],
    gradientStops: preset.stops,
  };
}
