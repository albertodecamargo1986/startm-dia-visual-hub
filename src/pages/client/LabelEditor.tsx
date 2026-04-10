import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, IText, Line, Ellipse, Triangle, FabricObject } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus, Download, Save, Trash2, Type, Square, Circle as CircleIcon,
  Minus, Triangle as TriangleIcon, Undo2, Redo2, ZoomIn, ZoomOut,
  FileText, Layers, Palette, ArrowUp, ArrowDown, Eye, EyeOff, Copy,
  LayoutTemplate, Frame
} from 'lucide-react';
import { LABEL_SHAPES, getFormatsForShape, mmToPx, type LabelFormat } from '@/lib/label-formats';
import { exportLabelPDF } from '@/lib/label-pdf-export';
import { useLabelProjects, useAutoSave, type LabelProject } from '@/hooks/use-label-projects';
import {
  TEMPLATE_CATEGORIES, LABEL_TEMPLATES, getTemplatesByCategory,
  DECORATIVE_CATEGORIES, DECORATIVE_ELEMENTS, getDecorativeByCategory,
  type LabelTemplate, type DecorativeElement
} from '@/lib/label-templates';
import { toast } from 'sonner';
import { format } from 'date-fns';

const GOOGLE_FONTS = [
  'Arial', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald',
  'Playfair Display', 'Poppins', 'Raleway', 'Dancing Script',
  'Pacifico', 'Great Vibes', 'Lobster', 'Sacramento', 'Caveat',
];

// Load Google Fonts
const loadedFonts = new Set<string>();
function loadGoogleFont(fontName: string) {
  if (loadedFonts.has(fontName) || ['Arial'].includes(fontName)) return;
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  loadedFonts.add(fontName);
}

// Preload some fonts
['Roboto', 'Montserrat', 'Playfair Display', 'Dancing Script'].forEach(loadGoogleFont);

const LabelEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [selectedShape, setSelectedShape] = useState('round');
  const [selectedFormat, setSelectedFormat] = useState<LabelFormat | null>(null);
  const [currentProject, setCurrentProject] = useState<LabelProject | null>(null);
  const [projectName, setProjectName] = useState('Sem título');
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [includeBleed, setIncludeBleed] = useState(false);
  const [includeCutMarks, setIncludeCutMarks] = useState(true);

  // Undo/redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const isRestoring = useRef(false);

  const { projects, loading, createProject, saveProject, saveVersion, deleteProject } = useLabelProjects();

  const getCanvasJson = useCallback(() => {
    if (!fabricRef.current) return {};
    return fabricRef.current.toJSON();
  }, []);

  const { markDirty } = useAutoSave(currentProject?.id || null, getCanvasJson);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;
    const fc = new FabricCanvas(canvasRef.current, {
      width: 400,
      height: 400,
      backgroundColor: '#ffffff',
      selection: true,
    });
    fabricRef.current = fc;

    fc.on('object:modified', () => { markDirty(); pushHistory(); });
    fc.on('object:added', () => { if (!isRestoring.current) { markDirty(); pushHistory(); } });
    fc.on('object:removed', () => { markDirty(); pushHistory(); });
    fc.on('selection:created', (e: any) => setSelectedObject(e.selected?.[0] || null));
    fc.on('selection:updated', (e: any) => setSelectedObject(e.selected?.[0] || null));
    fc.on('selection:cleared', () => setSelectedObject(null));

    return () => { fc.dispose(); fabricRef.current = null; };
  }, []);

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
      fabricRef.current?.renderAll();
      setHistoryIdx(newIdx);
      isRestoring.current = false;
    });
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1 || !fabricRef.current) return;
    const newIdx = historyIdx + 1;
    isRestoring.current = true;
    fabricRef.current.loadFromJSON(JSON.parse(history[newIdx])).then(() => {
      fabricRef.current?.renderAll();
      setHistoryIdx(newIdx);
      isRestoring.current = false;
    });
  }, [history, historyIdx]);

  // Apply format to canvas
  const applyFormat = useCallback((fmt: LabelFormat) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const w = mmToPx(fmt.widthMm);
    const h = mmToPx(fmt.heightMm);
    fc.setDimensions({ width: w, height: h });

    // Remove old clip path objects
    fc.clipPath = undefined;

    // Add clip path for round shapes
    if (fmt.shape === 'round') {
      const clip = new Circle({ radius: w / 2, originX: 'center', originY: 'center', left: w / 2, top: h / 2 });
      fc.clipPath = clip;
    } else if (fmt.shape === 'rounded-square' || fmt.shape === 'rounded-rectangle') {
      const clip = new Rect({ width: w, height: h, rx: mmToPx(3), ry: mmToPx(3), originX: 'center', originY: 'center', left: w / 2, top: h / 2 });
      fc.clipPath = clip;
    }

    fc.renderAll();
    fitToContainer();
  }, []);

  const fitToContainer = useCallback(() => {
    const fc = fabricRef.current;
    const container = containerRef.current;
    if (!fc || !container) return;
    const cw = container.clientWidth - 40;
    const ch = container.clientHeight - 40;
    const canvasW = fc.getWidth();
    const canvasH = fc.getHeight();
    const scale = Math.min(cw / canvasW, ch / canvasH, 1);
    setZoom(scale);
    fc.setZoom(scale);
    fc.setDimensions({ width: canvasW * scale, height: canvasH * scale }, { cssOnly: true });
  }, []);

  useEffect(() => {
    window.addEventListener('resize', fitToContainer);
    return () => window.removeEventListener('resize', fitToContainer);
  }, [fitToContainer]);

  // Create new project
  const handleNewProject = async () => {
    if (!selectedFormat) { toast.error('Selecione um formato'); return; }
    const proj = await createProject({
      name: projectName,
      label_shape: selectedFormat.shape,
      width_mm: selectedFormat.widthMm,
      height_mm: selectedFormat.heightMm,
    });
    if (proj) {
      setCurrentProject(proj);
      applyFormat(selectedFormat);
      setShowNewDialog(false);
      pushHistory();
    }
  };

  // Load project
  const loadProject = useCallback(async (proj: LabelProject) => {
    const fc = fabricRef.current;
    if (!fc) return;
    setCurrentProject(proj);
    setProjectName(proj.name);

    const fmt: LabelFormat = {
      id: `${proj.label_shape}-${proj.width_mm}x${proj.height_mm}`,
      shape: proj.label_shape as any,
      label: `${proj.width_mm / 10}×${proj.height_mm / 10} cm`,
      widthMm: proj.width_mm,
      heightMm: proj.height_mm,
    };
    setSelectedFormat(fmt);
    setSelectedShape(proj.label_shape);

    applyFormat(fmt);

    if (proj.canvas_json && Object.keys(proj.canvas_json).length > 0) {
      isRestoring.current = true;
      await fc.loadFromJSON(proj.canvas_json);
      fc.renderAll();
      isRestoring.current = false;
    }
    pushHistory();
  }, [applyFormat, pushHistory]);

  // Add elements
  const addText = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const text = new IText('Texto', {
      left: fc.getWidth() / (2 * (zoom || 1)) - 30,
      top: fc.getHeight() / (2 * (zoom || 1)) - 10,
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#333333',
    });
    fc.add(text);
    fc.setActiveObject(text);
    fc.renderAll();
  };

  const addShape = (type: string) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const centerX = fc.getWidth() / (2 * (zoom || 1));
    const centerY = fc.getHeight() / (2 * (zoom || 1));
    let obj: any;
    switch (type) {
      case 'rect':
        obj = new Rect({ left: centerX - 30, top: centerY - 20, width: 60, height: 40, fill: '#e2e8f0', stroke: '#94a3b8', strokeWidth: 1 });
        break;
      case 'circle':
        obj = new Circle({ left: centerX - 20, top: centerY - 20, radius: 20, fill: '#dbeafe', stroke: '#60a5fa', strokeWidth: 1 });
        break;
      case 'triangle':
        obj = new Triangle({ left: centerX - 20, top: centerY - 20, width: 40, height: 40, fill: '#fef3c7', stroke: '#f59e0b', strokeWidth: 1 });
        break;
      case 'line':
        obj = new Line([centerX - 40, centerY, centerX + 40, centerY], { stroke: '#333', strokeWidth: 2 });
        break;
      case 'ellipse':
        obj = new Ellipse({ left: centerX - 30, top: centerY - 15, rx: 30, ry: 15, fill: '#ede9fe', stroke: '#8b5cf6', strokeWidth: 1 });
        break;
      default: return;
    }
    fc.add(obj);
    fc.setActiveObject(obj);
    fc.renderAll();
  };

  // Apply template to canvas
  const applyTemplate = (template: LabelTemplate) => {
    const fc = fabricRef.current;
    if (!fc || !selectedFormat) return;
    // Clear canvas first
    fc.clear();
    fc.backgroundColor = '#ffffff';
    // Re-apply clip path
    if (selectedFormat) applyFormat(selectedFormat);
    // Add template objects
    const objs = template.getObjects(selectedFormat.widthMm, selectedFormat.heightMm);
    objs.forEach(obj => {
      loadGoogleFont(obj.fontFamily || 'Arial');
      addObjectFromJson(fc, obj);
    });
    fc.renderAll();
    markDirty();
    toast.success(`Template "${template.name}" aplicado`);
  };

  // Add decorative element
  const addDecorative = (element: DecorativeElement) => {
    const fc = fabricRef.current;
    if (!fc || !selectedFormat) return;
    const objs = element.getObjects(selectedFormat.widthMm, selectedFormat.heightMm);
    objs.forEach(obj => addObjectFromJson(fc, obj));
    fc.renderAll();
    markDirty();
  };

  // Helper to create fabric objects from JSON-like specs
  const addObjectFromJson = (fc: FabricCanvas, obj: any) => {
    let fabricObj: FabricObject | null = null;
    switch (obj.type) {
      case 'rect':
        fabricObj = new Rect({ left: obj.left, top: obj.top, width: obj.width, height: obj.height, fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth, rx: obj.rx, ry: obj.ry, strokeDashArray: obj.strokeDashArray });
        break;
      case 'circle':
        fabricObj = new Circle({ left: obj.left, top: obj.top, radius: obj.radius, fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth });
        break;
      case 'i-text':
        fabricObj = new IText(obj.text || '', { left: obj.left, top: obj.top, fontSize: obj.fontSize, fontFamily: obj.fontFamily, fill: obj.fill, textAlign: obj.textAlign, fontWeight: obj.fontWeight, fontStyle: obj.fontStyle, charSpacing: obj.charSpacing });
        break;
      case 'line':
        fabricObj = new Line([obj.x1, obj.y1, obj.x2, obj.y2], { stroke: obj.stroke, strokeWidth: obj.strokeWidth });
        break;
      case 'triangle':
        fabricObj = new Triangle({ left: obj.left, top: obj.top, width: obj.width, height: obj.height, fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth });
        break;
      case 'ellipse':
        fabricObj = new Ellipse({ left: obj.left, top: obj.top, rx: obj.rx, ry: obj.ry, fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth });
        break;
    }
    if (fabricObj) fc.add(fabricObj);
  };

  // Object properties
  const updateObjectProp = (prop: string, value: any) => {
    if (!selectedObject || !fabricRef.current) return;
    selectedObject.set(prop, value);
    fabricRef.current.renderAll();
    markDirty();
  };

  // Export PDF
  const handleExportPDF = async () => {
    const fc = fabricRef.current;
    if (!fc || !selectedFormat) { toast.error('Nenhum projeto aberto'); return; }

    // Temporarily remove clip path, zoom to 1 for clean export
    const origZoom = fc.getZoom();
    fc.setZoom(1);
    fc.setDimensions({ width: fc.getWidth(), height: fc.getHeight() }, { cssOnly: false });
    fc.renderAll();

    const canvasEl = fc.toCanvasElement(2); // 2x for quality

    // Restore
    fc.setZoom(origZoom);
    fitToContainer();

    try {
      const blob = await exportLabelPDF({
        format: selectedFormat,
        canvasEl,
        projectName: currentProject?.name || 'etiqueta',
        includeBleed,
        includeCutMarks,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject?.name || 'etiqueta'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF exportado!');
    } catch (e) {
      toast.error('Erro ao exportar PDF');
    }
  };

  // Manual save
  const handleSave = async () => {
    if (!currentProject || !fabricRef.current) return;
    const ok = await saveProject(currentProject.id, fabricRef.current.toJSON());
    if (ok) toast.success('Projeto salvo');
  };

  const handleSaveVersion = async () => {
    if (!currentProject || !fabricRef.current) return;
    await saveVersion(currentProject.id, fabricRef.current.toJSON());
  };

  // Delete selected
  const deleteSelected = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObjects();
    active.forEach(obj => fc.remove(obj));
    fc.discardActiveObject();
    fc.renderAll();
  };

  // Layer operations
  const bringForward = () => { if (selectedObject && fabricRef.current) { fabricRef.current.bringObjectForward(selectedObject); fabricRef.current.renderAll(); } };
  const sendBackward = () => { if (selectedObject && fabricRef.current) { fabricRef.current.sendObjectBackwards(selectedObject); fabricRef.current.renderAll(); } };
  const duplicateObj = () => {
    if (!selectedObject || !fabricRef.current) return;
    selectedObject.clone((cloned: any) => {
      cloned.set({ left: (cloned.left || 0) + 10, top: (cloned.top || 0) + 10 });
      fabricRef.current!.add(cloned);
      fabricRef.current!.setActiveObject(cloned);
      fabricRef.current!.renderAll();
    });
  };

  // Zoom
  const zoomIn = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
    fc.setZoom(newZoom);
    fc.setDimensions({ width: fc.getWidth() * (newZoom / zoom), height: fc.getHeight() * (newZoom / zoom) }, { cssOnly: true });
  };
  const zoomOut = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const newZoom = Math.max(zoom / 1.2, 0.3);
    setZoom(newZoom);
    fc.setZoom(newZoom);
    fc.setDimensions({ width: fc.getWidth() * (newZoom / zoom), height: fc.getHeight() * (newZoom / zoom) }, { cssOnly: true });
  };

  const availableFormats = getFormatsForShape(selectedShape);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-bold">Editor de Etiquetas</h1>
          {currentProject && (
            <Badge variant="secondary">{currentProject.label_shape} • {currentProject.width_mm/10}×{currentProject.height_mm/10}cm</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {currentProject && (
            <>
              <Input
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                onBlur={() => {
                  if (currentProject) {
                    import('@/integrations/supabase/client').then(({ supabase }) => {
                      supabase.from('label_projects').update({ name: projectName } as any).eq('id', currentProject.id);
                    });
                  }
                }}
                className="w-48 h-9"
              />
              <Button size="sm" variant="outline" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Salvar</Button>
              <Button size="sm" variant="outline" onClick={handleSaveVersion}><FileText className="h-4 w-4 mr-1" />Versão</Button>
              <Button size="sm" onClick={handleExportPDF}><Download className="h-4 w-4 mr-1" />PDF</Button>
            </>
          )}
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="default"><Plus className="h-4 w-4 mr-1" />Novo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Nova Etiqueta</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome do projeto</Label>
                  <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Ex: Etiqueta Natal 2025" />
                </div>
                <div>
                  <Label>Formato</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {LABEL_SHAPES.map(s => (
                      <Button key={s.id} variant={selectedShape === s.id ? 'default' : 'outline'} size="sm"
                        onClick={() => { setSelectedShape(s.id); setSelectedFormat(null); }} className="text-xs">
                        <span className="mr-1">{s.icon}</span>{s.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Tamanho</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {availableFormats.map(f => (
                      <Button key={f.id} variant={selectedFormat?.id === f.id ? 'default' : 'outline'} size="sm"
                        onClick={() => setSelectedFormat(f)} className="text-xs">
                        {f.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={handleNewProject} disabled={!selectedFormat}>Criar Etiqueta</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: 'calc(100vh - 280px)' }}>
        {/* Left panel - Tools & Elements */}
        <Card className="lg:w-64 shrink-0">
          <CardContent className="p-3">
            <Tabs defaultValue="elements">
              <TabsList className="w-full grid grid-cols-5">
                <TabsTrigger value="elements" className="text-xs">Elementos</TabsTrigger>
                <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
                <TabsTrigger value="decor" className="text-xs">Molduras</TabsTrigger>
                <TabsTrigger value="projects" className="text-xs">Projetos</TabsTrigger>
                <TabsTrigger value="export" className="text-xs">Exportar</TabsTrigger>
              </TabsList>

              <TabsContent value="elements" className="space-y-3 mt-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Texto</p>
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={addText} disabled={!currentProject}>
                    <Type className="h-4 w-4 mr-2" />Adicionar Texto
                  </Button>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Formas</p>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { type: 'rect', icon: <Square className="h-4 w-4" />, label: 'Retângulo' },
                      { type: 'circle', icon: <CircleIcon className="h-4 w-4" />, label: 'Círculo' },
                      { type: 'triangle', icon: <TriangleIcon className="h-4 w-4" />, label: 'Triângulo' },
                      { type: 'line', icon: <Minus className="h-4 w-4" />, label: 'Linha' },
                      { type: 'ellipse', icon: <CircleIcon className="h-4 w-4" />, label: 'Elipse' },
                    ].map(s => (
                      <Button key={s.type} variant="outline" size="icon" className="h-10 w-full"
                        onClick={() => addShape(s.type)} disabled={!currentProject} title={s.label}>
                        {s.icon}
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Ações</p>
                  <div className="flex gap-1 flex-wrap">
                    <Button variant="outline" size="icon" onClick={undo} title="Desfazer"><Undo2 className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={redo} title="Refazer"><Redo2 className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={zoomIn} title="Zoom +"><ZoomIn className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={zoomOut} title="Zoom -"><ZoomOut className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={deleteSelected} title="Excluir"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="projects" className="mt-3">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> :
                      projects.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum projeto ainda.</p> :
                      projects.map(p => (
                        <div key={p.id} className={`p-2 rounded-md border cursor-pointer transition-colors hover:bg-muted ${currentProject?.id === p.id ? 'bg-primary/10 border-primary' : ''}`}
                          onClick={() => loadProject(p)}>
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.label_shape} • {p.width_mm/10}×{p.height_mm/10}cm</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(p.updated_at), 'dd/MM/yy HH:mm')}</p>
                          <Button variant="ghost" size="sm" className="h-6 mt-1 text-destructive" onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Excluir projeto?')) deleteProject(p.id);
                          }}><Trash2 className="h-3 w-3 mr-1" />Excluir</Button>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="export" className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Sangria (3mm)</Label>
                  <Switch checked={includeBleed} onCheckedChange={setIncludeBleed} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Marcas de corte</Label>
                  <Switch checked={includeCutMarks} onCheckedChange={setIncludeCutMarks} />
                </div>
                <Button className="w-full" onClick={handleExportPDF} disabled={!currentProject}>
                  <Download className="h-4 w-4 mr-2" />Exportar PDF Vetorial
                </Button>
                <p className="text-xs text-muted-foreground">PDF compatível com CorelDRAW, Illustrator e outros editores vetoriais.</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Center - Canvas */}
        <div className="flex-1 min-w-0">
          <Card className="h-full">
            <CardContent className="p-4 h-full flex items-center justify-center" ref={containerRef}>
              {currentProject ? (
                <div className="border border-dashed border-muted-foreground/30 rounded-lg p-4 bg-muted/20">
                  <canvas ref={canvasRef} />
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="h-24 w-24 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <Palette className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Crie sua primeira etiqueta</p>
                    <p className="text-sm text-muted-foreground">Clique em "Novo" para começar ou selecione um projeto existente.</p>
                  </div>
                  <Button onClick={() => setShowNewDialog(true)}><Plus className="h-4 w-4 mr-2" />Nova Etiqueta</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right panel - Properties */}
        {currentProject && (
          <Card className="lg:w-60 shrink-0">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-sm">Propriedades</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {selectedObject ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Cor de preenchimento</Label>
                    <div className="flex gap-2 items-center mt-1">
                      <input type="color" value={selectedObject.fill || '#000000'}
                        onChange={e => updateObjectProp('fill', e.target.value)} className="h-8 w-8 rounded border cursor-pointer" />
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
                            {GOOGLE_FONTS.map(f => (
                              <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                            ))}
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
                      <input type="color" value={selectedObject.stroke || '#000000'}
                        onChange={e => updateObjectProp('stroke', e.target.value)} className="h-8 w-8 rounded border cursor-pointer" />
                      <Input type="number" value={selectedObject.strokeWidth || 0} min={0}
                        onChange={e => updateObjectProp('strokeWidth', Number(e.target.value))} className="h-8 text-xs flex-1" placeholder="Espessura" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Opacidade</Label>
                    <Input type="range" min={0} max={1} step={0.05} value={selectedObject.opacity ?? 1}
                      onChange={e => updateObjectProp('opacity', Number(e.target.value))} className="h-8" />
                  </div>

                  <Separator />
                  <div className="flex gap-1 flex-wrap">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={bringForward} title="Trazer para frente"><ArrowUp className="h-3 w-3" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={sendBackward} title="Enviar para trás"><ArrowDown className="h-3 w-3" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={duplicateObj} title="Duplicar"><Copy className="h-3 w-3" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={deleteSelected} title="Excluir"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Selecione um objeto para editar suas propriedades.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LabelEditor;
