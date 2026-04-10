import type { LabelFormat } from '@/lib/label-formats';

interface Props {
  format: LabelFormat;
  size?: number;
  isSelected?: boolean;
}

export function FormatPreview({ format, size = 50, isSelected }: Props) {
  const { shape, widthMm, heightMm, cornerRadiusMm } = format;

  const maxDim = Math.max(widthMm, heightMm);
  const scaleW = (widthMm / maxDim) * size;
  const scaleH = (heightMm / maxDim) * size;
  const color = isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))';
  const fill = isSelected ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--muted-foreground) / 0.06)';
  const radius = cornerRadiusMm ? (cornerRadiusMm / maxDim) * size : 0;

  const cx = size / 2;
  const cy = size / 2;
  const x = cx - scaleW / 2;
  const y = cy - scaleH / 2;

  const renderShape = () => {
    switch (shape) {
      case 'round':
        return (
          <ellipse cx={cx} cy={cy} rx={scaleW / 2} ry={scaleW / 2}
            fill={fill} stroke={color} strokeWidth={1.5} />
        );
      case 'oval':
        return (
          <ellipse cx={cx} cy={cy} rx={scaleW / 2} ry={scaleH / 2}
            fill={fill} stroke={color} strokeWidth={1.5} />
        );
      case 'square':
        return (
          <rect x={x} y={y} width={scaleW} height={scaleH}
            fill={fill} stroke={color} strokeWidth={1.5} />
        );
      case 'rounded-square':
      case 'rounded-rectangle':
        return (
          <rect x={x} y={y} width={scaleW} height={scaleH} rx={radius} ry={radius}
            fill={fill} stroke={color} strokeWidth={1.5} />
        );
      case 'rectangle':
        return (
          <rect x={x} y={y} width={scaleW} height={scaleH}
            fill={fill} stroke={color} strokeWidth={1.5} />
        );
      case 'hexagon': {
        const r = scaleW / 2;
        const pts = Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        }).join(' ');
        return <polygon points={pts} fill={fill} stroke={color} strokeWidth={1.5} />;
      }
      case 'pentagon': {
        const r = scaleW / 2;
        const pts = Array.from({ length: 5 }, (_, i) => {
          const a = (2 * Math.PI / 5) * i - Math.PI / 2;
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        }).join(' ');
        return <polygon points={pts} fill={fill} stroke={color} strokeWidth={1.5} />;
      }
      case 'diamond': {
        const pts = [
          `${cx},${y}`, `${x + scaleW},${cy}`, `${cx},${y + scaleH}`, `${x},${cy}`,
        ].join(' ');
        return <polygon points={pts} fill={fill} stroke={color} strokeWidth={1.5} />;
      }
      default:
        return (
          <rect x={x} y={y} width={scaleW} height={scaleH}
            fill={fill} stroke={color} strokeWidth={1.5} />
        );
    }
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      {renderShape()}
    </svg>
  );
}
