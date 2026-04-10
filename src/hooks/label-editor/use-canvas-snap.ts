import { Canvas, Line } from 'fabric';

export function setupSmartGuides(canvas: Canvas) {
  const THRESHOLD = 8;
  const guideLines: Line[] = [];

  function clearGuides() {
    guideLines.forEach((l) => canvas.remove(l));
    guideLines.length = 0;
  }

  function drawGuide(x1: number, y1: number, x2: number, y2: number) {
    const line = new Line([x1, y1, x2, y2], {
      stroke: '#00BFFF',
      strokeWidth: 1,
      strokeDashArray: [4, 4],
      selectable: false,
      evented: false,
    });
    canvas.add(line);
    guideLines.push(line);
  }

  canvas.on('object:moving', (e) => {
    clearGuides();
    const moving = e.target!;
    const movingCenter = moving.getCenterPoint();

    canvas.getObjects().forEach((obj) => {
      if (obj === moving) return;
      const objCenter = obj.getCenterPoint();

      if (Math.abs(movingCenter.y - objCenter.y) < THRESHOLD) {
        moving.set('top', obj.top);
        drawGuide(0, objCenter.y, canvas.width!, objCenter.y);
      }

      if (Math.abs(movingCenter.x - objCenter.x) < THRESHOLD) {
        moving.set('left', obj.left);
        drawGuide(objCenter.x, 0, objCenter.x, canvas.height!);
      }
    });

    canvas.requestRenderAll();
  });

  canvas.on('object:modified', clearGuides);
  canvas.on('mouse:up', clearGuides);
}
