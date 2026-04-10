import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, IText, Line, Ellipse, Triangle, FabricObject, FabricImage, PencilBrush, Path } from 'fabric';
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
import { useNavigate } from 'react-router-dom';
import {
  loadGoogleFont, FINISHING_OPTIONS, ONBOARDING_KEY,
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

// ══════════════════════════════════════
// ── TYPES ──
// ══════════════════════════════════════
export interface LabelEditorState {
  // Core
  selectedShape: string;
  selectedFormat: LabelFormat | null;
  currentProject: LabelProject | null;
  projectName: string;
  selectedObject: any;
  zoom: number;
  layers: LayerItem[];
  snapEnabled: boolean;
  editingLayerName: number | null;
  layerNameDraft: string;

  // Wizard
  wizardStep: number;

  // UX / dialogs
  showOnboarding: boolean;
  showPrintPreview: boolean;
  showAddToCart: boolean;
  showSaveAsDialog: boolean;
  saveAsName: string;
  showGrid: boolean;
  showShortcuts: boolean;
  showLeftPanel: boolean;

  // Drawing
  activeTool: string;
  drawingMode: boolean;
  brushWidth: number;
  brushColor: string;

  // Background
  bgColor: string;

  // Cart
  cartQuantity: number;
  cartFinishing: string;

  // History
  historyIdx: number;
  historyLength: number;

  // Derived
  availableFormats: LabelFormat[];
  currentShapeLabel: string;
  currentSizeLabel: string;
  gridOverlayStyle: React.CSSProperties;

  // Projects
  projects: LabelProject[];
  loading: boolean;
}

export interface LabelEditorActions {
  // State setters
  setSelectedShape: (shape: string) => void;
  setSelectedFormat: (fmt: LabelFormat | null) => void;
  setProjectName: (name: string) => void;
  setWizardStep: (step: number) => void;
  setShowOnboarding: (show: boolean) => void;
  setShowPrintPreview: (show: boolean) => void;
  setShowAddToCart: (show: boolean) => void;
  setShowSaveAsDialog: (show: boolean) => void;
  setSaveAsName: (name: string) => void;
  setShowGrid: (show: boolean) => void;
  setShowShortcuts: (show: boolean) => void;
  setShowLeftPanel: (show: boolean) => void;
  setCartQuantity: (qty: number) => void;
  setCartFinishing: (finishing: string) => void;
  setEditingLayerName: (id: number | null) => void;
  setLayerNameDraft: (name: string) => void;
  setBrushColor: (color: string) => void;
  setBrushWidth: (width: number) => void;

  // Canvas actions
  handleBgColorChange: (color: string) => void;
  handleNewProject: () => Promise<void>;
  loadProject: (proj: LabelProject) => Promise<void>;
  handleSave: () => Promise<void>;
  handleSaveVersion: () => Promise<void>;
  handleSaveAsNew: () => Promise<void>;
  handleAddToCart: () => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Object actions
  addText: () => void;
  addCurvedText: () => void;
  addShape: (type: string) => void;
  addSvgElement: (element: SvgElement) => void;
  applyTemplate: (template: LabelTemplate) => void;
  addDecorative: (element: DecorativeElement) => void;
  updateObjectProp: (prop: string, value: any) => void;
  alignObject: (alignment: string) => void;
  deleteSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  duplicateObj: () => void;
  rebuildCurvedText: (controller: any) => void;

  // Drawing
  toggleDrawingMode: (enable: boolean) => void;
  eraseLastDrawing: () => void;

  // Zoom
  zoomIn: () => void;
  zoomOut: () => void;

  // History
  undo: () => void;
  redo: () => void;

  // Layers
  toggleLayerVisibility: (layer: LayerItem) => void;
  toggleLayerLock: (layer: LayerItem) => void;
  selectLayer: (layer: LayerItem) => void;
  moveLayerUp: (layer: LayerItem) => void;
  moveLayerDown: (layer: LayerItem) => void;
  renameLayer: (layer: LayerItem, newName: string) => void;

  // UI
  dismissOnboarding: () => void;
  setSnapEnabled: (enabled: boolean) => void;
  closeProject: () => void;
  deleteProject: (id: string) => Promise<void>;
  getTemplateColors: (t: LabelTemplate) => string[];
  fabricRenderAll: () => void;

  // Refs
  canvasHostRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  fabricRef: React.MutableRefObject<FabricCanvas | null>;
}

type LabelEditorContextType = LabelEditorState & LabelEditorActions;

const LabelEditorContext = createContext<LabelEditorContextType | null>(null);

export function useLabelEditor(): LabelEditorContextType {
  const ctx = useContext(LabelEditorContext);
  if (!ctx) throw new Error('useLabelEditor must be used within LabelEditorProvider');
  return ctx;
}

// ══════════════════════════════════════
// ── PROVIDER ──
// ══════════════════════════════════════
export const LabelEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const applyFormat = useCallback((fmt: LabelFormat) => {
    const fc = fabricRef.current; if (!fc) return;
    const w = mmToPx(fmt.widthMm); const h = mmToPx(fmt.heightMm);
    fc.setDimensions({ width: w, height: h });
    fc.clipPath = undefined;
    if (fmt.shape === 'round') fc.clipPath = new Circle({ radius: w / 2, originX: 'center', originY: 'center', left: w / 2, top: h / 2 });
    else if (fmt.shape === 'rounded-square' || fmt.shape === 'rounded-rectangle') fc.clipPath = new Rect({ width: w, height: h, rx: mmToPx(3), ry: mmToPx(3), originX: 'center', originY: 'center', left: w / 2, top: h / 2 });
    addShapeDelimiter(fc, fmt);
    fc.renderAll(); fitToContainer();
  }, [addShapeDelimiter, fitToContainer]);

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
  const addText = useCallback(() => {
    const fc = fabricRef.current; if (!fc) return;
    const canvasW = fc.getWidth() / (fc.getZoom() || 1);
    const canvasH = fc.getHeight() / (fc.getZoom() || 1);
    const minDim = Math.min(canvasW, canvasH);
    const fontSize = Math.max(16, Math.round(minDim * 0.12));
    const text = new IText('Seu Texto', { left: canvasW / 2, top: canvasH / 2, originX: 'center', originY: 'center', fontSize, fontFamily: 'Montserrat', fill: '#333333', textAlign: 'center' });
    loadGoogleFont('Montserrat');
    fc.add(text); fc.setActiveObject(text); fc.renderAll();
  }, []);

  const addCurvedText = useCallback(() => {
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
  }, []);

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

  const addShape = useCallback((type: string) => {
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
  }, [zoom]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  const addObjectFromJson = useCallback((fc: FabricCanvas, obj: any) => {
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
  }, []);

  const applyTemplate = useCallback((template: LabelTemplate) => {
    const fc = fabricRef.current;
    if (!fc || !selectedFormat) return;
    resetCanvas(); applyFormat(selectedFormat);
    const objs = template.getObjects(selectedFormat.widthMm, selectedFormat.heightMm);
    objs.forEach(obj => { loadGoogleFont(obj.fontFamily || 'Arial'); addObjectFromJson(fc, obj); });
    fc.renderAll(); markDirty(); syncLayers();
    toast.success(`Template "${template.name}" aplicado`);
  }, [selectedFormat, resetCanvas, applyFormat, addObjectFromJson, markDirty, syncLayers]);

  const addDecorative = useCallback((element: DecorativeElement) => {
    const fc = fabricRef.current;
    if (!fc || !selectedFormat) return;
    const objs = element.getObjects(selectedFormat.widthMm, selectedFormat.heightMm);
    objs.forEach(obj => addObjectFromJson(fc, obj));
    fc.renderAll(); markDirty(); syncLayers();
  }, [selectedFormat, addObjectFromJson, markDirty, syncLayers]);

  const updateObjectProp = useCallback((prop: string, value: any) => {
    if (!selectedObject || !fabricRef.current) return;
    selectedObject.set(prop, value); fabricRef.current.renderAll(); markDirty();
  }, [selectedObject, markDirty]);

  const alignObject = useCallback((alignment: string) => {
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
  }, [selectedObject, markDirty]);

  const toggleLayerVisibility = useCallback((layer: LayerItem) => { layer.obj.visible = !layer.obj.visible; fabricRef.current?.renderAll(); syncLayers(); markDirty(); }, [syncLayers, markDirty]);
  const toggleLayerLock = useCallback((layer: LayerItem) => { const locked = !layer.locked; layer.obj.selectable = !locked; layer.obj.evented = !locked; fabricRef.current?.renderAll(); syncLayers(); }, [syncLayers]);
  const selectLayer = useCallback((layer: LayerItem) => { if (!layer.obj.selectable) return; fabricRef.current?.setActiveObject(layer.obj); fabricRef.current?.renderAll(); setSelectedObject(layer.obj); }, []);
  const moveLayerUp = useCallback((layer: LayerItem) => { fabricRef.current?.bringObjectForward(layer.obj); fabricRef.current?.renderAll(); syncLayers(); markDirty(); }, [syncLayers, markDirty]);
  const moveLayerDown = useCallback((layer: LayerItem) => { fabricRef.current?.sendObjectBackwards(layer.obj); fabricRef.current?.renderAll(); syncLayers(); markDirty(); }, [syncLayers, markDirty]);
  const renameLayer = useCallback((layer: LayerItem, newName: string) => { (layer.obj as any).__layerName = newName; syncLayers(); }, [syncLayers]);

  const handleSave = useCallback(async () => {
    if (!currentProject || !fabricRef.current) return;
    const ok = await saveProject(currentProject.id, fabricRef.current.toJSON());
    if (ok) { toast.success('Projeto salvo'); generateThumbnail(); }
  }, [currentProject, saveProject, generateThumbnail]);

  const handleSaveVersion = useCallback(async () => {
    if (!currentProject || !fabricRef.current) return;
    await saveVersion(currentProject.id, fabricRef.current.toJSON());
  }, [currentProject, saveVersion]);

  const handleSaveAsNew = useCallback(async () => {
    if (!fabricRef.current || !selectedFormat || !saveAsName.trim()) return;
    const proj = await createProject({ name: saveAsName.trim(), label_shape: selectedFormat.shape, width_mm: selectedFormat.widthMm, height_mm: selectedFormat.heightMm });
    if (proj) {
      await saveProject(proj.id, fabricRef.current.toJSON());
      setCurrentProject(proj); setProjectName(proj.name); setShowSaveAsDialog(false); await refetch(); toast.success('Salvo como novo projeto!');
    }
  }, [selectedFormat, saveAsName, createProject, saveProject, refetch]);

  const handleAddToCart = useCallback(() => {
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
  }, [currentProject, selectedFormat, cartFinishing, cartQuantity, generateThumbnail, addItem, navigate]);

  const deleteSelected = useCallback(() => {
    const fc = fabricRef.current; if (!fc) return;
    const active = fc.getActiveObjects();
    active.forEach(obj => fc.remove(obj));
    fc.discardActiveObject(); fc.renderAll();
  }, []);

  const bringForward = useCallback(() => { if (selectedObject && fabricRef.current) { fabricRef.current.bringObjectForward(selectedObject); fabricRef.current.renderAll(); syncLayers(); } }, [selectedObject, syncLayers]);
  const sendBackward = useCallback(() => { if (selectedObject && fabricRef.current) { fabricRef.current.sendObjectBackwards(selectedObject); fabricRef.current.renderAll(); syncLayers(); } }, [selectedObject, syncLayers]);
  const duplicateObj = useCallback(() => {
    if (!selectedObject || !fabricRef.current) return;
    selectedObject.clone((cloned: any) => {
      cloned.set({ left: (cloned.left || 0) + 10, top: (cloned.top || 0) + 10 });
      fabricRef.current!.add(cloned); fabricRef.current!.setActiveObject(cloned); fabricRef.current!.renderAll();
    });
  }, [selectedObject]);

  const zoomIn = useCallback(() => { const fc = fabricRef.current; if (!fc) return; const nz = Math.min(zoom * 1.2, 3); setZoom(nz); fc.setZoom(nz); fc.setDimensions({ width: fc.getWidth() * (nz / zoom), height: fc.getHeight() * (nz / zoom) }, { cssOnly: true }); }, [zoom]);
  const zoomOut = useCallback(() => { const fc = fabricRef.current; if (!fc) return; const nz = Math.max(zoom / 1.2, 0.3); setZoom(nz); fc.setZoom(nz); fc.setDimensions({ width: fc.getWidth() * (nz / zoom), height: fc.getHeight() * (nz / zoom) }, { cssOnly: true }); }, [zoom]);

  const closeProject = useCallback(() => {
    setCurrentProject(null); setSelectedObject(null); setLayers([]);
    setWizardStep(0); setSelectedShape(''); setSelectedFormat(null);
  }, []);

  const getTemplateColors = useCallback((t: LabelTemplate): string[] => {
    if (!selectedFormat) return ['#f0f0f0'];
    const objs = t.getObjects(selectedFormat.widthMm, selectedFormat.heightMm);
    const colors = objs.map(o => o.fill).filter((c: any) => c && c !== 'transparent' && c !== 'none');
    return colors.length > 0 ? colors.slice(0, 4) : ['#f0f0f0'];
  }, [selectedFormat]);

  const fabricRenderAll = useCallback(() => { fabricRef.current?.renderAll(); }, []);

  // ── Derived values ──
  const availableFormats = selectedShape ? getFormatsForShape(selectedShape) : [];

  const currentShapeLabel = currentProject
    ? LABEL_SHAPES.find(s => s.id === currentProject.label_shape)?.label || currentProject.label_shape
    : '';
  const currentSizeLabel = currentProject
    ? `${currentProject.width_mm / 10}×${currentProject.height_mm / 10}cm`
    : '';

  const gridOverlayStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)`,
    backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
    pointerEvents: 'none',
    opacity: showGrid && currentProject ? 1 : 0,
  };

  const value: LabelEditorContextType = {
    // State
    selectedShape, selectedFormat, currentProject, projectName, selectedObject,
    zoom, layers, snapEnabled, editingLayerName, layerNameDraft,
    wizardStep,
    showOnboarding, showPrintPreview, showAddToCart, showSaveAsDialog, saveAsName,
    showGrid, showShortcuts, showLeftPanel,
    activeTool, drawingMode, brushWidth, brushColor,
    bgColor, cartQuantity, cartFinishing,
    historyIdx, historyLength: history.length,
    availableFormats, currentShapeLabel, currentSizeLabel, gridOverlayStyle,
    projects, loading,

    // Actions
    setSelectedShape, setSelectedFormat, setProjectName, setWizardStep,
    setShowOnboarding, setShowPrintPreview, setShowAddToCart, setShowSaveAsDialog,
    setSaveAsName, setShowGrid, setShowShortcuts, setShowLeftPanel,
    setCartQuantity, setCartFinishing, setEditingLayerName, setLayerNameDraft,
    setBrushColor, setBrushWidth, setSnapEnabled,
    handleBgColorChange, handleNewProject, loadProject,
    handleSave, handleSaveVersion, handleSaveAsNew, handleAddToCart,
    handleImageUpload,
    addText, addCurvedText, addShape, addSvgElement,
    applyTemplate, addDecorative, updateObjectProp, alignObject,
    deleteSelected, bringForward, sendBackward, duplicateObj, rebuildCurvedText,
    toggleDrawingMode, eraseLastDrawing,
    zoomIn, zoomOut, undo, redo,
    toggleLayerVisibility, toggleLayerLock, selectLayer,
    moveLayerUp, moveLayerDown, renameLayer,
    dismissOnboarding, closeProject, deleteProject, getTemplateColors, fabricRenderAll,

    // Refs
    canvasHostRef, containerRef, imageInputRef, fabricRef,
  };

  return (
    <LabelEditorContext.Provider value={value}>
      {children}
    </LabelEditorContext.Provider>
  );
};
