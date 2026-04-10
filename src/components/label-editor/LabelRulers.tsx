import React from 'react';

interface LabelRulersProps {
  zoom: number;
  offsetX: number;
  offsetY: number;
  widthMm: number;
  heightMm: number;
}

const MM_TO_PX_BASE = 3.7795;

export function LabelRulers({ zoom, offsetX, offsetY, widthMm, heightMm }: LabelRulersProps) {
  const mmToPx = MM_TO_PX_BASE * zoom;
  const totalWidthPx = widthMm * mmToPx + offsetX + 24;
  const totalHeightPx = heightMm * mmToPx + offsetY + 24;
  const tickInterval = zoom < 0.5 ? 10 : zoom < 1 ? 5 : 1;

  const horizontalTicks: React.ReactNode[] = [];
  for (let mm = 0; mm <= widthMm; mm += tickInterval) {
    const x = offsetX + mm * mmToPx;
    const isMajor = mm % 10 === 0;
    horizontalTicks.push(
      <g key={`h-${mm}`}>
        <line x1={x} y1={isMajor ? 10 : 16} x2={x} y2={24} stroke="hsl(var(--muted-foreground))" strokeWidth={isMajor ? 1 : 0.5} />
        {isMajor && (
          <text x={x} y={9} fontSize={8} textAnchor="middle" fill="hsl(var(--muted-foreground))">
            {mm}
          </text>
        )}
      </g>,
    );
  }

  const verticalTicks: React.ReactNode[] = [];
  for (let mm = 0; mm <= heightMm; mm += tickInterval) {
    const y = offsetY + mm * mmToPx;
    const isMajor = mm % 10 === 0;
    verticalTicks.push(
      <g key={`v-${mm}`}>
        <line x1={isMajor ? 10 : 16} y1={y} x2={24} y2={y} stroke="hsl(var(--muted-foreground))" strokeWidth={isMajor ? 1 : 0.5} />
        {isMajor && (
          <text x={9} y={y + 3} fontSize={8} textAnchor="end" fill="hsl(var(--muted-foreground))">
            {mm}
          </text>
        )}
      </g>,
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Corner square */}
      <div className="absolute top-0 left-0 w-6 h-6 bg-muted border-b border-r border-border" />

      {/* Horizontal ruler */}
      <svg className="absolute top-0 left-0 h-6 bg-muted border-b border-border" style={{ width: totalWidthPx }}>
        {horizontalTicks}
      </svg>

      {/* Vertical ruler */}
      <svg className="absolute top-0 left-0 w-6 bg-muted border-r border-border" style={{ height: totalHeightPx }}>
        {verticalTicks}
      </svg>
    </div>
  );
}

export default LabelRulers;
