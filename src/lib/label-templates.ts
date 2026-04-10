import { mmToPx } from './label-formats';
import { Rect, IText, Line, Path } from 'fabric';

export type TemplateCategory =
  | 'produtos'
  | 'alimentos'
  | 'cosmeticos'
  | 'eventos'
  | 'empresarial'
  | 'escolar'
  | 'festas'
  | 'artesanal'
  | 'minimalista'
  | 'vintage'
  | 'botanico'
  | 'moderno'
  | 'premium'
  | 'promocional'
  | 'festivo'
  | 'elegante';

export interface LabelTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  subcategory?: string;
  description: string;
  thumbnail?: string;
  tags?: string[];
  premium?: boolean;
  getObjects: (widthMm: number, heightMm: number) => any[];
}

export const TEMPLATE_CATEGORIES = [
  { id: 'minimalista', label: 'Minimalista', emoji: '◻️' },
  { id: 'premium', label: 'Premium', emoji: '✨' },
  { id: 'promocional', label: 'Promocional', emoji: '🏷️' },
  { id: 'artesanal', label: 'Artesanal', emoji: '🧶' },
  { id: 'festivo', label: 'Festivo', emoji: '🎉' },
  { id: 'elegante', label: 'Elegante', emoji: '💎' },
  { id: 'produtos', label: 'Produtos', emoji: '📦' },
  { id: 'alimentos', label: 'Alimentos', emoji: '🍯' },
  { id: 'cosmeticos', label: 'Cosméticos', emoji: '💄' },
  { id: 'eventos', label: 'Eventos', emoji: '🎪' },
  { id: 'empresarial', label: 'Empresarial', emoji: '🏢' },
  { id: 'escolar', label: 'Escolar', emoji: '📚' },
  { id: 'festas', label: 'Festas', emoji: '🥳' },
  { id: 'vintage', label: 'Vintage', emoji: '📜' },
  { id: 'botanico', label: 'Botânico', emoji: '🌿' },
  { id: 'moderno', label: 'Moderno', emoji: '⬡' },
];

function center(widthMm: number, heightMm: number) {
  const w = mmToPx(widthMm);
  const h = mmToPx(heightMm);
  return { cx: w / 2, cy: h / 2, w, h };
}

export const LABEL_TEMPLATES: LabelTemplate[] = [
  // Minimalista
  {
    id: 'min-clean', name: 'Clean', category: 'minimalista',
    description: 'Texto centralizado com linha decorativa',
    getObjects: (wm, hm) => {
      const { cx, cy, w, h } = center(wm, hm);
      return [
        { type: 'i-text', text: 'Seu Produto', left: cx - 50, top: cy - 20, fontSize: 20, fontFamily: 'Montserrat', fill: '#1a1a1a', textAlign: 'center' },
        { type: 'line', x1: cx - 40, y1: cy + 10, x2: cx + 40, y2: cy + 10, stroke: '#1a1a1a', strokeWidth: 1 },
        { type: 'i-text', text: 'descrição', left: cx - 30, top: cy + 18, fontSize: 10, fontFamily: 'Montserrat', fill: '#666666', textAlign: 'center' },
      ];
    },
  },
  {
    id: 'min-circle-badge', name: 'Selo Simples', category: 'minimalista',
    description: 'Círculo interno com texto',
    getObjects: (wm, hm) => {
      const { cx, cy, w, h } = center(wm, hm);
      const r = Math.min(w, h) * 0.3;
      return [
        { type: 'circle', left: cx - r, top: cy - r, radius: r, fill: 'transparent', stroke: '#333333', strokeWidth: 2 },
        { type: 'i-text', text: 'LOGO', left: cx - 20, top: cy - 10, fontSize: 16, fontFamily: 'Montserrat', fill: '#333333', textAlign: 'center', fontWeight: 'bold' },
      ];
    },
  },
  {
    id: 'min-dual-line', name: 'Duas Linhas', category: 'minimalista',
    description: 'Duas linhas horizontais com texto entre elas',
    getObjects: (wm, hm) => {
      const { cx, cy, w } = center(wm, hm);
      const lineW = w * 0.6;
      return [
        { type: 'line', x1: cx - lineW/2, y1: cy - 18, x2: cx + lineW/2, y2: cy - 18, stroke: '#222', strokeWidth: 1 },
        { type: 'i-text', text: 'MARCA', left: cx - 30, top: cy - 14, fontSize: 18, fontFamily: 'Poppins', fill: '#222', textAlign: 'center', fontWeight: 'bold' },
        { type: 'line', x1: cx - lineW/2, y1: cy + 14, x2: cx + lineW/2, y2: cy + 14, stroke: '#222', strokeWidth: 1 },
        { type: 'i-text', text: 'artesanal', left: cx - 25, top: cy + 18, fontSize: 9, fontFamily: 'Poppins', fill: '#888', textAlign: 'center' },
      ];
    },
  },

  // Premium
  {
    id: 'prm-gold-frame', name: 'Moldura Dourada', category: 'premium',
    description: 'Borda dourada dupla com texto elegante',
    getObjects: (wm, hm) => {
      const { cx, cy, w, h } = center(wm, hm);
      const m = mmToPx(3);
      return [
        { type: 'rect', left: m, top: m, width: w - m*2, height: h - m*2, fill: 'transparent', stroke: '#c8a951', strokeWidth: 2, rx: 0, ry: 0 },
        { type: 'rect', left: m + 4, top: m + 4, width: w - m*2 - 8, height: h - m*2 - 8, fill: 'transparent', stroke: '#c8a951', strokeWidth: 1, rx: 0, ry: 0 },
        { type: 'i-text', text: 'PREMIUM', left: cx - 35, top: cy - 15, fontSize: 18, fontFamily: 'Playfair Display', fill: '#c8a951', textAlign: 'center' },
        { type: 'i-text', text: 'qualidade superior', left: cx - 45, top: cy + 8, fontSize: 9, fontFamily: 'Montserrat', fill: '#8a7a4a', textAlign: 'center' },
      ];
    },
  },
  {
    id: 'prm-elegant', name: 'Elegante Escuro', category: 'premium',
    description: 'Fundo escuro com tipografia sofisticada',
    getObjects: (wm, hm) => {
      const { cx, cy, w, h } = center(wm, hm);
      return [
        { type: 'rect', left: 0, top: 0, width: w, height: h, fill: '#1a1a2e' },
        { type: 'i-text', text: 'EXCLUSIVE', left: cx - 45, top: cy - 15, fontSize: 20, fontFamily: 'Playfair Display', fill: '#e8d5b7', textAlign: 'center' },
        { type: 'line', x1: cx - 30, y1: cy + 10, x2: cx + 30, y2: cy + 10, stroke: '#c8a951', strokeWidth: 1 },
        { type: 'i-text', text: 'collection', left: cx - 28, top: cy + 16, fontSize: 10, fontFamily: 'Montserrat', fill: '#999', textAlign: 'center' },
      ];
    },
  },

  // Promocional
  {
    id: 'promo-sale', name: 'Promoção', category: 'promocional',
    description: 'Selo de desconto chamativo',
    getObjects: (wm, hm) => {
      const { cx, cy, w, h } = center(wm, hm);
      return [
        { type: 'rect', left: 0, top: 0, width: w, height: h, fill: '#ef4444' },
        { type: 'i-text', text: '50%', left: cx - 30, top: cy - 25, fontSize: 36, fontFamily: 'Oswald', fill: '#ffffff', textAlign: 'center', fontWeight: 'bold' },
        { type: 'i-text', text: 'OFF', left: cx - 18, top: cy + 10, fontSize: 20, fontFamily: 'Oswald', fill: '#fde68a', textAlign: 'center', fontWeight: 'bold' },
      ];
    },
  },
  {
    id: 'promo-new', name: 'Novidade', category: 'promocional',
    description: 'Badge de lançamento',
    getObjects: (wm, hm) => {
      const { cx, cy, w, h } = center(wm, hm);
      return [
        { type: 'rect', left: 0, top: 0, width: w, height: h, fill: '#2563eb' },
        { type: 'i-text', text: 'NOVO', left: cx - 25, top: cy - 15, fontSize: 24, fontFamily: 'Oswald', fill: '#ffffff', textAlign: 'center', fontWeight: 'bold' },
        { type: 'i-text', text: 'lançamento', left: cx - 30, top: cy + 12, fontSize: 10, fontFamily: 'Poppins', fill: '#bfdbfe', textAlign: 'center' },
      ];
    },
  },

  // Artesanal
  {
    id: 'art-handmade', name: 'Feito à Mão', category: 'artesanal',
    description: 'Estilo rústico artesanal',
    getObjects: (wm, hm) => {
      const { cx, cy, w, h } = center(wm, hm);
      return [
        { type: 'rect', left: 0, top: 0, width: w, height: h, fill: '#fef3e2' },
        { type: 'i-text', text: 'feito à mão', left: cx - 40, top: cy - 20, fontSize: 18, fontFamily: 'Dancing Script', fill: '#6b4423', textAlign: 'center' },
        { type: 'i-text', text: '♥', left: cx - 8, top: cy + 5, fontSize: 16, fontFamily: 'Arial', fill: '#d97706' },
        { type: 'i-text', text: 'com amor', left: cx - 25, top: cy + 22, fontSize: 10, fontFamily: 'Caveat', fill: '#92400e', textAlign: 'center' },
      ];
    },
  },
  {
    id: 'art-organic', name: 'Orgânico', category: 'artesanal',
    description: 'Natural e sustentável',
    getObjects: (wm, hm) => {
      const { cx, cy, w, h } = center(wm, hm);
      return [
        { type: 'rect', left: 0, top: 0, width: w, height: h, fill: '#f0fdf4' },
        { type: 'circle', left: cx - 25, top: cy - 30, radius: 25, fill: 'transparent', stroke: '#16a34a', strokeWidth: 2 },
        { type: 'i-text', text: '🌿', left: cx - 10, top: cy - 28, fontSize: 18, fontFamily: 'Arial' },
        { type: 'i-text', text: 'ORGÂNICO', left: cx - 35, top: cy + 5, fontSize: 14, fontFamily: 'Montserrat', fill: '#166534', textAlign: 'center', fontWeight: 'bold' },
        { type: 'i-text', text: '100% natural', left: cx - 32, top: cy + 22, fontSize: 8, fontFamily: 'Montserrat', fill: '#4ade80', textAlign: 'center' },
      ];
    },
  },

  // Festivo
  {
    id: 'fest-natal', name: 'Natal', category: 'festivo',
    description: 'Tema natalino vermelho e verde',
    getObjects: (wm, hm) => {
      const { cx, cy, w, h } = center(wm, hm);
      return [
        { type: 'rect', left: 0, top: 0, width: w, height: h, fill: '#991b1b' },
        { type: 'i-text', text: '🎄', left: cx - 12, top: cy - 30, fontSize: 22, fontFamily: 'Arial' },
        { type: 'i-text', text: 'Feliz Natal', left: cx - 40, top: cy - 5, fontSize: 18, fontFamily: 'Great Vibes', fill: '#fef3c7', textAlign: 'center' },
        { type: 'i-text', text: '2025', left: cx - 14, top: cy + 18, fontSize: 12, fontFamily: 'Montserrat', fill: '#fca5a5', textAlign: 'center' },
      ];
    },
  },
  {
    id: 'fest-birthday', name: 'Aniversário', category: 'festivo',
    description: 'Celebração colorida',
    getObjects: (wm, hm) => {
      const { cx, cy, w, h } = center(wm, hm);
      return [
        { type: 'rect', left: 0, top: 0, width: w, height: h, fill: '#fdf2f8' },
        { type: 'i-text', text: '🎂', left: cx - 12, top: cy - 30, fontSize: 20, fontFamily: 'Arial' },
        { type: 'i-text', text: 'Parabéns!', left: cx - 40, top: cy - 5, fontSize: 20, fontFamily: 'Pacifico', fill: '#be185d', textAlign: 'center' },
        { type: 'circle', left: cx - 40, top: cy + 20, radius: 4, fill: '#f472b6' },
        { type: 'circle', left: cx - 10, top: cy + 22, radius: 3, fill: '#a78bfa' },
        { type: 'circle', left: cx + 20, top: cy + 19, radius: 5, fill: '#34d399' },
      ];
    },
  },

  // Elegante
  {
    id: 'eleg-serif', name: 'Serif Clássico', category: 'elegante',
    description: 'Tipografia serifada clássica',
    getObjects: (wm, hm) => {
      const { cx, cy, w, h } = center(wm, hm);
      const lineW = w * 0.5;
      return [
        { type: 'i-text', text: '— NOME —', left: cx - 45, top: cy - 15, fontSize: 18, fontFamily: 'Playfair Display', fill: '#1a1a1a', textAlign: 'center' },
        { type: 'i-text', text: 'desde 2020', left: cx - 28, top: cy + 10, fontSize: 9, fontFamily: 'Montserrat', fill: '#777', textAlign: 'center', fontStyle: 'italic' },
      ];
    },
  },
  {
    id: 'eleg-monogram', name: 'Monograma', category: 'elegante',
    description: 'Letra grande com moldura circular',
    getObjects: (wm, hm) => {
      const { cx, cy, w, h } = center(wm, hm);
      const r = Math.min(w, h) * 0.28;
      return [
        { type: 'circle', left: cx - r, top: cy - r - 5, radius: r, fill: 'transparent', stroke: '#1a1a1a', strokeWidth: 2 },
        { type: 'i-text', text: 'M', left: cx - 14, top: cy - r + 8, fontSize: 36, fontFamily: 'Playfair Display', fill: '#1a1a1a', textAlign: 'center' },
        { type: 'i-text', text: 'MARCA', left: cx - 22, top: cy + r + 2, fontSize: 10, fontFamily: 'Montserrat', fill: '#555', textAlign: 'center', charSpacing: 300 },
      ];
    },
  },
];

// Decorative elements (frames, borders, seals)
export interface DecorativeElement {
  id: string;
  name: string;
  category: 'moldura' | 'selo' | 'borda' | 'ornamento';
  getObjects: (widthMm: number, heightMm: number) => any[];
}

export const DECORATIVE_CATEGORIES = [
  { id: 'moldura', label: 'Molduras', emoji: '🖼️' },
  { id: 'selo', label: 'Selos', emoji: '🔖' },
  { id: 'borda', label: 'Bordas', emoji: '▣' },
  { id: 'ornamento', label: 'Ornamentos', emoji: '✿' },
];

export const DECORATIVE_ELEMENTS: DecorativeElement[] = [
  // Molduras
  {
    id: 'frame-simple', name: 'Moldura simples', category: 'moldura',
    getObjects: (wm, hm) => {
      const { w, h } = center(wm, hm);
      const m = mmToPx(2);
      return [{ type: 'rect', left: m, top: m, width: w - m*2, height: h - m*2, fill: 'transparent', stroke: '#333', strokeWidth: 2 }];
    },
  },
  {
    id: 'frame-double', name: 'Moldura dupla', category: 'moldura',
    getObjects: (wm, hm) => {
      const { w, h } = center(wm, hm);
      const m1 = mmToPx(2); const m2 = mmToPx(3.5);
      return [
        { type: 'rect', left: m1, top: m1, width: w - m1*2, height: h - m1*2, fill: 'transparent', stroke: '#333', strokeWidth: 2 },
        { type: 'rect', left: m2, top: m2, width: w - m2*2, height: h - m2*2, fill: 'transparent', stroke: '#333', strokeWidth: 1 },
      ];
    },
  },
  {
    id: 'frame-rounded', name: 'Moldura arredondada', category: 'moldura',
    getObjects: (wm, hm) => {
      const { w, h } = center(wm, hm);
      const m = mmToPx(2);
      return [{ type: 'rect', left: m, top: m, width: w - m*2, height: h - m*2, fill: 'transparent', stroke: '#555', strokeWidth: 2, rx: mmToPx(2), ry: mmToPx(2) }];
    },
  },
  {
    id: 'frame-gold', name: 'Moldura dourada', category: 'moldura',
    getObjects: (wm, hm) => {
      const { w, h } = center(wm, hm);
      const m = mmToPx(2);
      return [
        { type: 'rect', left: m, top: m, width: w - m*2, height: h - m*2, fill: 'transparent', stroke: '#c8a951', strokeWidth: 3 },
        { type: 'rect', left: m + 5, top: m + 5, width: w - m*2 - 10, height: h - m*2 - 10, fill: 'transparent', stroke: '#c8a951', strokeWidth: 1 },
      ];
    },
  },

  // Selos
  {
    id: 'seal-circle', name: 'Selo circular', category: 'selo',
    getObjects: (wm, hm) => {
      const { cx, cy, w, h } = center(wm, hm);
      const r = Math.min(w, h) * 0.35;
      return [
        { type: 'circle', left: cx - r, top: cy - r, radius: r, fill: 'transparent', stroke: '#333', strokeWidth: 2 },
        { type: 'circle', left: cx - r + 4, top: cy - r + 4, radius: r - 4, fill: 'transparent', stroke: '#333', strokeWidth: 1 },
      ];
    },
  },
  {
    id: 'seal-star', name: 'Selo estrela', category: 'selo',
    getObjects: (wm, hm) => {
      const { cx, cy, w, h } = center(wm, hm);
      return [
        { type: 'i-text', text: '★', left: cx - 15, top: cy - 20, fontSize: 32, fontFamily: 'Arial', fill: '#c8a951' },
      ];
    },
  },
  {
    id: 'seal-quality', name: 'Selo qualidade', category: 'selo',
    getObjects: (wm, hm) => {
      const { cx, cy, w, h } = center(wm, hm);
      const r = Math.min(w, h) * 0.25;
      return [
        { type: 'circle', left: cx - r, top: cy - r, radius: r, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 },
        { type: 'i-text', text: '✓', left: cx - 10, top: cy - 14, fontSize: 22, fontFamily: 'Arial', fill: '#fff' },
      ];
    },
  },

  // Bordas
  {
    id: 'border-dots', name: 'Borda pontilhada', category: 'borda',
    getObjects: (wm, hm) => {
      const { w, h } = center(wm, hm);
      const m = mmToPx(2);
      return [{ type: 'rect', left: m, top: m, width: w - m*2, height: h - m*2, fill: 'transparent', stroke: '#999', strokeWidth: 2, strokeDashArray: [4, 4] }];
    },
  },
  {
    id: 'border-dashed', name: 'Borda tracejada', category: 'borda',
    getObjects: (wm, hm) => {
      const { w, h } = center(wm, hm);
      const m = mmToPx(2);
      return [{ type: 'rect', left: m, top: m, width: w - m*2, height: h - m*2, fill: 'transparent', stroke: '#666', strokeWidth: 2, strokeDashArray: [8, 4] }];
    },
  },

  // Ornamentos
  {
    id: 'orn-divider', name: 'Divisor central', category: 'ornamento',
    getObjects: (wm, hm) => {
      const { cx, cy, w } = center(wm, hm);
      const lineW = w * 0.6;
      return [
        { type: 'line', x1: cx - lineW/2, y1: cy, x2: cx - 8, y2: cy, stroke: '#999', strokeWidth: 1 },
        { type: 'i-text', text: '◆', left: cx - 6, top: cy - 8, fontSize: 12, fontFamily: 'Arial', fill: '#999' },
        { type: 'line', x1: cx + 8, y1: cy, x2: cx + lineW/2, y2: cy, stroke: '#999', strokeWidth: 1 },
      ];
    },
  },
  {
    id: 'orn-corners', name: 'Cantos decorativos', category: 'ornamento',
    getObjects: (wm, hm) => {
      const { w, h } = center(wm, hm);
      const m = mmToPx(3);
      const s = mmToPx(5);
      return [
        // Top-left
        { type: 'line', x1: m, y1: m + s, x2: m, y2: m, stroke: '#333', strokeWidth: 2 },
        { type: 'line', x1: m, y1: m, x2: m + s, y2: m, stroke: '#333', strokeWidth: 2 },
        // Top-right
        { type: 'line', x1: w - m, y1: m + s, x2: w - m, y2: m, stroke: '#333', strokeWidth: 2 },
        { type: 'line', x1: w - m - s, y1: m, x2: w - m, y2: m, stroke: '#333', strokeWidth: 2 },
        // Bottom-left
        { type: 'line', x1: m, y1: h - m - s, x2: m, y2: h - m, stroke: '#333', strokeWidth: 2 },
        { type: 'line', x1: m, y1: h - m, x2: m + s, y2: h - m, stroke: '#333', strokeWidth: 2 },
        // Bottom-right
        { type: 'line', x1: w - m, y1: h - m - s, x2: w - m, y2: h - m, stroke: '#333', strokeWidth: 2 },
        { type: 'line', x1: w - m - s, y1: h - m, x2: w - m, y2: h - m, stroke: '#333', strokeWidth: 2 },
      ];
    },
  },
  {
    id: 'orn-floral', name: 'Floral', category: 'ornamento',
    getObjects: (wm, hm) => {
      const { cx, cy } = center(wm, hm);
      return [
        { type: 'i-text', text: '❀', left: cx - 12, top: cy - 15, fontSize: 24, fontFamily: 'Arial', fill: '#e879a0' },
      ];
    },
  },
];

// =============================================
// CATEGORIA: PRODUTOS / E-COMMERCE
// =============================================
export const templateProdutoMinimalista: LabelTemplate = {
  id: 'produto-minimalista-01',
  name: 'Produto Minimalista',
  category: 'produtos',
  description: 'Layout limpo para produtos com marca, nome e informações',
  tags: ['minimalista', 'produto', 'clean', 'moderno'],
  premium: false,
  thumbnail: '/thumbnails/produto-minimalista-01.png',
  getObjects: (w, h) => {
    const wPx = mmToPx(w);
    const hPx = mmToPx(h);
    return [
      new Rect({ left: wPx * 0.05, top: hPx * 0.05, width: wPx * 0.9, height: hPx * 0.9, fill: '#FFFFFF', stroke: '#E0E0E0', strokeWidth: 2, rx: 8, ry: 8 }),
      new Rect({ left: wPx * 0.05, top: hPx * 0.05, width: wPx * 0.9, height: hPx * 0.12, fill: '#1A1A2E', rx: 8, ry: 8 }),
      new IText('MARCA', { left: wPx * 0.5, top: hPx * 0.09, originX: 'center', originY: 'center', fontSize: hPx * 0.06, fontFamily: 'Montserrat', fontWeight: 'bold', fill: '#FFFFFF', charSpacing: 200 }),
      new IText('Nome do Produto', { left: wPx * 0.5, top: hPx * 0.38, originX: 'center', originY: 'center', fontSize: hPx * 0.09, fontFamily: 'Playfair Display', fill: '#1A1A2E', fontStyle: 'italic' }),
      new Line([wPx * 0.2, hPx * 0.52, wPx * 0.8, hPx * 0.52], { stroke: '#1A1A2E', strokeWidth: 1 }),
      new IText('Descrição do produto\nIngredientes ou informações', { left: wPx * 0.5, top: hPx * 0.65, originX: 'center', originY: 'center', fontSize: hPx * 0.045, fontFamily: 'Roboto', fill: '#666666', textAlign: 'center', lineHeight: 1.4 }),
      new IText('www.suamarca.com.br', { left: wPx * 0.5, top: hPx * 0.88, originX: 'center', originY: 'center', fontSize: hPx * 0.04, fontFamily: 'Roboto', fill: '#1A1A2E', charSpacing: 50 }),
    ];
  },
};

// =============================================
// CATEGORIA: ALIMENTOS / GASTRONOMIA
// =============================================
export const templateAlimentoArtesanal: LabelTemplate = {
  id: 'alimento-artesanal-01',
  name: 'Alimento Artesanal',
  category: 'alimentos',
  description: 'Rótulo artesanal para alimentos com moldura dupla',
  tags: ['alimento', 'artesanal', 'orgânico', 'natural', 'doce', 'bolo'],
  premium: false,
  thumbnail: '/thumbnails/alimento-artesanal-01.png',
  getObjects: (w, h) => {
    const wPx = mmToPx(w);
    const hPx = mmToPx(h);
    return [
      new Rect({ left: 0, top: 0, width: wPx, height: hPx, fill: '#FFF8F0', selectable: false }),
      new Rect({ left: wPx * 0.04, top: hPx * 0.04, width: wPx * 0.92, height: hPx * 0.92, fill: 'transparent', stroke: '#8B5E3C', strokeWidth: 3, rx: 4, ry: 4 }),
      new Rect({ left: wPx * 0.07, top: hPx * 0.07, width: wPx * 0.86, height: hPx * 0.86, fill: 'transparent', stroke: '#8B5E3C', strokeWidth: 1, strokeDashArray: [5, 3], rx: 2, ry: 2 }),
      new Rect({ left: wPx * 0.04, top: hPx * 0.04, width: wPx * 0.92, height: hPx * 0.2, fill: '#8B5E3C', rx: 4, ry: 4 }),
      new IText('✦  FEITO COM AMOR  ✦', { left: wPx * 0.5, top: hPx * 0.14, originX: 'center', originY: 'center', fontSize: hPx * 0.055, fontFamily: 'Montserrat', fontWeight: 'bold', fill: '#FFF8F0', charSpacing: 100 }),
      new IText('Brigadeiro\nGourmet', { left: wPx * 0.5, top: hPx * 0.42, originX: 'center', originY: 'center', fontSize: hPx * 0.1, fontFamily: 'Playfair Display', fontStyle: 'italic', fill: '#5C3317', textAlign: 'center', lineHeight: 1.2 }),
      new IText('— ✦ —', { left: wPx * 0.5, top: hPx * 0.62, originX: 'center', originY: 'center', fontSize: hPx * 0.07, fontFamily: 'Georgia', fill: '#8B5E3C' }),
      new IText('Tradicional ao leite ninho', { left: wPx * 0.5, top: hPx * 0.74, originX: 'center', originY: 'center', fontSize: hPx * 0.05, fontFamily: 'Dancing Script', fill: '#8B5E3C' }),
      new IText('100g  •  Val: ____/____ ', { left: wPx * 0.5, top: hPx * 0.87, originX: 'center', originY: 'center', fontSize: hPx * 0.04, fontFamily: 'Roboto', fill: '#8B5E3C' }),
    ];
  },
};

// =============================================
// CATEGORIA: COSMÉTICOS / BELEZA
// =============================================
export const templateCosmeticoLuxo: LabelTemplate = {
  id: 'cosmetico-luxo-01',
  name: 'Cosmético Luxo',
  category: 'cosmeticos',
  description: 'Rótulo sofisticado dark com detalhes dourados',
  tags: ['cosmetico', 'beleza', 'luxo', 'skincare', 'premium'],
  premium: false,
  thumbnail: '/thumbnails/cosmetico-luxo-01.png',
  getObjects: (w, h) => {
    const wPx = mmToPx(w);
    const hPx = mmToPx(h);
    return [
      new Rect({ left: 0, top: 0, width: wPx, height: hPx, fill: '#0D0D0D', selectable: false }),
      new Rect({ left: wPx * 0.1, top: hPx * 0.08, width: wPx * 0.8, height: 2, fill: '#C9A84C' }),
      new Rect({ left: wPx * 0.1, top: hPx * 0.92, width: wPx * 0.8, height: 2, fill: '#C9A84C' }),
      new IText('◆', { left: wPx * 0.5, top: hPx * 0.22, originX: 'center', originY: 'center', fontSize: hPx * 0.08, fontFamily: 'Georgia', fill: '#C9A84C' }),
      new IText('LUXE', { left: wPx * 0.5, top: hPx * 0.36, originX: 'center', originY: 'center', fontSize: hPx * 0.13, fontFamily: 'Playfair Display', fill: '#FFFFFF', charSpacing: 400 }),
      new IText('BEAUTÉ', { left: wPx * 0.5, top: hPx * 0.48, originX: 'center', originY: 'center', fontSize: hPx * 0.05, fontFamily: 'Montserrat', fill: '#C9A84C', charSpacing: 600 }),
      new Line([wPx * 0.3, hPx * 0.57, wPx * 0.7, hPx * 0.57], { stroke: '#C9A84C', strokeWidth: 1 }),
      new IText('Sérum Facial\nHidratação Profunda', { left: wPx * 0.5, top: hPx * 0.7, originX: 'center', originY: 'center', fontSize: hPx * 0.055, fontFamily: 'Lato', fill: '#CCCCCC', textAlign: 'center', lineHeight: 1.4 }),
      new IText('30 ml', { left: wPx * 0.5, top: hPx * 0.86, originX: 'center', originY: 'center', fontSize: hPx * 0.045, fontFamily: 'Montserrat', fill: '#C9A84C', charSpacing: 200 }),
    ];
  },
};

// =============================================
// CATEGORIA: FESTAS / EVENTOS
// =============================================
export const templateFestaBalloon: LabelTemplate = {
  id: 'festa-balloon-01',
  name: 'Festa Balões',
  category: 'festas',
  description: 'Etiqueta colorida para festas de aniversário',
  tags: ['festa', 'aniversário', 'balão', 'colorido', 'criança'],
  premium: false,
  thumbnail: '/thumbnails/festa-balloon-01.png',
  getObjects: (w, h) => {
    const wPx = mmToPx(w);
    const hPx = mmToPx(h);
    return [
      new Rect({ left: 0, top: 0, width: wPx, height: hPx * 0.5, fill: '#FF6B9D', selectable: false }),
      new Rect({ left: 0, top: hPx * 0.5, width: wPx, height: hPx * 0.5, fill: '#FF8E53', selectable: false }),
      new IText('🎈', { left: wPx * 0.15, top: hPx * 0.12, fontSize: hPx * 0.12 }),
      new IText('🎈', { left: wPx * 0.72, top: hPx * 0.08, fontSize: hPx * 0.1 }),
      new IText('Feliz', { left: wPx * 0.5, top: hPx * 0.32, originX: 'center', originY: 'center', fontSize: hPx * 0.13, fontFamily: 'Pacifico', fill: '#FFFFFF' }),
      new IText('Aniversário!', { left: wPx * 0.5, top: hPx * 0.47, originX: 'center', originY: 'center', fontSize: hPx * 0.1, fontFamily: 'Pacifico', fill: '#FFF9C4' }),
      new IText('✦ ✦ ✦ ✦ ✦', { left: wPx * 0.5, top: hPx * 0.62, originX: 'center', originY: 'center', fontSize: hPx * 0.055, fontFamily: 'Georgia', fill: '#FFFFFF' }),
      new IText('Maria Clara', { left: wPx * 0.5, top: hPx * 0.75, originX: 'center', originY: 'center', fontSize: hPx * 0.09, fontFamily: 'Dancing Script', fill: '#FFFFFF' }),
      new IText('7 anos', { left: wPx * 0.5, top: hPx * 0.87, originX: 'center', originY: 'center', fontSize: hPx * 0.065, fontFamily: 'Montserrat', fontWeight: 'bold', fill: '#FFF9C4' }),
    ];
  },
};

// =============================================
// CATEGORIA: BOTÂNICO / NATURAL
// =============================================
export const templateBotanico: LabelTemplate = {
  id: 'botanico-natural-01',
  name: 'Botânico Natural',
  category: 'botanico',
  description: 'Rótulo verde natural para chás e produtos orgânicos',
  tags: ['botânico', 'natural', 'plantas', 'orgânico', 'ervas', 'chá'],
  premium: false,
  thumbnail: '/thumbnails/botanico-natural-01.png',
  getObjects: (w, h) => {
    const wPx = mmToPx(w);
    const hPx = mmToPx(h);
    return [
      new Rect({ left: 0, top: 0, width: wPx, height: hPx, fill: '#F1F7EE', selectable: false }),
      new Rect({ left: wPx * 0.05, top: hPx * 0.05, width: wPx * 0.9, height: hPx * 0.9, fill: 'transparent', stroke: '#4A7C59', strokeWidth: 2, rx: 4, ry: 4 }),
      new IText('❧  ❧  ❧', { left: wPx * 0.5, top: hPx * 0.16, originX: 'center', originY: 'center', fontSize: hPx * 0.065, fill: '#4A7C59' }),
      new IText('Chá de Camomila', { left: wPx * 0.5, top: hPx * 0.35, originX: 'center', originY: 'center', fontSize: hPx * 0.09, fontFamily: 'Playfair Display', fontStyle: 'italic', fill: '#2D5016', textAlign: 'center' }),
      new IText('100% Natural • Orgânico\nSem conservantes', { left: wPx * 0.5, top: hPx * 0.52, originX: 'center', originY: 'center', fontSize: hPx * 0.05, fontFamily: 'Lato', fill: '#4A7C59', textAlign: 'center', lineHeight: 1.5 }),
      new Line([wPx * 0.2, hPx * 0.64, wPx * 0.8, hPx * 0.64], { stroke: '#4A7C59', strokeWidth: 1, strokeDashArray: [4, 3] }),
      new IText('Peso: 50g  •  Val: ____/____', { left: wPx * 0.5, top: hPx * 0.75, originX: 'center', originY: 'center', fontSize: hPx * 0.045, fontFamily: 'Roboto', fill: '#4A7C59' }),
      new IText('Natureza Viva', { left: wPx * 0.5, top: hPx * 0.87, originX: 'center', originY: 'center', fontSize: hPx * 0.055, fontFamily: 'Dancing Script', fill: '#2D5016' }),
    ];
  },
};

// Append new templates to the main array
LABEL_TEMPLATES.push(
  templateProdutoMinimalista,
  templateAlimentoArtesanal,
  templateCosmeticoLuxo,
  templateFestaBalloon,
  templateBotanico,
);

export function getTemplatesByCategory(category: string): LabelTemplate[] {
  return LABEL_TEMPLATES.filter(t => t.category === category);
}

export function getDecorativeByCategory(category: string): DecorativeElement[] {
  return DECORATIVE_ELEMENTS.filter(e => e.category === category);
}
