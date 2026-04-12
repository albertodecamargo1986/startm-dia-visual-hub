import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Shapes, Layers, X, Frame, Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown, GripVertical, Sparkles } from 'lucide-react';
import {
  DECORATIVE_CATEGORIES, getDecorativeByCategory,
  type LabelTemplate, type DecorativeElement
} from '@/lib/label-templates';
import { SVG_ELEMENTS_LIBRARY } from './svg-library';
import { TemplateGallery } from './panels/TemplateGallery';
import { TemplateFiltersBar } from './filters/TemplateFiltersBar';
import { ElementFiltersBar } from './filters/ElementFiltersBar';
import { GradientPanel } from './panels/GradientPanel';
import { useLabelFilters } from '@/hooks/use-label-filters';
import type { LayerItem, SvgElement } from './types';
import type { Canvas as FabricCanvas, FabricObject } from 'fabric';

interface LabelLeftPanelProps {
  bgColor: string;
  widthMm: number;
  heightMm: number;
  canvas: FabricCanvas | null;
  selectedObject: any;
  onHistoryCapture: () => void;
  onBgColorChange: (color: string) => void;
  onApplyTemplate: (t: LabelTemplate) => void;
  onAddDecorative: (el: DecorativeElement) => void;
  onAddSvgElement: (el: SvgElement) => void;
  layers: LayerItem[];
  editingLayerName: number | null;
  layerNameDraft: string;
  onClose: () => void;
  onSelectLayer: (layer: LayerItem) => void;
  onToggleLayerVisibility: (layer: LayerItem) => void;
  onToggleLayerLock: (layer: LayerItem) => void;
  onMoveLayerUp: (layer: LayerItem) => void;
  onMoveLayerDown: (layer: LayerItem) => void;
  onStartEditLayerName: (layerId: number, name: string) => void;
  onLayerNameDraftChange: (name: string) => void;
  onFinishEditLayerName: (layer: LayerItem) => void;
}

const LabelLeftPanel = ({
  bgColor, widthMm, heightMm, canvas, selectedObject, onHistoryCapture,
  onBgColorChange, onApplyTemplate, onAddDecorative, onAddSvgElement,
  layers, editingLayerName, layerNameDraft,
  onClose, onSelectLayer, onToggleLayerVisibility, onToggleLayerLock,
  onMoveLayerUp, onMoveLayerDown, onStartEditLayerName, onLayerNameDraftChange, onFinishEditLayerName,
}: LabelLeftPanelProps) => {
  const {
    templateFilters, filteredTemplates,
    updateTemplateFilter, toggleTemplateTag,
    resetTemplateFilters, activeTemplateFilterCount,
    elementFilters, updateElementFilter, resetElementFilters,
  } = useLabelFilters();

  // Count filtered SVG elements based on element filters
  const filteredSvgCategories = SVG_ELEMENTS_LIBRARY.filter(
    (cat) => elementFilters.category === 'todos' || cat.id === elementFilters.category,
  );
  const filteredElementCount = filteredSvgCategories.reduce(
    (sum, cat) => {
      const els = elementFilters.search
        ? cat.elements.filter((el) => el.name.toLowerCase().includes(elementFilters.search.toLowerCase()))
        : cat.elements;
      return sum + els.length;
    },
    0,
  );

  return (
    <div className="absolute left-12 top-0 bottom-0 z-30 w-56 lg:w-64 bg-card border-r shadow-xl flex flex-col" style={{ maxHeight: '100%' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Painel</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-3.5 w-3.5" /></Button>
      </div>
      <Tabs defaultValue="design" className="flex flex-col flex-1 min-h-0">
        <TabsList className="w-full grid grid-cols-4 mx-2 mt-2 shrink-0">
          <TabsTrigger value="design" className="text-xs"><Palette className="h-3 w-3 mr-1" />Design</TabsTrigger>
          <TabsTrigger value="gradients" className="text-xs"><Sparkles className="h-3 w-3 mr-1" />Degradês</TabsTrigger>
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
                  <input type="color" value={bgColor} onChange={e => onBgColorChange(e.target.value)} className="h-8 w-8 rounded border cursor-pointer shrink-0" />
                  <Input value={bgColor} onChange={e => onBgColorChange(e.target.value)} className="h-8 text-xs flex-1" />
                  {bgColor !== '#ffffff' && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs px-2 shrink-0" onClick={() => onBgColorChange('#ffffff')}>Reset</Button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Templates with filters */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Templates</p>
                <TemplateFiltersBar
                  filters={templateFilters}
                  activeFilterCount={activeTemplateFilterCount}
                  onUpdate={updateTemplateFilter}
                  onToggleTag={toggleTemplateTag}
                  onReset={resetTemplateFilters}
                  totalResults={filteredTemplates.length}
                />
                <div className="h-[400px] mt-2">
                  <TemplateGallery
                    onSelectTemplate={onApplyTemplate}
                    widthMm={widthMm}
                    heightMm={heightMm}
                    templates={filteredTemplates}
                  />
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
                            <button key={el.id} onClick={() => onAddDecorative(el)}
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

        {/* Gradients Tab */}
        <TabsContent value="gradients" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-3">
              <GradientPanel
                canvas={canvas}
                captureHistory={onHistoryCapture}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Elements Library Tab */}
        <TabsContent value="elements" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              <ElementFiltersBar
                filters={elementFilters}
                onUpdate={updateElementFilter}
                onReset={resetElementFilters}
                totalResults={filteredElementCount}
              />
              {filteredSvgCategories.map(cat => {
                const elements = elementFilters.search
                  ? cat.elements.filter((el) => el.name.toLowerCase().includes(elementFilters.search.toLowerCase()))
                  : cat.elements;
                if (elements.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-1.5 mb-2">
                      {cat.icon}
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat.label}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {elements.map(el => (
                        <button key={el.id} onClick={() => onAddSvgElement(el)}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all group">
                          <svg viewBox="0 0 24 24" className="w-6 h-6 text-foreground/70 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d={el.path} />
                          </svg>
                          <span className="text-[9px] font-medium truncate w-full text-center text-muted-foreground">{el.name}</span>
                        </button>
                      ))}
                    </div>
                    <Separator className="mt-3" />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Layers Tab */}
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
                      onClick={() => onSelectLayer(layer)}>
                      <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        {editingLayerName === layer.id ? (
                          <Input value={layerNameDraft} onChange={e => onLayerNameDraftChange(e.target.value)}
                            onBlur={() => onFinishEditLayerName(layer)}
                            onKeyDown={e => { if (e.key === 'Enter') onFinishEditLayerName(layer); }}
                            className="h-5 text-xs p-1" autoFocus onClick={e => e.stopPropagation()} />
                        ) : (
                          <span className="truncate block" onDoubleClick={(e) => { e.stopPropagation(); onStartEditLayerName(layer.id, layer.name); }}>{layer.name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); onToggleLayerVisibility(layer); }}>
                          {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); onToggleLayerLock(layer); }}>
                          {layer.locked ? <Lock className="h-3 w-3 text-muted-foreground" /> : <Unlock className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); onMoveLayerUp(layer); }}>
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); onMoveLayerDown(layer); }}>
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
  );
};

export default LabelLeftPanel;
