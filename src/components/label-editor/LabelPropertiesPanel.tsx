import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus, Minus, Trash2, Copy, Bold, Italic,
  AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowDown, MousePointer2, Eraser,
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter,
  AlignStartHorizontal, AlignEndHorizontal, AlignStartVertical, AlignEndVertical,
} from 'lucide-react';
import { GOOGLE_FONTS, loadGoogleFont, type LayerItem } from './types';
import { GradientPanel } from './panels/GradientPanel';
import type { Canvas as FabricCanvas } from 'fabric';

interface LabelPropertiesPanelProps {
  drawingMode: boolean;
  selectedObject: any;
  brushColor: string;
  brushWidth: number;
  bgColor: string;
  shapeLabel: string;
  sizeLabel: string;
  layerCount: number;
  canvas: FabricCanvas | null;
  onHistoryCapture: () => void;
  onBrushColorChange: (color: string) => void;
  onBrushWidthChange: (width: number) => void;
  onEraseLastDrawing: () => void;
  onToggleDrawingOff: () => void;
  onBgColorChange: (color: string) => void;
  onUpdateObjectProp: (prop: string, value: any) => void;
  onAlignObject: (alignment: string) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRebuildCurvedText: (controller: any) => void;
  fabricRenderAll: () => void;
}

const LabelPropertiesPanel = ({
  drawingMode, selectedObject,
  brushColor, brushWidth, bgColor, shapeLabel, sizeLabel, layerCount,
  canvas, onHistoryCapture,
  onBrushColorChange, onBrushWidthChange, onEraseLastDrawing, onToggleDrawingOff,
  onBgColorChange, onUpdateObjectProp, onAlignObject,
  onBringForward, onSendBackward, onDuplicate, onDelete,
  onRebuildCurvedText, fabricRenderAll,
}: LabelPropertiesPanelProps) => {
  const [showGradientPanel, setShowGradientPanel] = useState(false);

  return (
  <div className="w-56 lg:w-60 shrink-0 border-l bg-card overflow-auto">
    <div className="p-3 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {drawingMode ? 'Desenho Livre' : selectedObject ? 'Propriedades' : 'Canvas'}
      </p>

      {/* Drawing mode controls */}
      {drawingMode && !selectedObject && (
        <>
          <div>
            <Label className="text-xs">Cor do traço</Label>
            <div className="flex gap-2 items-center mt-1">
              <input type="color" value={brushColor} onChange={e => onBrushColorChange(e.target.value)} className="h-8 w-8 rounded border cursor-pointer" />
              <Input value={brushColor} onChange={e => onBrushColorChange(e.target.value)} className="h-8 text-xs flex-1" />
            </div>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {['#333333', '#e11d48', '#2563eb', '#16a34a', '#eab308', '#9333ea', '#f97316', '#ffffff'].map(c => (
                <button key={c} onClick={() => onBrushColorChange(c)}
                  className={`h-6 w-6 rounded border-2 transition-all ${brushColor === c ? 'border-primary scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Espessura: {brushWidth}px</Label>
            <input type="range" min={1} max={20} step={1} value={brushWidth}
              onChange={e => onBrushWidthChange(Number(e.target.value))}
              className="w-full mt-1" />
            <div className="flex gap-1 mt-1">
              {[1, 3, 5, 8, 12, 20].map(w => (
                <Button key={w} variant={brushWidth === w ? 'default' : 'outline'} size="sm"
                  className="h-6 px-2 text-[10px]" onClick={() => onBrushWidthChange(w)}>{w}</Button>
              ))}
            </div>
          </div>
          <Separator />
          <Button variant="outline" size="sm" className="w-full gap-1" onClick={onEraseLastDrawing}>
            <Eraser className="h-3.5 w-3.5" />Apagar último traço
          </Button>
          <Button variant="outline" size="sm" className="w-full gap-1" onClick={onToggleDrawingOff}>
            <MousePointer2 className="h-3.5 w-3.5" />Voltar à seleção
          </Button>
        </>
      )}

      {/* No object selected: canvas props */}
      {!selectedObject && (
        <>
          <div>
            <Label className="text-xs">Cor de fundo</Label>
            <div className="flex gap-2 items-center mt-1">
              <input type="color" value={bgColor} onChange={e => onBgColorChange(e.target.value)} className="h-8 w-8 rounded border cursor-pointer" />
              <Input value={bgColor} onChange={e => onBgColorChange(e.target.value)} className="h-8 text-xs flex-1" />
            </div>
          </div>
          <Separator />
          <div>
            <Label className="text-xs">Formato</Label>
            <p className="text-sm mt-1">{shapeLabel}</p>
            <p className="text-xs text-muted-foreground">{sizeLabel}</p>
          </div>
          <Separator />
          <div>
            <Label className="text-xs">Camadas: {layerCount}</Label>
          </div>
        </>
      )}

      {/* Object selected: properties */}
      {selectedObject && (
        <>
          <div>
            <Label className="text-xs">Cor</Label>
            <div className="flex gap-2 items-center mt-1">
              <input type="color" value={selectedObject.fill || '#000000'} onChange={e => onUpdateObjectProp('fill', e.target.value)} className="h-8 w-8 rounded border cursor-pointer" />
              <Input value={selectedObject.fill || ''} onChange={e => onUpdateObjectProp('fill', e.target.value)} className="h-8 text-xs flex-1" />
            </div>
           </div>

           {/* Gradient toggle */}
           <button
             onClick={() => setShowGradientPanel((v) => !v)}
             className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px]
                        transition-colors border
                        ${showGradientPanel
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}
           >
             🌈 Gradiente
           </button>

           {showGradientPanel && (
             <GradientPanel
               canvas={canvas}
               selectedObject={selectedObject}
               onHistoryCapture={onHistoryCapture}
             />
           )

          {/* Curved text controller */}
          {(selectedObject as any)?.__isCurvedTextController && (
            <>
              <div>
                <Label className="text-xs">Texto do arco</Label>
                <Input
                  value={(selectedObject as any).__curvedText || ''}
                  onChange={e => { (selectedObject as any).__curvedText = e.target.value; onRebuildCurvedText(selectedObject); }}
                  className="h-8 text-xs mt-1" placeholder="Texto em arco"
                />
              </div>
              <div>
                <Label className="text-xs">Raio do arco</Label>
                <Input type="range" min={30} max={300} step={5}
                  value={(selectedObject as any).__curvedRadius || 100}
                  onChange={e => { (selectedObject as any).__curvedRadius = Number(e.target.value); onRebuildCurvedText(selectedObject); }}
                  className="h-8 mt-1" />
                <span className="text-[10px] text-muted-foreground">{(selectedObject as any).__curvedRadius || 100}px</span>
              </div>
              <div>
                <Label className="text-xs">Tamanho da fonte</Label>
                <Input type="number" min={8} max={72}
                  value={(selectedObject as any).__curvedFontSize || 16}
                  onChange={e => { (selectedObject as any).__curvedFontSize = Math.max(8, Number(e.target.value)); onRebuildCurvedText(selectedObject); }}
                  className="h-8 text-xs mt-1" />
              </div>
              <div>
                <Label className="text-xs">Cor do texto</Label>
                <div className="flex gap-2 items-center mt-1">
                  <input type="color" value={(selectedObject as any).__curvedFill || '#333333'}
                    onChange={e => { (selectedObject as any).__curvedFill = e.target.value; onRebuildCurvedText(selectedObject); }}
                    className="h-8 w-8 rounded border cursor-pointer" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Fonte</Label>
                <Select value={(selectedObject as any).__curvedFontFamily || 'Montserrat'}
                  onValueChange={v => { loadGoogleFont(v); (selectedObject as any).__curvedFontFamily = v; onRebuildCurvedText(selectedObject); }}>
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
                <Select value={selectedObject.fontFamily || 'Arial'} onValueChange={v => { loadGoogleFont(v); onUpdateObjectProp('fontFamily', v); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GOOGLE_FONTS.map(f => (<SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tamanho</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => onUpdateObjectProp('fontSize', Math.max(6, (selectedObject.fontSize || 24) - 1))}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input type="number" value={selectedObject.fontSize || 24} onChange={e => onUpdateObjectProp('fontSize', Math.max(6, Number(e.target.value)))} className="h-8 text-xs text-center flex-1" min={6} />
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => onUpdateObjectProp('fontSize', (selectedObject.fontSize || 24) + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {[12, 16, 20, 24, 32, 48].map(sz => (
                    <Button key={sz} variant={(selectedObject.fontSize || 24) === sz ? 'default' : 'outline'} size="sm"
                      className="h-6 px-2 text-[10px]" onClick={() => onUpdateObjectProp('fontSize', sz)}>{sz}</Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Estilo</Label>
                <div className="flex gap-1 mt-1">
                  <Button variant={selectedObject.fontWeight === 'bold' ? 'default' : 'outline'} size="icon" className="h-8 w-8"
                    onClick={() => onUpdateObjectProp('fontWeight', selectedObject.fontWeight === 'bold' ? 'normal' : 'bold')}>
                    <Bold className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant={selectedObject.fontStyle === 'italic' ? 'default' : 'outline'} size="icon" className="h-8 w-8"
                    onClick={() => onUpdateObjectProp('fontStyle', selectedObject.fontStyle === 'italic' ? 'normal' : 'italic')}>
                    <Italic className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Alinhamento do texto</Label>
                <div className="flex gap-1 mt-1">
                  <Button variant={(selectedObject.textAlign || 'left') === 'left' ? 'default' : 'outline'} size="icon" className="h-8 w-8"
                    onClick={() => onUpdateObjectProp('textAlign', 'left')}><AlignLeft className="h-3.5 w-3.5" /></Button>
                  <Button variant={selectedObject.textAlign === 'center' ? 'default' : 'outline'} size="icon" className="h-8 w-8"
                    onClick={() => onUpdateObjectProp('textAlign', 'center')}><AlignCenter className="h-3.5 w-3.5" /></Button>
                  <Button variant={selectedObject.textAlign === 'right' ? 'default' : 'outline'} size="icon" className="h-8 w-8"
                    onClick={() => onUpdateObjectProp('textAlign', 'right')}><AlignRight className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Espaçamento entre letras</Label>
                <Input type="range" min={-200} max={800} step={10} value={selectedObject.charSpacing || 0}
                  onChange={e => onUpdateObjectProp('charSpacing', Number(e.target.value))} className="h-8 mt-1" />
                <span className="text-[10px] text-muted-foreground">{selectedObject.charSpacing || 0}</span>
              </div>
              <div>
                <Label className="text-xs">Altura da linha</Label>
                <Input type="range" min={0.5} max={3} step={0.1} value={selectedObject.lineHeight || 1.16}
                  onChange={e => onUpdateObjectProp('lineHeight', Number(e.target.value))} className="h-8 mt-1" />
                <span className="text-[10px] text-muted-foreground">{(selectedObject.lineHeight || 1.16).toFixed(1)}</span>
              </div>
            </>
          )}

          <div>
            <Label className="text-xs">Contorno</Label>
            <div className="flex gap-2 items-center mt-1">
              <input type="color" value={selectedObject.stroke || '#000000'} onChange={e => onUpdateObjectProp('stroke', e.target.value)} className="h-8 w-8 rounded border cursor-pointer" />
              <Input type="number" value={selectedObject.strokeWidth || 0} min={0} onChange={e => onUpdateObjectProp('strokeWidth', Number(e.target.value))} className="h-8 text-xs flex-1" placeholder="Esp." />
            </div>
          </div>

          <div>
            <Label className="text-xs">Opacidade</Label>
            <Input type="range" min={0} max={1} step={0.05} value={selectedObject.opacity ?? 1} onChange={e => onUpdateObjectProp('opacity', Number(e.target.value))} className="h-8" />
          </div>

          {/* Lock aspect ratio */}
          {(selectedObject.type === 'image' || selectedObject.type === 'rect' || selectedObject.type === 'path') && (
            <div className="flex items-center justify-between">
              <Label className="text-xs">Manter proporção</Label>
              <Switch
                checked={selectedObject.lockUniScaling !== true}
                onCheckedChange={checked => { selectedObject.set('lockUniScaling', !checked); fabricRenderAll(); }}
              />
            </div>
          )}

          <Separator />

          <div>
            <Label className="text-xs mb-1 block">Alinhar no canvas</Label>
            <div className="flex gap-1 flex-wrap">
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onAlignObject('left')}><AlignStartHorizontal className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Esquerda</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onAlignObject('center-h')}><AlignHorizontalJustifyCenter className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Centro H</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onAlignObject('right')}><AlignEndHorizontal className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Direita</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onAlignObject('top')}><AlignStartVertical className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Topo</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onAlignObject('center-v')}><AlignVerticalJustifyCenter className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Centro V</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onAlignObject('bottom')}><AlignEndVertical className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Fundo</TooltipContent></Tooltip>
            </div>
          </div>

          <Separator />

          <div className="flex gap-1 flex-wrap">
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={onBringForward}><ArrowUp className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Para frente</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={onSendBackward}><ArrowDown className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Para trás</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={onDuplicate}><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Duplicar</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
          </div>
        </>
      )}
    </div>
   </div>
  );
};

export default LabelPropertiesPanel;
