import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Save, FileText, Printer, ShoppingCart, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LabelTopBarProps {
  projectName: string;
  shapeLabel: string;
  sizeLabel: string;
  currentProjectId: string;
  onBack: () => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onSaveVersion: () => void;
  onPrintPreview: () => void;
  onAddToCart: () => void;
}

const LabelTopBar = ({
  projectName, shapeLabel, sizeLabel, currentProjectId,
  onBack, onNameChange, onSave, onSaveVersion, onPrintPreview, onAddToCart,
}: LabelTopBarProps) => (
  <div className="flex items-center gap-2 px-2 py-2 border-b bg-card flex-wrap shrink-0">
    <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
      <ArrowLeft className="h-4 w-4 mr-1" />Voltar
    </Button>
    <Separator orientation="vertical" className="h-6" />
    <Input
      value={projectName}
      onChange={e => onNameChange(e.target.value)}
      onBlur={() => { supabase.from('label_projects').update({ name: projectName } as any).eq('id', currentProjectId); }}
      className="w-40 h-8 text-sm"
    />
    <Badge variant="secondary" className="text-xs shrink-0">
      {shapeLabel} • {sizeLabel}
    </Badge>
    <div className="flex-1" />
    <div className="flex items-center gap-1">
      <Tooltip><TooltipTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={onSave}>
          <Save className="h-4 w-4" /><span className="hidden lg:inline text-xs">Salvar rascunho</span>
        </Button>
      </TooltipTrigger><TooltipContent>Salvar rascunho (Ctrl+S)</TooltipContent></Tooltip>
      <Tooltip><TooltipTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={onSaveVersion}>
          <FileText className="h-4 w-4" /><span className="hidden lg:inline text-xs">Salvar versão</span>
        </Button>
      </TooltipTrigger><TooltipContent>Salvar versão</TooltipContent></Tooltip>
      <Tooltip><TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrintPreview}><Printer className="h-4 w-4" /></Button>
      </TooltipTrigger><TooltipContent>Prévia de impressão</TooltipContent></Tooltip>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Button size="sm" onClick={onAddToCart} className="h-8">
        <ShoppingCart className="h-4 w-4 mr-1" />Pedir
      </Button>
    </div>
  </div>
);

export default LabelTopBar;
