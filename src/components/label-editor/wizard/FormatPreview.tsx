import type { LabelFormat } from '@/lib/label-formats';

interface Props {
  format: LabelFormat;
  size?: number;
}

export function FormatPreview({ format, size = 40 }: Props) {
  const { shape, widthMm, heightMm } = format;
  const aspect = widthMm / heightMm;
  const w = aspect >= 1 ? size : size * aspect;
  const h = aspect >= 1 ? size / aspect : size;

  const commonProps = {
    className: 'text-primary/60',
    style: { width: w, height: h } as React.CSSProperties,
  };

  switch (shape) {
    case 'round':
      return (
        <div
          {...commonProps}
          className="border-2 border-primary/40 rounded-full bg-primary/10"
          style={{ width: Math.min(w, h), height: Math.min(w, h) }}
        />
      );
    case 'square':
      return (
        <div
          className="border-2 border-primary/40 bg-primary/10"
          style={{ width: Math.min(w, h), height: Math.min(w, h) }}
        />
      );
    case 'rounded-square':
      return (
        <div
          className="border-2 border-primary/40 bg-primary/10 rounded-lg"
          style={{ width: Math.min(w, h), height: Math.min(w, h) }}
        />
      );
    case 'rectangle':
      return (
        <div
          className="border-2 border-primary/40 bg-primary/10"
          style={{ width: w, height: h }}
        />
      );
    case 'rounded-rectangle':
      return (
        <div
          className="border-2 border-primary/40 bg-primary/10 rounded-md"
          style={{ width: w, height: h }}
        />
      );
    case 'oval':
      return (
        <div
          className="border-2 border-primary/40 bg-primary/10 rounded-full"
          style={{ width: w, height: h }}
        />
      );
    case 'hexagon':
      return (
        <svg width={w} height={h} viewBox="0 0 100 100" className="text-primary/40">
          <polygon
            points="50,2 95,25 95,75 50,98 5,75 5,25"
            fill="hsl(var(--primary) / 0.1)"
            stroke="currentColor"
            strokeWidth="4"
          />
        </svg>
      );
    case 'pentagon':
      return (
        <svg width={w} height={h} viewBox="0 0 100 100" className="text-primary/40">
          <polygon
            points="50,2 97,38 80,95 20,95 3,38"
            fill="hsl(var(--primary) / 0.1)"
            stroke="currentColor"
            strokeWidth="4"
          />
        </svg>
      );
    case 'diamond':
      return (
        <svg width={w} height={h} viewBox="0 0 100 120" className="text-primary/40">
          <polygon
            points="50,2 98,60 50,118 2,60"
            fill="hsl(var(--primary) / 0.1)"
            stroke="currentColor"
            strokeWidth="4"
          />
        </svg>
      );
    default:
      return (
        <div
          className="border-2 border-dashed border-primary/40 bg-primary/10 rounded"
          style={{ width: w, height: h }}
        />
      );
  }
}
