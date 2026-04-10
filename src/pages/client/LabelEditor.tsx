import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, IText, Line, Ellipse, Triangle, FabricObject, FabricImage, PencilBrush, Path } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus, Save, Trash2, Type, Square, Circle as CircleIcon,
  Minus, Triangle as TriangleIcon, Undo2, Redo2, ZoomIn, ZoomOut,
  Layers, Palette, ArrowUp, ArrowDown, Eye, EyeOff, Copy,
  LayoutTemplate, Frame, Image as ImageIcon, Lock, Unlock,
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter,
  AlignStartHorizontal, AlignEndHorizontal, AlignStartVertical, AlignEndVertical,
  GripVertical, ShoppingCart, Printer, CopyPlus, Sparkles,
  ChevronLeft, ChevronRight, X, Grid3X3, Keyboard, FileText,
  ArrowLeft, Check, Pencil, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  MousePointer2, WrapText, PenTool, Eraser, Shapes,
  Star, Heart, Zap, Diamond, Crown, Medal, CheckCircle, XCircle,
  Phone, Mail, MapPin, ShoppingBag,
  ArrowRight, ArrowUpRight, ChevronsRight, MoveRight,
  Sun, Droplets, Leaf, Flower2
} from 'lucide-react';
import { LABEL_SHAPES, getFormatsForShape, mmToPx, type LabelFormat } from '@/lib/label-formats';

import { useLabelProjects, useAutoSave, type LabelProject } from '@/hooks/use-label-projects';
import {
  TEMPLATE_CATEGORIES, LABEL_TEMPLATES, getTemplatesByCategory,
  DECORATIVE_CATEGORIES, DECORATIVE_ELEMENTS, getDecorativeByCategory,
  type LabelTemplate, type DecorativeElement
} from '@/lib/label-templates';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// ── Constants ──
const GOOGLE_FONTS = [
  'Arial', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald',
  'Playfair Display', 'Poppins', 'Raleway', 'Dancing Script',
  'Pacifico', 'Great Vibes', 'Lobster', 'Sacramento', 'Caveat',
];

const loadedFonts = new Set<string>();
function loadGoogleFont(fontName: string) {
  if (loadedFonts.has(fontName) || ['Arial'].includes(fontName)) return;
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  loadedFonts.add(fontName);
}
['Roboto', 'Montserrat', 'Playfair Display', 'Dancing Script'].forEach(loadGoogleFont);

interface LayerItem {
  id: number; name: string; type: string; visible: boolean; locked: boolean; obj: FabricObject;
}

const ONBOARDING_KEY = 'label_editor_onboarding_done';
const FINISHING_OPTIONS = [
  { id: 'glossy', label: 'Brilhante (Verniz)', price: 0 },
  { id: 'matte', label: 'Fosco', price: 0.02 },
  { id: 'transparent', label: 'Transparente', price: 0.05 },
  { id: 'kraft', label: 'Kraft (papel pardo)', price: 0.03 },
];

// ── SVG Elements Library ──
type SvgElement = { id: string; name: string; path: string; viewBox?: string };
type SvgCategory = { id: string; label: string; icon: React.ReactNode; elements: SvgElement[] };

const SVG_ELEMENTS_LIBRARY: SvgCategory[] = [
  {
    id: 'arrows', label: 'Setas', icon: <ArrowRight className="h-3 w-3" />,
    elements: [
      { id: 'arrow-right', name: 'Seta Direita', path: 'M5 12h14M12 5l7 7-7 7' },
      { id: 'arrow-up-right', name: 'Seta Diagonal', path: 'M7 17L17 7M17 7H7M17 7v10' },
      { id: 'arrow-double', name: 'Seta Dupla', path: 'M5 12h14M12 5l7 7-7 7M2 12l5-5M2 12l5 5' },
      { id: 'chevron-right', name: 'Chevron', path: 'M9 18l6-6-6-6' },
      { id: 'arrow-thick', name: 'Seta Grossa', path: 'M4 12h12M12 4l8 8-8 8' },
      { id: 'move-right', name: 'Seta Movimento', path: 'M5 12h14M15 8l4 4-4 4' },
    ]
  },
  {
    id: 'symbols', label: 'Símbolos', icon: <Star className="h-3 w-3" />,
    elements: [
      { id: 'star-5', name: 'Estrela', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
      { id: 'heart', name: 'Coração', path: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z' },
      { id: 'lightning', name: 'Raio', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
      { id: 'diamond', name: 'Diamante', path: 'M12 2L2 12l10 10 10-10L12 2z' },
      { id: 'crown', name: 'Coroa', path: 'M2 18l3-8 4 4 3-10 3 10 4-4 3 8H2z' },
      { id: 'medal', name: 'Medalha', path: 'M12 15a7 7 0 100-14 7 7 0 000 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12' },
      { id: 'check-circle', name: 'Check', path: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3' },
      { id: 'x-circle', name: 'Xis', path: 'M12 22a10 10 0 100-20 10 10 0 000 20zM15 9l-6 6M9 9l6 6' },
    ]
  },
  {
    id: 'decorative', label: 'Decorativos', icon: <Sun className="h-3 w-3" />,
    elements: [
      { id: 'sun', name: 'Sol', path: 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42' },
      { id: 'droplet', name: 'Gota', path: 'M12 2.69l5.66 5.66a8 8 0 11-11.31 0z' },
      { id: 'leaf', name: 'Folha', path: 'M11 20A7 7 0 019.8 6.9C15.5 4.9 20 1 20 1s-2.3 7.4-5 11.5c-2 3-4 4.5-4 7.5z' },
      { id: 'flower', name: 'Flor', path: 'M12 22a7 7 0 007-7c0-2-1-3.9-3-5.5s-3-4-3-7.5c0 3.5-1 5.9-3 7.5S5 13 5 15a7 7 0 007 7z' },
      { id: 'sparkle', name: 'Brilho', path: 'M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z' },
      { id: 'wave', name: 'Onda', path: 'M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0' },
    ]
  },
  {
    id: 'icons', label: 'Ícones', icon: <Phone className="h-3 w-3" />,
    elements: [
      { id: 'phone', name: 'Telefone', path: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z' },
      { id: 'email', name: 'Email', path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6' },
      { id: 'location', name: 'Localização', path: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z' },
      { id: 'cart', name: 'Carrinho', path: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0' },
      { id: 'instagram', name: 'Instagram', path: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2zM12 8a4 4 0 100 8 4 4 0 000-8zM17.5 6.5h.01' },
      { id: 'facebook', name: 'Facebook', path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
    ]
  },
];

const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl+Z', action: 'Desfazer' },
  { keys: 'Ctrl+Y', action: 'Refazer' },
  { keys: 'Ctrl+S', action: 'Salvar' },
  { keys: 'Ctrl+D', action: 'Duplicar objeto' },
  { keys: 'Delete', action: 'Excluir seleção' },
  { keys: 'Ctrl+G', action: 'Alternar grid' },
];

// Shape visual data for wizard cards
const SHAPE_VISUALS: Record<string, { svg: React.ReactNode; color: string }> = {
  round: {
    svg: <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3" />,
    color: 'from-blue-500/10 to-blue-600/10',
  },
  square: {
    svg: <rect x="8" y="8" width="84" height="84" fill="none" stroke="currentColor" strokeWidth="3" />,
    color: 'from-emerald-500/10 to-emerald-600/10',
  },
  'rounded-square': {
    svg: <rect x="8" y="8" width="84" height="84" rx="14" fill="none" stroke="currentColor" strokeWidth="3" />,
    color: 'from-purple-500/10 to-purple-600/10',
  },
  rectangle: {
    svg: <rect x="5" y="20" width="90" height="60" fill="none" stroke="currentColor" strokeWidth="3" />,
    color: 'from-amber-500/10 to-amber-600/10',
  },
  'rounded-rectangle': {
    svg: <rect x="5" y="20" width="90" height="60" rx="12" fill="none" stroke="currentColor" strokeWidth="3" />,
    color: 'from-rose-500/10 to-rose-600/10',
  },
};

// ── Thumbnail generation ──
async function generateAndUploadThumbnail(
  fc: FabricCanvas, projectId: string, userId: string, format: LabelFormat
): Promise<string | null> {
  try {
    const origZoom = fc.getZoom();
    fc.setZoom(1); fc.renderAll();
    const el = fc.toCanvasElement(1);
    fc.setZoom(origZoom); fc.renderAll();

    const thumbSize = 200;
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = thumbSize; thumbCanvas.height = thumbSize;
    const ctx = thumbCanvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, thumbSize, thumbSize);

    const isRound = format.shape === 'round';
    const isRounded = format.shape === 'rounded-square' || format.shape === 'rounded-rectangle';
    ctx.save();
    if (isRound) { ctx.beginPath(); ctx.arc(thumbSize / 2, thumbSize / 2, thumbSize / 2, 0, Math.PI * 2); ctx.clip(); }
    else if (isRounded) { ctx.beginPath(); ctx.roundRect(0, 0, thumbSize, thumbSize, 16); ctx.clip(); }

    const scale = Math.min(thumbSize / el.width, thumbSize / el.height);
    const dx = (thumbSize - el.width * scale) / 2;
    const dy = (thumbSize - el.height * scale) / 2;
    ctx.drawImage(el, dx, dy, el.width * scale, el.height * scale);
    ctx.restore();

    const blob = await new Promise<Blob | null>((resolve) => thumbCanvas.toBlob(resolve, 'image/png', 0.85));
    if (!blob) return null;
    const path = `${userId}/${projectId}.png`;
    const { error } = await supabase.storage.from('label-thumbnails').upload(path, blob, { contentType: 'image/png', upsert: true });
    if (error) { console.error('Thumbnail upload error:', error); return null; }
    const { data: urlData } = supabase.storage.from('label-thumbnails').getPublicUrl(path);
    const thumbUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from('label_projects').update({ thumbnail_url: thumbUrl } as any).eq('id', projectId);
    return thumbUrl;
  } catch (e) { console.error('Thumbnail generation error:', e); return null; }
}

// ── Print Preview ──
const PrintPreviewDialog = ({ open, onOpenChange, canvasRef, format: fmt }: {
  open: boolean; onOpenChange: (v: boolean) => void; canvasRef: React.RefObject<FabricCanvas | null>; format: LabelFormat | null;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!open || !canvasRef.current || !fmt) return;
    const fc = canvasRef.current;
    const origZoom = fc.getZoom();
    fc.setZoom(1); fc.renderAll();
    const el = fc.toCanvasElement(2);
    const url = el.toDataURL('image/png');
    fc.setZoom(origZoom); fc.renderAll();
    setPreviewUrl(url);
    return () => setPreviewUrl(null);
  }, [open, canvasRef, fmt]);
  if (!fmt) return null;
  const isRound = fmt.shape === 'round';
  const isRounded = fmt.shape === 'rounded-square' || fmt.shape === 'rounded-rectangle';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Prévia de Impressão</DialogTitle></DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs text-muted-foreground">Simulação do resultado final com corte</p>
          <div className="bg-white p-8 rounded-lg border shadow-inner flex items-center justify-center" style={{ minHeight: 300 }}>
            {previewUrl && (
              <div className="relative shadow-lg" style={{ width: Math.min(250, mmToPx(fmt.widthMm)), height: Math.min(250, mmToPx(fmt.heightMm)), borderRadius: isRound ? '50%' : isRounded ? 12 : 0, overflow: 'hidden', border: '1px dashed #ccc' }}>
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground text-center">
            <p>Formato: {fmt.shape} • {fmt.widthMm / 10}×{fmt.heightMm / 10}cm</p>
            <p>A linha tracejada indica a área de corte</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ══════════════════════════════════════════
// ── MAIN COMPONENT ──
// ══════════════════════════════════════════
const LabelEditor = () => {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();

  // Core state
  const [selectedShape, setSelectedShape] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<LabelFormat | null>(null);
  const [currentProject, setCurrentProject] = useState<LabelProject | null>(null);
  const [projectName, setProjectName] = useState('Sem título');
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [editingLayerName, setEditingLayerName] = useState<number | null>(null);
  const [layerNameDraft, setLayerNameDraft] = useState('');

  // Wizard state
  const [wizardStep, setWizardStep] = useState(0); // 0=shape, 1=size, 2=name, 3=template

  // UX state
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(ONBOARDING_KEY));
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showAddToCart, setShowAddToCart] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(100);
  const [cartFinishing, setCartFinishing] = useState('glossy');
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [showGrid, setShowGrid] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [drawingMode, setDrawingMode] = useState(false);
  const [brushWidth, setBrushWidth] = useState(3);
  const [brushColor, setBrushColor] = useState('#333333');

  // Undo/redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const isRestoring = useRef(false);

  const { projects, loading, createProject, saveProject, saveVersion, deleteProject, refetch } = useLabelProjects();

  const getCanvasJson = useCallback(() => {
    if (!fabricRef.current) return {};
    return fabricRef.current.toJSON();
  }, []);

  const { markDirty } = useAutoSave(currentProject?.id || null, getCanvasJson);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, '1');
  }, []);

  // ── Layers sync ──
  const syncLayers = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) { setLayers([]); return; }
    const objs = fc.getObjects();
    const items: LayerItem[] = objs.map((obj, i) => {
      const customName = (obj as any).__layerName;
      let typeName = obj.type || 'object';
      if (obj.type === 'i-text') typeName = 'Texto';
      else if (obj.type === 'rect') typeName = 'Retângulo';
      else if (obj.type === 'circle') typeName = 'Círculo';
      else if (obj.type === 'triangle') typeName = 'Triângulo';
      else if (obj.type === 'line') typeName = 'Linha';
      else if (obj.type === 'ellipse') typeName = 'Elipse';
      else if (obj.type === 'image') typeName = 'Imagem';
      return { id: i, name: customName || `${typeName} ${i + 1}`, type: typeName, visible: obj.visible !== false, locked: !obj.selectable, obj };
    });
    setLayers(items.reverse());
  }, []);

  // ── Canvas init (imperative to avoid React reconciliation conflicts with Fabric.js) ──
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || fabricRef.current) return;
    const canvasEl = document.createElement('canvas');
    host.appendChild(canvasEl);
    const fc = new FabricCanvas(canvasEl, { width: 400, height: 400, backgroundColor: '#ffffff', selection: true, uniformScaling: true });
    fabricRef.current = fc;
    // Better corner styles for selection handles
    FabricObject.prototype.set({
      cornerSize: 10,
      cornerColor: '#2563eb',
      borderColor: '#2563eb',
      cornerStrokeColor: '#ffffff',
      cornerStyle: 'circle',
      transparentCorners: false,
      borderScaleFactor: 2,
    });
    fc.on('object:modified', () => { markDirty(); pushHistory(); syncLayers(); });
    fc.on('object:added', () => { if (!isRestoring.current) { markDirty(); pushHistory(); } syncLayers(); });
    fc.on('object:removed', () => { markDirty(); pushHistory(); syncLayers(); });
    fc.on('selection:created', (e: any) => setSelectedObject(e.selected?.[0] || null));
    fc.on('selection:updated', (e: any) => setSelectedObject(e.selected?.[0] || null));
    fc.on('selection:cleared', () => setSelectedObject(null));
    fc.on('object:moving', (e: any) => {
      if (!snapEnabled) return;
      const obj = e.target; if (!obj) return;
      const canvasW = fc.getWidth() / (fc.getZoom() || 1);
      const canvasH = fc.getHeight() / (fc.getZoom() || 1);
      const centerX = canvasW / 2; const centerY = canvasH / 2;
      const objCenterX = (obj.left || 0) + (obj.getScaledWidth() / 2);
      const objCenterY = (obj.top || 0) + (obj.getScaledHeight() / 2);
      const threshold = 6;
      if (Math.abs(objCenterX - centerX) < threshold) obj.set('left', centerX - obj.getScaledWidth() / 2);
      if (Math.abs(objCenterY - centerY) < threshold) obj.set('top', centerY - obj.getScaledHeight() / 2);
    });
    return () => { fc.dispose(); fabricRef.current = null; };
  }, []);

  // No DOM manipulation needed - canvas always lives in canvas-wrapper via stable rendering

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const fc = fabricRef.current;
      if (!fc || !currentProject) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); }
      else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); undo(); }
        else if (e.key === 'y') { e.preventDefault(); redo(); }
        else if (e.key === 's') { e.preventDefault(); handleSave(); }
        else if (e.key === 'd') { e.preventDefault(); duplicateObj(); }
        else if (e.key === 'g') { e.preventDefault(); setShowGrid(prev => !prev); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject, history, historyIdx]);

  const pushHistory = useCallback(() => {
    if (!fabricRef.current || isRestoring.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON());
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIdx + 1);
      newHistory.push(json);
      if (newHistory.length > 50) newHistory.shift();
      setHistoryIdx(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx <= 0 || !fabricRef.current) return;
    const newIdx = historyIdx - 1;
    isRestoring.current = true;
    fabricRef.current.loadFromJSON(JSON.parse(history[newIdx])).then(() => {
      fabricRef.current?.renderAll(); setHistoryIdx(newIdx); isRestoring.current = false; syncLayers();
    });
  }, [history, historyIdx, syncLayers]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1 || !fabricRef.current) return;
    const newIdx = historyIdx + 1;
    isRestoring.current = true;
    fabricRef.current.loadFromJSON(JSON.parse(history[newIdx])).then(() => {
      fabricRef.current?.renderAll(); setHistoryIdx(newIdx); isRestoring.current = false; syncLayers();
    });
  }, [history, historyIdx, syncLayers]);

  // ── Add shape delimiter to canvas ──
  const addShapeDelimiter = useCallback((fc: FabricCanvas, fmt: LabelFormat) => {
    // Remove existing delimiter
    const existing = fc.getObjects().filter((o: any) => o.__isDelimiter);
    existing.forEach(o => fc.remove(o));

    const w = mmToPx(fmt.widthMm);
    const h = mmToPx(fmt.heightMm);
    let delimiter: FabricObject;

    if (fmt.shape === 'round') {
      delimiter = new Circle({
        left: w / 2, top: h / 2,
        radius: w / 2 - 2,
        originX: 'center', originY: 'center',
        fill: 'transparent', stroke: '#cbd5e1', strokeWidth: 2,
        strokeDashArray: [8, 6],
        selectable: false, evented: false,
      });
    } else {
      const rx = (fmt.shape === 'rounded-square' || fmt.shape === 'rounded-rectangle') ? mmToPx(3) : 0;
      delimiter = new Rect({
        left: 1, top: 1, width: w - 2, height: h - 2,
        rx, ry: rx,
        fill: 'transparent', stroke: '#cbd5e1', strokeWidth: 2,
        strokeDashArray: [8, 6],
        selectable: false, evented: false,
      });
    }
    (delimiter as any).__isDelimiter = true;
    (delimiter as any).__layerName = '— Limite —';
    fc.add(delimiter);
    fc.sendObjectToBack(delimiter);
  }, []);

  const applyFormat = useCallback((fmt: LabelFormat) => {
    const fc = fabricRef.current; if (!fc) return;
    const w = mmToPx(fmt.widthMm); const h = mmToPx(fmt.heightMm);
    fc.setDimensions({ width: w, height: h });
    fc.clipPath = undefined;
    if (fmt.shape === 'round') fc.clipPath = new Circle({ radius: w / 2, originX: 'center', originY: 'center', left: w / 2, top: h / 2 });
    else if (fmt.shape === 'rounded-square' || fmt.shape === 'rounded-rectangle') fc.clipPath = new Rect({ width: w, height: h, rx: mmToPx(3), ry: mmToPx(3), originX: 'center', originY: 'center', left: w / 2, top: h / 2 });
    addShapeDelimiter(fc, fmt);
    fc.renderAll(); fitToContainer();
  }, [addShapeDelimiter]);

  const fitToContainer = useCallback(() => {
    const fc = fabricRef.current; const container = containerRef.current;
    if (!fc || !container) return;
    const cw = container.clientWidth - 48; const ch = container.clientHeight - 48;
    if (cw <= 0 || ch <= 0) return;
    const canvasW = fc.getWidth(); const canvasH = fc.getHeight();
    if (canvasW <= 0 || canvasH <= 0) return;
    // Limit to 70% of container for breathing room (Photoshop style)
    const scale = Math.min((cw * 0.7) / canvasW, (ch * 0.7) / canvasH, 1);
    if (!Number.isFinite(scale) || scale <= 0) return;
    setZoom(scale); fc.setZoom(scale);
    fc.setDimensions({ width: canvasW * scale, height: canvasH * scale }, { cssOnly: true });
  }, []);

  useEffect(() => {
    window.addEventListener('resize', fitToContainer);
    return () => window.removeEventListener('resize', fitToContainer);
  }, [fitToContainer]);

  useEffect(() => {
    if (!currentProject || !selectedFormat) return;
    const frame = window.requestAnimationFrame(() => fitToContainer());
    return () => window.cancelAnimationFrame(frame);
  }, [currentProject?.id, selectedFormat?.id, fitToContainer]);

  useEffect(() => {
    if (currentProject) return;
    setSelectedObject(null);
    setLayers([]);
  }, [currentProject]);

  const handleBgColorChange = useCallback((color: string) => {
    setBgColor(color);
    const fc = fabricRef.current;
    if (fc) { fc.backgroundColor = color; fc.renderAll(); markDirty(); }
  }, [markDirty]);

  const generateThumbnail = useCallback(async () => {
    const fc = fabricRef.current;
    if (!fc || !currentProject || !selectedFormat || !user) return;
    await generateAndUploadThumbnail(fc, currentProject.id, user.id, selectedFormat);
  }, [currentProject, selectedFormat, user]);

  const resetCanvas = useCallback((background = '#ffffff') => {
    const fc = fabricRef.current;
    if (!fc) return;
    isRestoring.current = true;
    fc.clear();
    fc.backgroundColor = background;
    fc.clipPath = undefined;
    fc.discardActiveObject();
    fc.renderAll();
    isRestoring.current = false;
    setSelectedObject(null);
    setLayers([]);
    setBgColor(background);
  }, []);

  // ── Project CRUD ──
  const handleNewProject = async () => {
    if (!selectedFormat) { toast.error('Selecione um formato'); return; }
    const proj = await createProject({ name: projectName, label_shape: selectedFormat.shape, width_mm: selectedFormat.widthMm, height_mm: selectedFormat.heightMm });
    if (proj) {
      resetCanvas();
      setCurrentProject(proj);
      setProjectName(proj.name);
      applyFormat(selectedFormat);
      pushHistory();
    }
  };

  const loadProject = useCallback(async (proj: LabelProject) => {
    const fc = fabricRef.current; if (!fc) return;
    resetCanvas();
    setCurrentProject(proj); setProjectName(proj.name);
    const fmt: LabelFormat = { id: `${proj.label_shape}-${proj.width_mm}x${proj.height_mm}`, shape: proj.label_shape as any, label: `${proj.width_mm / 10}×${proj.height_mm / 10} cm`, widthMm: proj.width_mm, heightMm: proj.height_mm };
    setSelectedFormat(fmt); setSelectedShape(proj.label_shape); applyFormat(fmt);
    if (proj.canvas_json && Object.keys(proj.canvas_json).length > 0) {
      isRestoring.current = true;
      await fc.loadFromJSON(proj.canvas_json);
      fc.renderAll(); isRestoring.current = false;
      setBgColor((fc.backgroundColor as string) || '#ffffff');
    }
    pushHistory(); syncLayers();
  }, [applyFormat, pushHistory, resetCanvas, syncLayers]);

  // ── Drawing mode ──
  const toggleDrawingMode = useCallback((enable: boolean) => {
    const fc = fabricRef.current; if (!fc) return;
    fc.isDrawingMode = enable;
    setDrawingMode(enable);
    if (enable) {
      const brush = new PencilBrush(fc);
      brush.width = brushWidth;
      brush.color = brushColor;
      fc.freeDrawingBrush = brush;
      setActiveTool('draw');
      fc.discardActiveObject();
      fc.renderAll();
    } else {
      setActiveTool('select');
    }
  }, [brushWidth, brushColor]);

  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc || !fc.freeDrawingBrush || !drawingMode) return;
    fc.freeDrawingBrush.width = brushWidth;
    fc.freeDrawingBrush.color = brushColor;
  }, [brushWidth, brushColor, drawingMode]);

  const eraseLastDrawing = useCallback(() => {
    const fc = fabricRef.current; if (!fc) return;
    const objs = fc.getObjects();
    for (let i = objs.length - 1; i >= 0; i--) {
      if (objs[i].type === 'path' && !(objs[i] as any).__isDelimiter) {
        fc.remove(objs[i]);
        fc.renderAll();
        break;
      }
    }
  }, []);

  // ── Add SVG element from library ──
  const addSvgElement = useCallback((element: SvgElement) => {
    const fc = fabricRef.current; if (!fc) return;
    const canvasW = fc.getWidth() / (fc.getZoom() || 1);
    const canvasH = fc.getHeight() / (fc.getZoom() || 1);
    const size = Math.min(canvasW, canvasH) * 0.25;
    const pathObj = new Path(element.path, {
      left: canvasW / 2,
      top: canvasH / 2,
      originX: 'center',
      originY: 'center',
      fill: 'transparent',
      stroke: '#333333',
      strokeWidth: 2,
      scaleX: size / 24,
      scaleY: size / 24,
    });
    (pathObj as any).__layerName = element.name;
    fc.add(pathObj);
    fc.setActiveObject(pathObj);
    fc.renderAll();
  }, []);

  // ── Add elements ──
  const addText = () => {
    const fc = fabricRef.current; if (!fc) return;
    const canvasW = fc.getWidth() / (fc.getZoom() || 1);
    const canvasH = fc.getHeight() / (fc.getZoom() || 1);
    const minDim = Math.min(canvasW, canvasH);
    const fontSize = Math.max(16, Math.round(minDim * 0.12));
    const text = new IText('Seu Texto', {
      left: canvasW / 2, top: canvasH / 2,
      originX: 'center', originY: 'center',
      fontSize, fontFamily: 'Montserrat', fill: '#333333', textAlign: 'center',
    });
    loadGoogleFont('Montserrat');
    fc.add(text); fc.setActiveObject(text); fc.renderAll();
  };

  const addCurvedText = () => {
    const fc = fabricRef.current; if (!fc) return;
    const canvasW = fc.getWidth() / (fc.getZoom() || 1);
    const canvasH = fc.getHeight() / (fc.getZoom() || 1);
    const minDim = Math.min(canvasW, canvasH);
    const radius = minDim * 0.3;
    const fontSize = Math.max(14, Math.round(minDim * 0.08));
    const textStr = 'TEXTO EM ARCO';
    const charAngle = 360 / (textStr.length * 2.5);
    const startAngle = -90 - (textStr.length - 1) * charAngle / 2;
    const centerX = canvasW / 2;
    const centerY = canvasH / 2;

    const groupObjects: FabricObject[] = [];
    for (let i = 0; i < textStr.length; i++) {
      const angleDeg = startAngle + i * charAngle;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = centerX + radius * Math.cos(angleRad);
      const y = centerY + radius * Math.sin(angleRad);
      const charText = new IText(textStr[i], {
        left: x, top: y,
        originX: 'center', originY: 'center',
        fontSize, fontFamily: 'Montserrat', fill: '#333333',
        angle: angleDeg + 90,
        selectable: false, evented: false,
      });
      (charText as any).__isCurvedChar = true;
      groupObjects.push(charText);
    }

    // Add a control circle (invisible, acts as group anchor)
    const controlCircle = new Circle({
      left: centerX, top: centerY,
      originX: 'center', originY: 'center',
      radius: radius,
      fill: 'transparent', stroke: 'transparent',
      strokeWidth: 0,
      selectable: true, evented: true,
    });
    (controlCircle as any).__isCurvedTextController = true;
    (controlCircle as any).__curvedText = textStr;
    (controlCircle as any).__curvedRadius = radius;
    (controlCircle as any).__curvedFontSize = fontSize;
    (controlCircle as any).__curvedFontFamily = 'Montserrat';
    (controlCircle as any).__curvedFill = '#333333';
    (controlCircle as any).__curvedCharIds = groupObjects.map((_, idx) => idx);
    (controlCircle as any).__layerName = 'Texto em Arco';

    groupObjects.forEach(obj => fc.add(obj));
    fc.add(controlCircle);
    fc.setActiveObject(controlCircle);
    fc.renderAll();
    loadGoogleFont('Montserrat');
    toast.success('Texto em arco adicionado! Selecione o círculo de controle para mover.');
  };

  const rebuildCurvedText = useCallback((controller: any) => {
    const fc = fabricRef.current; if (!fc) return;
    // Remove old curved chars
    const allObjs = fc.getObjects();
    const oldChars = allObjs.filter((o: any) => o.__isCurvedChar);
    oldChars.forEach(o => fc.remove(o));

    const textStr = controller.__curvedText || 'TEXTO';
    const radius = controller.__curvedRadius || 100;
    const fontSize = controller.__curvedFontSize || 16;
    const fontFamily = controller.__curvedFontFamily || 'Montserrat';
    const fill = controller.__curvedFill || '#333333';
    const centerX = controller.left || 0;
    const centerY = controller.top || 0;
    const charAngle = 360 / (textStr.length * 2.5);
    const startAngle = -90 - (textStr.length - 1) * charAngle / 2;

    for (let i = 0; i < textStr.length; i++) {
      const angleDeg = startAngle + i * charAngle;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = centerX + radius * Math.cos(angleRad);
      const y = centerY + radius * Math.sin(angleRad);
      const charText = new IText(textStr[i], {
        left: x, top: y,
        originX: 'center', originY: 'center',
        fontSize, fontFamily, fill,
        angle: angleDeg + 90,
        selectable: false, evented: false,
      });
      (charText as any).__isCurvedChar = true;
      fc.add(charText);
    }

    // Update controller radius
    controller.set('radius', radius);
    fc.renderAll();
    markDirty();
  }, [markDirty]);


  const addShape = (type: string) => {
    const fc = fabricRef.current; if (!fc) return;
    const centerX = fc.getWidth() / (2 * (zoom || 1));
    const centerY = fc.getHeight() / (2 * (zoom || 1));
    let obj: any;
    switch (type) {
      case 'rect': obj = new Rect({ left: centerX - 30, top: centerY - 20, width: 60, height: 40, fill: '#e2e8f0', stroke: '#94a3b8', strokeWidth: 1 }); break;
      case 'circle': obj = new Circle({ left: centerX - 20, top: centerY - 20, radius: 20, fill: '#dbeafe', stroke: '#60a5fa', strokeWidth: 1 }); break;
      case 'triangle': obj = new Triangle({ left: centerX - 20, top: centerY - 20, width: 40, height: 40, fill: '#fef3c7', stroke: '#f59e0b', strokeWidth: 1 }); break;
      case 'line': obj = new Line([centerX - 40, centerY, centerX + 40, centerY], { stroke: '#333', strokeWidth: 2 }); break;
      case 'ellipse': obj = new Ellipse({ left: centerX - 30, top: centerY - 15, rx: 30, ry: 15, fill: '#ede9fe', stroke: '#8b5cf6', strokeWidth: 1 }); break;
      default: return;
    }
    fc.add(obj); fc.setActiveObject(obj); fc.renderAll();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const imgEl = new window.Image();
      imgEl.onload = () => {
        const fc = fabricRef.current!;
        const canvasW = fc.getWidth() / (fc.getZoom() || 1);
        const canvasH = fc.getHeight() / (fc.getZoom() || 1);
        const maxDim = Math.min(canvasW, canvasH) * 0.6;
        const scale = Math.min(maxDim / imgEl.width, maxDim / imgEl.height, 1);
        const fabricImg = new FabricImage(imgEl, { left: canvasW / 2 - (imgEl.width * scale) / 2, top: canvasH / 2 - (imgEl.height * scale) / 2, scaleX: scale, scaleY: scale });
        (fabricImg as any).__layerName = file.name.replace(/\.[^.]+$/, '');
        fc.add(fabricImg); fc.setActiveObject(fabricImg); fc.renderAll();
      };
      imgEl.src = dataUrl;
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const applyTemplate = (template: LabelTemplate) => {
    const fc = fabricRef.current;
    if (!fc || !selectedFormat) return;
    resetCanvas();
    applyFormat(selectedFormat);
    const objs = template.getObjects(selectedFormat.widthMm, selectedFormat.heightMm);
    objs.forEach(obj => { loadGoogleFont(obj.fontFamily || 'Arial'); addObjectFromJson(fc, obj); });
    fc.renderAll(); markDirty(); syncLayers();
    toast.success(`Template "${template.name}" aplicado`);
  };

  const addDecorative = (element: DecorativeElement) => {
    const fc = fabricRef.current;
    if (!fc || !selectedFormat) return;
    const objs = element.getObjects(selectedFormat.widthMm, selectedFormat.heightMm);
    objs.forEach(obj => addObjectFromJson(fc, obj));
    fc.renderAll(); markDirty(); syncLayers();
  };

  const addObjectFromJson = (fc: FabricCanvas, obj: any) => {
    let fabricObj: FabricObject | null = null;
    switch (obj.type) {
      case 'rect': fabricObj = new Rect({ left: obj.left, top: obj.top, width: obj.width, height: obj.height, fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth, rx: obj.rx, ry: obj.ry, strokeDashArray: obj.strokeDashArray }); break;
      case 'circle': fabricObj = new Circle({ left: obj.left, top: obj.top, radius: obj.radius, fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth }); break;
      case 'i-text': fabricObj = new IText(obj.text || '', { left: obj.left, top: obj.top, fontSize: obj.fontSize, fontFamily: obj.fontFamily, fill: obj.fill, textAlign: obj.textAlign, fontWeight: obj.fontWeight, fontStyle: obj.fontStyle, charSpacing: obj.charSpacing }); break;
      case 'line': fabricObj = new Line([obj.x1, obj.y1, obj.x2, obj.y2], { stroke: obj.stroke, strokeWidth: obj.strokeWidth }); break;
      case 'triangle': fabricObj = new Triangle({ left: obj.left, top: obj.top, width: obj.width, height: obj.height, fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth }); break;
      case 'ellipse': fabricObj = new Ellipse({ left: obj.left, top: obj.top, rx: obj.rx, ry: obj.ry, fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth }); break;
    }
    if (fabricObj) fc.add(fabricObj);
  };

  const updateObjectProp = (prop: string, value: any) => {
    if (!selectedObject || !fabricRef.current) return;
    selectedObject.set(prop, value); fabricRef.current.renderAll(); markDirty();
  };

  const alignObject = (alignment: string) => {
    const fc = fabricRef.current;
    if (!fc || !selectedObject) return;
    const canvasW = fc.getWidth() / (fc.getZoom() || 1);
    const canvasH = fc.getHeight() / (fc.getZoom() || 1);
    switch (alignment) {
      case 'left': selectedObject.set('left', 0); break;
      case 'center-h': selectedObject.set('left', canvasW / 2 - selectedObject.getScaledWidth() / 2); break;
      case 'right': selectedObject.set('left', canvasW - selectedObject.getScaledWidth()); break;
      case 'top': selectedObject.set('top', 0); break;
      case 'center-v': selectedObject.set('top', canvasH / 2 - selectedObject.getScaledHeight() / 2); break;
      case 'bottom': selectedObject.set('top', canvasH - selectedObject.getScaledHeight()); break;
    }
    fc.renderAll(); markDirty();
  };

  const toggleLayerVisibility = (layer: LayerItem) => { layer.obj.visible = !layer.obj.visible; fabricRef.current?.renderAll(); syncLayers(); markDirty(); };
  const toggleLayerLock = (layer: LayerItem) => { const locked = !layer.locked; layer.obj.selectable = !locked; layer.obj.evented = !locked; fabricRef.current?.renderAll(); syncLayers(); };
  const selectLayer = (layer: LayerItem) => { if (!layer.obj.selectable) return; fabricRef.current?.setActiveObject(layer.obj); fabricRef.current?.renderAll(); setSelectedObject(layer.obj); };
  const moveLayerUp = (layer: LayerItem) => { fabricRef.current?.bringObjectForward(layer.obj); fabricRef.current?.renderAll(); syncLayers(); markDirty(); };
  const moveLayerDown = (layer: LayerItem) => { fabricRef.current?.sendObjectBackwards(layer.obj); fabricRef.current?.renderAll(); syncLayers(); markDirty(); };
  const renameLayer = (layer: LayerItem, newName: string) => { (layer.obj as any).__layerName = newName; syncLayers(); };


  const handleSave = async () => {
    if (!currentProject || !fabricRef.current) return;
    const ok = await saveProject(currentProject.id, fabricRef.current.toJSON());
    if (ok) { toast.success('Projeto salvo'); generateThumbnail(); }
  };

  const handleSaveVersion = async () => {
    if (!currentProject || !fabricRef.current) return;
    await saveVersion(currentProject.id, fabricRef.current.toJSON());
  };

  const handleDuplicateDesign = async () => {
    if (!currentProject || !fabricRef.current || !selectedFormat) return;
    const proj = await createProject({ name: `${currentProject.name} (cópia)`, label_shape: selectedFormat.shape, width_mm: selectedFormat.widthMm, height_mm: selectedFormat.heightMm });
    if (proj) { await saveProject(proj.id, fabricRef.current.toJSON()); await refetch(); toast.success('Design duplicado!'); }
  };

  const handleSaveAsNew = async () => {
    if (!fabricRef.current || !selectedFormat || !saveAsName.trim()) return;
    const proj = await createProject({ name: saveAsName.trim(), label_shape: selectedFormat.shape, width_mm: selectedFormat.widthMm, height_mm: selectedFormat.heightMm });
    if (proj) {
      await saveProject(proj.id, fabricRef.current.toJSON());
      setCurrentProject(proj); setProjectName(proj.name); setShowSaveAsDialog(false); await refetch(); toast.success('Salvo como novo projeto!');
    }
  };

  const handleAddToCart = () => {
    if (!currentProject || !selectedFormat) return;
    const finishing = FINISHING_OPTIONS.find(f => f.id === cartFinishing);
    const basePrice = 0.15; const unitPrice = basePrice + (finishing?.price || 0);
    generateThumbnail();
    addItem({
      productId: `label-${currentProject.id}`, productName: `Etiqueta: ${currentProject.name}`,
      thumbnail: currentProject.thumbnail_url || '', unitPrice, quantity: cartQuantity,
      customWidth: selectedFormat.widthMm, customHeight: selectedFormat.heightMm,
      notes: `Formato: ${selectedFormat.shape} | Acabamento: ${finishing?.label || 'Brilhante'} | Projeto: ${currentProject.id}`,
      needsArtwork: false, priceUnit: 'unidade',
    });
    setShowAddToCart(false);
    toast.success('Etiqueta adicionada ao carrinho!', { action: { label: 'Ver Carrinho', onClick: () => navigate('/carrinho') } });
  };

  const deleteSelected = () => {
    const fc = fabricRef.current; if (!fc) return;
    const active = fc.getActiveObjects();
    active.forEach(obj => fc.remove(obj));
    fc.discardActiveObject(); fc.renderAll();
  };

  const bringForward = () => { if (selectedObject && fabricRef.current) { fabricRef.current.bringObjectForward(selectedObject); fabricRef.current.renderAll(); syncLayers(); } };
  const sendBackward = () => { if (selectedObject && fabricRef.current) { fabricRef.current.sendObjectBackwards(selectedObject); fabricRef.current.renderAll(); syncLayers(); } };
  const duplicateObj = () => {
    if (!selectedObject || !fabricRef.current) return;
    selectedObject.clone((cloned: any) => {
      cloned.set({ left: (cloned.left || 0) + 10, top: (cloned.top || 0) + 10 });
      fabricRef.current!.add(cloned); fabricRef.current!.setActiveObject(cloned); fabricRef.current!.renderAll();
    });
  };

  const zoomIn = () => { const fc = fabricRef.current; if (!fc) return; const nz = Math.min(zoom * 1.2, 3); setZoom(nz); fc.setZoom(nz); fc.setDimensions({ width: fc.getWidth() * (nz / zoom), height: fc.getHeight() * (nz / zoom) }, { cssOnly: true }); };
  const zoomOut = () => { const fc = fabricRef.current; if (!fc) return; const nz = Math.max(zoom / 1.2, 0.3); setZoom(nz); fc.setZoom(nz); fc.setDimensions({ width: fc.getWidth() * (nz / zoom), height: fc.getHeight() * (nz / zoom) }, { cssOnly: true }); };

  const availableFormats = selectedShape ? getFormatsForShape(selectedShape) : [];
  const selectedFinishing = FINISHING_OPTIONS.find(f => f.id === cartFinishing);
  const cartUnitPrice = 0.15 + (selectedFinishing?.price || 0);
  const cartTotal = cartUnitPrice * cartQuantity;

  const gridOverlayStyle = {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)`,
    backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
    pointerEvents: 'none' as const,
    opacity: showGrid && currentProject ? 1 : 0,
  };

  // ── Template color preview helper ──
  const getTemplateColors = (t: LabelTemplate): string[] => {
    if (!selectedFormat) return ['#f0f0f0'];
    const objs = t.getObjects(selectedFormat.widthMm, selectedFormat.heightMm);
    const colors = objs.map(o => o.fill).filter((c: any) => c && c !== 'transparent' && c !== 'none');
    return colors.length > 0 ? colors.slice(0, 4) : ['#f0f0f0'];
  };

  const currentShapeLabel = currentProject
    ? LABEL_SHAPES.find(s => s.id === currentProject.label_shape)?.label || currentProject.label_shape
    : '';
  const currentSizeLabel = currentProject
    ? `${currentProject.width_mm / 10}×${currentProject.height_mm / 10}cm`
    : '';

  // ══════════════════════════════════════
  // ── RENDER (single return to keep canvas mounted) ──
  // ══════════════════════════════════════
  return (
    <TooltipProvider delayDuration={300}>
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* ── WIZARD VIEW (no project open) ── */}
      <div style={{ display: currentProject ? 'none' : undefined }}>
        <div className="space-y-6 max-w-4xl mx-auto">
          {showOnboarding && (
            <div className="relative bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-5">
              <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-8 w-8" onClick={dismissOnboarding}><X className="h-4 w-4" /></Button>
              <h3 className="font-semibold text-sm mb-3">Bem-vindo ao Editor de Etiquetas!</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/60">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">1</div>
                  <div><p className="text-xs font-medium">Escolha o formato</p><p className="text-[11px] text-muted-foreground mt-0.5">Selecione a forma e o tamanho da etiqueta</p></div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/60">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">2</div>
                  <div><p className="text-xs font-medium">Personalize</p><p className="text-[11px] text-muted-foreground mt-0.5">Adicione textos, imagens e escolha cores</p></div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/60">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">3</div>
                  <div><p className="text-xs font-medium">Salve e peça</p><p className="text-[11px] text-muted-foreground mt-0.5">Salve o projeto e adicione ao carrinho</p></div>
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <h1 className="text-2xl font-display font-bold">Editor de Etiquetas</h1>
            <p className="text-muted-foreground text-sm mt-1">Crie etiquetas personalizadas de forma fácil e profissional</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-6">
                {['Formato', 'Tamanho', 'Nome', 'Modelo'].map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      wizardStep === i ? 'bg-primary text-primary-foreground' :
                      wizardStep > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {wizardStep > i ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className={`text-sm hidden sm:inline ${wizardStep === i ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
                    {i < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                ))}
              </div>

              {wizardStep === 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-center mb-4">Qual o formato da sua etiqueta?</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {LABEL_SHAPES.map(s => {
                      const vis = SHAPE_VISUALS[s.id];
                      return (
                        <button key={s.id} onClick={() => { setSelectedShape(s.id); setSelectedFormat(null); setWizardStep(1); }}
                          className={`group relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-md hover:border-primary/50 ${
                            selectedShape === s.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border'
                          }`}>
                          <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${vis?.color || ''} flex items-center justify-center transition-transform group-hover:scale-105`}>
                            <svg viewBox="0 0 100 100" className="w-14 h-14 text-foreground/70">{vis?.svg}</svg>
                          </div>
                          <span className="text-sm font-medium">{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {wizardStep === 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setWizardStep(0)}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
                    <h2 className="text-lg font-semibold">Escolha o tamanho</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {availableFormats.map(f => {
                      const isSquare = f.widthMm === f.heightMm;
                      const maxPrev = 60;
                      const prevW = isSquare ? maxPrev : maxPrev;
                      const prevH = isSquare ? maxPrev : (f.heightMm / f.widthMm) * maxPrev;
                      const shapeStyle: React.CSSProperties = {
                        width: prevW, height: prevH,
                        borderRadius: f.shape === 'round' ? '50%' : (f.shape === 'rounded-square' || f.shape === 'rounded-rectangle') ? 8 : 2,
                      };
                      return (
                        <button key={f.id} onClick={() => { setSelectedFormat(f); setWizardStep(2); }}
                          className={`group flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md hover:border-primary/50 ${
                            selectedFormat?.id === f.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border'
                          }`}>
                          <div className="flex items-center justify-center h-16">
                            <div style={shapeStyle} className="border-2 border-foreground/20 bg-muted/50 transition-transform group-hover:scale-110" />
                          </div>
                          <span className="text-sm font-semibold">{f.label}</span>
                          <span className="text-xs text-muted-foreground">{f.widthMm}×{f.heightMm}mm</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="max-w-md mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setWizardStep(1)}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
                    <h2 className="text-lg font-semibold">Dê um nome ao projeto</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 100 100" className="w-10 h-10 text-primary">{SHAPE_VISUALS[selectedShape]?.svg}</svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{LABEL_SHAPES.find(s => s.id === selectedShape)?.label}</p>
                        <p className="text-xs text-muted-foreground">{selectedFormat?.label} ({selectedFormat?.widthMm}×{selectedFormat?.heightMm}mm)</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Nome do projeto</Label>
                      <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Ex: Etiqueta Natal 2025" className="mt-1" autoFocus />
                    </div>
                    <Button className="w-full" size="lg" onClick={() => setWizardStep(3)}>
                      Próximo <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setWizardStep(2)}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
                    <h2 className="text-lg font-semibold">Comece com um modelo ou do zero</h2>
                  </div>
                  <div className="mb-4">
                    <Button variant="outline" className="w-full mb-4 h-14 text-base" onClick={handleNewProject} disabled={!selectedFormat}>
                      <Plus className="h-5 w-5 mr-2" />Começar do Zero (canvas em branco)
                    </Button>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Ou escolha um modelo pronto</p>
                  <div className="space-y-4">
                    {TEMPLATE_CATEGORIES.map(cat => {
                      const templates = getTemplatesByCategory(cat.id);
                      if (templates.length === 0) return null;
                      return (
                        <div key={cat.id}>
                          <p className="text-sm font-medium mb-2">{cat.emoji} {cat.label}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {templates.map(t => {
                              const colors = getTemplateColors(t);
                              return (
                                <button key={t.id} onClick={async () => {
                                  const proj = await createProject({ name: projectName || t.name, label_shape: selectedFormat!.shape, width_mm: selectedFormat!.widthMm, height_mm: selectedFormat!.heightMm });
                                  if (proj) {
                                    resetCanvas();
                                    setCurrentProject(proj);
                                    setProjectName(proj.name);
                                    applyFormat(selectedFormat!);
                                    const objs = t.getObjects(selectedFormat!.widthMm, selectedFormat!.heightMm);
                                    objs.forEach(obj => { loadGoogleFont(obj.fontFamily || 'Arial'); addObjectFromJson(fabricRef.current!, obj); });
                                    fabricRef.current?.renderAll();
                                    pushHistory();
                                    syncLayers();
                                    markDirty();
                                    toast.success(`Modelo "${t.name}" aplicado!`);
                                  }
                                }} className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-border hover:border-primary/50 hover:shadow-md transition-all group">
                                  <div className="w-full aspect-square rounded-lg flex items-center justify-center overflow-hidden relative bg-white">
                                    <div className="w-full h-full flex gap-0.5">
                                      {colors.map((c, i) => (
                                        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                                      ))}
                                    </div>
                                  </div>
                                  <span className="text-xs font-medium truncate w-full text-center">{t.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{t.description}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {projects.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Meus Projetos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {projects.map(p => (
                  <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => loadProject(p)}>
                    <CardContent className="p-4 flex gap-3">
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt={p.name} className="w-16 h-16 rounded-lg object-cover shrink-0 border group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 border">
                          <Palette className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{LABEL_SHAPES.find(s => s.id === p.label_shape)?.label || p.label_shape} • {p.width_mm / 10}×{p.height_mm / 10}cm</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(p.updated_at), 'dd/MM/yy HH:mm')}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Excluir projeto?')) deleteProject(p.id);
                      }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── EDITOR VIEW (project open) ── */}
      <div style={{ display: currentProject ? undefined : 'none' }} className="flex flex-col h-[calc(100vh-140px)]">
          <PrintPreviewDialog open={showPrintPreview} onOpenChange={setShowPrintPreview} canvasRef={fabricRef} format={selectedFormat} />

        {/* ── TOP BAR ── */}
        <div className="flex items-center gap-2 px-2 py-2 border-b bg-card flex-wrap shrink-0">
          <Button variant="ghost" size="sm" onClick={() => { setCurrentProject(null); setSelectedObject(null); setLayers([]); setWizardStep(0); setSelectedShape(''); setSelectedFormat(null); }} className="shrink-0">
            <ArrowLeft className="h-4 w-4 mr-1" />Voltar
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            onBlur={() => { if (currentProject) supabase.from('label_projects').update({ name: projectName } as any).eq('id', currentProject.id); }}
            className="w-40 h-8 text-sm"
          />
          <Badge variant="secondary" className="text-xs shrink-0">
            {currentShapeLabel} • {currentSizeLabel}
          </Badge>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={handleSave}>
                <Save className="h-4 w-4" /><span className="hidden lg:inline text-xs">Salvar rascunho</span>
              </Button>
            </TooltipTrigger><TooltipContent>Salvar rascunho (Ctrl+S)</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={handleSaveVersion}>
                <FileText className="h-4 w-4" /><span className="hidden lg:inline text-xs">Salvar versão</span>
              </Button>
            </TooltipTrigger><TooltipContent>Salvar versão</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPrintPreview(true)}><Printer className="h-4 w-4" /></Button>
            </TooltipTrigger><TooltipContent>Prévia de impressão</TooltipContent></Tooltip>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button size="sm" onClick={() => setShowAddToCart(true)} className="h-8">
              <ShoppingCart className="h-4 w-4 mr-1" />Pedir
            </Button>
          </div>
        </div>

        {/* ── MAIN AREA: Toolbar + Canvas + Properties ── */}
        <div className="flex flex-1 min-h-0 relative">

          {/* ── VERTICAL TOOLBAR (Photoshop style) ── */}
          <div className="w-12 shrink-0 border-r bg-card flex flex-col items-center py-2 gap-1">
            <Tooltip><TooltipTrigger asChild>
              <Button variant={activeTool === 'select' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => { toggleDrawingMode(false); setActiveTool('select'); fabricRef.current?.discardActiveObject(); fabricRef.current?.renderAll(); setSelectedObject(null); }}>
                <MousePointer2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="right">Seleção</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { toggleDrawingMode(false); setActiveTool('select'); addText(); }}>
                <Type className="h-4 w-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="right">Texto</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { toggleDrawingMode(false); setActiveTool('select'); addCurvedText(); }}>
                <WrapText className="h-4 w-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="right">Texto em Arco</TooltipContent></Tooltip>

            <Separator className="w-6 my-1" />

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { toggleDrawingMode(false); addShape('rect'); }}>
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="right">Retângulo</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { toggleDrawingMode(false); addShape('circle'); }}>
                <CircleIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="right">Círculo</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { toggleDrawingMode(false); addShape('triangle'); }}>
                <TriangleIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="right">Triângulo</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { toggleDrawingMode(false); addShape('line'); }}>
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="right">Linha</TooltipContent></Tooltip>

            <Separator className="w-6 my-1" />

            <Tooltip><TooltipTrigger asChild>
              <Button variant={activeTool === 'draw' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => { if (drawingMode) { toggleDrawingMode(false); } else { toggleDrawingMode(true); } }}>
                <PenTool className="h-4 w-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="right">Desenho Livre</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { toggleDrawingMode(false); imageInputRef.current?.click(); }}>
                <ImageIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="right">Imagem</TooltipContent></Tooltip>

            <Separator className="w-6 my-1" />

            <Tooltip><TooltipTrigger asChild>
              <Button variant={showLeftPanel ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setShowLeftPanel(!showLeftPanel)}>
                <Palette className="h-4 w-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="right">Templates & Elementos</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowShortcuts(true)}>
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger><TooltipContent side="right">Atalhos</TooltipContent></Tooltip>
          </div>

          {/* ── LEFT PANEL (floating overlay on canvas) ── */}
          {showLeftPanel && (
            <div className="absolute left-12 top-0 bottom-0 z-30 w-56 lg:w-64 bg-card border-r shadow-xl flex flex-col" style={{ maxHeight: '100%' }}>
              <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Painel</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowLeftPanel(false)}><X className="h-3.5 w-3.5" /></Button>
              </div>
              <Tabs defaultValue="design" className="flex flex-col flex-1 min-h-0">
                <TabsList className="w-full grid grid-cols-3 mx-2 mt-2 shrink-0">
                  <TabsTrigger value="design" className="text-xs"><Palette className="h-3 w-3 mr-1" />Design</TabsTrigger>
                  <TabsTrigger value="elements" className="text-xs"><Shapes className="h-3 w-3 mr-1" />Elementos</TabsTrigger>
                  <TabsTrigger value="layers" className="text-xs"><Layers className="h-3 w-3 mr-1" />Camadas</TabsTrigger>
                </TabsList>

                <TabsContent value="design" className="flex-1 min-h-0 mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-3 space-y-4">
                      {/* Background */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Fundo</p>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={bgColor} onChange={e => handleBgColorChange(e.target.value)} className="h-8 w-8 rounded border cursor-pointer shrink-0" />
                          <Input value={bgColor} onChange={e => handleBgColorChange(e.target.value)} className="h-8 text-xs flex-1" />
                          {bgColor !== '#ffffff' && (
                            <Button variant="ghost" size="sm" className="h-8 text-xs px-2 shrink-0" onClick={() => handleBgColorChange('#ffffff')}>Reset</Button>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Templates */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Templates</p>
                        <div className="space-y-2">
                          {TEMPLATE_CATEGORIES.map(cat => {
                            const templates = getTemplatesByCategory(cat.id);
                            if (templates.length === 0) return null;
                            return (
                              <div key={cat.id}>
                                <p className="text-xs text-muted-foreground mb-1">{cat.emoji} {cat.label}</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {templates.map(t => {
                                    const colors = getTemplateColors(t);
                                    return (
                                      <button
                                        key={t.id}
                                        onClick={() => applyTemplate(t)}
                                        className="flex flex-col items-center gap-1 p-2 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all text-left"
                                      >
                                        <div className="w-full h-8 rounded flex gap-0.5 overflow-hidden">
                                          {colors.map((c, i) => (
                                            <div key={i} className="flex-1 rounded-sm" style={{ backgroundColor: c }} />
                                          ))}
                                        </div>
                                        <span className="text-[11px] font-medium truncate w-full">{t.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <Separator />

                      {/* Decorative elements */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Molduras & Ornamentos</p>
                        <div className="space-y-3">
                          {DECORATIVE_CATEGORIES.map(cat => {
                            const elements = getDecorativeByCategory(cat.id);
                            if (elements.length === 0) return null;
                            return (
                              <div key={cat.id}>
                                <p className="text-xs text-muted-foreground mb-1.5">{cat.emoji} {cat.label}</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {elements.map(el => (
                                    <button key={el.id} onClick={() => addDecorative(el)}
                                      className="flex flex-col items-center gap-1 p-2 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all">
                                      <div className="w-full h-10 rounded bg-muted/30 border border-dashed border-muted-foreground/20 flex items-center justify-center">
                                        <Frame className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                      <span className="text-[10px] font-medium truncate w-full text-center">{el.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="layers" className="flex-1 min-h-0 mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-3">
                      {layers.length === 0 ? (
                        <div className="text-center py-8">
                          <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Adicione elementos ao canvas para ver as camadas aqui.</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {layers.map(layer => (
                            <div key={`${layer.id}-${layer.name}`}
                              className={`flex items-center gap-1 p-1.5 rounded text-xs cursor-pointer transition-colors ${selectedObject === layer.obj ? 'bg-primary/10 border border-primary' : 'hover:bg-muted border border-transparent'}`}
                              onClick={() => selectLayer(layer)}>
                              <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                {editingLayerName === layer.id ? (
                                  <Input value={layerNameDraft} onChange={e => setLayerNameDraft(e.target.value)}
                                    onBlur={() => { renameLayer(layer, layerNameDraft); setEditingLayerName(null); }}
                                    onKeyDown={e => { if (e.key === 'Enter') { renameLayer(layer, layerNameDraft); setEditingLayerName(null); } }}
                                    className="h-5 text-xs p-1" autoFocus onClick={e => e.stopPropagation()} />
                                ) : (
                                  <span className="truncate block" onDoubleClick={(e) => { e.stopPropagation(); setEditingLayerName(layer.id); setLayerNameDraft(layer.name); }}>{layer.name}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); toggleLayerVisibility(layer); }}>
                                  {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); toggleLayerLock(layer); }}>
                                  {layer.locked ? <Lock className="h-3 w-3 text-muted-foreground" /> : <Unlock className="h-3 w-3" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); moveLayerUp(layer); }}>
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); moveLayerDown(layer); }}>
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* ── CENTER: CANVAS WORKSPACE ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Canvas area — dark worktable background (Photoshop style) */}
            <div className="flex-1 flex items-center justify-center overflow-auto" ref={containerRef} style={{ backgroundColor: '#3a3a3a' }}>
              <div className="relative shadow-2xl" id="canvas-wrapper" style={{ margin: 'auto' }}>
                <div className="absolute inset-0" style={gridOverlayStyle} />
                <div ref={canvasHostRef} />
              </div>
            </div>

            {/* ── STATUS BAR (bottom) ── */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t bg-card text-xs text-muted-foreground shrink-0">
              <div className="flex items-center gap-1">
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={undo} disabled={historyIdx <= 0}>
                    <Undo2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger><TooltipContent>Desfazer (Ctrl+Z)</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={redo} disabled={historyIdx >= history.length - 1}>
                    <Redo2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger><TooltipContent>Refazer (Ctrl+Y)</TooltipContent></Tooltip>

                <Separator orientation="vertical" className="h-4 mx-1" />

                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut}><ZoomOut className="h-3.5 w-3.5" /></Button>
                </TooltipTrigger><TooltipContent>Zoom -</TooltipContent></Tooltip>
                <span className="w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn}><ZoomIn className="h-3.5 w-3.5" /></Button>
                </TooltipTrigger><TooltipContent>Zoom +</TooltipContent></Tooltip>

                <Separator orientation="vertical" className="h-4 mx-1" />

                <Tooltip><TooltipTrigger asChild>
                  <Button variant={snapEnabled ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setSnapEnabled(!snapEnabled)}>
                    <span className="text-[10px] font-bold">S</span>
                  </Button>
                </TooltipTrigger><TooltipContent>Snap {snapEnabled ? 'ON' : 'OFF'}</TooltipContent></Tooltip>

                <Tooltip><TooltipTrigger asChild>
                  <Button variant={showGrid ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setShowGrid(!showGrid)}>
                    <Grid3X3 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger><TooltipContent>Grid (Ctrl+G)</TooltipContent></Tooltip>
              </div>

              <div className="flex items-center gap-3">
                <span>{currentShapeLabel} — {currentSizeLabel}</span>
                <span>{layers.length} elementos</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL: Properties (always visible, contextual) ── */}
          <div className="w-56 lg:w-60 shrink-0 border-l bg-card overflow-auto">
            <div className="p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {selectedObject ? 'Propriedades' : 'Canvas'}
              </p>

              {/* ── When NO object selected: show canvas properties ── */}
              {!selectedObject && (
                <>
                  <div>
                    <Label className="text-xs">Cor de fundo</Label>
                    <div className="flex gap-2 items-center mt-1">
                      <input type="color" value={bgColor} onChange={e => handleBgColorChange(e.target.value)} className="h-8 w-8 rounded border cursor-pointer" />
                      <Input value={bgColor} onChange={e => handleBgColorChange(e.target.value)} className="h-8 text-xs flex-1" />
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs">Formato</Label>
                    <p className="text-sm mt-1">{currentShapeLabel}</p>
                    <p className="text-xs text-muted-foreground">{currentSizeLabel}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs">Camadas: {layers.length}</Label>
                  </div>
                </>
              )}

              {/* ── When object selected: show object properties ── */}
              {selectedObject && (
                <>
                  <div>
                    <Label className="text-xs">Cor</Label>
                    <div className="flex gap-2 items-center mt-1">
                      <input type="color" value={selectedObject.fill || '#000000'} onChange={e => updateObjectProp('fill', e.target.value)} className="h-8 w-8 rounded border cursor-pointer" />
                      <Input value={selectedObject.fill || ''} onChange={e => updateObjectProp('fill', e.target.value)} className="h-8 text-xs flex-1" />
                    </div>
                  </div>

                  {/* Curved text controller properties */}
                  {(selectedObject as any)?.__isCurvedTextController && (
                    <>
                      <div>
                        <Label className="text-xs">Texto do arco</Label>
                        <Input
                          value={(selectedObject as any).__curvedText || ''}
                          onChange={e => {
                            const newText = e.target.value;
                            (selectedObject as any).__curvedText = newText;
                            rebuildCurvedText(selectedObject);
                          }}
                          className="h-8 text-xs mt-1"
                          placeholder="Texto em arco"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Raio do arco</Label>
                        <Input
                          type="range" min={30} max={300} step={5}
                          value={(selectedObject as any).__curvedRadius || 100}
                          onChange={e => {
                            (selectedObject as any).__curvedRadius = Number(e.target.value);
                            rebuildCurvedText(selectedObject);
                          }}
                          className="h-8 mt-1"
                        />
                        <span className="text-[10px] text-muted-foreground">{(selectedObject as any).__curvedRadius || 100}px</span>
                      </div>
                      <div>
                        <Label className="text-xs">Tamanho da fonte</Label>
                        <Input
                          type="number" min={8} max={72}
                          value={(selectedObject as any).__curvedFontSize || 16}
                          onChange={e => {
                            (selectedObject as any).__curvedFontSize = Math.max(8, Number(e.target.value));
                            rebuildCurvedText(selectedObject);
                          }}
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Cor do texto</Label>
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="color"
                            value={(selectedObject as any).__curvedFill || '#333333'}
                            onChange={e => {
                              (selectedObject as any).__curvedFill = e.target.value;
                              rebuildCurvedText(selectedObject);
                            }}
                            className="h-8 w-8 rounded border cursor-pointer"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Fonte</Label>
                        <Select
                          value={(selectedObject as any).__curvedFontFamily || 'Montserrat'}
                          onValueChange={v => {
                            loadGoogleFont(v);
                            (selectedObject as any).__curvedFontFamily = v;
                            rebuildCurvedText(selectedObject);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {GOOGLE_FONTS.map(f => (<SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedObject.type === 'i-text' && (
                    <>
                      <div>
                        <Label className="text-xs">Fonte</Label>
                        <Select value={selectedObject.fontFamily || 'Arial'} onValueChange={v => { loadGoogleFont(v); updateObjectProp('fontFamily', v); }}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {GOOGLE_FONTS.map(f => (<SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Tamanho</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => updateObjectProp('fontSize', Math.max(6, (selectedObject.fontSize || 24) - 1))}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input type="number" value={selectedObject.fontSize || 24} onChange={e => updateObjectProp('fontSize', Math.max(6, Number(e.target.value)))} className="h-8 text-xs text-center flex-1" min={6} />
                          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => updateObjectProp('fontSize', (selectedObject.fontSize || 24) + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {[12, 16, 20, 24, 32, 48].map(sz => (
                            <Button key={sz} variant={(selectedObject.fontSize || 24) === sz ? 'default' : 'outline'} size="sm"
                              className="h-6 px-2 text-[10px]" onClick={() => updateObjectProp('fontSize', sz)}>{sz}</Button>
                          ))}
                        </div>
                      </div>

                      {/* Bold / Italic */}
                      <div>
                        <Label className="text-xs">Estilo</Label>
                        <div className="flex gap-1 mt-1">
                          <Button variant={selectedObject.fontWeight === 'bold' ? 'default' : 'outline'} size="icon" className="h-8 w-8"
                            onClick={() => updateObjectProp('fontWeight', selectedObject.fontWeight === 'bold' ? 'normal' : 'bold')}>
                            <Bold className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant={selectedObject.fontStyle === 'italic' ? 'default' : 'outline'} size="icon" className="h-8 w-8"
                            onClick={() => updateObjectProp('fontStyle', selectedObject.fontStyle === 'italic' ? 'normal' : 'italic')}>
                            <Italic className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Text Align */}
                      <div>
                        <Label className="text-xs">Alinhamento do texto</Label>
                        <div className="flex gap-1 mt-1">
                          <Button variant={(selectedObject.textAlign || 'left') === 'left' ? 'default' : 'outline'} size="icon" className="h-8 w-8"
                            onClick={() => updateObjectProp('textAlign', 'left')}><AlignLeft className="h-3.5 w-3.5" /></Button>
                          <Button variant={selectedObject.textAlign === 'center' ? 'default' : 'outline'} size="icon" className="h-8 w-8"
                            onClick={() => updateObjectProp('textAlign', 'center')}><AlignCenter className="h-3.5 w-3.5" /></Button>
                          <Button variant={selectedObject.textAlign === 'right' ? 'default' : 'outline'} size="icon" className="h-8 w-8"
                            onClick={() => updateObjectProp('textAlign', 'right')}><AlignRight className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>

                      {/* Char Spacing */}
                      <div>
                        <Label className="text-xs">Espaçamento entre letras</Label>
                        <Input type="range" min={-200} max={800} step={10} value={selectedObject.charSpacing || 0}
                          onChange={e => updateObjectProp('charSpacing', Number(e.target.value))} className="h-8 mt-1" />
                        <span className="text-[10px] text-muted-foreground">{selectedObject.charSpacing || 0}</span>
                      </div>

                      {/* Line Height */}
                      <div>
                        <Label className="text-xs">Altura da linha</Label>
                        <Input type="range" min={0.5} max={3} step={0.1} value={selectedObject.lineHeight || 1.16}
                          onChange={e => updateObjectProp('lineHeight', Number(e.target.value))} className="h-8 mt-1" />
                        <span className="text-[10px] text-muted-foreground">{(selectedObject.lineHeight || 1.16).toFixed(1)}</span>
                      </div>
                    </>
                  )}

                  <div>
                    <Label className="text-xs">Contorno</Label>
                    <div className="flex gap-2 items-center mt-1">
                      <input type="color" value={selectedObject.stroke || '#000000'} onChange={e => updateObjectProp('stroke', e.target.value)} className="h-8 w-8 rounded border cursor-pointer" />
                      <Input type="number" value={selectedObject.strokeWidth || 0} min={0} onChange={e => updateObjectProp('strokeWidth', Number(e.target.value))} className="h-8 text-xs flex-1" placeholder="Esp." />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Opacidade</Label>
                    <Input type="range" min={0} max={1} step={0.05} value={selectedObject.opacity ?? 1} onChange={e => updateObjectProp('opacity', Number(e.target.value))} className="h-8" />
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs mb-1 block">Alinhar no canvas</Label>
                    <div className="flex gap-1 flex-wrap">
                      <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => alignObject('left')}><AlignStartHorizontal className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Esquerda</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => alignObject('center-h')}><AlignHorizontalJustifyCenter className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Centro H</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => alignObject('right')}><AlignEndHorizontal className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Direita</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => alignObject('top')}><AlignStartVertical className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Topo</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => alignObject('center-v')}><AlignVerticalJustifyCenter className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Centro V</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => alignObject('bottom')}><AlignEndVertical className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Fundo</TooltipContent></Tooltip>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-1 flex-wrap">
                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={bringForward}><ArrowUp className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Para frente</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={sendBackward}><ArrowDown className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Para trás</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={duplicateObj}><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Duplicar</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={deleteSelected}><Trash2 className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── DIALOGS ── */}


        {/* Save As Dialog */}
        <Dialog open={showSaveAsDialog} onOpenChange={setShowSaveAsDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Salvar como novo projeto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Nome do novo projeto</Label>
                <Input value={saveAsName} onChange={e => setSaveAsName(e.target.value)} placeholder="Nome do projeto" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveAsDialog(false)}>Cancelar</Button>
              <Button onClick={handleSaveAsNew} disabled={!saveAsName.trim()}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Keyboard Shortcuts Dialog */}
        <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
          <DialogContent className="max-w-xs">
            <DialogHeader><DialogTitle>Atalhos de Teclado</DialogTitle></DialogHeader>
            <div className="space-y-2">
              {KEYBOARD_SHORTCUTS.map(s => (
                <div key={s.keys} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.action}</span>
                  <kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono">{s.keys}</kbd>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add to Cart Dialog */}
        <Dialog open={showAddToCart} onOpenChange={setShowAddToCart}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Adicionar ao Carrinho</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium">{currentProject?.name}</p>
                <p className="text-xs text-muted-foreground">{selectedFormat?.shape} • {selectedFormat && `${selectedFormat.widthMm / 10}×${selectedFormat.heightMm / 10}cm`}</p>
              </div>
              <div>
                <Label className="text-sm">Quantidade</Label>
                <div className="flex items-center gap-2 mt-1">
                  {[50, 100, 250, 500, 1000].map(qty => (
                    <Button key={qty} variant={cartQuantity === qty ? 'default' : 'outline'} size="sm" className="text-xs"
                      onClick={() => setCartQuantity(qty)}>{qty}</Button>
                  ))}
                </div>
                <Input type="number" value={cartQuantity} onChange={e => setCartQuantity(Math.max(10, Number(e.target.value)))} className="mt-2 h-9" min={10} />
              </div>
              <div>
                <Label className="text-sm">Acabamento</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {FINISHING_OPTIONS.map(opt => (
                    <Button key={opt.id} variant={cartFinishing === opt.id ? 'default' : 'outline'} size="sm" className="text-xs h-auto py-2"
                      onClick={() => setCartFinishing(opt.id)}>
                      <div className="text-left">
                        <span className="block">{opt.label}</span>
                        {opt.price > 0 && <span className="block text-[10px] text-muted-foreground">+R$ {opt.price.toFixed(2)}/un</span>}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span>Preço unitário:</span>
                <span className="font-medium">R$ {cartUnitPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">R$ {cartTotal.toFixed(2)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={handleAddToCart}>
                <ShoppingCart className="h-4 w-4 mr-2" />Adicionar ao Carrinho
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default LabelEditor;
