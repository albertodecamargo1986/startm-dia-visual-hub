import { useState, useCallback } from 'react';
import * as fabric from 'fabric';
import {
  type LabelGradientPreset,
  type GradientStop,
  type GradientType,
  GRADIENT_PRESETS,
  applyGradientToObject,
  applyGradientToBackground,
} from '@/lib/label-gradients';
import { removeGradientFromObject } from '@/lib/gradient-fabric';
import { toast } from 'sonner';

const CUSTOM_PRESETS_KEY = 'label_custom_gradients';

export function useLabelGradients(
  canvas: fabric.Canvas | null,
  widthPx: number,
  heightPx: number,
  captureHistory: () => void,
) {
  const [customPresets, setCustomPresets] = useState<LabelGradientPreset[]>(
    () => {
      try {
        return JSON.parse(localStorage.getItem(CUSTOM_PRESETS_KEY) || '[]');
      } catch {
        return [];
      }
    },
  );

  const [activeGradientId, setActiveGradientId] = useState<string | null>(null);

  const allPresets = [...GRADIENT_PRESETS, ...customPresets];

  const applyToSelected = useCallback(
    (preset: LabelGradientPreset) => {
      if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (!obj) {
        toast.error('Selecione um objeto primeiro');
        return;
      }
      applyGradientToObject(obj, preset);
      setActiveGradientId(preset.id);
      captureHistory();
    },
    [canvas, captureHistory],
  );

  const applyToBackground = useCallback(
    (preset: LabelGradientPreset) => {
      if (!canvas) return;
      applyGradientToBackground(canvas, preset);
      setActiveGradientId(preset.id);
      captureHistory();
      toast.success('Degradê aplicado ao fundo');
    },
    [canvas, captureHistory],
  );

  const removeFromSelected = useCallback(
    (solidColor?: string) => {
      if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (!obj) return;
      removeGradientFromObject(obj, solidColor);
      setActiveGradientId(null);
      captureHistory();
    },
    [canvas, captureHistory],
  );

  const saveCustomPreset = useCallback(
    (name: string, stops: GradientStop[], type: GradientType, angleDeg: number) => {
      const newPreset: LabelGradientPreset = {
        id: `custom-${Date.now()}`,
        name,
        category: 'personalizado',
        type,
        direction: 'custom-angle',
        angle: angleDeg,
        stops,
      };
      const updated = [...customPresets, newPreset];
      setCustomPresets(updated);
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(updated));
      toast.success(`Degradê "${name}" salvo!`);
      return newPreset;
    },
    [customPresets],
  );

  const deleteCustomPreset = useCallback(
    (id: string) => {
      const updated = customPresets.filter((p) => p.id !== id);
      setCustomPresets(updated);
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(updated));
    },
    [customPresets],
  );

  const selectedHasGradient = useCallback((): boolean => {
    if (!canvas) return false;
    const obj = canvas.getActiveObject();
    if (!obj) return false;
    return typeof obj.fill === 'object' && obj.fill !== null;
  }, [canvas]);

  return {
    allPresets,
    customPresets,
    activeGradientId,
    applyToSelected,
    applyToBackground,
    removeFromSelected,
    saveCustomPreset,
    deleteCustomPreset,
    selectedHasGradient,
  };
}
