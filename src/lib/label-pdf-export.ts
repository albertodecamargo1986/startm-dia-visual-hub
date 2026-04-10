import jsPDF from 'jspdf';
import type { LabelFormat } from './label-formats';

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

  // Metadata
  doc.setProperties({
    title: projectName,
    subject: `Etiqueta ${format.label} - ${format.shape}`,
    creator: 'Editor de Etiquetas',
  });

  const x = marginMm + bleedMm;
  const y = marginMm + bleedMm;

  // Draw cut marks
  if (includeCutMarks) {
    doc.setDrawColor(0);
    doc.setLineWidth(0.1);
    const markLen = 5;
    // Top-left
    doc.line(x - bleedMm, y - bleedMm - markLen, x - bleedMm, y - bleedMm);
    doc.line(x - bleedMm - markLen, y - bleedMm, x - bleedMm, y - bleedMm);
    // Top-right
    doc.line(x + format.widthMm + bleedMm, y - bleedMm - markLen, x + format.widthMm + bleedMm, y - bleedMm);
    doc.line(x + format.widthMm + bleedMm, y - bleedMm, x + format.widthMm + bleedMm + markLen, y - bleedMm);
    // Bottom-left
    doc.line(x - bleedMm, y + format.heightMm + bleedMm, x - bleedMm, y + format.heightMm + bleedMm + markLen);
    doc.line(x - bleedMm - markLen, y + format.heightMm + bleedMm, x - bleedMm, y + format.heightMm + bleedMm);
    // Bottom-right
    doc.line(x + format.widthMm + bleedMm, y + format.heightMm + bleedMm, x + format.widthMm + bleedMm, y + format.heightMm + bleedMm + markLen);
    doc.line(x + format.widthMm + bleedMm, y + format.heightMm + bleedMm, x + format.widthMm + bleedMm + markLen, y + format.heightMm + bleedMm);
  }

  // Add the canvas as image (high res)
  const imgData = canvasEl.toDataURL('image/png', 1.0);
  doc.addImage(imgData, 'PNG', x, y, format.widthMm, format.heightMm);

  // Draw label outline
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

  return doc.output('blob');
}
