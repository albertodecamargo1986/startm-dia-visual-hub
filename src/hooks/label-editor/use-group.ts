import type { Canvas as FabricCanvas, ActiveSelection, Group } from 'fabric';

export function groupSelected(canvas: FabricCanvas) {
  const active = canvas.getActiveObject();
  if (!active || active.type !== 'activeSelection') return;
  const group = (active as ActiveSelection).toGroup();
  group.set({ data: { type: 'group' } });
  canvas.requestRenderAll();
}

export function ungroupSelected(canvas: FabricCanvas) {
  const active = canvas.getActiveObject();
  if (!active || active.type !== 'group') return;
  (active as Group).toActiveSelection();
  canvas.requestRenderAll();
}
