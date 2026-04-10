import { useState, useEffect } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import type { LabelTemplate } from './label-templates';

export async function generateTemplateThumbnail(
  template: LabelTemplate,
  widthPx: number,
  heightPx: number,
  size = 200,
): Promise<string> {
  const el = document.createElement('canvas');
  el.width = size;
  el.height = size;
  el.style.display = 'none';
  document.body.appendChild(el);

  const fc = new FabricCanvas(el, {
    width: size,
    height: size,
    backgroundColor: '#FFFFFF',
  });

  const scaleX = size / widthPx;
  const scaleY = size / heightPx;

  // getObjects receives mm values — convert px back to mm for templates that expect mm
  const MM_TO_PX = 3.7795;
  const widthMm = widthPx / MM_TO_PX;
  const heightMm = heightPx / MM_TO_PX;

  try {
    const objects = template.getObjects(widthMm, heightMm);
    for (const obj of objects) {
      obj.set({
        scaleX: (obj.scaleX || 1) * scaleX,
        scaleY: (obj.scaleY || 1) * scaleY,
        left: (obj.left || 0) * scaleX,
        top: (obj.top || 0) * scaleY,
        selectable: false,
      });
      fc.add(obj);
    }
    fc.renderAll();

    const dataUrl = fc.toDataURL({ format: 'jpeg', quality: 0.8 } as any);
    return dataUrl;
  } finally {
    fc.dispose();
    document.body.removeChild(el);
  }
}

export function useTemplateThumbnails(
  templates: LabelTemplate[],
  widthPx: number,
  heightPx: number,
) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!widthPx || !heightPx || templates.length === 0) return;

    let cancelled = false;

    const generate = async () => {
      const result: Record<string, string> = {};
      for (const template of templates) {
        if (cancelled) break;
        try {
          result[template.id] = await generateTemplateThumbnail(
            template,
            widthPx,
            heightPx,
          );
        } catch (e) {
          console.warn(`Falha ao gerar thumbnail: ${template.id}`, e);
        }
      }
      if (!cancelled) setThumbnails(result);
    };

    generate();
    return () => { cancelled = true; };
  }, [templates, widthPx, heightPx]);

  return thumbnails;
}
