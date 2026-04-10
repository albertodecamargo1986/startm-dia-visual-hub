import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, IText, Line, Ellipse, Triangle, FabricObject, FabricImage } from 'fabric';
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
  Plus, Download, Save, Trash2, Type, Square, Circle as CircleIcon,
  Minus, Triangle as TriangleIcon, Undo2, Redo2, ZoomIn, ZoomOut,
  Layers, Palette, ArrowUp, ArrowDown, Eye, EyeOff, Copy,
  LayoutTemplate, Frame, Image as ImageIcon, Lock, Unlock,
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter,
  AlignStartHorizontal, AlignEndHorizontal, AlignStartVertical, AlignEndVertical,
  GripVertical, ShoppingCart, Printer, CopyPlus, Sparkles,
  ChevronLeft, ChevronRight, X, Grid3X3, Keyboard, FileText,
  ArrowLeft, Check, Pencil
} from 'lucide-react';
import { LABEL_SHAPES, getFormatsForShape, mmToPx, type LabelFormat } from '@/lib/label-formats';
import { exportLabelPDF } from '@/lib/label-pdf-export';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const [includeBleed, setIncludeBleed] = useState(false);
  const [includeCutMarks, setIncludeCutMarks] = useState(true);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [editingLayerName, setEditingLayerName] = useState<number | null>(null);
  const [layerNameDraft, setLayerNameDraft] = useState('');

  // Wizard state
  const [wizardStep, setWizardStep] = useState(0); // 0=shape, 1=size, 2=name

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
  const [showExportDialog, setShowExportDialog] = useState(false);

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

  // ── Canvas init ──
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;
    const fc = new FabricCanvas(canvasRef.current, { width: 400, height: 400, backgroundColor: '#ffffff', selection: true });
    fabricRef.current = fc;
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

  const applyFormat = useCallback((fmt: LabelFormat) => {
    const fc = fabricRef.current; if (!fc) return;
    const w = mmToPx(fmt.widthMm); const h = mmToPx(fmt.heightMm);
    fc.setDimensions({ width: w, height: h });
    fc.clipPath = undefined;
    if (fmt.shape === 'round') fc.clipPath = new Circle({ radius: w / 2, originX: 'center', originY: 'center', left: w / 2, top: h / 2 });
    else if (fmt.shape === 'rounded-square' || fmt.shape === 'rounded-rectangle') fc.clipPath = new Rect({ width: w, height: h, rx: mmToPx(3), ry: mmToPx(3), originX: 'center', originY: 'center', left: w / 2, top: h / 2 });
    fc.renderAll(); fitToContainer();
  }, []);

  const fitToContainer = useCallback(() => {
    const fc = fabricRef.current; const container = containerRef.current;
    if (!fc || !container) return;
    const cw = container.clientWidth - 40; const ch = container.clientHeight - 40;
    const canvasW = fc.getWidth(); const canvasH = fc.getHeight();
    const scale = Math.min(cw / canvasW, ch / canvasH, 1);
    setZoom(scale); fc.setZoom(scale);
    fc.setDimensions({ width: canvasW * scale, height: canvasH * scale }, { cssOnly: true });
  }, []);

  useEffect(() => {
    window.addEventListener('resize', fitToContainer);
    return () => window.removeEventListener('resize', fitToContainer);
  }, [fitToContainer]);

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

  // ── Project CRUD ──
  const handleNewProject = async () => {
    if (!selectedFormat) { toast.error('Selecione um formato'); return; }
    const proj = await createProject({ name: projectName, label_shape: selectedFormat.shape, width_mm: selectedFormat.widthMm, height_mm: selectedFormat.heightMm });
    if (proj) { setCurrentProject(proj); applyFormat(selectedFormat); pushHistory(); }
  };

  const loadProject = useCallback(async (proj: LabelProject) => {
    const fc = fabricRef.current; if (!fc) return;
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
  }, [applyFormat, pushHistory, syncLayers]);

  // ── Add elements ──
  const addText = () => {
    const fc = fabricRef.current; if (!fc) return;
    const text = new IText('Texto', { left: fc.getWidth() / (2 * (zoom || 1)) - 30, top: fc.getHeight() / (2 * (zoom || 1)) - 10, fontSize: 24, fontFamily: 'Arial', fill: '#333333' });
    fc.add(text); fc.setActiveObject(text); fc.renderAll();
  };

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
    fc.clear(); fc.backgroundColor = '#ffffff'; setBgColor('#ffffff');
    if (selectedFormat) applyFormat(selectedFormat);
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

  const handleExportPDF = async () => {
    const fc = fabricRef.current;
    if (!fc || !selectedFormat) { toast.error('Nenhum projeto aberto'); return; }
    const origZoom = fc.getZoom();
    fc.setZoom(1); fc.setDimensions({ width: fc.getWidth(), height: fc.getHeight() }, { cssOnly: false }); fc.renderAll();
    const canvasEl = fc.toCanvasElement(2);
    fc.setZoom(origZoom); fitToContainer();
    try {
      const blob = await exportLabelPDF({ format: selectedFormat, canvasEl, projectName: currentProject?.name || 'etiqueta', includeBleed, includeCutMarks });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${currentProject?.name || 'etiqueta'}.pdf`; a.click();
      URL.revokeObjectURL(url); toast.success('PDF exportado!');
    } catch { toast.error('Erro ao exportar PDF'); }
  };

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

  const gridOverlayStyle = showGrid && currentProject ? {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)`,
    backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
    pointerEvents: 'none' as const,
  } : {};

  // ── Template color preview helper ──
  const getTemplateColors = (t: LabelTemplate): string[] => {
    if (!selectedFormat) return ['#f0f0f0'];
    const objs = t.getObjects(selectedFormat.widthMm, selectedFormat.heightMm);
    const colors = objs.map(o => o.fill).filter((c: any) => c && c !== 'transparent' && c !== 'none');
    return colors.length > 0 ? colors.slice(0, 4) : ['#f0f0f0'];
  };

  // ══════════════════════════════════════
  // ── RENDER ──
  // ══════════════════════════════════════

  // If no project is open, show the creation wizard / project list
  if (!currentProject) {
    return (
      <TooltipProvider>
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Subtle onboarding banner */}
          {showOnboarding && (
            <div className="relative bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">Bem-vindo ao Editor de Etiquetas!</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Escolha um formato abaixo, defina o tamanho e comece a personalizar. Você pode adicionar textos, imagens, formas e usar templates prontos.</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={dismissOnboarding}><X className="h-4 w-4" /></Button>
            </div>
          )}

          <div className="text-center">
            <h1 className="text-2xl font-display font-bold">Editor de Etiquetas</h1>
            <p className="text-muted-foreground text-sm mt-1">Crie etiquetas personalizadas de forma fácil e profissional</p>
          </div>

          {/* ── WIZARD ── */}
          <Card>
            <CardContent className="p-6">
              {/* Step indicators */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {['Formato', 'Tamanho', 'Nome'].map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      wizardStep === i ? 'bg-primary text-primary-foreground' :
                      wizardStep > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {wizardStep > i ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className={`text-sm hidden sm:inline ${wizardStep === i ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
                    {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                ))}
              </div>

              {/* Step 0: Shape */}
              {wizardStep === 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-center mb-4">Qual o formato da sua etiqueta?</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {LABEL_SHAPES.map(s => {
                      const vis = SHAPE_VISUALS[s.id];
                      return (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedShape(s.id); setSelectedFormat(null); setWizardStep(1); }}
                          className={`group relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-md hover:border-primary/50 ${
                            selectedShape === s.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border'
                          }`}
                        >
                          <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${vis?.color || ''} flex items-center justify-center transition-transform group-hover:scale-105`}>
                            <svg viewBox="0 0 100 100" className="w-14 h-14 text-foreground/70">
                              {vis?.svg}
                            </svg>
                          </div>
                          <span className="text-sm font-medium">{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 1: Size */}
              {wizardStep === 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setWizardStep(0)}>
                      <ArrowLeft className="h-4 w-4 mr-1" />Voltar
                    </Button>
                    <h2 className="text-lg font-semibold">Escolha o tamanho</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {availableFormats.map(f => {
                      const isSquare = f.widthMm === f.heightMm;
                      // Preview proportional sizing
                      const maxPrev = 60;
                      const prevW = isSquare ? maxPrev : maxPrev;
                      const prevH = isSquare ? maxPrev : (f.heightMm / f.widthMm) * maxPrev;
                      const shapeStyle: React.CSSProperties = {
                        width: prevW, height: prevH,
                        borderRadius: f.shape === 'round' ? '50%' : (f.shape === 'rounded-square' || f.shape === 'rounded-rectangle') ? 8 : 2,
                      };
                      return (
                        <button
                          key={f.id}
                          onClick={() => { setSelectedFormat(f); setWizardStep(2); }}
                          className={`group flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md hover:border-primary/50 ${
                            selectedFormat?.id === f.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border'
                          }`}
                        >
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

              {/* Step 2: Name & Create */}
              {wizardStep === 2 && (
                <div className="max-w-md mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setWizardStep(1)}>
                      <ArrowLeft className="h-4 w-4 mr-1" />Voltar
                    </Button>
                    <h2 className="text-lg font-semibold">Dê um nome ao projeto</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 100 100" className="w-10 h-10 text-primary">
                          {SHAPE_VISUALS[selectedShape]?.svg}
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{LABEL_SHAPES.find(s => s.id === selectedShape)?.label}</p>
                        <p className="text-xs text-muted-foreground">{selectedFormat?.label} ({selectedFormat?.widthMm}×{selectedFormat?.heightMm}mm)</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Nome do projeto</Label>
                      <Input
                        value={projectName}
                        onChange={e => setProjectName(e.target.value)}
                        placeholder="Ex: Etiqueta Natal 2025"
                        className="mt-1"
                        autoFocus
                      />
                    </div>
                    <Button className="w-full" size="lg" onClick={handleNewProject} disabled={!selectedFormat}>
                      <Sparkles className="h-4 w-4 mr-2" />Criar Etiqueta
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── EXISTING PROJECTS ── */}
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

          {/* Hidden canvas for initialization */}
          <canvas ref={canvasRef} className="hidden" />
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
      </TooltipProvider>
    );
  }

  // ══════════════════════════════════════
  // ── EDITOR VIEW (project open) ──
  // ══════════════════════════════════════
  return (
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-140px)]">
        <PrintPreviewDialog open={showPrintPreview} onOpenChange={setShowPrintPreview} canvasRef={fabricRef} format={selectedFormat} />
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        {/* ── TOP BAR ── */}
        <div className="flex items-center gap-2 px-2 py-2 border-b bg-card rounded-t-lg flex-wrap">
          {/* Back button */}
          <Button variant="ghost" size="sm" onClick={() => { setCurrentProject(null); setWizardStep(0); setSelectedShape(''); setSelectedFormat(null); }} className="shrink-0">
            <ArrowLeft className="h-4 w-4 mr-1" />Voltar
          </Button>
          <Separator orientation="vertical" className="h-6" />

          {/* Project name */}
          <Input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            onBlur={() => { if (currentProject) supabase.from('label_projects').update({ name: projectName } as any).eq('id', currentProject.id); }}
            className="w-40 h-8 text-sm"
          />
          <Badge variant="secondary" className="text-xs shrink-0">
            {LABEL_SHAPES.find(s => s.id === currentProject.label_shape)?.label} • {currentProject.width_mm / 10}×{currentProject.height_mm / 10}cm
          </Badge>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}><Save className="h-4 w-4" /></Button>
            </TooltipTrigger><TooltipContent>Salvar (Ctrl+S)</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveVersion}><FileText className="h-4 w-4" /></Button>
            </TooltipTrigger><TooltipContent>Salvar versão</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPrintPreview(true)}><Printer className="h-4 w-4" /></Button>
            </TooltipTrigger><TooltipContent>Prévia de impressão</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowExportDialog(true)}><Download className="h-4 w-4" /></Button>
            </TooltipTrigger><TooltipContent>Exportar PDF</TooltipContent></Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button size="sm" onClick={() => setShowAddToCart(true)} className="h-8">
              <ShoppingCart className="h-4 w-4 mr-1" />Pedir
            </Button>
          </div>
        </div>

        {/* ── MAIN AREA ── */}
        <div className="flex flex-1 min-h-0">
          {/* ── LEFT PANEL ── */}
          {showLeftPanel && (
            <div className="w-56 lg:w-64 shrink-0 border-r bg-card overflow-hidden flex flex-col">
              <Tabs defaultValue="design" className="flex flex-col flex-1 min-h-0">
                <TabsList className="w-full grid grid-cols-2 mx-2 mt-2 shrink-0">
                  <TabsTrigger value="design" className="text-xs"><Palette className="h-3 w-3 mr-1" />Design</TabsTrigger>
                  <TabsTrigger value="layers" className="text-xs"><Layers className="h-3 w-3 mr-1" />Camadas</TabsTrigger>
                </TabsList>

                <TabsContent value="design" className="flex-1 min-h-0 mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-3 space-y-4">
                      {/* Quick add */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Adicionar</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <Button variant="outline" size="sm" className="h-10 text-xs justify-start" onClick={addText}>
                            <Type className="h-4 w-4 mr-1.5" />Texto
                          </Button>
                          <Button variant="outline" size="sm" className="h-10 text-xs justify-start" onClick={() => imageInputRef.current?.click()}>
                            <ImageIcon className="h-4 w-4 mr-1.5" />Imagem
                          </Button>
                        </div>
                        <div className="flex gap-1 mt-1.5">
                          {[
                            { type: 'rect', icon: <Square className="h-4 w-4" />, label: 'Ret.' },
                            { type: 'circle', icon: <CircleIcon className="h-4 w-4" />, label: 'Círc.' },
                            { type: 'triangle', icon: <TriangleIcon className="h-4 w-4" />, label: 'Tri.' },
                            { type: 'line', icon: <Minus className="h-4 w-4" />, label: 'Linha' },
                            { type: 'ellipse', icon: <CircleIcon className="h-3.5 w-3.5" />, label: 'Elip.' },
                          ].map(s => (
                            <Tooltip key={s.type}><TooltipTrigger asChild>
                              <Button variant="outline" size="icon" className="h-8 w-8 flex-1" onClick={() => addShape(s.type)}>
                                {s.icon}
                              </Button>
                            </TooltipTrigger><TooltipContent>{s.label}</TooltipContent></Tooltip>
                          ))}
                        </div>
                      </div>

                      <Separator />

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
                                        {/* Color preview */}
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
                        <div className="space-y-2">
                          {DECORATIVE_CATEGORIES.map(cat => {
                            const elements = getDecorativeByCategory(cat.id);
                            if (elements.length === 0) return null;
                            return (
                              <div key={cat.id}>
                                <p className="text-xs text-muted-foreground mb-1">{cat.emoji} {cat.label}</p>
                                <div className="grid grid-cols-2 gap-1">
                                  {elements.map(el => (
                                    <Button key={el.id} variant="outline" size="sm" className="text-xs h-auto py-1.5" onClick={() => addDecorative(el)}>
                                      <Frame className="h-3 w-3 mr-1 shrink-0" />{el.name}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <Separator />

                      {/* Design actions */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Ações</p>
                        <div className="space-y-1">
                          <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={handleDuplicateDesign}>
                            <CopyPlus className="h-3 w-3 mr-2" />Duplicar design
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => { setSaveAsName(projectName + ' (cópia)'); setShowSaveAsDialog(true); }}>
                            <Copy className="h-3 w-3 mr-2" />Salvar como novo
                          </Button>
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

          {/* ── CENTER: CANVAS ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Floating toolbar */}
            <div className="flex items-center justify-center gap-1 py-1.5 px-2 border-b bg-muted/30">
              <Tooltip><TooltipTrigger asChild>
                <Button variant={showLeftPanel ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setShowLeftPanel(!showLeftPanel)}>
                  <Palette className="h-4 w-4" />
                </Button>
              </TooltipTrigger><TooltipContent>Painel de design</TooltipContent></Tooltip>

              <Separator orientation="vertical" className="h-5 mx-1" />

              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={addText}><Type className="h-4 w-4" /></Button>
              </TooltipTrigger><TooltipContent>Texto</TooltipContent></Tooltip>

              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => addShape('rect')}><Square className="h-4 w-4" /></Button>
              </TooltipTrigger><TooltipContent>Retângulo</TooltipContent></Tooltip>

              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => addShape('circle')}><CircleIcon className="h-4 w-4" /></Button>
              </TooltipTrigger><TooltipContent>Círculo</TooltipContent></Tooltip>

              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => imageInputRef.current?.click()}><ImageIcon className="h-4 w-4" /></Button>
              </TooltipTrigger><TooltipContent>Imagem</TooltipContent></Tooltip>

              <Separator orientation="vertical" className="h-5 mx-1" />

              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo}><Undo2 className="h-4 w-4" /></Button>
              </TooltipTrigger><TooltipContent>Desfazer (Ctrl+Z)</TooltipContent></Tooltip>

              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo}><Redo2 className="h-4 w-4" /></Button>
              </TooltipTrigger><TooltipContent>Refazer (Ctrl+Y)</TooltipContent></Tooltip>

              <Separator orientation="vertical" className="h-5 mx-1" />

              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut}><ZoomOut className="h-4 w-4" /></Button>
              </TooltipTrigger><TooltipContent>Zoom -</TooltipContent></Tooltip>
              <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn}><ZoomIn className="h-4 w-4" /></Button>
              </TooltipTrigger><TooltipContent>Zoom +</TooltipContent></Tooltip>

              <Separator orientation="vertical" className="h-5 mx-1" />

              <Tooltip><TooltipTrigger asChild>
                <Button variant={showGrid ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setShowGrid(!showGrid)}>
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger><TooltipContent>Grid (Ctrl+G)</TooltipContent></Tooltip>

              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={deleteSelected}><Trash2 className="h-4 w-4" /></Button>
              </TooltipTrigger><TooltipContent>Excluir (Delete)</TooltipContent></Tooltip>

              <Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowShortcuts(true)}><Keyboard className="h-4 w-4" /></Button>
              </TooltipTrigger><TooltipContent>Atalhos</TooltipContent></Tooltip>
            </div>

            {/* Canvas area */}
            <div className="flex-1 flex items-center justify-center bg-muted/10 p-4 overflow-auto" ref={containerRef}>
              <div className="relative border border-dashed border-muted-foreground/30 rounded-lg p-2 bg-white shadow-sm">
                <canvas ref={canvasRef} />
                {showGrid && <div className="absolute inset-2 rounded" style={gridOverlayStyle} />}
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-3 py-1 border-t bg-muted/20 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span>{LABEL_SHAPES.find(s => s.id === currentProject.label_shape)?.label} — {currentProject.width_mm / 10}×{currentProject.height_mm / 10}cm</span>
                <span>{layers.length} elementos</span>
                {snapEnabled && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Snap</span>}
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 cursor-pointer">
                  <Switch checked={snapEnabled} onCheckedChange={setSnapEnabled} className="scale-75" />
                  <span>Snap</span>
                </label>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL: Properties (contextual) ── */}
          {selectedObject && (
            <div className="w-56 lg:w-60 shrink-0 border-l bg-card overflow-auto">
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Propriedades</p>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { fabricRef.current?.discardActiveObject(); fabricRef.current?.renderAll(); setSelectedObject(null); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div>
                  <Label className="text-xs">Cor</Label>
                  <div className="flex gap-2 items-center mt-1">
                    <input type="color" value={selectedObject.fill || '#000000'} onChange={e => updateObjectProp('fill', e.target.value)} className="h-8 w-8 rounded border cursor-pointer" />
                    <Input value={selectedObject.fill || ''} onChange={e => updateObjectProp('fill', e.target.value)} className="h-8 text-xs flex-1" />
                  </div>
                </div>

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
                      <Input type="number" value={selectedObject.fontSize || 24} onChange={e => updateObjectProp('fontSize', Number(e.target.value))} className="h-8 text-xs" />
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
                  <Label className="text-xs mb-1 block">Alinhar</Label>
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
              </div>
            </div>
          )}
        </div>

        {/* ── DIALOGS ── */}

        {/* Export dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Exportar PDF</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Sangria (3mm)</Label>
                <Switch checked={includeBleed} onCheckedChange={setIncludeBleed} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Marcas de corte</Label>
                <Switch checked={includeCutMarks} onCheckedChange={setIncludeCutMarks} />
              </div>
              <p className="text-xs text-muted-foreground">PDF compatível com CorelDRAW, Illustrator e outros editores vetoriais.</p>
              <Button className="w-full" onClick={() => { handleExportPDF(); setShowExportDialog(false); }}>
                <Download className="h-4 w-4 mr-2" />Exportar PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
