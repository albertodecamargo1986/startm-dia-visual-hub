import { useState } from 'react';
import { X } from 'lucide-react';
import { type LabelShape, LABEL_SHAPES } from '@/lib/label-formats';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormatPreview } from './FormatPreview';

interface Props {
  onClose: () => void;
  onSave: (shape: LabelShape, widthMm: number, heightMm: number, name: string, cornerRadiusMm?: number) => void;
}

export function CustomFormatDialog({ onClose, onSave }: Props) {
  const [shape, setShape] = useState<LabelShape>('round');
  const [widthMm, setWidthMm] = useState(50);
  const [heightMm, setHeightMm] = useState(50);
  const [name, setName] = useState('');
  const [cornerRadius, setCornerRadius] = useState(5);

  const showRadius = shape === 'rounded-square' || shape === 'rounded-rectangle';

  const previewFormat = {
    id: 'preview',
    shape,
    label: name || 'Preview',
    name: name || 'Preview',
    widthMm,
    heightMm,
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo Formato Personalizado</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <Label className="text-xs">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Minha etiqueta 6cm"
              className="h-8 text-sm"
            />
          </div>

          {/* Shape selector */}
          <div>
            <Label className="text-xs">Forma</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {LABEL_SHAPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setShape(s.id as LabelShape)}
                  className={`px-2 py-1.5 rounded-lg text-xs transition-all
                             ${shape === s.id
                               ? 'bg-primary text-primary-foreground'
                               : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Largura (mm)</Label>
              <Input
                type="number"
                min={10}
                max={300}
                value={widthMm}
                onChange={(e) => setWidthMm(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Altura (mm)</Label>
              <Input
                type="number"
                min={10}
                max={300}
                value={heightMm}
                onChange={(e) => setHeightMm(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Corner radius */}
          {showRadius && (
            <div>
              <Label className="text-xs">Raio de canto (mm)</Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={cornerRadius}
                onChange={(e) => setCornerRadius(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
          )}

          {/* Preview */}
          <div className="flex justify-center py-3 bg-muted rounded-lg">
            <FormatPreview format={previewFormat} size={80} />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={() => onSave(shape, widthMm, heightMm, name, showRadius ? cornerRadius : undefined)}
              disabled={!name.trim() || widthMm < 10 || heightMm < 10}
              className="flex-1"
            >
              Criar Formato
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
