import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Type, Square, Circle as CircleIcon, Minus, Triangle as TriangleIcon,
  MousePointer2, WrapText, PenTool, Palette, Keyboard,
  Image as ImageIcon,
} from 'lucide-react';

interface LabelToolbarProps {
  activeTool: string;
  drawingMode: boolean;
  showLeftPanel: boolean;
  onSelectTool: () => void;
  onAddText: () => void;
  onAddCurvedText: () => void;
  onAddShape: (type: string) => void;
  onToggleDrawing: () => void;
  onOpenImagePicker: () => void;
  onToggleLeftPanel: () => void;
  onShowShortcuts: () => void;
}

const LabelToolbar = ({
  activeTool, drawingMode, showLeftPanel,
  onSelectTool, onAddText, onAddCurvedText, onAddShape,
  onToggleDrawing, onOpenImagePicker, onToggleLeftPanel, onShowShortcuts,
}: LabelToolbarProps) => (
  <div className="w-12 shrink-0 border-r bg-card flex flex-col items-center py-2 gap-1">
    <Tooltip><TooltipTrigger asChild>
      <Button variant={activeTool === 'select' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={onSelectTool}>
        <MousePointer2 className="h-4 w-4" />
      </Button>
    </TooltipTrigger><TooltipContent side="right">Seleção</TooltipContent></Tooltip>

    <Tooltip><TooltipTrigger asChild>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onAddText}>
        <Type className="h-4 w-4" />
      </Button>
    </TooltipTrigger><TooltipContent side="right">Texto</TooltipContent></Tooltip>

    <Tooltip><TooltipTrigger asChild>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onAddCurvedText}>
        <WrapText className="h-4 w-4" />
      </Button>
    </TooltipTrigger><TooltipContent side="right">Texto em Arco</TooltipContent></Tooltip>

    <Separator className="w-6 my-1" />

    <Tooltip><TooltipTrigger asChild>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onAddShape('rect')}>
        <Square className="h-4 w-4" />
      </Button>
    </TooltipTrigger><TooltipContent side="right">Retângulo</TooltipContent></Tooltip>

    <Tooltip><TooltipTrigger asChild>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onAddShape('circle')}>
        <CircleIcon className="h-4 w-4" />
      </Button>
    </TooltipTrigger><TooltipContent side="right">Círculo</TooltipContent></Tooltip>

    <Tooltip><TooltipTrigger asChild>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onAddShape('triangle')}>
        <TriangleIcon className="h-4 w-4" />
      </Button>
    </TooltipTrigger><TooltipContent side="right">Triângulo</TooltipContent></Tooltip>

    <Tooltip><TooltipTrigger asChild>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onAddShape('line')}>
        <Minus className="h-4 w-4" />
      </Button>
    </TooltipTrigger><TooltipContent side="right">Linha</TooltipContent></Tooltip>

    <Separator className="w-6 my-1" />

    <Tooltip><TooltipTrigger asChild>
      <Button variant={activeTool === 'draw' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={onToggleDrawing}>
        <PenTool className="h-4 w-4" />
      </Button>
    </TooltipTrigger><TooltipContent side="right">Desenho Livre</TooltipContent></Tooltip>

    <Tooltip><TooltipTrigger asChild>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onOpenImagePicker}>
        <ImageIcon className="h-4 w-4" />
      </Button>
    </TooltipTrigger><TooltipContent side="right">Imagem</TooltipContent></Tooltip>

    <Separator className="w-6 my-1" />

    <Tooltip><TooltipTrigger asChild>
      <Button variant={showLeftPanel ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={onToggleLeftPanel}>
        <Palette className="h-4 w-4" />
      </Button>
    </TooltipTrigger><TooltipContent side="right">Templates & Elementos</TooltipContent></Tooltip>

    <Tooltip><TooltipTrigger asChild>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onShowShortcuts}>
        <Keyboard className="h-4 w-4" />
      </Button>
    </TooltipTrigger><TooltipContent side="right">Atalhos</TooltipContent></Tooltip>
  </div>
);

export default LabelToolbar;
