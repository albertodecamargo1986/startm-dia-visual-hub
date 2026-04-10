import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, IText, Line, Ellipse, Triangle, FabricObject, FabricImage, PencilBrush, Path } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus, Trash2, Palette,
  ChevronRight, X, ArrowLeft, Check,
} from 'lucide-react';
import { LABEL_SHAPES, getFormatsForShape, mmToPx, type LabelFormat } from '@/lib/label-formats';
import { useLabelProjects, useAutoSave, type LabelProject } from '@/hooks/use-label-projects';
import {
  TEMPLATE_CATEGORIES, getTemplatesByCategory,
  type LabelTemplate, type DecorativeElement
} from '@/lib/label-templates';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import {
  LabelToolbar, LabelLeftPanel, LabelPropertiesPanel,
  LabelStatusBar, LabelTopBar,
  PrintPreviewDialog, SaveAsDialog, ShortcutsDialog, AddToCartDialog,
  GOOGLE_FONTS, loadGoogleFont, FINISHING_OPTIONS, ONBOARDING_KEY, SHAPE_VISUALS,
  type LayerItem, type SvgElement,
} from '@/components/label-editor';

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
  const [wizardStep, setWizardStep] = useState(0);

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

  // ── Canvas init ──
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || fabricRef.current) return;
    const canvasEl = document.createElement('canvas');
    host.appendChild(canvasEl);
    const fc = new FabricCanvas(canvasEl, { width: 400, height: 400, backgroundColor: '#ffffff', selection: true, uniformScaling: true });
    fabricRef.current = fc;
    FabricObject.prototype.set({
      cornerSize: 10, cornerColor: '#2563eb', borderColor: '#2563eb',
      cornerStrokeColor: '#ffffff', cornerStyle: 'circle',
      transparentCorners: false, borderScaleFactor: 2,
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

  // ── Add shape delimiter ──
  const addShapeDelimiter = useCallback((fc: FabricCanvas, fmt: LabelFormat) => {
    const existing = fc.getObjects().filter((o: any) => o.__isDelimiter);
    existing.forEach(o => fc.remove(o));
    const w = mmToPx(fmt.widthMm); const h = mmToPx(fmt.heightMm);
    let delimiter: FabricObject;
    if (fmt.shape === 'round') {
      delimiter = new Circle({ left: w / 2, top: h / 2, radius: w / 2 - 2, originX: 'center', originY: 'center', fill: 'transparent', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [8, 6], selectable: false, evented: false });
    } else {
      const rx = (fmt.shape === 'rounded-square' || fmt.shape === 'rounded-rectangle') ? mmToPx(3) : 0;
      delimiter = new Rect({ left: 1, top: 1, width: w - 2, height: h - 2, rx, ry: rx, fill: 'transparent', stroke: '#cbd5e1', strokeWidth: 2, strokeDashArray: [8, 6], selectable: false, evented: false });
    }
    (delimiter as any).__isDelimiter = true;
    (delimiter as any).__layerName = '— Limite —';
    fc.add(delimiter); fc.sendObjectToBack(delimiter);
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
    const cw = container.clientWidth - 24; const ch = container.clientHeight - 24;
    if (cw <= 0 || ch <= 0) return;
    const canvasW = fc.getWidth(); const canvasH = fc.getHeight();
    if (canvasW <= 0 || canvasH <= 0) return;
    const scale = Math.min((cw * 0.9) / canvasW, (ch * 0.9) / canvasH, 3);
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
    setSelectedObject(null); setLayers([]);
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
    const fc = fabricRef.current; if (!fc) return;
    isRestoring.current = true;
    fc.clear(); fc.backgroundColor = background; fc.clipPath = undefined;
    fc.discardActiveObject(); fc.renderAll();
    isRestoring.current = false;
    setSelectedObject(null); setLayers([]); setBgColor(background);
  }, []);

  // ── Project CRUD ──
  const handleNewProject = async () => {
    if (!selectedFormat) { toast.error('Selecione um formato'); return; }
    const proj = await createProject({ name: projectName, label_shape: selectedFormat.shape, width_mm: selectedFormat.widthMm, height_mm: selectedFormat.heightMm });
    if (proj) { resetCanvas(); setCurrentProject(proj); setProjectName(proj.name); applyFormat(selectedFormat); pushHistory(); }
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
    fc.isDrawingMode = enable; setDrawingMode(enable);
    if (enable) {
      const brush = new PencilBrush(fc);
      brush.width = brushWidth; brush.color = brushColor;
      fc.freeDrawingBrush = brush; setActiveTool('draw');
      fc.discardActiveObject(); fc.renderAll();
    } else { setActiveTool('select'); }
  }, [brushWidth, brushColor]);

  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc || !fc.freeDrawingBrush || !drawingMode) return;
    fc.freeDrawingBrush.width = brushWidth; fc.freeDrawingBrush.color = brushColor;
  }, [brushWidth, brushColor, drawingMode]);

  const eraseLastDrawing = useCallback(() => {
    const fc = fabricRef.current; if (!fc) return;
    const objs = fc.getObjects();
    for (let i = objs.length - 1; i >= 0; i--) {
      if (objs[i].type === 'path' && !(objs[i] as any).__isDelimiter) { fc.remove(objs[i]); fc.renderAll(); break; }
    }
  }, []);

  // ── Add SVG element ──
  const addSvgElement = useCallback((element: SvgElement) => {
    const fc = fabricRef.current; if (!fc) return;
    const canvasW = fc.getWidth() / (fc.getZoom() || 1);
    const canvasH = fc.getHeight() / (fc.getZoom() || 1);
    const size = Math.min(canvasW, canvasH) * 0.25;
    const pathObj = new Path(element.path, {
      left: canvasW / 2, top: canvasH / 2, originX: 'center', originY: 'center',
      fill: 'transparent', stroke: '#333333', strokeWidth: 2,
      scaleX: size / 24, scaleY: size / 24,
    });
    (pathObj as any).__layerName = element.name;
    fc.add(pathObj); fc.setActiveObject(pathObj); fc.renderAll();
  }, []);

  // ── Add elements ──
  const addText = () => {
    const fc = fabricRef.current; if (!fc) return;
    const canvasW = fc.getWidth() / (fc.getZoom() || 1);
    const canvasH = fc.getHeight() / (fc.getZoom() || 1);
    const minDim = Math.min(canvasW, canvasH);
    const fontSize = Math.max(16, Math.round(minDim * 0.12));
    const text = new IText('Seu Texto', { left: canvasW / 2, top: canvasH / 2, originX: 'center', originY: 'center', fontSize, fontFamily: 'Montserrat', fill: '#333333', textAlign: 'center' });
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
    const centerX = canvasW / 2; const centerY = canvasH / 2;
    const groupObjects: FabricObject[] = [];
    for (let i = 0; i < textStr.length; i++) {
      const angleDeg = startAngle + i * charAngle;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = centerX + radius * Math.cos(angleRad);
      const y = centerY + radius * Math.sin(angleRad);
      const charText = new IText(textStr[i], { left: x, top: y, originX: 'center', originY: 'center', fontSize, fontFamily: 'Montserrat', fill: '#333333', angle: angleDeg + 90, selectable: false, evented: false });
      (charText as any).__isCurvedChar = true;
      groupObjects.push(charText);
    }
    const controlCircle = new Circle({ left: centerX, top: centerY, originX: 'center', originY: 'center', radius, fill: 'transparent', stroke: 'transparent', strokeWidth: 0, selectable: true, evented: true });
    (controlCircle as any).__isCurvedTextController = true;
    (controlCircle as any).__curvedText = textStr;
    (controlCircle as any).__curvedRadius = radius;
    (controlCircle as any).__curvedFontSize = fontSize;
    (controlCircle as any).__curvedFontFamily = 'Montserrat';
    (controlCircle as any).__curvedFill = '#333333';
    (controlCircle as any).__layerName = 'Texto em Arco';
    groupObjects.forEach(obj => fc.add(obj));
    fc.add(controlCircle); fc.setActiveObject(controlCircle); fc.renderAll();
    loadGoogleFont('Montserrat');
    toast.success('Texto em arco adicionado! Selecione o círculo de controle para mover.');
  };

  const rebuildCurvedText = useCallback((controller: any) => {
    const fc = fabricRef.current; if (!fc) return;
    const allObjs = fc.getObjects();
    const oldChars = allObjs.filter((o: any) => o.__isCurvedChar);
    oldChars.forEach(o => fc.remove(o));
    const textStr = controller.__curvedText || 'TEXTO';
    const radius = controller.__curvedRadius || 100;
    const fontSize = controller.__curvedFontSize || 16;
    const fontFamily = controller.__curvedFontFamily || 'Montserrat';
    const fill = controller.__curvedFill || '#333333';
    const centerX = controller.left || 0; const centerY = controller.top || 0;
    const charAngle = 360 / (textStr.length * 2.5);
    const startAngle = -90 - (textStr.length - 1) * charAngle / 2;
    for (let i = 0; i < textStr.length; i++) {
      const angleDeg = startAngle + i * charAngle;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = centerX + radius * Math.cos(angleRad);
      const y = centerY + radius * Math.sin(angleRad);
      const charText = new IText(textStr[i], { left: x, top: y, originX: 'center', originY: 'center', fontSize, fontFamily, fill, angle: angleDeg + 90, selectable: false, evented: false });
      (charText as any).__isCurvedChar = true;
      fc.add(charText);
    }
    controller.set('radius', radius);
    fc.renderAll(); markDirty();
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
    resetCanvas(); applyFormat(selectedFormat);
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

  const gridOverlayStyle = {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)`,
    backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
    pointerEvents: 'none' as const,
    opacity: showGrid && currentProject ? 1 : 0,
  };

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
  // ── RENDER ──
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
                {[
                  { step: '1', title: 'Escolha o formato', desc: 'Selecione a forma e o tamanho da etiqueta' },
                  { step: '2', title: 'Personalize', desc: 'Adicione textos, imagens e escolha cores' },
                  { step: '3', title: 'Salve e peça', desc: 'Salve o projeto e adicione ao carrinho' },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3 p-3 rounded-lg bg-background/60">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">{item.step}</div>
                    <div><p className="text-xs font-medium">{item.title}</p><p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <h1 className="text-2xl font-display font-bold">Editor de Etiquetas</h1>
            <p className="text-muted-foreground text-sm mt-1">Crie etiquetas personalizadas de forma fácil e profissional</p>
          </div>

          <Card>
            <CardContent className="p-6">
              {/* Wizard steps indicator */}
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

              {/* Step 0: Shape */}
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

              {/* Step 1: Size */}
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
                      const prevW = maxPrev;
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

              {/* Step 2: Name */}
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
                      <label className="text-sm font-medium">Nome do projeto</label>
                      <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Ex: Etiqueta Natal 2025" className="mt-1" autoFocus />
                    </div>
                    <Button className="w-full" size="lg" onClick={() => setWizardStep(3)}>
                      Próximo <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Template */}
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
                                    resetCanvas(); setCurrentProject(proj); setProjectName(proj.name); applyFormat(selectedFormat!);
                                    const objs = t.getObjects(selectedFormat!.widthMm, selectedFormat!.heightMm);
                                    objs.forEach(obj => { loadGoogleFont(obj.fontFamily || 'Arial'); addObjectFromJson(fabricRef.current!, obj); });
                                    fabricRef.current?.renderAll(); pushHistory(); syncLayers(); markDirty();
                                    toast.success(`Modelo "${t.name}" aplicado!`);
                                  }
                                }} className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-border hover:border-primary/50 hover:shadow-md transition-all group">
                                  <div className="w-full aspect-square rounded-lg flex items-center justify-center overflow-hidden relative bg-white">
                                    <div className="w-full h-full flex gap-0.5">
                                      {colors.map((c, i) => (<div key={i} className="flex-1" style={{ backgroundColor: c }} />))}
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
        <LabelTopBar
          projectName={projectName}
          shapeLabel={currentShapeLabel}
          sizeLabel={currentSizeLabel}
          currentProjectId={currentProject?.id || ''}
          onBack={() => { setCurrentProject(null); setSelectedObject(null); setLayers([]); setWizardStep(0); setSelectedShape(''); setSelectedFormat(null); }}
          onNameChange={setProjectName}
          onSave={handleSave}
          onSaveVersion={handleSaveVersion}
          onPrintPreview={() => setShowPrintPreview(true)}
          onAddToCart={() => setShowAddToCart(true)}
        />

        {/* ── MAIN AREA: Toolbar + Canvas + Properties ── */}
        <div className="flex flex-1 min-h-0 relative">

          {/* ── VERTICAL TOOLBAR ── */}
          <LabelToolbar
            activeTool={activeTool}
            drawingMode={drawingMode}
            showLeftPanel={showLeftPanel}
            onSelectTool={() => { toggleDrawingMode(false); setActiveTool('select'); fabricRef.current?.discardActiveObject(); fabricRef.current?.renderAll(); setSelectedObject(null); }}
            onAddText={() => { toggleDrawingMode(false); setActiveTool('select'); addText(); }}
            onAddCurvedText={() => { toggleDrawingMode(false); setActiveTool('select'); addCurvedText(); }}
            onAddShape={(type) => { toggleDrawingMode(false); addShape(type); }}
            onToggleDrawing={() => { if (drawingMode) { toggleDrawingMode(false); } else { toggleDrawingMode(true); } }}
            onOpenImagePicker={() => { toggleDrawingMode(false); imageInputRef.current?.click(); }}
            onToggleLeftPanel={() => setShowLeftPanel(!showLeftPanel)}
            onShowShortcuts={() => setShowShortcuts(true)}
          />

          {/* ── LEFT PANEL (floating overlay) ── */}
          {showLeftPanel && (
            <LabelLeftPanel
              bgColor={bgColor}
              onBgColorChange={handleBgColorChange}
              onApplyTemplate={applyTemplate}
              onAddDecorative={addDecorative}
              onAddSvgElement={addSvgElement}
              getTemplateColors={getTemplateColors}
              layers={layers}
              selectedObject={selectedObject}
              editingLayerName={editingLayerName}
              layerNameDraft={layerNameDraft}
              onClose={() => setShowLeftPanel(false)}
              onSelectLayer={selectLayer}
              onToggleLayerVisibility={toggleLayerVisibility}
              onToggleLayerLock={toggleLayerLock}
              onMoveLayerUp={moveLayerUp}
              onMoveLayerDown={moveLayerDown}
              onStartEditLayerName={(id, name) => { setEditingLayerName(id); setLayerNameDraft(name); }}
              onLayerNameDraftChange={setLayerNameDraft}
              onFinishEditLayerName={(layer) => { renameLayer(layer, layerNameDraft); setEditingLayerName(null); }}
            />
          )}

          {/* ── CENTER: CANVAS WORKSPACE ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1 flex items-center justify-center overflow-auto p-4" ref={containerRef} style={{ backgroundColor: '#3a3a3a' }}>
              <div className="relative shadow-2xl ring-1 ring-white/20" id="canvas-wrapper" style={{ margin: 'auto' }}>
                <div className="absolute inset-0" style={gridOverlayStyle} />
                <div ref={canvasHostRef} />
              </div>
            </div>

            {/* ── STATUS BAR ── */}
            <LabelStatusBar
              historyIdx={historyIdx}
              historyLength={history.length}
              zoom={zoom}
              snapEnabled={snapEnabled}
              showGrid={showGrid}
              shapeLabel={currentShapeLabel}
              sizeLabel={currentSizeLabel}
              layerCount={layers.length}
              onUndo={undo}
              onRedo={redo}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onToggleSnap={() => setSnapEnabled(!snapEnabled)}
              onToggleGrid={() => setShowGrid(!showGrid)}
            />
          </div>

          {/* ── RIGHT PANEL: Properties ── */}
          <LabelPropertiesPanel
            drawingMode={drawingMode}
            selectedObject={selectedObject}
            brushColor={brushColor}
            brushWidth={brushWidth}
            bgColor={bgColor}
            shapeLabel={currentShapeLabel}
            sizeLabel={currentSizeLabel}
            layerCount={layers.length}
            onBrushColorChange={setBrushColor}
            onBrushWidthChange={setBrushWidth}
            onEraseLastDrawing={eraseLastDrawing}
            onToggleDrawingOff={() => toggleDrawingMode(false)}
            onBgColorChange={handleBgColorChange}
            onUpdateObjectProp={updateObjectProp}
            onAlignObject={alignObject}
            onBringForward={bringForward}
            onSendBackward={sendBackward}
            onDuplicate={duplicateObj}
            onDelete={deleteSelected}
            onRebuildCurvedText={rebuildCurvedText}
            fabricRenderAll={() => fabricRef.current?.renderAll()}
          />
        </div>

        {/* ── DIALOGS ── */}
        <SaveAsDialog
          open={showSaveAsDialog}
          onOpenChange={setShowSaveAsDialog}
          saveAsName={saveAsName}
          onNameChange={setSaveAsName}
          onSave={handleSaveAsNew}
        />

        <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />

        <AddToCartDialog
          open={showAddToCart}
          onOpenChange={setShowAddToCart}
          projectName={currentProject?.name || ''}
          format={selectedFormat}
          cartQuantity={cartQuantity}
          cartFinishing={cartFinishing}
          onQuantityChange={setCartQuantity}
          onFinishingChange={setCartFinishing}
          onAddToCart={handleAddToCart}
        />
      </div>
    </TooltipProvider>
  );
};

export default LabelEditor;
