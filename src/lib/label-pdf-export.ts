import jsPDF from 'jspdf';
import type { Canvas as FabricCanvas } from 'fabric';
import type { LabelFormat } from './label-formats';

// ── Raster export (existing) ──────────────────────────────────────

interface ExportOptions {
  format: LabelFormat;
  canvasEl: HTMLCanvasElement;
  projectName: string;
  includeBleed?: boolean;
  includeCutMarks?: boolean;
}

export async function exportLabelPDF(opts: ExportOptions): Promise<Blob> {
  const { format, canvasEl, projectName, includeBleed = false, includeCutMarks = false } = opts;

  const bleedMm = includeBleed ? 3 : 0;
  const marginMm = includeCutMarks ? 10 : 5;

  const pageW = format.widthMm + bleedMm * 2 + marginMm * 2;
  const pageH = format.heightMm + bleedMm * 2 + marginMm * 2;

  const doc = new jsPDF({
    orientation: pageW > pageH ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageW, pageH],
  });

  doc.setProperties({
    title: projectName,
    subject: `Etiqueta ${format.label} - ${format.shape}`,
    creator: 'Editor de Etiquetas',
  });

  const x = marginMm + bleedMm;
  const y = marginMm + bleedMm;

  if (includeCutMarks) {
    drawCropMarks(doc, x, y, format.widthMm, format.heightMm, bleedMm);
  }

  const imgData = canvasEl.toDataURL('image/png', 1.0);
  doc.addImage(imgData, 'PNG', x, y, format.widthMm, format.heightMm);

  drawLabelOutline(doc, x, y, format);

  return doc.output('blob');
}

// ── Vector export (new) ───────────────────────────────────────────

interface VectorExportOptions {
  canvas: FabricCanvas;
  format: LabelFormat;
  projectName: string;
  bleedMm?: number;
  includeCutMarks?: boolean;
}

const MM_TO_PX = 3.7795;

export async function exportVectorPDF(opts: VectorExportOptions): Promise<Blob> {
  const { canvas, format, projectName, bleedMm = 3, includeCutMarks = true } = opts;
  const { svg2pdf } = await import('svg2pdf.js');

  const marginMm = includeCutMarks ? 10 : 5;
  const pageW = format.widthMm + bleedMm * 2 + marginMm * 2;
  const pageH = format.heightMm + bleedMm * 2 + marginMm * 2;

  const doc = new jsPDF({
    orientation: pageW > pageH ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageW, pageH],
  });

  doc.setProperties({
    title: projectName,
    subject: `Etiqueta vetorial ${format.label} - ${format.shape}`,
    creator: 'Editor de Etiquetas',
  });

  // Export Fabric canvas as SVG
  const svgString = canvas.toSVG({
    width: `${format.widthMm}mm`,
    height: `${format.heightMm}mm`,
  });

  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = svgDoc.documentElement as unknown as SVGElement;

  const offsetX = marginMm + bleedMm;
  const offsetY = marginMm + bleedMm;

  // Render SVG into PDF (vector)
  await svg2pdf(svgElement, doc, {
    x: offsetX,
    y: offsetY,
    width: format.widthMm,
    height: format.heightMm,
  });

  if (includeCutMarks) {
    drawCropMarks(doc, offsetX, offsetY, format.widthMm, format.heightMm, bleedMm);
  }

  drawLabelOutline(doc, offsetX, offsetY, format);

  return doc.output('blob');
}

// ── Shared helpers ────────────────────────────────────────────────

function drawCropMarks(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  bleed: number,
) {
  doc.setDrawColor(0);
  doc.setLineWidth(0.1);
  const m = 5;

  // Top-left
  doc.line(x - bleed, y - bleed - m, x - bleed, y - bleed);
  doc.line(x - bleed - m, y - bleed, x - bleed, y - bleed);
  // Top-right
  doc.line(x + w + bleed, y - bleed - m, x + w + bleed, y - bleed);
  doc.line(x + w + bleed, y - bleed, x + w + bleed + m, y - bleed);
  // Bottom-left
  doc.line(x - bleed, y + h + bleed, x - bleed, y + h + bleed + m);
  doc.line(x - bleed - m, y + h + bleed, x - bleed, y + h + bleed);
  // Bottom-right
  doc.line(x + w + bleed, y + h + bleed, x + w + bleed, y + h + bleed + m);
  doc.line(x + w + bleed, y + h + bleed, x + w + bleed + m, y + h + bleed);
}

function drawLabelOutline(doc: jsPDF, x: number, y: number, format: LabelFormat) {
  doc.setDrawColor(200);
  doc.setLineWidth(0.15);
  if (format.shape === 'round') {
    const r = format.widthMm / 2;
    doc.circle(x + r, y + r, r);
  } else if (format.shape === 'rounded-square' || format.shape === 'rounded-rectangle') {
    doc.roundedRect(x, y, format.widthMm, format.heightMm, 3, 3);
  } else {
    doc.rect(x, y, format.widthMm, format.heightMm);
  }
}
