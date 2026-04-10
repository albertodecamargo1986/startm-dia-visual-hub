import { useState, useCallback } from 'react';
import * as fabric from 'fabric';
import {
  type LabelGradientPreset,
  type GradientStop,
  type GradientType,
  type GradientDirection,
  applyGradientToObject,
  applyGradientToBackground,
  gradientToCSS,
} from '@/lib/label-gradients';

interface UseGradientProps {
  canvas: fabric.Canvas | null;
  onHistoryCapture?: () => void;
}

export function useGradient({ canvas, onHistoryCapture }: UseGradientProps) {
  const [customStops, setCustomStops] = useState<GradientStop[]>([
    { offset: 0, color: '#3B82F6' },
    { offset: 1, color: '#8B5CF6' },
  ]);
  const [customType, setCustomType] = useState<GradientType>('linear');
  const [customDirection, setCustomDirection] = useState<GradientDirection>('to-right');
  const [customAngle, setCustomAngle] = useState(0);
  const [gradientTarget, setGradientTarget] = useState<'fill' | 'background'>('fill');

  const applyPreset = useCallback(
    (preset: LabelGradientPreset, target: 'fill' | 'background' = 'fill') => {
      if (!canvas) return;
      if (target === 'background') {
        applyGradientToBackground(canvas, preset);
        onHistoryCapture?.();
        return;
      }
      const obj = canvas.getActiveObject();
      if (!obj) return;
      applyGradientToObject(obj, preset);
      onHistoryCapture?.();
    },
    [canvas, onHistoryCapture],
  );

  const applyCustomGradient = useCallback(
    (target: 'fill' | 'background' = 'fill') => {
      if (!canvas) return;
      const customPreset: LabelGradientPreset = {
        id: 'custom', name: 'Personalizado', category: 'personalizado',
        type: customType, direction: customDirection,
        angle: customDirection === 'custom-angle' ? customAngle : undefined,
        stops: customStops,
      };
      if (target === 'background') {
        applyGradientToBackground(canvas, customPreset);
      } else {
        const obj = canvas.getActiveObject();
        if (!obj) return;
        applyGradientToObject(obj, customPreset);
      }
      onHistoryCapture?.();
    },
    [canvas, customType, customDirection, customAngle, customStops, onHistoryCapture],
  );

  const removeGradient = useCallback(
    (color = '#FFFFFF') => {
      if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (!obj) return;
      obj.set('fill', color);
      canvas.requestRenderAll();
      onHistoryCapture?.();
    },
    [canvas, onHistoryCapture],
  );

  const addStop = useCallback(() => {
    if (customStops.length >= 5) return;
    const lastOffset = customStops[customStops.length - 1].offset;
    setCustomStops((prev) => [...prev, { offset: Math.min(lastOffset + 0.2, 1), color: '#FFFFFF' }]);
  }, [customStops]);

  const removeStop = useCallback(
    (index: number) => {
      if (customStops.length <= 2) return;
      setCustomStops((prev) => prev.filter((_, i) => i !== index));
    },
    [customStops],
  );

  const updateStop = useCallback(
    (index: number, field: keyof GradientStop, value: string | number) => {
      setCustomStops((prev) =>
        prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
      );
    },
    [],
  );

  const customGradientCSS = gradientToCSS({
    id: 'custom', name: '', category: 'personalizado',
    type: customType, direction: customDirection,
    angle: customDirection === 'custom-angle' ? customAngle : undefined,
    stops: customStops,
  });

  return {
    customStops, customType, customDirection, customAngle, gradientTarget, customGradientCSS,
    setCustomType, setCustomDirection, setCustomAngle, setGradientTarget,
    applyPreset, applyCustomGradient, removeGradient,
    addStop, removeStop, updateStop,
  };
}
