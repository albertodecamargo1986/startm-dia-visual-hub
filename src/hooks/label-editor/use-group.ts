import { Group, type Canvas as FabricCanvas } from 'fabric';

export function groupSelected(canvas: FabricCanvas) {
  const active = canvas.getActiveObject();
  if (!active || active.type !== 'activeSelection') return;

  const objects = canvas.getActiveObjects();
  canvas.discardActiveObject();

  const group = new Group(objects, { interactive: true });
  objects.forEach((o) => canvas.remove(o));
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
}

export function ungroupSelected(canvas: FabricCanvas) {
  const active = canvas.getActiveObject();
  if (!active || !(active instanceof Group)) return;

  const items = active.removeAll();
  canvas.remove(active);
  items.forEach((o) => canvas.add(o));
  canvas.requestRenderAll();
}
