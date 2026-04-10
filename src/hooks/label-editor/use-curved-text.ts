import { IText, Group } from 'fabric';

export function buildCurvedText(
  text: string,
  radius: number,
  fontSize: number,
  fontFamily: string,
  color: string,
  centerX: number,
  centerY: number
): Group {
  const chars = text.split('');
  const angleStep = (2 * Math.PI) / (chars.length * 2.5);
  const objects: IText[] = [];

  chars.forEach((char, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const charObj = new IText(char, {
      left: x,
      top: y,
      fontSize,
      fontFamily,
      fill: color,
      originX: 'center',
      originY: 'center',
      angle: (angle * 180) / Math.PI + 90,
      selectable: false,
    });
    objects.push(charObj);
  });

  return new Group(objects, {
    left: centerX,
    top: centerY,
    originX: 'center',
    originY: 'center',
  });
}
