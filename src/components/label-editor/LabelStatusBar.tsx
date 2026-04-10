import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Undo2, Redo2, ZoomIn, ZoomOut, Grid3X3 } from 'lucide-react';

interface LabelStatusBarProps {
  historyIdx: number;
  historyLength: number;
  zoom: number;
  snapEnabled: boolean;
  showGrid: boolean;
  shapeLabel: string;
  sizeLabel: string;
  layerCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleSnap: () => void;
  onToggleGrid: () => void;
}

const LabelStatusBar = ({
  historyIdx, historyLength, zoom, snapEnabled, showGrid,
  shapeLabel, sizeLabel, layerCount,
  onUndo, onRedo, onZoomIn, onZoomOut, onToggleSnap, onToggleGrid,
}: LabelStatusBarProps) => (
  <div className="flex items-center justify-between px-3 py-1.5 border-t bg-card text-xs text-muted-foreground shrink-0">
    <div className="flex items-center gap-1">
      <Tooltip><TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onUndo} disabled={historyIdx <= 0}>
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger><TooltipContent>Desfazer (Ctrl+Z)</TooltipContent></Tooltip>
      <Tooltip><TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRedo} disabled={historyIdx >= historyLength - 1}>
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger><TooltipContent>Refazer (Ctrl+Y)</TooltipContent></Tooltip>

      <Separator orientation="vertical" className="h-4 mx-1" />

      <Tooltip><TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomOut}><ZoomOut className="h-3.5 w-3.5" /></Button>
      </TooltipTrigger><TooltipContent>Zoom -</TooltipContent></Tooltip>
      <span className="w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
      <Tooltip><TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomIn}><ZoomIn className="h-3.5 w-3.5" /></Button>
      </TooltipTrigger><TooltipContent>Zoom +</TooltipContent></Tooltip>

      <Separator orientation="vertical" className="h-4 mx-1" />

      <Tooltip><TooltipTrigger asChild>
        <Button variant={snapEnabled ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={onToggleSnap}>
          <span className="text-[10px] font-bold">S</span>
        </Button>
      </TooltipTrigger><TooltipContent>Snap {snapEnabled ? 'ON' : 'OFF'}</TooltipContent></Tooltip>

      <Tooltip><TooltipTrigger asChild>
        <Button variant={showGrid ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={onToggleGrid}>
          <Grid3X3 className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger><TooltipContent>Grid (Ctrl+G)</TooltipContent></Tooltip>
    </div>

    <div className="flex items-center gap-3">
      <span>{shapeLabel} — {sizeLabel}</span>
      <span>{layerCount} elementos</span>
    </div>
  </div>
);

export default LabelStatusBar;
